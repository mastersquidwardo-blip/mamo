const assert=require('node:assert/strict');const S=require('../stats.js');
const base={reviewed:true,pool:'Americas',packs:30,gmr:0,selected_outcome:false,collection:'crowd_thread'};
const rows=[{...base,id:'a'},{...base,id:'b',packs:3,gmr:1,selected_outcome:true},{...base,id:'c',gmr:null},{...base,id:'d',packs:null,cases:100,gmr:1},{...base,id:'e',pool:'E-distributed',gmr:7},{...base,id:'f',reviewed:false,gmr:9},{...base,id:'g',collection:'individual_post',packs:12,gmr:1}];
// Positive and negative replies to the same collection request follow the same rule.
assert.deepEqual(S.summarize(rows,'Americas','gmr','crowd_thread').ids,['a','b']);
assert.equal(S.summarize(rows,'Americas','gmr','crowd_thread').boxes,11);
assert.equal(S.summarize(rows,'Americas','gmr','crowd_thread').hits,1);
assert.deepEqual(S.summarize(rows,'Americas','gmr').ids,['a','b','g']);
// No observed GMR outcome, including an all-winner sample, is promoted into population odds.
for(const sample of [rows,[{...base,id:'win',packs:3,gmr:1}],[]]){
 const a=S.summarize(sample,'Americas','gmr');assert.equal(a.per100,null);assert.equal(a.boxesPerHit,null);assert.equal(a.oddsEstablished,false);
}
assert.equal(S.summarize([{...base,id:'partial',packs:4,gmr:1}],'Americas','gmr').boxes,4/3);
assert.equal(S.summarize([{...base,id:'bonus',bonus_sl:2,sl_of:null}],'Americas','sl_of').reports,0);
assert.equal(S.summarize([{...base,id:'bonus',bonus_sl:2,sl_of:null}],'Americas','bonus_sl').hits,2);
for(const [o,d] of [[0,0],[20,5],[100,0],[0,100],[30,70]]){let a=S.scenario(600000,o,d);assert.ok(Math.abs(a.pulledCards+a.destroyedCards+a.sealedCards-1800)<1e-8);assert.ok(Math.abs(a.openedBoxes+a.destroyedBoxes+a.sealedBoxes-600000)<1e-8);if(o+d<100)assert.equal(a.boxesPerHit,600000/1800);else assert.equal(a.boxesPerHit,null);}
assert.throws(()=>S.scenario(1000,0,0));assert.throws(()=>S.scenario(600000,90,20));assert.throws(()=>S.scenario(NaN,1,1));
console.log('Passed: outcome-neutral collection, no GMR odds from biased reports, missing values, mixed pools, exact units, rarity separation and conservation.');
