'use strict';

// Load after app.js. The model is also usable by dependency-free Node tests.
(function () {
  const stages = {
    encounter: { label: 'Encounter End (Second Wind)', fraction: 0.25, attributes: ['CON', 'INT'] },
    short: { label: 'Short Rest', fraction: 0.25, attributes: ['CON', 'INT', 'SEN', 'AUR'] },
    long: { label: 'Long Rest', fraction: 0.5 }
  };

  function createRecovery(api) {
    const integer = value => String(value).trim() !== '' && Number.isSafeInteger(Number(value)) && Number(value) >= 0;
    function draft(c, stage = 'encounter') {
      const exact = api.maxHp(c) * stages[stage].fraction;
      return { id: c.id, stage, exact, budget: Number.isInteger(exact) ? String(exact) : '', approved: false, care: false,
        allocation: Object.fromEntries(api.attributes.map(a => [a, '0'])) };
    }
    function eligible(d, a) {
      return !!stages[d.stage] && (d.stage === 'long' || stages[d.stage].attributes.includes(a) || (d.stage === 'short' && d.care && a === 'STR'));
    }
    function capacity(c, a) { return Math.max(0, api.idx(c.maximum[a]) - api.idx(c.current[a])); }
    function validate(c, d) {
      if (!c || c.id !== d.id) return 'Selected character changed. Reopen recovery.';
      if (c.dead) return 'Dead characters cannot recover.';
      if (api.hasPending(c)) return 'End round first to settle pending wounds before recovery.';
      if (!stages[d.stage] || api.maxHp(c) * stages[d.stage].fraction !== d.exact) return 'Character level changed. Reopen recovery.';
      if (!d.approved) return 'Confirm stage availability and table approval for this use.';
      if (!integer(d.budget) || (Number.isInteger(d.exact) && Number(d.budget) !== d.exact)) return 'Enter a GM-approved non-negative whole-number budget.';
      let total = 0;
      for (const a of api.attributes) {
        const n = d.allocation[a];
        if (!integer(n) || Number(n) > capacity(c, a) || (Number(n) > 0 && !eligible(d, a))) return 'Allocate whole tiers only to eligible attributes, without exceeding their maximums.';
        total += Number(n);
      }
      if (total > Number(d.budget)) return 'Allocation exceeds the approved budget.';
      if (!total) return 'Allocate at least one tier to recover.';
      return '';
    }
    function apply(c, d) {
      const error = validate(c, d);
      if (error) return error;
      // Validate the entire allocation before mutating; pending wounds are never touched.
      for (const a of api.attributes) c.current[a] = api.dice[api.idx(c.current[a]) + Number(d.allocation[a])];
      return '';
    }
    return { draft, eligible, capacity, validate, apply };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { createRecovery, stages };
  if (typeof document === 'undefined') return;

  const model = createRecovery({ attributes: ATTRIBUTES, dice: DICE, idx, maxHp, hasPending });
  let dialog, form, draft, heading, exact, budget, approval, care, careLabel, status, applyButton, summary;
  const localized = [], rows = [];
  function text(tag, source, parent, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    localized.push({ node, source });
    node.textContent = t(source);
    parent.append(node);
    return node;
  }
  function field(source, parent, type) {
    const label = document.createElement('label');
    label.className = type === 'checkbox' ? '' : 'field-label';
    parent.append(label);
    const input = document.createElement('input');
    input.type = type;
    if (type === 'checkbox') label.append(input);
    text('span', source, label);
    if (type !== 'checkbox') label.append(input);
    if (type === 'number') { input.min = '0'; input.step = '1'; input.required = true; }
    return input;
  }
  function build() {
    dialog = document.createElement('dialog');
    dialog.id = 'recoveryDialog';
    dialog.className = 'modal';
    dialog.setAttribute('aria-labelledby', 'recoveryTitle');
    form = document.createElement('form');
    form.className = 'modal-card';
    form.noValidate = true;
    dialog.append(form);
    heading = text('h2', 'Recovery', form);
    heading.id = 'recoveryTitle';
    const stageLabel = text('label', 'Recovery stage', form, 'field-label');
    const select = document.createElement('select');
    select.id = 'recoveryStage';
    stageLabel.htmlFor = select.id;
    form.append(select);
    for (const [key, stage] of Object.entries(stages)) text('option', stage.label, select).value = key;
    select.onchange = () => { draft = model.draft(getCharacter(draft.id), select.value); resetInputs(); refresh(); };
    exact = text('p', '', form, 'muted');
    text('p', 'Rounding, stage reuse, refresh timing, and exact rest durations are undefined. The table must approve each use; no usage or refresh limits are tracked.', form, 'muted');
    budget = field('GM-approved whole-number budget', form, 'number');
    budget.oninput = () => { draft.budget = budget.value; refresh(); };
    care = field('STR care approved: push through pain and treat affected muscles.', form, 'checkbox');
    careLabel = care.parentElement;
    care.onchange = () => {
      draft.care = care.checked;
      if (!draft.care) { draft.allocation.STR = '0'; rows.find(r => r.a === 'STR').input.value = '0'; }
      refresh();
    };
    approval = field('I confirm this stage is available and the table approves this use, care, and any fractional-budget ruling.', form, 'checkbox');
    approval.onchange = () => { draft.approved = approval.checked; refresh(); };
    const grid = document.createElement('div');
    grid.className = 'equipment-fields';
    form.append(grid);
    for (const a of ATTRIBUTES) {
      const input = field(a, grid, 'number');
      const preview = text('span', '', input.parentElement, 'muted');
      input.oninput = () => { draft.allocation[a] = input.value; refresh(); };
      rows.push({ a, input, preview });
    }
    summary = text('p', '', form, 'muted');
    status = text('p', '', form, 'danger-text');
    status.setAttribute('role', 'status');
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    form.append(actions);
    const cancel = text('button', 'Cancel', actions, 'button');
    cancel.type = 'button';
    cancel.onclick = () => dialog.close();
    applyButton = text('button', 'Apply recovery', actions, 'button button-primary');
    applyButton.type = 'submit';
    form.onsubmit = event => {
      event.preventDefault();
      const error = model.apply(getCharacter(), draft);
      if (error) { refresh(); return; }
      save();
      renderAll();
      dialog.close();
    };
    document.body.append(dialog);
    document.addEventListener('change', event => { if (dialog.open && event.target.id === 'localeSelect') refresh(); });
  }
  function resetInputs() {
    budget.value = draft.budget;
    approval.checked = false;
    care.checked = false;
    rows.forEach(r => { r.input.value = '0'; });
  }
  function refresh() {
    localized.forEach(({ node, source }) => { if (source) node.textContent = t(source); });
    const c = getCharacter();
    heading.textContent = t('Recovery — {name}', { name: getCharacter(draft.id)?.name || t('Character') });
    exact.textContent = t('Exact budget: {budget} tiers ({percent}% of level {level}).', { budget: draft.exact, percent: stages[draft.stage].fraction * 100, level: draft.exact / stages[draft.stage].fraction });
    budget.readOnly = Number.isInteger(draft.exact);
    careLabel.hidden = draft.stage !== 'short';
    rows.forEach(({ a, input, preview }) => {
      const cap = c ? model.capacity(c, a) : 0;
      input.max = String(cap);
      input.disabled = !c || c.dead || hasPending(c) || !model.eligible(draft, a) || !cap;
      const n = Number(draft.allocation[a]);
      const after = c && Number.isSafeInteger(n) && n >= 0 && n <= cap ? DICE[idx(c.current[a]) + n] : null;
      preview.textContent = c ? t('d{current} → {after} · max d{max}', { current: c.current[a], after: after === null ? t('Invalid allocation') : t('d{die}', { die: after }), max: c.maximum[a] }) : '';
    });
    summary.textContent = t('Allocated: {total} / {budget} tiers', { total: Object.values(draft.allocation).reduce((s, n) => s + (Number(n) || 0), 0), budget: draft.budget || t('GM ruling required') });
    const error = model.validate(c, draft);
    status.textContent = error ? t(error) : t('Ready to apply recovery.');
    applyButton.disabled = !!error;
  }
  // Delegation works even if the character-sheet button is created or replaced later.
  document.addEventListener('click', event => {
    if (!event.target.closest?.('#recoveryButton')) return;
    event.preventDefault();
    const c = getCharacter();
    if (!c) return;
    if (!dialog) build();
    if (dialog.open) return;
    draft = model.draft(c);
    form.querySelector('select').value = draft.stage;
    resetInputs();
    refresh();
    dialog.showModal();
  });
})();
