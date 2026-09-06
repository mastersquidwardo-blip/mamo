/* Counts are rates per exposure, not the chance of a box containing a hit. */
(function(root){
'use strict';
const metrics=['gmr','ur_of','sl_of','main_sl','bonus_sl'];
function eligible(rows,pool,metric,includeWinners=false){
 return rows.filter(r=>r.reviewed&&r.pool===pool&&Number.isInteger(r[metric])&&r[metric]>=0&&Number.isInteger(r.packs)&&r.packs>0&&(includeWinners||!r.selected_outcome));
}
function summarize(rows,pool,metric,includeWinners=false,omitLargest=false){
 let used=eligible(rows,pool,metric,includeWinners);
 const largest=used.reduce((a,b)=>!a||b.packs>a.packs?b:a,null);
 if(omitLargest&&largest)used=used.filter(r=>r.id!==largest.id);
 const packs=used.reduce((s,r)=>s+r.packs,0), hits=used.reduce((s,r)=>s+r[metric],0);
 return {reports:used.length,packs,boxes:packs/3,hits,per100:packs?hits/(packs/3)*100:null,boxesPerHit:hits?packs/3/hits:null,largestShare:packs&&used.length?Math.max(...used.map(r=>r.packs))/packs:0,ids:used.map(r=>r.id)};
}
// Equal-tail exact Poisson count interval, then scale by exposure. It does not correct selection bias.
function poissonCDF(k,lambda){if(lambda===0)return 1;let term=Math.exp(-lambda),sum=term;for(let i=1;i<=k;i++){term*=lambda/i;sum+=term;}return sum;}
function inverseCDF(k,target){let hi=Math.max(1,k+1);while(poissonCDF(k,hi)>target)hi*=2;let lo=0;for(let i=0;i<90;i++){let mid=(lo+hi)/2;if(poissonCDF(k,mid)>target)lo=mid;else hi=mid;}return (lo+hi)/2;}
function interval(hits,boxes){if(!boxes)return null;return [(hits?inverseCDF(hits-1,.975):0)/boxes*100,inverseCDF(hits,.025)/boxes*100];}
function scenario(run,openedPct,destroyedPct){
 if(!Number.isFinite(run)||run<1800||!Number.isFinite(openedPct)||!Number.isFinite(destroyedPct)||openedPct<0||destroyedPct<0||openedPct+destroyedPct>100)throw Error('Enter a print run of at least 1,800 boxes and percentages totaling at most 100%.');
 let o=openedPct/100,d=destroyedPct/100,sealed=Math.max(0,1-o-d);
 return {run,openedBoxes:run*o,destroyedBoxes:run*d,sealedBoxes:run*sealed,pulledCards:1800*o,destroyedCards:1800*d,sealedCards:1800*sealed,boxesPerHit:sealed>0?run/1800:null};
}
const api={metrics,eligible,summarize,interval,scenario};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MamoStats=api;
})(typeof window!=='undefined'?window:globalThis);
