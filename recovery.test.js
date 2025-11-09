'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRecovery } = require('./recovery.js');
const fs = require('node:fs');
const vm = require('node:vm');
const attributes = ['STR', 'DEX', 'CON', 'INT', 'SEN', 'AUR'];
const dice = [4, 6, 8, 10, 12, 20, 100];
const idx = d => dice.indexOf(d);
const model = createRecovery({ attributes, dice, idx,
  maxHp: c => attributes.reduce((s, a) => s + idx(c.maximum[a]), 0),
  hasPending: c => attributes.some(a => c.pending[a] > 0) });
function character() {
  return { id: 'one', name: '<A & B>', dead: false,
    maximum: Object.fromEntries(attributes.map(a => [a, 8])),
    current: Object.fromEntries(attributes.map(a => [a, 4])),
    pending: Object.fromEntries(attributes.map(a => [a, 0])) };
}
function approved(c, stage) { const d = model.draft(c, stage); d.approved = true; d.allocation.CON = '1'; return d; }

test('exact budgets and stage eligibility', () => {
  const c = character();
  for (const [stage, exact, eligible] of [
    ['encounter', 3, ['CON', 'INT']],
    ['short', 3, ['CON', 'INT', 'SEN', 'AUR']],
    ['long', 6, attributes]
  ]) {
    const d = model.draft(c, stage);
    assert.equal(d.exact, exact);
    assert.equal(d.budget, String(exact));
    assert.deepEqual(attributes.filter(a => model.eligible(d, a)), attributes.filter(a => eligible.includes(a)));
  }
  const d = model.draft(c, 'short');
  d.care = true;
  assert.equal(model.eligible(d, 'STR'), true);
  assert.equal(model.eligible(d, 'DEX'), false);
});

test('fractional budgets require an explicit integer ruling, without automatic rounding', () => {
  const c = character(); c.maximum.STR = 6;
  const d = approved(c);
  assert.equal(d.exact, 2.75);
  assert.equal(d.budget, '');
  for (const budget of ['', ' ', '2.75', '-1', 'Infinity', 'NaN']) {
    d.budget = budget;
    assert.match(model.validate(c, d), /whole-number/);
  }
  for (const budget of ['2', '3']) { d.budget = budget; assert.equal(model.validate(c, d), ''); }
  assert.equal(model.draft(c, 'long').exact, 5.5);
});

test('dead, pending, absent, changed selection and changed level block without mutation', () => {
  for (const change of [c => { c.dead = true; }, c => { c.pending.STR = 1; }, c => { c.id = 'other'; }, c => { c.maximum.STR = 10; }]) {
    const c = character(), d = approved(c); change(c);
    const before = structuredClone(c);
    assert.notEqual(model.apply(c, d), '');
    assert.deepEqual(c, before);
  }
  const c = character();
  assert.match(model.apply(null, approved(c)), /Selected character/);
  c.pending.CON = 2;
  assert.match(model.validate(c, approved(c)), /End round first/);
});

test('approval, maxima, eligibility and total budget are enforced atomically', () => {
  for (const alter of [
    d => { d.approved = false; },
    d => { d.allocation.CON = '3'; },
    d => { d.allocation.DEX = '1'; },
    d => { d.allocation.CON = '2'; d.allocation.INT = '2'; },
    d => { d.allocation.CON = '0.5'; },
    d => { d.allocation.CON = '-1'; },
    d => { d.allocation.CON = ''; },
    d => { d.allocation.CON = '0'; },
    d => { d.budget = '4'; }
  ]) {
    const c = character(), d = approved(c), before = structuredClone(c);
    alter(d);
    assert.notEqual(model.apply(c, d), '');
    assert.deepEqual(c, before);
  }
});

test('manual allocations restore only chosen tiers; drafts and reopening do not mutate or remember approval', () => {
  const c = character(), before = structuredClone(c), d = approved(c, 'short');
  d.care = true; d.allocation.STR = '2';
  assert.deepEqual(c, before);
  assert.equal(model.apply(c, d), '');
  assert.equal(c.current.STR, 8);
  assert.equal(c.current.CON, 6);
  assert.equal(c.current.DEX, 4);
  assert.deepEqual(c.pending, before.pending);
  assert.deepEqual(c.maximum, before.maximum);
  const reopened = model.draft(c, 'short');
  assert.equal(reopened.approved, false);
  assert.equal(reopened.care, false);
  assert.ok(Object.values(reopened.allocation).every(n => n === '0'));
  assert.equal(reopened.budget, '3');
  assert.deepEqual(Object.keys(c), Object.keys(before));
});

test('Polish recovery dictionary loads independently without replacing existing strings', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('./locale.js'), 'utf8'), context);
  const strings = context.window.SIGILRPG_LOCALES.pl.strings;
  const cancel = strings.Cancel;
  vm.runInNewContext(fs.readFileSync(require.resolve('./recovery-locale.js'), 'utf8'), context);
  assert.equal(strings.Cancel, cancel);
  assert.equal(strings['Encounter End (Second Wind)'], 'Koniec spotkania (Drugi oddech)');
  assert.ok(strings['End round first to settle pending wounds before recovery.']);
});
