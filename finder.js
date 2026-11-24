/* Sitewide "Find a person" field. Reads PEOPLE in the browser. */
(function(){
  if(!window.PEOPLE||!window.PetersenLineage)return;
  const header=document.querySelector('header');
  if(!header||document.getElementById('finder-q'))return;
  const view=window.PetersenView||(window.PetersenView=window.PetersenLineage(window.PEOPLE));
  function siteRoot(){
    return /\/story\//.test(location.pathname)?'../':'';
  }
  function onTree(){
    if(/\/story\//.test(location.pathname))return false;
    if(/people\.html$|sources\.html$|map\.html$/.test(location.pathname))return false;
    return /(?:^|\/)index\.html$|\/$/.test(location.pathname);
  }
  function esc(s){
    return String(s??'').replace(/[&<>"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }
  const form=document.createElement('form');
  form.className='finder';
  form.setAttribute('role','search');
  form.setAttribute('autocomplete','off');
  form.innerHTML=
    '<label class="sr" for="finder-q">Find a person</label>'+
    '<input id="finder-q" type="search" placeholder="Find a person (e.g. Elmer)" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search" aria-autocomplete="list" aria-controls="finder-list" aria-expanded="false">'+
    '<div class="finder-pop" hidden>'+
      '<p id="finder-status" class="sr" aria-live="polite"></p>'+
      '<ul id="finder-list" class="finder-list" role="listbox" aria-label="Matching people"></ul>'+
      '<a class="finder-all" href="'+esc(siteRoot())+'people.html">All people, A to Z</a>'+
    '</div>';
  header.appendChild(form);
  const input=form.querySelector('#finder-q');
  const pop=form.querySelector('.finder-pop');
  const list=form.querySelector('#finder-list');
  const status=form.querySelector('#finder-status');
  let active=-1;
  function options(){return Array.prototype.slice.call(list.querySelectorAll('[role="option"]'))}
  function close(){
    pop.hidden=true;
    input.setAttribute('aria-expanded','false');
    active=-1;
    options().forEach(function(el){el.removeAttribute('aria-selected')});
  }
  function setActive(next){
    const opts=options();
    if(!opts.length){active=-1;return}
    if(next<0)next=opts.length-1;
    if(next>=opts.length)next=0;
    active=next;
    opts.forEach(function(el,i){
      if(i===active)el.setAttribute('aria-selected','true');
      else el.removeAttribute('aria-selected');
    });
    opts[active].scrollIntoView({block:'nearest'});
  }
  function openPerson(id){
    close();
    input.value='';
    if(onTree()&&typeof window.showPerson==='function'){
      window.showPerson(id);
      return;
    }
    location.href=siteRoot()+'index.html#'+encodeURIComponent(id);
  }
  function render(){
    const q=input.value;
    const hits=q.trim()?view.search(q):[];
    active=-1;
    if(!q.trim()){
      list.innerHTML='';
      status.textContent='';
      const show=document.activeElement===input||form.contains(document.activeElement);
      pop.hidden=!show;
      input.setAttribute('aria-expanded',show?'true':'false');
      return;
    }
    pop.hidden=false;
    input.setAttribute('aria-expanded','true');
    if(!hits.length){
      list.innerHTML='<li class="finder-empty">No one matches that name.</li>';
      status.textContent='No one matches that name.';
      return;
    }
    list.innerHTML=hits.map(function(hit){
      const href=siteRoot()+'index.html#'+encodeURIComponent(hit.id);
      const meta=hit.meta?' <span class="finder-meta">'+esc(hit.meta)+'</span>':'';
      return '<li><a role="option" data-id="'+esc(hit.id)+'" href="'+esc(href)+'"><span class="finder-name">'+esc(hit.name)+'</span>'+meta+'</a></li>';
    }).join('');
    status.textContent=hits.length===1?'1 person':hits.length+' people';
  }
  form.addEventListener('submit',function(e){
    e.preventDefault();
    const opts=options();
    const pick=active>=0?opts[active]:opts[0];
    if(pick)openPerson(pick.getAttribute('data-id'));
  });
  input.addEventListener('input',render);
  input.addEventListener('focus',render);
  input.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      if(pop.hidden)render();
      e.preventDefault();
      setActive(active+(e.key==='ArrowDown'?1:-1));
    }
  });
  list.addEventListener('mousedown',function(e){
    if(e.target.closest('a'))e.preventDefault();
  });
  list.addEventListener('click',function(e){
    const a=e.target.closest('a[data-id]');
    if(!a)return;
    if(onTree()&&typeof window.showPerson==='function'){
      e.preventDefault();
      openPerson(a.getAttribute('data-id'));
    }
  });
  form.addEventListener('focusout',function(){
    setTimeout(function(){
      if(!form.contains(document.activeElement))close();
    },0);
  });
  document.addEventListener('click',function(e){
    if(!form.contains(e.target))close();
  });
  window.PetersenFinder={
    close:close,
    focus:function(){input.focus()}
  };
})();
