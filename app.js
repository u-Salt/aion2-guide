var SIMSRC="data/sim.js?v=1792554728";
const P=ALL[SLUG];
document.getElementById('app').innerHTML=P.body;
document.title=P.cls+' Guide · AION 2 Global Field Manual (Unofficial Fan Guide)';
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
const IMGALIAS=[['manastone','Superior Manastone'],['abyssal manastone','Superior Abyssal Manastone'],['theostone',"Theostone: Tiamat's Rage"],['training arcana','Superior Training Arcana'],['arcana','Arcana: Chalice of Vigor'],['potential stone','Potential Stone (Weapon)'],['transfer stone','Transfer Stone (Weapon)'],['rainbow','Soul Crystal: Special'],['soul crystal','Soul Crystal'],['souls','Soul Crystal'],['odyle energy','Odyle Energy'],['featherdown','Sealed Wing Featherdown'],['radiant odyle','Radiant Odyle'],['amplify','Amplify Stone'],['sync stone','Enhance Stone'],['daeva pass','Oath Coin'],['empyrean trace','Wisdom Stone'],['kina','Kinah']];
function findImg(n,loose){
  if(!n) return null; n=String(n).trim();
  if(n==='Kina'||n==='Kina (Bound)') n='Kinah';  /* Global spells it Kina; the picture is still filed as Kinah */
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
  const tbl=rows=>`<div class="tablewrap"><table><thead><tr><th>Skill</th><th>Slot 1</th><th>Slot 2</th><th>Slot 3</th><th>While leveling</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r.skill}</b></td><td data-l="Slot 1">${esc(r.s1)}</td><td data-l="Slot 2">${esc(r.s2)}</td><td data-l="Slot 3">${esc(r.s3)}</td><td class="small muted" data-l="While leveling">${esc(r.leveling||'—')}</td></tr>`).join('')}</tbody></table></div>`;
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
$('sources').innerHTML=[['metabot.gg Daevanion planner &amp; top-player builds',`https://metabot.gg/en/aion-2/classes/${SLUG}`],...(C.sources||[])].slice(0,14).map(s=>`<li><a href="${s[1]}" target="_blank" rel="${/metabot\.gg/i.test(String(s[1]||''))?'noopener':'noopener noreferrer'}">${s[0]}</a></li>`).join('');
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
  // how steps loop and the 10 ms delay are already in the setup text and step 3 above, so they are not repeated here
  const gen=['Charged skills, toggles and heals are pressed by hand, never in the macro'+(/brawler/i.test(C['class']||'')?' (Brawler is the exception inside Rampage, see below).':'.'),...(fillersLast?['No-cooldown fillers go last so they never block a cooldown skill.']:[])];
  if(hasStack) gen.push('Expected behaviour, test it: a stacked slot fires its bottom skill first when it is ready, otherwise the next one up (how creator guides describe it; not confirmed on Global, see step 6).');
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
  {k:'bracelet',n:'Bracelet',t:'brace',item:'Ascension Bracelet for now; Abyssal Bracelet (Ludra drop, or 3 Ludra vouchers + 5M Kina) once Ludra returns',enh:'+10'},
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
function farmCounts(){const t=$('farmtotal');if(t)t.innerHTML='';}  /* farming methods repeat, so there is no done count */
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
      const meth=(it.methods||[]).map((m,mi)=>`<tr data-fk="${fk}-${mi}"><td><b>${esc(m.how||'')}</b>${m.where?`<br><span class="muted">${esc(m.where)}</span>`:''}</td><td class="small">${esc(m.limit||'—')}</td><td class="small muted">${esc(m.notes||'')}</td></tr>`).join('');
      html+=`<details class="farmcard"${q?' open':''}><summary>${farmImg(it.name)}<span class="fname"><b>${esc(it.name)}</b><span class="feasy">${esc(it.easiest||'')}</span></span></summary>
        <label class="ffav"><input type="checkbox" data-ffav="${esc(it.name)}" ${fav[it.name]?'checked':''}> Tracking this now</label>
        <div class="tablewrap"><table><thead><tr><th>Best methods</th><th>Limit</th><th>Notes</th></tr></thead><tbody>${meth}</tbody></table></div>
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
 {k:'duty',t:'d',srv:1,n:'5 Duty Missions',d:'50k Kina (Bound) + 1k Abyss Points each. Shared by the whole server. Pick missions by their first reward (always paid; the later slots are less and less likely).'},
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
 {k:'raid',t:'w',off:1,n:'Ludra raid',d:'GS 2,800; offline for a rework, so hidden. Global client data: 4 attempts and 1 final-boss reward a week (the rework may change this).'},
 {k:'abyss',t:'w',n:'Abyss time',d:'7 h a week per layer (14 h in Lower and Middle with membership). Until 27/28 Oct, Lower Abyss Rift Stones add up to 7 h more (see below). Since 14 Oct you can bank at most 7 h of entry time, and unused time does not carry over to the next week; how the cap works with membership is not stated.'},
 {k:'growth',t:'w',off:1,n:'Growth dungeons',d:'Silent Graveyard, Fafnite Amphitheater: 7 h each, Soul Crystals, Enhance Stones. Probably not open on Global yet, so hidden.'},
 {k:'arena',t:'w',n:'Arena / Arena of Tactics',d:'Solitude and Cooperation: 10 participation + 30 win rewards each. Arena of Tactics (10v10, 11:00–14:00 and 19:00–21:00 only): 3 participation + 3 win rewards.'},
 {k:'apshop',t:'w',n:'Abyss Point shop',d:'Weekly limits: Potential Stones and 50 Lesser Abyssal Manastones. Stigma Shards (200) and Azphel crystals (110) have lifetime limits that never reset: buy them as AP allows.'},
 {k:'pass',t:'w',n:'Daeva Pass cap',d:'50,000 EXP per week. Season 1 ends with the 15 Dec PST / 16 Dec CET maintenance.'},
 {k:"rift",t:"d",n:"Spacetime Rift quests",d:"Every 3h (00:00, 03:00 ... UTC), open ~10 min. Enemy-faction rift merchants: Kina (Bound), 2,000 AP, Wisdom Stone, Daevanion Crystal. PvP only happens if both you and the other player have War Mode on."},
 {k:"attend2",t:"d",srv:1,n:"Launch attendance (2 calendars)",d:"7-day and 14-day launch logs until 15 Dec. Claim both, once per server. Resets 23:00 Pacific."},
 {k:"dutycmd",t:"w",n:"Abyss Duty Commands",d:"Up to 20 scrolls a week from the Command Merchant in the Abyss: AP + Abyssal Power Shards. Stockpile them and finish before Wednesday (track them in the Journal, J)."},
 {k:"cmdcity",t:"w",srv:1,n:"Command Missions ×12",d:"Command Merchant in Verteron/Altgard: 15,000 Kina a scroll, 12 a week (level 45). Same reward slots as Duty Missions. Scrolls keep in your bag, so buy all 12 and finish them before Wednesday."},
 {k:"corridor",t:"w",n:"Abyss Corridor",d:"After an Artifact Siege, enter the Corridor at each Artifact your faction holds: 5 minutes of monster killing for Kina and Abyss Points (0–3 runs a siege). Open until the next siege; needs Abyss time."},
 {k:"siege",t:"w",n:"Artifact Siege + Abyss elites",d:"Siege Mon/Thu/Sat 21:00, Executors 21:30; Nahma Fri/Sun 21:00 (server time; check the in-game timer). Sources disagree on the server clock: an EU creator says German time, while metabot.gg and allthings.how say every region runs on one GMT+9 clock. NC hasn't said; official notices only give PDT and CEST."},
 {k:"planet",t:"w",n:"Planet's Call pass",d:"Event pass: 51 levels, 40,000 EXP in total, 15,000 weekly cap. Ends at the 27 Oct PDT / 28 Oct CET maintenance. From the 21 Oct reset one weekly cap is left, so under 25,000 pass EXP you can no longer finish it: claim what you have before then."},
 {k:"passmis",t:"w",n:"Daeva Pass weekly missions",d:"Challenge Season Missions > Weekly Missions, for pass EXP."},
 {k:"wingmorph",t:"w",srv:1,n:"Sealed Wing → Enhance Stone morph",d:"Up to 20 Substance Morphs per server per week (since 7 Oct). Pick which character gets the stones."},
 {k:"spiritstone",t:"w",srv:1,n:"Resurrection Spiritstones (optional)",d:"Wind Breeze Merchants > Special (membership): 25,000 Kina each, 10 per server per week, until 15 Dec."},
 {k:"halattend",t:"d",srv:1,n:"Trick or Treat attendance (Halloween)",d:"Menu > Attendance: 35 Pumpkin Coins a day, 100 on days 7 and 14. Once per server, until the 3 Nov PST / 4 Nov CET maintenance."},
 {k:"halmis",t:"w",srv:1,n:"Halloween event missions + coin shop",d:"Season Mission > Event tab: weekly missions, once per server (about 235 Pumpkin Coins). Then buy the weekly coin-shop items (Odyle Energy, Nightmare tickets, Shugo keys, Rift Stones). Until 3/4 Nov."},
 {k:"halcandy",t:"w",srv:1,n:"Halloween Candy Keys",d:"60 Candy Key Fragments (from Expedition and Transcendence clears) make a Red, Yellow or Blue Candy Key in Substance Morph, each once a week per server. Red: 20 Growth Pet Chests; Yellow: 10,000 AP; Blue: 4 Odyle Energy. Until 3/4 Nov."},
 {k:"riftstone",t:"w",n:"Lower Abyss Rift Stones (Conquerors of the Abyss)",d:"Wind Breeze Merchants > Special (membership): 50,000 Kina each, up to 7 per character a week (level 45+), +1 h Lower Abyss time each. Deleted 7 days after you get them. Until 27/28 Oct."},
 {k:"odylebuy",t:"w",n:"Odyle Energy (Bound) (optional)",d:"Wind Breeze Merchants > Special (membership): 25 Odyle + 5 Fine Odyle + 1 Pure Odyle + 50,000 Kina each, up to 20 per character a week with no server limit until the 27/28 Oct maintenance (server-transfer period only). After that the old 4 per character + 16 per server limit is expected back (Unconfirmed)."},
 {k:"supplyd",t:"d",n:"Supply Requests (Emergency)",d:"ESC > Supply Request (from level 25). Hand in the requested items for Abyss Points (about 380-6,000 a delivery) and often Enhance Stones. Emergency requests change daily. Check the list before you extract or vendor gear and crafts: some low items are requested."},
 {k:"kinahcap",t:"d",n:"Open-world Kina (optional)",d:"Monsters stop paying Kina after about 1,000,000 per character a day. Worth it on alts once their dailies are done; stop when kills pay nothing."},
 {k:"supplyw",t:"w",n:"Supply Requests (Weekly, Crafting, Boss)",d:"ESC > Supply Request. Weekly requests pay the most Abyss Points; Crafting and Boss requests take crafted items and boss drops. Resets Wednesday."},
 {k:"morphshop",t:"w",n:"Substance Morph > Special > Wind Breeze Merchants (membership)",d:"Soul Crystals and Daily Dungeon Instant Clear Tickets are sold here instead of Shop > Wind Breeze Merchants > Special during the server-transfer period (14 Oct to the 27/28 Oct maintenance); after that they should move back. Buy the weekly limit shown in game."}
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

/* ---------- tick boxes added across the guide ----------
   Polish pass (Oct 2026): only ticks that drive a recommendation stay (wings owned, Arcana cards). The old one-time lists
   (perk Set, Stigma Slotted, shard order, pet ladder, Genus guide steps, wing Do-this-now, alt steps, PvP tips) are no
   longer drawn; their saved keys are left untouched in the browser store. */
/* scope 'c' = saved per class, 'g' = saved once for all characters (server-wide things) */
function slug(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)}
function boxByTitle(root,prefix){return [...document.querySelectorAll(root+' .box')].find(b=>{const h=b.querySelector('h3');return h&&h.textContent.trim().startsWith(prefix)})}
const CHECKS=[
  {pre:'wing',scope:'c',label:'Owned',rows:()=>{const b=boxByTitle('#wings','Wing ladder');return b?[...b.querySelectorAll('table.wingtable')[0].querySelectorAll('tbody tr:not(.wgrp)')]:[]}},
  {pre:'arcana',scope:'c',label:'Got it',rows:()=>{const t=document.querySelector('#arcana table');return t?[...t.querySelectorAll('tbody tr')]:[]}},
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
  return `<li data-pid="${it.id}"><input type="checkbox" id="${it.id}" aria-label="Done" ${pchecks[it.id]?'checked':''}><span class="chip ${it.board}">${it.board}<span class="sr-only">: </span></span>${pic}<span class="small"><b>${it.amt!=null?it.target.replace(/ ×(\d+)$/,'')+' '+amt+(/ ×\d+$/.test(it.target)?' <span class="muted">×'+it.target.split(' ×')[1]+' nodes</span>':''):it.target+' '+amt}</b><br><span class="muted">${it.from===it.to?'step '+it.to:'steps '+it.from+'–'+it.to} · ${it.cost} ${it.cur} · ${it.total} total</span></span><button class="go" type="button" data-pid="${it.id}">Show on map</button></li>`;
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
  add('Arcana cards',cnt('[data-sv^="arcana-"]',sv),'arcana');
  add('Wings owned',cnt('[data-sv^="wing-"]',sv),'wings'); {const PD=typeof PETGUIDE!=='undefined'&&PETGUIDE&&PETGUIDE.d;add('Pets owned (server)',PD?{all:PD.length,done:PD.filter(p=>gsv[p.k]).length}:cnt('[data-gsv^="pet-"]',gsv),'pets');}
  try{if(typeof panOK==='function'&&panOK()){const pf=panFac(),d=PANTHEON.d.filter(x=>x.av==='now'&&!panOther(x,pf));add('Pantheon decorations',{all:d.length,done:d.filter(x=>sv[panKey(x)]).length},'pantheon');}}catch(e){}
  try{if(typeof cloState==='function'&&colOK('closet')){let all=0,done=0;cloState().cats.forEach(ct=>{all+=ct.rows.length;done+=ct.rows.filter(x=>x.own).length});add('Closet skins (server)',{all,done},'closet');}}catch(e){}
  try{if(typeof monoStones==='function'&&colOK('mono')){const f0=colFac(),f=f0==='B'?'E':f0;let all=0,done=0;monoStones(f).filter(s=>!s.kr).forEach(s=>s.zones.forEach(z=>{all++;if(gsv[monoZoneKey(s,z)])done++}));add('Monolith trace zones (server)',{all,done},'monoliths');const kl=COLLECT.mono.kib[f]||[];add('Kibelisks activated',{all:kl.length,done:sv['kib-all-'+f]?kl.length:kl.filter(k=>sv[k.id]).length},'monoliths');}}catch(e){}
  add('Titles owned',cnt('[data-sv^="ttl-"]',sv),'titles');
  // daily per character
  const chars=dwChars(), st=S.gget('dwc',{});
  const dTasks=DWTASKS.filter(t=>t.t==='d'), wTasks=DWTASKS.filter(t=>t.t==='w');
  const perChar=chars.map(c=>{const f=ts=>{const own=ts.filter(t=>!t.srv),srv=ts.filter(t=>t.srv);return {all:own.length+srv.length,done:own.filter(t=>st[c.id+'|'+t.k]).length+srv.filter(t=>st['srv|'+t.k]).length}};return {c,d:f(dTasks),w:f(wTasks)}});
  const bar=c=>{const p=c.all?Math.round(100*c.done/c.all):0;return `<div class="bar"><i style="width:${p}%"></i></div><span class="readout">${c.done} / ${c.all} · ${p}%</span>`};
  const tot=pRows.reduce((a,r)=>({all:a.all+r.c.all,done:a.done+r.c.done}),{all:0,done:0});
  host.innerHTML=`<div class="progrid">${pRows.filter(r=>r.c.all).map(r=>`<button class="progcard" type="button" data-goto="${r.tab}"><span class="ptitle">${r.title}</span><div class="progress">${bar(r.c)}</div></button>`).join('')}</div>
   <div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Daily &amp; weekly by character</h3>
    <div class="tablewrap"><table><thead><tr><th>Character</th><th>Today</th><th>This week</th></tr></thead><tbody>${perChar.map(p=>`<tr><td><b>${esc(p.c.name)}</b> <span class="kr">${ALL[p.c.cls]?ALL[p.c.cls].cls:''}</span></td><td><div class="progress">${bar(p.d)}</div></td><td><div class="progress">${bar(p.w)}</div></td></tr>`).join('')}</tbody></table></div>
    <button class="btn" type="button" data-goto="daily" style="justify-self:start">Open the daily checklist</button></div>
   <div class="box" style="display:grid;gap:8px"><h3 style="margin:0">Other classes</h3><div class="small muted">Level plan, Daevanion and gear ticks saved for your other classes.</div>
    <div class="tablewrap"><table><tbody>${Object.keys(ALL).filter(k=>k!==SLUG&&STORE.c[k]).map(k=>{const o=STORE.c[k]||{};const n=o.checks?Object.values(o.checks).filter(Boolean).length:0,pc=o.pchecks?Object.values(o.pchecks).filter(Boolean).length:0,g=o.sv?Object.keys(o.sv).filter(x=>/^g/.test(x)&&o.sv[x]).length:0;return `<tr><td><b>${ALL[k].cls}</b></td><td class="small">${n} plan · ${pc} Daevanion · ${g} gear ticks</td></tr>`}).join('')||'<tr><td class="muted small">Nothing saved for other classes yet.</td></tr>'}</tbody></table></div></div>`;
}
document.addEventListener('change',()=>{const p=$('progressbox');if(p&&p.open)renderProgress()});

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
  let i=S.get('fgidx',null); if(i==null||i>=out.length) i=0;
  const it=out[i];
  const src=findImg(it.item,true);
  g.innerHTML=`<div class="guidehead"><span class="eyebrow">Step-by-step farming · ${esc(it.group)}</span><span class="readout">${i+1} / ${out.length}</span></div>
   <div class="guidecur">${src?`<img class="ico lg" src="${src}" alt="">`:`<span class="farmdot" aria-hidden="true" data-l="${esc(it.item.slice(0,2))}"></span>`}<div><div class="small muted">Method ${i+1} of ${out.length}</div><b style="font-size:16px">${esc(it.item)}</b><div class="small"><b>${esc(it.how)}</b>${it.where?' · '+esc(it.where):''}</div><div class="small muted">${it.limit?'Limit: '+esc(it.limit)+' · ':''}${esc(it.notes)}</div></div></div>
   <div class="guidebtns"><button class="btn" type="button" id="fgprev">← Back</button><button class="btn primary" type="button" id="fgnext">Next →</button><button class="btn" type="button" id="fgshow">Show in list ↓</button><label class="gchk"><input type="checkbox" id="farmonly" ${only?'checked':''}><span>Only what I'm tracking</span></label></div>`;
  const save=n=>S.set('fgidx',n);
  $('fgprev').onclick=()=>{save(Math.max(0,i-1));renderFarmGuide()};
  $('fgnext').onclick=()=>{save(Math.min(i+1,out.length-1));renderFarmGuide()};
  bindFarmOnly();
  document.querySelectorAll('#farmlist .fcurrow').forEach(el=>el.classList.remove('fcurrow'));
  const tr=document.querySelector(`#farmlist tr[data-fk="${it.k}"]`);
  if(tr){tr.classList.add('fcurrow'); const det=tr.closest('details'); if(det) det.open=true;}
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
  ['#wings td b','#wings li b','#pets td b','#pets li b','#upgrades td b','#content td b','#enhance td b','#soulbind td b','#stones td b','#crafting td b','#events td b','#insight td b','#insight li b','#wpclass','#gearplan td.small','#gearguide .what','#farmlist .fname b','#farmpins','#farmguide b','#arcana td b','#arcana li b'].forEach(sel=>document.querySelectorAll(sel).forEach(gradeColor));
  const key=document.getElementById('gradekey');
  if(key&&!key.innerHTML) key.innerHTML=`<span class="muted">Name colour = in-game grade, lowest to highest:</span>${GORDER.filter(gradeHex).map(g=>`<b style="color:${gradeHex(g)}">${g}</b>`).join('')}`;
}
['renderGear','renderFarm','renderFarmGuide','renderGearGuide','renderFarmPins'].forEach(fn=>{
  const orig=window[fn]; if(typeof orig!=='function') return;
  window[fn]=function(){const r=orig.apply(this,arguments);try{gradeAll()}catch(e){}return r};
});

/* ---------- "What's new" (latest 2 updates) + "All changes (archive)" + returning-visitor banner + Beyond 45 ----------
   Data: CHANGES = audit/changes.json (every row is kept; the archive shows all of them).
   Old per-row "Done" ticks (keys chg-<id>) are no longer drawn; whatever is saved stays in the browser store. */
function chT(v){return v==null?'':typeof v==='string'?v:Array.isArray(v)?v.map(chT).join('; '):typeof v==='object'?(v.name||Object.values(v).map(chT).join(' · ')):String(v)}
function chgFor(){return ((CHANGES&&CHANGES.items)||[]).filter(c=>!c.scope||c.scope==='all'||[].concat(c.scope).includes(SLUG)||(typeof c.scope==='string'&&c.scope.split(/,\s*/).includes(SLUG)))}
function chgMine(c){return c.scope&&c.scope!=='all'&&([].concat(c.scope).includes(SLUG)||(typeof c.scope==='string'&&c.scope.split(/,\s*/).length===1&&c.scope===SLUG))}
function chgKey(c){return 'chg-'+c.id}
function chgDates(items){return [...new Set(items.map(c=>c.date))].sort().reverse()}
function chgDay(d){try{const x=new Date(d+'T12:00:00Z');return x.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})}catch(e){return d}}
function chgLabel(d){const l=CHANGES&&CHANGES.labels&&CHANGES.labels[d];return chgDay(d)+(l?': '+l:'')}
/* plain wording: drop simulator asides like "(Simulator +2.98% (0.84% to 5.92%))" from the one-line summary; the archive keeps the full text */
function chgPlain(t){return String(t||'').replace(/\s*\((?:[^()]*\([^()]*\))*[^()]*\b[Ss]imulator\b(?:[^()]*\([^()]*\))*[^()]*\)/g,'').replace(/\s*[Ss]imulator:?\s*[+−-]?\d[\d.]*%[^.;]*[.;]?/g,'').replace(/\s{2,}/g,' ').trim()}
function chgRow(c){
  const link=c.tab?` <a href="#${esc(c.tab)}" data-goto="${esc(c.tab)}">Open tab →</a>`:'';
  return `<li><b>${esc(chT(c.area))}:</b> ${esc(chgPlain(chT(c.action==='ingame'?c.how:c.now)))}${link}</li>`;
}
/* drop-down used by What's new and Beyond 45 (same look as collapse_fn.js); open ones stay open across re-draws */
const XOPEN=new Set();
function xdet(key,title,sum,inner){return `<details class="box cbox xdet" data-xk="${esc(key)}"${XOPEN.has(key)?' open':''}><summary><b style="font-size:17px">${title}</b> <span class="small muted">${sum} Click to open.</span></summary><div class="cbody">${inner}</div></details>`}
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.classList&&d.classList.contains('xdet'))d.open?XOPEN.add(d.dataset.xk):XOPEN.delete(d.dataset.xk)},true);
function xkeep(host){if(host)host.querySelectorAll('details.xdet').forEach(d=>d.open?XOPEN.add(d.dataset.xk):XOPEN.delete(d.dataset.xk))}
function renderChanges(){
  const host=$('changelist'); if(!host||!CHANGES) return; xkeep(host);
  const items=chgFor(), dates=chgDates(items), recent=dates.slice(0,2), cls=C['class'];
  let h='';
  recent.forEach((d,di)=>{
    const day=items.filter(c=>c.date===d);
    const mine=day.filter(c=>c.action==='ingame'&&chgMine(c)), all=day.filter(c=>c.action==='ingame'&&!chgMine(c)), info=day.filter(c=>c.action!=='ingame');
    const h0=h; h='';
    h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">${esc(chgLabel(d))}</h3>`;
    if(!mine.length&&!all.length) h+=`<p class="small" style="margin:0">Nothing to change in game: guide fixes only.</p>`;
    if(mine.length) h+=`<div><h4 class="chgh">Change in game: your ${esc(cls)}</h4><ul class="plain small chglist">${mine.map(chgRow).join('')}</ul></div>`;
    if(all.length) h+=`<div><h4 class="chgh">Change in game: every class</h4><ul class="plain small chglist">${all.map(chgRow).join('')}</ul></div>`;
    if(info.length) h+=`<details class="small"><summary>Also fixed in the guide (${info.length}, nothing to do in game)</summary><ul class="plain chglist" style="margin-top:6px">${info.map(chgRow).join('')}</ul></details>`;
    h+=`</div>`;
    // the newest day stays open; the day before is a drop-down
    h=h0+(di===0?h:xdet('chg-'+d,esc(chgLabel(d)),`${mine.length+all.length} change${mine.length+all.length===1?'':'s'} to make in game, ${info.length} guide fix${info.length===1?'':'es'}.`,h));
  });
  if(!recent.length) h='<p class="muted">No updates yet.</p>';
  const older=items.length;
  h+=`<details class="box" id="chgarchive"><summary><b>All changes (archive)</b> <span class="small muted">${older} rows for your ${esc(cls)} since ${esc(chgDay(dates[dates.length-1]||''))}: what the old guide said, what it says now, and what to do</span></summary><div id="chgarchivebody" style="display:grid;gap:14px;margin-top:10px"><p class="small muted">Loading…</p></div></details>`;
  host.innerHTML=h;
  const ar=$('chgarchive'); if(ar) ar.addEventListener('toggle',()=>{if(ar.open&&!ar.dataset.drawn){ar.dataset.drawn=1;renderChangeArchive()}});
  decorate(host);
  renderChangeBanner();
}
function renderChangeArchive(){
  const host=$('chgarchivebody'); if(!host) return;
  const items=chgFor(), byDate={}; items.forEach(c=>{(byDate[c.date]=byDate[c.date]||[]).push(c)});
  host.innerHTML=chgDates(items).map((d,i)=>`<details class="coldet"${i===0?' open':''}><summary class="pansum"><b>${esc(chgLabel(d))}</b> <span class="small muted">${byDate[d].length} rows · ${byDate[d].filter(c=>c.action==='ingame').length} in game</span></summary>
    <div class="tablewrap" style="margin-top:8px"><table><thead><tr><th>What</th><th>Before (old guide)</th><th>Now (new guide)</th><th>What you do</th></tr></thead><tbody>${
    byDate[d].slice().sort((a,b)=>(a.action==='ingame'?0:1)-(b.action==='ingame'?0:1)).map(c=>`<tr><td><b>${esc(chT(c.area))}</b>${c.tab?`<div class="small"><a href="#${esc(c.tab)}" data-goto="${esc(c.tab)}">Open tab →</a></div>`:''}</td><td class="small muted">${esc(chT(c.was)||'—')}</td><td class="small">${esc(chT(c.now))}</td><td class="small">${c.action==='ingame'?'<span class="tag gold">Do in game</span> ':'<span class="tag">Info</span> '}${esc(chT(c.how))}</td></tr>`).join('')}</tbody></table></div></details>`).join('');
}
/* banner: only for returning visitors, never on a first visit, never on Brawler (not on Global) */
function chgLatest(){return chgDates(chgFor())[0]||''}
function chgSeen(){
  let v=S.gget('chgver',null);
  if(v!=null) return v;
  if(typeof FIRST_VISIT!=='undefined'&&FIRST_VISIT){v=chgLatest();S.gset('chgver',v);return v}
  // a returning reader from before this banner existed: fall back to the old "Hide" date, else count the latest two updates
  const old=S.gget('chgseen',''); if(old) return old;
  const ds=chgDates(chgFor()); return ds[2]||'';
}
function chgMarkSeen(){const l=chgLatest(); if(l) S.gset('chgver',l); const b=$('changebanner'); if(b) b.hidden=true}
function renderChangeBanner(){
  const b=$('changebanner'); if(!b||!CHANGES) return;
  if(SLUG==='brawler'){b.hidden=true;return}
  const seen=chgSeen(), fresh=chgFor().filter(c=>c.date>seen);
  if(!fresh.length){b.hidden=true;return}
  const act=fresh.filter(c=>c.action==='ingame').length;
  b.hidden=false;
  b.innerHTML=`<b>${fresh.length} change${fresh.length>1?'s':''} since your last visit</b>${act?` (${act} need${act>1?'':'s'} an in-game change)`:' (guide fixes only)'}. <a href="#changes" data-goto="changes">See what's new →</a> <button class="btn" type="button" id="chgdismiss">Hide</button>`;
  $('chgdismiss').onclick=chgMarkSeen;
}
/* opening What's new counts as seeing the changes */
{const o=window.show; window.show=function(id){const r=o.apply(this,arguments); try{if(id==='changes'&&SLUG!=='brawler'){const keep=$('changebanner'); chgMarkSeen(); if(keep) keep.hidden=true}}catch(e){} return r}}

/* Beyond 45 (Korea preview): now an ordinary Reference tab, no header switch. b45On/applyB45 stay for older callers. */
function b45On(){return true}
function applyB45(){document.body.hidden=false; document.body.dataset.preview='1'}
function renderBeyond(){
  const host=$('beyondbox'); if(!host) return; xkeep(host);
  if(!BEYOND){host.innerHTML='<p class="muted">No level 46–50 data yet.</p>';return}
  const B=BEYOND, cl=(B.classes||{})[SLUG]||{};
  const noKo=t=>String(t).replace(/\s*\([^()]*[가-힣][^()]*\)/g,'').replace(/[가-힣]+/g,'').replace(/\s{2,}/g,' ').trim();
  const human=k=>({maxLevel:'Max level',level25Spec:'Level-25 perk',newFeatures:'New features',crystals:'Crystals',summary:'Summary',priority:'What to buy first',slots:'Slots',shards:'Shards',math:'How many you need',reset:'Reset'}[k]||k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()));
  const fmt=v=>Array.isArray(v)?`<ul class="plain small">${v.map(x=>`<li>${fmt(x)}</li>`).join('')}</ul>`:(v&&typeof v==='object')?Object.entries(v).map(([k,x])=>`<div style="margin:4px 0"><b>${esc(human(k))}:</b> ${fmt(x)}</div>`).join(''):esc(noKo(v));
  const list=a=>(a||[]).length?`<ul class="plain small">${a.map(x=>`<li>${typeof x==='string'?esc(noKo(x)):fmt(x)}</li>`).join('')}</ul>`:'<p class="small muted">Nothing found yet.</p>';
  host.innerHTML=`<div class="callout warn"><b>Korea preview.</b> Global's cap is 45. This is what Korea got at 46–50 (cap raised 1 Jul 2026). Global may change names, numbers or timing. Lines marked <b>Already on Global</b> are Korean skill changes Global launched with (Korea's balance up to 16 Sep).</div>
   ${B.overview?`<p>${esc(B.overview)}</p>`:''}
   <div class="grid2">
    <div class="box"><h3>Get ready at 45</h3>${list(B.prepareAt45)}</div>
    <div class="box"><h3>Your ${C['class']} at 50</h3>${list([].concat(cl.newSkills||[]).concat(cl.buildChanges||[]))}</div>
   </div>
   ${(B.levels||[]).length?`<div class="box"><h3>Level by level</h3><div class="tablewrap"><table><thead><tr><th class="num">Lv</th><th>Unlocks</th><th class="num">Skill points</th></tr></thead><tbody>${B.levels.map(l=>`<tr><td class="num">${esc(l.lvl)}</td><td class="small">${esc(noKo([].concat(l.unlocks||[]).join(' ')))}</td><td class="num">${l.skillPoints!=null?esc(l.skillPoints):'—'}</td></tr>`).join('')}</tbody></table></div></div>`:''}
   ${(B.dungeons||[]).length?xdet('by-dg','New dungeons and raids',`${B.dungeons.length} dungeons and raids Korea added at 46–50: level, Gear Score and rewards.`,`<div class="box"><h3>New dungeons and raids</h3><div class="tablewrap"><table><thead><tr><th>Name</th><th class="num">Level</th><th class="num">Gear Score</th><th>Rewards</th><th>Notes</th></tr></thead><tbody>${B.dungeons.map(d=>`<tr><td><b>${esc(noKo(d.name))}</b></td><td class="num">${esc(d.lvl||'')}</td><td class="num">${esc(d.gs||'')}</td><td class="small">${esc(noKo([].concat(d.rewards||[]).join(', ')))}</td><td class="small muted">${esc(noKo(d.notes||''))}</td></tr>`).join('')}</tbody></table></div></div>`):''}
   ${xdet('by-zones','Zones, gear, Daevanion and Stigmas','New zones, new gear tiers, board and Stigma changes at 46–50.',`<div class="grid2">
    <div class="box"><h3>Zones</h3>${list(B.zones)}</div>
    <div class="box"><h3>Gear</h3>${list(B.gear)}</div>
    <div class="box small"><h3>Daevanion</h3>${B.daevanion?fmt(B.daevanion):''}</div>
    <div class="box small"><h3>Stigmas</h3>${B.stigmas?fmt(B.stigmas):''}</div>
   </div>`)}
   ${xdet('by-sys','Other systems','Everything else Korea changed with the level 50 update.',`<div class="box"><h3>Other systems</h3>${list(B.systems)}</div>`)}
   ${(B.sources||[]).length?`<p class="small muted">Sources: ${B.sources.slice(0,12).map(u=>`<a href="${esc(u)}" target="_blank" rel="${/metabot\.gg/i.test(String(u||''))?'noopener':'noopener noreferrer'}">${esc(String(u).replace(/^https?:\/\/(www\.)?/,'').slice(0,40))}</a>`).join(' · ')}</p>`:''}`;
  decorate(host);
}

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
  el.innerHTML=`<div class="callout ok"><b>Expect about ${cpM(r.ek.mean+r.ak.mean)} Kina</b>, ${cpN(r.eS.mean)} Enhance Stones${hasA?` and ${cpN(r.aS.mean)} Amplify Stones`:''} over about ${(r.ea+r.aa).toFixed(1)} attempts. An unlucky run (90th percentile) costs about ${cpM(r.ek.p90+r.ak.p90)} Kina${hasA?' (enhancing and Amplify each at their 90th percentile, so a little high)':''}.</div>
  <div class="tablewrap"><table><thead><tr><th>Cost</th><th>Expected</th><th>Lucky 10%</th><th>Typical 50%</th><th>Unlucky 90%</th><th>Worst</th></tr></thead><tbody>
   ${r.es.length?row('Enhancing: Kina',r.ek)+row('Enhancing: Enhance Stones',r.eS):''}
   ${hasA?row('Amplify: Kina',r.ak)+row('Amplify: Amplify Stones',r.aS):''}
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
  <div class="tablewrap"><table><thead><tr><th>Material</th><th>Qty / craft</th><th>Unit price (Kina)</th><th>Cost / craft</th><th>Expected total</th></tr></thead><tbody>
  ${R.tiers.map(t=>`<tr class="cptier"><td colspan="2"><b>${cpE(t.n)}</b><br><span class="small muted">Mastery ${t.mastery}; great success: ${cpE(t.out)}</span></td><td class="cpsr small">Success % <input type="number" inputmode="decimal" min="1" max="100" step="0.1" data-cpsucc="${cpE(CP.recipe+'.'+t.k)}" value="${cpSucc(CP.recipe,t)}" aria-label="${cpE(t.n)} success rate"></td><td class="num small" colspan="2">Expected crafts <b id="cp-att-${t.k}"></b></td></tr>
   ${t.mats.map(([id,q])=>{const M=C.mats[id];return `<tr><td class="small">${cpE(M.n)}${M.sheet&&M.sheet!==M.n?` <span class="muted">(sheet: ${cpE(M.sheet)})</span>`:''}${M.ps==='analog'?' <span class="tag">no sheet price</span>':''}${M.note?`<br><span class="muted">${cpE(M.note)}</span>`:''}</td><td class="num">${q}</td><td><input type="number" inputmode="numeric" min="0" step="1" data-cpprice="${cpE(id)}" value="${cpPrice(id)}" aria-label="${cpE(M.n)} unit price"></td><td class="num" id="cp-pc-${cpE(t.k)}-${cpE(id)}"></td><td class="num" id="cp-et-${cpE(t.k)}-${cpE(id)}"></td></tr>`}).join('')}
   <tr class="cptot"><td colspan="4" class="small">Tier total</td><td class="num" id="cp-tt-${t.k}"></td></tr>`).join('')}
  <tr class="cptot"><td colspan="4">Materials subtotal</td><td class="num" id="cp-sub"></td></tr>
  <tr class="cptot"><td colspan="4">Marketplace tax</td><td class="num" id="cp-tax"></td></tr>
  <tr class="cptot"><td colspan="4">Total Kina</td><td class="num cpbig" id="cp-total"></td></tr>
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
  const s=document.getElementById('cp-craft-sum');if(s)s.innerHTML=`<div class="callout ok"><b>About ${cpM(c.total)} Kina for one True Dragon Lord ${CP.recipe==='weapon'?'weapon':'earring'} (IL62)</b> at these prices. It comes out Splendent (IL70) ${C.combo}% of the time; aiming for Splendent straight from the craft means about 4 True Dragon Lord successes, so about <b>${cpM(c.total*4)}</b>. Crafting materials only: enhancing it is extra (see Cost to reach, IL62/70).</div>`;
}

function cpSoulHTML(){
  const So=COSTPLAN.soul,En=COSTPLAN.engrave,g=So.bind[CP.sbg]?CP.sbg:'Unique',bind=So.bind[g];CP.sbFrom=Math.max(0,Math.min(10,+CP.sbFrom||0));
  let ck=0,cc=0;const rows=bind.map((x,i)=>{ck+=x[0];cc+=x[1];return `<tr${i<CP.sbFrom?' style="opacity:.5"':''}><td>${i+1}</td><td class="num">${cpN(x[0])}</td><td class="num">${x[1]}</td><td class="num">${cpN(ck)}</td><td class="num">${cc}</td></tr>`}).join('');
  const eg=En.fee[CP.eg]!=null?CP.eg:'Unique';
  return `<h4>Soul Binding</h4>${cpSeg('cpsbg',g,Object.keys(So.bind).map(k=>[k,k]))}
  <div class="cpgrid"><label class="cpf">Bind steps already done ${cpSel('cpsbfrom',CP.sbFrom,[[0,'None'],...[1,2,3,4,5,6,7,8,9,10].map(i=>[i,i+(i===10?' (100%)':'')])])}</label>
   <label class="cpf">Resets planned <input type="number" inputmode="numeric" min="0" step="1" data-cpn="resets" value="${+CP.resets||0}"></label>
   <label class="cpf">Syncs planned <input type="number" inputmode="numeric" min="0" step="1" data-cpn="syncs" value="${+CP.syncs||0}"></label></div>
  ${g==='Unique'?`<label class="cpchk"><input type="checkbox" data-cpfuse="1"${CP.fuse?' checked':''}> Soul Fuse at 100% (${So.fuse.stones} Philosopher's Stone: Revelation + ${cpN(So.fuse.k)} Kina)</label>`:''}
  <div id="cp-soul-out"></div>
  <details class="small"><summary><b>Bind cost per step (${cpE(g)})</b></summary><div class="tablewrap"><table><thead><tr><th>Step</th><th>Kina</th><th>Soul Codex</th><th>Kina so far</th><th>Codex so far</th></tr></thead><tbody>${rows}</tbody></table></div></details>
  <ul class="plain small"><li>${cpE(So.bindNote)}</li><li>Reset (Rebind) on ${cpE(g)}: ${cpN(So.rebind[g][0])} Kina + ${So.rebind[g][1]} Soul Codex: Reset. ${cpE(So.rebindNote)}</li><li>${cpE(So.sync)}</li><li>${cpE(So.fuse.shop)} ${cpE(So.fuse.note)}</li><li>${cpE(So.potential.note)}</li></ul>
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
  const a=document.getElementById('cp-soul-out');if(a)a.innerHTML=`<div class="callout ok"><b>${cpN(k)} Kina</b> + ${cpN(bc)} Soul Codex${rs?` + ${cpN(rs*So.rebind[g][1])} Soul Codex: Reset`:''}${sy?` + ${cpN(sy)} Sync Stones (${cpN(sy)} spare Unique pieces)`:''}${fu?` + ${So.fuse.stones} Philosopher's Stone: Revelation`:''}.<br><span class="small">Bind to 100% from step ${CP.sbFrom}: ${cpN(bk)} Kina + ${cpN(bc)} Codex${rs?`; resets: ${cpN(rs*So.rebind[g][0])} Kina`:''}${fu?`; Soul Fuse: ${cpN(So.fuse.k)} Kina`:''}.</span></div>`;
  const n=Math.max(0,+CP.engr||0),sn=CP.stoneN==null?En.slots[eg]:Math.max(0,+CP.stoneN||0),sp=Math.max(0,+CP.stoneP||0);
  const b=document.getElementById('cp-eng-out');if(b)b.innerHTML=`<div class="callout ok"><b>${cpN(n*(En.fee[eg]+sn*sp))} Kina</b> for ${cpN(n)} engraves on ${cpE(eg)} gear (${cpN(En.fee[eg])} fee + ${sn} × ${cpN(sp)} stones each)${sp?'':'. Add your stone price to include the stones'}: ${cpN(n*sn)} stones used.</div>`;
}

function cpMilesHTML(){
  const ils=[70,86,102],c=cpCraft(CP.recipe),out=[];
  const cell=(il,to,amp)=>{const r=cpRun('Unique',il,0,to,0,amp,2500);return {k:r.ek.mean+r.ak.mean,k90:r.ek.p90+r.ak.p90,s:r.eS.mean,a:r.aS.mean}};
  const fmt=x=>`<b>${cpM(x.k)}</b><br><span class="small muted">${cpN(x.s)} stones${x.a?` + ${cpN(x.a)} Amp`:''}<br>unlucky ${cpM(x.k90)}</span>`;
  const rows=[['+10 (always succeeds)',il=>cell(il,10,0)],['+12',il=>cell(il,12,0)],['+15',il=>cell(il,15,0)],['+15 and Amplify +3',il=>cell(il,15,3)],['+15 and Amplify max (+3 at IL70, +5 at 86/102)',il=>cell(il,15,cpCap(il,false))]];
  const t62=cell(62,15,1),t70s=cell(70,15,1);
  return `<p class="small"><b>Expected averages</b> for one piece from +0 (Kina fees; stones listed under). Weapons, armor and accessories cost the same at the same item level. Multiply by the pieces you plan to do. "Unlucky" = 90th percentile.</p>
  <div class="tablewrap"><table><thead><tr><th>Checkpoint</th>${ils.map(i=>`<th>IL${i} piece</th>`).join('')}</tr></thead><tbody>
  ${rows.map(([n,f])=>`<tr><td class="small">${cpE(n)}</td>${ils.map(il=>`<td class="num">${fmt(f(il))}</td>`).join('')}</tr>`).join('')}
  </tbody></table></div>
  <h4>Crafted True Dragon Lord (${CP.recipe==='weapon'?'weapon':'earrings'} recipe, prices from the Crafting section)</h4>
  <div class="tablewrap"><table><thead><tr><th>Goal</th><th>Expected Kina</th></tr></thead><tbody>
   <tr><td class="small">Craft one True Dragon Lord (IL62)</td><td class="num"><b>${cpM(c.total)}</b></td></tr>
   <tr><td class="small">…then +15 and Amplify +1 (IL62 cap)</td><td class="num"><b>${cpM(c.total+t62.k)}</b><br><span class="small muted">+ ${cpN(t62.s)} stones + ${cpN(t62.a)} Amp</span></td></tr>
   <tr><td class="small">Splendent True Dragon Lord (IL70) straight from the craft (about 4 successes), +15 and Amplify +1</td><td class="num"><b>${cpM(c.total*4+t70s.k)}</b></td></tr>
  </tbody></table></div>
  <p class="small muted">Enhance and Amplify Stones are farmed, not bought, so they are listed rather than priced. 1 Amplify Stone = 4 Fragments + 2,500 Enhance Stones. Soul Binding to 100% adds 2.13M Kina + 408 Soul Codex per Unique piece.</p>`;
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

/* ----- greedy plan: best % DPS per Kina first, re-evaluated after every step ----- */
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
  return `Loaded ${n} pieces from ${M.name||'your character'}${M.gear.some(g=>g.detail)?'':' (no item details: Soul Binding lines and stones are set to 0; load the full character data for them)'}. Stat weights: ${OP.sheet==='p10'?'Top 10%':'Typical'} gear (combat power ${opN(cp)}).`;
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
  host.innerHTML=`<p class="small">Enter your gear (or load it from My character), your Kina budget and what you have on hand. The plan lists the next upgrades in the order that gives the <b>most damage per Kina</b>, re-checking after every step, until the budget runs out.</p>
  <div class="chrow"><button type="button" class="btn primary" data-opb="mychar">Use My character</button><button type="button" class="btn" data-opb="typical">Fill: Typical gear</button><button type="button" class="btn" data-opb="top">Fill: Top-10% gear</button></div>
  <div id="op-msg" class="small muted">${hasChar?'A character is loaded in My character: press "Use My character" to copy its gear here.':'Tip: load your character in the My character tab, then press "Use My character".'}</div>
  <div class="opgrid">
   <label class="opf">Budget (Kina)<input type="number" inputmode="numeric" min="0" step="100000" data-opk="budget" value="${+OP.budget||0}"></label>
   <label class="opf">Stat weights ${opSel('opk="sheet"',OP.sheet,[['median','Typical player'],['p10','Top 10%']])}</label>
   <label class="opf">Weapon Theostone ${opSel('opk="theo"',c.theo||'',[['','None']].concat(th.map(t=>[t,t.replace(/^Theostone: /,'')])).concat(c.theo&&!th.includes(c.theo)?[[c.theo,c.theo.replace(/^Theostone: /,'')]]:[]))}</label>
  </div>
  <h4>Your gear</h4>${opTableHTML()}
  <p class="small muted">Best lines = Soul Binding lines that are on the guide's best list for that slot (Build tab: Soul Binding targets). Good stones = Attack, Critical Hit, Accuracy or boost lines. Untick Keep for pieces you will replace: they get no enhancing past +10, no Amplify, Binding or Superior stones.${c.src==='mychar'?' Rows with a blue edge came from My character with their exact lines and stones; changing Best lines or Good stones there switches the row to the simple count.':''}</p>
  <details class="small"><summary><b>Stones on hand and prices</b></summary>
   <div class="opgrid">${si('enh','Enhance Stones')}${si('amp','Amplify Stones')}${si('codex','Soul Codex')}${si('phil',"Philosopher's Stones")}${si('piece','Spare Unique pieces')}${si('mana','Superior Manastones')}</div>
   <div class="opgrid">${pi('enhStone','Enhance Stone price')}${pi('ampStone','Amplify Stone price')}${pi('mana','Superior stone price')}${pi('piece','Spare Unique piece price')}${pi('theoU','Theostone price')}${pi('codex','Soul Codex price')}${pi('phil',"Philosopher's Stone price")}</div>
   <ul class="plain small">${Object.entries(OPTDATA.priceNotes).map(([,v])=>`<li>${opE(v)}</li>`).join('')}<li>Stones on hand are used first and cost no Kina, but the ranking still counts them at their price, so they go where they help most.</li></ul>
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
  el.innerHTML=rows.length?`<div class="callout ok"><b>${opP(R.cumG)} DPS for about ${opM(R.cum)} Kina</b> (${rows.length} steps, ${opM(R.left)} left over)${Object.keys(tot).length?`, using ${Object.entries(tot).filter(([,n])=>n>=0.5).map(([k,n])=>`${opN(n)} ${SN[k]}`).join(', ')}`:''}. Expected averages; gains add up approximately.</div>
  <div class="tablewrap"><table><thead><tr><th>#</th><th>Item</th><th>Upgrade</th><th>Expected cost</th><th>DPS</th><th>Per 1M Kina</th><th>Total cost</th><th>Total DPS</th><th>Why</th></tr></thead><tbody>
  ${rows.map((r,i)=>`<tr><td class="num">${i+1}</td><td class="small"><b>${opE(r.lbl)}</b></td><td class="small">${opE(r.act)}</td>
   <td class="num"><b>${opM(r.kin)}</b>${r.val>r.kin+1?`<br><span class="small muted">worth ${opM(r.val)} with stones</span>`:''}${r.unl?`<br><span class="small muted">unlucky ${opM(r.unl)}</span>`:''}${stTxt(r)?`<br><span class="small muted">${opE(stTxt(r))}</span>`:''}</td>
   <td class="num">${opP(r.g)}</td><td class="num">${r.r>=100?'very high':opP(r.r,3)}</td><td class="num">${opM(r.cum)}</td><td class="num opbig">${opP(r.cumG)}</td><td class="small opwhy">${opE(r.why)}</td></tr>`).join('')}
  </tbody></table></div>`:`<div class="callout"><b>No upgrade fits.</b> ${R.left<1?'Add a budget.':'Everything that adds damage is done or blocked, or the next step costs more than the budget.'}</div>`;
  el.innerHTML+=`${notes.length?`<ul class="plain small">${notes.map(n=>`<li>${opE(n)}</li>`).join('')}</ul>`:''}
  <details class="small"><summary><b>How this works and what it leaves out</b></summary><ul class="plain small">
   <li><b>Damage</b>: each stat's worth comes from the guide's simulator (raid bosses Divine Auldor and Kromede's Desire, ${OP.sheet==='p10'?'top 10%':'typical'} gear, guide rotation), measured at one and three steps of each stat, so caps (Critical Hit 50%) and diminishing returns shrink later gains.</li>
   <li><b>Cost</b>: the same exact maths as the cost planner above (odds, pity, fees by item level); stones turned into Kina at your prices. Unlucky = 90th percentile.</li>
   <li><b>Stats per step</b>: enhancement and Amplify tables from Global client data (metabot.gg item pages); Soul Binding pools and best lines from this guide's reroll targets. Binding moves each line toward its maximum (an assumption: the game only says the rate raises line values).</li>
   <li>Never enhance past +10 an item you will replace: untick Keep and the plan stops it at +10 (the cost planner explains why).</li>
   <li>Armor + and Amplify add Defense/HP only, so they never rank for damage; do them for survival. Bracelets, belt and amulet are not modelled.</li>
   <li>Not ranked (no Kina price): Daevanion boards, Arcana, Stigma levels, wings and the White/Wise Dragon Lord upgrade recipes. See their tabs.</li></ul></details>`;
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
const CH_COSTW={free:'Free',cheap:'Cheap',shards:'Stigma Shards',crystals:'Daevanion crystals',kinah:'Kina + materials',grind:'Farming'};
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
  if(empt.length)T('stone-empty',1,6,'cheap',`Fill empty manastone slots: ${empt.map(r=>`${chH(r.label.toLowerCase())} (${r.stone.empty})`).join(', ')}`,`Any stone beats an empty slot. Ideal stones: ${empt.slice(0,3).map(r=>`${chH(r.label)}: ${chH(r.stone.want.join(', ')||'Attack')}`).join('; ')}. Use cheap stones on pieces you will replace.`,'stones',{type:'stones',fill:empt.map(r=>({slot:r.key,n:r.stone.empty}))});
  // enhancing: weapon, then guard, then armor, then accessories
  const grp={weapon:[],guard:[],armor:[],acc:[]};
  enhGaps.forEach(r=>{const t=r.gs&&r.gs.t;(r.key==='weapon'?grp.weapon:r.key==='guard'?grp.guard:t==='armor'?grp.armor:grp.acc).push(r)});
  const enhTxt=a=>a.map(r=>`${chH(r.label)} +${r.g.enh} → +${r.tgt}`).join(', ');
  if(grp.weapon.length)T('enh-weapon',2,1,'kinah',`Enhance your weapon to +${grp.weapon[0].tgt}`,`${enhTxt(grp.weapon)}. The weapon is your biggest single damage upgrade; finish it before anything else you enhance.`,'enhance',{type:'enhance',slots:grp.weapon.map(r=>({slot:r.key,from:r.g.enh,to:r.tgt}))});
  if(grp.guard.length)T('enh-guard',2,2,'kinah',`Enhance your guard / off-hand to +${grp.guard[0].tgt}`,enhTxt(grp.guard),'enhance',{type:'enhance',slots:grp.guard.map(r=>({slot:r.key,from:r.g.enh,to:r.tgt}))});
  if(grp.armor.length)T('enh-armor',2,3,'kinah',`Enhance armor to +${grp.armor[0].tgt}`,enhTxt(grp.armor)+'. Only on pieces you will keep (item level 86+); enhancement carries over when you upgrade.','enhance',{type:'enhance',slots:grp.armor.map(r=>({slot:r.key,from:r.g.enh,to:r.tgt}))});
  if(grp.acc.length)T('enh-acc',2,4,'kinah','Enhance accessories, belt and amulet to their targets',enhTxt(grp.acc),'enhance',{type:'enhance',slots:grp.acc.map(r=>({slot:r.key,from:r.g.enh,to:r.tgt}))});
  const amp=A.gear.filter(r=>r.amp);
  if(amp.length&&!grp.weapon.length)T('amp',2,5,'kinah','Amplify your '+amp.map(r=>r.label.toLowerCase()).join(' and '),amp.map(r=>`${chH(r.label)} Amplify ${r.g.exceed}/${r.g.maxExceed}`).join(', ')+'. Amplify (the +15 → +20 track) adds Attack and Damage Boost on top of +15.','enhance',{type:'amplify',slots:amp.map(r=>({slot:r.key,from:r.g.exceed,to:r.g.maxExceed}))});
  // soul binding rerolls on keeper gear, weapon first
  const sg={weapon:[],guard:[],armor:[],acc:[]};
  A.gear.filter(r=>r.keeper&&r.bad.length).forEach(r=>{const t=r.gs&&r.gs.t;(r.key==='weapon'?sg.weapon:r.key==='guard'?sg.guard:t==='armor'?sg.armor:sg.acc).push(r)});
  const syncTxt=r=>`${chH(r.label)}: ${r.bad.map(l=>`<b>${chH(l.skill?'+'+l.level+' '+l.name:l.name)}</b>`).join(', ')} <span class="muted">(aim for ${chH(((r.R&&r.R.best)||[]).slice(0,2).join(' or '))})</span>`;
  [['weapon','your weapon'],['guard','your guard'],['armor','armor'],['acc','accessories']].forEach(([k,lab],i)=>{
    const a=sg[k];if(!a.length)return;const n=a.reduce((x,r)=>x+r.bad.length,0);
    T('sync-'+k,3,i,'grind',`Soul Binding: Sync ${n} weak line${n>1?'s':''} on ${lab}`,a.map(syncTxt).join('<br>')+(a.some(r=>r.g.soulRate!=null&&r.g.soulRate<100)?'<br><span class="muted">Fix the lines before you Bind: at 100% Soul Binding Rate they are fixed for good.</span>':''),'soulbind',{type:'sync',slots:a.map(r=>({slot:r.key,lines:r.bad.map(l=>l.name)}))});
  });
  A.gear.filter(r=>r.keeper&&r.stone&&r.stone.rated.length>=2&&r.stone.useful<=1&&!r.stone.empty).forEach((r,i)=>{
    T('stones-'+r.g.slot,3,20+i,'kinah',`Re-engrave the manastones on your ${r.label.toLowerCase()}`,`Only ${r.stone.useful} of ${r.stone.rated.length} lines are useful. Keep a roll once 2 or more lines are ${chH(r.stone.want.join(' / ')||'useful')}. Engraving rerolls all lines at once (no lock).`,'stones',{type:'stones',slot:r.key});
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
    if(bad.length)T('genus',3,40,'grind',`Genus Insight: reroll ${bad.length} weak line${bad.length>1?'s':''}`,bad.slice(0,6).map(r=>`${chH(r.fam)} slot ${r.slot}: ${chH(r.name)} (${chH(r.gw)})`).join(', ')+(bad.length>6?'…':'')+'. From your AionFlex code; see Pets &amp; Genus Insight for what to aim for.','insight',{type:'genus',lines:bad.map(r=>({family:r.fam,slot:r.slot}))});
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
  if(!A.genus)return `<div class="box small"><h3 style="margin:0 0 6px">Genus Insight</h3>Not in NCSoft's data. If an AionFlex meter user has seen your character, open your page on aionflex.gg, press "Copy build code" and paste the <b>af1.</b> code above; otherwise check it by hand in <a href="#insight" data-goto="insight">Genus Insight</a>.</div>`;
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
  // mode facts (Global unless marked; checked 2026-10-17)
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
      const lab=hn?`<a href="${h(s.url)}" target="_blank" rel="${/metabot\.gg/i.test(String(s.url||''))?'noopener':'noopener noreferrer'}">${h(hn)}</a>`:'game client data';
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
      (rows.length?`<ul class="mschg">${rows.join('')}</ul>`:'')+(g.note?`<details class="mstested"><summary>How we tested</summary><p class="small muted">${h(g.note)}</p></details>`:'')+`</div>`;
  }
  function card(k,M){
    const I=INFO[k]; const done=false; const isA=k==='arena';
    const head=`<header class="mshead"><div><span class="eyebrow">${h(I.kind)}</span><h3>${h(M&&M.title||I.name)}</h3></div>`+
      `</header>`+
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
    // one plain verdict line stays visible; the simulator numbers move into a closed "How we tested"
    const g0=typeof s.gainPct==='number'?s.gainPct:null, tm=/time/i.test(String(s.metric||''));
    const verdict=isA?'Built from research and class mechanics'+(hasSim?', with a simulator check.':'.')
      :g0==null?'Tested in our simulator against your raid setup.'
      :Math.abs(g0)<0.5?'About the same as your raid setup in our tests; use it if you prefer it.'
      :tm?`Clears about ${Math.abs(g0).toFixed(0)}% ${g0>=0?'faster':'slower'} than your raid setup in our tests.`
      :`Worth about ${g0>=0?'+':''}${g0.toFixed(Math.abs(g0)<1?1:0)}% ${String(s.metric||'damage').replace(/^Damage$/,'damage')} over your raid setup in our tests.`;
    const tested=(hasSim||!isA)?`<details class="mstested"><summary>How we tested</summary><div class="msmeta">`+
      (isA?`<span class="tag">From research and class mechanics</span> ${hasSim?'<span class="tag wind">Simulator check</span>':''}`
          :`<span class="tag wind">Simulator</span> ${s.robust===true?'<span class="tag">same result with typical and top 10% gear and every assumption we tried</span>':s.robust===false?'<span class="tag">depends on gear and assumptions</span>':''}`)+
      `</div>${simLine(s)}${s.note?`<p class="small muted">${h(s.note)}</p>`:''}</details>`:'';
    const foot=`<footer class="mssim"><p class="small msverdict"><b>Verdict:</b> ${h(verdict)} ${conf}</p>${tested}</footer>`;
    if(isA) return `<article class="box mscard arena${done?' done':''}" data-mscard="${k}">${head}`+
      `<p class="mssum">${h(M.summary)}</p>`+msOpen(k,'perks, Stigmas, burst order, how to play and matchups')+
      `<div class="mscols"><div class="mscol">${chgSec}${stigSec}${burstFlow(M.burst)}</div>`+
      `<div class="mscol">${list('Press by hand',M.manual,manLine)}${list('How to play it',M.tips)}${list('Staying alive',M.survival)}</div></div>`+
      arenaBits(M)+`</details>`+foot+`</article>`;
    return `<article class="box mscard${done?' done':''}" data-mscard="${k}">${head}`+
      `<p class="mssum">${h(M.summary)}</p>`+msOpen(k,'what to change from your raid setup, Stigmas, skill bar, how to play and staying alive')+chgSec+stigSec+altSec(M.macroAlt)+
      list('Press by hand',M.manual,manLine)+list('How to play it',M.tips)+list('Staying alive',M.survival)+
      `</details>`+foot+`</article>`;
  }
  // the full setup of each card is a drop-down (like the dungeon cards); open ones stay open across re-draws
  const msOpenSet=new Set();
  function msOpen(k,what){return `<details class="msbody" data-msk="${h(k)}"${msOpenSet.has(k)?' open':''}><summary><b>Full setup</b> <span class="small muted">${h(what)}. Click to open.</span></summary>`}
  let drawnMode=null;
  function renderModeSetups(){
    const host=document.getElementById('modesbox'); if(!host) return;
    host.querySelectorAll('details.msbody').forEach(d=>d.open?msOpenSet.add(d.dataset.msk):msOpenSet.delete(d.dataset.msk));
    if(!host.dataset.mstoggle){host.dataset.mstoggle=1; host.addEventListener('toggle',e=>{const d=e.target; if(d&&d.classList&&d.classList.contains('msbody')){d.open?msOpenSet.add(d.dataset.msk):msOpenSet.delete(d.dataset.msk)}},true);
      const st=document.createElement('style'); st.textContent='details.msbody>summary{cursor:pointer;padding:6px 0}details.msbody[open]>summary{margin-bottom:8px}details.msbody{min-width:0}details.msbody>*+*{margin-top:12px}#modesbox{align-items:start}'; document.head.appendChild(st);}
    const M=C.modeSetups||null;
    drawnMode=typeof MODE!=='undefined'?MODE:null;
    host.innerHTML=order().map(k=>card(k,M&&M[k])).join('');
    if(typeof decorate==='function') decorate(host);
  }
  // Mode setups is useful in PvE and PvP (arena card): stop the PvE/PvP switch from hiding its tab
  function unhideModesTab(){
    const tb=document.querySelector('nav.tabs button[data-tab="builds"]')||document.querySelector('nav.tabs button[data-tab="modes"]');
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
      '.dgfacts dt{font:600 12px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}',
      '.dgfacts dd{margin:2px 0 0;font-size:14px;overflow-wrap:anywhere}',
      '.dgboss{border:1px solid var(--line);border-radius:10px;padding:12px;display:grid;gap:10px;min-width:0}',
      '.dgbhead{display:flex;gap:10px;align-items:center;min-width:0}',
      '.dgbhead h4{margin:0;font-size:16px;min-width:0;overflow-wrap:anywhere}',
      '.dgpic{display:grid;gap:2px;justify-items:center;flex:none}',
      '.dgpic img{width:56px;height:56px;border-radius:10px;object-fit:cover;background:var(--panel2);border:1px solid var(--line)}',
      '.dgcredit{font-size:12px;color:var(--muted);line-height:1.2}',
      '.dgcredit a{color:inherit}',
      '.dgplabel{font-size:12px;font-weight:600;line-height:1.2}',
      '.dgmech{display:grid;gap:6px;margin:0;padding:0;list-style:none}',
      '.dgmech li{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;align-items:start;background:var(--panel2);border-radius:8px;padding:7px 10px;font-size:14px}',
      '.dgmech li.hasfig{grid-template-columns:64px minmax(0,1fr)}',
      '.dgtxt{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px 10px;align-items:start;min-width:0}',
      '.dgmech .arrow{color:var(--gold)}',
      '.dgmech .dgsee::before{content:"See: ";font-weight:600;color:var(--muted)}',
      '.dgmech .dgdo::before{content:"Do: ";font-weight:600;color:var(--wind)}',
      '.dgwatch{grid-column:1/-1;font-size:12.5px;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}',
      '.dgwatch a{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:999px;border:1px solid var(--line);text-decoration:none;color:var(--fg);font-weight:600;white-space:nowrap}',
      '.dgwatch a:hover,.dgwatch a:focus-visible{border-color:var(--gold)}',
      '.dgwatch .muted{overflow-wrap:anywhere}',
      '.dgfig{width:64px;height:64px;display:block}',
      '.dgfig .ar{fill:none;stroke:var(--line);stroke-width:1.2}',
      '.dgfig .bo{fill:var(--fg)}',
      '.dgfig .pl{fill:var(--n-legend)}',
      '.dgfig .mk{fill:var(--gold);stroke:var(--bg);stroke-width:.8}',
      '.dgfig .dz{fill:rgba(239,91,91,.32);stroke:#ef5b5b;stroke-width:1}',
      '.dgfig .dl{fill:none;stroke:#ef5b5b;stroke-width:2.4;stroke-linecap:round}',
      '.dgfig .rg{fill:none;stroke:#ef5b5b;stroke-width:1.6}',
      '.dgfig .sf{fill:rgba(95,194,141,.14);stroke:var(--n-rare);stroke-width:1.2;stroke-dasharray:3 2}',
      '.dgfig .tz{stroke:#7fb2ff;stroke-width:1.8;stroke-dasharray:2 1.5}',
      '.dgfig .rk{fill:var(--muted)}',
      '.dgfig .mv{stroke:var(--muted);stroke-width:1.3;fill:none}',
      '.dgfig .mh{fill:var(--muted)}',
      '.dgkey{margin:4px 0 0;font-size:12px}',
      'details.dgmore>summary{cursor:pointer;font-size:13.5px;color:var(--muted)}',
      'details.dgmore[open]>summary{margin-bottom:8px}',
      'details.dgmore .mssec+.mssec{margin-top:8px}',
      '.dgwipe li{color:var(--warn)}',
      '.dgroles{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}',
      '.dgroles div{font-size:14px;background:var(--panel2);border-radius:8px;padding:7px 10px}',
      '.dgvids{display:grid;gap:8px;margin:0;padding:0;list-style:none}',
      '.dgvids li{font-size:14px;overflow-wrap:anywhere}',
      '.dgvids a{font-weight:600}',
      '.dghead{margin:0;display:grid;gap:3px}',
      '.dghead img{width:100%;max-height:200px;object-fit:cover;border-radius:10px;display:block;background:var(--panel2)}',
      '.dgcount{font:600 12px var(--f-mono);letter-spacing:.04em;color:var(--muted)}',
      // mode picker (Exploration / Conquest) and stage picker (Transcendence 1-4)
      '.dgpick{display:grid;gap:6px;min-width:0}',
      '.dgpick .seg{flex-wrap:wrap;max-width:100%}',
      '.dgpick p{margin:0}',
      '.dgcq{border:1px dashed var(--gold);border-radius:9px;padding:9px 10px;display:grid;gap:6px;min-width:0}',
      '.dgcq>h4,.dgstg>h4{margin:0;display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:14px}',
      '.dgcq ul{margin:0}',
      '.dgstg{border:1px solid var(--line);border-radius:9px;padding:9px 10px;display:grid;gap:6px;min-width:0}',
      '.dgstg ul{margin:0}',
      '.dgnew,.dgfrom,.dgmtag{display:none;font:600 12px var(--f-mono);letter-spacing:.04em;text-transform:uppercase;padding:1px 6px;border-radius:999px;margin-right:6px;vertical-align:1px;white-space:nowrap}',
      '.dgnew{background:var(--gold);color:var(--bg)}',
      '.dgfrom,.dgmtag{border:1px solid var(--line);color:var(--muted)}',
      '.dgmtag{display:inline-block}',
      '.isnew>.dgnew,.isnew .dgtxt>.dgsee>.dgnew{display:inline-block}',
      '.wasnew>.dgfrom,.wasnew .dgtxt>.dgsee>.dgfrom{display:inline-block}',
      '.dgmech li.isnew,ul.plain li.isnew{box-shadow:inset 3px 0 0 var(--gold)}',
      'ul.plain li.isnew{padding-left:9px}',
      '.dgvids .tag{margin-right:2px}',
      '@media (max-width:640px){.dgtxt{grid-template-columns:minmax(0,1fr)}.dgmech .arrow{display:none}.dgmech li.hasfig{grid-template-columns:52px minmax(0,1fr)}.dgfig{width:52px;height:52px}details.dgcard>summary{padding:12px}.dgbody{padding:0 12px 12px}.dgboss{padding:10px}.dgpic img{width:48px;height:48px}}'
    ].join('\n');
    document.head.appendChild(el);
  }

  const done=id=>{try{return !!S.get('dg-'+id,false)}catch(e){return false}};
  const list=(t,a,cls)=>{a=arr(a);return a.length?`<div class="mssec"><h4>${t}</h4><ul class="plain small${cls?' '+cls:''}">${a.map(x=>`<li>${h(x)}</li>`).join('')}</ul></div>`:''};

  // ---- self-drawn top-down diagrams (fixed presets; no data goes into the markup) ----
  const C=(x,y,r,c)=>`<circle class="${c}" cx="${x}" cy="${y}" r="${r}"/>`;
  const BOSS=(x,y,dn)=>C(x,y,5,'bo')+`<path class="bo" d="M${x-3} ${y+(dn?4:-4)} L${x} ${y+(dn?9:-9)} L${x+3} ${y+(dn?4:-4)}Z"/>`;
  const P=(x,y)=>C(x,y,2.6,'pl'), MK=(x,y)=>C(x,y,3,'mk');
  const MV=(x1,y1,x2,y2)=>{const a=Math.atan2(y2-y1,x2-x1),l=3.2,w=.55;
    return `<line class="mv" x1="${x1}" y1="${y1}" x2="${(x2-Math.cos(a)*2).toFixed(1)}" y2="${(y2-Math.sin(a)*2).toFixed(1)}"/><path class="mh" d="M${x2} ${y2} L${(x2-l*Math.cos(a-w)).toFixed(1)} ${(y2-l*Math.sin(a-w)).toFixed(1)} L${(x2-l*Math.cos(a+w)).toFixed(1)} ${(y2-l*Math.sin(a+w)).toFixed(1)}Z"/>`};
  const RING=(x,y,R,r,c)=>`<path class="${c}" fill-rule="evenodd" d="M${x-R} ${y}a${R} ${R} 0 1 0 ${2*R} 0a${R} ${R} 0 1 0 ${-2*R} 0ZM${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z"/>`;
  const AR=C(32,32,29,'ar');
  const FIG={
    stack:['Stack on the marked player',BOSS(32,13)+C(32,42,10,'dz')+MK(32,42)+P(13,50)+MV(15,49,24,45)+P(51,50)+MV(49,49,40,45)+P(32,59)+MV(32,57,32,52)],
    away:['Marked player: others keep out of the circle',BOSS(32,13)+C(42,44,10,'dz')+MK(42,44)+P(37,38)+MV(35,37,24,32)+P(49,37)+MV(50,35,54,25)],
    spread:['Spread out so circles do not overlap',BOSS(32,32)+C(15,20,7,'dz')+P(15,20)+C(49,20,7,'dz')+P(49,20)+C(15,45,7,'dz')+P(15,45)+C(49,45,7,'dz')+P(49,45)],
    donut:['Donut: stand close to the boss',RING(32,32,27,11,'dz')+C(32,32,10,'sf')+BOSS(32,32)+P(40,35)+P(25,36)],
    out:['Leave the big circle around the boss',C(32,32,17,'dz')+BOSS(32,32)+P(21,25)+MV(20,24,11,18)+P(43,25)+MV(44,24,53,18)+P(32,44)+MV(32,46,32,57)],
    behind:['Frontal attack: stand behind the boss',`<path class="dz" d="M32 30 L9 9 A31 31 0 0 1 55 9Z"/>`+BOSS(32,30)+C(32,47,6.5,'sf')+P(29,47)+P(35,47)],
    rings:['Rings move outward: jump each one',BOSS(32,32)+C(32,32,10,'rg')+C(32,32,17,'rg')+C(32,32,24,'rg')+P(46,45)+`<path class="mv" d="M41 50 Q45 39 50 41"/>`],
    line:['Charge line: get out of it',`<rect class="dz" x="27.5" y="15" width="9" height="44" rx="2"/>`+BOSS(32,12,true)+MK(32,55)+P(30,30)+MV(28,30,17,30)+P(34,40)+MV(36,40,47,40)],
    gaps:['Fan of lines: stand in a gap',BOSS(32,11,true)+`<path class="dl" d="M32 16 L9 47 M32 16 L19 58 M32 16 L32 61 M32 16 L45 58 M32 16 L55 47"/>`+C(25.5,49,4.5,'sf')+P(25.5,49)],
    edge:['Outer floor is dangerous: stay in the middle',RING(32,32,29,19,'dz')+C(32,32,15,'sf')+BOSS(32,30)+P(25,39)+P(39,39)],
    apart:['Linked pair: walk apart until it breaks',BOSS(32,12)+`<line class="tz" x1="28" y1="38" x2="36" y2="38"/>`+MK(28,38)+MK(36,38)+MV(25,39,13,44)+MV(39,39,51,44)],
    close:['Chained to the boss: stay close',C(32,30,13,'sf')+BOSS(32,30)+`<line class="tz" x1="32" y1="30" x2="41" y2="37"/>`+MK(41,37)+P(52,50)+MV(50,48,44,42)],
    cover:['Hide behind a rock (line of sight)',C(32,32,29,'dz')+`<path class="sf" d="M45 20 L51 26 L60 18 L52 7Z"/>`+`<rect class="rk" x="42" y="19" width="7" height="7" rx="1.5"/>`+BOSS(32,34)+P(52,15)],
    kite:['Chasing circle: lead it away from the group',BOSS(20,18)+P(14,38)+P(20,43)+C(42,52,6,'dz')+MK(47,44)+MV(48,42,53,30)],
    edgedrop:['Marked: drop the puddle at the edge',BOSS(32,24)+P(25,36)+P(39,36)+MK(32,40)+MV(32,43,32,52)+C(32,56,4.5,'dz')],
    beam:['Beam on the marked player: point it away',BOSS(32,28)+`<rect class="dz" x="28" y="33" width="8" height="28" rx="2"/>`+MK(32,56)+P(26,11)+P(38,11)],
    circles:['Circles under each player: step out',BOSS(32,13)+C(17,40,6,'dz')+P(17,40)+MV(17,42,13,51)+C(32,48,6,'dz')+P(32,48)+MV(34,49,42,55)+C(47,40,6,'dz')+P(47,40)+MV(48,42,53,49)]
  };
  const figSvg=k=>{const f=Object.prototype.hasOwnProperty.call(FIG,k)&&FIG[k]; if(!f) return '';
    return `<svg class="dgfig" viewBox="0 0 64 64" role="img" aria-label="Diagram: ${h(f[0])}"><title>${h(f[0])}</title>${AR}${f[1]}</svg>`};

  // ---- "watch this moment" link (opens YouTube at the time; no embed, no download) ----
  function ytAt(v){
    if(!v||typeof v!=='object') return null;
    let u; try{u=new URL(String(v.url||''))}catch(e){return null}
    if(u.protocol!=='https:'||!/(^|\.)youtube\.com$|^youtu\.be$/i.test(u.hostname)) return null;
    const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v'); if(!/^[\w-]{11}$/.test(id||'')) return null;
    const t=parseInt(String(u.searchParams.get('t')||'0').replace(/s$/,''),10)||0;
    return {href:`https://www.youtube.com/watch?v=${id}&t=${t}s`,t,label:v.label,channel:v.channel,lang:v.lang};
  }
  const mmss=t=>`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
  function watchHtml(v){
    const y=ytAt(v); if(!y) return '';
    const who=[y.channel,y.lang&&`in ${y.lang}`].filter(Boolean).map(h).join(' · ');
    return `<div class="dgwatch"><a href="${h(y.href)}" target="_blank" rel="${/metabot\.gg/i.test(String(y.href||''))?'noopener':'noopener noreferrer'}" title="${h((y.label?y.label+' · ':'')+'opens YouTube at '+mmss(y.t))}">▶ Watch this (${mmss(y.t)})</a>`+(who?`<span class="muted">${who}</span>`:'')+`</div>`;
  }

  // ---- pictures: only official images (data: URI or https) with a credit line ----
  const okSrc=s=>/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(String(s||''))||/^https:\/\//i.test(String(s||''));
  function credit(p){const c=h(p.credit||'');const u=safeUrl(p.page);return c?`<span class="dgcredit">Image: ${u?`<a href="${h(u)}" target="_blank" rel="${/metabot\.gg/i.test(String(u||''))?'noopener':'noopener noreferrer'}">${c}</a>`:c}</span>`:''}
  function portrait(b){const p=b.portrait; if(!p||!okSrc(p.src)) return '';
    return `<span class="dgpic"><img src="${h(p.src)}" alt="${h(p.alt||b.name||'Boss')}" width="56" height="56" loading="lazy" decoding="async">${p.label?`<span class="dgplabel">${h(p.label)}</span>`:''}${credit(p)}</span>`}
  function header(D){const p=D.header; if(!p||!okSrc(p.src)) return '';
    return `<figure class="dghead"><img src="${h(p.src)}" alt="${h(p.alt||D.name||'')}" loading="lazy" decoding="async">${credit(p)}</figure>`}

  // ---- modes (Exploration / Conquest) and Transcendence stages ----
  const MODES={exploration:'Exploration',conquest:'Conquest',both:'Exploration + Conquest'};
  const hasModes=D=>arr(D.modes).includes('conquest')&&arr(D.modes).includes('exploration');
  const stageList=D=>arr(D.stages).filter(s=>s&&Number(s.n)>=1&&Number(s.n)<=9).sort((a,b)=>a.n-b.n);
  const stN=x=>{const n=parseInt(x,10);return n>=1&&n<=9?n:1};
  // a stage-tagged item (cumulative): shown from its first stage on; "New in Stage n" on that stage
  const stAttr=n=>` data-st="${stN(n)}"`;
  const stBadges=n=>`<span class="dgnew">New in Stage ${stN(n)}</span>`+(stN(n)>1?`<span class="dgfrom">Stage ${stN(n)}+</span>`:'');
  const stLi=(x)=>{const o=x&&typeof x==='object'?x:{text:x};return `<li${stAttr(o.stage)}>${stBadges(o.stage)}${h(o.text)}</li>`};

  function mechHtml(m,ctx){
    const fig=figSvg(m.fig); ctx=ctx||{};
    const md=ctx.modes&&(m.mode==='exploration'||m.mode==='conquest')?m.mode:'';
    const st=ctx.stages?` data-st="${stN(m.stage)}"`:'';
    const tag=md==='exploration'?'<span class="dgmtag">Exploration only</span>':'';
    const badges=ctx.stages?stBadges(m.stage):'';
    return `<li${fig?' class="hasfig"':''}${md?` data-dgm="${md}"`:''}${st}>${fig}<div class="dgtxt"><span class="dgsee">${badges}${tag}${h(m.see)}</span><span class="arrow" aria-hidden="true">→</span><span class="dgdo">${h(m.do)}</span>${watchHtml(m.videoAt)}</div></li>`;
  }

  // the boss's "Conquest adds" block (shown in the Conquest view only)
  function cqHtml(b,mech,ctx){
    const add=mech.filter(m=>m.mode==='conquest'); const c=b.conquest||{};
    const notes=arr(c.notes);
    const body=(add.length?`<ul class="dgmech">${add.map(m=>mechHtml(m,ctx)).join('')}</ul>`:'')+
      (notes.length?`<ul class="plain small">${notes.map(x=>`<li>${h(x)}</li>`).join('')}</ul>`:'')+
      (!add.length&&!notes.length||c.documented===false?`<p class="small muted" style="margin:0">${h(c.note||'Conquest differences not documented yet.')}</p>`:'');
    return `<div class="dgcq" data-dgm="conquest"><h4><span class="tag gold">Conquest adds</span></h4>${body}</div>`;
  }

  function bossHtml(b,ctx){
    ctx=ctx||{};
    const mech=arr(b.mechanics).filter(m=>m&&(m.see||m.do));
    const base=ctx.modes?mech.filter(m=>m.mode!=='conquest'):mech;
    const roles=b.roles||{};
    const R=[['tank','Tank'],['healer','Healer'],['dps','DPS']].filter(([k])=>roles[k]);
    const anyFig=mech.some(m=>figSvg(m.fig));
    const more=(R.length?`<div class="mssec"><h4>Role notes</h4><div class="dgroles">${R.map(([k,l])=>`<div><span class="tag">${l}</span> ${h(roles[k])}</div>`).join('')}</div></div>`:'')+list('Common mistakes',b.mistakes);
    const moreT=[R.length&&'Role notes',arr(b.mistakes).length&&'common mistakes'].filter(Boolean).join(' and ').replace(/^./,c=>c.toUpperCase());
    const sn=ctx.stages?arr(b.stageNotes).filter(x=>x&&x.text):[];
    return `<section class="dgboss"><div class="dgbhead">${portrait(b)}<h4>${h(b.name||'Boss')}</h4></div>`+
      (b.enrage?`<p class="small" style="margin:0"><span class="tag gold">Enrage</span> ${h(b.enrage)}</p>`:'')+
      list('Phases',b.phases)+
      (base.length?`<div class="mssec"><h4>${ctx.modes?'Mechanics in both modes':'Mechanics'} · what you see → what to do</h4><ul class="dgmech">${base.map(m=>mechHtml(m,ctx)).join('')}</ul>`+
        (anyFig?`<p class="dgkey muted">Diagrams are drawn by this guide (top-down, not to scale): white = boss, yellow = marked player, blue = other players, red = damage, green dashes = where to stand.</p>`:'')+`</div>`:'')+
      (ctx.modes?cqHtml(b,mech,ctx):'')+
      (sn.length?`<div class="mssec"><h4>Stage changes for this boss</h4><ul class="plain small">${sn.map(stLi).join('')}</ul></div>`:'')+
      list('Wipes the group',b.wipe,'dgwipe')+
      (more?`<details class="dgmore"><summary>${moreT}</summary>${more}</details>`:'')+`</section>`;
  }

  function vidHtml(v){
    const u=safeUrl(v.url); if(!u) return '';
    const meta=[v.channel,v.date].filter(Boolean).map(h).join(' · ');
    const mt=MODES[v.mode]?`<span class="tag">${h(MODES[v.mode])}</span>`:'';
    const sg=arr(v.stages).map(stN); const stt=sg.length?`<span class="tag">Stage ${h(sg.join(', '))}</span>`:'';
    return `<li>${scopeTag(v.scope)}${mt}${stt} <a href="${h(u)}" target="_blank" rel="${/metabot\.gg/i.test(String(u||''))?'noopener':'noopener noreferrer'}">${h(v.title||u)}</a>`+
      (meta?` <span class="muted">${meta}</span>`:'')+(v.covers?`<div class="small muted">${h(v.covers)}</div>`:'')+`</li>`;
  }

  function srcHtml(D){
    const src=arr(D.sources).filter(s=>s&&(s.url||s.what));
    if(!src.length) return '';
    const li=s=>{const u=safeUrl(s.url);const lab=u?`<a href="${h(u)}" target="_blank" rel="${/metabot\.gg/i.test(String(u||''))?'noopener':'noopener noreferrer'}">${h(host(u)||u)}</a>`:'game client data';
      return `<li>${scopeTag(s.scope)} ${lab}${s.what?': '+h(s.what):''}</li>`};
    return `<details class="mssrc"><summary>Sources (${src.length})</summary><ul class="plain small">${src.map(li).join('')}</ul></details>`;
  }

  // short level chip: "Lv 45" / "Lv 35–45"; long texts stay in the facts grid only
  function lvChip(l){
    const t=String(l||''); const m=t.match(/\d+(\s*[–-]\s*\d+)?/); if(!m) return '';
    const n=Number(m[0].split(/[–-]/)[0]); if(!(n>0&&n<=99)) return '';
    return `<span class="tag">Lv ${h(m[0].replace(/\s*[–-]\s*/,'–'))}</span>`;
  }
  // remembered pick per dungeon: mode (exploration|conquest) or stage (1-4)
  function getPick(D){
    const id=String(D.id||'');
    if(hasModes(D)){let m='conquest';try{m=S.get('dgmode-'+id,'conquest')}catch(e){} return m==='exploration'?'exploration':'conquest'}
    const sl=stageList(D); if(sl.length){let n=sl[0].n;try{n=S.get('dgstage-'+id,n)}catch(e){} n=stN(n); return sl.some(s=>s.n===n)?n:sl[0].n}
    return null;
  }
  function modePicker(D){
    return `<div class="dgpick"><div class="seg" role="group" aria-label="Difficulty mode">`+
      ['exploration','conquest'].map(m=>`<button type="button" data-dgpick="${m}" aria-pressed="false">${MODES[m]}</button>`).join('')+`</div>`+
      `<p class="small muted">Conquest has every Exploration mechanic plus the gold “Conquest adds” blocks.</p></div>`;
  }
  function conquestFacts(D){
    const c=D.conquest; if(!c||typeof c!=='object') return '';
    const F=[['Level',c.level],['Item level',c.itemLevel],['Enrage',c.enrage]].filter(f=>f[1]);
    const notes=arr(c.notes);
    if(!F.length&&!notes.length) return '';
    return `<div class="dgcq" data-dgm="conquest"><h4><span class="tag gold">Conquest adds</span> whole dungeon</h4>`+
      (F.length?`<ul class="plain small">${F.map(([k,v])=>`<li><b class="dgk">${k}:</b> ${h(v)}</li>`).join('')}</ul>`:'')+
      (notes.length?`<ul class="plain small">${notes.map(x=>`<li>${h(x)}</li>`).join('')}</ul>`:'')+`</div>`;
  }
  function stagePanel(D){
    const sl=stageList(D); if(!sl.length) return '';
    const changes=sl.flatMap(s=>arr(s.changes).map(t=>({stage:s.n,text:t})));
    const per=sl.map(s=>{
      const sv=arr(D.videos).filter(v=>arr(v.stages).map(stN).includes(s.n)).map(vidHtml).filter(Boolean);
      return `<div class="dgstg" data-sp="${s.n}"><h4><span class="tag gold">Stage ${s.n}</span>${s.itemLevel?` item level ${h(s.itemLevel)}`:''}</h4>`+
        (s.documented===false?`<p class="small" style="margin:0"><b class="dgk">Not documented yet:</b> ${h(s.note||'no guide or video describes this stage yet.')}</p>`:(s.note?`<p class="small muted" style="margin:0">${h(s.note)}</p>`:''))+
        (arr(s.rewards).length?`<div><b class="small">Rewards at this stage</b><ul class="plain small">${arr(s.rewards).map(x=>`<li>${h(x)}</li>`).join('')}</ul></div>`:'')+
        (sv.length?`<div><b class="small">Videos of this stage</b><ul class="dgvids dgsv">${sv.join('')}</ul></div>`:'<p class="small muted" style="margin:0">No checked video of this stage yet.</p>')+`</div>`;
    }).join('');
    return `<div class="dgpick"><div class="seg" role="group" aria-label="Transcendence stage">`+
      sl.map(s=>`<button type="button" data-dgpick="${s.n}" aria-pressed="false">Stage ${s.n}</button>`).join('')+`</div>`+
      `<p class="small muted">Each stage keeps everything from the stages before it; gold “New in Stage” marks what it adds.</p></div>`+per+
      (changes.length?`<div class="mssec"><h4>Stage rules</h4><ul class="plain small">${changes.map(stLi).join('')}</ul></div>`:'');
  }
  // show/hide by the picked mode or stage (no re-draw)
  function applyView(c,D){
    if(!c||!D) return; const p=getPick(D); if(p==null) return;
    c.querySelectorAll('[data-dgpick]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dgpick===String(p))));
    if(hasModes(D)){c.dataset.mode=p; c.querySelectorAll('[data-dgm]').forEach(e=>{e.hidden=e.dataset.dgm!==p}); return}
    c.dataset.stage=p;
    c.querySelectorAll('[data-st]').forEach(e=>{const n=stN(e.dataset.st); e.hidden=n>p; e.classList.toggle('isnew',p>1&&n===p); e.classList.toggle('wasnew',n>1&&n<p)});
    c.querySelectorAll('[data-sp]').forEach(e=>{e.hidden=Number(e.dataset.sp)!==p});
  }

  function card(D){
    const id=String(D.id||''); const dn=done(id);
    const vids=arr(D.videos).map(vidHtml).filter(Boolean);
    const bosses=arr(D.bosses);
    const ctx={modes:hasModes(D),stages:stageList(D).length>0};
    const nClip=bosses.reduce((a,b)=>a+arr(b.mechanics).filter(m=>m&&ytAt(m.videoAt)).length,0);
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
      `<div class="dgbody">`+header(D)+
      (D.summary?`<p class="mssum" style="margin:0">${h(D.summary)}</p>`:'')+
      (F.length?`<details class="dgmore"><summary>Entry, resets and unlock</summary><dl class="dgfacts">${F.map(([k,v])=>`<div><dt>${k}</dt><dd>${h(v)}</dd></div>`).join('')}</dl></details>`:'')+
      (ctx.modes?modePicker(D)+conquestFacts(D):'')+
      list('Rewards',D.rewards)+
      (ctx.stages?stagePanel(D):'')+
      bosses.map(b=>bossHtml(b,ctx)).join('')+
      list('Tips and consumables',D.tips)+
      `<div class="mssec"><h4>Videos</h4>${vids.length?`<ul class="dgvids">${vids.join('')}</ul><p class="small muted" style="margin:0">Videos open on YouTube in a new tab.${nClip?' “▶ Watch this” buttons jump to the moment a mechanic is shown; the full video is worth watching too.':''} KR = Korean server: mechanics match, but numbers and gear may differ on Global.</p>`:'<p class="small muted" style="margin:0">No checked guide video yet.</p>'}</div>`+
      `<div class="msmeta" style="display:flex;flex-wrap:wrap;gap:6px">${conf}</div>`+
      srcHtml(D)+`</div></details>`;
  }

  // text used by the search box
  function hay(D){
    const b=arr(D.bosses).map(x=>[x.name,arr(x.phases).join(' '),arr(x.mechanics).map(m=>m&&(m.see+' '+m.do)).join(' '),arr(x.wipe).join(' '),
      arr((x.conquest||{}).notes).join(' '),arr(x.stageNotes).map(s=>s&&s.text).join(' ')].join(' ')).join(' ');
    const c=D.conquest&&typeof D.conquest==='object'?arr(D.conquest.notes).join(' '):'';
    const s=arr(D.stages).map(x=>x&&[arr(x.changes).join(' '),arr(x.rewards).join(' ')].join(' ')).join(' ');
    return [D.name,D.type,D.summary,arr(D.rewards).join(' '),b,arr(D.tips).join(' '),c,s].join(' ').toLowerCase();
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
      `<div class="small muted">Open a card for boss-by-boss mechanics (what you see → what to do), with a jump to the moment in a guide video where one shows it. Tick <b>Cleared</b> when you've done it. <span class="dgcount" id="dgstate"></span>${D.updated?` · updated ${h(D.updated)}`:''}</div></div>`+
      G.map(g=>`<section class="dggrp" data-dggrp="${h(g.id)}"><h3>${h(g.name)}</h3>${g.intro?`<p class="small muted">${h(g.intro)}</p>`:''}`+
        arr(g.dungeons).map(card).join('')+`</section>`).join('')+
      `<p class="box small muted" id="dgnone" hidden>Nothing matches your search.</p>`;
    // search text per card
    const all={}; G.forEach(g=>arr(g.dungeons).forEach(d=>{all[d.id]=d}));
    box.querySelectorAll('details.dgcard').forEach(c=>{const d=all[c.dataset.dg]; if(d){c.dataset.hay=hay(d); applyView(c,d)}});
    applyFilter(); counts();
  }

  function wire(){
    const box=document.getElementById('dungeonsbox'); if(!box||box.dataset.dgwired) return;
    box.dataset.dgwired=1;
    box.addEventListener('click',e=>{
      const b=e.target.closest&&e.target.closest('[data-dgseg]');
      if(b){st.grp=b.dataset.dgseg; try{S.set('dgfilter',st.grp)}catch(x){} applyFilter(); return}
      const pk=e.target.closest&&e.target.closest('[data-dgpick]');
      if(pk){const c=pk.closest('details.dgcard'); const id=c&&c.dataset.dg; const all=arr((data()||{}).groups).flatMap(g=>arr(g.dungeons)); const D=all.find(x=>String(x.id)===id); if(!D) return;
        const v=pk.dataset.dgpick;
        try{hasModes(D)?S.set('dgmode-'+id,v==='exploration'?'exploration':'conquest'):S.set('dgstage-'+id,stN(v))}catch(x){console.error(x)}
        applyView(c,D); return}
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
    if(tb){tb.hidden=false;tb.removeAttribute('data-mode');}
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
    const simTxt=g.gainPct!=null?`<p class="small msverdict"><b>Verdict:</b> worth about ${g.gainPct>0?'+':''}${h(Math.round(g.gainPct*10)/10)}% ${h(String(g.metric||'damage').replace(/^Damage$/,'damage'))} in our tests for the job it is built for.</p><details class="mstested"><summary>How we tested</summary><p class="small">Simulator (${h(g.metric||'damage')}): ${g.gainPct>0?'+':''}${h(g.gainPct)}%${g.min!=null?` (${h(g.min)}% to ${h(g.max)}%)`:''}. ${h(g.note||'')}</p></details>`:(g.note?`<details class="mstested"><summary>How we tested</summary><p class="small">${h(g.note)}</p></details>`:'');
    const src=(B.sources||[]).length?`<details class="mssrc"><summary>Sources (${B.sources.length})</summary><ul class="plain small">${B.sources.map(s=>`<li><span class="tag${String(s.scope).toUpperCase()==='KR'?'':' wind'}">${h(s.scope||'?')}</span> ${/^https?:/.test(s.url||'')?`<a href="${h(s.url)}" target="_blank" rel="${/metabot\.gg/i.test(String(s.url||''))?'noopener':'noopener noreferrer'}">${h((s.url.match(/^https?:\/\/(?:www\.)?([^/]+)/)||[])[1]||s.url)}</a>: `:''}${h(s.what)}</li>`).join('')}</ul></details>`:'';
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
    if(!L.length){host.innerHTML='<p class="muted">This class has one main build: see <a href="#rotation" data-goto="rotation">Rotation &amp; macro</a>. Setups for each game mode are below.</p>';return}
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

/* ---------- Community tools: ranked cards with category chips (data: global COMTOOLS = audit/r7/tools.json) ---------- */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const data=()=>(typeof COMTOOLS!=='undefined'&&COMTOOLS)||window.COMTOOLS||null;
  const safeUrl=u=>/^https:\/\//i.test(String(u||''))?String(u):'';
  const host=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return ''}};
  const st={cat:'all',web:false};
  try{st.cat=S.get('tlcat','all')||'all'; st.web=!!S.get('tlweb',false)}catch(e){}

  function addStyle(){
    if(document.getElementById('tlstyle')) return;
    const el=document.createElement('style'); el.id='tlstyle';
    el.textContent=[
      '#toolsbox{display:grid;gap:14px;min-width:0}',
      '#toolsbox .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
      '.tlbest{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px;margin:10px 0 0;padding:0;list-style:none}',
      '.tlbest li{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:9px 11px;display:grid;gap:3px;min-width:0}',
      '.tlbest .k{font:600 12px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}',
      '.tlbest b{color:var(--gold)}',
      '.tlchips{display:flex;flex-wrap:wrap;gap:6px}',
      '.tlchips button{background:var(--panel2);border:1px solid var(--line);color:var(--fg);font:600 13px var(--f-body);padding:6px 12px;border-radius:999px;cursor:pointer}',
      '.tlchips button[aria-pressed="true"]{background:var(--wind);border-color:var(--wind);color:var(--bg)}',
      '.tlweb{display:flex;gap:8px;align-items:center;font-size:14px;color:var(--muted);cursor:pointer;margin-top:4px}.tlweb input{accent-color:var(--wind);width:16px;height:16px}',
      '.tlgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;min-width:0}',
      '.tlcard{display:flex;flex-direction:column;padding:0;overflow:hidden;min-width:0}',
      '.tlcard.top{border-color:color-mix(in srgb,var(--gold) 55%,var(--line))}',
      '.tlimg{height:84px;display:flex;align-items:center;gap:14px;padding:0 16px;overflow:hidden;border-bottom:1px solid var(--line);background:linear-gradient(135deg,color-mix(in srgb,var(--wind) 14%,var(--panel2)),var(--panel2) 70%)}',
      '.tlimg span{font:400 44px var(--f-display);color:var(--gold);line-height:1;width:52px;height:52px;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--gold) 45%,transparent);border-radius:12px;background:var(--panel)}',
      '.tlimg svg{color:var(--wind);flex:0 0 auto}',
      '.tlimg em{font:600 12px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-style:normal}',
      '.tlbody{display:grid;gap:9px;padding:12px 14px 14px;min-width:0}',
      '.tlhead{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
      '.tlhead h3{margin:0 auto 0 0;font-size:18px;overflow-wrap:anywhere}',
      '.tlranks{display:flex;flex-wrap:wrap;gap:5px}',
      '.tlrank{font:600 12px var(--f-mono);padding:2px 7px;border-radius:999px;border:1px solid var(--line);color:var(--muted)}',
      '.tlrank.r1{color:var(--bg);background:var(--gold);border-color:var(--gold)}',
      '.tlfacts{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:0;font-size:14px}',
      '.tlfacts dt{font:600 12px var(--f-mono);letter-spacing:.05em;text-transform:uppercase;color:var(--muted);padding-top:3px}',
      '.tlfacts dd{margin:0;overflow-wrap:anywhere}',
      '.tlwarn{border-left:3px solid var(--warn);background:color-mix(in srgb,var(--warn) 9%,var(--panel));padding:8px 10px;border-radius:0 8px 8px 0;font-size:14px}',
      '.tlok{border-left:3px solid var(--wind);background:color-mix(in srgb,var(--wind) 7%,var(--panel));padding:6px 10px;border-radius:0 8px 8px 0;font-size:14px}',
      '.tlrate{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:13px;color:var(--muted)}',
      '.tlrate i{font-style:normal;color:var(--gold);letter-spacing:1px}',
      '.tlwhy{margin:0;padding-left:18px;font-size:14px;display:grid;gap:3px}',
      '.tlfoot{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:center;margin-top:auto;padding:0 14px 14px}',
      '.tlfoot a.go{font-weight:700}',
      '.tlfoot .cr{font-size:12px;color:var(--muted)}',
      /* meter comparison */
      '.mtbox{display:grid;gap:10px;min-width:0}',
      '.mtbox h3{margin:0}',
      '.mtframe{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--line);border-radius:10px;max-width:100%;overscroll-behavior-x:contain}',
      '.mttab{border-collapse:separate;border-spacing:0;font-size:13px;min-width:720px;width:100%}',
      '.mttab th,.mttab td{padding:6px 8px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle}',
      '.mttab thead th{font:600 12px var(--f-body);background:var(--panel2);position:sticky;top:0;white-space:nowrap}',
      '.mttab thead th small{display:block;font:500 12px var(--f-mono);color:var(--muted);letter-spacing:.03em}',
      '.mttab tbody th{text-align:left;font-weight:600;white-space:nowrap}',
      '.mttab .stk{position:sticky;left:0;z-index:1;background:var(--panel);border-right:1px solid var(--line);min-width:118px}',
      '.mttab thead .stk{z-index:2;background:var(--panel2)}',
      '.mttab tr.grp th{background:color-mix(in srgb,var(--wind) 8%,var(--panel));font:600 12px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}',
      '#toolsbox .mttab tbody th{font:600 13px/1.25 var(--f-body);text-transform:none;letter-spacing:0;white-space:normal;padding:6px 8px;width:122px;max-width:122px;color:var(--fg)}',
      '#toolsbox .mttab thead th{text-transform:none;letter-spacing:0;padding:7px 8px;line-height:1.2}',
      '#toolsbox .mttab tr.grp th{font:600 12px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}',
      '#toolsbox .mttab td{padding:6px 8px}',
      '@media (max-width:560px){#toolsbox .mttab tbody th{width:96px;max-width:96px;font-size:12px}#toolsbox .mttab .stk{min-width:96px}.mttab{font-size:12px}}',
      '.mttab tr:last-child>*{border-bottom:0}',
      '.mttab td.t{font-size:12px;color:var(--fg);min-width:112px;line-height:1.3}',
      '.mk{display:inline-block;min-width:1.4em;font-weight:700;cursor:help}',
      '.mk.y{color:var(--wind)}.mk.n{color:var(--muted);opacity:.7}.mk.q{color:var(--muted)}',
      '.mk sup{font:600 12px var(--f-mono);color:var(--gold);margin-left:1px}',
      '.mtlegend{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:var(--muted)}',
      '.mtsrc{font-size:13px}.mtsrc summary{cursor:pointer;font-weight:600}.mtsrc ul{margin:6px 0 0;padding-left:18px;display:grid;gap:4px}.mtsrc li{overflow-wrap:anywhere}',
      '.mtig{border-left:3px solid var(--wind);padding:6px 10px;font-size:14px;background:color-mix(in srgb,var(--wind) 6%,var(--panel));border-radius:0 8px 8px 0}',
      '.mtpic{margin:0;display:grid;gap:4px}',
      '.mtpic svg,.mtpic img{display:block;width:100%;height:auto;max-height:140px;border:1px solid var(--line);border-radius:8px;background:var(--panel2);object-fit:contain}',
      '.mtpic figcaption{font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:2px 8px;justify-content:space-between}',
      '.mtshows{display:flex;flex-wrap:wrap;gap:4px;align-items:center;font-size:12px}',
      '.mtshows b{font:600 12px var(--f-mono);letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin-right:2px}',
      '.mtshows span{border:1px solid color-mix(in srgb,var(--wind) 45%,var(--line));color:var(--fg);padding:1px 7px;border-radius:999px;background:color-mix(in srgb,var(--wind) 8%,var(--panel))}',
      '.mtshows span.pro{border-color:color-mix(in srgb,var(--gold) 55%,var(--line))}',
    ].join('\n');
    document.head.appendChild(el);
  }
  const dots=n=>{n=Math.max(0,Math.min(5,+n||0));return '<i aria-hidden="true">'+'●'.repeat(n)+'○'.repeat(5-n)+'</i> <span class="sr">'+n+'/5</span>'};
  // our own generic category icons (no third-party logos or images are used)
  const sv=p=>`<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const ICON={
    logs:sv('<path d="M3 20h18"/><path d="M6 16v-5"/><path d="M11 16V6"/><path d="M16 16v-8"/><path d="M20 16v-3"/>'),
    lookup:sv('<circle cx="10" cy="8" r="3.5"/><path d="M3.5 19c.8-3.4 3.4-5 6.5-5 1.6 0 3 .4 4.1 1.2"/><circle cx="17" cy="16" r="2.6"/><path d="m19 18 2 2"/>'),
    db:sv('<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6"/><path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/>'),
    builder:sv('<path d="m14 6 4 4"/><path d="M4 20l1-4L16 5l3 3L8 19z"/>'),
    map:sv('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14"/><path d="M15 6v14"/>'),
    market:sv('<path d="M4 7h16l-1.5 11h-13z"/><path d="M9 7a3 3 0 0 1 6 0"/>'),
    collect:sv('<path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.6 12 20 12 20z"/>'),
    timers:sv('<circle cx="12" cy="13" r="7"/><path d="M12 9v4l2.5 2"/><path d="M10 3h4"/>'),
    craft:sv('<path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-3-3z"/>'),
    apps:sv('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>'),
  };
  /* ---- "What each meter shows": data = COMTOOLS.meters (cols, rows, pics) ---- */
  const MK={y:['✓','y','Yes'],n:['✗','n','No'],'?':['?','q','Not known']};
  const cellTip=(c,col,row)=>[col.name+' · '+row.label+': '+(MK[c.v]?MK[c.v][2]:(c.t||'')),c.tag?'('+c.tag+')':'',c.n||'',c.s?'Source: '+host(c.s):''].filter(Boolean).join(' ');
  function mcell(c,col,row){
    c=c||{v:'?'};
    if(row.kind==='text') return `<td class="t" title="${h(cellTip(c,col,row))}">${h(c.t||'?')}</td>`;
    const m=MK[c.v]||MK['?'];
    return `<td><span class="mk ${m[1]}" title="${h(cellTip(c,col,row))}" aria-label="${h(m[2]+(c.tag?' ('+c.tag+')':'')+(c.n?': '+c.n:''))}" role="img">${m[0]}${c.tag?`<sup>${h(c.tag)}</sup>`:''}</span></td>`;
  }
  function meterTable(M){
    const cols=M.cols||[], rows=M.rows||[];
    let body='', grp=null;
    rows.forEach(r=>{
      if(r.group&&r.group!==grp){grp=r.group; body+=`<tr class="grp"><th class="stk" scope="rowgroup">${h(grp)}</th><td colspan="${cols.length}"></td></tr>`}
      body+=`<tr><th class="stk" scope="row">${h(r.label)}</th>${cols.map(c=>mcell((r.cells||{})[c.id],c,r)).join('')}</tr>`;
    });
    const srcs=rows.map(r=>{
      const seen={}, links=[];
      cols.forEach(c=>{const x=(r.cells||{})[c.id]; const u=x&&safeUrl(x.s); if(u&&!seen[u]){seen[u]=1; links.push(`<a href="${h(u)}" target="_blank" rel="${/metabot\.gg/i.test(String(u||''))?'noopener':'noopener noreferrer'}">${h(c.short||c.name)}</a>`)} else if(u) links.push(h(c.short||c.name)+' (same page)')});
      return links.length?`<li><b>${h(r.label)}:</b> ${links.join(', ')}</li>`:'';
    }).join('');
    const ig=M.inGame?`<div class="mtig"><b>${h(M.inGame.title||'In-game Combat Analysis')}:</b> ${h(M.inGame.text||'')}${safeUrl(M.inGame.s)?` <a href="${h(safeUrl(M.inGame.s))}" target="_blank" rel="${/metabot\.gg/i.test(String(M.inGame.s||''))?'noopener':'noopener noreferrer'}">Source ↗</a>`:''}</div>`:'';
    return `<section class="box mtbox" id="mtcompare" aria-labelledby="mttitle"><h3 id="mttitle">${h(M.title||'What each meter shows')}</h3>`+
      (M.intro?`<p class="small" style="margin:0">${h(M.intro)}</p>`:'')+
      `<div class="mtlegend"><span><span class="mk y">✓</span> shows it</span><span><span class="mk n">✗</span> does not</span><span><span class="mk q">?</span> not stated by the tool or reviews</span>${rows.some(r=>Object.values(r.cells||{}).some(c=>c&&c.tag))?'<span><span class="mk y">✓<sup>Pro</sup></span> paid tier only</span>':''}<span>Hover or long-press a mark for the note.</span></div>`+
      `<div class="mtframe" tabindex="0" role="region" aria-label="Meter comparison table, scroll sideways"><table class="mttab"><thead><tr><th class="stk" scope="col">Feature</th>${cols.map(c=>`<th scope="col">${h(c.name)}${c.sub?`<small>${h(c.sub)}</small>`:''}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`+
      ig+
      (srcs?`<details class="mtsrc"><summary>Sources for each row</summary><ul>${srcs}</ul>${M.checked?`<p class="small muted" style="margin:6px 0 0">Checked ${h(M.checked)}. ${h(M.method||'')}</p>`:''}</details>`:'')+
      `</section>`;
  }
  // our own generic layout sketches (not screenshots of any tool)
  const IL={
    bars:(x,y)=>{let s=`<rect x="${x}" y="${y}" width="110" height="78" rx="6" style="fill:var(--panel);stroke:var(--line)"/><rect x="${x}" y="${y}" width="110" height="12" rx="6" style="fill:var(--line)"/><rect x="${x+6}" y="${y+4}" width="34" height="4" rx="2" style="fill:var(--muted)"/>`;
      [96,78,64,50,38].forEach((w,i)=>{const yy=y+18+i*11.5; s+=`<rect x="${x+6}" y="${yy}" width="${w}" height="8" rx="2" style="fill:var(--wind);opacity:${(1-i*.14).toFixed(2)}"/><rect x="${x+9}" y="${yy+2.5}" width="18" height="3" rx="1.5" style="fill:var(--bg);opacity:.75"/><rect x="${x+82}" y="${yy+2.5}" width="18" height="3" rx="1.5" style="fill:var(--fg);opacity:.55"/>`}); return s},
    self:(x,y)=>{let s=`<rect x="${x}" y="${y}" width="110" height="78" rx="6" style="fill:var(--panel);stroke:var(--line)"/><rect x="${x+8}" y="${y+8}" width="40" height="5" rx="2" style="fill:var(--muted)"/><rect x="${x+8}" y="${y+18}" width="56" height="10" rx="2" style="fill:var(--gold)"/>`;
      [0,1,2,3].forEach(i=>{const yy=y+36+i*10; s+=`<rect x="${x+8}" y="${yy}" width="7" height="7" rx="1.5" style="fill:var(--line)"/><rect x="${x+19}" y="${yy+1.5}" width="${70-i*14}" height="4" rx="2" style="fill:var(--wind);opacity:.8"/>`}); return s},
    skills:(x,y)=>{let s=`<rect x="${x}" y="${y}" width="110" height="78" rx="6" style="fill:var(--panel);stroke:var(--line)"/><rect x="${x}" y="${y}" width="110" height="12" rx="6" style="fill:var(--line)"/>`;
      [0,1,2,3,4].forEach(i=>{const yy=y+17+i*12; s+=`<rect x="${x+6}" y="${yy}" width="8" height="8" rx="1.5" style="fill:var(--gold);opacity:.8"/><rect x="${x+18}" y="${yy+2}" width="30" height="4" rx="2" style="fill:var(--fg);opacity:.5"/>`+[54,70,86].map(cx=>`<rect x="${x+cx}" y="${yy+2}" width="12" height="4" rx="2" style="fill:var(--muted);opacity:.7"/>`).join('')}); return s},
    timeline:(x,y)=>`<rect x="${x}" y="${y}" width="110" height="78" rx="6" style="fill:var(--panel);stroke:var(--line)"/><path d="M${x+8} ${y+66}H${x+102}M${x+8} ${y+10}V${y+66}" style="stroke:var(--line);fill:none"/><path d="M${x+10} ${y+58}L${x+24} ${y+40}L${x+38} ${y+46}L${x+52} ${y+24}L${x+66} ${y+32}L${x+80} ${y+18}L${x+100} ${y+26}" style="stroke:var(--wind);stroke-width:2;fill:none"/><path d="M${x+10} ${y+62}L${x+30} ${y+56}L${x+50} ${y+58}L${x+70} ${y+48}L${x+100} ${y+52}" style="stroke:var(--gold);stroke-width:1.5;fill:none;opacity:.8"/>`+[20,46,72].map(cx=>`<rect x="${x+cx}" y="${y+70}" width="14" height="4" rx="1" style="fill:var(--wind);opacity:.45"/>`).join(''),
    ranks:(x,y)=>{let s=`<rect x="${x}" y="${y}" width="110" height="78" rx="6" style="fill:var(--panel);stroke:var(--line)"/><circle cx="${x+7}" cy="${y+6}" r="1.6" style="fill:var(--muted)"/><circle cx="${x+12}" cy="${y+6}" r="1.6" style="fill:var(--muted)"/><path d="M${x} ${y+12}H${x+110}" style="stroke:var(--line)"/>`;
      [0,1,2,3,4].forEach(i=>{const yy=y+17+i*12; s+=`<rect x="${x+6}" y="${yy}" width="8" height="8" rx="4" style="fill:${i===0?'var(--gold)':'var(--line)'}"/><rect x="${x+18}" y="${yy+2}" width="34" height="4" rx="2" style="fill:var(--fg);opacity:.5"/><rect x="${x+58}" y="${yy+1}" width="${44-i*6}" height="6" rx="2" style="fill:var(--wind);opacity:.7"/>`}); return s},
  };
  const ILNAME={bars:'overlay with a bar per player',self:'personal panel with your own numbers',skills:'per-skill table',timeline:'timeline graph',ranks:'log website with rankings'};
  function meterPic(p,name){
    if(!p) return '';
    const see=safeUrl(p.see), seeLink=see?`<a href="${h(see)}" target="_blank" rel="${/metabot\.gg/i.test(String(see||''))?'noopener':'noopener noreferrer'}">${h(p.seeText||('See screenshots on '+host(see)))} ↗</a>`:'';
    if(p.kind==='img'&&/^data:image\/webp;base64,/.test(p.src||'')){
      const cl=safeUrl(p.link);
      return `<figure class="mtpic"><img src="${h(p.src)}" alt="${h(p.alt||('Screenshot of '+name))}" loading="lazy" width="${+p.w||320}" height="${+p.h||180}"><figcaption><span>${cl?`<a href="${h(cl)}" target="_blank" rel="${/metabot\.gg/i.test(String(cl||''))?'noopener':'noopener noreferrer'}">${h(p.credit||'Screenshot: '+name)}</a>`:h(p.credit||'Screenshot: '+name)}${p.basis?' · '+h(p.basis):''}</span>${seeLink}</figcaption></figure>`;
    }
    const ls=(p.layout||[]).filter(k=>IL[k]).slice(0,2); if(!ls.length) return '';
    const W=ls.length*110+(ls.length-1)*10+12;
    const desc=ls.map(k=>ILNAME[k]).join(' + ');
    return `<figure class="mtpic"><svg viewBox="0 0 ${W} 90" role="img" aria-label="${h('Illustration, not a real screenshot: '+desc)}"><title>${h('Illustration of the layout type ('+desc+'), not a real screenshot of '+name)}</title>${ls.map((k,i)=>IL[k](6+i*120,6)).join('')}</svg><figcaption><span>Illustration, not a real screenshot: ${h(desc)}</span>${seeLink}</figcaption></figure>`;
  }
  function meterBits(t,D){
    const M=D.meters; if(!M||!(st.cat==='all'||st.cat==='logs')) return '';
    const col=(M.cols||[]).find(c=>c.tool===t.id); if(!col) return '';
    const chips=(M.rows||[]).filter(r=>r.chip).map(r=>{const c=(r.cells||{})[col.id]; return c&&c.v==='y'?`<span${c.tag?' class="pro" title="'+h(c.tag)+' only"':''}>${h(r.chip)}${c.tag?' ('+h(c.tag)+')':''}</span>`:''}).join('');
    return meterPic((M.pics||{})[col.id],col.name)+(chips?`<div class="mtshows"><b>${h(col.chipLabel||'Shows')}:</b>${chips}</div>`:'');
  }
  const INST={none:['Website only','tlok','Nothing to install.'],overlay:['Optional overlay app','tlok',''],packet:['Needs a program that reads game packets','tlwarn','']};

  function card(t,D){
    const cats=D.categories, cn={}; cats.forEach(c=>cn[c.id]=c.name);
    const url=safeUrl(t.url), tile=t.tile||{};
    const letter=String(tile.letter||(t.name||'?').replace(/^[^A-Za-z0-9]+/,'').charAt(0)||'?').toUpperCase().slice(0,1);
    const pic=`<div class="tlimg tile ic-${h(tile.icon||'db')}" aria-hidden="true"><span>${h(letter)}</span>${ICON[tile.icon]||ICON.db}<em>${h(cn[tile.icon]||'')}</em></div>`;
    const ranks=Object.entries(t.cats||{}).sort((a,b)=>a[1]-b[1]).map(([c,r])=>`<span class="tlrank${r===1?' r1':''}" title="Rank ${r} in ${h(cn[c]||c)}">#${r} ${h(cn[c]||c)}</span>`).join('');
    const inst=INST[t.install]||INST.none;
    let instHtml='';
    if(t.install==='packet') instHtml=`<div class="tlwarn"><b>⚠ ${h(inst[0])}.</b> ${h(t.program||'')}. NCSoft has banned and blocked third-party programs; see <a href="#sys-bans" data-goto="sys-bans">Ban risks</a>.${t.note?' '+h(t.note):''}</div>`;
    else if(t.install==='overlay') instHtml=`<div class="tlok"><b>${h(inst[0])}:</b> ${h(t.program||'')}. Still a third-party program: <a href="#sys-bans" data-goto="sys-bans">ban risks</a>. The website needs nothing.</div>`;
    else instHtml=`<div class="tlok"><b>Website only.</b> ${h(t.program||inst[2])}${t.install==='none'&&/reads network/.test(t.program||'')?' NCSoft has banned and blocked third-party programs; see <a href="#sys-bans" data-goto="sys-bans">Ban risks</a>.':''}</div>`;
    const why=Object.entries(t.reason||{}).filter(([c])=>st.cat==='all'||c===st.cat).map(([c,r])=>`<li><b>${h(cn[c]||c)}:</b> ${h(r)}</li>`).join('');
    const top=st.cat!=='all'&&(t.cats||{})[st.cat]===1;
    return `<article class="box tlcard${top?' top':''}" data-tl="${h(t.id)}" data-cats="${h(Object.keys(t.cats||{}).join(' '))}" data-inst="${h(t.install)}">${pic}<div class="tlbody">`+
      `<div class="tlhead"><h3>${h(t.name)}</h3><span class="tag${t.global?' wind':' t-bad'}">${t.global?'Global':'KR / TW'}</span></div>`+
      `<div class="tlranks">${ranks}</div>`+
      `<p class="small" style="margin:0">${h(t.what)}</p>`+
      meterBits(t,D)+
      `<dl class="tlfacts"><dt>Region</dt><dd>${h(t.region)}</dd><dt>Cost</dt><dd>${h(t.cost)}</dd><dt>Activity</dt><dd>${h(t.activity)}</dd></dl>`+
      instHtml+
      (why?`<ul class="tlwhy">${why}</ul>`:'')+
      `<div class="tlrate"><span>Useful ${dots(t.rate&&t.rate.use)}</span><span>Fresh ${dots(t.rate&&t.rate.fresh)}</span><span>Easy ${dots(t.rate&&t.rate.ease)}</span></div>`+
      `</div><div class="tlfoot">${url?`<a class="go" href="${h(url)}" target="_blank" rel="${/metabot\.gg/i.test(String(url||''))?'noopener':'noopener noreferrer'}">Open ${h(host(url))} ↗</a>`:''}<span class="cr">checked ${h(t.checked||D.updated||'')}</span></div></article>`;
  }

  function render(){
    const box=document.getElementById('toolsbox'); if(!box) return;
    const D=data();
    if(!D||!Array.isArray(D.tools)){box.innerHTML='<p class="box muted">Community tools could not load.</p>';return}
    addStyle();
    const cats=D.categories||[];
    if(st.cat!=='all'&&!cats.some(c=>c.id===st.cat)) st.cat='all';
    const byId={}; D.tools.forEach(t=>byId[t.id]=t);
    const best=cats.filter(c=>c.best&&c.top&&byId[c.top]).map(c=>{const t=byId[c.top];return `<li><span class="k">${h(c.best)}</span><span><b>${h(t.name)}</b></span><span class="small muted">${h((t.reason||{})[c.id]||'')}</span></li>`}).join('');
    let list=D.tools.filter(t=>(st.cat==='all'||(t.cats||{})[st.cat])&&(!st.web||t.install==='none'));
    const minr=t=>Math.min(...Object.values(t.cats||{9:9}));
    list.sort(st.cat==='all'?(a,b)=>minr(a)-minr(b)||(b.rate.use+b.rate.fresh+b.rate.ease)-(a.rate.use+a.rate.fresh+a.rate.ease)||a.name.localeCompare(b.name):(a,b)=>a.cats[st.cat]-b.cats[st.cat]);
    const chips=`<div class="tlchips" role="group" aria-label="Filter tools by category"><button type="button" data-tlcat="all" aria-pressed="${st.cat==='all'}">All (${D.tools.length})</button>`+
      cats.map(c=>{const n=D.tools.filter(t=>(t.cats||{})[c.id]).length;return `<button type="button" data-tlcat="${h(c.id)}" aria-pressed="${st.cat===c.id}">${h(c.name)} (${n})</button>`}).join('')+`</div>`;
    box.innerHTML=
      `<div class="callout"><b>Read this before installing anything.</b> ${h(D.warning)} <a href="#sys-bans" data-goto="sys-bans">Ban risks →</a></div>`+
      `<div class="box"><h3 style="margin:0">Best in each category</h3><ul class="tlbest">${best}</ul><p class="small muted" style="margin:10px 0 0">${h(D.scale||'')}</p></div>`+
      `<div class="box" style="display:grid;gap:8px">${chips}<label class="tlweb"><input type="checkbox" id="tlwebonly" ${st.web?'checked':''}> Websites only (hide anything that needs a program)</label><div class="small muted" id="tlstate">${list.length} shown · ${h(D.intro||'')}</div></div>`+
      (st.cat==='logs'&&D.meters&&(D.meters.cols||[]).length?meterTable(D.meters):'')+
      (list.length?`<div class="tlgrid">${list.map(t=>card(t,D)).join('')}</div>`:'<p class="box muted">No tool matches this filter.</p>')+
      `<div class="box small"><p style="margin:0 0 6px"><b>In-game first:</b> ${h(D.inGame||'')}</p><p class="muted" style="margin:0">${h(D.notListed||'')} Site names are their owners' trademarks; we show only our own icons and plain links, and copy no data from these sites.</p></div>`;
  }
  function wire(){
    const box=document.getElementById('toolsbox'); if(!box||box.dataset.tlwired) return; box.dataset.tlwired=1;
    box.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-tlcat]'); if(!b) return; st.cat=b.dataset.tlcat; try{S.set('tlcat',st.cat)}catch(x){} render()});
    box.addEventListener('change',e=>{if(e.target&&e.target.id==='tlwebonly'){st.web=!!e.target.checked; try{S.set('tlweb',st.web)}catch(x){} render()}});
  }
  window.renderTools=function(){render(); wire()};
  try{window.renderTools()}catch(e){console.error(e)}
})();

/* ---------- Player planners (data: global PLANNER = audit/r7/planner.json) ----------
   Four self-contained tools, each drawn into its own mount div if that div exists:
     #kinaplanbox  Weekly Kina planner + session log      (storage: S.gget/gset 'kplan', 'klog'; account-wide)
     #dmgcheckbox  Check your damage (60 s training dummy) (storage: S.get/set 'dmgchk'; per class)
     #readybox     "Am I ready?" dungeon table             (storage: S.gget/gset 'rdy'; reads My character via chGet/chModel)
     #shoplistbox  Weekly shopping list                    (storage: S.gget/gset 'shopw'; weekly ticks reset Wed 07:00 UTC)
   window.renderPlanner() redraws all four (call it from applyStore after an account sync). */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const D=()=>(typeof PLANNER!=='undefined'&&PLANNER)||window.PLANNER||null;
  const el=id=>document.getElementById(id);
  const fmt=n=>(n==null||!isFinite(n))?'—':Math.round(n).toLocaleString('en-US');
  const short=n=>{if(n==null||!isFinite(n))return '—';const a=Math.abs(n);return a>=1e6?(n/1e6).toFixed(a>=1e7?1:2).replace(/\.?0+$/,'')+'M':a>=1e4?Math.round(n/1e3)+'k':fmt(n)};
  const num=(v,d)=>{const x=parseFloat(String(v==null?'':v).replace(/[, _]/g,''));return isFinite(x)?x:d};
  const gg=(k,d)=>{try{const v=S.gget(k,d);return v==null?d:v}catch(e){return d}};
  const gs=(k,v)=>{try{S.gset(k,v)}catch(e){}};
  const lg=(k,d)=>{try{const v=S.get(k,d);return v==null?d:v}catch(e){return d}};
  const ls=(k,v)=>{try{S.set(k,v)}catch(e){}};
  const UNC='<span class="tag" title="Not confirmed by an official source or our own test">Unconfirmed</span>';
  const ext=(u,t)=>/^https:\/\//.test(String(u||''))?`<a href="${h(u)}" target="_blank" rel="noopener">${h(t)} ↗</a>`:h(t);
  const credit=key=>{const c=(D().credits||{})[key];return c?ext(c.url,c.name):''};
  const icon=n=>{try{return typeof ic==='function'?ic(n,'sm'):''}catch(e){return ''}};
  const slug=()=>{try{return SLUG}catch(e){return 'ranger'}};
  const clsName=()=>{try{return ALL[slug()].cls}catch(e){return slug()}};
  const DAY=864e5, WEEK=7*DAY;
  function weekId(t){const a=D().reset.anchor;return Math.floor(((t||Date.now())-a)/WEEK)}
  function nextReset(t){const a=D().reset.anchor;t=t||Date.now();return a+(weekId(t)+1)*WEEK}
  function left(ms){if(ms<=0)return 'now';const d=Math.floor(ms/DAY),hh=Math.floor(ms%DAY/36e5),m=Math.floor(ms%36e5/6e4);return d?`${d}d ${hh}h`:hh?`${hh}h ${m}m`:`${m}m`}
  // redraw a box and put focus back on the same control (checkboxes/selects keep focus after a change)
  function keepFocus(box,draw){
    const a=document.activeElement; let sel=null;
    if(a&&box.contains(a)){ if(a.id) sel='#'+a.id; else { const k=Object.keys(a.dataset||{})[0]; if(k){const attr='data-'+k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());sel=`[${attr}="${String(a.dataset[k]).replace(/["\\]/g,'\\$&')}"]`} } }
    draw(); if(sel){try{const n=box.querySelector(sel);if(n&&n.focus)n.focus()}catch(e){}}
  }
  const dayDiff=iso=>Math.ceil((Date.parse(iso+'T07:00:00Z')-Date.now())/DAY);
  const mmss=s=>s==null?'—':`${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
  // My character (one global slot, see char_fn.js); returns {il,cp,name,cls} or null
  function myChar(){
    try{
      if(typeof chGet!=='function') return null; const rec=chGet(); if(!rec) return null;
      let M=null; try{if(typeof chModel==='function') M=chModel(rec)}catch(e){M=null}
      if(!M){const p=((rec.official||{}).info||{}).profile||{};const st={};(((rec.official||{}).info||{}).stat||{}).statList&&rec.official.info.stat.statList.forEach(s=>st[s.type]=Number(s.value)||0);M={name:p.characterName,cls:p.className,cp:p.combatPower,il:st.ItemLevel}}
      const il=num(M.il,null),cp=num(M.cp,null); if(il==null&&cp==null) return null;
      return {il,cp,name:M.name||'',cls:M.cls||''};
    }catch(e){return null}
  }
  function addStyle(){
    if(el('plstyle')) return;
    const s=document.createElement('style'); s.id='plstyle';
    s.textContent=[
      '.pl{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;min-width:0}.pl>*,.pl .box>*{min-width:0}.pl .box{grid-template-columns:minmax(0,1fr)}.pl label{max-width:100%;min-width:0;flex-wrap:wrap}.pl select{max-width:100%;min-width:0}',
      '.pl .row{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}',
      '.pl input[type=number],.pl input[type=text],.pl select{background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:6px 8px;font:500 14px var(--f-body);max-width:100%}',
      '.pl input[type=number]{width:7.5em}.pl input.sm{width:4.5em}',
      '.pl input[type=checkbox]{accent-color:var(--wind);width:16px;height:16px}',
      '.pl label{display:inline-flex;gap:6px;align-items:center}',
      '.pl table{width:100%}.pl td .small{display:block}',
      '.pl .kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0;padding:0;list-style:none}',
      '.pl .kpi li{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:8px 10px;display:grid;gap:2px}',
      '.pl .kpi .k{font:600 12px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}',
      '.pl .kpi b{font-size:20px;color:var(--gold)}',
      '.pl tr.off td{opacity:.55}',
      '.pl .bar{height:10px;border-radius:999px;background:var(--panel2);border:1px solid var(--line);overflow:hidden}',
      '.pl .bar i{display:block;height:100%;background:var(--wind)}',
      '.pl .bad{color:var(--warn)}.pl .good{color:var(--wind)}',
      '.pl details.shop{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px 12px}',
      '.pl details.shop>summary{cursor:pointer;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;font-weight:700}',
      '.pl details.shop>summary .small{font-weight:400}',
      '.pl .nm td.y{background:color-mix(in srgb,var(--wind) 22%,transparent)}',
      '.pl s{opacity:.7}',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* =============== 1. Weekly Kina planner + session log =============== */
  function kState(){const s=gg('kplan',{})||{};return Object.assign({chars:1,member:false,on:{},kina:{},units:{},cc:{},mins:{},sp:{}},s)}
  function kRow(a,st){
    const on=st.on[a.id]!=null?!!st.on[a.id]:!!a.on;
    const kina=a.editKina?num(st.kina[a.id],a.kina):a.kina;
    const units=a.editUnits?num(st.units[a.id],a.units):a.units;
    const cc=a.scope==='char'?Math.max(0,Math.min(st.chars,num(st.cc[a.id],st.chars))):1;
    const mins=num(st.mins[a.id],a.mins);
    const per=a.per==='day'?7:1;
    const wk=kina==null?null:kina*units*per*cc;
    const mw=(a.mu?mins*units:mins)*per*cc;
    return {on,kina,units,cc,mins,wk,mw,ap:(a.ap||0)*units*per*cc};
  }
  function kTotals(st){
    const K=D().kina; let inc=0,bound=0,unb=0,mins=0,ap=0,unknown=[],spend=0;
    K.income.forEach(a=>{const r=kRow(a,st);if(!r.on)return;mins+=r.mw;ap+=r.ap;if(r.wk==null){unknown.push(a.n);return}inc+=r.wk;if(a.bound)bound+=r.wk;else unb+=r.wk});
    K.spend.forEach(a=>{const r=kSpend(a,st);if(r.on&&r.ok)spend+=r.wk});
    return {inc,bound,unb,mins,ap,unknown,spend,net:inc-spend,perHour:mins>0?inc/mins*60:null};
  }
  function kSpend(a,st){
    const on=!!st.sp[a.id]; const units=num(st.units['sp_'+a.id],a.units);
    const cc=a.scope==='char'?Math.max(0,Math.min(st.chars,num(st.cc['sp_'+a.id],st.chars))):1;
    const ended=a.until&&dayDiff(a.until)<0; const ok=(!a.member||st.member)&&!ended;
    return {on,units,cc,wk:a.kina*units*cc,ok,ended};
  }
  function renderKina(){
    const box=el('kinaplanbox'); if(!box) return; const P=D();
    if(!P||!P.kina){box.innerHTML='<p class="box muted">The Kina planner could not load.</p>';return}
    addStyle(); const K=P.kina, st=kState();
    const incRows=K.income.map(a=>{const r=kRow(a,st);
      return `<tr class="${r.on?'':'off'}" data-kid="${h(a.id)}"><td><input type="checkbox" data-kon="${h(a.id)}" ${r.on?'checked':''} aria-label="I do ${h(a.n)}"></td>`+
      `<td><b>${h(a.n)}</b> ${a.unconf?UNC:''}<span class="small muted">${h(a.d)}</span></td>`+
      `<td>${a.scope==='server'?'Server':'Per character'}<span class="small muted">${a.per==='day'?'every day':'every week'}</span></td>`+
      `<td class="num">${a.editKina?`<input type="number" min="0" step="1000" data-kkina="${h(a.id)}" value="${h(r.kina)}" aria-label="Kina per ${a.per} for ${h(a.n)}">`:(a.kina==null?'<span class="muted">not known</span>':fmt(a.kina)+(a.units>1?` <span class="small muted">× ${a.units}</span>`:''))}</td>`+
      `<td class="num">${a.editUnits?`<input class="sm" type="number" min="0" max="99" data-kunits="${h(a.id)}" value="${h(r.units)}" aria-label="Runs a week">`:'—'}</td>`+
      `<td class="num">${a.scope==='char'?`<input class="sm" type="number" min="0" max="${st.chars}" data-kcc="${h(a.id)}" value="${h(r.cc)}" aria-label="Characters doing ${h(a.n)}">`:'—'}</td>`+
      `<td class="num"><input class="sm" type="number" min="0" step="5" data-kmins="${h(a.id)}" value="${h(r.mins)}" aria-label="Minutes"><span class="small muted">${a.mu?'min each':a.per==='day'?'min a day':'min a week'}${a.minsSrc?'':' (guess)'}</span></td>`+
      `<td class="num" data-kwk="${h(a.id)}">${r.wk==null?'?':fmt(r.wk)}</td></tr>`}).join('');
    const spRows=K.spend.map(a=>{const r=kSpend(a,st);
      return `<tr class="${r.on&&r.ok?'':'off'}"><td><input type="checkbox" data-kspon="${h(a.id)}" ${r.on?'checked':''} ${r.ok?'':'disabled'} aria-label="I buy ${h(a.n)}"></td>`+
      `<td><b>${r.ended?'<s>'+h(a.n)+'</s>':h(a.n)}</b>${a.member?' <span class="tag wind">Membership</span>':''}${r.ended?' <span class="tag">Ended</span>':''}<span class="small muted">${h(a.d)}</span></td>`+
      `<td class="num">${fmt(a.kina)}</td><td class="num"><input class="sm" type="number" min="0" max="99" data-kspu="${h(a.id)}" value="${h(r.units)}" aria-label="How many a week"></td>`+
      `<td class="num">${a.scope==='char'?`<input class="sm" type="number" min="0" max="${st.chars}" data-kspcc="${h(a.id)}" value="${h(r.cc)}" aria-label="Characters">`:'Server'}</td>`+
      `<td class="num" data-kspwk="${h(a.id)}">${fmt(r.wk)}</td></tr>`}).join('');
    const once=K.once.map(a=>`<li><span class="k">${h(a.scope==='server'?'Once per server':'Once per character')}</span><b>${short(a.kina)}</b><span class="small muted">${h(a.n)}. ${h(a.d)}</span></li>`).join('');
    box.innerHTML=`<div class="pl">
      <div class="box" style="display:grid;gap:10px"><h3 style="margin:0">${icon('Kina')}Weekly Kina planner</h3>
        <p class="small muted" style="margin:0">${h(K.note)}</p>
        <div class="row"><label>Characters on this server <input class="sm" type="number" min="1" max="8" id="kpchars" value="${st.chars}"></label>
        <label><input type="checkbox" id="kpmember" ${st.member?'checked':''}> Special Quai Membership</label></div>
        <div id="kpsum"></div></div>
      <div class="box"><h3 style="margin:0 0 6px">What you run</h3><div class="tablewrap"><table><thead><tr><th></th><th>Activity</th><th>Who / how often</th><th class="num">Kina each</th><th class="num">Runs a week</th><th class="num">Characters</th><th class="num">Time</th><th class="num">Kina a week</th></tr></thead><tbody>${incRows}</tbody></table></div></div>
      <div class="box"><h3 style="margin:0 0 6px">Weekly Kina spending (optional)</h3><p class="small muted" style="margin:0 0 6px">${h(K.member)}</p><div class="tablewrap"><table><thead><tr><th></th><th>Buy</th><th class="num">Kina each</th><th class="num">How many</th><th class="num">Characters</th><th class="num">Kina a week</th></tr></thead><tbody>${spRows}</tbody></table></div></div>
      <div class="box"><h3 style="margin:0 0 6px">One-time Kina (new characters)</h3><ul class="kpi">${once}</ul></div>
      <div class="box" id="klogbox"></div>
      <p class="small muted" style="margin:0">Sources: our Farming and Daily &amp; weekly tabs; ${(K.src||[]).map(credit).join(', ')}.</p></div>`;
    kSum(); renderLog();
  }
  function kSum(){
    const sb=el('kpsum'); if(!sb) return; const st=kState(), t=kTotals(st);
    D().kina.income.forEach(a=>{const c=document.querySelector(`[data-kwk="${a.id}"]`);if(c){const r=kRow(a,st);c.textContent=r.wk==null?'?':fmt(r.wk)}});
    D().kina.spend.forEach(a=>{const c=document.querySelector(`[data-kspwk="${a.id}"]`);if(c)c.textContent=fmt(kSpend(a,st).wk)});
    sb.innerHTML=`<ul class="kpi">
      <li><span class="k">Kina a week</span><b>${short(t.inc)}</b><span class="small muted">${fmt(t.bound)} bound · ${fmt(t.unb)} unbound</span></li>
      <li><span class="k">Kina an hour</span><b>${t.perHour==null?'—':short(t.perHour)}</b><span class="small muted">${(t.mins/60).toFixed(1)} h of play a week</span></li>
      <li><span class="k">Per day</span><b>${short(t.inc/7)}</b><span class="small muted">average over the week</span></li>
      <li><span class="k">After spending</span><b class="${t.net<0?'bad':''}">${short(t.net)}</b><span class="small muted">${fmt(t.spend)} spent a week</span></li>
      <li><span class="k">Abyss Points</span><b>${short(t.ap)}</b><span class="small muted">from the ticked rows we know</span></li></ul>`+
      (t.unknown.length?`<p class="small muted" style="margin:6px 0 0">Not counted (Kina amount not known): ${h(t.unknown.join(', '))}. Measure them with the session log.</p>`:'');
  }
  // --- session log ---
  function lState(){const s=gg('klog',{})||{};return {run:s.run||null,list:Array.isArray(s.list)?s.list:[]}}
  function renderLog(){
    const b=el('klogbox'); if(!b) return; const L=lState(), K=D().kina;
    const opts=K.income.map(a=>`<option value="${h(a.id)}">${h(a.n)}</option>`).join('')+'<option value="other">Other</option>';
    const name=id=>{const a=K.income.find(x=>x.id===id);return a?a.n:'Other'};
    const rows=L.list.slice().reverse().map(e=>{const kh=e.mins>0?(e.k1-e.k0)/e.mins*60:null;
      return `<tr><td>${h(new Date(e.t).toISOString().slice(0,16).replace('T',' '))}</td><td>${h(name(e.a))}${e.note?`<span class="small muted">${h(e.note)}</span>`:''}</td><td class="num">${fmt(e.mins)}</td><td class="num">${fmt(e.k1-e.k0)}</td><td class="num"><b>${kh==null?'—':fmt(kh)}</b></td><td><button class="btn" type="button" data-kldel="${h(e.id)}" aria-label="Delete session">✕</button></td></tr>`}).join('');
    const agg={}; L.list.forEach(e=>{if(!(e.mins>0))return;const g=agg[e.a]=agg[e.a]||{k:0,m:0,n:0};g.k+=e.k1-e.k0;g.m+=e.mins;g.n++});
    const rank=Object.entries(agg).map(([a,g])=>({a,kh:g.k/g.m*60,n:g.n})).sort((x,y)=>y.kh-x.kh);
    const run=L.run;
    b.innerHTML=`<h3 style="margin:0 0 6px">Session log: your own Kina per hour</h3>
      <p class="small muted" style="margin:0 0 8px">Note your Kina (inventory, K) before and after a farming session. Press Start when you begin and Stop when you finish, or type the minutes. Saved in this browser and your account.</p>
      <div class="row"><label>Activity <select id="klact">${opts}</select></label><label>Note <input type="text" id="klnote" maxlength="40" placeholder="optional"></label></div>
      <div class="row" style="margin-top:8px"><label>Kina before <input type="number" min="0" id="klk0"></label><label>Kina after <input type="number" min="0" id="klk1"></label><label>Minutes <input class="sm" type="number" min="0" id="klmin"></label></div>
      <div class="row" style="margin-top:8px"><button class="btn" type="button" id="klstart">${run?'Restart timer':'Start timer'}</button><button class="btn" type="button" id="klstop" ${run?'':'disabled'}>Stop timer</button><button class="btn primary" type="button" id="klsave">Save session</button><span class="small muted" id="klstate">${run?'Timer running since '+h(new Date(run.start).toISOString().slice(11,16))+' UTC':''}</span></div>
      ${rank.length?`<h4 style="margin:12px 0 4px">Your best Kina per hour</h4><ul class="kpi">${rank.map(r=>`<li><span class="k">${h(name(r.a))}</span><b>${short(r.kh)}</b><span class="small muted">${r.n} session${r.n>1?'s':''}</span></li>`).join('')}</ul>`:''}
      ${rows?`<div class="tablewrap" style="margin-top:8px"><table><thead><tr><th>When (UTC)</th><th>Activity</th><th class="num">Minutes</th><th class="num">Kina made</th><th class="num">Kina / hour</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="small muted" style="margin:8px 0 0">No sessions saved yet.</p>'}`;
    const sel=el('klact'); if(sel&&run&&run.a) sel.value=run.a;
  }
  function kWire(){
    const box=el('kinaplanbox'); if(!box||box.dataset.plw) return; box.dataset.plw=1;
    const upd=(f,full)=>{const st=kState();f(st);gs('kplan',st);if(full)keepFocus(box,renderKina);else kSum()};
    box.addEventListener('change',e=>{const t=e.target,ds=t.dataset||{};
      if(t.id==='kpchars') return upd(s=>{s.chars=Math.max(1,Math.min(8,Math.round(num(t.value,1))));Object.keys(s.cc).forEach(k=>{if(s.cc[k]>s.chars)s.cc[k]=s.chars})},true);
      if(t.id==='kpmember') return upd(s=>{s.member=!!t.checked},true);
      if(ds.kon) return upd(s=>{s.on[ds.kon]=!!t.checked},true);
      if(ds.kspon) return upd(s=>{s.sp[ds.kspon]=!!t.checked},true);
    });
    box.addEventListener('input',e=>{const t=e.target,ds=t.dataset||{};const v=Math.max(0,num(t.value,0));
      if(ds.kkina) return upd(s=>{s.kina[ds.kkina]=v});
      if(ds.kunits) return upd(s=>{s.units[ds.kunits]=v});
      if(ds.kcc) return upd(s=>{s.cc[ds.kcc]=v});
      if(ds.kmins) return upd(s=>{s.mins[ds.kmins]=v});
      if(ds.kspu) return upd(s=>{s.units['sp_'+ds.kspu]=v});
      if(ds.kspcc) return upd(s=>{s.cc['sp_'+ds.kspcc]=v});
    });
    box.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('button');if(!t)return;const L=lState();
      if(t.id==='klstart'){L.run={start:Date.now(),a:(el('klact')||{}).value||'other'};gs('klog',L);renderLog();return}
      if(t.id==='klstop'&&L.run){const m=Math.max(1,Math.round((Date.now()-L.run.start)/6e4));const keep={a:L.run.a};L.run=null;gs('klog',L);renderLog();const mi=el('klmin');if(mi)mi.value=m;const s=el('klact');if(s)s.value=keep.a;return}
      if(t.id==='klsave'){const k0=num((el('klk0')||{}).value,null),k1=num((el('klk1')||{}).value,null);let m=num((el('klmin')||{}).value,null);
        if(m==null&&L.run) m=Math.max(1,Math.round((Date.now()-L.run.start)/6e4));
        const st=el('klstate');
        if(k0==null||k1==null||!(m>0)){if(st)st.textContent='Type Kina before, Kina after and the minutes (or use the timer).';return}
        L.list.push({id:'s'+Date.now().toString(36),t:Date.now(),a:(el('klact')||{}).value||'other',note:String((el('klnote')||{}).value||'').slice(0,40),k0,k1,mins:m});
        if(L.list.length>100) L.list=L.list.slice(-100); L.run=null; gs('klog',L); renderLog(); return}
      if(t.dataset.kldel){L.list=L.list.filter(x=>x.id!==t.dataset.kldel);gs('klog',L);renderLog()}
    });
  }

  /* =============== 2. Check your damage =============== */
  const dDef=()=>Object.assign({tier:'median',val:'',unit:'total',shard:false,cp:'',sh:{}},lg('dmgchk',{})||{});
  // expected numbers for the current settings
  function dCalc(st){
    const G=D().dmg, C=G.classes[slug()], me=myChar();
    const cpv=num(st.cp!==''?st.cp:(me&&me.cp),null), key=st.shard?'dmg60Shard':'dmg60';
    let exp,src,label,outside=false;
    if(st.tier==='mine'&&cpv){const a=C.median,b=C.p10;let t=(cpv-a.cp)/(b.cp-a.cp);if(t<-0.5||t>1.5)outside=true;t=Math.max(-0.5,Math.min(1.5,t));exp=a[key]+t*(b[key]-a[key]);src=t<0.5?a:b;label=`your Combat Power (${fmt(cpv)})`}
    else{const s=st.tier==='p10'?'p10':'median';exp=C[s][key];src=C[s];label=`${G.tiers[s]} (about ${short(C[s].cp)} Combat Power, Gear Score ${fmt(C[s].gs)})`}
    let mine=num(st.val,null); if(mine!=null&&st.unit==='dps') mine*=60;
    return {exp,src,label,outside,mine,cpv,ratio:mine!=null&&exp?mine/exp:null};
  }
  function renderDmg(){
    const box=el('dmgcheckbox'); if(!box) return; const P=D();
    if(!P||!P.dmg){box.innerHTML='<p class="box muted">The damage check could not load.</p>';return}
    addStyle(); const G=P.dmg, C=G.classes[slug()];
    if(!C){box.innerHTML=`<div class="box"><h3 style="margin:0">Check your damage</h3><p class="muted" style="margin:6px 0 0">Our simulator has no data for ${h(clsName())} yet, so there is nothing to compare with.</p></div>`;return}
    const st=dDef(), me=myChar(), c=dCalc(st);
    const rows=(c.src.skills||[]).map(s=>{const yv=st.sh[s.n];
      return `<tr><td><b>${h(s.n)}</b>${s.cpm?`<span class="small muted">about ${s.cpm} casts a minute</span>`:'<span class="small muted">passive or proc (no cast)</span>'}</td><td class="num">${s.sh}%</td><td class="num"><input class="sm" type="number" min="0" max="100" step="0.1" data-dsh="${h(s.n)}" value="${h(yv==null?'':yv)}" aria-label="Your share for ${h(s.n)}"></td><td data-dflag="${h(s.n)}"></td></tr>`}).join('');
    box.innerHTML=`<div class="pl"><div class="box" style="display:grid;gap:10px">
      <h3 style="margin:0">Check your damage: ${h(clsName())}</h3>
      <p class="small muted" style="margin:0">Hit a training dummy for 60 seconds with your normal macro, then open Combat Analysis (<span class="kbd">Ctrl</span>+<span class="kbd">X</span>) and type the total damage. Optional: type each skill's share from the detailed view. Training dummies have no damage resistance, so this is a clean test of gear and rotation.</p>
      <div class="row"><label>Compare with <select id="dctier"><option value="median">${h(G.tiers.median)}</option><option value="p10">${h(G.tiers.p10)}</option><option value="mine" ${c.cpv?'':'disabled'}>My Combat Power</option></select></label>
        <label>Combat Power <input type="number" min="0" step="100" id="dccp" value="${h(st.cp!==''?st.cp:(me&&me.cp)||'')}" placeholder="type it"></label>
        <label><input type="checkbox" id="dcshard" ${st.shard?'checked':''}> I used a Power Shard</label></div>
      <div class="row"><label>Your result <input type="number" min="0" id="dcval" value="${h(st.val)}" placeholder="e.g. 900000"></label>
        <label>Unit <select id="dcunit"><option value="total">total damage in 60 s</option><option value="dps">damage per second</option></select></label></div>
      <div id="dcres"></div></div>
      <div class="box"><h3 style="margin:0 0 6px">Skill shares</h3><p class="small muted" style="margin:0 0 6px">Expected share of total damage with this guide's build and macro. Type yours from the detailed Combat Analysis.</p>
      <div class="tablewrap"><table><thead><tr><th>Skill</th><th class="num">Expected</th><th class="num">Yours (%)</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>
      <div id="dctips"></div>
      <p class="small muted" style="margin:0">${h(G.note)} Simulated ${h(G.generated)}, ${h(G.iterations)} runs per number.</p></div>`;
    const t=el('dctier'); if(t) t.value=(st.tier==='mine'&&!c.cpv)?'median':st.tier; const u=el('dcunit'); if(u) u.value=st.unit;
    dRes();
  }
  function dRes(){
    const r=el('dcres'); if(!r) return; const st=dDef(), c=dCalc(st);
    let verdict='';
    if(c.ratio!=null){
      const pct=Math.round(c.ratio*100), cl=c.ratio>=0.9?'good':c.ratio>=0.75?'':'bad';
      const msg=c.ratio>=1.15?'Above what we expect: your gear or rotation beats this tier.':c.ratio>=0.9?'On track for this tier.':c.ratio>=0.75?'A bit low. Check the skill shares below and that every macro key fires.':'Well below. If skill shares are off, it is the rotation or macro; if they match, it is gear (compare your Combat Power with the tier).';
      verdict=`<div><div class="row" style="justify-content:space-between"><b class="${cl}" id="dcpct">${pct}% of expected</b><span class="small muted">${fmt(c.mine)} vs ${fmt(c.exp)} damage in 60 s</span></div><div class="bar" role="img" aria-label="${pct}% of expected"><i style="width:${Math.min(100,pct/1.5)}%"></i></div><p class="small" style="margin:6px 0 0">${h(msg)}</p></div>`;
    }
    r.innerHTML=`<ul class="kpi"><li><span class="k">We expect</span><b id="dcexp">${short(c.exp)}</b><span class="small muted">damage in 60 s at ${h(c.label)}</span></li>
      <li><span class="k">Per second</span><b>${short(c.exp/60)}</b><span class="small muted">crit rate about ${c.src.crit}% · ${c.src.castsPerMin} casts a minute</span></li></ul>
      ${c.outside?'<p class="small bad" style="margin:6px 0 0">Your Combat Power is outside our two gear sheets, so the expected number is a rough stretch.</p>':''}${verdict}`;
    const mo=document.querySelector('#dctier option[value="mine"]'); if(mo) mo.disabled=!c.cpv;
    const flags=[];
    (c.src.skills||[]).forEach(s=>{const cell=document.querySelector(`[data-dflag="${s.n.replace(/["\\]/g,'\\$&')}"]`);if(!cell)return;const y=num(st.sh[s.n],null);let f='';
      if(y!=null){if(s.sh>=4&&y<s.sh*0.5){f='<span class="bad">Low</span>';flags.push([s,y])}else if(y>s.sh*1.6&&s.sh>=2)f='<span class="muted">High</span>';else f='<span class="good">OK</span>'}
      cell.innerHTML=f});
    const tp=el('dctips'); if(tp) tp.innerHTML=flags.length?`<div class="callout"><b>Rotation check.</b> ${flags.map(([s,y])=>`<b>${h(s.n)}</b> deals ${h(y)}% of your damage; we expect about ${s.sh}%.`).join(' ')} Usually the key isn't firing: hold the macro on the dummy for 20 seconds and check in Combat Analysis (<span class="kbd">Ctrl</span>+<span class="kbd">X</span>) that the skill fires, or give it its own slot. Compare with the order on the <a href="#rotation" data-goto="rotation">Rotation tab</a>.</div>`:'';
  }
  function dWire(){
    const box=el('dmgcheckbox'); if(!box||box.dataset.plw) return; box.dataset.plw=1;
    const save=(f,full)=>{const st=dDef();f(st);ls('dmgchk',st);if(full)keepFocus(box,renderDmg);else dRes()};
    box.addEventListener('change',e=>{const t=e.target;
      if(t.id==='dctier') return save(s=>{s.tier=t.value},true);
      if(t.id==='dcunit') return save(s=>{s.unit=t.value});
      if(t.id==='dcshard') return save(s=>{s.shard=!!t.checked});
      if(t.id==='dccp'&&dDef().tier==='mine') return save(()=>{},true); // skill list may switch sheet
    });
    box.addEventListener('input',e=>{const t=e.target;
      if(t.id==='dcval') return save(s=>{s.val=t.value});
      if(t.id==='dccp') return save(s=>{s.cp=t.value});
      if(t.dataset&&t.dataset.dsh) return save(s=>{s.sh=s.sh||{};if(t.value==='')delete s.sh[t.dataset.dsh];else s.sh[t.dataset.dsh]=t.value});
    });
  }

  /* =============== 3. Am I ready? =============== */
  function rYou(){const me=myChar(), st=gg('rdy',{})||{};return {me,il:me&&me.il!=null?me.il:num(st.il,null),cp:me&&me.cp!=null?me.cp:num(st.cp,null),st}}
  function renderReady(){
    const box=el('readybox'); if(!box) return; const P=D();
    if(!P||!P.ready){box.innerHTML='<p class="box muted">The readiness table could not load.</p>';return}
    addStyle(); const R=P.ready, y=rYou();
    const wasOpen=!!box.querySelector('details.rdwrap[open]');
    box.innerHTML=`<details class="box rdwrap"${wasOpen?' open':''}><summary><b style="font-size:17px">Am I ready?</b> <span class="small muted">Item level and Combat Power you need for every dungeon, plus Nightmare tiers. Click to open.</span></summary><div class="pl" style="margin-top:10px"><div class="box" style="display:grid;gap:10px">
      <p class="small muted" style="margin:0">${h(R.note)}</p>
      ${y.me?`<p style="margin:0">Using <b>${h(y.me.name||'My character')}</b>: item level <b>${fmt(y.il)}</b>, Combat Power <b>${fmt(y.cp)}</b> (from <a href="#mychar" data-goto="mychar">My character</a>).</p>`
        :`<div class="row"><label>Your item level (Gear Score) <input type="number" min="0" id="rdil" value="${h(y.st.il==null?'':y.st.il)}"></label><label>Combat Power <input type="number" min="0" id="rdcp" value="${h(y.st.cp==null?'':y.st.cp)}"></label><span class="small muted">Or load your character on <a href="#mychar" data-goto="mychar">My character</a>.</span></div>`}</div>
      <div id="rdtab"></div>
      <p class="small muted" style="margin:0">Sources: our Dungeon guides; dungeon pages on ${(R.src||[]).map(credit).join(', ')}.</p></div></details>`;
    rTable();
  }
  function rTable(){
    const box=el('rdtab'); if(!box) return; const R=D().ready, y=rYou(), il=y.il, cp=y.cp;
    const status=r=>{
      if(r.offline) return '<span class="tag">Offline</span>';
      if(il==null) return '<span class="muted">—</span>';
      if(il<r.gate) return `<span class="tag t-bad">Locked</span><span class="small muted">need +${fmt(r.gate-il)} item level</span>`;
      const lowIL=r.recIL&&il<r.recIL, lowCP=r.recCP&&cp!=null&&cp<r.recCP[0];
      if(lowIL||lowCP) return `<span class="tag t-ok">Can enter</span><span class="small muted">${lowIL?`suggested ${fmt(r.recIL)} item level`:''}${lowIL&&lowCP?', ':''}${lowCP?`${short(r.recCP[0])} Combat Power`:''}</span>`;
      return '<span class="tag t-best">Ready</span>';
    };
    const sug=r=>{const p=[];if(r.recIL)p.push(fmt(r.recIL)+' IL');if(r.recCP)p.push(r.recCP[0]===r.recCP[1]?`~${short(r.recCP[0])} CP`:`${short(r.recCP[0])}–${short(r.recCP[1])} CP`);return p.length?p.join(' · ')+`<span class="small muted">${h(r.recNote||'')}</span>`+(r.unconf?UNC:''):'<span class="muted">—</span>'};
    let last='';
    const rows=R.rows.map(r=>{let g='';if(r.g!==last){last=r.g;g=`<tr><th colspan="7" style="text-align:left">${h(r.g)}</th></tr>`}
      const link=R.links[r.dg];
      return g+`<tr${r.offline?' class="off"':''} data-rdrow="${h(r.dg)}"><td><b>${h(r.name)}</b>${link?`<span class="small">${ext(link,'metabot.gg')}</span>`:''}</td><td>${h(r.stage)}</td><td class="num">${fmt(r.gate)}</td><td>${sug(r)}</td><td>${h(r.enrage)}${r.timerUnconf?' '+UNC:''}</td><td class="num">${r.kill?mmss(r.kill):'—'}</td><td>${status(r)}</td></tr>`}).join('');
    const nmHead='<tr><th>Nightmare boss</th>'+Array.from({length:10},(_,i)=>`<th class="num">T${i+1}</th>`).join('')+'<th>Your tier</th></tr>';
    const nmRows=R.nightmare.map(n=>{let best=0;const cells=n.tiers.map((v,i)=>{const ok=il!=null&&il>=v;if(ok)best=i+1;return `<td class="num${ok?' y':''}">${fmt(v)}</td>`}).join('');
      return `<tr><td><b>${h(n.name)}</b></td>${cells}<td>${il==null?'—':best?`<b>T${best}</b>`:'<span class="muted">below T1</span>'}</td></tr>`}).join('');
    box.innerHTML=`<div class="box"><div class="tablewrap"><table><thead><tr><th>Content</th><th>Stage / mode</th><th class="num">Item level to enter</th><th>Suggested</th><th>Enrage / timer</th><th class="num">Typical kill</th><th>You</th></tr></thead><tbody>${rows}</tbody></table></div></div>
      <div class="box nm" style="margin-top:12px"><h3 style="margin:0 0 6px">Nightmare: suggested item level per tier</h3><p class="small muted" style="margin:0 0 6px">${h(R.nightmareNote)} Every boss enrages at 5:00 (warning at 4:00).</p><div class="tablewrap"><table><thead>${nmHead}</thead><tbody>${nmRows}</tbody></table></div></div>`;
  }
  function rWire(){
    const box=el('readybox'); if(!box||box.dataset.plw) return; box.dataset.plw=1;
    box.addEventListener('input',e=>{const t=e.target;if(t.id!=='rdil'&&t.id!=='rdcp')return;const st=gg('rdy',{})||{};st[t.id==='rdil'?'il':'cp']=num(t.value,null);gs('rdy',st);rTable()});
  }

  /* =============== 4. Weekly shopping list =============== */
  const TL={week:'a week',month:'a month',season:'until the shop closes',life:'in total (never refills)',none:'no limit'};
  const SC={char:'per character',acct:'per account',server:'per server'};
  function sState(){
    const s=gg('shopw',{})||{}; const wk=weekId(), mo=new Date().toISOString().slice(0,7);
    const o={wk:s.wk,mo:s.mo,w:s.w||{},m:s.m||{},l:s.l||{}}; let dirty=false;
    if(o.wk!==wk){o.wk=wk;o.w={};dirty=true} if(o.mo!==mo){o.mo=mo;o.m={};dirty=true}
    if(dirty&&(s.wk!=null||s.mo!=null)) gs('shopw',o); return o;
  }
  const bucket=t=>t==='week'?'w':t==='month'?'m':'l';
  function renderShop(){
    const box=el('shoplistbox'); if(!box) return; const P=D();
    if(!P||!Array.isArray(P.shops)){box.innerHTML='<p class="box muted">The shopping list could not load.</p>';return}
    addStyle(); const st=sState(), member=!!(gg('kplan',{})||{}).member, openSet=gg('shopopen',null);
    const shops=P.shops.map((s,si)=>{
      const closed=s.closes&&dayDiff(s.closes)<0; const dl=s.closes?dayDiff(s.closes):null;
      let wDone=0,wAll=0;
      const items=s.items.map((it,ii)=>{const k=s.id+'|'+ii, b=bucket(it.t), ended=it.until&&dayDiff(it.until)<0;
        const can=it.t!=='none'&&!ended; const done=can&&!!st[b][k];
        if(it.t==='week'&&!ended){wAll++;if(done)wDone++}
        const lim=it.lim==null?'no limit':`${h(it.lim)} ${h(TL[it.t]||'')}`;
        return `<tr class="${done||ended?'off':''}"><td class="num">${ii+1}</td><td><b>${ended?'<s>'+h(it.n)+'</s>':h(it.n)}</b>${it.unconf?' '+UNC:''}${it.member&&!s.member?' <span class="tag wind">Membership</span>':''}${ended?' <span class="tag">Ended</span>':it.until?` <span class="small muted">until ${h(it.until)}</span>`:''}<span class="small muted">${h(it.why)}</span></td><td>${h(it.p)}</td><td>${lim}<span class="small muted">${it.lim==null?'':h(SC[it.sc]||'')}</span></td><td>${can?`<label class="gchk"><input type="checkbox" data-shk="${h(k)}" data-shb="${b}" ${done?'checked':''} aria-label="Bought ${h(it.n)}"><span>${it.t==='week'?'Done this week':it.t==='month'?'Done this month':'Bought'}</span></label>`:''}</td></tr>`}).join('');
      const open=openSet?!!openSet[s.id]:si<3;
      const src=s.src?`<p class="small muted" style="margin:6px 0 0">Prices and limits: ${credit(s.src)} (Global client data).</p>`:'<p class="small muted" style="margin:6px 0 0">From our Daily &amp; weekly and Farming tabs (official NC notices of 7 and 14 Oct).</p>';
      return `<details class="shop" data-shop="${h(s.id)}" ${open?'open':''}><summary>${icon(s.cur)}<span>${h(s.n)}</span><span class="tag">${h(s.cur)}</span>${s.member?' <span class="tag wind">Membership</span>':''}${s.unconf?' '+UNC:''}${dl!=null?` <span class="small ${dl<=14?'bad':'muted'}">${closed?'closed':`closes in ${dl} day${dl===1?'':'s'} (${h(s.closes)})`}</span>`:''}${wAll?` <span class="small muted">${wDone}/${wAll} weekly done</span>`:''}</summary>
        <p class="small" style="margin:6px 0">${h(s.where)}. ${h(s.tip)}${s.limNote?' '+UNC+' <span class="small muted">'+h(s.limNote)+'</span>':''}${s.member&&!member?' <b>You told the Kina planner you have no membership.</b>':''}</p>
        <div class="tablewrap"><table><thead><tr><th class="num">#</th><th>Buy (best value first)</th><th>Price</th><th>Limit</th><th></th></tr></thead><tbody>${items}</tbody></table></div>${src}</details>`}).join('');
    box.innerHTML=`<div class="pl"><div class="box" style="display:grid;gap:8px"><h3 style="margin:0">Weekly shopping list</h3>
      <p class="small muted" style="margin:0">Every currency shop in buying order. Weekly ticks clear at the weekly reset (${h(P.reset.weekly)}); "Bought" ticks for limits that never refill stay. ${h(P.reset.monthNote)}</p>
      <div class="row"><span>Weekly reset in <b id="shreset">${left(nextReset()-Date.now())}</b></span><button class="btn" type="button" id="shclear">Clear this week's ticks</button></div></div>
      ${shops}<p class="small muted" style="margin:0">${h(P.shopNote)} ${h(P.sourcesNote)} All shops: ${(P.shopSrc||[]).map(credit).join(', ')}.</p></div>`;
  }
  function sWire(){
    const box=el('shoplistbox'); if(!box||box.dataset.plw) return; box.dataset.plw=1;
    box.addEventListener('change',e=>{const t=e.target;if(!t.dataset||!t.dataset.shk)return;const st=sState();const b=t.dataset.shb;if(t.checked)st[b][t.dataset.shk]=true;else delete st[b][t.dataset.shk];gs('shopw',st);keepFocus(box,renderShop)});
    box.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('#shclear');if(!t)return;const st=sState();st.w={};gs('shopw',st);renderShop()});
    box.addEventListener('toggle',e=>{const d=e.target;if(!d||!d.dataset||!d.dataset.shop)return;const o=gg('shopopen',null)||Object.fromEntries((D().shops||[]).map((s,i)=>[s.id,i<3]));o[d.dataset.shop]=d.open;gs('shopopen',o)},true);
  }

  function all(){
    const f=[[renderKina,kWire],[renderDmg,dWire],[renderReady,rWire],[renderShop,sWire]];
    f.forEach(([r,w])=>{try{r();w()}catch(e){console.error(e)}});
  }
  window.renderPlanner=all;
  window.renderKinaPlanner=()=>{renderKina();kWire()}; window.renderDmgCheck=()=>{renderDmg();dWire()};
  window.renderReadyTable=()=>{renderReady();rWire()}; window.renderShopList=()=>{renderShop();sWire()};
  // redraw after an account sync (same wrapper pattern as itemfinder_fn.js / buildcode_fn.js; no tail.js edit needed)
  {const o=window.applyStore;if(typeof o==='function')window.applyStore=function(){const r=o.apply(this,arguments);try{all()}catch(e){}return r}}
  try{all()}catch(e){console.error(e)}
})();

/* ---------- Sources & credits: every cited source, grouped and searchable (data: global GUIDESOURCES = audit/r7/sources.json) ---------- */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const data=()=>(typeof GUIDESOURCES!=='undefined'&&GUIDESOURCES)||window.GUIDESOURCES||null;
  const safeUrl=u=>/^https?:\/\//i.test(String(u||''))?String(u):'';
  const st={grp:'all',q:''};
  const PAGE=60;
  const shown={};   // site index -> how many links are drawn

  function addStyle(){
    if(document.getElementById('srcstyle')) return;
    const el=document.createElement('style'); el.id='srcstyle';
    el.textContent=[
      '#creditsbox{display:grid;gap:14px;min-width:0}',
      '.srchow{margin:0;padding-left:20px;display:grid;gap:6px}',
      '.srcnums{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0 0}',
      '.srcnums div{background:var(--panel2);border:1px solid var(--line);border-radius:9px;padding:7px 10px}',
      '.srcnums b{display:block;font:400 22px var(--f-display);color:var(--gold)}',
      '.srcnums span{font:600 12px var(--f-mono);letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}',
      '.srcctl{display:grid;gap:10px}',
      '.srcctl .seg{flex-wrap:wrap;max-width:100%}',
      '.srcctl input[type=search]{width:100%;max-width:440px;box-sizing:border-box;padding:8px 10px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:inherit;font:inherit}',
      '.srcgrp{display:grid;gap:8px;min-width:0}',
      '.srcgrp>h3{margin:6px 0 0}.srcgrp>p{margin:0}',
      'details.srcsite{padding:0;min-width:0}',
      'details.srcsite>summary{list-style:none;cursor:pointer;padding:11px 14px;display:grid;gap:4px}',
      'details.srcsite>summary::-webkit-details-marker{display:none}',
      '.srcrow{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline}',
      '.srcrow b{font-size:16px;overflow-wrap:anywhere}',
      '.srcrow .n{margin-left:auto;font:600 12px var(--f-mono);color:var(--muted)}',
      '.srctabs{display:flex;flex-wrap:wrap;gap:4px}',
      '.srctabs a{font:600 12px var(--f-mono);padding:1px 7px;border-radius:999px;border:1px solid var(--line);color:var(--wind);text-decoration:none}',
      '.srclinks{margin:0;padding:0 14px 12px 32px;display:grid;gap:5px;font-size:14px}',
      '.srclinks li{overflow-wrap:anywhere}',
      '.srclinks .u{color:var(--muted);font-size:12px}',
      '.srcmore{margin:0 14px 12px}',
    ].join('\n');
    document.head.appendChild(el);
  }
  const tabLinks=(tabs,D)=>(tabs||[]).filter(t=>document.getElementById(t)).map(t=>`<a href="#${h(t)}" data-goto="${h(t)}">${h((D.tabNames||{})[t]||t)}</a>`).join('');

  function linkItem(l,D){
    const u=safeUrl(l[0]); if(!u) return '';
    const label=l[1]||u.replace(/^https?:\/\/(www\.)?/,'');
    // API endpoints, URL templates ({serverId}...) and data folders are not pages a reader can open: show them as plain text
    if(/[{}]|%7B|\.\.\.|\/api(\/|$)|^https?:\/\/api[-.]|\.workers\.dev\/|\/character\/Global$|shugo\.gg\/data\/skills$/i.test(u)) return `<li><span>${h(label)}</span> <span class="muted">(data address used by a tool, not a web page)</span>${l[2]?` <span class="muted">— ${h(l[2])}</span>`:''}${l[1]?`<br><span class="u">${h(u)}</span>`:''}</li>`;
    return `<li><a href="${h(u)}" target="_blank" rel="${/metabot\.gg/i.test(String(u||''))?'noopener':'noopener noreferrer'}">${h(label)}</a>${l[2]?` <span class="muted">— ${h(l[2])}</span>`:''}${l[1]?`<br><span class="u">${h(u)}</span>`:''}</li>`;
  }
  function drawLinks(det){
    const D=data(); const i=+det.dataset.si; const s=D.sites[i]; if(!s) return;
    const q=st.q.trim().toLowerCase();
    const links=q?s.links.filter(l=>(l[0]+' '+l[1]+' '+l[2]).toLowerCase().includes(q)):s.links;
    const use=links.length?links:s.links;
    const n=Math.min(use.length,shown[i]||PAGE);
    let html=`<ul class="srclinks">${use.slice(0,n).map(l=>linkItem(l,D)).join('')}${!s.links.length?`<li class="muted">Cited by name only (${s.named} times), without a link${s.host?'':''}.</li>`:''}</ul>`;
    if(use.length>n) html+=`<button type="button" class="srcmore" data-srcmore="${i}">Show ${Math.min(PAGE,use.length-n)} more of ${use.length-n}</button>`;
    const body=det.querySelector('.srcbody'); if(body) body.innerHTML=html;
  }

  function render(){
    const box=document.getElementById('creditsbox'); if(!box) return;
    const D=data();
    if(!D||!Array.isArray(D.sites)){box.innerHTML='<p class="box muted">Sources could not load.</p>';return}
    addStyle();
    const G=D.groups||[], C=D.counts||{}, bt=C.byType||{}, sbt=C.sitesByType||{};
    const seg=`<div class="seg" role="group" aria-label="Source type"><button type="button" data-srcgrp="all" aria-pressed="${st.grp==='all'}">All</button>`+
      G.map(g=>`<button type="button" data-srcgrp="${h(g.id)}" aria-pressed="${st.grp===g.id}">${h(g.name)}</button>`).join('')+`</div>`;
    const nums=`<div class="srcnums"><div><b>${h(C.urls)}</b><span>links</span></div><div><b>${h(C.sites)}</b><span>sites &amp; creators</span></div>`+
      G.map(g=>`<div><b>${h(bt[g.id]||0)}</b><span>${h(g.name)} · ${h(sbt[g.id]||0)} sites</span></div>`).join('')+`</div>`;
    box.innerHTML=
      `<div class="box"><h3 style="margin:0 0 8px">How this guide was made</h3><ul class="srchow">${(D.howMade||[]).map(x=>`<li>${h(x)}</li>`).join('')}</ul>${nums}</div>`+
      `<div class="box srcctl">${seg}<input type="search" id="srcsearch" placeholder="Search a site, creator, page or link" aria-label="Search sources" value="${h(st.q)}"><div class="small muted"><span id="srcstate"></span> · Open a site to see every page we used. Tab chips jump to the tab that uses it. Updated ${h(D.updated||'')}.</div></div>`+
      G.map(g=>{
        const rows=D.sites.map((s,i)=>[s,i]).filter(([s])=>s.type===g.id);
        if(!rows.length) return '';
        return `<section class="srcgrp" data-srcg="${h(g.id)}"><h3>${h(g.name)}</h3><p class="small muted">${h(g.intro||'')}</p>`+
          rows.map(([s,i])=>`<details class="box srcsite" data-si="${i}"><summary><div class="srcrow"><b>${h(s.name)}</b>${s.host&&s.host!==s.name?`<span class="small muted">${h(s.host)}</span>`:''}${s.tool?`<a class="tag wind" href="#communitytools" data-goto="communitytools">In Community tools</a>`:''}<span class="n">${s.n?h(s.n)+(s.n===1?' link':' links'):''}${s.named?(s.n?' + ':'')+h(s.named)+' named':''}</span></div>`+
            `<div class="small">${h(s.what||'')}</div><div class="srctabs">${tabLinks(s.tabs,D)}</div></summary><div class="srcbody"></div></details>`).join('')+`</section>`;
      }).join('')+
      `<p class="box small muted" id="srcnone" hidden>Nothing matches your search.</p>`+
      `<p class="small muted" style="margin:0">All trademarks and game assets belong to their owners (AION 2: NCSoft). Linked sites are credited as the place we read the information; we are not affiliated with any of them.</p>`;
    // search text per site (built once per render)
    box.querySelectorAll('details.srcsite').forEach(d=>{const s=D.sites[+d.dataset.si]; d._hay=(s.name+' '+s.host+' '+s.what+' '+(s.tabs||[]).map(t=>(D.tabNames||{})[t]||t).join(' ')+' '+s.links.map(l=>l[0]+' '+l[1]+' '+l[2]).join(' ')).toLowerCase()});
    apply();
  }
  function apply(){
    const box=document.getElementById('creditsbox'); if(!box) return;
    const q=st.q.trim().toLowerCase(); let vis=0, links=0; const D=data();
    box.querySelectorAll('[data-srcgrp]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.srcgrp===st.grp));
    box.querySelectorAll('section.srcgrp').forEach(sec=>{
      const on=st.grp==='all'||sec.dataset.srcg===st.grp; let any=0;
      sec.querySelectorAll('details.srcsite').forEach(d=>{const m=on&&(!q||d._hay.includes(q)); d.hidden=!m; if(m){any++;vis++;links+=D.sites[+d.dataset.si].n; if(d.open) drawLinks(d)}});
      sec.hidden=!any;
    });
    const n=document.getElementById('srcnone'); if(n) n.hidden=vis>0;
    const s=document.getElementById('srcstate'); if(s) s.textContent=`${vis} sites · ${links} links shown`;
  }
  function wire(){
    const box=document.getElementById('creditsbox'); if(!box||box.dataset.srcwired) return; box.dataset.srcwired=1;
    box.addEventListener('click',e=>{
      const b=e.target.closest&&e.target.closest('[data-srcgrp]'); if(b){st.grp=b.dataset.srcgrp; apply(); return}
      const m=e.target.closest&&e.target.closest('[data-srcmore]'); if(m){const i=+m.dataset.srcmore; shown[i]=(shown[i]||PAGE)+PAGE; const d=m.closest('details'); if(d) drawLinks(d)}
    });
    box.addEventListener('input',e=>{if(e.target&&e.target.id==='srcsearch'){st.q=e.target.value||''; apply()}});
    box.addEventListener('toggle',e=>{const d=e.target; if(d&&d.classList&&d.classList.contains('srcsite')&&d.open) drawLinks(d)},true);
  }
  window.renderSources=function(){render(); wire()};
  try{window.renderSources()}catch(e){console.error(e)}
})();

/* ---------- site settings: the ONE place to set the donation link ----------
   DONATE_URL: your Ko-fi / Buy Me a Coffee / PayPal.me link, e.g. 'https://ko-fi.com/yourname'.
   Leave it '' and the "Support this guide" button and the footer donation link stay hidden. */
var SITE_CONFIG={DONATE_URL:'https://ko-fi.com/usalt', FEEDBACK_URL:'https://github.com/u-Salt/aion2-guide/issues'};  /* FEEDBACK_URL: e.g. your GitHub issues page; '' hides the footer link */

/* footer + header button wiring (the markup is written by build_hub.py; everything starts hidden) */
(function(){
  function apply(){
    var u=String((SITE_CONFIG&&SITE_CONFIG.DONATE_URL)||'').trim();
    var ok=/^https:\/\/[^\s"'<>]+$/i.test(u);
    document.querySelectorAll('[data-donate]').forEach(function(a){
      if(ok){a.href=u;a.target='_blank';a.rel='noopener noreferrer';a.hidden=false}
      else{a.removeAttribute('href');a.hidden=true}
    });
    document.querySelectorAll('[data-donate-sep]').forEach(function(s){s.hidden=!ok});
    var fu=String((SITE_CONFIG&&SITE_CONFIG.FEEDBACK_URL)||'').trim(), fok=/^https:\/\/[^\s"'<>]+$/i.test(fu);
    document.querySelectorAll('[data-feedback]').forEach(function(a){if(fok){a.href=fu;a.target='_blank';a.rel='noopener noreferrer';a.hidden=false}else{a.removeAttribute('href');a.hidden=true}});
    document.querySelectorAll('[data-feedback-sep]').forEach(function(s){s.hidden=!fok});
    // the guide also keeps a copy in your claude.ai account when it is opened there (store.js); say so honestly
    var p=document.getElementById('footpriv');
    if(p&&window.claude&&typeof window.claude.use==='function')
      p.textContent='Your ticks and settings are saved in this browser and, because you opened the guide on claude.ai, synced to your claude.ai account so they follow you (not your game account). Nothing is sent anywhere else.';
  }
  try{apply()}catch(e){console.error(e)}
  window.applySiteConfig=apply;
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
const PAN_FIRST=3; // easiest wins shown before the "more steps" drop-down
/* drop-downs inside #panbox: open/closed survives the re-render after every tick or filter (and a reload, this visit) */
let PAN_OPEN={}; try{PAN_OPEN=JSON.parse(sessionStorage.getItem('aion2fm-pandet')||'{}')||{}}catch(e){PAN_OPEN={}}
function panDet(k,title,sum,body,nested){return `<details class="${nested?'coldet':'box'}" data-pandet="${k}"${PAN_OPEN[k]?' open':''}><summary class="pansum"><b>${title}</b> <span class="small muted">${sum} Click to open.</span></summary>${body}</details>`}
{const st=document.getElementById('pandetcss')||document.createElement('style'); if(!st.id){st.id='pandetcss';
  /* closed secondary drop-downs sit side by side on wide screens; an open one takes the full row */
  st.textContent='.pandets{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:14px;min-width:0}.panmain{display:grid;gap:14px;min-width:0}.panmain>*{min-width:0}@media (min-width:1000px){.panmain{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto 1fr;grid-template-areas:"best top" "best wins";align-items:start}.panmain>.pantop{grid-area:top}.panmain>.panbest{grid-area:best}.panmain>.panwins{grid-area:wins}}.pandets>details[open]{grid-column:1/-1}.pandets>details{min-width:0}.pandets>details>summary.pansum::before,details.coldet[data-pandet]>summary::before,details.coldet[data-clodet]>summary::before{content:"▸";color:var(--gold)}.pandets>details[open]>summary.pansum::before,details.coldet[data-pandet][open]>summary::before,details.coldet[data-clodet][open]>summary::before{content:"▾"}';
  document.head.appendChild(st)}}
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
  let h=`<div class="panmain"><div class="box pantop"><div class="panctl"><span class="small muted">Your faction</span><div class="seg" role="group" aria-label="Faction">${['E','A','B'].map(f=>`<button type="button" data-panfac="${f}" aria-pressed="${fac===f}">${f==='B'?'Show both':PAN_FACN[f]}</button>`).join('')}</div>
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
  h+=`<div class="box panbest" style="display:grid;gap:12px"><h3 style="margin:0">Your best setup</h3>
    <p class="small muted" style="margin:0">Tick what you own (in the All decorations table below). Each slot shows the best decoration you have for a ${esc(cls)}; the value is about how much damage it adds${m==='pvp'?' (PvP: estimate)':''}.</p>
    <div class="panbar"><span>Now <b>${panPct(pl.now)}</b></span><span>After the steps below <b>${panPct(pl.end)}</b></span><span>Best you can get <b>${panPct(pl.max)}</b></span></div>
    ${['C','S','A'].map(s=>`<div><div class="eyebrow" style="margin-bottom:6px">${PAN_SLOTP[s]} · ${pl.best[s].length} of ${P.slots[s]} filled</div><div class="pangrid ${s==='A'?'wide':''}">${tiles(s)}</div>
      <p class="small muted" style="margin:6px 0 0">Best possible: ${pl.target[s].map(x=>`<span class="${x.own?'panown':''}">${esc(x.d.n)}${x.own?' ✓':''}</span>`).join(', ')||'—'}</p></div>`).join('')}</div>`;
  // ---- easiest wins first
  h+=`<div class="box panwins" style="display:grid;gap:10px"><h3 style="margin:0">Easiest wins first</h3>
    <p class="small muted" style="margin:0">Do these in order: each one is the biggest gain for the least effort from where you are now. Tick it when you have it and the list moves on.</p>
    ${pl.steps.length?(()=>{const li=st=>{const x=st.x;return `<li><label class="panstephead">${panIco(x.d)}<span>${panName(x.d)} <span class="small muted">${PAN_SLOTN[x.d.s]}</span> ${panEffTag(x.ef)} <b class="panval">${panPct(st.gain)}</b></span></label>
      <div class="small">${st.rep?`Replaces ${esc(st.rep.d.n)}. `:`Fills an empty ${PAN_SLOTN[x.d.s]} slot. `}${panHow(x,fac)}</div></li>`};
      const first=pl.steps.slice(0,PAN_FIRST), rest=pl.steps.slice(PAN_FIRST);
      return `<ol class="pansteps">${first.map(li).join('')}</ol>`+(rest.length?panDet('moresteps',`Steps ${PAN_FIRST+1} to ${pl.steps.length}`,`the next ${rest.length} wins, in the same order (${panPct(rest.reduce((t,s)=>t+s.gain,0))} more).`,`<ol class="pansteps" start="${PAN_FIRST+1}" style="margin-top:10px">${rest.map(li).join('')}</ol>`,1):'')})()
      :`<p class="callout ok small" style="margin:0">Nothing left to gain: your Pantheon is the best you can build right now.</p>`}</div>`;
  h+=`</div>`; // end .panmain
  // ---- full table
  const rows=pl.all.filter(x=>(filt==='all'||x.d.s===filt)&&(showAll||x.d.av==='now'||x.own))
    .sort((a,b)=>'CSA'.indexOf(a.d.s)-'CSA'.indexOf(b.d.s)||(b.ef>=0)-(a.ef>=0)||b.v-a.v||a.d.n.localeCompare(b.d.n));
  const nNow=P.d.filter(d=>d.av==='now').length, nOwn=pl.all.filter(x=>x.own).length;
  h+=`<div class="pandets"><details class="box"${window.__panAllOpen?" open":""} data-panall><summary class="pansum"><b>All decorations</b> <span class="small muted">${P.d.length} in the Global client · ${nNow} you can get now · you own ${nOwn}. Click to open.</span></summary>
    <div class="panctl" style="margin:10px 0"><div class="seg" role="group" aria-label="Slot type">${[['all','All'],['C','Colossus'],['S','Statue'],['A','Artwork']].map(([k,t])=>`<button type="button" data-panslot="${k}" aria-pressed="${filt===k}">${t}</button>`).join('')}</div>
      <label class="small panall"><input type="checkbox" data-panall="1" ${showAll?'checked':''}> Also show ones you can't get yet</label></div>
    <div class="tablewrap"><table class="pantable"><thead><tr><th class="num">Own</th><th>Decoration</th><th>Slot</th><th>Stats</th><th class="num">Value</th><th>How to get it</th><th>Effort</th></tr></thead><tbody>
    ${rows.map(x=>`<tr class="${x.own?'panrowown':''}"><td class="num">${chk(x)}</td><td><span class="panname">${panIco(x.d)}<span>${panName(x.d)}<small class="muted">${esc(x.d.g)} · ${PAN_FACN[x.d.f]}${x.d.tr?' · tradable':''}</small></span></span></td><td class="small">${PAN_SLOTN[x.d.s]}</td><td class="small">${panStats(x.d,w)}</td><td class="num small">${x.v>0?panPct(x.v):'—'}</td><td class="small">${panHow(x,fac)}</td><td>${panEffTag(x.ef,x,fac)}</td></tr>`).join('')}
    </tbody></table></div></details>`;
  // ---- stat legend
  h+=`<details class="box" data-pandet="stats"${PAN_OPEN.stats?' open':''}><summary class="pansum"><b>What the god stats do</b> <span class="small muted">and what 10 points are worth to a ${esc(cls)} (${m==='pvp'?'PvP':'PvE'}). Click to open.</span></summary>
    <div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>Stat [god]</th><th>Each point gives +0.1% to</th><th class="num">10 points ≈</th></tr></thead><tbody>
    ${statOrder.map(k=>`<tr><td class="small"><b>${P.stats[k][0]}</b> [${P.stats[k][1]}]</td><td class="small">${P.stats[k][2]}</td><td class="num small">${panPct(10*(w[k]||0))}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted" style="margin:8px 0 0">Damage stats (Wisdom = Double, Destruction = Attack, Time = Combat Speed, Illusion = Cooldown, Death = Crit) use the guide's DPS simulator. HP, Defense, Block, Accuracy and MP stats can't be simulated: they use the guide's role priorities (${SLUG==='templar'?'tank: Justice, Space and Life count a lot':SLUG==='cleric'?'healer: Life, Destiny and Wisdom count more':SLUG==='chanter'?'support: Life and Destiny count a bit':'damage dealer: they count very little'}), and PvP values are estimates.${SLUG==='brawler'?' Brawler has no simulator data: these are the Gladiator/Assassin averages.':''}</p></details>`;
  // ---- Korea-only + notes
  if((P.kr||[]).length) h+=`<details class="box" data-pandet="kr"${PAN_OPEN.kr?' open':''}><summary class="pansum"><b>Korea only, not on Global yet</b> <span class="small muted">${P.kr.length} Season 2/3 decorations. Click to open.</span></summary>
    <p class="small muted">Korean client data (gamers4life), listed so you know what is coming. They are not in the Global game.</p>
    <div class="tablewrap"><table><thead><tr><th>Decoration</th><th>Slot</th><th>Stats</th><th class="num">Value</th></tr></thead><tbody>${P.kr.map(d=>`<tr><td class="small">${panName(d)}</td><td class="small">${PAN_SLOTN[d.s]}</td><td class="small">${panStats(d,w)}</td><td class="num small">${panPct(panVal(d,w))}</td></tr>`).join('')}</tbody></table></div></details>`;
  h+=`<details class="box" data-pandet="know"${PAN_OPEN.know?' open':''}><summary class="pansum"><b>Good to know</b> <span class="small muted">opening it, upgrading, per-character rules, sources. Click to open.</span></summary><div class="small" style="margin-top:10px"><ul class="plain">
    <li><b>Opening it:</b> the level-22 Ascension quest <i>The One Who Hears the Voice</i> adds the Pantheon to your menu. Put a decoration in from your bag, then place it in a slot of its own type.</li>
    <li><b>Upgrading:</b> there is no enhancing; you swap in a better decoration. Each decoration counts once, so you need 12 different Artworks.</li>
    <li><b>Per character:</b> the decorations you get are bound to that character, and shop limits are 1 per character. Tradable ones (field-boss, dungeon and Abyss drops) can go through the Market. One guide says you can save 3 layouts, handy for a PvE and a PvP set.</li>
    <li><b>Not sure yet:</b> one database lists these decorations under a rented Legion Hall instead; the item text says "Placing it in the Pantheon grants the effect". Sources for Dream Fragment, Artifact of Eternity and Asahr's Mirror come from one guide, not the client data. Wisdom's value assumes bosses don't resist Double (Global boss Double Resist is unknown).</li></ul>
    <p class="muted" style="margin:6px 0 0">Sources: metabot.gg (Global client: decorations, stats, drops, shops, Substance Morph, achievements, quests, icons), sportskeeda.com and gamesfuze.com (Pantheon guides), gamers4life (Korean client data), the guide's DPS simulator (stat values). Checked 18 Oct 2026.</p></div></details></div>`;
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

document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.matches&&d.matches('details[data-panall]'))window.__panAllOpen=d.open;
  const k=d&&d.dataset&&d.dataset.pandet; if(k){if(d.open)PAN_OPEN[k]=1;else delete PAN_OPEN[k];try{sessionStorage.setItem('aion2fm-pandet',JSON.stringify(PAN_OPEN))}catch(e){}}},true);

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
  if(r.s==='rs') return 'Black Cloud Merchant (Shop menu, <span class="kbd">H</span>): random stock, new every hour, Kina';
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
/* drop-downs inside #closetbox: open/closed survives the re-render after every tick, input or filter (and a reload, this visit) */
const CLO_FIRST=3; // easiest wins shown before the "more steps" drop-down
let CLO_OPEN={}; try{CLO_OPEN=JSON.parse(sessionStorage.getItem('aion2fm-clodet')||'{}')||{}}catch(e){CLO_OPEN={}}
function cloDet(k,title,sum,body,nested){return `<details class="${nested?'coldet':'box'}" data-clodet="${k}"${CLO_OPEN[k]?' open':''}><summary class="pansum"><b>${title}</b> <span class="small muted">${sum} Click to open.</span></summary>${body}</details>`}
document.addEventListener('toggle',e=>{const d=e.target,k=d&&d.dataset&&d.dataset.clodet; if(!k) return;
  if(d.open)CLO_OPEN[k]=1;else delete CLO_OPEN[k]; try{sessionStorage.setItem('aion2fm-clodet',JSON.stringify(CLO_OPEN))}catch(e){}},true);
{const st=document.getElementById('pandetcss')||document.createElement('style'); if(!st.id){st.id='pandetcss';
  /* closed secondary drop-downs sit side by side on wide screens; an open one takes the full row */
  st.textContent='.pandets{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:14px;min-width:0}.panmain{display:grid;gap:14px;min-width:0}.panmain>*{min-width:0}@media (min-width:1000px){.panmain{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto 1fr;grid-template-areas:"best top" "best wins";align-items:start}.panmain>.pantop{grid-area:top}.panmain>.panbest{grid-area:best}.panmain>.panwins{grid-area:wins}}.pandets>details[open]{grid-column:1/-1}.pandets>details{min-width:0}.pandets>details>summary.pansum::before,details.coldet[data-pandet]>summary::before,details.coldet[data-clodet]>summary::before{content:"▸";color:var(--gold)}.pandets>details[open]>summary.pansum::before,details.coldet[data-pandet][open]>summary::before,details.coldet[data-clodet][open]>summary::before{content:"▾"}';
  document.head.appendChild(st)}}
function renderCloset(){
  const host=$('closetbox'); if(!host||!colOK('closet')) return;
  const K=COLLECT.closet, st=cloState(), cls=colCls(), m=colMode(), g=S.gget('gsv',{});
  const wcat=st.cats[0], view=S.get('clocat',wcat.c), missOnly=!!S.get('clomiss',false), cnt=S.gget('clocnt','');
  const chk=r=>`<input type="checkbox" class="colchk" data-gsv="clo-${r.id}" ${g['clo-'+r.id]?'checked':''} aria-label="I own ${esc(r.n)}">`;
  const nm=r=>`<b style="color:${colGC(r.g)}">${esc(r.n)}</b>`;
  const per10=ct=>colPct(10*ct.v,2);
  let h=`<div class="box coltop"><p class="small" style="margin:0">For a <b>${esc(cls)}</b>, 10 Closet points are worth about <b>${per10(st.cats[0])}</b> damage in <b>${esc(wcat.short)}</b> skins, <b>${per10(st.cats[1])}</b> in Earring skins and <b>${per10(st.cats[2])}</b> in Necklace skins. Armor skins (helm to cloak) only add Defense to that piece, and skins for other weapons do nothing for you except count toward the skin titles.</p>
    ${SLUG==='brawler'?'<p class="small" style="margin:0"><b>Brawler is Korea only:</b> the Global client has 1 Fist skin, so only the accessory tracks apply.</p>':''}
    <div class="panbar"><span>Now <b>${colPct(st.now)}</b> damage</span><span>With every skin you can buy or farm now <b>${colPct(st.reach)}</b></span><span>Whole collection <b>${colPct(st.all)}</b></span></div>
</div>`;
  const ptsH=cloDet('pts','Your Closet points',`${st.cats.slice(0,3).map(ct=>esc(ct.short)+' '+(ct.man==null?'est. '+ct.est:ct.man)).join(' · ')}. Type yours from the game.`,`<div style="display:grid;gap:10px;margin-top:10px"><div class="colpts">${st.cats.map(ct=>`<label class="colpt"><span class="small muted">${esc(ct.short)} points in game</span><input type="number" min="0" max="500" inputmode="numeric" data-clopt="${ct.c}" value="${ct.man==null?'':ct.man}" placeholder="${ct.est}"><small class="muted">${ct.man==null?`estimate from ticks: ${ct.est}`:`your ticks add up to about ${ct.est}`}</small></label>`).join('')}
      <label class="colpt"><span class="small muted">Skins owned (all slots)</span><input type="number" min="0" max="2000" inputmode="numeric" data-clocnt="1" value="${cnt}" placeholder="0"><small class="muted">for the skin titles</small></label></div>
    <p class="small muted" style="margin:0">Where to read your points: Closet (character window) › Collection tab, one bar per slot. Leave a box empty and the guide estimates from the skins you tick below (Common 1, Rare 2, Epic 3, Unique 4, Heroic and Special 5 points: one source, not in the game files). The Closet is shared by every character on your server, so ticks here count for all your classes.</p></div>`);
  // ---- titles for skin count
  const n=+cnt||0;
  const titlesH=cloDet('titles','Skin-count titles',`${K.titles.filter(t=>n>=t.need).length} of ${K.titles.length} unlocked (${colNum(n)} skins).`,`<p class="small muted" style="margin:10px 0 8px">Every skin counts here, including other classes' weapons and armor, so cheap skins of any kind push you toward these.</p><div class="coltitles">${K.titles.map(t=>{const done=n>=t.need;return `<div class="coltitle ${done?'on':''}"><b>${esc(t.n)}</b> <span class="small muted">${t.need===701?'over 700':t.need} skins</span><div class="small">${esc(t.eq)}</div>${colTitleRank(t)}<div class="colbar"><i style="width:${Math.min(100,100*n/t.need).toFixed(0)}%"></i></div><small class="muted">${done?'Unlocked':`${colNum(Math.max(0,t.need-n))} to go`}</small></div>`}).join('')}</div>`);
  // ---- easiest wins first
  const miss=[]; st.cats.forEach(ct=>ct.rows.forEach(x=>{if(!x.own) miss.push(Object.assign({ct},x))}));
  const rsMiss=miss.filter(x=>x.r.s==='rs').sort((a,b)=>b.val-a.val);
  const buy=miss.filter(x=>x.r.s==='shop'||x.r.s==='cube').sort((a,b)=>b.val/cloPrice(b.r)-a.val/cloPrice(a.r)||b.val-a.val);
  const cheap=buy.filter(x=>cloEffOf(x.r)<=2), dear=buy.filter(x=>cloEffOf(x.r)>2);
  const noneMiss=miss.filter(x=>x.r.s==='none');
  const stepItem=x=>`<li><label class="panstephead">${cloIco(x.r)}<span>${nm(x.r)} <span class="small muted">${esc(x.ct.short)} · ${esc(x.r.g)}</span> ${colEff(cloEffOf(x.r))} <b class="panval">${colPct(x.val)}</b></span></label><div class="small">${cloHow(x.r)}</div></li>`;
  const sumv=a=>a.reduce((t,x)=>t+x.val,0);
  const SL=[];
  let steps=`<li><b>Use the skin items you already have.</b> <div class="small">Open your bag (<span class="kbd">I</span>) and use every item named "(Skin: …)": it unlocks the look in the Closet and adds its points. If the Closet says you already own it, keep the item for Skin Combine instead.</div></li>`;
  SL.push(steps); steps='';
  if(rsMiss.length) steps+=`<li><b>Check the Black Cloud Merchant every hour, on every character.</b> ${colEff(1)} <b class="panval">up to ${colPct(sumv(rsMiss))}</b><div class="small">Shop menu (<span class="kbd">H</span>) › Black Cloud Merchants. Free new stock every hour, different on each character, and the Closet is shared on your server, so alts give you extra rolls. A paid refresh starts at 500 Kina (the 10th costs 15,000). Buy any of these ${rsMiss.length} when they show up, best first: ${rsMiss.slice(0,10).map(x=>`<span style="color:${colGC(x.r.g)}">${esc(x.r.n)}</span> <span class="muted">(${esc(x.ct.short)})</span>`).join(', ')}${rsMiss.length>10?`, and ${rsMiss.length-10} more in the table below`:''}.</div></li>`;
  if(steps) SL.push(steps); steps='';
  steps+=`<li><b>Extract the gear you replace instead of selling it.</b> ${colEff(1)}<div class="small">Item Extraction can give a random skin (one guide: about 25% from Common to Epic gear, 10% from Unique and Heroic; Korean players say guards and rings never give skins). Every new skin counts toward the titles even when it is not for your slots.</div></li>`;
  SL.push(steps); steps='';
  cheap.slice(0,10).forEach(x=>SL.push(stepItem(x)));
  if(noneMiss.length) SL.push(`<li><b>Combine spare skins.</b> ${colEff(2)}<div class="small">Skin Combine turns spare skins into a random skin of the same grade, or one grade higher: Common 25% (600 Kina), Rare 20% (1,000), Epic 15% to Unique (6,000). ${noneMiss.length} of your ${esc(wcat.short)}/Earring/Necklace Uniques have no shop or drop, so Combine is the way to them. Save Lucky Auras (+10% upgrade chance; achievements give 18 Lucky Aura, 14 Rare and 1 Epic) for Epic combines. Results are random across all slots, so combine for the skin count, not for one look.</div></li>`);
  dear.slice(0,6).forEach(x=>SL.push(stepItem(x)));
  const restS=SL.slice(CLO_FIRST);
  h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Easiest wins first</h3><p class="small muted" style="margin:0">Work down the list. Values are damage for a ${esc(cls)} from that skin's points (estimated points by grade). Tick the skins you own in the table below and this list moves on.</p><ol class="pansteps">${SL.slice(0,CLO_FIRST).join('')}</ol>${restS.length?cloDet('moresteps',`Steps ${CLO_FIRST+1} to ${SL.length}`,`the next ${restS.length} skins and tips, cheapest damage first.`,`<ol class="pansteps" start="${CLO_FIRST+1}" style="margin-top:10px">${restS.join('')}</ol>`,1):''}</div>`;
  // ---- full table
  const ct=st.cats.find(x=>x.c===view)||wcat;
  const rows=ct.rows.filter(x=>!missOnly||!x.own).sort((a,b)=>(a.own-b.own)||(cloEffOf(a.r)-cloEffOf(b.r))||b.val-a.val||a.r.n.localeCompare(b.r.n));
  h+=`<div class="pandets">${ptsH}${titlesH}<details class="box" data-clodet="slots"${CLO_OPEN.slots?' open':''}><summary class="pansum"><b>Your Closet slots</b> <span class="small muted">tick yours: ${st.cats.map(c=>`${esc(c.short)} ${c.rows.filter(x=>x.own).length}/${c.rows.length}`).join(' · ')}. Click to open.</span></summary>
    <div class="panctl" style="margin:10px 0"><div class="seg" role="group" aria-label="Closet slot">${st.cats.map(c=>`<button type="button" data-clocat="${c.c}" aria-pressed="${c.c===ct.c}">${esc(c.short)} (${c.rows.length})</button>`).join('')}</div>
    <label class="small panall"><input type="checkbox" data-clomiss="1" ${missOnly?'checked':''}> Missing only</label></div>
    ${rows.length?`<div class="tablewrap"><table class="pantable coltable"><thead><tr><th class="num">Own</th><th>Skin</th><th class="num">Points</th><th class="num">Damage</th><th>How to get it</th><th>Effort</th></tr></thead><tbody>
    ${rows.map(x=>`<tr class="${x.own?'panrowown':''}"><td class="num">${chk(x.r)}</td><td><span class="panname">${cloIco(x.r)}<span>${nm(x.r)}<small class="muted">${esc(x.r.g)}</small></span></span></td><td class="num small">${x.r.p}${x.r.g==='Special'?'?':''}</td><td class="num small">${colPct(x.val)}</td><td class="small">${cloHow(x.r)}</td><td>${colEff(cloEffOf(x.r))}</td></tr>`).join('')}</tbody></table></div>`:'<p class="small muted">Nothing to show.</p>'}</details>`;
  // ---- how it works
  const W=K.wv[SLUG]||K.wv.ranger;
  h+=`<details class="box" data-clodet="how"${CLO_OPEN.how?' open':''}><summary class="pansum"><b>How the Closet bonus works</b> <span class="small muted">18 slots, 500 points each, Skin Combine odds. Click to open.</span></summary>
    <ul class="plain small" style="margin-top:10px">
      <li><b>Each point = +0.1%, up to 500 points (+50%) per slot.</b> Only the first copy of a skin counts. Shoulder, eye and face accessories give nothing; launch Atelier (cash-shop) skins give no points.</li>
      <li><b>Weapon slots</b> raise that weapon type's Attack ("${esc(wcat.short)} Attack increase"), so only your own weapon's skins help. Korean testing puts it on your weapon's Attack, before Weapon Damage Boost and Attack Increase. With a typical level-45 ${esc(cls)} weapon (about ${colNum(W.wav)} average Attack) each point is about ${colPct(W.w,3)} damage.</li>
      <li><b>Necklace and Earrings</b> raise that piece's Attack and Defense by 0.1% a point (about 120 Attack on a level-45 necklace, about 100 on each of your two earrings). The 7 armor slots raise that piece's Defense only.</li>
      <li><b>Centurion and Decanus</b> are the only skins with stats while worn: +1% PvP Damage Tolerance per armor piece, +2% PvP Damage Boost for the earrings and the necklace. Decanus gives the same for under a third of the Abyss Points.</li></ul>
    <div class="tablewrap" style="margin-top:8px"><table><thead><tr><th>Skin Combine</th><th>Kina</th><th>Result</th><th>Designs (same / next grade)</th></tr></thead><tbody>${K.combine.map(r=>`<tr><td class="small">${r[0]}</td><td class="small">${r[1]}</td><td class="small">${r[2]}</td><td class="small">${r[3]}</td></tr>`).join('')}</tbody></table></div>
    <p class="small muted" style="margin:8px 0 0"><b>Not sure yet:</b> points per grade (Common 1 to Heroic 5) come from one fan guide, not the client; Special skins are assumed to be worth 5. The extraction skin chance is from one guide. Damage values use the guide's DPS simulator (Attack value of a typical level-45 ${esc(cls)}), are the same in PvP${m==='pvp'?' (estimate)':''}, and assume the earring bonus applies to both earrings. Sources: metabot.gg (Global client: skins, sources, prices, collection bonus, Combine odds), dtgre.com (points by grade), gamerblurb.com (Black Cloud Merchant), Korean community tests (inven.co.kr). Checked 18 Oct 2026.</p></details></div>`;
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
  const allKey='kib-all-'+f, allDone=!!sv[allKey], got=k=>allDone||!!sv[k.id];
  const n=list.filter(got).length, map=f==='E'?'Verteron':'Altgard';
  const tiers=[[2000,'Towns and camps on your quest path'],[3000,'Mid-level zones'],[4000,'Sky islands, cliffs and the far corners (fly there)']];
  const row=k=>`<tr class="${got(k)?'panrowown':''}"><td class="small">${got(k)?'<span class="muted">✓ </span>':''}<b>${esc(k.n)}</b></td><td class="small">${esc(k.zone||'')}</td><td class="small">${esc(k.lvl||'')}</td><td class="num small">${colNum(k.k)}</td></tr>`;
  const st=M.kibstatue;
  let h=`<div class="box coltop"><h3 style="margin:0">Kibelisks: activate all ${list.length} in ${map}</h3>
    <p class="small" style="margin:0">Walk up to every Kibelisk (teleport stone) on ${map} once. Each one pays 2,000 to 4,000 Kina (Bound), and all ${list.length} complete <i>${esc(fin?fin.n:'')}</i>: ${colTitle(M.kibtitle)}${st?`, plus <b>Statue: ${esc(st.n)}</b> for the <a href="#pantheon" data-goto="pantheon">Pantheon</a> (${Object.keys(st.st).map(k=>`${(M.stats[k]||[k])[0]} +${st.st[k]}`).join(', ')})`:''} and 9,000 Kina.</p>
    <label class="gchk" style="justify-self:start"><input type="checkbox" class="colchk" data-sv="${allKey}" ${allDone?'checked':''}><span>All ${list.length} on ${map} activated</span></label>
    <div class="panbar"><span>Activated <b>${n} / ${list.length}</b></span><span>Kina left <b>${colNum(list.filter(k=>!got(k)).reduce((a,k)=>a+k.k,0))}</b></span></div>
    <p class="small muted" style="margin:0">One tick for the whole map, saved per character. Activated Kibelisks show as destinations on the World Map (<span class="kbd">M</span>), which also has a Kibelisk list for your map: anything missing there is still to do. The lists below are by area.</p></div>`;
  const firstOpen=tiers.findIndex(([kk])=>list.some(x=>x.k===kk&&!got(x)));
  h+=tiers.map(([k,t],i)=>{const ks=list.filter(x=>x.k===k), left=ks.filter(x=>!got(x)).length;return `<details class="box"${i===firstOpen?' open':''}><summary class="pansum"><b>${i+1}. ${t}</b> <span class="small muted">${ks.length} Kibelisks · ${colNum(k)} Kina each · ${left} left</span></summary>
    <div class="tablewrap" style="margin-top:10px"><table class="pantable"><thead><tr><th>Kibelisk</th><th>Zone</th><th>Zone level</th><th class="num">Kina</th></tr></thead><tbody>${ks.map(row).join('')}</tbody></table></div></details>`}).join('');
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
  const chk=r=>sv[r.id]?'<span class="muted" title="Marked done earlier">✓ </span>':'';  // read-only: the game tracks achievements
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
    <div class="panbar"><span>Season 1 achievements <b>${season.length}</b></span></div>
    <p class="small muted" style="margin:0">The game tracks your achievements: open the Journal / Achievements menu to see your tiers. The lists below are a reading guide, best value first.</p></div>`;
  h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Easiest wins first</h3><p class="small muted" style="margin:0">Biggest reward for the least effort. Rewards count titles you would equip, Soul Codex, Amplify Stones, Oath Coin, Pantheon decorations, Lucky Auras and Hidden Cube keys the most.</p><ol class="pansteps">${easy.map(item).join('')}</ol></div>`;
  if(best.length) h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Best rewards (harder)</h3><ol class="pansteps">${best.map(item).join('')}</ol></div>`;
  const gsort=A.groups.slice().sort((a,b)=>b.season-a.season||a.eff-b.eff||a.n.localeCompare(b.n));
  h+=`<div class="box" style="display:grid;gap:8px"><h3 style="margin:0">All achievements by group</h3>${gsort.map(g=>{const left=g.rows.filter(r=>!sv[r.id]).length;return `<details class="coldet"><summary class="pansum"><b>${esc(g.n)}</b> <span class="small muted">${g.season?'Season 1 (until '+esc(A.seasonEnd)+') · ':''}${A.effn[g.eff]} · ${g.rows.length} achievements${g.id==='sanctuary'?' · the Ludra raid is offline on Global for a rework':''}</span></summary>
    <div class="tablewrap" style="margin-top:8px"><table class="pantable coltable"><thead><tr><th>Achievement</th><th>Goal (first tier)</th><th>Tiers</th><th>All tiers pay</th></tr></thead><tbody>${g.rows.slice().sort((a,b)=>b.sc-a.sc).map(r=>`<tr class="${sv[r.id]?'panrowown':''}"><td class="small">${chk(r)}<b>${esc(r.n)}</b></td><td class="small">${esc(r.goal)}</td><td class="small">${esc(r.t)}</td><td class="small">${r.ti?achTitle(r)+'<br>':''}${achRew(r)}</td></tr>`).join('')}</tbody></table></div></details>`}).join('')}</div>`;
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
  if(!best&&p.kinah) best={e:1,t:'Kina',kind:'kinah'};
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
    ${top.length?`<ol class="pgsteps">${top.map(x=>`<li><label class="pgstephead">${pgIco(x.p)}<span><b>${pgE(x.p.n)}</b> ${pgFtag(x.p.f)} ${pgEff(x)} <span class="pgval" title="Value for a ${pgE(cn)} (100 = best)">value ${pgV(x.v)}</span></span></label>
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
  h+=`<details class="box" data-pgd="all" ${PG_OPEN.all===true?"open":""}><summary class="pgsum"><b>All pets</b> <span class="small muted">${P.d.length} in the Global client · you own ${nOwn} · easiest first</span></summary>
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
.pgfam{display:inline-block;font:600 12px var(--f-mono);letter-spacing:.04em;padding:1px 7px;border-radius:999px;border:1px solid color-mix(in srgb,var(--fc) 55%,transparent);color:var(--fg);white-space:nowrap}
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
  // enhance these first: cheapest owned-bonus gain per million Kina (Rare/Epic wings that grow a stat)
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
    <p class="small muted" style="margin:0">Do these in order: each one is the most gain for the least effort from where you are now (its owned bonus, plus how much better it is to wear than your best one, plus a step toward the wing titles). Tick the wings you own in the All wings table and the list moves on.${L<45?` Set for level ${L}: wings that need a higher level wait below.`:''}</p>
    ${pl.steps.length?`<ol class="wgsteps">${pl.steps.map(st=>{const x=st.x;return `<li><label class="wgstephead">${wgIco(x.d)}<span>${wgName(x.d)} ${wgEffTag(x)} <span class="wgval" title="Gain for a ${wgE(cn)}">${wgPct(st.gain)}</span>${st.up>=0.005?` <span class="small muted">(wear upgrade ${wgPct(st.up)})</span>`:''}${x.d.tr?' <span class="tag">Market</span>':''}</span></label>
      ${wgSteps(x.d,fac)}${x.d.note?`<div class="small muted">${wgE(x.d.note)}</div>`:''}</li>`}).join('')}</ol>`
      :`<p class="callout ok small" style="margin:0">You own every wing you can get right now.</p>`}
    ${pl.later.length?`<p class="small muted" style="margin:0">At a higher level: ${pl.later.map(x=>`${wgE(x.d.n)} (Lv ${x.d.lv})`).join(', ')}.</p>`:''}</div>`;
  // ---- enhance these first
  h+=`<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">Enhance these first</h3>
    <p class="small muted" style="margin:0">Enhancing only raises the <b>owned</b> bonus: +10 Flight Power per level on every wing, plus one growing stat on most Epic and Rare wings. Set each wing's level in the table (Lv box) and this list updates. Sorted by gain per million Kina.</p>
    ${pl.enhUse.length?`<div class="tablewrap"><table class="wgenh"><thead><tr><th>Wing</th><th>Grows</th><th class="num">Gain</th><th class="num">Kina to +10</th><th class="num">Sync Stones</th><th class="num">Enhance Stones</th></tr></thead><tbody>
      ${pl.enhUse.map(z=>`<tr><td><span class="wgname">${wgIco(z.x.d)}<span>${wgName(z.x.d)}<small class="muted">+${z.x.lv} → +10 · always succeeds</small></span></span></td><td class="small">${Object.keys(z.x.d.grow).map(k=>wgFmt(k,z.x.d.grow[k]*(10-z.x.lv))).join(', ')}, Flight Power +${z.fp}</td><td class="num small">${wgPct(z.gain)}</td><td class="num small">${Math.round(z.k).toLocaleString('en-US')}</td><td class="num small">${Math.round(z.s)}</td><td class="num small">${Math.round(z.e).toLocaleString('en-US')}</td></tr>`).join('')}</tbody></table></div>`
      :`<p class="small" style="margin:0">${pl.owned.some(x=>x.d.trk&&x.d.trk!=='U')?'Nothing useful left to enhance for this mode.':'Tick an Epic or Rare wing (for example Intermediate or Superior Daeva Wings) to see what is worth enhancing.'}</p>`}
    ${pl.enhFp.length?`<p class="small" style="margin:0"><b>Leave for last:</b> ${pl.enhFp.map(z=>wgE(z.x.d.n.replace(' Wings',''))).join(', ')}. For you they gain little beyond Flight Power (+10 per level; a Unique wing to +10 averages about 16.7M Kina). A new wing adds +200 Flight Power, more than taking one wing from +0 to +10.</p>`:''}</div>`;
  // ---- collection + titles
  const T=P.tiers, nx=T.find(t=>t[0]>nOwn), freeLeft=pl.all.filter(x=>!x.own&&x.d.av==='now').sort((a,b)=>(a.ef<0?9:a.ef)-(b.ef<0?9:b.ef)||b.ov0-a.ov0);
  const t12=P.titles['12'], t25=P.titles['25'];
  h+=`<div class="box" style="display:grid;gap:12px"><h3 style="margin:0">Your collection and the wing titles</h3>
    <div class="wgbar"><span>Owned <b>${nOwn} / ${P.d.length}</b></span><span>Flight Power from wings <b>${Math.round(pl.fp).toLocaleString('en-US')}</b></span><span>Owned bonuses now <b>${wgPct(pl.ownSum)}</b></span><span>All you can get at +10 <b>${wgPct(pl.ownMax)}</b></span></div>
    <div class="wgmeter" role="img" aria-label="${nOwn} of 25 wings for the title"><i style="width:${Math.min(100,Math.round(100*nOwn/25))}%"></i>${T.map(t=>`<span class="wgtick ${nOwn>=t[0]?'on':''}" style="left:${100*t[0]/25}%" title="${t[0]} wings: ${wgE(t[1])}">${t[0]}</span>`).join('')}</div>
    <p class="small" style="margin:0">Achievement <b>Veteran Wing Collector</b> (3 / 7 / 12 / 18 / 25 wings) pays Hidden Cube Keys and Kina on the way, ${nx?`next at <b>${nx[0]}</b> wings (${nx[0]-nOwn} to go): ${wgE(nx[1])}.`:'and you have finished it.'}</p>
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
  h+=`<details class="box" data-wgd="enh" ${WG_OPEN.enh?'open':''}><summary class="wgsum"><b>Enhancement rules and costs</b> <span class="small muted">odds, pity, Kina, Sync Stones</span></summary>
    <ul class="plain small" style="margin:10px 0 0">
      <li><b>What it raises:</b> only the owned bonus (Flight Power +10 per level, +200 → +300; plus the growing stat on Epic/Rare wings). Worn stats never change. Lesser Daeva and Special wings have no track.</li>
      <li><b>Rare:</b> +0 → +10 always succeeds: 3,494,000 Kina, 34 Sync Stones, 13,440 Enhance Stones. <b>Epic:</b> always succeeds: 5,960,000 Kina, 53 Sync Stones, 23,040 Enhance Stones.</li>
      <li><b>Unique:</b> safe to +3, then ${U.p.slice(3).map((p,i)=>`+${i+4} ${p}%`).join(', ')}. Each fail adds +10% to the next try at that level and never drops the level; on average about 16.7M Kina, 137 Sync Stones and 66,000 Enhance Stones to +10 (worst luck 50.3M).</li>
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
.wgtick{position:absolute;top:10px;transform:translateX(-50%);font:600 12px var(--f-mono);color:var(--muted)}
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

/* ---------- live timers (Daily & weekly tab + "next up" strip on Start here) ----------
   Data: global TIMERS (audit/r7/timers.json, injected by build_hub.py). No network calls: every time is computed in
   the browser from the fixed schedule rules. Rule types (all times are wall-clock times in rule.tz, an IANA zone or "UTC"):
     daily    {time:"07:00"}                         every day
     weekly   {days:[3], time:"07:00"}               days: 0=Sun … 6=Sat
     times    {times:["11:00","19:00"], days?:[…]}   fixed list of times (optionally only on some weekdays)
     interval {everyH:3, anchor:"01:00", days?:[…]} every N hours from the anchor, restarting each day at the anchor
     range    {start:ISO, end:ISO}                   one-off window (events, seasons): counts down to the start, then to the end
   rule.dur = minutes the thing stays open after it starts ("open now" state). */
var A2T=(function(){
  const fmtCache={};
  function partsFmt(tz){return fmtCache[tz]||(fmtCache[tz]=new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric',weekday:'short'}))}
  const WD={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  /* wall-clock parts of instant t in zone tz */
  function wall(t,tz){
    if(tz==='UTC'){const d=new Date(t);return {y:d.getUTCFullYear(),mo:d.getUTCMonth()+1,d:d.getUTCDate(),h:d.getUTCHours(),mi:d.getUTCMinutes(),s:d.getUTCSeconds(),dow:d.getUTCDay()}}
    const o={};partsFmt(tz).formatToParts(new Date(t)).forEach(p=>{o[p.type]=p.value});
    return {y:+o.year,mo:+o.month,d:+o.day,h:(+o.hour)%24,mi:+o.minute,s:+o.second,dow:WD[o.weekday]};
  }
  /* offset of tz at instant t, in ms (local = utc + off) */
  function off(t,tz){if(tz==='UTC')return 0;const w=wall(t,tz);return Date.UTC(w.y,w.mo-1,w.d,w.h,w.mi,w.s)-Math.floor(t/1000)*1000}
  /* wall time in tz -> UTC ms. In a spring-forward gap the time is moved forward by the gap; in a fall-back overlap the first one wins. */
  function toUtc(y,mo,d,h,mi,tz){
    const g=Date.UTC(y,mo-1,d,h,mi);if(tz==='UTC')return g;
    const o1=off(g,tz),o2=off(g-o1,tz),o3=off(g-o2,tz);
    const ok=[g-o1,g-o2,g-o3].filter(c=>off(c,tz)===g-c);
    if(ok.length)return Math.min.apply(null,ok);   /* fall-back overlap: the first of the two */
    return g-Math.min(o1,o2,o3);                    /* spring-forward gap: moved forward by the gap */
  }
  const hm=s=>{const a=String(s).split(':');return [+a[0],+(a[1]||0)]};
  /* all start instants of rule between a and b (ms) */
  function starts(r,a,b){
    const out=[];
    if(r.type==='range'){const s=Date.parse(r.start);if(!isNaN(s))out.push(s);return out}
    const tz=r.tz||'UTC';
    const w0=wall(a-36e5*30,tz);let day=Date.UTC(w0.y,w0.mo-1,w0.d);
    const endDay=b+36e5*30;
    for(let guard=0;guard<400&&day<=endDay;guard++,day+=864e5){
      const dd=new Date(day),y=dd.getUTCFullYear(),mo=dd.getUTCMonth()+1,d=dd.getUTCDate(),dow=dd.getUTCDay();
      let list=[];
      if(r.type==='daily')list=[r.time];
      else if(r.type==='weekly'){if((r.days||[]).includes(dow))list=[r.time]}
      else if(r.type==='times'){if(!r.days||r.days.includes(dow))list=r.times||[]}
      else if(r.type==='interval'){if(!r.days||r.days.includes(dow)){const [ah,am]=hm(r.anchor||'00:00');const n=r.everyH||24;for(let k=0;ah+k*n<24;k++)list.push((ah+k*n)+':'+am);
        for(let k=1;ah-k*n>=0;k++)list.push((ah-k*n)+':'+am);}}
      for(const x of list){const [h,mi]=hm(x);const t=toUtc(y,mo,d,h,mi,tz);if(t>=a&&t<=b)out.push(t)}
    }
    return out.sort((x,y)=>x-y);
  }
  /* current/next window of a rule: {start,end,open,ended} */
  function next(r,now){
    if(!r)return null;
    if(r.type==='range'){const s=Date.parse(r.start),e=Date.parse(r.end);
      if(!isNaN(e)&&now>=e)return {start:s,end:e,open:false,ended:true};
      if(!isNaN(s)&&now<s)return {start:s,end:e,open:false};
      return {start:isNaN(s)?null:s,end:isNaN(e)?null:e,open:true}}
    const dur=(r.dur||0)*6e4;
    /* one-off overrides: over:[{at,dur,text}] changes the length of the start at 'at' (e.g. a longer maintenance) */
    const ov=s=>(r.over||[]).find(o=>Math.abs(Date.parse(o.at)-s)<6e4);
    const ss=starts(r,now-Math.max(dur,...(r.over||[]).map(o=>o.dur*6e4))-864e5,now+864e5*15);
    for(const s of ss){const o=ov(s),d=o?o.dur*6e4:dur,tx=o&&o.text;if(d>0&&s<=now&&s+d>now)return {start:s,end:s+d,open:true,text:tx};if(s>now)return {start:s,end:s+d,open:false,text:tx}}
    return null;
  }
  function dur(ms){ms=Math.max(0,ms);const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;const p=n=>String(n).padStart(2,'0');
    if(d>0)return d+'d '+h+'h '+p(m)+'m';if(h>0)return h+'h '+p(m)+'m '+p(x)+'s';return m+'m '+p(x)+'s'}
  return {wall,off,toUtc,starts,next,dur};
})();
(function(){
  if(typeof document==='undefined')return;
  const T=(typeof TIMERS!=='undefined'&&TIMERS)?TIMERS:null;
  const E=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const st=()=>{const v=(typeof S!=='undefined'&&S.gget)?S.gget('timers',null):null;return v&&typeof v==='object'?v:{}};
  const save=v=>{if(typeof S!=='undefined'&&S.gset)S.gset('timers',v)};
  const BELL='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  const CONF={high:['Official','ok'],medium:['2+ sources','ok'],low:['1 source','warn'],unconfirmed:['Unconfirmed','warn']};
  /* region keys come from the data (NAE, NAW, EU); a saved server is stored as "REGION|Name" because names repeat across regions */
  function region(){const s=st();if(s.region&&T.regions[s.region])return s.region;
    if(s.server&&T.regions[String(s.server).split('|')[0]])return String(s.server).split('|')[0];
    let z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
    if(/^(Europe|Africa)\//.test(z)&&T.regions.EU)return 'EU';
    if(/^America\/(Los_Angeles|Vancouver|Tijuana|Denver|Phoenix|Boise|Edmonton|Anchorage)|^Pacific\/Honolulu/.test(z)&&T.regions.NAW)return 'NAW';
    return T.regions.NAE?'NAE':Object.keys(T.regions)[0]}
  function conf(ev,now){const a=ev.confidenceAfter;return a&&now>=Date.parse(a.at)?a.level:ev.confidence}
  const fmtLocal=(t,withDay)=>{try{return new Intl.DateTimeFormat(undefined,withDay?{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}:{weekday:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(t))}catch(e){return new Date(t).toISOString().slice(0,16).replace('T',' ')}};
  const fmtZone=(t,tz)=>{try{return new Intl.DateTimeFormat('en-GB',{timeZone:tz,weekday:'short',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(new Date(t))}catch(e){return ''}};
  function rowsFor(reg,now){
    const out=[];
    for(const ev of T.events){
      const r=ev.regions&&ev.regions[reg];if(!r)continue;
      const n=A2T.next(r,now);if(!n||n.ended)continue;
      const alts=(ev.alts||[]).map(a=>{const ar=a.regions&&a.regions[reg];const an=ar&&A2T.next(ar,now);return an&&!an.ended?{label:(a.labels&&a.labels[reg])||a.label,rule:ar,n:an}:null}).filter(Boolean);
      out.push({ev,r,n,alts,sortT:n.open?now:(n.start||now)});
    }
    return out;
  }
  function timeText(x,now){
    const n=x.n;
    if(x.r.type==='range'){if(n.open)return n.end?{state:'open',cd:'ends in '+A2T.dur(n.end-now),when:'until '+fmtLocal(n.end,1)}:{state:'open',cd:'running',when:''};
      return {state:'soon',cd:'starts in '+A2T.dur(n.start-now),when:fmtLocal(n.start,1)}}
    if(n.open)return {state:'open',cd:'open now · '+A2T.dur(n.end-now)+' left',when:'closes '+fmtLocal(n.end)};
    return {state:(n.start-now<15*6e4)?'soon':'',cd:'in '+A2T.dur(n.start-now),when:fmtLocal(n.start)+((n.text||x.ev.durText)?' · '+(n.text||x.ev.durText):x.r.dur?' · open '+(x.r.dur>=60?(x.r.dur/60)+' h':x.r.dur+' min'):'')};
  }
  function altText(a,now){const n=a.n;return n.open?('open now, '+A2T.dur(n.end-now)+' left'):('in '+A2T.dur(n.start-now)+' ('+fmtLocal(n.start)+')')}
  let order='',lastReg='';
  function render(){
    const host=document.getElementById('timersbox');if(!host||!T)return;
    const now=Date.now(),reg=region(),s=st();lastReg=reg;
    const rows=rowsFor(reg,now);
    const srvOpts=Object.keys(T.servers).map(r=>`<optgroup label="${E(T.regions[r].label)}">`+T.servers[r].map(x=>{const v=r+'|'+x.name;return `<option value="${E(v)}"${s.server===v?' selected':''}>${E(x.name)}${x.note?' ('+E(x.note)+')':''}</option>`}).join('')+'</optgroup>').join('');
    const bells=s.bells||{};
    const notifOk=typeof Notification!=='undefined';
    const groups=T.categories.map(c=>{const g=rows.filter(x=>x.ev.category===c.id).sort((a,b)=>a.sortT-b.sortT);if(!g.length)return '';
      return `<div class="tmrgrp"><h4>${E(c.name)}</h4><ul class="tmrlist">`+g.map(x=>{
        const ev=x.ev,tt=timeText(x,now),cl=conf(ev,now),cf=CONF[cl]||CONF.unconfirmed;
        const srcs=(ev.sources||[]).map(z=>z.url?`<a href="${E(z.url)}" target="_blank" rel="noopener">${E(z.name)}</a>`:E(z.name)).join(', ');
        const bell=x.r.type==='range'?'':`<button type="button" class="tmrbell" data-tmrbell="${E(ev.id)}" aria-pressed="${bells[ev.id]?'true':'false'}" title="Remind me 5 minutes before" aria-label="Remind me 5 minutes before ${E(ev.name)}"${notifOk?'':' disabled'}>${BELL}</button>`;
        return `<li class="tmrrow" data-tmr="${E(ev.id)}" data-state="${tt.state}">
          <div class="tmrmain"><b>${E(ev.name)}</b> ${cl==='high'||cl==='medium'?'':`<span class="tag tmrconf" title="${cl==='low'?'Only one source':'Sources disagree or the exact time is not published'}">${cf[0]}</span>`}
            ${ev.mainLabel&&x.alts.length?`<span class="tag">${E(ev.mainLabel)}</span>`:''}<span class="tmrcd" data-cd>${E(tt.cd)}</span><span class="small muted tmrwhen" data-when>${E(tt.when)}</span>${bell}</div>
          ${ev.short?`<div class="small muted">${E(ev.short)}</div>`:''}
          ${x.alts.map((a,i)=>`<div class="small tmralt"><span class="tag">${E(a.label)}</span> <span data-alt="${i}">${E(altText(a,now))}</span></div>`).join('')}
          <details class="tmrsrc"><summary class="small muted">Rule and sources</summary><div class="small muted">${E(ev.ruleText&&ev.ruleText[reg]||ev.ruleText&&ev.ruleText.all||'')}${ev.note?' '+E(ev.note):''}${srcs?' Sources: '+srcs+'.':''}</div></details>
        </li>`}).join('')+'</ul></div>'}).join('');
    host.innerHTML=`<div class="tmrhead"><h3 style="margin:0">Timers</h3>
        <label class="small muted tmrpick">Server <select id="tmrserver"><option value="">Pick your server</option>${srvOpts}</select></label>
        <span class="seg tmrreg" role="group" aria-label="Region">${Object.keys(T.regions).map(r=>`<button type="button" data-tmrreg="${r}" aria-pressed="${r===reg}">${E(T.regions[r].label)}</button>`).join('')}</span></div>
      <p class="small muted" style="margin:0">Shown in your time (${E(tzName())}). Times are worked out in this browser from the fixed game schedules for <b>${E(T.regions[reg].long||T.regions[reg].label)}</b>; nothing is downloaded. Maintenance or events can move them, so the in-game timer wins. <span id="tmrnote">${notifOk?'Tap a bell for a reminder 5 minutes before (your browser asks for permission the first time; reminders only work while this page stays open).':'This browser has no notifications, so reminders are off.'}</span></p>
      ${groups}
      <p class="small muted tmrcred" style="margin:0">${T.creditLine||''}</p>`;
    order=rows.map(x=>x.ev.id+':'+x.n.start+':'+x.n.open).join('|');
    renderStrip(rows,now);
  }
  function tzName(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'local time'}catch(e){return 'local time'}}
  function renderStrip(rows,now){
    const host=document.getElementById('timerstrip');if(!host||!T)return;
    const pick=rows.filter(x=>x.r.type!=='range'&&!x.ev.noStrip).sort((a,b)=>a.sortT-b.sortT).slice(0,4);
    host.innerHTML=`<div class="tmrstrip box"><div class="tmrstriphead"><span class="eyebrow">Next up · ${E(T.regions[region()].label)}</span><a href="#daily" data-goto="daily" class="small">All timers</a></div><div class="tmrchips">`+
      pick.map(x=>{const tt=timeText(x,now);return `<div class="tmrchip" data-tmr="${E(x.ev.id)}" data-state="${tt.state}"><b>${E(x.ev.short2||x.ev.name)}</b><span class="tmrcd" data-cd>${E(tt.cd)}</span>${conf(x.ev,now)==='unconfirmed'||conf(x.ev,now)==='low'?'<span class="small muted">unconfirmed</span>':''}</div>`}).join('')+'</div></div>';
  }
  const fired={};
  function remind(rows,now){
    const bells=st().bells||{};if(typeof Notification==='undefined'||Notification.permission!=='granted')return;
    for(const x of rows){if(!bells[x.ev.id]||x.n.open||x.r.type==='range')continue;const left=x.n.start-now,key=x.ev.id+'@'+x.n.start;
      if(left>0&&left<=5*6e4&&!fired[key]){fired[key]=1;try{new Notification(x.ev.name+' in '+Math.ceil(left/6e4)+' min',{body:'AION 2 Field Manual · '+fmtLocal(x.n.start),tag:key})}catch(e){}}}
  }
  function tick(){
    if(!T)return;const now=Date.now();const reg=region();const rows=rowsFor(reg,now);
    remind(rows,now);
    if(document.hidden)return;
    const o=rows.map(x=>x.ev.id+':'+x.n.start+':'+x.n.open).join('|');
    if(o!==order||reg!==lastReg){const f=document.activeElement&&document.activeElement.id;render();if(f&&document.getElementById(f))document.getElementById(f).focus();return}
    const by={};rows.forEach(x=>by[x.ev.id]=x);
    document.querySelectorAll('[data-tmr]').forEach(el=>{const x=by[el.dataset.tmr];if(!x)return;const tt=timeText(x,now);
      const cd=el.querySelector('[data-cd]');if(cd&&cd.textContent!==tt.cd)cd.textContent=tt.cd;
      const w=el.querySelector('[data-when]');if(w&&w.textContent!==tt.when)w.textContent=tt.when;
      if(el.dataset.state!==tt.state)el.dataset.state=tt.state;
      x.alts.forEach((a,i)=>{const z=el.querySelector('[data-alt="'+i+'"]');if(z)z.textContent=altText(a,now)})});
  }
  let iv=null;
  function start(){if(iv)clearInterval(iv);iv=setInterval(tick,document.hidden?20000:1000)}
  document.addEventListener('visibilitychange',()=>{start();if(!document.hidden)tick()});
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='tmrserver'){const s=st();const v=e.target.value||'';delete s.region;
    if(v){s.server=v;const r=v.split('|')[0];if(T.regions[r])s.region=r}else delete s.server;save(s);render()}});
  document.addEventListener('click',e=>{
    const rb=e.target.closest('[data-tmrreg]');if(rb){const s=st();s.region=rb.dataset.tmrreg;if(s.server&&String(s.server).split('|')[0]!==s.region)delete s.server;save(s);render();return}
    const b=e.target.closest('[data-tmrbell]');if(!b)return;
    const id=b.dataset.tmrbell,s=st();s.bells=s.bells||{};
    const on=!s.bells[id];
    const apply=()=>{if(on)s.bells[id]=1;else delete s.bells[id];save(s);b.setAttribute('aria-pressed',on?'true':'false')};
    if(on&&typeof Notification!=='undefined'&&Notification.permission!=='granted'){
      if(Notification.permission==='denied'){const n=document.getElementById('tmrnote');if(n)n.textContent='Notifications are blocked for this page in your browser settings, so reminders cannot be shown.';return}
      try{const p=Notification.requestPermission(r=>{if(r==='granted')apply()});if(p&&p.then)p.then(r=>{if(r==='granted')apply()})}catch(_){}
      return}
    apply();
  });
  window.renderTimers=render;
  if(T&&!document.getElementById('tmrcss')){const c=document.createElement('style');c.id='tmrcss';c.textContent=
    '#timersbox{display:grid;gap:12px;border-color:var(--wind)}'+
    '.tmrhead{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.tmrhead h3{margin-right:auto!important}'+
    '.tmrpick{display:flex;gap:6px;align-items:center}.tmrpick select{background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:6px 8px;font:500 14px var(--f-body);max-width:100%}'+
    '.tmrreg button{padding:6px 12px}'+
    '.tmrgrp h4{margin:4px 0 6px;font:700 12px var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}'+
    '.tmrlist{list-style:none;margin:0;padding:0;display:grid;gap:6px}'+
    '.tmrrow{background:var(--panel2);border:1px solid var(--line);border-left:3px solid var(--line);border-radius:8px;padding:8px 10px;display:grid;gap:3px;min-width:0}'+
    '.tmrrow[data-state="open"]{border-left-color:var(--wind)}.tmrrow[data-state="soon"]{border-left-color:var(--gold)}'+
    '.tmrmain{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;min-width:0}.tmrmain b{flex:1 1 180px;min-width:0}'+
    '.tmrcd{font:600 14px var(--f-mono);color:var(--fg);white-space:nowrap}'+
    '[data-state="open"] .tmrcd{color:var(--wind)}[data-state="soon"] .tmrcd{color:var(--gold)}'+
    '.tmrwhen{white-space:nowrap}'+
    '.tmrbell{background:none;border:1px solid var(--line);border-radius:7px;color:var(--muted);padding:4px 6px;cursor:pointer;display:inline-flex;min-width:32px;min-height:32px;align-items:center;justify-content:center}'+
    '.tmrbell[aria-pressed="true"]{color:var(--bg);background:var(--gold);border-color:var(--gold)}.tmrbell:disabled{opacity:.35;cursor:not-allowed}'+
    '.tmrconf{border-color:color-mix(in srgb,var(--warn) 60%,transparent);color:var(--warn)}'+
    '.tmrsrc summary{cursor:pointer}.tmrsrc div{margin-top:4px;overflow-wrap:anywhere}'+
    '.tmralt{color:var(--muted)}'+
    '.tmrstrip{display:grid;gap:8px;padding:12px 14px;border-color:var(--wind)}.tmrstriphead{display:flex;justify-content:space-between;gap:8px;align-items:center}'+
    '.tmrchips{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:8px}'+
    '.tmrchip{background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:6px 10px;display:grid;gap:2px;min-width:0}.tmrchip .tmrcd{white-space:normal;overflow-wrap:anywhere}.tmrchip b{font-size:13px;overflow-wrap:anywhere}'+
    '.tmrchip[data-state="open"]{border-color:var(--wind)}.tmrchip[data-state="soon"]{border-color:var(--gold)}'+
    '@media (max-width:520px){.tmrchips{grid-template-columns:repeat(2,minmax(0,1fr))}.tmrwhen{white-space:normal}}';
    document.head.appendChild(c)}
  if(T){render();start()}
})();

/* ---------- Reference features (data: global REFS = audit/r7/refs.json) ----------
   Mounts (each optional; a missing mount is created at the end of its tab):
     #refsets          Gear & stats: Arcana set bonuses + 5-slot set checker
     #refunlocks-start Start here: collapsed "what unlocks when" by level
     #refunlocks       Game mechanics: full unlock requirements table
     #reftables        Game mechanics: EXP / Legion / rankings / crafting / gathering tables
     #refgloss         Game mechanics: status effect glossary
   Glossary tooltips: window.refGloss.mark(el) wraps glossary words inside el; it only ever touches
   elements that carry a data-gloss attribute (and the glossary itself). Runs on load and after tab switches. */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const data=()=>(typeof REFS!=='undefined'&&REFS)||window.REFS||null;
  const num=n=>n==null||n===''?'':(typeof n==='number'?n.toLocaleString('en-US'):String(n));
  const sget=(k,d)=>{try{return S.get(k,d)}catch(e){return d}}, sset=(k,v)=>{try{S.set(k,v)}catch(e){}};
  const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  // MetaBot.GG asks for a plain (dofollow) link to the exact page: rel="noopener" only, never nofollow
  function link(s){
    if(!s||!s.u) return '';
    if(s.own||/^#/.test(s.u)){const t=s.u.slice(1).split(/[?#]/)[0];return `<a href="#${h(t)}" data-goto="${h(t)}">${h(s.l)}</a>`}
    if(!/^https:\/\//i.test(s.u)) return h(s.l);
    return `<a href="${h(s.u)}" target="_blank" rel="noopener">${h(s.l)}</a>`;
  }
  const srcs=(a,lab)=>a&&a.length?`<div class="rf-src">${lab||'Source'}: ${a.map(link).join(' · ')}</div>`:'';

  function addStyle(){
    if(document.getElementById('rfstyle')) return;
    const el=document.createElement('style'); el.id='rfstyle';
    el.textContent=[
      '.rf{display:grid;gap:12px;min-width:0}',
      '.rf h3{margin:0}.rf p{margin:0}',
      '.rf-src{font-size:12px;color:var(--muted);overflow-wrap:anywhere}.rf-src a{color:var(--wind)}',
      '.rf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}',
      '.rf-card{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;display:grid;gap:8px;min-width:0}',
      '.rf-card h4{margin:0;font:400 19px var(--f-display);color:var(--gold)}',
      '.rf-bon{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:baseline;margin:0}',
      '.rf-bon dt{font:600 12px var(--f-mono);color:var(--bg);background:var(--gold);border-radius:999px;padding:1px 8px;text-align:center}',
      '.rf-bon dd{margin:0}',
      '.rf-bon dt.off{background:transparent;color:var(--muted);border:1px solid var(--line)}',
      '.rf-slots{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}',
      '.rf-slot{display:grid;gap:4px;font-size:13px}.rf-slot .seg{width:100%}.rf-slot .seg button{flex:1}',
      '.rf-out{border-left:3px solid var(--wind);padding:6px 10px;background:color-mix(in srgb,var(--wind) 8%,var(--panel));border-radius:0 8px 8px 0}',
      '.rf-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.rf-ctl input[type=search],.rf-ctl input[type=number],.rf-ctl select{padding:7px 10px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:inherit;font:inherit;max-width:100%}',
      '.rf-ctl input[type=search]{flex:1 1 220px;min-width:0}',
      '.rf-ctl .seg{flex-wrap:wrap;max-width:100%}',
      '.rf table td.num,.rf table th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}',
      '.rf .tablewrap{max-height:none}',
      '.rf-q{font-size:13px;color:var(--muted)}',
      '.rf-lv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:0}',
      '.rf-lv dt{font:600 13px var(--f-mono);color:var(--gold);white-space:nowrap}.rf-lv dd{margin:0}',
      '.rf-grp{display:grid;gap:6px;min-width:0}.rf-grp h4{margin:6px 0 0;font-size:16px}',
      'details.rf-grp{display:block;min-width:0;max-width:100%}details.rf-grp>.tablewrap{max-width:100%}',
      'details.rf-grp>summary{display:flex;flex-wrap:wrap;gap:4px 10px;min-width:0;overflow-wrap:anywhere;font:600 15px var(--f-body);text-transform:none;letter-spacing:0;color:var(--fg);margin:4px 0;padding:6px 0;border-top:1px solid var(--line)}',
      'details.rf-grp>summary::before{content:\"\u25B8\";color:var(--gold);margin-right:2px}details.rf-grp[open]>summary::before{content:\"\u25BE\"}',
      'details.rf-grp>summary b{font-weight:700}',
      '.rf-terms{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}',
      '.rf-term{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:grid;gap:5px;min-width:0;scroll-margin-top:90px}',
      '.rf-term:target{border-color:var(--gold)}',
      '.rf-term b{font-size:16px}.rf-term .al{font-size:12px;color:var(--muted)}',
      '.rf-term .eg{font-size:12.5px;color:var(--muted)}.rf-term .eg a{color:var(--wind)}',
      '.rf-conf{font:600 12px var(--f-mono);letter-spacing:.05em;text-transform:uppercase;padding:1px 6px;border-radius:999px;border:1px solid var(--line);color:var(--muted);margin-left:6px;white-space:nowrap}',
      '.rf-conf.client{color:var(--wind);border-color:color-mix(in srgb,var(--wind) 50%,var(--line))}',
      '.rfgt{border-bottom:1px dotted var(--wind);cursor:help}',
      '.rfgt:focus{outline:2px solid var(--wind);outline-offset:1px;border-radius:2px}',
      '#rfgtip{position:absolute;z-index:60;max-width:min(320px,calc(100vw - 32px));background:var(--panel2);color:var(--fg);border:1px solid var(--wind);border-radius:9px;padding:8px 11px;font-size:13.5px;line-height:1.45;box-shadow:0 6px 20px rgba(0,0,0,.4)}',
      '#rfgtip b{color:var(--gold)}#rfgtip a{color:var(--wind);font-size:12px}',
      '#rfunlockstart>summary{flex-wrap:wrap;min-width:0}.rf-kr summary{font:600 13px var(--f-body);text-transform:none;letter-spacing:0;color:var(--muted)}',
    ].join('\n');
    document.head.appendChild(el);
  }
  // create a missing mount at the end of its tab (keeps the module working even before the body is edited)
  function mount(id,tab,before){
    let el=document.getElementById(id); if(el) return el;
    const sec=document.getElementById(tab); if(!sec) return null;
    el=document.createElement('div'); el.id=id;
    const b=before&&sec.querySelector(before);
    if(b&&b.parentNode) b.parentNode.insertBefore(el,b); else sec.appendChild(el);
    return el;
  }

  /* ---------- 1. gear set bonuses ---------- */
  const SLOTS=['Chalice','Parchment','Compass','Bell','Mirror'];
  function renderSets(el,D){
    const st=D.sets; if(!st) return;
    let pick=sget('rfsets',null); if(!Array.isArray(pick)||pick.length!==5) pick=['vigor','vigor','vigor','vigor','magic'];
    const card=s=>`<div class="rf-card" data-set="${h(s.id)}"><h4>${h(s.name)}</h4><div class="small">${h(s.cards)}. ${h(s.grades)}.</div>`+
      `<dl class="rf-bon">${s.bonuses.map(b=>`<dt data-n="${b.n}">${h(b.n)} cards</dt><dd>${h(b.text)}</dd>`).join('')}</dl>`+
      `<div class="small">${h(s.who)}</div>${srcs(s.src)}</div>`;
    el.innerHTML=`<div class="box rf" id="rfsetsbox"><h3>Gear set bonuses</h3><p class="small">${h(st.intro)}</p>`+
      `<div class="rf-grid">${st.global.map(card).join('')}</div>`+
      `<div class="rf-card"><b>Check your cards</b><p class="small muted">Pick the version you wear in each slot; your choice is saved in this browser.</p>`+
      `<div class="rf-slots">${SLOTS.map((n,i)=>`<div class="rf-slot"><span>${h(n)}</span><div class="seg" role="group" aria-label="${h(n)} card set">${st.global.map(s=>`<button type="button" data-rfslot="${i}" data-rfset="${h(s.id)}" aria-pressed="${pick[i]===s.id}">${h(s.name.split(' ').pop())}</button>`).join('')}</div></div>`).join('')}</div>`+
      `<div class="rf-out" id="rfsetout" aria-live="polite"></div></div>`+
      `<ul class="small" style="margin:0;padding-left:20px;display:grid;gap:4px">${(st.rules||[]).map(r=>`<li>${h(r.text)} ${srcs(r.src)}</li>`).join('')}</ul>`+
      (st.kr&&st.kr.length?`<details class="rf-kr"><summary>Korea only (not on Global yet)</summary><ul class="small" style="margin:6px 0 0;padding-left:20px;display:grid;gap:4px">${st.kr.map(k=>`<li><b>${h(k.name)}</b>: ${h(k.note)} ${srcs(k.src)}</li>`).join('')}</ul></details>`:'')+
      `</div>`;
    const upd=()=>{
      const cnt={}; pick.forEach(p=>cnt[p]=(cnt[p]||0)+1);
      const on=[]; st.global.forEach(s=>s.bonuses.forEach(b=>{if((cnt[s.id]||0)>=b.n) on.push(s.name+' '+b.n+': '+b.text)}));
      el.querySelectorAll('[data-rfslot]').forEach(b=>b.setAttribute('aria-pressed',pick[+b.dataset.rfslot]===b.dataset.rfset));
      el.querySelectorAll('.rf-card[data-set]').forEach(c=>c.querySelectorAll('dt[data-n]').forEach(dt=>dt.classList.toggle('off',(cnt[c.dataset.set]||0)<+dt.dataset.n)));
      const o=el.querySelector('#rfsetout'); if(o) o.innerHTML=`<b>${st.global.map(s=>h(s.name)+' '+(cnt[s.id]||0)).join(' · ')}</b><br>`+(on.length?'Active: '+on.map(h).join('<br>Active: '):'No set bonus active: you need 2 cards of one set.');
    };
    el.onclick=e=>{const b=e.target.closest&&e.target.closest('[data-rfslot]'); if(!b) return; pick[+b.dataset.rfslot]=b.dataset.rfset; sset('rfsets',pick.slice()); upd()};
    upd();
  }

  /* ---------- 2. unlock requirements ---------- */
  const lvTxt=r=>r.lv==null?'':String(r.lv), ilTxt=r=>r.il==null?'':num(r.il);
  const questTxt=r=>r.qe||r.qa?(r.qe===r.qa?h(r.qe):`${h(r.qe)} <span class="rf-q">(Elyos)</span> / ${h(r.qa)} <span class="rf-q">(Asmodian)</span>`):'';
  function unlockTable(g,i){
    return `<details class="rf-grp" data-rfug="${h(g.id)}"${i===0?' open':''}><summary><b>${h(g.name)}</b> <span class="rf-q">${g.rows.length} rows</span></summary><div class="tablewrap"><table><thead><tr><th>What</th><th class="num">Level</th><th class="num">Item level</th><th>Quest</th><th>Notes and source</th></tr></thead><tbody>`+
      g.rows.map(r=>`<tr data-rfhay="${h((r.what+' '+r.qe+' '+r.qa+' '+r.note+' '+r.cat).toLowerCase())}"><td>${h(r.what)}</td><td class="num">${h(lvTxt(r))}</td><td class="num">${h(ilTxt(r))}</td><td class="small">${questTxt(r)}</td><td class="small">${h(r.note)}${srcs(r.src)}</td></tr>`).join('')+
      `</tbody></table></div></details>`;
  }
  function renderUnlocks(el,D){
    const U=D.unlocks; if(!U) return;
    const q0=sget('rfuq','');
    el.innerHTML=`<div class="box rf" id="rfunlockbox"><h3>Unlock requirements</h3><p class="small">${h(U.intro)}</p>`+
      `<div class="rf-ctl"><input type="search" id="rfuq" placeholder="Filter: stigma, Abyss, 2,100, Conquest…" aria-label="Filter unlocks" value="${h(q0)}"><span class="small muted" id="rfucount"></span></div>`+
      U.groups.map((g,i)=>unlockTable(g,i)).join('')+
      (U.conflicts&&U.conflicts.length?`<p class="small muted">${U.conflicts.map(h).join(' ')}</p>`:'')+`</div>`;
    const apply=()=>{
      const q=(el.querySelector('#rfuq').value||'').trim().toLowerCase().replace(/,/g,''); let n=0;
      el.querySelectorAll('.rf-grp').forEach(g=>{let any=0;g.querySelectorAll('tbody tr').forEach(tr=>{const hay=tr.dataset.rfhay+' '+tr.textContent.toLowerCase().replace(/,/g,'');const m=!q||hay.includes(q);tr.hidden=!m;if(m){any++;n++}});g.hidden=!any; if(q&&any) g.open=true});
      const c=el.querySelector('#rfucount'); if(c) c.textContent=n+' rows';
    };
    el.querySelector('#rfuq').addEventListener('input',e=>{sset('rfuq',e.target.value||'');apply()});
    apply();
  }
  function renderUnlocksStart(el,D){
    const U=D.unlocks; if(!U) return;
    const by={}; const quests=[];
    U.groups.forEach(g=>g.rows.forEach(r=>{
      if(typeof r.lv==='number'&&r.lv<=45&&(r.il==null||g.id==='expedition')) (by[r.lv]=by[r.lv]||[]).push(r.il!=null?r.what+' (item level '+num(r.il)+')':r.what);
      else if(r.lv==null&&r.qe&&g.id==='quest') quests.push(r);
    }));
    const lvls=Object.keys(by).map(Number).sort((a,b)=>a-b);
    el.innerHTML=`<details class="box rf" id="rfunlockstart"><summary><b>What unlocks when: levels 2 to 45</b></summary>`+
      `<dl class="rf-lv">${lvls.map(l=>`<dt>Lv ${l}</dt><dd class="small">${by[l].map(h).join(' · ')}</dd>`).join('')}</dl>`+
      `<p class="small"><b>Story quests that open systems</b> (Elyos / Asmodian):</p><ul class="small" style="margin:0;padding-left:20px">${quests.map(r=>`<li>${h(r.what)}: ${questTxt(r)}</li>`).join('')}</ul>`+
      `<p class="small">Item-level gates for every dungeon, Trial difficulty and Abyss layer: <a href="#refunlocks" data-goto="refunlocks">Glossary &amp; reference › Unlock requirements</a>.</p>`+
      srcs([{u:'https://metabot.gg/en/aion-2/content-unlocks',l:'MetaBot.GG: Content unlocks'}])+`</details>`;
  }

  /* ---------- 3. reference tables ---------- */
  const TABS=[['xp','EXP per level'],['legion','Legion levels'],['rank','Ranking tiers'],['craft','Crafting mastery'],['gather','Gathering mastery']];
  const tbl=(cols,rows,numCols)=>`<div class="tablewrap"><table><thead><tr>${cols.map((c,i)=>`<th${numCols.includes(i)?' class="num"':''}>${h(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td${numCols.includes(i)?' class="num"':''}>${h(typeof c==='number'?num(c):(c==null?'—':c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const notes=a=>a&&a.length?`<ul class="small" style="margin:0;padding-left:20px;display:grid;gap:3px">${a.map(x=>`<li>${h(x)}</li>`).join('')}</ul>`:'';
  function tablePane(id,T){
    if(id==='xp'){const x=T.xp; const pct=r=>x.total?((r[2]/x.total)*100).toFixed(1)+'%':'';
      return `<div class="rf-ctl"><label class="small" for="rfxplv">I am level</label><select id="rfxplv">${x.rows.slice(0,-1).map(r=>`<option value="${r[0]}">${r[0]}</option>`).join('')}</select><label class="small" for="rfxpin">with EXP into this level</label><input type="number" id="rfxpin" min="0" step="1" value="0" style="width:150px"></div><div class="rf-out" id="rfxpout" aria-live="polite"></div>`+
        notes(x.notes)+tbl([...x.cols,'Share of 1–45'],x.rows.map(r=>[r[0],r[1],r[2],pct(r)]),[0,1,2,3])+srcs(x.src)}
    if(id==='legion'){const x=T.legion; return notes(x.notes)+tbl(x.cols,x.rows.map(r=>r.map((c,i)=>i===3?'+'+c+'%':(i>=4&&c?'+'+c:c))),[0,1,2,3,4,5,6,7,8,9])+srcs(x.src)}
    if(id==='rank'){const x=T.rank;
      return `<p class="small">${h(x.season)}</p>`+x.boards.map(b=>`<h4 style="margin:4px 0 0">${h(b.name)}</h4>`+tbl(['Grade','Rank','Points','Title','Reward (bound helm skin)'],b.rows.map(r=>[r.g,r.r,r.p,r.title,r.item||'—']),[1,2])).join('')+
        `<h4 style="margin:4px 0 0">${h(x.others.names.join(', '))}</h4><p class="small">${h(x.others.grades.join(' › '))}. ${h(x.others.note)}</p>`+
        `<h4 style="margin:4px 0 0">Abyss rank (high to low)</h4><p class="small">${x.abyss.map((a,i)=>`${i+1}. ${h(a)}`).join(' · ')}</p>`+notes(x.notes)+srcs(x.src)}
    if(id==='craft'){const x=T.craft; return `<div class="tablewrap"><table><thead><tr><th>Profession</th><th>Makes</th></tr></thead><tbody>${x.professions.map(p=>`<tr><td>${h(p[0])}</td><td>${h(p[1])}</td></tr>`).join('')}</tbody></table></div>`+notes(x.notes)+tbl(x.cols,x.rows,[0,2,3,4])+srcs(x.src)}
    if(id==='gather'){const x=T.gather; return `<p class="small">${x.types.map(t=>`${h(t[0])} (${h(t[1])})`).join(' · ')}</p>`+notes(x.notes)+tbl(x.cols,x.rows,[0,2,3])+srcs(x.src)}
    return '';
  }
  function renderTables(el,D){
    const T=D.tables; if(!T) return;
    let cur=sget('rftab','xp'); if(!TABS.some(t=>t[0]===cur)) cur='xp';
    el.innerHTML=`<div class="box rf" id="rftablebox"><h3>Reference tables</h3><div class="rf-ctl"><div class="seg" role="group" aria-label="Reference table">${TABS.filter(t=>T[t[0]]).map(t=>`<button type="button" data-rftab="${t[0]}" aria-pressed="${t[0]===cur}">${h(t[1])}</button>`).join('')}</div></div><div id="rftablepane" class="rf"></div></div>`;
    const show=id=>{
      cur=id; sset('rftab',id);
      el.querySelectorAll('[data-rftab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.rftab===id));
      const p=el.querySelector('#rftablepane'); p.innerHTML=tablePane(id,T);
      if(id==='xp'){
        const x=T.xp, sel=p.querySelector('#rfxplv'), inp=p.querySelector('#rfxpin');
        sel.value=String(sget('rfxplv',30));
        const calc=()=>{const l=+sel.value; const r=x.rows.find(r=>r[0]===l); const into=Math.max(0,Math.min(+inp.value||0,(r&&r[1])||0)); sset('rfxplv',l);
          const left=x.total-(r?r[2]:0)-into; const out=p.querySelector('#rfxpout');
          if(out) out.innerHTML=`<b>${num(left)}</b> EXP left to level 45 (${x.total?((1-left/x.total)*100).toFixed(1):0}% of the way from level 1).`};
        sel.addEventListener('change',calc); inp.addEventListener('input',calc); calc();
      }
    };
    el.querySelectorAll('[data-rftab]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.rftab)));
    show(cur);
  }

  /* ---------- 4. glossary + tooltip helper ---------- */
  const CONF={client:['Client tooltip','client'],guide:['Guide','guide'],inferred:['Inferred','inferred']};
  function renderGloss(el,D){
    const G=D.gloss; if(!G) return;
    const q0=sget('rfgq','');
    el.innerHTML=`<div class="box rf" id="rfglossbox"><h3>Status effects and combat words</h3><p class="small">${h(G.intro)}</p>`+
      `<ul class="small" style="margin:0;padding-left:20px;display:grid;gap:4px">${(G.rules||[]).map(r=>`<li data-gloss>${h(r.text)} ${srcs(r.src)}</li>`).join('')}</ul>`+
      `<div class="rf-ctl"><input type="search" id="rfgq" placeholder="Find a word: stun, tenacity, stagger…" aria-label="Search the glossary" value="${h(q0)}"><span class="small muted" id="rfgcount"></span></div>`+
      G.groups.map((g,gi)=>{const ts=G.terms.filter(t=>t.g===g.id); if(!ts.length) return '';
        return `<details class="rf-grp" data-rfgg="${h(g.id)}"${gi===0?' open':''}><summary><b>${h(g.name)}</b> <span class="rf-q">${ts.length} words</span></summary><div class="rf-terms">`+ts.map(t=>{const c=CONF[t.conf]||CONF.guide;
          return `<div class="rf-term" id="gl-${h(slug(t.t))}" data-rfhay="${h((t.t+' '+t.alias.join(' ')+' '+t.def).toLowerCase())}"><div><b>${h(t.t)}</b><span class="rf-conf ${c[1]}" title="Where the meaning comes from">${c[0]}</span>${t.alias.length?` <span class="al">also: ${t.alias.map(h).join(', ')}</span>`:''}</div>`+
            `<div class="small" data-gloss data-gself="${h(t.t)}">${h(t.def)}</div>`+
            (t.eg&&t.eg.length?`<div class="eg">Named in ${h(t.skills)} Global skill tooltip${t.skills>1?'s':''}, e.g. ${t.eg.map(e=>`<a href="${h(e.u)}" target="_blank" rel="noopener">${h(e.n)}</a>${e.c?` <span class="rf-q">(${h(e.c.charAt(0).toUpperCase()+e.c.slice(1))})</span>`:''}`).join(', ')}</div>`:'')+srcs(t.src)+`</div>`}).join('')+`</div></details>`}).join('')+
      `</div>`;
    const apply=()=>{const q=(el.querySelector('#rfgq').value||'').trim().toLowerCase(); let n=0;
      el.querySelectorAll('.rf-grp').forEach(g=>{let any=0;g.querySelectorAll('.rf-term').forEach(t=>{const m=!q||t.dataset.rfhay.includes(q);t.hidden=!m;if(m){any++;n++}});g.hidden=!any; if(q&&any) g.open=true});
      const c=el.querySelector('#rfgcount'); if(c) c.textContent=n+' words'};
    el.querySelector('#rfgq').addEventListener('input',e=>{sset('rfgq',e.target.value||'');apply()});
    apply();
  }

  const GL={re:null,map:{}};
  function buildIndex(D){
    const G=D&&D.gloss; if(!G||GL.re) return;
    const words=[];
    G.terms.forEach(t=>[t.t,...t.alias].forEach(w=>{if(w&&w.length>2&&!GL.map[w]){GL.map[w]=t;words.push(w)}}));
    words.sort((a,b)=>b.length-a.length);
    if(words.length) GL.re=new RegExp('\\b('+words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\b','g');
  }
  const SKIP=/^(A|BUTTON|SCRIPT|STYLE|TEXTAREA|INPUT|SELECT|OPTION|SVG|CODE|SUMMARY|H1|H2|H3|H4)$/;
  function markEl(root){
    if(!GL.re||!root) return 0;
    const self=root.getAttribute&&root.getAttribute('data-gself');
    const seen=new Set([...root.querySelectorAll('.rfgt')].map(s=>s.dataset.gt)); if(self) seen.add(slug(self));
    const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
      for(let p=n.parentNode;p&&p!==root.parentNode;p=p.parentNode){if(p.nodeType===1&&(SKIP.test(p.tagName.toUpperCase())||(p.classList&&(p.classList.contains('rfgt')||p.classList.contains('rf-src')))))return NodeFilter.FILTER_REJECT}
      return GL.re.test(n.nodeValue)?(GL.re.lastIndex=0,NodeFilter.FILTER_ACCEPT):(GL.re.lastIndex=0,NodeFilter.FILTER_SKIP)}});
    const nodes=[]; while(tw.nextNode()) nodes.push(tw.currentNode);
    let made=0;
    nodes.forEach(n=>{
      const s=n.nodeValue; let last=0, out=null; GL.re.lastIndex=0; let m;
      while((m=GL.re.exec(s))){const t=GL.map[m[1]]; const id=slug(t.t); if(seen.has(id)) continue; seen.add(id);
        out=out||document.createDocumentFragment(); out.appendChild(document.createTextNode(s.slice(last,m.index)));
        const sp=document.createElement('span'); sp.className='rfgt'; sp.tabIndex=0; sp.dataset.gt=id; sp.setAttribute('role','button'); sp.setAttribute('aria-label',m[1]+': show meaning'); sp.textContent=m[1];
        out.appendChild(sp); last=m.index+m[1].length; made++;}
      if(out){out.appendChild(document.createTextNode(s.slice(last))); n.parentNode.replaceChild(out,n)}
    });
    return made;
  }
  function markAll(){buildIndex(data()); let n=0; document.querySelectorAll('[data-gloss]').forEach(e=>{n+=markEl(e)}); return n}
  let tip=null, tipFor=null, tipAt=0;
  function hideTip(){if(tip) tip.hidden=true; tipFor=null}
  function showTip(sp){
    const D=data(); if(!D||!D.gloss) return; const t=D.gloss.terms.find(x=>slug(x.t)===sp.dataset.gt); if(!t) return;
    if(!tip){tip=document.createElement('div'); tip.id='rfgtip'; tip.setAttribute('role','tooltip'); tip.hidden=true; document.body.appendChild(tip)}
    tip.innerHTML=`<b>${h(t.t)}</b>: ${h(t.def)}${document.getElementById('gl-'+slug(t.t))?` <a href="#gl-${h(slug(t.t))}" data-rfgo="${h(slug(t.t))}">Glossary</a>`:''}`;
    if(tipFor!==sp) tipAt=Date.now(); tip.hidden=false; tipFor=sp;
    const r=sp.getBoundingClientRect(), sx=window.scrollX||0, sy=window.scrollY||0, W=document.documentElement.clientWidth||360;
    const w=Math.min(320,W-32); let x=r.left+sx; if(x+w>sx+W-16) x=sx+W-16-w; if(x<sx+16) x=sx+16;
    tip.style.left=x+'px'; tip.style.top=(r.bottom+sy+6)+'px';
  }
  function wireTips(){
    if(document.documentElement.dataset.rfgwired) return; document.documentElement.dataset.rfgwired='1';
    document.addEventListener('mouseover',e=>{const sp=e.target.closest&&e.target.closest('.rfgt'); if(sp&&sp!==tipFor) showTip(sp)});
    document.addEventListener('mouseout',e=>{const sp=e.target.closest&&e.target.closest('.rfgt'); if(sp&&!(e.relatedTarget&&tip&&tip.contains(e.relatedTarget))) hideTip()});
    document.addEventListener('focusin',e=>{const sp=e.target.closest&&e.target.closest('.rfgt'); if(sp) showTip(sp)});
    document.addEventListener('focusout',e=>{if(e.target.closest&&e.target.closest('.rfgt')) setTimeout(()=>{if(!(tip&&tip.contains(document.activeElement))) hideTip()},0)});
    document.addEventListener('keydown',e=>{if(e.key==='Escape') hideTip(); const sp=e.target.closest&&e.target.closest('.rfgt'); if(sp&&(e.key==='Enter'||e.key===' ')){e.preventDefault(); tipFor===sp?hideTip():showTip(sp)}});
    document.addEventListener('click',e=>{
      const go=e.target.closest&&e.target.closest('[data-rfgo]');
      if(go){e.preventDefault(); hideTip(); const sys=document.querySelector('[data-tab="systems"]'); const tgt=document.getElementById('gl-'+go.dataset.rfgo); if(sys&&tgt&&tgt.closest('[hidden]')) sys.click(); setTimeout(()=>{const t2=document.getElementById('gl-'+go.dataset.rfgo); if(t2){const g=t2.closest('.rf-grp'); if(t2.hidden){const q=document.getElementById('rfgq'); if(q){q.value='';q.dispatchEvent(new Event('input',{bubbles:true}))}} if(t2.scrollIntoView) t2.scrollIntoView({block:'center'}); t2.style.borderColor='var(--gold)'; setTimeout(()=>t2.style.borderColor='',1600)}},60); return}
      const sp=e.target.closest&&e.target.closest('.rfgt');
      if(sp){(tipFor===sp&&Date.now()-tipAt>400)?hideTip():showTip(sp); return}
      if(tip&&!tip.contains(e.target)) hideTip();
      if(e.target.closest&&e.target.closest('[data-tab],[data-goto],[data-grp]')) setTimeout(markAll,80);
    });
    window.addEventListener('resize',hideTip);
  }

  window.refGloss={mark:el=>{buildIndex(data());return markEl(el)},markAll,show:showTip,hide:hideTip};
  window.renderRefs=function(){
    const D=data();
    const targets=[['refsets','gear',null],['refunlocks-start','start','#progressbox'],['refunlocks','systems',null],['reftables','systems',null],['refgloss','systems',null]];
    if(!D){targets.forEach(([id])=>{const el=document.getElementById(id); if(el) el.innerHTML='<p class="box muted">Reference data could not load.</p>'}); return}
    addStyle();
    const R={refsets:renderSets,'refunlocks-start':renderUnlocksStart,refunlocks:renderUnlocks,reftables:renderTables,refgloss:renderGloss};
    targets.forEach(([id,tab,before])=>{const el=mount(id,tab,before); if(!el) return; try{R[id](el,D)}catch(e){el.innerHTML='<p class="box muted">This section could not load.</p>'; console.error(e)}});
    wireTips(); markAll();
  };
  try{window.renderRefs()}catch(e){console.error(e)}
})();

/* ---------- Daevanion board search: "which node gives …" (no data of its own: reads DATA.boards of the current class) ----------
   Mount: <div id="boardsearchbox"></div> in the Daevanion boards tab, just before <div class="boardlayout">
   (created there automatically if missing). Uses boards.js globals: DATA, state, renderBoard, cur.
   Matches are listed per board; pressing a board chip opens that board and rings every match on the drawn map. */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const sget=(k,d)=>{try{return S.get(k,d)}catch(e){return d}}, sset=(k,v)=>{try{S.set(k,v)}catch(e){}};
  const boards=()=>{try{return (typeof DATA!=='undefined'&&DATA&&DATA.boards)||[]}catch(e){return []}};
  const GRADE={Common:'Stat',Rare:'Passive skill',Legend:'Active skill',Unique:'+1.5% bonus'};
  const norm=s=>String(s||'').toLowerCase().replace(/[+%]/g,' ').replace(/\d+(\.\d+)?/g,' ').replace(/[^a-z' ]+/g,' ').replace(/\s+/g,' ').trim();
  const nums=s=>(String(s||'').match(/\d+(\.\d+)?/g)||[]);
  let q=sget('bsq',''), last=null;

  function addStyle(){
    if(document.getElementById('bsstyle')) return;
    const el=document.createElement('style'); el.id='bsstyle';
    el.textContent=[
      '#boardsearchbox{margin:0 0 12px}',
      '.bs{display:grid;gap:10px;min-width:0}',
      '.bs h3{margin:0;font-size:18px}',
      '.bs-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.bs-ctl input[type=search]{flex:1 1 240px;min-width:0;padding:8px 10px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:inherit;font:inherit}',
      '.bs-chips{display:flex;flex-wrap:wrap;gap:6px}',
      '.bs-chips button{background:var(--panel2);border:1px solid var(--line);color:var(--fg);font:600 12.5px var(--f-body);padding:4px 10px;border-radius:999px;cursor:pointer}',
      '.bs-chips button[aria-pressed="true"]{background:var(--wind);border-color:var(--wind);color:var(--bg)}',
      '.bs-res{margin:0;padding:0;list-style:none;display:grid;gap:6px;max-height:340px;overflow:auto}',
      '.bs-res li{display:grid;gap:4px;background:var(--panel2);border:1px solid var(--line);border-radius:9px;padding:7px 10px;min-width:0}',
      '.bs-res .bslab{font-weight:700;overflow-wrap:anywhere}.bs-res .bsmeta{font-size:12.5px;color:var(--muted)}',
      '.bs-res .bsbds{display:flex;flex-wrap:wrap;gap:5px}',
      '.bs-res .bsbds button{cursor:pointer;border:1px solid var(--line);border-radius:6px;padding:2px 8px;font:600 12px var(--f-mono);background:var(--panel);color:var(--fg)}',
      '.bs-res .bsbds button.cur{border-color:var(--gold);color:var(--gold)}',
      '.bs-note{font-size:13px;color:var(--muted)}',
      '#board .node.bsm .nb{opacity:1 !important;stroke:var(--wind);stroke-width:3}',
      '#board .bsring{fill:none;stroke:var(--wind);stroke-width:2.5;stroke-dasharray:5 3;pointer-events:none}',
    ].join('\n');
    document.head.appendChild(el);
  }
  // search every board of this class; returns [{label, type, grade, cost, boards:{name:{n, steps:{pve:[],pvp:[]}, keys:[]}}}]
  function search(query){
    const words=norm(query).split(' ').filter(Boolean), qn=nums(query);
    if(!words.length&&!qn.length) return [];
    const out={};
    boards().forEach(b=>{
      const step={pve:{},pvp:{}};
      ['pve','pvp'].forEach(m=>{if(b[m]&&b[m].order) b[m].order.forEach((rc,i)=>{step[m][rc[0]+','+rc[1]]=i+1})});
      (b.nodes||[]).forEach(n=>{
        if(n[2]==='Start') return;
        const lab=String(n[4]||''), ln=norm(lab), lnums=nums(lab);
        const ok=words.every(w=>ln.split(' ').some(x=>x.startsWith(w))||ln.includes(w))&&qn.every(v=>lnums.includes(v)||lnums.includes(String(+v)));
        if(!ok) return;
        const k=n[0]+','+n[1];
        const r=out[lab]||(out[lab]={label:lab,type:n[5],grade:n[2],cost:n[3],boards:{},exact:ln===norm(query)});
        const bb=r.boards[b.name]||(r.boards[b.name]={n:0,keys:[],steps:{pve:[],pvp:[]}});
        bb.n++; bb.keys.push(k); ['pve','pvp'].forEach(m=>{if(step[m][k]) bb.steps[m].push(step[m][k])});
      });
    });
    return Object.values(out).sort((a,b)=>(b.exact-a.exact)||(a.type===b.type?0:a.type==='SkillLevel'?-1:1)||a.label.localeCompare(b.label));
  }
  function curBoard(){try{return state.board}catch(e){return null}}
  function curMode(){try{return state.mode}catch(e){return 'pve'}}
  function render(){
    const box=document.getElementById('boardsearchbox'); if(!box) return;
    const B=boards(); if(!B.length){box.innerHTML='';return}
    const core=(()=>{try{return (C&&C.core)||[]}catch(e){return []}})().slice(0,4);
    const chips=[...core,'Attack','Critical Hit','Combat Speed','Cooldown Reduction','Damage Boost','PvP'];
    box.innerHTML=`<div class="box bs"><h3>Which node gives…</h3>`+
      `<div class="bs-ctl"><input type="search" id="bsq" placeholder='Search this class&#39;s boards, e.g. "Overhead Slam" or "Attack"' aria-label="Search Daevanion nodes" value="${h(q)}"></div>`+
      `<div class="bs-chips" role="group" aria-label="Quick searches">${chips.map(c=>`<button type="button" data-bsq="${h(c)}" aria-pressed="${q===c}">${h(c)}</button>`).join('')}</div>`+
      `<div class="bs-note" id="bsnote" aria-live="polite"></div><ul class="bs-res" id="bsres"></ul></div>`;
    draw();
  }
  function draw(){
    const box=document.getElementById('boardsearchbox'); if(!box) return;
    const res=search(q); last=res;
    const cb=curBoard(), md=curMode();
    box.querySelectorAll('[data-bsq]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.bsq===q));
    const ul=box.querySelector('#bsres'), note=box.querySelector('#bsnote');
    if(!q.trim()){ul.innerHTML='';note.textContent='Type a skill or stat to see which nodes give it, on which board, and where they sit on your route.';highlight();return}
    const total=res.reduce((a,r)=>a+Object.values(r.boards).reduce((x,b)=>x+b.n,0),0);
    const onCur=res.reduce((a,r)=>a+((r.boards[cb]||{}).n||0),0);
    note.textContent=res.length?`${total} node${total===1?'':'s'} on your boards match (${res.length} kind${res.length===1?'':'s'}). ${onCur?onCur+' on '+cb+' are ringed on the map below.':'None on '+cb+'; press a board below to open it.'}`:'No node on this class\'s boards matches. Try a shorter word (e.g. "Crit", "Slam").';
    ul.innerHTML=res.slice(0,40).map(r=>{
      const meta=`${GRADE[r.grade]||r.grade} · ${r.cost} crystal${r.cost>1?'s':''} each`;
      const bds=Object.entries(r.boards).map(([name,b])=>{const st=b.steps[md]&&b.steps[md].length?b.steps[md]:b.steps.pve.concat(b.steps.pvp);
        return `<button type="button" data-bsboard="${h(name)}" class="${name===cb?'cur':''}" title="${h(st.length?'Route step '+st.sort((x,y)=>x-y).join(', '):'Not on the guide route')}">${h(name)} ×${b.n}${st.length?' · step '+h(st.sort((x,y)=>x-y).join(', ')):''}</button>`}).join('');
      return `<li><span class="bslab">${h(r.label)}</span><span class="bsmeta">${h(meta)}</span><div class="bsbds">${bds}</div></li>`}).join('')+(res.length>40?`<li class="bs-note">${res.length-40} more: type more letters to narrow it down.</li>`:'');
    highlight();
  }
  function highlight(){
    const svg=document.getElementById('board'); if(!svg) return;
    svg.querySelectorAll('.node.bsm').forEach(g=>g.classList.remove('bsm'));
    let rings=svg.querySelector('#bsrings'); if(rings) rings.textContent='';
    const cb=curBoard(); if(!q.trim()||!last||!cb) return;
    const keys=new Set(); last.forEach(r=>{const b=r.boards[cb]; if(b) b.keys.forEach(k=>keys.add(k))});
    if(!keys.size) return;
    if(!rings){rings=document.createElementNS('http://www.w3.org/2000/svg','g'); rings.setAttribute('id','bsrings'); svg.appendChild(rings)}
    let X=null,Y=null; try{X=cur&&cur.X; Y=cur&&cur.Y}catch(e){}
    svg.querySelectorAll('.node').forEach(g=>{
      if(!keys.has(g.dataset.k)) return; g.classList.add('bsm');
      const [r,c]=g.dataset.k.split(',').map(Number);
      let cx=X?X(c):null, cy=Y?Y(r):null;
      if(cx==null){const s=g.querySelector('circle,rect,polygon'); if(s){cx=+(s.getAttribute('cx')||(+s.getAttribute('x')+(+s.getAttribute('width')||0)/2)); cy=+(s.getAttribute('cy')||(+s.getAttribute('y')+(+s.getAttribute('height')||0)/2))}}
      if(cx==null||isNaN(cx)) return;
      const ring=document.createElementNS('http://www.w3.org/2000/svg','circle'); ring.setAttribute('class','bsring'); ring.setAttribute('cx',cx); ring.setAttribute('cy',cy); ring.setAttribute('r',22); rings.appendChild(ring);
    });
  }
  function openBoard(name){
    try{
      const b=boards().find(x=>x.name===name); if(!b) return;
      state.board=name; if(!b[state.mode]) state.mode=b.pve?'pve':'pvp';
      renderBoard(true);
    }catch(e){console.error(e)}
    draw();
    const svg=document.getElementById('board'); if(svg&&svg.scrollIntoView) try{svg.scrollIntoView({block:'nearest'})}catch(e){}
  }
  function wire(){
    const box=document.getElementById('boardsearchbox'); if(!box||box.dataset.bswired) return; box.dataset.bswired='1';
    let t=null;
    box.addEventListener('input',e=>{if(e.target&&e.target.id==='bsq'){q=e.target.value||''; clearTimeout(t); t=setTimeout(()=>{sset('bsq',q); draw()},120)}});
    box.addEventListener('click',e=>{
      const c=e.target.closest&&e.target.closest('[data-bsq]'); if(c){q=q===c.dataset.bsq?'':c.dataset.bsq; const i=box.querySelector('#bsq'); if(i) i.value=q; sset('bsq',q); draw(); return}
      const b=e.target.closest&&e.target.closest('[data-bsboard]'); if(b) openBoard(b.dataset.bsboard);
    });
    // the board map is redrawn by boards.js (board/mode buttons, level plan "Show on map"): re-apply rings after each redraw
    const svg=document.getElementById('board');
    if(svg&&typeof MutationObserver!=='undefined'){let busy=false; new MutationObserver(()=>{if(busy) return; busy=true; setTimeout(()=>{busy=false; if(!svg.querySelector('#bsrings')||curBoard()!==wire.lastBoard){wire.lastBoard=curBoard(); draw()}},0)}).observe(svg,{childList:true})}
    wire.lastBoard=curBoard();
  }
  window.renderBoardSearch=function(){
    if(!boards().length) return;
    let box=document.getElementById('boardsearchbox');
    if(!box){const sec=document.getElementById('boards'); const lay=sec&&sec.querySelector('.boardlayout'); if(!lay) return; box=document.createElement('div'); box.id='boardsearchbox'; lay.parentNode.insertBefore(box,lay)}
    addStyle(); render(); wire();
  };
  window.boardSearch=search;
  try{window.renderBoardSearch()}catch(e){console.error(e)}
})();

/* ---------- Skill numbers at every rank (Skills & Stigmas tab) ----------
   data: P.SKILLNUMS (this class only, preferred) or global SKILLNUMS = audit/r7/skillnums.json ({classes:{slug:{sk:[...]}}})
   mount: <div id="skillnums"> inside section#skills (created after the Stigma boxes if it is missing)
   reads: SKILLPLAN (planned rank at 45), C (skill order), ic() (icons), S (saved ranks), SLUG */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const data=()=>{
    try{if(typeof P!=='undefined'&&P&&P.SKILLNUMS)return P.SKILLNUMS}catch(e){}
    const G=(typeof SKILLNUMS!=='undefined'&&SKILLNUMS)||window.SKILLNUMS||null;
    if(!G)return null; const c=(G.classes||G)[SLUG]; return c&&c.sk?c:null;
  };
  const MB='https://metabot.gg/en/aion-2/skills/';
  const sid=n=>String(n).replace(/[^A-Za-z0-9]+/g,'-');
  const TYPEN={a:'Active',c:'Chain',s:'Stigma',p:'Passive',x:'Proc'};
  const BOARD={N:'Nezekan',Z:'Zikel',V:'Vaizel',T:'Triniel',A:'Ariel',S:'Azphel'};
  const ROWN={d:'Damage',e:'Extra damage',h:'Heal',o:'Damage over time'};
  // ---- compact arrays: "k;first,delta,delta*n,..." (see build_skillnums.py) ----
  const cache=new Map();
  function arr(x){
    if(typeof x!=='string'||x.indexOf(';')<0)return x;
    if(cache.has(x))return cache.get(x);
    const i=x.indexOf(';'),k=+x.slice(0,i),out=[];let cur=0;
    x.slice(i+1).split(',').forEach((p,j)=>{const m=p.indexOf('*');
      if(m>0){const d=+p.slice(0,m),n=+p.slice(m+1);for(let t=0;t<n;t++){cur+=d;out.push(cur)}}
      else{cur=j===0?+p:cur+(+p);out.push(cur)}});
    const res=k>1?out.map(v=>Math.round(v)/k):out; cache.set(x,res); return res;
  }
  const at=(x,r)=>{const a=arr(x);return Array.isArray(a)?a[Math.max(0,Math.min(r,a.length)-1)]:a};
  const varies=x=>{const a=arr(x);return Array.isArray(a)&&a.some(v=>v!==a[0])};
  const N=v=>{if(v==null||v==='')return '—';if(typeof v!=='number')return h(v);return Number.isInteger(v)?v.toLocaleString('en-US'):(+v.toFixed(4)).toLocaleString('en-US',{maximumFractionDigits:4})};
  const pctN=v=>N(Math.round(v*100)/100);

  // ---- guide plan ----
  function planMap(){
    try{const mode=(typeof S!=='undefined'&&S.get('ptmode','base'))||'base';
      const PL=SKILLPLAN[mode]||SKILLPLAN.base;const L=Object.keys(PL.states).map(Number).sort((a,b)=>a-b);
      return PL.states[L[L.length-1]]||{};}catch(e){return {}}
  }
  function planOf(s,PM){
    if(PM[s.n])return PM[s.n];
    if(s.t==='c'&&s.co&&s.co.length){for(const p of s.co)if(PM[p])return PM[p]}
    return 0;
  }
  const boards45=s=>(s.dn||[]).filter(d=>!d[1]||d[1]<=45).length;
  const maxR=s=>s.mr||40;
  const clampR=(s,r)=>Math.max(1,Math.min(maxR(s),Math.round(+r)||1));

  // ---- per-rank pieces ----
  function rowAt(s,row,r){
    const hits=row[2]||1,f=at(row[3],r),p=at(row[4],r),fx=row.length>5?at(row[5],r):null,px=row.length>6?at(row[6],r):null;
    return {kind:row[0],label:row[1],hits,f,p,fx,px,chance:row[7]};
  }
  function dmgText(x,total){
    const m=total?x.hits:1;
    const a=x.f!=null?N(x.f*m):'';const b=x.p?` (+${pctN(x.p*m)}% Attack)`:'';
    const lo=(a||'')+b;
    if(x.fx!=null&&x.fx!==x.f){const c=N(x.fx*m)+(x.px?` (+${pctN(x.px*m)}% Attack)`:'');return lo+'–'+c}
    return lo||'—';
  }
  function fillTip(s,r){
    if(!s.tt)return '';
    const rows=s.dm||[];
    return s.tt.replace(/\{(\d+)\}/g,(m,i)=>{const v=(s.tv||[])[+i];if(v===undefined)return m;
      if(typeof v==='string'&&v[0]==='@'){const row=rows[+v.slice(1)];return row?N(at(row[3],r)):m}
      return N(at(v,r))});
  }
  function pointsTo(s,r){
    const pc=arr(s.pc);if(!Array.isArray(pc)&&pc==null)return null;
    const list=Array.isArray(pc)?pc:Array(s.tr||10).fill(pc);
    if(r>list.length)return {cost:null,total:list.reduce((a,b)=>a+(b||0),0),over:true,cap:list.length};
    return {cost:list[r-1]||0,total:list.slice(0,r).reduce((a,b)=>a+(b||0),0),over:false,cap:list.length};
  }
  function summary(s,r){
    const bits=[];
    const d=(s.dm||[])[0];
    if(d&&!data().kr){const x=rowAt(s,d,r);bits.push((x.kind==='h'?'Heals ':'')+dmgText(x,true)+(x.hits>1?` over ${x.hits} hits`:''))}
    const cd=at(s.cd,r);if(cd)bits.push('CD '+N(cd)+'s');
    if(s.mp)bits.push(N(at(s.mp,r))+' MP');
    return bits.join(' · ');
  }

  function addStyle(){
    if(document.getElementById('snstyle'))return;
    const el=document.createElement('style');el.id='snstyle';
    el.textContent=[
      '#skillnums{display:grid;gap:12px;min-width:0}',
      '#skillnums .snbar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}',
      '#skillnums .snbar input[type=search]{flex:1 1 200px;min-width:0;background:var(--panel2);border:1px solid var(--line);color:var(--fg);border-radius:8px;padding:7px 10px;font:14px var(--f-body)}',
      '#skillnums h4{margin:6px 0 0;font:600 12px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}',
      '.snlist{display:grid;gap:6px;min-width:0}',
      '.snsk{border:1px solid var(--line);border-radius:10px;background:var(--panel2);min-width:0}',
      '.snsk>summary{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;padding:8px 10px;cursor:pointer;list-style:none}',
      '.snsk>summary::-webkit-details-marker{display:none}',
      '.snsk>summary::before{content:"▸";color:var(--muted);font-size:12px}',
      '.snsk[open]>summary::before{content:"▾"}',
      '.snsk>summary b{font-size:15px}',
      '.snsk>summary .snsum{flex:1 1 220px;min-width:0;font:13px var(--f-mono);color:var(--muted);overflow-wrap:anywhere}',
      '.snsk .snrk{font:600 12px var(--f-mono);padding:1px 7px;border-radius:999px;border:1px solid var(--line);color:var(--fg);white-space:nowrap}',
      '.snsk .snrk.plan{color:var(--bg);background:var(--gold);border-color:var(--gold)}',
      '.snbody{display:grid;grid-template-columns:minmax(0,1fr);gap:10px;padding:4px 12px 12px;min-width:0}','.snbody>*{min-width:0;max-width:100%}','.sntw{overflow-x:auto;max-width:100%;-webkit-overflow-scrolling:touch}',
      '.snslide{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}',
      '.snslide input[type=range]{flex:1 1 220px;min-width:0;accent-color:var(--gold)}',
      '.snslide output{font:600 18px var(--f-mono);color:var(--gold);min-width:3ch;text-align:right}',
      '.snticks{position:relative;height:14px;flex:1 1 100%;margin-top:-8px}',
      '.snticks i{position:absolute;top:0;transform:translateX(-50%);font:600 12px var(--f-mono);color:var(--gold);font-style:normal;white-space:nowrap}',
      '.snticks i.b{color:var(--wind)}',
      '.snbtn{background:var(--panel);border:1px solid var(--line);color:var(--fg);font:600 12px var(--f-body);padding:4px 9px;border-radius:999px;cursor:pointer}',
      '.snbtn.plan{border-color:var(--gold);color:var(--gold)}',
      '.snfacts{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin:0}',
      '.snfacts div{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:5px 8px;min-width:0}',
      '.snfacts dt{font:600 12px var(--f-mono);letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}',
      '.snfacts dd{margin:0;font-size:14px;overflow-wrap:anywhere}',
      '.sntip{margin:0;white-space:pre-line;font-size:14px;border-left:3px solid var(--line);padding:4px 10px;color:var(--fg)}',
      '.snsk table{width:100%;border-collapse:collapse;font-size:13px}',
      '.snsk th,.snsk td{padding:4px 7px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}',
      '.snsk td.num,.snsk th.num{text-align:right;font-family:var(--f-mono);white-space:nowrap}',
      '.snsk tr.cur td{background:color-mix(in srgb,var(--gold) 14%,transparent)}',
      '.snsk tr.plan td:first-child{box-shadow:inset 3px 0 0 var(--gold)}',
      '.snspec{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:14px}',
      '.snspec li{display:flex;gap:8px;align-items:baseline}',
      '.snspec li span.u{font:600 12px var(--f-mono);min-width:64px;color:var(--muted)}',
      '.snspec li.on span.u{color:var(--wind)}',
      '.snspec li.off{opacity:.62}',
      '.sncred{font-size:12px;color:var(--muted);margin:0}',
      '.snjump{background:none;border:1px solid var(--line);color:var(--muted);font:600 12px var(--f-mono);border-radius:999px;padding:0 6px;margin-left:6px;cursor:pointer;vertical-align:middle}',
      '.snjump:hover,.snbtn:hover{border-color:var(--gold);color:var(--gold)}',
      '@media (max-width:560px){.snfacts{grid-template-columns:1fr 1fr}.snsk>summary .snsum{flex-basis:100%}}'
    ].join('\n');
    document.head.appendChild(el);
  }

  // saved per-skill ranks: {name: rank}
  const getR=()=>{try{return S.get('snr',{})||{}}catch(e){return {}}};
  const setR=o=>{try{S.set('snr',o)}catch(e){}};
  function rankFor(s,PM){const R=getR();if(R[s.n])return clampR(s,R[s.n]);const p=planOf(s,PM);return clampR(s,p||1)}

  function order(D){
    const C2=(typeof C!=='undefined'&&C)||{};
    const ap=C2.activePriority||[],pp=C2.passivePriority||[],st=(C2.stigmasPve||[]).map(x=>x.name);
    const idx=(list,n)=>{const i=list.indexOf(n);return i<0?999:i};
    const sk=D.sk.slice();
    const groups=[
      ['Main skills',sk.filter(s=>s.t==='a'&&idx(ap,s.n)<6).sort((a,b)=>idx(ap,a.n)-idx(ap,b.n))],
      ['Other skills',sk.filter(s=>s.t==='a'&&idx(ap,s.n)>=6).sort((a,b)=>idx(ap,a.n)-idx(ap,b.n))],
      ['Chain and proc skills',sk.filter(s=>s.t==='c'||s.t==='x')],
      ['Stigmas',sk.filter(s=>s.t==='s').sort((a,b)=>idx(st,a.n)-idx(st,b.n))],
      ['Passives',sk.filter(s=>s.t==='p').sort((a,b)=>idx(pp,a.n)-idx(pp,b.n))]
    ];
    return groups.filter(g=>g[1].length);
  }

  function credit(s,D){
    if(s.mb)return `<p class="sncred">Numbers: Global client data from <a href="${MB}${encodeURIComponent(s.mb)}" target="_blank" rel="noopener">${h(s.n)} on MetaBot.GG</a> (client build 0.0.4387.0).${s.at?' Action time is our simulator\'s fit.':''}</p>`;
    if(D.kr)return `<p class="sncred">Brawler is Korea only: rank-1 launch values from Korean tooltips (Inven, aion2hub) and shugo.gg skill ids. Per-rank numbers aren't published yet.</p>`;
    return `<p class="sncred">Numbers: Global client values via shugo.gg skill data (chain skills have no MetaBot.GG page); ranks follow the skill it chains from.${s.at?' Action time is our simulator\'s fit.':''}</p>`;
  }

  function body(s,D,r,PM){
    const plan=planOf(s,PM),bd=boards45(s),mr=maxR(s),kr=!!D.kr;
    let o='';
    if(!kr&&mr>1){
      const tick=(v,cls,l)=>v>=1&&v<=mr?`<i class="${cls}" style="left:${mr>1?(v-1)/(mr-1)*100:0}%" title="${h(l)}">${cls==='b'?'+B':'▲'}</i>`:'';
      o+=`<div class="snslide"><label for="snr-${sid(s.n)}" class="small">Rank</label><input type="range" id="snr-${sid(s.n)}" min="1" max="${mr}" step="1" value="${r}" data-snr="${h(s.n)}" aria-describedby="snp-${sid(s.n)}"><output data-sno="${h(s.n)}">${r}</output>`+
        (plan?`<button type="button" class="snbtn plan" data-snset="${plan}">Plan at 45: ${plan}</button>`:'')+
        (plan&&bd?`<button type="button" class="snbtn" data-snset="${Math.min(mr,plan+bd)}">+ boards: ${Math.min(mr,plan+bd)}</button>`:'')+
        `<button type="button" class="snbtn" data-snset="${mr}">Max ${mr}</button>`+
        `<div class="snticks" aria-hidden="true">${tick(plan,'','Guide plan at 45')}${plan&&bd?tick(Math.min(mr,plan+bd),'b','Plan + Daevanion nodes'):''}</div></div>`+
        `<p class="small muted" id="snp-${sid(s.n)}" style="margin:0">${plan?`This guide's plan at 45: <b style="color:var(--gold)">rank ${plan}</b> from skill points${bd?`, plus up to ${bd} from Daevanion nodes (${(s.dn||[]).map(d=>BOARD[d[0]]||d[0]).join(', ')})`:''}.`:(s.t==='s'?'Stigma ranks come from Stigma shards: see Shard spending order above.':s.t==='c'?'Chain skills use the rank of the skill they follow.':'Not in the skill-point plan.')}</p>`;
    }
    o+=`<div class="snrank" data-snrank="${h(s.n)}">${rankPart(s,D,r,plan)}</div>`;
    if(s.sx&&s.sx.length) o+=`<div><h4>Specializations</h4><ul class="snspec" data-snspec="${h(s.n)}">${specPart(s,r)}</ul><p class="small muted" style="margin:4px 0 0">You get 1 slot at rank 8, 2 at 12 and 3 at 20; the rank on the skill icon (with Daevanion bonuses) counts.</p></div>`;
    const links=[];
    if(s.co&&s.co.length)links.push('Follows <b>'+s.co.map(h).join(', ')+'</b>');
    if(s.ch&&s.ch.length)links.push('Leads to '+s.ch.map(c=>`<b>${h(c[0])}</b>${c[1]?` <span class="muted">(${h(c[1])})</span>`:''}`).join(', '));
    if(links.length)o+=`<p class="small" style="margin:0">${links.join('. ')}.</p>`;
    if(!kr&&mr>1)o+=`<details class="snall" data-snall="${h(s.n)}"><summary class="small"><b>Every rank (1–${mr})</b></summary><div class="tablewrap" style="margin-top:6px"></div></details>`;
    o+=credit(s,D);
    return o;
  }
  function rankPart(s,D,r,plan){
    const kr=!!D.kr,f=[];
    const add=(k,v)=>{if(v!=null&&v!=='')f.push(`<div><dt>${k}</dt><dd>${v}</dd></div>`)};
    if(s.mp)add('MP cost',N(at(s.mp,r)));
    (s.gn||[]).forEach(g=>add(h(g[0])+(g[2]?' gain %':' gain'),N(g[1])));
    const cd=at(s.cd,r);add('Cooldown',cd?N(cd)+' s'+(varies(s.cd)?' <span class="muted">(at this rank)</span>':''):'none');
    if(s.ct)add('Cast time',N(s.ct)+' s');
    if(s.at)add('Action time',`≈ ${N(s.at)} s <span class="muted">(sim, 0% Combat Speed)</span>`);
    if(s.rg)add('Range',N(s.rg)+' m');
    if(s.tg)add('Targets',`up to ${N(s.tg)}${s.ar?` within ${N(s.ar)} m`:''}`);
    else if(s.ar)add('Area',N(s.ar)+' m');
    if(s.pr)add('Party range',N(s.pr)+' m');
    if(s.ul)add('Learned at','level '+N(s.ul));
    if(s.mv)add('While moving','usable');
    const pt=pointsTo(s,r),cur=s.cur==='sh'?'Stigma shards':'skill points';
    if(pt&&!kr){
      if(!pt.over)add(`Rank ${r} costs`,`${N(pt.cost)} ${cur}${pt.total?` <span class="muted">(${N(pt.total)} total from rank 1)</span>`:''}`);
      else add(`Rank ${r}`,`past the ${cur} cap (${pt.cap}): Daevanion nodes, Arcana, Soul Binding${s.go?` (gear up to +${s.go})`:''} <span class="muted">(${N(pt.total)} ${cur} to reach ${pt.cap})</span>`);
      const lv=at(s.lv,r);if(lv&&!pt.over)add('Needs character level',N(lv));
    }
    if(s.top)add('Top players',`${N(s.top[0])}% pick it, avg rank ${N(s.top[1])}`);
    let o=`<dl class="snfacts">${f.join('')}</dl>`;
    const rows=s.dm||[];
    if(rows.length&&!kr){
      o+=`<div class="tablewrap"><table><thead><tr><th>Rank ${r}</th><th class="num">Per hit</th><th class="num">Hits</th><th class="num">Total</th></tr></thead><tbody>`+
        rows.map(row=>{const x=rowAt(s,row,r);return `<tr><td>${h(ROWN[x.kind]||'Damage')}${x.label?` <span class="muted">${h(x.label)}</span>`:''}${x.chance?` <span class="muted">(${N(x.chance)}% chance)</span>`:''}</td><td class="num">${x.hits>1?dmgText(x,false):'—'}</td><td class="num">${N(x.hits)}</td><td class="num"><b>${dmgText(x,true)}</b></td></tr>`}).join('')+
        `</tbody></table></div>`+
        `<p class="small muted" style="margin:0">Total = per-hit value × hits (multi-hit skills). % Attack is added on top of the flat number.</p>`;
    }
    const tip=kr?(s.r1||''):(fillTip(s,r)||(r===1?s.r1:'')||'');
    if(tip)o+=`<p class="sntip" data-gloss>${h(tip)}</p>`;
    else if(s.r1)o+=`<p class="sntip" data-gloss><span class="muted">Rank 1:</span> ${h(s.r1)}${s.rx?`\n<span class="muted">Max rank:</span> ${h(s.rx)}`:''}</p>`;
    if(kr)o+=`<p class="small muted" style="margin:0">Rank-1 values only (Korea-only class).</p>`;
    return o;
  }
  function specPart(s,r){
    return (s.sx||[]).map(z=>{const u=z[1],on=u!=null&&r>=u&&z[3]!=='kr25';
      const lab=u==null?'—':z[3]==='kr25'?'rank 25*':'rank '+u;
      return `<li class="${on?'on':'off'}"><span class="u">${on?'✓ ':''}${h(lab)}</span><span>${h(z[2])}${z[3]==='kr25'?' <span class="muted small">*Korea: Stigma level 25. Global Stigmas stop at 20 for now.</span>':''}</span></li>`}).join('');
  }
  function allTable(s,r,plan){
    const mr=maxR(s),rows=s.dm||[],d0=rows[0];const pc=pointsTo(s,1);
    const cdv=varies(s.cd);
    let o=`<div class="sntw"><table><thead><tr><th class="num">Rank</th>${d0?`<th class="num">${h(ROWN[d0[0]]||'Damage')} total</th>`:''}${rows[1]?`<th class="num">${h(ROWN[rows[1][0]]||'Row 2')} total</th>`:''}${cdv?'<th class="num">CD</th>':''}${pc?`<th class="num">${s.cur==='sh'?'Shards':'Points'}</th><th class="num">Needs lv</th>`:''}</tr></thead><tbody>`;
    for(let k=1;k<=mr;k++){
      const p=pointsTo(s,k),lv=at(s.lv,k);
      o+=`<tr class="${k===r?'cur':''}${k===plan?' plan':''}"><td class="num">${k}${k===plan?' ▲':''}</td>${d0?`<td class="num">${dmgText(rowAt(s,d0,k),true)}</td>`:''}${rows[1]?`<td class="num">${dmgText(rowAt(s,rows[1],k),true)}</td>`:''}${cdv?`<td class="num">${N(at(s.cd,k))}s</td>`:''}${pc?`<td class="num">${p&&!p.over?N(p.cost):'—'}</td><td class="num">${p&&!p.over&&lv?N(lv):'—'}</td>`:''}</tr>`;
    }
    return o+'</tbody></table></div>';
  }

  function find(D,n){return D.sk.find(s=>s.n===n)}
  function update(det,D,r){
    const s=find(D,det.dataset.sn);if(!s)return;
    const PM=planMap(),plan=planOf(s,PM);r=clampR(s,r);
    const o=det.querySelector('[data-sno]');if(o)o.textContent=r;
    const inp=det.querySelector('[data-snr]');if(inp&&+inp.value!==r)inp.value=r;
    const rp=det.querySelector('[data-snrank]');if(rp)rp.innerHTML=rankPart(s,D,r,plan);
    const sp=det.querySelector('[data-snspec]');if(sp)sp.innerHTML=specPart(s,r);
    const sum=det.querySelector('.snsum');if(sum)sum.textContent=summary(s,r);
    const chip=det.querySelector('.snrk');if(chip){chip.textContent='Rank '+r;chip.classList.toggle('plan',!!plan&&r===plan)}
    const all=det.querySelector('[data-snall]');if(all&&all.open)all.querySelector('.tablewrap').innerHTML=allTable(s,r,plan);
  }
  function openBody(det,D){
    if(det.dataset.snb)return;const s=find(D,det.dataset.sn);if(!s)return;
    det.dataset.snb='1';const PM=planMap();
    det.querySelector('.snbody').innerHTML=body(s,D,rankFor(s,PM),PM);
    try{if(window.refGloss) det.querySelectorAll('.snbody [data-gloss]').forEach(e=>window.refGloss.mark(e))}catch(e){}
  }

  function render(){
    const D=data();
    let host=document.getElementById('skillnums');
    const sec=document.getElementById('skills');
    if(!D){if(host)host.hidden=true;return}
    if(!host){if(!sec)return;host=document.createElement('div');host.id='skillnums';host.className='box';sec.appendChild(host)}
    host.hidden=false;addStyle();
    const PM=planMap();
    const groups=order(D);
    const kr=!!D.kr;
    host.innerHTML=`<h3 style="margin:0">Skill numbers at every rank</h3>
      <p class="small muted" style="margin:0">Open a skill and drag its rank slider (rank 1 up to the skill's max, 25 or 40) to see that rank's damage, multi-hit totals, MP, cooldown, range, point cost and which specializations are open. <b style="color:var(--gold)">▲ / gold</b> marks this guide's plan at 45; <b style="color:var(--wind)">+B</b> adds the Daevanion nodes for that skill.${kr?' <b>Brawler is Korea only:</b> only rank-1 values are published, so there are no sliders.':''}</p>
      <div class="snbar">${kr?'':`<div class="seg" role="group" aria-label="Set every skill to"><button type="button" data-snall-set="plan">Plan at 45</button><button type="button" data-snall-set="boards">Plan + boards</button><button type="button" data-snall-set="1">Rank 1</button><button type="button" data-snall-set="max">Max</button></div>`}
        <input type="search" id="snfind" placeholder="Find a skill…" aria-label="Find a skill"></div>`+
      groups.map(([g,list])=>`<h4>${h(g)} <span class="muted">(${list.length})</span></h4><div class="snlist">`+list.map(s=>{
        const r=rankFor(s,PM),plan=planOf(s,PM);
        return `<details class="snsk" data-sn="${h(s.n)}" id="sn-${sid(s.n)}"><summary>${typeof ic==='function'?ic(s.n,'sm'):''}<b>${h(s.n)}</b> <span class="tag">${TYPEN[s.t]||''}</span>${kr?'':` <span class="snrk${plan&&r===plan?' plan':''}">Rank ${r}</span>`}<span class="snsum">${h(kr?(s.cd?'CD '+s.cd+'s':''):summary(s,r))}</span></summary><div class="snbody"></div></details>`}).join('')+`</div>`).join('')+
      `<p class="sncred">Per-rank numbers are read from the AION 2 Global client and published by <a href="https://metabot.gg/en/aion-2/skills" target="_blank" rel="noopener">MetaBot.GG</a> (each skill links to its own MetaBot.GG page). Chain skills come from shugo.gg's skill data. Action times are fitted by this guide's simulator.</p>`;
    host.querySelectorAll('details.snsk').forEach(det=>det.addEventListener('toggle',()=>{if(det.open)openBody(det,D)}));
    addJumps(D);
  }
  // listeners (delegated, set once)
  document.addEventListener('input',e=>{const t=e.target;if(!t||!t.dataset||!t.dataset.snr)return;const det=t.closest('details.snsk'),D=data();if(!det||!D)return;
    const R=getR();R[t.dataset.snr]=+t.value;setR(R);update(det,D,+t.value)});
  document.addEventListener('change',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.snr){const det=t.closest('details.snsk'),D=data();if(det&&D)update(det,D,+t.value)}});
  document.addEventListener('toggle',e=>{const d=e.target;if(!d||!d.dataset||!d.dataset.snall||!d.open)return;const det=d.closest('details.snsk'),D=data();if(!det||!D)return;
    const s=find(D,det.dataset.sn);const PM=planMap();d.querySelector('.tablewrap').innerHTML=allTable(s,rankFor(s,PM),planOf(s,PM))},true);
  document.addEventListener('click',e=>{
    const t=e.target.closest&&e.target.closest('[data-snset],[data-snall-set],[data-snj]');if(!t)return;
    const D=data();if(!D)return;
    if(t.dataset.snset){const det=t.closest('details.snsk');if(!det)return;const R=getR();R[det.dataset.sn]=+t.dataset.snset;setR(R);update(det,D,+t.dataset.snset);return}
    if(t.dataset.snallSet){const PM=planMap(),R={},m=t.dataset.snallSet;
      D.sk.forEach(s=>{const p=planOf(s,PM);R[s.n]=m==='1'?1:m==='max'?maxR(s):m==='boards'?(p?Math.min(maxR(s),p+boards45(s)):1):(p||1)});
      setR(R);document.querySelectorAll('#skillnums details.snsk').forEach(det=>{const s=find(D,det.dataset.sn);if(s&&det.dataset.snb)update(det,D,R[s.n]);else if(s){const c=det.querySelector('.snrk');if(c){c.textContent='Rank '+clampR(s,R[s.n]);c.classList.toggle('plan',!!planOf(s,PM)&&clampR(s,R[s.n])===planOf(s,PM))}const sm=det.querySelector('.snsum');if(sm&&!D.kr)sm.textContent=summary(s,clampR(s,R[s.n]))}});
      return}
    if(t.dataset.snj){e.preventDefault();const det=[...document.querySelectorAll('#skillnums details.snsk')].find(d=>d.dataset.sn===t.dataset.snj);if(!det)return;
      if(typeof show==='function'&&document.getElementById('skills')&&document.getElementById('skills').hidden)show('skills',true);
      det.open=true;openBody(det,D);try{det.scrollIntoView({behavior:'smooth',block:'start'})}catch(_){}}
  });
  document.addEventListener('input',e=>{if(!e.target||e.target.id!=='snfind')return;const q=e.target.value.trim().toLowerCase();
    document.querySelectorAll('#skillnums details.snsk').forEach(d=>{d.hidden=!!q&&d.dataset.sn.toLowerCase().indexOf(q)<0});
    document.querySelectorAll('#skillnums h4').forEach(hd=>{const l=hd.nextElementSibling;hd.hidden=!!(l&&[...l.children].every(c=>c.hidden))})});

  // small "#" buttons after skill names in the Specializations and Stigma tables
  function addJumps(D){
    const names=new Set(D.sk.map(s=>s.n));
    document.querySelectorAll('#skills #specwrap td:first-child b, #skills #spectable td:first-child b, #skills #stigtable td b').forEach(b=>{
      if(b.dataset.snj||b.nextElementSibling&&b.nextElementSibling.classList&&b.nextElementSibling.classList.contains('snjump'))return;
      const n=b.textContent.trim();if(!names.has(n))return;
      b.dataset.snj='1';b.insertAdjacentHTML('afterend',`<button type="button" class="snjump" data-snj="${h(n)}" aria-label="Show ${h(n)} numbers at every rank" title="Numbers at every rank">#</button>`);
    });
  }
  window.renderSkillNums=render;
  try{render()}catch(e){if(window.console)console.error('skillnums',e)}
  // re-mark the plan when the Level-plan points mode changes
  document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#ptmode button'))setTimeout(()=>{try{render()}catch(_){}},0)});
})();

/* ---------- Item details popover (Gear & stats + Upgrades & stones tabs) ----------
   data: global ITEMDETAIL = audit/r7/itemdetail.json; reroll verdicts from ROLLS (audit/r3/rolls.json) via rollsFor() when present
   Item names (and a few phrases such as "Nuakum set") in #gear and #upgrades become buttons; the gear planner also gets an
   "Item stats" button per slot. Clicking opens a popover: stats at +0..+15, Amplify, Potential, Soul Binding roll ranges with a
   "stop rerolling at" hint, and a link to the item's MetaBot.GG page (credit). Must load after gear_fn.js and rolls_fn.js. */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const D=()=>(typeof ITEMDETAIL!=='undefined'&&ITEMDETAIL)||window.ITEMDETAIL||null;
  const MB='https://metabot.gg/en/aion-2/items/';
  const N=v=>v==null?'—':typeof v==='number'?(Number.isInteger(v)?v.toLocaleString('en-US'):(+v.toFixed(2)).toLocaleString('en-US',{maximumFractionDigits:2})):h(v);
  const SLOTK={weapon:'weapon',guard:'guard',helmet:'helmet',shoulders:'shoulders',chest:'chest',gloves:'gloves',legs:'legs',boots:'boots',cloak:'cloak',necklace:'necklace',ear1:'ear',ear2:'ear',ring1:'ring',ring2:'ring',bracelet:'bracelet',amulet:'amulet',belt:'belt'};
  const SLOTN={weapon:'weapon',guard:'guard',helmet:'helmet',shoulders:'shoulders',chest:'chest',gloves:'gloves',legs:'legs',boots:'boots',cloak:'cloak',necklace:'necklace',ear:'earrings',ring:'ring',bracelet:'bracelet',amulet:'amulet',belt:'belt'};
  const ROLLKEY={ear:'ear1',ring:'ring1'};
  const mine=it=>!it.wc||it.wc===SLUG;

  function addStyle(){
    if(document.getElementById('idstyle'))return;
    const el=document.createElement('style');el.id='idstyle';
    el.textContent=[
      'button.idl{background:none;border:0;padding:0;font:inherit;color:inherit;text-decoration:underline dotted color-mix(in srgb,var(--gold) 70%,transparent);text-underline-offset:3px;cursor:pointer;text-align:inherit}',
      'button.idl:hover,button.idl:focus-visible{color:var(--gold)}',
      'button.idrow{display:inline-block;margin-top:4px;text-decoration:none;font:600 12px var(--f-mono);letter-spacing:.04em;text-transform:uppercase;border:1px solid var(--line);border-radius:999px;padding:2px 8px;color:var(--muted)}',
      'button.idrow:hover{border-color:var(--gold)}',
      '#idpop{position:fixed;z-index:60;inset:auto 16px 16px auto;width:min(620px,calc(100vw - 32px));max-height:min(80vh,760px);overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.45);padding:14px 16px 16px;display:grid;gap:10px}',
      '#idpop[hidden]{display:none}',
      '#idpop .idhead{display:flex;gap:8px;align-items:flex-start}',
      '#idpop .idhead h3{margin:0;font-size:19px;flex:1;min-width:0;overflow-wrap:anywhere}',
      '#idpop .idx{background:var(--panel2);border:1px solid var(--line);color:var(--fg);border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:18px;line-height:1;flex:0 0 auto}',
      '#idpop .idpick{display:flex;flex-wrap:wrap;gap:6px}',
      '#idpop .idpick button{background:var(--panel2);border:1px solid var(--line);color:var(--fg);font:600 12px var(--f-body);padding:5px 9px;border-radius:999px;cursor:pointer}',
      '#idpop .idpick button[aria-pressed="true"]{border-color:var(--gold);color:var(--gold)}',
      '#idpop .idtags{display:flex;flex-wrap:wrap;gap:5px}',
      '#idpop table{width:100%;border-collapse:collapse;font-size:13px}',
      '#idpop th,#idpop td{padding:4px 7px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}',
      '#idpop td.num,#idpop th.num{text-align:right;font-family:var(--f-mono);white-space:nowrap}',
      '#idpop tr.tgt td{background:color-mix(in srgb,var(--gold) 13%,transparent)}',
      '#idpop tr.best td:first-child{box-shadow:inset 3px 0 0 var(--wind)}',
      '#idpop tr.keep td:first-child{box-shadow:inset 3px 0 0 var(--gold)}',
      '#idpop tr.rr td{color:var(--muted)}',
      '#idpop .v-best{color:var(--wind);font-weight:700}#idpop .v-keep{color:var(--gold);font-weight:600}',
      '#idpop details>summary{cursor:pointer;font-weight:600}',
      '#idpop .idcred{font-size:12px;color:var(--muted);margin:0}',
      '#idpop h4{margin:4px 0 0;font:600 12px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}',
      '@media (max-width:640px){#idpop{inset:auto 8px 8px 8px;width:auto;max-height:82vh}}'
    ].join('\n');
    document.head.appendChild(el);
  }

  // ---- lookups ----
  function bySlot(slot){const d=D();return Object.entries(d.items).filter(([s,it])=>it.rec&&it.slot===slot&&mine(it)).sort((a,b)=>a[1].il-b[1].il).map(e=>e[0])}
  function famList(fam,slot){
    const d=D(),pre=(d.fam||{})[fam]||[];
    let l=Object.entries(d.items).filter(([s,it])=>pre.some(p=>s.indexOf(p)===0)&&mine(it));
    if(slot){const f=l.filter(([s,it])=>it.slot===slot);if(f.length)l=f}
    return l.sort((a,b)=>a[1].il-b[1].il||a[0].localeCompare(b[0])).map(e=>e[0]);
  }
  function rowSlot(el){
    const tr=el.closest&&el.closest('table.geartable tr');if(!tr||typeof GEARSLOTS==='undefined')return null;
    const n=(tr.cells[0]&&tr.cells[0].textContent||'').trim();
    const g=(GEARSLOTS.pve||[]).concat(GEARSLOTS.pvp||[]).find(s=>s.n===n);return g?g.k:null;
  }
  function rollsLine(slotKey){
    try{const mode=(typeof S!=='undefined'&&S.get('gearmode','pve'))||'pve';
      const R=typeof rollsFor==='function'?rollsFor(mode):(ROLLS&&ROLLS.classes&&ROLLS.classes[SLUG]&&ROLLS.classes[SLUG][mode]);
      if(!R)return null;const k=ROLLKEY[slotKey]||slotKey;return R[k]||null}catch(e){return null}
  }
  const norm=s=>String(s).toLowerCase().replace(/\(.*?\)/g,'').replace(/\s+/g,' ').trim();
  function verdict(label,R){
    if(!R)return null;const L=norm(label);
    for(const [k,cls] of [['best','best'],['keep','keep'],['reroll','rr']]){
      for(const e of (R[k]||[])){if(/^\+1 /.test(e)||/skill \+1/.test(e))continue;
        if(e.split(' / ').some(p=>{const q=norm(p);return q===L||(q.length>3&&L.indexOf(q)===0)||(L.length>3&&q.indexOf(L)===0)}))return {cls,txt:e}}}
    return null;
  }
  const dp=(it)=>{const s=String(it);const i=s.indexOf('.');return i<0?0:s.length-i-1};
  function stopAt(lo,hi,pct){const m=lo+(hi-lo)/2,d=Math.max(dp(lo),dp(hi),pct?1:0),f=Math.pow(10,d);return Math.ceil(m*f-1e-9)/f}

  // ---- popover ----
  let pop=null,lastFocus=null,cur={list:[],i:0,slot:null};
  function ensurePop(){
    if(pop)return pop;addStyle();
    pop=document.createElement('div');pop.id='idpop';pop.hidden=true;pop.setAttribute('role','dialog');pop.setAttribute('aria-modal','false');pop.setAttribute('aria-labelledby','idpoph');
    document.body.appendChild(pop);
    pop.addEventListener('click',e=>{const b=e.target.closest('[data-idi],[data-idclose]');if(!b)return;
      if(b.dataset.idclose!==undefined){close();return}
      cur.i=+b.dataset.idi;paint();});
    return pop;
  }
  function close(){if(!pop||pop.hidden)return;pop.hidden=true;if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}}
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  document.addEventListener('mousedown',e=>{if(pop&&!pop.hidden&&!pop.contains(e.target)&&!(e.target.closest&&e.target.closest('button.idl')))close()});
  function open(list,slot,from){
    const d=D();if(!d)return;list=list.filter(s=>d.items[s]);if(!list.length)return;
    ensurePop();lastFocus=from||document.activeElement;cur={list,i:0,slot};
    paint();pop.hidden=false;const x=pop.querySelector('.idx');if(x)try{x.focus()}catch(e){}
  }
  function enhTarget(slotKey){
    try{if(typeof GEARSLOTS==='undefined'||!slotKey)return null;const g=GEARSLOTS.pve.find(s=>s.k===slotKey||SLOTK[s.k]===slotKey);const m=g&&/\+(\d+)/.exec(g.enh);return m?+m[1]:null}catch(e){return null}
  }
  function view(slug){
    const d=D(),it=d.items[slug];const slotKey=cur.slot||it.slot;
    let o=`<div class="idtags"><span class="tag gold">${h(it.g)}</span><span class="tag">${h(it.c)}</span><span class="tag wind">IL${N(it.il)}</span><span class="tag">Req. level ${N(it.rl)}</span>${it.cls?`<span class="tag">${h(it.cls)}</span>`:''}<span class="tag">Max ${h(it.me)}</span></div>`;
    if(it.fx&&it.fx.length)o+=`<div><h4>Fixed stats (+0)</h4><p class="small" style="margin:2px 0 0">${it.fx.map(f=>`${h(f[0])} <b>${h(f[1])}</b>`).join(' · ')}${it.rng?` · Range ${h(it.rng)}`:''}</p>${it.sock?`<p class="small muted" style="margin:2px 0 0">Sockets: ${h(it.sock)}</p>`:''}</div>`;
    // enhancement
    if(it.en){const E=d.enh[it.en[0]],CH=d.ch[it.en[1]]||[],tg=enhTarget(slotKey);
      o+=`<details open><summary>Enhancement: bonus at each level</summary><div class="tablewrap" style="margin-top:6px"><table><thead><tr><th class="num">Level</th>${E.lab.map(l=>`<th class="num">${h(l)}</th>`).join('')}<th class="num">Chance</th></tr></thead><tbody>`+
        `<tr><td class="num">+0</td>${E.lab.map(()=>'<td class="num">—</td>').join('')}<td class="num"></td></tr>`+
        E.v.map((row,i)=>`<tr class="${tg===i+1?'tgt':''}"><td class="num">+${i+1}${tg===i+1?' ◀':''}</td>${row.map((v,j)=>`<td class="num">${v==null?'—':'+'+N(v)+(E.pct[j]?'%':'')}</td>`).join('')}<td class="num">${CH[i]!=null?N(CH[i])+'%':''}</td></tr>`).join('')+
        `</tbody></table></div><p class="small muted" style="margin:4px 0 0">Bonus added on top of the fixed stats, as the game lists it at each level. Chance is the base success chance; failures add a pity bonus.${tg?` ◀ = this guide's target for this slot (+${tg}).`:''}</p></details>`;}
    if(it.am!=null){const A=d.amp[it.am];
      o+=`<details><summary>Amplified Enhancement (+16 to +${A.length+15})</summary><div class="tablewrap" style="margin-top:6px"><table><thead><tr><th class="num">Level</th><th class="num">Chance</th><th>Total Amplify bonus</th></tr></thead><tbody>${A.map(a=>`<tr><td class="num">${h(a[0])}</td><td class="num">${a[1]!=null?N(a[1])+'%':'—'}</td><td>${h(a[2])}</td></tr>`).join('')}</tbody></table></div><p class="small muted" style="margin:4px 0 0">Needs +15 first; costs Amplify Stones (Unique). Costs and odds planning: Upgrades &amp; stones › Cost planner.</p></details>`;}
    if(it.po!=null){const Pt=d.pot[it.po];
      o+=`<details><summary>Potential (PvP)</summary><p class="small" style="margin:6px 0 0">${Pt.map(p=>`${h(p[0])}: ${h(p[1])}`).join(' · ')}. Every step succeeds (Potential Stones + Abyss Points).</p></details>`;}
    // soul binding
    if(it.rs){const pool=d.pool[it.rs[1]],R=rollsLine(slotKey);
      const rows=pool.map(l=>({l,v:verdict(l[0],R)})).sort((a,b)=>{const o2={best:0,keep:1,rr:3};return (a.v?o2[a.v.cls]:2)-(b.v?o2[b.v.cls]:2)});
      const anyV=rows.some(r=>r.v);
      o+=`<details open><summary>Soul Binding: ${N(it.rs[0])} random line${it.rs[0]>1?'s':''}, roll ranges at IL${N(it.il)}</summary><div class="tablewrap" style="margin-top:6px"><table><thead><tr><th>Line</th><th class="num">Lowest</th><th class="num">Highest</th><th class="num">Chance</th>${anyV?'<th>For you</th><th class="num">Stop at ≥</th>':''}</tr></thead><tbody>`+
        rows.map(({l,v})=>{const u=l[3]?'%':'';const good=v&&(v.cls==='best'||v.cls==='keep');
          return `<tr class="${v?v.cls:''}"><td>${h(l[0])}</td><td class="num">+${N(l[1])}${u}</td><td class="num">+${N(l[2])}${u}</td><td class="num">${N(l[4])}%</td>${anyV?`<td>${v?`<span class="v-${v.cls==='rr'?'rr':v.cls}">${v.cls==='best'?'Best':v.cls==='keep'?'Good enough':'Reroll'}</span>`:'<span class="muted">—</span>'}</td><td class="num">${good?'+'+N(stopAt(l[1],l[2],l[3]))+u:''}</td>`:''}</tr>`}).join('')+
        `</tbody></table></div>`;
      if(it.so){const so=Array.isArray(it.so)?it.so:(it.so[SLUG]||null);
        if(so){const sk=R?[].concat(R.best||[],R.keep||[]).filter(e=>/^\+1 /.test(e)):[];
          o+=`<p class="small" style="margin:6px 0 0">Skill option: about 1 line in 5 is <b>+${N(so[2])} to one of ${N(so[0])} class skills</b> (${N(so[1])}% each).${sk.length?` Worth keeping for you: ${sk.map(h).join(', ')}.`:''}</p>`}}
      o+=anyV?`<p class="small muted" style="margin:6px 0 0"><b>Stop rerolling a line when it is Best or Good enough and at least the "Stop at" value</b> (the middle of its range on this item level). A Sync rerolls the whole line from the pool above, so a lower Best roll is still worth keeping: the chance column is how rarely you'd get that line back. Bind afterwards raises every value.</p>`:`<p class="small muted" style="margin:6px 0 0">Verdicts per line appear for the 8 Global classes (from the guide's Soul Binding targets).</p>`;
      // same lines on other item levels of this slot
      const others=Object.entries(d.items).filter(([s,x])=>x.rs&&x.slot===it.slot&&mine(x)&&x.rec&&x.il!==it.il);
      if(others.length){const byIl={};others.forEach(([s,x])=>{if(!byIl[x.il])byIl[x.il]=d.pool[x.rs[1]]});byIl[it.il]=pool;
        const ils=Object.keys(byIl).map(Number).sort((a,b)=>a-b);
        const want=rows.filter(r=>r.v&&r.v.cls!=='rr').map(r=>r.l[0]);const lines=(want.length?want:pool.slice(0,6).map(l=>l[0]));
        o+=`<details><summary>Same lines on other ${h(SLOTN[it.slot]||it.slot)} item levels</summary><div class="tablewrap" style="margin-top:6px"><table><thead><tr><th>Line</th>${ils.map(i=>`<th class="num">IL${i}</th>`).join('')}</tr></thead><tbody>${lines.map(n=>`<tr><td>${h(n)}</td>${ils.map(i=>{const l=byIl[i].find(x=>x[0]===n);return `<td class="num">${l?`${N(l[1])}–${N(l[2])}${l[3]?'%':''}`:'—'}</td>`}).join('')}</tr>`).join('')}</tbody></table></div></details>`;}
      o+=`</details>`;
    }else if(it.slot!=='amulet'&&it.slot!=='belt'){o+=`<p class="small muted" style="margin:0">No random Soul Binding lines listed for this item.</p>`}
    o+=`<p class="idcred">Item data: <a href="${MB}${encodeURIComponent(slug)}" target="_blank" rel="noopener">${h(it.n)} on MetaBot.GG</a> (AION 2 Global client${d.build?' build '+h(d.build):''}, read ${h(d.read||'')}).</p>`;
    return o;
  }
  function paint(){
    const d=D(),slug=cur.list[cur.i],it=d.items[slug];
    pop.innerHTML=`<div class="idhead"><h3 id="idpoph">${h(it.n)}</h3><button type="button" class="idx" data-idclose aria-label="Close item details">×</button></div>`+
      (cur.list.length>1?`<div class="idpick" role="group" aria-label="Pick an item">${cur.list.map((s,i)=>`<button type="button" data-idi="${i}" aria-pressed="${i===cur.i}">${h(d.items[s].n)} <span class="muted">IL${d.items[s].il}</span></button>`).join('')}</div>`:'')+
      view(slug);
  }

  // ---- turn item names in the Gear and Upgrades tabs into buttons ----
  let RX=null,NAMES=null;
  function regex(){
    if(RX)return RX;const d=D();NAMES={};
    Object.entries(d.items).forEach(([s,it])=>{(NAMES[it.n.toLowerCase()]=NAMES[it.n.toLowerCase()]||[]).push(s)});
    const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const parts=Object.keys(NAMES).sort((a,b)=>b.length-a.length).map(n=>esc(d.items[NAMES[n][0]].n));
    const al=(d.alias||[]).map(a=>a[0]);
    RX=new RegExp('(?<![A-Za-z\'’])('+al.concat(parts).join('|')+')(?![A-Za-z])','g');
    return RX;
  }
  function resolve(text,el){
    const d=D(),slotK=rowSlot(el),slot=slotK?SLOTK[slotK]:null;
    const ex=NAMES[text.toLowerCase()];
    if(ex){const l=ex.filter(s=>mine(d.items[s]));return l.length?l:ex}
    for(const [src,fam] of (d.alias||[])){if(new RegExp('^(?:'+src+')$').test(text))return famList(fam,slot)}
    return [];
  }
  const SKIP='a,button,label,select,option,textarea,input,script,style,summary,#idpop,[data-noidl],h1,h2';
  function linkify(root){
    const d=D();if(!d||!root)return;const rx=regex();
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;if(!p||p.closest(SKIP))return NodeFilter.FILTER_REJECT;rx.lastIndex=0;return rx.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});
    const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
    nodes.forEach(n=>{
      const t=n.nodeValue,frag=document.createDocumentFragment();let last=0,m;rx.lastIndex=0;let any=false;
      while((m=rx.exec(t))){const list=resolve(m[0],n.parentElement);if(!list.length)continue;any=true;
        frag.appendChild(document.createTextNode(t.slice(last,m.index)));
        const b=document.createElement('button');b.type='button';b.className='idl';b.dataset.idl=list.join(' ');b.textContent=m[0];b.setAttribute('aria-haspopup','dialog');b.title='Show item stats';
        const sk=rowSlot(n.parentElement);if(sk)b.dataset.ids=sk;
        frag.appendChild(b);last=m.index+m[0].length;}
      if(!any)return;frag.appendChild(document.createTextNode(t.slice(last)));n.parentNode.replaceChild(frag,n);
    });
  }
  function gearButtons(){
    const t=document.querySelector('#gearplan table.geartable');if(!t||typeof GEARSLOTS==='undefined')return;
    [...t.tBodies[0].rows].forEach(tr=>{const td=tr.cells[1];if(!td||td.querySelector('.idrow'))return;
      const k=rowSlot(td);const slot=k&&SLOTK[k];if(!slot)return;const list=bySlot(slot);if(!list.length)return;
      td.insertAdjacentHTML('beforeend',`<br><button type="button" class="idl idrow" data-idl="${h(list.join(' '))}" data-ids="${h(k)}" aria-haspopup="dialog">Item stats (${list.length})</button>`)});
  }
  function refresh(){
    if(!D())return;
    try{gearButtons()}catch(e){}
    ['gear','upgrades','enhance','soulbind','stones'].forEach(id=>{const s=document.getElementById(id);if(s)try{linkify(s)}catch(e){}});
  }
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button.idl');if(!b||!D())return;e.preventDefault();
    open((b.dataset.idl||'').split(' ').filter(Boolean),b.dataset.ids?SLOTK[b.dataset.ids]:null,b)});
  // re-run after the gear planner, cost planner and optimizer redraw
  {const o=window.renderGear;if(typeof o==='function')window.renderGear=function(){const r=o.apply(this,arguments);setTimeout(refresh,0);return r}}
  {const o=window.show;if(typeof o==='function')window.show=function(id){const r=o.apply(this,arguments);if(['gear','upgrades','enhance','soulbind','stones'].includes(id))setTimeout(refresh,0);return r}}
  try{if(typeof MutationObserver==='function'){let tm=null;const mo=new MutationObserver(()=>{clearTimeout(tm);tm=setTimeout(refresh,60)});
    ['gear','upgrades','enhance','soulbind','stones'].forEach(id=>{const s=document.getElementById(id);if(s)mo.observe(s,{childList:true,subtree:true})})}}catch(e){}
  window.openItemDetail=(slug,slot)=>open([].concat(slug),slot||null,null);
  setTimeout(refresh,0);
})();

/* ---------- Item finder: "Where do I get item X?" (data: global ITEMSOURCES = audit/r7/itemsources.json) ----------
   Mount: <div id="itemfinderbox"></div>. Searches every item the guide mentions; each result lists where it comes from
   (our own guide data first, then drop chances / vendors / boxes / Supply Requests credited to MetaBot.GG with a dofollow
   link to the exact page), with buttons that jump to the matching guide section. Saves the last search in S (global keys). */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const data=()=>(typeof ITEMSOURCES!=='undefined'&&ITEMSOURCES)||window.ITEMSOURCES||null;
  const MB='https://metabot.gg';
  const mbUrl=p=>/^\/en\/aion-2\/[a-z0-9\-\/#_]+$/i.test(String(p||''))?MB+p:'';
  const GH={Common:'#C3C3C3',Rare:'#19E048',Epic:'#379AFF',Legend:'#379AFF',Unique:'#FFD02B',Heroic:'#FF6C00',Mythic:'#FF5A5A',Special:'#00FFD8'};
  const gHex=g=>{try{if(typeof gradeHex==='function'){const x=gradeHex(g);if(x)return x}}catch(e){}return GH[g]||''};
  const icon=n=>{try{return typeof ic==='function'?ic(n,'sm'):''}catch(e){return ''}};
  const norm=s=>String(s||'').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9':]+/g,' ').trim();
  const TYPEORDER=['dungeon','boss','drop','shop','craft','quest','supply','achievement','market','box','event','pass','level','gather','other','paid','none'];
  const MAXRES=40;
  const st={q:'',cat:'all',type:'all',open:null};
  try{const o=S.gget('itemfinder',null)||{}; st.q=String(o.q||''); st.cat=o.cat||'all'; st.type=o.type||'all';}catch(e){}
  function save(){try{S.gset('itemfinder',{q:st.q,cat:st.cat,type:st.type})}catch(e){}}

  let IDX=null;
  function index(D){
    if(IDX&&IDX.D===D) return IDX;
    const rows=D.items.map((it,i)=>({i,it,n:norm(it.n),a:(it.a||[]).map(norm),src:norm((it.s||[]).map(s=>[s.w,s.b,s.d].join(' ')).join(' ')),types:new Set((it.s||[]).map(s=>s.t))}));
    IDX={D,rows}; return IDX;
  }
  function score(r,q,words){
    if(!q) return 1;
    let sc=0;
    if(r.n===q) sc=1000; else if(r.n.startsWith(q)) sc=600; else if((' '+r.n).includes(' '+q)) sc=400; else if(r.n.includes(q)) sc=300;
    if(!sc){ for(const a of r.a){ if(a===q){sc=500;break} if(a.startsWith(q)||(' '+a).includes(' '+q)){sc=Math.max(sc,250)} else if(a.includes(q)) sc=Math.max(sc,150); } }
    if(!sc&&words.length>1&&words.every(w=>r.n.includes(w)||r.a.some(a=>a.includes(w)))) sc=200;
    if(!sc&&words.every(w=>r.src.includes(w))) sc=40;
    return sc;
  }
  function search(D){
    const q=norm(st.q), words=q.split(' ').filter(Boolean);
    const X=index(D);
    let res=X.rows.filter(r=>(st.cat==='all'||r.it.c===st.cat)&&(st.type==='all'||r.types.has(st.type)))
      .map(r=>({r,sc:score(r,q,words)})).filter(x=>x.sc>0);
    res.sort((a,b)=>b.sc-a.sc||(b.r.it.s||[]).length-(a.r.it.s||[]).length||a.r.it.n.localeCompare(b.r.it.n));
    return res;
  }

  function addStyle(){
    if(document.getElementById('ifstyle')) return;
    const el=document.createElement('style'); el.id='ifstyle';
    el.textContent=[
      '#itemfinderbox{display:grid;gap:12px;min-width:0}',
      '#itemfinderbox .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
      '.ifbar{display:grid;gap:8px}',
      '.ifbar input[type=search]{width:100%;box-sizing:border-box;background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:9px;padding:10px 12px;font:500 16px var(--f-body)}',
      '.ifrow{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
      '.ifrow button{background:var(--panel2);border:1px solid var(--line);color:var(--fg);font:600 13px var(--f-body);padding:5px 11px;border-radius:999px;cursor:pointer}',
      '.ifrow button[aria-pressed="true"]{background:var(--wind);border-color:var(--wind);color:var(--bg)}',
      '.ifrow select{background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:5px 8px;font:500 14px var(--f-body)}',
      '.iflist{display:grid;gap:10px;min-width:0}',
      '.ifcard{padding:10px 12px;min-width:0}',
      '.ifcard>summary{cursor:pointer;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;list-style:none}',
      '.ifcard>summary::-webkit-details-marker{display:none}',
      '.ifcard>summary b{font-size:16px;overflow-wrap:anywhere}',
      '.ifcard .ifsum{flex:1 1 100%;font-size:13px;color:var(--muted)}',
      '.iftypes{display:flex;flex-wrap:wrap;gap:4px}',
      '.iftypes span{font:600 12px var(--f-mono);padding:1px 6px;border-radius:999px;border:1px solid var(--line);color:var(--muted)}',
      '.ifsrc{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:6px}',
      '.ifsrc li{display:grid;grid-template-columns:minmax(92px,auto) 1fr;gap:4px 10px;border-top:1px solid var(--line);padding-top:6px;font-size:14px;min-width:0}',
      '.ifsrc .t{font:600 12px var(--f-mono);letter-spacing:.04em;text-transform:uppercase;color:var(--gold);padding-top:2px}',
      '.ifsrc .w{min-width:0;overflow-wrap:anywhere}',
      '.ifsrc .rate{font:700 13px var(--f-mono);color:var(--wind);margin-left:6px}',
      '.ifsrc .m{font-size:12px;color:var(--muted)}',
      '.ifsrc li.off{opacity:.62}','.ifsrc li.off .rate{text-decoration:line-through}','.iflv{margin:8px 0 0;font-size:12px;color:var(--muted)}',
      '.ifsrc .ing{margin:4px 0 0;padding-left:18px;font-size:13px}',
      '.ifsrc button.ifgo,.iffoot button.ifgo{background:none;border:0;padding:0;color:var(--wind);font:600 13px var(--f-body);cursor:pointer;text-decoration:underline}',
      '.iffoot{display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:space-between;align-items:center;margin-top:8px;font-size:13px}',
      '.iffoot .cr{color:var(--muted)}',
      '@media (max-width:520px){.ifsrc li{grid-template-columns:1fr}}'
    ].join('\n');
    document.head.appendChild(el);
  }

  function goBtn(go,label){
    if(!Array.isArray(go)||!go[0]) return '';
    return `<button type="button" class="ifgo" data-ifgo="${h(JSON.stringify(go))}">${h(label||go[3]||'Open in the guide')} →</button>`;
  }
  function srcRow(s,T){
    const mu=mbUrl(s.mu);
    const where=s.w?(mu?`<a href="${h(mu)}" target="_blank" rel="noopener">${h(s.w)}</a>`:h(s.w)):'';
    const bits=[];
    if(s.k&&s.t!=='boss'&&s.t!=='drop') bits.push(h(s.k));
    if(s.b) bits.push('boss '+h(s.b));
    const head=[where,bits.length?`<span class="m">(${bits.join(', ')})</span>`:'',s.r?`<span class="rate">${h(s.r)}</span>`:'',s.p?`<span class="rate">${h(s.p)}</span>`:''].filter(Boolean).join(' ');
    const lines=[];
    if(s.d&&s.d!==s.r) lines.push(h(s.d));
    if(s.l) lines.push('Limit: '+h(s.l));
    if(s.x) lines.push(`<span class="m">${h(s.x)}</span>`);
    if(s.note) lines.push(`<span class="m">${h(s.note)}</span>`);
    if(s.more) lines.push(`<span class="m">+${h(s.more)} more on the MetaBot.GG page</span>`);
    const ing=Array.isArray(s.i)&&s.i.length?`<ul class="ing">${s.i.map(x=>`<li>${h(x[1])} × ${h(x[0])}</li>`).join('')}</ul>`:'';
    const go=s.go?' '+goBtn(s.go):'';
    return `<li${s.off?' class="off"':''} data-t="${h(s.t)}" data-src="${s.src==='m'?'mb':'guide'}"><span class="t">${h(T[s.t]||s.t)}</span><div class="w">${head||''}${lines.length?`<div>${lines.join(' · ')}</div>`:''}${ing}${go}</div></li>`;
  }
  function card(it,D,open){
    const T=D.types||{}, C=D.cats||{};
    const srcs=(it.s||[]).slice().sort((a,b)=>(a.src===b.src?0:a.src==='g'?-1:1)||(a.off?1:0)-(b.off?1:0)||TYPEORDER.indexOf(a.t)-TYPEORDER.indexOf(b.t));
    const types=[...new Set(srcs.map(s=>s.t))].sort((a,b)=>TYPEORDER.indexOf(a)-TYPEORDER.indexOf(b));
    const b0=srcs.find(s=>!s.off)||srcs[0];
    const best=it.e||(b0?[T[b0.t]||b0.t,b0.w,b0.r||b0.p].filter(Boolean).join(': '):'');
    const hiLv=srcs.some(s=>{const m=/\bLv\. ?(\d+)/.exec(s.d||'');return m&&+m[1]>45});
    const col=gHex(it.g);
    const guide=srcs.filter(s=>s.src!=='m'), mb=srcs.filter(s=>s.src==='m');
    const mbu=it.mb?mbUrl('/en/aion-2/items/'+it.mb):'';
    return `<details class="box ifcard" data-if="${h(it.n)}"${open?' open':''}><summary>${icon(it.n)}<b${col?` style="color:${col}"`:''}>${h(it.n)}</b>${it.g?`<span class="tag">${h(it.g)}</span>`:''}<span class="tag wind">${h(C[it.c]||it.c)}</span><span class="iftypes" aria-label="Ways to get it">${types.map(t=>`<span>${h(T[t]||t)}</span>`).join('')}</span>${best?`<span class="ifsum">${h(best)}</span>`:''}</summary>`+
      (guide.length?`<ul class="ifsrc" aria-label="From this guide">${guide.map(s=>srcRow(s,T)).join('')}</ul>`:'')+
      (mb.length?`<ul class="ifsrc" aria-label="From MetaBot.GG">${mb.map(s=>srcRow(s,T)).join('')}</ul>`:'')+
      (hiLv?`<p class="iflv">Lv. above 45 is the monster level of a harder version of that boss or monster (from the game client; some of these areas and modes match Korean data), not your character level. Global caps characters at 45.</p>`:'')+
      (it.u?`<p class="small" style="margin:8px 0 0"><b>Spend it on:</b> ${h(it.u)}</p>`:'')+
      `<div class="iffoot">${it.go?goBtn(it.go):'<span></span>'}${mbu?`<span class="cr">${mb.length?'Drop chances and vendors: ':'More on '}<a href="${h(mbu)}" target="_blank" rel="noopener">MetaBot.GG: ${h(it.n)}</a></span>`:''}</div></details>`;
  }

  function renderList(){
    const box=document.getElementById('itemfinderbox'); if(!box) return;
    const D=data(); const L=box.querySelector('.iflist'), stt=box.querySelector('#ifstate'); if(!D||!L) return;
    const res=search(D);
    const shown=res.slice(0,MAXRES);
    const openFirst=!!st.q&&shown.length>0&&(shown.length<=3||shown[0].sc>=1000);
    L.innerHTML=shown.length?shown.map((x,i)=>card(x.r.it,D,openFirst&&i===0||st.open===x.r.it.n)).join(''):`<p class="box muted">Nothing matches “${h(st.q)}”. Try a shorter word (for example “stone”, “wings” or a boss name).</p>`;
    if(stt) stt.textContent=st.q||st.cat!=='all'||st.type!=='all'?`${res.length} item${res.length===1?'':'s'} found${res.length>MAXRES?`, showing the best ${MAXRES}`:''}.`:`${D.items.length} items. Type a name to search; until then the list shows the items with the most known sources.`;
    try{if(typeof decorate==='function') decorate(L)}catch(e){}
  }
  function render(){
    const box=document.getElementById('itemfinderbox'); if(!box) return;
    const D=data();
    if(!D||!Array.isArray(D.items)){box.innerHTML='<p class="box muted">The item finder could not load.</p>';return}
    addStyle();
    const C=D.cats||{}, T=D.types||{};
    if(st.cat!=='all'&&!C[st.cat]) st.cat='all';
    if(st.type!=='all'&&!T[st.type]) st.type='all';
    const used=new Set(); D.items.forEach(it=>(it.s||[]).forEach(s=>used.add(s.t)));
    box.innerHTML=
      `<div class="box ifbar"><label for="ifq"><b>Where do I get…</b> <span class="small muted">gear, materials, stones, scrolls, wings, pets, decorations, skins</span></label>`+
      `<input id="ifq" type="search" autocomplete="off" spellcheck="false" placeholder="Type an item, e.g. Amplify Stone, Berk Necklace, Talisra" value="${h(st.q)}" aria-describedby="ifstate">`+
      `<div class="ifrow" role="group" aria-label="Item type"><button type="button" data-ifcat="all" aria-pressed="${st.cat==='all'}">All</button>${Object.entries(C).map(([k,v])=>`<button type="button" data-ifcat="${h(k)}" aria-pressed="${st.cat===k}">${h(v)}</button>`).join('')}</div>`+
      `<div class="ifrow"><label class="small" for="iftype">Way to get it</label><select id="iftype"><option value="all">Any</option>${TYPEORDER.filter(t=>used.has(t)).map(t=>`<option value="${t}"${st.type===t?' selected':''}>${h(T[t]||t)}</option>`).join('')}</select>`+
      (st.q||st.cat!=='all'||st.type!=='all'?`<button type="button" data-ifclear="1">Clear</button>`:'')+`</div>`+
      `<div class="small muted" id="ifstate" aria-live="polite"></div></div>`+
      `<div class="iflist"></div>`+
      `<p class="small muted" style="margin:0">${h(D.note||'')} ${D.credit&&D.credit.url?`<a href="${h(D.credit.url)}" target="_blank" rel="noopener">${h(D.credit.name||'MetaBot.GG')}</a>: ${h(D.credit.text||'')}`:''} Rates are per kill or per box from the client tables and can change with patches; your own server's Market prices will differ.</p>`;
    renderList();
  }
  function jump(go){
    const el=document.getElementById(go[0]); if(!el) return false;
    const tab=el.closest('section.tab');
    if(tab&&typeof show==='function') show(tab.id,true);
    if(go[1]){const inp=document.getElementById(go[1]); if(inp){inp.value=go[2]||''; inp.dispatchEvent(new Event('input',{bubbles:true}));}}
    setTimeout(()=>{const t=document.getElementById(go[0]); if(t&&t.scrollIntoView) try{t.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){t.scrollIntoView()}},60);
    return true;
  }
  let timer=null;
  function wire(){
    const box=document.getElementById('itemfinderbox'); if(!box||box.dataset.ifwired) return; box.dataset.ifwired=1;
    box.addEventListener('input',e=>{if(e.target&&e.target.id==='ifq'){st.q=e.target.value||''; clearTimeout(timer); timer=setTimeout(()=>{save(); renderList()},120)}});
    box.addEventListener('change',e=>{if(e.target&&e.target.id==='iftype'){st.type=e.target.value||'all'; save(); render()}});
    box.addEventListener('toggle',e=>{const d=e.target; if(d&&d.matches&&d.matches('details.ifcard')&&d.open) st.open=d.dataset.if},true);
    box.addEventListener('click',e=>{
      const t=e.target.closest&&e.target.closest('[data-ifcat],[data-ifgo],[data-ifclear]'); if(!t) return;
      if(t.dataset.ifcat){st.cat=t.dataset.ifcat; save(); render(); return}
      if(t.dataset.ifclear){st.q='';st.cat='all';st.type='all'; save(); render(); const i=document.getElementById('ifq'); if(i) i.focus(); return}
      if(t.dataset.ifgo){e.preventDefault(); let go=null; try{go=JSON.parse(t.dataset.ifgo)}catch(x){} if(go) jump(go)}
    });
  }
  /* public: open the finder on an item name (other modules can call findItem('Enhance Stone')) */
  window.findItem=function(name){
    st.q=String(name||''); st.cat='all'; st.type='all'; save();
    const box=document.getElementById('itemfinderbox'); if(!box) return false;
    const tab=box.closest('section.tab'); if(tab&&typeof show==='function') show(tab.id,true);
    render(); return true;
  };
  window.renderItemFinder=function(){render(); wire()};
  try{window.renderItemFinder()}catch(e){console.error(e)}
  {const o=window.applyStore;if(typeof o==='function')window.applyStore=function(){const r=o.apply(this,arguments);try{const x=S.gget('itemfinder',null)||{};st.q=String(x.q||'');st.cat=x.cat||'all';st.type=x.type||'all';render()}catch(e){}return r}}
})();

/* ---------- Build codes: share my build, load a build (confirm + undo), named plan variants, compare with the guide ----------
   Mount: <div id="buildcodebox"></div>. No server and no network: everything is encoded into a short URL-safe code
   (also usable as a link ending in #build=<code>). Code format (versioned, see buildcodeFormat below):
     A2B1.<class>.<field>.<field>...z<checksum>
   Fields (each optional, one letter + value):  p skill-point plan index · h Daevanion phase (base36) · m macro option (0 current, 1 new)
     u other-build index+1 · s crystals spent per board route (base36, '_'-separated, board order) · c level-plan ticks (bitset)
     d Daevanion phase-list ticks (bitset) · g gear planner ticks PvE+PvP incl. Soul Binding targets (bitset) · n Genus Insight locks (bitset)
     t PvE Stigmas (pool index + level, base36) · v PvP Stigmas · k perks (3 digits per specialization row, 0 = none) · f data fingerprint
   Bitsets: 6 bits per base64url character over a fixed key list built from the guide data. A code made against older guide data
   still loads (fingerprint mismatch only shows a warning).
   Store keys (per class, S.get/S.set): reads/writes ptmode, phase, macroOpt, buildPick, spent, checks, pchecks, sv (g-/gv-/gi- keys only);
   own keys: bcplan (Stigmas + levels, perks), bcvars (named variants), bcundo (one-step undo). Global: bcpending (class switch for a shared link). */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const VER='A2B1';
  const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const G=f=>{try{return f()}catch(e){return undefined}};
  const cur=()=>G(()=>SLUG);
  const CC=()=>G(()=>C)||{};
  const CLASSES=()=>{const A=G(()=>ALL)||{};return Object.keys(A)};
  const clsName=k=>{const A=G(()=>ALL)||{};return (A[k]&&A[k].cls)||String(k||'').replace(/^./,c=>c.toUpperCase())};
  const icon=n=>{try{return typeof ic==='function'?ic(n,'sm'):''}catch(e){return ''}};
  const MAXV=12;

  /* ---------- hashing ---------- */
  function fnv(s){let x=0x811c9dc5;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,0x01000193)>>>0}return x>>>0}
  const hsh=(s,n)=>fnv(s).toString(36).padStart(7,'0').slice(-n);

  /* ---------- this class's skills, Stigma pool and perk options (from the guide's skill id table) ---------- */
  function ids(){return G(()=>CHAR_IDS)||{}}
  function prefix(){
    const want=new Set([].concat(CC().core||[],CC().activePriority||[],CC().passivePriority||[]));
    const cnt={}; Object.entries(ids()).forEach(([id,v])=>{if(want.has(v[0])){const p=id.slice(0,2);cnt[p]=(cnt[p]||0)+1}});
    const best=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]; return best?best[0]:null;
  }
  function stigmaPool(){
    const p=prefix(), out=[];
    if(p) Object.keys(ids()).sort().forEach(id=>{const v=ids()[id]; if(id.slice(0,2)===p&&v.length===1&&id.slice(2)!=='000000'&&+id.slice(2,4)<70&&!out.includes(v[0])) out.push(v[0])});
    const extra=[].concat((CC().stigmasPve||[]).map(s=>s.name),(CC().stigmasPvp||[]).map(s=>s.name)).filter(n=>n&&!out.includes(n));
    return out.concat([...new Set(extra)].sort());
  }
  function perkOpts(skill){
    const p=prefix(); let best=null;
    Object.keys(ids()).sort().forEach(id=>{const v=ids()[id]; if(v[0]===skill&&v.length>1&&(!best||(p&&id.slice(0,2)===p))) best=v});
    return best?best.slice(1).map((o,i)=>fixPerk(skill,o,i)):[];
  }
  /* MetaBot's text template is broken for HP-absorb perks ("Absorbs 70, 70% HP"); use the skill-numbers wording ("Absorbs 0.7% HP") */
  function fixPerk(skill,o,i){
    const [r,t]=String(o).split('|'); if(!/^Absorbs \d+, \d+% HP$/.test(t||'')) return o;
    let sx=null; try{const SN=(typeof P!=='undefined'&&P&&P.SKILLNUMS)||null; const k=SN&&(SN.sk||[]).find(x=>x.n===skill); sx=k&&(k.sx||[])[i]}catch(e){}
    if(sx&&/^Absorbs [\d.]+% HP$/.test(sx[2]||'')) return r+'|'+sx[2];
    const n=+t.match(/\d+/)[0]; return r+'|Absorbs '+(n/100)+'% HP';
  }
  const perkText=(skill,i)=>{const o=perkOpts(skill)[i-1];if(!o)return '';const [r,t]=String(o).split('|');return `${t} [${r}]`};
  function perkMatch(guideText,perks){
    if(typeof chPerkMatch==='function'){try{return chPerkMatch(guideText,perks)}catch(e){}}
    const stop=new Set(['the','a','an','on','of','to','and','or','for','with','in','at','is','by','it','skill','skills','then','keep','every','stage','only','use']);
    const tok=s=>String(s).toLowerCase().replace(/\[\d+\]/g,' ').replace(/[^a-z0-9%+\-]+/g,' ').split(/\s+/).filter(x=>x&&!stop.has(x));
    const rk=(String(guideText).match(/\[(\d+)\]/)||[])[1], g=new Set(tok(String(guideText).split('(')[0]));
    let best=0,bs=0; perks.forEach((p,i)=>{const [r,t]=String(p).split('|');let sc=tok(t).filter(x=>g.has(x)).length;if(rk&&r===rk)sc+=0.5;if(sc>bs){bs=sc;best=i+1}});
    return bs>=1.5?best:0;
  }
  function guidePerks(row){const o=perkOpts(row.skill);const out=[];[row.s1,row.s2,row.s3].forEach(t=>{const m=perkMatch(t||'',o);if(m&&!out.includes(m))out.push(m)});return out}

  /* ---------- fixed key lists (the code's "alphabet"), memoised per class ---------- */
  let LC=null;
  function lists(){
    if(LC&&LC.cls===cur()) return LC;
    const Cc=CC(), D=G(()=>DATA)||{boards:[]}, PH=G(()=>PHASES)||[], SP=G(()=>SKILLPLAN)||{};
    const plan=[]; (Cc.plan||[]).forEach((b,bi)=>(b.items||[]).forEach((it,ii)=>plan.push(`c${bi}-${ii}`)));
    const ph=[], seen=new Set(); const addp=k=>{if(!seen.has(k)){seen.add(k);ph.push(k)}};
    PH.forEach(p=>(p.seq||[]).forEach(s=>addp(`p-${s.board}-${s.to}`)));
    const AZ=(D.boards||[]).find(b=>b.name==='Azphel'); ((AZ&&AZ.pvp&&AZ.pvp.miles)||[]).forEach(m=>addp(`p-Azphel-${m[1]}`));
    const spent=[]; (D.boards||[]).forEach(b=>['pve','pvp'].forEach(m=>{if(b[m]) spent.push(`${b.name}_${m}`)}));
    const GS=G(()=>GEARSLOTS)||{}, gear=[];
    [['pve','g-'],['pvp','gv-']].forEach(([m,p])=>(GS[m]||[]).forEach(s=>['got','enh','x','m0','m1','m2','m3'].forEach(x=>gear.push(`${p}${s.k}-${x}`))));
    const GB=(G(()=>GBOARDS)||[['cogni'],['fera'],['natura'],['varian'],['special']]).map(b=>b[0]), genus=[];
    ['e','v'].forEach(p=>GB.forEach(b=>{for(let n=1;n<=9;n++) genus.push(`gi-${p}-${b}-${n}`)}));
    const ptm=Object.keys(SP).length?Object.keys(SP):['base'];
    const builds=(Cc.builds||[]).map(b=>b.id);
    const pool=stigmaPool(), rows=((Cc.perks&&Cc.perks.rows)||[]).map(r=>r.skill);
    const fp=hsh(JSON.stringify([plan,ph,spent,gear,genus,ptm,builds,pool,rows]),4);
    LC={cls:cur(),plan,ph,spent,gear,genus,ptm,builds,pool,rows,fp};
    return LC;
  }
  function bitsEnc(keys,obj){let out='';for(let i=0;i<keys.length;i+=6){let v=0;for(let j=0;j<6;j++) if(obj&&obj[keys[i+j]]) v|=1<<j; out+=B64[v]} return out.replace(/A+$/,'')}
  function bitsDec(keys,str){const o={};for(let i=0;i<str.length;i++){const v=B64.indexOf(str[i]); if(v<0) throw new Error('bad'); for(let j=0;j<6;j++) if(v&(1<<j)&&keys[i*6+j]) o[keys[i*6+j]]=true} return o}

  /* ---------- read / write the player's build for the current class ---------- */
  function plan(){const p=S.get('bcplan',null)||{};return {pve:Array.isArray(p.pve)?p.pve:[],pvp:Array.isArray(p.pvp)?p.pvp:[],perks:p.perks&&typeof p.perks==='object'?p.perks:{}}}
  function readState(){
    const sv=S.get('sv',{})||{}, gear={}, genus={};
    Object.keys(sv).forEach(k=>{if(!sv[k]) return; if(/^gi-/.test(k)) genus[k]=true; else if(/^gv?-/.test(k)) gear[k]=true});
    const pick=o=>{const r={};Object.keys(o||{}).forEach(k=>{if(o[k])r[k]=true});return r};
    return {cls:cur(),pt:S.get('ptmode','base'),ph:+S.get('phase',30)||30,mo:S.get('macroOpt','cur')==='alt'?'alt':'cur',bp:S.get('buildPick',null),
      spent:Object.assign({},S.get('spent',{})||{}),checks:pick(S.get('checks',{})),pchecks:pick(S.get('pchecks',{})),gear,genus,stig:plan()};
  }
  function encode(st){
    const L=lists(), f=[], pool=L.pool, w=pool.length>36?2:1;
    f.push('p'+Math.max(0,L.ptm.indexOf(st.pt)).toString(36));
    f.push('h'+Math.max(0,Math.min(1295,+st.ph||0)).toString(36));
    f.push('m'+(st.mo==='alt'?1:0));
    const bi=L.builds.indexOf(st.bp); if(bi>=0) f.push('u'+(bi+1).toString(36));
    const sp=L.spent.map(k=>{const v=Math.max(0,Math.min(99999,Math.round(+(st.spent||{})[k]||0)));return v?v.toString(36):''}); while(sp.length&&!sp[sp.length-1]) sp.pop();
    if(sp.length) f.push('s'+sp.join('_'));
    [['c',L.plan,st.checks],['d',L.ph,st.pchecks],['g',L.gear,st.gear],['n',L.genus,st.genus]].forEach(([k,keys,o])=>{const b=bitsEnc(keys,o);if(b)f.push(k+b)});
    const sg=list=>(list||[]).map(x=>{const i=pool.indexOf(x&&x.n);if(i<0)return '';return i.toString(36).padStart(w,'0')+Math.max(0,Math.min(20,+x.l||0)).toString(36)}).join('');
    const t=sg(st.stig.pve.slice(0,4)), v=sg(st.stig.pvp.slice(0,4)); if(t) f.push('t'+t); if(v) f.push('v'+v);
    let k=L.rows.map(r=>{const a=(st.stig.perks[r]||[]).map(x=>Math.max(0,Math.min(5,+x||0)));return [0,1,2].map(i=>a[i]||0).join('')}).join('').replace(/(000)+$/,'');
    if(/[1-9]/.test(k)) f.push('k'+k);
    f.push('f'+L.fp);
    const body=[VER,st.cls].concat(f).join('.');
    return body+'.z'+hsh(body,5);
  }
  function extract(text){
    let s=String(text||'').trim(); const m=s.match(/build=([A-Za-z0-9._~%-]+)/); if(m) s=m[1];
    try{s=decodeURIComponent(s)}catch(e){} return s.replace(/\s+/g,'');
  }
  /* parse + check a code. Returns {ok,cls,fields,...} or {ok:false,err} */
  function parse(text){
    const code=extract(text); if(!code) return {ok:false,err:'Paste a build code or a link that ends in #build=…'};
    const parts=code.split('.');
    if(!/^A2B\d+$/.test(parts[0])) return {ok:false,err:'This is not a build code from this guide.'};
    if(parts[0]!==VER) return {ok:false,err:`This code uses format ${parts[0]}, made by a newer version of the guide. Reload the guide to get the update.`};
    const z=parts[parts.length-1]; if(!/^z[0-9a-z]{5}$/.test(z)) return {ok:false,err:'The code is incomplete (its end is missing). Copy it again.'};
    const body=parts.slice(0,-1).join('.'); if(hsh(body,5)!==z.slice(1)) return {ok:false,err:'The code is damaged (a character changed or is missing). Copy it again.'};
    const cls=parts[1]; if(!CLASSES().includes(cls)) return {ok:false,err:'Unknown class in this code: '+cls};
    const fields={}; parts.slice(2,-1).forEach(p=>{if(p) fields[p[0]]=p.slice(1)});
    return {ok:true,code,cls,fields};
  }
  function decode(P){ // only for the current class
    const L=lists(), F=P.fields, pool=L.pool, w=pool.length>36?2:1, warn=[];
    const st={cls:P.cls,pt:L.ptm[parseInt(F.p||'0',36)]||L.ptm[0],ph:parseInt(F.h||'u',36)||30,mo:F.m==='1'?'alt':'cur',bp:null,spent:{},checks:{},pchecks:{},gear:{},genus:{},stig:{pve:[],pvp:[],perks:{}}};
    if(F.u){const i=parseInt(F.u,36)-1; if(L.builds[i]) st.bp=L.builds[i]; else warn.push('The other build in this code no longer exists.')}
    if(F.s) F.s.split('_').forEach((x,i)=>{if(x&&L.spent[i]) st.spent[L.spent[i]]=parseInt(x,36)||0});
    try{st.checks=bitsDec(L.plan,F.c||'');st.pchecks=bitsDec(L.ph,F.d||'');st.gear=bitsDec(L.gear,F.g||'');st.genus=bitsDec(L.genus,F.n||'')}catch(e){return {ok:false,err:'The code is damaged.'}}
    const sd=s=>{const out=[];for(let i=0;i+w<s.length+0&&i<s.length;i+=w+1){const n=pool[parseInt(s.slice(i,i+w),36)],l=parseInt(s.slice(i+w,i+w+1),36);if(n)out.push({n,l:Math.min(20,l||0)})}return out.slice(0,4)};
    if(F.t) st.stig.pve=sd(F.t); if(F.v) st.stig.pvp=sd(F.v);
    if(F.k){L.rows.forEach((r,i)=>{const a=(F.k.slice(i*3,i*3+3)+'000').slice(0,3).split('').map(Number).filter(x=>x>0&&x<=5); if(a.length) st.stig.perks[r]=a})}
    if(F.f&&F.f!==L.fp) warn.push('This code was made with a different version of the guide data: some ticks may land on slightly different rows. Check the result.');
    if(st.mo==='alt'&&!CC().macroAlt){st.mo='cur';warn.push('The new macro option in this code is not offered for this class any more; the current macro is used.')}
    return {ok:true,st,warn};
  }

  /* ---------- apply (with one-step undo) ---------- */
  const DEF={ptmode:'base',phase:30,macroOpt:'cur',buildPick:null,spent:{},checks:{},pchecks:{},bcplan:null};
  function snapshot(label){
    const v={}; Object.keys(DEF).forEach(k=>{v[k]=S.get(k,DEF[k])});
    const sv=S.get('sv',{})||{}, sub={}; Object.keys(sv).forEach(k=>{if(/^(g|gv|gi)-/.test(k)) sub[k]=sv[k]}); v.sv=sub;
    return {ts:Date.now(),label:label||'',v:JSON.parse(JSON.stringify(v))};
  }
  function writeSv(sub){const sv=Object.assign({},S.get('sv',{})||{});Object.keys(sv).forEach(k=>{if(/^(g|gv|gi)-/.test(k)) delete sv[k]});Object.assign(sv,sub||{});S.set('sv',sv)}
  function rerender(){
    try{const f=window.applyStore||G(()=>applyStore); if(typeof f==='function') f()}catch(e){console.error(e)}
    try{if(typeof renderMacro==='function') renderMacro()}catch(e){}
    render();
  }
  function applyState(st,label){
    S.set('bcundo',snapshot(label));
    const L=lists();
    S.set('ptmode',st.pt); S.set('phase',st.ph); S.set('macroOpt',st.mo);
    if(L.builds.length) S.set('buildPick',st.bp);
    const sp=Object.assign({},S.get('spent',{})||{}); L.spent.forEach(k=>delete sp[k]); Object.assign(sp,st.spent); S.set('spent',sp);
    S.set('checks',Object.assign({},st.checks)); S.set('pchecks',Object.assign({},st.pchecks));
    writeSv(Object.assign({},st.gear,st.genus));
    S.set('bcplan',normStig(st.stig));
    rerender();
  }
  function undo(){
    const u=S.get('bcundo',null); if(!u||!u.v) return false;
    Object.keys(DEF).forEach(k=>S.set(k,u.v[k]===undefined?DEF[k]:u.v[k]));
    writeSv(u.v.sv); S.set('bcundo',null); rerender(); return true;
  }

  /* ---------- compare with the guide ---------- */
  function routeTotal(b,m){const n={};(b.nodes||[]).forEach(x=>n[x[0]+','+x[1]]=x[3]);return ((b[m]||{}).order||[]).reduce((a,rc)=>a+(n[rc[0]+','+rc[1]]||0),0)}
  function compare(st){
    const Cc=CC(), L=lists(), diff=[], todo=[], info=[];
    const names=x=>x.map(s=>s.n);
    [['pve','PvE',(Cc.stigmasPve||[]).map(s=>s.name)],['pvp','PvP',(Cc.stigmasPvp||[]).slice(0,4).map(s=>s.name)]].forEach(([k,lab,guide])=>{
      const mine=(st.stig[k]||[]).filter(x=>x&&x.n);
      if(!guide.length) return;
      if(!mine.length){info.push(`${lab} Stigmas: not filled in yet. Use "Copy the guide's picks" or "Fill from My character" below.`);return}
      const miss=guide.filter(n=>!names(mine).includes(n)), extra=names(mine).filter(n=>!guide.includes(n));
      if(miss.length||extra.length) diff.push({area:`Stigmas (${lab})`,you:extra.length?extra.join(', '):'empty slot',guide:miss.join(', ')||'—'});
      const low=mine.filter(s=>guide.includes(s.n)&&(+s.l||0)<10);
      if(low.length) todo.push(`${lab} Stigma levels: ${low.map(s=>`${s.n} ${+s.l||0} → 10`).join(', ')} (the guide takes every slotted Stigma to 5 first, then 10).`);
    });
    const rows=(Cc.perks&&Cc.perks.rows)||[]; let filled=0;
    rows.forEach(r=>{
      const mine=(st.stig.perks[r.skill]||[]).filter(Boolean); if(!mine.length) return; filled++;
      const g=guidePerks(r); if(!g.length) return;
      const miss=g.filter(x=>!mine.includes(x)), extra=mine.filter(x=>!g.includes(x));
      if(miss.length||extra.length) diff.push({area:`Perks: ${r.skill}`,you:extra.map(i=>perkText(r.skill,i)).join('; ')||'(fewer picks)',guide:miss.map(i=>perkText(r.skill,i)).join('; ')||'—'});
    });
    if(rows.length&&!filled) info.push('Perks: not filled in yet. Use "Copy the guide\'s picks" or "Fill from My character" below.');
    if(Cc.macroAlt){const g=(Cc.macroAlt.sim||{}).gainPct; info.push(st.mo==='alt'?`Macro: you use the new option "${Cc.macroAlt.name}"${g!=null?` (+${g}% in our tests)`:''}.`:`Macro: you use the current macro. The guide also offers "${Cc.macroAlt.name}"${g!=null?`, +${g}% in our tests`:''} (Rotation & macro tab).`)}
    if(L.ptm.length>1&&st.pt!==L.ptm[0]) diff.push({area:'Skill-point table',you:`"${st.pt}" plan`,guide:`"${L.ptm[0]}" plan`});
    if(st.bp&&(Cc.builds||[]).length){const b=(Cc.builds||[]).find(x=>x.id===st.bp); if(b) info.push(`Other build picked: ${b.name} (Other builds tab).`)}
    // progress against the guide's plan
    const D=G(()=>DATA)||{boards:[]};
    const pl=L.plan.filter(k=>st.checks[k]).length; if(L.plan.length) todo.push(`Level plan: ${pl} / ${L.plan.length} steps ticked.`);
    const br=(D.boards||[]).flatMap(b=>['pve','pvp'].filter(m=>b[m]&&(m==='pve'||b.name==='Azphel')).map(m=>{const t=routeTotal(b,m),v=Math.min(t,+st.spent[`${b.name}_${m}`]||0);return `${b.name}${m==='pvp'?' (PvP)':''} ${v}/${t}`}));
    if(br.length) todo.push(`Daevanion crystals along the guide's routes: ${br.join(' · ')}.`);
    const PHs=G(()=>PHASES)||[], P=PHs.find(p=>p.lvl===(st.ph===45?40:st.ph));
    if(P){const keys=[...new Set(P.seq.map(s=>`p-${s.board}-${s.to}`))];todo.push(`Daevanion list for level ${st.ph===99?'45+ (max)':st.ph}: ${keys.filter(k=>st.pchecks[k]).length} / ${keys.length} steps ticked.`)}
    const GS=G(()=>GEARSLOTS)||{};
    [['pve','g-','PvE'],['pvp','gv-','PvP']].forEach(([m,p,lab])=>{
      const sl=GS[m]||[]; if(!sl.length) return; let got=0,tot=0,sb=0,sbt=0;
      sl.forEach(s=>{const ks=['got','enh'].concat(s.t==='none'?[]:['x','m0','m1','m2','m3']); ks.forEach(x=>{tot++; if(st.gear[`${p}${s.k}-${x}`]) got++}); if(s.t!=='none'){sbt++; if(st.gear[`${p}${s.k}-x`]) sb++}});
      todo.push(`${lab} gear planner: ${got} / ${tot} ticks; ${m==='pve'?'Soul Binding':'Potential'} targets met on ${sb} / ${sbt} pieces.`);
    });
    const gl=Object.keys(st.genus).filter(k=>/^gi-e-/.test(k)).length; todo.push(`Genus Insight (PvE): ${gl} slots locked.`);
    return {diff,todo,info};
  }

  /* ---------- UI ---------- */
  const ui={msg:'',bad:false,preview:null,incoming:null,confirm:false,delv:null,code:''};
  function addStyle(){
    if(document.getElementById('bcstyle')) return;
    const el=document.createElement('style'); el.id='bcstyle';
    el.textContent=[
      '#buildcodebox{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;min-width:0}#buildcodebox>*,#buildcodebox .box>*{min-width:0}#buildcodebox .box{grid-template-columns:minmax(0,1fr)}',
      '#buildcodebox textarea,#buildcodebox input[type=text]{width:100%;box-sizing:border-box;background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:9px;padding:8px 10px;font:500 14px var(--f-mono)}',
      '#buildcodebox textarea{min-height:64px;resize:vertical;word-break:break-all}',
      '#buildcodebox select,#buildcodebox input[type=number]{background:var(--panel2);color:var(--fg);border:1px solid var(--line);border-radius:8px;padding:5px 6px;font:500 14px var(--f-body);max-width:100%}',
      '#buildcodebox input[type=number]{width:4.2em}',
      '.bcrow{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
      '.bcmsg{border-left:3px solid var(--wind);background:color-mix(in srgb,var(--wind) 8%,var(--panel));padding:7px 10px;border-radius:0 8px 8px 0;font-size:14px}',
      '.bcmsg.bad{border-color:var(--warn);background:color-mix(in srgb,var(--warn) 9%,var(--panel))}',
      '.bcgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:12px;min-width:0}',
      '.bcslots{display:grid;gap:6px}',
      '.bcslot{display:flex;gap:6px;align-items:center;flex-wrap:wrap}',
      '.bcslot .no{font:600 12px var(--f-mono);color:var(--muted);width:3.2em}',
      '.bcperks td{vertical-align:top}.bcperks select{width:100%;min-width:120px}',
      '.bcdiff{margin:0;padding-left:18px;display:grid;gap:4px;font-size:14px}',
      '.bcdiff .you{color:var(--warn)}.bcdiff .gd{color:var(--wind)}',
      '.bcvars{list-style:none;margin:0;padding:0;display:grid;gap:6px}',
      '.bcvars li{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;border-top:1px solid var(--line);padding-top:6px}',
      '.bcvars b{margin-right:auto;overflow-wrap:anywhere}',
      '#bcbanner{position:fixed;left:12px;right:12px;bottom:12px;z-index:60;max-width:720px;margin:0 auto;background:var(--panel);border:1px solid var(--gold);border-radius:12px;padding:10px 14px;box-shadow:0 8px 24px rgba(0,0,0,.4);display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:14px}',
      '#bcbanner span{flex:1 1 220px}'
    ].join('\n');
    document.head.appendChild(el);
  }
  function shareBase(){
    const sc=G(()=>SITE_CONFIG)||{}; const b=String(sc.SHARE_BASE||'').trim();
    if(/^https:\/\/[^\s"'<>#]+$/i.test(b)) return b;
    try{if(/^https?:$/.test(location.protocol)&&!/claudeusercontent|\.claude\.ai$/i.test(location.hostname)) return location.href.split('#')[0]}catch(e){}
    return '';
  }
  function stigEditor(k,lab){
    const P=plan(), pool=lists().pool, list=P[k];
    return `<div><h4 style="margin:0 0 6px">${lab} Stigmas</h4><div class="bcslots">`+[0,1,2,3].map(i=>{const s=list[i]||{n:'',l:0};
      return `<div class="bcslot"><span class="no">Slot ${i+1}</span>${s.n?icon(s.n):''}<select data-bcst="${k}:${i}" aria-label="${lab} Stigma slot ${i+1}"><option value="">—</option>${pool.map(n=>`<option${n===s.n?' selected':''}>${h(n)}</option>`).join('')}</select><label class="small">Lv <input type="number" min="0" max="20" value="${+s.l||0}" data-bclv="${k}:${i}" aria-label="${lab} Stigma slot ${i+1} level"></label></div>`}).join('')+`</div></div>`;
  }
  function perkEditor(){
    const rows=(CC().perks&&CC().perks.rows)||[]; if(!rows.length) return '';
    const P=plan();
    return `<details class="bcperkwrap"${Object.keys(P.perks).length?'':' open'}><summary><b>Perks (specializations)</b> <span class="small muted">3 slots per skill, in the order you take them</span></summary><div class="tablewrap"><table class="bcperks"><thead><tr><th>Skill</th><th>Slot 1</th><th>Slot 2</th><th>Slot 3</th></tr></thead><tbody>`+
      rows.map(r=>{const o=perkOpts(r.skill), mine=P.perks[r.skill]||[];
        return `<tr><td><b>${h(r.skill)}</b></td>`+[0,1,2].map(i=>`<td><select data-bcpk="${h(r.skill)}:${i}" aria-label="${h(r.skill)} perk slot ${i+1}"><option value="0">—</option>${o.map((p,j)=>{const [rk,t]=String(p).split('|');return `<option value="${j+1}"${mine[i]===j+1?' selected':''}>${h(t)} [${h(rk)}]</option>`}).join('')}</select></td>`).join('')+'</tr>'}).join('')+
      `</tbody></table></div></details>`;
  }
  function render(){
    const box=document.getElementById('buildcodebox'); if(!box) return;
    if(!cur()||!CC().class){box.innerHTML='<p class="box muted">Build codes could not load.</p>';return}
    addStyle();
    const st=readState(), code=encode(st), cmp=compare(st), base=shareBase(), link=base?base+'#build='+code:'';
    const und=S.get('bcundo',null), vars=S.get('bcvars',[])||[];
    const pv=ui.preview;
    let prevHtml='';
    if(pv){
      if(!pv.ok) prevHtml=`<div class="bcmsg bad" role="alert">${h(pv.err)}</div>`;
      else if(pv.cls!==cur()) prevHtml=`<div class="bcmsg">This build is for <b>${h(clsName(pv.cls))}</b>. You are on ${h(clsName(cur()))}. <button type="button" class="btn" data-bc="switch">Switch to ${h(clsName(pv.cls))} and review it</button></div>`;
      else{
        const ch=changes(st,pv.st);
        prevHtml=`<div class="bcmsg"><b>${h(clsName(pv.cls))} build${pv.label?`: ${h(pv.label)}`:''}.</b> Loading it replaces your ${h(clsName(cur()))} plan: ${ch.length?h(ch.join('; ')):'nothing changes (same as yours)'}.`+
          (pv.warn&&pv.warn.length?`<br><span class="small">⚠ ${pv.warn.map(h).join(' ')}</span>`:'')+
          `<div class="bcrow" style="margin-top:6px">${ui.confirm?`<b>Replace your current plan?</b> <button type="button" class="btn primary" data-bc="apply-yes">Yes, load it</button><button type="button" class="btn" data-bc="apply-no">Cancel</button>`:`<button type="button" class="btn primary" data-bc="apply">Load this build…</button><button type="button" class="btn" data-bc="apply-no">Cancel</button>`}</div>`+
          `<details style="margin-top:6px"><summary class="small">How this build compares with the guide</summary>${diffHtml(compare(pv.st))}</details></div>`;
      }
    }
    box.innerHTML=
      (ui.msg?`<div class="bcmsg${ui.bad?' bad':''}" role="status">${h(ui.msg)}</div>`:'')+
      (und&&und.v?`<div class="bcmsg">Loaded ${h(und.label||'a build')} ${h(new Date(und.ts).toLocaleString())}. <button type="button" class="btn" data-bc="undo">Undo: restore my previous plan</button></div>`:'')+
      `<div class="box" style="display:grid;gap:8px"><h3 style="margin:0">Share my ${h(clsName(cur()))} build</h3>`+
        `<p class="small muted" style="margin:0">One short code holds your board crystals, Daevanion list ticks, level-plan ticks, gear planner and Soul Binding target ticks, Genus Insight locks, macro option, skill-point table, other-build choice, and your Stigmas and perks below. Nothing is uploaded: the code is the whole build.</p>`+
        `<div class="bcrow"><button type="button" class="btn primary" data-bc="share">Share my build</button><span class="small muted">${code.length} characters · format ${VER}</span></div>`+
        (ui.code?`<label class="small" for="bcout">Your code</label><textarea id="bcout" readonly>${h(ui.code)}</textarea>`+(link?`<label class="small" for="bclink">Link</label><input type="text" id="bclink" readonly value="${h(base+'#build='+ui.code)}">`:'')+
          `<div class="bcrow"><button type="button" class="btn" data-bc="copy-code">Copy code</button>${link?'<button type="button" class="btn" data-bc="copy-link">Copy link</button>':''}<span class="small muted">${link?'The link opens the guide on this build.':'Send the code: the other player pastes it under Load a build.'}</span></div>`:'')+
      `</div>`+
      `<div class="box" style="display:grid;gap:8px"><h3 style="margin:0">Load a build</h3><label class="small" for="bcin">Paste a code or a link</label><textarea id="bcin" placeholder="A2B1.${h(cur())}.…">${h(ui.incoming||'')}</textarea><div class="bcrow"><button type="button" class="btn" data-bc="check">Check code</button><span class="small muted">You see what changes before anything is replaced, and you can undo it.</span></div>${prevHtml}</div>`+
      `<div class="box" style="display:grid;gap:10px"><h3 style="margin:0">My Stigmas and perks</h3><p class="small muted" style="margin:0">The guide has no in-game reader for these, so set them here (or fill them from the My character tab if you loaded an AionFlex code there). They go into your build code and the comparison below.</p>`+
        `<div class="bcrow"><button type="button" class="btn" data-bc="guide-picks">Copy the guide's picks</button><button type="button" class="btn" data-bc="from-char">Fill from My character</button><button type="button" class="btn" data-bc="clear-plan">Clear</button></div>`+
        `<div class="bcgrid">${stigEditor('pve','PvE')}${stigEditor('pvp','PvP')}</div>${perkEditor()}</div>`+
      `<div class="box" style="display:grid;gap:8px"><h3 style="margin:0">Saved variants</h3><p class="small muted" style="margin:0">Keep several plans for this class (for example Raid, PvP, Nightmare) and switch between them. Saved in your guide only.</p>`+
        `<div class="bcrow"><input type="text" id="bcvname" maxlength="30" placeholder="Name, e.g. Raid" style="flex:1 1 180px;width:auto"><button type="button" class="btn" data-bc="save-var">Save current plan as variant</button></div>`+
        (vars.length?`<ul class="bcvars">${vars.map((x,i)=>`<li><b>${h(x.n)}</b><span class="small muted">${h(new Date(x.ts).toLocaleDateString())}</span><button type="button" class="btn" data-bcvl="${i}">Load…</button><button type="button" class="btn" data-bcvc="${i}">Copy code</button>${ui.delv===i?`<button type="button" class="btn" data-bcvdy="${i}">Delete it</button><button type="button" class="btn" data-bcvdn="1">Keep</button>`:`<button type="button" class="btn" data-bcvd="${i}">Delete</button>`}</li>`).join('')}</ul>`:'<p class="small muted" style="margin:0">No variants yet.</p>')+
      `</div>`+
      `<div class="box" style="display:grid;gap:8px"><h3 style="margin:0">Compare with the guide</h3>${diffHtml(cmp)}</div>`;
    try{if(typeof decorate==='function') decorate(box)}catch(e){}
  }
  function diffHtml(cmp){
    return (cmp.diff.length?`<p class="small" style="margin:0"><b>Where your plan differs from the guide (${cmp.diff.length}):</b></p><ul class="bcdiff">${cmp.diff.map(d=>`<li><b>${h(d.area)}</b>: you <span class="you">${h(d.you)}</span>; guide <span class="gd">${h(d.guide)}</span></li>`).join('')}</ul>`:`<p class="small" style="margin:0"><b>No differences from the guide's picks</b>${cmp.info.some(x=>/not filled in/.test(x))?' (in what you have filled in)':''}.</p>`)+
      (cmp.info.length?`<ul class="bcdiff small">${cmp.info.map(x=>`<li>${h(x)}</li>`).join('')}</ul>`:'')+
      (cmp.todo.length?`<p class="small" style="margin:6px 0 0"><b>Progress on the guide's plan</b></p><ul class="bcdiff small">${cmp.todo.map(x=>`<li>${h(x)}</li>`).join('')}</ul>`:'');
  }
  function changes(a,b){
    const out=[], L=lists(), cnt=(x,y,keys)=>keys.filter(k=>!!x[k]!==!!y[k]).length;
    if(a.pt!==b.pt) out.push('skill-point table');
    if(a.ph!==b.ph) out.push('Daevanion level list');
    if(a.mo!==b.mo) out.push('macro option');
    if(L.builds.length&&a.bp!==b.bp) out.push('other build');
    const sp=L.spent.filter(k=>(+a.spent[k]||0)!==(+b.spent[k]||0)).length; if(sp) out.push(`${sp} board route${sp>1?'s':''}`);
    [['level-plan',L.plan,'checks'],['Daevanion list',L.ph,'pchecks'],['gear',L.gear,'gear'],['Genus Insight',L.genus,'genus']].forEach(([n,keys,f])=>{const c=cnt(a[f],b[f],keys); if(c) out.push(`${c} ${n} tick${c>1?'s':''}`)});
    if(JSON.stringify(normStig(a.stig))!==JSON.stringify(normStig(b.stig))) out.push('Stigmas and perks');
    return out;
  }
  function say(t,bad){ui.msg=t;ui.bad=!!bad}
  async function copy(text,el){
    let ok=false;
    try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);ok=true}}catch(e){}
    if(!ok&&el){try{el.focus();el.select();ok=document.execCommand&&document.execCommand('copy')}catch(e){}}
    say(ok?'Copied.':'Select the text and copy it (Ctrl+C).',!ok); render();
  }
  function setPlan(p){S.set('bcplan',p); LC=null;}
  function check(text,label){
    const P=parse(text);
    if(!P.ok){ui.preview=P;ui.confirm=false;return P}
    if(P.cls!==cur()){ui.preview={ok:true,cls:P.cls,code:P.code};ui.confirm=false;return ui.preview}
    const D=decode(P); ui.preview=D.ok?{ok:true,cls:P.cls,code:P.code,st:D.st,warn:D.warn,label}:D; ui.confirm=false; return ui.preview;
  }
  function wire(){
    const box=document.getElementById('buildcodebox'); if(!box||box.dataset.bcwired) return; box.dataset.bcwired=1;
    box.addEventListener('click',e=>{
      const b=e.target.closest&&e.target.closest('[data-bc],[data-bcvl],[data-bcvc],[data-bcvd],[data-bcvdy],[data-bcvdn]'); if(!b) return;
      const a=b.dataset.bc; say('');
      if(a==='share'){ui.code=encode(readState()); render(); return}
      if(a==='copy-code'){copy(ui.code,document.getElementById('bcout'));return}
      if(a==='copy-link'){const l=document.getElementById('bclink'); copy(l?l.value:'',l);return}
      if(a==='check'){const t=document.getElementById('bcin'); ui.incoming=t?t.value:''; check(ui.incoming); render(); return}
      if(a==='apply'){ui.confirm=true; render(); return}
      if(a==='apply-no'){ui.preview=null;ui.confirm=false;ui.incoming=''; render(); return}
      if(a==='apply-yes'){const pv=ui.preview; if(pv&&pv.ok&&pv.st){applyState(pv.st,pv.label?`variant "${pv.label}"`:'a shared build'); ui.preview=null; ui.confirm=false; ui.incoming=''; say('Build loaded. Every tab now shows it. Undo is below if you change your mind.'); render()} return}
      if(a==='undo'){say(undo()?'Your previous plan is back.':'Nothing to undo.'); render(); return}
      if(a==='switch'){const pv=ui.preview; if(pv&&pv.cls){try{S.gset('bcpending',{cls:pv.cls,code:pv.code}); S.gset('cls',pv.cls); history.replaceState(null,'',location.pathname+location.search)}catch(x){} try{location.reload()}catch(x){}} return}
      if(a==='guide-picks'){const Cc=CC(), p=plan(); p.pve=(Cc.stigmasPve||[]).slice(0,4).map(s=>({n:s.name,l:10})); p.pvp=(Cc.stigmasPvp||[]).slice(0,4).map(s=>({n:s.name,l:10})); p.perks={}; ((Cc.perks&&Cc.perks.rows)||[]).forEach(r=>{const g=guidePerks(r); if(g.length) p.perks[r.skill]=g}); setPlan(p); say("Filled with the guide's Stigmas (level-10 targets) and perk picks."); render(); return}
      if(a==='from-char'){say(fromChar()); render(); return}
      if(a==='clear-plan'){setPlan({pve:[],pvp:[],perks:{}}); say('Stigmas and perks cleared.'); render(); return}
      if(a==='save-var'){const n=(document.getElementById('bcvname')||{}).value; say(saveVariant(n)); render(); return}
      if(b.dataset.bcvl!=null){const v=(S.get('bcvars',[])||[])[+b.dataset.bcvl]; if(v){ui.incoming=v.code; check(v.code,v.n); render(); const t=document.getElementById('bcin'); if(t&&t.scrollIntoView) try{t.scrollIntoView({block:'center'})}catch(x){}} return}
      if(b.dataset.bcvc!=null){const v=(S.get('bcvars',[])||[])[+b.dataset.bcvc]; if(v){ui.code=v.code; render(); copy(v.code,document.getElementById('bcout'))} return}
      if(b.dataset.bcvd!=null){ui.delv=+b.dataset.bcvd; render(); return}
      if(b.dataset.bcvdn!=null){ui.delv=null; render(); return}
      if(b.dataset.bcvdy!=null){const L=(S.get('bcvars',[])||[]).slice(); const x=L.splice(+b.dataset.bcvdy,1)[0]; S.set('bcvars',L); ui.delv=null; say(x?`Variant "${x.n}" deleted.`:''); render(); return}
    });
    box.addEventListener('change',e=>{
      const t=e.target; if(!t||!t.dataset) return;
      if(t.dataset.bcst||t.dataset.bclv){const [k,i]=(t.dataset.bcst||t.dataset.bclv).split(':'); const p=plan(); const L=p[k].slice(); while(L.length<=+i) L.push({n:'',l:0});
        if(t.dataset.bcst) L[+i]={n:t.value,l:L[+i].l||0}; else L[+i]={n:L[+i].n,l:Math.max(0,Math.min(20,parseInt(t.value,10)||0))};
        while(L.length&&!(L[L.length-1]&&L[L.length-1].n)) L.pop(); p[k]=L; setPlan(p); render(); return}
      if(t.dataset.bcpk){const [sk,i]=t.dataset.bcpk.split(':'); const p=plan(); const a=(p.perks[sk]||[]).slice(); while(a.length<3) a.push(0); a[+i]=+t.value||0; const keep=a.filter(Boolean); if(keep.length) p.perks[sk]=keep; else delete p.perks[sk]; setPlan(p); render(); return}
    });
  }
  function normStig(s){s=s||{};const f=l=>(l||[]).filter(x=>x&&x.n).map(x=>({n:x.n,l:+x.l||0}));const pk={};Object.keys(s.perks||{}).sort().forEach(k=>{const a=(s.perks[k]||[]).filter(Boolean);if(a.length)pk[k]=a});return {pve:f(s.pve),pvp:f(s.pvp),perks:pk}}
  function fromChar(){
    if(typeof chGet!=='function'||typeof chModel!=='function') return 'The My character tab is not available.';
    const rec=chGet(); if(!rec) return 'No character is loaded yet: open the My character tab first.';
    let M; try{M=chModel(rec)}catch(e){return 'Your saved character could not be read.'}
    const sl=typeof chSlugOf==='function'?chSlugOf(M.cls):String(M.cls||'').toLowerCase();
    if(sl&&sl!==cur()) return `Your saved character is a ${M.cls}, not a ${clsName(cur())}.`;
    const pool=lists().pool, p=plan();
    const st=(M.skills||[]).filter(s=>s.cat==='Dp'&&s.equip&&s.level>0&&pool.includes(s.name)).slice(0,4).map(s=>({n:s.name,l:Math.min(20,+s.level||0)}));
    if(st.length) p.pve=st;
    let np=0; ((CC().perks&&CC().perks.rows)||[]).forEach(r=>{const s=(M.skills||[]).find(x=>x.name===r.skill); if(s&&Array.isArray(s.specs)&&s.specs.length){p.perks[r.skill]=s.specs.map(Number).filter(x=>x>=1&&x<=5).slice(0,3); np++}});
    setPlan(p);
    return `Filled from your character: ${st.length} Stigma${st.length===1?'':'s'}${np?`, perks for ${np} skills`:' (perks need an AionFlex code in My character)'}. Your PvP Stigmas were left as they were.`;
  }
  function saveVariant(name){
    let n=String(name||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,30);
    const L=(S.get('bcvars',[])||[]).slice();
    if(!n) n='Variant '+(L.length+1);
    const code=encode(readState()), i=L.findIndex(x=>x.n===n), v={n,code,ts:Date.now()};
    if(i>=0){L[i]=v; S.set('bcvars',L); return `Variant "${n}" updated.`}
    if(L.length>=MAXV) return `You already have ${MAXV} variants: delete one first.`;
    L.push(v); S.set('bcvars',L); return `Saved as "${n}".`;
  }
  function banner(cls){
    if(document.getElementById('bcbanner')) return;
    const d=document.createElement('div'); d.id='bcbanner'; d.setAttribute('role','status');
    const same=cls===cur();
    d.innerHTML=`<span>Someone shared a <b>${h(clsName(cls))}</b> build with you.${same?'':` You are on ${h(clsName(cur()))}.`} Nothing changes until you confirm.</span><button type="button" class="btn primary" data-bcb="review">${same?'Review it':`Switch to ${h(clsName(cls))}`}</button><button type="button" class="btn" data-bcb="close">Not now</button>`;
    d.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-bcb]'); if(!b) return;
      if(b.dataset.bcb==='close'){d.remove(); return}
      if(!same){try{S.gset('bcpending',{cls,code:ui.incoming}); S.gset('cls',cls)}catch(x){} try{location.reload()}catch(x){} return}
      d.remove(); const box=document.getElementById('buildcodebox'); const tab=box&&box.closest('section.tab'); if(tab&&typeof show==='function') show(tab.id,true); render();
      const t=document.getElementById('bcin'); if(t&&t.scrollIntoView) try{t.scrollIntoView({block:'center'})}catch(x){}
    });
    (document.body||document.documentElement).appendChild(d);
  }
  function incoming(){
    let code=null;
    try{const m=String(location.hash||'').match(/^#build=([A-Za-z0-9._~%-]+)/); if(m){code=decodeURIComponent(m[1]); history.replaceState(null,'',location.pathname+location.search)}}catch(e){}
    const pend=S.gget('bcpending',null);
    if(!code&&pend&&pend.cls===cur()&&pend.code){code=pend.code}
    if(pend) S.gset('bcpending',null);
    if(!code) return;
    ui.incoming=code; const P=check(code);
    if(P&&P.ok) banner(P.cls);
  }
  window.buildcodeFormat={version:VER,normStig,readState:()=>readState(),encode:()=>encode(readState()),parse,decode:t=>{const P=parse(t);return P.ok&&P.cls===cur()?decode(P):P},compare:()=>compare(readState()),lists:()=>lists()};
  window.renderBuildCode=function(){render(); wire()};
  try{incoming(); window.renderBuildCode()}catch(e){console.error(e)}
  /* a #build= link pasted into an already-open tab: same handling as on load */
  window.addEventListener('hashchange',()=>{if(!/^#build=/.test(String(location.hash||'')))return; try{incoming(); render()}catch(e){console.error(e)}});
  {const o=window.applyStore;if(typeof o==='function')window.applyStore=function(){const r=o.apply(this,arguments);try{LC=null;render()}catch(e){}return r}}
})();

/* ---------- Achievement farming (data: global ACHFARM = audit/r8/achfarm.json; achievement names, goals and rewards
   come from COLLECT.ach = audit/r4/collect_ach.json, never duplicated) ----------
   Mount: <div id="achfarmbox"></div> on the 'achfarm' tab. Ticks use data-sv="<achievement id>", the same keys the
   Achievements list reads, so a tick here shows as done there too (saved by the global data-sv handler in gear_fn.js).
   Filter (All / Super fast / Easy / Cheese / Alt-friendly) is saved per class in S ('affilt'). */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const D=()=>(typeof ACHFARM!=='undefined'&&ACHFARM)||null;
  const num=n=>Number(n).toLocaleString('en-US');
  const CATS=['fast','easy','cheese'];
  const FILT=[['all','All'],['fast','Super fast'],['easy','Easy'],['cheese','Cheese'],['alt','Alt-friendly']];
  const BIG=/Superior|Abyssal|Soul Codex|Key: Hidden Cube|Lucky Aura|Ultimate Refining|Battle Enhance|Amplify Stone/;
  let MAP=null;
  function achMap(){
    if(MAP) return MAP; MAP={};
    const A=(typeof COLLECT!=='undefined'&&COLLECT&&COLLECT.ach)||null; if(!A) return MAP;
    A.groups.forEach(g=>g.rows.forEach(r=>{MAP[r.id]={r,g}}));
    return MAP;
  }
  const sv=()=>S.get('sv',{})||{};
  const src=k=>{const s=(D().src||{})[k]; if(!s) return ''; return s.u?`<a href="${h(s.u)}" target="_blank" rel="noopener">${h(s.n)}</a>`:h(s.n)};
  function rew(r){
    const it=r.rew.filter(x=>!/^Title: /.test(x[1])).map(x=>{const t=`${x[0]>1?num(x[0])+'× ':''}${h(x[1])}`;return BIG.test(x[1])?`<b>${t}</b>`:t});
    const ti=r.ti?`<b>Title: ${h(r.ti.n)}</b>${r.ti.eq&&r.ti.eq!=='—'?` <span class="muted">(${h(r.ti.eq)})</span>`:''}`:'';
    return (ti?ti+(it.length?', ':''):'')+it.join(', ');
  }
  function itemName(it){const M=achMap();return it.n||it.ids.map(i=>(M[i]?M[i].r.n:i)).join(' + ')}
  function itemHTML(it){
    const M=achMap(), s=sv(), rows=it.ids.map(i=>M[i]).filter(Boolean);
    const done=rows.filter(x=>s[x.r.id]).length;
    const ticks=rows.map(x=>`<label class="check afchk"><input type="checkbox" data-sv="${h(x.r.id)}"${s[x.r.id]?' checked':''}><span class="what"><b>${h(x.r.n)}</b> <span class="small muted">${h(x.r.goal)}${x.r.t&&x.r.t!=='—'?' · tiers '+h(x.r.t):''}</span><br><span class="small">All tiers pay: ${rew(x.r)} <a class="muted" href="https://metabot.gg/en/aion-2/achievements/${h(x.g.id)}" target="_blank" rel="noopener">MetaBot ↗</a></span></span></label>`).join('');
    return `<li class="afitem" data-afcat="${it.cat}" data-afalt="${it.alt?1:0}"${done===rows.length&&rows.length?' data-afdone="1"':''}>
      <div class="panstephead"><span><b>${h(itemName(it))}</b> <span class="tag">${h(it.t)}</span> <span class="tag">${h(it.lv)}</span>${it.alt?' <span class="tag wind">Alt-friendly</span>':''} <span class="small muted">Per character</span>${done===rows.length&&rows.length?' <span class="tag gold">Done</span>':''}</span></div>
      <ol class="small afsteps">${it.steps.map(x=>`<li>${h(x)}</li>`).join('')}</ol>
      <div class="afticks">${ticks}</div>
      ${it.patch?`<p class="small muted" style="margin:4px 0 0"><b>Could be patched:</b> ${h(it.patch)}</p>`:''}
      ${it.conf?`<p class="small muted" style="margin:4px 0 0"><span class="tag">Not sure yet</span> ${h(it.conf)}</p>`:''}
      <p class="small muted" style="margin:4px 0 0">Source: ${it.src.map(src).filter(Boolean).join(' · ')}</p></li>`;
  }
  function counts(list){const s=sv();let n=0,d=0;list.forEach(it=>it.ids.forEach(i=>{n++;if(s[i])d++}));return [d,n]}
  function altHTML(){
    const A=D().alts, V={yes:['Yes','wind'],no:['No',''],check:['Check tooltip','gold']};
    let o=`<details class="box" id="achfarm-alts"><summary><b>Alts: what can reach your main</b> <span class="small muted">server storage yes/no for each reward</span></summary>
      <p class="small">${h(A.intro)}</p>
      <div class="tablewrap"><table><thead><tr><th>Reward</th><th>Moves?</th><th>How / note</th></tr></thead><tbody>${A.moves.map(m=>`<tr><td class="small">${h(m[0])}</td><td class="small"><span class="tag ${V[m[1]][1]}">${V[m[1]][0]}</span></td><td class="small">${h(m[2])} <span class="muted">(${src(m[3])})</span></td></tr>`).join('')}</tbody></table></div>
      <p class="small muted" style="margin:6px 0 0">${h(A.storage)}</p></details>`;
    const C=A.cube;
    o+=`<details class="box" id="achfarm-cube"><summary><b>${h(C.title)}</b> <span class="small muted">12 keys per alt from a Monolith sync</span></summary>
      <ol class="steps small">${C.steps.map(x=>`<li>${h(x)}</li>`).join('')}</ol>
      <div class="tablewrap"><table><tbody>${C.facts.map(f=>`<tr><th class="small" style="text-align:left">${h(f[0])}</th><td class="small">${h(f[1])}</td></tr>`).join('')}</tbody></table></div>
      <p class="small muted" style="margin:6px 0 0">Sources: ${C.src.map(src).filter(Boolean).join(' · ')}. Monolith levels and traces are on <a href="#monoliths" data-goto="monoliths">Monoliths &amp; achievements</a>.</p></details>`;
    o+=`<details class="box" id="achfarm-route"><summary><b>Alts: fastest route for a fresh character</b> <span class="small muted">what to do at each level, and the total haul</span></summary>
      <div class="tablewrap"><table><thead><tr><th>When</th><th>Do</th><th>Time</th></tr></thead><tbody>${A.route.map(r=>`<tr><td class="small"><b>${h(r[0])}</b></td><td class="small">${h(r[1])}</td><td class="small">${h(r[2])}</td></tr>`).join('')}</tbody></table></div>
      <h4 style="margin:10px 0 4px">What one alt brings in</h4><ul class="plain small">${A.haul.map(x=>`<li>${h(x)}</li>`).join('')}</ul>
      <p class="small muted" style="margin:6px 0 0">Leveling itself: <a href="#alts" data-goto="alts">Leveling alts</a>. Times are estimates.</p></details>`;
    o+=`<details class="box" id="achfarm-skip"><summary><b>Not worth it on alts</b> <span class="small muted">shared pools and very long tiers</span></summary><ul class="plain small">${A.skip.map(x=>`<li>${h(x)}</li>`).join('')}</ul></details>`;
    return o;
  }
  function render(){
    const host=document.getElementById('achfarmbox'); if(!host||!D()) return;
    if(!achMap()||!Object.keys(achMap()).length){host.innerHTML='<p class="small muted">Achievement data is missing.</p>';return}
    const open=new Set([...host.querySelectorAll('details[open]')].map(d=>d.id));
    const f=S.get('affilt','all'), items=D().items, [dd,nn]=counts(items);
    let o=`<div class="box" style="display:grid;gap:8px"><p class="small" style="margin:0">Achievements ranked by how fast they are, with the tricks that make them faster. Rewards are the total for all tiers (from the <a href="#achievements" data-goto="achievements">Achievements</a> list). Almost all are <b>per character</b>, so alts can farm them again; see the Alts sections below.</p>
      <div class="seg" role="group" aria-label="Show">${FILT.map(([k,t])=>`<button type="button" data-affilt="${k}" aria-pressed="${f===k}">${t}</button>`).join('')}</div>
      <p class="small muted" style="margin:0">Ticked <b>${dd}</b> of ${nn}. Ticks are shared with the Achievements list.</p></div>`;
    CATS.forEach(c=>{
      let list=items.filter(it=>it.cat===c); if(f==='alt') list=list.filter(it=>it.alt);
      const hide=(f!=='all'&&f!=='alt'&&f!==c)||!list.length;
      const [d,n]=counts(list), cat=D().cats[c], isOpen=open.has('achfarm-'+c)||f===c;
      o+=`<details class="box" id="achfarm-${c}"${isOpen?' open':''}${hide?' hidden':''}><summary><b>${h(cat[0])}</b> <span class="small muted">${h(cat[1])} ${list.length} entries · ${n-d} achievements left</span></summary><ol class="pansteps afsteps-list">${list.map(itemHTML).join('')}</ol></details>`;
    });
    const altOn=f==='all'||f==='alt';
    o+=`<div id="achfarm-altwrap" style="display:grid;gap:14px"${altOn?'':' hidden'}>${altHTML()}</div>`;
    o+=`<details class="box small" id="achfarm-src"><summary><b>Sources and credits</b> <span class="small muted">who found what</span></summary><ul class="plain">
      <li>${src('lf')}: alt achievement farming, the Daevanion board cheese, and which achievement stones can go into server storage. Thanks to LittleFattyGG.</li>
      <li>${src('mb')}: every achievement, goal and reward. ${src('mbmono')}, ${src('mbdaev')}, ${src('mbkey')}.</li>
      <li>${src('maps')} and ${src('data')}: what is bound, server storage rules, cube contents. ${src('game8')}: Monolith sync.</li>
      <li>${src('owner')}: Hidden Cube keys from a Monolith sync on alts, and the Daevanion reset at level 40.</li></ul>
      <p class="muted" style="margin:6px 0 0">Checked ${h(D().v)}. Tricks can stop working after a patch; check the game's achievement window.</p></details>`;
    host.innerHTML=o;
    if(f==='alt') ['achfarm-alts','achfarm-cube','achfarm-route'].forEach(id=>{const e=document.getElementById(id);if(e&&!open.size)e.open=true});
    open.forEach(id=>{const e=document.getElementById(id);if(e&&e.tagName==='DETAILS')e.open=true});
  }
  window.renderAchFarm=render;
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-affilt]');if(!b)return;S.set('affilt',b.dataset.affilt);render()});
  document.addEventListener('change',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.sv;if(k&&k.startsWith('ach-')&&document.getElementById('achfarmbox'))setTimeout(render,0)});
  {const _ap=window.applyStore; if(typeof _ap==='function') window.applyStore=function(){const r=_ap.apply(this,arguments);try{render()}catch(err){}return r}}
  try{render()}catch(err){console.error(err);const d=document.getElementById('achfarmbox');if(d)d.innerHTML='<p class="callout small">This section could not load. Please report it with the feedback link.</p>'}
})();

/* ---------- "Our builds on questlog.gg": the ONE place to paste the guide's questlog.gg build links ----------
   Paste each full https://questlog.gg/... link between the quotes. Any link left '' is hidden, and a class with no
   links at all shows no box. Shown on each class's Rotation & macro tab (polish_fn.js reads this).
   raid  = the main raid / boss build on Rotation & macro
   modes = one build per game mode (Nightmare, Ascension Trial, Daily Dungeon, PvP arena)
   pvp   = the PvP build tab
   extra = the class's other builds (ids match the "Other builds & modes" tab); add more as {name:'...', url:'...'} */
var QUESTLOG_LINKS={
  ranger:      {raid:'', modes:{nightmare:'', trial:'', daily:'', arena:''}, pvp:'', extra:[]},
  gladiator:   {raid:'', modes:{nightmare:'', trial:'', daily:'', arena:''}, pvp:'', extra:[{id:'tank', name:'Tank', url:''}]},
  templar:     {raid:'', modes:{nightmare:'', trial:'', daily:'', arena:''}, pvp:'', extra:[]},
  assassin:    {raid:'', modes:{nightmare:'', trial:'', daily:'', arena:''}, pvp:'', extra:[]},
  sorcerer:    {raid:'', modes:{nightmare:'', trial:'', daily:'', arena:''}, pvp:'', extra:[]},
  spiritmaster:{raid:'', modes:{nightmare:'', trial:'', daily:'', arena:''}, pvp:'', extra:[]},
  cleric:      {raid:'', modes:{nightmare:'', trial:'', daily:'', arena:''}, pvp:'', extra:[{id:'healer', name:'Healer', url:''}, {id:'dps', name:'DPS', url:''}]},
  chanter:     {raid:'', modes:{nightmare:'', trial:'', daily:'', arena:''}, pvp:'', extra:[]},
  brawler:     {raid:'', modes:{arena:''}, pvp:'', extra:[]}
};

/* ---------- Drop-downs (Oct 2026): long reference boxes start closed ----------
   Each entry wraps one box (or the element a script renders into) in
   <details class="box cbox"><summary><b>Title</b> <span>one line. Click to open.</span></summary><div class="cbody">…</div></details>
   - the box itself is moved inside, untouched: every id, render host and listener keeps working, and a re-render
     inside it can't close the drop-down (the <details> sits outside what scripts redraw)
   - the box's own first <h3> is hidden (the summary shows its text, kept in sync when a script redraws it)
   - open/closed is remembered for this visit (sessionStorage), so a reload doesn't snap it shut
   - links into a closed drop-down open it: show('<any element id>') switches to that element's tab, opens every closed
     <details> around it and scrolls to it; scrollIntoView() on anything inside a closed <details> opens it first
   Keys: '#id' = that element; 'h:Text' = the .box whose <h3> starts with Text; 'g:Text' = the .grid2 holding that box. */
(function(){
  const CFG=[
    ['h:Skill ranks at each level','Skill ranks at each level','Every skill\'s rank for each level band, as one big table.'],
    ['#sys-ascension','Ascension gauge','Why the story stops at 22, 32 and 45, and how to fill the gauge.'],
    ['#skillnums','Skill numbers at every rank','Damage, MP, cooldown, range and open perks for any skill at any rank.'],
    ['#classvideos','Recommended videos','Creator guides we checked against this build (YouTube).'],
    ['#sys-combat-analysis','Combat Analysis','Test your macro with the built-in DPS meter (Ctrl+X).'],
    ['#dmgcheckbox','Check your damage','Hit a dummy for 60 s, type the total and see how your damage compares.'],
    ['h:Soul Binding by slot','Soul Binding by slot','The lines to aim for on each slot, best first.'],
    ['#rollbox','Reroll targets','Best, good-enough and reroll lines for every slot, for Soul Binding and stone engraving.'],
    ['#refsets','Gear set bonuses','Which sets have bonuses on Global (only the Arcana card sets) and what they give.'],
    ['#sys-cp','Item level vs Combat Power','What dungeons check at the door and what Combat Power counts.'],
    ['#sys-costplan','Upgrade cost planner','Kina and stones for enhancing, Amplify, crafting and Soul Binding, at your server\'s prices.'],
    ['#sys-optimizer','Upgrade optimizer','Finds the upgrade that adds the most damage per Kina from your gear.'],
    ['#sys-transfer','Transfer and Sync Stones','Why you never extract a spare Unique and what to make from it instead.'],
    ['#sys-soulbind-odds','Soul Binding odds','How likely each line is, and when to stop resetting.'],
    ['g:How to get cards','How to get and enhance cards','Where each card drops and how enhancing works.'],
    ['#timersbox','Timers','Live countdowns for resets, events, field bosses and the Rift, for your server.'],
    ['#shoplistbox','Weekly shopping list','Every currency shop in buying order, with weekly and monthly ticks.'],
    ['#sys-boss-mechanics','Expedition bosses: what kills you','One line per mechanic that wipes groups, boss by boss.'],
    ['#sys-not-live','Not open on Global yet','Things in the game files and database sites that you can\'t do yet.'],
    ['#sys-ascension-trial','Ascension Trial','The solo weekly score run: entries, rooms and rewards.'],
    ['#sys-field-bosses','Field bosses','Where the 56 field bosses are and how their respawns work.'],
    ['#ev-halloween','Halloween event','Pumpkin Coins: how to earn them and what to buy, until the 3/4 Nov maintenance.'],
    ['#ev-1014','14 Oct update','Conquerors of the Abyss and the other changes from that patch.'],
    ['#ev-invasion','Dimensional Invasion','The hourly wave-defence event at :30: how to join and what it pays.'],
    ['#ev-season-end','Season 1 ends 16 Dec','What to finish and spend before the season resets.'],
    ['#sys-rift','Spacetime Rift, arena caps, Abyss duty','Rift times, weekly arena caps and the Abyss duty commands.'],
    ['#sys-season-rank','In-game rankings (Season 1)','The seven ranking boards and what they pay at the end of the season.'],
    ['#kinaplanbox','Weekly Kina planner','Add up the Kina your week of farming and dailies makes, with your own minutes.'],
    ['#sys-sellcraft','Market fees and crafting for profit','The listing fee and tax, the daily Kina cap, and which crafts sell.'],
    ['#sys-shards','Power Shards','The damage consumable most players ignore, and when to switch it on.'],
    ['#sys-death','Dying, reviving and Kisks','What death costs and every way back.'],
    ['#alt-shared','Shared vs per character','Which counters every character on your server shares; spend those on your main.'],
    ['#sys-flight','Flying: Flight Power','What Flight Power and Flight Speed actually do.'],
    ['h:Pet ladder','Pet ladder: easiest to hardest','Every pet in the order that\'s quickest to collect.'],
    ['#genus','Genus Insight guide (Global)','How the five boards, slots, locks and rerolls work.'],
    ['#sys-pantheon','Pantheon and god stats','What each of the ten deity stats does.'],
    ['#sys-closet','Closet collection bonus','How skins add points to each category, up to +50%.'],
    ['#sys-monoliths','Monoliths: what each level is worth','The stats, titles and items each Monolith level gives.'],
    ['#sys-achievements','Achievements: the hidden reward pile','Why achievements are worth it and where the checklist is.'],
    ['#refgloss','Status effects and combat words','Plain-English meanings of every status, crowd-control and hit word.'],
    ['#refunlocks','Unlock requirements','What opens at which level and item level, for every dungeon and system.'],
    ['#reftables','Reference tables','EXP per level, Legion levels, ranking tiers, crafting and gathering mastery.'],
    ['#sys-krtips','Korean tips that work on Global','Tips from a year of Korean servers that apply on Global.'],
    ['#sys-storage','Bags, storage and presets','Cube expansions, character and account storage, presets.'],
    ['#sys-settings','Settings worth changing','Control mode, targeting and other options to change first.'],
    ['g:Where sources disagree','Where sources disagree and main sources','Each disagreement, the choice this guide made and why, plus the main sources.'],
  ];
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const SK='aion2fm-cbox';
  let OPEN={}; try{OPEN=JSON.parse(sessionStorage.getItem(SK)||'{}')||{}}catch(e){OPEN={}}
  const saveOpen=()=>{try{sessionStorage.setItem(SK,JSON.stringify(OPEN))}catch(e){}};
  (function css(){
    if(document.getElementById('cboxcss')) return;
    const st=document.createElement('style'); st.id='cboxcss';
    st.textContent=['details.cbox>summary{cursor:pointer}',
      'details.cbox[open]>summary{margin-bottom:10px}',
      '.cbox>.cbody{display:grid;gap:12px;min-width:0}',
      '.cbox>.cbody>.box,.cbox>.cbody>div:not(.box):not(.grid2)>.box:only-child{border:0;background:none;padding:0;box-shadow:none;margin:0}',
      '.cbox>.cbody>.box>h3:first-child,.cbox>.cbody>div:not(.box):not(.grid2)>.box:only-child>h3:first-child{display:none}',
      '.grid2>details.cbox,.grid3>details.cbox{align-self:start}',
      'section.tab [id],section.tab details{scroll-margin-top:var(--cbox-smt,150px)}'].join('\n');
    document.head.appendChild(st);
  })();
  // jumps land below the sticky class bar + tab bar (their height changes with the screen width)
  function stickyGap(){try{const tb=document.querySelector('.tabbar');if(tb)document.documentElement.style.setProperty('--cbox-smt',Math.max(0,Math.round(tb.getBoundingClientRect().bottom))+10+'px')}catch(e){}}
  function sectionOf(el){return el&&el.closest?el.closest('section.tab'):null}
  function find(key){
    if(key[0]==='#') return document.getElementById(key.slice(1));
    const t=key.slice(2), kind=key[0];
    const hh=[...document.querySelectorAll('section.tab .box h3')].find(x=>x.textContent.trim().startsWith(t)&&!x.closest('details.cbox'));
    if(!hh) return null;
    const box=hh.closest('.box');
    return kind==='g'?(box.parentElement&&box.parentElement.classList.contains('grid2')?box.parentElement:box):box;
  }
  function titleEl(body){
    return body.querySelector(':scope>.box>h3:first-child, :scope>div:not(.box):not(.grid2)>.box:only-child>h3:first-child');
  }
  function sync(d){
    const b=d.querySelector(':scope>summary>b'); if(!b) return;
    const t=titleEl(d.querySelector(':scope>.cbody'));
    const txt=t&&t.textContent.trim()?t.textContent.trim().replace(/\s+/g,' '):d.dataset.ctitle;
    if(b.textContent!==txt) b.textContent=txt;
    const el=d.querySelector(':scope>.cbody>*'); const empty=!el||el.hidden||(!el.children.length&&!el.textContent.trim());
    if(d.hidden!==empty) d.hidden=empty;
  }
  function wrap(el,key,title,sum){
    if(!el||!el.parentNode||el.closest('details.cbox')||el.tagName==='DETAILS'||el.tagName==='SECTION') return;
    const d=document.createElement('details');
    d.className='box cbox'; d.dataset.ckey=key; d.dataset.ctitle=title;
    if(OPEN[key]) d.open=true;
    d.innerHTML=`<summary><b style="font-size:17px">${h(title)}</b> <span class="small muted">${h(sum)} Click to open.</span></summary><div class="cbody"></div>`;
    el.parentNode.insertBefore(d,el);
    d.querySelector('.cbody').appendChild(el);
    d.addEventListener('toggle',()=>{if(d.open)OPEN[key]=1;else delete OPEN[key];saveOpen()});
    sync(d);
    try{let q=0;new MutationObserver(()=>{if(q)return;q=1;setTimeout(()=>{q=0;sync(d)},0)}).observe(d.querySelector('.cbody'),{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']})}catch(e){}
  }
  function apply(){CFG.forEach(([k,t,s])=>{try{const el=find(k);if(el)wrap(el,k,t,s)}catch(e){console.error(e)}})}
  window.applyCollapse=apply;
  // open every closed <details> around an element
  function openAround(el){let n=el&&el.parentElement;while(n){if(n.tagName==='DETAILS'&&!n.open)n.open=true;n=n.parentElement}}
  window.openAround=openAround;
  {const siv=Element.prototype.scrollIntoView;
    if(siv&&!siv._cbox){const f=function(){try{openAround(this);stickyGap()}catch(e){}return siv.apply(this,arguments)};f._cbox=1;Element.prototype.scrollIntoView=f}}
  // show(id): a tab id as before; any other element id opens its tab, its drop-downs, then scrolls to it
  {const orig=window.show;
    window.show=function(id,push){
      const el=id&&document.getElementById(id);
      if(el&&el.tagName!=='SECTION'){
        const sec=sectionOf(el);
        if(sec){
          const r=orig.call(this,sec.id,false);
          if(push){try{history.replaceState(null,'','#'+id)}catch(e){}}
          try{apply()}catch(e){}
          openAround(el); if(el.tagName==='DETAILS') el.open=true;
          setTimeout(()=>{try{el.scrollIntoView({block:'start'})}catch(e){}},30);
          return r;
        }
      }
      const r=orig.apply(this,arguments);
      try{apply()}catch(e){}
      return r;
    };}
  // a #box-id link pasted or clicked as a plain href (no data-goto)
  window.addEventListener('hashchange',()=>{const k=String(location.hash||'').slice(1); if(!k||(typeof ALL!=='undefined'&&ALL[k])) return; const el=document.getElementById(k); if(el&&el.tagName!=='SECTION'&&sectionOf(el)) try{show(k,false)}catch(e){}});
  try{apply()}catch(e){console.error(e)}
})();

/* ---------- Release polish (Oct 2026) ----------
   - merged tabs: old tab ids (modes, closet, achievements, notes, progress) open the tab that now holds them
   - first visit: "Pick your class" grid on Start here
   - Recommended videos (VIDEOS = audit/r7/class_videos.json, recommended:true only; links, never embeds)
   - "Our builds on questlog.gg" (QUESTLOG_LINKS in questlog_links.js; empty links hidden)
   - one closed "Sources for this tab" block per tab (the original lines are hidden, not deleted)
   - "Clear all my saved data" (footer), Brawler "Korea preview" label, saved-progress box on Start here */
(function(){
  const h=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const okUrl=u=>/^https:\/\/[^\s"'<>]+$/i.test(String(u||'').trim());

  /* ---- merged tabs ---- */
  const ALIAS={modes:'builds',closet:'pantheon',achievements:'monoliths',notes:'credits',progress:'start'};
  const orig=window.show;
  window.show=function(id,push){
    const to=ALIAS[id];
    if(to){
      const r=orig.call(this,to,push);
      const el=document.getElementById(id==='progress'?'progressbox':id);
      if(el){ if(el.tagName==='DETAILS'){el.open=true; if(id==='progress'&&typeof renderProgress==='function') renderProgress();}
        setTimeout(()=>{try{el.scrollIntoView({block:'start'})}catch(e){}},0); }
      try{tidySources(to)}catch(e){}
      return r;
    }
    const r=orig.apply(this,arguments);
    try{tidySources(id)}catch(e){}
    try{const nav=document.querySelector('.tabbar nav.tabs'),b=nav&&nav.querySelector('button[aria-selected="true"]');  // phones: keep the open tab visible in the scrolling row
      if(b&&nav.scrollWidth>nav.clientWidth) nav.scrollLeft=Math.max(0,b.offsetLeft-nav.offsetLeft-16)}catch(e){}
    return r;
  };

  /* ---- Brawler is not on Global ---- */
  if(SLUG==='brawler'){const e=document.querySelector('header.hero .eyebrow'); if(e) e.textContent='AION 2 · Brawler · Korea preview (not on Global yet) · Level cap 45';}

  /* ---- first visit: pick your class ---- */
  const ROLE={ranger:'Bow. Ranged burst that kites, slows and nukes from 20 m.',gladiator:'Greatsword. Melee damage and off-tank.',templar:'Sword and shield. The main tank.',
    assassin:'Daggers. Melee burst from behind the boss; top duelist.',sorcerer:'Spellbook. Ranged burst and area damage.',spiritmaster:'Orb. Ranged summoner with spirits that fight for you.',
    cleric:'Mace. The healer, with real damage between heals.',chanter:'Staff. Melee support: party buffs, damage and backup heals.',brawler:'Gauntlets. Melee damage. Korea only, not on Global yet.'};
  function renderPicker(force){
    const host=document.getElementById('classpickgrid'); if(!host) return;
    const hashCls=location.hash.slice(1)&&ALL[location.hash.slice(1)];
    // shown until a class is picked (or kept) once; a link to a class page counts as a pick
    const show=force||(!hashCls&&!S.gget('cls',null)&&!S.gget('pickdone',false));
    if(!show){host.hidden=true;host.innerHTML='';return}
    host.hidden=false;
    host.innerHTML=`<div class="box cpbox"><h3 style="margin:0">Pick your class</h3><p class="small muted" style="margin:0">The whole guide follows the class you pick. You can switch any time with the Class menu at the top. <a href="#start" data-keepcls="1">Keep ${h(ALL[SLUG].cls)}</a></p>
      <div class="cpgrid">${Object.keys(ALL).map(k=>`<button type="button" class="cpcard${k===SLUG?' cur':''}" data-pickcls="${h(k)}"><b>${h(ALL[k].cls)}</b>${k==='brawler'?' <span class="tag">Korea only</span>':''}<span class="small muted">${h(ROLE[k]||'')}</span></button>`).join('')}</div></div>`;
    host.querySelectorAll('[data-pickcls]').forEach(b=>b.addEventListener('click',()=>{
      const k=b.dataset.pickcls; S.gset('cls',k); S.gset('pickdone',true);
      if(k===SLUG){host.hidden=true;host.innerHTML='';return}
      try{history.replaceState(null,'','#'+k)}catch(e){} location.reload();
    }));
    const keep=host.querySelector('[data-keepcls]'); if(keep) keep.addEventListener('click',e=>{e.preventDefault(); S.gset('cls',SLUG); S.gset('pickdone',true); host.hidden=true; host.innerHTML='';});
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-openpicker]'); if(!b) return; e.preventDefault(); renderPicker(true); const g=document.getElementById('classpickgrid'); if(g) g.scrollIntoView({behavior:'smooth',block:'start'})});

  /* ---- recommended videos ---- */
  const scopeTag=s=>/KR/i.test(s)&&!/Global/i.test(s)?'<span class="tag">Korea</span>':'<span class="tag wind">Global</span>';
  const vday=d=>{try{return new Date(d+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}catch(e){return d}};
  function vidItem(v,showDiff){
    if(!okUrl(v.url)) return '';
    return `<li class="vidrow"><div><a href="${h(v.url)}" target="_blank" rel="${/metabot\.gg/i.test(String(v.url||''))?'noopener':'noopener noreferrer'}"><b>${h(v.title)}</b></a></div>
      <div class="small muted">${okUrl(v.channelUrl)?`<a href="${h(v.channelUrl)}" target="_blank" rel="${/metabot\.gg/i.test(String(v.channelUrl||''))?'noopener':'noopener noreferrer'}">${h(v.channel)}</a>`:h(v.channel)} · ${h(vday(v.date))} ${scopeTag(v.scope||'')}</div>
      ${v.why?`<div class="small"><b>Why watch:</b> ${h(v.why)}</div>`:''}
      ${showDiff&&v.differences?`<div class="small"><b>Differs from us on:</b> ${h(v.differences)}</div>`:''}</li>`;
  }
  function renderVideos(){
    if(typeof VIDEOS==='undefined'||!VIDEOS) return;
    const cv=document.getElementById('classvideos');
    if(cv){const L=((VIDEOS.classes||{})[SLUG]||[]).filter(v=>v.recommended);
      cv.innerHTML=L.length?`<div class="box vidbox"><h3 style="margin:0 0 4px">Recommended videos</h3><p class="small muted" style="margin:0 0 8px">Creator guides we checked against this build${SLUG==='brawler'?' (Korean servers)':''}. They open on YouTube in a new tab. Where a video does something differently, it says so.</p><ul class="plain viditems">${L.map(v=>vidItem(v,true)).join('')}</ul><p class="small muted" style="margin:8px 0 0">All videos belong to their creators: please like and subscribe if they help you. Checked ${h(vday(VIDEOS.updated||''))}.</p></div>`:'';}
    const sv=document.getElementById('startvideos');
    if(sv){const L=(VIDEOS.getting_started||[]).filter(v=>v.recommended);
      sv.innerHTML=L.length?`<details class="box vidbox"><summary><b>Videos to get started</b> <span class="small muted">${L.length} creator guides: macro, leveling, gear, dailies</span></summary><ul class="plain viditems" style="margin-top:10px">${L.map(v=>vidItem(v,false)).join('')}</ul><p class="small muted" style="margin:8px 0 0">All videos belong to their creators. Opens YouTube in a new tab.</p></details>`:'';}
  }

  /* ---- questlog.gg build links ---- */
  function renderQuestlog(){
    const host=document.getElementById('questlogbox'); if(!host) return;
    const Q=(typeof QUESTLOG_LINKS!=='undefined'&&QUESTLOG_LINKS&&QUESTLOG_LINKS[SLUG])||null;
    const rows=[];
    if(Q){
      if(okUrl(Q.raid)) rows.push(['Raid / boss build (this tab)',Q.raid]);
      const MN={nightmare:'Nightmare',trial:'Ascension Trial',daily:'Daily Dungeon',arena:'PvP arena'};
      Object.entries(Q.modes||{}).forEach(([k,u])=>{if(okUrl(u)) rows.push([MN[k]||k,u])});
      if(okUrl(Q.pvp)) rows.push(['PvP build',Q.pvp]);
      (Q.extra||[]).forEach(x=>{if(x&&okUrl(x.url)) rows.push([(x.name||'Extra build')+' build',x.url])});
    }
    if(!rows.length){host.hidden=true;host.innerHTML='';return}
    host.hidden=false;
    host.innerHTML=`<div class="box"><h3 style="margin:0 0 6px">Our builds on questlog.gg</h3><p class="small muted" style="margin:0 0 8px">The same builds as this guide, in questlog.gg's build planner. Opens in a new tab.</p><ul class="plain small">${rows.map(([t,u])=>`<li><a href="${h(u)}" target="_blank" rel="${/metabot\.gg/i.test(String(u||''))?'noopener':'noopener noreferrer'}">${h(t)} ↗</a></li>`).join('')}</ul></div>`;
  }

  /* ---- one "Sources for this tab" block per tab ---- */
  const SRC_SKIP=new Set(['credits','communitytools','dungeonguide','changes']);
  const isSrc=el=>/^\s*Sources?\s*:/.test(el.textContent||'');
  function tidySources(id){
    const sec=document.getElementById(id); if(!sec||sec.tagName!=='SECTION'||SRC_SKIP.has(id)) return;
    let det=sec.querySelector(':scope > details.tabsrc');
    const lines=[...sec.querySelectorAll('p')].filter(p=>!p.closest('details.tabsrc')&&isSrc(p));
    if(!lines.length&&!det) return;
    if(!det){det=document.createElement('details');det.className='tabsrc box';sec.appendChild(det)}
    const seen=new Set(), out=[];
    lines.forEach(p=>{
      p.classList.add('srcmoved');
      const box=p.closest('.box,.mergedsec,details,section'); const t=box&&box.querySelector('h3,h4,summary b');
      const key=(p.textContent||'').trim(); if(seen.has(key)) return; seen.add(key);
      const c=p.cloneNode(true); c.classList.remove('srcmoved'); c.removeAttribute('style'); c.className='small muted';
      if(t&&t.textContent.trim()) c.insertAdjacentHTML('afterbegin',`<b>${h(t.textContent.trim().replace(/\s+/g,' ').slice(0,80))}.</b> `);
      out.push(c.outerHTML);
    });
    det.innerHTML=`<summary><b>Sources for this tab</b> <span class="small muted">${out.length} source note${out.length===1?'':'s'}; every source is also on <a href="#credits" data-goto="credits">Sources &amp; credits</a></span></summary><div class="tabsrcbody">${out.join('')}</div>`;
    sec.appendChild(det);
  }
  let tidyT=null;
  const tidyCur=()=>{clearTimeout(tidyT);tidyT=setTimeout(()=>{const s=document.querySelector('section.tab:not([hidden])');if(s)try{tidySources(s.id)}catch(e){}},60)};
  document.addEventListener('change',tidyCur); document.addEventListener('click',tidyCur);
  window.tidySources=tidySources;

  /* ---- saved-progress box on Start here (was the Progress tab) ---- */
  const pb=document.getElementById('progressbox');
  if(pb) pb.addEventListener('toggle',()=>{if(pb.open&&typeof renderProgress==='function') try{renderProgress()}catch(e){}});

  /* ---- clear all my saved data (this guide's key only) ---- */
  async function clearAll(){
    if(!window.confirm('Clear all my saved data?\n\nThis deletes every tick, character, setting and class choice this guide has saved in this browser, for all classes'+(typeof remoteRef!=='undefined'&&remoteRef?' (and the copy in your claude.ai account)':'')+'. It cannot be undone.')) return;
    try{Object.keys(STORE).forEach(k=>delete STORE[k]); STORE.c={}; STORE.ts=Date.now();
      if(typeof remoteRef!=='undefined'&&remoteRef){try{await remoteRef.set({ts:STORE.ts,json:JSON.stringify(STORE)})}catch(e){}}
      localStorage.removeItem('aion2fm');}catch(e){}
    try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
    location.reload();
  }
  document.addEventListener('click',e=>{const b=e.target.closest('#clearall'); if(!b) return; e.preventDefault(); clearAll()});

  /* ---- re-draw after the claude.ai copy of your progress loads ---- */
  function all(){renderPicker(false);renderVideos();renderQuestlog()}
  try{all()}catch(e){console.error(e)}
  /* a class link (#ranger, #cleric ...) pasted into an already-open tab: switch class like the Class menu does */
  window.addEventListener('hashchange',()=>{const k=String(location.hash||'').slice(1); if(!k||!ALL[k]||k===SLUG) return; try{S.gset('cls',k); S.gset('pickdone',true)}catch(e){} location.reload()});
  {const o=window.applyStore;if(typeof o==='function')window.applyStore=function(){const r=o.apply(this,arguments);try{renderQuestlog()}catch(e){}return r}}
})();

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
