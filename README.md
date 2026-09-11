# SigilRPG Table Helper

Static, single-page table companion for physical SigilRPG play.

## Current design

- Local-only persistence through `localStorage`.
- English and Polish UI (`locale.js`).
- Dense initiative-style multi-character roster with quick die editing, inline removal, and direct Add controls.
- **HEAL** changes the current die immediately. **DMG** queues wounds; queued wounds apply only on **End round** and never reduce a die below d4.
- Character detail with directly editable name and initiative, current/max attributes, healing, damage, editable maximums, equipment, and calculated combat profile.
- Weapons expose Accuracy attribute, Impact, Guarantee, and base Potential.
- Plating exposes Guarantee and Limit. Unsettled playtest defaults use d6 and remain editable.
- Character-aware action composer for physical attacks, prefixes, equipment values, and Words of Power. Prefixes require Base Attack or an attack-like Shape; invalid combinations do not display calculated totals. Any attack-like Shape excludes Base Attack and weapon delivery: no base AP/potential, weapon accuracy/Impact, or Smite discount. Removing the last such Shape restores the saved Base Attack preference. A single Source with Base Attack and no other Words retains the existing Smite AP exception; multiple Sources each cost 1 AP. Other mixed-Shape compatibility remains a table ruling. Base Attack still accepts non-attack-like Shape or Mastery Words alongside its Sources — nothing is disabled — but the Diagnostics panel warns that they don't carry through the weapon hit, since Base Attack only resolves Source Word manifestations.
- Readable, deterministic names distinguish weapon and spell delivery: **Precision Power Weapon Attack (Spear) of Lightning** versus **Precision Lightning Fire Bolt** (4 AP). Weapon Source names are slash-separated. Alternative incantations combine existing Words with invented prefix words; these are tracker flavor, not authored canon.
- Every Word now carries structured delivery, target, area, range, duration, resistance, manifestation, interaction, and potential-policy data. The composer resolves a primary delivery, endpoint Shapes, targets/area, Source manifestations, Mastery effects, and diagnostics rather than merely concatenating labels.
- Shape composition is layered and deterministic. A primary attack Shape such as Bolt carries container/area Shapes to its endpoint. For example, **Fire + Pillar + Bolt** rolls spell accuracy against the Bolt target, then manifests a 1 m × 5 m fiery Pillar at impact; other occupants resist against the area DC. Competing primary delivery Shapes use stable catalog priority and produce a visible diagnostic rather than an implicit result.
- Area resistance is separate from spell accuracy and the caster’s casting check. The resistance difficulty follows total selected Word count; prefixes and AP do not increase it. The tracker calculates spell potential as **base + prefixes + Mana spent + Dust spent**, so every consumed Mana or Dust contributes 1 potential. This is explicitly displayed as a tracker ruling.
- **Disarming** and **Knockback** each cost 1 AP and add 1 potential. Failed enemy Brace causes a held item to drop or knocks the target back total Potential × 5 meters, respectively; neither replaces normal damage-chain wounds.
- Selected-character **DM damage helper** is **amount → preview → apply**, with no attribute-selection or Precision controls. Enter already-resolved damage, not potential. Each wound is randomly assigned to an attribute with remaining tiers after current and pending wounds; eligibility is recalculated after each assignment. Attributes at effective d4 are skipped. The same attribute may receive multiple wounds while capacity remains, so damage is never left unassigned merely because other attributes are exhausted. This helper allocates resolved damage rather than validating attack-prefix restrictions; the composer and guide retain those attack-resolution rules. Apply queues the previewed allocation without rerolling; dice still change only at End round.
- Overflow from one hit is ignored: 3 remaining HP with 5 wounds queues at most 3 wounds, leaves the character alive at 0 HP, and ignores 2. The next separate damaging hit kills. Pending wounds count toward this threshold without reducing the dice used during the round. Death persists through reload and End round; ordinary healing and recovery do not revive a dead character.
- **Recovery** centers on the same six-attribute layout as the character sheet. Three stage checkboxes share one row. HEAL previews one recovered tier; the minus button undoes it. Apply recovery saves the preview, while Cancel leaves the character unchanged. Short Rest selects Second Wind too; Long Rest selects both earlier stages. Unchecking a prerequisite unchecks later stages and clears their previews. Settle pending wounds with End round first.
- Each stage owns a separate, nontransferable budget and exclusive attribute map: **Second Wind: 25% of maximum HP → CON/INT**; **Short Rest: another 25% → AUR/SEN**; **Long Rest: another 50% → STR/DEX**. Each budget automatically rounds down to a whole tier, so cumulative recovery may be less than 100%. For 11 maximum HP the budgets are **2 + 2 + 5 = 9 tiers**. Remaining budgets are shown below the checkboxes; unused tiers are lost, not redirected or banked. HEAL is disabled for unavailable stages, exhausted budgets, and attributes already at their permanent maximum.
- Recovery has no GM grant/approval checkbox or editable budget fields. Care guidance is available in a collapsed section. No automatic rest refresh or reuse policy is imposed, and recovery never exceeds permanent maximums.
- **GM reset** is a confirmed administrative override: full HP, no pending wounds, and death removed. It is not a Long Rest.
- Combat guide remains in the same page.
- Character templates can create multiple copies quickly.
- On mobile, a one-character roster automatically collapses to the character sheet; initiative and End Round remain available there. Multi-character rosters keep explicit roster → character navigation.

## Deployment

Serve the directory directly with GitHub Pages. There is no build step or backend.

```text
index.html
styles.css
app.js
locale.js
composer-locale.js
recovery-locale.js
damage-locale.js
damage.js
recovery.js
```

Keep the script order in `index.html`: locale dictionaries before `app.js`, then the damage and recovery tools. No dependencies or external services are needed.

## Word resolver policy

Source Words explain touch, Smite, attack, and area manifestations. Current examples include lightning arcs, ongoing fire chip attacks, Frost speed reduction, conductive Water, obscuring Shadow, outlining Light, and restorative or inverted Vital Energy. Vital Energy with Slash or Strike supports surgical removal of dead tissue before regeneration.

Mastery Words remain distinct from delivery. **Mabufa** transfers 1 Mana or raises one target attribute one tier, including healing or a temporary over-maximum boost such as d12 → d20; the composer explains this but does not mutate character state. **Hold Still** costs 1 AP and no energy or potential. It deliberately exposes the caster while charging and lowers an existing caster casting check by one difficulty tier; it never lowers enemy area resistance.

These detailed manifestations and automatic interactions are labeled **Tracker ruling, not canonical**. They develop incomplete authored Word notes for play assistance without editing the sibling `SigilRPG/` source.

## Pending condition decision

**Well Rested is not implemented yet.** Its requested shape is a temporary +1 tier on a lowest attribute, capped at d20, without changing permanent maximums. Qualification for “barely wounded,” duration/expiry, and whether a wound consumes only the bonus or also damages the normal die need clarification before connecting it to damage and HP tracking.

## Rules references and validation

This companion follows the active, incomplete [stats-as-dice redesign](../SigilRPG/content/rules/variants/stats-as-dice/index.md), particularly [recovery](../SigilRPG/content/rules/variants/stats-as-dice/core/recovery.md), [attribute damage](../SigilRPG/content/rules/variants/stats-as-dice/combat/attribute-damage.md), and [prefixes](../SigilRPG/content/rules/variants/stats-as-dice/combat/prefixes.md). These links are for the sibling documentation checkout, not deployed Pages routes. Random wound assignment, per-hit overflow, exclusive cumulative recovery eligibility and per-stage rounding down, the two new prefixes, and attack-like Shape exclusion are tracker product decisions supplied by the operator; they do not rewrite the authored rules. The sibling recovery document still describes the older, broader eligibility and has not been edited.

Run dependency-free regression tests with Node.js:

```sh
node --test composer.test.js recovery.test.js damage.test.js
```

An automated headless-browser smoke test is also available when `chromium` is installed on PATH:

```sh
node --test browser.test.js
```

It uses an isolated temporary browser profile and a local file, with no server or backend. For manual browser smoke testing, create a character, preview and queue a hit, end the round, apply recovery, switch EN/PL, and reload to check persistence. Verify that 0 HP is not displayed as death and that a subsequent separate hit marks the character dead.
