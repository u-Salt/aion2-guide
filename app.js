var SIMSRC="data/sim.js?v=1792466109";
const P=ALL[SLUG];
document.getElementById('app').innerHTML=P.body;
document.title=P.cls+' · AION 2 Field Manual';
const DATA=P.DATA, LINKS=P.LINKS, ICONS=P.ICONS, SKILLPLAN=P.SKILLPLAN, PHASES=P.PHASES, C=P.C, TOP=P.TOP;
/* ---------- boards ---------- */
const ABBR=P.ABBR;
const UABBR={'Combat Speed':'SPD','Cooldown Reduction':'CDR','Damage Tolerance':'TOL','Damage Boost':'DMG','Critical Damage Boost':'CDMG','Critical Damage Tolerance':'CTOL','Multi-hit Chance':'MULTI','Multi-hit Resist':'MRES','PvP Damage Boost':'PvP DMG','PvP Damage Tolerance':'PvP TOL'};
const state={board:'Vaizel',mode:'pve',spent:0};
{const s=S.get('board',null);if(s){state.board=s.board;state.mode=s.mode}}
const byName=Object.fromEntries(DATA.boards.map(b=>[b.name,b]));
const COL={Common:'var(--n-common)',Rare:'var(--n-rare)',Legend:'var(--n-legend)',Unique:'var(--n-unique)'};
function nodeShort(n){ // n=[r,c,grade,cost,label,type]
  const lab=n[4].replace(/ \+[\d.]+%?$/,'');
  if(n[5]==='SkillLevel') return ABBR[lab]||lab.slice(0,3).toUpperCase();
  if(n[2]==='Unique') return UABBR[lab]||'%';
  return '';
}
function buildBoardPick(){
  const host=document.getElementById('boardpick');
  host.innerHTML=DATA.boards.map(b=>`<button type="button" data-b="${b.name}">${b.name} <span class="muted small">Lv${b.lvl}</span></button>`).join('');
  host.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{state.board=btn.dataset.b;if(!byName[state.board][state.mode])state.mode=byName[state.board].pve?'pve':'pvp';renderBoard(true)}));
  document.querySelectorAll('#modepick button').forEach(btn=>btn.addEventListener('click',()=>{if(byName[state.board][btn.dataset.mode]){state.mode=btn.dataset.mode;renderBoard(true)}}));
}
let cur=null;
function renderBoard(resetSpent){
  const b=byName[state.board]; if(!b[state.mode]) state.mode=b.pve?'pve':'pvp';
  S.set('board',{board:state.board,mode:state.mode});
  document.querySelectorAll('#boardpick button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.b===state.board));
  document.querySelectorAll('#modepick button').forEach(x=>{x.setAttribute('aria-pressed',x.dataset.mode===state.mode);x.disabled=!b[x.dataset.mode]});
  const route=b[state.mode]; const key=(r,c)=>r+','+c;
  const nodes={}; b.nodes.forEach(n=>nodes[key(n[0],n[1])]=n);
  const step={}; const cum=[]; let t=0;
  route.order.forEach((rc,i)=>{step[key(rc[0],rc[1])]=i+1;t+=nodes[key(rc[0],rc[1])][3];cum.push(t)});
  cur={b,route,nodes,step,cum,key};
  const sl=document.getElementById('crys'); sl.max=t; if(resetSpent){state.spent=(S.get('spent',{})[state.board+'_'+state.mode])||0} sl.value=state.spent;
  document.getElementById('planner').href=LINKS[b.name+'_'+state.mode];
  drawSVG(); drawMiles(); updateSpent();
}
function drawSVG(){
  const {b,nodes,step,key}=cur; const rs=b.nodes.map(n=>n[0]),cs=b.nodes.map(n=>n[1]);
  const r0=Math.min(...rs),r1=Math.max(...rs),c0=Math.min(...cs),c1=Math.max(...cs);
  const S=52,P=34,W=(c1-c0)*S+P*2,H=(r1-r0)*S+P*2;
  const X=c=>P+(c-c0)*S, Y=r=>P+(r-r0)*S;
  let edges='',ns='';
  b.nodes.forEach(n=>{[[0,1],[1,0]].forEach(([dr,dc])=>{const m=nodes[key(n[0]+dr,n[1]+dc)];if(m){
    const both=step[key(n[0],n[1])]!==undefined&&step[key(m[0],m[1])]!==undefined||(n[2]==='Start'&&step[key(m[0],m[1])])||(m[2]==='Start'&&step[key(n[0],n[1])]);
    edges+=`<line x1="${X(n[1])}" y1="${Y(n[0])}" x2="${X(m[1])}" y2="${Y(m[0])}" class="${both?'redge':'edge'}" data-a="${key(n[0],n[1])}" data-b="${key(m[0],m[1])}"/>`}})});
  b.nodes.forEach(n=>{
    const x=X(n[1]),y=Y(n[0]),k=key(n[0],n[1]),st=step[k],sh=nodeShort(n);
    let shape;
    if(n[2]==='Start') shape=`<polygon points="${star(x,y,15,7)}" fill="var(--gold)"/>`;
    else if(n[5]==='SkillLevel'){const r=n[2]==='Legend'?15:13;shape=`<circle cx="${x}" cy="${y}" r="${r}" fill="${COL[n[2]]}" class="nb"/>`}
    else {const s=n[2]==='Unique'?30:(n[2]==='Common'?20:24);shape=`<rect x="${x-s/2}" y="${y-s/2}" width="${s}" height="${s}" rx="${n[2]==='Unique'?5:3}" fill="${COL[n[2]]}" class="nb"/>`}
    const num=st?`<text x="${x}" y="${y+4.5}" text-anchor="middle" class="stepn">${st}</text>`:'';
    const lab=sh?`<text x="${x}" y="${y+(st?27:4)}" text-anchor="middle" class="${st?'lab':'lab0'}">${sh}</text>`:'';
    ns+=`<g class="node${st?' onroute':' offroute'}" data-k="${k}" tabindex="0"><title>${st?'Step '+st+' · ':''}${n[4]}${n[3]?' · '+n[3]+' crystal'+(n[3]>1?'s':''):''}</title>${shape}${num}${lab}</g>`;
  });
  const svg=document.getElementById('board');
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  svg.innerHTML=`<style>
    .edge{stroke:#2e3550;stroke-width:2}
    .redge{stroke:#4a5578;stroke-width:3}
    .redge.own{stroke:var(--gold);stroke-width:4}
    .offroute .nb{opacity:.28}
    .onroute .nb{opacity:.55}
    .onroute.own .nb{opacity:1}
    .stepn{font:700 12px var(--f-mono);fill:#0d1018;pointer-events:none}
    .lab{font:600 9px var(--f-mono);fill:var(--fg);pointer-events:none;letter-spacing:.04em}
    .lab0{font:600 8.5px var(--f-mono);fill:#0d1018;opacity:.75;pointer-events:none}
    .node{cursor:pointer}
    .node:focus{outline:none}
    .node:focus .nb,.node.sel .nb{stroke:#fff;stroke-width:2.5}
  </style>${edges}${ns}<g id="steprings"></g><circle id="nextring" class="nextring" r="21" fill="none" stroke="var(--gold)" stroke-width="3" cx="-99" cy="-99"/>`;
  svg.querySelectorAll('.node').forEach(g=>{const f=()=>pick(g.dataset.k);g.addEventListener('click',f);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();f()}})});
  cur.X=X;cur.Y=Y;
}
function star(cx,cy,R,r){let p=[];for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2,rr=i%2?r:R;p.push((cx+rr*Math.cos(a)).toFixed(1)+','+(cy+rr*Math.sin(a)).toFixed(1))}return p.join(' ')}
function pick(k){
  const {nodes,step,cum}=cur; const n=nodes[k]; const st=step[k];
  document.querySelectorAll('#board .node').forEach(g=>g.classList.toggle('sel',g.dataset.k===k));
  const el=document.getElementById('nodeinfo');
  if(n[2]==='Start'){el.innerHTML='<b>START</b>: free, and already owned.';return}
  el.innerHTML=`<b>${n[4]}</b> · costs ${n[3]} crystal${n[3]>1?'s':''}<br>`+(st?`<span class="muted">Route step ${st} · running total ${cum[st-1]} crystals</span>`:'<span class="muted">Not on this route. Buy it only with leftover crystals.</span>');
}
function drawMiles(){
  const {route,cum}=cur; let prev=0;
  document.getElementById('miles').innerHTML=route.miles.map((m,i)=>{const a=prev+1,z=m[1];prev=z;return `<li data-i="${i}" data-pts="${m[2]}"><span class="st">${a===z?'step '+z:'steps '+a+'–'+z}</span><span>${m[0]}</span><span class="pt">${m[2]}</span></li>`}).join('');
  document.querySelectorAll('#miles li').forEach(li=>li.addEventListener('click',()=>{state.spent=+li.dataset.pts;document.getElementById('crys').value=state.spent;updateSpent()}));
}
function updateSpent(){
  {const sp=S.get('spent',{});sp[state.board+'_'+state.mode]=state.spent;S.set('spent',sp);}
  const {route,cum,step,key,X,Y}=cur; const v=state.spent;
  let owned=0; while(owned<cum.length&&cum[owned]<=v) owned++;
  const ownSet=new Set(route.order.slice(0,owned).map(rc=>key(rc[0],rc[1])));
  document.querySelectorAll('#board .node').forEach(g=>g.classList.toggle('own',ownSet.has(g.dataset.k)));
  document.querySelectorAll('#board .redge').forEach(l=>{const a=l.dataset.a,b=l.dataset.b;const ok=(ownSet.has(a)||cur.nodes[a][2]==='Start')&&(ownSet.has(b)||cur.nodes[b][2]==='Start');l.classList.toggle('own',ok)});
  const ring=document.getElementById('nextring');
  if(owned<route.order.length){const rc=route.order[owned];ring.setAttribute('cx',X(rc[1]));ring.setAttribute('cy',Y(rc[0]))}else{ring.setAttribute('cx',-99)}
  const total=cum[cum.length-1];
  const nextTxt=owned<route.order.length?`next: step ${owned+1}, ${cur.nodes[key(...route.order[owned])][4]} (${cum[owned]-v} more)`:'route complete';
  document.getElementById('crysout').textContent=`${v} / ${total} crystals · ${owned} nodes · ${nextTxt}`;
  document.querySelectorAll('#miles li').forEach(li=>{const p=+li.dataset.pts;li.classList.toggle('done',p<=v)});
  const nx=[...document.querySelectorAll('#miles li')].find(li=>+li.dataset.pts>v);
  document.querySelectorAll('#miles li').forEach(li=>li.classList.toggle('next',li===nx));
}
document.getElementById('crys').addEventListener('input',e=>{state.spent=+e.target.value;updateSpent()});
document.getElementById('stepfwd').addEventListener('click',()=>{const {cum}=cur;const nx=cum.find(c=>c>state.spent);if(nx!==undefined){state.spent=nx;document.getElementById('crys').value=nx;updateSpent()}});
document.getElementById('stepback').addEventListener('click',()=>{const {cum}=cur;const pv=[0,...cum].filter(c=>c<state.spent).pop();if(pv!==undefined){state.spent=pv;document.getElementById('crys').value=pv;updateSpent()}});
document.getElementById('linkpve').href=LINKS.pve; document.getElementById('linkpvp').href=LINKS.pvp;


function showStepRings(from,to){
  const g=document.getElementById('steprings'); if(!g||!cur) return;
  const {route,X,Y}=cur; let h='';
  if(from&&to){ for(let i=from-1;i<=to-1&&i<route.order.length;i++){const rc=route.order[i];h+=`<circle class="stepring" cx="${X(rc[1])}" cy="${Y(rc[0])}" r="24" fill="none" stroke="var(--wind)" stroke-width="3.5"/>`;}
    const last=route.order[Math.min(to,route.order.length)-1]; if(last) h+=`<circle class="stepring stepring-end" cx="${X(last[1])}" cy="${Y(last[0])}" r="30" fill="none" stroke="var(--gold)" stroke-width="2" stroke-dasharray="4 4"/>`;}
  g.innerHTML=h;
}

/* ---------- picture lookup for skills, items, wings, pets ---------- */
const IMGALIAS=[['manastone','Superior Manastone'],['abyssal manastone','Superior Abyssal Manastone'],['theostone',"Theostone: Tiamat's Rage"],['training arcana','Superior Training Arcana'],['arcana','Arcana: Chalice of Vigor'],['potential stone','Potential Stone (Weapon)'],['transfer stone','Transfer Stone (Weapon)'],['rainbow','Soul Crystal: Special'],['soul crystal','Soul Crystal'],['souls','Soul Crystal'],['odyle energy','Odyle Energy'],['featherdown','Sealed Wing Featherdown'],['radiant odyle','Radiant Odyle'],['amplify','Amplify Stone'],['sync stone','Enhance Stone'],['daeva pass','Oath Coin'],['empyrean trace','Wisdom Stone']];
function findImg(n,loose){
  if(!n) return null; n=String(n).trim();
  const I=(typeof ITEMIMG!=='undefined'&&ITEMIMG)||{};
  const FAM={Cogni:'Soul Crystal: Cogni',Fera:'Soul Crystal: Fera',Natura:'Soul Crystal: Natura',Special:'Soul Crystal: Special',Varian:'Soul Crystal'};
  if(FAM[n]&&I[FAM[n]]) return I[FAM[n]];
  if(ICONS[n]) return ICONS[n]; if(I[n]) return I[n];
  const first=n.split(/\s*\/\s*|,\s*/)[0]; if(ICONS[first]) return ICONS[first]; if(I[first]) return I[first];
  const low=n.toLowerCase();
  const k=Object.keys(I).find(x=>x.toLowerCase()===low)||Object.keys(I).find(x=>x.toLowerCase()===first.toLowerCase());
  if(k) return I[k];
  if(!loose) return null;
  const keys=Object.keys(I).sort((a,b)=>b.length-a.length);
  const hit=keys.find(x=>low.includes(x.toLowerCase())); if(hit) return I[hit];
  const al=IMGALIAS.find(([a])=>low.includes(a)); if(al&&I[al[1]]) return I[al[1]];
  return null;
}

const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&(?!amp;|lt;|gt;|#)/g,'&amp;');
function ic(n,cls){const s=findImg(n);return s?`<img class="ico ${cls||''}" src="${s}" alt="" loading="lazy">`:''}
function icn(n,cls){return `<span class="inl">${ic(n,cls||'sm')}${n}</span>`}
function decorate(root){(root||document).querySelectorAll('td b, li b, p b').forEach(b=>{if(b.dataset.dec)return;b.dataset.dec=1;const n=b.textContent.trim();if(findImg(n)&&!b.closest('.tile')&&!b.closest('.fname'))b.insertAdjacentHTML('beforebegin',ic(n,'sm')+' ')})}
const TAGCLS={buff:'buff',debuff:'debuff',nuke:'nuke',filler:''};
function tile(x){const n=typeof x==='string'?x:x.name;const tag=x.tag||'';const man=x.manual?' manual':'';const note=x.note||(x.manual?'manual':tag);
  return `<span class="tile ${TAGCLS[tag]||''}${man}">${ic(n)}<b>${n}</b><small>${note}</small></span>`}
function flow(arr){return arr.map(tile).join('<span class="arrow">→</span>')}

/* ---------- tabs ---------- */
const tabs=[...document.querySelectorAll('nav.tabs button')];
function show(id,push){
  if(!document.getElementById(id)) id='start';
  document.querySelectorAll('section.tab').forEach(s=>s.hidden=s.id!==id);
  tabs.forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===id));
  S.set('tab',id);
  if(id==='progress'&&typeof renderProgress==='function') renderProgress();
  if(push){try{history.replaceState(null,'','#'+id)}catch(e){}}
  window.scrollTo({top:0});
}
tabs.forEach(b=>b.addEventListener('click',()=>show(b.dataset.tab,true)));
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-goto]'); if(!a) return;
  e.preventDefault();
  if(a.dataset.board){state.board=a.dataset.board;state.mode='pvp';renderBoard(true)}
  if(a.dataset.boardpve){state.board=a.dataset.boardpve;state.mode=state.board==='Azphel'?'pvp':'pve';renderBoard(true)}
  show(a.dataset.goto,true);
});

/* ---------- static fill ---------- */
$('lede').innerHTML=`${esc(C.role)} Your full reset plan from level 1 to 45: skill ranks with pictures, specializations, Stigmas, every Daevanion board drawn node by node, the built-in macro, gear and stat targets, wings, pets and a separate PvP build.`;
$('corecallout').innerHTML=`<b>Your core skills are ${C.core.map(n=>icn(n)).join(', ')}.</b> Almost every decision in this guide gets them higher first. Weapon: ${esc(C.weapon)}.`;
$('skillcallout').innerHTML=`<b>Exact rank for every skill at every level</b> is in the <a href="#plan" data-goto="plan">Level plan</a> tab. Passive order: ${C.passivePriority.slice(0,6).map(n=>icn(n)).join(' → ')}.`;
$('spectable').innerHTML=C.specs.map(s=>`<tr><td><b>${s.skill}</b></td><td>${esc(s.leveling)}</td><td>${esc(s.endgame)}</td></tr>`).join('');
if(C.perks&&C.perks.rows){
  const tbl=rows=>`<div class="tablewrap"><table><thead><tr><th>Skill</th><th>Slot 1</th><th>Slot 2</th><th>Slot 3</th><th>While leveling</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r.skill}</b></td><td>${esc(r.s1)}</td><td>${esc(r.s2)}</td><td>${esc(r.s3)}</td><td class="small muted">${esc(r.leveling||'—')}</td></tr>`).join('')}</tbody></table></div>`;
  let h=`<h3>Specializations: best 3 for every skill</h3><p class="small muted">Fill your slots in this order. You get 1 slot at rank 8, 2 at rank 12 and 3 at rank 20; the rank on the skill icon (including Daevanion bonuses) counts. The number in brackets is the rank where that perk unlocks: if it isn't unlocked yet, skip it and take the next one. The last column is what to use instead while leveling to 45.</p>`+tbl(C.perks.rows);
  [C.perks.alt,C.perks.alt2].forEach(A=>{ if(A&&A.rows&&A.rows.length) h+=`<h3 style="font-size:18px;margin-top:16px">${esc(A.title)}</h3><p class="small muted">${esc(A.note||'')}</p>`+tbl(A.rows); });
  $('specwrap').innerHTML=h;
}
$('stigtable').innerHTML=C.stigmasPve.map(s=>`<tr><td class="num">Lv${s.slot}</td><td><b>${s.name}</b></td><td class="small">${esc(s.why)}</td></tr>`).join('');
$('stigtop').innerHTML=TOP.stig.length?`${SLUG==='brawler'?'Top Korean players':'Top players on Global'} run: ${TOP.stig.map(s=>`${s[0]} (${s[1]})`).join(', ')}.`:'';
$('stigorder').innerHTML=C.stigmaOrder.map(s=>`<li>${esc(s)}</li>`).join('');
$('rottip').textContent=C.rotation.tip||'';
$('bossflow').innerHTML=flow(C.rotation.boss);
$('bosssteps').innerHTML=C.rotation.bossSteps.map(s=>`<li>${esc(s)}</li>`).join('');
$('aoeflow').innerHTML=flow(C.rotation.aoe||[]);
$('aoenote').textContent=C.rotation.aoeNote||'';
$('macrorules').innerHTML=C.macro.rules.map(s=>`<li>${esc(s)}</li>`).join('');
$('macrofallback').innerHTML=(C.macro.fallback||[]).map(s=>`<li>${esc(s)}</li>`).join('');
$('statspve').innerHTML=C.statsPve.map(s=>`<li>${esc(s.replace(/^\d+\.\s*/,''))}</li>`).join('');
$('statspvenote').textContent=C.statsPveNote||'';
$('soultable').innerHTML=C.soulBinding.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('');
$('gearweapon').textContent=C.gear.weapon||'';
$('geararmor').textContent=C.gear.armor||'';
$('gearnotes').innerHTML=(C.gear.notes||[]).map(s=>`<li>${esc(s)}</li>`).join('');
$('pvpintro').textContent=C.pvp.intro;
$('pvpstig').innerHTML=C.stigmasPvp.map((s,i)=>`<tr><td class="num">${i+1}</td><td><b>${s.name}</b> <span class="small muted">${esc(s.why)}</span></td></tr>`).join('');
$('pvpstigalt').textContent=C.stigmaPvpAlt||'';
$('pvpskills').innerHTML=C.pvp.skills.map(s=>`<li>${esc(s)}</li>`).join('');
$('pvpcombos').innerHTML=C.pvp.combos.map((c,i)=>`<div><span class="tag ${i%2?'wind':'gold'}">${esc(c.label)}</span><div class="flow" style="margin-top:6px">${c.seq.map(n=>tile({name:n})).join('<span class="arrow">→</span>')}</div></div>`).join('');
$('pvptips').innerHTML=C.pvp.tips.map(s=>`<li>${esc(s)}</li>`).join('');
$('pvpmatch').innerHTML=C.pvp.matchups.filter(m=>m.vs.toLowerCase()!==C.class.toLowerCase()||true).map(m=>`<tr><td><b>${esc(m.vs)}</b></td><td>${esc(m.plan)}</td></tr>`).join('');
$('pvpstats').innerHTML=C.pvp.stats.map(s=>`<li>${esc(s.replace(/^\d+\.\s*/,''))}</li>`).join('');
$('pvpstatsnote').textContent=C.pvp.statsNote||'';
$('pvpstrength').textContent=C.pvp.strength?('Current standing: '+C.pvp.strength):'';
const W=C.wingsPets||{};
$('wpclass').innerHTML=[['PvE wing',W.wingPve],['PvP wing',W.wingPvp],['Pet slots (PvE)',W.petPve],['Pet preset (PvP)',W.petPvp],['Notes',W.notes]].filter(r=>r[1]).map(r=>`<li><b>${r[0]}:</b> ${esc(r[1])}</li>`).join('');
$('disagree').innerHTML=(C.disagreements||[]).map(s=>`<li>${esc(s)}</li>`).join('');
$('sources').innerHTML=[['metabot.gg Daevanion planner &amp; top-player builds',`https://metabot.gg/en/aion-2/classes/${SLUG}`],...(C.sources||[])].slice(0,14).map(s=>`<li><a href="${s[1]}" target="_blank" rel="noopener">${s[0]}</a></li>`).join('');
$('whyorder').innerHTML=`Each board has one node for each of your core skills (${C.core.join(', ')}). Buying those on every open board first gives each skill +1 per board; with four boards that's +4, taking them past rank 12 to open the second specialization slot. Passives come next, then your other main skills, then the orange % corners.`;

if(C.leftover){const el=$('leftover');el.hidden=false;el.innerHTML=`<b>Got spare skill points?</b> ${esc(C.leftover)}${C.spPvp?' <span class="muted">PvP: '+esc(C.spPvp)+'</span>':''}`}
if(C.flatGates&&Object.keys(C.flatGates).length){$('flatnote').textContent=' (except '+Object.entries(C.flatGates).map(([k,v])=>k+', which only needs level '+v).join('; ')+')'}
/* ---------- level plan ---------- */
const SYSN={skill:'Skill',spec:'Spec',stig:'Stigma',dae:'Daevanion',gear:'Gear',tip:'Tip'};
let checks=S.get('checks',{});
function saveChecks(){S.set('checks',checks)}
function renderPlan(){
  let html='';
  C.plan.forEach((b,bi)=>{
    html+=`<div class="bracket"><div class="lv">${b.lv}<small>${esc(b.sub)}</small></div><div class="checks">`;
    b.items.forEach((it,ii)=>{const id=`c${bi}-${ii}`;const sys=SYSN[it[0]]?it[0]:'tip';
      const link=it[2]?` <a href="#boards" data-goto="boards" data-boardpve="${it[2]}">View board →</a>`:'';
      html+=`<label class="check" for="${id}"><input type="checkbox" id="${id}" ${checks[id]?'checked':''}><span class="what"><span class="sys ${sys}">${SYSN[sys]}</span>${it[1]}${link}</span></label>`});
    html+='</div></div>';
  });
  $('planlist').innerHTML=html; decorate($('planlist')); updateBar();
}
function updateBar(){const all=document.querySelectorAll('#planlist input');const done=[...all].filter(i=>i.checked).length;
  $('planbar').style.width=(100*done/all.length)+'%';$('plancount').textContent=`${done} / ${all.length} done`}
document.addEventListener('change',e=>{if(e.target.matches('#planlist input')){checks[e.target.id]=e.target.checked;saveChecks();updateBar()}});
$('planreset').addEventListener('click',()=>{checks={};saveChecks();renderPlan();if(typeof renderPlanGuide==='function'){pgIdx=null;renderPlanGuide()}});

/* ---------- rank grid ---------- */
const GROUPS=[['Main skills',C.activePriority.slice(0,6)],['Other skills',C.activePriority.slice(6)],['Passives',C.passivePriority]];
let ptmode=S.get('ptmode','base');
function renderRanks(){
  const P=SKILLPLAN[ptmode], L=Object.keys(P.states).map(Number).sort((a,b)=>a-b);
  let h=`<thead><tr><th>Skill</th>${L.map(l=>`<th class="num">Lv${l}</th>`).join('')}</tr><tr><th class="pts">Points</th>${L.map(l=>`<th class="num pts">${P.pts[l]}</th>`).join('')}</tr></thead><tbody>`;
  GROUPS.forEach(([g,sk])=>{h+=`<tr class="grp"><td colspan="${L.length+1}">${g}</td></tr>`;
    sk.forEach(s=>{h+=`<tr><td class="sk">${icn(s)}</td>`;let prev=0;
      L.forEach(l=>{const r=P.states[l][s]||0;let c='rk';if(r>prev)c+=' up';if(r>=8&&prev<8)c+=' spec';if(r===10&&prev<10)c+=' max';h+=`<td class="${c}">${r||'·'}</td>`;prev=r});h+='</tr>'})});
  $('rankgrid').innerHTML=h+'</tbody>';
  document.querySelectorAll('#ptmode button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===ptmode));
}
document.querySelectorAll('#ptmode button').forEach(b=>b.addEventListener('click',()=>{ptmode=b.dataset.m;S.set('ptmode',ptmode);renderRanks()}));

/* ---------- daevanion phases ---------- */
const PHASENOTE={12:'Only Nezekan is open. Spend everything here, top to bottom.',20:'Zikel just opened. Buy its core-skill nodes before finishing Nezekan.',30:'Vaizel just opened. After a reset, buy from the top and stop when you run out.',40:'Triniel just opened. Its core-skill nodes come right after the older boards’ core nodes.',99:'Plan finished? Keep going here with your leftover crystals: this fills every remaining node on all four boards (570 crystals in total), best value per crystal first. Do it after the Level 40–44 list is complete.',45:'Azphel opens at 45. It uses its own Azphel crystals from PvP, so it never competes with this list. Keep following the level-40 list for normal crystals.'};
let phase=S.get('phase',30); let pchecks=S.get('pchecks',{});
const PLAB={12:'12–19',20:'20–29',30:'30–39',40:'40–44',45:'45',99:'45+ (max)'};
function renderPhases(){
  const host=$('phasepick');
  host.innerHTML=[12,20,30,40,45].map(l=>`<button type="button" data-l="${l}" aria-pressed="${l===phase}">Level ${PLAB[l]}</button>`).join('');
  host.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{phase=+b.dataset.l;S.set('phase',phase);renderPhases()}));
  $('phasenote').textContent=PHASENOTE[phase];
  const P=PHASES.find(p=>p.lvl===(phase===45?40:phase));
  let running=0;
  const items=P.seq.map(s=>{running+=s.cost;const id=`p-${s.board}-${s.to}`;
    const isPct=!ICONS[s.target];const pic=isPct?`<span class="pctico">%</span>`:ic(s.target);
    return `<li><input type="checkbox" id="${id}" aria-label="Done" ${pchecks[id]?'checked':''}><span class="chip ${s.board}">${s.board}</span>${pic}<span class="small"><b>${s.target} +${isPct?'1.5%':'1'}</b><br><span class="muted">${s.from===s.to?'step '+s.to:'steps '+s.from+'–'+s.to} · ${s.cost} crystals · ${running} total</span></span><button class="go" type="button" data-b="${s.board}" data-pts="${s.pts}">Show on map</button></li>`});
  if(phase===45){
    const AZ=DATA.boards.find(b=>b.name==='Azphel'); let az=0, prev=0, prevPts=0;
    const azRows=(AZ&&AZ.pvp?AZ.pvp.miles:[]).map(m=>{const a=prev+1,z=m[1],cost=m[2]-prevPts;prev=z;prevPts=m[2];az+=cost;const id=`p-Azphel-${z}`;
      return `<li><input type="checkbox" id="${id}" aria-label="Done" ${pchecks[id]?'checked':''}><span class="chip Azphel">Azphel</span><span class="pctico">PvP</span><span class="small"><b>${m[0]} ${/Status/.test(m[0])?'+1%':'+1.5%'}</b><br><span class="muted">${a===z?'step '+z:'steps '+a+'–'+z} · ${cost} Azphel crystals · ${az} total</span></span><button class="go" type="button" data-b="Azphel" data-pts="${m[2]}">Show on map</button></li>`});
    items.unshift(`<li class="phasehead"><span class="small"><b>Azphel (PvP board)</b>: uses its own Azphel crystals from PvP, the Abyss monolith and the Abyss Point shop, so it never competes with your normal crystals. Take all four PvP Damage Boost nodes first, then PvP Damage Tolerance, then Status Resist and Chance.</span></li>`, ...azRows, `<li class="phasehead"><span class="small"><b>Normal crystals</b>: keep following this list for Nezekan to Triniel.</span></li>`);
  }
  const list=$('phaselist'); list.innerHTML=items.join('');
  list.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{pchecks[i.id]=i.checked;S.set('pchecks',pchecks);}));
  list.querySelectorAll('.go').forEach(b=>b.addEventListener('click',()=>{state.board=b.dataset.b;state.mode=b.dataset.b==='Azphel'?'pvp':'pve';renderBoard(true);state.spent=+b.dataset.pts;$('crys').value=state.spent;updateSpent();document.querySelector('.boardlayout').scrollIntoView({behavior:'smooth',block:'start'})}));
}

/* ---------- macro windows ---------- */
/* C.macroAlt = {name, summary, bar, barSteps, rules, sim:{gainPct,min,max,note}}: a better-testing macro shown beside the current one */
function macroChoice(){return C.macroAlt&&S.get('macroOpt','cur')==='alt'?'alt':'cur'}
function buildBar(){
  if(macroChoice()==='alt') return {bar:C.macroAlt.bar,steps:C.macroAlt.barSteps};
  if(C.bar) return {bar:C.bar,steps:C.barSteps};
  const M=C.macro;
  const excl=C.macroExclude||[];
  const man=M.manual.map(m=>m.name).filter(n=>n!=='Defiance').concat(excl.filter(n=>!M.manual.some(m=>m.name===n)));
  const steps=[];
  const add=s=>{if(s&&!steps.includes(s)&&!man.includes(s)&&s!=='Defiance')steps.push(s)};
  (M.buffs||[]).forEach(add);
  M.stacks.forEach(m=>[...m.skills].reverse().forEach(add));
  (C.stigmasPve||[]).forEach(s=>add(s.name));
  // mouse buttons: class override, else the two level-1 basic attacks
  const mouse=(C.mouse||(P.LEVEL1||[]).filter(s=>!man.includes(s)).slice(0,2));
  const rest=steps.filter(s=>!mouse.includes(s));
  const manKeys=['Q','E','4','3','8','7','6','5'], numKeys=['1','2','3','4','5','6','7','8'];
  const used={};
  const manOnly=man.filter(s=>!mouse.includes(s));
  const manSlots=Math.min(manOnly.length,7,10-Math.min(rest.length,3));
  manOnly.slice(0,manSlots).forEach((s,i)=>{used[manKeys[i]]={rows:[s],man:1}});
  const macroKeys=numKeys.filter(k=>!used[k]).concat(['Q','E'].filter(k=>!used[k]));
  rest.forEach((s,i)=>{ if(i<macroKeys.length) used[macroKeys[i]]={rows:[s]}; else { const k=macroKeys[(i-macroKeys.length)%macroKeys.length]; used[k].rows.push(s);} });
  if(mouse[0]) used.LMB={rows:[mouse[0]],man:man.includes(mouse[0])?1:0};
  if(mouse[1]) used.RMB={rows:[mouse[1]],man:man.includes(mouse[1])?1:0};
  manOnly.slice(manSlots).forEach(s=>{const k=['RMB','LMB'].find(k=>!used[k]); if(k) used[k]={rows:[s],man:1}});
  const bar=['1','2','3','4','5','6','7','8','Q','E','LMB','RMB'].map(k=>({k,rows:(used[k]||{rows:[]}).rows,man:used[k]&&used[k].man,free:!used[k]}));
  bar.push({k:'Space',rows:['Defiance'],man:1});
  const slotOf=s=>{const b=bar.find(x=>x.rows.includes(s)&&!x.man);return b?b.k:null};
  let order=[];
  steps.forEach(s=>{const k=slotOf(s); if(k&&!order.includes(k)) order.push(k)});
  mouse.forEach(s=>{const k=slotOf(s); if(k&&!order.includes(k)) order.push(k)});
  // no-cooldown skills go last so they never block the rest
  const nocd=(C.noCdLast||[]).map(slotOf).filter(Boolean);
  const isMouse=k=>k==='LMB'||k==='RMB';
  order=order.filter(k=>!isMouse(k)&&!nocd.includes(k)).concat(nocd.filter(k=>!isMouse(k)),order.filter(k=>k==='RMB'),order.filter(k=>k==='LMB'));
  // repeat a skill right after each opener (e.g. Chanter Dark Crush)
  Object.entries(C.stepsAfter||{}).forEach(([after,openers])=>{
    const ak=slotOf(after); if(!ak) return;
    const ok=openers.map(slotOf).filter(Boolean);
    const out=[]; order.filter(k=>k!==ak).forEach(k=>{out.push(k); if(ok.includes(k)) out.push(ak)});
    if(!out.includes(ak)) out.push(ak);
    order=out;
  });
  return {bar,steps:order};
}
const KEYN={LMB:'Left click',RMB:'Right click',Space:'Space'};
function renderMacroOpt(){
  const mo=$('macroopt'); if(!mo) return;
  if(!C.macroAlt){mo.hidden=true;mo.innerHTML='';return}
  const A=C.macroAlt, ch=macroChoice(), g=A.sim||{}, gain=g.gainPct!=null?`+${g.gainPct}%`:'';
  const range=g.min!=null&&g.max!=null?` (${g.min>0?'+':''}${g.min}% to +${g.max}% across tests)`:'';
  mo.hidden=false;
  mo.innerHTML=`<div class="seg" role="group" aria-label="Macro version"><button type="button" data-mopt="cur" aria-pressed="${ch==='cur'}">Current macro</button><button type="button" data-mopt="alt" aria-pressed="${ch==='alt'}">New option${gain?' '+gain:''}</button></div>`+
    `<p class="small" style="margin:8px 0 0">${ch==='alt'?`<b>${esc(A.name)}</b>: ${esc(A.summary||'')} Simulator: ${gain}${range}. ${g.note?esc(g.note):''} Your current macro is one click away if you prefer it.`:`This is the macro you already have. The new option, <b>${esc(A.name)}</b>, tested ${gain}${range} in the simulator: switch to it to see its skill bar and steps.`}</p>`;
  mo.querySelectorAll('[data-mopt]').forEach(b=>b.addEventListener('click',()=>{S.set('macroOpt',b.dataset.mopt);renderMacro()}));
}
function renderMacro(){
  renderMacroOpt();
  const {bar,steps}=buildBar();
  const cell=n=>n?`<div class="qc">${ic(n)}<span>${n}</span></div>`:`<div class="qc empty"></div>`;
  $('qbar').innerHTML=bar.map(s=>{
    let h=`<div class="qcol${s.man?' man':''}"><div class="qk">${KEYN[s.k]||s.k}${s.k==='Space'?' <span class="muted">(default)</span>':''}</div>`;
    const n=Math.max(1,Math.min(3,s.rows.length));
    for(let r=n-1;r>=0;r--) h+=`<div class="qrow"><i>${r}</i>${cell(s.rows[r])}</div>`;
    return h+`<div class="qnote">${!s.rows.length?'free slot':s.man?'press by hand':'in macro'}</div></div>`;
  }).join('');
  $('stepkeys').textContent=steps.map(k=>KEYN[k]||k).join(', ');
  const stack=rows=>`<div class="stack">${rows.map((s,i)=>`<div class="sl">${ic(s)}<span>${s}</span>${rows.length>1?`<span class="ord">row ${i}${i===0?' · first':''}</span>`:''}</div>`).join('')}</div>`;
  let html=`<div class="mwin"><div class="mhead"><b>Skill Macro 1</b><span class="keychip">Hold: side button / R</span></div><div class="mbody">`+
    steps.map((k,i)=>{const s=bar.find(x=>x.k===k);return `<div class="mstep"><div><div class="no">Step ${i+1}</div><div class="small">Slot ${KEYN[k]||k}</div></div>${stack(s.rows)}<div class="delay">Delay <span class="v">10</span> ms</div></div>`}).join('')+
    `<div class="addrow">+ Add Macro</div></div></div>`;
  const manual=bar.filter(b=>b.man).flatMap(b=>b.rows.map(n=>({n,k:b.k})));
  const notes=Object.fromEntries((C.macro.manual||[]).map(m=>[m.name,m.note]));
  (C.macroExclude||[]).forEach(n=>{if(!notes[n]) notes[n]='toggle or heal: press by hand'});
  html+=`<div class="mwin"><div class="mhead"><b>Pressed by hand</b><span class="keychip">Manual</span></div><div class="mbody"><div class="mannotes">`+
    manual.map(m=>`<div class="mrow">${ic(m.n,'sm')}<div><b>${m.n}</b> <span class="kbd">${KEYN[m.k]||m.k}</span><br><span class="small muted">${m.n==='Defiance'?'Break stuns and CC':(notes[m.n]?esc(notes[m.n]):'')}</span></div></div>`).join('')+`</div></div></div>`;
  $('macrowins').innerHTML=html;
  // rules: generic, plus class-specific ones that match this layout
  const hasStack=bar.some(b=>b.rows.length>1&&!b.man);
  const mi=steps.findIndex(k=>k==='LMB'||k==='RMB'), fillersLast=mi<0||steps.slice(mi).every(k=>k==='LMB'||k==='RMB');
  const gen=['Steps run top to bottom, skip anything on cooldown, and loop while you hold the key.','Charged skills, toggles and heals are pressed by hand, never in the macro'+(/brawler/i.test(C['class']||'')?' (Brawler is the exception inside Rampage, see below).':'.'),...(fillersLast?['No-cooldown fillers go last so they never block a cooldown skill.']:[]),'10 ms delays are fine; raise to 40–50 ms if skills get skipped or your ping is 80–100 ms.'];
  if(hasStack) gen.push('Stacked slots fire their bottom skill first when it is ready, otherwise the next one up.');
  $('macrorules').innerHTML=gen.concat((macroChoice()==='alt'?C.macroAlt.rules:C.macro.rules)||[]).map(s=>`<li>${esc(s)}</li>`).join('');
  $('macrofallback').innerHTML=['Skip any skill you have not unlocked yet; add its step when you do.'].concat(C.macro.fallback||[]).map(s=>`<li>${esc(s)}</li>`).join('');
}

/* ---------- gear planner (per item, PvE and PvP, saved) ---------- */
const ROLEMAP={ranger:'dps',sorcerer:'dps',spiritmaster:'dps',gladiator:'dps',assassin:'dps',chanter:'dps',templar:'tank',cleric:'healer'};
const STONES={
  pve:{
    dps:{weapon:['Attack','Attack','Attack','Attack'],armor:['Attack','Attack','Crit','Crit'],acc:['Accuracy','Accuracy','Attack','Attack'],brace:['Attack','Attack','Crit','Crit'],
      note:'Swap Crit stones to Attack once your crit chance is near the 50% cap. Swap Accuracy stones to Attack once you stop missing bosses (about 1,100–1,200 Accuracy for Season 1, 1,350–1,400 for Ludra).'},
    tank:{weapon:['Attack','Attack','Accuracy','Accuracy'],armor:['Block','Block','Defense','Defense'],acc:['HP','HP','Block','Block'],brace:['Defense','Defense','HP','HP'],
      note:'Attack and Accuracy on the weapon keep your threat up. Swap Block to Defense if you already parry most hits.'},
    healer:{weapon:['Attack','Attack','Attack','Attack'],armor:['HP','HP','Defense','Defense'],acc:['Attack','Attack','Accuracy','Accuracy'],brace:['HP','HP','Defense','Defense'],
      note:'Cleric heals scale with Attack, so Attack on the weapon and accessories raises both healing and damage. HP and Defense keep you alive in raids.'}},
  pvp:{
    dps:{weapon:['PvP Attack','PvP Attack','PvP Attack','PvP Attack'],armor:['PvP Defense','PvP Defense','PvP Attack','PvP Attack'],acc:['Accuracy','Accuracy','Attack','Attack'],brace:['Attack','Attack','Crit','Crit'],
      note:'Abyssal manastones roll a random stat: about 1 in 3 is a PvP stat (PvP Attack, PvP Defense, PvP accuracy/evasion/crit/block), and Superior Abyssal has a 1% PvP Damage Boost roll (keep it: there is no lock, so stop engraving that piece). Lesser Abyssal: Abyss shop, 1,000 AP, 50 a week. Superior Abyssal: weekly Artifact Siege achievements and crafting great successes. Only engrave gear you will keep. Accessories take normal Soulstones, same as PvE. Evasion builds (mainly Ranger and Assassin): swap armor PvP Attack stones for PvP Evasion only if you can reach about 3,000+ Evasion; mid-range Evasion is wasted.'},
    tank:{weapon:['PvP Attack','PvP Attack','Accuracy','Accuracy'],armor:['PvP Defense','PvP Defense','PvP Defense','PvP Defense'],acc:['HP','HP','Block','Block'],brace:['Defense','Defense','HP','HP'],
      note:'Abyssal manastones roll a random stat: about 1 in 3 is a PvP stat (PvP Attack, PvP Defense, PvP accuracy/evasion/crit/block), and Superior Abyssal has a 1% PvP Damage Boost roll (keep it: there is no lock, so stop engraving that piece). Lesser Abyssal: Abyss shop, 1,000 AP, 50 a week. Superior Abyssal: weekly Artifact Siege achievements and crafting great successes. Only engrave gear you will keep. Accessories take normal Soulstones, same as PvE. Tank: keep PvP Defense rolls on armor and Accuracy on the weapon for your stuns.'},
    healer:{weapon:['PvP Attack','PvP Attack','Accuracy','Accuracy'],armor:['PvP Defense','PvP Defense','HP','HP'],acc:['Attack','Attack','Accuracy','Accuracy'],brace:['HP','HP','Defense','Defense'],
      note:'Abyssal manastones roll a random stat: about 1 in 3 is a PvP stat (PvP Attack, PvP Defense, PvP accuracy/evasion/crit/block), and Superior Abyssal has a 1% PvP Damage Boost roll (keep it: there is no lock, so stop engraving that piece). Lesser Abyssal: Abyss shop, 1,000 AP, 50 a week. Superior Abyssal: weekly Artifact Siege achievements and crafting great successes. Only engrave gear you will keep. Accessories take normal Soulstones, same as PvE. Healer: staying alive wins, so keep PvP Defense rolls on armor.'}}
};
const GEARSLOTS={
 pve:[
  {k:'weapon',n:'Weapon',t:'weapon',item:'Enraged Kromede weapon (Fire Temple Conquest, IL86) → Ludra raid (IL102; offline for a rework, no return date yet) or Splendent Dragon Lord craft',enh:'+15, then amplify'},
  {k:'guard',n:'Guard / off-hand',t:'weapon',item:'Fire Temple Conquest (IL86) → Ludra (IL102, once it returns)',enh:'+15'},
  {k:'helmet',n:'Helmet',t:'armor',item:'Nuakum set (Ferocious Horn Den Conquest, IL86) → Splendent Wise/Ebony Dragon Lord craft (IL102, craft-only)',enh:'+10'},
  {k:'shoulders',n:'Shoulders',t:'armor',item:'Nuakum set (Ferocious Horn Den) → Splendent craft (IL102, craft-only)',enh:'+10'},
  {k:'chest',n:'Chest',t:'armor',item:'Nuakum set (Ferocious Horn Den) → Splendent craft (IL102, craft-only)',enh:'+10'},
  {k:'gloves',n:'Gloves',t:'armor',item:'Nuakum set (Ferocious Horn Den) → Splendent craft (IL102, craft-only)',enh:'+10'},
  {k:'legs',n:'Legs',t:'armor',item:'Nuakum set (Ferocious Horn Den) → Splendent craft (IL102, craft-only)',enh:'+10'},
  {k:'boots',n:'Boots',t:'armor',item:'Nuakum set (Ferocious Horn Den) → Splendent craft (IL102, craft-only)',enh:'+10'},
  {k:'cloak',n:'Cloak',t:'armor',item:'Ferocious Horn Den → Splendent craft (IL102, craft-only)',enh:'+10'},
  {k:'necklace',n:'Necklace',t:'acc',item:'Fire Temple accessories or Conquest voucher chest (IL86) → Splendent craft (IL102, craft-only)',enh:'+10'},
  {k:'ear1',n:'Earring 1',t:'acc',item:'Fire Temple / voucher chest → Splendent craft',enh:'+10'},
  {k:'ear2',n:'Earring 2',t:'acc',item:'Fire Temple / voucher chest → Splendent craft',enh:'+10'},
  {k:'ring1',n:'Ring 1',t:'acc',item:'Fire Temple / voucher chest → Splendent craft',enh:'+10'},
  {k:'ring2',n:'Ring 2',t:'acc',item:'Fire Temple / voucher chest → Splendent craft',enh:'+10'},
  {k:'bracelet',n:'Bracelet',t:'brace',item:'Ascension Bracelet for now; Abyssal Bracelet (Ludra drop, or 3 Ludra vouchers + 5M Kinah) once Ludra returns',enh:'+10'},
  {k:'amulet',n:'Amulet',t:'none',item:'Never replaced: Substance Morph Rare → Epic → Unique, each at +10',enh:'+10 per grade'},
  {k:'belt',n:'Belt',t:'none',item:'Never replaced: Substance Morph Rare → Epic → Unique, each at +10',enh:'+10 per grade'}],
 pvp:[
  {k:'weapon',n:'Weapon',t:'weapon',item:"Your PvE weapon (Global has no PvP weapons)",enh:'+15',pot:'Potential +4: PvP Damage Boost +2%'},
  {k:'guard',n:'Guard / off-hand',t:'weapon',item:"Your PvE guard",enh:'+15',pot:'Potential +4: PvP Damage Boost +2%'},
  {k:'helmet',n:'Helmet',t:'armor',item:"Decanus skin (Abyss shop, 45,300 AP): PvP Damage Tolerance +1%. Wear your PvE piece; the skin goes in the Closet",enh:'+10 (PvE piece)',pot:'Potential +4: PvP Damage Tolerance +2%'},
  {k:'shoulders',n:'Shoulders',t:'armor',item:"Decanus skin (Abyss shop, 45,300 AP): PvP Damage Tolerance +1%. Wear your PvE piece; the skin goes in the Closet",enh:'+10 (PvE piece)',pot:'Potential +4: PvP Damage Tolerance +2%'},
  {k:'chest',n:'Chest',t:'armor',item:"Decanus skin (Abyss shop, 45,300 AP): PvP Damage Tolerance +1%. Wear your PvE piece; the skin goes in the Closet",enh:'+10 (PvE piece)',pot:'Potential +4: PvP Damage Tolerance +2%'},
  {k:'gloves',n:'Gloves',t:'armor',item:"Decanus skin (Abyss shop, 45,300 AP): PvP Damage Tolerance +1%. Wear your PvE piece; the skin goes in the Closet",enh:'+10 (PvE piece)',pot:'Potential +4: PvP Damage Tolerance +2%'},
  {k:'legs',n:'Legs',t:'armor',item:"Decanus skin (Abyss shop, 45,300 AP): PvP Damage Tolerance +1%. Wear your PvE piece; the skin goes in the Closet",enh:'+10 (PvE piece)',pot:'Potential +4: PvP Damage Tolerance +2%'},
  {k:'boots',n:'Boots',t:'armor',item:"Decanus skin (Abyss shop, 45,300 AP): PvP Damage Tolerance +1%. Wear your PvE piece; the skin goes in the Closet",enh:'+10 (PvE piece)',pot:'Potential +4: PvP Damage Tolerance +2%'},
  {k:'cloak',n:'Cloak',t:'armor',item:"Decanus skin (Abyss shop, 45,300 AP): PvP Damage Tolerance +1%. Wear your PvE piece; the skin goes in the Closet",enh:'+10 (PvE piece)',pot:'Potential +4: PvP Damage Tolerance +2%'},
  {k:'necklace',n:'Necklace',t:'acc',item:"Decanus skin (Abyss shop, 90,600 AP): PvP Damage Boost +2%. Wear your PvE piece; the skin goes in the Closet",enh:'+10 (PvE piece)',pot:'Potential +4: PvP Damage Boost +2%'},
  {k:'ear1',n:'Earring 1',t:'acc',item:"Decanus skin (Abyss shop, 90,600 AP): PvP Damage Boost +2%. Wear your PvE piece; the skin goes in the Closet",enh:'+10 (PvE piece)',pot:'Potential +4: PvP Damage Boost +2%'},
  {k:'ear2',n:'Earring 2',t:'acc',item:"Decanus skin (Abyss shop, 90,600 AP): PvP Damage Boost +2%. Wear your PvE piece; the skin goes in the Closet",enh:'+10 (PvE piece)',pot:'Potential +4: PvP Damage Boost +2%'},
  {k:'ring1',n:'Ring 1',t:'acc',item:"Your PvE ring (no ring skin exists)",enh:'+10',pot:'Potential +4: PvP Damage Boost +2%'},
  {k:'ring2',n:'Ring 2',t:'acc',item:"Your PvE ring",enh:'+10',pot:'Potential +4: PvP Damage Boost +2%'},
  {k:'bracelet',n:'Bracelet',t:'brace',item:"Your PvE bracelet (Abyssal Bracelet later)",enh:'+10',pot:'Potential +4: PvP Damage Tolerance +2%'},
  {k:'amulet',n:'Amulet',t:'none',item:"<b>Fierce Battle Amulet</b>: PvP Damage Boost +20% (Rare +10% → Epic +15% → Unique +20%, Substance Morph after +10 each time). The one real PvP swap: keep your Revelation Amulet for PvE",enh:'+10 per grade'},
  {k:'belt',n:'Belt',t:'none',item:'Same as PvE (Noble Belt; no PvP belt exists)',enh:'+10 per grade'}
]
};
function soulFor(slot){
  const sb=(C.soulBinding||[]);const n=slot.n.toLowerCase();
  const hit=sb.find(r=>{const s=r[0].toLowerCase();return s.includes(n.split(' ')[0])||(slot.k==='guard'&&s.includes('guard'))||(slot.k==='weapon'&&(s.includes('weapon')||s.includes(C.weapon.toLowerCase().split(' ')[0])))||(slot.k.startsWith('ring')&&s.includes('ring'))||(slot.k.startsWith('ear')&&s.includes('ear'))});
  const v=hit?hit[1]:(slot.t==='none'?'—':'Best available line');
  return /^perfect$/i.test(v.trim())?'Perfect (weak: take Attack, Crit or a damage-boost line if offered)':v;
}
function renderGear(){
  const host=$('gearplan'); if(!host) return;
  const mode=S.get('gearmode','pve'), P2=mode==='pvp'?'gv-':'g-';
  const role=ROLEMAP[SLUG]||'dps', R=STONES[mode][role], sv=S.get('sv',{});
  const box=(key,label)=>`<label class="gchk"><input type="checkbox" data-sv="${key}" ${sv[key]?'checked':''}><span>${label}</span></label>`;
  let done=0,total=0;
  const rows=GEARSLOTS[mode].map(s=>{
    const stones=s.t==='none'?[]:(typeof rollStones==='function'?rollStones(mode,s,R[s.t]):R[s.t]);
    const third=s.t==='none'?null:(mode==='pvp'?s.pot:esc(soulFor(s)));
    const keys=[`${P2}${s.k}-got`,`${P2}${s.k}-enh`].concat(third?[`${P2}${s.k}-x`]:[]).concat(stones.map((_,i)=>`${P2}${s.k}-m${i}`));
    keys.forEach(k=>{total++; if(sv[k]) done++});
    const soul=(s.t==='acc'||s.t==='brace');
    const stoneHtml=stones.length?(soul?'<span class="small muted" style="width:100%">Soulstones:</span>':'')+stones.map((st,i)=>box(`${P2}${s.k}-m${i}`,st)).join(''):'<span class="muted small">No stone slots</span>';
    return `<tr><td><b>${s.n}</b></td><td class="small">${s.item}</td><td>${box(`${P2}${s.k}-got`,'Got it')}</td><td>${box(`${P2}${s.k}-enh`,s.enh)}</td><td>${third?box(`${P2}${s.k}-x`,third):'<span class="muted small">—</span>'}</td><td><div class="gstones">${stoneHtml}</div></td></tr>`;
  }).join('');
  const third=mode==='pvp'?'Potential':'Soul Binding';
  const pvpNote=mode==='pvp'?' Potential always succeeds: each step costs 100k Abyss Points plus Potential Stones (full +4 is 400k AP and 10 stones per item). Potential only works on Soul Bound Unique gear. The upgrade window lists enhancement, manastones, Theostones and Soul Binding as carried over but doesn\'t mention Potential, so assume it may not carry and put it on your IL86/102 keepers. Global has no separate PvP armor: PvP power comes from Potential, the Fierce Battle Amulet, Decanus skins (about 500k AP for the set) and Abyssal manastones. Swap only the amulet between PvE and PvP.':' Keep any Damage Boost stone you roll (there is no lock, so stop engraving that item); odds and top rolls are under Upgrades &amp; stones › Manastones. Don\'t put Superior stones on gear you\'ll replace: use cheap stones until the IL86+ piece is your keeper. Upgrade recipes keep your stones; a different item starts empty.';
  host.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:10px">
      <div class="seg" role="group" aria-label="Gear set"><button type="button" data-gm="pve" aria-pressed="${mode==='pve'}">PvE gear</button><button type="button" data-gm="pvp" aria-pressed="${mode==='pvp'}">PvP gear</button></div>
      <div class="progress" style="flex:1 1 260px"><div class="bar"><i style="width:${total?100*done/total:0}%"></i></div><span class="readout">${done} / ${total} done</span><button class="btn" type="button" id="gearreset">Clear ${mode==='pvp'?'PvP':'PvE'} gear checkmarks</button></div></div>
  <div class="tablewrap"><table class="geartable"><thead><tr><th>Slot</th><th>Best item (where)</th><th>Have</th><th>Enhance</th><th>${third}</th><th>Manastones / Soulstones${mode==='pvp'?' (Abyssal / normal Soulstones)':' (Superior)'}</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p class="small muted" style="margin:8px 0 0"><b>Manastones</b> go on the weapon, guard and armor; necklace, earrings, rings and bracelet take <b>Soulstones</b> (aim for the same stats). ${R.note}${pvpNote}</p>`;
  host.querySelectorAll('[data-gm]').forEach(b=>b.addEventListener('click',()=>{S.set('gearmode',b.dataset.gm);renderGear()}));
  const rb=$('gearreset'); if(rb) rb.addEventListener('click',()=>{const sv=S.get('sv',{});Object.keys(sv).forEach(k=>{if(k.startsWith(P2))delete sv[k]});S.set('sv',sv);renderGear()});
  if(typeof renderGearGuide==='function') setTimeout(renderGearGuide,0);
}
function renderSV(){const sv=S.get('sv',{});document.querySelectorAll('[data-sv]').forEach(i=>{i.checked=!!sv[i.dataset.sv]})}
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.sv;if(!k)return;const sv=S.get('sv',{});sv[k]=e.target.checked;S.set('sv',sv);if(k.startsWith('g-')||k.startsWith('gv-'))renderGear();if(k.startsWith('fm-')&&typeof farmCounts==='function')farmCounts()});

/* ---------- farming guide (shared) ---------- */
function farmImg(n){const src=findImg(n,true);return src?`<img class="ico lg" src="${src}" alt="" loading="lazy">`:`<span class="farmdot" aria-hidden="true" data-l="${esc(String(n).slice(0,2))}"></span>`}
function fkey(n){return 'fm-'+String(n).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)}
function farmCounts(){if(typeof FARM==='undefined'||!FARM)return;const sv=S.get('sv',{});let all=0,done=0;document.querySelectorAll('.farmcard').forEach(card=>{const boxes=card.querySelectorAll('[data-sv^="fm-"]');const d=[...boxes].filter(b=>sv[b.dataset.sv]).length;all+=boxes.length;done+=d;const c=card.querySelector('.fcount');if(c){c.textContent=d+'/'+boxes.length;c.dataset.full=d&&d===boxes.length?'1':'0'}});const t=$('farmtotal');if(t)t.innerHTML=`<div class="progress"><div class="bar"><i style="width:${all?100*done/all:0}%"></i></div><span class="readout">${done} / ${all} farming steps done</span><button class="btn" type="button" id="farmreset">Clear farming checkmarks</button></div>`;const rb=$('farmreset');if(rb)rb.onclick=()=>{const s=S.get('sv',{});Object.keys(s).forEach(k=>{if(k.startsWith('fm-'))delete s[k]});S.set('sv',s);renderFarm()}}
function renderFarm(){
  const host=$('farmlist'); if(!host||typeof FARM==='undefined'||!FARM) return;
  const q=($('farmq')&&$('farmq').value||'').toLowerCase().trim();
  const fav=S.get('farmfav',{});
  let html='';
  FARM.groups.forEach((g,gi)=>{
    const items=g.items.filter(it=>!q||JSON.stringify(it).toLowerCase().includes(q));
    if(!items.length) return;
    html+=`<h3 style="margin-top:8px">${esc(g.title)}</h3><div class="farmgrid">`;
    items.forEach((it,ii)=>{
      const id=`f-${gi}-${ii}`;
      const sv=S.get('sv',{}), fk=fkey(it.name);
      const meth=(it.methods||[]).map((m,mi)=>`<tr><td class="num"><input type="checkbox" data-sv="${fk}-${mi}" aria-label="Done" ${sv[fk+'-'+mi]?'checked':''} style="width:18px;height:18px;accent-color:var(--wind)"></td><td><b>${esc(m.how||'')}</b>${m.where?`<br><span class="muted">${esc(m.where)}</span>`:''}</td><td class="small">${esc(m.limit||'—')}</td><td class="small muted">${esc(m.notes||'')}</td></tr>`).join('');
      html+=`<details class="farmcard"${q?' open':''}><summary>${farmImg(it.name)}<span class="fname"><b>${esc(it.name)}</b><span class="feasy">${esc(it.easiest||'')}</span></span><span class="fcount" title="Steps done">0/0</span></summary>
        <label class="ffav"><input type="checkbox" data-ffav="${esc(it.name)}" ${fav[it.name]?'checked':''}> Tracking this now</label>
        <div class="tablewrap"><table><thead><tr><th class="num">Done</th><th>Best methods</th><th>Limit</th><th>Notes</th></tr></thead><tbody>${meth}</tbody></table></div>
        ${it.spend?`<p class="small" style="margin:8px 0 0"><b>Spend it on:</b> ${esc(it.spend)}</p>`:''}${it.globalNote?`<p class="small muted" style="margin:6px 0 0">${esc(it.globalNote)}</p>`:''}</details>`;
    });
    html+='</div>';
  });
  host.innerHTML=html||'<p class="muted">Nothing matches that search.</p>';
  renderFarmPins(); farmCounts();
}
function renderFarmPins(){
  if(typeof FARM==='undefined'||!FARM) return; const fav=S.get('farmfav',{});
  const pins=FARM.groups.flatMap(g=>g.items).filter(it=>fav[it.name]);
  const pb=$('farmpins'); if(pb) pb.innerHTML=pins.length?`<b>Tracking:</b> `+pins.map(it=>`<span class="tag gold">${esc(it.name)}: ${esc(it.easiest||'')}</span>`).join(' '):'<span class="muted small">Tick "Tracking" on anything you are farming right now and it pins here.</span>';
}
document.addEventListener('input',e=>{if(e.target&&e.target.id==='farmq')renderFarm()});
document.addEventListener('change',e=>{const n=e.target&&e.target.dataset&&e.target.dataset.ffav;if(!n)return;const f=S.get('farmfav',{});f[n]=e.target.checked;if(!f[n])delete f[n];S.set('farmfav',f);renderFarmPins()});

/* ---------- PvE / PvP mode ---------- */
let MODE=S.gget('mode','pve');
function renderModeBits(){
  // tabs that only make sense in one mode
  document.querySelectorAll('nav.tabs button[data-mode]').forEach(b=>{b.hidden=b.dataset.mode!==MODE});
  document.querySelectorAll('[data-onlymode]').forEach(el=>{el.hidden=el.dataset.onlymode!==MODE});
  // stigma box on the Skills tab
  const st=$('stigtable'), sh=$('stigtitle');
  if(st){
    if(MODE==='pvp'){ if(sh) sh.textContent='Stigmas (PvP)'; st.innerHTML=C.stigmasPvp.map((s,i)=>`<tr><td class="num">${i+1}</td><td><b>${s.name}</b></td><td class="small">${esc(s.why)}</td></tr>`).join('')+(C.stigmaPvpAlt?`<tr><td></td><td colspan="2" class="small muted">${esc(C.stigmaPvpAlt)}</td></tr>`:''); }
    else { if(sh) sh.textContent='Stigmas (PvE)'; st.innerHTML=C.stigmasPve.map(s=>`<tr><td class="num">Lv${s.slot}</td><td><b>${s.name}</b></td><td class="small">${esc(s.why)}</td></tr>`).join(''); }
    decorate(st);
    if(typeof addChecks==='function') addChecks();
  }
  document.querySelectorAll('#modepickTop button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===MODE));
  document.body.dataset.mode=MODE;
  const cur=document.querySelector('nav.tabs button[aria-selected="true"]');
  if(cur&&cur.hidden) show(MODE==='pvp'?'pvp':'start',true);
}
function setMode(m){
  MODE=m; S.gset('mode',m);
  S.set('gearmode',m);
  state.mode=m==='pvp'?'pvp':'pve';
  if(m==='pvp'){ state.board='Azphel'; phase=45; S.set('phase',45); }
  else if(state.board==='Azphel'){ state.board='Vaizel'; }
  gidx=null; renderPhases(); renderGear(); if(typeof renderTitles==='function') renderTitles(); renderModeBits(); guideGoto(guideStart(),false);
}
(function(){
  const host=document.getElementById('modepickTop'); if(!host) return;
  host.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.m)));
})();

/* ---------- daily / weekly checklist per character ---------- */
const DWTASKS=[
 {k:'duty',t:'d',srv:1,n:'5 Duty Missions',d:'50k bound Kinah + 1k Abyss Points each. Shared by the whole server. Pick missions by their first reward (always paid; the later slots are less and less likely).'},
 {k:'attend',t:'d',srv:1,n:'Attendance reward',d:'Claimed once per server.'},
 {k:'shugo',t:'d',srv:1,n:'Shugo Festival keys',d:'3 per day (cap 12, 21 with membership). Server-wide.'},
 {k:'invasion',t:'d',srv:1,n:'Dimensional Invasion key',d:'1 per day (cap 7). Server-wide.'},
 {k:'odyle',t:'d',n:'Spend Odyle Energy',d:'Open Exploration/Conquest cubes before it caps (it refills 15 every 3 hours; cap 560, or 840 with membership).'},
 {k:'nightmare',t:'d',n:'Nightmare ×2',d:'2 attempts per day (banks to 14).'},
 {k:'bcm',t:'d',n:'Black Cloud Merchant',d:'Free hourly refresh, different stock per character.'},
 {k:'pets',t:'d',n:'Pet souls',d:'Kill a few monsters for missing pets.'},
 {k:'craft',t:'d',n:'Craft Odyle / food / potions',d:'If your profession is levelled.'},
 {k:'fissure',t:'w',srv:1,n:'Daily Dungeon ×14',d:'Daeva Bio-Research Base (Unknown Fissure tab): a 90-second run paying 3,000–10,000 Enhance Stones by score, 14 entries a week shared by the server.'},
 {k:'conquest',t:'w',n:'Conquest runs',d:'1 reward count per 8h (cap 21). Always take the reward cube.'},
 {k:'trans',t:'w',n:'Transcendence runs',d:'1 per 12h (cap 14). Arcana.'},
 {k:'explore',t:'w',n:'Exploration',d:'7 reward counts per Expedition dungeon.'},
 {k:'trial',t:'w',n:'Ascension Trial ×3',d:'Solo; Enhance Stones, Amplify fragments.'},
 {k:'subj',t:'w',off:1,n:'Subjugation ×3',d:'4-player. Not open on Global yet (probably Season 2), so hidden.'},
 {k:'raid',t:'w',off:1,n:'Ludra raid',d:'GS 2,800; offline for a rework (NC says it will return; a Producer\'s Letter dated 9 Oct names it first; no date yet, checked 19 Oct), so hidden. Attempts on Global unconfirmed (Korea removed its limit); 1 final-boss reward a week in Korea.'},
 {k:'abyss',t:'w',n:'Abyss time',d:'7 h a week per layer (14 h in Lower and Middle with membership). Until 27/28 Oct, Lower Abyss Rift Stones add up to 7 h more (see below). Since 14 Oct you can bank at most 7 h of entry time; how that works with membership is not stated.'},
 {k:'growth',t:'w',off:1,n:'Growth dungeons',d:'Silent Graveyard, Fafnite Amphitheater: 7 h each, Soul Crystals, Enhance Stones. Probably not open on Global yet, so hidden.'},
 {k:'arena',t:'w',n:'Arena / Arena of Tactics',d:'Solitude and Cooperation: 10 participation + 30 win rewards each. Arena of Tactics (10v10, 11:00–14:00 and 19:00–21:00 only): 3 participation + 3 win rewards.'},
 {k:'apshop',t:'w',n:'Abyss Point shop',d:'Weekly limits: Potential Stones and 50 Lesser Abyssal Manastones. Stigma Shards (200) and Azphel crystals (110) have lifetime limits that never reset: buy them as AP allows.'},
 {k:'pass',t:'w',n:'Daeva Pass cap',d:'50,000 EXP per week. Season 1 ends with the 15 Dec PST / 16 Dec CET maintenance.'},
 {k:"rift",t:"d",n:"Spacetime Rift quests",d:"Every 3h (00:00, 03:00 ... UTC), open ~10 min. Enemy-faction rift merchants: bound Kinah, 2,000 AP, Wisdom Stone, Daevanion Crystal. PvP only happens if both you and the other player have War Mode on."},
 {k:"attend2",t:"d",srv:1,n:"Launch attendance (2 calendars)",d:"7-day and 14-day launch logs until 15 Dec. Claim both, once per server. Resets 23:00 Pacific."},
 {k:"dutycmd",t:"w",n:"Abyss Duty Commands",d:"Up to 20 scrolls a week from the Command Merchant in the Abyss: AP + Abyssal Power Shards. Stockpile them and finish before Wednesday (track them in the Journal, J)."},
 {k:"cmdcity",t:"w",srv:1,n:"Command Missions ×12",d:"Command Merchant in Verteron/Altgard: 15,000 Kinah a scroll, 12 a week (level 45). Same reward slots as Duty Missions. Scrolls keep in your bag, so buy all 12 and finish them before Wednesday."},
 {k:"corridor",t:"w",n:"Abyss Corridor",d:"After an Artifact Siege, enter the Corridor at each Artifact your faction holds: 5 minutes of monster killing for Kinah and Abyss Points (0–3 runs a siege). Open until the next siege; needs Abyss time."},
 {k:"siege",t:"w",n:"Artifact Siege + Abyss elites",d:"Siege Mon/Thu/Sat 21:00, Executors 21:30; Nahma Fri/Sun 21:00 (server time; check the in-game timer). Sources disagree on the server clock: an EU creator says German time, while metabot.gg and allthings.how say every region runs on one GMT+9 clock. NC hasn't said; official notices only give PDT and CEST."},
 {k:"planet",t:"w",n:"Planet's Call pass",d:"Event pass: 51 levels, 40,000 EXP in total, 15,000 weekly cap. Ends at the 27 Oct PDT / 28 Oct CET maintenance; under 10,000 pass EXP you can no longer finish it."},
 {k:"passmis",t:"w",n:"Daeva Pass weekly missions",d:"Challenge Season Missions > Weekly Missions, for pass EXP."},
 {k:"wingmorph",t:"w",srv:1,n:"Sealed Wing → Enhance Stone morph",d:"Up to 20 Substance Morphs per server per week (since 7 Oct). Pick which character gets the stones."},
 {k:"spiritstone",t:"w",srv:1,n:"Resurrection Spiritstones (optional)",d:"Wind Breeze Merchants > Special (membership): 25,000 Kinah each, 10 per server per week, until 15 Dec."},
 {k:"halattend",t:"d",srv:1,n:"Trick or Treat attendance (Halloween)",d:"Menu > Attendance: 35 Pumpkin Coins a day, 100 on days 7 and 14. Once per server, until the 3 Nov PST / 4 Nov CET maintenance."},
 {k:"halmis",t:"w",srv:1,n:"Halloween event missions + coin shop",d:"Season Mission > Event tab: weekly missions, once per server (about 235 Pumpkin Coins). Then buy the weekly coin-shop items (Odyle Energy, Nightmare tickets, Shugo keys, Rift Stones). Until 3/4 Nov."},
 {k:"halcandy",t:"w",srv:1,n:"Halloween Candy Keys",d:"60 Candy Key Fragments (from Expedition and Transcendence clears) make a Red, Yellow or Blue Candy Key in Substance Morph, each once a week per server. Red: 20 Growth Pet Chests; Yellow: 10,000 AP; Blue: 4 Odyle Energy. Until 3/4 Nov."},
 {k:"riftstone",t:"w",n:"Lower Abyss Rift Stones (Conquerors of the Abyss)",d:"Wind Breeze Merchants > Special (membership): 50,000 Kinah each, up to 7 per character a week (level 45+), +1 h Lower Abyss time each. Deleted 7 days after you get them. Until 27/28 Oct."},
 {k:"odylebuy",t:"w",n:"Odyle Energy (Bound) (optional)",d:"Wind Breeze Merchants > Special (membership): 25 Odyle + 5 Fine Odyle + 1 Pure Odyle + 50,000 Kinah each, up to 20 per character a week since 14 Oct (no per-server limit during the server-transfer period)."},
 {k:"supplyd",t:"d",n:"Supply Requests (Emergency)",d:"ESC > Supply Request (from level 25). Hand in the requested items for Abyss Points (about 380-6,000 a delivery) and often Enhance Stones. Emergency requests change daily. Check the list before you extract or vendor gear and crafts: some low items are requested."},
 {k:"kinahcap",t:"d",n:"Open-world Kinah (optional)",d:"Unconfirmed: monsters stop paying Kinah after about 1,000,000 per character a day. Worth it on alts once their dailies are done; stop when kills pay nothing."},
 {k:"supplyw",t:"w",n:"Supply Requests (Weekly, Crafting, Boss)",d:"ESC > Supply Request. Weekly requests pay the most Abyss Points; Crafting and Boss requests take crafted items and boss drops. Resets Wednesday."},
 {k:"morphshop",t:"w",n:"Substance Morph > Special > Wind Breeze Merchants (membership)",d:"Soul Crystals and Daily Dungeon Instant Clear Tickets moved here on 14 Oct. Buy the weekly limit shown in game (creator lists with 16 per server + 4 per character are from before 14 Oct)."}
].filter(t=>!t.off); /* off:1 = not open on Global yet (listed under the table) */
function dwChars(){let c=S.gget('chars',null);if(!c||!c.length){c=[{id:'c1',name:'Main',cls:SLUG}];}return c}
function renderDWTable(){
  const host=$('dwtable'); if(!host) return;
  const chars=dwChars(), st=S.gget('dwc',{});
  const clsOpts=Object.keys(ALL).map(k=>`<option value="${k}">${ALL[k].cls}</option>`).join('');
  const head=`<tr><th>Task</th>${chars.map(c=>`<th class="num">${esc(c.name)}<br><span class="kr">${ALL[c.cls]?ALL[c.cls].cls:''}</span><br><button class="dwdel" type="button" data-del="${c.id}" title="Remove ${esc(c.name)}" aria-label="Remove ${esc(c.name)}">✕</button></th>`).join('')}</tr>`;
  const row=t=>{
    const cells=t.srv?`<td class="num" colspan="${chars.length}"><label class="gchk"><input type="checkbox" data-dwc="srv|${t.k}" ${st['srv|'+t.k]?'checked':''}><span>Server-wide: once for all characters</span></label></td>`
      :chars.map(c=>`<td class="num"><input type="checkbox" class="dwbox" data-dwc="${c.id}|${t.k}" aria-label="${esc(t.n)} for ${esc(c.name)}" ${st[c.id+'|'+t.k]?'checked':''}></td>`).join('');
    return `<tr><td><b>${t.n}</b><br><span class="small muted">${t.d}</span></td>${cells}</tr>`;
  };
  const block=(tt,label,key)=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px"><h3 style="margin:0">${label}</h3><button class="btn" type="button" data-dwcreset="${key}">Reset ${key==='d'?'daily':'weekly'} (all characters)</button></div>
    <div class="tablewrap" style="margin-top:8px"><table class="dwtab"><thead>${head}</thead><tbody>${DWTASKS.filter(t=>t.t===tt).map(row).join('')}</tbody></table></div>`;
  host.innerHTML=`<div class="box" style="display:grid;gap:10px">
    <h3 style="margin:0">Your characters</h3>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
      <input id="dwname" type="text" placeholder="Character name" maxlength="20" style="background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:500 14px var(--f-body)">
      <select id="dwcls" style="background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:500 14px var(--f-body)">${clsOpts}</select>
      <button class="btn primary" type="button" id="dwadd">Add character</button>
    </div>
    <p class="small muted" style="margin:0">Each character gets its own column. Server-wide tasks (Duty Missions, Daily Dungeon, Shugo keys, attendance, Halloween missions) only need doing once for everyone on the server.</p>
  </div>`+block('d','Every day','d')+block('w','Every week','w');
  const sel=$('dwcls'); if(sel) sel.value=SLUG;
}
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.dwc;if(!k)return;const st=S.gget('dwc',{});if(e.target.checked)st[k]=true;else delete st[k];S.gset('dwc',st)});
document.addEventListener('click',e=>{
  const a=e.target.closest('#dwadd');
  if(a){const nm=($('dwname').value||'').trim()||('Character '+(dwChars().length+1));const cs=dwChars();cs.push({id:'c'+Date.now().toString(36),name:nm.slice(0,20),cls:$('dwcls').value});S.gset('chars',cs);renderDWTable();return}
  const d=e.target.closest('[data-del]');
  if(d){const id=d.dataset.del;let cs=dwChars().filter(c=>c.id!==id);if(!cs.length)cs=[{id:'c1',name:'Main',cls:SLUG}];S.gset('chars',cs);const st=S.gget('dwc',{});Object.keys(st).forEach(k=>{if(k.startsWith(id+'|'))delete st[k]});S.gset('dwc',st);renderDWTable();return}
  const r=e.target.closest('[data-dwcreset]');
  if(r){const keys=DWTASKS.filter(t=>t.t===r.dataset.dwcreset).map(t=>t.k);const st=S.gget('dwc',{});Object.keys(st).forEach(k=>{if(keys.includes(k.split('|')[1]))delete st[k]});S.gset('dwc',st);renderDWTable()}
});

/* ---------- tick boxes added across the guide ---------- */
/* scope 'c' = saved per class, 'g' = saved once for all characters (server-wide things) */
function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)}
function boxByTitle(root,prefix){return [...document.querySelectorAll(root+' .box')].find(b=>{const h=b.querySelector('h3');return h&&h.textContent.trim().startsWith(prefix)})}
const CHECKS=[
  {pre:'wing',scope:'c',label:'Owned',rows:()=>{const b=boxByTitle('#wings','Wing ladder');return b?[...b.querySelectorAll('table.wingtable')[0].querySelectorAll('tbody tr:not(.wgrp)')]:[]}},
  {pre:'pet',scope:'g',label:'Owned',rows:()=>{const b=boxByTitle('#pets','Pet ladder');const t=b?b.querySelectorAll('table.wingtable'):[];return t[1]?[...t[1].querySelectorAll('tbody tr:not(.wgrp)')]:[]}},
  {pre:'petfam',scope:'g',label:'Done',li:1,rows:()=>{const b=boxByTitle('#pets','Pet ladder');return b?[...b.querySelectorAll('ol.steps > li')]:[]}},
  {pre:'genus',scope:'g',label:'Done',li:1,rows:()=>{const b=document.getElementById('genus');return b?[...b.querySelectorAll('ol.steps > li')]:[]}},
  {pre:'wingnow',scope:'c',label:'Done',li:1,rows:()=>{const b=[...document.querySelectorAll('#wings .box')].find(x=>/Do this now/.test((x.querySelector('h3')||{}).textContent||''));return b?[...b.querySelectorAll('ol > li')]:[]}},
  {pre:'arcana',scope:'c',label:'Got it',rows:()=>{const t=document.querySelector('#arcana table');return t?[...t.querySelectorAll('tbody tr')]:[]}},
  {pre:'stig',scope:'c',label:'Slotted',rows:()=>[...document.querySelectorAll('#stigtable tr')].filter(r=>r.querySelector('b'))},
  {pre:'stigord',scope:'c',label:'Done',li:1,rows:()=>[...document.querySelectorAll('#stigorder > li')]},
  {pre:'perk',scope:'c',label:'Set',rows:()=>[...document.querySelectorAll('#specwrap tbody tr')]},
  {pre:'alt',scope:'g',label:'Done',li:1,rows:()=>{const b=boxByTitle('#alts','Step by step');return b?[...b.querySelectorAll('ol.steps > li')]:[]}},
  {pre:'pvpcombo',scope:'c',label:'Practised',li:1,rows:()=>[...document.querySelectorAll('#pvptips > li')]},
];
function chkStore(scope){return scope==='g'?S.gget('gsv',{}):S.get('sv',{})}
function addChecks(){
  CHECKS.forEach(cfg=>{
    const rows=cfg.rows(); if(!rows||!rows.length) return;
    const store=chkStore(cfg.scope);
    rows.forEach((r,i)=>{
      if(r.querySelector(':scope > .xchk, :scope > td > .xchk')) return;
      const nameEl=r.querySelector('b'); const name=nameEl?nameEl.textContent:(r.textContent||'').slice(0,40);
      const tableIdx=r.closest('table')?[...document.querySelectorAll('#specwrap table')].indexOf(r.closest('table')):-1;
      const key=`${cfg.pre}-${tableIdx>0?'alt-':''}${slug(name)||i}`;
      const attr=cfg.scope==='g'?'data-gsv':'data-sv';
      const html=`<label class="xchk" title="${cfg.label}"><input type="checkbox" ${attr}="${key}" ${store[key]?'checked':''} aria-label="${cfg.label}: ${esc(name)}"><span>${cfg.label}</span></label>`;
      if(cfg.li){ r.insertAdjacentHTML('afterbegin',html+' '); }
      else { const td=r.querySelector('td'); if(td) td.insertAdjacentHTML('afterbegin',html); }
      r.classList.add('xrow');
    });
  });
}
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.gsv;if(!k)return;const st=S.gget('gsv',{});if(e.target.checked)st[k]=true;else delete st[k];S.gset('gsv',st)});
function refreshChecks(){const g=S.gget('gsv',{}),c=S.get('sv',{});document.querySelectorAll('[data-gsv]').forEach(i=>{i.checked=!!g[i.dataset.gsv]});document.querySelectorAll('.xchk [data-sv]').forEach(i=>{i.checked=!!c[i.dataset.sv]})}

/* ---------- spending order list + step-by-step guide under the map ---------- */
let PITEMS=[]; let gidx=S.get('gidx',null);
function phaseItemsFor(ph){
  const out=[];
  const pvpMax=ph===99&&typeof MODE!=='undefined'&&MODE==='pvp';
  const P=PHASES.find(p=>p.lvl===(ph===45?40:ph)&&(pvpMax?p.mode==='pvp':!p.mode)); let running=0;
  const normal=P.seq.map(s=>{running+=s.cost;const base=s.target.split(' ×')[0];const isPct=!ICONS[base];return {id:`${pvpMax?'pv':'p'}-${s.board}-${s.to}`,rmode:pvpMax?'pvp':'pve',board:s.board,pts:s.pts,target:s.target,icon:base,isPct:(s.extra||pvpMax)?(isPct&&/%$/.test(s.amt||'')):isPct,stat:(s.extra||pvpMax)&&isPct&&!/%$/.test(s.amt||''),amt:(s.extra||pvpMax)?(s.amt||''):null,from:s.from,to:s.to,cost:s.cost,total:running,cur:'crystals'}});
  let az=[];
  if(ph===45&&(typeof MODE==='undefined'||MODE==='pvp')){
    const AZ=DATA.boards.find(b=>b.name==='Azphel'); let prev=0,prevPts=0,tot=0;
    az=(AZ&&AZ.pvp?AZ.pvp.miles:[]).map(m=>{const a=prev+1,z=m[1],cost=m[2]-prevPts;prev=z;prevPts=m[2];tot+=cost;let amt=null;if(m[3]){const rc=AZ.pvp.order[z-1];const nd=AZ.nodes.find(n=>n[0]===rc[0]&&n[1]===rc[1]);const mm=nd&&/(\+[\d.]+%?)$/.exec(nd[4]);amt=mm?mm[1]:''}return {id:`p-Azphel-${z}`,board:'Azphel',pts:m[2],target:m[0],isPct:true,pvp:1,amt,from:a,to:z,cost,total:tot,cur:'Azphel crystals'}});
  }
  return (typeof MODE!=='undefined'&&MODE==='pvp')?az.concat(normal):normal.concat(az);
}
function rowHtml(it){
  const pic=it.pvp?'<span class="pctico">PvP</span>':(it.stat?'<span class="pctico">+</span>':it.isPct?'<span class="pctico">%</span>':ic(it.icon||it.target));
  const amt=it.amt!=null?it.amt:it.pvp?(/Status/.test(it.target)?'+1%':'+1.5%'):(it.isPct?'+1.5%':'+1');
  return `<li data-pid="${it.id}"><input type="checkbox" id="${it.id}" aria-label="Done" ${pchecks[it.id]?'checked':''}><span class="chip ${it.board}">${it.board}</span>${pic}<span class="small"><b>${it.amt!=null?it.target.replace(/ ×(\d+)$/,'')+' '+amt+(/ ×\d+$/.test(it.target)?' <span class="muted">×'+it.target.split(' ×')[1]+' nodes</span>':''):it.target+' '+amt}</b><br><span class="muted">${it.from===it.to?'step '+it.to:'steps '+it.from+'–'+it.to} · ${it.cost} ${it.cur} · ${it.total} total</span></span><button class="go" type="button" data-pid="${it.id}">Show on map</button></li>`;
}
function renderPhases(){
  const host=$('phasepick');
  host.innerHTML=[12,20,30,40,45,99].map(l=>`<button type="button" data-l="${l}" aria-pressed="${l===phase}">Level ${PLAB[l]}</button>`).join('');
  host.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{phase=+b.dataset.l;S.set('phase',phase);gidx=null;S.set('gidx',null);renderPhases();guideGoto(guideStart(),false)}));
  $('phasenote').textContent=(phase===99&&typeof MODE!=='undefined'&&MODE==='pvp'?'PvP order for the four normal boards: the PvP build nodes first, then every remaining node, PvP value per crystal first. A full board is the same in PvE and PvP; only the order you buy in changes. The Azphel PvP board has its own list under Level 45. ':PHASENOTE[phase])+(phase===45&&typeof MODE!=='undefined'&&MODE!=='pvp'?' Switch the top bar to PvP to see the Azphel PvP board steps here.':'');
  PITEMS=phaseItemsFor(phase);
  const pvpFirst=typeof MODE!=='undefined'&&MODE==='pvp';
  let html='';
  if(phase===45&&pvpFirst) html+=`<li class="phasehead"><span class="small"><b>Azphel (PvP board)</b>: its own Azphel crystals (PvP, Abyss monolith, Abyss Point shop), so it never competes with your normal crystals. PvP Damage Boost corners first, then PvP Damage Tolerance, then Status Resist and Chance.</span></li>`;
  let shownNormalHead=false;
  PITEMS.forEach(it=>{ if(phase===45&&pvpFirst&&!it.pvp&&!shownNormalHead){html+=`<li class="phasehead"><span class="small"><b>Normal crystals</b>: Nezekan to Triniel.</span></li>`;shownNormalHead=true} html+=rowHtml(it); });
  const list=$('phaselist'); list.innerHTML=html;
  list.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{pchecks[i.id]=i.checked;S.set('pchecks',pchecks);renderGuide();}));
  list.querySelectorAll('.go').forEach(b=>b.addEventListener('click',()=>{const i=PITEMS.findIndex(x=>x.id===b.dataset.pid);guideGoto(i,true)}));
  renderGuide();
}
function guideStart(){const i=PITEMS.findIndex(it=>!pchecks[it.id]);return i<0?Math.max(0,PITEMS.length-1):i}
function guideGoto(i,scroll){
  if(!PITEMS.length) return;
  gidx=Math.max(0,Math.min(PITEMS.length-1,i)); S.set('gidx',gidx);
  const it=PITEMS[gidx];
  state.board=it.board; state.mode=it.rmode||(it.board==='Azphel'?'pvp':'pve');
  renderBoard(true); state.spent=Math.max(0,it.pts-it.cost); $('crys').value=state.spent; updateSpent(); showStepRings(it.from,it.to); const nr=document.getElementById('nextring'); if(nr) nr.setAttribute('cx',-99);
  const svgw=document.querySelector('.svgwrap'); const firstRing=document.querySelector('#steprings .stepring'); if(svgw&&firstRing&&svgw.scrollWidth>svgw.clientWidth){const bb=firstRing.getBBox?firstRing.getBBox():null;}
  document.querySelectorAll('#phaselist li[data-pid]').forEach(li=>li.classList.toggle('gcur',li.dataset.pid===it.id));
  renderGuide();
  if(scroll){const g=$('guidebox'); if(g) g.scrollIntoView({behavior:'smooth',block:'start'});}
}
function renderGuide(){
  const g=$('guidebox'); if(!g) return;
  if(!PITEMS.length){g.innerHTML='';return}
  if(gidx==null||gidx>=PITEMS.length) gidx=guideStart();
  const it=PITEMS[gidx], done=PITEMS.filter(x=>pchecks[x.id]).length;
  const pic=it.pvp?'<span class="pctico">PvP</span>':(it.stat?'<span class="pctico">+</span>':it.isPct?'<span class="pctico">%</span>':ic(it.icon||it.target,'lg'));
  g.innerHTML=`<div class="guidehead"><span class="eyebrow">Step-by-step · Level ${PLAB[phase]}</span><span class="readout">${done} / ${PITEMS.length} done</span></div>
   <div class="guidecur">${pic}<div><div class="small muted">Step ${gidx+1} of ${PITEMS.length}${pchecks[it.id]?' · <span style="color:var(--wind)">done</span>':''}</div><b style="font-size:17px">${it.board}: ${it.target}${it.amt?' <span class="muted">('+it.amt+' each)</span>':''}</b><div class="small">Buy map ${it.from===it.to?'step '+it.to:'steps '+it.from+'–'+it.to}: the <b style="color:var(--wind)">circled</b> nodes on the map, ending at the dashed gold ring · ${it.cost} ${it.cur}</div></div></div>
   <div class="guidebtns"><button class="btn" type="button" id="gprev">← Back</button><button class="btn primary" type="button" id="gnext">${pchecks[it.id]?'Next step →':'Done, next step →'}</button><button class="btn" type="button" id="gundo" ${pchecks[it.id]?'':'hidden'}>Untick this step</button></div>`;
  $('gprev').onclick=()=>guideGoto(gidx-1,false);
  $('gnext').onclick=()=>{pchecks[it.id]=true;S.set('pchecks',pchecks);const cb=document.getElementById(it.id);if(cb)cb.checked=true;
    const nx=PITEMS.findIndex((x,j)=>j>gidx&&!pchecks[x.id]);guideGoto(nx<0?Math.min(gidx+1,PITEMS.length-1):nx,false)};
  $('gundo').onclick=()=>{delete pchecks[it.id];S.set('pchecks',pchecks);const cb=document.getElementById(it.id);if(cb)cb.checked=false;renderGuide()};
}

/* ---------- progress overview ---------- */
function cnt(sel,store){const els=[...document.querySelectorAll(sel)];return {all:els.length,done:els.filter(i=>store?!!store[i.dataset.sv||i.dataset.gsv||i.id]:i.checked).length}}
function renderProgress(){
  const host=$('progresslist'); if(!host) return;
  const sv=S.get('sv',{}), gsv=S.gget('gsv',{});
  const pRows=[];
  const add=(title,c,tab,note)=>pRows.push({title,c,tab,note});
  add('Level plan checklist',cnt('#planlist input'),'plan');
  // Daevanion: all phase lists combined
  {const ids=new Set();[12,20,30,40].forEach(l=>phaseItemsFor(l).forEach(it=>ids.add(it.id)));const all=ids.size,done=[...ids].filter(i=>pchecks[i]).length;add('Daevanion spending order (all levels)',{all,done},'boards');}
  {const it=phaseItemsFor(99);add((typeof MODE!=='undefined'&&MODE==='pvp'?'Daevanion PvP max route':'Daevanion leftover crystals')+' (every node)',{all:it.length,done:it.filter(x=>pchecks[x.id]).length},'boards');}
  {const AZ=DATA.boards.find(b=>b.name==='Azphel');const ms=AZ&&AZ.pvp?AZ.pvp.miles:[];add('Azphel PvP board',{all:ms.length,done:ms.filter(m=>pchecks['p-Azphel-'+m[1]]).length},'boards');}
  {const keys=Object.keys(sv);const pve=GEARSLOTS.pve.reduce((n,s)=>n+2+(s.t==='none'?0:1)+(s.t==='none'?0:STONES.pve[ROLEMAP[SLUG]||'dps'][s.t].length),0);const pvp=GEARSLOTS.pvp.reduce((n,s)=>n+2+(s.t==='none'?0:1)+(s.t==='none'?0:STONES.pvp[ROLEMAP[SLUG]||'dps'][s.t].length),0);
   add('Gear planner (PvE)',{all:pve,done:keys.filter(k=>k.startsWith('g-')&&sv[k]).length},'gear');add('Gear planner (PvP)',{all:pvp,done:keys.filter(k=>k.startsWith('gv-')&&sv[k]).length},'gear');}
  add('Gear path',cnt('[data-sv^="gp-"]',sv),'gear');
  add('Stigmas slotted',cnt('[data-sv^="stig-"]',sv),'skills'); add('Specialization perks set',cnt('[data-sv^="perk-"]',sv),'skills');
  add('Arcana cards',cnt('[data-sv^="arcana-"]',sv),'arcana');
  add('Wings owned',cnt('[data-sv^="wing-"]',sv),'wings'); {const PD=typeof PETGUIDE!=='undefined'&&PETGUIDE&&PETGUIDE.d;add('Pets owned (server)',PD?{all:PD.length,done:PD.filter(p=>gsv[p.k]).length}:cnt('[data-gsv^="pet-"]',gsv),'pets');}
  try{if(typeof panOK==='function'&&panOK()){const pf=panFac(),d=PANTHEON.d.filter(x=>x.av==='now'&&!panOther(x,pf));add('Pantheon decorations',{all:d.length,done:d.filter(x=>sv[panKey(x)]).length},'pantheon');}}catch(e){}
  try{if(typeof cloState==='function'&&colOK('closet')){let all=0,done=0;cloState().cats.forEach(ct=>{all+=ct.rows.length;done+=ct.rows.filter(x=>x.own).length});add('Closet skins (server)',{all,done},'closet');}}catch(e){}
  try{if(typeof monoStones==='function'&&colOK('mono')){const f0=colFac(),f=f0==='B'?'E':f0;let all=0,done=0;monoStones(f).filter(s=>!s.kr).forEach(s=>s.zones.forEach(z=>{all++;if(gsv[monoZoneKey(s,z)])done++}));add('Monolith trace zones (server)',{all,done},'monoliths');const kl=COLLECT.mono.kib[f]||[];add('Kibelisks activated',{all:kl.length,done:kl.filter(k=>sv[k.id]).length},'monoliths');}}catch(e){}
  try{if(typeof achAll==='function'&&colOK('ach')){const a=achAll();add('Achievements done',{all:a.length,done:a.filter(x=>sv[x.r.id]).length},'achievements');}}catch(e){}
  add('Genus Insight steps (server)',cnt('[data-gsv^="genus-"]',gsv),'pets');
  add('Titles owned',cnt('[data-sv^="ttl-"]',sv),'titles');
  add('Farming methods',cnt('[data-sv^="fm-"]',sv),'farming');
  add('PvP upgrades that don\'t touch PvE',cnt('[data-sv^="free-"]',sv),'pvp');
  add('Leveling-alt steps',cnt('[data-gsv^="alt-"]',gsv),'alts');
  // daily per character
  const chars=dwChars(), st=S.gget('dwc',{});
  const dTasks=DWTASKS.filter(t=>t.t==='d'), wTasks=DWTASKS.filter(t=>t.t==='w');
  const perChar=chars.map(c=>{const f=ts=>{const own=ts.filter(t=>!t.srv),srv=ts.filter(t=>t.srv);return {all:own.length+srv.length,done:own.filter(t=>st[c.id+'|'+t.k]).length+srv.filter(t=>st['srv|'+t.k]).length}};return {c,d:f(dTasks),w:f(wTasks)}});
  const bar=c=>{const p=c.all?Math.round(100*c.done/c.all):0;return `<div class="bar"><i style="width:${p}%"></i></div><span class="readout">${c.done} / ${c.all} · ${p}%</span>`};
  const tot=pRows.reduce((a,r)=>({all:a.all+r.c.all,done:a.done+r.c.done}),{all:0,done:0});
  host.innerHTML=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">${C.class} overall</h3><div class="progress">${bar(tot)}</div></div>
   <div class="progrid">${pRows.filter(r=>r.c.all).map(r=>`<button class="progcard" type="button" data-goto="${r.tab}"><span class="ptitle">${r.title}</span><div class="progress">${bar(r.c)}</div></button>`).join('')}</div>
   <div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Daily &amp; weekly by character</h3>
    <div class="tablewrap"><table><thead><tr><th>Character</th><th>Today</th><th>This week</th></tr></thead><tbody>${perChar.map(p=>`<tr><td><b>${esc(p.c.name)}</b> <span class="kr">${ALL[p.c.cls]?ALL[p.c.cls].cls:''}</span></td><td><div class="progress">${bar(p.d)}</div></td><td><div class="progress">${bar(p.w)}</div></td></tr>`).join('')}</tbody></table></div>
    <button class="btn" type="button" data-goto="daily" style="justify-self:start">Open the daily checklist</button></div>
   <div class="box" style="display:grid;gap:8px"><h3 style="margin:0">Other classes</h3><div class="small muted">Level plan, Daevanion and gear ticks saved for your other classes.</div>
    <div class="tablewrap"><table><tbody>${Object.keys(ALL).filter(k=>k!==SLUG&&STORE.c[k]).map(k=>{const o=STORE.c[k]||{};const n=o.checks?Object.values(o.checks).filter(Boolean).length:0,pc=o.pchecks?Object.values(o.pchecks).filter(Boolean).length:0,g=o.sv?Object.keys(o.sv).filter(x=>/^g/.test(x)&&o.sv[x]).length:0;return `<tr><td><b>${ALL[k].cls}</b></td><td class="small">${n} plan · ${pc} Daevanion · ${g} gear ticks</td></tr>`}).join('')||'<tr><td class="muted small">Nothing saved for other classes yet.</td></tr>'}</tbody></table></div></div>`;
}
document.addEventListener('change',()=>{const p=$('progress');if(p&&!p.hidden)renderProgress()});

/* ---------- step-by-step guide for the level plan ---------- */
let pgIdx=S.get('pgidx',null);
function planItems(){const out=[];C.plan.forEach((b,bi)=>b.items.forEach((it,ii)=>out.push({id:`c${bi}-${ii}`,lv:b.lv,sub:b.sub,sys:it[0],text:it[1],board:it[2]})));return out}
function planStart(items){const i=items.findIndex(x=>!checks[x.id]);return i<0?Math.max(0,items.length-1):i}
function renderPlanGuide(){
  const g=$('planguide'); if(!g) return;
  const items=planItems(); if(!items.length){g.innerHTML='';return}
  if(pgIdx==null||pgIdx>=items.length) pgIdx=planStart(items);
  const it=items[pgIdx], done=items.filter(x=>checks[x.id]).length;
  const sysName=(typeof SYSN!=='undefined'&&SYSN[it.sys])||'Step';
  g.innerHTML=`<div class="guidehead"><span class="eyebrow">Step-by-step · Level ${esc(it.lv)} · ${esc(it.sub)}</span><span class="readout">${done} / ${items.length} done</span></div>
   <div class="pgcur"><div class="small muted">Step ${pgIdx+1} of ${items.length}${checks[it.id]?' · <span style="color:var(--wind)">done</span>':''}</div>
   <div class="what"><span class="sys ${it.sys}">${sysName}</span>${it.text}${it.board?` <a href="#boards" data-goto="boards" data-boardpve="${it.board}">View board →</a>`:''}</div></div>
   <div class="guidebtns"><button class="btn" type="button" id="pgprev">← Back</button><button class="btn primary" type="button" id="pgnext">${checks[it.id]?'Next step →':'Done, next step →'}</button><button class="btn" type="button" id="pgundo" ${checks[it.id]?'':'hidden'}>Untick this step</button><button class="btn" type="button" id="pgfind">Jump to first unticked</button><button class="btn" type="button" id="pgshow">Show in list ↓</button></div>`;
  decorate(g);
  const mark=()=>{document.querySelectorAll('#planlist .check').forEach(l=>l.classList.toggle('gcur',l.getAttribute('for')===it.id))};
  mark();
  const sm=$('pgshow'); if(sm) sm.onclick=()=>{const c=document.querySelector('#planlist .check.gcur'); if(c) c.scrollIntoView({behavior:'smooth',block:'center'})};
  $('pgprev').onclick=()=>{pgIdx=Math.max(0,pgIdx-1);S.set('pgidx',pgIdx);renderPlanGuide()};
  $('pgnext').onclick=()=>{checks[it.id]=true;saveChecks();const cb=document.getElementById(it.id);if(cb)cb.checked=true;updateBar();
    const nx=items.findIndex((x,j)=>j>pgIdx&&!checks[x.id]);pgIdx=nx<0?Math.min(pgIdx+1,items.length-1):nx;S.set('pgidx',pgIdx);renderPlanGuide()};
  $('pgundo').onclick=()=>{delete checks[it.id];saveChecks();const cb=document.getElementById(it.id);if(cb)cb.checked=false;updateBar();renderPlanGuide()};
  $('pgfind').onclick=()=>{pgIdx=planStart(items);S.set('pgidx',pgIdx);renderPlanGuide()};
}
document.addEventListener('change',e=>{if(e.target&&e.target.matches&&e.target.matches('#planlist input'))renderPlanGuide()});

/* ---------- title picker: tick what you own, it shows the best one to equip per slot ---------- */
function tkey(n){return 'ttl-'+String(n).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,48)}
function tcolor(t){const map={white:'#e8e6e1',green:'#5fc28d',blue:'#5f9ff2',purple:'#b48cf0',orange:'#f0974c',yellow:'#e9c24f',gold:'#e3b862',red:'#ef6b6b'};const c=t&&(t.color||(TITLES.grades||{})[t.grade]);if(!c)return '';const v=map[String(c).toLowerCase()]||c;return `color:${v}`}
function renderTitles(){
  const host=$('titlebox'); if(!host||typeof TITLES==='undefined'||!TITLES) return;
  const m=(typeof MODE!=='undefined'&&MODE==='pvp')?'pvp':'pve';
  const own=S.get('sv',{});
  const slots=['Attack','Defense','Other'];
  const diffTag=d=>`<span class="tag ${d==='easy'?'wind':d==='hard'?'gold':''}">${esc(d||'')}</span>`;
  const best=slots.map(sl=>{const list=(TITLES[m][sl]||[]);const i=list.findIndex(t=>own[tkey(t.name)]);return {sl,list,i,t:i>=0?list[i]:null}});
  host.innerHTML=`<h3 style="margin:0">Titles: what to equip (${m==='pvp'?'PvP':'PvE'})</h3>
   <p class="small muted" style="margin:0">Tick every title you own. Each slot then shows the best one you have; the next one down is your next goal. Owned titles are saved per class and shared between the PvE and PvP lists. Switch the top bar to ${m==='pvp'?'PvE':'PvP'} for the other ranking.</p>
   ${TITLES.grades?`<div class="small" style="display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center"><span class="muted">Name colour = in-game grade, lowest to highest:</span>${['Common','Rare','Epic','Unique','Heroic','Special'].filter(g=>TITLES.grades[g]).map(g=>`<b style="color:${TITLES.grades[g]}">${g}</b>`).join('')}</div>`:''}
   <div class="grid3">${best.map(b=>`<div class="equipcard"><div class="eyebrow">${b.sl} slot</div>${b.t?`<b style="${tcolor(b.t)}">${esc(b.t.name)}</b><div class="small">${esc(b.t.bonus)}</div><div class="small muted">Rank ${b.i+1} of ${b.list.length}${b.i>0?` · best: ${esc(b.list[0].name)}`:' · best in slot'}</div>`:`<b class="muted">Nothing ticked yet</b><div class="small muted">Best: ${esc((b.list[0]||{}).name||'')}</div>`}</div>`).join('')}</div>
   ${best.map(b=>`<details class="farmcard"${b.t&&b.i===0?'':' open'}><summary><span class="fname"><b>${b.sl} titles, best first</b><span class="feasy">${b.t?`Equipped: ${esc(b.t.name)}`:'Tick the ones you own'}</span></span></summary>
     <div class="tablewrap"><table><thead><tr><th class="num">#</th><th>Title</th><th>Bonus</th><th>How to unlock</th><th class="num">Owned</th></tr></thead><tbody>${b.list.map((t,i)=>`<tr class="${i===b.i?'tcur':''}"><td class="num">${i+1}</td><td><b style="${tcolor(t)}">${esc(t.name)}</b>${t.grade&&t.grade!=='?'?` <span class="tag" style="${tcolor(t)};border-color:currentColor">${esc(t.grade)}</span>`:''} ${diffTag(t.diff)}</td><td class="small">${esc(t.bonus)}</td><td class="small muted">${esc(t.how)}</td><td class="num"><input type="checkbox" data-sv="${tkey(t.name)}" ${own[tkey(t.name)]?'checked':''} aria-label="Own ${esc(t.name)}" style="width:18px;height:18px;accent-color:var(--wind)"></td></tr>`).join('')}</tbody></table></div></details>`).join('')}
   ${(TITLES.notes||[]).length?`<p class="small muted" style="margin:0">${TITLES.notes.slice(0,3).map(esc).join(' ')}</p>`:''}`;
}
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.sv;if(k&&k.startsWith('ttl-'))renderTitles()});

/* ---------- step-by-step guide for the gear planner ---------- */
function gearSteps(){
  const mode=S.get('gearmode','pve'), P2=mode==='pvp'?'gv-':'g-', role=ROLEMAP[SLUG]||'dps', R=STONES[mode][role];
  const out=[];
  GEARSLOTS[mode].forEach(s=>{
    out.push({k:`${P2}${s.k}-got`,slot:s.n,what:`Get it: ${s.item.replace(/<[^>]+>/g,'')}`});
    out.push({k:`${P2}${s.k}-enh`,slot:s.n,what:`Enhance to ${s.enh}`});
    if(s.t!=='none') out.push({k:`${P2}${s.k}-x`,slot:s.n,what:mode==='pvp'?s.pot:`Soul Binding: keep ${soulFor(s)}`});
    if(s.t!=='none') (typeof rollStones==='function'?rollStones(mode,s,R[s.t]):R[s.t]).forEach((st,i)=>out.push({k:`${P2}${s.k}-m${i}`,slot:s.n,what:`${(s.t==='acc'||s.t==='brace')?'Soulstone':'Manastone'} ${i+1}: ${st}${mode==='pvp'&&!(s.t==='acc'||s.t==='brace')?' (Abyssal; keep a PvP roll)':''}`}));
  });
  return {mode,out};
}
function renderGearGuide(){
  const g=$('gearguide'); if(!g) return;
  const {mode,out}=gearSteps(); const sv=S.get('sv',{});
  let i=S.get('ggidx_'+mode,null); if(i==null||i>=out.length){i=out.findIndex(x=>!sv[x.k]);if(i<0)i=out.length-1}
  const it=out[i], done=out.filter(x=>sv[x.k]).length;
  g.innerHTML=`<div class="guidehead"><span class="eyebrow">Step-by-step · ${mode==='pvp'?'PvP':'PvE'} gear</span><span class="readout">${done} / ${out.length} done</span></div>
   <div class="pgcur"><div class="small muted">Step ${i+1} of ${out.length}${sv[it.k]?' · <span style="color:var(--wind)">done</span>':''}</div><div class="what"><b>${esc(it.slot)}</b>: ${esc(it.what)}</div></div>
   <div class="guidebtns"><button class="btn" type="button" id="ggprev">← Back</button><button class="btn primary" type="button" id="ggnext">${sv[it.k]?'Next step →':'Done, next step →'}</button><button class="btn" type="button" id="ggundo" ${sv[it.k]?'':'hidden'}>Untick this step</button><button class="btn" type="button" id="ggfind">Jump to first unticked</button><button class="btn" type="button" id="ggshow">Show in table ↓</button></div>
   <p class="small muted" style="margin:0">Weapon first (biggest damage gain), then armor, then accessories. Use the PvE gear / PvP gear buttons below to switch sets; each set has its own steps.</p>`;
  const save=n=>S.set('ggidx_'+mode,n);
  $('ggprev').onclick=()=>{save(Math.max(0,i-1));renderGearGuide()};
  $('ggnext').onclick=()=>{const s=S.get('sv',{});s[it.k]=true;S.set('sv',s);const nx=out.findIndex((x,j)=>j>i&&!s[x.k]);save(nx<0?Math.min(i+1,out.length-1):nx);renderGear();renderGearGuide()};
  $('ggundo').onclick=()=>{const s=S.get('sv',{});delete s[it.k];S.set('sv',s);renderGear();renderGearGuide()};
  $('ggfind').onclick=()=>{const s=S.get('sv',{});let n=out.findIndex(x=>!s[x.k]);save(n<0?out.length-1:n);renderGearGuide()};
  document.querySelectorAll('#gearplan .gcur,#gearplan .gcurrow').forEach(el=>el.classList.remove('gcur','gcurrow'));
  const cb=document.querySelector(`#gearplan [data-sv="${it.k}"]`);
  if(cb){const ch=cb.closest('.gchk'); if(ch) ch.classList.add('gcur'); const tr=cb.closest('tr'); if(tr) tr.classList.add('gcurrow');}
  const sm=$('ggshow'); if(sm) sm.onclick=()=>{const c=document.querySelector('#gearplan .gcur'); if(c) c.scrollIntoView({behavior:'smooth',block:'center'})};
}

/* ---------- step-by-step guide for farming ---------- */
function farmSteps(){
  if(typeof FARM==='undefined'||!FARM) return [];
  const only=S.get('farmonly',false), fav=S.get('farmfav',{});
  const out=[];
  FARM.groups.forEach(g=>g.items.forEach(it=>{
    if(only&&!fav[it.name]) return;
    (it.methods||[]).forEach((m,mi)=>out.push({k:`${fkey(it.name)}-${mi}`,item:it.name,group:g.title,how:m.how||'',where:m.where||'',limit:m.limit||'',notes:m.notes||''}));
  }));
  return out;
}
function renderFarmGuide(){
  const g=$('farmguide'); if(!g) return;
  const out=farmSteps(), sv=S.get('sv',{}), only=S.get('farmonly',false);
  if(!out.length){g.innerHTML=`<div class="guidehead"><span class="eyebrow">Step-by-step farming</span></div><p class="small muted" style="margin:0">${only?'Nothing is marked "Tracking this now" yet. Tick it on a card below, or turn off "Only what I\'m tracking".':'No farming data.'}</p><label class="gchk" style="justify-self:start"><input type="checkbox" id="farmonly" ${only?'checked':''}><span>Only what I'm tracking</span></label>`;bindFarmOnly();return}
  let i=S.get('fgidx',null); if(i==null||i>=out.length){i=out.findIndex(x=>!sv[x.k]);if(i<0)i=out.length-1}
  const it=out[i], done=out.filter(x=>sv[x.k]).length;
  const src=findImg(it.item,true);
  g.innerHTML=`<div class="guidehead"><span class="eyebrow">Step-by-step farming · ${esc(it.group)}</span><span class="readout">${done} / ${out.length} done</span></div>
   <div class="guidecur">${src?`<img class="ico lg" src="${src}" alt="">`:`<span class="farmdot" aria-hidden="true" data-l="${esc(it.item.slice(0,2))}"></span>`}<div><div class="small muted">Step ${i+1} of ${out.length}${sv[it.k]?' · <span style="color:var(--wind)">done</span>':''}</div><b style="font-size:16px">${esc(it.item)}</b><div class="small"><b>${esc(it.how)}</b>${it.where?' · '+esc(it.where):''}</div><div class="small muted">${it.limit?'Limit: '+esc(it.limit)+' · ':''}${esc(it.notes)}</div></div></div>
   <div class="guidebtns"><button class="btn" type="button" id="fgprev">← Back</button><button class="btn primary" type="button" id="fgnext">${sv[it.k]?'Next step →':'Done, next step →'}</button><button class="btn" type="button" id="fgundo" ${sv[it.k]?'':'hidden'}>Untick this step</button><button class="btn" type="button" id="fgfind">Jump to first unticked</button><button class="btn" type="button" id="fgshow">Show in list ↓</button><label class="gchk"><input type="checkbox" id="farmonly" ${only?'checked':''}><span>Only what I'm tracking</span></label></div>`;
  const save=n=>S.set('fgidx',n);
  $('fgprev').onclick=()=>{save(Math.max(0,i-1));renderFarmGuide()};
  $('fgnext').onclick=()=>{const s=S.get('sv',{});s[it.k]=true;S.set('sv',s);const cb=document.querySelector(`[data-sv="${it.k}"]`);if(cb)cb.checked=true;farmCounts();const nx=out.findIndex((x,j)=>j>i&&!s[x.k]);save(nx<0?Math.min(i+1,out.length-1):nx);renderFarmGuide()};
  $('fgundo').onclick=()=>{const s=S.get('sv',{});delete s[it.k];S.set('sv',s);const cb=document.querySelector(`[data-sv="${it.k}"]`);if(cb)cb.checked=false;farmCounts();renderFarmGuide()};
  $('fgfind').onclick=()=>{const s=S.get('sv',{});const n=out.findIndex(x=>!s[x.k]);save(n<0?out.length-1:n);renderFarmGuide()};
  bindFarmOnly();
  document.querySelectorAll('#farmlist .fcurrow').forEach(el=>el.classList.remove('fcurrow'));
  const cb=document.querySelector(`#farmlist [data-sv="${it.k}"]`);
  if(cb){const tr=cb.closest('tr'); if(tr) tr.classList.add('fcurrow'); const det=cb.closest('details'); if(det) det.open=true;}
  const sm=$('fgshow'); if(sm) sm.onclick=()=>{const r=document.querySelector('#farmlist .fcurrow'); if(r) r.scrollIntoView({behavior:'smooth',block:'center'})};
}
function bindFarmOnly(){const o=$('farmonly');if(o)o.onchange=()=>{S.set('farmonly',o.checked);S.set('fgidx',null);renderFarmGuide()}}
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&(e.target.dataset.sv||e.target.dataset.ffav);if(k&&(String(k).startsWith('fm-')||e.target.dataset.ffav))renderFarmGuide()});

/* ---------- step-by-step guide for daily / weekly ---------- */
function dwSteps(cid,which){
  return DWTASKS.filter(t=>which==='all'||t.t===which).map(t=>({k:(t.srv?'srv':cid)+'|'+t.k,t}));
}
function renderDWGuide(){
  const g=$('dwguide'); if(!g) return;
  const chars=dwChars(); let cid=S.gget('dwgchar',chars[0].id); if(!chars.find(c=>c.id===cid)) cid=chars[0].id;
  const which=S.gget('dwgwhich','d');
  const st=S.gget('dwc',{}), out=dwSteps(cid,which);
  let i=S.gget('dwgidx',null); if(i==null||i>=out.length){i=out.findIndex(x=>!st[x.k]);if(i<0)i=out.length-1}
  const it=out[i], done=out.filter(x=>st[x.k]).length, ch=chars.find(c=>c.id===cid);
  g.innerHTML=`<div class="guidehead"><span class="eyebrow">Step-by-step · ${which==='d'?'today':which==='w'?'this week':'daily + weekly'}</span><span class="readout">${done} / ${out.length} done</span></div>
   <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
     <label class="small muted">Character <select id="dwgchar" style="background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:6px 8px">${chars.map(c=>`<option value="${c.id}" ${c.id===cid?'selected':''}>${esc(c.name)} (${ALL[c.cls]?ALL[c.cls].cls:''})</option>`).join('')}</select></label>
     <div class="seg" role="group" aria-label="Which tasks"><button type="button" data-dwg="d" aria-pressed="${which==='d'}">Daily</button><button type="button" data-dwg="w" aria-pressed="${which==='w'}">Weekly</button><button type="button" data-dwg="all" aria-pressed="${which==='all'}">Both</button></div>
   </div>
   <div class="pgcur"><div class="small muted">Step ${i+1} of ${out.length}${st[it.k]?' · <span style="color:var(--wind)">done</span>':''}${it.t.srv?' · <span class="tag">server-wide</span>':' · for '+esc(ch.name)}</div><div class="what"><b>${esc(it.t.n)}</b>: ${esc(it.t.d)}</div></div>
   <div class="guidebtns"><button class="btn" type="button" id="dwgprev">← Back</button><button class="btn primary" type="button" id="dwgnext">${st[it.k]?'Next step →':'Done, next step →'}</button><button class="btn" type="button" id="dwgundo" ${st[it.k]?'':'hidden'}>Untick this step</button><button class="btn" type="button" id="dwgfind">Jump to first unticked</button></div>`;
  const save=n=>S.gset('dwgidx',n);
  $('dwgchar').onchange=e=>{S.gset('dwgchar',e.target.value);save(null);renderDWGuide()};
  g.querySelectorAll('[data-dwg]').forEach(b=>b.onclick=()=>{S.gset('dwgwhich',b.dataset.dwg);save(null);renderDWGuide()});
  $('dwgprev').onclick=()=>{save(Math.max(0,i-1));renderDWGuide()};
  $('dwgnext').onclick=()=>{const s=S.gget('dwc',{});s[it.k]=true;S.gset('dwc',s);const nx=out.findIndex((x,j)=>j>i&&!s[x.k]);save(nx<0?Math.min(i+1,out.length-1):nx);renderDWTable();renderDWGuide()};
  $('dwgundo').onclick=()=>{const s=S.gget('dwc',{});delete s[it.k];S.gset('dwc',s);renderDWTable();renderDWGuide()};
  $('dwgfind').onclick=()=>{const s=S.gget('dwc',{});const n=out.findIndex(x=>!s[x.k]);save(n<0?out.length-1:n);renderDWGuide()};
}
document.addEventListener('change',e=>{if(e.target&&e.target.dataset&&e.target.dataset.dwc)renderDWGuide()});
document.addEventListener('click',e=>{if(e.target.closest('#dwadd,[data-del],[data-dwcreset]'))setTimeout(renderDWGuide,0)});

/* ---------- in-game grade colours on item names (wings, pets, gear, farming, arcana) ---------- */
const GORDER=['Common','Rare','Epic','Unique','Heroic','Special'];
function gradeHex(g){return (GRADES&&GRADES.grades&&GRADES.grades[g])||''}
let GRX=null;
function gradeRx(){
  if(GRX||!GRADES) return GRX;
  const keys=Object.keys(GRADES.names).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  GRX=new RegExp(`(?<![\\w'])(${keys.join('|')})(?![\\w']| vouchers?)`,'g');
  return GRX;
}
function gradeColor(root){
  const rx=gradeRx(); if(!rx||!root) return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&n.parentElement.closest('.gr,script,style,button,label.gchk')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes=[]; while(w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n=>{
    const s=n.nodeValue; rx.lastIndex=0; if(!rx.test(s)) return; rx.lastIndex=0;
    const f=document.createDocumentFragment(); let last=0, m;
    while((m=rx.exec(s))){
      if(m.index>last) f.appendChild(document.createTextNode(s.slice(last,m.index)));
      const g=GRADES.names[m[1]], sp=document.createElement('span');
      sp.className='gr'; sp.style.color=gradeHex(g); sp.title=g+' grade'; sp.textContent=m[1]; f.appendChild(sp); last=m.index+m[1].length;
    }
    if(last<s.length) f.appendChild(document.createTextNode(s.slice(last)));
    n.parentNode.replaceChild(f,n);
  });
}
function gradeTag(g){return `<span class="tag gtag" style="color:${gradeHex(g)};border-color:currentColor">${g}</span>`}
function gradeAll(){
  if(!GRADES) return;
  // wing ladder: grade tag on every wing, replacing the old grey labels
  const wt=document.querySelector('#wings table.wingtable');
  if(wt) wt.querySelectorAll('tbody tr:not(.wgrp) td:nth-child(2)').forEach(td=>{
    td.querySelectorAll('.kr').forEach(k=>k.remove());
    if(td.querySelector('.gtag')) return;
    const gs=[...td.querySelectorAll('b')].map(b=>GRADES.names[b.textContent.trim()]).filter(Boolean);
    [...new Set(gs)].forEach(g=>{const b=td.querySelectorAll('b');b[b.length-1].insertAdjacentHTML('afterend',' '+gradeTag(g))});
  });
  ['#wings td b','#wings li b','#pets td b','#pets li b','#upgrades td b','#content td b','#wpclass','#gearplan td.small','#gearguide .what','#farmlist .fname b','#farmpins','#farmguide b','#arcana td b','#arcana li b'].forEach(sel=>document.querySelectorAll(sel).forEach(gradeColor));
  const key=document.getElementById('gradekey');
  if(key&&!key.innerHTML) key.innerHTML=`<span class="muted">Name colour = in-game grade, lowest to highest:</span>${GORDER.filter(gradeHex).map(g=>`<b style="color:${gradeHex(g)}">${g}</b>`).join('')}`;
}
['renderGear','renderFarm','renderFarmGuide','renderGearGuide','renderFarmPins'].forEach(fn=>{
  const orig=window[fn]; if(typeof orig!=='function') return;
  window[fn]=function(){const r=orig.apply(this,arguments);try{gradeAll()}catch(e){}return r};
});

/* ---------- "What changed" log + level 46-50 preview toggle ---------- */
function chT(v){return v==null?'':typeof v==='string'?v:Array.isArray(v)?v.map(chT).join('; '):typeof v==='object'?(v.name||Object.values(v).map(chT).join(' · ')):String(v)}
function chgFor(){return ((CHANGES&&CHANGES.items)||[]).filter(c=>!c.scope||c.scope==='all'||[].concat(c.scope).includes(SLUG))}
function chgKey(c){return 'chg-'+c.id}
function renderChanges(){
  const host=$('changelist'); if(!host||!CHANGES) return;
  const items=chgFor(), sv=S.get('sv',{});
  const byDate={}; items.forEach(c=>{(byDate[c.date]=byDate[c.date]||[]).push(c)});
  const dates=Object.keys(byDate).sort().reverse();
  const todo=items.filter(c=>c.action==='ingame'&&!sv[chgKey(c)]).length;
  host.innerHTML=`<div class="callout ${todo?'warn':'ok'}"><b>${todo?`${todo} change${todo>1?'s':''} to make in game for your ${C['class']}`:'You are up to date: nothing left to change in game.'}</b><div class="small">Rows marked <span class="tag gold">Do in game</span> mean your character needs changing (respec, swap, re-pick). Tick them when done. <span class="tag">Info</span> rows are guide fixes only: nothing to change in game.</div></div>`+
  dates.map(d=>`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">${esc(d)}${CHANGES.labels&&CHANGES.labels[d]?' · '+esc(CHANGES.labels[d]):''}</h3>
    <div class="tablewrap"><table><thead><tr><th>What</th><th>Before (old guide)</th><th>Now (new guide)</th><th>What you do</th><th class="num">Done</th></tr></thead><tbody>${
    byDate[d].sort((a,b)=>(a.action==='ingame'?0:1)-(b.action==='ingame'?0:1)).map(c=>`<tr><td><b>${esc(chT(c.area))}</b>${c.tab?`<div class="small"><a href="#${c.tab}" data-goto="${c.tab}">Open tab →</a></div>`:''}</td><td class="small muted">${esc(chT(c.was)||'—')}</td><td class="small">${esc(chT(c.now))}</td><td class="small">${c.action==='ingame'?'<span class="tag gold">Do in game</span> ':'<span class="tag">Info</span> '}${esc(chT(c.how))}</td><td class="num">${c.action==='ingame'?`<input type="checkbox" data-sv="${chgKey(c)}" ${sv[chgKey(c)]?'checked':''} aria-label="Done" style="width:18px;height:18px;accent-color:var(--wind)">`:''}</td></tr>`).join('')}</tbody></table></div></div>`).join('');
  renderChangeBanner();
}
function renderChangeBanner(){
  const b=$('changebanner'); if(!b||!CHANGES) return;
  const sv=S.get('sv',{}), items=chgFor();
  const todo=items.filter(c=>c.action==='ingame'&&!sv[chgKey(c)]).length;
  const seen=S.gget('chgseen',''), latest=items.map(c=>c.date).sort().pop()||'';
  const fresh=latest&&latest>seen;
  if(!todo&&!fresh){b.hidden=true;return}
  b.hidden=false;
  b.innerHTML=`<b>Guide updated${latest?' '+esc(latest):''}.</b> ${todo?`${todo} change${todo>1?'s':''} to make in game for your ${C['class']}.`:'Guide-only fixes, nothing to change in game.'} <a href="#changes" data-goto="changes">See what changed →</a> <button class="btn" type="button" id="chgdismiss">Hide</button>`;
  $('chgdismiss').onclick=()=>{S.gset('chgseen',latest);b.hidden=true};
}
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.sv;if(k&&k.startsWith('chg-')){renderChanges()}});

/* level 46-50 preview */
function b45On(){return !!S.gget('b45',false)}
function applyB45(){
  const on=b45On();
  document.querySelectorAll('[data-b45]:not(body)').forEach(el=>{el.hidden=!on});
  document.body.hidden=false;
  const t=$('b45pick'); if(t) t.checked=on;
  document.body.dataset.preview=on?'1':'0';
  const cur=document.querySelector('nav.tabs button[aria-selected="true"]');
  if(cur&&cur.hidden) show('start',true);
}
function renderBeyond(){
  const host=$('beyondbox'); if(!host) return;
  if(!BEYOND){host.innerHTML='<p class="muted">No level 46–50 data yet.</p>';return}
  const B=BEYOND, cl=(B.classes||{})[SLUG]||{};
  const noKo=t=>String(t).replace(/\s*\([^()]*[\uac00-\ud7a3][^()]*\)/g,'').replace(/[\uac00-\ud7a3]+/g,'').replace(/\s{2,}/g,' ').trim();
  const human=k=>({maxLevel:'Max level',level25Spec:'Level-25 perk',newFeatures:'New features',crystals:'Crystals',summary:'Summary',priority:'What to buy first',slots:'Slots',shards:'Shards',math:'How many you need',reset:'Reset'}[k]||k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()));
  const fmt=v=>Array.isArray(v)?`<ul class="plain small">${v.map(x=>`<li>${fmt(x)}</li>`).join('')}</ul>`:(v&&typeof v==='object')?Object.entries(v).map(([k,x])=>`<div style="margin:4px 0"><b>${esc(human(k))}:</b> ${fmt(x)}</div>`).join(''):esc(noKo(v));
  const list=a=>(a||[]).length?`<ul class="plain small">${a.map(x=>`<li>${typeof x==='string'?esc(noKo(x)):fmt(x)}</li>`).join('')}</ul>`:'<p class="small muted">Nothing found yet.</p>';
  host.innerHTML=`<div class="callout warn"><b>Korea preview.</b> Global's cap is 45. This is what Korea got at 46–50 (cap raised 1 Jul 2026). Global may change names, numbers or timing.</div>
   ${B.overview?`<p>${esc(B.overview)}</p>`:''}
   <div class="grid2">
    <div class="box"><h3>Get ready at 45</h3>${list(B.prepareAt45)}</div>
    <div class="box"><h3>Your ${C['class']} at 50</h3>${list([].concat(cl.newSkills||[]).concat(cl.buildChanges||[]))}</div>
   </div>
   ${(B.levels||[]).length?`<div class="box"><h3>Level by level</h3><div class="tablewrap"><table><thead><tr><th class="num">Lv</th><th>Unlocks</th><th class="num">Skill points</th></tr></thead><tbody>${B.levels.map(l=>`<tr><td class="num">${esc(l.lvl)}</td><td class="small">${esc(noKo([].concat(l.unlocks||[]).join(' ')))}</td><td class="num">${l.skillPoints!=null?esc(l.skillPoints):'—'}</td></tr>`).join('')}</tbody></table></div></div>`:''}
   ${(B.dungeons||[]).length?`<div class="box"><h3>New dungeons and raids</h3><div class="tablewrap"><table><thead><tr><th>Name</th><th class="num">Level</th><th class="num">Gear Score</th><th>Rewards</th><th>Notes</th></tr></thead><tbody>${B.dungeons.map(d=>`<tr><td><b>${esc(noKo(d.name))}</b></td><td class="num">${esc(d.lvl||'')}</td><td class="num">${esc(d.gs||'')}</td><td class="small">${esc(noKo([].concat(d.rewards||[]).join(', ')))}</td><td class="small muted">${esc(noKo(d.notes||''))}</td></tr>`).join('')}</tbody></table></div></div>`:''}
   <div class="grid2">
    <div class="box"><h3>Zones</h3>${list(B.zones)}</div>
    <div class="box"><h3>Gear</h3>${list(B.gear)}</div>
    <div class="box small"><h3>Daevanion</h3>${B.daevanion?fmt(B.daevanion):''}</div>
    <div class="box small"><h3>Stigmas</h3>${B.stigmas?fmt(B.stigmas):''}</div>
   </div>
   <div class="box"><h3>Other systems</h3>${list(B.systems)}</div>
   ${(B.sources||[]).length?`<p class="small muted">Sources: ${B.sources.slice(0,12).map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(String(u).replace(/^https?:\/\/(www\.)?/,'').slice(0,40))}</a>`).join(' · ')}</p>`:''}`;
  decorate(host);
}
(function(){const t=document.getElementById('b45pick'); if(t) t.addEventListener('change',()=>{S.gset('b45',t.checked);applyB45()});})();

/* ---------- Genus Insight panel, laid out like the in-game window ---------- */
const GBOARDS=[['cogni','Cogni','🦉'],['fera','Fera','🐺'],['natura','Natura','🌳'],['varian','Varian','🌀'],['special','Special','✴']];
const GCOL={white:'#e8e6e1',common:'#C3C3C3',green:'#19E048',rare:'#19E048',blue:'#379AFF',epic:'#379AFF',legend:'#379AFF',yellow:'#FFD02B',unique:'#FFD02B',gold:'#FFD02B',orange:'#FF6C00',heroic:'#FF6C00'};
function gLine(x){if(!x)return {t:'',g:''};if(typeof x==='string')return {t:x.replace(/^ANY_COMMON_RARE.*/,'any white or green line').replace(/^ANY_.*/,'other lines'),g:''};return {t:(x.text||x.line||x.name||'')+(x.range?' '+x.range:''),g:(x.colour||x.color||x.grade||'')}}
function gColor(g){return GCOL[String(g||'').toLowerCase()]||''}
function genusData(){if(typeof GENUS==='undefined'||!GENUS)return null;const c=(GENUS.classes||{})[SLUG];if(!c)return null;return c[typeof MODE!=='undefined'&&MODE==='pvp'?'pvp':'pve']||c.pve}
function renderGenusUI(){
  const host=$('genusui'); if(!host) return;
  const D=genusData(); if(!D){host.innerHTML='';return}
  const order=(GENUS.uiOrder||GBOARDS.map(b=>b[0])).filter(k=>D[k]);
  let cur=S.get('gboard',order[0]); if(!D[cur]) cur=order[0];
  const pvp=typeof MODE!=='undefined'&&MODE==='pvp', sv=S.get('sv',{});
  const B=D[cur], meta=GBOARDS.find(b=>b[0]===cur)||[cur,cur,'◆'];
  const keyOf=n=>`gi-${pvp?'v':'e'}-${cur}-${n}`;
  const done=Object.keys(B).filter(n=>sv[keyOf(n)]).length;
  const rows=[1,2,3,4,5,6,7,8,9].map(n=>{
    const s=B[n]||B[String(n)]; if(!s) return '';
    const best=(s.best||[]).map(gLine), keep=(s.keep||[]).map(gLine), rr=(s.reroll||[]).map(gLine);
    const top=best[0]||{t:'—',g:''};
    return `<div class="girow${sv[keyOf(n)]?' done':''}">
      <label class="gilock" title="Tick when this slot has a keeper and is locked"><input type="checkbox" data-sv="${keyOf(n)}" ${sv[keyOf(n)]?'checked':''}><span aria-hidden="true">🔒</span></label>
      <div class="gitxt"><div class="gimain"><span style="color:${gColor(top.g)||'var(--fg)'}">${esc(top.t)}</span><span class="gislot">Slot ${n} · opens at Insight Lv. ${n}</span></div>
      ${best.length>1?`<div class="small">Also best: ${best.slice(1).map(l=>`<span style="color:${gColor(l.g)||'inherit'}">${esc(l.t)}</span>`).join(', ')}</div>`:''}
      ${keep.length?`<div class="small muted">Good enough, lock it: ${keep.map(l=>esc(l.t)).join(', ')}</div>`:''}
      ${rr.length?`<div class="small muted">Reroll if you see: ${rr.map(l=>esc(l.t)).join(', ')}</div>`:''}
      ${s.why?`<div class="small muted">${esc(s.why)}</div>`:''}</div></div>`}).join('');
  const steps=[].concat((GENUS.order||{}).general||[]).concat((GENUS.order||{})[SLUG]||[]);
  host.innerHTML=`<div class="box giwrap"><h3 style="margin:0">Your ${C['class']} Genus Insight targets (${pvp?'PvP, preset 2':'PvE, preset 1'})</h3>
   <p class="small muted" style="margin:0">Laid out like the game (Pets › Genus Insight). Pick a board on the left; the right side lists what each slot should say, word for word, in its grade colour. Tick the lock when a slot has a keeper. ${pvp?'Switch the top bar to PvE for preset 1.':'Switch the top bar to PvP for the preset 2 targets.'}</p>
   ${GENUS.ranking&&!pvp?`<p class="small" style="margin:0"><b>Why this order:</b> ${esc(GENUS.ranking)}</p>`:''}${pvp?`<p class="small" style="margin:0"><b>PvP:</b> PvE-only lines (PvE Attack, PvE Damage Boost…) do nothing against players, so PvP uses the normal lines.</p>`:''}
   <div class="gigrid"><div class="giboards">${order.map(k=>{const m=GBOARDS.find(b=>b[0]===k)||[k,k,'◆'];const nd=Object.keys(D[k]).filter(n=>sv[`gi-${pvp?'v':'e'}-${k}-${n}`]).length;return `<button type="button" class="gib${k===cur?' on':''}" data-gb="${k}" aria-pressed="${k===cur}"><span class="gii">${m[2]}</span><span>${m[1]}</span><span class="small muted">${nd}/${Object.keys(D[k]).length}</span></button>`}).join('')}</div>
   <div class="gipanel"><div class="gihead"><b>${meta[1]} Insight</b><span class="readout">${done} / ${Object.keys(B).length} locked</span></div><div class="small muted" style="margin-bottom:6px">✦ Analysis Effect</div>${rows}</div></div>
   ${steps.length?`<div><b>Order to do it in</b><ol class="steps small" style="margin-top:6px">${steps.map(x=>`<li>${esc(String(typeof x==='string'?x:(x.step||x.text||JSON.stringify(x))).replace(/^\s*\d+[.)]\s*/,''))}</li>`).join('')}</ol></div>`:''}</div>`;
  host.querySelectorAll('[data-gb]').forEach(b=>b.addEventListener('click',()=>{S.set('gboard',b.dataset.gb);renderGenusUI()}));
}
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.sv;if(k&&k.startsWith('gi-'))renderGenusUI()});
{const orig=window.renderModeBits;if(typeof orig==='function')window.renderModeBits=function(){const r=orig.apply(this,arguments);try{renderGenusUI()}catch(e){}return r}}

/* ---------- Soul Binding + stone reroll targets, per class and slot ---------- */
function rollsFor(mode){if(typeof ROLLS==='undefined'||!ROLLS)return null;const c=(ROLLS.classes||{})[SLUG];return c?(c[mode]||c.pve):null}
function rollSlot(mode,k){const R=rollsFor(mode);return R?(R[k]||R[k.replace(/\d$/,'1')]||null):null}
// gear planner uses the per-slot data when we have it
if(typeof soulFor==='function'){const o=soulFor;window.soulFor=function(slot){const r=rollSlot('pve',slot.k);return r&&r.best&&r.best.length?r.best.slice(0,2).join(' or '):o(slot)}}
function rollStones(mode,s,fallback){const r=rollSlot(mode,s.k);return r&&r.stones&&r.stones.length?r.stones:fallback}
function renderRolls(){
  const host=$('rollbox'); if(!host) return;
  const mode=S.get('gearmode','pve'), R=rollsFor(mode); if(!R){host.innerHTML='';return}
  const slots=(GEARSLOTS[mode]||GEARSLOTS.pve).filter(s=>R[s.k]||R[s.k.replace(/\d$/,'1')]);
  const li=a=>(a||[]).map(esc).join(', ');
  const C2=(ROLLS.classes||{})[SLUG]||{};
  host.innerHTML=`<h3 style="margin:0">Reroll targets: every slot (${mode==='pvp'?'PvP':'PvE'})</h3>
   <p class="small muted" style="margin:0">Use this while rerolling Soul Binding or engraving stones. <b style="color:var(--wind)">Best</b> = aim for these (in order). <b>Good enough</b> = keep it and stop spending. <b style="color:var(--warn)">Reroll</b> = Sync that line. Only lines that can actually roll on that slot on Global are listed. Use the PvE gear / PvP gear buttons above to switch.</p>
   <div class="tablewrap"><table class="rolltable"><thead><tr><th>Slot</th><th>Best</th><th>Good enough</th><th>Reroll</th><th>${mode==='pvp'?'Stones (ideal)':'Manastones / Soulstones (ideal)'}</th></tr></thead><tbody>${slots.map(s=>{const r=R[s.k]||R[s.k.replace(/\d$/,'1')];return `<tr><td><b>${esc(s.n)}</b>${r.why?`<details class="small muted"><summary>why</summary>${esc(r.why)}</details>`:''}</td><td class="small" style="color:var(--wind)"><b>${li(r.best)}</b></td><td class="small">${li(r.keep)}</td><td class="small muted">${li(r.reroll)}</td><td class="small">${li(r.stones)}</td></tr>`}).join('')}</tbody></table></div>
   ${C2.stoneNote?`<p class="small muted" style="margin:0">${esc(C2.stoneNote)}</p>`:''}
   ${(C2.notes||[]).length?`<ul class="plain small">${C2.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}
   <div class="callout"><b>Engraving stones: no lock.</b> Each engrave rerolls all 4 lines at once, so a full set of the ideal stats is very unlikely (about 1 in 10,000 for 4× Attack). <b>Keep a roll when 2 or more lines are useful</b> (the stats in the Stones column, or Accuracy/Crit until your targets), and always keep any Damage Boost-type line (Superior stones only). Save Superior stones for keeper gear (item level 86+); use cheap stones on gear you'll replace.</div>
   <details class="small"><summary><b>How Soul Binding and stones work on Global</b></summary><p>${esc((ROLLS.rules||{}).soulBinding||'')}</p><p>${esc((ROLLS.rules||{}).manastones||'')}</p><p>${esc((ROLLS.rules||{}).soulstones||'')}</p></details>`;
}
{const o=window.renderGear;if(typeof o==='function')window.renderGear=function(){const r=o.apply(this,arguments);try{renderRolls();const t=$('soultable');if(t&&rollsFor('pve')){const R=rollsFor('pve');t.innerHTML=GEARSLOTS.pve.filter(s=>R[s.k]).map(s=>`<tr><td><b>${esc(s.n)}</b></td><td class="small">${esc((R[s.k].best||[]).join(' › '))}</td></tr>`).join('')}}catch(e){}return r}}

/* ---------- Upgrade cost planner (Upgrades & stones tab, box #sys-costplan; data: COSTPLAN from audit/r5/costplan.json) ---------- */
/* Saved per viewer (all classes share it) with S.gset('costplan', {...}): section, crafting prices/success rates, calculator picks. */
function cpOK(){return typeof COSTPLAN!=='undefined'&&COSTPLAN&&COSTPLAN.craft&&COSTPLAN.enh}
function cpE(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function cpN(n){return Math.round(+n||0).toLocaleString('en-US')}
function cpM(n){n=+n||0;const a=Math.abs(n);return a>=1e6?(n/1e6).toFixed(a>=1e8?0:1)+'M':a>=1e4?Math.round(n/1e3)+'k':cpN(n)}
const CP_DEF={sec:'reach',recipe:'earrings',prices:{},succ:{},failUses:false,tax:true,g:'Unique',il:102,from:0,to:15,a0:0,a1:0,spl:false,sbg:'Unique',sbFrom:0,resets:0,syncs:0,fuse:false,eg:'Unique',engr:20,stoneP:0,stoneN:null};
function cpState(){let o={};try{o=S.gget('costplan',{})||{}}catch(e){}const s=Object.assign({},CP_DEF,o);s.prices=Object.assign({},o.prices||{});s.succ=Object.assign({},o.succ||{});return s}
let CP=null;
function cpSave(){try{S.gset('costplan',CP)}catch(e){}}

/* ----- crafting maths ----- */
function cpPrice(id){const v=CP.prices[id];return (v!=null&&v!==''&&isFinite(+v))?+v:COSTPLAN.craft.mats[id].price}
function cpSucc(rk,t){const v=CP.succ[rk+'.'+t.k];return (v!=null&&v!==''&&isFinite(+v)&&+v>0)?Math.min(100,+v):t.success}
function cpCraft(rk){
  const R=COSTPLAN.craft.recipes[rk], comb=COSTPLAN.craft.combo/100, tiers=R.tiers.map(t=>({t,s:cpSucc(rk,t)/100}));
  // attempts per tier: sheet method = needed ÷ success; with failUses every attempt also eats a Splendent from the tier below
  if(CP.failUses){let need=1;for(let i=tiers.length-1;i>=0;i--){const x=tiers[i];x.att=(i===tiers.length-1)?need/x.s:need/(x.s*comb);need=x.att}}
  else tiers.forEach(x=>{x.att=x.t.needed/x.s});
  let sub=0;tiers.forEach(x=>{x.per=x.t.mats.reduce((a,[id,q])=>a+q*cpPrice(id),0);x.tot=x.per*x.att;sub+=x.tot});
  const tax=CP.tax?sub*COSTPLAN.craft.tax/100:0;return {tiers,sub,tax,total:sub+tax};
}
/* ----- enhancement maths ----- */
function cpPmf(p,b){const o=[];let alive=1;for(let k=1;k<500;k++){const q=Math.min(1,(p+b*(k-1))/100);o.push(alive*q);alive*=1-q;if(q>=1)break}return o}
function cpScale(il,key){const t=COSTPLAN.enh.ilTable,top=t[t.length-1],r=t.find(x=>x.il===il);return r?r[key]/top[key]:il/102}
function cpEnhSteps(g,il,from,to){
  const fk=cpScale(il,'k'),fs=cpScale(il,'s');
  return COSTPLAN.enh.base.filter(r=>r.from>=from&&r.from<to).map(r=>({n:'+'+r.from+'→+'+(r.from+1),p:r.p,b:r.b,k:Math.round(r.k*fk/10)*10,s:Math.round(r.s*fs/10)*10}));
}
function cpAmpSteps(a0,a1){return COSTPLAN.enh.amp.filter(r=>r.lv>a0&&r.lv<=a1).map(r=>({n:'Amp +'+r.lv,p:r.p,b:r.b,k:r.k,s:r.s}))}
function cpCap(il,spl){const c=COSTPLAN.enh.ampCaps.find(x=>x.il===il);return c?(spl&&c.spl!=null?c.spl:c.cap):0}
// exact cost distribution of a run of steps (each attempt of a step costs a fixed amount): mean, 10/50/90th percentile, worst
function cpDist(steps,key,res){
  let fixed=0,mean=0,worst=0;const risky=[];
  steps.forEach(st=>{const m=cpPmf(st.p,st.b),w=st[key];worst+=w*m.length;mean+=w*m.reduce((a,x,i)=>a+x*(i+1),0);if(m.length===1)fixed+=w;else risky.push({m,w})});
  if(!risky.length)return {mean,p10:fixed,p50:fixed,p90:fixed,worst};
  const span=worst-fixed,B=Math.max(span/(res||20000),1e-9),n=Math.ceil(span/B)+2;let d=new Float64Array(n);d[0]=1;let hi=0;
  risky.forEach(({m,w})=>{const nd=new Float64Array(n);let nh=0;for(let i=0;i<=hi;i++){const v=d[i];if(!v)continue;for(let k=0;k<m.length;k++){const j=Math.min(n-1,i+Math.round(w*(k+1)/B));nd[j]+=v*m[k];if(j>nh)nh=j}}d=nd;hi=nh});
  const pct=q=>{let c=0;for(let i=0;i<=hi;i++){c+=d[i];if(c>=q-1e-12)return fixed+i*B}return fixed+hi*B};
  return {mean,p10:pct(.1),p50:pct(.5),p90:pct(.9),worst};
}
function cpExpAtt(steps){return steps.reduce((a,st)=>a+cpPmf(st.p,st.b).reduce((x,v,i)=>x+v*(i+1),0),0)}
function cpRun(g,il,from,to,a0,a1,res){const es=cpEnhSteps(g,il,from,to),as=cpAmpSteps(a0,a1);return {es,as,ek:cpDist(es,'k',res),eS:cpDist(es,'s',res),ak:cpDist(as,'k',res),aS:cpDist(as,'s',res),ea:cpExpAtt(es),aa:cpExpAtt(as)}}

/* ----- rendering ----- */
const CP_SECS=[['reach','Cost to reach'],['craft','Crafting'],['soul','Soul Binding & stones'],['miles','Budget milestones'],['transfer','Transfer crafting']];
function cpStyle(){if(document.getElementById('cpstyle'))return;const st=document.createElement('style');st.id='cpstyle';st.textContent=`
#costplan .seg{flex-wrap:wrap}#costplan .cpgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:10px 0}
#costplan label.cpf{display:flex;flex-direction:column;gap:4px;font:600 12px var(--f-mono);letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
#costplan input[type=number],#costplan select{width:100%;min-width:0;box-sizing:border-box;background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:7px 9px;font:600 16px var(--f-mono)}
#costplan td input[type=number]{width:120px;padding:5px 7px}#costplan td.cpsr input{width:84px}
#costplan .num{text-align:right;font-family:var(--f-mono);white-space:nowrap}#costplan .cptot td{font-weight:700}#costplan .cpbig{color:var(--gold);font-weight:700}
#costplan .cpchk{display:flex;gap:8px;align-items:flex-start;font-size:14px;margin:6px 0}#costplan .cpchk input{accent-color:var(--wind);width:17px;height:17px;margin:2px 0 0;flex:0 0 auto}
#costplan tr.cptier td{background:var(--panel2)}#costplan h4{margin:14px 0 6px}
@media (max-width:560px){#costplan td input[type=number]{width:96px}#costplan td.cpsr input{width:72px}}`;(document.head||document.body).appendChild(st)}
function cpSeg(attr,cur,opts){return `<div class="seg" role="group">${opts.map(([v,l])=>`<button type="button" data-${attr}="${cpE(v)}" aria-pressed="${String(v)===String(cur)}">${cpE(l)}</button>`).join('')}</div>`}
function cpSel(attr,cur,opts){return `<select data-${attr}="1">${opts.map(([v,l])=>`<option value="${cpE(v)}"${String(v)===String(cur)?' selected':''}>${cpE(l)}</option>`).join('')}</select>`}

function cpReachHTML(){
  const E=COSTPLAN.enh,G=E.grades[CP.g]||E.grades.Unique;if(!G.ils.includes(+CP.il))CP.il=G.ils[G.ils.length-1];
  CP.from=Math.max(0,Math.min(G.max-1,+CP.from||0));CP.to=Math.max(CP.from+1,Math.min(G.max,+CP.to||G.max));
  const splOK=CP.g==='Unique'&&E.ampCaps.some(c=>c.il===+CP.il&&c.spl!=null),cap=CP.g==='Unique'?cpCap(+CP.il,splOK&&CP.spl):0,ampOn=cap>0&&CP.to===15;
  CP.a0=ampOn?Math.max(0,Math.min(cap,+CP.a0||0)):0;CP.a1=ampOn?Math.max(CP.a0,Math.min(cap,+CP.a1||0)):0;
  const lv=(a,b)=>{const o=[];for(let i=a;i<=b;i++)o.push([i,'+'+i]);return o};
  const ex=(E.ilTable.find(x=>x.il===+CP.il)||{}).ex;
  return `<p class="small">Pick the item, where it is now and where you want it. Works for weapons, armor and accessories alike: they share one enhancement curve per grade and item level (amulets, belts and the Clash Rune use their own scroll curves and are not covered).</p>
  ${cpSeg('cpg',CP.g,[['Unique','Unique'],['Epic','Epic']])}
  <div class="cpgrid">
   <label class="cpf">Item level ${cpSel('cpil',CP.il,G.ils.map(i=>[i,'IL'+i]))}</label>
   <label class="cpf">Now ${cpSel('cpfrom',CP.from,lv(0,G.max-1))}</label>
   <label class="cpf">Target ${cpSel('cpto',CP.to,lv(CP.from+1,G.max))}</label>
   ${ampOn?`<label class="cpf">Amplify now ${cpSel('cpa0',CP.a0,lv(0,cap))}</label><label class="cpf">Amplify target ${cpSel('cpa1',CP.a1,lv(CP.a0,cap))}</label>`:''}
  </div>
  ${splOK?`<label class="cpchk"><input type="checkbox" data-cpspl="1"${CP.spl?' checked':''}> Splendent craft (Amplify cap +${E.ampCaps.find(c=>c.il===+CP.il).spl} instead of +${E.ampCaps.find(c=>c.il===+CP.il).cap})</label>`:''}
  <p class="small muted">${ex?'Example item: '+cpE(ex)+'. ':''}${CP.g==='Epic'?'Epic gear caps at +10 and every step succeeds.':cap?`Amplify cap at this item level: +${cap}${CP.to<15?' (reach +15 first)':''}.`:'No Amplify track at this item level.'}</p>
  <div id="cp-reach-out"></div>`;
}
function cpReachOut(){
  const el=document.getElementById('cp-reach-out');if(!el)return;
  const r=cpRun(CP.g,+CP.il,CP.from,CP.to,CP.a0,CP.a1),hasA=r.as.length>0;
  const row=(lab,d)=>`<tr><td class="small">${lab}</td><td class="num"><b>${cpN(d.mean)}</b></td><td class="num">${cpN(d.p10)}</td><td class="num">${cpN(d.p50)}</td><td class="num">${cpN(d.p90)}</td><td class="num">${cpN(d.worst)}</td></tr>`;
  el.innerHTML=`<div class="callout ok"><b>Expect about ${cpM(r.ek.mean+r.ak.mean)} Kinah</b>, ${cpN(r.eS.mean)} Enhance Stones${hasA?` and ${cpN(r.aS.mean)} Amplify Stones`:''} over about ${(r.ea+r.aa).toFixed(1)} attempts. An unlucky run (90th percentile) costs about ${cpM(r.ek.p90+r.ak.p90)} Kinah${hasA?' (enhancing and Amplify each at their 90th percentile, so a little high)':''}.</div>
  <div class="tablewrap"><table><thead><tr><th>Cost</th><th>Expected</th><th>Lucky 10%</th><th>Typical 50%</th><th>Unlucky 90%</th><th>Worst</th></tr></thead><tbody>
   ${r.es.length?row('Enhancing: Kinah',r.ek)+row('Enhancing: Enhance Stones',r.eS):''}
   ${hasA?row('Amplify: Kinah',r.ak)+row('Amplify: Amplify Stones',r.aS):''}
  </tbody></table></div>
  ${hasA?`<p class="small muted">${cpN(r.aS.mean)} Amplify Stones = about ${cpN(r.aS.mean*COSTPLAN.enh.ampStone.frags)} Amplify Stone Fragments + ${cpN(r.aS.mean*COSTPLAN.enh.ampStone.enh)} more Enhance Stones (Substance Morph).</p>`:''}
  <details class="small"><summary><b>Step by step</b></summary><div class="tablewrap"><table><thead><tr><th>Step</th><th>Odds</th><th>Pity/fail</th><th>Per attempt</th><th>Avg attempts</th><th>Max</th></tr></thead><tbody>
   ${r.es.concat(r.as).map(st=>{const m=cpPmf(st.p,st.b);return `<tr><td>${cpE(st.n)}</td><td class="num">${st.p}%</td><td class="num">${st.b?'+'+st.b+'%':'—'}</td><td class="num">${cpN(st.k)} + ${cpN(st.s)} ${/^Amp/.test(st.n)?'Amplify':'Enhance'} Stones</td><td class="num">${m.reduce((a,x,i)=>a+x*(i+1),0).toFixed(2)}</td><td class="num">${m.length}</td></tr>`}).join('')}
  </tbody></table></div></details>
  <p class="small muted">${cpE(COSTPLAN.enh.rangeNote)} ${cpE(COSTPLAN.enh.pityNote)} ${cpE(COSTPLAN.enh.scaleNote)}</p>`;
}

function cpCraftHTML(){
  const C=COSTPLAN.craft,R=C.recipes[CP.recipe]||C.recipes.earrings;
  return `<p class="small">One <b>True Dragon Lord</b> craft from scratch: 64 base crafts → 16 Expert's → 4 Artisan's → 1 True Dragon Lord, because each tier needs the Splendent (${C.combo}% great success) piece from the tier before. Type your server's prices; they are saved in this browser${typeof remoteRef!=='undefined'?' and your account':''}.</p>
  ${cpSeg('cprec',CP.recipe,Object.keys(C.recipes).map(k=>[k,k==='earrings'?'Earrings (sheet)':'Weapon']))}
  <p class="small muted" style="margin-top:6px">${cpE(R.n)}. ${cpE(R.src)}</p>
  <label class="cpchk"><input type="checkbox" data-cptax="1"${CP.tax?' checked':''}> Add ${C.tax}% Marketplace tax (the sheet does)</label>
  <label class="cpchk"><input type="checkbox" data-cpfail="1"${CP.failUses?' checked':''}> Failed crafts also use up the Splendent input <span class="tag">Unconfirmed</span></label>
  <div class="tablewrap"><table><thead><tr><th>Material</th><th>Qty / craft</th><th>Unit price (Kinah)</th><th>Cost / craft</th><th>Expected total</th></tr></thead><tbody>
  ${R.tiers.map(t=>`<tr class="cptier"><td colspan="2"><b>${cpE(t.n)}</b><br><span class="small muted">Mastery ${t.mastery}; great success: ${cpE(t.out)}</span></td><td class="cpsr small">Success % <input type="number" inputmode="decimal" min="1" max="100" step="0.1" data-cpsucc="${cpE(CP.recipe+'.'+t.k)}" value="${cpSucc(CP.recipe,t)}" aria-label="${cpE(t.n)} success rate"></td><td class="num small" colspan="2">Expected crafts <b id="cp-att-${t.k}"></b></td></tr>
   ${t.mats.map(([id,q])=>{const M=C.mats[id];return `<tr><td class="small">${cpE(M.n)}${M.sheet&&M.sheet!==M.n?` <span class="muted">(sheet: ${cpE(M.sheet)})</span>`:''}${M.ps==='analog'?' <span class="tag">no sheet price</span>':''}${M.note?`<br><span class="muted">${cpE(M.note)}</span>`:''}</td><td class="num">${q}</td><td><input type="number" inputmode="numeric" min="0" step="1" data-cpprice="${cpE(id)}" value="${cpPrice(id)}" aria-label="${cpE(M.n)} unit price"></td><td class="num" id="cp-pc-${cpE(t.k)}-${cpE(id)}"></td><td class="num" id="cp-et-${cpE(t.k)}-${cpE(id)}"></td></tr>`}).join('')}
   <tr class="cptot"><td colspan="4" class="small">Tier total</td><td class="num" id="cp-tt-${t.k}"></td></tr>`).join('')}
  <tr class="cptot"><td colspan="4">Materials subtotal</td><td class="num" id="cp-sub"></td></tr>
  <tr class="cptot"><td colspan="4">Marketplace tax</td><td class="num" id="cp-tax"></td></tr>
  <tr class="cptot"><td colspan="4">Total Kinah</td><td class="num cpbig" id="cp-total"></td></tr>
  </tbody></table></div>
  <div id="cp-craft-sum"></div>
  <p><button type="button" class="btn" data-cpreset="1">Reset prices and success rates to the defaults</button></p>
  <ul class="plain small"><li>${cpE(C.needNote)}</li><li>${cpE(C.failNote)}</li><li>${cpE(C.priceNote)}</li><li>${cpE(C.taxNote)}</li><li>${cpE(C.feeNote)}</li><li>Success rates are the maximum the client allows (your mastery well above the recipe's). Lower mastery means lower odds and more crafts.</li></ul>`;
}
function cpCraftOut(){
  if(!document.getElementById('cp-total'))return;const C=COSTPLAN.craft,c=cpCraft(CP.recipe);
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  c.tiers.forEach(x=>{set('cp-att-'+x.t.k,x.att.toFixed(2));x.t.mats.forEach(([id,q])=>{set('cp-pc-'+x.t.k+'-'+id,cpN(q*cpPrice(id)));set('cp-et-'+x.t.k+'-'+id,cpN(q*cpPrice(id)*x.att))});set('cp-tt-'+x.t.k,cpN(x.tot))});
  set('cp-sub',cpN(c.sub));set('cp-tax',cpN(c.tax));set('cp-total',cpN(c.total));
  const s=document.getElementById('cp-craft-sum');if(s)s.innerHTML=`<div class="callout ok"><b>About ${cpM(c.total)} Kinah for one True Dragon Lord ${CP.recipe==='weapon'?'weapon':'earring'} (IL62)</b> at these prices. It comes out Splendent (IL70) ${C.combo}% of the time; aiming for Splendent straight from the craft means about 4 True Dragon Lord successes, so about <b>${cpM(c.total*4)}</b>. Crafting materials only: enhancing it is extra (see Cost to reach, IL62/70).</div>`;
}

function cpSoulHTML(){
  const So=COSTPLAN.soul,En=COSTPLAN.engrave,g=So.bind[CP.sbg]?CP.sbg:'Unique',bind=So.bind[g];CP.sbFrom=Math.max(0,Math.min(10,+CP.sbFrom||0));
  let ck=0,cc=0;const rows=bind.map((x,i)=>{ck+=x[0];cc+=x[1];return `<tr${i<CP.sbFrom?' style="opacity:.5"':''}><td>${i+1}</td><td class="num">${cpN(x[0])}</td><td class="num">${x[1]}</td><td class="num">${cpN(ck)}</td><td class="num">${cc}</td></tr>`}).join('');
  const eg=En.fee[CP.eg]!=null?CP.eg:'Unique';
  return `<h4>Soul Binding</h4>${cpSeg('cpsbg',g,Object.keys(So.bind).map(k=>[k,k]))}
  <div class="cpgrid"><label class="cpf">Bind steps already done ${cpSel('cpsbfrom',CP.sbFrom,[[0,'None'],...[1,2,3,4,5,6,7,8,9,10].map(i=>[i,i+(i===10?' (100%)':'')])])}</label>
   <label class="cpf">Resets planned <input type="number" inputmode="numeric" min="0" step="1" data-cpn="resets" value="${+CP.resets||0}"></label>
   <label class="cpf">Syncs planned <input type="number" inputmode="numeric" min="0" step="1" data-cpn="syncs" value="${+CP.syncs||0}"></label></div>
  ${g==='Unique'?`<label class="cpchk"><input type="checkbox" data-cpfuse="1"${CP.fuse?' checked':''}> Soul Fuse at 100% (${So.fuse.stones} Philosopher's Stone: Revelation + ${cpN(So.fuse.k)} Kinah)</label>`:''}
  <div id="cp-soul-out"></div>
  <details class="small"><summary><b>Bind cost per step (${cpE(g)})</b></summary><div class="tablewrap"><table><thead><tr><th>Step</th><th>Kinah</th><th>Soul Codex</th><th>Kinah so far</th><th>Codex so far</th></tr></thead><tbody>${rows}</tbody></table></div></details>
  <ul class="plain small"><li>${cpE(So.bindNote)}</li><li>Reset (Rebind) on ${cpE(g)}: ${cpN(So.rebind[g][0])} Kinah + ${So.rebind[g][1]} Soul Codex: Reset. ${cpE(So.rebindNote)}</li><li>${cpE(So.sync)}</li><li>${cpE(So.fuse.shop)} ${cpE(So.fuse.note)}</li><li>${cpE(So.potential.note)}</li></ul>
  <h4>Manastone / Soulstone engraving</h4>${cpSeg('cpeg',eg,Object.keys(En.fee).map(k=>[k,k]))}
  <div class="cpgrid"><label class="cpf">Engraves <input type="number" inputmode="numeric" min="0" step="1" data-cpn="engr" value="${+CP.engr||0}"></label>
   <label class="cpf">Stones per engrave <input type="number" inputmode="numeric" min="0" step="1" data-cpn="stoneN" value="${CP.stoneN==null?En.slots[eg]:+CP.stoneN}"></label>
   <label class="cpf">Price per stone <input type="number" inputmode="numeric" min="0" step="1" data-cpn="stoneP" value="${+CP.stoneP||0}"></label></div>
  <div id="cp-eng-out"></div>
  <ul class="plain small"><li><b>${cpE(En.note)}</b></li><li>${cpE(En.stoneNote)}</li><li>${cpE(En.odds)}</li></ul>`;
}
function cpSoulOut(){
  const So=COSTPLAN.soul,En=COSTPLAN.engrave,g=So.bind[CP.sbg]?CP.sbg:'Unique',eg=En.fee[CP.eg]!=null?CP.eg:'Unique';
  const rest=So.bind[g].slice(CP.sbFrom),bk=rest.reduce((a,x)=>a+x[0],0),bc=rest.reduce((a,x)=>a+x[1],0),rs=Math.max(0,+CP.resets||0),sy=Math.max(0,+CP.syncs||0),fu=g==='Unique'&&CP.fuse;
  const k=bk+rs*So.rebind[g][0]+(fu?So.fuse.k:0);
  const a=document.getElementById('cp-soul-out');if(a)a.innerHTML=`<div class="callout ok"><b>${cpN(k)} Kinah</b> + ${cpN(bc)} Soul Codex${rs?` + ${cpN(rs*So.rebind[g][1])} Soul Codex: Reset`:''}${sy?` + ${cpN(sy)} Sync Stones (${cpN(sy)} spare Unique pieces)`:''}${fu?` + ${So.fuse.stones} Philosopher's Stone: Revelation`:''}.<br><span class="small">Bind to 100% from step ${CP.sbFrom}: ${cpN(bk)} Kinah + ${cpN(bc)} Codex${rs?`; resets: ${cpN(rs*So.rebind[g][0])} Kinah`:''}${fu?`; Soul Fuse: ${cpN(So.fuse.k)} Kinah`:''}.</span></div>`;
  const n=Math.max(0,+CP.engr||0),sn=CP.stoneN==null?En.slots[eg]:Math.max(0,+CP.stoneN||0),sp=Math.max(0,+CP.stoneP||0);
  const b=document.getElementById('cp-eng-out');if(b)b.innerHTML=`<div class="callout ok"><b>${cpN(n*(En.fee[eg]+sn*sp))} Kinah</b> for ${cpN(n)} engraves on ${cpE(eg)} gear (${cpN(En.fee[eg])} fee + ${sn} × ${cpN(sp)} stones each)${sp?'':'. Add your stone price to include the stones'}: ${cpN(n*sn)} stones used.</div>`;
}

function cpMilesHTML(){
  const ils=[70,86,102],c=cpCraft(CP.recipe),out=[];
  const cell=(il,to,amp)=>{const r=cpRun('Unique',il,0,to,0,amp,2500);return {k:r.ek.mean+r.ak.mean,k90:r.ek.p90+r.ak.p90,s:r.eS.mean,a:r.aS.mean}};
  const fmt=x=>`<b>${cpM(x.k)}</b><br><span class="small muted">${cpN(x.s)} stones${x.a?` + ${cpN(x.a)} Amp`:''}<br>unlucky ${cpM(x.k90)}</span>`;
  const rows=[['+10 (always succeeds)',il=>cell(il,10,0)],['+12',il=>cell(il,12,0)],['+15',il=>cell(il,15,0)],['+15 and Amplify +3',il=>cell(il,15,3)],['+15 and Amplify max (+3 at IL70, +5 at 86/102)',il=>cell(il,15,cpCap(il,false))]];
  const t62=cell(62,15,1),t70s=cell(70,15,1);
  return `<p class="small"><b>Expected averages</b> for one piece from +0 (Kinah fees; stones listed under). Weapons, armor and accessories cost the same at the same item level. Multiply by the pieces you plan to do. "Unlucky" = 90th percentile.</p>
  <div class="tablewrap"><table><thead><tr><th>Checkpoint</th>${ils.map(i=>`<th>IL${i} piece</th>`).join('')}</tr></thead><tbody>
  ${rows.map(([n,f])=>`<tr><td class="small">${cpE(n)}</td>${ils.map(il=>`<td class="num">${fmt(f(il))}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>
  <h4>Crafted True Dragon Lord (${CP.recipe==='weapon'?'weapon':'earrings'} recipe, prices from the Crafting section)</h4>
  <div class="tablewrap"><table><thead><tr><th>Goal</th><th>Expected Kinah</th></tr></thead><tbody>
   <tr><td class="small">Craft one True Dragon Lord (IL62)</td><td class="num"><b>${cpM(c.total)}</b></td></tr>
   <tr><td class="small">…then +15 and Amplify +1 (IL62 cap)</td><td class="num"><b>${cpM(c.total+t62.k)}</b><br><span class="small muted">+ ${cpN(t62.s)} stones + ${cpN(t62.a)} Amp</span></td></tr>
   <tr><td class="small">Splendent True Dragon Lord (IL70) straight from the craft (about 4 successes), +15 and Amplify +1</td><td class="num"><b>${cpM(c.total*4+t70s.k)}</b></td></tr>
  </tbody></table></div>
  <p class="small muted">Enhance and Amplify Stones are farmed, not bought, so they are listed rather than priced. 1 Amplify Stone = 4 Fragments + 2,500 Enhance Stones. Soul Binding to 100% adds 2.13M Kinah + 408 Soul Codex per Unique piece.</p>`;
}

function cpTransferHTML(){
  const T=COSTPLAN.transfer,tag=s=>s==='agreed'?'<span class="tag t-good">Kept</span>':s==='lost'?'<span class="tag t-bad">Lost</span>':'<span class="tag t-ok">Disputed</span>';
  return `<h4>Transfer-crafting chain</h4><div class="tablewrap"><table><thead><tr><th>Item</th><th>IL</th><th>How</th></tr></thead><tbody>${T.chain.map(x=>`<tr><td class="small"><b>${cpE(x.n)}</b></td><td class="num">${x.il}</td><td class="small">${cpE(x.how)}</td></tr>`).join('')}</tbody></table></div>
  <p class="small muted">${cpE(T.chainNote)}</p>
  <h4>What carries over</h4><div class="tablewrap"><table><thead><tr><th>Thing</th><th>Status</th><th>Screamheart's sheet</th><th>Game text</th></tr></thead><tbody>${T.carry.map(x=>`<tr><td class="small">${cpE(x.what)}</td><td>${tag(x.st)}</td><td class="small">${cpE(x.sheet)}</td><td class="small">${cpE(x.game)}</td></tr>`).join('')}</tbody></table></div>
  <div class="callout"><b>${cpE(T.carryNote)}</b></div>
  <h4>Transfer Stones (moving to a different item)</h4><div class="tablewrap"><table><thead><tr><th>Move</th><th>Transfer Stones</th></tr></thead><tbody>${T.stones.map(x=>`<tr><td class="small">${cpE(x.move)}</td><td class="num">${x.n}</td></tr>`).join('')}</tbody></table></div>
  <p class="small muted">${cpE(T.stoneNote)}</p>`;
}

function renderCostPlan(){
  const host=document.getElementById('costplan');if(!host)return;
  if(!cpOK()){host.innerHTML='<p class="small muted">The cost planner data did not load.</p>';return}
  cpStyle();CP=cpState();if(!CP_SECS.some(s=>s[0]===CP.sec))CP.sec='reach';if(!COSTPLAN.craft.recipes[CP.recipe])CP.recipe='earrings';
  const body={reach:cpReachHTML,craft:cpCraftHTML,soul:cpSoulHTML,miles:cpMilesHTML,transfer:cpTransferHTML}[CP.sec]();
  host.innerHTML=`${cpSeg('cpsec',CP.sec,CP_SECS)}<div class="cpbody" style="margin-top:10px">${body}</div>`;
  cpRefresh();
}
function cpRefresh(){if(CP.sec==='reach')cpReachOut();else if(CP.sec==='craft')cpCraftOut();else if(CP.sec==='soul')cpSoulOut()}
function cpIn(t){return t&&t.closest&&t.closest('#costplan')}
document.addEventListener('click',e=>{const t=e.target;if(!cpIn(t)||!CP)return;const b=t.closest('button');if(!b)return;const d=b.dataset;
  if(d.cpsec){CP.sec=d.cpsec}else if(d.cpg){CP.g=d.cpg;CP.from=0;CP.to=(COSTPLAN.enh.grades[d.cpg]||{}).max||15;CP.a0=CP.a1=0}else if(d.cprec){CP.recipe=d.cprec}
  else if(d.cpsbg){CP.sbg=d.cpsbg}else if(d.cpeg){CP.eg=d.cpeg;CP.stoneN=null}else if(d.cpreset){CP.prices={};CP.succ={}}else return;
  cpSave();renderCostPlan()});
document.addEventListener('input',e=>{const t=e.target;if(!cpIn(t)||!CP)return;const d=t.dataset;
  if(d.cpprice){if(t.value==='')delete CP.prices[d.cpprice];else CP.prices[d.cpprice]=Math.max(0,+t.value)}
  else if(d.cpsucc){if(t.value==='')delete CP.succ[d.cpsucc];else CP.succ[d.cpsucc]=+t.value}
  else if(d.cpn){CP[d.cpn]=t.value===''?(d.cpn==='stoneN'?null:0):Math.max(0,+t.value)}else return;
  cpRefresh()});
document.addEventListener('change',e=>{const t=e.target;if(!cpIn(t)||!CP)return;const d=t.dataset;let rr=true;
  if(d.cpil){CP.il=+t.value}else if(d.cpfrom){CP.from=+t.value;if(CP.to<=CP.from)CP.to=CP.from+1}else if(d.cpto){CP.to=+t.value}else if(d.cpa0){CP.a0=+t.value;if(CP.a1<CP.a0)CP.a1=CP.a0}else if(d.cpa1){CP.a1=+t.value}
  else if(d.cpspl){CP.spl=t.checked}else if(d.cptax){CP.tax=t.checked;rr=false}else if(d.cpfail){CP.failUses=t.checked;rr=false}else if(d.cpfuse){CP.fuse=t.checked;rr=false}else if(d.cpsbfrom){CP.sbFrom=+t.value}
  else if(d.cpprice||d.cpsucc||d.cpn){rr=false}else return;
  cpSave();if(rr)renderCostPlan();else cpRefresh()});
window.renderCostPlan=renderCostPlan;
{const _ap=window.applyStore;if(typeof _ap==='function')window.applyStore=function(){const r=_ap.apply(this,arguments);try{renderCostPlan()}catch(e){}return r}}
try{renderCostPlan()}catch(e){console.error('costplan',e)}

/* ---------- Upgrade optimizer (Upgrades & stones tab, box #sys-optimizer > #optimizer) ----------
   Data: OPTDATA (audit/r6/optdata.json: simulator stat weights per class/sheet, Soul Binding pools and best lines, item stat tables)
   and COSTPLAN (audit/r5/costplan.json). Expected costs reuse the cost planner's maths (cpEnhSteps, cpAmpSteps, cpPmf, cpDist,
   cpCap, cpCraft from costplan_fn.js, which is loaded first), so both boxes always agree.
   Saved per viewer with S.gset('optimizer', {...}): budget, stock, prices, sheet, and per class the gear table. */
function opOK(){return typeof OPTDATA!=='undefined'&&OPTDATA&&OPTDATA.w&&typeof COSTPLAN!=='undefined'&&COSTPLAN&&COSTPLAN.enh&&typeof cpPmf==='function'}
function opE(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function opN(n){return Math.round(+n||0).toLocaleString('en-US')}
function opM(n){n=+n||0;const a=Math.abs(n);return a>=1e6?(n/1e6).toFixed(a>=1e8?0:a>=1e7?1:2)+'M':a>=1e4?Math.round(n/1e3)+'k':opN(n)}
function opP(x,d){return (x>=0?'+':'')+(+x).toFixed(d==null?2:d)+'%'}
const OP_SLOTS=[['weapon','Weapon','wpn','weapon'],['guard','Guard','guard','guard'],['helmet','Helmet','armor','helmet'],['shoulders','Shoulders','armor','shoulders'],['chest','Chest','armor','chest'],['gloves','Gloves','armor','gloves'],['legs','Legs','armor','legs'],['boots','Boots','armor','boots'],['cloak','Cloak','armor','cloak'],['necklace','Necklace','acc','necklace'],['earring1','Earring 1','acc','earring'],['earring2','Earring 2','acc','earring'],['ring1','Ring 1','acc','ring'],['ring2','Ring 2','acc','ring']];
const OP_POS={MainHand:'weapon',SubHand:'guard',Helmet:'helmet',Shoulder:'shoulders',Torso:'chest',Pants:'legs',Gloves:'gloves',Boots:'boots',Cape:'cloak',Necklace:'necklace',Earring1:'earring1',Earring2:'earring2',Ring1:'ring1',Ring2:'ring2'};
const OP_LINEKEY={'damage boost':'damageBoost','weapon damage boost':'weaponDamageBoost','combat speed':'combatSpeed','critical damage boost':'critDamageBoost','double chance':'double','attack increase':'attackIncrease','multi-hit chance':'multiHit','perfect chance':'perfect','attack':'gearAttack','might':'might','precision':'precision','critical hit':'crit','critical attack':'critAttack','back attack':'backAttack','front attack':'frontAttack','accuracy':'accuracy','accuracy bonus':'accuracy'};
const OP_PCT={damageBoost:1,weaponDamageBoost:1,critDamageBoost:1};
const OP_DEF={v:1,sheet:'median',budget:50000000,stock:{enh:0,amp:0,codex:300,phil:0,piece:0,mana:0},prices:{},cls:{}};
const OP_PRESET={
  typical:{sheet:'median',theo:'',slots:{weapon:{g:'Unique',il:86,enh:12,amp:0,bind:50,best:1,lines:3,stones:1},guard:{g:'Unique',il:70,enh:10,amp:0,bind:30,best:1,lines:5,stones:1},
    armor:{g:'Unique',il:86,enh:10,amp:0,bind:30,best:1,lines:4,stones:1},acc:{g:'Unique',il:70,enh:10,amp:0,bind:30,best:1,lines:5,stones:1}}},
  top:{sheet:'p10',theo:'Theostone: Tiamat\'s Rage',slots:{weapon:{g:'Unique',il:102,enh:15,amp:2,bind:80,best:2,lines:5,stones:2},guard:{g:'Unique',il:102,enh:15,amp:1,bind:60,best:2,lines:5,stones:2},
    armor:{g:'Unique',il:86,enh:12,amp:0,bind:70,best:2,lines:4,stones:2},acc:{g:'Unique',il:86,enh:12,amp:0,bind:60,best:2,lines:5,stones:2}}}
};
let OP=null,OPRES=null,opTimer=null;
function opClsState(){const c=OP.cls[SLUG]=OP.cls[SLUG]||{};if(!c.slots){c.slots={};opApplyPreset('typical',true)}return c}
function opState(){let o={};try{o=S.gget('optimizer',{})||{}}catch(e){}const s=Object.assign({},OP_DEF,o);s.stock=Object.assign({},OP_DEF.stock,o.stock||{});s.prices=Object.assign({},o.prices||{});s.cls=Object.assign({},o.cls||{});return s}
function opSave(){try{S.gset('optimizer',OP)}catch(e){}}
function opPrice(k){const v=OP.prices[k];return (v!=null&&v!==''&&isFinite(+v))?Math.max(0,+v):OPTDATA.prices[k]}
function opApplyPreset(name,silent){
  const p=OP_PRESET[name];if(!p)return;const c=OP.cls[SLUG]=OP.cls[SLUG]||{};c.slots={};
  OP_SLOTS.forEach(([id,,kind])=>{const b=p.slots[kind==='wpn'?'weapon':kind==='guard'?'guard':kind];c.slots[id]=Object.assign({},b,{keep:true})});
  c.theo=p.theo;c.src=name;if(!silent)OP.sheet=p.sheet;
}

/* ----- stat value (simulator weights, piecewise linear through 0, 1 unit and 3 units: caps and diminishing returns) ----- */
function opW(){const w=OPTDATA.w[SLUG];return w&&(w[OP.sheet]||w.median)}
function opExpand(d){const o={};for(const k in d){const v=d[k];if(!v)continue;if(k==='might'){o.attackIncrease=(o.attackIncrease||0)+v*0.1}else if(k==='precision'){o.critIncrease=(o.critIncrease||0)+v*0.1;o.accuracyIncrease=(o.accuracyIncrease||0)+v*0.1}else o[k]=(o[k]||0)+v}return o}
function opF(W,k,x){const s=W.s[k];if(!s||!x)return 0;const u=s[0],g1=s[1],g3=s[2];if(x<0)return g1*x/u;if(x<=u)return g1*x/u;if(x<=3*u)return g1+(g3-g1)*(x-u)/(2*u);return g3+Math.max(0,(g3-g1)/(2*u))*(x-3*u)}
function opGain(W,add,d){d=opExpand(d);let g=0;for(const k in d){if(k.slice(0,6)==='skill:'){g+=(W.sk[k.slice(6)]||0)*d[k];continue}const a=add[k]||0;g+=opF(W,k,a+d[k])-opF(W,k,a)}return g}
function opAddTo(add,d){d=opExpand(d);for(const k in d)add[k]=(add[k]||0)+d[k]}
function opSlope(W,k){if(k.slice(0,6)==='skill:')return W.sk[k.slice(6)]||0;const s=W.s[k];return s?s[1]/s[0]:0}
function opLin(W,d){d=opExpand(d);let g=0;for(const k in d)g+=opSlope(W,k)*d[k];return g}

/* ----- item maths ----- */
function opSoulScale(il){const a=OPTDATA.soulScale;return a[0]+a[1]*il}
function opPoolOf(id){const s=OP_SLOTS.find(x=>x[0]===id);return s?OPTDATA.pools[s[3]]:null}
function opKind(id){const s=OP_SLOTS.find(x=>x[0]===id);return s?s[2]:'armor'}
function opEnhAtk(kind,il,from,to){const t=kind==='wpn'||kind==='guard'?OPTDATA.enh.wpn:kind==='acc'?OPTDATA.enh.acc:null;if(!t)return 0;let a=0;for(let i=from;i<to&&i<t.length;i++)a+=t[i];return a*il/OPTDATA.enh.refIL}
function opAtkKey(kind){return kind==='wpn'?'weaponAtk':'gearAttack'}
function opBaseAtk(id,il){const k=opKind(id),B=OPTDATA.base;if(k==='wpn')return (B.wpn[SLUG]||B.wpn.def)*il;if(k==='guard')return B.guard*il;if(k==='acc'){const p=OP_SLOTS.find(x=>x[0]===id)[3];return (B[p]||0)*il}return 0}
// candidate Soul Binding target lines for this class and slot: [{d:{key:[lo,hi]} (at the item's IL), p:chance per roll, n:name}]
function opBestSet(id,il,W){
  const pool=opPoolOf(id),names=((OPTDATA.best[SLUG]||{})[OP_SLOTS.find(x=>x[0]===id)[3]])||[];if(!pool)return [];
  const sc=opSoulScale(il)/opSoulScale(pool.ref),out=[];
  names.forEach(n=>{const m=/^\+1 (.+)$/.exec(n);
    if(m){if(pool.skill&&(W.sk[m[1]]||0)>0)out.push({n,d:{['skill:'+m[1]]:[1,1]},p:0.2/pool.skill.n});return}
    const L=pool.lines.find(x=>x[0]===n);if(L&&L[1]){const d={[L[1]]:[L[2]*sc,L[3]*sc]};if(opLin(W,{[L[1]]:L[2]*sc})>0)out.push({n,d,p:L[4]})}});
  return out;
}
function opMix(set,b){const P=set.reduce((a,x)=>a+x.p,0),d={};set.forEach(x=>{for(const k in x.d){const [lo,hi]=x.d[k],w=x.p/P;d[k]=d[k]||[0,0];d[k][0]+=w*(lo+(hi-lo)*b);d[k][1]+=w*hi}});return {d,P}}
function opLineNow(L){const o={};for(const k in L.d)o[k]=L.d[k][0];return o}
function opLineGap(L,f){const o={};for(const k in L.d)o[k]=(L.d[k][1]-L.d[k][0])*f;return o}
function opStoneVal(n,v){const k=OP_LINEKEY[String(n||'').toLowerCase().trim()];if(!k)return null;v=parseFloat(String(v).replace(/[^0-9.\-]/g,''))||0;return {[k]:OP_PCT[k]?v/100:v}}

/* runtime model of one slot (built from the saved table row) */
function opModel(id,r,W){
  const kind=opKind(id),pool=opPoolOf(id),b=Math.max(0,Math.min(100,+r.bind||0))/100,il=+r.il||45;
  const m={id,kind,g:r.g==='Epic'?'Epic':'Unique',il,enh:+r.enh||0,amp:+r.amp||0,bind:b*100,keep:r.keep!==false,lines:[],stones:[],nLines:+r.lines||(r.g==='Epic'?3:4),theo:''};
  const set=opBestSet(id,il,W);m.bestSet=set;
  if(r.imp&&r.imp.lines){
    const sc=pool?opSoulScale(il)/opSoulScale(pool.ref):1;
    r.imp.lines.forEach(x=>{let d={},best=false;
      if(x.skill){d={['skill:'+x.skill]:[1,1]};best=set.some(s=>s.n==='+1 '+x.skill)}
      else{const k=OP_LINEKEY[String(x.n).toLowerCase()];const v=parseFloat(String(x.v).replace(/[^0-9.\-]/g,''))||0;
        if(k){const L=pool&&pool.lines.find(y=>y[1]===k);const hi=L?Math.max(v,L[3]*sc):v;d={[k]:[v,hi]};best=set.some(s=>s.n.toLowerCase()===String(x.n).toLowerCase())}}
      m.lines.push({n:x.skill?'+1 '+x.skill:x.n,d,best})});
    while(m.lines.length<m.nLines)m.lines.push({n:'(empty)',d:{},best:false});
  }else{
    const nb=Math.min(+r.best||0,m.nLines),mix=set.length?opMix(set,b):null;
    for(let i=0;i<m.nLines;i++)m.lines.push(i<nb&&mix?{n:'best line',d:JSON.parse(JSON.stringify(mix.d)),best:true}:{n:'other line',d:{},best:false});
  }
  if(r.imp&&r.imp.st){r.imp.st.forEach(x=>{const d=opStoneVal(x.n,x.v);if(d)m.stones.push(d)})}
  else{const g=Math.max(0,+r.stones||0);if(g){const e=opStoneGood();for(let i=0;i<g;i++)m.stones.push(Object.assign({},e))}}
  return m;
}
// expected stat vector of one useful Superior stone line (Attack / Critical Hit / Accuracy / boost lines)
function opStoneGood(){const T=OPTDATA.stones,o={};let P=0;T.lines.forEach(L=>{if(!L[1])return;P+=L[2]});T.lines.forEach(L=>{if(!L[1])return;const ev=L[3].reduce((a,v,i)=>a+v*T.grades[i],0);o[L[1]]=(o[L[1]]||0)+ev*L[2]/P});return o}
function opSlotStats(m){
  const d={},add=(k,v)=>{if(v)d[k]=(d[k]||0)+v};
  if(m.kind!=='armor'){add(opAtkKey(m.kind),opBaseAtk(m.id,m.il)+opEnhAtk(m.kind,m.il,0,m.enh));const E=OPTDATA.enh,w=m.kind!=='acc';add(opAtkKey(m.kind),m.amp*(w?E.ampAtkW:E.ampAtkA)*m.il/E.refIL);add('damageBoost',m.amp*(w?E.ampDbW:E.ampDbA))}
  m.lines.forEach(L=>{for(const k in L.d)add(k,L.d[k][0])});m.stones.forEach(s=>{for(const k in s)add(k,s[k])});return d;
}

/* ----- engraving: sampled rolls of n Superior stone lines (fixed seed, so plans are repeatable) ----- */
const OP_ENGR={};
function opEngrSamples(n){if(OP_ENGR[n])return OP_ENGR[n];const T=OPTDATA.stones;let s=12345+n;const rnd=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648};const out=[];
  for(let i=0;i<3000;i++){const v={};for(let j=0;j<n;j++){let r=rnd(),acc=0,L=null;for(const x of T.lines){acc+=x[2];if(r<acc){L=x;break}}if(!L||!L[1])continue;const q=rnd(),gi=q<T.grades[0]?0:q<T.grades[0]+T.grades[1]?1:2;v[L[1]]=(v[L[1]]||0)+L[3][gi]}out.push(v)}
  return OP_ENGR[n]=out}

/* ----- candidates ----- */
function opStoneCost(need,key,st,price){const have=Math.max(0,st[key]||0),use=Math.min(have,need),buy=need-use;return {use,buy,kin:buy*price,val:need*price}}
function opCands(ms,ctx){
  const W=ctx.W,out=[],pr=ctx.pr,st=ctx.stock;
  ms.forEach(m=>{
    const lbl=OP_SLOTS.find(x=>x[0]===m.id)[1],maxE=m.g==='Epic'?10:15,capE=m.keep?maxE:Math.min(10,maxE);
    // enhancing (+1 step)
    if(m.kind!=='armor'&&m.enh<capE){
      const step=cpEnhSteps(m.g,m.il,m.enh,m.enh+1)[0];if(step){const pm=cpPmf(step.p,step.b),ea=pm.reduce((a,x,i)=>a+x*(i+1),0);
        const atk=opEnhAtk(m.kind,m.il,m.enh,m.enh+1),sc=opStoneCost(step.s*ea,'enh',st,pr.enhStone),k90=cpDist([step],'k',2000).p90,s90=cpDist([step],'s',2000).p90;
        out.push({m,type:'enh',lbl,act:`Enhance +${m.enh}→+${m.enh+1}`,fee:step.k*ea,stones:[['enh',sc,step.s*ea]],d:{[opAtkKey(m.kind)]:atk},
          unl:step.p<100?k90+s90*pr.enhStone:0,why:`+${atk.toFixed(1)} ${m.kind==='wpn'?'weapon ':''}Attack. ${step.p<100?`${step.p}% success, +${step.b}% per failure (pity), about ${ea.toFixed(1)} tries.`:'Always succeeds.'}`,
          apply:()=>{m.enh++}})}}
    // Amplify (+1 level; needs +15, Unique, item kept)
    if(m.kind!=='armor'&&m.g==='Unique'&&m.keep&&m.enh>=15){const cap=cpCap(m.il,false);if(m.amp<cap){const step=cpAmpSteps(m.amp,m.amp+1)[0];if(step){const pm=cpPmf(step.p,step.b),ea=pm.reduce((a,x,i)=>a+x*(i+1),0),E=OPTDATA.enh,w=m.kind!=='acc';
      const atk=(w?E.ampAtkW:E.ampAtkA)*m.il/E.refIL,db=w?E.ampDbW:E.ampDbA,sc=opStoneCost(step.s*ea,'amp',st,pr.ampStone);
      out.push({m,type:'amp',lbl,act:`Amplify +${m.amp}→+${m.amp+1}`,fee:step.k*ea,stones:[['amp',sc,step.s*ea]],d:{[opAtkKey(m.kind)]:atk,damageBoost:db},
        unl:cpDist([step],'k',2000).p90+cpDist([step],'s',2000).p90*pr.ampStone,why:`+${atk.toFixed(1)} Attack and +${db}% Damage Boost. ${step.p}% success, +${step.b}% per failure; cap at IL${m.il}: +${cap}.`,apply:()=>{m.amp++}})}}}
    const so=COSTPLAN.soul.bind[m.g];
    // Soul Binding: next Bind step
    if(so&&m.keep&&m.bind<99.95){const idx=Math.min(9,Math.floor(m.bind/10+1e-9)),f=1/(10-idx),c=so[idx],d={};m.lines.forEach(L=>{const g=opLineGap(L,f);for(const k in g)d[k]=(d[k]||0)+g[k]});
      const cs=opStoneCost(c[1],'codex',st,pr.codex),last=idx===9;
      out.push({m,type:'bind',lbl,act:`Bind step ${idx+1}/10${last?' (100%)':''}`,fee:c[0],stones:[['codex',cs,c[1]]],d,block:cs.buy>0&&!pr.codex?'Soul Codex':'',
        why:`Every line moves part of the way to its maximum (${Math.round(m.bind)}% → ${last?100:Math.round(m.bind+(100-m.bind)*f)}%).${last?' At 100% the lines are fixed for good, and Soul Fuse plus an extra Manastone slot open.':' Fix weak lines with Sync before the last step.'}`,
        apply:()=>{m.lines.forEach(L=>{for(const k in L.d)L.d[k][0]+=(L.d[k][1]-L.d[k][0])*f});m.bind=last?100:m.bind+(100-m.bind)*f;if(last&&m.g==='Unique')m.extraSlot=true}})}
    // Sync: reroll the weakest line toward the guide's best lines (Unique, before 100%)
    if(m.g==='Unique'&&m.keep&&m.bind<99.95&&m.bestSet.length){
      const have=new Set(m.lines.filter(L=>L.best&&L.n!=='best line').map(L=>L.n.toLowerCase()));const set=m.bestSet.filter(s=>!have.has(s.n.toLowerCase()));
      const weak=m.lines.map((L,i)=>({L,i,v:L.best?Infinity:opLin(W,opLineNow(L))})).sort((a,b)=>a.v-b.v)[0];
      if(set.length&&weak&&weak.v<Infinity){const mix=opMix(set,m.bind/100),n=1/mix.P,cs=opStoneCost(n,'piece',st,pr.piece),now=opLineNow(weak.L),d={};for(const k in mix.d)d[k]=mix.d[k][0];for(const k in now)d[k]=(d[k]||0)-now[k];
        out.push({m,type:'sync',lbl,act:`Sync a weak line → ${set.map(s=>s.n).join(' / ')}`,fee:0,stones:[['piece',cs,n]],d,unl:Math.ceil(Math.log(0.1)/Math.log(1-mix.P))*pr.piece,
          why:`Replaces ${weak.L.n==='other line'?'a line that does nothing for damage':'"'+weak.L.n+'"'}. ${(mix.P*100).toFixed(1)}% per Sync Stone (1 spare Unique piece each), about ${n.toFixed(1)} stones on average.`,
          apply:()=>{m.lines[weak.i]={n:'best line',d:JSON.parse(JSON.stringify(mix.d)),best:true}}})}}
    // Soul Fuse (once per account: 2 Philosopher's Stones)
    if(m.g==='Unique'&&m.keep&&m.bind>=99.95&&!m.fused&&!ctx.fuseUsed){const pool=opPoolOf(m.id);if(pool){const sc=opSoulScale(m.il)/opSoulScale(pool.ref),d={};
      pool.lines.forEach(L=>{if(L[1])d[L[1]]=(d[L[1]]||0)+L[4]*(L[2]+L[3])/2*sc});m.bestSet.forEach(s=>{for(const k in s.d)if(k.slice(0,6)==='skill:')d[k]=(d[k]||0)+s.p});
      const cs=opStoneCost(2,'phil',st,pr.phil);
      out.push({m,type:'fuse',lbl,act:'Soul Fuse (+1 random line)',fee:COSTPLAN.soul.fuse.k,stones:[['phil',cs,2]],d,block:cs.buy>0&&!pr.phil?"Philosopher's Stone":'',
        why:"Adds one random line (average value shown). Only one Fuse per account this season: put it on the piece you keep longest. The Fuse line never transfers.",apply:()=>{m.fused=true;ctx.fuseUsed=true;m.lines.push({n:'Fuse line',d:Object.fromEntries(Object.entries(d).map(([k,v])=>[k,[v,v]])),best:false})}})}}
    // Manastone / Soulstone engraving with Superior stones (keepers only): engrave until a roll beats a threshold
    if(m.keep){const n=(COSTPLAN.engrave.slots[m.g]||4)+((m.extraSlot||(m.g==='Unique'&&m.bind>=99.95))?1:0),smp=opEngrSamples(n),vals=smp.map(v=>opLin(W,v)),cur=m.stones.reduce((a,s)=>a+opLin(W,s),0);
      const fee=COSTPLAN.engrave.fee[m.g]||2000,ord=vals.map((v,i)=>i).sort((a,b)=>vals[b]-vals[a]);let bestC=null;
      // stop rule "keep the first roll worth at least T" with T never below what the piece has now (an engrave cannot be undone)
      [0.5,0.3,0.15,0.08,0.04,0.02,0.01].forEach(q=>{const k=Math.max(1,Math.round(q*ord.length)),T=Math.max(vals[ord[k-1]],cur+1e-6);let j=0;while(j<ord.length&&vals[ord[j]]>=T)j++;if(!j)return;
        const sel=ord.slice(0,j),P=j/ord.length,ev=sel.reduce((a,i)=>a+vals[i],0)/j;if(ev<=cur+1e-4)return;
        const cost=(fee+n*pr.mana)/P,r=(ev-cur)/Math.max(1000,cost);if(!bestC||r>bestC.r)bestC={q,sel,P,ev,cost,r,T}});
      if(bestC){const vec={};bestC.sel.forEach(i=>{for(const k in smp[i])vec[k]=(vec[k]||0)+smp[i][k]/bestC.sel.length});const old={};m.stones.forEach(s=>{for(const k in s)old[k]=(old[k]||0)+s[k]});const d=Object.assign({},vec);for(const k in old)d[k]=(d[k]||0)-old[k];
        const tries=1/bestC.P,cs=opStoneCost(n*tries,'mana',st,pr.mana);
        out.push({m,type:'engr',lbl,act:`Engrave ${n} Superior ${m.kind==='acc'?'Soulstones':'Manastones'} until a good roll`,fee:fee*tries,stones:[['mana',cs,n*tries]],d,unl:Math.ceil(Math.log(0.1)/Math.log(1-bestC.P))*(fee+n*pr.mana),
          why:`${bestC.T<0.005?'Keep the first roll that adds any damage':`Keep the first roll whose lines are worth at least ${opP(bestC.T)} DPS (now ${opP(cur)})`} (about 1 roll in ${Math.round(tries)}). Every engrave rerolls all ${n} lines: Global has no line lock.`,apply:()=>{m.stones=[vec]}})}}
    // Theostone (weapon)
    if(m.kind==='wpn'&&!ctx.theoDone){const th=W.th||{},curV=th[m.theo]||0;let bn=null,bv=0;for(const k in th)if(th[k]>bv){bv=th[k];bn=k}
      if(bn&&bv>curV+0.05)out.push({m,type:'theo',lbl,act:`Socket ${bn.replace(/^Theostone: /,'')}`,fee:pr.theoU,stones:[],dps:bv-curV,
        why:`Best Theostone for single-target raids in the simulator (its proc damage scaling is a simulator assumption, so treat the size as rough)${m.theo?` (replaces ${m.theo.replace(/^Theostone: /,'')})`:''}. Unique Theostones only on a weapon you keep.`,apply:()=>{m.theo=bn;ctx.theoDone=true}})}
    // Craft a True Dragon Lord piece (IL62) to replace a lower-IL weapon, guard or accessory; Transfer Stone carries enhancement and Soul Binding
    if(m.kind!=='armor'&&m.il<62&&typeof cpCraft==='function'){if(!CP)CP=cpState();const rk=m.kind==='acc'?'earrings':'weapon';if(COSTPLAN.craft.recipes[rk]){const c=cpCraft(rk).total,carry=m.enh>0||m.bind>0;
      const nm=JSON.parse(JSON.stringify(m)),r=opSoulScale(62)/opSoulScale(m.il);nm.il=62;nm.g='Unique';nm.amp=0;nm.stones=[];nm.lines.forEach(L=>{for(const k in L.d)if(k.slice(0,6)!=='skill:'){L.d[k][0]*=r;L.d[k][1]*=r}});
      const a=opSlotStats(m),b=opSlotStats(nm),d={};for(const k in b)d[k]=b[k]-(a[k]||0);for(const k in a)if(!(k in b))d[k]=-a[k];
      const cs=opStoneCost(carry?1:0,'piece',st,pr.piece);
      out.push({m,type:'craft',lbl,act:`Craft True Dragon Lord (IL62)${carry?' + Transfer Stone':''}`,fee:c,stones:carry?[['piece',cs,1]]:[],d,
        why:`IL${m.il} → IL62 (25% chance of Splendent IL70, not counted). ${m.kind==='acc'?'Priced with the earring recipe (necklace and ring recipes are not in the cost data). ':''}Crafting prices from the cost planner's Crafting section. Stones on the old piece are lost.`,
        apply:()=>{Object.assign(m,{il:62,g:'Unique',amp:0,stones:[],lines:nm.lines,keep:true,bestSet:opBestSet(m.id,62,W)})}})}}
  });
  return out;
}

/* ----- greedy plan: best % DPS per Kinah first, re-evaluated after every step ----- */
function opPlan(){
  const W=opW(),c=opClsState(),pr={};['enhStone','ampStone','mana','piece','theoU','codex','phil'].forEach(k=>pr[k]=opPrice(k));
  const ms=OP_SLOTS.map(([id])=>opModel(id,c.slots[id]||{},W));const w=ms.find(m=>m.kind==='wpn');if(w)w.theo=c.theo||'';
  const ctx={W,pr,stock:Object.assign({},OP.stock),fuseUsed:false,theoDone:false},add={};
  let left=Math.max(0,+OP.budget||0),cum=0,cumG=0;const rows=[],blocked={},skipped={};
  for(let it=0;it<400;it++){
    const cs=opCands(ms,ctx);let best=null;
    cs.forEach(x=>{x.g=x.dps!=null?x.dps:opGain(W,add,x.d);if(x.g<=0.002)return;
      const kin=x.fee+x.stones.reduce((a,s)=>a+s[1].kin,0),val=x.fee+x.stones.reduce((a,s)=>a+s[1].val,0);x.kin=kin;x.val=val;x.r=x.g/(Math.max(1000,val)/1e6);
      if(x.block){blocked[x.block]=(blocked[x.block]||0)+1;return}if(kin>left){skipped[x.type]=1;return}if(!best||x.r>best.r)best=x});
    if(!best)break;
    best.stones.forEach(([k,s])=>{ctx.stock[k]=Math.max(0,(ctx.stock[k]||0)-s.use)});
    left-=best.kin;cum+=best.kin;cumG+=best.g;if(best.dps==null)opAddTo(add,best.d);best.apply();
    rows.push({lbl:best.lbl,id:best.m.id,type:best.type,act:best.act,kin:best.kin,val:best.val,g:best.g,r:best.r,cum,cumG,why:best.why,unl:best.unl||0,
      st:best.stones.map(([k,s,n])=>({k,n,use:s.use,buy:s.buy}))});
  }
  return {rows,left,cum,cumG,blocked,skipped,stock:ctx.stock,ms};
}
// merge consecutive rows of the same slot and kind of step (e.g. +10→+11, +11→+12 becomes +10→+12)
function opMerge(rows){const out=[];rows.forEach(r=>{const p=out[out.length-1];
  if(p&&p.id===r.id&&p.type===r.type&&(r.type==='enh'||r.type==='amp'||r.type==='bind')){p.n++;p.kin+=r.kin;p.val+=r.val;p.g+=r.g;p.cum=r.cum;p.cumG=r.cumG;p.unl+=r.unl;
    if(r.type==='bind'){const a=(p.act0.match(/step (\d+)/)||[])[1],b=(r.act.match(/step (\d+)/)||[])[1];p.act=`Bind steps ${a}–${b}/10${/100%/.test(r.act)?' (100%)':''}`}
    else p.act=p.act0.replace(/→\+\d+$/,'→+'+(r.act.match(/→\+(\d+)$/)||[])[1]);
    r.st.forEach(s=>{const q=p.st.find(x=>x.k===s.k);if(q){q.n+=s.n;q.use+=s.use;q.buy+=s.buy}else p.st.push(Object.assign({},s))});p.why=r.type==='bind'?r.why:p.why}
  else out.push(Object.assign({n:1,act0:r.act},r,{st:r.st.map(s=>Object.assign({},s))}))});
  // then the same step done on several pieces in a row (e.g. engrave every piece once) becomes one row
  const o2=[];out.forEach(r=>{const p=o2[o2.length-1];
    if(p&&p.type===r.type&&p.act===r.act&&p.why===r.why&&!p.ids.includes(r.id)){p.ids.push(r.id);p.lbls.push(r.lbl);p.kin+=r.kin;p.val+=r.val;p.g+=r.g;p.cum=r.cum;p.cumG=r.cumG;p.unl+=r.unl;
      r.st.forEach(s=>{const q=p.st.find(x=>x.k===s.k);if(q){q.n+=s.n;q.use+=s.use;q.buy+=s.buy}else p.st.push(Object.assign({},s))})}
    else o2.push(Object.assign(r,{ids:[r.id],lbls:[r.lbl]}))});
  o2.forEach(r=>{r.r=r.g/(Math.max(1000,r.val)/1e6);if(r.lbls.length>1){r.lbl=r.lbls.join(', ');r.act+=` (${r.lbls.length} pieces, totals shown)`}});return o2}

/* ----- My character import ----- */
function opFromMyChar(){
  if(typeof chGet!=='function'||typeof chModel!=='function')return 'The My character tab is not available.';
  const rec=chGet();if(!rec||!rec.official)return 'No character loaded yet. Load one in the My character tab first (official character page data).';
  const M=chModel(rec);const slug=typeof chSlugOf==='function'?chSlugOf(M.cls):null;if(slug&&slug!==SLUG)return `Your loaded character is a ${M.cls}; switch to that class's guide to use it.`;
  if(!M.gear.length)return 'The loaded character has no equipment list.';
  const c=opClsState();let n=0;
  M.gear.forEach(g=>{const id=OP_POS[g.slot];if(!id)return;const gr=/^(Legend|Epic)$/i.test(g.grade)?'Epic':'Unique';
    const row={g:gr,il:+g.il||(c.slots[id]||{}).il||45,enh:Math.min(+g.enh||0,gr==='Epic'?10:15),amp:+g.exceed||0,bind:g.soulRate!=null?+g.soulRate:0,lines:+g.soulMax||(gr==='Epic'?3:4),keep:true};
    if(g.detail){row.imp={lines:(g.soul||[]).map(s=>s.skill?{skill:s.skill}:{n:s.name,v:s.value}),st:(g.stones||[]).map(s=>({n:s.name,v:s.value}))};row.lines=Math.min(6,Math.max(row.lines,row.imp.lines.length));
      const set=opBestSet(id,row.il,opW());row.best=row.imp.lines.filter(x=>x.skill?set.some(s=>s.n==='+1 '+x.skill):set.some(s=>s.n.toLowerCase()===String(x.n).toLowerCase())).length;
      row.stones=row.imp.st.filter(x=>{const d=opStoneVal(x.n,x.v);return d&&opLin(opW(),d)>0.01}).length;if(id==='weapon')c.theo=(g.theo||[])[0]||''}
    else{row.best=0;row.stones=0}
    c.slots[id]=row;n++});
  c.src='mychar';const cp=+M.cp||0;OP.sheet=cp>=95000?'p10':'median';
  return `Loaded ${n} pieces from ${M.name||'your character'}${M.gear.some(g=>g.detail)?'':' (no item details: Soul Binding lines and stones are set to 0; load the full character data for them)'}. Stat weights: ${OP.sheet==='p10'?'Top 10%':'Typical'} sheet (combat power ${opN(cp)}).`;
}

/* ----- rendering ----- */
function opStyle(){if(document.getElementById('opstyle'))return;const st=document.createElement('style');st.id='opstyle';st.textContent=`
#optimizer .opgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:10px 0}
#optimizer label.opf{display:flex;flex-direction:column;gap:4px;font:600 12px var(--f-mono);letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
#optimizer input[type=number],#optimizer select{width:100%;min-width:0;box-sizing:border-box;background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:7px 9px;font:600 16px var(--f-mono)}
#optimizer td input[type=number],#optimizer td select{width:auto;min-width:58px;padding:4px 6px;font-size:14px}
#optimizer td input[type=checkbox]{accent-color:var(--wind);width:17px;height:17px}
#optimizer .num{text-align:right;font-family:var(--f-mono);white-space:nowrap}#optimizer .opbig{color:var(--gold);font-weight:700}
#optimizer tr.opimp td:first-child{border-left:3px solid var(--wind)}#optimizer .opwhy{max-width:340px}#optimizer h4{margin:14px 0 6px}
#optimizer .chrow{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
#op-out table{min-width:860px}#op-out td:nth-child(2){min-width:120px}#op-out td:nth-child(3){min-width:150px}#optimizer .opwhy{min-width:240px}#optimizer .tablewrap>table{border-collapse:collapse}`;(document.head||document.body).appendChild(st)}
function opSel(attr,cur,opts,extra){return `<select data-${attr}${extra||''}>${opts.map(([v,l])=>`<option value="${opE(v)}"${String(v)===String(cur)?' selected':''}>${opE(l)}</option>`).join('')}</select>`}
function opTableHTML(){
  const c=opClsState(),E=COSTPLAN.enh;
  return `<div class="tablewrap"><table><thead><tr><th>Slot</th><th>Grade</th><th>IL</th><th>+</th><th>Amp</th><th>Bind %</th><th>Best lines</th><th>Lines</th><th>Good stones</th><th>Keep</th></tr></thead><tbody>
  ${OP_SLOTS.map(([id,lbl,kind])=>{const r=c.slots[id]||{},g=r.g==='Epic'?'Epic':'Unique',G=E.grades[g],ils=G.ils.slice();if(r.il&&!ils.includes(+r.il))ils.push(+r.il);ils.sort((a,b)=>a-b);
    const lv=(a,b)=>{const o=[];for(let i=a;i<=b;i++)o.push([i,String(i)]);return o},cap=g==='Unique'?Math.max(cpCap(+r.il,false),+r.amp||0):0,nl=+r.lines||(g==='Epic'?3:4);
    return `<tr${r.imp?' class="opimp"':''}><td class="small"><b>${opE(lbl)}</b>${kind==='armor'?'<br><span class="muted">no damage from + / Amp</span>':''}</td>
    <td>${opSel(`opf="g" data-slot="${id}"`,g,[['Unique','Unique'],['Epic','Epic']])}</td>
    <td>${opSel(`opf="il" data-slot="${id}"`,r.il,ils.map(i=>[i,i]))}</td>
    <td>${opSel(`opf="enh" data-slot="${id}"`,r.enh||0,lv(0,G.max))}</td>
    <td>${cap?opSel(`opf="amp" data-slot="${id}"`,r.amp||0,lv(0,cap)):'<span class="muted small">—</span>'}</td>
    <td><input type="number" inputmode="decimal" min="0" max="100" step="0.1" data-opf="bind" data-slot="${id}" value="${+r.bind||0}" aria-label="${opE(lbl)} Soul Binding rate"></td>
    <td>${opSel(`opf="best" data-slot="${id}"`,Math.min(+r.best||0,nl),lv(0,nl))}</td>
    <td>${opSel(`opf="lines" data-slot="${id}"`,nl,lv(1,6))}</td>
    <td>${opSel(`opf="stones" data-slot="${id}"`,+r.stones||0,lv(0,5))}</td>
    <td><input type="checkbox" data-opf="keep" data-slot="${id}"${r.keep!==false?' checked':''} aria-label="Keep ${opE(lbl)}"></td></tr>`}).join('')}
  </tbody></table></div>`;
}
function renderOptimizer(){
  const host=document.getElementById('optimizer');if(!host)return;
  if(!opOK()){host.innerHTML='<p class="small muted">The optimizer data did not load.</p>';return}
  if(!OPTDATA.w[SLUG]){host.innerHTML=`<p class="small muted">The upgrade optimizer covers the 8 Global classes. ${opE((typeof P!=='undefined'&&P.cls)||'This class')} has no Global simulator data yet.</p>`;return}
  opStyle();OP=opState();const c=opClsState(),W=opW(),th=Object.keys(W.th||{}).sort((a,b)=>W.th[b]-W.th[a]);
  const pi=(k,l)=>`<label class="opf">${opE(l)}<input type="number" inputmode="numeric" min="0" step="1" data-opp="${k}" value="${opPrice(k)}"></label>`;
  const si=(k,l)=>`<label class="opf">${opE(l)}<input type="number" inputmode="numeric" min="0" step="1" data-ops="${k}" value="${+OP.stock[k]||0}"></label>`;
  const hasChar=typeof chGet==='function'&&(()=>{try{return !!chGet()}catch(e){return false}})();
  host.innerHTML=`<p class="small">Enter your gear (or load it from My character), your Kinah budget and what you have on hand. The plan lists the next upgrades in the order that gives the <b>most damage per Kinah</b>, re-checking after every step, until the budget runs out.</p>
  <div class="chrow"><button type="button" class="btn primary" data-opb="mychar">Use My character</button><button type="button" class="btn" data-opb="typical">Fill: Typical gear</button><button type="button" class="btn" data-opb="top">Fill: Top-10% gear</button></div>
  <div id="op-msg" class="small muted">${hasChar?'A character is loaded in My character: press "Use My character" to copy its gear here.':'Tip: load your character in the My character tab, then press "Use My character".'}</div>
  <div class="opgrid">
   <label class="opf">Budget (Kinah)<input type="number" inputmode="numeric" min="0" step="100000" data-opk="budget" value="${+OP.budget||0}"></label>
   <label class="opf">Stat weights ${opSel('opk="sheet"',OP.sheet,[['median','Typical player'],['p10','Top 10%']])}</label>
   <label class="opf">Weapon Theostone ${opSel('opk="theo"',c.theo||'',[['','None']].concat(th.map(t=>[t,t.replace(/^Theostone: /,'')])).concat(c.theo&&!th.includes(c.theo)?[[c.theo,c.theo.replace(/^Theostone: /,'')]]:[]))}</label>
  </div>
  <h4>Your gear</h4>${opTableHTML()}
  <p class="small muted">Best lines = Soul Binding lines that are on the guide's best list for that slot (Build tab: Soul Binding targets). Good stones = Attack, Critical Hit, Accuracy or boost lines. Untick Keep for pieces you will replace: they get no enhancing past +10, no Amplify, Binding or Superior stones.${c.src==='mychar'?' Rows with a blue edge came from My character with their exact lines and stones; changing Best lines or Good stones there switches the row to the simple count.':''}</p>
  <details class="small"><summary><b>Stones on hand and prices</b></summary>
   <div class="opgrid">${si('enh','Enhance Stones')}${si('amp','Amplify Stones')}${si('codex','Soul Codex')}${si('phil',"Philosopher's Stones")}${si('piece','Spare Unique pieces')}${si('mana','Superior Manastones')}</div>
   <div class="opgrid">${pi('enhStone','Enhance Stone price')}${pi('ampStone','Amplify Stone price')}${pi('mana','Superior stone price')}${pi('piece','Spare Unique piece price')}${pi('theoU','Theostone price')}${pi('codex','Soul Codex price')}${pi('phil',"Philosopher's Stone price")}</div>
   <ul class="plain small">${Object.entries(OPTDATA.priceNotes).map(([,v])=>`<li>${opE(v)}</li>`).join('')}<li>Stones on hand are used first and cost no Kinah, but the ranking still counts them at their price, so they go where they help most.</li></ul>
   <p><button type="button" class="btn" data-opb="resetprices">Reset prices to the defaults</button></p></details>
  <div id="op-out"></div>`;
  opRun();
}
function opRun(){
  const el=document.getElementById('op-out');if(!el)return;let R;
  try{R=opPlan()}catch(e){el.innerHTML=`<p class="small muted">Could not build a plan (${opE(e.message)}).</p>`;if(typeof console!=='undefined')console.error('optimizer',e);return}
  OPRES=R;const rows=opMerge(R.rows),SN={enh:'Enhance Stones',amp:'Amplify Stones',codex:'Soul Codex',phil:"Philosopher's Stones",piece:'spare Unique pieces',mana:'Superior stones'};
  const stTxt=r=>r.st.filter(s=>s.n>=0.05).map(s=>`${opN(s.n)} ${SN[s.k]}${s.use>=0.5?` (${opN(s.use)} on hand)`:''}`).join(', ');
  const tot={};R.rows.forEach(r=>r.st.forEach(s=>{tot[s.k]=(tot[s.k]||0)+s.n}));
  const notes=[];if(R.blocked['Soul Codex'])notes.push('Some Bind steps were left out: not enough Soul Codex on hand (Soul Codex is bound; add what you own under "Stones on hand").');
  if(R.blocked["Philosopher's Stone"])notes.push("Soul Fuse left out: it needs 2 Philosopher's Stone: Revelation (Season Shop, 30,000 Oath Coins each, 2 per account). Enter them under Stones on hand.");
  if(R.left<1)notes.push('The budget ran out; raise it to see the next steps.');
  el.innerHTML=rows.length?`<div class="callout ok"><b>${opP(R.cumG)} DPS for about ${opM(R.cum)} Kinah</b> (${rows.length} steps, ${opM(R.left)} left over)${Object.keys(tot).length?`, using ${Object.entries(tot).filter(([,n])=>n>=0.5).map(([k,n])=>`${opN(n)} ${SN[k]}`).join(', ')}`:''}. Expected averages; gains add up approximately.</div>
  <div class="tablewrap"><table><thead><tr><th>#</th><th>Item</th><th>Upgrade</th><th>Expected cost</th><th>DPS</th><th>Per 1M Kinah</th><th>Total cost</th><th>Total DPS</th><th>Why</th></tr></thead><tbody>
  ${rows.map((r,i)=>`<tr><td class="num">${i+1}</td><td class="small"><b>${opE(r.lbl)}</b></td><td class="small">${opE(r.act)}</td>
   <td class="num"><b>${opM(r.kin)}</b>${r.val>r.kin+1?`<br><span class="small muted">worth ${opM(r.val)} with stones</span>`:''}${r.unl?`<br><span class="small muted">unlucky ${opM(r.unl)}</span>`:''}${stTxt(r)?`<br><span class="small muted">${opE(stTxt(r))}</span>`:''}</td>
   <td class="num">${opP(r.g)}</td><td class="num">${r.r>=100?'very high':opP(r.r,3)}</td><td class="num">${opM(r.cum)}</td><td class="num opbig">${opP(r.cumG)}</td><td class="small opwhy">${opE(r.why)}</td></tr>`).join('')}
  </tbody></table></div>`:`<div class="callout"><b>No upgrade fits.</b> ${R.left<1?'Add a budget.':'Everything that adds damage is done or blocked, or the next step costs more than the budget.'}</div>`;
  el.innerHTML+=`${notes.length?`<ul class="plain small">${notes.map(n=>`<li>${opE(n)}</li>`).join('')}</ul>`:''}
  <details class="small"><summary><b>How this works and what it leaves out</b></summary><ul class="plain small">
   <li><b>Damage</b>: each stat's worth comes from the guide's simulator (raid bosses Divine Auldor and Kromede's Desire, the ${OP.sheet==='p10'?'Top-10%':'Typical'} stat sheet, guide rotation), measured at one and three steps of each stat, so caps (Critical Hit 50%) and diminishing returns shrink later gains.</li>
   <li><b>Cost</b>: the same exact maths as the cost planner above (odds, pity, fees by item level); stones turned into Kinah at your prices. Unlucky = 90th percentile.</li>
   <li><b>Stats per step</b>: enhancement and Amplify tables from Global client data (metabot.gg item pages); Soul Binding pools and best lines from this guide's reroll targets. Binding moves each line toward its maximum (an assumption: the game only says the rate raises line values).</li>
   <li>Never enhance past +10 an item you will replace: untick Keep and the plan stops it at +10 (the cost planner explains why).</li>
   <li>Armor + and Amplify add Defense/HP only, so they never rank for damage; do them for survival. Bracelets, belt and amulet are not modelled.</li>
   <li>Not ranked (no Kinah price): Daevanion boards, Arcana, Stigma levels, wings and the White/Wise Dragon Lord upgrade recipes. See their tabs.</li>
   <li>${opE(OPTDATA.note)}</li></ul></details>`;
}
function opSched(){clearTimeout(opTimer);opTimer=setTimeout(()=>{opSave();opRun()},250)}
function opIn(t){return t&&t.closest&&t.closest('#optimizer')}
function opSay(t){const m=document.getElementById('op-msg');if(m)m.textContent=t}
document.addEventListener('click',e=>{const t=e.target;if(!opIn(t)||!OP)return;const b=t.closest('button');if(!b||!b.dataset.opb)return;const k=b.dataset.opb;
  if(k==='mychar'){const msg=opFromMyChar();opSave();renderOptimizer();opSay(msg);return}
  if(k==='typical'||k==='top'){opApplyPreset(k);opSave();renderOptimizer();opSay(k==='top'?'Filled with a Top-10% gear example.':'Filled with a Typical gear example.');return}
  if(k==='resetprices'){OP.prices={};opSave();renderOptimizer()}});
document.addEventListener('input',e=>{const t=e.target;if(!opIn(t)||!OP)return;const d=t.dataset;
  if(d.opp){if(t.value==='')delete OP.prices[d.opp];else OP.prices[d.opp]=Math.max(0,+t.value)}
  else if(d.ops){OP.stock[d.ops]=Math.max(0,+t.value||0)}
  else if(d.opk==='budget'){OP.budget=Math.max(0,+t.value||0)}
  else if(d.opf==='bind'){const r=opClsState().slots[d.slot];if(r)r.bind=Math.max(0,Math.min(100,+t.value||0))}else return;
  opSched()});
document.addEventListener('change',e=>{const t=e.target;if(!opIn(t)||!OP)return;const d=t.dataset;
  if(d.opk==='sheet'){OP.sheet=t.value==='p10'?'p10':'median'}
  else if(d.opk==='theo'){opClsState().theo=t.value}
  else if(d.opf&&d.slot){const r=opClsState().slots[d.slot]=opClsState().slots[d.slot]||{};const f=d.opf;
    if(f==='keep')r.keep=t.checked;else if(f==='g'){r.g=t.value;const G=COSTPLAN.enh.grades[r.g];if(!G.ils.includes(+r.il))r.il=G.ils[G.ils.length-1];r.enh=Math.min(+r.enh||0,G.max);if(r.g==='Epic'){r.amp=0;r.lines=Math.min(+r.lines||3,3)}delete r.imp}
    else if(f==='bind'){r.bind=Math.max(0,Math.min(100,+t.value||0))}
    else{r[f]=+t.value;if(f==='best'||f==='stones'||f==='lines'||f==='il')delete r.imp;if(f==='il'||f==='enh'){const cap=r.g==='Unique'?cpCap(+r.il,false):0;if(+r.enh<15||+r.amp>cap)r.amp=Math.min(+r.amp||0,+r.enh>=15?cap:0)}}
    opSave();renderOptimizer();return}
  else if(d.opp||d.ops||d.opk==='budget'){opSave();return}else return;
  opSave();renderOptimizer()});
window.renderOptimizer=renderOptimizer;
{const _ap=window.applyStore;if(typeof _ap==='function')window.applyStore=function(){const r=_ap.apply(this,arguments);try{renderOptimizer()}catch(e){}return r}}
try{renderOptimizer()}catch(e){console.error('optimizer',e)}

/* ---------- My character: load your own character from NCSoft's character page and compare it with this guide ----------
   Data in: the JSON the bookmarklet copies (classes/bookmarklet.js -> sim/tools/make_bookmarklet.py fills CHAR_BM),
   NCSoft's raw info/equipment JSON, or an AionFlex "af1." build code (Genus Insight + perks).
   Storage: ONE character only, in one global slot S.gset('mychar', {v, saved, official, af1, done, ticked}); a new load of
   another character replaces it completely, Clear deletes the key. No list, history or cache of other characters.
   Simulator hook: if window.AionSim.estimateGain({slug, mode, model, action}) exists and returns a number
   (estimated DPS gain in %), the "Do these next" list is sorted by gain per cost instead of the cheap-first order. */
const CHAR_BM=/*BM-START*/"javascript:(function%20()%20{%20var%20GAP%20=%20150;%20var%20BOX_ID%20=%20'a2fm-char-msg';%20var%20LANG%20=%20'en-US';%20var%20REGIONS%20=%20['',%20'nae',%20'naw',%20'eu',%20'la',%20'as'];%20var%20DROP%20=%20{icon:%201,%20profileImage:%201,%20costumes:%201,%20sources:%201,%20favorite:%201,%20storable:%201,%20tradable:%201,%20tradablePersonal:%201,%20decomposable:%201,%20skinList:%201,%20wingSkin:%201,%20children:%201};%20function%20box()%20{%20var%20d%20=%20document.getElementById(BOX_ID);%20if%20(!d)%20{%20d%20=%20document.createElement('div');%20d.id%20=%20BOX_ID;%20d.setAttribute('role',%20'status');%20d.style.cssText%20=%20'position:fixed;left:50%25;top:16px;transform:translateX(-50%25);z-index:2147483647;max-width:min(560px,92vw);background:%23171b28;color:%23ebe6d8;border:2px%20solid%20%23e3b862;border-radius:12px;padding:14px%2016px;font:15px/1.45%20system-ui,sans-serif;box-shadow:0%208px%2030px%20rgba(0,0,0,.5)';%20document.body.appendChild(d);%20}%20return%20d;%20}%20function%20say(text,%20kind)%20{%20var%20d%20=%20box();%20d.style.borderColor%20=%20kind%20===%20'err'%20%3F%20'%23ef8c6a'%20:%20kind%20===%20'ok'%20%3F%20'%2373cdbd'%20:%20'%23e3b862';%20d.textContent%20=%20'';%20var%20t%20=%20document.createElement('div');%20t.textContent%20=%20text;%20d.appendChild(t);%20if%20(kind%20===%20'err'%20||%20kind%20===%20'ok')%20{%20var%20x%20=%20document.createElement('button');%20x.textContent%20=%20'Close';%20x.style.cssText%20=%20'margin-top:10px;background:%231d2232;color:%23ebe6d8;border:1px%20solid%20%232b3246;border-radius:8px;padding:6px%2012px;font:600%2014px%20system-ui,sans-serif;cursor:pointer';%20x.onclick%20=%20function%20()%20{%20d.remove();%20};%20d.appendChild(x);%20}%20return%20d;%20}%20function%20sleep(ms)%20{%20return%20new%20Promise(function%20(r)%20{%20setTimeout(r,%20ms);%20});%20}%20function%20slim(o)%20{%20if%20(Array.isArray(o))%20{%20return%20o.map(slim);%20}%20if%20(o%20&&%20typeof%20o%20===%20'object')%20{%20var%20r%20=%20{};%20Object.keys(o).forEach(function%20(k)%20{%20if%20(!DROP[k])%20{%20r[k]%20=%20slim(o[k]);%20}%20});%20return%20r;%20}%20return%20o;%20}%20function%20slimBoard(b)%20{%20var%20nodes%20=%20(b%20&&%20b.nodeList)%20||%20[];%20return%20{%20nodeList:%20nodes.filter(function%20(n)%20{%20return%20n%20&&%20n.open%20===%201;%20}).map(function%20(n)%20{%20return%20{row:%20n.row,%20col:%20n.col,%20type:%20n.type,%20grade:%20n.grade,%20name:%20n.name,%20effectList:%20n.effectList};%20}),%20nodeCount:%20nodes.filter(function%20(n)%20{%20return%20n%20&&%20n.type%20&&%20n.type%20!==%20'None';%20}).length,%20openStatEffectList:%20b.openStatEffectList%20||%20[],%20openSkillEffectList:%20b.openSkillEffectList%20||%20[]%20};%20}%20function%20copyFallback(text)%20{%20var%20ta%20=%20document.createElement('textarea');%20ta.value%20=%20text;%20ta.setAttribute('readonly',%20'');%20ta.style.cssText%20=%20'position:fixed;left:-9999px;top:0;width:10px;height:10px';%20document.body.appendChild(ta);%20ta.select();%20var%20ok%20=%20false;%20try%20{%20ok%20=%20document.execCommand('copy');%20}%20catch%20(e)%20{%20ok%20=%20false;%20}%20ta.remove();%20return%20ok;%20}%20function%20manual(text,%20kb)%20{%20var%20d%20=%20say('Your%20browser%20blocked%20the%20automatic%20copy.%20Click%20%22Copy%22%20below%20(or%20click%20in%20the%20box%20and%20press%20Ctrl+C%20/%20Cmd+C),%20then%20paste%20it%20into%20the%20guide%5C's%20My%20character%20tab.',%20'info');%20var%20b%20=%20document.createElement('button');%20b.textContent%20=%20'Copy%20('%20+%20kb%20+%20'%20KB)';%20b.style.cssText%20=%20'margin:10px%208px%200%200;background:%23e3b862;color:%2310131c;border:0;border-radius:8px;padding:8px%2014px;font:700%2014px%20system-ui,sans-serif;cursor:pointer';%20var%20ta%20=%20document.createElement('textarea');%20ta.value%20=%20text;%20ta.setAttribute('readonly',%20'');%20ta.style.cssText%20=%20'display:block;width:100%25;height:90px;margin-top:10px;background:%2310131c;color:%23ebe6d8;border:1px%20solid%20%232b3246;border-radius:8px;font:12px%20monospace';%20b.onclick%20=%20function%20()%20{%20var%20done%20=%20function%20()%20{%20say('Copied%20-%20paste%20it%20into%20the%20guide%5C's%20My%20character%20tab.',%20'ok');%20};%20if%20(navigator.clipboard%20&&%20navigator.clipboard.writeText)%20{%20navigator.clipboard.writeText(text).then(done,%20function%20()%20{%20ta.focus();%20ta.select();%20if%20(copyFallback(text))%20{%20done();%20}%20});%20}%20else%20if%20(copyFallback(text))%20{%20done();%20}%20else%20{%20ta.focus();%20ta.select();%20}%20};%20var%20x%20=%20document.createElement('button');%20x.textContent%20=%20'Close';%20x.style.cssText%20=%20'margin-top:10px;background:%231d2232;color:%23ebe6d8;border:1px%20solid%20%232b3246;border-radius:8px;padding:6px%2012px;font:600%2014px%20system-ui,sans-serif;cursor:pointer';%20x.onclick%20=%20function%20()%20{%20d.remove();%20};%20d.appendChild(b);%20d.appendChild(x);%20d.appendChild(ta);%20ta.addEventListener('focus',%20function%20()%20{%20ta.select();%20});%20}%20if%20(!/(^|%5C.)aion2%5C.plaync%5C.com$/.test(location.hostname))%20{%20alert('This%20button%20works%20on%20NCSoft%5C's%20character%20page.%20Open%20aion2.plaync.com/en-us/characters/index,%20find%20your%20character,%20open%20it,%20then%20click%20the%20bookmark%20again.');%20return;%20}%20var%20m%20=%20location.pathname.match(/%5C/characters%5C/(%5Cd{4})%5C/([^%5C/%3F%23]+)/);%20if%20(!m)%20{%20say('Open%20your%20character%20first:%20search%20your%20name%20on%20this%20page,%20click%20your%20character,%20then%20click%20the%20bookmark%20again.',%20'err');%20return;%20}%20var%20serverId%20=%20m[1];%20var%20rawId%20=%20m[2];%20try%20{%20rawId%20=%20decodeURIComponent(rawId);%20}%20catch%20(e)%20{%20rawId%20=%20m[2];%20}%20var%20cid%20=%20encodeURIComponent(rawId);%20var%20region%20=%20new%20URLSearchParams(location.search).get('region')%20||%20REGIONS[Math.floor(Number(serverId)%20/%20100)%20%25%2010]%20||%20'';%20var%20base%20=%20location.origin%20+%20'/api/character/';%20var%20q%20=%20'region='%20+%20encodeURIComponent(region)%20+%20'&lang='%20+%20LANG%20+%20'&characterId='%20+%20cid%20+%20'&serverId='%20+%20serverId;%20var%20n%20=%200;%20var%20total%20=%202;%20async%20function%20get(path,%20label)%20{%20await%20sleep(GAP);%20n%20+=%201;%20say('AION%202%20guide:%20reading%20'%20+%20label%20+%20'%20('%20+%20n%20+%20'%20of%20'%20+%20total%20+%20')...',%20'info');%20var%20r;%20try%20{%20r%20=%20await%20fetch(base%20+%20path,%20{credentials:%20'same-origin',%20headers:%20{Accept:%20'application/json'}});%20}%20catch%20(e)%20{%20throw%20new%20Error(label%20+%20':%20network%20error');%20}%20if%20(!r.ok)%20{%20throw%20new%20Error(label%20+%20':%20the%20site%20answered%20'%20+%20r.status);%20}%20var%20t%20=%20await%20r.text();%20try%20{%20return%20JSON.parse(t);%20}%20catch%20(e)%20{%20throw%20new%20Error(label%20+%20':%20the%20answer%20was%20not%20data%20(the%20site%20may%20have%20changed)');%20}%20}%20(async%20function%20()%20{%20try%20{%20var%20info%20=%20await%20get('info%3F'%20+%20q,%20'profile');%20if%20(!info%20||%20!info.profile)%20{%20throw%20new%20Error('profile:%20character%20not%20found');%20}%20var%20equipment%20=%20await%20get('equipment%3F'%20+%20q,%20'gear%20list');%20var%20list%20=%20((equipment%20&&%20equipment.equipment)%20||%20{}).equipmentList%20||%20[];%20var%20boards%20=%20((info.daevanion%20||%20{}).boardList%20||%20[]).filter(function%20(b)%20{%20return%20b%20&&%20b.open;%20});%20total%20=%202%20+%20list.length%20+%20boards.length;%20var%20items%20=%20{};%20for%20(var%20i%20=%200;%20i%20%3C%20list.length;%20i++)%20{%20var%20it%20=%20list[i];%20var%20lvl%20=%20(Number(it.enchantLevel)%20||%200)%20+%20(Number(it.exceedLevel)%20||%200);%20items[it.slotPos]%20=%20slim(await%20get('equipment/item%3Fid='%20+%20it.id%20+%20'&enchantLevel='%20+%20lvl%20+%20'&characterId='%20+%20cid%20+%20'&serverId='%20+%20serverId%20+%20'&slotPos='%20+%20it.slotPos%20+%20'&lang='%20+%20LANG%20+%20'&region='%20+%20encodeURIComponent(region),%20(it.slotPosName%20||%20('slot%20'%20+%20it.slotPos))));%20}%20var%20daevanion%20=%20{};%20for%20(var%20j%20=%200;%20j%20%3C%20boards.length;%20j++)%20{%20daevanion[boards[j].id]%20=%20slimBoard(await%20get('daevanion/detail%3F'%20+%20q%20+%20'&boardId='%20+%20boards[j].id,%20'Daevanion%20'%20+%20(boards[j].name%20||%20boards[j].id)));%20}%20var%20out%20=%20{v:%201,%20kind:%20'aion2-character',%20fetched:%20new%20Date().toISOString(),%20region:%20region,%20serverId:%20Number(serverId),%20characterId:%20rawId,%20lang:%20LANG,%20page:%20location.href,%20info:%20slim(info),%20equipment:%20slim(equipment),%20items:%20items,%20daevanion:%20daevanion};%20var%20text%20=%20JSON.stringify(out);%20var%20kb%20=%20Math.round(text.length%20/%201024);%20var%20ok%20=%20false;%20try%20{%20if%20(navigator.clipboard%20&&%20navigator.clipboard.writeText)%20{%20await%20navigator.clipboard.writeText(text);%20ok%20=%20true;%20}%20}%20catch%20(e)%20{%20ok%20=%20false;%20}%20if%20(!ok)%20{%20ok%20=%20copyFallback(text);%20}%20if%20(ok)%20{%20say('Copied%20-%20paste%20it%20into%20the%20guide%5C's%20My%20character%20tab.%20('%20+%20info.profile.characterName%20+%20',%20'%20+%20total%20+%20'%20pages%20read,%20'%20+%20kb%20+%20'%20KB)',%20'ok');%20}%20else%20{%20manual(text,%20kb);%20}%20}%20catch%20(e)%20{%20say('Stopped:%20'%20+%20(e%20&&%20e.message%20%3F%20e.message%20:%20e)%20+%20'.%20Nothing%20was%20copied.%20Wait%20a%20minute%20and%20try%20again;%20if%20it%20keeps%20failing,%20NCSoft%20may%20have%20changed%20their%20site%20-%20the%20guide%5C's%20manual%20checklists%20still%20work.',%20'err');%20}%20})();%20})();"/*BM-END*/;
const CHAR_IDS=/*IDS-START*/{"14010000":["Deadshot","8|Removes MP consumed","8|+30% Skill Speed","8|Changes to mobile skill","12|Ignores Block and Evasion and lands as Multi-Hit","16|[Deadshot] grants extra damage on hit"],"14020000":["Snipe","8|+20% MP restored","8|Absorbs 70, 70% HP","8|+50% Multi-Hit on hit","12|-1s [Deadshot] cooldown on hit","16|Adds [Tempest Arrow] Chain Skill"],"14050000":["Drill Dart","8|Absorbs 300, 300% HP","8|+2s Bleed duration","8|+20% Skill Speed","12|Multi-Hit on hit","16|Activates [Drill Dart] 1 extra time"],"14060000":["Griffon Arrow"],"14070000":["Suppressing Arrow","8|+50% Multi-Hit on hit","8|+1s Stun duration","8|+20% Skill Speed","12|+20% Stun Chance","16|25% chance to reset cooldown on hit"],"14080000":["Burst Arrow","8|Absorbs 1000, 1000% HP","8|+50% Multi-Hit on hit","8|Changes to mobile skill","12|Up to +20% damage when less targets hit","16|25% chance to reset cooldown on hit"],"14090000":["Marking Shot","8|+5% Perfect Chance for the duration","8|30% chance to inflict Knock Back on hit","8|+5s duration","12|+1 consecutive use","16|Ignores Block and Evasion and lands as a Critical Hit"],"14110000":["Gale Arrow","8|+5s duration","8|50% chance to inflict Knock Back on hit","8|Changes to mobile skill","12|Increases Combat Speed, PvE Damage Boost, and PvP Damage Boo","16|-10s cooldown"],"14120000":["Ambush Kick"],"14130000":["Snare Shot","8|+20% Move Speed reduction","8|+20% Skill Speed","8|Changes to mobile skill","12|Adds [Shackling Arrow] Chain Skill","16|+2s Slow and Root duration"],"14150000":["Illusory Arrow"],"14160000":["Sealing Arrow"],"14170000":["Explosion Trap","8|Pulls enemies on explosion","8|+1s Stun duration","8|Extra damage after 3s on hit","12|+20% Stun Chance","16|+1 consecutive use"],"14180000":["Ensnaring Trap"],"14190000":["Stealth"],"14220000":["Bow of Blessing"],"14260000":["Defiance","8|Adds [Lightning Arrow] Chain Skill","8|Restores 1,000 Stamina on using [Defiance]","8|Restores 20% HP on using [Defiance]","12|+2s Tenacity duration","16|+50% PvE Damage Tolerance and +25% PvP Damage Tolerance for "],"14270000":["Arrow Storm"],"14310000":["Vaizel's Authority"],"14330000":["Arrow Scattershot","8|Absorbs 500, 500% HP","8|Restores 120 MP on hit","8|Changes to mobile skill","12|Multi-Hit on hit","16|-1s all cooldowns on hit"],"14340000":["Tempest Shot","8|-20% MP consumed","8|+10% skill Critical Hit","8|Deals up to 12% more damage when less targets are hit","12|5% chance to inflict Knock Back on Critical Hit","16|+20% Skill Speed"],"14350000":["Mother Nature's Breath"],"14360000":["Explosive Arrow"],"14380000":["Supporting Fire"],"14700000":["Assault Smite"],"14710000":["Vigilant Eye"],"14720000":["Concentrated Fire"],"14730000":["Wind Vigor"],"14740000":["Focused Eye"],"14750000":["Hunter's Resolve"],"14760000":["Unyielding Resolve"],"14770000":["Rooting Eye"],"14780000":["Melee Fire"],"14790000":["Revitalization Contract"],"14800000":["Hunter's Soul"],"11000000":["Equip Gladiator Weapon"],"11010000":["Rending Blow","8|-20% MP consumed","8|+200 Block while using skill","8|Changes to mobile skill","12|Deals up to 12% more damage when less targets are hit","16|Restores 50 MP on landing a Critical Hit"],"11020000":["Keen Strike","8|+20% MP restored","8|Absorbs 100, 100% HP","8|+50% Multi-Hit on hit","12|-1s [Ruinous Blow] cooldown on hit","16|Adds [Reckless Strike] Chain Skill"],"11050000":["Crushing Wave","8|Absorbs 200, 200% HP","8|Restores 50 MP on landing a Critical Hit","8|Up to +20% damage when more targets hit","12|Resets cooldown on landing a Critical Hit","16|50% chance to pull"],"11080000":["Blade Toss"],"11100000":["Ruinous Blow","8|+20% Skill Speed","8|+12.5m Range","8|+30% Skill Critical Hit","12|Extra damage on hit","16|Ignores Block and Evasion and lands as Multi-Hit"],"11110000":["Focused Block"],"11130000":["Armor of Balance"],"11170000":["Overhead Slam","8|Absorbs 70, 70% HP","8|Changes to AoE Skill","8|Adds [Upward Strike] Chain Skill","12|Critical Hit on hit","16|Remove cooldown"],"11190000":["Leaping Slam","8|Prepare for Battle effect on the caster for 3s","8|50% chance to trigger [Ankle Slice] on hit","8|Resets cooldown on defeating an enemy","12|+20% PvE Damage Tolerance and +10 PvP Damage Tolerance for 3","16|Changes to AoE skill and pulls in enemies"],"11200000":["Ankle Slice","8|30% chance to inflict Knockdown for 3s on landing [Ankle Sli","8|Adds [Ankle Smash] Chain Skill","8|+16m [Ankle Slice] range","12|Ignores Block and Evasion and lands as Multi-Hit","16|25% chance to reset [Ankle Slice] cooldown on Block"],"11240000":["Wrath Wave"],"11250000":["Zikel's Blessing"],"11260000":["Defiance","8|Adds [Wrath Burst] Chain Skill","8|Restores 1,000 Stamina on using [Defiance]","8|Restores 20% HP on using [Defiance]","12|+2s Tenacity duration","16|+50% PvE Damage Tolerance and +25% PvP Damage Tolerance for "],"11280000":["Sword Aura Rampage","8|Absorbs 500, 500% HP","8|Restores 120 MP","8|Changes to mobile skill","12|Multi-Hit on hit","16|-1s all skill cooldowns on hit"],"11290000":["Mocking Blade","8|Absorbs 400, 400% HP, absorbs 1500, 1500% HP of target with ","8|Changes to AoE damage on down strike","8|Adds 2 additional strikes","12|+1s Knockdown duration","16|Ignores Block and Evasion and lands as Multi-Hit"],"11300000":["Aerial Snare","8|Multi-Hit on hit","8|+25% [Aerial Snare] Airborne Chance","8|+100% damage to targets with Incapacitated Immunity","12|Adds [Forced Fall] Chain Skill","16|-50% [Aerial Snare] cooldown"],"11340000":["Lifestealing Blade"],"11360000":["Rush Strike","8|Restores 300 Stamina on hit","8|+10m range","8|Changes to Charge Skill and deals AoE damage","12|-10s cooldown","16|+25% Knockdown Chance"],"11380000":["Tenaciousness"],"11390000":["Rage Burst"],"11400000":["Lunge Stance"],"11410000":["Wave Armor"],"11430000":["Forced Restraint"],"11450000":["Fracturing Rush"],"11700000":["Assault Strike"],"11710000":["Survival Stance"],"11720000":["Protection Armor"],"11730000":["Blood Absorption"],"11740000":["Identify Weakness"],"11750000":["Attack Preparation"],"11760000":["Impact Hit"],"11770000":["Destructive Impulse"],"11780000":["Experienced Counterstrike"],"11790000":["Survival Willpower"],"11800000":["Murderous Burst"],"12010000":["Vicious Strike","8|+20% MP restored","8|Absorbs 100, 100% HP","8|+50% Multi-Hit on hit","12|-2s [Warding Strike] cooldown on hit","16|Adds [Threatening Blow] Chain Skill"],"12040000":["Pummel","8|-20% MP consumed","8|[Punishing Strike] absorbs 300, 300% HP","8|Deals up to 12% more damage when less targets are hit","12|-1s [Punishment] cooldown on hit","16|[Punishing Strike] grants extra damage on hit"],"12070000":["Doom Shield"],"12090000":["Punishment","8|Absorbs 1000, 1000% HP","8|Inflicts Damage over Time to target on hit","8|+30% Skill Speed","12|Changes to mobile skill","16|Ignores Block and Evasion and lands as a Critical Hit"],"12100000":["Shield Smite","8|+1s Stun duration","8|Removes MP Cost and restores 200 MP on hit","8|50% chance to trigger [Debilitating Smash] on hit","12|-2s cooldown","16|AoE Stun"],"12110000":["Shield of Protection"],"12120000":["Taunt"],"12130000":["Poach","8|Moves to the target if target has Incapacitated Immunity","8|-20% Status Effect Resist for 5s on hit","8|Resets cooldown on defeating an enemy","12|10% Max HP Protective Shield","16|50% chance to Stun for 3s"],"12190000":["Second Skin"],"12200000":["Armor of Balance"],"12220000":["Grapple"],"12230000":["Noble Armor"],"12240000":["Judgment","8|Absorbs 100, 100% HP","8|Deals extra damage on attacking a target afflicted with Impa","8|Extra damage on hit","12|Critical Hit on hit","16|Remove cooldown"],"12250000":["Comrade in Arms"],"12260000":["Defiance","8|Adds [Capture] Chain Skill","8|Restores 1,000 Stamina on using [Defiance]","8|Restores 20% HP on using [Defiance]","12|+2s Tenacity duration","16|+50% PvE Damage Tolerance and +25% PvP Damage Tolerance for "],"12270000":["Debilitating Smash","8|30% chance to inflict Stun for 3s","8|+3s Debilitate duration","8|-60% Incoming Heal during Debilitate","12|Ignores Block and Evasion and lands as Multi-Hit","16|25% chance to reset cooldown on Block"],"12300000":["Annihilate","8|+50% Multi-Hit on hit","8|+20% Knockdown Chance","8|+100% damage to targets with Incapacitated Immunity","12|-10s cooldown","16|Changes to AoE Skill"],"12310000":["Empyrean Lord's Punishment"],"12320000":["Nezekan's Shield"],"12340000":["Flash Rampage","8|Absorbs 500, 500% HP","8|Restores 120 MP on hit","8|Changes to mobile skill","12|Multi-Hit on hit","16|-1s to all skill cooldowns on hit"],"12350000":["Warding Strike","8|-5s cooldown","8|+100 Block during Warding","8|Heal over Time during Warding","12|Adds PvE Damage Tolerance and PvP Damage Tolerance increase ","16|+10% PvE Damage Tolerance and +5% PvP Damage Tolerance to pa"],"12410000":["Executing Blade"],"12430000":["Shield Rush","8|Restores 300 Stamina on hit","8|+10m range","8|Changes to Charge Skill and deals AoE damage","12|-10s cooldown","16|+25% Stun Chance"],"12450000":["Battlefield Banner"],"12700000":["Assault Fury"],"12710000":["Enhance Health"],"12720000":["Warding Shield"],"12730000":["Punishing Benediction"],"12740000":["Ironclad Defense"],"12750000":["Guarding Seal"],"12760000":["Impact Hit"],"12770000":["Insulting Roar"],"12780000":["Fury"],"12790000":["Survival Willpower"],"12800000":["Block Pain"],"13010000":["Quick Slice","8|+20% MP restored","8|Absorbs 70, 70% HP","8|+50% Multi-Hit on hit","12|-1s [Insignia Explosion] cooldown on hit","16|Ignores Block and Evasion and lands as a Critical Hit"],"13020000":["Throw Shadowblade"],"13050000":["Flash Slice","8|+2s Blind duration","8|+6m Range","8|Up to +20% damage when more targets hit","12|+1 consecutive use","16|50% chance to rotate and inflict Stun for 3s on hitting a ta"],"13060000":["Ambush","8|Engraves 2 Insignias for 10s on landing as a Back attack","8|Absorbs 300, 300% HP","8|Breaks Protective Shields on hit","12|50% chance to trigger [Whirlwind Slice] on hit","16|+2 consecutive uses"],"13070000":["Shadowstrike","8|+1s Stun duration","8|+20% caster Critical Damage Boost for 10s on hit","8|50% chance to inflict Seal for 5s on hit","12|50% chance to inflict Root for 5s on hit","16|Changes to AoE Skill"],"13080000":["Evasion Stance"],"13100000":["Savage Roar","8|-20% MP consumed","8|+20% Skill Speed","8|Deals up to 12% more damage when less targets are hit","12|-1s [Shadowstrike] cooldown on hit","16|Pulls nearby targets on using [Savage Smash]"],"13130000":["Insignia Explosion","8|Adds rotate effect","8|+50% Multi-Hit on hit","8|Keep 2 stacks of Insignias after [Insignia Explosion]","12|+1s Stun duration","16|-3s cooldown"],"13140000":["Shadowstep"],"13180000":["Shadow Walk"],"13210000":["Whirlwind Slice","8|+50% Multi-Hit on hit","8|Changes to AoE damage","8|+16m range","12|+20% Stun Chance","16|25% chance to reset [Whirlwind Slice] cooldown on Evasion"],"13220000":["Shadow Fall","8|Absorbs 1000, 1000% HP","8|Engraves 3 Insignias for 10s on hit","8|-5s cooldown","12|+1s Knockdown duration","16|Can be used on targets afflicted with Blind"],"13230000":["Aerial Bind"],"13250000":["Smoke Bomb"],"13260000":["Defiance","8|Adds [Storm Slice] Chain Skill","8|Restores 1,000 Stamina on using [Defiance]","8|Restores 20% HP on using [Defiance]","12|+2s Tenacity duration","16|+50% PvE Damage Tolerance and +25% PvP Damage Tolerance for "],"13270000":["Savage Fang"],"13280000":["Spiral Slice"],"13300000":["Triniel's Dagger"],"13310000":["Illusive Clone"],"13340000":["Storm Rampage","8|Absorbs 500, 500% HP","8|Restores 120 MP on hit","8|Changes to mobile skill","12|Multi-Hit on hit","16|-1s all skill cooldowns on hit"],"13350000":["Heart Gore","8|Absorbs 70, 70% HP","8|Engraves 1 Insignia for 10s on hit","8|Up to +20% Critical Hit when less targets hit","12|Multi-Hit on hit","16|Resets [Heart Gore] cooldown on landing a Critical Hit"],"13360000":["Infiltrate","8|Restores 300 Stamina on landing [Infiltrate]","8|+10m [Infiltrate] range","8|Breaks Protective Shields on landing [Infiltrate]","12|Adds [Dark Strike] Chain Skill","16|+20% [Infiltrate] Blind Chance"],"13370000":["Evasion Contract"],"13390000":["Swift Contract"],"13700000":["Assault Ambush"],"13710000":["Heightened Sixth Sense"],"13720000":["Exploit Weakness"],"13730000":["Apply Poison"],"13740000":["Rear Smite"],"13750000":["Assault Stance"],"13760000":["Impact Hit"],"13770000":["Ambush Stance"],"13780000":["Defense Break"],"13790000":["Revitalization Contract"],"13800000":["Determination"],"15000000":["Equip Sorcerer Weapon"],"15010000":["Flame Scattershot","8|Absorbs 500, 500% HP","8|Restores 120 MP","8|Changes to mobile skill","12|Multi-Hit on hit","16|-1s all skill cooldowns on hit"],"15040000":["Firestorm","8|-50% MP Cost","8|+20% Skill Speed","8|-60% Incoming Heal for 5s on hit","12|-2s [Hellfire] cooldown per fireball","16|+15% damage per fireball, up to +75%"],"15050000":["Blaze","8|Absorbs 300, 300% HP","8|+50% MP restored","8|Delayed Damage after 3s","12|Multi-Hit on hit","16|-3s [Wish of Concentration] cooldown on hit"],"15060000":["Hellfire","8|+30% Skill Speed","8|Fire Damage over Time for 10s on hit","8|Changes to mobile skill","12|Ignores Block and Evasion and lands as Multi-Hit","16|-15s cooldown"],"15090000":["Ice Chain","8|-20% MP Cost","8|+20% Skill Speed","8|Deals up to 12% more damage when less targets are hit","12|-1s [Winter's Shackles] cooldown on hit","16|5% chance to inflict Frost for 2s on landing [Cold Wave]"],"15110000":["Winter's Shackles","8|Changes to mobile skill","8|30% chance to inflict Frost for 3s on landing [Winter's Shac","8|+20% PvE Damage Boost and +10% PvP Damage Boost for 5s on la","12|Adds [Winter's Illusion] Chain Skill","16|-15s [Winter's Shackles] cooldown"],"15120000":["Glacial Smite"],"15130000":["Soul Freeze"],"15140000":["Curse: Tree"],"15150000":["Frost","8|Restores 200 MP","8|-5s cooldown","8|Reset [Frost Burst] cooldown on landing Frost","12|+25% PC target Frost Chance","16|+1s Frost duration"],"15160000":["Steel Barrier"],"15200000":["Cold Storm"],"15210000":["Flame Arrow","8|+20% MP restored","8|Absorbs 100, 100% HP","8|+50% Multi-Hit on hit","12|+5% Fire Damage Boost for 10s on activating [Pyroclasm]","16|Reset [Blaze] cooldown on landing [Pyroclasm]"],"15220000":["Frost Burst","8|Absorbs 700, 700% HP","8|Changes to mobile skill","8|75% chance to Knock Back 2m","12|Ignores Block and Evasion and lands as a Critical Hit","16|50% chance to reset cooldown"],"15230000":["Arctic Armor"],"15240000":["Defiance","8|Adds [Curse: Old Tree] Chain Skill","8|Restores 1,000 Stamina on using [Defiance]","8|Restores 20% HP on using [Defiance]","12|+2s Tenacity duration","16|+50% PvE Damage Tolerance and +25% PvP Damage Tolerance for "],"15280000":["Bittercold Wind","8|+1s [Bittercold Wind] summon duration","8|Changes to mobile skill","8|Pull effect","12|Ignores Block and Evasion and lands as a Critical Hit","16|-1s [Frost] cooldown on hit"],"15300000":["Lumiel's Space"],"15310000":["Wish of Concentration","8|Reduces MP Cost by 10%","8|+10% additional Attack","8|+500 Max MP","12|+10% Combat Speed","16|-10s all skill cooldowns"],"15320000":["Delayed Explosion"],"15360000":["Divine Burst"],"15390000":["Fire Wall"],"15400000":["Element Enhancement"],"15410000":["Hibernation"],"15700000":["Assault Bombardment"],"15710000":["Fire Mark"],"15720000":["Robe of Earth"],"15730000":["Cold Snap"],"15740000":["Robe of Flame"],"15750000":["Robe of Cold"],"15760000":["Absorb Essence"],"15770000":["Grace of Resistance"],"15780000":["Grace of Enhancement"],"15790000":["Revitalization Contract"],"15800000":["Vitality Evaporation"],"16000000":["Spiritmaster Weapon Equip"],"16010000":["Cold Shock","8|+20% MP restored","8|Absorbs 100, 100% HP","8|+50% Multi-Hit on hit","12|+2% Attack on landing [Earth Tremor] (Up to 5 stacks)","16|10% chance to remove 1 buff on landing [Earth Tremor]"],"16040000":["Combustion","8|-20% MP consumed","8|Deals up to 12% more damage when less targets are hit","8|+100 Skill Accuracy","12|+20% Skill Speed","16|Adds [Ashy Call] Chain Skill"],"16060000":["Siphon"],"16070000":["Soul's Cry","8|+50% Multi-Hit on hit","8|Inflicts Root for 5s","8|Changes to mobile skill","12|-10s cooldown","16|+2s Fear duration"],"16080000":["Cry of Terror"],"16100000":["Summon: Fire Spirit","8|-50% MP Cost","8|+20% Fire Spirit Critical Hit damage","8|10% chance to activate skill when Fire Spirit lands attack","12|5% chance to inflict Knockdown for 3s on landing Fire Spirit","16|+20% Fire Spirit Stats"],"16110000":["Summon: Water Spirit","8|-50% MP Cost","8|+10% Water Spirit Attack","8|10% chance to activate skill when Water Spirit lands attack","12|5% chance to inflict Root for 2s on landing Water Spirit att","16|+20% Water Spirit Stats"],"16120000":["Summon: Wind Spirit","8|-50% MP Cost","8|+20% Wind Spirit Critical Hit","8|10% chance to activate skill when Wind Spirit lands attack","12|5% chance to reduce enemy Attack Speed by 30% for 10s on lan","16|+20% Wind Spirit Stats"],"16130000":["Summon: Earth Spirit","8|-50% MP Cost","8|+20% PvE Damage Tolerance and +10 PvP Damage Tolerance to Ea","8|10% chance to activate skill when Earth Spirit lands attack","12|5% chance to restore 5% of Spirit HP when landing Earth Spir","16|+20% Earth Spirit Stats"],"16140000":["Jointstrike: Curse","8|+2s Curse duration","8|+50% Multi-Hit on hit","8|Changes to mobile skill","12|-2s cooldown","16|[Jointstrike: Curse] ignores Block and Evasion and lands as "],"16150000":["Jointstrike: Corrode"],"16170000":["Command: Proxy"],"16190000":["Enhance: Spirit's Benediction"],"16200000":["Defiance","8|Adds [Curse of Despair] Chain Skill","8|Restores 1,000 Stamina on using [Defiance]","8|Restores 20% HP on using [Defiance]","12|+2s Tenacity duration","16|+50% PvE Damage Tolerance and +25% PvP Damage Tolerance for "],"16220000":["Cursed Cloud"],"16230000":["Seize Magic"],"16240000":["Jointstrike: Destructive Attack"],"16250000":["Summon: Ancient Spirit"],"16260000":["Magic Block"],"16290000":["Dismiss: Fire Spirit"],"16300000":["Elemental Fusion","8|Changes to AoE Skill","8|Extra damage after 3s on hit","8|+10 all Element Boost on hit","12|Changes to Charge Skill, dealing up to 200% more damage","16|25% chance to regain Four Elements"],"16330000":["Dimensional Control","8|+20% Slow effect","8|Extra damage after 3s on hit","8|+50% Multi-Hit chance on hit","12|Pull in nearby targets","16|30% chance to inflict Root for 3s on hit"],"16340000":["Rapid Scattershot","8|Absorbs 500, 500% HP","8|Restores 120 MP","8|Changes to mobile skill","12|Multi-Hit on hit","16|-1s all skill cooldowns on hit"],"16360000":["Kaisinel's Power"],"16370000":["Flame Blessing"],"16700000":["Assault Terror"],"16710000":["Spirit Strike"],"16720000":["Spirit Protection"],"16730000":["Spirit's Descent"],"16740000":["Corrode"],"16750000":["Spirit Revitalization"],"16760000":["Mental Focus"],"16770000":["Spirit Communion"],"16780000":["Element Unification"],"16790000":["Revitalization Contract"],"16800000":["Consecutive Countercurrent"],"17010000":["Earth's Retribution","8|+20% MP restored","8|+20% [Discharge] Chain Skill trigger chance","8|+50% Multi-Hit on hit","12|-7s [Bolt] cooldown on landing [Discharge]","16|Ignores Block and Evasion"],"17040000":["Judgment Thunder","8|-20% MP consumed","8|Deals up to 12% more damage when less targets are hit","8|-10% enemy Combat Speed for 5s on landing [Divine Punishment","12|10% chance to inflict Root for 2s on landing [Divine Punishm","16|Activates [Divine Punishment] 1 extra time"],"17060000":["Bolt","8|30% chance to inflict Stun for 3s when fully charged","8|+300 Skill Accuracy","8|+30% Skill Speed","12|Up to +20% damage when less targets hit","16|Critical Hit on hit"],"17070000":["Chain of Torment","8|Slows target for 5s","8|+3s Damage over Time","8|Has a 20% chance to inflict Knockdown on the target for 3s","12|+10% PvE Damage Tolerance reduction and +5% PvP Damage Toler","16|Ignores Block and Evasion and reduces Damage over Time inter"],"17080000":["Debilitating Mark","8|Removes MP Consumed and restores 150 MP","8|-15% target Defense for duration of Damage over Time","8|Has a 20% chance to inflict Stun on the target for 3s","12|+10% PvE Damage Boost reduction and +5% PvP Damage Boost red","16|Ignores Block and Evasion and reduces Damage over Time inter"],"17090000":["Light of Regeneration","8|+5% Defense while healing","8|+20% amount healed when HP is 50% or less","8|+5% Incoming Heal during healing","12|+5% Move Speed during healing","16|+5% PvE Damage Tolerance and +2.5% PvP Damage Tolerance duri"],"17100000":["Healing Light","8|+2 consecutive uses","8|+20% amount healed when HP is 50% or less","8|50% chance to remove 1 debuff","12|+2% HP restored","16|-2s cooldown"],"17120000":["Radiant Recovery","8|Removes up to 2 debuffs","8|+1 consecutive use","8|-3s cooldown","12|+10% Incoming Heal for 10s","16|+5% HP restored"],"17150000":["Divine Aura","8|-40% Move Speed for 3s to up to 4 enemies within 4m of the A","8|Changes to AoE Skill","8|+50% [Divine Aura] attacking speed","12|+3s [Divine Aura] duration","16|-10s cooldown"],"17160000":["Benevolence"],"17190000":["Root"],"17240000":["Defiance","8|Adds [Blessing of Regeneration] Chain Skill","8|Restores 1,000 Stamina on using [Defiance]","8|Restores 10% HP on using [Defiance]","12|+2s Tenacity duration","16|+50% PvE Damage Tolerance and +25% PvP Damage Tolerance for "],"17270000":["Salvation"],"17280000":["Power Burst"],"17290000":["Absolution"],"17300000":["Voice of Doom"],"17350000":["Condemnation","8|Restores 100 MP on hit","8|Up to +12% damage when less targets hit","8|20% chance to inflict Root for 3s","12|Resets cooldown on landing a Critical Hit with [Condemnation","16|Multi-Hit on hit"],"17370000":["Lightning Strike Scattershot","8|Absorbs 500, 500% HP","8|Restores 120 MP","8|Changes to mobile skill","12|Multi-Hit on hit","16|-1s all skill cooldowns on hit"],"17390000":["Summon Resurrection"],"17400000":["Earth Punishment"],"17410000":["Light of Protection"],"17420000":["Yustiel's Power"],"17430000":["Prayer of Amplification"],"17440000":["Noble Aura"],"17700000":["Assault Mark"],"17710000":["Warm Benediction"],"17720000":["Empyrean Lords' Benediction"],"17730000":["Empyrean Lord's Grace"],"17740000":["Healing Enhancement"],"17750000":["Immortal Veil"],"17760000":["Heal Block"],"17770000":["Prayer of Concentration"],"17780000":["Earth's Grace"],"17790000":["Survival Willpower"],"17800000":["Radiant Benediction"],"18010000":["Onslaught","8|+20% MP restored","8|Absorbs 70, 70% HP","8|+50% Multi-Hit on hit","12|-1s [Spinning Strike] cooldown on hit","16|Adds [Storm Chain] Chain Skill"],"18040000":["Incandescent Blow","8|-20% MP consumed","8|+200 Block while using skill","8|Deals up to 12% more damage when less targets are hit","12|-200 enemy Accuracy for 3s on landing Bursting Blow","16|Ignores Block and Evasion and lands as Multi-Hit"],"18060000":["Impactful Crush","8|Changes to AoE damage","8|+1s [Impactful Crush] Stun duration","8|Changes to mobile skill","12|+30% Skill Speed","16|+20% [Impactful Crush] Stun Chance"],"18080000":["Wave Blow","8|Multi-Hit on hit","8|+6m Range","8|+1s Knockdown duration","12|-15% target's PvE Damage Boost and -7.5% PvP Damage Boost fo","16|-5s cooldown"],"18090000":["Rushing Smash","8|-20% target's Impact-type Resist for 5s","8|Changes to Charge Skill, dealing up to 200% more damage","8|50% chance to trigger [Heat Wave Blow] on hit","12|Resets cooldown on defeating an enemy","16|Ignores Block and Evasion and lands as Multi-Hit"],"18100000":["Dark Crush","8|Absorbs 70, 70% HP","8|Deals extra damage on attacking a target afflicted with Impa","8|Critical Hit on hit","12|Adds [Piercing Strike] Chain Skill","16|Removes [Dark Crush] cooldown"],"18120000":["Recuperation","8|+1 consecutive use and Heal over Time can stack up to 2 time","8|Removes up to 2, 2 debuffs","8|+4s healing duration","12|+5% HP restored","16|-3s cooldown"],"18130000":["Fracturing Blow"],"18140000":["Focused Defense"],"18150000":["Heat Wave Blow","8|40% chance to inflict Stun for 3s","8|+20% Seal Chance","8|Up to +20% damage when more targets hit","12|Ignores Block and Evasion and lands as Multi-Hit","16|25% chance to reset [Heat Wave Blow] cooldown on Block"],"18160000":["Sprint Mantra"],"18170000":["Healing Touch"],"18190000":["Undefeated Mantra"],"18200000":["Defiance","8|Adds [Crushing Strike] Chain Skill","8|Restores 1,000 Stamina on using [Defiance]","8|Restores 10% HP on using [Defiance]","12|+2s Tenacity duration","16|+50% PvE Damage Tolerance and +25% PvP Damage Tolerance for "],"18210000":["Tremor Crush","8|Restores 300 Stamina on hit","8|+10m [Tremor Crush] range","8|+50% Multi-Hit on hit","12|Adds [Surging Strike] Chain Skill","16|+25% [Tremor Crush] Stun Chance"],"18220000":["Obliterate"],"18230000":["Ensnaring Mark"],"18240000":["Impeding Authority"],"18250000":["Power of the Storm"],"18290000":["Spinning Strike","8|-5s cooldown","8|+10% Heal Boost (up to 20%)","8|Up to +20% damage when less targets hit","12|40% chance to inflict Seal for 3s","16|Ignores Block and Evasion and lands as a Critical Hit"],"18300000":["Gust Rampage","8|Absorbs 500, 500% HP","8|Restores 120 MP","8|Changes to mobile skill","12|Multi-Hit on hit","16|-1s all skill cooldowns on hit"],"18330000":["Marchutan's Wrath"],"18420000":["Guardian Blessing"],"18440000":["Barrier Spell"],"18700000":["Assault Shock"],"18710000":["Blessing of Life"],"18720000":["Crossguard"],"18730000":["Protection Circle"],"18740000":["Inspiring Spell"],"18750000":["Attack Preparation"],"18760000":["Impact Hit"],"18770000":["Raging Spell"],"18780000":["Earth's Promise"],"18790000":["Survival Willpower"],"18800000":["Wind's Promise"]}/*IDS-END*/;
// AionFlex statId -> [name, divide by]; matched against the same character's official soul-binding lines
// (sim/research/raw/aionflex) plus the charlookup research notes. Unknown ids show as "stat #id".
const CH_AFSTAT={1:['Might',1],5:['Precision',1],19:['Attack Bonus',1],28:['Damage Boost',100],32:['Weapon Damage Boost',100],50:['Boss Attack',1],56:['PvE Attack',1],70:['Damage Tolerance',100],104:['Accuracy Bonus',1],128:['Critical Hit',1],146:['Multi-hit Chance',100],193:['HP',1],199:['MP',1],205:['Move Speed',100],282:['Combat Speed',100],317:['Attack',1],318:['Accuracy',1],394:['Cogni Defense',1],425:['Attack Increase',100],443:['Double Chance',100]};
const CH_SLOTKEY={MainHand:'weapon',SubHand:'guard',Helmet:'helmet',Shoulder:'shoulders',Torso:'chest',Pants:'legs',Gloves:'gloves',Boots:'boots',Cape:'cloak',Necklace:'necklace',Earring1:'ear1',Earring2:'ear2',Ring1:'ring1',Ring2:'ring2',Bracelet1:'bracelet',Bracelet2:'bracelet',Belt:'belt',Amulet:'amulet'};
const CH_SLOTNAME={MainHand:'Weapon',SubHand:'Guard / off-hand',Helmet:'Helmet',Shoulder:'Shoulders',Torso:'Chest',Pants:'Legs',Gloves:'Gloves',Boots:'Boots',Cape:'Cloak',Necklace:'Necklace',Earring1:'Earring 1',Earring2:'Earring 2',Ring1:'Ring 1',Ring2:'Ring 2',Bracelet1:'Bracelet 1',Bracelet2:'Bracelet 2',Belt:'Belt',Amulet:'Amulet',Rune1:'Rune 1',Rune2:'Rune 2'};
const CH_ORDER=['MainHand','SubHand','Helmet','Shoulder','Torso','Pants','Gloves','Boots','Cape','Necklace','Earring1','Earring2','Ring1','Ring2','Bracelet1','Bracelet2','Belt','Amulet','Rune1','Rune2'];
const CH_ARCSLOT={Arcana1:'Chalice',Arcana2:'Parchment',Arcana3:'Compass',Arcana4:'Bell',Arcana5:'Mirror'};
const CH_AFSLOT={OffHand:'SubHand',Grail:'Arcana1',Parchment:'Arcana2',Compass:'Arcana3',Bell:'Arcana4',Mirror:'Arcana5'};
const CH_POS={MainHand:1,SubHand:2,Helmet:3,Shoulder:4,Torso:5,Pants:6,Gloves:7,Boots:8,Necklace:10,Earring1:11,Earring2:12,Ring1:13,Ring2:14,Bracelet1:15,Bracelet2:16,Belt:17,Cape:19,Amulet:22,Rune1:23,Rune2:24,Arcana1:41,Arcana2:42,Arcana3:43,Arcana4:44,Arcana5:45};
const CH_GRADEW={Legend:'Epic',Epic:'Heroic'};
const CH_GENUSG=['','Common','Rare','Epic','Unique','Heroic'];
const CH_COLG={white:'Common',green:'Rare',blue:'Epic',yellow:'Unique',orange:'Heroic'};
const CH_GRANK={Common:1,Rare:2,Epic:3,Unique:4,Heroic:5,Special:4};
const CH_SKCOST={2:1,3:1,4:1,5:2,6:2,7:2,8:4,9:4,10:4};
const CH_COST={free:1,cheap:2,shards:3,crystals:3,kinah:5,grind:8};
const CH_COSTW={free:'Free',cheap:'Cheap',shards:'Stigma Shards',crystals:'Daevanion crystals',kinah:'Kinah + materials',grind:'Farming'};
const CH_DMGSTONE=/^(pvp )?(weapon |critical |back attack |front attack )?damage boost$/;
let chNotice='';

/* ---------- small helpers ---------- */
function chH(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function chNum(v){const n=parseFloat(String(v==null?'':v).replace(/[+,%\s]/g,''));return isFinite(n)?n:0}
function chFmt(n){return (Number(n)||0).toLocaleString('en-US')}
function chGrade(g){return CH_GRADEW[g]||g||''}
function chGcol(g){const G=(typeof GRADES!=='undefined'&&GRADES&&GRADES.grades)||{};return G[chGrade(g)]||''}
function chGname(g){const c=chGcol(g);return c?`<b style="color:${c}">${chH(chGrade(g))}</b>`:chH(chGrade(g))}
function chMode(){return (typeof MODE!=='undefined'&&MODE==='pvp')?'pvp':'pve'}
function chRegion(sid){return ['','nae','naw','eu','la','as'][Math.floor(Number(sid)/100)%10]||''}
function chRegionName(r){return {nae:'North America East',naw:'North America West',eu:'Europe',la:'Latin America',as:'Asia',Global:'Global'}[r]||r||''}
function chSlugOf(cls){const k=String(cls||'').toLowerCase().replace(/[^a-z]/g,'');const s={elementalist:'spiritmaster',fighter:'brawler'}[k]||k;return ALL[s]?s:null}
function chWhen(iso){const d=new Date(iso);if(!iso||isNaN(d))return 'unknown time';const mins=Math.round((Date.now()-d)/60000);let ago=mins<2?'just now':mins<90?mins+' minutes ago':mins<48*60?Math.round(mins/60)+' hours ago':Math.round(mins/1440)+' days ago';let abs;try{abs=d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}catch(e){abs=d.toISOString().slice(0,16).replace('T',' ')}return `${abs} (${ago})`}
function chTag(st,txt){if(st==='na'&&!txt)return '';const cls={best:'t-best',good:'t-good',ok:'t-ok',bad:'t-bad',na:''}[st]||'';return `<span class="tag ${cls}">${chH(txt||{best:'best',good:'good',ok:'ok',bad:'reroll',na:'—'}[st]||st)}</span>`}
function chB64(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);
  if(typeof TextDecoder==='function'){const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder('utf-8').decode(u)}
  let p='';for(let i=0;i<bin.length;i++)p+='%'+bin.charCodeAt(i).toString(16).padStart(2,'0');return decodeURIComponent(p)}
function chPathCost(nodeAt,own,target){
  // cheapest way from the nodes you own to a target node (node costs, 4 neighbours, like the guide's router)
  if(own.has(target))return {cost:0,n:0};
  const dist=new Map(),cnt=new Map(),pq=[];
  own.forEach(k=>{if(nodeAt[k]){dist.set(k,0);cnt.set(k,0);pq.push([0,k])}});
  if(!pq.length)for(const k in nodeAt)if(nodeAt[k][5]==='Start'){dist.set(k,0);cnt.set(k,0);pq.push([0,k])}
  while(pq.length){
    pq.sort((a,b)=>a[0]-b[0]);const [d,k]=pq.shift();
    if(d>dist.get(k))continue;
    if(k===target)return {cost:d,n:cnt.get(k)};
    const [r,c]=k.split(',').map(Number);
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{const nk=(r+dr)+','+(c+dc),n=nodeAt[nk];if(!n)return;const nd=d+(Number(n[3])||0);if(nd<(dist.has(nk)?dist.get(nk):1e9)){dist.set(nk,nd);cnt.set(nk,cnt.get(k)+1);pq.push([nd,nk])}});
  }
  return null;
}
function chNorm(s){return String(s||'').toLowerCase().replace(/\s*\([^)]*\)/g,'').replace(/\bbonus\b/g,'').replace(/[^a-z0-9+'\[\]\/ ]+/g,' ').replace(/\s*\/\s*/g,' / ').replace(/\s+/g,' ').trim()}
function chSkillName(id){const r=CHAR_IDS[String(id)];return r?r[0]:'skill #'+id}

/* ---------- reading what the player pasted ---------- */
const CH_DROP={icon:1,profileImage:1,costumes:1,sources:1,favorite:1,storable:1,tradable:1,tradablePersonal:1,decomposable:1,skinList:1,wingSkin:1,children:1};
function chSlim(o){if(Array.isArray(o))return o.map(chSlim);if(o&&typeof o==='object'){const r={};for(const k in o){if(!CH_DROP[k])r[k]=chSlim(o[k])}return r}return o}
function chSlimBoard(b){
  if(!b||!Array.isArray(b.nodeList))return b;
  if(b.nodeCount!=null)return b;
  return {nodeList:b.nodeList.filter(n=>n&&n.open===1).map(n=>({row:n.row,col:n.col,type:n.type,grade:n.grade,name:n.name,effectList:n.effectList})),nodeCount:b.nodeList.filter(n=>n&&n.type&&n.type!=='None').length,openStatEffectList:b.openStatEffectList||[],openSkillEffectList:b.openSkillEffectList||[]};
}
function chParse(text){
  const t=String(text||'').trim();
  if(!t) throw new Error('The box is empty. Paste what the bookmark copied (Ctrl+V or Cmd+V), then press Load.');
  if(t[0]!=='{'){
    const af=t.match(/af1\.([A-Za-z0-9_\-]+={0,2})/);
    if(af){let o;try{o=JSON.parse(chB64(af[1]))}catch(e){throw new Error("That looks like an AionFlex build code but it didn't decode. Copy it again on AionFlex (the whole code, starting with af1.).")}
      if(!o||o.format!=='aionflex-build') throw new Error("That af1 code isn't an AionFlex character build.");
      return {kind:'af1',data:o}}
    const u=t.match(/aion2\.plaync\.com\/[a-z-]+\/characters\/(\d{4})\/([^\/?#\s]+)/i);
    if(u){let cid=u[2];try{cid=decodeURIComponent(cid)}catch(e){}const rg=(t.match(/[?&]region=([a-z]+)/i)||[])[1]||chRegion(u[1]);return {kind:'url',serverId:Number(u[1]),characterId:cid,region:rg}}
    throw new Error("That isn't character data. Run the bookmark on your character page and paste what it copied: it starts with {\"v\":1.");
  }
  let o;try{o=JSON.parse(t)}catch(e){throw new Error("The pasted text is cut off or isn't the character data. Run the bookmark again and paste the whole thing.")}
  if(o&&o.info&&o.equipment) return {kind:'char',data:o};
  if(o&&o.profile&&o.stat) return {kind:'info',data:o};
  if(o&&o.equipment&&o.skill) return {kind:'equipment',data:o};
  if(o&&o.format==='aionflex-build') return {kind:'af1',data:o};
  throw new Error("This JSON isn't from NCSoft's character page or AionFlex.");
}
function chClassOf(rec){const p=rec.official&&rec.official.info&&rec.official.info.profile;return (p&&p.className)||(rec.af1&&rec.af1.character&&rec.af1.character.class)||''}
function chNameOf(rec){const p=rec.official&&rec.official.info&&rec.official.info.profile;return (p&&p.characterName)||(rec.af1&&rec.af1.character&&rec.af1.character.name)||''}
function chServerOf(rec){const p=rec.official&&rec.official.info&&rec.official.info.profile;return Number((p&&p.serverId)||(rec.official&&rec.official.serverId)||(rec.af1&&rec.af1.character&&rec.af1.character.serverId))||0}
// Only ONE character is ever kept. A load of a different character (name + server) starts a brand-new record, so nothing
// of the previous character survives. The only things joined are pieces of the SAME character: an AionFlex code on top of
// NCSoft's data, or the profile + gear-list pastes of the two-link fallback. Each piece replaces its older copy completely.
function chMerge(cur,parsed){
  const fresh=()=>({v:1,official:null,af1:null,done:{},ticked:false});
  const sameAs=(name,sid)=>!!cur&&!!chNameOf(cur)&&!!name&&chNameOf(cur).toLowerCase()===String(name).toLowerCase()&&(!sid||!chServerOf(cur)||Number(sid)===chServerOf(cur));
  let rec;
  if(parsed.kind==='char'){
    const o=chSlim(parsed.data);o.daevanion=o.daevanion||{};for(const k in o.daevanion)o.daevanion[k]=chSlimBoard(o.daevanion[k]);o.items=o.items||{};
    if(!o.fetched)o.fetched=new Date().toISOString();
    const p=(o.info&&o.info.profile)||{};
    rec=fresh();if(sameAs(p.characterName,p.serverId||o.serverId))rec.af1=cur.af1;
    rec.official=o;
  }else if(parsed.kind==='info'){
    const o=chSlim(parsed.data),p=o.profile||{};
    rec=fresh();if(sameAs(p.characterName,p.serverId))rec.af1=cur.af1;
    rec.official={v:1,kind:'aion2-character',partial:true,fetched:new Date().toISOString(),serverId:p.serverId,region:chRegion(p.serverId),characterId:p.characterId,info:o,equipment:null,items:{},daevanion:{}};
  }else if(parsed.kind==='equipment'){
    if(!cur||!cur.official||!cur.official.partial) throw new Error('Paste the profile data first (link 1), then the gear-list data (link 2): the gear list has no character name in it.');
    rec=JSON.parse(JSON.stringify(cur));
    rec.official.equipment=chSlim(parsed.data);rec.official.items={};rec.official.fetched=new Date().toISOString();
  }else if(parsed.kind==='af1'){
    const a=parsed.data,c=a.character||{};
    rec=fresh();if(sameAs(c.name,c.serverId))rec.official=cur.official;
    rec.af1={format:a.format,version:a.version,source:a.source,exportedAt:a.exportedAt,observedAt:a.observedAt,character:a.character,gear:a.gear,skills:a.skills,titleIds:a.titleIds,genusInsight:a.genusInsight};
  }
  if(cur&&chSame(cur,rec))rec.done=cur.done||{};
  rec.saved=new Date().toISOString();
  return rec;
}
function chSame(a,b){return !!a&&!!b&&!!chNameOf(a)&&chNameOf(a).toLowerCase()===chNameOf(b).toLowerCase()&&(!chServerOf(a)||!chServerOf(b)||chServerOf(a)===chServerOf(b))}
// the single global slot (not per class); Clear deletes the key itself
function chGet(){const r=S.gget('mychar',null);return r&&(r.official||r.af1)?r:null}
function chPut(rec){S.gset('mychar',rec)}
function chDelete(){
  delete STORE.mychar;
  // also drop anything an earlier build of this tab kept per class
  Object.keys(STORE.c||{}).forEach(k=>{const o=STORE.c[k];if(o){delete o.mychar;delete o.mcdone}});
  STORE.ts=Date.now();if(typeof saveLocal==='function')saveLocal();if(typeof queueRemote==='function')queueRemote();
}
(function(){let old=false;Object.keys(STORE.c||{}).forEach(k=>{const o=STORE.c[k];if(o&&('mychar' in o||'mcdone' in o)){delete o.mychar;delete o.mcdone;old=true}});if(old){STORE.ts=Date.now();if(typeof saveLocal==='function')saveLocal()}})();

/* ---------- one normalised model from either source ---------- */
function chModel(rec){
  const O=rec.official,A=rec.af1;
  const M={src:[],gear:[],arcana:[],skills:[],boards:{},boardInfo:[],titles:null,genus:null,stats:{},bonus:{},daevKnown:false,stonesKnown:false};
  if(O&&O.info){
    M.src.push('official');
    const p=O.info.profile||{};
    Object.assign(M,{name:p.characterName,cls:p.className,level:p.characterLevel,server:p.serverName,serverId:p.serverId||O.serverId,region:O.region||chRegion(p.serverId),race:p.raceName,legion:p.regionName,cp:p.combatPower,fetched:O.fetched,partial:!!O.partial,charTitle:p.titleName});
    ((O.info.stat||{}).statList||[]).forEach(s=>{M.stats[s.type]=Number(s.value)||0});
    M.il=M.stats.ItemLevel;
    const T=O.info.title;
    if(T)M.titles={owned:T.ownedCount,total:T.totalCount,equipped:(T.titleList||[]).map(t=>({cat:t.equipCategory,name:t.name,grade:t.grade,stats:(t.equipStatList||[]).map(x=>x.desc)}))};
    M.boardInfo=((O.info.daevanion||{}).boardList)||[];
    const E=O.equipment||{};
    (((E.equipment||{}).equipmentList)||[]).forEach(r=>{
      const it=(O.items||{})[r.slotPos]||{};
      const g={pos:r.slotPos,slot:r.slotPosName,id:r.id,name:r.name||it.name,grade:r.grade||it.grade,il:it.level,enh:Number(r.enchantLevel)||0,exceed:Number(r.exceedLevel)||0,maxEnh:it.maxEnchantLevel,maxExceed:it.maxExceedEnchantLevel||0,cat:it.categoryName,detail:!!it.name,
        stoneSlots:it.magicStoneSlotCount||0,stones:(it.magicStoneStat||[]).map(s=>({name:s.name,value:s.value,grade:s.grade})),
        soul:(it.subStats||[]).map(s=>({name:s.name,value:s.value})).concat((it.subSkills||[]).map(s=>({name:s.name,value:'+'+s.level,skill:s.name,level:s.level}))),
        soulRate:it.soulBindRate!=null?chNum(it.soulBindRate):null,soulMax:it.subStatCount||0,theoSlots:it.godStoneSlotCount||0,theo:(it.godStoneStat||[]).map(x=>x.name),
        set:it.set?{name:it.set.name,count:it.set.equippedCount,bonuses:it.set.bonuses||[]}:null,subSkills:it.subSkills||[]};
      (/^Arcana/.test(r.slotPosName)?M.arcana:M.gear).push(g);
    });
    M.stonesKnown=M.gear.some(g=>g.detail);
    M.skills=((E.skill||{}).skillList||[]).map(s=>({id:s.id,name:s.name,cat:s.category,level:Number(s.skillLevel)||0,equip:!!s.equip,acquired:!!s.acquired}));
    M.wing=E.petwing&&E.petwing.wing;M.pet=E.petwing&&E.petwing.pet;
    const D=O.daevanion||{};
    for(const bid in D){const b=D[bid]||{};M.boards[bid]={open:new Set((b.nodeList||[]).filter(n=>n.open===1||n.open==null).map(n=>n.row+','+n.col)),skillEff:b.openSkillEffectList||[],statEff:b.openStatEffectList||[]}}
    M.daevKnown=Object.keys(M.boards).length>0;
  }
  if(A){
    M.src.push('af1');
    M.af1Seen=A.observedAt;M.af1Source=A.source;
    if(!M.src.includes('official')){
      const c=A.character||{};
      Object.assign(M,{name:c.name,cls:c.class,level:c.level,serverId:c.serverId,region:chRegion(c.serverId),cp:c.combatPower,il:c.gearScore,fetched:A.observedAt});
      (A.gear||[]).forEach(g=>{
        const slot=CH_AFSLOT[g.slot]||g.slot,e=Number(g.enchant)||0;
        const soul=(g.subStats||[]).map(s=>{const m=CH_AFSTAT[s.statId];return m?{name:m[0],value:m[1]>1?(s.value/m[1]).toFixed(1)+'%':String(s.value)}:{name:'stat #'+s.statId,value:String(s.value),unknown:true}})
          .concat((g.skillSubStats||[]).map(s=>({name:chSkillName(s.skillId),value:'+'+s.level,skill:chSkillName(s.skillId),level:s.level})));
        const x={pos:CH_POS[slot],slot,id:g.itemId,name:'Item #'+g.itemId,grade:'',il:null,enh:Math.min(e,15),exceed:Math.max(0,e-15),maxEnh:null,maxExceed:0,detail:false,af1:true,stoneSlots:0,stones:[],soul,soulRate:null,soulMax:0,theo:[],set:null,
          subSkills:(g.skillSubStats||[]).map(s=>({name:chSkillName(s.skillId),level:s.level}))};
        (/^Arcana/.test(slot)?M.arcana:M.gear).push(x);
      });
      M.skills=(A.skills||[]).map(s=>({id:s.code,name:chSkillName(s.code),cat:s.kind==='stigma'?'Dp':s.kind==='passive'?'Passive':'Active',level:Number(s.level)||0,equip:true,acquired:true}));
    }
    M.genus=A.genusInsight||null;
    const sp={};(A.skills||[]).forEach(s=>{sp[s.code]=s.specs||[]});
    M.skills.forEach(s=>{if(sp[s.id])s.specs=sp[s.id]});
    M.af1TitleIds=A.titleIds||[];
  }
  // skill levels that come from gear/Arcana lines and Daevanion nodes (the in-game number includes them)
  const add=(n,v,k)=>{const b=M.bonus[n]=M.bonus[n]||{gear:0,daev:0};b[k]+=v};
  M.gear.concat(M.arcana).forEach(g=>(g.subSkills||[]).forEach(s=>add(s.name,Number(s.level)||0,'gear')));
  for(const bid in M.boards)M.boards[bid].skillEff.forEach(e=>{const m=String(e.desc||'').match(/^(.+?) \+(\d+)$/);if(m)add(m[1],Number(m[2]),'daev')});
  return M;
}

/* ---------- comparing with the guide ---------- */
function chRollsFor(key){return typeof rollSlot==='function'?rollSlot(chMode(),key):null}
function chListHit(list,name,skill){
  const nm=chNorm(name);
  for(const raw of (list||[])){
    const e=String(raw);
    if(skill){
      const m=e.match(/^\+1 (.+)$/);if(m&&chNorm(m[1])===chNorm(skill))return raw;
      continue;
    }
    if(/skill \+1|\+1$/.test(e))continue;
    const alts=chNorm(e).split(' / ').map(x=>x.trim());
    if(alts.includes(nm))return raw;
  }
  return null;
}
function chRateLine(line,R){
  if(!R)return {st:'na'};
  if(chListHit(R.best,line.name,line.skill))return {st:'best'};
  const k=chListHit(R.keep,line.name,line.skill);if(k)return {st:'good',note:/\(/.test(k)?k.replace(/^[^(]*\(/,'').replace(/\)$/,''):''};
  if(chListHit(R.reroll,line.name,line.skill))return {st:'bad'};
  if(line.skill){return (R.reroll||[]).some(x=>/other .*skill \+1/.test(x))?{st:'bad'}:{st:'ok'}}
  return {st:'ok',note:'not rated'};
}
function chStones(g,R){
  const role=(typeof ROLEMAP!=='undefined'&&ROLEMAP[SLUG])||'dps';
  const want=((R&&R.stones)||[]).map(chNorm);
  const pool=want.slice();
  const rated=g.stones.map(s=>{
    const n=chNorm(s.name);
    if(CH_DMGSTONE.test(n))return {s,st:'best',note:'Superior-only line: keep it'};
    const i=pool.indexOf(n);if(i>=0){pool.splice(i,1);return {s,st:'good'}}
    if(want.includes(n))return {s,st:'ok',note:'already have enough of these'};
    if(role==='dps'&&/^(accuracy|critical hit)$/.test(n))return {s,st:'ok',note:'useful until your target'};
    return {s,st:'bad'};
  });
  const useful=rated.filter(r=>r.st!=='bad').length;
  const empty=Math.max(0,(g.stoneSlots||0)-g.stones.length);
  return {rated,useful,empty,want:(R&&R.stones)||[]};
}
function chEnhTarget(gs,g){
  if(!gs)return null;const m=String(gs.enh||'').match(/\+(\d+)/);if(!m)return null;
  let t=Number(m[1]);if(g.maxEnh)t=Math.min(t,g.maxEnh);return t;
}
function chKeeper(g){const k=CH_SLOTKEY[g.slot];return k==='amulet'||k==='belt'||(Number(g.il)>=86&&chGrade(g.grade)==='Unique')}

function chArcPicks(){
  const out={};const t=document.querySelector('#arcana table');if(!t)return out;
  t.querySelectorAll('tbody tr').forEach(tr=>{const td=tr.querySelectorAll('td');if(td.length<2)return;const b=td[0].querySelector('b');const slot=(b?b.textContent:td[0].textContent).trim();out[slot]=td[1].textContent.trim()});
  return out;
}
function chTitleMatch(listName,eq){
  const w=s=>String(s).toLowerCase().replace(/[^a-z0-9' ]+/g,' ').split(/\s+/).filter(Boolean);
  const e=w(eq),L=new Set(w(listName));if(!e.length)return false;
  if(!e.every(x=>L.has(x)))return false;
  const firsts=String(listName).split(' / ').map(a=>w(a)[0]);
  return firsts.includes(e[0]);
}
function chPerkMatch(guideText,perks){
  // guideText like "+30% skill speed [8]"; perks like ["8|Removes MP consumed", ...] -> best slot (1-5) or 0
  const stop=new Set(['the','a','an','on','of','to','and','or','for','with','in','at','is','by','it','skill','skills','then','keep','every','stage','only','use']);
  const tok=s=>String(s).toLowerCase().replace(/\[\d+\]/g,' ').replace(/[^a-z0-9%+\-]+/g,' ').split(/\s+/).filter(x=>x&&!stop.has(x));
  const rk=(String(guideText).match(/\[(\d+)\]/)||[])[1];
  const g=new Set(tok(String(guideText).split('(')[0]));
  let best=0,bs=0;
  perks.forEach((p,i)=>{const [r,txt]=String(p).split('|');const t=tok(txt);let sc=t.filter(x=>g.has(x)).length;if(rk&&r===rk)sc+=0.5;if(sc>bs){bs=sc;best=i+1}});
  return bs>=1.5?best:0;
}

function chAnalyse(M){
  const mode=chMode(),todo=[],A={mode,gear:[],skills:[],stig:null,perks:[],boards:[],arcana:[],titles:[],rule:null,genus:null,todo};
  const T=(key,tier,order,cost,title,detail,tab,action)=>todo.push({key,tier,order,cost,title,detail,tab,action});
  const GS=(typeof GEARSLOTS!=='undefined'&&(GEARSLOTS[mode]||GEARSLOTS.pve))||[];
  const lvl=Number(M.level)||45;

  /* gear */
  const gear=M.gear.slice().sort((a,b)=>CH_ORDER.indexOf(a.slot)-CH_ORDER.indexOf(b.slot));
  const enhGaps=[];
  gear.forEach((g,gi)=>{
    const key=CH_SLOTKEY[g.slot],gs=key?GS.find(s=>s.k===key):null,R=key?chRollsFor(key):null;
    const row={g,key,gs,label:CH_SLOTNAME[g.slot]||g.slot};
    row.tgt=chEnhTarget(gs,g);
    row.enhSt=row.tgt==null?'na':g.enh>=row.tgt?'good':g.enh>=row.tgt-2?'ok':'bad';
    if(row.tgt!=null&&g.enh<row.tgt)enhGaps.push(row);
    row.amp=(key==='weapon'||key==='guard')&&g.maxExceed>0&&g.enh>=15&&g.exceed<g.maxExceed;
    row.keeper=chKeeper(g);
    row.stone=g.detail?chStones(g,R):null;
    row.soul=g.soul.map(l=>Object.assign({},l,chRateLine(l,R)));
    row.bad=row.soul.filter(l=>l.st==='bad');
    row.R=R;
    A.gear.push(row);
  });
  const empt=A.gear.filter(r=>r.stone&&r.stone.empty);
  if(empt.length)T('stone-empty',1,6,'cheap',`Fill empty manastone slots: ${empt.map(r=>`${chH(r.label.toLowerCase())} (${r.stone.empty})`).join(', ')}`,`Any stone beats an empty slot. Ideal stones: ${empt.slice(0,3).map(r=>`${chH(r.label)}: ${chH(r.stone.want.join(', ')||'Attack')}`).join('; ')}. Use cheap stones on pieces you will replace.`,'upgrades',{type:'stones',fill:empt.map(r=>({slot:r.key,n:r.stone.empty}))});
  // enhancing: weapon, then guard, then armor, then accessories
  const grp={weapon:[],guard:[],armor:[],acc:[]};
  enhGaps.forEach(r=>{const t=r.gs&&r.gs.t;(r.key==='weapon'?grp.weapon:r.key==='guard'?grp.guard:t==='armor'?grp.armor:grp.acc).push(r)});
  const enhTxt=a=>a.map(r=>`${chH(r.label)} +${r.g.enh} → +${r.tgt}`).join(', ');
  if(grp.weapon.length)T('enh-weapon',2,1,'kinah',`Enhance your weapon to +${grp.weapon[0].tgt}`,`${enhTxt(grp.weapon)}. The weapon is your biggest single damage upgrade; finish it before anything else you enhance.`,'upgrades',{type:'enhance',slots:grp.weapon.map(r=>({slot:r.key,from:r.g.enh,to:r.tgt}))});
  if(grp.guard.length)T('enh-guard',2,2,'kinah',`Enhance your guard / off-hand to +${grp.guard[0].tgt}`,enhTxt(grp.guard),'upgrades',{type:'enhance',slots:grp.guard.map(r=>({slot:r.key,from:r.g.enh,to:r.tgt}))});
  if(grp.armor.length)T('enh-armor',2,3,'kinah',`Enhance armor to +${grp.armor[0].tgt}`,enhTxt(grp.armor)+'. Only on pieces you will keep (item level 86+); enhancement carries over when you upgrade.','upgrades',{type:'enhance',slots:grp.armor.map(r=>({slot:r.key,from:r.g.enh,to:r.tgt}))});
  if(grp.acc.length)T('enh-acc',2,4,'kinah','Enhance accessories, belt and amulet to their targets',enhTxt(grp.acc),'upgrades',{type:'enhance',slots:grp.acc.map(r=>({slot:r.key,from:r.g.enh,to:r.tgt}))});
  const amp=A.gear.filter(r=>r.amp);
  if(amp.length&&!grp.weapon.length)T('amp',2,5,'kinah','Amplify your '+amp.map(r=>r.label.toLowerCase()).join(' and '),amp.map(r=>`${chH(r.label)} Amplify ${r.g.exceed}/${r.g.maxExceed}`).join(', ')+'. Amplify (the +15 → +20 track) adds Attack and Damage Boost on top of +15.','upgrades',{type:'amplify',slots:amp.map(r=>({slot:r.key,from:r.g.exceed,to:r.g.maxExceed}))});
  // soul binding rerolls on keeper gear, weapon first
  const sg={weapon:[],guard:[],armor:[],acc:[]};
  A.gear.filter(r=>r.keeper&&r.bad.length).forEach(r=>{const t=r.gs&&r.gs.t;(r.key==='weapon'?sg.weapon:r.key==='guard'?sg.guard:t==='armor'?sg.armor:sg.acc).push(r)});
  const syncTxt=r=>`${chH(r.label)}: ${r.bad.map(l=>`<b>${chH(l.skill?'+'+l.level+' '+l.name:l.name)}</b>`).join(', ')} <span class="muted">(aim for ${chH(((r.R&&r.R.best)||[]).slice(0,2).join(' or '))})</span>`;
  [['weapon','your weapon'],['guard','your guard'],['armor','armor'],['acc','accessories']].forEach(([k,lab],i)=>{
    const a=sg[k];if(!a.length)return;const n=a.reduce((x,r)=>x+r.bad.length,0);
    T('sync-'+k,3,i,'grind',`Soul Binding: Sync ${n} weak line${n>1?'s':''} on ${lab}`,a.map(syncTxt).join('<br>')+(a.some(r=>r.g.soulRate!=null&&r.g.soulRate<100)?'<br><span class="muted">Fix the lines before you Bind: at 100% Soul Binding Rate they are fixed for good.</span>':''),'upgrades',{type:'sync',slots:a.map(r=>({slot:r.key,lines:r.bad.map(l=>l.name)}))});
  });
  A.gear.filter(r=>r.keeper&&r.stone&&r.stone.rated.length>=2&&r.stone.useful<=1&&!r.stone.empty).forEach((r,i)=>{
    T('stones-'+r.g.slot,3,20+i,'kinah',`Re-engrave the manastones on your ${r.label.toLowerCase()}`,`Only ${r.stone.useful} of ${r.stone.rated.length} lines are useful. Keep a roll once 2 or more lines are ${chH(r.stone.want.join(' / ')||'useful')}. Engraving rerolls all lines at once (no lock).`,'upgrades',{type:'stones',slot:r.key});
  });
  // the lowest item-level slot to replace
  const repl=A.gear.filter(r=>r.gs&&r.key!=='amulet'&&r.key!=='belt'&&r.g.il).sort((a,b)=>a.g.il-b.g.il);
  if(repl.length){
    const low=repl[0].g.il,pick=repl.filter(r=>r.g.il===low).slice(0,3);
    if(low<102)T('replace-'+pick.map(r=>r.key).join('-'),4,1,'grind',`Replace your lowest item-level gear: ${pick.map(r=>chH(r.label.toLowerCase())).join(', ')} (item level ${low})`,pick.map(r=>`<b>${chH(r.label)}</b>: ${r.gs.item}`).join('<br>'),'gear',{type:'replace',slots:pick.map(r=>r.key),il:low});
  }

  /* skills vs the skill-point plan */
  const pm=(typeof ptmode!=='undefined'&&ptmode)||S.get('ptmode','base');
  const SP=(typeof SKILLPLAN!=='undefined'&&SKILLPLAN&&(SKILLPLAN[pm]||SKILLPLAN.base))||null;
  const Lp=Math.max(5,Math.min(45,Math.floor(lvl/5)*5));
  const plan=SP&&SP.states?(SP.states[Lp]||SP.states[String(Lp)]||{}):{};
  const planNames=(C.activePriority||[]).concat(C.passivePriority||[]);
  const byName={};M.skills.forEach(s=>{byName[s.name]=s});
  let need=0,spare=0;const behind=[],ahead=[];
  planNames.forEach(n=>{
    const s=byName[n],b=M.bonus[n]||{gear:0,daev:0};
    const total=s?s.level:0,pts=M.daevKnown?Math.max(0,total-b.gear-b.daev):null,want=plan[n]||0;
    const row={name:n,total,gear:b.gear,daev:b.daev,pts,want,known:!!s};
    row.st=pts==null?'na':pts>=want?'good':'bad';
    if(pts!=null&&pts<want){let c=0;for(let r=pts+1;r<=want;r++)c+=CH_SKCOST[r]||0;need+=c;behind.push(row)}
    if(pts!=null&&pts>want){let c=0;for(let r=want+1;r<=pts;r++)c+=CH_SKCOST[r]||0;spare+=c;ahead.push(row)}
    A.skills.push(row);
  });
  A.skillPlan={pm,Lp,need,spare,ahead};
  if(behind.length)T('skillpts',1,1,'free',`Skill points: raise ${behind.slice(0,4).map(r=>`<b>${chH(r.name)}</b> to ${r.want}`).join(', ')}${behind.length>4?` and ${behind.length-4} more`:''}`,`These are below the guide's level-${Lp} plan (${need} point${need===1?'':'s'}). ${spare?`You have ${spare} point${spare===1?'':'s'} in skills above the plan (${ahead.slice(0,3).map(r=>chH(r.name)).join(', ')}): the skill reset (<span class="kbd">K</span>, reset button) is free and unlimited.`:'Spend unspent points first; the reset (<span class="kbd">K</span>) is free if you need to move points.'}`,'plan',{type:'skill',changes:behind.map(r=>({skill:r.name,from:r.pts,to:r.want}))});

  /* perks (only in AionFlex codes) */
  if(C.perks&&C.perks.rows&&M.skills.some(s=>s.specs)){
    C.perks.rows.forEach(pr=>{
      const s=byName[pr.skill];if(!s||!s.specs)return;
      const perks=(CHAR_IDS[String(s.id)]||[]).slice(1);if(!perks.length)return;
      const slots=s.level>=20?3:s.level>=12?2:s.level>=8?1:0;
      const want=[];[pr.s1,pr.s2,pr.s3].forEach(t=>{const sl=chPerkMatch(t,perks);if(!sl)return;const rk=Number((String(perks[sl-1]).split('|')[0]))||0;if(rk<=s.level&&want.length<slots&&!want.includes(sl))want.push(sl)});
      const have=s.specs.slice(),miss=want.filter(x=>!have.includes(x));
      const row={skill:pr.skill,level:s.level,slots,have,want,miss,perks,st:!want.length?'na':miss.length?'bad':'good'};
      A.perks.push(row);
    });
    const off=A.perks.filter(r=>r.miss.length);
    if(off.length)T('perks',1,2,'free',`Perks: change ${off.length} skill${off.length>1?'s':''} (${off.slice(0,3).map(r=>chH(r.skill)).join(', ')}${off.length>3?'…':''})`,off.slice(0,4).map(r=>`<b>${chH(r.skill)}</b>: take ${r.miss.map(x=>chH(String(r.perks[x-1]).split('|')[1])).join(' + ')}`).join('<br>')+'<br><span class="muted">From your AionFlex code (it can be hours old).</span>','skills',{type:'perks',skills:off.map(r=>({skill:r.skill,want:r.want,have:r.have}))});
  }

  /* stigmas */
  const stigList=(mode==='pvp'?(C.stigmasPvp||[]).slice(0,4):(C.stigmasPve||[]).filter(s=>!s.slot||s.slot<=lvl)).map(s=>s.name);
  const eqSt=M.skills.filter(s=>s.cat==='Dp'&&s.equip);
  if(M.skills.length){
    const miss=stigList.filter(n=>!eqSt.some(s=>s.name===n)),extra=eqSt.filter(s=>!stigList.includes(s.name));
    A.stig={list:stigList,eq:eqSt,miss,extra};
    if(miss.length)T('stig-swap',1,3,'free',`Stigmas: equip ${miss.map(n=>`<b>${chH(n)}</b>`).join(', ')}${extra.length?` instead of ${extra.map(s=>chH(s.name)).join(', ')}`:''}`,'The guide\'s '+(mode==='pvp'?'PvP':'PvE')+' Stigmas are '+stigList.map(chH).join(', ')+'. '+(M.skills.some(s=>s.cat==='Dp'&&s.name===miss[0]&&s.acquired)?'You already have it unlocked.':'Unlock it with the Stigma quest or a Stigma Shard drop first if you don\'t have it.'),'skills',{type:'stigma',add:miss,remove:extra.map(s=>s.name)});
    const low=eqSt.filter(s=>stigList.includes(s.name)&&s.level<10);
    if(low.length)T('stig-lvl',1,7,'shards',`Level Stigmas: ${low.map(s=>`${chH(s.name)} ${s.level} → ${s.level<5?5:10}`).join(', ')}`,'Levels 1–5 cost 1 shard each, 6–10 cost 2 each. Get every equipped Stigma to 5 first, then 10.','skills',{type:'stigmaLevel',skills:low.map(s=>({skill:s.name,from:s.level,to:s.level<5?5:10}))});
  }

  /* Daevanion */
  const boards=(typeof DATA!=='undefined'&&DATA.boards)||[];
  boards.forEach((b,bi)=>{
    const R=b[mode]||b.pvp||b.pve;if(!R)return;
    const info=M.boardInfo.find(x=>x.id===b.id),own=M.boards[b.id];
    const nodeAt={};(b.nodes||[]).forEach(n=>{nodeAt[n[0]+','+n[1]]=n});
    // compare the route's TARGET nodes (the skill/stat nodes it is going for), not its connector nodes:
    // you may have reached a target by another path, which is fine
    const order=(R.order||[]).map(rc=>rc[0]+','+rc[1]),miles=R.miles||[],nplan=R.nplan||miles.length;
    const tgtK=miles.map(m=>order[m[1]-1]),planT=tgtK.slice(0,nplan).filter(Boolean);
    const row={b,name:b.name,lvl:b.lvl,info,known:!!own,planTotal:planT.length,pvpBoard:!b[mode]};
    if(lvl<b.lvl){row.st='na';row.note=`opens at level ${b.lvl}`;A.boards.push(row);return}
    if(!own){row.st='na';row.note=info?`${info.openNodeCount}/${info.totalNodeCount} nodes (detail not loaded)`:'not loaded';A.boards.push(row);return}
    row.owned=[...own.open].filter(k=>nodeAt[k]&&nodeAt[k][5]!=='Start').length;
    row.planOwned=planT.filter(k=>own.open.has(k)).length;
    const seen=new Set();row.next=[];
    for(let i=0;i<miles.length&&row.next.length<4;i++){
      const k=tgtK[i];if(!k||own.open.has(k)||seen.has(k)||!nodeAt[k])continue;seen.add(k);
      const p=chPathCost(nodeAt,own.open,k);
      row.next.push({key:k,label:i<nplan?nodeAt[k][4]:miles[i][0],plan:i<nplan,cost:p?p.cost:null,n:p?p.n:null});
    }
    row.st=row.planOwned>=row.planTotal?'good':row.planOwned>=row.planTotal*0.75?'ok':'bad';
    A.boards.push(row);
  });
  const dg=A.boards.filter(r=>r.next&&r.next.length&&r.planOwned<r.planTotal&&!(r.pvpBoard&&mode==='pve'));
  const nx=n=>`${chH(n.label)}${n.cost!=null?` <span class="muted">(${n.n} node${n.n===1?'':'s'}, ${n.cost} crystals)</span>`:''}`;
  if(dg.length)T('daev',1,4,'crystals','Daevanion: where your next crystals go',dg.map(r=>`<b>${chH(r.name)}</b>${r.pvpBoard?' (PvP board)':''} ${r.planOwned}/${r.planTotal} targets: ${r.next.filter(n=>n.plan).slice(0,2).map(nx).join(', then ')}`).join('<br>')+'<br><span class="muted">Only if you have unspent crystals. Costs are from the nodes you own now.</span>','boards',{type:'daevanion',boards:dg.map(r=>({board:r.name,targets:r.next.filter(n=>n.plan).slice(0,2).map(n=>n.key)}))});

  /* Arcana */
  const picks=chArcPicks();
  ['Chalice','Parchment','Compass','Bell','Mirror'].forEach((slot,i)=>{
    const g=M.arcana.find(a=>a.cat===slot||CH_ARCSLOT[a.slot]===slot);const pick=picks[slot]||'';
    const row={slot,g,pick};
    if(!g){row.st='bad';A.arcana.push(row);if(lvl>=45)T('arc-miss-'+slot,4,10+i,'grind',`Arcana: get a ${slot} card`,`Empty Arcana slot. The guide wants: ${chH(pick||'see the Arcana tab')}.`,'arcana',{type:'arcana',slot});return}
    const pl=pick.toLowerCase();
    row.lines=(g.subSkills||[]).map(s=>({name:s.name,level:s.level,st:pl&&pl.includes(String(s.name).toLowerCase())?'good':'bad'}));
    row.setOk=/ of (vigor|magic)\b/i.test(pick)&&!g.af1?pl.includes(String(g.name).toLowerCase()):null;
    row.offLines=row.lines.filter(l=>l.st==='bad');
    row.st=row.offLines.length>1||row.setOk===false?'bad':row.offLines.length?'ok':'good';
    if(g.maxEnh&&g.enh<g.maxEnh)row.enhGap=true;
    A.arcana.push(row);
  });
  const arcEnh=A.arcana.filter(r=>r.enhGap);
  if(arcEnh.length)T('arc-enh',2,6,'kinah','Arcana: enhance cards to max',arcEnh.map(r=>`${chH(r.slot)} +${r.g.enh} → +${r.g.maxEnh}`).join(', ')+'. Uses Training Arcana; raises the card\'s Empyrean Lord stat.','arcana',{type:'arcanaEnh',slots:arcEnh.map(r=>r.slot)});
  const arcOff=A.arcana.filter(r=>r.g&&(r.offLines.length>1||r.setOk===false));
  if(arcOff.length)T('arc-lines',4,20,'grind','Arcana: replace cards with off-plan skill lines',arcOff.map(r=>`<b>${chH(r.slot)}</b>: ${r.offLines.map(l=>chH(l.name)).join(', ')||'wrong set'} → want ${chH(r.pick)}`).join('<br>'),'arcana',{type:'arcana',slots:arcOff.map(r=>r.slot)});

  /* titles */
  if(M.titles&&typeof TITLES!=='undefined'&&TITLES&&TITLES[mode]){
    const sv=S.get('sv',{});
    [['Attack','Attack'],['Defense','Defense'],['Etc','Other']].forEach(([cat,sl],i)=>{
      const list=TITLES[mode][sl]||[],eq=M.titles.equipped.find(t=>t.cat===cat);
      const ei=eq?list.findIndex(t=>chTitleMatch(t.name,eq.name)):-1;
      const ownBest=list.findIndex(t=>sv[tkey(t.name)]);
      const row={sl,eq,ei,list,ownBest,next:ei>0?list[ei-1]:ei<0&&list.length?list[list.length-1]:null};
      row.st=!eq?'bad':ei===0?'best':ei>0&&ownBest>=0&&ownBest<ei?'bad':ei>=0?'good':'ok';
      A.titles.push(row);
      if(eq&&ownBest>=0&&(ei<0||ownBest<ei))T('title-'+sl,1,5+i/10,'free',`Title: equip <b>${chH(list[ownBest].name)}</b> in the ${sl} slot`,`You ticked it as owned and it ranks above ${chH(eq.name)} for ${mode==='pvp'?'PvP':'PvE'}: ${chH(list[ownBest].bonus)}.`,'titles',{type:'title',slot:sl,name:list[ownBest].name});
      if(!eq)T('title-none-'+sl,1,5+i/10,'free',`Title: nothing equipped in the ${sl} slot`,'Equip your best '+sl+' title (Titles tab).','titles',{type:'title',slot:sl});
    });
  }

  /* Attack Bonus vs PvE Attack (stat_rules: Might + Destruction ~63 points = ~6% Attack Increase) */
  if(M.stats&&M.stats.STR!=null){
    const atk=(M.stats.STR||0)+(M.stats.Destruction||0),acc=(M.stats.AGI||0)+(M.stats.Freedom||0);
    A.rule={atk,acc,atkPick:atk>=63?'Attack Bonus':'PvE Attack',accPick:acc>=63?'Accuracy Bonus':'PvE Accuracy'};
  }

  /* Genus Insight (AionFlex only) */
  if(M.genus&&typeof GENUS!=='undefined'&&GENUS&&GENUS.classes&&GENUS.classes[SLUG]){
    const G=GENUS.classes[SLUG][mode]||GENUS.classes[SLUG].pve,rows=[];
    M.genus.forEach(f=>{const fam=String(f.family||'').toLowerCase(),B=(G||{})[fam]||{};(f.slots||[]).forEach(s=>{
      const m=CH_AFSTAT[s.statId],name=m?m[0]:null,gw=CH_GENUSG[s.grade]||('grade '+s.grade),val=m?(m[1]>1?(s.value/m[1]).toFixed(2)+'%':s.value):s.value;
      const R=B[String(s.slot)]||{};let st='ok',note='';
      const ent=a=>(a||[]).map(x=>typeof x==='string'?{line:x}:x);
      const gOf=e=>e.grade||CH_COLG[e.colour]||'';
      const same=(e,n)=>chNorm(e.line)===chNorm(n);
      if(!name){st=s.grade<=2?'bad':'ok';note=s.grade<=2?'white/green line':'line not decoded'}
      else{
        let n2=name;
        if(A.rule&&mode==='pve'&&name==='Attack Bonus'&&A.rule.atkPick==='Attack Bonus')n2='PvE Attack';
        if(A.rule&&mode==='pve'&&name==='Accuracy Bonus'&&A.rule.accPick==='Accuracy Bonus')n2='PvE Accuracy';
        const bst=ent(R.best).filter(e=>same(e,name)||same(e,n2)),kp=ent(R.keep).filter(e=>same(e,name)||same(e,n2));
        if(bst.some(e=>(CH_GRANK[gOf(e)]||5)<=s.grade))st='best';
        else if(kp.some(e=>(CH_GRANK[gOf(e)]||4)<=s.grade))st='good';
        else if(bst.length||kp.length){st='ok';note='right line, low grade'}
        else if((R.reroll||[]).some(x=>chNorm(x)===chNorm(name))||s.grade<=2){st='bad'}
        if(n2!==name&&st!=='bad')note='counts as '+n2+' for you';
      }
      rows.push({fam:f.family,slot:s.slot,name:name||('stat #'+s.statId),val,gw,grade:s.grade,st,note});
    })});
    A.genus=rows;
    const bad=rows.filter(r=>r.st==='bad');
    if(bad.length)T('genus',3,40,'grind',`Genus Insight: reroll ${bad.length} weak line${bad.length>1?'s':''}`,bad.slice(0,6).map(r=>`${chH(r.fam)} slot ${r.slot}: ${chH(r.name)} (${chH(r.gw)})`).join(', ')+(bad.length>6?'…':'')+'. From your AionFlex code; see Pets &amp; Genus Insight for what to aim for.','pets',{type:'genus',lines:bad.map(r=>({family:r.fam,slot:r.slot}))});
  }

  /* order: cheapest/fastest first, or by simulated gain per cost when the simulator is loaded */
  let sim=false;
  if(window.AionSim&&typeof window.AionSim.estimateGain==='function'){
    todo.forEach(t=>{try{const v=window.AionSim.estimateGain({slug:SLUG,mode,model:M,action:t.action});if(typeof v==='number'&&isFinite(v)){t.gain=v;sim=true}}catch(e){}});
  }
  todo.sort((a,b)=>{
    if(sim){const ga=a.gain!=null,gb=b.gain!=null;if(ga&&gb)return b.gain/(CH_COST[b.cost]||4)-a.gain/(CH_COST[a.cost]||4);if(ga!==gb)return ga?-1:1}
    return a.tier-b.tier||a.order-b.order;
  });
  A.sim=sim;
  return A;
}

/* ---------- titles: tick the ones the official page shows you own ---------- */
function chTickTitles(M){
  if(!M.titles||typeof TITLES==='undefined'||!TITLES)return 0;
  const sv=S.get('sv',{});let n=0;
  ['pve','pvp'].forEach(m=>Object.values(TITLES[m]||{}).forEach(list=>list.forEach(t=>{
    if(M.titles.equipped.some(e=>chTitleMatch(t.name,e.name))&&!sv[tkey(t.name)]){sv[tkey(t.name)]=true;n++}
  })));
  if(n){S.set('sv',sv);if(typeof renderTitles==='function')renderTitles()}
  return n;
}

/* ---------- rendering ---------- */
function chHowTo(open){
  return `<details class="box chhow"${open?' open':''}><summary><h3 style="display:inline">${open?'Load your character':'Update or replace your character'}</h3></summary>
   <ol class="steps" style="margin-top:10px">
    <li><b>Add the button once.</b> Drag this to your browser's bookmarks bar: <a class="bmlink" id="chbm" href="#" draggable="true" title="Drag me to your bookmarks bar">My AION 2 character</a>
      <div class="small muted" style="margin-top:6px">Can't drag it (or no bookmarks bar)? <button type="button" class="btn" data-ch="copybm">Copy bookmark code</button> then make a new bookmark, name it "My AION 2 character" and paste the code as its address (URL). Press <span class="kbd">Ctrl+Shift+B</span> (<span class="kbd">Cmd+Shift+B</span> on Mac) to show the bookmarks bar.</div>
      <textarea class="chpaste" id="chbmcode" readonly hidden aria-label="Bookmark code" style="min-height:60px;margin-top:8px"></textarea></li>
    <li><b>Open your character</b> on NCSoft's site: <a href="https://aion2.plaync.com/en-us/characters/index" target="_blank" rel="noopener">aion2.plaync.com character search</a> → pick your region, search your name → click your character.</li>
    <li><b>Click the bookmark</b> on that page. It reads your profile, gear, every item and your Daevanion boards (about 30 small requests, 10–20 seconds) and says <i>"Copied"</i>. Come back here, paste below and press <b>Load</b>.</li>
   </ol>
   <label class="small muted" for="chpaste" style="display:block;margin:12px 0 6px">Paste here (also takes an AionFlex <b>af1.</b> build code for Genus Insight, or a character page link)</label>
   <textarea class="chpaste" id="chpaste" spellcheck="false" placeholder='{"v":1,"kind":"aion2-character",…}'></textarea>
   <div class="chrow" style="margin-top:8px"><button type="button" class="btn primary" data-ch="load">Load</button><span class="small muted" id="chmsg" role="status"></span></div>
  </details>`;
}
function chNote(){
  return `<div class="callout small"><b>About this data.</b> Only the character you load is saved, privately in your guide; loading another replaces it; Clear removes it. The bookmark itself saves nothing: it only copies to your clipboard. The data comes from NCSoft's public character pages, the same ones fan sites copy. The bookmark only reads your own character, one page at a time, when you click it. NCSoft's terms forbid scraping and automated access at scale, so keep it to occasional personal lookups. Changes you make in game can take a few minutes to show up (logging out pushes them through). Not in NCSoft's data: Genus Insight (paste an AionFlex code for that), your final combat totals and your pet collection. Perks are only in AionFlex codes. The site's data addresses are unofficial and can change; if the bookmark stops working, the guide's checklists still work.</div>`;
}
function chUrlHelp(p){
  const q=`region=${encodeURIComponent(p.region)}&lang=en-US&characterId=${encodeURIComponent(p.characterId)}&serverId=${p.serverId}`;
  const a=`https://aion2.plaync.com/api/character/info?${q}`,b=`https://aion2.plaync.com/api/character/equipment?${q}`;
  return `<div class="callout"><b>No bookmark? Two-link version.</b> Open each link, select everything (<span class="kbd">Ctrl+A</span>), copy, paste it here and press Load, first the profile, then the gear list. This gives the summary, skills, Stigmas, titles and enhance levels; manastones, Soul Binding and Daevanion need the bookmark.
   <ol class="steps small" style="margin-top:8px"><li><a href="${chH(a)}" target="_blank" rel="noopener">Profile data</a></li><li><a href="${chH(b)}" target="_blank" rel="noopener">Gear list data</a></li></ol></div>`;
}
function chSummary(M,rec){
  const cell=(k,v)=>`<div class="chstat"><div class="k">${k}</div><div class="v">${v}</div></div>`;
  const src=M.src.map(s=>s==='official'?'<span class="tag t-good">NCSoft</span>':'<span class="tag t-ok">AionFlex</span>').join(' ');
  return `<div class="box" style="display:grid;gap:12px">
   <div class="chrow" style="justify-content:space-between"><h3 style="margin:0">${chH(M.name||'Your character')} <span class="muted" style="font-size:16px">· ${chH(M.cls||'')} · ${chH(M.server||'')}${M.region?' ('+chH(chRegionName(M.region))+')':''}</span></h3>
     <div class="chrow"><button type="button" class="btn" data-ch="edit">Update</button><button type="button" class="btn" data-ch="clear">Clear</button></div></div>
   <div class="chgrid">${cell('Level',chH(M.level||'—'))}${cell('Combat Power',M.cp?chFmt(M.cp):'—')}${cell('Item Level',M.il?chFmt(M.il):'—')}${cell('Titles owned',M.titles?`${chFmt(M.titles.owned)}<span class="small muted"> / ${chFmt(M.titles.total)}</span>`:'—')}${M.race?cell('Race',chH(M.race)):''}${M.wing?cell('Wings',`<span class="small">${chH(M.wing.name)}</span>`):''}</div>
   <div class="small muted">${src} Fetched ${chH(chWhen(M.fetched))}${M.src.includes('af1')&&M.src.includes('official')?` · AionFlex data seen ${chH(chWhen(M.af1Seen))}`:''}${M.partial?' · <b>partial</b>: profile/gear list only (use the bookmark for item details and Daevanion)':''}. Compared with this guide's <b>${chMode()==='pvp'?'PvP':'PvE'}</b> build (switch with the PvE/PvP buttons at the top).</div>
  </div>`;
}
function chTodoHtml(A){
  const done=(chGet()||{}).done||{};
  if(!A.todo.length)return `<div class="callout ok"><b>Nothing to fix that the guide can see.</b> Your loaded character matches the guide's targets. Keep farming upgrades from the Gear tab.</div>`;
  const li=t=>`<li class="${done[t.key]?'done':''}"><input type="checkbox" data-chdone="${chH(t.key)}" ${done[t.key]?'checked':''} aria-label="Done"><div><div><b>${t.title}</b> <span class="tag">${chH(CH_COSTW[t.cost]||t.cost)}</span>${t.gain!=null?` <span class="tag t-best">+${t.gain.toFixed(1)}% DPS (sim)</span>`:''}</div><div class="small">${t.detail}${t.tab?` <a href="#${t.tab}" data-goto="${t.tab}">Open tab →</a>`:''}</div></div></li>`;
  const top=A.todo.slice(0,10),rest=A.todo.slice(10);
  return `<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Do these next, in order</h3>
   <p class="small muted" style="margin:0">${A.sim?'Sorted by the simulator\'s estimated damage gain for what each step costs.':'Cheapest and fastest first: free fixes (skill points, Stigmas, titles, Daevanion with spare crystals), then enhancing (weapon first), then rerolling lines on gear you keep, then replacing your weakest piece.'} Tick a step when done; load your character again to re-check.</p>
   <ol class="chtodo">${top.map(li).join('')}</ol>
   ${rest.length?`<details><summary class="small"><b>${rest.length} more</b></summary><ol class="chtodo" start="11" style="margin-top:8px;counter-reset:todo 10">${rest.map(li).join('')}</ol></details>`:''}
  </div>`;
}
function chGearHtml(A,M){
  if(!A.gear.length)return '';
  const line=l=>`<span class="chline">${chTag(l.st,l.st==='na'?'':undefined)}${chH(l.skill?'+'+l.level+' '+l.name:l.name)}${l.skill?'':' '+chH(l.value)}${l.note?` <span class="muted small">(${chH(l.note)})</span>`:''}</span>`;
  const rows=A.gear.map(r=>{
    const g=r.g;
    const enh=`+${g.enh}${g.exceed?` <span class="small muted">& Amplify ${g.exceed}${g.maxExceed?'/'+g.maxExceed:''}</span>`:''}${r.tgt!=null?`<div class="small">${chTag(r.enhSt,r.enhSt==='good'?'on target':'target +'+r.tgt)}</div>`:''}`;
    const st=!r.stone?(g.af1?'<span class="small muted">not in AionFlex data</span>':'<span class="small muted">—</span>'):(r.stone.rated.length||r.stone.empty?r.stone.rated.map(x=>`<span class="chline">${chTag(x.st)}${chH(x.s.name)} ${chH(x.s.value)}${x.note?` <span class="muted small">(${chH(x.note)})</span>`:''}</span>`).join('')+(r.stone.empty?`<span class="chline">${chTag('bad','empty')}${r.stone.empty} slot${r.stone.empty>1?'s':''}</span>`:''):'<span class="small muted">no slots</span>');
    const soul=r.soul.length?r.soul.map(line).join('')+(g.soulRate!=null?`<div class="small muted">Soul Binding ${g.soulRate}%</div>`:''):'<span class="small muted">—</span>';
    return `<tr><td><b>${chH(r.label)}</b>${r.keeper?'':'<div class="small muted">replace later</div>'}</td><td>${chH(g.name)}<div class="small">${g.grade?chGname(g.grade):''}${g.il?` · IL ${chH(g.il)}`:''}${g.theo&&g.theo.length?' · '+chH(g.theo.join(', ')):g.theoSlots?' · <span class="muted">no Theostone</span>':''}</div></td><td class="num">${enh}</td><td>${st}</td><td>${soul}</td></tr>`;
  }).join('');
  return `<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Gear, slot by slot</h3>
   <p class="small muted" style="margin:0">Targets come from the Gear and Upgrades tabs. ${chTag('best')} = the line to aim for, ${chTag('good')} = keep it, ${chTag('ok')} = fine for now, ${chTag('bad')} = Sync / re-engrave it (only worth it on gear you keep: item level 86+ Unique, plus belt and amulet). Manastones reroll all lines at once, so a piece is fine once 2+ lines are useful.</p>
   <div class="tablewrap"><table class="chtable"><thead><tr><th>Slot</th><th>Item</th><th class="num">Enhance</th><th>Manastones / Soulstones</th><th>Soul Binding lines</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function chSkillsHtml(A,M){
  if(!M.skills.length)return '';
  const P=A.skillPlan;
  const rows=A.skills.filter(r=>r.known||r.want).map(r=>`<tr><td><b>${chH(r.name)}</b></td><td class="num">${r.total||'·'}</td><td class="num">${r.gear||'·'}</td><td class="num">${M.daevKnown?(r.daev||'·'):'?'}</td><td class="num">${r.pts==null?'?':r.pts}</td><td class="num">${r.want||'·'}</td><td>${r.st==='na'?'<span class="small muted">needs NCSoft data</span>':r.pts<r.want?chTag('bad','raise to '+r.want):r.pts>r.want?chTag('ok','above plan'):chTag('good','on plan')}</td></tr>`).join('');
  const S2=A.stig;
  const stig=S2?`<div><b>Stigmas equipped:</b> ${S2.eq.map(s=>`<span class="chline">${chTag(S2.list.includes(s.name)?'good':'bad',S2.list.includes(s.name)?'guide':'swap')}${chH(s.name)} ${s.level}</span>`).join('')||'<span class="muted">none</span>'}${S2.miss.length?`<div class="small">Guide wants: ${S2.miss.map(n=>`<b>${chH(n)}</b>`).join(', ')}</div>`:''}</div>`:'';
  const perks=A.perks.length?`<div class="tablewrap"><table><thead><tr><th>Skill</th><th class="num">Rank</th><th>Perks you use (AionFlex)</th><th>Guide picks for your rank</th></tr></thead><tbody>${A.perks.map(r=>`<tr><td><b>${chH(r.skill)}</b></td><td class="num">${r.level}</td><td class="small">${r.have.map(x=>chH(String(r.perks[x-1]||'').split('|')[1]||('perk '+x))).join(', ')||'—'}</td><td class="small">${r.want.length?r.want.map(x=>`${r.have.includes(x)?'':'<b>'}${chH(String(r.perks[x-1]).split('|')[1])}${r.have.includes(x)?'':'</b>'}`).join(', '):'<span class="muted">could not match the guide text</span>'} ${r.st==='bad'?chTag('bad','change'):r.st==='good'?chTag('good','ok'):''}</td></tr>`).join('')}</tbody></table></div>`:'<p class="small muted" style="margin:0">Perks (specializations) aren\'t in NCSoft\'s data. Paste your AionFlex build code to check them, or compare by hand with the Skills tab.</p>';
  return `<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Skills, Stigmas and perks</h3>
   <p class="small muted" style="margin:0">The game shows one rank per skill: skill points plus bonus ranks from gear/Arcana lines and Daevanion nodes. The guide subtracts the bonuses to get your skill-point rank and compares it with the level-${P.Lp} plan (${P.pm==='extra'?'with':'without'} bonus quest points; change it on the Level plan tab).</p>
   <div class="tablewrap"><table><thead><tr><th>Skill</th><th class="num">In game</th><th class="num">Gear + Arcana</th><th class="num">Daevanion</th><th class="num">Skill points</th><th class="num">Plan</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>
   ${stig}${perks}</div>`;
}
function chBoardsHtml(A){
  if(!A.boards.length)return '';
  return `<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Daevanion boards vs the guide's route</h3>
   <div class="tablewrap"><table><thead><tr><th>Board</th><th class="num">Route targets owned</th><th class="num">Nodes owned</th><th>Next targets (crystals from what you own)</th></tr></thead><tbody>${A.boards.map(r=>`<tr><td><b>${chH(r.name)}</b>${r.pvpBoard?' <span class="tag">PvP</span>':''}</td>${r.note?`<td colspan="3" class="small muted">${chH(r.note)}</td>`:`<td class="num">${r.planOwned}/${r.planTotal} ${chTag(r.st,r.st==='good'?'done':r.st==='ok'?'close':'behind')}</td><td class="num">${r.owned}${r.info?`/${r.info.totalNodeCount}`:''}</td><td class="small">${r.next.length?r.next.map(n=>`${n.plan?'':'<span class="muted">leftover:</span> '}${chH(n.label)}${n.cost!=null?` <span class="muted">(${n.n}, ${n.cost})</span>`:''}`).join(' → '):'<span class="muted">board complete</span>'}</td>`}</tr>`).join('')}</tbody></table></div>
   <p class="small muted" style="margin:0">Targets are the skill and stat nodes the guide's route goes for; connector nodes don't count, so reaching a target by another path is fine. Numbers in brackets: nodes to buy, crystals. <a href="#boards" data-goto="boards">Open the boards →</a></p></div>`;
}
function chArcanaHtml(A){
  if(!A.arcana.length)return '';
  return `<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Arcana vs the guide's picks</h3>
   <div class="tablewrap"><table><thead><tr><th>Slot</th><th>Your card</th><th>Skill lines</th><th>Guide wants</th></tr></thead><tbody>${A.arcana.map(r=>`<tr><td><b>${chH(r.slot)}</b></td><td>${r.g?`${chH(r.g.name)}<div class="small">${r.g.grade?chGname(r.g.grade):''} +${r.g.enh}${r.g.maxEnh?'/'+r.g.maxEnh:''}${r.g.set?` · ${chH(r.g.set.name)} ${r.g.set.count}pc`:''}</div>`:'<span class="muted">empty</span>'}</td><td>${r.lines?r.lines.map(l=>`<span class="chline">${chTag(l.st,l.st==='good'?'wanted':'off-plan')}${chH(l.name)} +${chH(l.level)}</span>`).join(''):''}${r.setOk===false?'<div class="small">'+chTag('bad','other set')+'</div>':''}</td><td class="small">${chH(r.pick||'—')}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function chTitlesHtml(A,M){
  if(!M.titles)return '';
  return `<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Titles</h3>
   <p class="small muted" style="margin:0">NCSoft's page only shows the 3 titles you have equipped (and how many you own), so the guide ticks those in the <a href="#titles" data-goto="titles">Titles tab</a> for you. Tick the rest there and this check gets better.</p>
   <div class="grid3">${A.titles.map(r=>`<div class="equipcard"><div class="eyebrow">${chH(r.sl)} slot</div>${r.eq?`<b>${chH(r.eq.name)}</b> ${chTag(r.st,r.st==='best'?'best in slot':r.ei>=0?'rank '+(r.ei+1)+' of '+r.list.length:'not ranked')}`:'<b class="muted">nothing equipped</b>'}${r.ownBest>=0&&(r.ei<0||r.ownBest<r.ei)?`<div class="small">Equip <b>${chH(r.list[r.ownBest].name)}</b> (you own it)</div>`:''}${r.next&&r.ei!==0?`<div class="small muted">Next goal: ${chH(r.next.name)} · ${chH(r.next.how||'')}</div>`:''}</div>`).join('')}</div></div>`;
}
function chRuleHtml(A){
  const R=A.rule;if(!R)return '';
  return `<div class="box" style="display:grid;gap:8px"><h3 style="margin:0">Attack Bonus or PvE Attack?</h3>
   <p class="small" style="margin:0">Your Might + Destruction is <b>${R.atk}</b>. ${R.atk>=63?'That is 63 or more (about 6%+ Attack Increase), so <b>Attack Bonus</b> is within 15% of PvE Attack: take Attack Bonus, because it also works in PvP.':'That is under 63, so <b>PvE Attack</b> is clearly stronger against monsters: take PvE Attack on PvE presets (Attack Bonus catches up at about 63).'} Same rule for accuracy: Precision + Freedom is <b>${R.acc}</b> → <b>${chH(R.accPick)}</b>. This matters for Genus Insight attack/utility slots.</p></div>`;
}
function chGenusHtml(A,M){
  if(!A.genus)return `<div class="box small"><h3 style="margin:0 0 6px">Genus Insight</h3>Not in NCSoft's data. If an AionFlex meter user has seen your character, open your page on aionflex.gg, press "Copy build code" and paste the <b>af1.</b> code above; otherwise check it by hand in <a href="#pets" data-goto="pets">Pets &amp; Genus Insight</a>.</div>`;
  const fams={};A.genus.forEach(r=>{(fams[r.fam]=fams[r.fam]||[]).push(r)});
  return `<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Genus Insight (from AionFlex)</h3>
   <p class="small muted" style="margin:0">From your AionFlex code, last seen ${chH(chWhen(M.af1Seen))}. Some AionFlex stat numbers aren't decoded yet; those show as "stat #".</p>
   <div class="tablewrap"><table><thead><tr><th>Family</th><th>Slots</th></tr></thead><tbody>${Object.keys(fams).map(f=>`<tr><td><b>${chH(f)}</b></td><td>${fams[f].map(r=>`<span class="chline">${chTag(r.st)}${r.slot}: ${chH(r.name)} ${chH(r.val)} <span class="muted small">${chH(r.gw)}${r.note?', '+chH(r.note):''}</span></span>`).join('')}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function renderMyChar(){
  const host=$('mycharbox');if(!host)return;
  const rec=chGet();
  let h='';
  if(chNotice)h+=`<div class="callout ok small">${chNotice}</div>`;
  if(!rec){
    host.innerHTML=h+chHowTo(true)+chNote();
    chWire();return;
  }
  const slug=chSlugOf(chClassOf(rec));
  if(slug&&slug!==SLUG){
    // the saved character is another class: offer to open that class's guide instead of comparing against the wrong build
    h+=`<div class="callout warn"><b>Your loaded character, ${chH(chNameOf(rec))}, is a ${chH(ALL[slug].cls)}.</b> This is the ${chH(P.cls)} guide, so the comparison would be wrong.
      <div class="chrow" style="margin-top:8px"><button type="button" class="btn primary" data-ch="switch" data-slug="${slug}">Switch to the ${chH(ALL[slug].cls)} guide</button><button type="button" class="btn" data-ch="clear">Clear</button></div></div>`;
    host.innerHTML=h+chHowTo(false)+chNote();chWire();return;
  }
  if(!rec.ticked){
    // tick the titles NCSoft shows as equipped (so owned) in this class's title picker, once per load
    let n=0;try{n=chTickTitles(chModel(rec))}catch(e){}
    rec.ticked=true;chPut(rec);
    if(n)h+=`<div class="callout ok small">Ticked ${n} title${n>1?'s':''} you own in the <a href="#titles" data-goto="titles">Titles tab</a>.</div>`;
  }
  let M,A;
  try{M=chModel(rec);A=chAnalyse(M)}catch(e){host.innerHTML=h+`<div class="callout warn"><b>The saved character couldn't be read</b> (${chH(e.message)}). Load it again or press Clear.</div><button type="button" class="btn" data-ch="clear">Clear</button>`+chHowTo(true)+chNote();chWire();return}
  h+=chSummary(M,rec)+chTodoHtml(A)+chGearHtml(A,M)+chSkillsHtml(A,M)+chBoardsHtml(A)+chArcanaHtml(A)+chTitlesHtml(A,M)+chRuleHtml(A)+chGenusHtml(A,M)+chHowTo(false)+chNote();
  host.innerHTML=h;
  chWire();
  if(typeof decorate==='function')try{decorate(host)}catch(e){}
}
function chSay(t,bad){const m=$('chmsg');if(m){m.textContent=t;m.style.color=bad?'var(--warn)':'var(--wind)'}}
function chWire(){
  const a=$('chbm');
  if(a){
    if(CHAR_BM)a.setAttribute('href',CHAR_BM);
    a.addEventListener('click',e=>{e.preventDefault();chSay('Drag that button to your bookmarks bar, then click it on your character page on aion2.plaync.com.',false)});
  }
}
function chLoad(text){
  let parsed;
  try{parsed=chParse(text)}catch(e){chSay(e.message,true);return}
  if(parsed.kind==='url'){const host=$('mycharbox');const box=document.createElement('div');box.innerHTML=chUrlHelp(parsed);host.insertBefore(box.firstChild,host.firstChild);chSay('That is a character page link. Use the bookmark on that page, or the two links shown at the top.',false);return}
  const cur=chGet();
  let rec;try{rec=chMerge(cur,parsed)}catch(e){chSay(e.message,true);return}
  const cls=chClassOf(rec),slug=chSlugOf(cls);
  if(!slug){chSay(`The class "${cls||'unknown'}" isn't in this guide.`,true);return}
  const replaced=!!cur&&!chSame(cur,rec);
  chPut(rec);
  chNotice=`Loaded ${chH(chNameOf(rec))}${parsed.kind==='af1'?' (AionFlex code)':''}.${replaced?` It replaced ${chH(chNameOf(cur))}; only one character is kept.`:''}`;
  renderMyChar();
}
function chSwitch(slug){
  if(!ALL[slug])return;
  (STORE.c[slug]=STORE.c[slug]||{}).tab='mychar';
  S.gset('cls',slug);
  try{history.replaceState(null,'','#'+slug)}catch(e){}
  location.reload();
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-ch]');if(!b||!b.closest('#mycharbox'))return;
  const act=b.dataset.ch;
  if(act==='load'){const t=$('chpaste');chLoad(t?t.value:'')}
  else if(act==='clear'){
    // two clicks instead of confirm(): dialogs are blocked inside the claude.ai viewer
    if(b.dataset.armed!=='1'){b.dataset.armed='1';const old=b.textContent;b.textContent='Click again to remove';setTimeout(()=>{if(b.isConnected){b.dataset.armed='';b.textContent=old}},4000);return}
    chDelete();chNotice='Removed. No character is saved in the guide now (titles you ticked in the Titles tab stay ticked: that is your own checklist).';renderMyChar();
  }
  else if(act==='edit'){const d=document.querySelector('#mycharbox details.chhow');if(d){d.open=true;const t=$('chpaste');if(t)t.focus()}}
  else if(act==='switch'){chSwitch(b.dataset.slug)}
  else if(act==='copybm'){
    const ta=$('chbmcode');
    const show=()=>{if(ta){ta.hidden=false;ta.value=CHAR_BM;ta.focus();ta.select()}chSay('Select-all and copy the code in the box (Ctrl+C / Cmd+C).',false)};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(CHAR_BM).then(()=>chSay('Bookmark code copied. Make a new bookmark and paste it as the address.',false),show);else show();
  }
});
document.addEventListener('change',e=>{
  const k=e.target&&e.target.dataset&&e.target.dataset.chdone;
  if(k){const rec=chGet();if(!rec)return;rec.done=rec.done||{};rec.done[k]=e.target.checked;chPut(rec);const li=e.target.closest('li');if(li)li.classList.toggle('done',e.target.checked);return}
  const sv=e.target&&e.target.dataset&&e.target.dataset.sv;
  if(sv&&sv.startsWith('ttl-')&&chGet())renderMyChar();
});
// re-check when the PvE/PvP mode changes or your account copy loads
{const o=window.setMode;if(typeof o==='function')window.setMode=function(){const r=o.apply(this,arguments);try{renderMyChar()}catch(e){}return r}}
{const o=window.applyStore;if(typeof o==='function')window.applyStore=function(){const r=o.apply(this,arguments);try{renderMyChar()}catch(e){}return r}}
renderMyChar();

/* ---------- Simulator tab + DPS estimates for "My character" ----------
   The engine (sim/engine.js + sim/simdata/bundle.js, ~0.5 MB) is NOT run when the page opens.
   Split build: build_hub.py writes it to data/sim.js and sets SIMSRC; it is added as a <script> the first time the
   Simulator tab opens or My character needs estimates. Single-file build: the same code sits in
   <script type="text/plain" id="aionsim-src"> (not parsed as JS) and is run on demand.
   Hook used by char_fn.js: window.AionSim.estimateGain({slug, mode, model, action}) -> estimated % DPS gain, or null.
   It answers from a per-character cache (memory only); unknown steps are queued, simulated in small setTimeout slices
   while the My character tab is open, then My character is re-rendered so its list sorts by gain per cost. */
(function(){
'use strict';
const SIMCL=['assassin','chanter','cleric','gladiator','ranger','sorcerer','spiritmaster','templar'];
const HAS=SIMCL.indexOf(SLUG)>=0;
const H=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.round(Number(n)||0).toLocaleString('en-US');
const sgn=(x,d)=>(x>=0?'+':'−')+Math.abs(x).toFixed(d==null?1:d)+'%';
const now=()=>(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const sdev=a=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/(a.length-1))};
const quant=(a,q)=>{const s=a.slice().sort((x,y)=>x-y);return s.length?s[Math.min(s.length-1,Math.max(0,Math.round(q*(s.length-1))))]:0};
const tabOpen=id=>{const el=document.getElementById(id);return !!el&&!el.hidden};
const D=()=>window.AION_SIMDATA&&window.AION_SIMDATA.classes&&window.AION_SIMDATA.classes[SLUG];
const FIGHTS=40, WORTH_FIGHTS=24, EST_FIGHTS=12;

/* ---------- loading the engine on demand ---------- */
let engine='idle';const waiters=[];
function engineReady(){return !!(window.AionSim&&typeof window.AionSim.simulate==='function'&&window.AION_SIMDATA&&window.AION_SIMDATA.classes)}
function loadEngine(cb){
  if(engine==='ready'){cb(true);return}
  if(engine==='failed'){cb(false);return}
  waiters.push(cb);if(engine==='loading')return;
  engine='loading';
  const done=ok=>{engine=ok?'ready':'failed';if(ok)window.AionSim.estimateGain=estimateGain;waiters.splice(0).forEach(f=>{try{f(ok)}catch(e){}})};
  if(typeof SIMSRC!=='undefined'&&SIMSRC){
    const s=document.createElement('script');s.src=SIMSRC;s.async=true;
    s.onload=()=>done(engineReady());s.onerror=()=>done(false);
    document.head.appendChild(s);
  }else{
    const src=document.getElementById('aionsim-src');
    if(!src){setTimeout(()=>done(false),0);return}
    setTimeout(()=>{
      try{const s=document.createElement('script');s.textContent=src.textContent;document.head.appendChild(s)}catch(e){}
      if(!engineReady()){try{(0,eval)(src.textContent)}catch(e){}}
      done(engineReady());
    },30);
  }
}

/* ---------- running fights in small slices so the page stays responsive ---------- */
// every job runs the same n fights (same seeds), so differences between jobs are paired and low-noise
function runJobs(jobs,n,onTick,onDone,stale){
  const A=window.AionSim,total=jobs.length*n;let j=0,i=0,count=0;
  jobs.forEach(x=>{x.dps=[];x.agg={};x.err=null;x.log=null;x.dur=0});
  function step(){
    if(stale&&stale())return;
    const t0=now();
    while(j<jobs.length&&now()-t0<30){
      const jb=jobs[j];
      try{
        const r=A.simulate(Object.assign({},jb.cfg,{iterations:1,seed:1+i*7919}));
        jb.dps.push(r.dps);if(!jb.log){jb.log=r.log||[];jb.dur=r.duration;jb.boss=r.boss}
        (r.perSkill||[]).forEach(p=>{const g=jb.agg[p.name]||(jb.agg[p.name]={name:p.name,damage:0,casts:0,hits:0,crits:0});g.damage+=p.damage;g.casts+=p.casts;g.hits+=p.hits;g.crits+=(p.critRate||0)*p.hits});
        count++;i++;
      }catch(e){jb.err=String(e&&e.message||e);count+=n-i;i=n}
      if(i>=n){i=0;j++}
    }
    if(onTick)onTick(count,total,j<jobs.length?jobs[j]:null);
    if(j<jobs.length)setTimeout(step,0);else onDone(jobs);
  }
  setTimeout(step,0);
}

/* ---------- reading the loaded character into a stat sheet ---------- */
const LINE={'attack':'gearAttack','critical hit':'crit','combat speed':'combatSpeed','damage boost':'damageBoost','weapon damage boost':'weaponDamageBoost',
  'critical damage boost':'critDamageBoost','multi-hit chance':'multiHit','double chance':'double','perfect chance':'perfect','attack increase':'attackIncrease',
  'attack bonus':'attackBonus','pve attack':'pveAttack','boss attack':'bossAttack','pve damage boost':'pveDamageBoost','boss damage boost':'bossDamageBoost',
  'back attack':'backAttack','front attack':'frontAttack','critical attack':'critAttack','back attack damage boost':'backDamageBoost',
  'front attack damage boost':'frontDamageBoost','cooldown reduction':'cooldownReduction','accuracy':'accuracy','accuracy bonus':'accuracy',
  'penetration':'penetration','power shard damage bonus':'powerShardBonus','might':'_might','precision':'_precision'};
const NODPS=/^(hp|mp|defense|defense bonus|evasion|evasion bonus|block|natural (hp|mp) regen|regeneration|move speed|incoming heal|endurance|.*resist|.*tolerance|.*defense|dexterity|constitution|willpower|status effect chance|hp potion recovery increase)$/i;
const lineKey=n=>LINE[String(n||'').toLowerCase().replace(/\s+/g,' ').trim()]||null;
const lineVal=v=>{const x=parseFloat(String(v==null?'':v).replace(/[+,%\s]/g,''));return isFinite(x)?x:0};
const ACC=['necklace','ear1','ear2','ring1','ring2','bracelet','belt','amulet'];
function itemOf(rec,g){return g&&rec&&rec.official&&rec.official.items?rec.official.items[g.pos]:null}
function charRead(rec,M){
  const R={};const add=(k,v)=>{if(k&&isFinite(v)&&v)R[k]=(R[k]||0)+v};
  (M.gear||[]).concat(M.arcana||[]).forEach(g=>{
    (g.soul||[]).forEach(l=>{if(!l.skill)add(lineKey(l.name),lineVal(l.value))});
    (g.stones||[]).forEach(s=>{let v=lineVal(s.value);if(/damage boost$/i.test(s.name)&&!/%/.test(String(s.value)))v/=100;add(lineKey(s.name),v)});
    const it=itemOf(rec,g);
    ((it&&it.mainStats)||[]).forEach(m=>{const k=lineKey(m.name);if(!k||k==='gearAttack'||k==='crit'||k==='accuracy'||k[0]==='_')return;add(k,lineVal(m.value)+lineVal(m.extra))});
  });
  for(const b in (M.boards||{}))((M.boards[b]||{}).statEff||[]).forEach(e=>{const m=String(e.desc||'').match(/^(.+?) \+([\d.]+)%?$/);if(m&&!/^pvp /i.test(m[1]))add(lineKey(m[1]),Number(m[2]))});
  return R;
}
function inheritRanks(d,ranks){
  Object.keys(d.skills).forEach(n=>{(d.skills[n].combo||[]).forEach(step=>{if(ranks[n])ranks[step]=ranks[n]})});
  Object.keys(d.skills).forEach(n=>{const s=d.skills[n];if(s.rankFrom&&ranks[s.rankFrom])ranks[n]=ranks[s.rankFrom]});
}
// typed-in panel totals are tied to the character by a hash, so no name is stored (My character's Clear leaves no trace)
function whoOf(M){let h=5381;const s=String(M.name||'').toLowerCase()+'|'+String(M.serverId||'');for(let i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;return 'h'+h.toString(36)}
function panelTyped(M){const p=settings().panel||{};return p.who&&p.who===whoOf(M)?p:{}}
function buildCharCfg(d,rec,M){
  const tiers=['median','p10','top'].filter(t=>d.sheets&&d.sheets[t]&&d.sheets[t].stats);
  if(!tiers.length)return null;
  const cps=tiers.map(t=>Number(d.sheets[t].combatPower)||0);
  const cp=Number(M.cp)||cps[0];
  let lo=0;while(lo<tiers.length-2&&cp>cps[lo+1])lo++;
  const hi=Math.min(lo+1,tiers.length-1),a=d.sheets[tiers[lo]].stats,b=d.sheets[tiers[hi]].stats;
  const t=hi===lo?0:Math.max(0,Math.min(1,(cp-cps[lo])/Math.max(1,cps[hi]-cps[lo])));
  const st={},src={};
  Object.keys(Object.assign({},a,b)).forEach(k=>{const x=a[k],y=b[k];st[k]=typeof x==='number'&&typeof y==='number'?x+(y-x)*t:(typeof y==='number'?y:x);src[k]='est'});
  let tier=tiers[0];tiers.forEach((tn,i)=>{if(Math.abs(cps[i]-cp)<Math.abs(cps[tiers.indexOf(tier)]-cp))tier=tn});
  const R=charRead(rec,M),Ps=M.stats||{},hasP=Ps.STR!=null,seen={};
  const setR=(k,v)=>{if(v==null||!isFinite(v))return;st[k]=v;src[k]='read'};
  const setLB=(k,v)=>{if(!isFinite(v)||v<=0)return;seen[k]=v;if(v>=(st[k]||0)){st[k]=v;src[k]='read'}else src[k]='mix'};
  if(hasP){
    setR('attackIncrease',((Ps.STR||0)+(Ps.Destruction||0))/10+(R.attackIncrease||0));
    setR('critIncrease',((Ps.AGI||0)+(Ps.Death||0))/10);
    setR('accuracyIncrease',((Ps.AGI||0)+(Ps.Freedom||0))/10);
  }else if(R._might)setR('attackIncrease',R._might/10+(R.attackIncrease||0));
  const dz=k=>(Number(Ps[k])||0)/10;
  setLB('double',dz('Wisdom')+(R.double||0));
  setLB('perfect',dz('Justice')+(R.perfect||0));
  setLB('cooldownReduction',dz('Illusion')+(R.cooldownReduction||0));
  setLB('combatSpeed',dz('Time')+(R.combatSpeed||0));
  ['multiHit','weaponDamageBoost','damageBoost','critDamageBoost','pveDamageBoost','pveAttack','bossAttack','backAttack','critAttack'].forEach(k=>setLB(k,R[k]||0));
  setLB('attackBonus',61+(R.attackBonus||0));
  const w=(M.gear||[]).find(g=>g.slot==='MainHand'),wi=itemOf(rec,w);
  const wa=wi&&(wi.mainStats||[]).find(m=>m.name==='Attack'&&!m.exceed);
  if(wa&&wa.minValue!=null){const ex=lineVal(wa.extra);setR('weaponMin',lineVal(wa.minValue)+ex);setR('weaponMax',lineVal(wa.value)+ex)}
  const typed=panelTyped(M);
  [['attack','attack'],['crit','crit'],['combatSpeed','cs']].forEach(([k,f])=>{const v=Number(typed[f]);if(typed[f]!==''&&typed[f]!=null&&isFinite(v)&&v>0){st[k]=v;src[k]='typed'}});
  // stats the character page cannot show (pets, hidden sources): same fitted correction the class sheets get
  const adj=(((window.AionSim.param&&window.AionSim.param('sheetAdjust'))||{})[SLUG]||{})[tier]||{};
  Object.keys(adj).forEach(k=>{if(typeof st[k]==='number')st[k]+=adj[k]});
  const ranks=Object.assign({},(d.defaults&&d.defaults.ranks&&(d.defaults.ranks[tier]||d.defaults.ranks.median))||{});
  let nR=0;(M.skills||[]).forEach(s=>{const def=d.skills[s.name];if(def&&s.level>0&&def.type!=='stigma'){ranks[s.name]=s.level;nR++}});
  inheritRanks(d,ranks);
  const stig=(M.skills||[]).filter(s=>s.cat==='Dp'&&s.equip&&s.level>0&&d.skills[s.name]&&d.skills[s.name].type==='stigma');
  const cfg={'class':SLUG,statSheet:tier,stats:st,ranks};
  if(stig.length){cfg.stigmas=stig.map(s=>s.name);cfg.stigmaLevels={};stig.forEach(s=>{cfg.stigmaLevels[s.name]=s.level})}
  let nP=0;const perks={};(M.skills||[]).forEach(s=>{const def=d.skills[s.name];if(def&&def.specs&&Array.isArray(s.specs)){perks[s.name]=s.specs.filter(x=>def.specs[x]);nP++}});
  if(nP)cfg.perks=perks;
  const known=window.AionSim.listTheostones?window.AionSim.listTheostones():[];
  const th=((w&&w.theo)||[]).filter(n=>known.indexOf(n)>=0);
  if(th.length)cfg.theostone=th;
  return {cfg,src,seen,tier,cp,M,rec,d,name:M.name,read:{ranks:nR,stigmas:stig.length,perks:nP,theo:th}};
}
function myChar(){
  if(typeof chGet!=='function'||typeof chModel!=='function')return null;
  const rec=chGet();if(!rec)return null;
  try{if(typeof chSlugOf==='function'&&chSlugOf(chClassOf(rec))!==SLUG)return null}catch(e){return null}
  return rec;
}
function myCharCfg(){const rec=myChar(),d=D();if(!rec||!d)return null;try{return buildCharCfg(d,rec,chModel(rec))}catch(e){return null}}

/* ---------- turning a "Do these next" step into a stat / rank / perk change ---------- */
function gearOf(cc,key){const SK=(typeof CH_SLOTKEY!=='undefined')?CH_SLOTKEY:{};return (cc.M.gear||[]).find(g=>SK[g.slot]===key)}
function enhDelta(cc,s,amp){
  const dl=(Number(s.to)||0)-(Number(s.from)||0);if(dl<=0)return null;
  const g=gearOf(cc,s.slot),it=itemOf(cc.rec,g),lv=g?(amp?g.exceed:g.enh):0,out={};
  const isW=s.slot==='weapon',isG=s.slot==='guard',isA=ACC.indexOf(s.slot)>=0;let got=false;
  if(it&&lv>0)(it.mainStats||[]).forEach(m=>{
    if(!!m.exceed!==amp)return;const k=lineKey(m.name),ex=lineVal(m.extra);if(!k||!ex||k[0]==='_')return;got=true;const per=ex/lv*dl;
    if(k==='gearAttack'&&isW&&!amp){out.weaponMin=(out.weaponMin||0)+per;out.weaponMax=(out.weaponMax||0)+per}else out[k]=(out[k]||0)+per;
  });
  if(!got){ // typical per-level values (from a +15/+5 Splendent set) when the item shows no bonus yet
    if(amp){if(isW){out.gearAttack=14.6*dl;out.damageBoost=dl}else if(isG){out.gearAttack=8.6*dl;out.damageBoost=0.6*dl}}
    else if(isW){out.weaponMin=11.6*dl;out.weaponMax=11.6*dl}else if(isG)out.gearAttack=11.6*dl;else if(isA)out.gearAttack=3.8*dl;
  }
  return out; // armor: {} = no damage stat (Defense/HP only)
}
function poolMid(slot,name){
  const P=(typeof ROLLS!=='undefined'&&ROLLS&&ROLLS.pools)||{};
  const pool=P[slot]||P[{ear1:'earring',ear2:'earring',ring1:'ring',ring2:'ring'}[slot]]||{};
  for(const l of pool.soulBinding||[]){const m=String(l).match(/^(.+?) \+([\d.]+)-([\d.]+)%? \(/);if(m&&m[1].toLowerCase()===String(name).toLowerCase())return (Number(m[2])+Number(m[3]))/2}
  return null;
}
function statFromLine(cc,name,v,out,sign){
  const k=lineKey(name);if(!k)return NODPS.test(String(name).trim());
  if(k==='_might')out.attackIncrease=(out.attackIncrease||0)+sign*v/10;
  else if(k==='_precision')out.crit=(out.crit||0)+sign*(cc.cfg.stats.crit||1000)*v/1000;
  else out[k]=(out[k]||0)+sign*v;
  return true;
}
function syncDelta(cc,s){
  const R=typeof rollSlot==='function'?rollSlot('pve',s.slot):null,best=(R&&R.best)||[],g=gearOf(cc,s.slot),soul=(g&&g.soul)||[];
  const have=new Set(soul.map(l=>(l.skill?'+1 '+l.skill:String(l.name)).toLowerCase())),used=new Set(),stats={},ranks={};let any=false;
  (s.lines||[]).forEach(bad=>{
    const cur=soul.find(l=>l.name===bad);
    if(cur&&cur.skill){if(cc.d.skills[cur.skill])ranks[cur.skill]=(ranks[cur.skill]||0)-(Number(cur.level)||1)}
    else if(cur)statFromLine(cc,bad,lineVal(cur.value),stats,-1);
    for(const b of best){
      const nm=String(b).split(' / ')[0].replace(/\s*\(.*$/,'').trim(),lk=nm.toLowerCase();if(have.has(lk)||used.has(lk))continue;
      const sk=nm.match(/^\+1 (.+)$/);
      if(sk){if(cc.d.skills[sk[1]]){ranks[sk[1]]=(ranks[sk[1]]||0)+1;used.add(lk);any=true;break}continue}
      const v=poolMid(s.slot,nm);if(v==null||!lineKey(nm))continue;
      statFromLine(cc,nm,v,stats,1);used.add(lk);any=true;break;
    }
  });
  return any?{stats,ranks}:null;
}
const MAPPABLE={enhance:1,amplify:1,stones:1,sync:1,skill:1,perks:1,stigma:1,stigmaLevel:1,daevanion:1};
function variantCfg(cc,a){
  const d=cc.d,cfg=JSON.parse(JSON.stringify(cc.cfg)),sa={};
  const add=(k,v)=>{if(k&&isFinite(v)&&v)sa[k]=(sa[k]||0)+v};
  const ranks=cfg.ranks=Object.assign({},typeof cfg.ranks==='object'?cfg.ranks:{});
  const df=d.defaults||{},tier=cfg.statSheet||'median';
  const curStig=()=>(cfg.stigmas||((df.stigmas&&(df.stigmas[tier]||df.stigmas.median))||[])).slice();
  const stLv=n=>(cfg.stigmaLevels&&cfg.stigmaLevels[n])||((df.stigmaLevels&&(df.stigmaLevels[tier]||{}))||{})[n]||ranks[n]||0;
  let mapped=false;const T=a.type;
  if(T==='enhance'||T==='amplify')(a.slots||[]).forEach(s=>{const r=enhDelta(cc,s,T==='amplify');if(r){mapped=true;Object.keys(r).forEach(k=>add(k,r[k]))}});
  else if(T==='stones'){const n=a.fill?a.fill.reduce((x,f)=>x+(Number(f.n)||0),0):2;if(n>0){add('gearAttack',4*n);mapped=true}}
  else if(T==='sync')(a.slots||[]).forEach(s=>{const r=syncDelta(cc,s);if(!r)return;mapped=true;Object.keys(r.stats).forEach(k=>add(k,r.stats[k]));Object.keys(r.ranks).forEach(k=>{ranks[k]=Math.max(1,(ranks[k]||1)+r.ranks[k])})});
  else if(T==='skill')(a.changes||[]).forEach(c=>{if(d.skills[c.skill]&&Number(c.to)>Number(c.from)){ranks[c.skill]=(ranks[c.skill]||Number(c.from)||1)+(c.to-c.from);mapped=true}});
  else if(T==='perks'){cfg.perks=Object.assign({},cfg.perks||{});(a.skills||[]).forEach(p=>{const def=d.skills[p.skill];if(def&&def.specs){cfg.perks[p.skill]=(p.want||[]).filter(x=>def.specs[x]);mapped=true}})}
  else if(T==='stigma'){
    const cur=curStig(),rem=a.remove||[],addN=(a.add||[]).filter(n=>d.skills[n]&&d.skills[n].type==='stigma');
    if(addN.length){
      const lvRem=rem.map(stLv).filter(Boolean);
      const next=addN.concat(cur.filter(n=>rem.indexOf(n)<0&&addN.indexOf(n)<0)).slice(0,Math.max(4,cur.length));
      cfg.stigmaLevels=Object.assign({},cfg.stigmaLevels||{});
      addN.forEach((n,i)=>{const k=(cc.M.skills||[]).find(s=>s.name===n&&s.level>0);cfg.stigmaLevels[n]=k?k.level:(lvRem[i]||stLv(n)||5)});
      cfg.stigmas=next;mapped=true;
    }
  }
  else if(T==='stigmaLevel'){const cur=curStig();cfg.stigmaLevels=Object.assign({},cfg.stigmaLevels||{});(a.skills||[]).forEach(s=>{if(cur.indexOf(s.skill)>=0&&Number(s.to)>0){cfg.stigmaLevels[s.skill]=Number(s.to);mapped=true}})}
  else if(T==='daevanion'){
    const B=(typeof DATA!=='undefined'&&DATA&&DATA.boards)||[];
    (a.boards||[]).forEach(bb=>{const b=B.find(x=>x.name===bb.board);if(!b)return;(bb.targets||[]).forEach(key=>{
      const n=(b.nodes||[]).find(x=>x[0]+','+x[1]===key);if(!n)return;const m=String(n[4]).match(/^(.+?) \+([\d.]+)%?$/);if(!m)return;
      if(d.skills[m[1]]){ranks[m[1]]=(ranks[m[1]]||1)+Number(m[2]);mapped=true}
      else if(n[5]!=='SkillLevel'){const o={};if(statFromLine(cc,m[1],Number(m[2]),o,1)){mapped=true;Object.keys(o).forEach(k=>add(k,o[k]))}}
    })});
  }
  if(!mapped)return null;
  inheritRanks(d,ranks);
  if(Object.keys(sa).length){cfg.statsAdd=Object.assign({},cfg.statsAdd||{});Object.keys(sa).forEach(k=>{cfg.statsAdd[k]=(cfg.statsAdd[k]||0)+sa[k]})}
  return cfg;
}

/* ---------- estimateGain: the hook char_fn.js calls ---------- */
const EST={key:null,cc:null,base:null,gains:{},queue:[],queued:{},running:false,model:null};
const EST_FIGHT={boss:'Divine Auldor',duration:'boss',rotation:'guide',partyBuffs:'typical',consumables:'typical'};
function charKey(M){return [M.name,M.serverId,M.fetched,M.af1Seen,M.cp,M.level,JSON.stringify(panelTyped(M))].join('|')}
function estimateGain(o){
  try{
    if(!o||!HAS||o.slug!==SLUG||o.mode!=='pve'||!o.action||!o.model||engine==='failed')return null;
    const key=charKey(o.model);
    if(EST.key!==key){Object.assign(EST,{key,cc:null,base:null,gains:{},queue:[],queued:{},model:o.model})}
    const ak=JSON.stringify(o.action);
    if(Object.prototype.hasOwnProperty.call(EST.gains,ak))return EST.gains[ak];
    if(!MAPPABLE[o.action.type]){EST.gains[ak]=null;return null}
    if(!EST.queued[ak]){EST.queued[ak]=1;EST.queue.push({ak,action:o.action})}
    clearTimeout(EST.t);EST.t=setTimeout(processEstimates,60);
    return null;
  }catch(e){return null}
}
function charNote(t){
  const ol=document.querySelector('#mycharbox ol.chtodo');if(!ol)return;
  let p=document.getElementById('simcharnote');
  if(!p){p=document.createElement('p');p.id='simcharnote';p.className='small muted';p.style.margin='0';p.setAttribute('role','status');ol.parentNode.insertBefore(p,ol)}
  p.textContent=t;
}
function processEstimates(){
  if(EST.running||!EST.queue.length||!tabOpen('mychar'))return;
  EST.running=true;const myKey=EST.key;
  charNote('Simulator: loading…');
  loadEngine(ok=>{
    if(!ok){EST.running=false;charNote('');return}
    if(EST.key!==myKey){EST.running=false;processEstimates();return}
    if(!EST.cc){try{const rec=myChar();const cc=rec&&D()?buildCharCfg(D(),rec,EST.model):null;if(cc){Object.assign(cc.cfg,EST_FIGHT);EST.cc=cc}}catch(e){EST.cc=null}}
    const items=EST.queue.splice(0);
    if(!EST.cc){items.forEach(q=>{EST.gains[q.ak]=null});EST.running=false;charNote('');return}
    const jobs=[];if(!EST.base)jobs.push({cfg:EST.cc.cfg,base:true});
    items.forEach(q=>{let cfg=null;try{cfg=variantCfg(EST.cc,q.action)}catch(e){cfg=null}if(cfg)jobs.push({cfg,q});else EST.gains[q.ak]=null});
    if(!jobs.some(j=>j.q)){EST.running=false;charNote('');return}
    const t0=now();
    // no stale-check here: a run always finishes (about a second) and its results are dropped if the character changed
    runJobs(jobs,EST_FIGHTS,(c,t)=>charNote(`Simulator: estimating the damage gain of each step… ${Math.round(c/t*100)}%`),js=>{
      EST.running=false;
      if(EST.key!==myKey){processEstimates();return}
      js.forEach(j=>{if(j.base&&!j.err)EST.base={mean:mean(j.dps)}});
      js.forEach(j=>{if(j.q)EST.gains[j.q.ak]=(j.err||!EST.base||!EST.base.mean)?null:Math.max(0,Math.round((mean(j.dps)/EST.base.mean-1)*1000)/10)});
      EST.ms=now()-t0;
      if(EST.queue.length){processEstimates();return}
      rerenderChar();
    });
  });
}
function rerenderChar(){
  if(typeof renderMyChar!=='function'||!tabOpen('mychar'))return;
  const ae=document.activeElement;
  if(ae&&ae.id==='chpaste'&&ae.value){setTimeout(rerenderChar,1500);return}
  try{renderMyChar()}catch(e){}
  const tag=[...document.querySelectorAll('#mycharbox .tag.t-best')].find(x=>/\(sim\)/.test(x.textContent));
  const ol=document.querySelector('#mycharbox ol.chtodo');
  if(tag&&ol&&!document.getElementById('simcharnote')){
    const p=document.createElement('p');p.id='simcharnote';p.className='small muted';p.style.margin='0';
    p.innerHTML=`DPS gains: simulated on Divine Auldor with the guide's macro, from your loaded stats (${EST_FIGHTS} fights per step). Steps the simulator can't price (titles, Arcana, Genus Insight, new gear) keep their usual place. <a href="#simulator" data-goto="simulator">Open the simulator →</a>`;
    ol.parentNode.insertBefore(p,ol);
  }
}
function charTabShown(){
  if(!HAS||engine==='failed'||(typeof MODE!=='undefined'&&MODE==='pvp'))return;
  if(EST.queue.length){processEstimates();return}
  const rec=myChar();if(!rec)return;
  // fill the queue: char_fn's analysis calls estimateGain for every step
  try{chAnalyse(chModel(rec))}catch(e){}
}

/* ---------- the guide's own perks and Stigmas for "This guide's macro" ----------
   Same rule as the offline optimisation: sim/opt/lib.js guideConfig (perk rows text-matched to the engine's specs at each
   sheet's skill ranks, every skill with specs gets an explicit list; guide Stigmas with sheet levels) plus the follow-up
   corrections of sim/opt/central_fix.js (chanter_mirror, sorcerer_mirror, cleric_fix, Gladiator follow-ups, Assassin Ambush). */
const PSTOP=new Set(['the','a','an','on','of','to','and','or','for','with','in','at','is','by','it','skill','skills','then','keep','every','stage','only','use']);
const ptok=s=>String(s).toLowerCase().replace(/\[\d+\]/g,' ').replace(/[^a-z0-9%+\-]+/g,' ').split(/\s+/).filter(x=>x&&!PSTOP.has(x));
const PALIAS=[[/usable while moving/i,'changes to mobile skill'],[/always crits?/i,'lands as critical hit'],[/single-target bonus/i,'less targets hit boost']];
function perkMatch(gt0,specs){
  if(!gt0||!specs)return 0;
  const rk=(String(gt0).match(/\[(\d+)\]/)||[])[1];let gt=String(gt0).split('(')[0];
  PALIAS.forEach(([re,rep])=>{gt=gt.replace(re,rep)});
  const g=new Set(ptok(gt));let best=0,bs=0;
  Object.keys(specs).forEach(k=>{const sp=specs[k];let sc=ptok(sp.text||'').filter(x=>g.has(x)).length;if(rk&&String(sp.unlock)===rk)sc+=0.5;if(sc>bs){bs=sc;best=+k}});
  return bs>=1.5?best:0;
}
const slotsAt=r=>r>=20?3:r>=12?2:r>=8?1:0;
function rowPerksAt(row,specs,rank){
  const want=[];
  [row.s1,row.s2,row.s3].forEach(t=>{const sl=perkMatch(t,specs);if(!sl)return;const u=specs[sl].unlock||0;if(u<=rank&&want.length<slotsAt(rank)&&want.indexOf(sl)<0)want.push(sl)});
  return want;
}
// follow-up / chain skills that carry their root's perks (and, for the Chanter, its rank) in the offline runs
const FOLLOW={chanter:{'Onslaught':['Resonance Crush','Bolt Crush','Storm Chain'],'Incandescent Blow':['Bursting Blow'],'Dark Crush':['Piercing Strike']},
  sorcerer:{'Flame Arrow':['Burst','Pyroclasm'],'Ice Chain':['Cold Wave']},cleric:{'Condemnation':['Condemnation (EP)']}};
function mirrorFollow(d,perks){
  const M=FOLLOW[SLUG]||{};
  Object.keys(M).forEach(root=>{if(!Array.isArray(perks[root]))return;M[root].forEach(f=>{if(!d.skills[f])return;
    perks[f]=SLUG==='sorcerer'?perks[root].filter(k=>d.skills[f].specs&&d.skills[f].specs[k]):perks[root].slice()})});
  if(SLUG==='gladiator'){const rb=perks['Rending Blow']||[],os=perks['Overhead Slam']||[];
    if(d.skills['Smashing Blow'])perks['Smashing Blow']=[1,4].filter(k=>rb.indexOf(k)>=0);
    if(d.skills['Upward Strike'])perks['Upward Strike']=os.indexOf(4)>=0?[4]:[]}
  return perks;
}
const GUIDE={};
function guideSetup(tier){
  if(GUIDE[tier])return GUIDE[tier];
  const d=D(),df=(d&&d.defaults)||{},pick=o=>(o&&(o[tier]||o.median))||{};
  const rows=(typeof C!=='undefined'&&C&&C.perks&&Array.isArray(C.perks.rows))?C.perks.rows:null;
  const stig=(typeof C!=='undefined'&&C&&Array.isArray(C.stigmasPve))?C.stigmasPve.map(s=>s&&s.name).filter(n=>n&&d.skills[n]):[];
  if(!d||!rows)return null;
  const ranks=pick(df.ranks),perks={};
  Object.keys(d.skills).forEach(n=>{const s=d.skills[n];if(s.specs&&Object.keys(s.specs).length&&s.type!=='stigma')perks[n]=[]});
  rows.forEach(r=>{const s=d.skills[r.skill];if(!s||!s.specs)return;perks[r.skill]=rowPerksAt(r,s.specs,ranks[r.skill]||s.defaultRank||1)});
  if(SLUG==='assassin'&&perks.Ambush)perks.Ambush=perks.Ambush.map(k=>k===1?2:k===2?1:k); // simdata numbers Ambush slots 1/2 the other way round
  mirrorFollow(d,perks);
  const out={perks};
  if(stig.length){
    const lv=pick(df.stigmaLevels),vals=Object.values(lv).sort((a,b)=>b-a),sl={};
    stig.forEach((s,i)=>{sl[s]=lv[s]!=null?lv[s]:vals[Math.min(i,vals.length-1)]});
    out.stigmas=stig;out.stigmaLevels=sl;
  }
  if(SLUG==='chanter'){const rk={};Object.keys(FOLLOW.chanter).forEach(root=>{if(ranks[root])FOLLOW.chanter[root].forEach(f=>{rk[f]=ranks[root]})});out.ranks=rk}
  return GUIDE[tier]=out;
}

/* ---------- the Simulator tab ---------- */
const STATS=[
  {k:'gearAttack',n:'Attack',amt:45,u:'',src:'weapon Soul Binding line (38–51)'},
  {k:'pveAttack',n:'PvE Attack',amt:50,u:'',src:'a good Genus Insight / title line'},
  {k:'attackBonus',n:'Attack Bonus',amt:30,u:'',src:"one Daevanion board's Attack Bonus nodes"},
  {k:'damageBoost',n:'Damage Boost',amt:6.8,u:'%',src:'weapon Soul Binding line (6.3–7.3%)'},
  {k:'weaponDamageBoost',n:'Weapon Damage Boost',amt:9,u:'%',src:'weapon Soul Binding line (8.3–9.6%)'},
  {k:'critDamageBoost',n:'Critical Damage Boost',amt:12,u:'%',src:'shoulders Soul Binding line (11.1–12.8%)'},
  {k:'crit',n:'Critical Hit',amt:67,u:'',src:'weapon Soul Binding line (59–75)'},
  {k:'double',n:'Double',amt:1.9,u:'%',src:'helmet Soul Binding line (1.8–2.1%)'},
  {k:'combatSpeed',n:'Combat Speed',amt:12,u:'%',src:'weapon Soul Binding line (11.2–13%)'},
  {k:'cooldownReduction',n:'Cooldown Reduction',amt:3,u:'%',src:'the two Daevanion Cooldown nodes (1.5% each)'},
  {k:'accuracy',n:'Accuracy',amt:88,u:'',src:'weapon Soul Binding line (79–98)'}];
const BOSSES=[['Divine Auldor','Divine Auldor (Urugugu Canyon)'],["Kromede's Desire","Kromede's Desire (Fire Temple)"],['Training Scarecrow','Training dummy']];
const ROTS=[['guide',"This guide's macro"],['community','What typical players press']];
const SRCW={read:'your character',mix:'typical for your Combat Power',est:'estimated from your Combat Power',typed:'you typed it'};
let gen=0,built=false;
function settings(){let s={};try{s=S.get('sim',{})||{}}catch(e){}return Object.assign({sheet:'median',boss:'Divine Auldor',dur:'boss',rot:'guide',party:true,cons:true},s)}
function saveSettings(p){try{S.set('sim',Object.assign(settings(),p))}catch(e){}}
function bossInfo(name){const L=(window.AION_SIMDATA&&window.AION_SIMDATA.bosses&&window.AION_SIMDATA.bosses.bosses)||[];return L.find(b=>b.name===name)||{}}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const mmss=s=>Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0');
function uiConfig(st){
  const base={boss:st.boss,duration:st.dur==='boss'?'boss':Number(st.dur)||180,rotation:st.rot,partyBuffs:st.party?'typical':'none',consumables:st.cons?'typical':'none'};
  if(st.sheet==='mine'){const cc=myCharCfg();if(cc)return {cfg:Object.assign(cc.cfg,base),cc}}
  const tier=st.sheet==='p10'?'p10':'median';
  const cfg=Object.assign({'class':SLUG,statSheet:tier,ranks:tier},base);
  // the guide's macro runs with the guide's perks and Stigmas; "what typical players press" keeps the community ones
  const g=st.rot==='guide'?guideSetup(tier):null;
  if(g){cfg.perks=JSON.parse(JSON.stringify(g.perks));if(g.stigmas){cfg.stigmas=g.stigmas.slice();cfg.stigmaLevels=Object.assign({},g.stigmaLevels)}if(g.ranks&&Object.keys(g.ranks).length)cfg.ranks=Object.assign({},g.ranks)}
  return {cfg,cc:null};
}
function resolved(cfg){
  const d=D(),df=d.defaults||{},tier=typeof cfg.statSheet==='string'?cfg.statSheet:'median',pick=o=>(o&&(o[tier]||o.median))||{};
  const rk=Object.assign({},pick(df.ranks),typeof cfg.ranks==='object'?cfg.ranks:{});
  const sl=Object.assign({},pick(df.stigmaLevels),cfg.stigmaLevels||{});
  return {perks:Object.assign({},pick(df.perks),cfg.perks||{}),stigmas:cfg.stigmas||(df.stigmas&&(df.stigmas[tier]||df.stigmas.median))||[],sl,rk,lv:n=>sl[n]||rk[n]||1};
}
function setupLabel(st,cc){
  const sh=st.sheet==='mine'&&cc?`${H(cc.name||'your character')}'s stats`:st.sheet==='p10'?'top-10% stats':'typical stats';
  const bi=bossInfo(st.boss),dur=st.dur==='boss'?(bi.fightSec||180):Number(st.dur);
  return `${sh}, ${H((BOSSES.find(b=>b[0]===st.boss)||[0,st.boss])[1])}, ${mmss(dur)} fight, ${H((ROTS.find(r=>r[0]===st.rot)||[0,''])[1].toLowerCase())}${st.sheet==='mine'&&cc?'':st.rot==='guide'?" with the guide's perks and Stigmas":" with typical players' perks and Stigmas"}, party buffs ${st.party?'on':'off'}, consumables ${st.cons?'on':'off'}`;
}
function prog(t){const p=$('simprog');if(p)p.textContent=t}
function openSim(){
  const host=$('simbox');if(!host||built)return;
  if(!HAS){built=true;host.innerHTML=`<div class="callout"><b>The ${H(P.cls)} isn't simulated yet.</b> It is Korea-only, and the Global skill numbers (% of Attack per skill) the simulator needs aren't out. The other eight classes are covered.</div>`;return}
  if(engine!=='ready'){
    host.innerHTML='<p class="muted" id="simload">Loading the simulator (about 0.5 MB, only the first time you open this tab)…</p>';
    loadEngine(ok=>{if(ok){built=false;openSim()}else{const l=$('simload');if(l)l.textContent='The simulator could not load in this browser. The rest of the guide works as usual.'}});
    return;
  }
  built=true;renderSim();
}
function sheetOptions(st){
  const d=D(),cc=myCharCfg(),cp=t=>d.sheets[t]&&d.sheets[t].combatPower?` (~${Math.round(d.sheets[t].combatPower/1000)}K CP)`:'';
  let h=`<option value="median"${st.sheet==='median'?' selected':''}>Typical player${cp('median')}</option><option value="p10"${st.sheet==='p10'?' selected':''}>Top 10% player${cp('p10')}</option>`;
  h+=cc?`<option value="mine"${st.sheet==='mine'?' selected':''}>My character: ${H(cc.name||'')}${cc.cp?` (${fmt(cc.cp)} CP)`:''}</option>`:'<option value="mine" disabled>My character (load it in the My character tab)</option>';
  return h;
}
function renderSim(){
  const host=$('simbox'),st=settings(),d=D();
  if(st.sheet==='mine'&&!myCharCfg())st.sheet='median';
  const durs=[['boss','Usual kill time'],['60','1 minute'],['120','2 minutes'],['180','3 minutes'],['300','5 minutes']];
  host.innerHTML=`<div class="box" style="display:grid;gap:14px">
   <h3 style="margin:0">Set up the fight</h3>
   <div class="simform">
    <label class="f">Stats<select id="simsheet">${sheetOptions(st)}</select></label>
    <label class="f">Boss<select id="simboss">${BOSSES.map(b=>`<option value="${H(b[0])}"${b[0]===st.boss?' selected':''}>${H(b[1])}</option>`).join('')}</select></label>
    <label class="f">Fight length<select id="simdur">${durs.map(x=>`<option value="${x[0]}"${String(st.dur)===x[0]?' selected':''}>${x[1]}</option>`).join('')}</select></label>
    <label class="f">Rotation<select id="simrot">${ROTS.map(r=>`<option value="${r[0]}"${r[0]===st.rot?' selected':''}>${r[1]}</option>`).join('')}</select></label>
   </div>
   <div class="simtoggles">
    <label><input type="checkbox" id="simparty"${st.party?' checked':''}> Party buffs <span class="small muted">(Chanter/Cleric aura, boss tolerance cut, Power of the Storm)</span></label>
    <label><input type="checkbox" id="simcons"${st.cons?' checked':''}> Consumables <span class="small muted">(Power Shard)</span></label>
   </div>
   <div id="simmine"></div>
   <div class="chrow"><button type="button" class="btn primary" id="simrun">Simulate</button><button type="button" class="btn" id="simworth">What's each stat worth?</button></div>
   <div id="simprog" role="status" aria-live="polite"></div>
  </div>
  <div id="simout" style="display:grid;gap:18px"></div>
  <div class="box" style="display:grid;gap:12px">
   <h3 style="margin:0">Compare two setups</h3>
   <p class="small muted" style="margin:0">Setup A is the fight above. Setup B is the same fight with the changes you pick here. Both run the same ${FIGHTS} fights, so even a small difference is reliable.</p>
   <div class="simform">
    <label class="f">Try other perks on<select id="simpskill"></select></label>
   </div>
   <div class="simperks" id="simperks"></div>
   <div class="simform">
    <label class="f">Swap a Stigma: take out<select id="simstout"></select></label>
    <label class="f">put in (same level)<select id="simstin"></select></label>
    <label class="f">Change a stat<select id="simcstat"><option value="">no change</option>${STATS.map((s,i)=>`<option value="${i}">${H(s.n)}</option>`).join('')}</select></label>
    <label class="f">by<input type="number" id="simcamt" step="any" placeholder="e.g. 12"></label>
   </div>
   <div class="chrow"><button type="button" class="btn primary" id="simcmp">Compare A vs B</button></div>
   <div id="simcmpout"></div>
  </div>
  <div class="callout small"><b>How far to trust this.</b> Best for comparisons on the same stats (A vs B, which stat to reroll for): each skill's share of damage matches AionFlex Global logs within about 1–2 points. A single DPS number is a ±15–20% estimate, and very high gear (over ~140K Combat Power) comes out too high. Crit is a weak stat on Global bosses right now. What could change the stat ranking: how much Combat Speed shortens animations, the Global crit curve, how strong damage-over-time ticks are, perks with no number in their tooltip (counted as 0), and unknown boss Defense/Block (so Accuracy and Penetration count as 0).</div>`;
  const on=(id,ev,f)=>{const el=$(id);if(el)el.addEventListener(ev,f)};
  on('simsheet','change',e=>{saveSettings({sheet:e.target.value});renderMine();fillCompare()});
  on('simboss','change',e=>saveSettings({boss:e.target.value}));
  on('simdur','change',e=>saveSettings({dur:e.target.value}));
  on('simrot','change',e=>saveSettings({rot:e.target.value}));
  on('simparty','change',e=>saveSettings({party:e.target.checked}));
  on('simcons','change',e=>saveSettings({cons:e.target.checked}));
  on('simrun','click',runMain);on('simworth','click',runWorth);on('simcmp','click',runCompare);
  on('simpskill','change',fillPerks);
  on('simcstat','change',e=>{const s=STATS[e.target.value];const a=$('simcamt');if(a)a.value=s?s.amt:''});
  renderMine();fillCompare();
}
function renderMine(){
  const box=$('simmine');if(!box)return;const st=settings();
  if(st.sheet!=='mine'){box.innerHTML='';return}
  const cc=myCharCfg();if(!cc){box.innerHTML='';return}
  const s=cc.cfg.stats,f=(k,u)=>s[k]==null?'—':(u?(+s[k]).toFixed(1)+'%':fmt(s[k]));
  const rows=[['Attack','attack',''],['Critical Hit','crit',''],['Combat Speed','combatSpeed',1],['Attack Increase','attackIncrease',1],['Attack Bonus','attackBonus',''],
    ['Damage Boost','damageBoost',1],['Weapon Damage Boost','weaponDamageBoost',1],['Critical Damage Boost','critDamageBoost',1],['PvE Attack','pveAttack',''],
    ['PvE Damage Boost','pveDamageBoost',1],['Double','double',1],['Perfect','perfect',1],['Multi-hit','multiHit',1],['Cooldown Reduction','cooldownReduction',1]];
  const note=k=>cc.src[k]==='mix'?`${SRCW.mix} <span class="muted">(your gear and boards show ${(+cc.seen[k]).toFixed(1)})</span>`:(SRCW[cc.src[k]]||SRCW.est)+((k==='double'||k==='perfect')?' <span class="muted">+ hidden sources</span>':'');
  const r=cc.read,typed=panelTyped(cc.M);
  box.innerHTML=`<details class="small"><summary><b>Which of your numbers the simulator uses</b> <span class="muted">(NCSoft's page has no Attack or Crit totals, so some are estimates)</span></summary>
   <div class="tablewrap" style="margin-top:8px"><table><thead><tr><th>Stat</th><th class="num">Used</th><th>Where it comes from</th></tr></thead><tbody>
   ${rows.map(([n,k,u])=>`<tr><td>${n}</td><td class="num">${f(k,u)}</td><td class="small">${note(k)}</td></tr>`).join('')}
   <tr><td>Weapon damage</td><td class="num">${fmt(s.weaponMin)}–${fmt(s.weaponMax)}</td><td class="small">${SRCW[cc.src.weaponMin]||SRCW.est}</td></tr>
   <tr><td>Skill ranks</td><td class="num">${r.ranks}</td><td class="small">${r.ranks?'your character (in-game ranks)':'typical for your Combat Power'}</td></tr>
   <tr><td>Stigmas</td><td class="num">${r.stigmas||'—'}</td><td class="small">${r.stigmas?'your equipped Stigmas and levels':"the guide's picks"}</td></tr>
   <tr><td>Perks</td><td class="num">${r.perks||'—'}</td><td class="small">${r.perks?'your AionFlex code':'typical perks (paste an AionFlex code in My character for yours)'}</td></tr>
   <tr><td>Theostone</td><td class="num">${r.theo.length?'yes':'—'}</td><td class="small">${r.theo.length?H(r.theo.join(', ')):'none found on your weapon'}</td></tr>
   </tbody></table></div>
   <p class="small" style="margin:10px 0 6px">Know your in-game totals? Type them to replace the estimates (leave blank to keep the estimate):</p>
   <div class="simform"><label class="f">Attack<input type="number" id="simpa" value="${H(typed.attack||'')}" min="0"></label><label class="f">Critical Hit<input type="number" id="simpc" value="${H(typed.crit||'')}" min="0"></label><label class="f">Combat Speed (%)<input type="number" id="simps" value="${H(typed.cs||'')}" min="0" step="any"></label></div>
  </details>`;
  ['simpa','simpc','simps'].forEach(id=>{const el=$(id);if(el)el.addEventListener('change',()=>{
    saveSettings({panel:{who:whoOf(cc.M),attack:($('simpa')||{}).value||'',crit:($('simpc')||{}).value||'',cs:($('simps')||{}).value||''}});
    const op=box.querySelector('details');renderMine();const np=box.querySelector('details');if(op&&np)np.open=true;
  })});
}
function fillCompare(){
  const d=D();if(!d||!$('simpskill'))return;const A=resolved(uiConfig(settings()).cfg);
  const order=(typeof C!=='undefined'&&C.activePriority)||[];
  const sk=Object.keys(d.skills).filter(n=>d.skills[n].type==='active'&&d.skills[n].specs&&Object.keys(d.skills[n].specs).length)
    .sort((x,y)=>{const a=order.indexOf(x),b=order.indexOf(y);return (a<0?99:a)-(b<0?99:b)||x.localeCompare(y)});
  $('simpskill').innerHTML='<option value="">no change</option>'+sk.map(n=>`<option value="${H(n)}">${H(n)} (rank ${A.rk[n]||'?'})</option>`).join('');
  fillPerks();
  $('simstout').innerHTML='<option value="">no change</option>'+A.stigmas.map(n=>`<option value="${H(n)}">${H(n)} (level ${A.lv(n)})</option>`).join('');
  const others=Object.keys(d.skills).filter(n=>d.skills[n].type==='stigma'&&A.stigmas.indexOf(n)<0).sort();
  $('simstin').innerHTML='<option value="">pick a Stigma</option>'+others.map(n=>`<option value="${H(n)}">${H(n)}</option>`).join('');
}
function fillPerks(){
  const host=$('simperks'),n=($('simpskill')||{}).value,d=D();if(!host)return;
  if(!n){host.innerHTML='<span class="small muted">Pick a skill to try different perks on it in setup B.</span>';return}
  const A=resolved(uiConfig(settings()).cfg),have=A.perks[n]||[],sp=d.skills[n].specs||{},rk=A.rk[n]||0;
  host.innerHTML=`<span class="small muted" style="flex-basis:100%">Ticked = used in setup B (up to 3). Setup A keeps its current perks.</span>`+Object.keys(sp).sort().map(k=>{const x=sp[k],lock=x.unlock&&rk<x.unlock;
    return `<label class="gchk" title="${H(x.text||'')}"><input type="checkbox" data-simperk="${H(k)}"${have.indexOf(Number(k))>=0?' checked':''}> ${H(x.text||'Perk '+k)}${x.unlock?` <span class="muted">(rank ${x.unlock}${lock?', locked':''})</span>`:''}${!(x.ops||[]).length?' <span class="muted">· no damage effect</span>':''}</label>`}).join('');
}

function statLine(i,amt){const s=STATS[i];return `${s.n} ${amt>=0?'+':'−'}${Math.abs(amt)}${s.u}`}
function runMain(){
  const myGen=++gen,st=settings(),{cfg,cc}=uiConfig(st),t0=now();
  prog(`Simulating 0 of ${FIGHTS} fights…`);
  runJobs([{cfg}],FIGHTS,(c,t)=>prog(`Simulating ${c} of ${t} fights…`),js=>{
    const j=js[0];if(j.err){prog('The simulation stopped: '+j.err);return}
    prog(`Done: ${FIGHTS} fights in ${((now()-t0)/1000).toFixed(1)} s.`);
    showResult(j,st,cc);
  },()=>myGen!==gen);
}
function showResult(j,st,cc){
  const out=$('simout');if(!out)return;
  const tot=Object.values(j.agg).reduce((a,g)=>a+g.damage,0)||1,N=j.dps.length,dur=j.dur||180;
  const rows=Object.values(j.agg).filter(g=>g.damage>0).sort((a,b)=>b.damage-a.damage);
  const top=rows.length?rows[0].damage:1;
  const hits=rows.reduce((a,g)=>a+g.hits,0),crits=rows.reduce((a,g)=>a+g.crits,0);
  const notes=(j.log||[]).filter((x,i,a)=>a.indexOf(x)===i);
  out.innerHTML=`<div class="box" style="display:grid;gap:12px">
   <h3 style="margin:0">Result</h3>
   <div class="chrow" style="align-items:baseline;gap:14px"><span class="simbig" id="simdps">${fmt(mean(j.dps))}</span><span class="muted">damage per second</span></div>
   <p class="small" style="margin:0">Most fights land between <b>${fmt(quant(j.dps,0.1))}</b> and <b>${fmt(quant(j.dps,0.9))}</b> DPS (10th to 90th percentile of ${N} fights; the spread comes from crits, Doubles and procs). Crit on ${hits?Math.round(crits/hits*100):0}% of hits.</p>
   <p class="small muted" style="margin:0">${cap(setupLabel(st,cc))}. Real players often land ±15–20% from this; compare setups rather than trusting the exact number.</p>
   <div class="tablewrap"><table class="simtable" id="simskills"><thead><tr><th>Skill</th><th style="width:38%">Share of your damage</th><th class="num">Share</th><th class="num">Casts / min</th><th class="num hc">Crit</th></tr></thead><tbody>
   ${rows.map(g=>`<tr><td><b>${H(g.name)}</b></td><td><div class="simbar"><i style="width:${(g.damage/top*100).toFixed(1)}%"></i></div></td><td class="num">${(g.damage/tot*100).toFixed(1)}%</td><td class="num">${g.casts>0?(g.casts/N/dur*60).toFixed(1):'<span class="small muted">passive</span>'}</td><td class="num hc">${g.hits?Math.round(g.crits/g.hits*100)+'%':'—'}</td></tr>`).join('')}
   </tbody></table></div>
   ${notes.length?`<details class="small muted"><summary>Simulator notes (${notes.length})</summary><ul class="plain" style="margin-top:6px">${notes.map(x=>`<li>${H(x)}</li>`).join('')}</ul></details>`:''}
  </div><div id="simworthout"></div>`;
  if(typeof decorate==='function')try{decorate(out)}catch(e){}
}
function runWorth(){
  const myGen=++gen,st=settings(),{cfg,cc}=uiConfig(st),t0=now();
  const jobs=[{cfg,base:true}].concat(STATS.map((s,i)=>{const c=JSON.parse(JSON.stringify(cfg));c.statsAdd=Object.assign({},c.statsAdd||{});c.statsAdd[s.k]=(c.statsAdd[s.k]||0)+s.amt;return {cfg:c,i}}));
  prog('Testing each stat…');
  runJobs(jobs,WORTH_FIGHTS,(c,t,cur)=>prog(`Testing ${cur&&cur.i!=null?STATS[cur.i].n:'your current stats'}… (${c} of ${t} fights)`),js=>{
    const b=js[0];if(b.err){prog('The simulation stopped: '+b.err);return}
    const bm=mean(b.dps);
    const res=js.slice(1).map(j=>{const r=j.dps.map((x,k)=>x/b.dps[k]-1);return {s:STATS[j.i],g:j.err?null:(mean(j.dps)/bm-1)*100,se:sdev(r)/Math.sqrt(Math.max(1,r.length))*100}}).filter(x=>x.g!=null).sort((x,y)=>y.g-x.g);
    prog(`Done: ${js.length*WORTH_FIGHTS} fights in ${((now()-t0)/1000).toFixed(1)} s.`);
    let out=$('simworthout');if(!out){const so=$('simout');if(!so)return;so.insertAdjacentHTML('beforeend','<div id="simworthout"></div>');out=$('simworthout')}
    const mx=Math.max(0.1,...res.map(x=>x.g));
    out.innerHTML=`<div class="box" style="display:grid;gap:12px">
     <h3 style="margin:0">What's each stat worth?</h3>
     <p class="small muted" style="margin:0">Each row adds one typical roll of that stat to the ${setupLabel(st,cc).split(',')[0]} and re-runs the same ${WORTH_FIGHTS} fights. Base: ${fmt(bm)} DPS. Gains under about ±${Math.max(0.2,Math.round(Math.max(...res.map(x=>x.se))*10)/10)}% are noise.</p>
     <div class="tablewrap"><table class="simtable" id="simworthtable"><thead><tr><th>Stat and typical roll</th><th style="width:34%">DPS gain</th><th class="num">Gain</th></tr></thead><tbody>
     ${res.map(x=>`<tr><td><b>${H(x.s.n)}</b> +${x.s.amt}${x.s.u}<div class="small muted">${H(x.s.src)}</div></td><td><div class="simbar${x.g<0?' neg':''}"><i style="width:${Math.max(0,x.g/mx*100).toFixed(1)}%"></i></div></td><td class="num">${sgn(x.g)}</td></tr>`).join('')}
     </tbody></table></div>
     <p class="small muted" style="margin:0">Accuracy shows about 0 because boss Block and Defense are unknown on Global, so the model never misses; it still matters until you reach the guide's Accuracy target. Combat Speed and Crit are the two values most likely to move if the game's hidden rules differ from the model's assumptions.</p>
    </div>`;
  },()=>myGen!==gen);
}
function runCompare(){
  const st=settings(),{cfg,cc}=uiConfig(st),d=D(),A=resolved(cfg),B=JSON.parse(JSON.stringify(cfg)),what=[];
  const sk=($('simpskill')||{}).value;
  if(sk){
    const want=[...document.querySelectorAll('#simperks input[data-simperk]')].filter(x=>x.checked).map(x=>Number(x.dataset.simperk));
    const have=A.perks[sk]||[];
    if(want.slice().sort().join()!==have.slice().sort().join()){
      if(want.length>3){prog('A skill can use at most 3 perks (at rank 20). Untick some.');return}
      B.perks=Object.assign({},A.perks,B.perks||{});B.perks[sk]=want;
      if(!cc&&st.rot==='guide')mirrorFollow(d,B.perks); // follow-ups keep carrying their root's perks, as in setup A
      const tx=k=>((d.skills[sk].specs||{})[k]||{}).text||('perk '+k);
      what.push(`<b>${H(sk)}</b> perks: ${want.length?want.map(k=>H(tx(k))).join(', '):'none'} <span class="muted">(A: ${have.length?have.map(k=>H(tx(k))).join(', '):'none'})</span>`);
    }
  }
  const so=($('simstout')||{}).value,si=($('simstin')||{}).value;
  if(so&&si){
    B.stigmas=A.stigmas.map(n=>n===so?si:n);B.stigmaLevels=Object.assign({},A.sl,B.stigmaLevels||{});B.stigmaLevels[si]=A.lv(so);
    what.push(`Stigma: <b>${H(si)}</b> instead of <b>${H(so)}</b> (level ${A.lv(so)})`);
  }
  const ci=($('simcstat')||{}).value,ca=Number(($('simcamt')||{}).value);
  if(ci!==''&&isFinite(ca)&&ca!==0){const s=STATS[ci];B.statsAdd=Object.assign({},B.statsAdd||{});B.statsAdd[s.k]=(B.statsAdd[s.k]||0)+ca;what.push(H(statLine(ci,ca)))}
  const out=$('simcmpout');
  if(!what.length){if(out)out.innerHTML='<p class="small muted" style="margin:0">Pick at least one change for setup B: different perks, a Stigma swap or a stat change.</p>';return}
  const myGen=++gen,t0=now();
  prog('Comparing A and B…');
  runJobs([{cfg},{cfg:B}],FIGHTS,(c,t)=>prog(`Comparing A and B… (${c} of ${t} fights)`),js=>{
    const a=js[0],b=js[1];if(a.err||b.err){prog('The simulation stopped: '+(a.err||b.err));return}
    const am=mean(a.dps),bm=mean(b.dps),diff=(bm/am-1)*100,r=b.dps.map((x,k)=>x/a.dps[k]-1),se=sdev(r)/Math.sqrt(r.length)*100;
    const newNotes=(b.log||[]).filter(x=>(a.log||[]).indexOf(x)<0);
    const verdict=Math.abs(diff)<Math.max(0.2,2*se)?'about the same as A (the difference is within noise)':(diff>0?`<b style="color:var(--wind)">${sgn(diff)} more damage</b> than A`:`<b style="color:var(--warn)">${sgn(diff).replace('−','')} less damage</b> than A`);
    prog(`Done: ${2*FIGHTS} fights in ${((now()-t0)/1000).toFixed(1)} s.`);
    if(out)out.innerHTML=`<div class="callout ok" id="simcmpres"><b>Setup B does ${verdict}.</b> A: ${fmt(am)} DPS · B: ${fmt(bm)} DPS · difference ${sgn(diff)} (±${se.toFixed(1)}%).
      <ul class="plain small" style="margin-top:6px">${what.map(w=>`<li>${w}</li>`).join('')}</ul>
      ${newNotes.length?`<div class="small muted">Simulator notes for B: ${newNotes.map(H).join('; ')}</div>`:''}
      <div class="small muted">${cap(setupLabel(st,cc))}.</div></div>`;
  },()=>myGen!==gen);
}

/* ---------- wiring ---------- */
if(HAS){if(!window.AionSim)window.AionSim={};if(typeof window.AionSim.estimateGain!=='function')window.AionSim.estimateGain=estimateGain}
function onShow(){
  if(tabOpen('simulator')){if(built&&engine==='ready'){const sel=$('simsheet');if(sel){const v=sel.value;sel.innerHTML=sheetOptions(settings());if(sel.value!==v){renderMine();fillCompare()}}}openSim()}
  if(tabOpen('mychar'))charTabShown();
}
{const o=window.show;if(typeof o==='function')window.show=function(){const r=o.apply(this,arguments);try{onShow()}catch(e){}return r}}
})();

/* ---------- Mode setups: Nightmare / Ascension Trial / Daily Dungeon / PvP arena (data: C.modeSetups) ---------- */
(function(){
  const ORDER=['nightmare','trial','daily','arena'];
  // PvP mode puts the arena card first; the tab itself shows in both modes
  const order=()=>((typeof MODE!=='undefined'&&MODE==='pvp')?['arena','nightmare','trial','daily']:ORDER);
  // mode facts (Global unless marked; sim/research/modes.md, 2026-10-17)
  const INFO={
    nightmare:{name:'Nightmare',kind:'Solo boss duel',
      facts:'One named boss in its own arena: no party, no healer, no party buffs. Season 1 has 7 bosses open on Global, each with its own tiers 1–10. Every boss goes berserk at 5:00 (warning at 4:00). A failed run costs no attempt.'},
    trial:{name:'Ascension Trial',kind:'Solo score attack',
      facts:'3 mob rooms with a buff orb after each, then the boss room. This week (Sanctum of Loathing): 41 mobs, then Duduri and Dodori together. Easy, Normal, Hard and Extreme need item level 1,000, 1,500, 2,000 and 2,500, and allow 5, 3, 2 and 2 deaths. Score = clear points + seconds left × a bonus.'},
    daily:{name:'Daily Dungeon',kind:'90-second kill race',
      facts:'Unknown Fissure → Daeva Bio-Research Base: one 90-second solo stage, no boss. Pick 1 of 3 buff cards first, then kill level-30 waves and 5 elites. It pays 3,000–10,000 Enhance Stones depending on your score.'},
    arena:{name:'PvP arena',kind:'Arena of Solitude (1v1) · PvP',
      facts:'Arena of Solitude: 1v1, 10-minute match, first to 3 kills, 5-second respawn. The round winner keeps the HP they have left, so heal while the other player respawns. Arena of Cooperation: 5v5, one life each. Your own gear and skill ranks count in both (only Arena of Tactics, 10v10, evens stats out). Opens at level 45, any time: 300 AP per match (10 a week) and 500 per win (30 a week). Potions and scrolls work; scroll buffs end when you die.'}
  };
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  // same perk, different wording? match by [rank], numbers and key words (e.g. "Resets cooldown on landing a Critical Hit [12]" = "Resets cooldown on crit [12]")
  const STOP=new Set('a an the to up on when hit as and land lands landing of for in vs all with by is at if it its target targets while skill skills'.split(' '));
  function pkey(t,skill){
    let s=String(t||'').replace(/[−–]/g,'-').toLowerCase();
    const rk=(s.match(/\[(\d+)\]/)||[])[1]||'';
    s=s.replace(/\[\d+\]/g,' ').replace(/\([^)]*\)/g,' ');
    if(skill) s=s.split('['+String(skill).toLowerCase()+']').join(' ');
    s=s.replace(/[\[\]]/g,' ')
     .replace(/critical hits?|crits?\b/g,' crit ').replace(/block\s*(and|\/)\s*evasion/g,' block evasion ')
     .replace(/defeating an enemy/g,' kill ').replace(/additional/g,'extra').replace(/protective shield/g,'shield')
     .replace(/incapacitated immunity|cc-immune/g,' ccimmune ').replace(/\b(no|remove|removes)\s+cooldown/g,' nocd ')
     .replace(/\bless\b/g,'fewer').replace(/skill speed/g,'skillspeed');
    const nums=(s.match(/\d[\d,.]*\s?(%|s\b|m\b|x\b)?/g)||[]).map(x=>x.replace(/[\s,]/g,'')).sort();
    s=s.replace(/[+-]?\d[\d,.]*\s?(%|s\b|m\b|x\b)?/g,' ');
    const w=new Set((s.match(/[a-z][a-z'-]*/g)||[]).map(x=>x.length>3&&/s$/.test(x)&&!/ss$/.test(x)?x.slice(0,-1):x).filter(x=>!STOP.has(x)));
    return {rk,nums:nums.join('|'),w};
  }
  function samePerk(a,b,skill){
    const A=pkey(a,skill),B=pkey(b,skill);
    if(A.rk&&B.rk&&A.rk!==B.rk) return false;
    if(A.nums!==B.nums) return false;
    if(!A.w.size&&!B.w.size) return true;
    let i=0; A.w.forEach(x=>{if(B.w.has(x))i++});
    return i/(A.w.size+B.w.size-i)>=0.5;
  }
  const nf=v=>typeof v==='number'?(Math.abs(v)>=1000?Math.round(v).toLocaleString('en-US'):String(Math.round(v*10)/10)):h(v);
  function raidRow(skill){
    const rows=(C.perks&&C.perks.rows)||[];
    const r=rows.find(x=>x.skill===skill); return r?[r.s1,r.s2,r.s3]:null;
  }
  function perkLine(p){
    const raid=(raidRow(p.skill)||[]).filter(Boolean);
    const items=(p.perks||[]).map((t,i)=>{const isNew=raid.length&&!raid.some(x=>samePerk(t,x,p.skill));
      return `<span class="msperk${isNew?' new':''}"><i>${i+1}</i>${h(t)}${isNew?' <em>new</em>':''}</span>`}).join('');
    return `<li class="msrow"><span class="msic">${ic(p.skill,'sm')}</span><div><strong>${h(p.skill)}</strong><div class="msperks">${items}</div>${p.note?`<div class="small muted">${h(p.note)}</div>`:''}</div></li>`;
  }
  // "Explosion Trap (slot 3): text" -> bold skill name so decorate() adds its picture
  function manLine(t){
    const m=String(t).match(/^([A-Z][A-Za-z' ]{2,40}?)(\s*\(|:)/);
    if(m&&findImg(m[1].trim())) return `<li><b>${h(m[1].trim())}</b>${h(String(t).slice(m[1].length))}</li>`;
    return `<li>${h(t)}</li>`;
  }
  function simLine(s){
    if(!s) return '';
    const met=String(s.metric||'').toLowerCase();
    let a=nf(s.raid), b=nf(s.mode), lab=s.metric||'';
    if(met.indexOf('time')>=0){a+=' s'; b+=' s'}
    const g=typeof s.gainPct==='number'?s.gainPct:null;
    const gs=g==null?'':(met.indexOf('time')>=0?`${Math.abs(g).toFixed(1)}% ${g>=0?'faster':'slower'}`:`${g>=0?'+':''}${g.toFixed(g!==0&&Math.abs(g)<1?2:1)}%`);
    return `<div class="mssimrow"><span class="msmetric">${h(lab)}</span><span class="msnum">${a} <span class="arrow">→</span> ${b}</span>${gs?`<span class="msgain${g<0?' neg':''}">${gs}</span>`:''}</div>`;
  }
  const CONF={high:'High confidence',med:'Medium confidence',medium:'Medium confidence',low:'Low confidence'};
  // arena extras: burst order, CC break, matchups, team arena
  function burstFlow(arr){
    if(!arr||!arr.length) return '';
    const t=(n,i)=>typeof tile==='function'?tile({name:n,note:'step '+(i+1)}):`<span class="mschip">${ic(n,'sm')}${h(n)}</span>`;
    return `<div class="mssec"><h4>Burst combo · press in this order</h4><div class="flow msflow">${arr.map(t).join('<span class="arrow">→</span>')}</div></div>`;
  }
  function arenaBits(M){
    const mu=(M.matchups||[]).filter(m=>m&&m.vs);
    return (M.ccBreak?`<div class="mssec msccb"><h4>Breaking crowd control</h4><p class="small">${h(M.ccBreak)}</p></div>`:'')+
      (mu.length?`<div class="mssec"><h4>Matchups</h4><div class="tablewrap"><table class="mstable"><thead><tr><th>Against</th><th>Plan</th></tr></thead><tbody>${mu.map(m=>`<tr><td><b>${h(m.vs)}</b></td><td class="small">${h(m.plan)}</td></tr>`).join('')}</tbody></table></div></div>`:'')+
      (M.teamNotes&&M.teamNotes.length?`<div class="mssec"><h4>Team arena (Cooperation and Tactics)</h4><ul class="plain small">${M.teamNotes.map(x=>`<li>${h(x)}</li>`).join('')}</ul></div>`:'')+
      srcBits(M);
  }
  // where it comes from: Global vs Korean sources, and what may differ on Global
  function srcBits(M){
    const src=(M.sources||[]).filter(s=>s&&(s.url||s.what));
    if(!src.length&&!M.krVsGlobal) return '';
    const host=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return ''}};
    const li=s=>{const hn=/^https?:\/\//.test(s.url||'')?host(s.url):'';
      const lab=hn?`<a href="${h(s.url)}" target="_blank" rel="noopener noreferrer">${h(hn)}</a>`:'game client data';
      return `<li><span class="tag${String(s.scope).toUpperCase()==='KR'?'':' wind'}">${h(s.scope||'?')}</span> ${lab}: ${h(s.what)}</li>`};
    return `<details class="mssrc"><summary>Sources and what may differ on Global (${src.length})</summary>`+
      (M.krVsGlobal?`<p class="small muted">${h(M.krVsGlobal)}</p>`:'')+
      (src.length?`<ul class="plain small">${src.map(li).join('')}</ul>`:'')+`</details>`;
  }
  const barLi=b=>`<li class="msrow msbar"><span class="msic kbd">${h(b.slot)}</span><div><strong>Skill bar</strong> · slot ${h(b.slot)}${b.row!=null?', row '+h(b.row):''}<div><b>${h(b.from||'empty')}</b> <span class="arrow">→</span> <b>${h(b.to||'empty')}</b></div></div></li>`;
  const macLi=t=>`<li class="msrow"><span class="msic kbd">M</span><div><strong>Macro</strong><div>${h(t)}</div></div></li>`;
  // optional better-testing bar/macro for this mode; the card's own setup above stays valid
  function altSec(A){
    if(!A) return '';
    const g=A.sim||{}, faster=/time/i.test(g.metric||'');
    const gain=g.gainPct!=null?` · ${g.gainPct>0?'+':''}${h(g.gainPct)}%${faster?' faster':''}`:'';
    const rows=(A.barChanges||[]).map(barLi).concat(A.macroSteps?[macLi(A.macroSteps)]:[]).concat((A.manual||[]).map(x=>`<li class="msrow"><span class="msic kbd">H</span><div><strong>By hand</strong><div>${h(x)}</div></div></li>`));
    return `<div class="mssec msalt"><h4>New macro option${gain} <span class="tag wind">optional</span></h4>`+
      `<p class="small">${h(A.summary||'')} The setup above still works; this is the version that tested better.</p>`+
      (rows.length?`<ul class="mschg">${rows.join('')}</ul>`:'')+(g.note?`<p class="small muted">${h(g.note)}</p>`:'')+`</div>`;
  }
  function card(k,M){
    const I=INFO[k]; const done=!!S.get('mode-'+k,false); const isA=k==='arena';
    const head=`<header class="mshead"><div><span class="eyebrow">${h(I.kind)}</span><h3>${h(M&&M.title||I.name)}</h3></div>`+
      `<label class="msdone"><input type="checkbox" data-msdone="${k}"${done?' checked':''}${M?'':' disabled'}> Done</label></header>`+
      `<p class="msfacts small muted">${h(I.facts)}</p>`;
    // Brawler is Korea-only: no Global simulator data, so the Global PvE mode cards can't be filled
    if(!M&&!isA&&/brawler/i.test(C['class']||'')) return `<article class="box mscard soon" data-mscard="${k}">${head}<p class="mssoon"><b>No setup for this mode.</b> `+
      `Brawler is not on Global yet, so there is no Global data to build a setup for this mode from. If you play it in Korea, use your raid setup from <a href="#rotation" data-goto="rotation">Rotation &amp; macro</a>.</p></article>`;
    if(!M) return `<article class="box mscard soon${isA?' arena':''}" data-mscard="${k}">${head}<p class="mssoon"><b>Coming soon.</b> `+
      (isA?`The ${h(C['class'])} arena setup isn't written yet. Until then, use the <a href="#pvp" data-goto="pvp">PvP build</a> tab.`
          :`The ${h(C['class'])} setup for this mode is still being simulated. Until then, use your raid setup from <a href="#rotation" data-goto="rotation">Rotation &amp; macro</a>.`)+`</p></article>`;
    const raidSt=(C.stigmasPve||[]).map(s=>s.name);
    const stig=(M.stigmas||[]).map(n=>{const nw=raidSt.length&&!raidSt.includes(n);return `<span class="mschip${nw?' new':''}">${ic(n,'sm')}${h(n)}${nw?' <em>new</em>':''}</span>`}).join('');
    const out=raidSt.filter(n=>!(M.stigmas||[]).includes(n));
    const ch=[];
    (M.perks||[]).forEach(p=>ch.push(perkLine(p)));
    if(out.length){const inn=(M.stigmas||[]).filter(n=>!raidSt.includes(n));
      ch.push(`<li class="msrow"><span class="msic">${ic(inn[0]||out[0],'sm')}</span><div><strong>Stigma</strong><div>${out.map(h).join(', ')} <span class="arrow">→</span> ${inn.map(h).join(', ')}</div></div></li>`)}
    (M.barChanges||[]).forEach(b=>ch.push(barLi(b)));
    if(M.macroSteps) ch.push(macLi(M.macroSteps));
    const list=(t,arr,fn)=>arr&&arr.length?`<div class="mssec"><h4>${t}</h4><ul class="plain small">${arr.map(fn||(x=>`<li>${h(x)}</li>`)).join('')}</ul></div>`:'';
    const s=M.sim||{}; const hasSim=!!(M.sim&&(M.sim.raid!=null||M.sim.note));
    const chgSec=`<div class="mssec"><h4>What to change from your raid setup</h4>${ch.length?`<ul class="mschg">${ch.join('')}</ul>`:'<p class="small muted">Nothing: keep your raid setup.</p>'}</div>`;
    const stigSec=`<div class="mssec"><h4>Stigmas</h4><div class="mschips">${stig}</div>${M.stigmaNote?`<p class="small muted">${h(M.stigmaNote)}</p>`:''}${!M.barChanges||!M.barChanges.length?'<p class="small muted">Skill bar and macro: no changes.</p>':(M.macroSteps?'':'<p class="small muted">Macro steps: unchanged.</p>')}</div>`;
    const conf=`<span class="tag gold">${h(CONF[String(M.confidence||'').toLowerCase()]||'Confidence: '+(M.confidence||'?'))}</span>`;
    const foot=`<footer class="mssim"><div class="msmeta">`+
      (isA?`<span class="tag">From research and class mechanics</span>${hasSim?'<span class="tag wind">Simulator check</span>':''}`
          :`<span class="tag wind">Simulator</span>${s.robust===true?'<span class="tag">robust across sheets and assumptions</span>':s.robust===false?'<span class="tag">depends on assumptions</span>':''}`)+
      `${conf}</div>${hasSim||!isA?simLine(s):''}${s.note?`<p class="small muted">${h(s.note)}</p>`:''}</footer>`;
    if(isA) return `<article class="box mscard arena${done?' done':''}" data-mscard="${k}">${head}`+
      `<p class="mssum">${h(M.summary)}</p>`+
      `<div class="mscols"><div class="mscol">${chgSec}${stigSec}${burstFlow(M.burst)}</div>`+
      `<div class="mscol">${list('Press by hand',M.manual,manLine)}${list('How to play it',M.tips)}${list('Staying alive',M.survival)}</div></div>`+
      arenaBits(M)+foot+`</article>`;
    return `<article class="box mscard${done?' done':''}" data-mscard="${k}">${head}`+
      `<p class="mssum">${h(M.summary)}</p>`+chgSec+stigSec+altSec(M.macroAlt)+
      list('Press by hand',M.manual,manLine)+list('How to play it',M.tips)+list('Staying alive',M.survival)+
      foot+`</article>`;
  }
  let drawnMode=null;
  function renderModeSetups(){
    const host=document.getElementById('modesbox'); if(!host) return;
    const M=C.modeSetups||null;
    drawnMode=typeof MODE!=='undefined'?MODE:null;
    host.innerHTML=order().map(k=>card(k,M&&M[k])).join('');
    if(typeof decorate==='function') decorate(host);
    const n=ORDER.filter(k=>M&&M[k]&&S.get('mode-'+k,false)).length, tot=ORDER.filter(k=>M&&M[k]).length;
    const st=document.getElementById('modesstate'); if(st) st.textContent=tot?`${n} of ${tot} set up in game`:'';
  }
  // Mode setups is useful in PvE and PvP (arena card): stop the PvE/PvP switch from hiding its tab
  function unhideModesTab(){
    const tb=document.querySelector('nav.tabs button[data-tab="modes"]');
    if(tb){tb.removeAttribute('data-mode'); tb.hidden=false;}
    const intro=document.querySelector('#modes > div:first-child p.muted');
    if(intro&&!intro.dataset.arena){intro.dataset.arena=1; intro.insertAdjacentHTML('beforeend',' The <b>PvP arena</b> card is for Arena of Solitude (1v1) and the team arenas; it also lists only what to change from your raid setup.');}
    const pv=document.getElementById('pvpintro');
    if(pv&&C.modeSetups&&C.modeSetups.arena&&!document.getElementById('pvparenalink'))
      pv.insertAdjacentHTML('afterend','<p class="small" id="pvparenalink" style="margin:6px 0 0"><b>Arena setup:</b> perks, Stigmas, burst order and matchups for Arena of Solitude (1v1) are on <a href="#modes" data-goto="modes">Mode setups → PvP arena</a>.</p>');
  }
  try{unhideModesTab()}catch(e){console.error(e)}
  // re-order the cards when you switch between PvE and PvP
  {const o=window.renderModeBits;if(typeof o==='function')window.renderModeBits=function(){const r=o.apply(this,arguments);try{unhideModesTab();if((typeof MODE!=='undefined'?MODE:null)!==drawnMode)renderModeSetups()}catch(e){}return r}}
  document.addEventListener('change',e=>{
    const k=e.target&&e.target.dataset&&e.target.dataset.msdone; if(!k) return;
    S.set('mode-'+k,!!e.target.checked);
    const c=e.target.closest('.mscard'); if(c) c.classList.toggle('done',!!e.target.checked);
    const M=C.modeSetups||{}; const n=ORDER.filter(x=>M[x]&&S.get('mode-'+x,false)).length, tot=ORDER.filter(x=>M[x]).length;
    const st=document.getElementById('modesstate'); if(st) st.textContent=tot?`${n} of ${tot} set up in game`:'';
  });
  window.renderModeSetups=renderModeSetups;
  try{renderModeSetups()}catch(e){console.error(e)}
  // re-draw after your account copy of the progress loads
  {const o=window.applyStore;if(typeof o==='function')window.applyStore=function(){const r=o.apply(this,arguments);try{renderModeSetups()}catch(e){}return r}}
})();

/* ---------- Dungeon guides: boss-by-boss mechanics + videos (data: global DUNGEONS, audit/r6/dungeons.json) ---------- */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const data=()=>(typeof DUNGEONS!=='undefined'&&DUNGEONS)||window.DUNGEONS||null;
  const arr=x=>Array.isArray(x)?x.filter(v=>v!=null&&v!==''):[];
  const safeUrl=u=>/^https?:\/\//i.test(String(u||''))?String(u):'';
  const host=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return ''}};
  const isKR=s=>String(s||'').toUpperCase()==='KR';
  const scopeTag=s=>`<span class="tag${isKR(s)?' t-bad':' wind'}">${h(s||'?')}</span>`;
  const CONF={high:'High confidence',med:'Medium confidence',medium:'Medium confidence',low:'Low confidence'};
  const SHARED={character:'per character',server:'per server',account:'per account'};
  const st={grp:'all',q:'',open:new Set()};
  try{st.grp=S.get('dgfilter','all')||'all'}catch(e){}

  // small scoped styles (built on the site's tokens; no other file needs changing)
  function addStyle(){
    if(document.getElementById('dgstyle')) return;
    const el=document.createElement('style'); el.id='dgstyle';
    el.textContent=[
      '#dungeonsbox{display:grid;gap:14px;min-width:0}',
      '.dgctl{display:grid;gap:10px}',
      '.dgctl .seg{flex-wrap:wrap;max-width:100%}',
      '.dgctl input[type=search]{width:100%;max-width:420px;box-sizing:border-box;padding:8px 10px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:inherit;font:inherit}',
      '.dggrp{display:grid;gap:10px;min-width:0}',
      '.dggrp>h3{margin:6px 0 0}',
      '.dggrp>p{margin:0}',
      'details.dgcard{padding:0;border-top:3px solid var(--wind);min-width:0}',
      'details.dgcard.done{border-top-color:var(--gold)}',
      'details.dgcard>summary{list-style:none;cursor:pointer;padding:14px 16px;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:space-between}',
      'details.dgcard>summary::-webkit-details-marker{display:none}',
      '.dgsumm{display:grid;gap:4px;min-width:0;flex:1 1 240px}',
      '.dgsumm b{font-size:17px}',
      '.dgsumm .dgchips{display:flex;flex-wrap:wrap;gap:5px}',
      '.dgbody{display:grid;gap:14px;padding:0 16px 16px;min-width:0}',
      '.dgfacts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:0}',
      '.dgfacts div{background:var(--panel2);border:1px solid var(--line);border-radius:9px;padding:7px 10px;min-width:0}',
      '.dgfacts dt{font:600 11px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}',
      '.dgfacts dd{margin:2px 0 0;font-size:14px;overflow-wrap:anywhere}',
      '.dgboss{border:1px solid var(--line);border-radius:10px;padding:12px;display:grid;gap:10px;min-width:0}',
      '.dgboss>h4{margin:0;font-size:16px}',
      '.dgmech{display:grid;gap:6px;margin:0;padding:0;list-style:none}',
      '.dgmech li{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px 10px;align-items:start;background:var(--panel2);border-radius:8px;padding:7px 10px;font-size:14px}',
      '.dgmech .arrow{color:var(--gold)}',
      '.dgmech .dgsee::before{content:"See: ";font-weight:600;color:var(--muted)}',
      '.dgmech .dgdo::before{content:"Do: ";font-weight:600;color:var(--wind)}',
      '.dgwipe li{color:var(--warn)}',
      '.dgroles{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}',
      '.dgroles div{font-size:14px;background:var(--panel2);border-radius:8px;padding:7px 10px}',
      '.dgvids{display:grid;gap:8px;margin:0;padding:0;list-style:none}',
      '.dgvids li{font-size:14px;overflow-wrap:anywhere}',
      '.dgvids a{font-weight:600}',
      '.dgcount{font:600 12px var(--f-mono);letter-spacing:.04em;color:var(--muted)}',
      '@media (max-width:640px){.dgmech li{grid-template-columns:1fr}.dgmech .arrow{display:none}details.dgcard>summary{padding:12px}.dgbody{padding:0 12px 12px}}'
    ].join('\n');
    document.head.appendChild(el);
  }

  const done=id=>{try{return !!S.get('dg-'+id,false)}catch(e){return false}};
  const list=(t,a,cls)=>{a=arr(a);return a.length?`<div class="mssec"><h4>${t}</h4><ul class="plain small${cls?' '+cls:''}">${a.map(x=>`<li>${h(x)}</li>`).join('')}</ul></div>`:''};

  function bossHtml(b){
    const mech=arr(b.mechanics).filter(m=>m&&(m.see||m.do));
    const roles=b.roles||{};
    const R=[['tank','Tank'],['healer','Healer'],['dps','DPS']].filter(([k])=>roles[k]);
    return `<section class="dgboss"><h4>${h(b.name||'Boss')}</h4>`+
      (b.enrage?`<p class="small" style="margin:0"><span class="tag gold">Enrage</span> ${h(b.enrage)}</p>`:'')+
      list('Phases',b.phases)+
      (mech.length?`<div class="mssec"><h4>Mechanics · what you see → what to do</h4><ul class="dgmech">${mech.map(m=>`<li><span class="dgsee">${h(m.see)}</span><span class="arrow" aria-hidden="true">→</span><span class="dgdo">${h(m.do)}</span></li>`).join('')}</ul></div>`:'')+
      list('Wipes the group',b.wipe,'dgwipe')+
      (R.length?`<div class="mssec"><h4>Role notes</h4><div class="dgroles">${R.map(([k,l])=>`<div><span class="tag">${l}</span> ${h(roles[k])}</div>`).join('')}</div></div>`:'')+
      list('Common mistakes',b.mistakes)+`</section>`;
  }

  function vidHtml(v){
    const u=safeUrl(v.url); if(!u) return '';
    const meta=[v.channel,v.date].filter(Boolean).map(h).join(' · ');
    return `<li>${scopeTag(v.scope)} <a href="${h(u)}" target="_blank" rel="noopener noreferrer">${h(v.title||u)}</a>`+
      (meta?` <span class="muted">${meta}</span>`:'')+(v.covers?`<div class="small muted">${h(v.covers)}</div>`:'')+`</li>`;
  }

  function srcHtml(D){
    const src=arr(D.sources).filter(s=>s&&(s.url||s.what));
    if(!src.length) return '';
    const li=s=>{const u=safeUrl(s.url);const lab=u?`<a href="${h(u)}" target="_blank" rel="noopener noreferrer">${h(host(u)||u)}</a>`:'game client data';
      return `<li>${scopeTag(s.scope)} ${lab}${s.what?': '+h(s.what):''}</li>`};
    return `<details class="mssrc"><summary>Sources (${src.length})</summary><ul class="plain small">${src.map(li).join('')}</ul></details>`;
  }

  // short level chip: "Lv 45" / "Lv 35–45"; long texts stay in the facts grid only
  function lvChip(l){
    const t=String(l||''); const m=t.match(/\d+(\s*[–-]\s*\d+)?/); if(!m) return '';
    const n=Number(m[0].split(/[–-]/)[0]); if(!(n>0&&n<=99)) return '';
    return `<span class="tag">Lv ${h(m[0].replace(/\s*[–-]\s*/,'–'))}</span>`;
  }
  function card(D){
    const id=String(D.id||''); const dn=done(id);
    const vids=arr(D.videos).map(vidHtml).filter(Boolean);
    const bosses=arr(D.bosses);
    const chips=[D.type&&`<span class="tag wind">${h(D.type)}</span>`,
      lvChip(D.level),
      D.party&&String(D.party).length<=14&&`<span class="tag">${h(/player|solo/i.test(D.party)?D.party:D.party+' players')}</span>`,
      bosses.length&&`<span class="tag">${bosses.length} boss${bosses.length>1?'es':''}</span>`,
      vids.length&&`<span class="tag gold">${vids.length} video${vids.length>1?'s':''}</span>`].filter(Boolean).join('');
    const F=[['Entry level',D.level],['Item level',D.itemLevel],['Party',D.party],['Entries',D.entries],
      ['Resets',[D.resets,SHARED[D.shared]].filter(Boolean).join(' · ')],['Unlock',D.unlock]].filter(f=>f[1]);
    const conf=D.confidence?`<span class="tag gold">${h(CONF[String(D.confidence).toLowerCase()]||D.confidence)}</span>`:'';
    return `<details class="box dgcard${dn?' done':''}" data-dg="${h(id)}"${st.open.has(id)?' open':''}>`+
      `<summary><div class="dgsumm"><b>${h(D.name||id)}</b><div class="dgchips">${chips}</div></div>`+
      `<label class="msdone"><input type="checkbox" data-dgdone="${h(id)}"${dn?' checked':''}> Cleared</label></summary>`+
      `<div class="dgbody">`+
      (D.summary?`<p class="mssum" style="margin:0">${h(D.summary)}</p>`:'')+
      (F.length?`<dl class="dgfacts">${F.map(([k,v])=>`<div><dt>${k}</dt><dd>${h(v)}</dd></div>`).join('')}</dl>`:'')+
      list('Rewards',D.rewards)+
      bosses.map(bossHtml).join('')+
      list('Tips and consumables',D.tips)+
      `<div class="mssec"><h4>Videos</h4>${vids.length?`<ul class="dgvids">${vids.join('')}</ul><p class="small muted" style="margin:0">Videos open on YouTube in a new tab. KR = Korean server: mechanics match, but numbers and gear may differ on Global.</p>`:'<p class="small muted" style="margin:0">No checked guide video yet.</p>'}</div>`+
      `<div class="msmeta" style="display:flex;flex-wrap:wrap;gap:6px">${conf}</div>`+
      srcHtml(D)+`</div></details>`;
  }

  // text used by the search box
  function hay(D){
    const b=arr(D.bosses).map(x=>[x.name,arr(x.phases).join(' '),arr(x.mechanics).map(m=>m&&(m.see+' '+m.do)).join(' '),arr(x.wipe).join(' ')].join(' ')).join(' ');
    return [D.name,D.type,D.summary,arr(D.rewards).join(' '),b,arr(D.tips).join(' ')].join(' ').toLowerCase();
  }

  function counts(){
    const G=arr((data()||{}).groups); let n=0,t=0;
    G.forEach(g=>arr(g.dungeons).forEach(d=>{t++;if(done(d.id))n++}));
    const el=document.getElementById('dgstate'); if(el) el.textContent=t?`${n} of ${t} cleared`:'';
  }

  function applyFilter(){
    const host=document.getElementById('dungeonsbox'); if(!host) return;
    const q=st.q.trim().toLowerCase(); let shown=0;
    host.querySelectorAll('.dggrp').forEach(g=>{
      const grpOk=st.grp==='all'||g.dataset.dggrp===st.grp; let any=0;
      g.querySelectorAll('details.dgcard').forEach(c=>{
        const ok=grpOk&&(!q||(c.dataset.hay||'').indexOf(q)>=0);
        c.hidden=!ok; if(ok){any++;shown++}
      });
      g.hidden=!any;
    });
    host.querySelectorAll('[data-dgseg]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dgseg===st.grp)));
    const none=document.getElementById('dgnone'); if(none) none.hidden=shown>0;
  }

  function renderDungeons(){
    const box=document.getElementById('dungeonsbox'); if(!box) return;
    addStyle();
    const D=data();
    if(!D||!arr(D.groups).length){box.innerHTML='<div class="box"><p class="small muted" style="margin:0">Dungeon guides are not loaded.</p></div>';return}
    const G=arr(D.groups);
    if(st.grp!=='all'&&!G.some(g=>g.id===st.grp)) st.grp='all';
    const seg=`<div class="seg" role="group" aria-label="Dungeon type"><button type="button" data-dgseg="all" aria-pressed="${st.grp==='all'}">All</button>`+
      G.map(g=>`<button type="button" data-dgseg="${h(g.id)}" aria-pressed="${st.grp===g.id}">${h(g.name)}</button>`).join('')+`</div>`;
    box.innerHTML=`<div class="box dgctl">${seg}`+
      `<input type="search" id="dgsearch" placeholder="Search a dungeon, boss or mechanic" aria-label="Search dungeons, bosses and mechanics" value="${h(st.q)}">`+
      `<div class="small muted">Open a card for boss-by-boss mechanics (what you see → what to do), role notes and guide videos. Tick <b>Cleared</b> when you've done it. <span class="dgcount" id="dgstate"></span>${D.updated?` · updated ${h(D.updated)}`:''}</div></div>`+
      G.map(g=>`<section class="dggrp" data-dggrp="${h(g.id)}"><h3>${h(g.name)}</h3>${g.intro?`<p class="small muted">${h(g.intro)}</p>`:''}`+
        arr(g.dungeons).map(card).join('')+`</section>`).join('')+
      `<p class="box small muted" id="dgnone" hidden>Nothing matches your search.</p>`;
    // search text per card
    const all={}; G.forEach(g=>arr(g.dungeons).forEach(d=>{all[d.id]=d}));
    box.querySelectorAll('details.dgcard').forEach(c=>{const d=all[c.dataset.dg]; if(d) c.dataset.hay=hay(d)});
    applyFilter(); counts();
  }

  function wire(){
    const box=document.getElementById('dungeonsbox'); if(!box||box.dataset.dgwired) return;
    box.dataset.dgwired=1;
    box.addEventListener('click',e=>{
      const b=e.target.closest&&e.target.closest('[data-dgseg]');
      if(b){st.grp=b.dataset.dgseg; try{S.set('dgfilter',st.grp)}catch(x){} applyFilter(); return}
      // ticking Cleared must not open/close the card
      if(e.target.closest&&e.target.closest('label.msdone')&&e.target.closest('summary')&&!(e.target.matches&&e.target.matches('input'))){
        e.preventDefault(); const i=e.target.closest('label.msdone').querySelector('input'); if(i){i.checked=!i.checked; i.dispatchEvent(new Event('change',{bubbles:true}))}
      }
    });
    box.addEventListener('change',e=>{
      const id=e.target&&e.target.dataset&&e.target.dataset.dgdone; if(!id) return;
      try{S.set('dg-'+id,!!e.target.checked)}catch(x){console.error(x)}
      const c=e.target.closest('.dgcard'); if(c) c.classList.toggle('done',!!e.target.checked);
      counts();
    });
    box.addEventListener('input',e=>{if(e.target&&e.target.id==='dgsearch'){st.q=e.target.value||''; applyFilter()}});
    // remember which cards are open across re-draws (toggle doesn't bubble)
    box.addEventListener('toggle',e=>{const c=e.target; if(c&&c.classList&&c.classList.contains('dgcard')){c.open?st.open.add(c.dataset.dg):st.open.delete(c.dataset.dg)}},true);
  }

  window.renderDungeons=function(){renderDungeons(); wire()};
  try{window.renderDungeons()}catch(e){console.error(e)}
  // re-draw after your account copy of the progress loads
  {const o=window.applyStore;if(typeof o==='function')window.applyStore=function(){const r=o.apply(this,arguments);try{window.renderDungeons()}catch(e){}return r}}
})();

/* ---------- Other builds: extra full builds for a class (data: C.builds, e.g. Cleric Healer / DPS, Gladiator Tank) ---------- */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const KN={LMB:'Left click',RMB:'Right click',Space:'Space'};
  const ROLE={healer:'Healer',dps:'Damage',tank:'Tank',hybrid:'Hybrid'};
  function hideTab(){
    const tb=document.querySelector('nav.tabs button[data-tab="builds"]');
    if(tb&&!(C.builds&&C.builds.length)){tb.hidden=true;tb.dataset.nobuilds=1;}
  }
  function bar(b){
    if(!b||!b.length) return '';
    const cell=n=>n?`<div class="qc">${ic(n)}<span>${h(n)}</span></div>`:`<div class="qc empty"></div>`;
    return `<div class="tablewrap" style="border:0"><div class="qbar">`+b.map(s=>{
      const rows=s.rows||[]; let x=`<div class="qcol${s.man?' man':''}"><div class="qk">${h(KN[s.k]||s.k)}</div>`;
      for(let r=Math.max(1,Math.min(3,rows.length))-1;r>=0;r--) x+=`<div class="qrow"><i>${r}</i>${cell(rows[r])}</div>`;
      return x+`<div class="qnote">${!rows.length?'free slot':s.man?'press by hand':'in macro'}</div></div>`;
    }).join('')+`</div></div>`;
  }
  const list=(t,a,fn)=>a&&a.length?`<div class="mssec"><h4>${t}</h4><ul class="plain small">${a.map(fn||(x=>`<li>${h(x)}</li>`)).join('')}</ul></div>`:'';
  function card(B){
    const g=B.sim||{};
    const perks=(B.perks||[]).map(p=>`<li class="msrow"><span class="msic">${ic(p.skill,'sm')}</span><div><strong>${h(p.skill)}</strong><div class="msperks">${(p.perks||[]).map((t,i)=>`<span class="msperk"><i>${i+1}</i>${h(t)}</span>`).join('')}</div>${p.note?`<div class="small muted">${h(p.note)}</div>`:''}</div></li>`).join('');
    const stig=(B.stigmas||[]).map(n=>`<span class="mschip">${ic(n,'sm')}${h(n)}</span>`).join('');
    const sb=(B.soulBinding||[]).length?`<div class="mssec"><h4>Soul Binding</h4><div class="tablewrap"><table><thead><tr><th>Slot</th><th>Lines, best first</th></tr></thead><tbody>${B.soulBinding.map(r=>`<tr><td>${h(r.slot)}</td><td>${h(r.lines)}${r.note?`<div class="small muted">${h(r.note)}</div>`:''}</td></tr>`).join('')}</tbody></table></div></div>`:'';
    const steps=(B.barSteps||[]).map(k=>KN[k]||k).join(', ');
    const man=(B.manual||[]).map(m=>`<li><b>${h(m.name)}</b>${m.key?` <span class="kbd">${h(KN[m.key]||m.key)}</span>`:''}: ${h(m.note)}</li>`).join('');
    const simTxt=g.gainPct!=null?`<p class="small"><b>Simulator (${h(g.metric||'damage')}):</b> ${g.gainPct>0?'+':''}${h(g.gainPct)}%${g.min!=null?` (${h(g.min)}% to ${h(g.max)}%)`:''}. ${h(g.note||'')}</p>`:(g.note?`<p class="small">${h(g.note)}</p>`:'');
    const src=(B.sources||[]).length?`<details class="mssrc"><summary>Sources (${B.sources.length})</summary><ul class="plain small">${B.sources.map(s=>`<li><span class="tag${String(s.scope).toUpperCase()==='KR'?'':' wind'}">${h(s.scope||'?')}</span> ${/^https?:/.test(s.url||'')?`<a href="${h(s.url)}" target="_blank" rel="noopener noreferrer">${h((s.url.match(/^https?:\/\/(?:www\.)?([^/]+)/)||[])[1]||s.url)}</a>: `:''}${h(s.what)}</li>`).join('')}</ul></details>`:'';
    return `<article class="box mscard" data-build="${h(B.id)}">`+
      `<header class="mshead"><div><span class="eyebrow">${h(ROLE[B.role]||B.role||'')} build</span><h3>${h(C['class'])}: ${h(B.name)}</h3></div><span class="tag gold">Confidence: ${h(B.confidence||'?')}</span></header>`+
      (B.when?`<p class="msfacts small muted"><b>When:</b> ${h(B.when)}</p>`:'')+
      `<p class="mssum">${h(B.summary)}</p>`+
      `<div class="mssec"><h4>Stigmas</h4><div class="mschips">${stig}</div>${B.stigmaNote?`<p class="small muted">${h(B.stigmaNote)}</p>`:''}</div>`+
      (perks?`<div class="mssec"><h4>Perks</h4><ul class="mschg">${perks}</ul></div>`:'')+
      list('Stat priority',B.stats)+sb+
      `<div class="mssec"><h4>Skill bar</h4><p class="small muted">Row 0 is the bottom row and fires first. Gold-outlined slots are pressed by hand.</p>${bar(B.bar)}</div>`+
      (steps?`<div class="mssec"><h4>Macro</h4><p class="small">Add Macro steps in this order: <b>${h(steps)}</b> (10 ms delay each).</p></div>`:'')+
      list('Macro rules',B.rules)+(man?`<div class="mssec"><h4>Press by hand</h4><ul class="plain small">${man}</ul></div>`:'')+
      list('Rotation',B.rotation)+
      (B.switch?`<div class="mssec"><h4>Set it up</h4><p class="small">${h(B.switch)}</p></div>`:'')+
      `<footer class="mssim">${simTxt}${src}</footer></article>`;
  }
  function renderBuilds(){
    hideTab();
    const host=document.getElementById('buildsbox'); if(!host) return;
    const L=C.builds||[];
    if(!L.length){host.innerHTML='<p class="muted">This class has one build: see Rotation &amp; macro.</p>';return}
    const sel=S.get('buildPick',L[0].id), cur=L.find(b=>b.id===sel)||L[0];
    const main=C.mainBuildName||'Main build';
    host.innerHTML=`<div class="seg" role="group" aria-label="Build"><button type="button" data-bpick="main" aria-pressed="false">${h(main)} (Rotation &amp; macro)</button>`+
      L.map(b=>`<button type="button" data-bpick="${h(b.id)}" aria-pressed="${b===cur}">${h(b.name)}</button>`).join('')+`</div>`+card(cur);
    host.querySelectorAll('[data-bpick]').forEach(b=>b.addEventListener('click',()=>{
      if(b.dataset.bpick==='main'){const t=document.querySelector('nav.tabs button[data-tab="rotation"]'); if(t) t.click(); return}
      S.set('buildPick',b.dataset.bpick); renderBuilds();
    }));
    if(typeof decorate==='function') decorate(host);
  }
  window.renderBuilds=renderBuilds;
  try{renderBuilds()}catch(e){console.error(e)}
  {const o=window.applyStore;if(typeof o==='function')window.applyStore=function(){const r=o.apply(this,arguments);try{renderBuilds()}catch(e){}return r}}
  {const o=window.renderModeBits;if(typeof o==='function')window.renderModeBits=function(){const r=o.apply(this,arguments);try{hideTab()}catch(e){}return r}}
})();

/* ---------- grouped tab bar: pick a group, then a tab inside it ---------- */
function tabGroup(id){const b=document.querySelector(`nav.tabs button[data-tab="${id}"]`);return b?b.dataset.group:null}
function paintGroups(grp){
  document.querySelectorAll('.tgroups [data-grp]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.grp===grp)});
  document.querySelectorAll('nav.tabs button[data-group]').forEach(b=>b.classList.toggle('gh',b.dataset.group!==grp));
}
{const orig=window.show; window.show=function(id,push){const r=orig.apply(this,arguments);const cur=document.querySelector('nav.tabs button[aria-selected="true"]');paintGroups(cur?cur.dataset.group:'Home');return r}}
document.querySelectorAll('.tgroups [data-grp]').forEach(b=>b.addEventListener('click',()=>{
  const first=[...document.querySelectorAll(`nav.tabs button[data-group="${b.dataset.grp}"]`)].find(x=>!x.hidden);
  if(first) show(first.dataset.tab,true);
}));
{const cur=document.querySelector('nav.tabs button[aria-selected="true"]');paintGroups(cur?cur.dataset.group:'Home');}

/* ---------- Pantheon: Artwork / Statue / Colossus decorations, best setup and easiest wins (data: PANTHEON) ---------- */
const PAN_SLOTN={C:'Colossus',S:'Statue',A:'Artwork'}, PAN_SLOTP={C:'Colossus',S:'Statues',A:'Artworks'};
const PAN_COST=[1,2,4,8]; // effort cost used to rank "easiest wins": Free, Easy, Medium, Hard
const PAN_FACN={E:'Elyos',A:'Asmodian',B:'Both factions'};
function panOK(){return typeof PANTHEON!=='undefined'&&PANTHEON&&PANTHEON.d}
function panMode(){return (typeof MODE!=='undefined'&&MODE==='pvp')?'pvp':'pve'}
function panW(){const w=PANTHEON.w;return (w[SLUG]||w.ranger)[panMode()]}
function panVal(d,w){let v=0;for(const k in d.st)v+=d.st[k]*(w[k]||0);return v}
function panKey(d){return 'pan-'+d.id}
function panFac(){return S.get('panfac','B')}
/* effort index for your faction: 0 Free, 1 Easy, 2 Medium, 3 Hard, -1 = not in your plan (not out yet, or the other faction's) */
function panOther(d,fac){return fac!=='B'&&d.f!=='B'&&d.f!==fac}
function panEff(d,fac){
  if(d.av!=='now'||panOther(d,fac)) return -1;
  return d.e;
}
function panPlan(){
  const P=PANTHEON,w=panW(),sv=S.get('sv',{}),fac=panFac(),pf=fac==='B'?'E':fac;  // 'Show both': plan with Elyos decorations (one character can't get both factions' sets)
  const all=P.d.map(d=>({d,v:panVal(d,w),own:!!sv[panKey(d)],ef:panEff(d,fac),pe:panEff(d,pf)}));
  const top=(list,n)=>list.slice().sort((a,b)=>b.v-a.v||a.pe-b.pe).slice(0,n);
  const best={},target={};
  for(const s of ['C','S','A']){
    best[s]=top(all.filter(x=>x.d.s===s&&x.own&&x.v>0),P.slots[s]);
    target[s]=top(all.filter(x=>x.d.s===s&&x.v>0&&(x.own||x.pe>=0)),P.slots[s]);
  }
  // easiest wins first: repeatedly take the decoration with the biggest gain per effort over what you would have
  const cur={C:best.C.slice(),S:best.S.slice(),A:best.A.slice()}, used=new Set(all.filter(x=>x.own).map(x=>x.d.id)), steps=[];
  for(let i=0;i<20;i++){
    let pick=null;
    for(const x of all){
      if(used.has(x.d.id)||x.pe<0||x.v<=0) continue;
      const c=cur[x.d.s],n=P.slots[x.d.s];
      const rep=c.length<n?null:c.reduce((a,b)=>a.v<=b.v?a:b);
      const gain=x.v-(rep?rep.v:0); if(gain<0.005) continue;
      const r=gain/PAN_COST[x.pe];
      if(!pick||r>pick.r+1e-9||(Math.abs(r-pick.r)<1e-9&&gain>pick.gain)) pick={x,gain,rep,r};
    }
    if(!pick) break;
    steps.push(pick); used.add(pick.x.d.id);
    const c=cur[pick.x.d.s]; if(pick.rep) c.splice(c.indexOf(pick.rep),1); c.push(pick.x);
  }
  const sum=o=>['C','S','A'].reduce((t,s)=>t+o[s].reduce((a,x)=>a+x.v,0),0);
  return {w,all,best,target,steps,fac,now:sum(best),max:sum(target),end:sum(cur)};
}
function panGC(g){const G=(typeof GRADES!=='undefined'&&GRADES&&GRADES.grades)||{};return G[g]||'#C3C3C3'}
function panIco(d){const s=(PANTHEON.icons||[])[d.ic];return s?`<img class="panico" src="${s}" alt="" width="30" height="30" loading="lazy" style="border-color:${panGC(d.g)}">`:`<span class="panico pannoimg" style="border-color:${panGC(d.g)}">${d.s}</span>`}
function panName(d){return `<b style="color:${panGC(d.g)}">${esc(d.n)}</b>`}
function panStats(d,w){
  const ks=Object.keys(d.st); if(!ks.length) return '<span class="muted">not known yet</span>';
  return ks.sort((a,b)=>(w[b]||0)-(w[a]||0)).map(k=>{const t=PANTHEON.stats[k][0];return (w[k]||0)>=0.03?`<b>${t} ${d.st[k]}</b>`:`${t} ${d.st[k]}`}).join(' · ');
}
function panEffTag(ef,x,fac){
  if(ef<0&&x&&x.d.av==='now'&&panOther(x.d,fac)) return `<span class="tag">${x.d.tr?'Market only':PAN_FACN[x.d.f]+' only'}</span>`;
  const t=ef<0?'Not out yet':PANTHEON.eff[ef];return `<span class="tag ${ef<=1&&ef>=0?'wind':ef===3?'gold':''}">${t}</span>`}
function panPct(v){return '+'+v.toFixed(2)+'%'}
function panHow(x,fac){
  let h=esc(x.d.how);
  if(x.d.av==='now'&&panOther(x.d,fac)) h=(x.d.tr?`<b>${PAN_FACN[x.d.f]} map:</b> for you only through the Market, if it shows up there (left out of your plan). `:`<b>${PAN_FACN[x.d.f]} only.</b> `)+h;
  if(x.d.note) h+=` <span class="muted">(${esc(x.d.note)})</span>`;
  return h;
}
function renderPantheon(){
  const host=$('panbox'); if(!host||!panOK()) return;
  const P=PANTHEON, pl=panPlan(), w=pl.w, fac=pl.fac, m=panMode(), cls=(typeof C!=='undefined'&&C.class)||'';
  const filt=S.get('panslot','all'), showAll=!!S.get('panall',false);
  const chk=x=>`<input type="checkbox" data-sv="${panKey(x.d)}" ${x.own?'checked':''} aria-label="I own ${esc(x.d.n)}" class="panchk">`;
  const statOrder=Object.keys(P.stats).sort((a,b)=>(w[b]||0)-(w[a]||0));
  const top3=statOrder.slice(0,3).map(k=>`${P.stats[k][0]} (${P.stats[k][2].split(' + ')[0]})`);
  // ---- controls
  let h=`<div class="box pantop"><div class="panctl"><span class="small muted">Your faction</span><div class="seg" role="group" aria-label="Faction">${['E','A','B'].map(f=>`<button type="button" data-panfac="${f}" aria-pressed="${fac===f}">${f==='B'?'Show both':PAN_FACN[f]}</button>`).join('')}</div>
    <span class="small muted">Ranked for <b>${esc(cls)}</b> in <b>${m==='pvp'?'PvP':'PvE'}</b> (switch PvE/PvP in the top bar).</span></div>
    ${fac==='B'?`<p class="small" style="margin:0"><b>Pick your faction</b> so the plan only uses decorations you can get (half of the field-boss and shop ones are Elyos-only or Asmodian-only). Until you pick, the plan and "Best possible" use the Elyos ones.</p>`:''}
    <p class="small" style="margin:0">For a ${esc(cls)}${m==='pvp'?' in PvP':''} the god stats that matter most are <b>${top3.join(', ')}</b>. ${m==='pve'?'Wisdom is worth about twice any other stat for damage, so an Epic artwork with Wisdom beats a Unique one without it.':'PvP values are an estimate (the simulator only covers PvE damage).'}</p></div>`;
  // ---- best setup
  const tiles=s=>{const n=P.slots[s],own=pl.best[s],need=pl.target[s].filter(x=>!x.own);let t='',j=0;
    for(let i=0;i<n;i++){const x=own[i];
      if(x){t+=`<div class="panslot on">${panIco(x.d)}<span>${panName(x.d)}<small>${panPct(x.v)}</small></span></div>`;continue}
      const g=need[j++];
      t+=`<div class="panslot">${g?panIco(g.d).replace('class="panico','class="panico panghost'):`<span class="panico panempty">${s}</span>`}<span><b class="muted">Empty</b><small>${g?'Goal: '+esc(g.d.n):''}</small></span></div>`}
    return t};
  h+=`<div class="box" style="display:grid;gap:12px"><h3 style="margin:0">Your best setup</h3>
    <p class="small muted" style="margin:0">Tick what you own (in the steps or the table below). Each slot shows the best decoration you have for a ${esc(cls)}; the value is about how much damage it adds${m==='pvp'?' (PvP: estimate)':''}.</p>
    <div class="panbar"><span>Now <b>${panPct(pl.now)}</b></span><span>After the steps below <b>${panPct(pl.end)}</b></span><span>Best you can get <b>${panPct(pl.max)}</b></span></div>
    ${['C','S','A'].map(s=>`<div><div class="eyebrow" style="margin-bottom:6px">${PAN_SLOTP[s]} · ${pl.best[s].length} of ${P.slots[s]} filled</div><div class="pangrid ${s==='A'?'wide':''}">${tiles(s)}</div>
      <p class="small muted" style="margin:6px 0 0">Best possible: ${pl.target[s].map(x=>`<span class="${x.own?'panown':''}">${esc(x.d.n)}${x.own?' ✓':''}</span>`).join(', ')||'—'}</p></div>`).join('')}</div>`;
  // ---- easiest wins first
  h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Easiest wins first</h3>
    <p class="small muted" style="margin:0">Do these in order: each one is the biggest gain for the least effort from where you are now. Tick it when you have it and the list moves on.</p>
    ${pl.steps.length?`<ol class="pansteps">${pl.steps.map(st=>{const x=st.x;return `<li><label class="panstephead">${chk(x)}${panIco(x.d)}<span>${panName(x.d)} <span class="small muted">${PAN_SLOTN[x.d.s]}</span> ${panEffTag(x.ef)} <b class="panval">${panPct(st.gain)}</b></span></label>
      <div class="small">${st.rep?`Replaces ${esc(st.rep.d.n)}. `:`Fills an empty ${PAN_SLOTN[x.d.s]} slot. `}${panHow(x,fac)}</div></li>`}).join('')}</ol>`
      :`<p class="callout ok small" style="margin:0">Nothing left to gain: your Pantheon is the best you can build right now.</p>`}</div>`;
  // ---- full table
  const rows=pl.all.filter(x=>(filt==='all'||x.d.s===filt)&&(showAll||x.d.av==='now'||x.own))
    .sort((a,b)=>'CSA'.indexOf(a.d.s)-'CSA'.indexOf(b.d.s)||(b.ef>=0)-(a.ef>=0)||b.v-a.v||a.d.n.localeCompare(b.d.n));
  const nNow=P.d.filter(d=>d.av==='now').length, nOwn=pl.all.filter(x=>x.own).length;
  h+=`<details class="box" open><summary class="pansum"><b>All decorations</b> <span class="small muted">${P.d.length} in the Global client · ${nNow} you can get now · you own ${nOwn}</span></summary>
    <div class="panctl" style="margin:10px 0"><div class="seg" role="group" aria-label="Slot type">${[['all','All'],['C','Colossus'],['S','Statue'],['A','Artwork']].map(([k,t])=>`<button type="button" data-panslot="${k}" aria-pressed="${filt===k}">${t}</button>`).join('')}</div>
      <label class="small panall"><input type="checkbox" data-panall="1" ${showAll?'checked':''}> Also show ones you can't get yet</label></div>
    <div class="tablewrap"><table class="pantable"><thead><tr><th class="num">Own</th><th>Decoration</th><th>Slot</th><th>Stats</th><th class="num">Value</th><th>How to get it</th><th>Effort</th></tr></thead><tbody>
    ${rows.map(x=>`<tr class="${x.own?'panrowown':''}"><td class="num">${chk(x)}</td><td><span class="panname">${panIco(x.d)}<span>${panName(x.d)}<small class="muted">${esc(x.d.g)} · ${PAN_FACN[x.d.f]}${x.d.tr?' · tradable':''}</small></span></span></td><td class="small">${PAN_SLOTN[x.d.s]}</td><td class="small">${panStats(x.d,w)}</td><td class="num small">${x.v>0?panPct(x.v):'—'}</td><td class="small">${panHow(x,fac)}</td><td>${panEffTag(x.ef,x,fac)}</td></tr>`).join('')}
    </tbody></table></div></details>`;
  // ---- stat legend
  h+=`<details class="box"><summary class="pansum"><b>What the god stats do</b> <span class="small muted">and what 10 points are worth to a ${esc(cls)} (${m==='pvp'?'PvP':'PvE'})</span></summary>
    <div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>Stat [god]</th><th>Each point gives +0.1% to</th><th class="num">10 points ≈</th></tr></thead><tbody>
    ${statOrder.map(k=>`<tr><td class="small"><b>${P.stats[k][0]}</b> [${P.stats[k][1]}]</td><td class="small">${P.stats[k][2]}</td><td class="num small">${panPct(10*(w[k]||0))}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted" style="margin:8px 0 0">Damage stats (Wisdom = Double, Destruction = Attack, Time = Combat Speed, Illusion = Cooldown, Death = Crit) use the guide's DPS simulator. HP, Defense, Block, Accuracy and MP stats can't be simulated: they use the guide's role priorities (${SLUG==='templar'?'tank: Justice, Space and Life count a lot':SLUG==='cleric'?'healer: Life, Destiny and Wisdom count more':SLUG==='chanter'?'support: Life and Destiny count a bit':'damage dealer: they count very little'}), and PvP values are estimates.${SLUG==='brawler'?' Brawler has no simulator data: these are the Gladiator/Assassin averages.':''}</p></details>`;
  // ---- Korea-only + notes
  if((P.kr||[]).length) h+=`<details class="box"><summary class="pansum"><b>Korea only, not on Global yet</b> <span class="small muted">${P.kr.length} Season 2/3 decorations</span></summary>
    <p class="small muted">Korean client data (gamers4life), listed so you know what is coming. They are not in the Global game.</p>
    <div class="tablewrap"><table><thead><tr><th>Decoration</th><th>Slot</th><th>Stats</th><th class="num">Value</th></tr></thead><tbody>${P.kr.map(d=>`<tr><td class="small">${panName(d)}</td><td class="small">${PAN_SLOTN[d.s]}</td><td class="small">${panStats(d,w)}</td><td class="num small">${panPct(panVal(d,w))}</td></tr>`).join('')}</tbody></table></div></details>`;
  h+=`<div class="box small"><h3 style="font-size:18px">Good to know</h3><ul class="plain">
    <li><b>Opening it:</b> the level-22 Ascension quest <i>The One Who Hears the Voice</i> adds the Pantheon to your menu. Put a decoration in from your bag, then place it in a slot of its own type.</li>
    <li><b>Upgrading:</b> there is no enhancing; you swap in a better decoration. Each decoration counts once, so you need 12 different Artworks.</li>
    <li><b>Per character:</b> the decorations you get are bound to that character, and shop limits are 1 per character. Tradable ones (field-boss, dungeon and Abyss drops) can go through the Market. One guide says you can save 3 layouts, handy for a PvE and a PvP set.</li>
    <li><b>Not sure yet:</b> one database lists these decorations under a rented Legion Hall instead; the item text says "Placing it in the Pantheon grants the effect". Sources for Dream Fragment, Artifact of Eternity and Asahr's Mirror come from one guide, not the client data. Wisdom's value assumes bosses don't resist Double (Global boss Double Resist is unknown).</li></ul>
    <p class="muted" style="margin:6px 0 0">Sources: metabot.gg (Global client: decorations, stats, drops, shops, Substance Morph, achievements, quests, icons), sportskeeda.com and gamesfuze.com (Pantheon guides), gamers4life (Korean client data), the guide's DPS simulator (stat values). Checked 18 Oct 2026.</p></div>`;
  host.innerHTML=h;
}
document.addEventListener('change',e=>{const t=e.target,k=t&&t.dataset&&t.dataset.sv;
  if(k&&k.startsWith('pan-')){renderPantheon();return}
  if(t&&t.dataset&&t.dataset.panall){S.set('panall',t.checked);renderPantheon()}});
document.addEventListener('click',e=>{
  const f=e.target.closest&&e.target.closest('[data-panfac]'); if(f){S.set('panfac',f.dataset.panfac);renderPantheon();return}
  const s=e.target.closest&&e.target.closest('[data-panslot]'); if(s){S.set('panslot',s.dataset.panslot);renderPantheon();return}
  if(e.target.closest&&e.target.closest('#modepickTop button')) renderPantheon(); // PvE/PvP switch (setMode already ran on the button)
});
{const _ap=window.applyStore; if(typeof _ap==='function') window.applyStore=function(){const r=_ap.apply(this,arguments);renderPantheon();return r}}
renderPantheon();

/* ---------- Collections: Closet skins, Monoliths & Kibelisks, Achievements (data: COLLECT = audit/r4/collect_*.json, weapon skins per class: P.COLIC) ---------- */
const COL_EFFN={1:'Easy',2:'Medium',3:'Hard',9:'Not now'};
function cloCost(e){return {1:1,2:2,3:4,9:50}[e]||4}   /* closet effort 1 Easy, 2 Medium, 3 Hard, 9 not obtainable */
function achCost(e){return [1,2,4,8][e]||50}          /* achievement effort 0 Easy .. 3 Hard, 9 not available now */
function colOK(k){return typeof COLLECT!=='undefined'&&COLLECT&&COLLECT[k]}
function colMode(){return (typeof MODE!=='undefined'&&MODE==='pvp')?'pvp':'pve'}
function colCls(){return (typeof C!=='undefined'&&C&&C.class)||'your class'}
function colGC(g){const G=(typeof GRADES!=='undefined'&&GRADES&&GRADES.grades)||{};return G[g]||{Common:'#C3C3C3',Rare:'#19E048',Epic:'#379AFF',Unique:'#FFD02B',Heroic:'#FF6C00',Special:'#00FFD8'}[g]||'#C3C3C3'}
function colPct(v,d){return (v>=0?'+':'')+v.toFixed(d==null?2:d)+'%'}
function colNum(n){return Number(n).toLocaleString('en-US')}
function colTag(t,cls){return `<span class="tag ${cls||''}">${t}</span>`}
function colEff(e){return colTag(e===9?'Not now':COL_EFFN[e]||'Luck',e===1?'wind':e===3?'gold':'')}
function colTitleRank(ti){
  if(!ti||!ti.rk||!ti.rk.length) return '';
  const m=colMode(), r=ti.rk.filter(x=>x[0]===m).sort((a,b)=>a[2]-b[2])[0]||ti.rk.slice().sort((a,b)=>a[2]-b[2])[0];
  return ` <a href="#titles" data-goto="titles" class="small">#${r[2]} ${r[1]} title in ${r[0]==='pvp'?'PvP':'PvE'}</a>`;
}
function colTitle(ti){return ti?`<b>Title: ${esc(ti.n)}</b>${ti.eq?` <span class="small muted">(equipped: ${esc(ti.eq)}${ti.own?'; owned: '+esc(ti.own):''})</span>`:''}${colTitleRank(ti)}`:''}
function colFac(){return S.get('panfac','B')}  /* shared with the Pantheon tab: pick your faction once */
function colFacSeg(f){return `<div class="seg" role="group" aria-label="Faction">${['E','A'].map(k=>`<button type="button" data-colfac="${k}" aria-pressed="${f===k}">${k==='E'?'Elyos':'Asmodian'}</button>`).join('')}</div>`}

/* =============================== CLOSET =============================== */
function cloCats(){
  const K=COLLECT.closet, wc=K.wcls[SLUG]||'bow', wv=K.wv[SLUG]||K.wv.ranger;
  const nm=c=>(K.cats.find(x=>x[0]===c)||[c,c])[1];
  return [{c:wc,n:nm(wc)+' skins',short:nm(wc),v:wv.w,w:1},{c:'earrings',n:'Earring skins',short:'Earrings',v:wv.e},{c:'necklace',n:'Necklace skins',short:'Necklace',v:wv.n}];
}
function cloRows(c){const K=COLLECT.closet,wc=K.wcls[SLUG];return c===wc?((typeof P!=='undefined'&&P.COLIC)||[]):K.skins.filter(s=>s.c===c)}
function cloIco(r){const u=r.u||(r.ic!=null?(COLLECT.closet.icons||[])[r.ic]:'');return u?`<img class="colico" src="${u}" alt="" width="26" height="26" loading="lazy" style="border-color:${colGC(r.g)}">`:`<span class="colico" style="border-color:${colGC(r.g)}"></span>`}
function cloHow(r){
  if(r.s==='rs') return 'Black Cloud Merchant (Shop menu, <span class="kbd">H</span>): random stock, new every hour, Kinah';
  if(r.s==='shop') return `${esc(r.cur)}: <b>${esc(r.pr)}</b>, 1 per character${r.pvp?`. ${esc(r.pvp)}`:''}${/Oath/.test(r.cur)?'. Oath Coin expires on 16 Dec: check the Wings tab before you spend 210,000 on Talisra Wings':''}`;
  if(r.s==='cube') return 'Hidden Cubes (a rare roll; opening with a key doubles the skin chance)';
  if(r.s==='chest') return 'Weapon skin chest with no Global source yet';
  return 'No shop or drop on Global: Skin Combine (Epic skins have a 15% chance to become Unique) or gear extraction';
}
function cloEffOf(r){return r.s==='none'?3:r.s==='chest'?9:r.e}
/* price in "typical weekly haul" units, so 120,000 Oath Coin ranks behind 39,600 and Decanus (90,600 AP) ahead of Centurion (294,300) */
function cloPrice(r){
  if(r.s==='cube') return 2; if(r.s!=='shop') return cloCost(cloEffOf(r));
  const U=[['Oath',40000],['Abyss',90000],['Phantasmal',6000],['Centuryroot',1000],['Pass',5000]], u=(U.find(x=>String(r.cur).includes(x[0]))||[0,10000])[1];
  return Math.max(0.5,(+String(r.pr).replace(/,/g,'')||u)/u);
}
function cloState(){
  const K=COLLECT.closet, g=S.gget('gsv',{}), pts=S.gget('clopts',{}), cats=cloCats();
  const out={cats:[],now:0,reach:0,all:0};
  for(const ct of cats){
    const rows=cloRows(ct.c).map(r=>({r,own:!!g['clo-'+r.id],val:r.p*ct.v}));
    const est=rows.filter(x=>x.own).reduce((a,x)=>a+x.r.p,0);
    const man=pts[ct.c], has=man!==undefined&&man!==''&&!isNaN(+man);
    const cur=Math.min(500,has?+man:est);
    const reachP=Math.min(500,cur+rows.filter(x=>!x.own&&['rs','shop','cube'].includes(x.r.s)).reduce((a,x)=>a+x.r.p,0));
    const allP=Math.min(500,cur+rows.filter(x=>!x.own).reduce((a,x)=>a+x.r.p,0));
    out.cats.push(Object.assign({},ct,{rows,est,man:has?+man:null,cur,reachP,allP}));
    out.now+=cur*ct.v; out.reach+=reachP*ct.v; out.all+=allP*ct.v;
  }
  return out;
}
function renderCloset(){
  const host=$('closetbox'); if(!host||!colOK('closet')) return;
  const K=COLLECT.closet, st=cloState(), cls=colCls(), m=colMode(), g=S.gget('gsv',{});
  const wcat=st.cats[0], view=S.get('clocat',wcat.c), missOnly=!!S.get('clomiss',false), cnt=S.gget('clocnt','');
  const chk=r=>`<input type="checkbox" class="colchk" data-gsv="clo-${r.id}" ${g['clo-'+r.id]?'checked':''} aria-label="I own ${esc(r.n)}">`;
  const nm=r=>`<b style="color:${colGC(r.g)}">${esc(r.n)}</b>`;
  const per10=ct=>colPct(10*ct.v,2);
  let h=`<div class="box coltop"><p class="small" style="margin:0">For a <b>${esc(cls)}</b>, 10 Closet points are worth about <b>${per10(st.cats[0])}</b> damage in <b>${esc(wcat.short)}</b> skins, <b>${per10(st.cats[1])}</b> in Earring skins and <b>${per10(st.cats[2])}</b> in Necklace skins. Armor skins (helm to cloak) only add Defense to that piece, and skins for other weapons do nothing for you except count toward the skin titles.</p>
    ${SLUG==='brawler'?'<p class="small" style="margin:0"><b>Brawler is Korea only:</b> the Global client has 1 Fist skin, so only the accessory tracks apply.</p>':''}
    <div class="colpts">${st.cats.map(ct=>`<label class="colpt"><span class="small muted">${esc(ct.short)} points in game</span><input type="number" min="0" max="500" inputmode="numeric" data-clopt="${ct.c}" value="${ct.man==null?'':ct.man}" placeholder="${ct.est}"><small class="muted">${ct.man==null?`estimate from ticks: ${ct.est}`:`your ticks add up to about ${ct.est}`}</small></label>`).join('')}
      <label class="colpt"><span class="small muted">Skins owned (all slots)</span><input type="number" min="0" max="2000" inputmode="numeric" data-clocnt="1" value="${cnt}" placeholder="0"><small class="muted">for the skin titles</small></label></div>
    <div class="panbar"><span>Now <b>${colPct(st.now)}</b> damage</span><span>With every skin you can buy or farm now <b>${colPct(st.reach)}</b></span><span>Whole collection <b>${colPct(st.all)}</b></span></div>
    <p class="small muted" style="margin:0">Where to read your points: Closet (character window) › Collection tab, one bar per slot. Leave a box empty and the guide estimates from the skins you tick below (Common 1, Rare 2, Epic 3, Unique 4, Heroic and Special 5 points: one source, not in the game files). The Closet is shared by every character on your server, so ticks here count for all your classes.</p></div>`;
  // ---- titles for skin count
  const n=+cnt||0;
  h+=`<div class="box"><h3 style="margin:0 0 6px">Skin-count titles</h3><p class="small muted" style="margin:0 0 8px">Every skin counts here, including other classes' weapons and armor, so cheap skins of any kind push you toward these.</p><div class="coltitles">${K.titles.map(t=>{const done=n>=t.need;return `<div class="coltitle ${done?'on':''}"><b>${esc(t.n)}</b> <span class="small muted">${t.need===701?'over 700':t.need} skins</span><div class="small">${esc(t.eq)}</div>${colTitleRank(t)}<div class="colbar"><i style="width:${Math.min(100,100*n/t.need).toFixed(0)}%"></i></div><small class="muted">${done?'Unlocked':`${colNum(Math.max(0,t.need-n))} to go`}</small></div>`}).join('')}</div></div>`;
  // ---- easiest wins first
  const miss=[]; st.cats.forEach(ct=>ct.rows.forEach(x=>{if(!x.own) miss.push(Object.assign({ct},x))}));
  const rsMiss=miss.filter(x=>x.r.s==='rs').sort((a,b)=>b.val-a.val);
  const buy=miss.filter(x=>x.r.s==='shop'||x.r.s==='cube').sort((a,b)=>b.val/cloPrice(b.r)-a.val/cloPrice(a.r)||b.val-a.val);
  const cheap=buy.filter(x=>cloEffOf(x.r)<=2), dear=buy.filter(x=>cloEffOf(x.r)>2);
  const noneMiss=miss.filter(x=>x.r.s==='none');
  const stepItem=x=>`<li><label class="panstephead">${chk(x.r)}${cloIco(x.r)}<span>${nm(x.r)} <span class="small muted">${esc(x.ct.short)} · ${esc(x.r.g)}</span> ${colEff(cloEffOf(x.r))} <b class="panval">${colPct(x.val)}</b></span></label><div class="small">${cloHow(x.r)}</div></li>`;
  const sumv=a=>a.reduce((t,x)=>t+x.val,0);
  let steps=`<li><b>Use the skin items you already have.</b> <div class="small">Open your bag (<span class="kbd">I</span>) and use every item named "(Skin: …)": it unlocks the look in the Closet and adds its points. If the Closet says you already own it, keep the item for Skin Combine instead.</div></li>`;
  if(rsMiss.length) steps+=`<li><b>Check the Black Cloud Merchant every hour, on every character.</b> ${colEff(1)} <b class="panval">up to ${colPct(sumv(rsMiss))}</b><div class="small">Shop menu (<span class="kbd">H</span>) › Black Cloud Merchants. Free new stock every hour, different on each character, and the Closet is shared on your server, so alts give you extra rolls. A paid refresh starts at 500 Kinah (the 10th costs 15,000). Buy any of these ${rsMiss.length} when they show up, best first: ${rsMiss.slice(0,10).map(x=>`<span style="color:${colGC(x.r.g)}">${esc(x.r.n)}</span> <span class="muted">(${esc(x.ct.short)})</span>`).join(', ')}${rsMiss.length>10?`, and ${rsMiss.length-10} more in the table below`:''}.</div></li>`;
  steps+=`<li><b>Extract the gear you replace instead of selling it.</b> ${colEff(1)}<div class="small">Item Extraction can give a random skin (one guide: about 25% from Common to Epic gear, 10% from Unique and Heroic; Korean players say guards and rings never give skins). Every new skin counts toward the titles even when it is not for your slots.</div></li>`;
  steps+=cheap.slice(0,10).map(stepItem).join('');
  if(noneMiss.length) steps+=`<li><b>Combine spare skins.</b> ${colEff(2)}<div class="small">Skin Combine turns spare skins into a random skin of the same grade, or one grade higher: Common 25% (600 Kinah), Rare 20% (1,000), Epic 15% to Unique (6,000). ${noneMiss.length} of your ${esc(wcat.short)}/Earring/Necklace Uniques have no shop or drop, so Combine is the way to them. Save Lucky Auras (+10% upgrade chance; achievements give 18 Lucky Aura, 14 Rare and 1 Epic) for Epic combines. Results are random across all slots, so combine for the skin count, not for one look.</div></li>`;
  steps+=dear.slice(0,6).map(stepItem).join('');
  h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Easiest wins first</h3><p class="small muted" style="margin:0">Work down the list. Values are damage for a ${esc(cls)} from that skin's points (estimated points by grade). Tick a skin when you have it.</p><ol class="pansteps">${steps}</ol></div>`;
  // ---- full table
  const ct=st.cats.find(x=>x.c===view)||wcat;
  const rows=ct.rows.filter(x=>!missOnly||!x.own).sort((a,b)=>(a.own-b.own)||(cloEffOf(a.r)-cloEffOf(b.r))||b.val-a.val||a.r.n.localeCompare(b.r.n));
  h+=`<details class="box" open><summary class="pansum"><b>Your Closet slots</b> <span class="small muted">${st.cats.map(c=>`${esc(c.short)} ${c.rows.filter(x=>x.own).length}/${c.rows.length}`).join(' · ')}</span></summary>
    <div class="panctl" style="margin:10px 0"><div class="seg" role="group" aria-label="Closet slot">${st.cats.map(c=>`<button type="button" data-clocat="${c.c}" aria-pressed="${c.c===ct.c}">${esc(c.short)} (${c.rows.length})</button>`).join('')}</div>
    <label class="small panall"><input type="checkbox" data-clomiss="1" ${missOnly?'checked':''}> Missing only</label></div>
    ${rows.length?`<div class="tablewrap"><table class="pantable coltable"><thead><tr><th class="num">Own</th><th>Skin</th><th class="num">Points</th><th class="num">Damage</th><th>How to get it</th><th>Effort</th></tr></thead><tbody>
    ${rows.map(x=>`<tr class="${x.own?'panrowown':''}"><td class="num">${chk(x.r)}</td><td><span class="panname">${cloIco(x.r)}<span>${nm(x.r)}<small class="muted">${esc(x.r.g)}</small></span></span></td><td class="num small">${x.r.p}${x.r.g==='Special'?'?':''}</td><td class="num small">${colPct(x.val)}</td><td class="small">${cloHow(x.r)}</td><td>${colEff(cloEffOf(x.r))}</td></tr>`).join('')}</tbody></table></div>`:'<p class="small muted">Nothing to show.</p>'}</details>`;
  // ---- how it works
  const W=K.wv[SLUG]||K.wv.ranger;
  h+=`<details class="box"><summary class="pansum"><b>How the Closet bonus works</b> <span class="small muted">18 slots, 500 points each, Skin Combine odds</span></summary>
    <ul class="plain small" style="margin-top:10px">
      <li><b>Each point = +0.1%, up to 500 points (+50%) per slot.</b> Only the first copy of a skin counts. Shoulder, eye and face accessories give nothing; launch Atelier (cash-shop) skins give no points.</li>
      <li><b>Weapon slots</b> raise that weapon type's Attack ("${esc(wcat.short)} Attack increase"), so only your own weapon's skins help. Korean testing puts it on your weapon's Attack, before Weapon Damage Boost and Attack Increase. With a typical level-45 ${esc(cls)} weapon (about ${colNum(W.wav)} average Attack) each point is about ${colPct(W.w,3)} damage.</li>
      <li><b>Necklace and Earrings</b> raise that piece's Attack and Defense by 0.1% a point (about 120 Attack on a level-45 necklace, about 100 on each of your two earrings). The 7 armor slots raise that piece's Defense only.</li>
      <li><b>Centurion and Decanus</b> are the only skins with stats while worn: +1% PvP Damage Tolerance per armor piece, +2% PvP Damage Boost for the earrings and the necklace. Decanus gives the same for under a third of the Abyss Points.</li></ul>
    <div class="tablewrap" style="margin-top:8px"><table><thead><tr><th>Skin Combine</th><th>Kinah</th><th>Result</th><th>Designs (same / next grade)</th></tr></thead><tbody>${K.combine.map(r=>`<tr><td class="small">${r[0]}</td><td class="small">${r[1]}</td><td class="small">${r[2]}</td><td class="small">${r[3]}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted" style="margin:8px 0 0"><b>Not sure yet:</b> points per grade (Common 1 to Heroic 5) come from one fan guide, not the client; Special skins are assumed to be worth 5. The extraction skin chance is from one guide. Damage values use the guide's DPS simulator (Attack value of a typical level-45 ${esc(cls)}), are the same in PvP${m==='pvp'?' (estimate)':''}, and assume the earring bonus applies to both earrings. Sources: metabot.gg (Global client: skins, sources, prices, collection bonus, Combine odds), dtgre.com (points by grade), gamerblurb.com (Black Cloud Merchant), Korean community tests (inven.co.kr). Checked 18 Oct 2026.</p></details>`;
  host.innerHTML=h;
}

/* =============================== MONOLITHS =============================== */
function monoStones(f){return COLLECT.mono.stones.filter(s=>s.fac===f)}
function monoW(){const M=COLLECT.mono,w=(M.w[SLUG]||M.w.ranger)[colMode()]||{};return Object.assign({},w,(M.xw||{})[colMode()]||{})}
function monoLv(s){const L=S.gget('monolv',{});return Math.max(1,Math.min(s.max,+L[s.id]||1))}
function monoReach(s){if(s.kr) return 0; const t=s.zones.reduce((a,z)=>a+z[1],0); let l=1; s.lv.forEach((x,i)=>{if(x[0]<=t) l=i+1}); return l}
function monoSum(s,from,to){const st={},it={},ti=[];for(let i=from;i<to;i++){const x=s.lv[i];for(const k in x[1])st[k]=(st[k]||0)+x[1][k];for(const k in x[2])it[k]=(it[k]||0)+x[2][k];if(x[3])ti.push(x[3])}return {st,it,ti}}
function monoVal(st,w){let v=0;for(const k in st)v+=st[k]*(w[k]||0);return v}
function monoStatTxt(st){const M=COLLECT.mono;return Object.keys(st).map(k=>`${(M.stats[k]||[M.xst[k]||k])[0]} +${st[k]}`).join(', ')}
function monoItemTxt(it){const M=COLLECT.mono;return Object.keys(it).map(k=>`${it[k]}× ${M.items[k]||k}`).join(', ')}
function monoZoneKey(s,z){return 'mz-'+s.id+'-'+z[0].toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)}
function monoRoute(s,need,g){
  // densest zones you haven't ticked, ground pickups first, enough to cover the traces you still need
  const hi=z=>/49/.test(z[6]||'')?1:0;  // Eternal/Immortal Isle: level-49 monsters, leave for last
  const zs=s.zones.filter(z=>!g[monoZoneKey(s,z)]).slice().sort((a,b)=>hi(a)-hi(b)||(a[5]==='m')-(b[5]==='m')||b[1]-a[1]);  // Lower Reshanta before Middle
  const out=[];let got=0;for(const z of zs){if(got>=need)break;out.push(z);got+=z[1]}
  return out;
}
function renderMono(){
  const host=$('monobox'); if(!host||!colOK('mono')) return;
  const M=COLLECT.mono, f0=colFac(), f=f0==='B'?'E':f0, w=monoW(), m=colMode(), cls=colCls(), g=S.gget('gsv',{});
  const ss=monoStones(f), main=ss.find(s=>s.id==='V'||s.id==='A'), abyss=ss.find(s=>s.id.startsWith('RE')), kr=ss.filter(s=>s.kr);
  const glob=[main,abyss].filter(Boolean);
  let now=0,best=0; glob.forEach(s=>{now+=monoVal(monoSum(s,0,monoLv(s)).st,w);best+=monoVal(monoSum(s,0,monoReach(s)).st,w)});
  let h=`<div class="box coltop"><div class="panctl"><span class="small muted">Your faction</span>${colFacSeg(f)}<span class="small muted">Ranked for <b>${esc(cls)}</b> in <b>${m==='pvp'?'PvP':'PvE'}</b>. Monolith progress is shared by your characters on the server (Sync Empyrean Traces).</span></div>
    ${f0==='B'?'<p class="small" style="margin:0"><b>Pick your faction</b> (the same choice as on the Pantheon tab). Showing Elyos for now.</p>':''}
    <div class="panbar"><span>Your Monolith stats now <b>${colPct(now)}</b></span><span>Everything reachable on Global <b>${colPct(best)}</b></span></div>
    <div class="colstones">${glob.map(s=>{const L=monoLv(s),R=monoReach(s),cur=monoSum(s,0,L),nx=s.lv[L];return `<div class="colstone"><div class="eyebrow">${esc(s.n)}</div>
      <label class="small">Level <select data-monolv="${s.id}">${s.lv.map((x,i)=>`<option value="${i+1}" ${i+1===L?'selected':''}>${i+1}${i+1>R?' (not on Global yet)':''}</option>`).join('')}</select></label>
      <div class="small">${colNum(s.lv[L-1][0])} traces turned in${nx?`; next level needs ${colNum(nx[0]-s.lv[L-1][0])} more`:'; maxed'}.</div>
      <div class="small muted">${Object.keys(cur.st).length?esc(monoStatTxt(cur.st)):'No stats yet'} · worth <b class="panval">${colPct(monoVal(cur.st,w))}</b></div>
      ${cur.ti.length?`<div class="small">Titles: ${cur.ti.map(esc).join(', ')}</div>`:''}
      <div class="small muted">Stone: ${esc(s.where)}</div></div>`}).join('')}</div>
    <p class="small muted" style="margin:0">Your level is on the stone itself: walk up to the Monolith and open it. Each white feather (Empyrean Trace) you pick up is one trace; hand them in at the stone.</p></div>`;
  // ---- easiest wins first: milestone chunks
  const order=m==='pvp'?[[abyss,5],[abyss,10],[main,10],[abyss,16],[main,20],[main,30],[abyss,20]]:[[main,10],[main,20],[abyss,5],[main,30],[abyss,10],[abyss,16],[abyss,20]];
  const steps=[];const lvAt={};glob.forEach(s=>lvAt[s.id]=monoLv(s));
  for(const [s,to] of order){
    if(!s) continue; const from=lvAt[s.id]; if(from>=to) continue;
    const target=Math.min(to,s.max);
    const sum=monoSum(s,from,target), need=s.lv[target-1][0]-s.lv[from-1][0];
    steps.push({s,from,to:target,sum,need,val:monoVal(sum.st,w),route:monoRoute(s,need,g),mid:target>monoReach(s)});
    lvAt[s.id]=target;
  }
  h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Easiest wins first</h3><p class="small muted" style="margin:0">Each step is the next milestone from your level. The zones listed are the densest ones you haven't ticked below. "Air" pickups float and need flying, "water" ones are under water.</p>
    ${steps.length?`<ol class="pansteps">${steps.map(x=>{const titles=x.sum.ti.map(t=>colTitle(x.s.titles[t]||{n:t})).join('<br>');return `<li><div class="panstephead"><span><b>${esc(x.s.n)} level ${x.from} → ${x.to}</b> ${colTag(colNum(x.need)+' traces','wind')} <b class="panval">${colPct(x.val)}</b></span></div>
      <div class="small">${Object.keys(x.sum.st).length?esc(monoStatTxt(x.sum.st))+'. ':''}${Object.keys(x.sum.it).length?'Items: '+esc(monoItemTxt(x.sum.it))+'.':''}</div>${titles?`<div class="small">${titles}</div>`:''}
      ${x.mid?`<div class="small"><b>Needs Chaotic Middle Reshanta:</b> Lower Reshanta only holds 200 traces (enough for level 16); the last 100 are in Middle Reshanta (open at 45, 7 h a week).</div>`:''}
      <div class="small muted">Where: ${x.route.length?x.route.map(z=>`${esc(z[0])} (${z[1]}${z[3]?`, ${z[3]} air`:''}${z[4]?`, ${z[4]} water`:''}${z[6]&&z[6]!=='45+'?`; Lv ${esc(z[6])}`:''})`).join(', '):'every zone you have left'}. <button type="button" class="colmini" data-monoset="${x.s.id}:${x.to}">I reached level ${x.to}</button></div></li>`}).join('')}</ol>`
      :`<p class="callout ok small" style="margin:0">Everything reachable on Global is done. Spare traces at the Verteron/Altgard stone now turn into Power Shards (up to 1,120 per character).</p>`}</div>`;
  // ---- zone checklists
  for(const s of glob){
    const tot=s.zones.reduce((a,z)=>a+z[1],0), done=s.zones.filter(z=>g[monoZoneKey(s,z)]).reduce((a,z)=>a+z[1],0);
    let lvl=1; s.lv.forEach((x,i)=>{if(x[0]<=done) lvl=i+1});
    h+=`<details class="box"${s===main?' open':''}><summary class="pansum"><b>${esc(s.n)}: Empyrean Traces by zone</b> <span class="small muted">${s.zones.length} zones · ${colNum(tot)} traces · you ticked ${colNum(done)} (enough for level ${lvl})</span></summary>
      <p class="small muted" style="margin:8px 0">Tick a zone when you have picked up every trace in it (collected ones show a green check on the in-game map). You need all ${colNum(s.lv[s.lv.length-1][0])} traces for level ${s.max}${s.id.startsWith('RE')?'; Lower Reshanta zones are in the Abyss (level 45, a PvP zone)':''}.</p>
      <div class="tablewrap"><table class="pantable"><thead><tr><th class="num">Done</th><th>Zone</th><th class="num">Traces</th><th class="num">Ground</th><th class="num">Air</th><th class="num">Water</th></tr></thead><tbody>
      ${s.zones.map(z=>{const k=monoZoneKey(s,z);return `<tr class="${g[k]?'panrowown':''}"><td class="num"><input type="checkbox" class="colchk" data-gsv="${k}" ${g[k]?'checked':''} aria-label="All traces in ${esc(z[0])}"></td><td class="small">${esc(z[0])}${z[6]&&z[6]!=='45+'?` <span class="muted">Lv ${esc(z[6])}</span>`:''}${z[5]==='m'?' <span class="tag">Middle Reshanta</span>':''}</td><td class="num small"><b>${z[1]}</b></td><td class="num small">${z[2]}</td><td class="num small">${z[3]||''}</td><td class="num small">${z[4]||''}</td></tr>`}).join('')}</tbody></table></div></details>`;
  }
  // ---- level tables
  h+=`<details class="box"><summary class="pansum"><b>Every Monolith level</b> <span class="small muted">stats, items and titles per level</span></summary>${glob.concat(kr).map(s=>`<h3 style="font-size:17px;margin:14px 0 6px">${esc(s.n)}${s.kr?' <span class="tag">Korea only for now</span>':''}</h3>
    <div class="tablewrap"><table><thead><tr><th class="num">Lv</th><th class="num">Traces</th><th>Stats</th><th>Items</th></tr></thead><tbody>${s.lv.slice(1).map((x,i)=>`<tr class="${!s.kr&&i+2<=monoLv(s)?'panrowown':''}"><td class="num small">${i+2}</td><td class="num small">${colNum(x[0])}</td><td class="small">${esc(monoStatTxt(x[1]))}</td><td class="small">${esc(monoItemTxt(x[2]))}${x[3]?` <b>Title: ${esc(x[3])}</b>`:''}</td></tr>`).join('')}</tbody></table></div>`).join('')}</details>`;
  h+=`<div class="box small"><h3 style="font-size:18px">Good to know</h3><ul class="plain">
    <li><b>Unlock:</b> the level-16 quest <i>Empyrean Monolith</i> (Elyos: Luteros at Dawn Legion Base). Stats from all your faction's stones add up and are permanent.</li>
    <li><b>Alts:</b> a new character presses <b>Sync Empyrean Traces</b> at the first Monolith and gets your server's progress. A server transfer keeps it too.</li>
    <li><b>Why bother:</b> level 30 adds ${main?esc(monoStatTxt(monoSum(main,0,main.max).st)):''}, the only Revelation Amulet Enhance Scrolls in the game (30), 12 Hidden Cube keys, 18 Soul Codex: Reset and 18 Unique Amplify Stone Fragments. The level-20 title (+3% PvE Damage Boost) is one of the best PvE attack titles. Ereshkigal is the PvP stone (and pays Azphel crystals for the PvP board).</li>
    <li><b>Not on Global yet:</b> the Eltnen and Morheim Monoliths (level 46-80 regions, Korea only for now; 30 more god-stat points and Stamina +70 when they open).</li>
    <li><b>Ereshkigal levels 17-20</b> (and the Saint of Ereshkigal PvP title) need the 100 traces in Chaotic Middle Reshanta; Lower Reshanta only holds enough for level 16.</li>
    <li><b>Not sure yet:</b> Global seems to count 1 trace per pickup (one guide says traces were reduced on Global); the zone counts match exactly what each stone needs. God-stat values come from the guide's DPS simulator${m==='pvp'?'; PvP values are estimates':''}.</li></ul>
    <p class="muted" style="margin:6px 0 0">Sources: metabot.gg (Global client 0.0.4387.0: Monolith levels, rewards, traces per zone, Kibelisks), daevaguides.com, aion2hub.com, official server transfer Q&amp;A. Checked 18 Oct 2026.</p></div>`;
  host.innerHTML=h;
  renderKib();
}

/* =============================== KIBELISKS =============================== */
function renderKib(){
  const host=$('kibbox'); if(!host||!colOK('mono')) return;
  const M=COLLECT.mono, f0=colFac(), f=f0==='B'?'E':f0, list=M.kib[f]||[], fin=M.kib[f+'_final'], sv=S.get('sv',{});
  const n=list.filter(k=>sv[k.id]).length, map=f==='E'?'Verteron':'Altgard';
  const tiers=[[2000,'Towns and camps on your quest path'],[3000,'Mid-level zones'],[4000,'Sky islands, cliffs and the far corners (fly there)']];
  const row=k=>`<tr class="${sv[k.id]?'panrowown':''}"><td class="num"><input type="checkbox" class="colchk" data-sv="${k.id}" ${sv[k.id]?'checked':''} aria-label="Activated ${esc(k.n)}"></td><td class="small"><b>${esc(k.n)}</b></td><td class="small">${esc(k.zone||'')}</td><td class="small">${esc(k.lvl||'')}</td><td class="num small">${colNum(k.k)}</td></tr>`;
  const st=M.kibstatue;
  let h=`<div class="box coltop"><h3 style="margin:0">Kibelisks: activate all ${list.length} in ${map}</h3>
    <p class="small" style="margin:0">Walk up to every Kibelisk (teleport stone) on ${map} once. Each one pays 2,000 to 4,000 bound Kinah, and all ${list.length} complete <i>${esc(fin?fin.n:'')}</i>: ${colTitle(M.kibtitle)}${st?`, plus <b>Statue: ${esc(st.n)}</b> for the <a href="#pantheon" data-goto="pantheon">Pantheon</a> (${Object.keys(st.st).map(k=>`${(M.stats[k]||[k])[0]} +${st.st[k]}`).join(', ')})`:''} and 9,000 Kinah.</p>
    <div class="panbar"><span>Activated <b>${n} / ${list.length}</b></span><span>Kinah left <b>${colNum(list.filter(k=>!sv[k.id]).reduce((a,k)=>a+k.k,0))}</b></span></div>
    <p class="small muted" style="margin:0">Saved per character. Activated Kibelisks show as destinations on the World Map (<span class="kbd">M</span>), which also has a Kibelisk list for your map: anything missing there is still to do.</p></div>`;
  const firstOpen=tiers.findIndex(([kk])=>list.some(x=>x.k===kk&&!sv[x.id]));
  h+=tiers.map(([k,t],i)=>{const ks=list.filter(x=>x.k===k), left=ks.filter(x=>!sv[x.id]).length;return `<details class="box"${i===firstOpen?' open':''}><summary class="pansum"><b>${i+1}. ${t}</b> <span class="small muted">${ks.length} Kibelisks · ${colNum(k)} Kinah each · ${left} left</span></summary>
    <div class="tablewrap" style="margin-top:10px"><table class="pantable"><thead><tr><th class="num">Done</th><th>Kibelisk</th><th>Zone</th><th>Zone level</th><th class="num">Kinah</th></tr></thead><tbody>${ks.map(row).join('')}</tbody></table></div></details>`}).join('');
  host.innerHTML=h;
}

/* =============================== ACHIEVEMENTS =============================== */
function achAll(){const out=[];COLLECT.ach.groups.forEach(g=>g.rows.forEach(r=>out.push({g,r})));return out}
function achRew(r){return r.rew.filter(x=>!/^Title: /.test(x[1])).map(x=>`${x[0]>1?colNum(x[0])+'× ':''}${esc(x[1])}`).join(', ')}
function achTitle(r){return r.ti?colTitle(r.ti):''}
function renderAch(){
  const host=$('achbox'); if(!host||!colOK('ach')) return;
  const A=COLLECT.ach, sv=S.get('sv',{}), all=achAll(), cls=colCls();
  const open=all.filter(x=>!sv[x.r.id]);
  const chk=r=>`<input type="checkbox" class="colchk" data-sv="${r.id}" ${sv[r.id]?'checked':''} aria-label="Done ${esc(r.n)}">`;
  const sumOf=(list,re)=>list.reduce((t,x)=>t+x.r.rew.filter(i=>re.test(i[1])).reduce((a,i)=>a+i[0],0),0);
  const season=open.filter(x=>x.g.season);
  const ef=x=>x.r.e!=null?x.r.e:x.g.eff;
  const effTag=e=>colTag(e===9?'Not now':A.effn[e]||'',e===0?'wind':e>=3?'gold':'');
  const item=x=>`<li><label class="panstephead">${chk(x.r)}<span><b>${esc(x.r.n)}</b> <span class="small muted">${esc(x.g.n)}</span> ${effTag(ef(x))}</span></label>
    <div class="small">${esc(x.r.goal)}${x.r.t&&x.r.t!=='—'?` <span class="muted">(tiers: ${esc(x.r.t)})</span>`:''}</div><div class="small">${achTitle(x.r)}${x.r.ti?'<br>':''}<span class="muted">All tiers pay:</span> ${achRew(x.r)}</div></li>`;
  const avail=open.filter(x=>ef(x)!==9);
  const easy=avail.slice().sort((a,b)=>b.r.sc/achCost(ef(b))-a.r.sc/achCost(ef(a))||b.r.sc-a.r.sc).slice(0,15);
  const best=avail.slice().sort((a,b)=>b.r.sc-a.r.sc).slice(0,15).filter(x=>!easy.includes(x));
  let h=`<div class="box coltop"><p class="small" style="margin:0"><b>${all.length} achievements</b> (plus the 124 Kibelisk ones on the <a href="#monoliths" data-goto="monoliths">Monoliths</a> tab). Every tier pays its own reward and ${all.filter(x=>x.r.ti).length} give a title. <b>Season 1 achievements only count until ${esc(A.seasonEnd)}</b>: what you have left there pays <b>${colNum(sumOf(season,/^Oath Coin/))} Oath Coin</b> (Talisra Wings cost 210,000), ${colNum(sumOf(season,/^Abyss Points/))} Abyss Points, ${colNum(sumOf(season,/^Soul Codex$/))} Soul Codex and ${colNum(sumOf(season,/^Amplify Stone \(Unique\)/))} Unique Amplify Stones.</p>
    <div class="panbar"><span>Done <b>${all.length-open.length} / ${all.length}</b></span><span>Season 1 left <b>${season.length}</b></span></div>
    <p class="small muted" style="margin:0">Saved per character. Tick an achievement once you have its last tier (or when you stop at the tier you want). Open the in-game list from the Journal / Achievements menu to see your tiers.</p></div>`;
  h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Easiest wins first</h3><p class="small muted" style="margin:0">Biggest reward for the least effort. Rewards count titles you would equip, Soul Codex, Amplify Stones, Oath Coin, Pantheon decorations, Lucky Auras and Hidden Cube keys the most.</p><ol class="pansteps">${easy.map(item).join('')}</ol></div>`;
  if(best.length) h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Best rewards (harder)</h3><ol class="pansteps">${best.map(item).join('')}</ol></div>`;
  const gsort=A.groups.slice().sort((a,b)=>b.season-a.season||a.eff-b.eff||a.n.localeCompare(b.n));
  h+=`<div class="box" style="display:grid;gap:8px"><h3 style="margin:0">All achievements by group</h3>${gsort.map(g=>{const left=g.rows.filter(r=>!sv[r.id]).length;return `<details class="coldet"><summary class="pansum"><b>${esc(g.n)}</b> <span class="small muted">${g.season?'Season 1 (until '+esc(A.seasonEnd)+') · ':''}${A.effn[g.eff]} · ${g.rows.length-left}/${g.rows.length} done${g.id==='sanctuary'?' · the Ludra raid is offline on Global for a rework':''}</span></summary>
    <div class="tablewrap" style="margin-top:8px"><table class="pantable coltable"><thead><tr><th class="num">Done</th><th>Achievement</th><th>Goal (first tier)</th><th>Tiers</th><th>All tiers pay</th></tr></thead><tbody>${g.rows.slice().sort((a,b)=>b.sc-a.sc).map(r=>`<tr class="${sv[r.id]?'panrowown':''}"><td class="num">${chk(r)}</td><td class="small"><b>${esc(r.n)}</b></td><td class="small">${esc(r.goal)}</td><td class="small">${esc(r.t)}</td><td class="small">${r.ti?achTitle(r)+'<br>':''}${achRew(r)}</td></tr>`).join('')}</tbody></table></div></details>`}).join('')}</div>`;
  h+=`<div class="box small"><h3 style="font-size:18px">Good to know</h3><ul class="plain">
    <li>Achievements unlock at level 9. Season 1 ones (Abyss, Arena, Nightmare, Transcendence, Ascension Trial and the weekly challenges) stop counting at the end of Season 1; the rest never reset.</li>
    <li>Titles from achievements are ranked on the <a href="#titles" data-goto="titles">Titles</a> tab; tick them there too once you have them.</li>
    <li><b>Not sure yet:</b> which achievements are shared across your characters on a server (NC hasn't said). The reward ranking is the guide's estimate.</li></ul>
    <p class="muted" style="margin:6px 0 0">Sources: metabot.gg (Global client 0.0.4387.0: every achievement, tier and reward). Checked 18 Oct 2026.</p></div>`;
  host.innerHTML=h;
}

/* =============================== events =============================== */
function renderCollect(){renderCloset();renderMono();renderAch()}
document.addEventListener('change',e=>{
  const t=e.target; if(!t||!t.dataset) return;
  const gk=t.dataset.gsv, k=t.dataset.sv;
  if(gk&&gk.startsWith('clo-')){renderCloset();return}
  if(gk&&gk.startsWith('mz-')){renderMono();return}
  if(k&&k.startsWith('kib-')){renderKib();return}
  if(k&&k.startsWith('ach-')){renderAch();return}
  if(t.dataset.clopt){const p=S.gget('clopts',{});if(t.value==='')delete p[t.dataset.clopt];else p[t.dataset.clopt]=Math.max(0,Math.min(500,Math.round(+t.value)||0));S.gset('clopts',p);renderCloset();return}
  if(t.dataset.clocnt){S.gset('clocnt',t.value===''?'':Math.max(0,Math.round(+t.value)||0));renderCloset();return}
  if(t.dataset.clomiss){S.set('clomiss',t.checked);renderCloset();return}
  if(t.dataset.monolv){const L=S.gget('monolv',{});L[t.dataset.monolv]=+t.value;S.gset('monolv',L);renderMono();return}
});
document.addEventListener('click',e=>{
  const c=e.target.closest&&e.target.closest('[data-clocat]'); if(c){S.set('clocat',c.dataset.clocat);renderCloset();return}
  const f=e.target.closest&&e.target.closest('[data-colfac]'); if(f){S.set('panfac',f.dataset.colfac);renderMono();if(typeof renderPantheon==='function')renderPantheon();return}
  const ms=e.target.closest&&e.target.closest('[data-monoset]'); if(ms){const [id,lv]=ms.dataset.monoset.split(':');const L=S.gget('monolv',{});L[id]=+lv;S.gset('monolv',L);renderMono();return}
  if(e.target.closest&&e.target.closest('[data-panfac]')) setTimeout(renderMono,0); // faction picked on the Pantheon tab
  if(e.target.closest&&e.target.closest('#modepickTop button')) renderCollect(); // PvE/PvP switch
});
{const _ap=window.applyStore; if(typeof _ap==='function') window.applyStore=function(){const r=_ap.apply(this,arguments);renderCollect();return r}}
try{renderCollect()}catch(err){console.error(err);const d=$('closetbox')||$('monobox');if(d)d.insertAdjacentHTML('afterbegin','<p class="callout small">This section could not load. Please tell Claude.</p>')}

/* ---------- Pet collection guide (Pets tab): every pet, best ones per class, easiest first, owned checklist (data: PETGUIDE) ---------- */
/* Owned ticks are server-wide (S.gget('gsv')) and reuse the old Pet ladder keys 'pet-<slug>', so earlier ticks carry over. */
const PG_FACN={E:'Elyos',A:'Asmodian',B:'Both factions'}, PG_MAPF={V:'E',A:'A'}, PG_REGN={V:'Verteron',A:'Altgard',L:'Lower Reshanta (Abyss)',M:'Middle Reshanta (Abyss)',K:'Korea-only zone',I:'dungeon'};
const PG_FCOL={C:'#7FB8FF',F:'#FF8A6B',N:'#7ED67E',V:'#F2C94C',S:'#00FFD8'};
const PG_OPEN={}; // details open/closed, kept across re-renders
let PG_CTX={}; // last plan's pick-one suggestions (used by the step texts)
const PG_MAILEND=Date.UTC(2026,11,8); // launch reward mail expires 8 Dec 2026
function pgOK(){return typeof PETGUIDE!=='undefined'&&PETGUIDE&&PETGUIDE.d}
function pgE(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function pgMode(){return (typeof MODE!=='undefined'&&MODE==='pvp')?'pvp':'pve'}
function pgCls(){return (typeof SLUG!=='undefined'&&PETGUIDE.val[SLUG])?SLUG:'ranger'}
function pgFac(){const f=S.gget('pgfac',null);if(f)return f;const p=S.get('panfac','B');return p||'B'}
function pgLvl(){let l=parseInt(S.get('pglvl',45),10);if(!(l>=1&&l<=45))l=45;return l}
function pgOwned(){return S.gget('gsv',{})}
function pgFam(f){return PETGUIDE.fam[f]}
/* ---- effort of one source for your faction and level: 0 Free, 1 Easy, 2 Medium, 3 Hard, -1 = not available to you ---- */
function pgSrcEff(s,fac,P,ctx,p){
  const t=s[0];
  if(t==='q'){ if(ctx.q10!==p.id) return {e:-1}; return {e:0,t:'Quest'} } // the level-10 quest gives 1 of 3: only the suggested pick counts as free
  if(t==='m'){
    const lv=s[2],reg=s[3],sp=s[4],rk=s[5];
    if(reg==='K') return {e:-1,kr:1};
    let e, why=[];
    if(rk==='Hero'){e=3;why.push('field boss')}
    else if(reg==='I'){e=3;why.push('instance')}
    else{
      e=lv<=P?1:(lv<=Math.min(P+3,48)?2:3);
      if(lv>P) why.push(lv>45?'above the level cap':'above your level');
      if(P<45&&lv<P-10){e++;why.push('over 10 levels below you')}
      if(rk==='Elite'){e++;why.push('elite')}
      if(sp&&sp<8){e++;why.push('few spawns')}
    }
    if(reg==='L'||reg==='M'){ if(P<45) e=3; else e=Math.max(e+1,2); why.push('Abyss PvP zone') }
    const mine=fac==='B'?null:(fac==='E'?'V':'A'), other=!!(mine&&(reg==='V'||reg==='A')&&reg!==mine);
    if(other){e++;why.push('other faction’s map')}
    return {e:Math.min(e,3),other,why,t:rk==='Hero'?'Field boss':(reg==='L'||reg==='M')?'Abyss':'Monster'};
  }
  if(t==='d') return {e:s[2]<=P?2:3,t:'Dungeon boss',why:s[2]>P?['above your level']:[]};
  if(t==='v') return {e:3,t:/Pass/.test(s[1])?'Pass shop':'Shop'};
  return {e:-1};
}
/* best way to get a pet right now */
function pgBest(p,fac,P,ctx){
  let best=null; const all=[];
  for(const s of p.s){const r=pgSrcEff(s,fac,P,ctx,p); r.s=s; if(s[0]==='m'||s[0]==='d') all.push(r); if(r.e<0) continue;
    const lv=s[2]||0, lvpen=P<45?Math.abs(P-2-lv):lv, key=[r.e,r.other?1:0,lvpen,-(s[4]||0)];
    if(!best||pgCmp(key,best.key)<0){best=r;best.key=key}}
  const free=[];
  if(p.mail&&Date.now()<PG_MAILEND) free.push({e:0,t:'Launch mail',kind:'mail'});
  if(p.pick==='adv'&&ctx.adv===p.id&&Date.now()<PG_MAILEND) free.push({e:0,t:'Launch mail',kind:'adv'});
  if(free.length&&(!best||best.e>0)) best=free[0];
  if(!best&&p.kinah) best={e:1,t:'Kinah',kind:'kinah'};
  if(!best&&p.paid) best={e:3,t:'Paid',kind:'paid'};
  if(!best&&p.none) best={e:-1,t:'Not yet',kind:'none'};
  if(!best&&Object.keys(p.lk||{}).length) best={e:3,t:'Luck',kind:'luck',kr:all.some(r=>r.kr)};
  if(!best) best={e:-1,t:'Not yet',kind:'none'};
  best.alts=all.filter(r=>r!==best&&r.e>=0&&r.e<=Math.max(best.e,1)+1).sort((a,b)=>a.e-b.e||a.s[2]-b.s[2]).slice(0,2);
  best.kr=best.kr||all.some(r=>r.kr);
  return best;
}
/* "pick X" text for the pick-one rewards: why this member (the one hardest to get any other way) */
function pgPickWhy(g,p,ids){
  const nm=id=>{const q=PETGUIDE.d.find(x=>x.id===id);return q?q.n:id}, n=ids.length===3?'three':'four';
  const top=(PG_CTX[g+'top']&&PG_CTX[g+'top'].length)?PG_CTX[g+'top']:[p.id], rest=ids.filter(id=>!top.includes(id)).map(nm);
  if(top.length>=ids.length) return `<b>${pgE(p.n)}</b>: all ${n} are about as easy to get later, so any of them is fine`;
  if(top.length===1) return `<b>${pgE(p.n)}</b>: of ${ids.map(nm).join(', ').replace(/, ([^,]*)$/,' and $1')} it is the hardest to get any other way`;
  return `<b>${pgE(p.n)}</b> (or ${top.filter(id=>id!==p.id).map(nm).join(' or ')}): ${top.length===2?'both are':'they are'} harder to get any other way than ${rest.join(' and ')}`;
}
function pgCmp(a,b){for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]<b[i]?-1:1}return 0}
function pgZone(s){return `${s[6]?pgE(s[6])+', ':''}${PG_REGN[s[3]]||''}`}
/* super-easy steps for the chosen source */
function pgHow(p,b,short){
  const s=b.s, reg=()=>' Then open <b>Pets</b> and register it.';
  let h='';
  if(b.kind==='mail') h=`<b>Free:</b> open <b>Advance: Pet Chest</b> from your launch reward mail (log in by 1 Dec; the mail expires 8 Dec). Pagati is inside.`;
  else if(b.kind==='adv') h=`<b>Free (pick 1 of 4):</b> in the launch reward mail, open <b>Advance: Pet Chest</b>, then the <b>Advance: Pet Selection Chest</b> inside, and pick ${pgPickWhy('adv',p,['papis','silver-blade-rotan','konutin-worker','black-smoke-murute'])}${p.id==='black-smoke-murute'?' (no monster drops it)':''}. Log in by 1 Dec; the mail expires 8 Dec.`;
  else if(b.kind==='kinah') h=`${pgE(p.kinah)}.`;
  else if(b.kind==='paid') h=`<b>Paid:</b> ${pgE(p.paid)}.`;
  else if(b.kind==='none') h=pgE(p.none||'No way to get it on Global yet')+'.';
  else if(b.kind==='luck'){
    const F=pgFam(p.f), n=PETGUIDE.counts[p.f], lk=p.lk||{}, w=[];
    if(lk.rs) w.push('check the <b>Black Cloud Merchant</b> (random stock that changes every hour, different on each character)');
    if(lk.fc) w.push(`open <b>Pet Chest: ${F.n}</b> boxes (achievement “My Reliable Friends”, Daeva Pass; 1 in ${n} each)`);
    if(lk.my) w.push(`<b>Mysterious Pet Chest</b> (${lk.my}%)`);
    if(lk.gr) w.push(`<b>Growth Pet Chest</b> from Ascension Trials and attendance (${lk.gr}%)`);
    h=`<b>No monster drops it on Global.</b> ${w.length?w.join('; ').replace(/^./,c=>c.toUpperCase())+'.':''}`;
    if(b.kr){const k=p.s.find(x=>x[0]==='m'&&x[3]==='K'); if(k) h+=` Its monster (${pgE(k[1])}, level ${k[2]}) lives in a Korea-only zone.`}
  }
  else if(s&&s[0]==='q'){
    const qs=p.s.filter(x=>x[0]==='q'), fac=pgFac();
    const qe=qs.find(x=>x[4]==='V'), qa=qs.find(x=>x[4]==='A');
    const part=[]; if(qe&&fac!=='A') part.push(`<i>${pgE(qe[1])}</i> (Elyos: ${pgE(qe[3].split(' · ')[0])}, ${pgE((qe[3].split(' · ')[1]||'').split(',')[0])})`);
    if(qa&&fac!=='E') part.push(`<i>${pgE(qa[1])}</i> (Asmodian: ${pgE(qa[3].split(' · ')[0])}, ${pgE((qa[3].split(' · ')[1]||'').split(',')[0])})`);
    h=`<b>Free (pick 1 of 3):</b> do the level-10 Episode quest ${part.join(' or ')} and pick ${pgPickWhy('q10',p,['fossa','armadon','tog'])}. Farm the other two.`;
  }
  else if(s&&s[0]==='m'){
    const lv=s[2], hero=s[5]==='Hero';
    h=`Go to <b>${pgZone(s)}</b> and kill <b>${pgE(s[1])}</b> (level ${lv}${s[4]?`, ${s[4]} spawns`:''}${s[5]==='Elite'?', elite':''}) ${hero?'until you have 5 souls: it is a field boss on a spawn timer, so join the crowd or your legion':`5 times: ${s[7]>=100?'every kill drops a soul':`about ${Math.round(s[7])}% of kills drop a soul`}`}.`;
    if(s[3]==='L'||s[3]==='M') h+=` This is the Abyss: a PvP zone from level 45${s[3]==='M'?' (one guide says Middle Reshanta also needs about 3,000 Item Level)':''}, so go with friends.`;
    if(b.other) h+=` It is on the other faction’s map: get there through a Spacetime Rift (turn War Mode off first).`;
    if(lv>pgLvl()&&lv<=45) h+=` Easier from level ${lv}.`;
    if(pgLvl()<45&&lv<pgLvl()-10) h+=` You are over 10 levels above it, so players report fewer souls until you reach 45.`;
    h+=reg();
  }
  else if(s&&s[0]==='d') h=`Run <b>${pgE(s[1])}</b> (${pgE((s[5]||'dungeon').toLowerCase())}${s[4]?`; entrance: ${pgE(s[4])}`:''}) and kill the boss <b>${pgE(s[3])}</b> 5 times: every kill drops a soul. The level-${s[2]} version counts.${reg()}`;
  else if(s&&s[0]==='v') h=`Buy it in the <b>${pgE(s[1])}</b> for ${pgE(s[2])} ${pgE(s[3])}${s[4]?` (${pgE(s[4])})`:''}.`;
  if(p.note) h+=` <span class="muted">${pgE(p.note)}.</span>`;
  if(short) return h;
  if(b.alts&&b.alts.length) h+=` <span class="muted">Also: ${b.alts.map(a=>a.s[0]==='d'?`${pgE(a.s[3])} in ${pgE(a.s[1])}`:`${pgE(a.s[1])} (level ${a.s[2]}, ${pgE(PG_REGN[a.s[3]]||'')})`).join('; ')}.</span>`;
  if(p.prereg) h+=` <span class="muted">Pre-registered? It was in your Pre-Registration: Pet Selection Chest.</span>`;
  if(b.kind!=='luck'&&p.lk&&p.lk.rs&&(b.e>=2||b.kind==='paid')) h+=` <span class="muted">It can also turn up at the Black Cloud Merchant.</span>`;
  return h;
}
function pgVal(p,cls,m){const v=PETGUIDE.val[cls][m][p.f];return p.l3?v[1]:v[0]}
function pgPlan(){
  const P=PETGUIDE, cls=pgCls(), m=pgMode(), fac=pgFac(), L=pgLvl(), own=pgOwned();
  const has=id=>{const p=P.d.find(x=>x.id===id);return !!(p&&own[p.k])};
  // pick-one rewards (level-10 quest: 1 of 3; launch Selection Chest: 1 of 4): suggest the member that is hardest to get any other way
  const Q10=['fossa','armadon','tog'], ADV=['papis','silver-blade-rotan','konutin-worker','black-smoke-murute'];
  const ctx={q10:null,adv:null,q10ids:Q10,advids:ADV};
  const pickOf=(ids,g)=>{const c=[];for(const id of ids){const p=P.d.find(x=>x.id===id);if(!p)continue;const b=pgBest(p,fac,L,ctx);
      c.push({id,ea:(b.kind==='luck'||b.e<0)?4:b.e,v:pgVal(p,cls,m)})}
    c.sort((a,b)=>b.ea-a.ea||b.v-a.v); ctx[g+'top']=c.filter(x=>x.ea===c[0].ea).map(x=>x.id); return c.length?c[0].id:null};
  const q10=(Q10.some(has)||!!own['pet-fossa-armadon-tog'])?null:pickOf(Q10,'q10');
  const adv=(ADV.some(has)||Date.now()>=PG_MAILEND)?null:pickOf(ADV,'adv');
  ctx.q10=q10; ctx.adv=adv; PG_CTX=ctx;
  const all=P.d.map(p=>{const b=pgBest(p,fac,L,ctx);return {p,b,own:!!own[p.k],v:pgVal(p,cls,m),ef:b.e}});
  const lvOf=x=>x.b.s&&'mdq'.includes(x.b.s[0])&&x.b.s[2]?x.b.s[2]:0;
  const rank=(a,b)=>(a.ef<0)-(b.ef<0)||a.ef-b.ef||b.v-a.v||(L<45?Math.abs(L-2-lvOf(a))-Math.abs(L-2-lvOf(b)):lvOf(a)-lvOf(b))||a.p.n.localeCompare(b.p.n);
  const next=all.filter(x=>!x.own&&x.ef>=0).sort(rank);
  return {P,cls,m,fac,L,own,all,next,rank,ctx};
}
function pgIco(p){const src=(PETGUIDE.icons||[])[p.ic], c=p.g==='Special'?'#00FFD8':'#C3C3C3';
  return src?`<img class="pgico" src="${src}" alt="" width="30" height="30" loading="lazy" style="border-color:${c}">`:`<span class="pgico pgnoimg" style="border-color:${c}">${pgFam(p.f).em}</span>`}
function pgFtag(f){const F=pgFam(f);return `<span class="pgfam" style="--fc:${PG_FCOL[f]}">${F.em} ${F.n}</span>`}
function pgEff(x){
  if(x.ef<0) return `<span class="tag">${x.b.kind==='none'?'Not yet':'Not for you'}</span>`;
  const t=x.b.kind==='luck'?'Luck':x.b.kind==='paid'?'Paid':PETGUIDE.eff[x.ef];
  return `<span class="tag ${x.ef<=1?'wind':x.ef===3?'gold':''}">${t}</span>`}
function pgV(v){return v<1?'&lt;1':Math.round(v)}
function pgChk(x){return `<input type="checkbox" class="pgchk" data-gsv="${x.p.k}" ${x.own?'checked':''} aria-label="I own ${pgE(x.p.n)}">`}
function pgXpLvl(xp){const T=PETGUIDE.xp;let l=1,acc=0;for(const n of T){if(xp>=acc+n){acc+=n;l++}else break}return l}
function renderPetGuide(){
  if(!pgOK()) return;
  pgCss();
  const host=pgHost(); if(!host) return;
  const pl=pgPlan(), P=pl.P, cls=pl.cls, m=pl.m, fac=pl.fac, L=pl.L, own=pl.own;
  const cn=(typeof C!=='undefined'&&C&&C['class'])||cls;
  const fams='CFNVS'.split('').sort((a,b)=>P.val[cls][m][b][1]-P.val[cls][m][a][1]);
  const parts=P.parts[cls][m];
  const nOwn=pl.all.filter(x=>x.own).length;
  const filt=S.gget('pgff','all'), miss=!!S.gget('pgmiss',false);
  const top=pl.next.slice(0,10);
  const topFam=pgFam(fams[0]).n;
  // ---- what to do + controls
  let h=`<div class="box pgtop"><h3 style="margin:0">Pet collection</h3><p class="pgdo"><b>What to do:</b> tick the pets you own, then get the ones under “Next pets to get” from the top: free ones first, then easy ${topFam} pets (the best family for a ${pgE(cn)}). Every new pet adds Genus Insight EXP and counts toward the 100-crystal milestones.</p><div class="pgctl"><span class="small muted">Your faction</span><div class="seg" role="group" aria-label="Faction">${['E','A','B'].map(f=>`<button type="button" data-pgfac="${f}" aria-pressed="${fac===f}">${f==='B'?'Show both':PG_FACN[f]}</button>`).join('')}</div>
    <label class="small muted pglv">Your level <input type="number" min="1" max="45" step="1" value="${L}" data-pglvl="1" inputmode="numeric" aria-label="Your character level"></label>
    <span class="small muted">Ranked for <b>${pgE(cn)}</b> in <b>${m==='pvp'?'PvP':'PvE'}</b> (switch PvE/PvP in the top bar).</span></div>
    ${fac==='B'?`<p class="small" style="margin:0"><b>Pick your faction</b> so the steps send you to your own map (Elyos farm Verteron, Asmodians farm Altgard).</p>`:''}</div>`;
  // ---- legacy ticks from the old ladder
  // old ladder rows that covered several pets: only shown to people who used the old list (keys only it wrote), until they press Done
  const oldUser=['pet-fossa-armadon-tog','pet-kerubian-kerubar-kerubiel','pet-enemy-faction-pets','pet-chest-only-pets'].some(k=>own[k])||Object.keys(own).some(k=>k.startsWith('petfam-'));
  const leg=oldUser?(P.legacy||[]).filter(g=>own[g.k]):[];
  if(leg.length&&!own['petmig-done']) h+=`<div class="callout small pgleg"><b>From your old pet list:</b> these rows covered more than one pet. Tick the ones you really have:
    ${leg.map(g=>`<div class="pglegrow"><span class="muted">${pgE(g.t)}:</span> ${g.p.map(id=>{const q=P.d.find(x=>x.id===id);return `<label class="pglab"><input type="checkbox" class="pgchk" data-gsv="${q.k}" ${own[q.k]?'checked':''}> ${pgE(q.n)}</label>`}).join(' ')}</div>`).join('')}
    <button type="button" class="pgbtn" data-pgmig="1">Done</button></div>`;
  // ---- collection progress + milestones
  const nm=(P.miles||[]).find(x=>x[0]>nOwn), got=(P.miles||[]).filter(x=>x[0]<=nOwn), cry=got.filter(x=>/Crystal/.test(x[1])).length*100;
  h+=`<div class="box" style="display:grid;gap:12px"><h3 style="margin:0">Your collection</h3>
    <div class="pgbar"><span>Owned <b>${nOwn} / ${P.d.length}</b></span>${nm?`<span>Next reward at <b>${nm[0]}</b> pets: ${pgE(nm[1])} (${nm[0]-nOwn} to go)</span>`:''}<span>Milestone crystals so far <b>${cry.toLocaleString('en-US')}</b></span></div>
    <div class="pgfams">${'CFNVS'.split('').map(f=>{const F=pgFam(f), tot=P.counts[f], o=pl.all.filter(x=>x.p.f===f&&x.own).length, xp=o*500, rk=parts[f].rank;
      return `<div class="pgfamcard" style="--fc:${PG_FCOL[f]}"><div class="pgfamhead"><b>${F.em} ${F.n}</b><span class="readout">${o}/${tot}</span></div>
        <div class="pgmeter" role="img" aria-label="${o} of ${tot} ${F.n} pets"><i style="width:${tot?Math.round(100*o/tot):0}%"></i></div>
        <div class="small muted">Genus board #${rk} for you · pet EXP ${xp.toLocaleString('en-US')} (Insight Lv ${pgXpLvl(xp)} on its own)</div>
        <div class="small">${f==='S'?'No owned stats: Insight EXP only':`Each pet: ${pgE(F.lv[0])}; at pet Lv3 ${pgE(F.lv[2])}`}</div></div>`}).join('')}</div>
    <p class="small muted" style="margin:0">Milestones: 100 Soul Crystals at 5, 10, 20, 30, 40 pets and every 10 after that; every 50th gives 10 Empathy Candy instead. 200 pets = title <b>Rule All Creation</b> (owned: Move Speed +1%).</p></div>`;
  // ---- next pets to get
  h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Next pets to get</h3>
    <p class="small muted" style="margin:0">Easiest first; when two are just as easy, the better one for a ${pgE(cn)} comes first. Tick a pet when you have it and the list moves on.${L<45?` Set for level ${L}: monsters above your level wait until later.`:''}</p>
    ${top.length?`<ol class="pgsteps">${top.map(x=>`<li><label class="pgstephead">${pgChk(x)}${pgIco(x.p)}<span><b>${pgE(x.p.n)}</b> ${pgFtag(x.p.f)} ${pgEff(x)} <span class="pgval" title="Value for a ${pgE(cn)} (100 = best)">value ${pgV(x.v)}</span></span></label>
      <div class="small">${pgHow(x.p,x.b)}</div></li>`).join('')}</ol>`:`<p class="callout ok small" style="margin:0">You own every pet you can get right now.</p>`}</div>`;
  // ---- best families for this class
  const mx=P.val[cls][m][fams[0]][1]||1;
  h+=`<details class="box" data-pgd="best" ${PG_OPEN.best?"open":""}><summary class="pgsum"><b>Best pets for a ${pgE(cn)}</b> <span class="small muted">why ${topFam} comes first, and which pets to level</span></summary>
    <div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>Family</th><th class="num">Value</th><th>Why</th></tr></thead><tbody>
    ${fams.map(f=>{const F=pgFam(f), pa=parts[f], v=P.val[cls][m][f][1], dm=pa.st3/5000;
      return `<tr><td class="small">${pgFtag(f)}</td><td class="num small">${pgV(v)}</td><td class="small">Genus board #${pa.rank} for you${f==='S'?' (Double Chance lives on the Special board)':''}: 500 Insight EXP per pet${f==='S'?'':' + 250 at pet Lv2 + 250 at Lv3'}${f==='S'?'. No owned stats, and Special pets have no souls to level them.':`. At pet Lv3 each one adds ${pgE(F.lv[2])}${dm>=0.005?` (worth about +${dm.toFixed(2)}% ${m==='pvp'?'in PvP':'damage'} per pet)`:''}.`}</td></tr>`}).join('')}</tbody></table></div>
    <p class="small" style="margin:10px 0 0"><b>Levelling pets:</b> a pet goes to Lv2 with 25 more souls and to Lv3 (the Global cap) with 75 more, from the same monster. Unlock new pets first (5 souls each), then level ${topFam} pets: their Lv3 bonus is worth the most to you.</p>
    <p class="small muted" style="margin:6px 0 0">Value 100 = the best pet for you. It adds three things: the pet’s 500 + 250 + 250 Insight EXP on its family’s board (weighted by how much that board matters to a ${pgE(cn)}), the family’s owned bonus at pet Lv3 (weighted by the guide’s simulator stat values${m==='pvp'?'; PvP values are estimates':''}), and its share of the milestone crystals. HP, Evasion and Crit Resist values are estimates by role.</p></details>`;
  // ---- full table
  let rows=pl.all.filter(x=>(filt==='all'||x.p.f===filt)&&(!miss||!x.own)).sort(pl.rank);
  h+=`<details class="box" data-pgd="all" ${PG_OPEN.all!==false?"open":""}><summary class="pgsum"><b>All pets</b> <span class="small muted">${P.d.length} in the Global client · you own ${nOwn} · easiest first</span></summary>
    <div class="pgctl" style="margin:10px 0"><div class="seg" role="group" aria-label="Family">${[['all','All'],...'CFNVS'.split('').map(f=>[f,pgFam(f).n])].map(([k,t])=>`<button type="button" data-pgff="${k}" aria-pressed="${filt===k}">${t}</button>`).join('')}</div>
      <label class="small pgall"><input type="checkbox" data-pgmiss="1" ${miss?'checked':''}> Missing only</label></div>
    <div class="tablewrap"><table class="pgtable"><thead><tr><th class="num">Own</th><th>Pet</th><th>How to get it</th><th class="num">Level</th><th>Effort</th><th class="num">Value</th></tr></thead><tbody>
    ${rows.map(x=>{const s=x.b.s, lv=s&&'mdq'.includes(s[0])&&s[2]?s[2]:'—';return `<tr class="${x.own?'pgrowown':''}"><td class="num">${pgChk(x)}</td><td><span class="pgname">${pgIco(x.p)}<span><b style="color:${x.p.g==='Special'?'#00FFD8':'inherit'}">${pgE(x.p.n)}</b><small>${pgE(x.p.g)} · ${pgFam(x.p.f).n} · ${x.p.f==='S'?'mount only':'mount + transform'}${pgFacOnly(x.p)}</small></span></span></td><td class="small">${pgHow(x.p,x.b,true)}</td><td class="num small">${lv}</td><td>${pgEff(x)}</td><td class="num small">${pgV(x.v)}</td></tr>`}).join('')}
    </tbody></table></div></details>`;
  // ---- good to know
  h+=`<div class="box small"><h3 style="font-size:18px">Good to know</h3><ul class="plain">
    <li><b>Every pet is a mount.</b> All 207 ride at the same speed (run 900, sprint 1,200). The 200 non-Special pets can also be used to transform with Empathy Candy.</li>
    <li><b>5 souls unlock a pet</b> (+500 Insight EXP to its family board). <b>25 more</b> souls = pet Lv2 (+250 EXP and the Lv2 bonus), <b>75 more</b> = Lv3 (+250 EXP). Global stops at Lv3; Korea goes to Lv5.</li>
    <li><b>Owned bonuses stack</b> across every pet you own, ridden or not, and pets are shared by all your characters on the server.</li>
    <li><b>Soul chances:</b> the client lists 100% per kill for every monster source. Players report much lower drops when you are more than 10 levels above the monster (until 45), so farm near your level.</li>
    <li><b>Luck sources:</b> the Black Cloud Merchant sells about 200 pet items in random stock; Pet Chest / Pet Soul Chest boxes (achievements, Daeva Pass) give a random pet or 3 souls of their family; a duplicate pet item turns into a soul.</li>
    <li><b>Not sure yet:</b> how to reach the other faction’s map (Spacetime Rift with War Mode off comes from the earlier guide); the Middle Reshanta gear check (one guide); White Bunny and Chonky Hamster prices; “Two” has no known source. Three pets (Elite Dratona, Elite Karnif, Pretor Veil Administrator) drop only from level-80 bosses in Morheim/Eltnen, which are Korea-only zones for now.</li></ul>
    <p class="muted" style="margin:6px 0 0">Sources: metabot.gg (Global client build 0.0.4387.0: all 207 mounts, soul drops with levels, zones and spawn counts, quests, chests, shops, icons), wikily.gg (Pet Insight souls and EXP), the guide’s Genus Insight data (board order per class) and DPS simulator (stat values). Checked 18 Oct 2026.</p></div>`;
  host.innerHTML=h;
  host.querySelectorAll("details[data-pgd]").forEach(d=>d.addEventListener("toggle",()=>{PG_OPEN[d.dataset.pgd]=d.open}));
  // keep any old ladder boxes elsewhere on the page in sync
  document.querySelectorAll('input[data-gsv^="pet-"]').forEach(i=>{if(!host.contains(i)) i.checked=!!own[i.dataset.gsv]});
}
function pgFacOnly(p){const regs=new Set(p.s.filter(s=>s[0]==='m'||s[0]==='d').map(s=>s[0]==='d'?'I':s[3]));
  if(!regs.size||regs.has('L')||regs.has('M')||regs.has('I')) return '';
  if(regs.has('V')&&!regs.has('A')) return ' · Elyos map'; if(regs.has('A')&&!regs.has('V')) return ' · Asmodian map'; return ''}
function pgHost(){
  let h=document.getElementById('petguide'); if(h) return h;
  const sec=document.getElementById('pets'); if(!sec) return null;
  h=document.createElement('div'); h.id='petguide'; h.className='pgwrap';
  let ref=null;
  for(const c of sec.children){ if(c.classList.contains('tabsum')) continue; if(c.tagName==='DIV'&&c.querySelector(':scope > h2')) continue; ref=c; break }
  sec.insertBefore(h,ref);
  return h;
}
function pgCss(){
  if(document.getElementById('pgcss')) return;
  const st=document.createElement('style'); st.id='pgcss';
  st.textContent=`.pgwrap{display:grid;gap:14px}
.pgtop{display:grid;gap:10px}
.pgdo{margin:0;font-size:15px;border-left:3px solid var(--wind);padding-left:10px}
.pgctl{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}
.pgctl .seg{flex-wrap:wrap}
.pglv{display:flex;gap:8px;align-items:center}
.pglv input{width:64px;background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:6px 8px;font:600 14px var(--f-mono)}
.pgico{width:30px;height:30px;border-radius:6px;border:1px solid #C3C3C3;background:var(--panel2);flex:0 0 auto;object-fit:cover;vertical-align:middle}
.pgnoimg{display:inline-grid;place-items:center;font-size:15px}
.pgbar{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14px;color:var(--muted)}
.pgbar b{color:var(--wind);font-family:var(--f-mono);font-variant-numeric:tabular-nums}
.pgfams{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,190px),1fr));gap:8px}
.pgfamcard{background:var(--panel2);border:1px solid var(--line);border-left:3px solid var(--fc);border-radius:10px;padding:8px 10px;display:grid;gap:4px;min-width:0}
.pgfamhead{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.pgmeter{height:6px;border-radius:99px;background:color-mix(in srgb,var(--fc) 15%,var(--panel));overflow:hidden}
.pgmeter i{display:block;height:100%;background:var(--fc);border-radius:99px}
.pgfam{display:inline-block;font:600 11px var(--f-mono);letter-spacing:.04em;padding:1px 7px;border-radius:999px;border:1px solid color-mix(in srgb,var(--fc) 55%,transparent);color:var(--fg);white-space:nowrap}
.pgsteps{margin:0;padding-left:26px;display:grid;gap:12px}
.pgsteps li::marker{color:var(--gold);font-family:var(--f-mono);font-weight:600}
.pgstephead{display:flex;gap:9px;align-items:center;flex-wrap:wrap;cursor:pointer;margin-bottom:3px}
.pgstephead>span{display:inline-flex;flex-wrap:wrap;gap:4px 8px;align-items:center}
.pgval{color:var(--wind);font-family:var(--f-mono);font-size:13px}
.pgchk{width:18px;height:18px;accent-color:var(--wind);flex:0 0 auto}
.pgname{display:flex;gap:8px;align-items:center;min-width:170px}
.pgname>span{display:grid;line-height:1.25}
.pgname small{font-size:12px;color:var(--muted)}
.pgtable td{vertical-align:top}
.pgtable td:nth-child(3){min-width:240px}
.pgrowown td{background:color-mix(in srgb,var(--wind) 6%,transparent)}
.pgsum{cursor:pointer;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline}
.pgall{display:flex;gap:6px;align-items:center;cursor:pointer}
.pgall input{accent-color:var(--wind);width:16px;height:16px}
.pgleg{display:grid;gap:6px}
.pglegrow{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center}
.pglab{display:inline-flex;gap:5px;align-items:center;cursor:pointer}
.pgbtn{justify-self:start;background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:6px 14px;font:600 13px var(--f-body);cursor:pointer}
@media (max-width:640px){.pgtable td:nth-child(3){min-width:200px}.pgname{min-width:140px}}`;
  (document.head||document.body).appendChild(st);
}
document.addEventListener('change',e=>{const t=e.target; if(!t||!t.dataset) return;
  const k=t.dataset.gsv; if(k&&k.startsWith('pet-')){renderPetGuide();return}
  if(t.dataset.pglvl){let v=parseInt(t.value,10); if(!(v>=1&&v<=45)) v=45; S.set('pglvl',v); renderPetGuide(); return}
  if(t.dataset.pgmiss){S.gset('pgmiss',t.checked); renderPetGuide()}});
document.addEventListener('click',e=>{const c=e.target.closest&&e.target.closest('[data-pgfac],[data-pgff],[data-pgmig]'); if(!c){ if(e.target.closest&&e.target.closest('#modepickTop button')) renderPetGuide(); return }
  if(c.dataset.pgfac){S.gset('pgfac',c.dataset.pgfac); renderPetGuide(); return}
  if(c.dataset.pgff){S.gset('pgff',c.dataset.pgff); renderPetGuide(); return}
  if(c.dataset.pgmig){const g=S.gget('gsv',{}); g['petmig-done']=true; S.gset('gsv',g); renderPetGuide()}});
window.renderPetGuide=renderPetGuide;
{const _ap=window.applyStore; if(typeof _ap==='function') window.applyStore=function(){const r=_ap.apply(this,arguments);try{renderPetGuide()}catch(e){}return r}}
try{renderPetGuide()}catch(e){console.error('petguide',e)}

/* ---------- Wing collection guide (Wings tab): every Global wing, best to wear / own per class, easiest first, enhance first, owned checklist (data: WINGGUIDE) ---------- */
/* Owned ticks are per character (S.get('sv'), like the old Wing ladder) and reuse its keys 'wing-<name>', so earlier ticks carry over.
   Faction = the Pantheon setting (S 'panfac'); level = the Pet guide setting (S 'pglvl'). Replaces the old "Wing ladder" box. */
const WG_EFFC=[1,2,4,10];              // effort cost for "easiest wins": Free, Easy, Medium, Hard (Hard = 0.75% drops or 160k+ currency)
const WG_BOSS=0.85;                    // boss-only stats in the mixed PvE value (most damage checks are bosses; nothing on trash)
const WG_TITLE=0.15;                   // extra per new wing while under 25 (a step toward the 12- and 25-wing titles)
const WG_FACN={E:'Elyos',A:'Asmodian',B:'Both factions'};
const WG_OPEN={};
function wgOK(){return typeof WINGGUIDE!=='undefined'&&WINGGUIDE&&WINGGUIDE.d}
function wgE(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function wgMode(){return (typeof MODE!=='undefined'&&MODE==='pvp')?'pvp':'pve'}
function wgCls(){return (typeof SLUG!=='undefined'&&WINGGUIDE.w[SLUG])?SLUG:'ranger'}
function wgW(m){return WINGGUIDE.w[wgCls()][m||wgMode()]}
function wgFac(){const f=S.get('panfac','B');return WG_FACN[f]?f:'B'}
function wgLvl(){let l=parseInt(S.get('pglvl',45),10);if(!(l>=1&&l<=45))l=45;return l}
function wgLvOf(d){if(!d.trk)return 0;let l=parseInt((S.get('wglv',{})||{})[d.id],10);if(!(l>=0&&l<=10))l=0;return l}
function wgGC(g){const G=(typeof GRADES!=='undefined'&&GRADES&&GRADES.grades)||{};return G[g]||'#C3C3C3'}
function wgVal(st,w,bf){let v=0;const T=WINGGUIDE.stats;for(const k in st){const s=T[k];if(!s)continue;let x=st[k]*(w[k]||0);if(s[2]==='b')x*=bf;v+=x}return v}
function wgOwnAt(d,L){const o=Object.assign({},d.own);for(const k in d.grow)o[k]=(o[k]||0)+d.grow[k]*L;return o}
function wgFP(d,L){return d.fp[0]+d.fp[1]*L}
function wgPct(v,dp){return v<0.005?'—':'+'+v.toFixed(dp==null?(v>=10?1:2):dp)+'%'}
function wgNum(v){return Number.isInteger(v)?v.toLocaleString('en-US'):String(+v.toFixed(2))}
function wgFmt(k,v){const s=WINGGUIDE.stats[k];return `${s[0]} +${wgNum(v)}${s[1]?'%':''}`}
function wgStats(st,w,bf){const ks=Object.keys(st).filter(k=>k!=='fp');if(!ks.length)return '<span class="muted">no stats</span>';
  return ks.sort((a,b)=>st[b]*(w[b]||0)-st[a]*(w[a]||0)).map(k=>{const s=WINGGUIDE.stats[k];let c=st[k]*(w[k]||0);if(s[2]==='b')c*=bf;return c>=0.25?`<b>${wgFmt(k,st[k])}</b>`:wgFmt(k,st[k])}).join(' · ')}
/* effort for you: 0 Free .. 3 Hard; -1 = paid or no source; -2 = needs a higher level */
function wgEff(d,L){if(d.av!=='now')return -1;if(L<(d.lv||1))return -2;return d.e}
function wgFaction(s,fac){if(typeof s==='string')return s;if(fac==='E')return s.E;if(fac==='A')return s.A;return s.E+'<br>'+s.A}
function wgName(d){return `<b style="color:${wgGC(d.g)}">${wgE(d.n)}</b>`}
function wgIco(d){const src=(WINGGUIDE.icons||[])[d.ic];return src?`<img class="wgico" src="${src}" alt="" width="30" height="30" loading="lazy" style="border-color:${wgGC(d.g)}">`:`<span class="wgico wgnoimg" style="border-color:${wgGC(d.g)}" aria-hidden="true" data-l="W"></span>`}
function wgEffTag(x){
  if(x.ef===-1) return `<span class="tag">${x.d.av==='paid'?'Paid':'No source'}</span>`;
  if(x.ef===-2) return `<span class="tag">From Lv ${x.d.lv}</span>`;
  return `<span class="tag ${x.ef<=1?'wind':x.ef===3?'gold':''}">${WINGGUIDE.eff[x.ef]}</span>`}
function wgSteps(d,fac){return `<ol class="wgmini">${(d.steps||[]).map(s=>`<li>${wgFaction(s,fac)}</li>`).join('')}</ol>`}
function wgOwnText(d,L){
  const parts=Object.keys(d.own).map(k=>wgFmt(k,d.own[k]));
  for(const k in d.grow){const s=WINGGUIDE.stats[k];parts.push(`${s[0]} +${wgNum(d.grow[k]*10)}${s[1]?'%':''} <span class="muted">at +10 (${wgNum(d.grow[k])} per level${L?`; now +${wgNum(d.grow[k]*L)}${s[1]?'%':''}`:''})</span>`)}
  return parts.length?parts.join(' · '):'<span class="muted">Flight Power only</span>'}
function wgPlan(){
  const P=WINGGUIDE, m=wgMode(), w=wgW(m), wE=wgW('pve'), wP=wgW('pvp'), sv=S.get('sv',{}), L=wgLvl(), fac=wgFac();
  const all=P.d.map(d=>{const own=!!sv[d.k], lv=own?wgLvOf(d):0;
    return {d,own,lv,ef:wgEff(d,L), wv:wgVal(d.wear,w,WG_BOSS), wb:wgVal(d.wear,wE,1), wt:wgVal(d.wear,wE,0), wp:wgVal(d.wear,wP,0),
      ov0:wgVal(d.own,w,WG_BOSS), ov:wgVal(wgOwnAt(d,lv),w,WG_BOSS), ov10:wgVal(wgOwnAt(d,d.trk?10:0),w,WG_BOSS)}});
  const owned=all.filter(x=>x.own), getable=all.filter(x=>x.own||x.ef>=0);
  const top=(list,key)=>list.slice().sort((a,b)=>b[key]-a[key]||a.ef-b.ef)[0]||null;
  const wear={boss:top(owned,'wb'),packs:top(owned,'wt'),pvp:top(owned,'wp'),tboss:top(getable,'wb'),tpacks:top(getable,'wt'),tpvp:top(getable,'wp')};
  // easiest wins first: biggest (owned bonus + wear upgrade + title step) per effort, from where you are now
  let cur=Math.max(0,...owned.map(x=>x.wv)), cnt=owned.length; const used=new Set(owned.map(x=>x.d.id)), steps=[];
  for(let i=0;i<12;i++){
    let pick=null;
    for(const x of all){
      if(used.has(x.d.id)||x.ef<0) continue;
      const up=Math.max(0,x.wv-cur), gain=x.ov0+up+(cnt<25?WG_TITLE:0), r=gain/WG_EFFC[x.ef];
      if(!pick||r>pick.r+1e-9||(Math.abs(r-pick.r)<1e-9&&(x.ef<pick.x.ef||(x.ef===pick.x.ef&&gain>pick.gain)))) pick={x,gain,up,r};
    }
    if(!pick) break;
    steps.push(pick); used.add(pick.x.d.id); cur=Math.max(cur,pick.x.wv); cnt++;
  }
  // enhance these first: cheapest owned-bonus gain per million Kinah (Rare/Epic wings that grow a stat)
  const enh=owned.filter(x=>x.d.trk&&x.lv<10).map(x=>{const t=P.trk[x.d.trk];let k=0,s=0,e=0;
    for(let l=x.lv;l<10;l++){k+=t.k[l]*t.x[l];s+=t.s[l]*t.x[l];e+=t.e[l]*t.x[l]}
    const gain=x.ov10-x.ov;return {x,k,s,e,gain,per:gain/(k/1e6),fp:(10-x.lv)*x.d.fp[1]}});
  const enhUse=enh.filter(z=>z.gain>=0.05).sort((a,b)=>b.per-a.per), enhFp=enh.filter(z=>z.gain<0.05);
  const later=all.filter(x=>x.ef===-2&&!x.own);
  const fp=owned.reduce((t,x)=>t+wgFP(x.d,x.lv),0), ownSum=owned.reduce((t,x)=>t+x.ov,0), ownMax=getable.reduce((t,x)=>t+x.ov10,0);
  return {P,m,w,sv,L,fac,all,owned,getable,wear,steps,enhUse,enhFp,later,fp,ownSum,ownMax};
}
function renderWingGuide(){
  if(!wgOK()) return;
  wgCss();
  const host=wgHost(); if(!host) return;
  const pl=wgPlan(), P=pl.P, m=pl.m, w=pl.w, fac=pl.fac, L=pl.L, sv=pl.sv;
  const cn=(typeof C!=='undefined'&&C&&C['class'])||wgCls();
  const chk=x=>`<input type="checkbox" class="wgchk" data-sv="${x.d.k}" ${x.own?'checked':''} aria-label="I own ${wgE(x.d.n)}">`;
  const chk2=x=>`<input type="checkbox" class="wgchk" data-wsv="${x.d.k}" ${x.own?'checked':''} aria-label="I own ${wgE(x.d.n)}">`;
  const nOwn=pl.owned.length, wr=pl.wear;
  // ---- what to do + controls
  const doLine=nOwn?`<b>What to do:</b> wear <b>${wr.boss?wgE(wr.boss.d.n):'your best wing'}</b> for bosses and <b>${wr.pvp?wgE(wr.pvp.d.n):'your best wing'}</b> in PvP, then get ${pl.steps.slice(0,2).map(s=>`<b>${wgE(s.x.d.n)}</b>`).join(' and ')||'the rest'} next (Easiest wins first). Keep every wing: each one adds Flight Power, an owned bonus and a step toward the 25-wing title.`
    :`<b>What to do:</b> tick the wings you own (in the table at the bottom or the list below), then follow Easiest wins first from the top. Every wing you own adds Flight Power and a permanent owned bonus.`;
  const tsum=document.querySelector('#wings .tabsum'); // the tab's one-line summary shows the computed what-to-do (else it goes in the box)
  let h=`<div class="box wgtop"><h3 style="margin:0">Wing collection</h3>${tsum?'':`<p class="wgdo">${doLine}</p>`}
    <div class="wgctl"><span class="small muted">Your faction</span><div class="seg" role="group" aria-label="Faction">${['E','A','B'].map(f=>`<button type="button" data-wgfac="${f}" aria-pressed="${fac===f}">${f==='B'?'Show both':WG_FACN[f]}</button>`).join('')}</div>
    <label class="small muted wglvl">Your level <input type="number" min="1" max="45" step="1" value="${L}" data-wglvl="1" inputmode="numeric" aria-label="Your character level"></label>
    <span class="small muted">Ranked for <b>${wgE(cn)}</b> in <b>${m==='pvp'?'PvP':'PvE'}</b> (switch PvE/PvP in the top bar). Faction is shared with the Pantheon tab, level with the Pet guide.</span></div></div>`;
  // ---- old list: one tick covered Sealing and Glorious
  if(sv['wing-sealing']&&sv['wing-glorious']===undefined&&!sv['wingmig']) h+=`<div class="callout small wgleg"><b>From your old wing list:</b> one tick covered both Sealing and Glorious Wings. Tick Glorious Wings if you have them too:
    <label class="wglab">${chk2({d:P.d.find(d=>d.id==='glorious'),own:false})} Glorious Wings</label> <button type="button" class="wgbtn" data-wgmig="1">Done</button></div>`;
  // ---- wear this
  const wcard=(t,x,tx,key,sub)=>`<div class="wgwear"><div class="eyebrow">${t}</div>${x?`<div class="wgwearname">${wgIco(x.d)}<span>${wgName(x.d)}<small>${wgPct(x[key],1)} ${sub}</small></span></div>`:'<p class="small muted" style="margin:0">Tick the wings you own.</p>'}
    ${tx&&(!x||tx.d.id!==x.d.id)?`<p class="small" style="margin:0">Goal: ${wgName(tx.d)} <span class="muted">${wgPct(tx[key],1)} · ${tx.ef>=0?P.eff[tx.ef]:'later'}</span></p>`:x?'<p class="small muted" style="margin:0">Already the best you can get.</p>':''}</div>`;
  h+=`<div class="box" style="display:grid;gap:12px"><h3 style="margin:0">Wear this</h3>
    <p class="small muted" style="margin:0">Only the wing you wear gives its worn stats, and enhancing never changes them. The best of the wings you ticked, with the value as about how much damage it adds for a ${wgE(cn)} (survival stats count as a smaller damage-equivalent).</p>
    <div class="wgwears">${wcard('PvE: bosses',wr.boss,wr.tboss,'wb','vs bosses')}${wcard('PvE: farming &amp; packs',wr.packs,wr.tpacks,'wt','vs normal monsters')}${wcard('PvP',wr.pvp,wr.tpvp,'wp','PvP estimate')}</div>
    <p class="small muted" style="margin:0">Boss Attack and Boss Damage Boost only work on bosses, which is why the boss wing can differ from the farming one. Swap wings in your presets like gear.</p></div>`;
  // ---- easiest wins first
  h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Easiest wins first</h3>
    <p class="small muted" style="margin:0">Do these in order: each one is the most gain for the least effort from where you are now (its owned bonus, plus how much better it is to wear than your best one, plus a step toward the wing titles). Tick it when you have it and the list moves on.${L<45?` Set for level ${L}: wings that need a higher level wait below.`:''}</p>
    ${pl.steps.length?`<ol class="wgsteps">${pl.steps.map(st=>{const x=st.x;return `<li><label class="wgstephead">${chk2(x)}${wgIco(x.d)}<span>${wgName(x.d)} ${wgEffTag(x)} <span class="wgval" title="Gain for a ${wgE(cn)}">${wgPct(st.gain)}</span>${st.up>=0.005?` <span class="small muted">(wear upgrade ${wgPct(st.up)})</span>`:''}${x.d.tr?' <span class="tag">Market</span>':''}</span></label>
      ${wgSteps(x.d,fac)}${x.d.note?`<div class="small muted">${wgE(x.d.note)}</div>`:''}</li>`}).join('')}</ol>`
      :`<p class="callout ok small" style="margin:0">You own every wing you can get right now.</p>`}
    ${pl.later.length?`<p class="small muted" style="margin:0">At a higher level: ${pl.later.map(x=>`${wgE(x.d.n)} (Lv ${x.d.lv})`).join(', ')}.</p>`:''}</div>`;
  // ---- enhance these first
  h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Enhance these first</h3>
    <p class="small muted" style="margin:0">Enhancing only raises the <b>owned</b> bonus: +10 Flight Power per level on every wing, plus one growing stat on most Epic and Rare wings. Set each wing's level in the table (Lv box) and this list updates. Sorted by gain per million Kinah.</p>
    ${pl.enhUse.length?`<div class="tablewrap"><table class="wgenh"><thead><tr><th>Wing</th><th>Grows</th><th class="num">Gain</th><th class="num">Kinah to +10</th><th class="num">Sync Stones</th><th class="num">Enhance Stones</th></tr></thead><tbody>
      ${pl.enhUse.map(z=>`<tr><td><span class="wgname">${wgIco(z.x.d)}<span>${wgName(z.x.d)}<small class="muted">+${z.x.lv} → +10 · always succeeds</small></span></span></td><td class="small">${Object.keys(z.x.d.grow).map(k=>wgFmt(k,z.x.d.grow[k]*(10-z.x.lv))).join(', ')}, Flight Power +${z.fp}</td><td class="num small">${wgPct(z.gain)}</td><td class="num small">${Math.round(z.k).toLocaleString('en-US')}</td><td class="num small">${Math.round(z.s)}</td><td class="num small">${Math.round(z.e).toLocaleString('en-US')}</td></tr>`).join('')}</tbody></table></div>`
      :`<p class="small" style="margin:0">${pl.owned.some(x=>x.d.trk&&x.d.trk!=='U')?'Nothing useful left to enhance for this mode.':'Tick an Epic or Rare wing (for example Intermediate or Superior Daeva Wings) to see what is worth enhancing.'}</p>`}
    ${pl.enhFp.length?`<p class="small" style="margin:0"><b>Leave for last:</b> ${pl.enhFp.map(z=>wgE(z.x.d.n.replace(' Wings',''))).join(', ')}. For you they gain little beyond Flight Power (+10 per level; a Unique wing to +10 averages about 16.7M Kinah). A new wing adds +200 Flight Power, more than taking one wing from +0 to +10.</p>`:''}</div>`;
  // ---- collection + titles
  const T=P.tiers, nx=T.find(t=>t[0]>nOwn), freeLeft=pl.all.filter(x=>!x.own&&x.d.av==='now').sort((a,b)=>(a.ef<0?9:a.ef)-(b.ef<0?9:b.ef)||b.ov0-a.ov0);
  const t12=P.titles['12'], t25=P.titles['25'];
  h+=`<div class="box" style="display:grid;gap:12px"><h3 style="margin:0">Your collection and the wing titles</h3>
    <div class="wgbar"><span>Owned <b>${nOwn} / ${P.d.length}</b></span><span>Flight Power from wings <b>${Math.round(pl.fp).toLocaleString('en-US')}</b></span><span>Owned bonuses now <b>${wgPct(pl.ownSum)}</b></span><span>All you can get at +10 <b>${wgPct(pl.ownMax)}</b></span></div>
    <div class="wgmeter" role="img" aria-label="${nOwn} of 25 wings for the title"><i style="width:${Math.min(100,Math.round(100*nOwn/25))}%"></i>${T.map(t=>`<span class="wgtick ${nOwn>=t[0]?'on':''}" style="left:${100*t[0]/25}%" title="${t[0]} wings: ${wgE(t[1])}">${t[0]}</span>`).join('')}</div>
    <p class="small" style="margin:0">Achievement <b>Veteran Wing Collector</b> (3 / 7 / 12 / 18 / 25 wings) pays Hidden Cube Keys and Kinah on the way, ${nx?`next at <b>${nx[0]}</b> wings (${nx[0]-nOwn} to go): ${wgE(nx[1])}.`:'and you have finished it.'}</p>
    <ul class="plain small" style="margin:0"><li><b style="color:${wgGC(t12.g)}">${wgE(t12.n)}</b> at 12 wings: equip ${wgStats(t12.eq,w,WG_BOSS)} (${wgPct(wgVal(t12.eq,w,WG_BOSS))} for you); owned ${wgStats(t12.own,w,WG_BOSS)}.</li>
      <li><b style="color:${wgGC(t25.g)}">${wgE(t25.n)}</b> at 25 wings: equip ${wgStats(t25.eq,w,WG_BOSS)}; owned ${wgStats(t25.own,w,WG_BOSS)}.</li></ul>
    <p class="small muted" style="margin:0">Global has exactly 25 wings you can get without paying, so the 25-wing title needs all of them, including the three Poko's Skin Bundle wings and Radiant Love Wings (all four are tradable: the Market is the easy way). ${nOwn<25&&freeLeft.length?`Still missing: ${freeLeft.slice(0,25).map(x=>wgE(x.d.n.replace(' Wings',''))).join(', ')}.`:''}</p></div>`;
  // ---- full table
  const filt=S.get('wgfilt','all');
  // every row stays in the page (hidden when filtered) so the Progress tab's "Wings owned" count does not change with the filter
  const shown=x=>filt==='all'||(filt==='miss'&&!x.own)||(filt==='own'&&x.own), eo=x=>x.ef>=0?x.ef:(x.ef===-2?4:9);
  const rows=pl.all.slice().sort((a,b)=>eo(a)-eo(b)||(b.wv+b.ov0)-(a.wv+a.ov0)||a.d.n.localeCompare(b.d.n));
  h+=`<details class="box" data-wgd="all" ${WG_OPEN.all!==false?'open':''}><summary class="wgsum"><b>All wings</b> <span class="small muted">${P.d.length} on Global (28 in the client data + Spider Wings from the 14 Oct patch) · you own ${nOwn} · easiest first</span></summary>
    <div class="wgctl" style="margin:10px 0"><div class="seg" role="group" aria-label="Show">${[['all','All'],['miss','Missing'],['own','Owned']].map(([k,t])=>`<button type="button" data-wgfilt="${k}" aria-pressed="${filt===k}">${t}</button>`).join('')}</div>
      <span class="small muted">Bold stats matter most for a ${wgE(cn)}. Value = wear / own (+10).</span></div>
    <div class="tablewrap"><table class="wgtable"><thead><tr><th class="num">Own</th><th>Wing</th><th>Worn stats</th><th>Owned bonus</th><th class="num">Flight Power</th><th>How to get it</th><th>Effort</th><th class="num">Lv</th><th class="num">Value</th></tr></thead><tbody>
    ${rows.map(x=>{const d=x.d;return `<tr class="${x.own?'wgrowown':''}"${shown(x)?'':' hidden'}><td class="num">${chk(x)}</td>
      <td><span class="wgname">${wgIco(d)}<span>${wgName(d)}<small class="muted">${wgE(d.g)}${d.tr?' · tradable':d.trs?' · sealed wing tradable':' · bound'}</small></span></span></td>
      <td class="small">${wgStats(d.wear,w,WG_BOSS)}</td><td class="small">${wgOwnText(d,x.lv)}</td>
      <td class="num small">${d.fp[0]?(d.fp[1]?`${wgNum(d.fp[0])}→${wgNum(d.fp[0]+10*d.fp[1])}`:wgNum(d.fp[0])):'—'}</td>
      <td class="small">${d.sh?wgFaction(d.sh,fac):''}</td><td>${wgEffTag(x)}</td>
      <td class="num">${x.own&&d.trk?`<input type="number" class="wglv" min="0" max="10" step="1" value="${x.lv}" data-wglv="${d.id}" inputmode="numeric" aria-label="Enhance level of ${wgE(d.n)}">`:'<span class="muted">—</span>'}</td>
      <td class="num small">${wgPct(x.wv,1)} / ${wgPct(x.ov10)}</td></tr>`}).join('')}
    </tbody></table></div></details>`;
  // ---- enhancement rules
  const U=P.trk.U;
  h+=`<details class="box" data-wgd="enh" ${WG_OPEN.enh?'open':''}><summary class="wgsum"><b>Enhancement rules and costs</b> <span class="small muted">odds, pity, Kinah, Sync Stones</span></summary>
    <ul class="plain small" style="margin:10px 0 0">
      <li><b>What it raises:</b> only the owned bonus (Flight Power +10 per level, +200 → +300; plus the growing stat on Epic/Rare wings). Worn stats never change. Lesser Daeva and Special wings have no track.</li>
      <li><b>Rare:</b> +0 → +10 always succeeds: 3,494,000 Kinah, 34 Sync Stones, 13,440 Enhance Stones. <b>Epic:</b> always succeeds: 5,960,000 Kinah, 53 Sync Stones, 23,040 Enhance Stones.</li>
      <li><b>Unique:</b> safe to +3, then ${U.p.slice(3).map((p,i)=>`+${i+4} ${p}%`).join(', ')}. Each fail adds +10% to the next try at that level and never drops the level; on average about 16.7M Kinah, 137 Sync Stones and 66,000 Enhance Stones to +10 (worst luck 50.3M).</li>
      <li><b>Materials:</b> Sync Stone (Unique) drops in Krao Cave, Urugugu Canyon, Vakron Sky Island, Ferocious Horn Den, Fire Temple and Draupnir (also Substance Morph from a spare Unique piece, and the Daeva Pass). Gear Soul Binding uses the same stones, so check your gear first. Enhance Stones: Daily Dungeon (10,000 a clear), quests, Ascension Trial.</li>
      <li><b>Spare sealed wing?</b> Substance Morph turns a duplicate Sealed expedition wing into 10,000 Enhance Stones (20 a week per server).</li></ul></details>`;
  // ---- Korea-only
  if((P.kr||[]).length) h+=`<details class="box" data-wgd="kr" ${WG_OPEN.kr?'open':''}><summary class="wgsum"><b>Korea only, not on Global yet</b> <span class="small muted">${P.kr.length} wings with stats + ${(P.krs||[]).length} cosmetic ones in the client files</span></summary>
    <p class="small muted">The Global client files contain these wings, but none has a Global source and they are not in the Global wing collection. Listed so you know what is coming.</p>
    <div class="tablewrap"><table><thead><tr><th>Wing</th><th>Worn</th><th>Owned (+0)</th></tr></thead><tbody>${P.kr.map(k=>`<tr><td class="small"><b style="color:${wgGC(k.g)}">${wgE(k.n)}</b></td><td class="small">${wgE(k.wear)}</td><td class="small">${wgE(k.own)}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted" style="margin:8px 0 0">Cosmetic (Special, no stats): ${(P.krs||[]).map(wgE).join(', ')}.</p></details>`;
  // ---- good to know
  h+=`<div class="box small"><h3 style="font-size:18px">Good to know</h3><ul class="plain">
    <li><b>Per character:</b> wings are bound to the character that uses the item, and shop wings are 1 per character, so these ticks are saved per class. Owned bonuses stack across every wing you own, worn or not.</li>
    <li><b>Flight Power</b> is your flight gauge, not speed. Lesser Daeva Wings give 2,500 and the Intermediate/Superior/Ultimate Daeva Wings 1,000 each since the 9 Oct patch (the client data still says 2,000 / 500; +10 per level is assumed to still apply).</li>
    <li><b>Sealed expedition wings</b> drop from the last boss on <b>Conquest</b> (0.75% a kill; Fire Temple's reward cube 1.25%), are tradable, and unlock after 10 Radiant Odyle in Substance Morph.</li>
    <li><b>Value</b> uses the guide's DPS simulator for damage stats. HP, Defense, tolerances, Evasion, resist and healing stats can't be simulated: they use role estimates (${SLUG==='templar'?'tank: they count a lot':SLUG==='cleric'?'healer: survival and MP count more':SLUG==='chanter'?'support: they count a bit':'damage dealer: they count little'}), and all PvP values are estimates. Accuracy only helps while you still miss bosses; Penetration is a small flat bonus per hit.${SLUG==='brawler'?' Brawler has no simulator data: Gladiator/Assassin averages.':''}</li>
    <li><b>Not sure yet:</b> Spider Wings' stats (not in the client data yet); Void Rending and Punk Bunny Bag Wings have no source; Radiant Love Wings' item text says Back Attack +20 owned while the wing table says +10 (+10 used here); Featherdown from Advanced Roah (one guide); Centuryroot and Oath Coin income per week.</li></ul>
    <p class="muted" style="margin:6px 0 0">Sources: metabot.gg (Global client build 0.0.4387.0: all 28 wings, worn and owned stats by level, enhancement table, item trade status, dungeon loot and drop chances, shops, Substance Morph, quests, achievements, icons), Steam patch notes (9 Oct Flight Power change, 14 Oct Spider Wings), the guide's DPS simulator (stat values). Checked 18 Oct 2026.</p></div>`;
  host.innerHTML=h;
  host.querySelectorAll('details[data-wgd]').forEach(d=>d.addEventListener('toggle',()=>{WG_OPEN[d.dataset.wgd]=d.open}));
  wgPatchPage(pl,doLine);
}
/* keep the rest of the Wings tab consistent: drop the old Wing ladder (this guide replaces it, same tick keys), and point the
   tab summary and the "For your class" wing lines at the computed picks */
function wgPatchPage(pl,doLine){
  const sec=document.getElementById('wings'); if(!sec) return;
  sec.querySelectorAll('.box').forEach(b=>{const h3=b.querySelector(':scope > h3');if(h3&&/^Wing ladder/.test(h3.textContent.trim())) b.remove()});
  const wr=pl.wear, n=x=>x?x.d.n:'your best wing';
  const ts=sec.querySelector('.tabsum');
  if(ts) ts.innerHTML=doLine; // names are escaped in doLine
  const wp=document.getElementById('wpclass');
  if(wp) wp.querySelectorAll('li').forEach(li=>{const b=li.querySelector('b');if(!b)return;const t=b.textContent.trim();
    if(t==='PvE wing:') li.innerHTML=`<b>PvE wing:</b> ${wgE(n(wr.boss))} for bosses${wr.packs&&wr.boss&&wr.packs.d.id!==wr.boss.d.id?`, ${wgE(wr.packs.d.n)} for farming`:''}${wr.tboss&&(!wr.boss||wr.tboss.d.id!==wr.boss.d.id)?` (goal: ${wgE(wr.tboss.d.n)})`:''}. See Wing collection above.`;
    if(t==='PvP wing:') li.innerHTML=`<b>PvP wing:</b> ${wgE(n(wr.pvp))}${wr.tpvp&&(!wr.pvp||wr.tpvp.d.id!==wr.pvp.d.id)?` (goal: ${wgE(wr.tpvp.d.n)})`:''}. Its owned bonus works whatever you wear.`});
}
function wgHost(){
  let h=document.getElementById('wingguide'); if(h) return h;
  const sec=document.getElementById('wings'); if(!sec) return null;
  h=document.createElement('div'); h.id='wingguide'; h.className='wgwrap gr'; // 'gr' keeps grade_fn.js from re-colouring words inside
  let ref=null;
  for(const c of sec.children){ if(c.classList.contains('tabsum')) continue; if(c.tagName==='DIV'&&c.querySelector(':scope > h2')) continue; ref=c; break }
  sec.insertBefore(h,ref);
  return h;
}
function wgCss(){
  if(document.getElementById('wgcss')) return;
  const st=document.createElement('style'); st.id='wgcss';
  st.textContent=`.wgwrap{display:grid;gap:14px;margin-bottom:14px}
.wgtop{display:grid;gap:10px}
.wgdo{margin:0;font-size:15px;border-left:3px solid var(--wind);padding-left:10px}
.wgctl{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}
.wgctl .seg{flex-wrap:wrap}
.wglvl{display:flex;gap:8px;align-items:center}
.wglvl input,.wglv{width:60px;background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:5px 7px;font:600 14px var(--f-mono)}
.wglv{width:52px}
.wgico{width:30px;height:30px;border-radius:6px;border:1px solid #C3C3C3;background:var(--panel2);flex:0 0 auto;object-fit:cover;vertical-align:middle}
.wgnoimg{display:inline-grid;place-items:center;font:600 13px var(--f-mono);color:var(--muted)}.wgnoimg::before{content:attr(data-l)}
.wgwears{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:8px}
.wgwear{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:grid;gap:6px;min-width:0}
.wgwearname{display:flex;gap:8px;align-items:center}
.wgwearname>span,.wgname>span{display:grid;line-height:1.25}
.wgwearname small,.wgname small{font-size:12px;color:var(--muted)}
.wgbar{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14px;color:var(--muted)}
.wgbar b{color:var(--wind);font-family:var(--f-mono);font-variant-numeric:tabular-nums}
.wgmeter{position:relative;height:8px;border-radius:99px;background:color-mix(in srgb,var(--wind) 15%,var(--panel));margin:4px 10px 18px}
.wgmeter i{display:block;height:100%;background:var(--wind);border-radius:99px}
.wgtick{position:absolute;top:10px;transform:translateX(-50%);font:600 11px var(--f-mono);color:var(--muted)}
.wgtick.on{color:var(--wind)}
.wgsteps{margin:0;padding-left:26px;display:grid;gap:12px}
.wgsteps li::marker{color:var(--gold);font-family:var(--f-mono);font-weight:600}
.wgstephead{display:flex;gap:9px;align-items:center;flex-wrap:wrap;cursor:pointer;margin-bottom:3px}
.wgstephead>span{display:inline-flex;flex-wrap:wrap;gap:4px 8px;align-items:center}
.wgmini{margin:2px 0 0;padding-left:20px;font-size:14px;display:grid;gap:2px}
.wgval{color:var(--wind);font-family:var(--f-mono);font-size:13px}
.wgchk{width:18px;height:18px;accent-color:var(--wind);flex:0 0 auto}
.wgname{display:flex;gap:8px;align-items:center;min-width:170px}
.wgtable td,.wgenh td{vertical-align:top}
.wgtable td:nth-child(3),.wgtable td:nth-child(4){min-width:170px}
.wgtable td:nth-child(6){min-width:200px}
.wgrowown td{background:color-mix(in srgb,var(--wind) 6%,transparent)}
.wgsum{cursor:pointer;display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline}
.wgleg{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center}
.wglab{display:inline-flex;gap:5px;align-items:center;cursor:pointer}
.wgbtn{background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:6px 14px;font:600 13px var(--f-body);cursor:pointer}
@media (max-width:640px){.wgtable td:nth-child(6){min-width:160px}.wgname{min-width:140px}}`;
  (document.head||document.body).appendChild(st);
}
document.addEventListener('change',e=>{const t=e.target; if(!t||!t.dataset) return;
  const k=t.dataset.sv; if(k&&k.startsWith('wing-')){renderWingGuide();return} // saved by gear_fn.js (data-sv)
  const k2=t.dataset.wsv; if(k2){const sv=S.get('sv',{}); sv[k2]=t.checked; S.set('sv',sv); renderWingGuide(); if(typeof renderProgress==='function') try{renderProgress()}catch(_){} return}
  if(t.dataset.wglvl){let v=parseInt(t.value,10); if(!(v>=1&&v<=45)) v=45; S.set('pglvl',v); renderWingGuide(); if(typeof window.renderPetGuide==='function') try{window.renderPetGuide()}catch(_){} return}
  if(t.dataset.pglvl){renderWingGuide();return}
  if(t.dataset.wglv){let v=parseInt(t.value,10); if(!(v>=0&&v<=10)) v=0; const o=Object.assign({},S.get('wglv',{})); o[t.dataset.wglv]=v; S.set('wglv',o); renderWingGuide()}});
document.addEventListener('click',e=>{const c=e.target.closest&&e.target.closest('[data-wgfac],[data-wgfilt],[data-wgmig],[data-panfac],#modepickTop button'); if(!c) return;
  if(c.dataset.wgfac){S.set('panfac',c.dataset.wgfac); renderWingGuide(); if(typeof renderPantheon==='function') try{renderPantheon()}catch(_){} return}
  if(c.dataset.wgfilt){S.set('wgfilt',c.dataset.wgfilt); renderWingGuide(); return}
  if(c.dataset.wgmig){const sv=S.get('sv',{}); sv['wingmig']=true; S.set('sv',sv); renderWingGuide(); return}
  renderWingGuide()}); // Pantheon faction or the PvE/PvP switch (their own handlers already ran)
window.renderWingGuide=renderWingGuide;
{const _ap=window.applyStore; if(typeof _ap==='function') window.applyStore=function(){const r=_ap.apply(this,arguments);try{renderWingGuide()}catch(e){}return r}}
try{renderWingGuide()}catch(e){console.error('wingguide',e)}

/* ---------- daily / weekly checklist ---------- */
function renderDW(){const dw=S.get('dw',{});document.querySelectorAll('[data-dw]').forEach(i=>{i.checked=!!dw[i.dataset.dw]})}
document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.dw;if(!k)return;const dw=S.get('dw',{});dw[k]=e.target.checked;S.set('dw',dw)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-dwreset]');if(!b)return;const p=b.dataset.dwreset+'-';const dw=S.get('dw',{});Object.keys(dw).forEach(k=>{if(k.startsWith(p))delete dw[k]});S.set('dw',dw);renderDW()});

/* ---------- re-apply after your account copy loads ---------- */
function applyStore(){
  checks=S.get('checks',{}); pchecks=S.get('pchecks',{}); ptmode=S.get('ptmode','base'); phase=S.get('phase',30);
  const s=S.get('board',null); if(s){state.board=s.board;state.mode=s.mode}
  renderPlan(); renderRanks(); renderPhases(); renderBoard(true); renderDW(); renderGear(); renderSV(); renderFarm(); renderDWTable(); addChecks(); refreshChecks(); renderPlanGuide(); renderTitles(); renderFarmGuide(); renderDWGuide(); renderProgress(); renderChanges(); renderBeyond(); applyB45(); renderGenusUI(); MODE=S.gget('mode','pve'); renderModeBits();
}

/* ---------- class switcher ---------- */
(function(){
  const sel=document.getElementById('classpick'); if(!sel) return;
  sel.innerHTML=Object.keys(ALL).map(k=>`<option value="${k}"${k===SLUG?' selected':''}>${ALL[k].cls}${k==='brawler'?' (Korea only)':''}</option>`).join('');
  sel.addEventListener('change',()=>{S.gset('cls',sel.value); try{history.replaceState(null,'','#'+sel.value)}catch(e){} location.reload()});
})();

buildBoardPick(); renderBoard(true); renderPlan(); renderRanks(); renderPhases(); renderMacro(); renderGear(); renderFarm(); decorate(); renderDW(); renderSV(); renderDWTable(); addChecks(); guideGoto(gidx==null?guideStart():gidx,false); renderPlanGuide(); renderTitles(); renderFarmGuide(); renderDWGuide(); renderProgress(); renderChanges(); renderBeyond(); applyB45(); renderGenusUI();
if(MODE==='pvp'){S.set('gearmode','pvp');renderGear();} renderModeBits();
{let start=S.get('tab','start'); const h=location.hash.slice(1); if(h&&document.getElementById(h)) start=h; show(start,false); renderModeBits(); applyB45();}
startSync();
