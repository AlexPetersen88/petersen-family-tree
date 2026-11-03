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
