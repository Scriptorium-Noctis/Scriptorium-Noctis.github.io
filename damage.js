'use strict';

// Allocate already-resolved wounds; attack/prefix restrictions are resolved before using this helper.
// One call is one damage event so overflow cannot turn into a second, lethal hit.
function planDamage(character, amount, random = Math.random) {
  const attributes = ['STR', 'DEX', 'CON', 'INT', 'SEN', 'AUR'];
  const dice = [4, 6, 8, 10, 12, 20, 100];
  if (!Number.isSafeInteger(amount) || amount < 1) throw new Error('Invalid damage amount');
  const remaining = Object.fromEntries(attributes.map(a => [a, Math.max(0, dice.indexOf(character.current[a]) - (character.pending[a] || 0))]));
  const hp = Object.values(remaining).reduce((sum, n) => sum + n, 0);
  const allocation = Object.fromEntries(attributes.map(a => [a, 0]));
  if (character.dead) return {allocation, lethal: false, ignored: amount};
  if (hp === 0) return {allocation, lethal: true, ignored: amount - 1};
  let assigned = 0;
  const target = Math.min(amount, hp);
  while (assigned < target) {
    const candidates = attributes.filter(a => remaining[a] > 0);
    const a = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];

    allocation[a]++;
    remaining[a]--;
    assigned++;
  }
  return {allocation, lethal: false, ignored: Math.max(0, amount - hp)};
}

if (typeof module !== 'undefined') module.exports = {planDamage};

if (typeof document !== 'undefined') {
  document.addEventListener('click', event => {
    if (!event.target.closest('#damageHelperButton')) return;
    const c = getCharacter();
    if (!c) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'modal';
    dialog.setAttribute('aria-labelledby', 'damageHelperTitle');
    const form = document.createElement('form');
    form.className = 'modal-card';
    form.innerHTML = `<h2 id="damageHelperTitle">${t('DM damage helper')}</h2><strong data-name></strong>
      <p class="muted">${t('Enter resolved damage, not potential. Attributes are chosen automatically from their remaining tiers after current and pending wounds. A stat at d4 cannot take more wounds.')}</p>
      <label class="field-label">${t('Wounds from this hit')}<input name="amount" type="number" min="1" max="999" step="1" value="1" required></label>

      <button type="button" class="button" data-preview>${t('Preview random spread')}</button>
      <div role="status" data-result></div>
      <p class="muted">${t('Overflow from this hit is ignored. At 0 HP you can still act; the next separate hit kills. Pending wounds count toward this threshold, but dice change only at End round.')}</p>
      <div class="modal-actions"><button type="button" class="button" data-cancel>${t('Cancel')}</button><button type="submit" class="button button-primary" disabled>${t('Apply damage')}</button></div>`;
    form.querySelector('[data-name]').textContent = c.name;

    let plan = null;
    const apply = form.querySelector('[type="submit"]');
    const result = form.querySelector('[data-result]');
    const snapshot = () => JSON.stringify([c.current, c.pending, c.dead]);
    let before = snapshot();
    form.addEventListener('input', () => {plan = null; apply.disabled = true; result.textContent = '';});
    form.querySelector('[data-preview]').onclick = () => {
      if (!form.reportValidity()) return;
      before = snapshot();
      plan = planDamage(c, Number(form.elements.amount.value));
      const assigned = Object.values(plan.allocation).reduce((s, n) => s + n, 0);
      result.textContent = c.dead ? t('DEAD') : plan.lethal ? t('This separate hit will kill the character.') : `${ATTRIBUTES.filter(a => plan.allocation[a]).map(a => `${a}: −${plan.allocation[a]}`).join(' · ')} — ${t('Ignored overflow: {count}.', {count: plan.ignored})}`;
      apply.disabled = !!c.dead || (!assigned && !plan.lethal);
    };
    form.onsubmit = event => {
      event.preventDefault();
      if (!plan || apply.disabled) return;
      if (snapshot() !== before) {plan = null; apply.disabled = true; result.textContent = t('Character changed. Preview again.'); return;}
      if (plan.lethal && !confirm(t('This separate hit will kill the character.'))) return;
      ATTRIBUTES.forEach(a => {c.pending[a] += plan.allocation[a];});
      if (plan.lethal) c.dead = true;
      save(); renderAll(); dialog.close();
    };
    form.querySelector('[data-cancel]').onclick = () => dialog.close();
    dialog.addEventListener('close', () => dialog.remove());
    dialog.append(form); document.body.append(dialog); dialog.showModal();
  });
}
