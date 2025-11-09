'use strict';

const STORAGE_KEY = 'sigilrpg-stat-tracker-v1';
const UI_KEY = 'sigilrpg-ui-v2';
const LOCALE_KEY = 'sigilrpg-locale-v1';
const ATTRIBUTES = ['STR','DEX','CON','INT','SEN','AUR'];
const DICE = [4,6,8,10,12,20,100];
const LOCALES = window.SIGILRPG_LOCALES || {en:{label:'English',htmlLang:'en',strings:{}}};
const PREFIXES = {
  power:{label:'Power',potential:1,effects:['Accuracy die increases by one tier.']},
  precision:{label:'Precision',potential:1,effects:['Gain advantage on the accuracy roll.','One attribute may be wounded twice by this attack.']},
  dashing:{label:'Dashing',potential:1,effects:[]},
  sweep:{label:'Sweep',potential:0,effects:['Apply the attack against multiple targets.','Sweep does not increase damage potential.']}
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

const WORDS = {
  source:[
    {id:'thunder',name:'Thunder & Lightning',word:'Baguaga',mana:1,effect:'Conjures thunder, lightning, and electrical force.'},
    {id:'vital',name:'Vital Energy',word:'Habaga',mana:1,effect:'Restores life or, when inverted, drains and harms it.'},
    {id:'force',name:'Force',word:'Tyś',mana:1,effect:'Conjures physical impact, momentum, and pressure.'},
    {id:'fire',name:'Fire',word:'Firanka',mana:1,effect:'Conjures flame and heat.'},
    {id:'frost',name:'Frost',word:'Zhorna',mana:1,effect:'Conjures cold, ice, and the removal of heat.'},
    {id:'echoes',name:'Echoes',word:'Berevri',mana:1,effect:'Calls on lingering energy from an earlier spell.'},
    {id:'shadow',name:'Shadow & Darkness',word:'Ferpshna',mana:1,effect:'Conjures darkness and obscuring shadow.'},
    {id:'light',name:'Light & Radiance',word:'Gripshna',mana:1,effect:'Conjures illumination and radiant energy.'},
    {id:'poison',name:'Poison',word:'Vyrnaka',mana:1,effect:'Conjures venomous or contaminating energy.'},
    {id:'fear',name:'Fear',word:'Ghazur',mana:1,effect:'Conjures supernatural dread.'},
    {id:'water',name:'Water',word:'Tugatuga',mana:1,effect:'Conjures or controls water.'},
    {id:'speed',name:'Speed',word:'Dobenga',mana:1,effect:'Conjures acceleration and rapid motion.'},
    {id:'levitate',name:'Levitation',word:'Harnharn',mana:1,effect:'Conjures upward force and weightlessness.'},
    {id:'stone',name:'Stone',word:'Kafelka',mana:1,effect:'Conjures or controls earth and stone.'}
  ],
  shape:[
    {id:'pillar',name:'Pillar',word:'Ghyblor',mana:1,effect:'Suggested: a 1 m-wide, 5 m-tall column within 20 m; lasts one round.'},
    {id:'bolt',name:'Bolt',word:'Dziahaka',mana:1,attackLike:true,effect:'Attack-like: launch the spell at one target within 30 m.'},
    {id:'vortex',name:'Vortex',word:'Kashanka',mana:1,effect:'Suggested: a 5 m-radius rotating field within 20 m; lasts one round.'},
    {id:'hammer',name:'Hammer',word:'Baluuga',mana:1,attackLike:true,effect:'Attack-like: a heavy blow within 10 m that can push or stagger.'},
    {id:'strike',name:'Strike',word:'Hypsh',mana:1,attackLike:true,effect:'Attack-like: deliver the spell through a melee or touch attack.'},
    {id:'slash',name:'Slash',word:'Yyś',mana:1,attackLike:true,effect:'Attack-like: cut through a 10 m line up to 1 m wide.'},
    {id:'snake',name:'Snake',word:'Sneila',mana:1,attackLike:true,effect:'Attack-like: a winding effect that can bend around simple cover within 30 m.'},
    {id:'knockdown',name:'Knockdown / Pindown',word:'Kuva',mana:1,effect:'Force a target within 20 m down; continued pressure may pin it.'},
    {id:'chains',name:'Chains / Restrain',word:'Thryka',mana:1,effect:'Bind a target within 20 m until it breaks free or the effect ends.'},
    {id:'barrier',name:'Barrier / Shield',word:'Oshvar',mana:1,effect:'Suggested: a 3 m by 3 m defensive plane within 20 m; lasts one round.'},
    {id:'siphon',name:'Siphon / Drain',word:'Drynok',mana:1,attackLike:true,effect:'Attack-like: draw the Source energy from a target within 10 m toward the caster.'},
    {id:'construct',name:'Construct / Frame',word:'Peyoz',mana:1,effect:'Suggested: form a simple object fitting within a 2 m cube for one minute.'},
    {id:'heart',name:'Heart / Center',word:'Hordum',mana:1,effect:'Give the spell a stable center that other Shapes can orbit or emanate from.'},
    {id:'illusion',name:'Illusion / Veil',word:'Lorynka',mana:1,effect:'Suggested: alter sight and sound in a 5 m cube within 20 m for one minute.'},
    {id:'wings',name:'Wings / Flight',word:'Chyvra',mana:1,effect:'Suggested: grant flight at base movement speed for one round.'},
    {id:'shatter',name:'Shatter',word:'Talgru',mana:1,attackLike:true,effect:'Attack-like: tear apart a target within 20 m; especially effective against objects and constructs.'},
    {id:'howling',name:'Howling',word:'Galish',mana:1,effect:'Suggested: release the spell through a 10 m cone of sound or pressure.'},
    {id:'open',name:'Open',word:'Alhora',mana:1,effect:'Open, unfold, or create an aperture in a valid target within 10 m.'},
    {id:'spiral',name:'Spiral',word:'Panteka',mana:1,effect:'Twist another Shape into a spiral, orbit, or higher-dimensional path.'},
    {id:'cave',name:'Cave / Burrow',word:'Bûnkra',mana:1,effect:'Suggested: excavate or shape a passage 2 m long and 2 m wide.'},
    {id:'flat',name:'Flat',word:'Regal',mana:1,effect:'Flatten another Shape into a plane, surface, wall, or floor.'}
  ],
  mastery:[
    {id:'negation',name:'Negation',word:'Nushik',mana:1,effect:'Invert, suppress, or cancel the selected Source or Shape where fiction permits.'},
    {id:'power',name:'Power Word',word:'Dovinus',dust:1,effect:'Make the spell verbal-only, deliver it through hearing, and raise its power die one tier.'},
    {id:'focus',name:'Focus Word',word:'Balrurg',dust:1,effect:'Gain advantage on the Spell Casting Check.'},
    {id:'enhancement',name:'Enhancement',word:'Mabufa',mana:1,effect:'Transfer 1 Mana or raise one target attribute by one die tier.'},
    {id:'ascended',name:'Ascended Energy',word:'Divinarius',dust:1,effect:'Raise the spell’s guaranteed degree of success by one tier.'},
    {id:'hold',name:'Hold Still',word:'Kurwa',effect:'Stabilize a charged spell; reduce its Casting Difficulty by one tier.'},
    {id:'show',name:'Show Me',word:'Gabbergûbber',dust:1,effect:'Reveal a simple vision; three uses can reveal a Vision of the World.'},
    {id:'multiplier',name:'Multiplier',word:'Tigiba',dust:1,effect:'Repeat or multiply one compatible part of the spell; exact scaling is a table ruling.'}
  ]
};
const CASTING_DIFFICULTIES=[{name:'Easy',dc:4},{name:'Advanced',dc:6},{name:'Hard',dc:8},{name:'Very Hard',dc:10},{name:'Improbable',dc:12},{name:'Inconceivable',dc:20},{name:'Impossible',dc:100}];

let locale=loadLocale();
let state=loadState();
let ui=loadUi();
let selectedPrefixes=new Set();
let selectedWords=new Set();
let includesBaseAttack=true;
let editMaximums=false;
let quickEditor=null;
const staticText=[]; const staticAttrs=[];

const $=s=>document.querySelector(s);
const rosterPane=$('#rosterPane'),detailPane=$('#detailPane'),actionPane=$('#actionPane'),guidePane=$('#guidePane');
const rosterList=$('#rosterList'),emptyRoster=$('#emptyRoster'),detailContent=$('#detailContent'),detailEmpty=$('#detailEmpty');
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
function newEquipment(){return {weapons:structuredClone(DEFAULT_WEAPONS),plating:[{type:'medium',equipped:true}]}}
function normalizeCharacter(c){
  const maximum={},current={},pending={};
  ATTRIBUTES.forEach(a=>{maximum[a]=DICE.includes(Number(c.maximum?.[a]))?Number(c.maximum[a]):4;current[a]=DICE.includes(Number(c.current?.[a]))?Number(c.current[a]):maximum[a];current[a]=Math.min(current[a],maximum[a]);pending[a]=Math.min(idx(current[a]),Math.max(0,Math.floor(Number(c.pending?.[a])||0)))});
  return {id:c.id||crypto.randomUUID(),name:c.name||t('Character'),initiative:Number(c.initiative)||0,maximum,current,pending,dead:c.dead===true,equipment:c.equipment||newEquipment()};
}
function loadState(){try{const p=JSON.parse(localStorage.getItem(STORAGE_KEY));if(p?.characters)return {characters:p.characters.map(normalizeCharacter)}}catch(e){console.warn(e)}return {characters:[]}}
function loadUi(){try{return {...{view:'roster',selectedId:null,sortInitiative:false},...JSON.parse(localStorage.getItem(UI_KEY))}}catch{return {view:'roster',selectedId:null,sortInitiative:false}}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));localStorage.setItem(UI_KEY,JSON.stringify(ui))}
function getCharacter(id=ui.selectedId){return state.characters.find(c=>c.id===id)||null}
function displayCharacters(){const list=[...state.characters];if(ui.sortInitiative)list.sort((a,b)=>b.initiative-a.initiative||a.name.localeCompare(b.name));return list}

function renderAll(preserve=true){renderRoster();renderDetail();renderComposerCharacters();renderComposer();syncView(false);if(!preserve)return}
function renderRoster(){
  rosterList.replaceChildren();emptyRoster.hidden=state.characters.length>0;
  if(state.characters.length){const labels=document.createElement('div');labels.className='roster-labels';labels.innerHTML=`<span>${t('Init')}</span><span>${t('Character')}</span>${ATTRIBUTES.map(a=>`<span>${a}</span>`).join('')}`;rosterList.append(labels)}
  for(const c of displayCharacters())rosterList.append(renderRosterRow(c));
  const pending=state.characters.reduce((s,c)=>s+ATTRIBUTES.reduce((x,a)=>x+(c.pending[a]||0),0),0);
  $('#roundSummary').textContent=pending?t('{count} pending wounds will apply at round end.',{count:pending}):t('No pending wounds.');
  $('#endRoundButton').disabled=pending===0;
}
function renderRosterRow(c){
  const row=document.createElement('div');row.className='roster-row'+(c.id===ui.selectedId?' selected':'');row.dataset.id=c.id;
  const init=document.createElement('div');init.className='initiative-box';const input=document.createElement('input');input.type='number';input.value=c.initiative;input.setAttribute('aria-label',t('{name} initiative',{name:c.name}));input.addEventListener('click',e=>e.stopPropagation());input.addEventListener('change',()=>{c.initiative=Number(input.value)||0;save();if(ui.sortInitiative)renderRoster()});init.append(input);
  const name=document.createElement('div');name.className='roster-name';name.innerHTML=`<div class="roster-name-line"><strong></strong><button type="button" class="roster-remove" aria-label="${t('Remove from roster')}">×</button></div><span></span>`;name.querySelector('strong').textContent=c.name;name.querySelector('span').textContent=`${currentHp(c)}/${maxHp(c)} HP · ${healthStatus(c)}${hasPending(c)?` · ${t('pending')}`:''}`;
  name.querySelector('.roster-remove').onclick=e=>{e.stopPropagation();removeCharacter(c)};
  row.append(init,name);
  ATTRIBUTES.forEach(a=>{const b=document.createElement('button');b.type='button';b.className='quick-die';if(c.current[a]!==c.maximum[a])b.classList.add('wounded');if(c.pending[a])b.classList.add('pending');if(effectiveDie(c,a)===4)b.classList.add('at-floor');b.innerHTML=`<strong>d${c.current[a]}</strong><small>${c.pending[a]?`→ d${effectiveDie(c,a)}`:a}</small>`;b.setAttribute('aria-label',t('Edit {attribute} for {name}',{attribute:a,name:c.name}));b.addEventListener('click',e=>{e.stopPropagation();openQuickEditor(b,c,a)});row.append(b)});
  row.addEventListener('click',()=>selectCharacter(c.id,true));return row;
}
function openQuickEditor(anchor,c,a){closeQuickEditor();const box=document.createElement('div');box.className='quick-editor';box.innerHTML=`<button type="button" data-op="heal">${t('HEAL')}</button><div><small>${a}</small><strong>d${c.current[a]}</strong><span>${c.pending[a]?`${t('pending')} → d${effectiveDie(c,a)}`:t('current')}</span></div><button type="button" data-op="damage">${t('DMG')}</button>`;document.body.append(box);const r=anchor.getBoundingClientRect();const br=box.getBoundingClientRect();box.style.left=`${Math.max(8,Math.min(innerWidth-br.width-8,r.left+r.width/2-br.width/2))}px`;box.style.top=`${Math.max(8,r.top-br.height-6)}px`;
  const damage=box.querySelector('[data-op="damage"]'),heal=box.querySelector('[data-op="heal"]');damage.disabled=c.dead||effectiveDie(c,a)===4;heal.disabled=c.dead||c.current[a]===c.maximum[a];
  damage.onclick=e=>{e.stopPropagation();if(effectiveDie(c,a)!==4)c.pending[a]=(c.pending[a]||0)+1;save();renderRoster();renderDetail();closeQuickEditor()};
  heal.onclick=e=>{e.stopPropagation();if(c.current[a]!==c.maximum[a])c.current[a]=stepUp(c.current[a],1,c.maximum[a]);save();renderRoster();renderDetail();closeQuickEditor()};quickEditor=box;
}
function closeQuickEditor(){quickEditor?.remove();quickEditor=null}
document.addEventListener('pointerdown',e=>{if(quickEditor&&!quickEditor.contains(e.target))closeQuickEditor()});

function selectCharacter(id,explicit=false){ui.selectedId=id;save();renderRoster();renderDetail();renderComposerCharacters();if(explicit&&matchMedia('(max-width:760px)').matches){setView('detail',true)}}
function renderDetail(){
  const c=getCharacter();detailEmpty.hidden=!!c;detailContent.hidden=!c;if(!c)return;
  const nameInput=$('#detailNameInput');nameInput.value=c.name;nameInput.onchange=()=>{c.name=nameInput.value.trim()||t('Character');nameInput.value=c.name;save();renderRoster();renderComposerCharacters();syncView(false)};
  $('#detailMeta').textContent=`${currentHp(c)} / ${maxHp(c)} HP · ${healthStatus(c)}`;
    $('#damageHelperButton').disabled=c.dead;
  const initInput=$('#detailInitiativeInput');initInput.value=c.initiative;initInput.onchange=()=>{c.initiative=Number(initInput.value)||0;save();renderRoster()};
  $('#detailEndRoundButton').disabled=!state.characters.some(hasPending);
  const stats=$('#detailStats');stats.replaceChildren();ATTRIBUTES.forEach(a=>stats.append(renderStatTile(c,a)));
  renderProfile(c);renderEquipment(c);$('#toggleStatEditButton').textContent=editMaximums?t('Done editing'):t('Edit maximums');
}
function renderStatTile(c,a){const tile=document.createElement('div');tile.className='stat-tile';const pending=c.pending[a]||0;tile.innerHTML=`<span class="stat-name">${a}</span><strong class="stat-die">d${c.current[a]}</strong><span class="stat-max">${pending?`${t('pending')} → d${effectiveDie(c,a)}`:`${t('max')} d${c.maximum[a]}`}</span><div class="stat-controls"><button type="button" data-heal>${t('HEAL')}</button><button type="button" data-damage>${t('DMG')}</button></div>`;
  tile.querySelector('[data-damage]').disabled=c.dead||effectiveDie(c,a)===4;tile.querySelector('[data-heal]').disabled=c.dead||c.current[a]===c.maximum[a];
  tile.querySelector('[data-damage]').onclick=()=>{if(effectiveDie(c,a)!==4)c.pending[a]=pending+1;save();renderRoster();renderDetail()};
  tile.querySelector('[data-heal]').onclick=()=>{if(c.current[a]!==c.maximum[a])c.current[a]=stepUp(c.current[a],1,c.maximum[a]);save();renderRoster();renderDetail()};
  if(editMaximums){const s=document.createElement('select');s.className='stat-edit-select';DICE.forEach(d=>s.add(new Option(`d${d}`,String(d),false,d===c.maximum[a])));s.onchange=()=>{const old=c.maximum[a],next=Number(s.value);c.maximum[a]=next;if(idx(c.current[a])>idx(next))c.current[a]=next;else if(c.current[a]===old)c.current[a]=next;c.pending[a]=Math.min(c.pending[a]||0,idx(c.current[a]));save();renderRoster();renderDetail()};tile.append(s)}return tile}
function platingProfile(c){const items=(c.equipment.plating||[]).filter(x=>x.equipped!==false).map(x=>PLATING_TYPES[x.type]||PLATING_TYPES.medium);if(!items.length)return {braceGuarantee:0,dodgeLimit:0};return {braceGuarantee:Math.max(...items.map(x=>x.braceGuarantee)),dodgeLimit:Math.min(...items.map(x=>x.dodgeLimit))}}
function primaryWeapon(c){return (c.equipment.weapons||[]).find(x=>x.equipped!==false)||null}
function renderProfile(c){const p=platingProfile(c),w=primaryWeapon(c);const cards=[['HP',`${currentHp(c)}/${maxHp(c)}`,hasPending(c)?t('Pending wounds queued'):t('Stable')],['Brace guarantee',p.braceGuarantee||'—',t('Highest equipped guarantee')],['Dodge limit',p.dodgeLimit||'—',t('Lowest equipped limit')],['Weapon impact',w?w.impact||0:'—',w?t(w.name):t('No weapon')]];const root=$('#combatProfile');root.replaceChildren(...cards.map(([label,value,note])=>{const d=document.createElement('div');d.className='profile-card';d.innerHTML=`<span>${t(label)}</span><strong>${value}</strong><small>${note}</small>`;return d}))}
function renderEquipment(c){const root=$('#equipmentList');root.replaceChildren();(c.equipment.weapons||[]).forEach((w,i)=>root.append(renderWeapon(c,w,i)));(c.equipment.plating||[]).forEach((p,i)=>root.append(renderPlating(c,p,i)))}
function equipmentField(label,control,wide=false){const l=document.createElement('label');l.className='field-label'+(wide?' wide-field':'');const s=document.createElement('span');s.textContent=t(label);l.append(s,control);return l}
function selectDice(value){const s=document.createElement('select');DICE.forEach(d=>s.add(new Option(`d${d}`,String(d),false,d===Number(value))));return s}
function renderWeapon(c,w,i){const card=document.createElement('article');card.className='equipment-card';const head=document.createElement('header');const title=document.createElement('strong');title.textContent=t('Weapon');const remove=document.createElement('button');remove.type='button';remove.className='remove-equipment';remove.textContent='×';remove.setAttribute('aria-label',t('Remove weapon'));remove.onclick=()=>{c.equipment.weapons.splice(i,1);save();renderDetail();renderComposerCharacters();renderComposer()};head.append(title,remove);const fields=document.createElement('div');fields.className='equipment-fields';
  const name=document.createElement('input');name.value=w.name;name.onchange=()=>{w.name=name.value.trim()||t('Weapon');save();renderDetail();renderComposerCharacters()};
  const weaponClass=document.createElement('select');Object.entries(WEAPON_CLASSES).forEach(([key,def])=>weaponClass.add(new Option(t(def.label),key,false,key===(w.weaponClass||'light'))));weaponClass.onchange=()=>{w.weaponClass=weaponClass.value;const opts=WEAPON_CLASSES[w.weaponClass].accuracyOptions;if(!opts.includes(w.accuracy))w.accuracy=opts[0];save();renderDetail();renderComposer()};
  const acc=document.createElement('select');WEAPON_CLASSES[w.weaponClass||'light'].accuracyOptions.forEach(a=>acc.add(new Option(a,a,false,a===w.accuracy)));acc.onchange=()=>{w.accuracy=acc.value;save();renderProfile(c);renderComposer()};
  const impact=document.createElement('input');impact.type='number';impact.min='0';impact.max='30';impact.value=w.impact??6;impact.onchange=()=>{w.impact=Math.max(0,Number(impact.value)||0);save();renderProfile(c);renderComposer()};
  fields.append(equipmentField('Name',name,true),equipmentField('Class',weaponClass),equipmentField('Accuracy',acc),equipmentField('Impact',impact));card.append(head,fields);return card}
function renderPlating(c,p,i){const card=document.createElement('article');card.className='equipment-card';const head=document.createElement('header');const title=document.createElement('strong');title.textContent=t('Plating');const remove=document.createElement('button');remove.type='button';remove.className='remove-equipment';remove.textContent='×';remove.setAttribute('aria-label',t('Remove plating'));remove.onclick=()=>{c.equipment.plating.splice(i,1);save();renderDetail()};head.append(title,remove);const fields=document.createElement('div');fields.className='equipment-fields';
  const type=document.createElement('select');Object.entries(PLATING_TYPES).forEach(([key,def])=>type.add(new Option(t(def.label),key,false,key===(p.type||'medium'))));type.onchange=()=>{p.type=type.value;save();renderDetail()};
  const stats=PLATING_TYPES[p.type]||PLATING_TYPES.medium;
  const brace=document.createElement('input');brace.value=String(stats.braceGuarantee);brace.disabled=true;
  const dodge=document.createElement('input');dodge.value=String(stats.dodgeLimit);dodge.disabled=true;
  fields.append(equipmentField('Type',type,true),equipmentField('Brace guarantee',brace),equipmentField('Dodge limit',dodge));card.append(head,fields);return card}

function renderComposerCharacters(){const s=$('#composerCharacter');const prior=s.value||ui.selectedId||'';s.replaceChildren(new Option(t('Generic / no character'),''));state.characters.forEach(c=>s.add(new Option(c.name,c.id,false,c.id===prior)));if([...s.options].some(o=>o.value===prior))s.value=prior;renderComposerWeapons()}
function renderComposerWeapons(){const c=getCharacter($('#composerCharacter').value);const s=$('#composerWeapon');const prior=s.value;s.replaceChildren(new Option(t('Unarmed / generic'),''));(c?.equipment.weapons||[]).forEach((w,i)=>s.add(new Option(w.name,String(i))));if([...s.options].some(o=>o.value===prior))s.value=prior}
function selectedWeapon(){const c=getCharacter($('#composerCharacter').value);const i=Number($('#composerWeapon').value);return c&&$('#composerWeapon').value!==''?c.equipment.weapons[i]:null}
function composerAllowsPrefixes(){return includesBaseAttack||selectedWordData().some(w=>w.category==='shape'&&w.attackLike)}
function renderPrefixes(){const root=$('#prefixGrid');root.replaceChildren();Object.entries(PREFIXES).forEach(([key,p])=>{const b=document.createElement('button');b.type='button';b.className='choice-card';b.dataset.key=key;b.disabled=!composerAllowsPrefixes()&&!selectedPrefixes.has(key);b.title=t('Prefixes modify a Base Attack or an attack-like Shape.');b.setAttribute('aria-pressed',String(selectedPrefixes.has(key)));b.innerHTML=`<strong>${t(p.label)}</strong><span>1 AP · ${p.potential?`+${p.potential} ${t('potential')}`:t('multi-target')}</span>`;b.onclick=()=>{selectedPrefixes.has(key)?selectedPrefixes.delete(key):selectedPrefixes.add(key);renderComposer()};root.append(b)})}
function selectedWordData(){const out=[];for(const cat of Object.keys(WORDS))for(const w of WORDS[cat])if(selectedWords.has(`${cat}:${w.id}`))out.push({...w,category:cat});return out}
function renderWords(){const root=$('#wordCategories');root.replaceChildren();for(const [cat,words] of Object.entries(WORDS)){const sec=document.createElement('section');sec.className='word-category';const h=document.createElement('h3');h.textContent=t(cat==='source'?'Sources':cat==='shape'?'Shapes':'Mastery');const grid=document.createElement('div');grid.className='word-grid';words.forEach(w=>{const key=`${cat}:${w.id}`,b=document.createElement('button');b.type='button';b.className='word-button';b.setAttribute('aria-pressed',String(selectedWords.has(key)));b.innerHTML=`<strong>${t(w.name)}</strong><b>${w.word}</b><small>${w.mana?`${w.mana} ${t('Mana')}`:w.dust?`${w.dust} ${t('Dust')}`:''}</small>`;b.title=t(w.effect);b.onclick=()=>{selectedWords.has(key)?selectedWords.delete(key):selectedWords.add(key);renderComposer();renderWords()};grid.append(b)});sec.append(h,grid);root.append(sec)}}
function renderComposer(){renderPrefixes();const c=getCharacter($('#composerCharacter')?.value),w=includesBaseAttack?selectedWeapon():null,words=selectedWordData();const prefixKeys=[...selectedPrefixes];const invalidPrefixes=prefixKeys.length>0&&!composerAllowsPrefixes();const hasAction=includesBaseAttack||words.length>0;const valid=hasAction&&!invalidPrefixes;const isSmite=includesBaseAttack&&words.length===1&&words[0].category==='source';const wordAp=words.length-(isSmite?1:0);const ap=(includesBaseAttack?1:0)+prefixKeys.length+wordAp;const basePotential=includesBaseAttack?BASE_ATTACK_POTENTIAL:0;const wordPotential=words.filter(x=>x.category==='source'||x.category==='shape').length;const prefixPotential=prefixKeys.reduce((s,k)=>s+PREFIXES[k].potential,0);const potential=basePotential+wordPotential+prefixPotential;const mana=words.reduce((s,x)=>s+(x.mana||0),0),dust=words.reduce((s,x)=>s+(x.dust||0),0);
  $('#composerWeapon').disabled=!includesBaseAttack;$('#includeAttackButton').setAttribute('aria-pressed',String(includesBaseAttack));$('#includeAttackButton').classList.toggle('active',includesBaseAttack);
  const parts=[];if(includesBaseAttack){const p=prefixKeys.map(k=>t(PREFIXES[k].label)).join(' ');parts.push(`${p}${p?' ':''}${w?t(w.name):t('Attack')}`)}if(words.length)parts.push([!includesBaseAttack?prefixKeys.map(k=>t(PREFIXES[k].label)).join(' '):'',words.map(x=>x.word).join(' ')].filter(Boolean).join(' '));$('#actionName').textContent=invalidPrefixes?t('Choose an attack for these prefixes'):parts.join(' · ')||t('Choose components');
  let accuracy='—';
  if(w){accuracy=c?`${w.accuracy} d${c.current[w.accuracy]}`:w.accuracy}
  else if(!includesBaseAttack&&words.length){const spellAttr=c&&idx(c.current.AUR)>idx(c.current.INT)?'AUR':'INT';accuracy=c?`${spellAttr} d${c.current[spellAttr]}`:t('INT or AUR, whichever is higher')}
  const metrics=[['AP',valid?ap:'—'],['Potential',valid?potential:'—'],['Accuracy',valid?accuracy:'—']];$('#actionMetrics').replaceChildren(...metrics.map(([k,v])=>{const d=document.createElement('div');d.className='metric';d.innerHTML=`<span>${t(k)}</span><strong>${v}</strong>`;return d}));
  const effects=[];if(invalidPrefixes)effects.push(t('Prefixes need a Base Attack or an attack-like Shape. Add one, or remove the prefixes; no totals are shown until then.'));if(valid&&w)effects.push(t('Impact: {value}.',{value:w.impact??6}));for(const k of valid?prefixKeys:[])effects.push(...PREFIXES[k].effects.map(effect=>t(effect)));if(valid&&selectedPrefixes.has('dashing'))effects.push(t('Dashing movement: up to {meters} m.',{meters:potential*5}));if(valid&&words.length){effects.push(`${t('Resources')}: ${[mana?`${mana} ${t('Mana')}`:'',dust?`${dust} ${t('Dust')}`:''].filter(Boolean).join(' · ')||t('None')}`);if(words.length>=2){let i=Math.min(words.length-2,CASTING_DIFFICULTIES.length-1);if(words.some(x=>x.category==='mastery'&&x.id==='hold'))i=Math.max(0,i-1);effects.push(`${t('Casting difficulty')}: ${t(CASTING_DIFFICULTIES[i].name)} ${CASTING_DIFFICULTIES[i].dc}`)}if(isSmite)effects.push(t('Source Smite costs Mana but no additional AP.'))}if(valid&&ap>3)effects.push(t('{turns}-turn action; charge before release.',{turns:Math.ceil(ap/3)}));
  $('#actionEffects').replaceChildren(...effects.map(x=>{const li=document.createElement('li');li.textContent=x;return li}));
}

function setView(view,explicit=true){ui.view=view;save();syncView(explicit)}
function syncView(explicit=false){const mobile=matchMedia('(max-width:760px)').matches;const single=state.characters.length===1;let view=ui.view==='detail'?'detail':ui.view;if(mobile&&single&&view==='roster')view='detail';rosterPane.hidden=view!=='roster'&&!(view==='detail'&&!mobile);detailPane.hidden=view!=='detail'&&view!=='roster';actionPane.hidden=view!=='action';guidePane.hidden=view!=='guide';document.body.classList.toggle('single-character',single);if(mobile){rosterPane.classList.toggle('mobile-hidden',view!=='roster');detailPane.classList.toggle('mobile-hidden',view!=='detail')}else{rosterPane.classList.remove('mobile-hidden');detailPane.classList.remove('mobile-hidden')}
  document.querySelectorAll('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.view===((view==='detail'||(single&&ui.view==='roster'))?'roster':view)));$('#headerTitle').textContent=t(view==='action'?'Action Composer':view==='guide'?'Combat Guide':view==='detail'?(getCharacter()?.name||'Character'):'Roster');if(explicit)window.scrollTo({top:0,behavior:'auto'})}

function removeCharacter(c){if(!c||!confirm(t('Remove {name} from roster?',{name:c.name})))return;state.characters=state.characters.filter(x=>x.id!==c.id);if(ui.selectedId===c.id)ui.selectedId=state.characters[0]?.id||null;if(!state.characters.length)ui.view='roster';save();renderAll();}
function openCharacterDialog(){const tpl=TEMPLATES[0];populateCreator(tpl);characterDialog.showModal()}
function populateCreator(tpl){$('#newCharacterName').value=tpl.id==='blank'?'':t(tpl.name);$('#newCharacterCount').value='1';const root=$('#newCharacterStats');root.replaceChildren();ATTRIBUTES.forEach((a,i)=>{const s=selectDice(tpl.stats[i]);s.name=a;root.append(equipmentField(a,s))});$('#templateGrid').querySelectorAll('.template-button').forEach(b=>b.classList.toggle('active',b.dataset.id===tpl.id))}
function renderTemplates(){const root=$('#templateGrid');root.replaceChildren(...TEMPLATES.map(tpl=>{const b=document.createElement('button');b.type='button';b.className='template-button';b.dataset.id=tpl.id;b.innerHTML=`<strong>${t(tpl.name)}</strong><span>${tpl.stats.map(x=>`d${x}`).join(' · ')}</span>`;b.onclick=()=>populateCreator(tpl);return b}))}

$('#addButton').onclick=openCharacterDialog;$('#rosterAddButton').onclick=openCharacterDialog;$('#cancelCharacterButton').onclick=()=>characterDialog.close();
$('#characterForm').addEventListener('submit',e=>{e.preventDefault();const base=$('#newCharacterName').value.trim()||t('Character');const count=Math.min(20,Math.max(1,Number($('#newCharacterCount').value)||1));const maximum={};ATTRIBUTES.forEach(a=>maximum[a]=Number(e.target.elements[a].value));for(let i=0;i<count;i++){const name=count>1?`${base} ${i+1}`:base;state.characters.push(normalizeCharacter({name,initiative:0,maximum,current:{...maximum},pending:{},equipment:newEquipment()}))}if(!ui.selectedId)ui.selectedId=state.characters[0]?.id||null;save();characterDialog.close();renderAll()});
$('#sortInitiativeButton').onclick=()=>{ui.sortInitiative=!ui.sortInitiative;save();$('#sortInitiativeButton').textContent=t(ui.sortInitiative?'Use roster order':'Sort initiative');renderRoster()};
$('#endRoundButton').onclick=()=>{if(!state.characters.some(hasPending))return;if(!confirm(t('Apply all pending wounds?')))return;state.characters.forEach(c=>ATTRIBUTES.forEach(a=>{c.current[a]=stepDown(c.current[a],c.pending[a]||0);c.pending[a]=0}));save();renderAll()};
$('#backToRosterButton').onclick=()=>setView('roster',true);$('#detailEndRoundButton').onclick=()=>$('#endRoundButton').click();$('#fullHpButton').onclick=()=>{const c=getCharacter();if(!c||!confirm(t('Reset to full HP, clear pending wounds, and remove death? This is a GM override, not a rest.')))return;ATTRIBUTES.forEach(a=>{c.current[a]=c.maximum[a];c.pending[a]=0});c.dead=false;save();renderAll()};
$('#toggleStatEditButton').onclick=()=>{editMaximums=!editMaximums;renderDetail()};
$('#addWeaponButton').onclick=()=>{const c=getCharacter();if(!c)return;c.equipment.weapons.push({name:t('Weapon'),weaponClass:'light',accuracy:'STR',impact:6,equipped:true});save();renderDetail();renderComposerCharacters()};
$('#addArmorButton').onclick=()=>{const c=getCharacter();if(!c)return;c.equipment.plating.push({type:'medium',equipped:true});save();renderDetail()};
$('#deleteCharacterButton').onclick=()=>removeCharacter(getCharacter());
$('#composerCharacter').onchange=()=>{const id=$('#composerCharacter').value;if(id){ui.selectedId=id;save();renderRoster();renderDetail()}renderComposerWeapons();renderComposer()};$('#composerWeapon').onchange=renderComposer;$('#includeAttackButton').onclick=()=>{includesBaseAttack=!includesBaseAttack;renderComposer()};$('#clearComposerButton').onclick=()=>{selectedPrefixes.clear();selectedWords.clear();renderWords();renderComposer()};$('#clearWordsButton').onclick=()=>{selectedWords.clear();renderWords();renderComposer()};
document.querySelectorAll('.nav-button').forEach(b=>b.onclick=()=>setView(b.dataset.view,true));localeSelect.onchange=()=>{locale=localeSelect.value;localStorage.setItem(LOCALE_KEY,locale);applyLocale();renderTemplates();renderWords()};
matchMedia('(max-width:760px)').addEventListener('change',()=>syncView(false));

captureLocale(document.documentElement);localeSelect.value=locale;applyLocale();renderTemplates();renderWords();renderAll(false);
