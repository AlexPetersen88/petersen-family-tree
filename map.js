/* Visit pins from the Places Scout cards (2026-11-03). Coordinates stay on those pins. */
(function(){
  const PINS=[
    {id:'bjernede-kirke',region:'dk',lat:55.4621,lng:11.6251,zoom:16},
    {id:'haraldsted-kirke',region:'dk',lat:55.4915,lng:11.7682,zoom:17,cluster:'haraldsted'},
    {id:'haraldsted-praestegaard',region:'dk',lat:55.4910,lng:11.7692,zoom:17,cluster:'haraldsted'},
    {id:'valsomagle',region:'dk',lat:55.4933,lng:11.8213,zoom:15},
    {id:'sct-hansgade',region:'dk',lat:55.4445,lng:11.7908,zoom:17},
    {id:'bjernedehuse-overlook',region:'dk',lat:55.4597,lng:11.6419,zoom:15,soft:true,labelNote:'Hamlet overlook, not the house.'},
    {id:'dannebod',region:'mn',lat:44.31115,lng:-94.89040,zoom:15},
    {id:'bethany-lutheran',region:'mn',lat:44.4452,lng:-94.9873,zoom:16},
    {id:'evan',region:'mn',lat:44.3540,lng:-94.8410,zoom:14},
    {id:'redwood-falls-cemetery',region:'mn',lat:44.5510,lng:-95.1000,zoom:16},
    {id:'wolfeboro',region:'mn',lat:43.5848,lng:-71.2122,zoom:13,soft:true,frame:false,labelNote:'Town only. Medium confidence. Not a hospital or a residence.'},
    {id:'pownal',region:'mn',lat:43.8923,lng:-70.1835,zoom:13,soft:true,frame:false,labelNote:'Town only. Medium confidence. Not a building or a residence.'}
  ];
  const byId={};
  PINS.forEach(pin=>{byId[pin.id]=pin});
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const regionStatus=document.getElementById('regionstatus');
  const mapStatus=document.getElementById('mapstatus');
  const chooser=document.getElementById('nearchooser');
  const chooserText=document.getElementById('neartext');
  const chooserBtns=document.getElementById('nearbtns');
  const mapEl=document.getElementById('map');
  let map=null;
  let markers={};
  let current=null;
  let region='dk';

  function narrow(){return matchMedia('(max-width:800px)').matches}
  function placeName(id){
    const el=document.getElementById(id);
    const name=el&&el.querySelector('.place-name');
    return name?name.textContent:'Place';
  }
  function say(text){if(mapStatus)mapStatus.textContent=text}

  function iconFor(pin,on){
    return L.divIcon({
      className:'pin-icon'+(pin.soft?' pin-soft':'')+(on?' pin-on':''),
      html:'<span class="pin-dot"></span>',
      iconSize:[48,48],
      iconAnchor:[24,24]
    });
  }
  function pinLabel(pin){
    return placeName(pin.id)+(pin.labelNote?' . '+pin.labelNote:'');
  }
  function labelMarkers(){
    PINS.forEach(pin=>{
      const marker=markers[pin.id];
      const el=marker&&marker.getElement();
      if(!el)return;
      const label=pinLabel(pin);
      el.title=label;
      el.setAttribute('aria-label',label);
      el.setAttribute('aria-pressed',pin.id===current?'true':'false');
    });
  }
  function paintMarkers(){
    PINS.forEach(pin=>{
      const marker=markers[pin.id];
      if(!marker)return;
      marker.setIcon(iconFor(pin,pin.id===current));
    });
    labelMarkers();
  }
  function hideChooser(){if(chooser)chooser.hidden=true}

  function moveMap(latlng,zoom){
    if(!map)return;
    if(reduce)map.setView(latlng,zoom,{animate:false});
    else map.flyTo(latlng,zoom,{duration:.55});
  }
  function fitRegion(next,animate){
    const pts=PINS.filter(pin=>pin.region===next&&pin.frame!==false);
    if(!map||!pts.length)return;
    if(pts.length===1){
      moveMap([pts[0].lat,pts[0].lng],pts[0].zoom);
      return;
    }
    const bounds=L.latLngBounds(pts.map(pin=>[pin.lat,pin.lng]));
    map.fitBounds(bounds,{padding:[48,48],maxZoom:13,animate:animate&&!reduce});
  }
  function clearSelection(){
    current=null;
    document.querySelectorAll('.place-card').forEach(el=>{
      el.classList.remove('is-current');
      const jump=el.querySelector('.place-jump');
      if(jump)jump.setAttribute('aria-pressed','false');
    });
    paintMarkers();
    hideChooser();
  }
  function setRegion(next,opts){
    opts=opts||{};
    const changed=region!==next;
    region=next;
    document.body.dataset.region=next;
    const dk=document.getElementById('regiondk');
    const mn=document.getElementById('regionmn');
    if(dk)dk.setAttribute('aria-pressed',next==='dk'?'true':'false');
    if(mn)mn.setAttribute('aria-pressed',next==='mn'?'true':'false');
    if(changed&&regionStatus)regionStatus.textContent=next==='dk'?'Showing Denmark.':'Showing Minnesota.';
    const active=document.getElementById(next==='dk'?'places-dk':'places-mn');
    const other=document.getElementById(next==='dk'?'places-mn':'places-dk');
    const side=document.querySelector('.map-side');
    if(side&&active&&other){
      side.appendChild(active);
      side.appendChild(other);
    }
    if(opts.fit!==false)fitRegion(next,opts.animate!==false);
    if(opts.scrollMap&&narrow())mapEl.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'});
    else if(opts.scrollList&&active)active.scrollIntoView({block:'nearest',behavior:reduce?'auto':'smooth'});
  }
  function select(id,opts){
    const pin=byId[id];
    const card=document.getElementById(id);
    if(!pin||!card)return;
    opts=opts||{};
    hideChooser();
    current=id;
    document.querySelectorAll('.place-card').forEach(el=>{
      const on=el.id===id;
      el.classList.toggle('is-current',on);
      const jump=el.querySelector('.place-jump');
      if(jump)jump.setAttribute('aria-pressed',on?'true':'false');
    });
    if(pin.frame===false){
      document.body.dataset.region='';
      const dkBtn=document.getElementById('regiondk');
      const mnBtn=document.getElementById('regionmn');
      if(dkBtn)dkBtn.setAttribute('aria-pressed','false');
      if(mnBtn)mnBtn.setAttribute('aria-pressed','false');
      if(regionStatus)regionStatus.textContent='Showing '+placeName(pin.id)+'. This town is outside the Minnesota close-up. Minnesota brings those pins back.';
    }else setRegion(pin.region,{fit:false,animate:false});
    paintMarkers();
    if(opts.pan!==false)moveMap([pin.lat,pin.lng],pin.zoom);
    if(opts.history!==false&&location.hash!=='#'+id)history.pushState({pin:id,region:pin.region},'','#'+id);
    if(opts.scroll!==false){
      card.scrollIntoView({block:narrow()?'start':'nearest',behavior:reduce?'auto':'smooth'});
    }
    say(placeName(id)+'. Note shown in the place list.');
  }
  function hitsNear(pin){
    if(!map)return [pin];
    const origin=map.latLngToContainerPoint([pin.lat,pin.lng]);
    return PINS.filter(other=>{
      if(other.region!==pin.region)return false;
      const point=map.latLngToContainerPoint([other.lat,other.lng]);
      return origin.distanceTo(point)<44;
    });
  }
  function showChooser(hits){
    const haraldsted=hits.every(pin=>pin.cluster==='haraldsted');
    chooserText.textContent=haraldsted
      ?'Haraldsted Kirke and the præstegård are about 80 metres apart. Choose which note to open.'
      :'These pins sit close together on this view. Choose which note to open.';
    chooserBtns.replaceChildren();
    hits.forEach(pin=>{
      const button=document.createElement('button');
      button.type='button';
      button.textContent=placeName(pin.id);
      button.addEventListener('click',()=>select(pin.id));
      chooserBtns.appendChild(button);
    });
    chooser.hidden=false;
    const bounds=L.latLngBounds(hits.map(pin=>[pin.lat,pin.lng]));
    map.fitBounds(bounds,{padding:[72,72],maxZoom:17,animate:!reduce});
    if(narrow())chooser.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'});
    const first=chooserBtns.querySelector('button');
    if(first)first.focus();
    say(chooserText.textContent);
  }
  function onMarker(pin){
    const hits=hitsNear(pin);
    if(hits.length>1&&map.getZoom()<16)showChooser(hits);
    else select(pin.id);
  }
  function bindList(){
    document.querySelectorAll('.place-jump').forEach(button=>{
      button.addEventListener('click',()=>{
        const card=button.closest('.place-card');
        if(card)select(card.id);
      });
    });
    document.querySelectorAll('.back-map').forEach(button=>{
      button.addEventListener('click',()=>{
        mapEl.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'});
        mapEl.focus();
      });
    });
  }
  function bootMap(){
    if(!window.L){
      mapEl.innerHTML='<p class="lede" style="padding:16px">The map did not load. The place list below still has every visit pin.</p>';
      return;
    }
    map=L.map(mapEl,{scrollWheelZoom:true,zoomControl:true});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    PINS.forEach(pin=>{
      const marker=L.marker([pin.lat,pin.lng],{
        icon:iconFor(pin,false),
        title:pinLabel(pin),
        keyboard:true,
        riseOnHover:true
      });
      marker.on('click',()=>onMarker(pin));
      marker.addTo(map);
      markers[pin.id]=marker;
    });
    paintMarkers();
    map.on('zoomend moveend',labelMarkers);
    requestAnimationFrame(()=>map.invalidateSize());
    addEventListener('resize',()=>{if(map)map.invalidateSize()});
  }
  function boot(){
    bindList();
    bootMap();
    const hash=(location.hash||'').replace(/^#/,'');
    const start=byId[hash]?byId[hash].region:'dk';
    if(!history.state)history.replaceState({region:start,pin:byId[hash]?hash:null},'');
    if(byId[hash])select(hash,{history:false,scroll:false});
    else setRegion('dk',{animate:false});
    addEventListener('popstate',event=>{
      const id=(location.hash||'').replace(/^#/,'');
      if(byId[id])select(id,{history:false});
      else{
        clearSelection();
        const next=event.state&&event.state.region||'dk';
        setRegion(next,{animate:false});
      }
    });
    function showRegion(next){
      if(next===region&&!current){
        setRegion(next,{scrollMap:narrow()});
        return;
      }
      clearSelection();
      history.pushState({region:next},'',location.pathname);
      setRegion(next,{scrollMap:narrow(),scrollList:true});
    }
    document.getElementById('regiondk').addEventListener('click',()=>showRegion('dk'));
    document.getElementById('regionmn').addEventListener('click',()=>showRegion('mn'));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
