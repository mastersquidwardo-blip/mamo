'use strict';
const data=window.MAMO_DATA,stats=window.MamoStats;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=1)=>n.toLocaleString('en-US',{maximumFractionDigits:d});
const metricLabels={gmr:'Grand Master Rare',ur_of:'Ultra overframe',sl_of:'Starlight overframe',main_sl:'Other main-pack Starlight',bonus_sl:'Bonus-pack Starlight'};
function route(){let id=location.hash.slice(1)||'tracker';if(id==='registry')id='tracker';if(!['tracker','rates','scenarios','method'].includes(id))id='tracker';document.querySelectorAll('.page').forEach(p=>p.hidden=p.id!==id);document.querySelectorAll('nav a').forEach(a=>{const active=a.hash==='#'+id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});if(location.hash==='#registry')$('registry').scrollIntoView();}
addEventListener('hashchange',route);
function badge(r){return '<span class="badge '+(r==='Americas'?'americas':'e')+'">'+esc(r)+'</span>';}
function renderOverview(){
 const na=data.serials.filter(s=>s.pool==='Americas').length,eu=data.serials.length-na;
 const counts=[[data.serials.length,'Reported serial identities','Across both print pools'],[na,'Americas /100','Of 1,800 printed copies'],[eu,'E-distributed /100E','Of 1,800 printed copies'],[data.pending.length,'Unresolved reports','May overlap known cards']];
 $('headlineStats').innerHTML=counts.map(([n,label,note])=>'<div class="stat"><span class="value">'+n+'</span><span class="label">'+label+'</span><small>'+note+'</small></div>').join('');
 $('pendingSummary').textContent=data.pending.length+' reports awaiting a readable serial';
 $('pendingRows').innerHTML=data.pending.map(r=>'<article>'+esc(r.card)+'<small>'+esc(r.set)+' · '+esc(r.country)+' · digits / suffix unresolved</small></article>').join('');
 const cards=['Dark Magician, the Pharaoh’s Servant','Kuriboh – Multiply!','Dark Magical Curtain','Favorite HERO Shining Flare Wingman','Favorite HERO Flame Wingman','Winged Kuriboh Sabatiel LV10','Stardust Dragon – Victim Sanctuary','Starjunk Synchron','Synchro Emergency','Number 39: Utopia, Emissary of Light','Gagaga Magician – Gagaga Magic','Gagaga Girl – Cell Phone Subtraction','Odd-Eyes Pendulum Dragon, Four Heavenly Dragons','Horoscope Sorcerer, the Stargazer Magician','Astrograph Sorcerer, the Starfrost Magician','Decode Talker Integration','Cyberse Code Magician','Cyberse Contract Witch'];
 $('cardCoverage').innerHTML='<table><caption class="sr-only">Reported serial coverage for each of the 18 cards</caption><thead><tr><th>Card</th><th>Americas /100</th><th>E-distributed /100E</th></tr></thead><tbody>'+cards.map((name,i)=>{const set='MAMO-EN'+String(i+1).padStart(3,'0');return '<tr><td>'+esc(name)+'<small>'+set+'</small></td><td>'+data.serials.filter(s=>s.set===set&&s.pool==='Americas').length+' / 100</td><td>'+data.serials.filter(s=>s.set===set&&s.pool==='E-distributed').length+' / 100</td></tr>';}).join('')+'</tbody></table>';
 const countries=new Map();data.serials.forEach(s=>countries.set(s.country,(countries.get(s.country)||0)+1));
 $('countryList').innerHTML=[...countries].sort((a,b)=>b[1]-a[1]).map(([country,n])=>'<div class="country-item"><span>'+esc(country)+'</span><span>'+n+'</span></div>').join('');
 const centers={'United States':[-100,39],'Canada':[-106,58],'Mexico':[-102,24],'United Kingdom':[-3,55],'Germany':[10,51],'Spain':[-4,40],'Switzerland':[8,47],'South Africa':[25,-29],'Australia':[134,-25],'Bulgaria':[25,43],'Peru':[-75,-10]};
 const offsets={'Germany':[8,-14],'Switzerland':[8,16],'United Kingdom':[-25,-5],'Spain':[-23,11]};
 $('land').innerHTML=(window.MAMO_WORLD||[]).map(d=>'<path d="'+d+'"/>').join('');
 $('pins').innerHTML=[...countries].filter(([c])=>centers[c]).map(([c,n])=>{const [lon,lat]=centers[c],x=(lon+180)/360*960,y=(90-lat)/180*460,[dx,dy]=offsets[c]||[9,-7];return '<g><title>'+esc(c)+': '+n+' reported serial identities</title><circle cx="'+x+'" cy="'+y+'" r="'+Math.min(12,3+Math.sqrt(n)*1.3)+'"/><text x="'+(x+dx)+'" y="'+(y+dy)+'">'+n+'</text></g>';}).join('');
}
function renderSerials(){const q=$('search').value.toLowerCase().trim(),pool=$('pool').value,ev=$('evidence').value,sort=$('sort').value;
 let rows=data.serials.filter(r=>(pool==='all'||r.pool===pool)&&(!q||[r.card,r.set,r.serial,r.country].join(' ').toLowerCase().includes(q))&&(ev==='all'||(ev==='checked'?r.review==='Source text checked':r.review!=='Source text checked')));
 rows.sort((a,b)=>sort==='country'?a.country.localeCompare(b.country)||a.set.localeCompare(b.set):sort==='serial'?a.serial.localeCompare(b.serial)||a.set.localeCompare(b.set):a.set.localeCompare(b.set)||a.serial.localeCompare(b.serial));
 $('serialRows').innerHTML=rows.map(r=>'<tr><td>'+esc(r.card)+'<small>'+esc(r.set)+'</small></td><td class="serial">'+esc(r.serial)+'</td><td>'+badge(r.pool)+'</td><td>'+esc(r.country)+'<small>'+esc(r.countryBasis)+'</small></td><td><span class="badge '+(r.review==='Source text checked'?'checked':'')+'">'+esc(r.review)+'</span>'+(r.checked?'<small>Reviewed '+esc(r.checked)+'</small>':'')+'</td></tr>').join('');
 $('resultCount').textContent=rows.length+' of '+data.serials.length+' reported identities shown';$('noResults').hidden=rows.length>0;
}
function renderRates(){
 const pool=$('ratePool').value,winners=$('includeWinners').checked,omit=$('omitLargest').checked;
 const keys=pool==='Americas'?stats.metrics:['gmr'];
 $('rateCards').innerHTML=keys.map(metric=>{let rows=data.openings;
 // Ancillary rates respect the North America scope; GMR uses the whole Americas pool.
 if(metric!=='gmr')rows=rows.filter(r=>['United States','Canada','Mexico'].includes(r.country));
 const a=stats.summarize(rows,pool,metric,winners,omit),ci=stats.interval(a.hits,a.boxes);
 return '<article class="rate-card"><h3>'+metricLabels[metric]+'</h3><div class="big">'+(a.packs?a.hits+' in '+fmt(a.boxes)+' boxes':'No usable reports')+'</div><p class="fine">'+a.reports+' reports · '+fmt(a.packs,0)+' packs</p>'+(a.packs?'<p class="fine">'+fmt(a.per100,2)+' cards per 100 boxes<br>95% counting interval: '+fmt(ci[0],2)+'–'+fmt(ci[1],2)+' per 100</p><p class="fine">'+(a.hits?'Observed average: '+fmt(a.boxesPerHit,1)+' boxes per card.':'Zero hits does not mean the rate is zero.')+'</p><p class="fine">Largest report: '+fmt(a.largestShare*100,1)+'% of this exposure.</p>':'')+'</article>';}).join('');
 const scenarios=[['Reviewed reports; successful pulls excluded',false,false],['Including successful-pull posts',true,false],['Including successes; largest report removed',true,true]];
 $('sensitivity').innerHTML='<div class="table-wrap"><table><caption class="sr-only">GMR sample sensitivity</caption><thead><tr><th>Selection</th><th>Reports</th><th>Boxes</th><th>GMRs</th><th>Boxes per GMR</th></tr></thead><tbody>'+scenarios.map(([label,w,o])=>{const a=stats.summarize(data.openings,pool,'gmr',w,o);return '<tr><td>'+label+'</td><td>'+a.reports+'</td><td>'+fmt(a.boxes)+'</td><td>'+a.hits+'</td><td>'+(a.boxesPerHit?fmt(a.boxesPerHit):'No hits observed')+'</td></tr>';}).join('')+'</tbody></table></div>';
}
function renderOpenings(){const hit=n=>n===null||n===undefined?'—':n;
 $('openingRows').innerHTML=data.openings.map(r=>'<tr><td>'+r.id+'<small>'+esc(r.country)+'</small></td><td>'+esc(r.pool)+'<small>'+(r.packs?fmt(r.packs/3)+' boxes / '+r.packs+' packs':(r.cases?r.cases+' cases; size unknown':'Exposure unknown'))+'</small></td>'+['gmr','ur_of','sl_of','main_sl','bonus_sl','unclassified_sl'].map(k=>'<td>'+hit(r[k])+'</td>').join('')+'<td><span class="badge '+(r.reviewed?'checked':'')+'">'+(r.reviewed?'Reviewed':'Needs source review')+'</span><small>'+esc(r.reason)+'</small></td></tr>').join('');}
function renderScenario(){try{const result=stats.scenario(Number($('run').value),Number($('opened').value),Number($('destroyed').value));
 const rows=[['Expected sealed boxes',result.sealedBoxes],['Expected GMRs still sealed',result.sealedCards],['Expected GMRs already pulled',result.pulledCards],['Expected GMRs destroyed unopened',result.destroyedCards]];
 $('scenarioResult').innerHTML='<div class="supply-bar" aria-hidden="true"><span style="width:'+Number($('opened').value)+'%"></span><span style="width:'+Number($('destroyed').value)+'%"></span><span style="width:'+(100-Number($('opened').value)-Number($('destroyed').value))+'%"></span></div>'+rows.map(([label,n])=>'<div class="scenario-row"><span>'+label+'</span><strong>'+fmt(n)+'</strong></div>').join('')+'<p class="fine">'+(result.boxesPerHit?'Expected density: one GMR per '+fmt(result.boxesPerHit)+' surviving boxes on average. Same density as before random opening or destruction.':'No sealed boxes remain in this scenario.')+'</p>';
 }catch(e){$('scenarioResult').innerHTML='<p class="error">'+esc(e.message)+'</p>';}}
['search','pool','evidence','sort'].forEach(id=>$(id).addEventListener('input',renderSerials));['ratePool','includeWinners','omitLargest'].forEach(id=>$(id).addEventListener('change',renderRates));['run','opened','destroyed'].forEach(id=>$(id).addEventListener('input',renderScenario));$('scenarioForm').addEventListener('submit',e=>e.preventDefault());
renderOverview();renderSerials();renderRates();renderOpenings();renderScenario();route();
