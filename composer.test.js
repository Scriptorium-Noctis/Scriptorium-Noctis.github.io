'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');

function setup(){
  const nodes=new Map();
  function element(){return {value:'',children:[],attrs:{},dataset:{},disabled:false,classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v},replaceChildren(...children){this.children=children},append(...children){this.children.push(...children)}}}
  const context=vm.createContext({window:{},document:{createElement:element},nodes});
  // Evaluate the real composer and its constant tables without booting unrelated app UI.
  vm.runInContext(source.slice(source.indexOf('const STORAGE_KEY'),source.indexOf('let locale='))+`
    let selectedPrefixes=new Set(),selectedWords=new Set(),includesBaseAttack=true;
    const c={current:{STR:8,INT:10,AUR:12},equipment:{weapons:[{name:'Test blade',accuracy:'STR',impact:0}]}};
    const $=s=>{if(!nodes.has(s))nodes.set(s,(${element.toString()})());return nodes.get(s)};
    const getCharacter=()=>c;
    const t=(s,vars={})=>s.replace(/\\{(\\w+)\\}/g,(m,k)=>vars[k]??m);
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
  assert.match(h.node('#actionName').textContent,/Power Dashing Firanka Dziahaka/);
  assert.equal(h.node('#composerWeapon').disabled,true);
  assert.ok(h.effects().includes('Dashing movement: up to 20 m.'));
  assert.ok(!h.effects().some(x=>/Impact|Smite/.test(x)));
  h.run('includesBaseAttack=true;renderComposer()');
  assert.equal(h.node('#composerWeapon').disabled,false);assert.match(h.metrics()[2],/STR d8/);
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
  assert.match(h.metrics()[0],/>3</);assert.ok(!h.effects().some(x=>/Source Smite/.test(x)));
});

test('Shape combinations remain selectable and are not excluded by fiction guesses',()=>{
  const h=setup();h.run("includesBaseAttack=false;selectedWords=new Set(['source:fire','shape:bolt','shape:barrier','shape:flat','shape:spiral']);selectedPrefixes.add('precision');renderComposer();renderWords()");
  assert.match(h.metrics()[0],/>6</);
  const buttons=h.node('#wordCategories').children.flatMap(section=>section.children[1].children);
  assert.ok(buttons.every(button=>!button.disabled));
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
  const section=html.slice(html.indexOf('<section id="actionPane"'),html.indexOf('<section id="guidePane"'));
  for(const match of section.matchAll(/>([^<>]+)</g)){
    const text=match[1].trim();if(text)assert.ok(strings[text],`Missing Polish text: ${text}`);
  }
});
