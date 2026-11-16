const dataset=window.LAUNCH_ATLAS;
const all=dataset.rows;
const $=s=>document.querySelector(s);
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:2}).format(v);
const pct=v=>v==null?'Not reported':(v>=0?'+':'')+v.toFixed(1)+'%';
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cohort='early',sort='implied_value_usd',direction=-1,page=0,filtered=[],returnFocus=null;
$('#date').textContent=dataset.as_of;
$('#count').textContent=all.length.toLocaleString('en-US');
$('#watch').textContent=all.filter(r=>r.watchlist).length+' / '+all.filter(r=>r.watchlist).length;
$('#early').textContent=all.filter(r=>!r.token_recorded).length;
$('#source-text').textContent='Source: '+dataset.source;
for(const [id,values] of [['category',all.map(r=>r.category)],['chain',all.flatMap(r=>r.chains)]]) {
  [...new Set(values)].sort().forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;$('#'+id).append(o);});
}
function render(){
  const term=$('#search').value.trim().toLowerCase(),cat=$('#category').value,chain=$('#chain').value;
  filtered=all.filter(r=>(cohort==='all'||(cohort==='live'?r.token_recorded:r.research_candidate))&&(!cat||r.category===cat)&&(!chain||r.chains.includes(chain))&&(!$('#watch-only').checked||r.watchlist)&&(!term||(r.name+' '+r.chains.join(' ')+' '+r.category).toLowerCase().includes(term)));
  filtered.sort((a,b)=>{
    if(a[sort]==null && b[sort]!=null) return 1;
    if(b[sort]==null && a[sort]!=null) return -1;
    return direction*((a[sort]??0)-(b[sort]??0))||a.rank-b.rank;
  });
  const pages=Math.max(1,Math.ceil(filtered.length/9));page=Math.min(page,pages-1);
  $('#results').textContent=filtered.length+' matching protocols';
  $('#empty').hidden=filtered.length!==0;
  $('#rows').innerHTML=filtered.slice(page*9,page*9+9).map(r=>`<tr tabindex="0" data-slug="${escape(r.slug)}" aria-label="Inspect ${escape(r.name)}"><td>${String(r.rank).padStart(3,'0')}</td><td><span class="protocol">${escape(r.name)}${r.watchlist?'<span class="watch-mark">◈</span>':''}<small>${escape(r.category)} · ${escape(r.chains.slice(0,2).join(', '))}${r.chains.length>2?' +'+(r.chains.length-2):''}</small></span></td><td>${money(r.tvl_usd)}</td><td class="${(r.growth_7d??0)>=0?'positive':'negative'}">${pct(r.growth_7d)}</td><td class="value">${money(r.implied_value_usd)}<small>${money(r.low_usd)} – ${money(r.high_usd)} scenario</small></td><td><span class="pill ${r.token_recorded?'live':''}">${r.token_recorded?'TOKEN RECORDED':r.watchlist?'WATCHLIST CANDIDATE':'VERIFY TOKEN STATUS'}</span></td><td><button class="inspect" aria-label="Inspect ${escape(r.name)}">↗</button></td></tr>`).join('');
  $('#showing').textContent=filtered.length?`${page*9+1}–${Math.min(page*9+9,filtered.length)} of ${filtered.length} · model rank across all protocols`:'0 protocols';
  $('#prev').disabled=page===0;$('#next').disabled=page+1>=pages;
  document.querySelectorAll('#rows tr').forEach(tr=>{tr.onclick=()=>detail(tr.dataset.slug);tr.onkeydown=e=>{if(e.key==='Enter')detail(tr.dataset.slug);};});
  document.querySelectorAll('[data-sort]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sort===sort)));
  window.__shotReady=true;
}
function detail(slug){
  const r=all.find(x=>x.slug===slug); if(!r)return;
  returnFocus=document.activeElement;
  document.body.style.overflow='hidden';
  $('#detail-content').innerHTML=`<p class="eyebrow">PROTOCOL BRIEF / MODEL RANK ${r.rank}</p><h2 class="detail-title">${escape(r.name)}</h2><div class="detail-subtitle">${escape(r.category)} · ${escape(r.chains.join(' / '))}</div><div class="detail-evidence"><strong>${r.token_recorded?'A token is recorded in this snapshot.':'No token is recorded in this snapshot.'}</strong><br>${r.watchlist?'Included in the house watchlist.':'Outside the house watchlist; independent verification required.'} This is not confirmation of a launch or of reward eligibility.</div><div class="detail-value"><span>HYPOTHETICAL IMPLIED VALUE</span><strong>${money(r.implied_value_usd)}</strong><small>Scenario ${money(r.low_usd)}–${money(r.high_usd)} · not a confidence interval</small></div><div class="factors"><div><span>CATEGORY MULTIPLE</span><strong>${r.factors.category_multiple.toFixed(2)}×</strong></div><div><span>GROWTH FACTOR</span><strong>${r.factors.growth_factor.toFixed(2)}×</strong></div><div><span>MATURITY FACTOR</span><strong>${r.factors.maturity_factor.toFixed(2)}×</strong></div></div><div class="detail-section"><p>${money(r.tvl_usd)} TVL × ${r.factors.category_multiple.toFixed(2)} × ${r.factors.growth_factor.toFixed(3)} × ${r.factors.maturity_factor.toFixed(3)}. Growth: ${pct(r.growth_7d)}. Tracking age: ${r.age_days==null?'unknown':r.age_days+' days'}. ${escape(r.evidence)}; missing inputs reduce the model’s evidence.</p><label class="scenario">MULTIPLE SENSITIVITY <input id="scenario" type="range" min="50" max="150" value="100" aria-label="Valuation sensitivity"><output id="scenario-value">${money(r.implied_value_usd)}</output></label><h3>Research & optional farm plan</h3><p>Budget caps below are assumptions for a reversible experiment, not actual fee quotes. The dashboard sends no transactions.</p><ol>${r.farm_steps.map(s=>'<li>'+escape(s)+'</li>').join('')}</ol><h3>What the snapshot cannot tell you</h3><p>Contract safety, current token existence, eligibility, actual fees, revenue, emissions and launch timing are absent. TVL is not revenue or cash flow. Check them before taking any action.</p></div>`;
  $('#detail').hidden=false;$('#backdrop').hidden=false;
  $('#scenario').oninput=e=>$('#scenario-value').textContent=money(Math.round(r.implied_value_usd*Number(e.target.value)/100));
  $('#close').focus();
}
function close(){
  $('#detail').hidden=true;
  $('#backdrop').hidden=true;
  document.body.style.overflow='';
  if(returnFocus?.isConnected) returnFocus.focus();
}
function modalKeyboard(e){
  if($('#detail').hidden) return;
  if(e.key==='Escape'){e.preventDefault();close();return;}
  if(e.key!=='Tab') return;
  const controls=[...$('#detail').querySelectorAll('button,input,select,a[href],[tabindex="0"]')];
  const first=controls[0],last=controls.at(-1);
  if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
}
$('#close').onclick=close;
$('#backdrop').onclick=close;
document.addEventListener('keydown',modalKeyboard);
for(const id of ['search','category','chain','watch-only'])$('#'+id).addEventListener(id==='search'?'input':'change',()=>{page=0;render();});
document.querySelectorAll('[data-cohort]').forEach(b=>b.onclick=()=>{cohort=b.dataset.cohort;page=0;document.querySelectorAll('[data-cohort]').forEach(x=>x.classList.toggle('active',x===b));render();});
document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{direction=sort===b.dataset.sort?-direction:-1;sort=b.dataset.sort;page=0;render();});
$('#reset').onclick=()=>{for(const id of ['search','category','chain'])$('#'+id).value='';$('#watch-only').checked=false;page=0;render();};
$('#prev').onclick=()=>{page--;render();};$('#next').onclick=()=>{page++;render();};
$('#method-button').onclick=()=>{$('#method').hidden=!$('#method').hidden;if(!$('#method').hidden)$('#method').scrollIntoView({behavior:'smooth'});};
window.atlas={detail,render,rows:all};render();
