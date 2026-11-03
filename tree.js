// Layout: generation = depth from Hans (P6); spouses share generation.
const gen={},order=[];const ROOT='P6';
(function walk(id,g){if(!P[id]||gen[id]!==undefined)return;gen[id]=g;order.push(id);
 (P[id].spouses||[]).forEach(s=>{if(s.id&&P[s.id]&&gen[s.id]===undefined){gen[s.id]=g;order.push(s.id)}});
 const kids=new Set();[id,...(P[id].spouses||[]).map(s=>s.id)].forEach(x=>P[x]&&(P[x].children||[]).forEach(c=>kids.add(c)));
 PEOPLE.people.forEach(q=>(q.parents||[]).includes(id)&&kids.add(q.id));
 kids.forEach(c=>walk(c,g+1))})(ROOT,0);
PEOPLE.people.forEach(p=>{if(gen[p.id]===undefined){gen[p.id]=0;order.push(p.id)}});
const W=216,H=64,GX=28,GY=124,pos={};const rows={};
order.forEach(id=>(rows[gen[id]]=rows[gen[id]]||[]).push(id));
Object.keys(rows).sort((a,b)=>a-b).forEach(g=>{const r=rows[g];
 const key=id=>{const ps=(P[id].parents||[]).filter(x=>pos[x]);if(ps.length)return ps.reduce((s,x)=>s+pos[x].x,0)/ps.length;
  const sp=(P[id].spouses||[]).find(s=>s.id&&pos[s.id]);return sp?pos[sp.id].x:0};
 const units=[];const seen=new Set();r.forEach(id=>{if(seen.has(id))return;const u=[id];seen.add(id);
  (P[id].spouses||[]).forEach(s=>{if(s.id&&r.includes(s.id)&&!seen.has(s.id)){seen.add(s.id);(P[s.id].parents?u.unshift:u.push).call(u,s.id)}});units.push(u)});
 units.forEach(u=>u.sort((a,b)=>(b===ROOT)-(a===ROOT)||0)&&0||u.sort((a,b)=>(P[b].parents?.some(x=>P[x])?1:0)-(P[a].parents?.some(x=>P[x])?1:0)));
 units.sort((a,b)=>Math.min(...a.map(key))-Math.min(...b.map(key)));
 const flat=units.flat();const total=flat.length*(W+GX);
 let x=-total/2;const ideal=units.map(u=>Math.min(...u.map(key)));
 let cursor=-Infinity;units.forEach((u,i)=>{let start=Math.max(cursor,(ideal[i]||0)-(u.length*(W+GX))/2+ (W+GX)/2, g==0?x:-Infinity);
  if(!isFinite(start))start=x;u.forEach((id,j)=>pos[id]={x:start+j*(W+GX),y:g*GY});cursor=start+u.length*(W+GX)})});
const NS='http://www.w3.org/2000/svg',vp=document.getElementById('vp');
const el=(t,a,p=vp)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e};
const done=new Set();PEOPLE.people.forEach(p=>(p.spouses||[]).forEach(s=>{if(!s.id||!pos[s.id])return;const k=[p.id,s.id].sort().join();if(done.has(k))return;done.add(k);
 const a=pos[p.id],b=pos[s.id];el('line',{class:'marr',x1:Math.min(a.x,b.x)+W/2,y1:a.y,x2:Math.max(a.x,b.x)-W/2,y2:b.y})}));
PEOPLE.people.forEach(c=>{const ps=(c.parents||[]).filter(x=>pos[x]);if(!ps.length)return;
 const mx=ps.reduce((s,x)=>s+pos[x].x,0)/ps.length,my=pos[ps[0]].y+(ps.length>1?0:H/2),t=pos[c.id];
 const midY=(my+t.y-H/2)/2+H/4;el('path',{class:'edge',d:`M${mx},${my} V${midY} H${t.x} V${t.y-H/2}`})});
const nodes={};
PEOPLE.people.forEach(p=>{const {x,y}=pos[p.id];const g=el('g',{class:'node'+(isFamily(p)?' family':' records')+(p.living?' living':''),transform:`translate(${x-W/2},${y-H/2})`});
 el('rect',{width:W,height:H},g);const short=p.name.replace(/\s*\(.*\)/,'');
 const size=short.length>32?10.5:short.length>24?12:13.5;
 el('text',{x:W/2,y:26,'text-anchor':'middle','font-size':size},g).textContent=short;
 const sub=el('text',{x:W/2,y:46,'text-anchor':'middle','font-size':12,class:'sub'},g);
 sub.textContent=yrs(p)+(isFamily(p)?'  ✓':'  · rec.');
 g.addEventListener('click',e=>{e.stopPropagation();if(suppressClick){suppressClick=false;return}show(p.id)});nodes[p.id]=g});
let tx=0,ty=0,k=1,suppressClick=false;const svg=document.getElementById('svg'),wrap=document.getElementById('treewrap');
const apply=()=>vp.setAttribute('transform',`translate(${tx},${ty}) scale(${k})`);
function reset(){const xs=Object.values(pos).map(p=>p.x),ys=Object.values(pos).map(p=>p.y);const r=svg.getBoundingClientRect();
 if(!r.width||!r.height)return;
 const bw=Math.max(...xs)-Math.min(...xs)+W+48,bh=Math.max(...ys)-Math.min(...ys)+H+96;k=Math.min(1.15,r.width/bw,(r.height-72)/bh);
 tx=r.width/2-k*(Math.min(...xs)+Math.max(...xs))/2;ty=28+k*H/2-k*Math.min(...ys);apply()}
const zoom=(f,cx,cy)=>{const r=svg.getBoundingClientRect();cx??=r.width/2;cy??=r.height/2;const nk=Math.min(4,Math.max(.12,k*f));const s=nk/k;tx=cx-(cx-tx)*s;ty=cy-(cy-ty)*s;k=nk;apply()};
svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoom(e.deltaY<0?1.12:1/1.12,e.clientX-r.left,e.clientY-r.top)},{passive:false});
const pts=new Map();let drag=null,pinch=null;
svg.addEventListener('pointerdown',e=>{svg.setPointerCapture?.(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pts.size===1){drag={x:e.clientX-tx,y:e.clientY-ty,ox:e.clientX,oy:e.clientY,moved:false};wrap.classList.add('grabbing')}
 else if(pts.size===2){drag=null;const [a,b]=[...pts.values()];pinch={dist:Math.hypot(a.x-b.x,a.y-b.y)||1,k,tx,ty}}});
svg.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pts.size>=2&&pinch){const [a,b]=[...pts.values()];const dist=Math.hypot(a.x-b.x,a.y-b.y)||1;const nk=Math.min(4,Math.max(.12,pinch.k*(dist/pinch.dist)));
  const r=svg.getBoundingClientRect();const px=(a.x+b.x)/2-r.left,py=(a.y+b.y)/2-r.top;const s=nk/pinch.k;tx=px-(px-pinch.tx)*s;ty=py-(py-pinch.ty)*s;k=nk;apply();suppressClick=true}
 else if(drag&&pts.size===1){if(Math.hypot(e.clientX-drag.ox,e.clientY-drag.oy)>8)drag.moved=true;tx=e.clientX-drag.x;ty=e.clientY-drag.y;apply()}});
function endPointer(e){pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!pts.size){if(drag?.moved)suppressClick=true;drag=null;wrap.classList.remove('grabbing')}}
svg.addEventListener('pointerup',endPointer);svg.addEventListener('pointercancel',endPointer);
zi.onclick=()=>zoom(1.2);zo.onclick=()=>zoom(1/1.2);zr.onclick=reset;addEventListener('resize',reset);reset();
const link=x=>P[x]?`<a class="p" data-id="${x}">${esc(P[x].name)}</a>`:esc(x)+' <span class="muted">(not in tree)</span>';
function srcHtml(s){if(/^https?:/.test(s))return `<div class="src"><a href="${esc(s)}" target="_blank" rel="noopener">${esc(s)}</a> <span class="muted">(direct link)</span></div>`;
 const S=SOURCES[s];if(!S)return `<div class="src">${esc(s)} <span class="muted">(not in sources.md)</span></div>`;
 const t=S.text.replace(/https?:\/\/[^\s)]+/g,'').replace(/:\s*$/,'');
 return `<div class="src"><a href="sources.html#${s}"><b>${s}</b></a>${S.flag?' <i>('+esc(S.flag)+')</i>':''}: ${esc(t)} ${S.urls.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">[open ↗]</a>`).join(' ')}</div>`}
function place(o){if(!o)return'';return [o.date,o.place,o.baptism&&('bapt. '+o.baptism),o.placeStatus,o.status].filter(Boolean).map(esc).join(' · ')}
function show(id){const p=P[id];Object.values(nodes).forEach(n=>n.classList.remove('sel'));nodes[id].classList.add('sel');
 const kids=new Set([...(p.children||[])]);PEOPLE.people.forEach(q=>(q.parents||[]).includes(id)&&kids.add(q.id));
 const pills=(isFamily(p)?'<span class="pill f">Family-confirmed</span>':'<span class="pill r">Record-sourced · not confirmed by family</span>')+(isOrigin(p)?'<span class="pill f">Family-confirmed origin</span>':'')+(p.living?'<span class="pill l">LIVING</span>':'');
 let h=`<h2>${esc(p.name)}</h2>${pills}`;
 if(p.familyConfirmed) h+=`<p class="oknote">${esc(p.familyConfirmed)}</p>`;
 if(p.denmarkOrigin) h+=`<p class="oknote">${esc(p.denmarkOrigin)}</p>`;
 if(p.danishParents) h+=`<p class="relnote">${esc(p.danishParents)}</p>`;
 h+=`<dl>`;
 const row=(t,v)=>{if(v)h+=`<dt>${t}</dt><dd>${v}</dd>`};
 row('Born',place(p.birth)||(p.living?'<span class="muted">Not recorded (living person)</span>':'<span class="muted">unknown</span>'));
 if(!p.living)row('Died',place(p.death)||'<span class="muted">unknown</span>');
 row('Burial',esc(p.burial));row('Immigration',p.immigration&&[p.immigration.year||'year unknown',p.immigration.status].map(esc).join(' · '));
 row('Parents',(p.parents||[]).map(link).join('<br>'));
 row('Danish parents',p.danishParents?`<span class="relnote">${esc(p.danishParents)}</span>`:'');
 row('Spouse(s)',(p.spouses||[]).map(s=>(s.id?link(s.id):esc(s.name))+(s.marriage?` <span class="muted">m. ${esc(s.marriage)}</span>`:'')).join('<br>'));
 row('Children',[...kids].map(link).join('<br>'));
 row('Child count',esc(p.children_count));
 row('1900 residence',esc(p.residence_1900));row('1910 residence',esc(p.residence_1910));row('1920 residence',esc(p.residence_1920));
 row('Notes',esc(p.notes));row('Research status',esc(p.status));
 row('Sources',(p.sources||[]).map(srcHtml).join('')||'<span class="muted">none</span>');
 h+=`</dl><p class="muted" style="font-size:.85rem">ID ${p.id}. Double-check against primary records before relying on any of this.</p>`;
 panel.innerHTML=h;document.getElementById('sheet')?.classList.add('open');
 panel.querySelectorAll('a.p').forEach(a=>a.onclick=()=>show(a.dataset.id))}
const sheet=document.getElementById('sheet'),sheetClose=document.getElementById('sheetclose');
if(sheetClose)sheetClose.onclick=e=>{e.stopPropagation();sheet.classList.remove('open')};
if(sheet)sheet.addEventListener('click',()=>{if(matchMedia('(max-width:800px)').matches&&!sheet.classList.contains('open'))sheet.classList.add('open')});
