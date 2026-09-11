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
    let selectedAttackMastery=new Set(),selectedGlyphs=new Set(),composerMode='attack';
    const c={current:{STR:8,DEX:6,INT:10,AUR:12},equipment:{weapons:[{name:'Test blade',accuracy:'STR',impact:0}]}};
    const $=s=>{if(!nodes.has(s))nodes.set(s,(${element.toString()})());return nodes.get(s)};
    const getCharacter=()=>c;
    const t=(s,vars={})=>(LOCALES[language]?.strings[s]??s).replace(/\\{(\\w+)\\}/g,(m,k)=>vars[k]??m);
    const idx=d=>DICE.indexOf(d);
    const stepUp=(d,n=1,max=100)=>DICE[Math.min(DICE.indexOf(max),DICE.indexOf(d)+n)];
  `+source.slice(source.indexOf('function renderComposerCharacters'),source.indexOf('function setView')),context);
  vm.runInContext("$('#composerWeapon').value='0'",context);
  return {run:code=>vm.runInContext(code,context),node:id=>nodes.get(id),metrics:()=>nodes.get('#actionMetrics').children.map(x=>x.innerHTML),effects:()=>nodes.get('#actionEffects').children.map(x=>x.textContent)};
}

test('base attack with Power and Precision preserves costs and zero Impact',()=>{
  const h=setup();h.run("selectedAttackMastery=new Set(['power','precision']);renderComposer()");
  assert.match(h.metrics()[0],/>3</);assert.match(h.metrics()[1],/>4</);
  assert.match(h.metrics()[2],/STR d10/);assert.ok(h.effects().includes('Impact: 0.'));
});

test('Attack Mastery Glyphs use an attack-like Shaping Glyph, spell accuracy, and randomized incantation spelling',()=>{
  const h=setup();h.run("Math.random=()=>0;composerMode='focus';selectedGlyphs=new Set(['source:fire','shape:bolt']);selectedAttackMastery=new Set(['power','dashing']);renderComposer()");
  assert.match(h.metrics()[0],/>4</);assert.match(h.metrics()[1],/>5</);assert.match(h.metrics()[2],/AUR d20/);
  assert.equal(h.node('#actionName').textContent,'Power Dashing Fire Bolt');
  assert.equal(h.node('#actionIncantation').textContent,'Tor Vesh Firanka Dziahaka');
  assert.equal(h.node('#composerWeapon').disabled,false);
  assert.ok(h.effects().includes('Dashing movement: up to 25 m.'));
  assert.ok(!h.effects().some(x=>/Impact|Smite/.test(x)));
  h.run("Math.random=()=>0.99;renderComposer()");
  assert.equal(h.node('#actionIncantation').textContent,'Tohr Veś Firan-ka Dziahakka');
  assert.doesNotMatch(h.node('#actionIncantation').textContent,/Alternative|tracker|canonical/i);
});

test('Attack Mastery Glyphs without an attack-like delivery do not produce valid totals',()=>{
  for(const words of [[],['source:fire'],['source:fire','shape:barrier']]){
    const h=setup();h.run(`composerMode='focus';selectedGlyphs=new Set(${JSON.stringify(words)});selectedAttackMastery=new Set(['dashing']);renderComposer()`);
    assert.ok(h.metrics().every(x=>x.includes('>—<')));
    assert.equal(h.node('#composerValidation').hidden,false);
    assert.match(h.node('#composerValidation').children[0].textContent,/Mastery Glyphs need/);
    const buttons=h.node('#masteryGlyphGrid').children;
    assert.equal(buttons.find(x=>x.dataset.key==='power').disabled,true);
    const selected=buttons.find(x=>x.dataset.key==='dashing');assert.equal(selected.disabled,false);
    selected.onclick();assert.equal(h.run('selectedAttackMastery.size'),0);
  }
});

test('empty composition has no totals; unarmed Basic Attack uses the better STR or DEX and has no Impact',()=>{
  const h=setup();h.run("composerMode=\'focus\';renderComposer()");
  assert.ok(h.metrics().every(x=>x.includes('>—<')));
  h.run("composerMode='attack';$('#composerWeapon').value='';selectedGlyphs.add('source:fire');renderComposer()");
  assert.match(h.metrics()[2],/STR d8/);
  assert.ok(h.effects().some(x=>/no Impact value/.test(x)));
  h.run("c.current.STR=6;c.current.DEX=10;renderComposer()");
  assert.match(h.metrics()[2],/DEX d10/);
});

test('source-only Smite retains AP exception while Basic Attack plus Shaping Glyph is visibly invalid',()=>{
  const h=setup();h.run("selectedGlyphs.add('source:fire');renderComposer()");
  assert.match(h.metrics()[0],/>1</);assert.ok(h.effects().some(x=>/Source Smite/.test(x)));
  h.run("selectedGlyphs.add('shape:bolt');renderComposer()");
  assert.ok(h.metrics().every(x=>x.includes('>—<')));
  assert.equal(h.node('#composerValidation').hidden,false);
  assert.match(h.node('#composerValidation').children[0].textContent,/Basic Attack cannot be combined/);
  h.run("composerMode=\'focus\';renderComposer()");
  assert.match(h.metrics()[0],/>2</);assert.match(h.metrics()[2],/AUR d12/);
});

test('Shaping Glyph combinations remain selectable and resolve with diagnostics rather than disabling choices',()=>{
  const h=setup();h.run("composerMode='focus';selectedGlyphs=new Set(['source:fire','shape:bolt','shape:barrier','shape:flat','shape:spiral']);selectedAttackMastery.add('precision');renderComposer();renderGlyphs()");
  assert.match(h.metrics()[0],/>6</);
  const buttons=h.node('#glyphCategories').children.flatMap(section=>section.children[1].children);
  assert.ok(buttons.every(button=>!button.disabled));
  assert.match(h.node('#shapeInteractions').children.map(x=>x.textContent).join(' '),/endpoint|geometry/);
});

test('readable weapon names and Mastery order are deterministic; multiple attack Sources are invalid',()=>{
  const h=setup();h.run("Math.random=()=>0;c.equipment.weapons[0].name='Spear';selectedAttackMastery=new Set(['power','precision']);selectedGlyphs.add('source:thunder');renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Precision Power Weapon Attack (Spear) of Lightning');
  assert.equal(h.node('#actionIncantation').textContent,'Zin Tor Baguaga');
  h.run("selectedGlyphs.add('source:fire');renderComposer()");
  assert.ok(h.metrics().every(x=>x.includes('>—<')));
  assert.match(h.node('#composerValidation').children.map(x=>x.textContent).join(' '),/only one Source Glyph/);
  h.run("selectedGlyphs.delete('source:fire');$('#composerWeapon').value='';renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Precision Power Attack of Lightning');
  h.run("selectedGlyphs.clear();renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Precision Power Attack');
});

test('Basic Attack selection remains explicit and conflicts with every Shaping Glyph until focus mode is chosen',()=>{
  const ids=setup().run("GLYPHS.shape.map(x=>x.id)");
  for(const id of ids){
    const h=setup();h.run(`selectedGlyphs=new Set(['source:fire','shape:${id}']);renderComposer()`);
    assert.equal(h.node('#includeAttackButton').disabled,false);
    assert.equal(h.node('#includeAttackButton').attrs['aria-pressed'],'true');
    assert.equal(h.node('#composerValidation').hidden,false);
    assert.ok(h.metrics().every(x=>x.includes('>—<')));
    h.run("composerMode=\'focus\';renderComposer()");
    assert.equal(h.node('#includeAttackButton').attrs['aria-pressed'],'false');
    assert.match(h.metrics()[0],/>2</);
    assert.equal(h.node('#composerValidation').hidden,true);
  }
});

test('removing Shaping Glyphs never changes the explicit weapon-use mode',()=>{
  const h=setup();h.run("composerMode='focus';selectedGlyphs=new Set(['shape:bolt','shape:hammer']);renderComposer();selectedGlyphs.clear();renderComposer()");
  assert.equal(h.node('#includeAttackButton').attrs['aria-pressed'],'false');
  assert.ok(h.metrics().every(x=>x.includes('>—<')));
  h.run("composerMode=\'attack\';renderComposer()");
  assert.equal(h.node('#includeAttackButton').attrs['aria-pressed'],'true');
  assert.match(h.metrics()[0],/>1</);assert.match(h.metrics()[1],/>2</);
});

test('Precision Fire Bolt costs 3 AP as a standalone spell',()=>{
  const h=setup();h.run("Math.random=()=>0;composerMode='focus';selectedGlyphs=new Set(['shape:bolt','source:fire']);selectedAttackMastery.add('precision');renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Precision Fire Bolt');
  assert.match(h.metrics()[0],/>3</);assert.match(h.metrics()[1],/>4</);
  assert.equal(h.node('#actionIncantation').textContent,'Zin Firanka Dziahaka');
});

test('Disarming and Knockback each add 1 AP and potential without replacing normal damage',()=>{
  for(const prefix of ['disarming','knockback']){
    const h=setup();h.run(`selectedAttackMastery.add('${prefix}');renderComposer()`);
    assert.match(h.metrics()[0],/>2</);assert.match(h.metrics()[1],/>3</);
    assert.ok(h.effects().some(x=>/failed enemy Brace/.test(x)&&/normal damage chain is unchanged/.test(x)));
    assert.ok(h.effects().some(x=>prefix==='disarming'?/drops a held item/.test(x):/15 m/.test(x)));
  }
  const h=setup();h.run("composerMode='focus';selectedAttackMastery=new Set(['knockback','disarming','precision']);selectedGlyphs=new Set(['source:fire','shape:bolt']);renderComposer()");
  assert.match(h.metrics()[0],/>5</);assert.match(h.metrics()[1],/>6</);
  assert.ok(h.effects().some(x=>/30 m/.test(x)));
  assert.equal(h.node('#actionName').textContent,'Precision Disarming Knockback Fire Bolt');
});

test('mastery stays readable while incantation is only the selected phrase',()=>{
  const h=setup();h.run("Math.random=()=>0;selectedGlyphs=new Set(['source:fire','mastery:hold']);renderComposer()");
  assert.match(h.metrics()[0],/>2</);
  assert.equal(h.node('#actionName').textContent,'Weapon Attack (Test blade) of Fire Hold Still');
  assert.equal(h.node('#actionIncantation').textContent,'Firanka Kurwa');
  assert.doesNotMatch(h.node('#actionIncantation').textContent,/Alternative|canonical|tracker/i);
  h.run("composerMode=\'focus\';selectedGlyphs.clear();renderComposer()");
  assert.equal(h.node('#actionIncantation').hidden,true);
});

test('Polish composer uses grammatical metadata for readable action names',()=>{
  const h=setup('pl');h.run("Math.random=()=>0;$('#composerWeapon').value='';selectedAttackMastery=new Set(['power','dashing']);renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Potężny Szarża Atak');
  h.run("selectedAttackMastery=new Set(['sweep','precision']);selectedGlyphs.add('source:fire');renderComposer()");
  assert.equal(h.node('#actionName').textContent,'Precyzyjny Zamach Atak Ognia');
  assert.equal(h.node('#actionIncantation').textContent,'Zin Sha Firanka');
});

test('every Glyph has structured resolver fields, incantation variants, and localized composer metadata',()=>{
  const h=setup();
  assert.equal(h.run("Object.values(GLYPHS).flat().every(w=>['delivery','target','area','range','duration','resist','effects','interactions','potential','incantations'].every(k=>Object.hasOwn(w,k))&&w.incantations.length>=4)"),true);
  assert.equal(h.run("Object.keys(LOCALES.pl.composer.glyphs).length===Object.values(GLYPHS).flat().length"),true);
  assert.equal(h.run("GLYPHS.mastery.find(w=>w.id==='hold').mana||0"),0);
});

test('potential uses per-Glyph metadata with resource cost as the default baseline',()=>{
  const h=setup();h.run("composerMode='focus';selectedGlyphs=new Set(['source:fire','shape:bolt','mastery:focus','mastery:hold']);selectedAttackMastery.add('power');renderComposer()");
  assert.match(h.metrics()[0],/>5</); // four Glyphs + one Mastery Glyph; Hold Still still costs 1 AP.
  assert.match(h.metrics()[1],/>5</); // Fire 1 + Bolt 2 + Focus Dust 1 + Power 1; Hold contributes zero.
  assert.ok(h.effects().some(x=>/Fire \+1.*Bolt \+2.*Focus Glyph \+1.*= 5/.test(x)));
  assert.equal(h.run("GLYPHS.shape.find(x=>x.id==='bolt').potential.bonus"),1);
});

test('Vital Energy Smite overrides normal resource damage and exposes its undead conditional',()=>{
  const h=setup();h.run("$('#composerWeapon').value='';selectedGlyphs=new Set(['source:vital']);renderComposer()");
  assert.match(h.metrics()[1],/>1 \(4 Against undead\)</);
  assert.match(h.metrics()[2],/STR d8/);
  assert.ok(h.effects().some(x=>/Vital Energy -1/.test(x)));
  assert.ok(h.effects().some(x=>/Against undead: Vital Energy contributes \+2 potential instead of -1; total potential 4/.test(x)));
  assert.equal(h.run("GLYPHS.source.find(x=>x.id==='vital').potential.byMode.smite"),-1);
});

test('area resistance uses total selected Glyph count and stays separate from casting check',()=>{
  const h=setup();h.run("composerMode='focus';selectedGlyphs=new Set(['source:fire','shape:vortex']);renderComposer()");
  assert.match(h.metrics()[2],/Area resistance/);
  assert.match(h.node('#resolutionSummary').textContent,/Advanced 6/);
  assert.ok(h.effects().some(x=>/casting check: none/i.test(x)));
  h.run("selectedGlyphs.add('mastery:focus');renderComposer()");
  assert.match(h.node('#resolutionSummary').textContent,/Hard 8/);
  assert.ok(h.effects().some(x=>/Caster casting check: Easy 4/.test(x)));
});

test('Bolt carries and places Pillar at impact with layered attack and area resolution',()=>{
  const h=setup();h.run("composerMode='focus';selectedGlyphs=new Set(['source:fire','shape:pillar','shape:bolt']);renderComposer()");
  assert.match(h.node('#deliverySummary').textContent,/Bolt.*primary delivery/);
  assert.match(h.node('#targetsSummary').textContent,/impact point.*occupants/);
  assert.match(h.node('#resolutionSummary').textContent,/spell accuracy.*Hard 8/);
  assert.match(h.node('#sourceEffects').children[0].textContent,/Ignite the hit target/);
});

test('competing primary Shaping Glyphs use stable catalog priority and expose a diagnostic',()=>{
  const h=setup();h.run("composerMode='focus';selectedGlyphs=new Set(['source:force','shape:hammer','shape:bolt']);renderComposer()");
  assert.match(h.node('#deliverySummary').textContent,/Bolt/);
  assert.match(h.node('#composerDiagnostics').children[0].textContent,/Bolt wins by stable catalog priority/);
});

test('Hold Still reduces only an existing caster check and Mabufa explains temporary utility',()=>{
  const h=setup();h.run("composerMode='focus';selectedGlyphs=new Set(['source:fire','shape:vortex','mastery:focus','mastery:hold']);renderComposer()");
  assert.ok(h.effects().some(x=>/Caster casting check: Easy 4/.test(x)));
  assert.match(h.node('#resolutionSummary').textContent,/Very Hard 10/); // four selected Glyphs; Hold does not reduce resistance.
  h.run("selectedGlyphs=new Set(['mastery:enhancement']);renderComposer()");
  assert.match(h.metrics()[0],/>1</);assert.match(h.metrics()[1],/>1</);
  assert.match(h.node('#masteryEffects').children.map(x=>x.textContent).join(' '),/Transfer 1 Mana OR.*temporary.*d12 → d20/);
});

test('Basic Attack rejects Shaping Glyphs and multiple Sources; focus spells allow multiple Sources',()=>{
  const h=setup();h.run("selectedGlyphs=new Set(['source:fire','shape:barrier']);renderComposer()");
  assert.ok(h.metrics().every(x=>x.includes('>—<')));
  assert.match(h.node('#composerValidation').children.map(x=>x.textContent).join(' '),/Basic Attack cannot be combined/);
  const h2=setup();h2.run("selectedGlyphs=new Set(['source:fire','mastery:hold']);renderComposer()");
  assert.match(h2.metrics()[0],/>2</);
  assert.ok(h2.node('#composerDiagnostics').children.some(x=>/other Mastery Glyphs do not automatically act through the weapon hit/.test(x.textContent)));
  const h3=setup();h3.run("selectedGlyphs=new Set(['source:fire','source:thunder']);renderComposer()");
  assert.ok(h3.metrics().every(x=>x.includes('>—<')));
  assert.match(h3.node('#composerValidation').children.map(x=>x.textContent).join(' '),/only one Source Glyph/);
  h3.run("composerMode='focus';renderComposer()");
  assert.equal(h3.node('#composerValidation').hidden,true);
  assert.match(h3.metrics()[0],/>2</);
});

test('weapon mode is mutually exclusive and focus mode ignores physical weapon stats',()=>{
  const h=setup();h.run("selectedGlyphs=new Set(['source:fire','shape:bolt']);composerMode='focus';renderComposer()");
  assert.equal(h.node('#includeAttackButton').attrs['aria-pressed'],'false');
  assert.equal(h.node('#useFocusButton').attrs['aria-pressed'],'true');
  assert.match(h.metrics()[2],/AUR d12/);
  assert.ok(!h.effects().some(x=>/Impact:/.test(x)));
  assert.ok(h.node('#composerDiagnostics').children.some(x=>/focus only.*Accuracy and Impact are ignored/.test(x.textContent)));
  h.run("composerMode='attack';selectedGlyphs=new Set(['source:fire']);renderComposer()");
  assert.equal(h.node('#includeAttackButton').attrs['aria-pressed'],'true');
  assert.equal(h.node('#useFocusButton').attrs['aria-pressed'],'false');
  assert.match(h.metrics()[0],/>1</);
  assert.ok(h.effects().some(x=>/Source Smite consumes Mana but adds no AP/.test(x)));
});

test('shield is normalized as offhand equipment with mechanical rule metadata',()=>{
  const h=setup();
  assert.equal(h.run("SHIELD_RULES.meleeMissChipIgnored"),true);
  assert.equal(h.run("SHIELD_RULES.rangedDodgeGuarantee"),4);
});


test('Glyph palette exposes cost classes and disables currently unavailable choices',()=>{
  const h=setup();h.run("renderComposer();renderGlyphs()");
  const mastery=h.node('#masteryGlyphGrid').children;
  assert.match(mastery.find(x=>x.dataset.key==='power').className,/cost-ap/);
  assert.match(mastery.find(x=>x.dataset.key==='mastery:power').className,/cost-dust/);
  const groups=h.node('#glyphCategories').children;
  const source=groups[0].children[1].children.find(x=>x.innerHTML.includes('Fire'));
  const shape=groups[1].children[1].children.find(x=>x.innerHTML.includes('Bolt'));
  assert.match(source.className,/cost-mana/);
  assert.equal(source.disabled,false);
  assert.equal(shape.disabled,true);
  h.run("selectedGlyphs.add('source:fire');renderGlyphs()");
  const sources=h.node('#glyphCategories').children[0].children[1].children;
  assert.ok(sources.filter(x=>!x.attrs?.['aria-pressed']||x.attrs['aria-pressed']==='false').every(x=>x.disabled));
});

test('Polish composer supplement translates all new wording without replacing existing locale entries',()=>{
  const context=vm.createContext({window:{}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'locale.js'),'utf8'),context);
  const original={...context.window.SIGILRPG_LOCALES.pl.strings};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'composer-locale.js'),'utf8'),context);
  const strings=context.window.SIGILRPG_LOCALES.pl.strings;
  for(const [key,value] of Object.entries(original))assert.equal(strings[key],value);
  assert.equal(strings['Attack Mastery Glyphs'],'Glify Mistrzostwa Ataku');
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  const section=html.slice(html.indexOf('<section id="actionPane"'),html.indexOf('<section id="guidePane"'))
    +html.slice(html.indexOf('<div><dt>Disarming</dt>'),html.indexOf('<div><dt>Sweep</dt>'))
    +html.slice(html.indexOf('<li>Attack-like Shapes'),html.indexOf('</main>'));
  for(const match of section.matchAll(/>([^<>]+)</g)){
    const text=match[1].trim();if(text)assert.ok(strings[text],`Missing Polish text: ${text}`);
  }
});

test('Power Attack and Dovinus each raise Accuracy one tier and stack',()=>{
  const h=setup();
  h.run("selectedAttackMastery=new Set(['power']);renderComposer()");
  assert.match(h.metrics()[2],/STR d10/);
  h.run("selectedGlyphs=new Set(['mastery:power']);renderComposer()");
  assert.match(h.metrics()[2],/STR d12/);
});

test('casting-check-only Mastery Glyphs are unavailable during Basic Attack while Dovinus remains available',()=>{
  const h=setup();h.run('renderComposer();renderGlyphs()');
  const buttons=h.node('#masteryGlyphGrid').children;
  assert.equal(buttons.find(x=>x.dataset.key==='mastery:ascended').disabled,true);
  assert.equal(buttons.find(x=>x.dataset.key==='mastery:hold').disabled,true);
  assert.equal(buttons.find(x=>x.dataset.key==='mastery:power').disabled,false);
  assert.equal(h.run("GLYPHS.mastery.find(x=>x.id==='power').name"),'Power Word');
  assert.equal(h.run("GLYPHS.mastery.find(x=>x.id==='power').accuracyTierBonus"),1);
});
