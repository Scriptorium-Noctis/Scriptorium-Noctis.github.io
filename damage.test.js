'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {planDamage} = require('./damage.js');
const attributes = ['STR','DEX','CON','INT','SEN','AUR'];
const dice = [4,6,8,10,12,20,100];
const character = (values = [6,6,6,4,4,4]) => ({current:Object.fromEntries(attributes.map((a,i)=>[a,values[i]])),pending:Object.fromEntries(attributes.map(a=>[a,0])),dead:false});
const total = plan => Object.values(plan.allocation).reduce((sum,n)=>sum+n,0);
const queue = (c,plan) => {for (const a of attributes) c.pending[a]+=plan.allocation[a];};

test('3 HP hit for 5 allocates three wounds, ignores overflow, next separate hit kills', () => {
  const c = character();
  const before = structuredClone(c);
  const plan = planDamage(c,5,()=>0);
  assert.equal(total(plan),3); assert.equal(plan.ignored,2); assert.equal(plan.lethal,false);
  assert.deepEqual(c,before);
  queue(c,plan);
  assert.equal(planDamage(c,1).lethal,true);
});

test('eligibility uses current dice and pending wounds, with no manual attribute choices', () => {
  const c = character([10,6,4,4,4,4]); c.pending.DEX=1;c.pending.STR=1;
  const plan = planDamage(c,3,()=>0);
  assert.deepEqual(plan.allocation,{STR:2,DEX:0,CON:0,INT:0,SEN:0,AUR:0});
  assert.equal(total(plan),2);assert.equal(plan.ignored,1);assert.equal(plan.lethal,false);
});

test('all entered wounds are allocated while capacity remains, even to the same attribute', () => {
  const c=character([100,4,4,4,4,4]);
  const plan=planDamage(c,5,()=>0);
  assert.equal(plan.allocation.STR,5);assert.equal(plan.ignored,0);
  assert.equal(total(plan),5);
  queue(c,plan);
  const next=planDamage(c,5);
  assert.equal(next.allocation.STR,1);assert.equal(next.ignored,4);assert.equal(next.lethal,false);
  queue(c,next);
  assert.equal(planDamage(c,1).lethal,true);
});

test('a stat exhausted during the preview is excluded from subsequent random choices', () => {
  const c=character([6,8,6,4,4,4]);
  const plan=planDamage(c,4,()=>0);
  assert.deepEqual(plan.allocation,{STR:1,DEX:2,CON:1,INT:0,SEN:0,AUR:0});
  assert.equal(plan.ignored,0);
});

test('successive previews account for queued wounds; settling them preserves remaining capacity', () => {
  const c=character([8,10,6,4,4,4]);
  queue(c,planDamage(c,3,()=>0));
  const before=planDamage(c,5,()=>0.99);
  const settled=structuredClone(c);
  for(const a of attributes) {
    settled.current[a]=dice[Math.max(0,dice.indexOf(c.current[a])-c.pending[a])];
    settled.pending[a]=0;
  }
  assert.deepEqual(before,planDamage(settled,5,()=>0.99));
  assert.equal(total(before),3);assert.equal(before.ignored,2);
});

test('zero-HP character remains alive until damaged, dead character takes no additional wounds', () => {
  const c=character([4,4,4,4,4,4]);
  assert.equal(c.dead,false);assert.equal(planDamage(c,9).lethal,true);
  c.dead=true;const plan=planDamage(c,9);
  assert.equal(total(plan),0);assert.equal(plan.lethal,false);assert.equal(plan.ignored,9);
});

test('rejects invalid amounts and uses injectable randomness to choose eligible attributes', () => {
  for(const n of [0,-1,NaN,Infinity,1.5,'2',Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>planDamage(character(),n));
  assert.equal(planDamage(character(),1,()=>0.99).allocation.CON,1);
});

test('automatic spread always respects capacity, conserves damage, and never leaves assignable wounds', () => {
  for(let i=0;i<300;i++) {
    const c=character([10,6,8,4,12,20]);c.pending.STR=i%4;c.pending.AUR=i%6;
    const before=structuredClone(c),amount=i%40+1;
    const capacity=Object.fromEntries(attributes.map(a=>[a,Math.max(0,dice.indexOf(c.current[a])-c.pending[a])]));
    const hp=Object.values(capacity).reduce((s,n)=>s+n,0);
    const plan=planDamage(c,amount);
    assert.equal(total(plan),Math.min(amount,hp));
    assert.equal(total(plan)+plan.ignored,amount);
    for(const a of attributes) assert.ok(plan.allocation[a]>=0&&plan.allocation[a]<=capacity[a]);
    assert.deepEqual(c,before);
  }
});
