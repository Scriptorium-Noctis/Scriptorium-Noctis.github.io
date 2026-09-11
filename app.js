'use strict';

const STORAGE_KEY = 'sigilrpg-stat-tracker-v1';
const UI_KEY = 'sigilrpg-ui-v2';
const LOCALE_KEY = 'sigilrpg-locale-v1';
const ATTRIBUTES = ['STR','DEX','CON','INT','SEN','AUR'];
const DICE = [4,6,8,10,12,20,100];
const LOCALES = window.SIGILRPG_LOCALES || {en:{label:'English',htmlLang:'en',strings:{}}};
const ATTACK_MASTERY_GLYPHS = {
  precision:{label:'Precision',glyph:'Zin',potential:1,effects:['Gain advantage on the accuracy roll.','One attribute may be wounded twice by this attack.']},
  power:{label:'Power',glyph:'Tor',potential:1,effects:['Accuracy die increases by one tier.']},
  dashing:{label:'Dashing',glyph:'Vesh',potential:1,effects:[]},
  disarming:{label:'Disarming',glyph:'Nek',potential:1,effects:['On a failed enemy Brace, the enemy drops a held item. The normal damage chain is unchanged.']},
  knockback:{label:'Knockback',glyph:'Brom',potential:1,effects:[]},
  sweep:{label:'Sweep',glyph:'Sha',potential:0,effects:['Apply the attack against multiple targets.','Sweep does not increase damage potential.']}
};
const TEMPLATES = [
  {id:'blank',name:'Blank',stats:[4,4,4,4,4,4]},
  {id:'hero',name:'Hero',stats:[8,8,8,8,8,8]},
  {id:'guard',name:'Guard',stats:[8,6,8,4,6,4]},
  {id:'brute',name:'Brute',stats:[12,6,10,4,6,4]},
  {id:'mystic',name:'Mystic',stats:[4,6,6,12,10,8]}
];
const DEFAULT_WEAPONS = [
  {name:'Long Blade',weaponClass:'heavy',accuracy:'STR',impact:8,equipped:true},
  {name:'Dagger',weaponClass:'light',accuracy:'DEX',impact:4,equipped:true}
];
const BASE_ATTACK_POTENTIAL = 2;
const WEAPON_CLASSES = {
  light:{label:'Light',accuracyOptions:['STR','DEX']},
  ranged:{label:'Ranged',accuracyOptions:['STR','DEX']},
  heavy:{label:'Heavy',accuracyOptions:ATTRIBUTES}
};
const PLATING_TYPES = {
  light:{label:'Light',braceGuarantee:6,dodgeLimit:12},
  medium:{label:'Medium',braceGuarantee:9,dodgeLimit:9},
  heavy:{label:'Heavy',braceGuarantee:12,dodgeLimit:6}
};
const SHIELD_RULES = {meleeMissChipIgnored:true,rangedDodgeGuarantee:4};

const GLYPHS = {
  source:[
    {id:'thunder',name:'Thunder & Lightning',glyph:'Baguaga',mana:1,delivery:'payload',target:'creatures and conductive objects',area:'follows delivery',range:'follows delivery',duration:'instant',resist:'follows delivery',effects:{touch:'Shock a touched target.',smite:'Add lightning to the hit and zap one nearby target with a chip attack.',attack:'Electrify the struck target; arc a chip zap to one nearby target.',area:'Each affected target is shocked; one nearby target at the area edge takes a chip zap.'},interactions:'Water and metal may conduct the visible arc when the table agrees.',potential:{base:'resource'}},
    {id:'vital',name:'Vital Energy',glyph:'Habaga',mana:1,potential:{base:'resource',byMode:{smite:-1},conditional:[{mode:'smite',target:'undead',value:2,label:'Against undead'}]},delivery:'payload',target:'living creature or undead',area:'follows delivery',range:'follows delivery',duration:'instant',resist:'willing targets need none; harmful inversion follows delivery',effects:{touch:'Restore living tissue by touch, or invert it to harm.',smite:'Vital Smite is restorative or -1 damage potential; against undead it is +2 damage potential.',attack:'Deliver restoration or inverted vitality through the hit.',area:'Restore living creatures or harm them with inverted vitality throughout the area.'},interactions:'With Slash, Strike, or another cutting Shaping Glyph, Vital can become surgical: remove dead tissue before regeneration.'},
    {id:'force',name:'Force',glyph:'Tyś',mana:1,delivery:'payload',target:'creature or object',area:'follows delivery',range:'follows delivery',duration:'instant',resist:'follows delivery',effects:{touch:'Apply a sharp shove or controlled pressure by touch.',smite:'Add physical impact and momentum to the hit.',attack:'Strike with impact, pressure, or acceleration.',area:'Push or buffet occupants in the resolved area.'},interactions:'Hammer emphasizes impact; Barrier makes pressure resist movement.',potential:{base:'resource'}},
    {id:'fire',name:'Fire',glyph:'Firanka',mana:1,delivery:'payload',target:'creature, object, or space',area:'follows delivery',range:'follows delivery',duration:'ignite: 2 rounds',resist:'follows delivery',effects:{touch:'Sear or kindle what is touched.',smite:'Ignite the struck target; it takes a chip attack at the end of each of its next 2 turns.',attack:'Ignite the hit target; chip attack at the end of each of its next 2 turns.',area:'Ignite affected creatures and flammables; chip attack at the end of each affected creature’s next 2 turns.'},interactions:'Vortex spreads flame through its field; Pillar forms a vertical column of flame.',potential:{base:'resource'}},
    {id:'frost',name:'Frost',glyph:'Zhorna',mana:1,delivery:'payload',target:'creature, object, or water',area:'follows delivery',range:'follows delivery',duration:'slowed for 1 round',resist:'follows delivery',effects:{touch:'Rime the target and halve its speed for 1 round.',smite:'The struck target’s speed is halved for 1 round.',attack:'The hit target’s speed is halved for 1 round.',area:'Affected creatures have half speed for 1 round.'},interactions:'Water freezes into slippery or solid forms; Barrier can become an ice wall.',potential:{base:'resource'}},
    {id:'echoes',name:'Echoes',glyph:'Berevri',mana:1,delivery:'payload',target:'a lingering spell trace',area:'matches the echoed trace',range:'20 m',duration:'one repetition, no longer than original',resist:'as the echoed spell',effects:{touch:'Replay a faint remnant at the touched trace.',smite:'Overlay the hit with a faint echo of a previous spell.',attack:'Carry a compatible lingering spell remnant to the hit.',area:'Repeat a compatible remnant through the resolved area.'},interactions:'Requires an identifiable earlier spell; if none exists, report an unresolved requirement.',potential:{base:'resource'}},
    {id:'shadow',name:'Shadow & Darkness',glyph:'Ferpshna',mana:1,delivery:'payload',target:'creature, object, or space',area:'follows delivery',range:'follows delivery',duration:'1 round',resist:'follows delivery',effects:{touch:'Cloak the touched subject in dim shadow.',smite:'The hit blooms with obscuring darkness for 1 round.',attack:'Obscure the hit target’s immediate space for 1 round.',area:'Heavily obscure the resolved area for 1 round.'},interactions:'Light contests or outlines the darkness instead of silently cancelling it.',potential:{base:'resource'}},
    {id:'light',name:'Light & Radiance',glyph:'Gripshna',mana:1,delivery:'payload',target:'creature, object, or space',area:'follows delivery',range:'follows delivery',duration:'1 round',resist:'follows delivery',effects:{touch:'Illuminate or brand the touched subject.',smite:'The hit flashes; the target is visibly outlined for 1 round.',attack:'Radiance outlines the hit target for 1 round.',area:'Brightly illuminate and outline occupants in the resolved area for 1 round.'},interactions:'Shadow creates a visible boundary or contested illumination.',potential:{base:'resource'}},
    {id:'poison',name:'Poison',glyph:'Vyrnaka',mana:1,delivery:'payload',target:'living creature or contaminable object',area:'follows delivery',range:'follows delivery',duration:'2 rounds',resist:'follows delivery',effects:{touch:'Apply venom by touch; chip attack at the end of the target’s next 2 turns.',smite:'Poison the struck target; chip attack at the end of its next 2 turns.',attack:'Poison the hit target for 2 rounds.',area:'Expose living occupants; affected targets suffer poison for 2 rounds.'},interactions:'Water can carry and dilute poison; Siphon can draw it out.',potential:{base:'resource'}},
    {id:'fear',name:'Fear',glyph:'Ghazur',mana:1,delivery:'payload',target:'creature able to perceive the manifestation',area:'follows delivery',range:'follows delivery',duration:'1 round',resist:'target resistance',effects:{touch:'Fill the touched creature with dread for 1 round.',smite:'The hit target recoils in supernatural fear for 1 round.',attack:'The hit target is frightened for 1 round.',area:'Affected perceiving creatures are frightened for 1 round.'},interactions:'Power Glyph can deliver fear through hearing.',potential:{base:'resource'}},
    {id:'water',name:'Water',glyph:'Tugatuga',mana:1,delivery:'payload',target:'creature, object, or space',area:'follows delivery',range:'follows delivery',duration:'1 round',resist:'follows delivery',effects:{touch:'Drench or move a handful of water by touch.',smite:'The hit bursts with water and leaves the target drenched.',attack:'Strike and drench the hit target.',area:'Fill or drench the resolved area for 1 round.'},interactions:'Lightning may conduct through it; Frost may freeze it; Vortex makes a whirlpool.',potential:{base:'resource'}},
    {id:'speed',name:'Speed',glyph:'Dobenga',mana:1,delivery:'payload',target:'creature or moving object',area:'follows delivery',range:'follows delivery',duration:'1 round',resist:'willing targets need none; harmful acceleration follows delivery',effects:{touch:'Double the touched target’s movement speed for 1 round.',smite:'Accelerate the wielder through the strike; reposition 5 m after it.',attack:'Accelerate the hit or launched payload.',area:'Double affected willing creatures’ speed for 1 round.'},interactions:'Wings converts acceleration into fast flight; Spiral curves the motion.',potential:{base:'resource'}},
    {id:'levitate',name:'Levitation',glyph:'Harnharn',mana:1,delivery:'payload',target:'creature or object',area:'follows delivery',range:'follows delivery',duration:'1 round',resist:'unwilling targets resist',effects:{touch:'Lift the touched target just above the ground for 1 round.',smite:'Briefly lift the struck target or wielder.',attack:'Lift the hit target for 1 round.',area:'Lift affected creatures and loose objects for 1 round.'},interactions:'Wings grants controlled flight; Pillar lifts along a vertical path.',potential:{base:'resource'}},
    {id:'stone',name:'Stone',glyph:'Kafelka',mana:1,delivery:'payload',target:'earth, stone, creature, object, or space',area:'follows delivery',range:'follows delivery',duration:'1 minute',resist:'follows delivery',effects:{touch:'Harden or shape touched earth and stone.',smite:'Sheathe the hit in stone and scatter chips.',attack:'Strike with stone or petrifying crust.',area:'Raise or reshape stone throughout the resolved area.'},interactions:'Pillar raises a stone column; Cave excavates it; Shatter breaks it apart.',potential:{base:'resource'}}
  ],
  shape:[
    {id:'pillar',name:'Pillar',glyph:'Ghyblor',mana:1,delivery:'container',target:'occupants of its footprint',area:'1 m-wide × 5 m-tall pillar',range:'20 m or delivery impact',duration:'1 round',resist:'area resistance',effects:['Manifest the Source as a narrow vertical pillar.'],interactions:'A primary delivery carries and places the Pillar at its endpoint; Bolt + Pillar attacks one target, then manifests the Pillar at the impact point and affects occupants in its footprint.',potential:{base:'resource'}},
    {id:'bolt',name:'Bolt',glyph:'Dziahaka',mana:1,potential:{base:'resource',bonus:1,reason:'Focused application'},attackLike:true,delivery:'primary-attack',target:'one target',area:'impact point',range:'30 m',duration:'instant; containers may persist',resist:'spell accuracy vs target defense',effects:['Launch the payload at one target.'],interactions:'Carries area/container Shapes to the target or impact point.'},
    {id:'vortex',name:'Vortex',glyph:'Kashanka',mana:1,delivery:'container',target:'occupants',area:'5 m-radius field',range:'20 m or delivery impact',duration:'1 round',resist:'area resistance',effects:['Rotate, pull, or circulate the payload in a field.'],interactions:'A primary delivery places the Vortex at its endpoint; without one, choose its center in range.',potential:{base:'resource'}},
    {id:'hammer',name:'Hammer',glyph:'Baluuga',mana:1,attackLike:true,delivery:'primary-attack',target:'one target',area:'impact point',range:'10 m',duration:'instant',resist:'spell accuracy vs target defense',effects:['Deliver a heavy impact that may push or stagger.'],interactions:'Carries containers to the impact point and emphasizes Force or Stone impact.',potential:{base:'resource'}},
    {id:'strike',name:'Strike',glyph:'Hypsh',mana:1,attackLike:true,delivery:'primary-attack',target:'one touched or melee target',area:'contact point',range:'touch/melee',duration:'instant',resist:'spell accuracy vs target defense',effects:['Deliver the payload by touch or melee strike.'],interactions:'With Vital or a cutting Shape, permits surgical removal of dead tissue.',potential:{base:'resource'}},
    {id:'slash',name:'Slash',glyph:'Yyś',mana:1,attackLike:true,delivery:'primary-attack',target:'one target along the line',area:'10 m × 1 m line',range:'10 m',duration:'instant',resist:'spell accuracy for primary target; area resistance for other occupants',effects:['Cut a narrow line through the payload.'],interactions:'With Vital, becomes a surgical cutting manifestation; containers originate at the chosen impact.',potential:{base:'resource'}},
    {id:'snake',name:'Snake',glyph:'Sneila',mana:1,attackLike:true,delivery:'primary-attack',target:'one target around simple cover',area:'winding path',range:'30 m',duration:'instant',resist:'spell accuracy vs target defense',effects:['Guide the payload around simple cover.'],interactions:'Spiral further curves its path; containers manifest at the endpoint.',potential:{base:'resource'}},
    {id:'knockdown',name:'Knockdown / Pindown',glyph:'Kuva',mana:1,delivery:'modifier',target:'target or occupants',area:'follows delivery',range:'follows delivery',duration:'1 round while pinned',resist:'target resistance',effects:['Knock affected targets prone; continued pressure may pin them.'],interactions:'Uses the primary target when carried, otherwise requires a target in 20 m.',potential:{base:'resource'}},
    {id:'chains',name:'Chains / Restrain',glyph:'Thryka',mana:1,delivery:'modifier',target:'target or occupants',area:'follows delivery',range:'20 m or follows delivery',duration:'1 round',resist:'target resistance',effects:['Restrain affected targets until they break free or the effect ends.'],interactions:'Container Shapes distribute chains among their occupants.',potential:{base:'resource'}},
    {id:'barrier',name:'Barrier / Shield',glyph:'Oshvar',mana:1,delivery:'container',target:'creatures behind or crossing it',area:'3 m × 3 m plane',range:'20 m or delivery impact',duration:'1 round',resist:'none unless forced onto a target',effects:['Form a defensive plane from the payload.'],interactions:'Flat reinforces its plane; a primary delivery places it at the endpoint.',potential:{base:'resource'}},
    {id:'siphon',name:'Siphon / Drain',glyph:'Drynok',mana:1,attackLike:true,delivery:'primary-attack',target:'one target',area:'line to caster',range:'10 m',duration:'instant',resist:'spell accuracy vs target defense',effects:['Draw the Source energy from the target toward the caster.'],interactions:'Vital drains life when inverted; Poison can be drawn out instead of inflicted.',potential:{base:'resource'}},
    {id:'construct',name:'Construct / Frame',glyph:'Peyoz',mana:1,delivery:'container',target:'simple formed object',area:'within a 2 m cube',range:'20 m or delivery impact',duration:'1 minute',resist:'none unless trapping a target',effects:['Form a simple object or frame from the payload.'],interactions:'Other Shapes define the frame’s geometry or movement.',potential:{base:'resource'}},
    {id:'heart',name:'Heart / Center',glyph:'Hordum',mana:1,delivery:'anchor',target:'spell center',area:'point anchor',range:'20 m or delivery impact',duration:'matches longest Shape',resist:'none',effects:['Give the spell a stable center.'],interactions:'Containers orbit or emanate from the Heart.',potential:{base:'resource'}},
    {id:'illusion',name:'Illusion / Veil',glyph:'Lorynka',mana:1,delivery:'container',target:'observers or occupants',area:'5 m cube',range:'20 m or delivery impact',duration:'1 minute',resist:'target resistance when disbelief matters',effects:['Alter sight and sound in the resolved area.'],interactions:'Sources determine the illusion’s sensory theme; Power Glyph adds audible delivery.',potential:{base:'resource'}},
    {id:'wings',name:'Wings / Flight',glyph:'Chyvra',mana:1,delivery:'modifier',target:'one creature or carried target',area:'target',range:'touch or follows delivery',duration:'1 round',resist:'unwilling target resists',effects:['Grant flight at base movement speed.'],interactions:'Speed increases flight speed; area delivery can grant flight to occupants.',potential:{base:'resource'}},
    {id:'shatter',name:'Shatter',glyph:'Talgru',mana:1,attackLike:true,delivery:'primary-attack',target:'one creature, object, or construct',area:'target',range:'20 m',duration:'instant',resist:'spell accuracy vs target defense',effects:['Tear apart the target; especially apt against objects and constructs.'],interactions:'Stone supplies fragments; containers shatter at the endpoint.',potential:{base:'resource'}},
    {id:'howling',name:'Howling',glyph:'Galish',mana:1,delivery:'area',target:'occupants',area:'10 m cone',range:'self-origin',duration:'instant',resist:'area resistance',effects:['Release the payload through a cone of sound or pressure.'],interactions:'Without a primary delivery the cone originates from the caster; Power Glyph carries it through hearing instead.',potential:{base:'resource'}},
    {id:'open',name:'Open',glyph:'Alhora',mana:1,delivery:'modifier',target:'valid opening or closed object',area:'target',range:'10 m or follows delivery',duration:'instant',resist:'target resistance if held or warded',effects:['Open, unfold, or create an aperture.'],interactions:'Cave makes a passage; Barrier becomes a doorway or gap.',potential:{base:'resource'}},
    {id:'spiral',name:'Spiral',glyph:'Panteka',mana:1,delivery:'modifier',target:'another Shape',area:'follows modified Shape',range:'follows modified Shape',duration:'follows modified Shape',resist:'follows delivery',effects:['Twist another Shape into a spiral or orbit.'],interactions:'Requires another Shape; modifies its path rather than becoming a delivery.',potential:{base:'resource'}},
    {id:'cave',name:'Cave / Burrow',glyph:'Bûnkra',mana:1,delivery:'area',target:'earth or stone',area:'2 m-long × 2 m-wide passage',range:'touch/adjacent',duration:'persistent excavation',resist:'none',effects:['Excavate or shape a short passage.'],interactions:'Stone supplies material; Open creates an entrance.',potential:{base:'resource'}},
    {id:'flat',name:'Flat',glyph:'Regal',mana:1,delivery:'modifier',target:'another Shape',area:'plane, wall, floor, or surface',range:'follows modified Shape',duration:'follows modified Shape',resist:'follows delivery',effects:['Flatten another Shape into a plane.'],interactions:'Requires another Shape; modifies its geometry rather than becoming a delivery.',potential:{base:'resource'}}
  ],
  mastery:[
    {id:'negation',name:'Negation',glyph:'Nushik',mana:1,delivery:'mastery',target:'one selected Source or Shaping Glyph',area:'follows affected Glyph',range:'follows delivery',duration:'follows affected Glyph',resist:'follows delivery',effects:['Invert, suppress, or cancel a selected Source or Shaping Glyph where fiction permits.'],interactions:'The caster must state which Glyph is negated.',potential:{base:'resource'}},
    {id:'power',name:'Power Glyph',glyph:'Dovinus',dust:1,delivery:'mastery-hearing',target:'anything that can hear',area:'audible reach',range:'hearing',duration:'follows payload',resist:'target resistance',effects:['Make the spell verbal-only, carry it through hearing, and raise its power die one tier.'],interactions:'Overrides ordinary delivery with hearing and distributes compatible Shaping Glyphs to listeners.',potential:{base:'resource'}},
    {id:'focus',name:'Focus Glyph',glyph:'Balrurg',dust:1,delivery:'mastery',target:'caster',area:'none',range:'self',duration:'casting',resist:'none',effects:['Gain advantage on the caster’s Spell Casting Check.'],interactions:'Does not alter target resistance.',potential:{base:'resource'}},
    {id:'enhancement',name:'Enhancement',glyph:'Mabufa',mana:1,delivery:'mastery-touch',target:'one touched target',area:'target',range:'touch or compatible delivery',duration:'temporary over-max boost: until scene ends; healing is immediate',resist:'willing target: none',effects:['Transfer 1 Mana OR raise one target stat by one tier, healing a lost tier or granting a temporary over-maximum boost (for example d12 → d20). No character state is changed by this resolver.'],interactions:'Primarily utility; its spent Mana still adds 1 potential under the tracker resource ruling.',potential:{base:'resource'}},
    {id:'ascended',name:'Ascended Energy',glyph:'Divinarius',dust:1,delivery:'mastery',target:'spell',area:'none',range:'self',duration:'casting',resist:'none',effects:['Raise the spell’s guaranteed success difficulty by one tier.'],interactions:'Does not alter target resistance.',potential:{base:'resource'}},
    {id:'hold',name:'Hold Still',glyph:'Kurwa',delivery:'mastery',target:'caster',area:'none',range:'self',duration:'charging',resist:'none',effects:['Deliberately remain exposed while stabilizing and charging; reduce casting difficulty one tier when a casting check exists.'],interactions:'Never reduces target resistance and adds no potential because it consumes no energy.',potential:{base:'none'}},
    {id:'show',name:'Show Me',glyph:'Gabbergûbber',dust:1,delivery:'mastery-vision',target:'caster',area:'vision',range:'self',duration:'brief vision',resist:'none',effects:['Reveal a simple vision; three uses can reveal a Vision of the World.'],interactions:'Other Glyphs may narrow the subject of the vision.',potential:{base:'resource'}},
    {id:'multiplier',name:'Multiplier',glyph:'Tigiba',dust:1,delivery:'mastery',target:'one compatible spell part',area:'follows multiplied part',range:'follows delivery',duration:'follows multiplied part',resist:'follows delivery',effects:['Repeat or multiply one compatible part of the spell.'],interactions:'Exact scaling remains a table decision; the resolver does not invent extra targets or potential.',potential:{base:'resource'}}
  ]
};

const INCANTATION_VARIANTS = {
  attackMastery:{
    precision:['Zin','Ziin','Zyn','Ziń'],power:['Tor','Thor','Torr','Tohr'],dashing:['Vesh','Vesz','Veshh','Veś'],
    disarming:['Nek','Neck','Nekk','Nekh'],knockback:['Brom','Broom','Brohm','Bromm'],sweep:['Sha','Sza','Shah','Shaa']
  },
  glyphs:{
    thunder:['Baguaga','Bagwaga','Baguagga','Bagua-ga'],vital:['Habaga','Habagga','Haba-ga','Habhaga'],force:['Tyś','Tysz','Tysh','Tys'],fire:['Firanka','Fyranka','Firankha','Firan-ka'],frost:['Zhorna','Żorna','Zhorhna','Zhor-na'],echoes:['Berevri','Berewri','Berevrii','Bere-vri'],shadow:['Ferpshna','Ferpszna','Ferpsh-na','Ferpshnaa'],light:['Gripshna','Gripszna','Gripsh-na','Gripshnaa'],poison:['Vyrnaka','Virnaka','Vyrnakha','Vyr-na-ka'],fear:['Ghazur','Gazur','Ghazurr','Gha-zur'],water:['Tugatuga','Tughatuga','Tuga-tuga','Tugatugha'],speed:['Dobenga','Dobhenga','Doben-ga','Dobengha'],levitate:['Harnharn','Harn-harn','Harnhahrn','Harnarn'],stone:['Kafelka','Kafellka','Kafel-ka','Kafelha'],pillar:['Ghyblor','Ghiblor','Ghyb-lor','Ghyblorr'],bolt:['Dziahaka','Dżiahaka','Dziah-ka','Dziahakka'],vortex:['Kashanka','Kaszanka','Kashan-ka','Kashankha'],hammer:['Baluuga','Baluga','Baluugha','Balu-ga'],strike:['Hypsh','Hypsz','Hyp-sh','Hypshh'],slash:['Yyś','Yysz','Yysh','Yys'],snake:['Sneila','Snejla','Sneilha','Snei-la'],knockdown:['Kuva','Kuwa','Kuvva','Ku-va'],chains:['Thryka','Tryka','Thrykha','Thry-ka'],barrier:['Oshvar','Oszvar','Osh-vahr','Oshvarr'],siphon:['Drynok','Dryhnok','Dry-nok','Drynokk'],construct:['Peyoz','Pejoz','Peyhoz','Pey-oz'],heart:['Hordum','Horduum','Hor-dum','Hordhum'],illusion:['Lorynka','Lorinka','Lorynkha','Loryn-ka'],wings:['Chyvra','Chiwra','Chy-vra','Chyvvra'],shatter:['Talgru','Talghru','Tal-gru','Talgruu'],howling:['Galish','Galisz','Gal-ish','Galishh'],open:['Alhora','Alchora','Al-hora','Alhorra'],spiral:['Panteka','Pantheka','Pan-teka','Pantekka'],cave:['Bûnkra','Bunkra','Bûn-kra','Bûnkhra'],flat:['Regal','Reghal','Re-gal','Regall'],negation:['Nushik','Nuszik','Nu-shik','Nushikk'],power:['Dovinus','Dowinus','Dovi-nus','Dovinuss'],focus:['Balrurg','Balrurgh','Bal-rurg','Balrurg'],enhancement:['Mabufa','Mabhufa','Mabu-fa','Mabuffa'],ascended:['Divinarius','Diwinarius','Divi-narius','Divinariuz'],hold:['Kurwa','Kurva','Kurrwa','Kur-wa'],show:['Gabbergûbber','Gabbergubber','Gabber-gûbber','Gabbergûber'],multiplier:['Tigiba','Tighiba','Tigi-ba','Tigibba']
  }
};
Object.entries(ATTACK_MASTERY_GLYPHS).forEach(([id,p])=>p.incantations=INCANTATION_VARIANTS.attackMastery[id]||[p.glyph]);
Object.values(GLYPHS).flat().forEach(w=>w.incantations=INCANTATION_VARIANTS.glyphs[w.id]||[w.glyph]);

const CASTING_DIFFICULTIES=[{name:'Easy',dc:4},{name:'Advanced',dc:6},{name:'Hard',dc:8},{name:'Very Hard',dc:10},{name:'Improbable',dc:12},{name:'Inconceivable',dc:20},{name:'Impossible',dc:100}];

let locale=loadLocale();
let state=loadState();
let ui=loadUi();
let selectedAttackMastery=new Set();
let selectedGlyphs=new Set();
let composerMode='attack';
let editMaximums=false;
let quickEditor=null;
const staticText=[]; const staticAttrs=[];

const $=s=>document.querySelector(s);
const initiativePane=$('#initiativePane'),rosterPane=$('#rosterPane'),detailPane=$('#detailPane'),actionPane=$('#actionPane'),guidePane=$('#guidePane');
const initiativeList=$('#initiativeList'),emptyInitiative=$('#emptyInitiative'),characterRosterList=$('#characterRosterList'),emptyRoster=$('#emptyRoster'),detailContent=$('#detailContent'),detailEmpty=$('#detailEmpty');
const localeSelect=$('#localeSelect'),characterDialog=$('#characterDialog');

function t(source,vars={}){const out=LOCALES[locale]?.strings?.[source]??source;return out.replace(/\{(\w+)\}/g,(m,k)=>Object.hasOwn(vars,k)?String(vars[k]):m)}
function loadLocale(){const saved=localStorage.getItem(LOCALE_KEY);if(saved&&LOCALES[saved])return saved;return (navigator.language||'en').toLowerCase().startsWith('pl')&&LOCALES.pl?'pl':'en'}
function captureLocale(root){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){if(n.parentElement?.closest('script,style'))continue;const s=n.nodeValue.trim();if(!s)continue;staticText.push({n,s,lead:n.nodeValue.match(/^\s*/)[0],trail:n.nodeValue.match(/\s*$/)[0]})}root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(el=>['placeholder','aria-label','title'].forEach(a=>{if(el.hasAttribute(a))staticAttrs.push({el,a,s:el.getAttribute(a)})}))}
function applyLocale(){document.documentElement.lang=LOCALES[locale]?.htmlLang||locale;staticText.forEach(x=>x.n.nodeValue=x.lead+t(x.s)+x.trail);staticAttrs.forEach(x=>x.el.setAttribute(x.a,t(x.s)));localeSelect.value=locale;renderAll(false)}

function idx(d){return Math.max(0,DICE.indexOf(Number(d)))}
function stepDown(d,n=1){return DICE[Math.max(0,idx(d)-n)]}
function stepUp(d,n=1,max=100){return DICE[Math.min(idx(max),idx(d)+n)]}
function woundsBetween(max,current){return Math.max(0,idx(max)-idx(current))}
function maxHp(c){return ATTRIBUTES.reduce((s,a)=>s+idx(c.maximum[a]),0)}
function currentHp(c){return ATTRIBUTES.reduce((s,a)=>s+idx(c.current[a]),0)}
function effectiveDie(c,a){return stepDown(c.current[a],c.pending[a]||0)}
function healthStatus(c){return c.dead?t('DEAD'):ATTRIBUTES.every(a=>effectiveDie(c,a)===4)?t('0 HP · next hit kills'):t('Alive')}
function hasPending(c){return ATTRIBUTES.some(a=>(c.pending[a]||0)>0)}
function newEquipment(){return {weapons:structuredClone(DEFAULT_WEAPONS),shields:[],plating:[{type:'medium',equipped:true}]}}
function normalizeEquipment(equipment){const base=equipment||newEquipment();return {weapons:Array.isArray(base.weapons)?base.weapons:[],shields:Array.isArray(base.shields)?base.shields:[],plating:Array.isArray(base.plating)?base.plating:[]}}
function normalizeCharacter(c){
  const maximum={},current={},pending={};
  ATTRIBUTES.forEach(a=>{maximum[a]=DICE.includes(Number(c.maximum?.[a]))?Number(c.maximum[a]):4;current[a]=DICE.includes(Number(c.current?.[a]))?Number(c.current[a]):maximum[a];current[a]=Math.min(current[a],maximum[a]);pending[a]=Math.min(idx(current[a]),Math.max(0,Math.floor(Number(c.pending?.[a])||0)))});
  return {id:c.id||crypto.randomUUID(),name:c.name||t('Character'),initiative:Number(c.initiative)||0,maximum,current,pending,dead:c.dead===true,equipment:normalizeEquipment(c.equipment)};
}
function cloneCharacterForInitiative(c){
  const copy=normalizeCharacter(structuredClone(c));
  copy.id=crypto.randomUUID();copy.rosterId=c.id;copy.initiative=0;return copy;
}
function normalizeInitiativeEntry(c){const entry=normalizeCharacter(c);entry.rosterId=c.rosterId||null;return entry}
function loadState(){
  try{
    const p=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(p?.characters){
      const characters=p.characters.map(normalizeCharacter);
      if(Array.isArray(p.initiative))return {characters,initiative:p.initiative.map(normalizeInitiativeEntry)};
      return {characters,initiative:characters.map(c=>{const copy=normalizeCharacter(structuredClone(c));copy.id=crypto.randomUUID();copy.rosterId=c.id;return copy})};
    }
  }catch(e){console.warn(e)}
  return {characters:[],initiative:[]};
}
function loadUi(){
  const defaults={view:'initiative',detailSource:'initiative',selectedRosterId:null,selectedInitiativeId:null,sortInitiative:false};
  try{
    const saved=JSON.parse(localStorage.getItem(UI_KEY))||{};
    if(saved.selectedId&&!saved.selectedInitiativeId)saved.selectedInitiativeId=saved.selectedId;
    if(saved.view==='roster'){saved.view='initiative';saved.detailSource='initiative'}
    if(saved.view==='detail'&&!saved.detailSource)saved.detailSource='initiative';
    return {...defaults,...saved};
  }catch{return defaults}
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));localStorage.setItem(UI_KEY,JSON.stringify(ui))}
function rosterCharacter(id=ui.selectedRosterId){return state.characters.find(c=>c.id===id)||null}
function initiativeCharacter(id=ui.selectedInitiativeId){return state.initiative.find(c=>c.id===id)||null}
function getCharacter(id){
  if(id){return state.initiative.find(c=>c.id===id)||state.characters.find(c=>c.id===id)||null}
  return ui.detailSource==='roster'?rosterCharacter():initiativeCharacter();
}
function displayInitiative(){const list=[...state.initiative];if(ui.sortInitiative)list.sort((a,b)=>b.initiative-a.initiative||a.name.localeCompare(b.name));return list}

function renderAll(preserve=true){renderInitiative();renderRoster();renderDetail();renderComposerCharacters();renderComposer();syncView(false);if(!preserve)return}
function renderInitiative(){
  initiativeList.replaceChildren();emptyInitiative.hidden=state.initiative.length>0;
  if(state.initiative.length){const labels=document.createElement('div');labels.className='roster-labels';labels.innerHTML=`<span>${t('Init')}</span><span>${t('Character')}</span>${ATTRIBUTES.map(a=>`<span>${a}</span>`).join('')}`;initiativeList.append(labels)}
  for(const c of displayInitiative())initiativeList.append(renderInitiativeRow(c));
  const pending=state.initiative.reduce((s,c)=>s+ATTRIBUTES.reduce((x,a)=>x+(c.pending[a]||0),0),0);
  $('#roundSummary').textContent=pending?t('{count} pending wounds will apply at round end.',{count:pending}):t('No pending wounds.');
  $('#endRoundButton').disabled=pending===0;
}
function renderInitiativeRow(c){
  const row=document.createElement('div');row.className='roster-row'+(c.id===ui.selectedInitiativeId&&ui.detailSource==='initiative'?' selected':'');row.dataset.id=c.id;
  const init=document.createElement('div');init.className='initiative-box';const input=document.createElement('input');input.type='number';input.value=c.initiative;input.setAttribute('aria-label',t('{name} initiative',{name:c.name}));input.addEventListener('click',e=>e.stopPropagation());input.addEventListener('change',()=>{c.initiative=Number(input.value)||0;save();if(ui.sortInitiative)renderInitiative()});init.append(input);
  const name=document.createElement('div');name.className='roster-name';name.innerHTML=`<div class="roster-name-line"><strong></strong><button type="button" class="roster-remove" aria-label="${t('Remove from initiative')}">×</button></div><span></span>`;name.querySelector('strong').textContent=c.name;name.querySelector('span').textContent=`${currentHp(c)}/${maxHp(c)} HP · ${healthStatus(c)}${hasPending(c)?` · ${t('pending')}`:''}`;
  name.querySelector('.roster-remove').onclick=e=>{e.stopPropagation();removeFromInitiative(c)};row.append(init,name);
  ATTRIBUTES.forEach(a=>{const b=document.createElement('button');b.type='button';b.className='quick-die';if(c.current[a]!==c.maximum[a])b.classList.add('wounded');if(c.pending[a])b.classList.add('pending');if(effectiveDie(c,a)===4)b.classList.add('at-floor');b.innerHTML=`<strong>d${c.current[a]}</strong><small>${c.pending[a]?`→ d${effectiveDie(c,a)}`:a}</small>`;b.setAttribute('aria-label',t('Edit {attribute} for {name}',{attribute:a,name:c.name}));b.addEventListener('click',e=>{e.stopPropagation();openQuickEditor(b,c,a)});row.append(b)});
  row.addEventListener('click',()=>selectInitiativeCharacter(c.id,true));return row;
}
function renderRoster(){
  characterRosterList.replaceChildren();emptyRoster.hidden=state.characters.length>0;
  for(const c of state.characters){
    const row=document.createElement('div');row.className='library-row'+(c.id===ui.selectedRosterId&&ui.detailSource==='roster'?' selected':'');
    const info=document.createElement('button');info.type='button';info.className='library-character';info.innerHTML='<strong></strong><span></span>';info.querySelector('strong').textContent=c.name;info.querySelector('span').textContent=ATTRIBUTES.map(a=>`${a} d${c.maximum[a]}`).join(' · ');info.onclick=()=>selectRosterCharacter(c.id,true);
    const add=document.createElement('button');add.type='button';add.className='button button-subtle';add.textContent=t('Add to initiative');add.onclick=e=>{e.stopPropagation();addToInitiative(c)};
    row.append(info,add);characterRosterList.append(row);
  }
}
function openQuickEditor(anchor,c,a){closeQuickEditor();const box=document.createElement('div');box.className='quick-editor';box.innerHTML=`<button type="button" data-op="heal">${t('HEAL')}</button><div><small>${a}</small><strong>d${c.current[a]}</strong><span>${c.pending[a]?`${t('pending')} → d${effectiveDie(c,a)}`:t('current')}</span></div><button type="button" data-op="damage">${t('DMG')}</button>`;document.body.append(box);const r=anchor.getBoundingClientRect();const br=box.getBoundingClientRect();box.style.left=`${Math.max(8,Math.min(innerWidth-br.width-8,r.left+r.width/2-br.width/2))}px`;box.style.top=`${Math.max(8,r.top-br.height-6)}px`;
  const damage=box.querySelector('[data-op="damage"]'),heal=box.querySelector('[data-op="heal"]');damage.disabled=c.dead||effectiveDie(c,a)===4;heal.disabled=c.dead||c.current[a]===c.maximum[a];
  damage.onclick=e=>{e.stopPropagation();if(effectiveDie(c,a)!==4)c.pending[a]=(c.pending[a]||0)+1;save();renderInitiative();renderDetail();closeQuickEditor()};
  heal.onclick=e=>{e.stopPropagation();if(c.current[a]!==c.maximum[a])c.current[a]=stepUp(c.current[a],1,c.maximum[a]);save();renderInitiative();renderDetail();closeQuickEditor()};quickEditor=box;
}
function closeQuickEditor(){quickEditor?.remove();quickEditor=null}
document.addEventListener('pointerdown',e=>{if(quickEditor&&!quickEditor.contains(e.target))closeQuickEditor()});

function selectInitiativeCharacter(id,explicit=false){ui.selectedInitiativeId=id;ui.detailSource='initiative';save();renderInitiative();renderRoster();renderDetail();renderComposerCharacters();if(explicit&&matchMedia('(max-width:760px)').matches)setView('detail',true)}
function selectRosterCharacter(id,explicit=false){ui.selectedRosterId=id;ui.detailSource='roster';save();renderInitiative();renderRoster();renderDetail();renderComposerCharacters();if(explicit&&matchMedia('(max-width:760px)').matches)setView('detail',true)}
function addToInitiative(c){if(!c)return;const entry=cloneCharacterForInitiative(c);state.initiative.push(entry);ui.selectedInitiativeId=entry.id;ui.detailSource='initiative';save();renderAll();}
function removeFromInitiative(c){if(!c||!confirm(t('Remove {name} from initiative?',{name:c.name})))return;state.initiative=state.initiative.filter(x=>x.id!==c.id);if(ui.selectedInitiativeId===c.id)ui.selectedInitiativeId=state.initiative[0]?.id||null;if(!state.initiative.length&&ui.detailSource==='initiative')ui.detailSource='roster';save();renderAll()}
function removeRosterCharacter(c){if(!c||!confirm(t('Delete {name} from local roster? Existing initiative copies will remain.',{name:c.name})))return;state.characters=state.characters.filter(x=>x.id!==c.id);if(ui.selectedRosterId===c.id)ui.selectedRosterId=state.characters[0]?.id||null;if(!state.characters.length&&ui.detailSource==='roster')ui.detailSource='initiative';save();renderAll()}
function renderDetail(){
  const c=getCharacter();detailEmpty.hidden=!!c;detailContent.hidden=!c;if(!c)return;
  const isInitiative=ui.detailSource==='initiative';
  $('#detailInitiativeSection').hidden=!isInitiative;$('#detailRosterSection').hidden=isInitiative;$('#damageHelperButton').disabled=!isInitiative||c.dead;$('#recoveryButton').disabled=!isInitiative;$('#fullHpButton').disabled=!isInitiative;
  const nameInput=$('#detailNameInput');nameInput.value=c.name;nameInput.onchange=()=>{c.name=nameInput.value.trim()||t('Character');nameInput.value=c.name;save();renderInitiative();renderRoster();renderComposerCharacters();syncView(false)};
  $('#detailMeta').textContent=`${currentHp(c)} / ${maxHp(c)} HP · ${healthStatus(c)}${isInitiative&&c.rosterId?` · ${t('Initiative copy')}`:''}`;
  const initInput=$('#detailInitiativeInput');initInput.value=c.initiative;initInput.onchange=()=>{c.initiative=Number(initInput.value)||0;save();renderInitiative()};
  $('#detailEndRoundButton').disabled=!state.initiative.some(hasPending);
  $('#addToInitiativeButton').onclick=()=>addToInitiative(c);
  const stats=$('#detailStats');stats.replaceChildren();ATTRIBUTES.forEach(a=>stats.append(renderStatTile(c,a)));
  renderProfile(c);renderEquipment(c);$('#toggleStatEditButton').textContent=editMaximums?t('Done editing'):t('Edit maximums');
  $('#deleteCharacterButton').textContent=t(isInitiative?'Remove from initiative':'Delete character');
}
function renderStatTile(c,a){const tile=document.createElement('div');tile.className='stat-tile';const pending=c.pending[a]||0;tile.innerHTML=`<span class="stat-name">${a}</span><strong class="stat-die">d${c.current[a]}</strong><span class="stat-max">${pending?`${t('pending')} → d${effectiveDie(c,a)}`:`${t('max')} d${c.maximum[a]}`}</span><div class="stat-controls"><button type="button" data-heal>${t('HEAL')}</button><button type="button" data-damage>${t('DMG')}</button></div>`;
  const encounter=ui.detailSource==='initiative';tile.querySelector('[data-damage]').disabled=!encounter||c.dead||effectiveDie(c,a)===4;tile.querySelector('[data-heal]').disabled=!encounter||c.dead||c.current[a]===c.maximum[a];
  tile.querySelector('[data-damage]').onclick=()=>{if(effectiveDie(c,a)!==4)c.pending[a]=pending+1;save();renderInitiative();renderDetail()};tile.querySelector('[data-heal]').onclick=()=>{if(c.current[a]!==c.maximum[a])c.current[a]=stepUp(c.current[a],1,c.maximum[a]);save();renderInitiative();renderDetail()};
  if(editMaximums){const s=document.createElement('select');s.className='stat-edit-select';DICE.forEach(d=>s.add(new Option(`d${d}`,String(d),false,d===c.maximum[a])));s.onchange=()=>{const old=c.maximum[a],next=Number(s.value);c.maximum[a]=next;if(idx(c.current[a])>idx(next))c.current[a]=next;else if(c.current[a]===old)c.current[a]=next;c.pending[a]=Math.min(c.pending[a]||0,idx(c.current[a]));save();renderInitiative();renderRoster();renderDetail()};tile.append(s)}return tile}
function renderComposerCharacters(){const s=$('#composerCharacter');const fallback=ui.detailSource==='initiative'?ui.selectedInitiativeId:ui.selectedRosterId;const prior=s.value||fallback||'';s.replaceChildren(new Option(t('Generic / no character'),''));if(state.initiative.length){const group=document.createElement('optgroup');group.label=t('Initiative');state.initiative.forEach(c=>group.append(new Option(c.name,c.id)));s.append(group)}if(state.characters.length){const group=document.createElement('optgroup');group.label=t('Local roster');state.characters.forEach(c=>group.append(new Option(c.name,c.id)));s.append(group)}if([...s.options].some(o=>o.value===prior))s.value=prior;renderComposerWeapons()}
function renderComposerWeapons(){const c=getCharacter($('#composerCharacter').value);const s=$('#composerWeapon');const prior=s.value;s.replaceChildren(new Option(t('Unarmed / generic'),''));(c?.equipment.weapons||[]).forEach((w,i)=>s.add(new Option(w.name,String(i))));if([...s.options].some(o=>o.value===prior))s.value=prior}
function selectedWeapon(){const c=getCharacter($('#composerCharacter').value);const i=Number($('#composerWeapon').value);return c&&$('#composerWeapon').value!==''?c.equipment.weapons[i]:null}
function composerHasAttackShape(glyphs=selectedGlyphData()){return glyphs.some(g=>g.category==='shape'&&g.delivery==='primary-attack')}
function composerHasBaseAttack(){return composerMode==='attack'}
function composerUsesFocus(){return composerMode==='focus'}
function composerAllowsAttackMastery(glyphs=selectedGlyphData()){return composerHasBaseAttack()||composerHasAttackShape(glyphs)}
function composerMeta(){const code=typeof locale==='string'?locale:(globalThis.language||'en');return LOCALES[code]?.composer||{}}
function attackMasteryDisplay(key,field='label'){const glyph=ATTACK_MASTERY_GLYPHS[key],meta=composerMeta().attackMastery?.[key];return meta?.[field]||t(glyph.label)}
function glyphDisplay(glyph,field='label'){const meta=composerMeta().glyphs?.[glyph.id];return meta?.[field]||t(glyph.id==='thunder'&&glyph.category==='source'?'Lightning':glyph.name)}
function randomIncantation(item){const variants=item.incantations?.length?item.incantations:[item.glyph];return variants[Math.floor(Math.random()*variants.length)]}
function composerConflicts(glyphs=selectedGlyphData(),hasBaseAttack=composerHasBaseAttack()){
  const sources=glyphs.filter(g=>g.category==='source'),shapes=glyphs.filter(g=>g.category==='shape');
  return {baseWithShapes:hasBaseAttack&&shapes.length>0,multipleAttackSources:hasBaseAttack&&sources.length>1};
}
function composeActionName(attackMasteryKeys,glyphs,hasBaseAttack,weapon){
  const meta=composerMeta(),sources=glyphs.filter(x=>x.category==='source'),shapes=glyphs.filter(x=>x.category==='shape'),mastery=glyphs.filter(x=>x.category==='mastery');
  if(meta.composeName)return meta.composeName({attackMasteryKeys,glyphs,sources,shapes,mastery,hasBaseAttack,usesFocus:composerUsesFocus(),weapon,attackMasteryDisplay,glyphDisplay,t});
  const parts=attackMasteryKeys.map(k=>attackMasteryDisplay(k,'name'));
  if(hasBaseAttack){parts.push(weapon?t('Weapon Attack ({weapon})',{weapon:t(weapon.name)}):t('Attack'));if(sources.length)parts.push(t('of {sources}',{sources:sources.map(x=>glyphDisplay(x,'sourceName')).join('/')}));parts.push(...glyphs.filter(x=>x.category!=='source').map(x=>glyphDisplay(x,'actionName')))}
  else parts.push(...glyphs.map(x=>glyphDisplay(x,'actionName')));
  return parts.join(' ');
}
function renderMasteryGlyphs(){const root=$('#masteryGlyphGrid');root.replaceChildren();Object.entries(ATTACK_MASTERY_GLYPHS).forEach(([key,glyph])=>{const b=document.createElement('button');b.type='button';b.className='choice-card';b.dataset.key=key;b.dataset.mastery='attack';b.disabled=!composerAllowsAttackMastery()&&!selectedAttackMastery.has(key);b.title=[t('Attack-related Mastery Glyph. Requires a Basic Attack or an attack-like Shaping Glyph.'),...glyph.effects.map(effect=>t(effect)),key==='knockback'?t('On a failed enemy Brace, knock the target back Potential × 5 m. The normal damage chain is unchanged.'):''].filter(Boolean).join(' ');b.setAttribute('aria-pressed',String(selectedAttackMastery.has(key)));b.innerHTML=`<strong>${attackMasteryDisplay(key)}</strong><span>${glyph.glyph} · 1 AP · ${glyph.potential?`+${glyph.potential} ${t('potential')}`:t('multi-target')}</span>`;b.onclick=()=>{selectedAttackMastery.has(key)?selectedAttackMastery.delete(key):selectedAttackMastery.add(key);renderComposer()};root.append(b)});GLYPHS.mastery.forEach(glyph=>{const key=`mastery:${glyph.id}`,b=document.createElement('button');b.type='button';b.className='choice-card';b.dataset.key=key;b.dataset.mastery='general';b.disabled=false;b.title=[t('General Mastery Glyph. It may modify magic, utility, searching, scrying, or another compatible action.'),...glyph.effects.map(effect=>t(effect)),t(glyph.interactions)].filter(Boolean).join(' ');b.setAttribute('aria-pressed',String(selectedGlyphs.has(key)));const energy=glyph.mana?`${glyph.mana} ${t('Mana')}`:glyph.dust?`${glyph.dust} ${t('Dust')}`:t('No energy');b.innerHTML=`<strong>${glyphDisplay({...glyph,category:'mastery'})}</strong><span>${glyph.glyph} · 1 AP · ${energy}</span>`;b.onclick=()=>{selectedGlyphs.has(key)?selectedGlyphs.delete(key):selectedGlyphs.add(key);renderComposer()};root.append(b)})}
function selectedGlyphData(){const out=[];for(const cat of Object.keys(GLYPHS))for(const glyph of GLYPHS[cat])if(selectedGlyphs.has(`${cat}:${glyph.id}`))out.push({...glyph,category:cat});return out}
function renderGlyphs(){const root=$('#glyphCategories');root.replaceChildren();const selected=selectedGlyphData(),conflicts=composerConflicts(selected);for(const [cat,glyphs] of Object.entries(GLYPHS)){if(cat==='mastery')continue;const sec=document.createElement('section');sec.className='glyph-category';const h=document.createElement('h3');h.textContent=t(cat==='source'?'Source Glyphs':cat==='shape'?'Shaping Glyphs':'Mastery Glyphs');const grid=document.createElement('div');grid.className='glyph-grid';glyphs.forEach(glyph=>{const key=`${cat}:${glyph.id}`,b=document.createElement('button');b.type='button';b.className='glyph-button';const isSelected=selectedGlyphs.has(key);const invalid=(conflicts.baseWithShapes&&cat==='shape'&&isSelected)||(conflicts.multipleAttackSources&&cat==='source'&&isSelected);b.classList?.toggle?.('invalid-selection',invalid);b.setAttribute('aria-pressed',String(isSelected));b.innerHTML=`<strong>${glyphDisplay({...glyph,category:cat})}</strong><b>${glyph.glyph}</b><small>${glyph.mana?`${glyph.mana} ${t('Mana')}`:glyph.dust?`${glyph.dust} ${t('Dust')}`:t('No energy')}</small>`;b.title=[...(Array.isArray(glyph.effects)?glyph.effects:Object.values(glyph.effects)),glyph.interactions].map(t).join(' ');b.onclick=()=>{selectedGlyphs.has(key)?selectedGlyphs.delete(key):selectedGlyphs.add(key);renderComposer();renderGlyphs()};grid.append(b)});sec.append(h,grid);root.append(sec)}}
function resolveGlyphComposition(glyphs,hasBaseAttack){
  const sources=glyphs.filter(x=>x.category==='source'),shapes=glyphs.filter(x=>x.category==='shape'),mastery=glyphs.filter(x=>x.category==='mastery');
  const primaries=shapes.filter(x=>x.delivery==='primary-attack'),primary=primaries[0]||null,containers=shapes.filter(x=>x.delivery==='container'||x.delivery==='area');
  const hearing=mastery.find(x=>x.delivery==='mastery-hearing'),diagnostics=[];
  if(primaries.length>1)diagnostics.push(t('Competing primary delivery Shaping Glyphs: {selected}. Tracker ruling: {winner} wins by stable catalog priority; the others modify the endpoint only where their interaction permits.',{selected:primaries.map(x=>glyphDisplay(x)).join(', '),winner:glyphDisplay(primary)}));
  if(shapes.some(x=>['spiral','flat'].includes(x.id))&&shapes.length===1)diagnostics.push(t('{shape} requires another Shaping Glyph to modify.',{shape:glyphDisplay(shapes[0])}));
  if(sources.some(x=>x.id==='echoes')&&glyphs.length===1)diagnostics.push(t('Echoes requires an identifiable earlier spell trace; choose one at the table.'));
  if(hasBaseAttack&&mastery.length)diagnostics.push(t('A Basic Attack carries one Source Glyph as Smite; other Mastery Glyphs do not automatically act through the weapon hit.'));
  let mode='touch';if(hasBaseAttack)mode='smite';else if(primary)mode='attack';else if(containers.length)mode='area';
  let delivery,targets,resolution;
  if(hasBaseAttack){delivery=t('Weapon or unarmed hit carries the selected Source Glyph as Smite.');targets=t('One attack target; weapon range applies.');resolution=t('Roll weapon accuracy. Source Smite is part of that hit.');}
  else if(hearing){delivery=t('The hearing Mastery Glyph delivers the payload through sound.');targets=t('Anything that can hear within audible reach; compatible Shaping Glyphs manifest on each listener.');resolution=t('Targets use area resistance; no spell-accuracy roll unless a carried primary Shaping Glyph specifically attacks one target.');}
  else if(primary){delivery=t('{shape} is the primary delivery: {target}, range {range}.',{shape:glyphDisplay(primary),target:t(primary.target),range:t(primary.range)});targets=containers.length?t('Attack the primary target, then place {areas} at the target or impact point; occupants in those footprints are also affected.',{areas:containers.map(x=>`${glyphDisplay(x)} (${t(x.area)})`).join(', ')}):t('{target}; {area}.',{target:t(primary.target),area:t(primary.area)});resolution=containers.length?t('Roll spell accuracy for the primary target. Other occupants of a manifested area use resistance DC {difficulty} {dc}.',{difficulty:t(CASTING_DIFFICULTIES[Math.min(glyphs.length-1,CASTING_DIFFICULTIES.length-1)].name),dc:CASTING_DIFFICULTIES[Math.min(glyphs.length-1,CASTING_DIFFICULTIES.length-1)].dc}):t('Roll spell accuracy against the primary target’s defense.');}
  else if(containers.length){const difficulty=CASTING_DIFFICULTIES[Math.min(glyphs.length-1,CASTING_DIFFICULTIES.length-1)];delivery=t('Area/container Shaping Glyphs place the payload directly; no attack roll.');targets=containers.map(x=>`${glyphDisplay(x)}: ${t(x.area)}, ${t(x.range)}, ${t(x.duration)}`).join(' · ');resolution=t('Each affected target makes area resistance at {difficulty} {dc}. Resistance difficulty uses total selected Glyph count ({count}), not AP or Mastery Glyph count.',{difficulty:t(difficulty.name),dc:difficulty.dc,count:glyphs.length});}
  else{delivery=t('Somatic touch delivers an unshaped Source Glyph or utility Mastery Glyph.');targets=t('One touched target.');resolution=t('Willing target: no roll. Harmful use follows target defense or resistance as agreed at the table.');}
  if(composerUsesFocus()&&selectedWeapon())diagnostics.push(t('The selected weapon is an arcane focus only; its Accuracy and Impact are ignored.'));
  return {sources,shapes,mastery,primaries,primary,containers,mode,diagnostics,delivery,targets,resolution,hasArea:!!hearing||containers.length>0};
}
function glyphPotentialValue(glyph,mode){
  const spec=glyph.potential||{base:'none'};
  if(spec.byMode&&Object.hasOwn(spec.byMode,mode))return Number(spec.byMode[mode])||0;
  const base=spec.base==='resource'?(glyph.mana||0)+(glyph.dust||0):Number(spec.base)||0;
  return base+(Number(spec.bonus)||0);
}
function glyphPotentialConditions(glyph,mode){return (glyph.potential?.conditional||[]).filter(x=>!x.mode||x.mode===mode)}
function signedPotential(value){return `${value>=0?'+':''}${value}`}

function renderComposer(){renderMasteryGlyphs();const glyphs=selectedGlyphData(),hasAttackShape=composerHasAttackShape(glyphs),hasBaseAttack=composerHasBaseAttack();const resolved=resolveGlyphComposition(glyphs,hasBaseAttack);const c=getCharacter($('#composerCharacter')?.value),selected=selectedWeapon(),weapon=hasBaseAttack?selected:null;const attackMasteryKeys=Object.keys(ATTACK_MASTERY_GLYPHS).filter(k=>selectedAttackMastery.has(k));const invalidMastery=attackMasteryKeys.length>0&&!composerAllowsAttackMastery(glyphs);const conflicts=composerConflicts(glyphs,hasBaseAttack);const validation=[];if(conflicts.baseWithShapes)validation.push(t('Basic Attack cannot be combined with Shaping Glyphs. Choose Use as Focus or remove the Shaping Glyphs.'));if(conflicts.multipleAttackSources)validation.push(t('A Basic Attack can carry only one Source Glyph. Spells may combine multiple Source Glyphs.'));if(invalidMastery)validation.push(t('These Mastery Glyphs need a Basic Attack or an attack-like Shaping Glyph.'));const hasAction=hasBaseAttack||glyphs.length>0;const valid=hasAction&&!invalidMastery&&!conflicts.baseWithShapes&&!conflicts.multipleAttackSources;const isSmite=hasBaseAttack&&resolved.sources.length===1;const glyphAp=glyphs.length-(isSmite?1:0);const ap=(hasBaseAttack?1:0)+attackMasteryKeys.length+glyphAp;const basePotential=hasBaseAttack?BASE_ATTACK_POTENTIAL:0;const mana=glyphs.reduce((sum,x)=>sum+(x.mana||0),0),dust=glyphs.reduce((sum,x)=>sum+(x.dust||0),0);const masteryPotential=attackMasteryKeys.reduce((sum,k)=>sum+ATTACK_MASTERY_GLYPHS[k].potential,0);const glyphPotentialParts=glyphs.map(glyph=>({glyph,value:glyphPotentialValue(glyph,resolved.mode)}));const glyphPotential=glyphPotentialParts.reduce((sum,x)=>sum+x.value,0);const potential=basePotential+masteryPotential+glyphPotential;const conditionalPotentials=glyphPotentialParts.flatMap(part=>glyphPotentialConditions(part.glyph,resolved.mode).map(condition=>({glyph:part.glyph,condition,total:potential-part.value+condition.value,normal:part.value})));
  $('#composerWeapon').disabled=false;const attackButton=$('#includeAttackButton'),focusButton=$('#useFocusButton');attackButton.setAttribute('aria-pressed',String(hasBaseAttack));focusButton.setAttribute('aria-pressed',String(composerUsesFocus()));attackButton.classList.toggle('active',hasBaseAttack);focusButton.classList.toggle('active',composerUsesFocus());attackButton.classList.toggle('invalid-selection',conflicts.baseWithShapes);
  const modeNote=hasBaseAttack?t('Basic Attack uses the selected weapon to hit: weapon Accuracy and Impact apply. One Source Glyph may ride the hit as Smite for Mana but no additional AP.'):t('Use as Focus keeps the weapon in the fiction of the action but ignores its physical Accuracy and Impact.');attackButton.title=modeNote;focusButton.title=modeNote;$('#baseAttackNote').textContent=modeNote;
  const name=composeActionName(attackMasteryKeys,glyphs,hasBaseAttack,selected);$('#actionName').textContent=invalidMastery?t('Choose an attack for these Mastery Glyphs'):name||t('Choose components');const incantation=[...attackMasteryKeys.map(k=>randomIncantation(ATTACK_MASTERY_GLYPHS[k])),...glyphs.map(randomIncantation)].join(' ');$('#actionIncantation').hidden=!valid||!incantation;$('#actionIncantation').textContent=valid&&incantation?incantation:'';
  const validationNode=$('#composerValidation');validationNode.hidden=validation.length===0;validationNode.replaceChildren(...validation.map(x=>{const p=document.createElement('p');p.textContent=x;return p}));const result=$('.composer-result');result?.classList.toggle('invalid',validation.length>0);
  let accuracy='—';if(weapon)accuracy=c?`${weapon.accuracy} d${c.current[weapon.accuracy]}`:weapon.accuracy;else if(hasBaseAttack){const unarmedAttr=c&&idx(c.current.DEX)>idx(c.current.STR)?'DEX':'STR';accuracy=c?`${unarmedAttr} d${c.current[unarmedAttr]}`:t('STR or DEX, whichever is higher')}else if(resolved.primary){const spellAttr=c&&idx(c.current.AUR)>idx(c.current.INT)?'AUR':'INT';accuracy=c?`${spellAttr} d${c.current[spellAttr]}`:t('INT or AUR, whichever is higher')}else if(resolved.hasArea)accuracy=t('Area resistance');
  const potentialMetric=conditionalPotentials.length?`${potential} (${conditionalPotentials.map(x=>`${x.total} ${t(x.condition.label)}`).join(' · ')})`:potential;const metrics=[['AP',valid?ap:'—'],['Potential',valid?potentialMetric:'—'],['Accuracy',valid?accuracy:'—']];$('#actionMetrics').replaceChildren(...metrics.map(([k,v])=>{const d=document.createElement('div');d.className='metric';d.innerHTML=`<span>${t(k)}</span><strong>${v}</strong>`;return d}));
  const effects=[];if(valid&&weapon)effects.push(t('Impact: {value}.',{value:weapon.impact??6}));else if(valid&&hasBaseAttack)effects.push(t('Unarmed attack: no Impact value; use Accuracy and Potential.'));for(const k of valid?attackMasteryKeys:[])effects.push(...ATTACK_MASTERY_GLYPHS[k].effects.map(effect=>t(effect)));if(valid&&selectedAttackMastery.has('dashing'))effects.push(t('Dashing movement: up to {meters} m.',{meters:potential*5}));if(valid&&selectedAttackMastery.has('knockback'))effects.push(t('On a failed enemy Brace, knock the target back {meters} m (Potential × 5). The normal damage chain is unchanged.',{meters:potential*5}));if(valid&&glyphs.length){effects.push(`${t('Resources')}: ${[mana?`${mana} ${t('Mana')}`:'',dust?`${dust} ${t('Dust')}`:''].filter(Boolean).join(' · ')||t('None')}`);const potentialParts=[];if(basePotential)potentialParts.push(`${t('Basic Attack')} ${signedPotential(basePotential)}`);for(const key of attackMasteryKeys){const value=ATTACK_MASTERY_GLYPHS[key].potential;if(value)potentialParts.push(`${attackMasteryDisplay(key)} ${signedPotential(value)}`)}for(const part of glyphPotentialParts)potentialParts.push(`${glyphDisplay(part.glyph)} ${signedPotential(part.value)}`);effects.push(t('Potential breakdown: {parts} = {total}.',{parts:potentialParts.join(' · ')||'0',total:potential}));for(const item of conditionalPotentials)effects.push(t('{condition}: {glyph} contributes {value} potential instead of {normal}; total potential {total}.',{condition:t(item.condition.label),glyph:glyphDisplay(item.glyph),value:signedPotential(item.condition.value),normal:signedPotential(item.normal),total:item.total}));const energy=mana+dust;if(energy>=3){let i=Math.min(energy-3,CASTING_DIFFICULTIES.length-1);if(resolved.mastery.some(x=>x.id==='hold'))i=Math.max(0,i-1);effects.push(`${t('Caster casting check')}: ${t(CASTING_DIFFICULTIES[i].name)} ${CASTING_DIFFICULTIES[i].dc}`)}else effects.push(t('Caster casting check: none (fewer than 3 energy spent).'));if(isSmite)effects.push(t('Source Smite consumes Mana but adds no AP.'))}if(valid&&ap>3)effects.push(t('{turns}-turn action; charge before release.',{turns:Math.ceil(ap/3)}));$('#actionEffects').replaceChildren(...effects.map(x=>{const li=document.createElement('li');li.textContent=x;return li}));
  const setText=(id,text)=>{const node=$(id);if(node)node.textContent=valid?text:'—'};setText('#deliverySummary',resolved.delivery);setText('#targetsSummary',resolved.targets);setText('#resolutionSummary',resolved.resolution);
  const setList=(id,items)=>{const node=$(id);if(node)node.replaceChildren(...items.map(x=>{const li=document.createElement('li');li.textContent=t(x);return li}))};setList('#sourceEffects',valid?resolved.sources.map(x=>`${glyphDisplay(x)}: ${t(x.effects[resolved.mode]||x.effects.touch)} ${t('Duration')}: ${t(x.duration)} ${t('Tracker ruling.')}`):[]);setList('#shapeInteractions',valid?resolved.shapes.map(x=>`${glyphDisplay(x)}: ${t(x.interactions)}`):[]);setList('#masteryEffects',valid?resolved.mastery.flatMap(x=>[...x.effects.map(effect=>`${glyphDisplay(x)}: ${t(effect)}`),`${glyphDisplay(x)} — ${t(x.interactions)}`]):[]);setList('#composerDiagnostics',[...validation,...(valid?resolved.diagnostics:[])]);
}

function setView(view,explicit=true){ui.view=view;if(view==='initiative')ui.detailSource='initiative';if(view==='roster')ui.detailSource='roster';save();syncView(explicit)}
function syncView(explicit=false){
  const mobile=matchMedia('(max-width:760px)').matches;let view=ui.view;
  initiativePane.hidden=view!=='initiative'&&!(view==='detail'&&!mobile&&ui.detailSource==='initiative');
  rosterPane.hidden=view!=='roster'&&!(view==='detail'&&!mobile&&ui.detailSource==='roster');
  detailPane.hidden=!['initiative','roster','detail'].includes(view);
  actionPane.hidden=view!=='action';guidePane.hidden=view!=='guide';
  if(mobile){initiativePane.classList.toggle('mobile-hidden',view!=='initiative');rosterPane.classList.toggle('mobile-hidden',view!=='roster');detailPane.classList.toggle('mobile-hidden',view!=='detail')}else{initiativePane.classList.remove('mobile-hidden');rosterPane.classList.remove('mobile-hidden');detailPane.classList.remove('mobile-hidden')}
  const active=view==='detail'?ui.detailSource:view;document.querySelectorAll('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.view===active));
  const title=view==='action'?'Action Composer':view==='guide'?'Combat Guide':view==='detail'?(getCharacter()?.name||'Character'):view==='roster'?'Roster':'Initiative';$('#headerTitle').textContent=t(title);$('#backToRosterButton').textContent=t(ui.detailSource==='initiative'?'← Initiative':'← Roster');if(explicit)window.scrollTo({top:0,behavior:'auto'});
}

function openCharacterDialog(){const tpl=TEMPLATES[0];populateCreator(tpl);characterDialog.showModal()}
function populateCreator(tpl){$('#newCharacterName').value=tpl.id==='blank'?'':t(tpl.name);$('#newCharacterCount').value='1';const root=$('#newCharacterStats');root.replaceChildren();ATTRIBUTES.forEach((a,i)=>{const s=selectDice(tpl.stats[i]);s.name=a;root.append(equipmentField(a,s))});$('#templateGrid').querySelectorAll('.template-button').forEach(b=>b.classList.toggle('active',b.dataset.id===tpl.id))}
function renderTemplates(){const root=$('#templateGrid');root.replaceChildren(...TEMPLATES.map(tpl=>{const b=document.createElement('button');b.type='button';b.className='template-button';b.dataset.id=tpl.id;b.innerHTML=`<strong>${t(tpl.name)}</strong><span>${tpl.stats.map(x=>`d${x}`).join(' · ')}</span>`;b.onclick=()=>populateCreator(tpl);return b}))}

$('#addButton').onclick=()=>{setView('roster',false);openCharacterDialog()};$('#rosterAddButton').onclick=openCharacterDialog;$('#openRosterButton').onclick=()=>setView('roster',true);$('#cancelCharacterButton').onclick=()=>characterDialog.close();
$('#characterForm').addEventListener('submit',e=>{e.preventDefault();const base=$('#newCharacterName').value.trim()||t('Character');const count=Math.min(20,Math.max(1,Number($('#newCharacterCount').value)||1));const maximum={};ATTRIBUTES.forEach(a=>maximum[a]=Number(e.target.elements[a].value));let first=null;for(let i=0;i<count;i++){const name=count>1?`${base} ${i+1}`:base;const c=normalizeCharacter({name,initiative:0,maximum,current:{...maximum},pending:{},equipment:newEquipment()});state.characters.push(c);first??=c}if(first){ui.selectedRosterId=first.id;ui.detailSource='roster'}save();characterDialog.close();renderAll()});
$('#sortInitiativeButton').onclick=()=>{ui.sortInitiative=!ui.sortInitiative;save();$('#sortInitiativeButton').textContent=t(ui.sortInitiative?'Use added order':'Sort initiative');renderInitiative()};
$('#endRoundButton').onclick=()=>{if(!state.initiative.some(hasPending))return;if(!confirm(t('Apply all pending wounds?')))return;state.initiative.forEach(c=>ATTRIBUTES.forEach(a=>{c.current[a]=stepDown(c.current[a],c.pending[a]||0);c.pending[a]=0}));save();renderAll()};
$('#backToRosterButton').onclick=()=>setView(ui.detailSource==='initiative'?'initiative':'roster',true);$('#detailEndRoundButton').onclick=()=>$('#endRoundButton').click();$('#fullHpButton').onclick=()=>{const c=getCharacter();if(!c||ui.detailSource!=='initiative'||!confirm(t('Reset to full HP, clear pending wounds, and remove death? This is a GM override, not a rest.')))return;ATTRIBUTES.forEach(a=>{c.current[a]=c.maximum[a];c.pending[a]=0});c.dead=false;save();renderAll()};
$('#toggleStatEditButton').onclick=()=>{editMaximums=!editMaximums;renderDetail()};
$('#addWeaponButton').onclick=()=>{const c=getCharacter();if(!c)return;c.equipment.weapons.push({name:t('Weapon'),weaponClass:'light',accuracy:'STR',impact:6,equipped:true});save();renderDetail();renderComposerCharacters()};
$('#addShieldButton').onclick=()=>{const c=getCharacter();if(!c)return;c.equipment.shields.push({name:t('Shield'),equipped:true});save();renderDetail()};
$('#addArmorButton').onclick=()=>{const c=getCharacter();if(!c)return;c.equipment.plating.push({type:'medium',equipped:true});save();renderDetail()};
$('#deleteCharacterButton').onclick=()=>ui.detailSource==='initiative'?removeFromInitiative(getCharacter()):removeRosterCharacter(getCharacter());
$('#composerCharacter').onchange=()=>{renderComposerWeapons();renderComposer()};$('#composerWeapon').onchange=renderComposer;$('#includeAttackButton').onclick=()=>{composerMode='attack';renderComposer();renderGlyphs()};$('#useFocusButton').onclick=()=>{composerMode='focus';renderComposer();renderGlyphs()};$('#clearComposerButton').onclick=()=>{selectedAttackMastery.clear();selectedGlyphs.clear();renderGlyphs();renderComposer()};$('#clearGlyphsButton').onclick=()=>{selectedGlyphs.clear();renderGlyphs();renderComposer()};
document.querySelectorAll('.nav-button').forEach(b=>b.onclick=()=>setView(b.dataset.view,true));localeSelect.onchange=()=>{locale=localeSelect.value;localStorage.setItem(LOCALE_KEY,locale);applyLocale();renderTemplates();renderGlyphs()};
matchMedia('(max-width:760px)').addEventListener('change',()=>syncView(false));

captureLocale(document.documentElement);localeSelect.value=locale;applyLocale();renderTemplates();renderGlyphs();renderAll(false);
