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
- Character-aware action composer for physical attacks, prefixes, equipment values, and Words of Power. Prefixes require Base Attack or an attack-like Shape; invalid combinations do not display calculated totals. Standalone spells ignore the selected weapon. A single Source attached to Base Attack retains the Smite AP exception; prefixes on an attack-like Shape do not make it a Smite. Mixed-Shape compatibility remains a table ruling, not an invented exclusion matrix.
- Selected-character **DM damage helper** previews random wound allocation among fictionally eligible attributes. Enter actual wounds from one resolved hit, not potential or several attacks. Ordinary hits can wound each attribute once; Precision can wound one attribute twice. Current and pending d4 attributes are skipped. Unassignable wounds block queuing and are reported for table resolution.
- Overflow from one hit is ignored: 3 remaining HP with 5 wounds queues at most 3 wounds, leaves the character alive at 0 HP, and ignores 2. The next separate damaging hit kills. Pending wounds count toward this threshold without reducing the dice used during the round. Death persists through reload and End round; ordinary healing and recovery do not revive a dead character.
- **Recovery** offers Encounter End (Second Wind), Short Rest, and Long Rest, with manual allocation of eligible tiers. Budgets are 25%, 25%, and 50% of permanent level (maximum HP), respectively. Second Wind permits CON/INT; Short Rest adds SEN/AUR and STR with explicit care approval; Long Rest permits all attributes. Settle pending wounds with End round first.
- Recovery rounding, reuse, refresh timing, and exact durations are undefined in the source. Fractional budgets require a GM-approved integer; each use requires explicit table approval. No automatic rest refresh or reuse policy is imposed. Recovery never exceeds permanent maximums.
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

## Rules references and validation

This companion follows the active, incomplete [stats-as-dice redesign](../SigilRPG/content/rules/variants/stats-as-dice/index.md), particularly [recovery](../SigilRPG/content/rules/variants/stats-as-dice/core/recovery.md), [attribute damage](../SigilRPG/content/rules/variants/stats-as-dice/combat/attribute-damage.md), and [prefixes](../SigilRPG/content/rules/variants/stats-as-dice/combat/prefixes.md). These links are for the sibling documentation checkout, not deployed Pages routes. Random wound assignment and per-hit overflow handling are tracker product policy; they do not rewrite the authored rules.

Run dependency-free regression tests with Node.js:

```sh
node --test composer.test.js recovery.test.js damage.test.js
```

An automated headless-browser smoke test is also available when `chromium` is installed on PATH:

```sh
node --test browser.test.js
```

It uses an isolated temporary browser profile and a local file, with no server or backend. For manual browser smoke testing, create a character, preview and queue a hit, end the round, apply recovery, switch EN/PL, and reload to check persistence. Verify that 0 HP is not displayed as death and that a subsequent separate hit marks the character dead.
