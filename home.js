/* Start here: Alex's line, built only from recorded parent links. */
(function(){
  if(!window.PEOPLE||!window.PetersenLineage)return;
  const root=document.getElementById('ladder-root');
  if(!root)return;
  const view=window.PetersenView||(window.PetersenView=window.PetersenLineage(window.PEOPLE));
  function onIndex(){
    if(/\/story\//.test(location.pathname))return false;
    return /(?:^|\/)index\.html$|\/$/.test(location.pathname);
  }
  function esc(s){
    return String(s??'').replace(/[&<>"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }
  function markTree(on){
    const a=document.querySelector('[data-nav="tree"]');
    if(!a)return;
    a.classList.toggle('on',!!on);
    if(on)a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  }
  function showHome(){
    document.documentElement.classList.add('home-open');
    markTree(false);
    if(window.PetersenFinder)window.PetersenFinder.close();
    if(location.hash!=='#start')history.replaceState(null,'','#start');
    scrollTo(0,0);
  }
  function rungHtml(rung,side){
    if(!rung||rung.missing){
      return '<div class="rung rung-'+side+' rung-gap"><p class="rung-name">Not recorded</p></div>';
    }
    const bits=['<span class="rung-name">'+esc(rung.label)+'</span>'];
    const detail=[rung.years,rung.place].filter(Boolean).join(' \u00b7 ');
    if(detail)bits.push('<span class="rung-years">'+esc(detail)+'</span>');
    const facts=[];
    if(rung.country)facts.push('<span class="tag">'+esc(rung.country)+'</span>');
    if(rung.confidence&&typeof badgeHtml==='function')facts.push(badgeHtml(rung.confidence.kind,rung.confidence.label));
    else if(rung.confidence)facts.push('<span class="tag">'+esc(rung.confidence.label)+'</span>');
    if(facts.length)bits.push('<span class="rung-facts">'+facts.join('')+'</span>');
    let html='<div class="rung rung-'+side+'"><a class="rung-main" data-id="'+esc(rung.id)+'" href="index.html#'+esc(rung.id)+'">'+bits.join('')+'</a>';
    if(rung.chapter){
      html+='<a class="rung-chapter" href="'+esc(rung.chapter.href)+'">Read his chapter →<span class="sr"> '+esc(rung.chapter.title)+'</span></a>';
    }
    return html+'</div>';
  }
  const ladder=view.ladder();
  const rows=[];
  ladder.before.forEach(function(rung){
    rows.push('<li class="ladder-span">'+rungHtml(rung,'petersen')+'</li>');
  });
  rows.push('<li class="ladder-pair ladder-labels"><span>Petersen line</span><span>Dohrmann line</span></li>');
  const n=Math.max(ladder.petersen.length,ladder.dohrmann.length);
  for(let i=0;i<n;i++){
    const left=ladder.petersen[i]?rungHtml(ladder.petersen[i],'petersen'):'';
    const right=ladder.dohrmann[i]?rungHtml(ladder.dohrmann[i],'dohrmann'):'';
    rows.push('<li class="ladder-pair">'+left+right+'</li>');
  }
  root.innerHTML='<ol class="ladder">'+rows.join('')+'</ol>';
  root.addEventListener('click',function(e){
    const a=e.target.closest('a.rung-main');
    if(!a||typeof window.showPerson!=='function')return;
    e.preventDefault();
    window.showPerson(a.getAttribute('data-id'));
  });
  const find=document.getElementById('find-person');
  if(find)find.addEventListener('click',function(){
    if(window.PetersenFinder)window.PetersenFinder.focus();
    else document.getElementById('finder-q')?.focus();
  });
  const brand=document.querySelector('.brand a');
  if(brand)brand.addEventListener('click',function(e){
    if(!onIndex())return;
    e.preventDefault();
    showHome();
  });
  const treeNav=document.querySelector('[data-nav="tree"]');
  if(treeNav)treeNav.addEventListener('click',function(e){
    if(!onIndex())return;
    e.preventDefault();
    if(window.openTree)window.openTree();
  });
  if(document.documentElement.classList.contains('home-open'))markTree(false);
  window.showHome=showHome;
})();
