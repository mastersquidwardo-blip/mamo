const assert=require('node:assert/strict');const S=require('../stats.js');
const base={reviewed:true,pool:'Americas',packs:30,gmr:0,selected_outcome:false};
let rows=[{...base,id:'a'},{...base,id:'b',packs:12,gmr:1,selected_outcome:true},{...base,id:'c',gmr:null},{...base,id:'d',packs:null,gmr:1},{...base,id:'e',pool:'E-distributed',gmr:7},{...base,id:'f',reviewed:false,gmr:9}];
assert.deepEqual(S.summarize(rows,'Americas','gmr').ids,['a']);
assert.equal(S.summarize(rows,'Americas','gmr',true).boxes,14);assert.equal(S.summarize(rows,'Americas','gmr',true).hits,1);assert.deepEqual(S.summarize(rows,'Americas','gmr',true,true).ids,['b']);
assert.equal(S.summarize([{...base,id:'partial',packs:4,gmr:1}],'Americas','gmr').boxes,4/3);
assert.equal(S.summarize([{...base,id:'bonus',bonus_sl:2,sl_of:null}],'Americas','sl_of').reports,0);
assert.equal(S.summarize([{...base,id:'bonus',bonus_sl:2,sl_of:null}],'Americas','bonus_sl').hits,2);
const zero=S.interval(0,100);assert.equal(zero[0],0);assert.ok(Math.abs(zero[1]-3.688879454)<1e-8);const one=S.interval(1,100);assert.ok(Math.abs(one[0]-.025317808)<1e-8);assert.ok(Math.abs(one[1]-5.571643391)<1e-8);assert.equal(S.interval(0,0),null);
for(const [o,d] of [[0,0],[20,5],[100,0],[0,100],[30,70]]){let a=S.scenario(600000,o,d);assert.ok(Math.abs(a.pulledCards+a.destroyedCards+a.sealedCards-1800)<1e-8);assert.ok(Math.abs(a.openedBoxes+a.destroyedBoxes+a.sealedBoxes-600000)<1e-8);if(o+d<100)assert.equal(a.boxesPerHit,600000/1800);else assert.equal(a.boxesPerHit,null);}
assert.throws(()=>S.scenario(1000,0,0));assert.throws(()=>S.scenario(600000,90,20));assert.throws(()=>S.scenario(NaN,1,1));
console.log('Stats checks passed: missing fields, mixed pools, winners, exact pack exposure, separate rarity classes, confidence bounds, and scenario conservation.');
