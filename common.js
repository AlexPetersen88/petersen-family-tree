const P={};PEOPLE.people.forEach(p=>P[p.id]=p);
const isFamily=p=>!!p.familyConfirmed||/confirmed by Alex/i.test(p.status||'');
const isOrigin=p=>/FAMILY-CONFIRMED|RESOLVED/i.test(p.denmarkOrigin||'')||/ORIGIN FAMILY-CONFIRMED/i.test(p.familyConfirmed||'');
const yearOf=d=>{const s=String(d||'');if(/NOT FOUND|unclear|\bor \d{4}/i.test(s))return'?';const fav=s.match(/FAVOURED:[\s\S]*?(\d{4})/);if(fav)return fav[1];const m=s.match(/\d{4}/);return m?m[0]:'?'};
const yrs=p=>{if(p.living)return (p.birth&&p.birth.date?'b. '+yearOf(p.birth.date)+' · ':'')+'living';
 return yearOf(p.birth&&p.birth.date)+'–'+yearOf(p.death&&p.death.date)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BANNER='Research in progress. Hans Peter Petersen was born 28 Feb 1864 in Bjernede, Sorø amt, Denmark — family-confirmed origin (Alex, 2026-11-03) — and immigrated in 1884. His Danish parents Hans Pedersen and Ane Rasmusdatter, stepfather Hans Rasmussen, and the Bjernede siblings are record-sourced only and are not family-confirmed. Hans Rasmussen’s birth year 1801 vs 1831 is unresolved. Living people show only what Alex shared.';
const BADGE_SVG={
  family:'<svg class="badge-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4.8 8.2 7 10.3 11.3 5.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  records:'<svg class="badge-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="3.2" y="2.2" width="9.6" height="11.6" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.4 6.2h5.2M5.4 8.8h5.2M5.4 11.4h3.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  candidate:'<svg class="badge-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.2 6.5a1.9 1.9 0 1 1 2.4 1.8c-.55.35-.85.75-.85 1.45" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.8" r=".9" fill="currentColor"/></svg>',
  living:'<svg class="badge-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.4 2.1"/></svg>'
};
function badgeHtml(kind,label){
  return `<span class="badge badge-${kind}">${BADGE_SVG[kind]||''}<span class="badge-label">${esc(label)}</span></span>`;
}
function mountBadges(){
  document.querySelectorAll('[data-badge]').forEach(el=>{
    if(el.querySelector('svg'))return;
    const wrap=document.createElement('span');
    wrap.innerHTML=BADGE_SVG[el.getAttribute('data-badge')]||'';
    const svg=wrap.firstElementChild;
    if(svg)el.prepend(svg);
  });
}
mountBadges();
// Cleared HIGH visit pins only. Same five as story/render_html.py.
const HIGH_PINS=[
  {id:'bjernede-kirke',label:'Bjernede Kirke',short:'Bjernede Kirke',osm:'https://www.openstreetmap.org/way/264012018',google:'https://www.google.com/maps/search/?api=1&query=Bjernede+Kirke+Bjernede+Kirkevej+1A+4180+Sor%C3%B8',phrases:['Bjernede churchyard','Bjernede Kirke','Bjernede church']},
  {id:'valsomagle',label:'Valsømagle',short:'Valsømagle',osm:'https://www.openstreetmap.org/node/9956361203',google:'https://www.google.com/maps?q=55.4933219,11.8213452',phrases:['Walsøemagle','Walsømagle','Valsømagle','Walsmagle']},
  {id:'haraldsted-kirke',label:'Haraldsted Kirke and kirkegård',short:'Haraldsted Kirke',osm:'https://www.openstreetmap.org/way/264012020',google:'https://www.google.com/maps?q=55.4915324,11.7681618',phrases:['Haraldsted kirkegård','Haraldsted Kirkegaard','Haraldsted churchyard','Haraldsted Kirke','Haraldsted church']},
  {id:'dannebod',label:'Dannebod Cemetery',short:'Dannebod',osm:'https://www.openstreetmap.org/?mlat=44.31115&mlon=-94.89040#map=16/44.31115/-94.89040',google:'https://www.google.com/maps?q=44.31115,-94.89040',phrases:['Dannebod Cemetery','Dannebod']},
  {id:'praestegaard',label:'Haraldsted Præstegaarden',short:'Præstegaarden',osm:'https://www.openstreetmap.org/node/341232574',google:'https://www.google.com/maps?q=55.4910250,11.7692050',phrases:['Haraldsted Præstegaarden','Haraldsted Præstegård','Haraldsted parsonage','the parish parsonage','the parsonage','præstegård'],candidate:true}
];
function highMapLinks(pin){
  const label=esc(pin.label);
  const group=pin.candidate
    ? `${pin.label}. Place pin only. The couple as parents is still a candidate, not proven.`
    : `Map links for ${pin.label}`;
  const caption=pin.candidate?'<i class="map-caption">Parents still a candidate</i>':'';
  return `<span class="map-links" role="group" aria-label="${esc(group)}"><a class="map-link" href="${esc(pin.osm)}" target="_blank" rel="noopener noreferrer" aria-label="Open map of ${label} on OpenStreetMap">Map · ${esc(pin.short)}</a><a class="map-link map-link-google" href="${esc(pin.google)}" target="_blank" rel="noopener noreferrer" aria-label="Google Maps for ${label}">Google</a>${caption}</span>`;
}
function sentenceEnd(text, after){
  const closers='\"\')”’';
  for(let i=after;i<text.length;i++){
    const ch=text[i];
    if(!'.?!'.includes(ch))continue;
    const prev=i?text[i-1]:'';
    const next=text[i+1]||'';
    if(ch==='.'&&/\d/.test(prev)&&/\d/.test(next))continue;
    let end=i+1;
    while(end<text.length && closers.includes(text[end]))end++;
    const rest=text.slice(end).trimStart();
    if(ch==='.'&&rest&&(rest[0]===','||rest[0]!==rest[0].toUpperCase()))continue;
    return end;
  }
  return text.length;
}
function decorateHighPlaces(html){
  const parts=String(html).split(/(<[^>]+>)/);
  return parts.map(part=>{
    if(part.startsWith('<'))return part;
    const hits=[];
    HIGH_PINS.forEach(pin=>{
      let best=null;
      pin.phrases.forEach(phrase=>{
        const i=part.toLowerCase().indexOf(phrase.toLowerCase());
        if(i<0)return;
        const before=i?part[i-1]:' ';
        const after=part[i+phrase.length]||' ';
        const word=c=>/[0-9A-Za-zøæåØÆÅ]/.test(c);
        if(word(before)||word(after))return;
        if(!best||i<best.i||(i===best.i&&phrase.length>best.len))best={i,len:phrase.length};
      });
      if(best)hits.push({at:sentenceEnd(part, best.i+best.len), pin});
    });
    hits.sort((a,b)=>b.at-a.at);
    let text=part;
    hits.forEach(hit=>{text=text.slice(0,hit.at)+highMapLinks(hit.pin)+text.slice(hit.at)});
    return text;
  }).join('');
}
document.addEventListener('DOMContentLoaded',()=>{
  mountBadges();
  const b=document.querySelector('.banner');
  if(!b)return;
  const details=document.createElement('details');
  details.className='banner-details';
  details.open=!matchMedia('(max-width:800px)').matches;
  const summary=document.createElement('summary');
  const title=document.createElement('span');
  title.className='banner-title';
  title.textContent='Research in progress';
  const hint=document.createElement('span');
  hint.className='banner-hint';
  hint.textContent='Family-confirmed vs record-sourced';
  summary.append(title,hint);
  const full=document.createElement('p');
  full.className='banner-full';
  full.textContent=BANNER;
  details.append(summary,full);
  b.replaceChildren(details);
});
const STORY_TOOLS_KEY='petersen-story-tools';
function storyToolsTight(){return matchMedia('(max-width:800px), (max-height:700px)').matches}
function storyToolsPref(){try{return localStorage.getItem(STORY_TOOLS_KEY)}catch(e){return null}}
function storyToolsCollapsed(){
  const saved=storyToolsPref();
  if(saved==='hidden')return true;
  if(saved==='shown')return false;
  return storyToolsTight();
}
function applyStoryTools(collapsed){
  const btn=document.getElementById('storytoolstoggle');
  const tools=document.getElementById('storytools');
  if(!btn||!tools)return;
  document.documentElement.classList.toggle('story-tools-collapsed', !!collapsed);
  btn.setAttribute('aria-expanded', collapsed?'false':'true');
  if(collapsed){
    if(tools.contains(document.activeElement))btn.focus();
    tools.setAttribute('hidden','');
  }else tools.removeAttribute('hidden');
}
function initStoryTools(){
  const btn=document.getElementById('storytoolstoggle');
  if(!btn||btn.dataset.ready)return;
  btn.dataset.ready='1';
  applyStoryTools(storyToolsCollapsed());
  btn.addEventListener('click',()=>{
    const hide=!document.documentElement.classList.contains('story-tools-collapsed');
    try{localStorage.setItem(STORY_TOOLS_KEY, hide?'hidden':'shown')}catch(e){}
    applyStoryTools(hide);
  });
  matchMedia('(max-width:800px), (max-height:700px)').addEventListener('change',()=>{
    if(storyToolsPref())return;
    applyStoryTools(storyToolsTight());
  });
  addEventListener('pageshow',()=>applyStoryTools(storyToolsCollapsed()));
}
initStoryTools();
