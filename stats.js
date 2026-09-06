/* Counts are rates per exposure, not the chance of a box containing a hit. */
(function(root){
'use strict';
const metrics=['gmr','ur_of','sl_of','main_sl','bonus_sl'];
function eligible(rows,pool,metric,collection='all'){
 return rows.filter(r=>r.reviewed&&r.pool===pool&&Number.isInteger(r[metric])&&r[metric]>=0&&Number.isInteger(r.packs)&&r.packs>0&&(collection==='all'||r.collection===collection));
}
function summarize(rows,pool,metric,collection='all'){
 const used=eligible(rows,pool,metric,collection);
 const packs=used.reduce((s,r)=>s+r.packs,0), hits=used.reduce((s,r)=>s+r[metric],0);
 // GMR source acquisition is not a representative sampling design. Never expose apparent odds from this ledger.
 const canDescribeRate=metric!=='gmr';
 return {reports:used.length,packs,boxes:packs/3,hits,per100:canDescribeRate&&packs?hits/(packs/3)*100:null,boxesPerHit:canDescribeRate&&hits?packs/3/hits:null,oddsEstablished:false,largestShare:packs&&used.length?Math.max(...used.map(r=>r.packs))/packs:0,ids:used.map(r=>r.id)};
}
function scenario(run,openedPct,destroyedPct){
 if(!Number.isFinite(run)||run<1800||!Number.isFinite(openedPct)||!Number.isFinite(destroyedPct)||openedPct<0||destroyedPct<0||openedPct+destroyedPct>100)throw Error('Enter a print run of at least 1,800 boxes and percentages totaling at most 100%.');
 let o=openedPct/100,d=destroyedPct/100,sealed=Math.max(0,1-o-d);
 return {run,openedBoxes:run*o,destroyedBoxes:run*d,sealedBoxes:run*sealed,pulledCards:1800*o,destroyedCards:1800*d,sealedCards:1800*sealed,boxesPerHit:sealed>0?run/1800:null};
}
const api={metrics,eligible,summarize,scenario};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MamoStats=api;
})(typeof window!=='undefined'?window:globalThis);
