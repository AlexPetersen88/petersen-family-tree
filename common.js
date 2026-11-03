const P={};PEOPLE.people.forEach(p=>P[p.id]=p);
const isFamily=p=>!!p.familyConfirmed||/confirmed by Alex/i.test(p.status||'');
const isOrigin=p=>/FAMILY-CONFIRMED|RESOLVED/i.test(p.denmarkOrigin||'')||/ORIGIN FAMILY-CONFIRMED/i.test(p.familyConfirmed||'');
const yrs=p=>{if(p.living)return (p.birth&&p.birth.date?'b. '+p.birth.date.slice(0,4)+' · ':'')+'living';
 return (p.birth&&p.birth.date||'?').slice(0,4)+'–'+(p.death&&p.death.date||'?').slice(0,4)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BANNER='Research in progress. Hans Peter Petersen was born 28 Feb 1864 in Bjernede, Sorø amt, Denmark — family-confirmed origin (Alex, 2026-11-03) — and immigrated in 1884. Hans Pedersen and Ane Rasmusdatter are record-sourced only and are not family-confirmed. He and Maren Sophia are family-confirmed parents of Elmer. Check citations before relying on any of this. Living people show only what Alex shared.';
document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('.banner');if(b)b.textContent=BANNER});
