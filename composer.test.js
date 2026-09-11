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

test('Shape combinations remain selectable and resolve with diagnostics rather than disabling choices',()=>{
  const h=setup();h.run("includesBaseAttack=false;selectedWords=new Set(['source:fire','shape:bolt','shape:barrier','shape:flat','shape:spiral']);selectedPrefixes.add('precision');renderComposer();renderWords()");
  assert.match(h.metrics()[0],/>6</);
  const buttons=h.node('#wordCategories').children.flatMap(section=>section.children[1].children);
  assert.ok(buttons.every(button=>!button.disabled));
  assert.match(h.node('#shapeInteractions').children.map(x=>x.textContent).join(' '),/endpoint|geometry/);
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

test('every Word has structured resolver fields and resource potential policy',()=>{
  const h=setup();
  assert.equal(h.run("Object.values(WORDS).flat().every(w=>['delivery','target','area','range','duration','resist','effects','interactions','potentialPolicy'].every(k=>Object.hasOwn(w,k)))"),true);
  assert.equal(h.run("WORDS.mastery.find(w=>w.id==='hold').mana||0"),0);
});

test('potential is exactly base plus prefixes plus consumed Mana and Dust',()=>{
  const h=setup();h.run("includesBaseAttack=false;selectedWords=new Set(['source:fire','shape:bolt','mastery:focus','mastery:hold']);selectedPrefixes.add('power');renderComposer()");
  assert.match(h.metrics()[0],/>5</); // four Words + one prefix; Hold Still still costs 1 AP.
  assert.match(h.metrics()[1],/>4</); // 1 Mana + 1 Mana + 1 Dust + prefix; Hold contributes zero.
  assert.ok(h.effects().some(x=>/Mana 2 \+ Dust 1 = 4/.test(x)));
});

test('area resistance uses total selected Word count and stays separate from casting check',()=>{
  const h=setup();h.run("includesBaseAttack=false;selectedWords=new Set(['source:fire','shape:vortex']);renderComposer()");
  assert.match(h.metrics()[2],/Area resistance/);
  assert.match(h.node('#resolutionSummary').textContent,/Advanced 6/);
  assert.ok(h.effects().some(x=>/casting check: none/i.test(x)));
  h.run("selectedWords.add('mastery:focus');renderComposer()");
  assert.match(h.node('#resolutionSummary').textContent,/Hard 8/);
  assert.ok(h.effects().some(x=>/Caster casting check: Easy 4/.test(x)));
});

test('Bolt carries and places Pillar at impact with layered attack and area resolution',()=>{
  const h=setup();h.run("includesBaseAttack=false;selectedWords=new Set(['source:fire','shape:pillar','shape:bolt']);renderComposer()");
  assert.match(h.node('#deliverySummary').textContent,/Bolt.*primary delivery/);
  assert.match(h.node('#targetsSummary').textContent,/impact point.*occupants/);
  assert.match(h.node('#resolutionSummary').textContent,/spell accuracy.*Hard 8/);
  assert.match(h.node('#sourceEffects').children[0].textContent,/Ignite the hit target/);
});

test('competing primary Shapes use stable catalog priority and expose a diagnostic',()=>{
  const h=setup();h.run("includesBaseAttack=false;selectedWords=new Set(['source:force','shape:hammer','shape:bolt']);renderComposer()");
  assert.match(h.node('#deliverySummary').textContent,/Bolt/);
  assert.match(h.node('#composerDiagnostics').children[0].textContent,/Bolt wins by stable catalog priority/);
});

test('Hold Still reduces only an existing caster check and Mabufa explains temporary utility',()=>{
  const h=setup();h.run("includesBaseAttack=false;selectedWords=new Set(['source:fire','shape:vortex','mastery:focus','mastery:hold']);renderComposer()");
  assert.ok(h.effects().some(x=>/Caster casting check: Easy 4/.test(x)));
  assert.match(h.node('#resolutionSummary').textContent,/Very Hard 10/); // four selected Words; Hold does not reduce resistance.
  h.run("selectedWords=new Set(['mastery:enhancement']);renderComposer()");
  assert.match(h.metrics()[0],/>1</);assert.match(h.metrics()[1],/>1</);
  assert.match(h.node('#masteryEffects').children.map(x=>x.textContent).join(' '),/Transfer 1 Mana OR.*temporary.*d12 → d20/);
});

test('Weapon Attack combined with Shape or Mastery Words warns without blocking totals',()=>{
  const h=setup();h.run("selectedWords=new Set(['source:fire','shape:barrier']);renderComposer()");
  assert.match(h.metrics()[0],/>3</);
  assert.ok(h.node('#composerDiagnostics').children.some(x=>/not Shape Words: Barrier \/ Shield/.test(x.textContent)));
  const h2=setup();h2.run("selectedWords=new Set(['source:fire','mastery:hold']);renderComposer()");
  assert.match(h2.metrics()[0],/>3</);
  assert.ok(h2.node('#composerDiagnostics').children.some(x=>/not Mastery Words: Hold Still/.test(x.textContent)));
  const h3=setup();h3.run("selectedWords=new Set(['source:fire','source:thunder']);renderComposer()");
  assert.equal(h3.node('#composerDiagnostics').children.length,0);
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
