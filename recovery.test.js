'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRecovery, stages } = require('./recovery.js');
const fs = require('node:fs');
const vm = require('node:vm');
const attributes = ['STR', 'DEX', 'CON', 'INT', 'SEN', 'AUR'];
const dice = [4, 6, 8, 10, 12, 20, 100];
const idx = d => dice.indexOf(d);
const maxHp = c => attributes.reduce((s, a) => s + idx(c.maximum[a]), 0);
const model = createRecovery({ attributes, dice, idx, maxHp,
  hasPending: c => attributes.some(a => c.pending[a] > 0) });
function character() {
  return { id: 'one', name: '<A & B>', dead: false,
    maximum: Object.fromEntries(attributes.map(a => [a, 8])),
    current: Object.fromEntries(attributes.map(a => [a, 4])),
    pending: Object.fromEntries(attributes.map(a => [a, 0])) };
}
function allocated(c, stage = 'encounter') {
  const d = model.draft(c, stage);
  d.stages.encounter.allocation.CON = '1';
  return d;
}
function selected(d) { return Object.keys(stages).filter(key => d.stages[key].selected); }
function rejected(c, d, pattern) {
  const before = structuredClone(c), draftBefore = structuredClone(d);
  const error = model.apply(c, d);
  assert.notEqual(error, '');
  if (pattern) assert.match(error, pattern);
  assert.deepEqual(c, before);
  assert.deepEqual(d, draftBefore);
}

test('stage checkboxes select prerequisites and clear deselected allocations without grants', () => {
  const d = allocated(character());
  assert.deepEqual(selected(d), ['encounter']);
  model.selectStage(d, 'short', true);
  assert.deepEqual(selected(d), ['encounter', 'short']);
  model.selectStage(d, 'long', true);
  assert.deepEqual(selected(d), ['encounter', 'short', 'long']);
  d.stages.long.allocation.STR = '1';
  d.stages.short.allocation.AUR = '1';
  model.selectStage(d, 'short', false);
  assert.deepEqual(selected(d), ['encounter']);
  assert.equal(Object.hasOwn(d, 'approved'), false);
  assert.equal(d.stages.long.allocation.STR, '0');
  assert.equal(d.stages.short.allocation.AUR, '0');
  assert.equal(d.stages.encounter.allocation.CON, '1');
  model.selectStage(d, 'encounter', false);
  assert.deepEqual(selected(d), []);
});

test('exact budgets accumulate to 25/50/100 percent with exclusive eligibility', () => {
  const c = character();
  for (const [stage, expected] of [['encounter', 3], ['short', 6], ['long', 12]]) {
    const d = model.draft(c, stage);
    assert.equal(selected(d).reduce((sum, key) => sum + Number(d.stages[key].budget), 0), expected);
  }
  for (const [key, exact, eligible] of [
    ['encounter', 3, ['CON', 'INT']], ['short', 3, ['AUR', 'SEN']], ['long', 6, ['STR', 'DEX']]
  ]) {
    const d = model.draft(c, 'long');
    assert.equal(d.stages[key].exact, exact);
    assert.deepEqual(attributes.filter(a => model.eligible(key, a)), attributes.filter(a => eligible.includes(a)));
  }
});

test('fractional budgets round down automatically and cannot be edited, even on unselected stages', () => {
  const c = character(); c.maximum.STR = 6;
  const d = allocated(c, 'long');
  assert.deepEqual(Object.values(d.stages).map(s => s.exact), [2.75, 2.75, 5.5]);
  assert.deepEqual(Object.values(d.stages).map(s => s.budget), [2, 2, 5]);
  assert.equal(model.validate(c, d), '');
  for (const key of Object.keys(stages)) {
    for (const budget of ['', ' ', '2', '2.75', '-1', 'Infinity', 'NaN', true, null, [], {}, '1e0', '0x2', -1, 0, 2.75, 6, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      const edited = allocated(c);
      edited.stages[key].budget = budget;
      rejected(c, edited, /rounded down automatically/);
    }
  }
});

test('separate budgets cannot transfer even with spare cumulative capacity', () => {
  const c = character(), d = allocated(c, 'long');
  d.stages.encounter.allocation.CON = '2';
  d.stages.encounter.allocation.INT = '2';
  rejected(c, d, /stage allocation exceeds its budget/);
  d.stages.encounter.allocation.INT = '1';
  d.stages.short.allocation.AUR = '2';
  d.stages.short.allocation.SEN = '2';
  rejected(c, d, /stage allocation exceeds its budget/);
  d.stages.short.allocation.SEN = '1';
  assert.equal(model.validate(c, d), '');
  assert.deepEqual(model.totals(d.stages.long), { allocated: 0, budget: 6, waste: 6 });
});

test('each stage rejects every ineligible attribute regardless of later selections', () => {
  for (const key of Object.keys(stages)) for (const a of attributes) {
    if (model.eligible(key, a)) continue;
    const c = character(), d = allocated(c, 'long');
    d.stages[key].allocation[a] = '1';
    rejected(c, d, /eligible attributes/);
  }
});

test('dead, pending, changed selection/level and invalid character state block atomically', () => {
  for (const change of [c => { c.dead = true; }, c => { c.pending.STR = 1; }, c => { c.id = 'other'; },
    c => { c.maximum.STR = 10; }, c => { c.current.DEX = 12; }, c => { c.current.STR = 7; },
    c => { c.maximum.STR = 7; }, c => { c.pending.STR = -1; }]) {
    const c = character(), d = allocated(c); change(c); rejected(c, d);
  }
  const c = character();
  assert.match(model.apply(null, allocated(c)), /Selected character/);
  c.pending.CON = 2;
  rejected(c, allocated(c), /End round first/);
});

test('malformed drafts, prerequisites, maxima and allocations are rejected without partial mutation', () => {
  for (const alter of [
    d => { d.stages.encounter.selected = false; }, d => { d.stages.short.selected = false; },
    d => { d.stages.long.selected = 'yes'; }, d => { delete d.stages.short; },
    d => { d.stages.encounter.allocation = null; }, d => { delete d.stages.encounter.allocation.DEX; },
    d => { d.stages.encounter.allocation.extra = '0'; },
    d => { d.stages.encounter.allocation.CON = '3'; },
    d => { d.stages.encounter.allocation.CON = '0.5'; },
    d => { d.stages.encounter.allocation.CON = '-1'; },
    d => { d.stages.encounter.allocation.CON = ''; },
    d => { d.stages.encounter.allocation.CON = null; },
    d => { d.stages.encounter.allocation.CON = true; },
    d => { d.stages.encounter.allocation.CON = '0'; },
    d => { d.stages.encounter.budget = '4'; },
    d => { d.stages.encounter.exact = 4; }
  ]) {
    const c = character(), d = allocated(c, 'long'); alter(d); rejected(c, d);
  }
  const c = character();
  for (const d of [null, {}, { id: c.id, level: maxHp(c) }]) rejected(c, d);
  const d = allocated(c); d.stages.long.allocation.STR = '1'; rejected(c, d);
});

test('cumulative recovery applies chosen tiers only and loses waste without schema or persistence policy changes', () => {
  const c = character(), before = structuredClone(c), d = allocated(c, 'long');
  d.stages.encounter.allocation.INT = '2';
  d.stages.short.allocation.AUR = '2';
  d.stages.short.allocation.SEN = '1';
  d.stages.long.allocation.STR = '2';
  d.stages.long.allocation.DEX = '2';
  assert.equal(model.totals(d.stages.long).waste, 2);
  assert.deepEqual(c, before);
  assert.equal(model.apply(c, d), '');
  assert.deepEqual(c.current, { STR: 8, DEX: 8, CON: 6, INT: 8, SEN: 6, AUR: 8 });
  assert.deepEqual(c.pending, before.pending);
  assert.deepEqual(c.maximum, before.maximum);
  assert.equal(c.dead, false);
  assert.deepEqual(Object.keys(c), Object.keys(before));
  assert.ok(attributes.every(a => idx(c.current[a]) <= idx(c.maximum[a])));
  assert.ok(attributes.reduce((sum, a) => sum + idx(c.current[a]), 0) <= maxHp(c));
  const reopened = model.draft(c, 'long');
  assert.equal(Object.hasOwn(reopened, 'approved'), false);
  assert.ok(Object.values(reopened.stages).every(s => Object.values(s.allocation).every(n => n === '0')));
  assert.equal(reopened.stages.long.budget, 6);
});

test('Second Wind alone and cumulative short rest apply successfully; zero HP is not death', () => {
  for (const stage of ['encounter', 'short']) {
    const c = character(), d = allocated(c, stage);
    if (stage === 'short') d.stages.short.allocation.SEN = '1';
    assert.equal(model.apply(c, d), '');
    assert.equal(c.current.CON, 6);
    assert.equal(c.current.SEN, stage === 'short' ? 6 : 4);
  }
  const c = character();
  for (const a of attributes) c.maximum[a] = 4;
  rejected(c, allocated(c), /maximums/);
});

test('all levels 0..36 automatically floor each budget and keep every resulting die within its maximum', () => {
  for (let level = 0; level <= 36; level++) {
    const c = character();
    let remaining = level;
    for (const a of attributes) {
      const tiers = Math.min(6, remaining);
      c.maximum[a] = dice[tiers];
      remaining -= tiers;
    }
    const d = model.draft(c, 'long');
    const before = structuredClone(c);
    assert.equal(Object.hasOwn(d, 'approved'), false);
    assert.equal(model.validate(c, d, true), '');
    for (const [key, s] of Object.entries(d.stages)) {
      assert.equal(s.exact, level * stages[key].fraction);
      assert.equal(s.budget, Math.floor(level * stages[key].fraction));
      assert.ok(Object.values(s.allocation).every(n => n === '0'));
      for (const a of stages[key].attributes) {
        while (model.canHeal(c, d, a)) assert.equal(model.adjust(c, d, a, 1), true);
        const snapshot = structuredClone(d);
        assert.equal(model.adjust(c, d, a, 1), false);
        assert.deepEqual(d, snapshot);
      }
      assert.ok(model.totals(s).allocated <= s.budget);
      assert.equal(model.totals(s).waste, s.budget - model.totals(s).allocated);
    }
    assert.deepEqual(c, before);
    const total = Object.values(d.stages).reduce((sum, s) => sum + model.totals(s).allocated, 0);
    if (!total) rejected(c, d, /Use HEAL/);
    else {
      assert.equal(model.apply(c, d), '');
      assert.equal(attributes.reduce((sum, a) => sum + idx(c.current[a]), 0), total);
      assert.ok(total <= level);
      assert.ok(attributes.every(a => idx(c.current[a]) <= idx(c.maximum[a])));
    }
  }
});

test('HEAL and undo enforce eligibility, budget and maxima without mutating rejected drafts or characters', () => {
  const c = character(), d = model.draft(c), before = structuredClone(c);
  const reject = (a, delta) => {
    const snapshot = structuredClone(d), current = structuredClone(c);
    assert.equal(model.adjust(c, d, a, delta), false);
    assert.deepEqual(d, snapshot);
    assert.deepEqual(c, current);
  };
  assert.equal(model.validate(c, d, true), '');
  assert.match(model.validate(c, d), /Use HEAL/);
  for (const a of attributes) {
    assert.equal(model.stageFor(a), Object.keys(stages).find(key => stages[key].attributes.includes(a)));
    assert.equal(model.canHeal(c, d, a), ['CON', 'INT'].includes(a));
    reject(a, -1);
    if (!['CON', 'INT'].includes(a)) reject(a, 1);
  }
  assert.equal(model.stageFor('unknown'), undefined);
  assert.equal(model.canHeal(c, d, 'unknown'), false);
  reject('unknown', 1);
  for (const delta of [0, 2, -2, '1', null, NaN]) reject('CON', delta);
  assert.equal(model.adjust(c, d, 'CON', 1), true);
  assert.equal(d.stages.encounter.allocation.CON, 1);
  assert.equal(model.adjust(c, d, 'CON', 1), true);
  reject('CON', 1); // Permanent maximum, despite one remaining tier.
  assert.equal(model.adjust(c, d, 'INT', 1), true);
  assert.equal(model.canHeal(c, d, 'INT'), false);
  reject('INT', 1); // Stage budget, despite remaining attribute capacity.
  assert.equal(model.adjust(c, d, 'CON', -1), true);
  assert.equal(model.canHeal(c, d, 'INT'), true);
  assert.equal(model.adjust(c, d, 'INT', 1), true);
  assert.deepEqual(c, before);
  assert.equal(model.validate(c, d), '');
  for (const alter of [() => { c.dead = true; }, () => { c.pending.STR = 1; },
    () => { c.id = 'other'; }, () => { d.stages.encounter.budget++; }]) {
    const savedC = structuredClone(c), savedD = structuredClone(d);
    alter();
    assert.equal(model.canHeal(c, d, 'CON'), false);
    reject('CON', 1); reject('CON', -1);
    Object.assign(c, savedC); Object.assign(d, savedD);
  }
  model.selectStage(d, 'encounter', false);
  assert.notEqual(model.validate(c, d, true), '');
  reject('CON', 1);
  model.selectStage(d, 'long', true);
  assert.ok(Object.values(d.stages).every(s => Object.values(s.allocation).every(n => n === '0')));
  const snapshot = structuredClone(d);
  model.selectStage(d, 'unknown', true); model.selectStage(d, 'long', 'yes');
  assert.deepEqual(d, snapshot);
});

test('Polish dictionary preserves existing strings and translates every recovery message with matching placeholders', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('./locale.js'), 'utf8'), context);
  const strings = context.window.SIGILRPG_LOCALES.pl.strings;
  const cancel = strings.Cancel;
  vm.runInNewContext(fs.readFileSync(require.resolve('./recovery-locale.js'), 'utf8'), context);
  assert.equal(strings.Cancel, cancel);
  const source = fs.readFileSync(require.resolve('./recovery.js'), 'utf8');
  const messages = new Set([
    ...[...source.matchAll(/(?:return |label: |\bt\(|\btext\('[^']+', )'([^']+)'/g)].map(m => m[1]),
    ...Object.values(stages).map(stage => stage.guidance)
  ]);
  // The undo glyph is language-neutral, not a missing dictionary entry.
  messages.delete('−');
  const failures = [];
  for (const message of messages) {
    if (!strings[message]) failures.push(`Missing Polish translation: ${message}`);
    else if (JSON.stringify((strings[message].match(/\{\w+\}/g) || []).sort()) !==
      JSON.stringify((message.match(/\{\w+\}/g) || []).sort())) failures.push(`Polish placeholder mismatch: ${message}`);
  }
  assert.deepEqual(failures, [], failures.join('\n'));
});
