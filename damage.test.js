'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {planDamage} = require('./damage.js');
const attributes = ['STR','DEX','CON','INT','SEN','AUR'];
const character = (values = [6,6,6,4,4,4]) => ({current:Object.fromEntries(attributes.map((a,i)=>[a,values[i]])),pending:Object.fromEntries(attributes.map(a=>[a,0])),dead:false});
const total = plan => Object.values(plan.allocation).reduce((sum,n)=>sum+n,0);

test('3 HP hit for 5 queues three wounds, ignores overflow, next separate hit kills', () => {
  const c = character();
  const plan = planDamage(c,5,attributes,false,()=>0);
  assert.equal(total(plan),3); assert.equal(plan.ignored,2); assert.equal(plan.lethal,false);
  assert.deepEqual(c.current,character().current);
  Object.assign(c.pending,plan.allocation);
  assert.equal(planDamage(c,1,attributes).lethal,true);
});
test('never allocates to current or pending d4, and each ordinary hit wounds an attribute once', () => {
  const c = character([10,6,4,4,4,4]); c.pending.DEX=1;
  const plan = planDamage(c,3,attributes,false,()=>0);
  assert.equal(plan.allocation.STR,1); assert.equal(total(plan),1); assert.equal(plan.unassigned,2);
});
test('Precision can repeat only one attribute and only once', () => {
  const plan = planDamage(character([12,12,12,12,12,12]),8,attributes,true,()=>0);
  assert.equal(total(plan),7); assert.equal(plan.unassigned,1);
  assert.equal(Object.values(plan.allocation).filter(n=>n===2).length,1);
  assert.ok(Object.values(plan.allocation).every(n=>n<=2));
});
test('fictional eligibility is respected; no eligible target reports unassigned damage', () => {
  const c=character(); const plan=planDamage(c,2,['CON'],false,()=>0);
  assert.equal(plan.allocation.CON,1); assert.equal(plan.unassigned,1);
  assert.equal(total(planDamage(c,2,[])),0);
});
test('zero-HP character remains alive until damaged, dead character takes no additional wounds', () => {
  const c=character([4,4,4,4,4,4]);
  assert.equal(c.dead,false); assert.equal(planDamage(c,9,[]).lethal,true);
  c.dead=true; const plan=planDamage(c,9,attributes);
  assert.equal(total(plan),0); assert.equal(plan.lethal,false);
});
test('rejects invalid amounts and consumes injectable randomness to choose among attributes', () => {
  for(const n of [0,-1,NaN,Infinity,1.5]) assert.throws(()=>planDamage(character(),n,attributes));
  assert.equal(planDamage(character(),1,attributes,false,()=>0.99).allocation.CON,1);
});
test('many allocations preserve capacities, totals and repeat limits', () => {
  for(let i=0;i<300;i++) {
    const c=character([10,6,8,4,12,20]); c.pending.STR=2;
    const plan=planDamage(c,i%12+1,attributes,i%2===0);
    assert.equal(total(plan)+plan.ignored+plan.unassigned,i%12+1);
    assert.ok(plan.allocation.STR<=1); assert.equal(plan.allocation.INT,0);
    assert.ok(Object.values(plan.allocation).filter(n=>n===2).length<=1);
  }
});
