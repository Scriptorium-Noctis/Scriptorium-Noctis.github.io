'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {spawnSync} = require('node:child_process');

test('Chromium smoke: startup, damage, death, recovery, locale and persistence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'sigil-sheet-'));
  try {
    const checks = `
      const check = (condition, message) => {if (!condition) throw new Error(message)};
      const click = selector => {const el=document.querySelector(selector);check(el,selector);el.click()};
      const input = (selector,value) => {const el=document.querySelector(selector);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))};
      window.confirm=()=>true;
      state.characters=[normalizeCharacter({id:'test',name:'Test <safe>',maximum:{STR:6,DEX:6,CON:6,INT:4,SEN:4,AUR:4}})];
      ui.selectedId='test'; renderAll();
      check(document.querySelector('#detailMeta').textContent.includes('Alive'),'alive at startup');
      click('#damageHelperButton');
      input('[name="amount"]','5'); click('dialog[open] [data-preview]');
      check(document.querySelector('[data-result]').textContent.includes('Ignored overflow: 2.'),'overflow preview');
      click('dialog[open] [type="submit"]');
      check(!getCharacter().dead&&hasPending(getCharacter()),'queued not dead');
      check(document.querySelector('#detailMeta').textContent.includes('next hit kills'),'pending critical status');
      click('#endRoundButton');
      check(currentHp(getCharacter())===0&&!getCharacter().dead,'0 HP survives');
      click('#damageHelperButton'); click('dialog[open] [data-preview]'); click('dialog[open] [type="submit"]');
      check(getCharacter().dead,'next hit kills');
      check(loadState().characters[0].dead,'death persisted');
      click('#fullHpButton');
      check(!getCharacter().dead&&currentHp(getCharacter())===3,'GM reset');
      const c=getCharacter(); c.maximum.INT=6;c.current.CON=4;renderAll();
      click('#recoveryButton');

      const con=document.querySelectorAll('#recoveryDialog .equipment-fields input')[2];
      con.value='1';con.dispatchEvent(new Event('input',{bubbles:true}));
      const boxes=document.querySelectorAll('#recoveryDialog input[type="checkbox"]');
      boxes[1].checked=true;boxes[1].dispatchEvent(new Event('change',{bubbles:true}));
      check(!document.querySelector('#recoveryDialog [type="submit"]').disabled,'recovery valid');
      click('#recoveryDialog [type="submit"]');
      check(c.current.CON===6,'recovery applied');
      localeSelect.value='pl';localeSelect.onchange();
      check(document.querySelector('#damageHelperButton').textContent==='Losowanie ran dla MG','Polish label');
      click('#recoveryButton');
      check(document.querySelector('#recoveryTitle').textContent.includes(c.name),'reopened localized recovery');
      check(document.querySelector('#recoveryDialog [type="submit"]').disabled,'approval reset');
      check(loadState().characters[0].current.CON===6,'recovery persisted');
    `;
    const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8')
      .replace('<head>',`<head><base href="${pathToFileURL(__dirname+path.sep)}">`)
      .replace('</body>',`<script>try {${checks};document.body.dataset.testResult='PASS'} catch(error) {document.body.dataset.testResult=error.stack}</script></body>`);
    const file = path.join(dir,'smoke.html'); fs.writeFileSync(file,html);
    const result = spawnSync('chromium',['--headless','--no-sandbox','--disable-gpu','--allow-file-access-from-files',`--user-data-dir=${path.join(dir,'profile')}`,'--dump-dom',pathToFileURL(file).href],{encoding:'utf8',timeout:20000,maxBuffer:4*1024*1024});
    assert.ifError(result.error);
    const outcome = result.stdout.match(/data-test-result="([^"]*)"/);
    assert.equal(outcome?.[1],'PASS',outcome?.[1]||result.stderr);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
