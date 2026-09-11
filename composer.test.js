'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');

function setup(language='en'){
  const nodes=new Map();
  function element(){return {value:'',children:[],attrs:{},dataset:{},disabled:false,classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v},replaceChildren(...children){this.children=children},append(...children){this.children.push(...children)}}}
  const context=vm.createContext({window:{},document:{createElement:element},nodes});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'locale.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'composer-locale.js'),'utf8'),context);
  context.language=language;
  // Evaluate the real composer and its constant tables without booting unrelated app UI.
  vm.runInContext(source.slice(source.indexOf('const STORAGE_KEY'),source.indexOf('let locale='))+`
    let selectedPrefixes=new Set(),selectedWords=new Set(),includesBaseAttack=true;
    const c={current:{STR:8,INT:10,AUR:12},equipment:{weapons:[{name:'Test blade',accuracy:'STR',impact:0}]}};
    const $=s=>{if(!nodes.has(s))nodes.set(s,(${element.toString()})());return nodes.get(s)};
    const getCharacter=()=>c;
    const t=(s,vars={})=>(LOCALES[language]?.strings[s]??s).replace(/\\{(\\w+)\\}/g,(m,k)=>vars[k]??m);
    const idx=d=>DICE.indexOf(d);
  `+source.slice(source.indexOf('function renderComposerCharacters'),source.indexOf('function setView')),context);
  vm.runInContext("$('#composerWeapon').value='0'",context);
  return {run:code=>vm.runInContext(code,context),node:id=>nodes.get(id),metrics:()=>nodes.get('#actionMetrics').children.map(x=>x.innerHTML),effects:()=>nodes.get('#actionEffects').children.map(x=>x.textContent)};
}

test('base attack with Power and Precision preserves costs and zero Impact',()=>{
  const h=setup();h.run("selectedPrefixes=new Set(['power','precision']);renderComposer()");
  assert.match(h.metrics()[0],/>3</);assert.match(h.metrics()[1],/>4</);
  assert.match(h.metrics()[2],/STR d8/);assert.ok(h.effects().includes('Impact: 0.'));
});

test('spell prefixes use attack-like Shape, spell accuracy, and no weapon Impact or Smite discount',()=>{
  const h=setup();h.run("includesBaseAttack=false;selectedWords=new Set(['source:fire','shape:bolt']);selectedPrefixes=new Set(['power','dashing']);renderComposer()");
  assert.match(h.metrics()[0],/>4</);assert.match(h.metrics()[1],/>4</);assert.match(h.metrics()[2],/AUR d12/);
  assert.equal(h.node('#actionName').textContent,'Power Dashing Fire Bolt');
  assert.match(h.node('#actionIncantation').textContent,/Tor Vesh Firanka Dziahaka/);
  assert.equal(h.node('#composerWeapon').disabled,true);
  assert.ok(h.effects().includes('Dashing movement: up to 20 m.'));
  assert.ok(!h.effects().some(x=>/Impact|Smite/.test(x)));
  h.run('includesBaseAttack=true;renderComposer()');
  assert.equal(h.node('#composerWeapon').disabled,true);assert.match(h.metrics()[2],/AUR d12/);
  assert.match(h.metrics()[0],/>4</);
});

test('prefix-only and non-attack spell prefixes do not produce valid totals or effects',()=>{
  for(const words of [[],['source:fire'],['source:fire','shape:barrier']]){
    const h=setup();h.run(`includesBaseAttack=false;selectedWords=new Set(${JSON.stringify(words)});selectedPrefixes=new Set(['dashing']);renderComposer()`);
    assert.ok(h.metrics().every(x=>x.includes('>—<')));
    assert.equal(h.effects().length,1);assert.match(h.effects()[0],/Prefixes need/);
    const buttons=h.node('#prefixGrid').children;
    assert.equal(buttons.find(x=>x.dataset.key==='power').disabled,true);
    const selected=buttons.find(x=>x.dataset.key==='dashing');assert.equal(selected.disabled,false);
    selected.onclick();assert.equal(h.run('selectedPrefixes.size'),0);
  }
});

test('empty composition has no totals; unarmed attack does not borrow spell accuracy',()=>{
  const h=setup();h.run('includesBaseAttack=false;renderComposer()');
  assert.ok(h.metrics().every(x=>x.includes('>—<')));
  h.run("includesBaseAttack=true;$('#composerWeapon').value='';selectedWords.add('source:fire');renderComposer()");
  assert.match(h.metrics()[2],/>—</);
});

test('source-only Smite retains existing AP exception, unlike attack-like Shape',()=>{
  const h=setup();h.run("selectedWords.add('source:fire');renderComposer()");
  assert.match(h.metrics()[0],/>1</);assert.ok(h.effects().some(x=>/Source Smite/.test(x)));
  h.run("selectedWords.add('shape:bolt');renderComposer()");
  assert.match(h.metrics()[0],/>2</);assert.ok(!h.effects().some(x=>/Source Smite/.test(x)));
});

test('Shape combinations remain selectable and are not excluded by fiction guesses',()=>{
  const h=setup();h.run("includesBaseAttack=false;selectedWords=new Set(['source:fire','shape:bolt','shape:barrier','shape:flat','shape:spiral']);selectedPrefixes.add('precision');renderComposer();renderWords()");
  assert.match(h.metrics()[0],/>6</);
  const buttons=h.node('#wordCategories').children.flatMap(section=>section.children[1].children);
  assert.ok(buttons.every(button=>!button.disabled));
});

test('readable weapon names, slash-separated Sources, and prefix order are deterministic',()=>{
  const h=setup();h.run("c.equipment.weapons[0].name='Spear';selectedPrefixes=new Set(['power','precision']);selectedWords.add('source:thunder');renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Precision Power Weapon Attack (Spear) of Lightning');
  assert.match(h.node('#actionIncantation').textContent,/Zin Tor Baguaga/);
  h.run("selectedPrefixes=new Set(['precision','power']);selectedWords.add('source:fire');renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Precision Power Weapon Attack (Spear) of Lightning/Fire');
  assert.match(h.metrics()[0],/>5</);assert.match(h.metrics()[1],/>6</);
  assert.ok(h.effects().some(x=>/each cost 1 AP/.test(x)));
  h.run("$('#composerWeapon').value='';renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Precision Power Attack of Lightning/Fire');
  h.run("selectedWords.clear();renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Precision Power Attack');
});

test('all attack-like Shapes suppress physical delivery and preserve both base preferences',()=>{
  const ids=setup().run("WORDS.shape.filter(x=>x.attackLike).map(x=>x.id)");
  for(const id of ids)for(const preference of [true,false]){
    const h=setup();h.run(`includesBaseAttack=${preference};selectedWords=new Set(['source:fire','shape:${id}']);renderComposer()`);
    assert.match(h.metrics()[0],/>2</);assert.match(h.metrics()[1],/>2</);assert.match(h.metrics()[2],/AUR d12/);
    assert.equal(h.node('#composerWeapon').disabled,true);
    assert.equal(h.node('#includeAttackButton').disabled,true);
    assert.equal(h.node('#includeAttackButton').attrs['aria-pressed'],'false');
    assert.match(h.node('#baseAttackNote').textContent,new RegExp('saved Base Attack: '+(preference?'on':'off')));
    assert.equal(h.run('includesBaseAttack'),preference);
    assert.ok(!h.effects().some(x=>/Impact|Smite/.test(x)));
    h.run('selectedWords.clear();renderComposer()');
    assert.equal(h.node('#includeAttackButton').disabled,false);
    assert.equal(h.node('#includeAttackButton').attrs['aria-pressed'],String(preference));
    assert.equal(h.node('#composerWeapon').disabled,!preference);
  }
});

test('removing only one attack-like Shape does not restore Base Attack; final removal does',()=>{
  const h=setup();h.run("selectedWords=new Set(['shape:bolt','shape:hammer']);renderComposer();selectedWords.delete('shape:bolt');renderComposer()");
  assert.equal(h.node('#includeAttackButton').disabled,true);
  h.run("selectedWords.delete('shape:hammer');renderComposer()");
  assert.equal(h.node('#includeAttackButton').attrs['aria-pressed'],'true');
  assert.match(h.metrics()[0],/>1</);assert.match(h.metrics()[1],/>2</);
});

test('Precision Lightning Fire Bolt costs 4 AP regardless of selection order or saved base',()=>{
  const h=setup();h.run("selectedWords=new Set(['shape:bolt','source:fire','source:thunder']);selectedPrefixes.add('precision');renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Precision Lightning Fire Bolt');
  assert.match(h.metrics()[0],/>4</);assert.match(h.metrics()[1],/>4</);
  assert.match(h.node('#actionIncantation').textContent,/Zin Baguaga Firanka Dziahaka/);
});

test('Disarming and Knockback each add 1 AP and potential without replacing normal damage',()=>{
  for(const prefix of ['disarming','knockback']){
    const h=setup();h.run(`selectedPrefixes.add('${prefix}');renderComposer()`);
    assert.match(h.metrics()[0],/>2</);assert.match(h.metrics()[1],/>3</);
    assert.ok(h.effects().some(x=>/failed enemy Brace/.test(x)&&/normal damage chain is unchanged/.test(x)));
    assert.ok(h.effects().some(x=>prefix==='disarming'?/drops a held item/.test(x):/15 m/.test(x)));
  }
  const h=setup();h.run("selectedPrefixes=new Set(['knockback','disarming','precision']);selectedWords=new Set(['source:fire','shape:bolt']);renderComposer()");
  assert.match(h.metrics()[0],/>5</);assert.match(h.metrics()[1],/>5</);
  assert.ok(h.effects().some(x=>/25 m/.test(x)));
  assert.equal(h.node('#actionName').textContent,'Precision Disarming Knockback Fire Bolt');
});

test('mastery stays readable while incantations retain every selected Word value',()=>{
  const h=setup();h.run("selectedWords=new Set(['source:fire','mastery:hold']);renderComposer()");
  assert.match(h.metrics()[0],/>3</);
  assert.equal(h.node('#actionName').textContent,'Weapon Attack (Test blade) of Fire Hold Still');
  assert.match(h.node('#actionIncantation').textContent,/Firanka Kurwa/);
  h.run('includesBaseAttack=false;selectedWords.clear();renderComposer()');
  assert.equal(h.node('#actionIncantation').hidden,true);
});

test('Polish renders readable names, new prefix effects, and non-canonical incantation label',()=>{
  const h=setup('pl');h.run("selectedPrefixes=new Set(['knockback','disarming','power','precision']);selectedWords.add('source:thunder');renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Precyzja Siła Rozbrojenie Odepchnięcie Atak bronią (Test blade) — Błyskawica');
  assert.match(h.node('#actionIncantation').textContent,/nie kanon.*Zin Tor Nek Brom Baguaga/);
  assert.ok(h.effects().some(x=>/upuszcza trzymany przedmiot/.test(x)));
  assert.ok(h.effects().some(x=>/35 m/.test(x)));
});

test('Polish composer supplement translates all new wording without replacing existing locale entries',()=>{
  const context=vm.createContext({window:{}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'locale.js'),'utf8'),context);
  const original={...context.window.SIGILRPG_LOCALES.pl.strings};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'composer-locale.js'),'utf8'),context);
  const strings=context.window.SIGILRPG_LOCALES.pl.strings;
  for(const [key,value] of Object.entries(original))assert.equal(strings[key],value);
  assert.equal(strings['Attack prefixes'],'Prefiksy ataku');
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  const section=html.slice(html.indexOf('<section id="actionPane"'),html.indexOf('<section id="guidePane"'))
    +html.slice(html.indexOf('<div><dt>Disarming</dt>'),html.indexOf('<div><dt>Sweep</dt>'))
    +html.slice(html.indexOf('<li>Attack-like Shapes'),html.indexOf('</main>'));
  for(const match of section.matchAll(/>([^<>]+)</g)){
    const text=match[1].trim();if(text)assert.ok(strings[text],`Missing Polish text: ${text}`);
  }
});
