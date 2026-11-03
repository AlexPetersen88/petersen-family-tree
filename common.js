const P={};PEOPLE.people.forEach(p=>P[p.id]=p);
const isFamily=p=>!!p.familyConfirmed||/confirmed by Alex/i.test(p.status||'');
const isOrigin=p=>/FAMILY-CONFIRMED|RESOLVED/i.test(p.denmarkOrigin||'')||/ORIGIN FAMILY-CONFIRMED/i.test(p.familyConfirmed||'');
const yearOf=d=>{const s=String(d||'');if(/NOT FOUND|unclear|\bor \d{4}/i.test(s))return'?';const m=s.match(/\d{4}/);return m?m[0]:'?'};
const yrs=p=>{if(p.living)return (p.birth&&p.birth.date?'b. '+yearOf(p.birth.date)+' · ':'')+'living';
 return yearOf(p.birth&&p.birth.date)+'–'+yearOf(p.death&&p.death.date)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BANNER='Research in progress. Hans Peter Petersen was born 28 Feb 1864 in Bjernede, Sorø amt, Denmark — family-confirmed origin (Alex, 2026-11-03) — and immigrated in 1884. His Danish parents Hans Pedersen and Ane Rasmusdatter, stepfather Hans Rasmussen, and the Bjernede siblings are record-sourced only and are not family-confirmed. Hans Rasmussen’s birth year 1801 vs 1831 is unresolved. Living people show only what Alex shared.';
document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('.banner');if(b)b.textContent=BANNER});
