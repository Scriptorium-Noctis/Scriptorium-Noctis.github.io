'use strict';

// Load after app.js. The model is also usable by dependency-free Node tests.
(function () {
  const stages = {
    encounter: { label: 'Second Wind', fraction: 0.25, attributes: ['CON', 'INT'], guidance: 'Catch your breath and clear your head. This budget restores only CON and INT.' },
    short: { label: 'Short Rest', fraction: 0.25, attributes: ['AUR', 'SEN'], guidance: 'Clean yourself, refresh your senses, stretch, and regain composure. This additional budget restores only AUR and SEN.' },
    long: { label: 'Long Rest', fraction: 0.5, attributes: ['STR', 'DEX'], guidance: 'Proper rest and physical care restore strength and fine control. This additional budget restores only STR and DEX.' }
  };
  const keys = Object.keys(stages);
  const integer = value => (typeof value === 'string' && /^\d+$/.test(value) || typeof value === 'number') && Number.isSafeInteger(Number(value)) && Number(value) >= 0;

  function createRecovery(api) {
    function draft(c, stage = 'encounter') {
      const level = api.maxHp(c);
      const d = { id: c.id, level, stages: {} };
      for (const key of keys) {
        const exact = level * stages[key].fraction;
        d.stages[key] = { selected: false, exact, budget: Math.floor(exact),
          allocation: Object.fromEntries(api.attributes.map(a => [a, '0'])) };
      }
      selectStage(d, stage, true);
      return d;
    }
    // Checking a stage includes prerequisites; unchecking one removes its dependants.
    function selectStage(d, stage, selected) {
      const index = keys.indexOf(stage);
      if (index < 0 || typeof selected !== 'boolean') return;
      keys.forEach((key, i) => {
        if (selected ? i <= index : i >= index) d.stages[key].selected = selected;
        if (!d.stages[key].selected) {
          d.stages[key].allocation = Object.fromEntries(api.attributes.map(a => [a, '0']));
        }
      });

    }
    function eligible(stage, a) { return !!stages[stage]?.attributes.includes(a); }
    function capacity(c, a) { return Math.max(0, api.idx(c.maximum[a]) - api.idx(c.current[a])); }
    function totals(s) {
      const values = Object.values(s.allocation);
      const allocated = values.every(integer) ? values.reduce((sum, n) => sum + Number(n), 0) : null;
      const budget = integer(s.budget) ? Number(s.budget) : null;
      return { allocated, budget, waste: allocated !== null && budget !== null && allocated <= budget ? budget - allocated : null };
    }
    function validate(c, d, allowEmpty = false) {
      if (!c || !d || c.id !== d.id) return 'Selected character changed. Reopen recovery.';
      if (c.dead) return 'Dead characters cannot recover.';
      if (!c.current || !c.maximum || !c.pending || api.attributes.some(a =>
        !api.dice.includes(c.current[a]) || !api.dice.includes(c.maximum[a]) ||
        api.idx(c.current[a]) > api.idx(c.maximum[a]) || !integer(c.pending[a]))) return 'Invalid character state. Reopen recovery after correcting the character.';
      if (api.hasPending(c)) return 'End round first to settle pending wounds before recovery.';
      if (!Number.isSafeInteger(d.level) || d.level < 0 || api.maxHp(c) !== d.level) return 'Character level changed. Reopen recovery.';
      if (!d.stages || Object.keys(d.stages).length !== keys.length || keys.some(key => !d.stages[key] || typeof d.stages[key].selected !== 'boolean')) return 'Invalid recovery stages. Reopen recovery.';
      const selected = keys.filter(key => d.stages[key].selected);
      if (!selected.length || (d.stages.short.selected && !d.stages.encounter.selected) || (d.stages.long.selected && !d.stages.short.selected)) return 'Select Second Wind; Short Rest requires Second Wind, and Long Rest requires both.';
      let total = 0;
      for (const key of keys) {
        const s = d.stages[key];
        if (s.exact !== d.level * stages[key].fraction) return 'Character level changed. Reopen recovery.';
        if (!s.allocation || Object.keys(s.allocation).length !== api.attributes.length) return 'Allocate whole tiers only to eligible attributes, without exceeding their maximums.';
        let allocated = 0;
        for (const a of api.attributes) {
          const n = s.allocation[a];
          if (!integer(n) || Number(n) > capacity(c, a) || (Number(n) > 0 && (!s.selected || !eligible(key, a)))) return 'Allocate whole tiers only to eligible attributes, without exceeding their maximums.';
          allocated += Number(n);
        }
        if (s.budget !== Math.floor(d.level * stages[key].fraction)) return 'Recovery budgets are rounded down automatically. Reopen recovery.';
        if (!s.selected) continue;
        if (allocated > s.budget) return 'A stage allocation exceeds its budget. Budgets cannot transfer.';
        total += allocated;
      }
      if (!total && !allowEmpty) return 'Use HEAL to choose tiers to recover.';
      return '';
    }
    function apply(c, d) {
      const error = validate(c, d);
      if (error) return error;
      // Compute all results before changing current dice; never touch maximums or pending wounds.
      const next = {};
      for (const a of api.attributes) {
        const restored = keys.reduce((sum, key) => sum + Number(d.stages[key].allocation[a]), 0);
        next[a] = api.dice[api.idx(c.current[a]) + restored];
      }
      Object.assign(c.current, next);
      return '';
    }
    function stageFor(a) { return keys.find(key => eligible(key, a)); }
    function canHeal(c, d, a) {
      if (validate(c, d, true)) return false;
      const s = d.stages[stageFor(a)];
      return !!s?.selected && totals(s).waste > 0 && Number(s.allocation[a]) < capacity(c, a);
    }
    function adjust(c, d, a, delta) {
      const key = stageFor(a);
      if (!key || ![-1, 1].includes(delta) || validate(c, d, true)) return false;
      const s = d.stages[key];
      if (delta > 0 ? !canHeal(c, d, a) : Number(s.allocation[a]) === 0) return false;
      s.allocation[a] = Number(s.allocation[a]) + delta;
      return true;
    }
    return { draft, selectStage, eligible, capacity, totals, validate, apply, stageFor, canHeal, adjust };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { createRecovery, stages };
  if (typeof document === 'undefined') return;

  const model = createRecovery({ attributes: ATTRIBUTES, dice: DICE, idx, maxHp, hasPending });
  let dialog, draft, heading, status, applyButton, summary;
  const localized = [], stageControls = [], tiles = [];
  function text(tag, source, parent, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (source) localized.push({ node, source });
    node.textContent = t(source);
    parent.append(node);
    return node;
  }
  function build() {
    dialog = document.createElement('dialog');
    dialog.id = 'recoveryDialog';
    dialog.className = 'modal';
    dialog.setAttribute('aria-labelledby', 'recoveryTitle');
    const form = document.createElement('form');
    form.className = 'modal-card';
    dialog.append(form);
    heading = text('h2', 'Recovery', form);
    heading.id = 'recoveryTitle';
    const stageRow = document.createElement('div');
    stageRow.className = 'recovery-stage-row';
    form.append(stageRow);
    for (const [key, stage] of Object.entries(stages)) {
      const cell = document.createElement('div');
      cell.className = 'recovery-stage';
      const label = document.createElement('label');
      label.className = 'recovery-stage-toggle';
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.id = `recoveryStage-${key}`;
      check.setAttribute('aria-describedby', 'recoveryPrerequisites');
      check.onchange = () => { model.selectStage(draft, key, check.checked); refresh(); };
      label.append(check);
      text('span', stage.label, label);
      cell.append(label);
      text('small', `${stage.fraction * 100}% · ${stage.attributes.join('/')}`, cell);
      const counter = text('small', '', cell);
      counter.id = `recoveryWaste-${key}`;
      stageRow.append(cell);
      stageControls.push({ key, cell, check, counter });
    }
    const grid = document.createElement('div');
    grid.className = 'detail-stats recovery-stats';
    grid.id = 'recoveryStats';
    form.append(grid);
    for (const a of ATTRIBUTES) {
      const tile = document.createElement('div');
      tile.className = 'stat-tile';
      tile.dataset.attribute = a;
      text('span', a, tile, 'stat-name');
      const die = text('strong', '', tile, 'stat-die');
      const maximum = text('span', '', tile, 'stat-max');
      const preview = text('span', '', tile, 'recovery-preview');
      const controls = document.createElement('div');
      controls.className = 'stat-controls';
      const undo = text('button', '−', controls);
      undo.id = `recoveryUndo-${a}`;
      undo.type = 'button';
      undo.onclick = () => { model.adjust(getCharacter(), draft, a, -1); refresh(); };
      const heal = text('button', 'HEAL', controls);
      heal.id = `recoveryHeal-${a}`;
      heal.type = 'button';
      heal.onclick = () => { model.adjust(getCharacter(), draft, a, 1); refresh(); };
      tile.append(controls);
      grid.append(tile);
      tiles.push({ a, tile, die, maximum, preview, undo, heal });
    }
    summary = text('p', '', form, 'muted');
    summary.id = 'recoverySummary';
    summary.setAttribute('role', 'status');
    text('p', 'Later rests include earlier stages. Each budget rounds down; unused tiers are lost, not transferred.', form, 'muted').id = 'recoveryPrerequisites';
    const guidance = document.createElement('details');
    text('summary', 'Recovery guidance', guidance);
    for (const stage of Object.values(stages)) text('p', stage.guidance, guidance, 'muted');
    form.append(guidance);
    status = text('p', '', form, 'danger-text');
    status.id = 'recoveryStatus';
    status.setAttribute('role', 'status');
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    form.append(actions);
    const cancel = text('button', 'Cancel', actions, 'button');
    cancel.type = 'button';
    cancel.onclick = () => dialog.close();
    applyButton = text('button', 'Apply recovery', actions, 'button button-primary');
    applyButton.id = 'recoveryApply';
    applyButton.type = 'submit';
    form.onsubmit = event => {
      event.preventDefault();
      if (model.apply(getCharacter(), draft)) { refresh(); return; }
      save(); renderAll(); dialog.close();
    };
    document.body.append(dialog);
    document.addEventListener('change', event => { if (dialog.open && event.target.id === 'localeSelect') refresh(); });
  }
  function refresh() {
    localized.forEach(({ node, source }) => { node.textContent = t(source); });
    const c = getCharacter();
    heading.textContent = t('Recovery — {name}', { name: getCharacter(draft.id)?.name || t('Character') });
    let budget = 0, allocated = 0, waste = 0;
    stageControls.forEach(({ key, cell, check, counter }) => {
      const s = draft.stages[key], counts = model.totals(s);
      check.checked = s.selected;
      cell.classList.toggle('active', s.selected);
      counter.textContent = s.selected ? t('{left}/{budget} left', { left: counts.waste, budget: counts.budget }) : t('Not selected');
      if (s.selected) { budget += counts.budget; allocated += counts.allocated; waste += counts.waste; }
    });
    tiles.forEach(({ a, tile, die, maximum, preview, undo, heal }) => {
      const s = draft.stages[model.stageFor(a)], n = Number(s.allocation[a]);
      die.textContent = c ? `d${DICE[Math.min(idx(c.maximum[a]), idx(c.current[a]) + n)]}` : '—';
      maximum.textContent = c ? t('max d{die}', { die: c.maximum[a] }) : '';
      preview.textContent = n ? t('+{count} tiers', { count: n }) : t(stages[model.stageFor(a)].label);
      tile.classList.toggle('recovering', n > 0);
      heal.disabled = !model.canHeal(c, draft, a);
      heal.setAttribute('aria-label', t('Restore one {attribute} tier', { attribute: a }));
      undo.disabled = n === 0 || !!model.validate(c, draft, true);
      undo.setAttribute('aria-label', t('Undo one {attribute} recovery tier', { attribute: a }));
    });
    summary.textContent = t('Recovery: {total}/{budget} tiers · Unused: {waste}', { total: allocated, budget, waste });
    const error = model.validate(c, draft, true);
    status.textContent = error ? t(error) : '';
    status.hidden = !error;
    applyButton.disabled = !!model.validate(c, draft);
  }
  document.addEventListener('click', event => {
    if (!event.target.closest?.('#recoveryButton')) return;
    event.preventDefault();
    const c = getCharacter();
    if (!c) return;
    if (!dialog) build();
    if (dialog.open) return;
    draft = model.draft(c);
    refresh();
    dialog.showModal();
  });
})();
