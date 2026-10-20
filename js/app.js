/* =========================================================
 * WANDERGO · Fly Me to the World —— 应用逻辑 app.js
 * 依赖：echarts(在线加载) + data.js
 * 模块：主题 / 登录注册 / 地图 / AI 规划 / 社区 / 打卡 / 纪念册 / BGM
 * ========================================================= */

/* ================= 工具 ================= */
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
let toastTimer;
function toast(m,t){const e=$('#toast');e.textContent=m;e.className='toast show '+(t||'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2500)}
function fmt(n){return '¥ '+Number(n||0).toLocaleString('zh-CN')}
/* ================= 数据：景点（含坐标/地址/时长/交通） ================= */
/* ================= 主题 ================= */
function setTheme(t){document.documentElement.dataset.theme=t;localStorage.setItem('fmw_theme',t);$$('#themeDrop [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===t));toast('主题已切换 ✨');}
$('#themeBtn').onclick=e=>{e.stopPropagation();$('#themeDrop').classList.toggle('show')};
document.addEventListener('click',e=>{if(!e.target.closest('#themeFab'))$('#themeDrop').classList.remove('show')});
$$('#themeDrop [data-t]').forEach(b=>b.onclick=()=>setTheme(b.dataset.t));
const _st=localStorage.getItem('fmw_theme')||'night';
document.documentElement.dataset.theme=_st;
/* ================= 自定义配色引擎 ================= */
let cusH=210,cusS=62,cusL=54,cusMode='mono';
const hsl=(h,s,l,a=1)=>`hsla(${((h%360)+360)%360},${Math.max(0,Math.min(100,s))}%,${Math.max(0,Math.min(100,l))}%,${a})`;
function applyCustom(silent){
  const acH=cusMode==='comp'?cusH+180:cusMode==='ana'?cusH+26:cusH;
  const dpH=cusMode==='ana'?cusH-26:acH;
  const deep=hsl(dpH,cusS,Math.max(30,cusL-16));
  const r=document.documentElement.style;
  r.setProperty('--gold',hsl(acH,cusS,cusL));
  r.setProperty('--gold-deep',deep);
  r.setProperty('--gold-grad',`linear-gradient(180deg,${hsl(acH,cusS,Math.min(74,cusL+8))},${deep})`);
  r.setProperty('--line-gold',hsl(acH,70,60,.34));
  r.setProperty('--glass',hsl(acH,55,60,.08));
  r.setProperty('--hero-a',hsl(cusH,42,6));
  r.setProperty('--hero-b',hsl(cusMode==='comp'?acH:((cusH+dpH)/2),50,21));
  r.setProperty('--bg',hsl(cusH,32,6));
  r.setProperty('--bg-soft',hsl(cusH,30,9));
  r.setProperty('--panel',hsl(cusH,28,12));
  r.setProperty('--panel-2',hsl(cusH,26,17));
  r.setProperty('--panel-3',hsl(cusH,24,23));
  document.documentElement.dataset.theme='custom';
  localStorage.setItem('fmw_theme','custom');
  localStorage.setItem('fmw_custom',JSON.stringify({h:cusH,s:cusS,l:cusL,m:cusMode}));
  $$('#themeDrop [data-t]').forEach(b=>b.classList.remove('on'));
  const dot=$('#fabDot');dot.style.display='block';dot.style.background=hsl(acH,cusS,cusL);
  $('#cpPrev').innerHTML=[hsl(acH,cusS,cusL),deep,hsl(cusH,26,17),hsl(acH+180,42,55)].map(c=>`<i style="background:${c}"></i>`).join('');
  if(!silent)toast('自定义配色已应用 🎨');
}
function syncWheel(){
  const R=40,x=52+Math.sin(cusH*Math.PI/180)*R,y=52-Math.cos(cusH*Math.PI/180)*R;
  const k=$('#wheelKnob');k.style.left=x+'px';k.style.top=y+'px';k.style.background=hsl(cusH,cusS,55);
  $('#cusS').value=cusS;$('#cusL').value=cusL;
}
function wheelPick(e){
  const b=$('#hueWheel').getBoundingClientRect();
  const x=e.clientX-(b.left+b.width/2),y=e.clientY-(b.top+b.height/2);
  cusH=(Math.atan2(x,-y)*180/Math.PI+360)%360;syncWheel();applyCustom(true);
}
let wheelDrag=false;
const _hw=$('#hueWheel');
_hw.addEventListener('pointerdown',e=>{wheelDrag=true;_hw.setPointerCapture(e.pointerId);wheelPick(e)});
_hw.addEventListener('pointermove',e=>{if(wheelDrag)wheelPick(e)});
_hw.addEventListener('pointerup',()=>{if(wheelDrag){wheelDrag=false;applyCustom()}});
$('#cusS').oninput=e=>{cusS=+e.target.value;syncWheel();applyCustom(true)};
$('#cusL').oninput=e=>{cusL=+e.target.value;syncWheel();applyCustom(true)};
$$('#cpModes .mini').forEach(b=>b.onclick=()=>{cusMode=b.dataset.m;$$('#cpModes .mini').forEach(x=>x.classList.toggle('on',x===b));applyCustom()});
$('#cusApply').onclick=()=>applyCustom();
$('#aiPairBtn').onclick=()=>{
  const r=Math.random();
  if(r<.4){cusMode='comp';toast('🤖 AI 搭配：互补撞色')}
  else if(r<.75){cusH=(cusH+150)%360;cusMode='ana';toast('🤖 AI 搭配：分裂互补')}
  else{cusH=(cusH+120)%360;cusMode='mono';cusS=Math.min(88,cusS+16);toast('🤖 AI 搭配：三角和谐')}
  syncWheel();applyCustom();
};
/* ---- 灵感色卡 ---- */
const PALS={ins:[['奶油摩卡',28,44],['复古胶片',14,58],['海盐灰蓝',208,38],['鼠尾草',120,26]],gf:[['黛蓝',215,46],['朱砂红',2,66],['竹青',140,38],['藕荷',320,34]]};
function palCard(p,kind){const[h,n,s]=p;return `<div class="pal-card" data-h="${h}" data-s="${s}"><div class="sw"><i style="background:${hsl(h,s,54)}"></i><i style="background:${hsl(h,Math.max(15,s-12),72)}"></i><i style="background:${hsl(h,s,30)}"></i><i style="background:${hsl(h+32,s-6,48)}"></i></div><b>${n}</b><p>${kind} · H${h} · S${s}%</p></div>`}
function renderPals(){
  $('#palIns').innerHTML=PALS.ins.map(p=>palCard(p,'ins 风')).join('');
  $('#palGf').innerHTML=PALS.gf.map(p=>palCard(p,'国风')).join('');
  $$('#palIns .pal-card,#palGf .pal-card').forEach(c=>c.onclick=()=>{
    cusH=+c.dataset.h;cusS=+c.dataset.s;cusMode='mono';
    $$('#cpModes .mini').forEach(x=>x.classList.toggle('on',x.dataset.m==='mono'));
    syncWheel();applyCustom();
  });
}
renderPals();
if(_st==='custom'){try{const c=JSON.parse(localStorage.getItem('fmw_custom')||'{}');if(c.h!=null){cusH=c.h;cusS=c.s;cusL=c.l;cusMode=c.m||'mono'}}catch(e){}syncWheel();applyCustom(true)}
/* ---- 侧栏收起 ---- */
if(localStorage.getItem('fmw_sb')==='min')document.body.classList.add('sb-min');
$('#sbToggle').onclick=()=>{const min=document.body.classList.toggle('sb-min');localStorage.setItem('fmw_sb',min?'min':'max');setTimeout(()=>resizeCharts(),360)};
/* ================= 登录 / 注册 ================= */
let user=JSON.parse(localStorage.getItem('fmw_user')||'null');
function refreshUser(){
  if(user){$('#navLoginBtn').style.display='none';$('#avatarChip').classList.add('show');$('#avatarTxt').textContent=user.nick[0];$('#avatarName').textContent=user.nick;
    $('#meAv').textContent=user.nick[0];$('#meName').textContent=user.nick;$('#meLv').textContent='✈️ 旅行者 Lv.2';$('#logoutBtn2').textContent='退出登录';}
  else{$('#navLoginBtn').style.display='';$('#avatarChip').classList.remove('show');
    $('#meAv').textContent='旅';$('#meName').textContent='未登录旅行者';$('#meLv').textContent='🧭 预览模式';$('#logoutBtn2').textContent='去登录';}
  refreshMe();
}
$('#navLoginBtn').onclick=()=>openAuth();
$('#logoutBtn2').onclick=()=>{ if(!user){openAuth();return} user=null;localStorage.removeItem('fmw_user');refreshUser();toast('已退出登录，期待下一站再见 👋'); };
$('#avatarChip').onclick=()=>$('#me').scrollIntoView();
function openAuth(tab){
  openModal(`<button class="mx" onclick="closeModal()">✕</button>
  <div style="padding:26px">
    <div class="auth-tabs"><button id="atL" class="on">登录</button><button id="atR">注册</button></div>
    <div id="authBody"></div>
  </div>`,false);
  let mode=tab||'login';
  function render(){
    $('#atL').classList.toggle('on',mode==='login');$('#atR').classList.toggle('on',mode==='register');
    $('#authBody').innerHTML=`
      <h3>${mode==='login'?'欢迎回来':'开启你的旅程'}</h3>
      <p class="as">${mode==='login'?'登录你的旅行空间，继续未完的旅程':'注册账号，收藏世界上的每一个角落'}</p>
      <div class="auth-field"><label>昵称</label><input id="auNick" placeholder="${mode==='login'?'你的昵称 / 邮箱':'给自己起一个旅行昵称'}"></div>
      <div class="auth-field"><label>密码</label><input id="auPwd" type="password" placeholder="至少 6 位"></div>
      ${mode==='register'?'<div class="auth-field"><label>确认密码</label><input id="auPwd2" type="password" placeholder="再输入一次"></div>':''}
      <div class="auth-err" id="auErr"></div>
      <button class="btn gold" id="auGo" style="width:100%;height:44px;font-size:15px">${mode==='login'?'登 录':'注册并进入'}</button>`;
    $('#auGo').onclick=()=>{
      const nick=$('#auNick').value.trim(),pwd=$('#auPwd').value;
      if(!nick)return err('请输入昵称');
      if(pwd.length<6)return err('密码至少 6 位');
      if(mode==='register'&&$('#auPwd2').value!==pwd)return err('两次密码不一致');
      user={nick:nick.split('@')[0]||nick};localStorage.setItem('fmw_user',JSON.stringify(user));
      refreshUser();closeModal();toast((mode==='login'?'欢迎回来，':'注册成功，欢迎加入旅程，')+user.nick+'！','ok');
    };
    function err(m){$('#auErr').textContent=m}
  }
  $('#atL').onclick=()=>{mode='login';render()};$('#atR').onclick=()=>{mode='register';render()};
  render();
}
/* ================= 弹窗 ================= */
function openModal(html,wide){$('#modalBox').className='modal'+(wide?' wide':'');$('#modalBox').innerHTML=html;$('#ovl').classList.add('show')}
function closeModal(){$('#ovl').classList.remove('show');stopVSlide()}
$('#ovl').addEventListener('click',e=>{if(e.target===$('#ovl'))closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
/* ================= 地图 ================= */
const CHARTS={};let mapMode='cn';
function loadECharts(cb){
  const urls=[
   ['https://cdn.jsdelivr.net/npm/echarts@4.9.0/dist/echarts.min.js','https://unpkg.com/echarts@4.9.0/dist/echarts.min.js','https://registry.npmmirror.com/echarts/4.9.0/files/dist/echarts.min.js'],
   ['https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/js/china.js','https://unpkg.com/echarts@4.9.0/map/js/china.js','https://registry.npmmirror.com/echarts/4.9.0/files/map/js/china.js'],
   ['https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/js/world.js','https://unpkg.com/echarts@4.9.0/map/js/world.js','https://registry.npmmirror.com/echarts/4.9.0/files/map/js/world.js']
  ];
  let i=0;(function next(){
    if(i>=urls.length){cb(true);return}
    const list=urls[i];let j=0;
    (function tryOne(){
      if(j>=list.length){ if(i===0){cb(false);return} i++;next();return }
      const s=document.createElement('script');s.src=list[j++];
      s.onload=()=>{i++;next()};s.onerror=()=>{s.remove();tryOne()};
      document.head.appendChild(s);
    })();
  })();
}
const GEO_PAL=['#f6d186','#9fc5e8','#b7e0b2','#f2b8c6','#c9b2e8','#a2ded8','#f0c890','#8fbfe0','#e8d9a0','#b0d0a8'];
function hexShade(hex,amt){
  const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;
  const t=amt<0?0:255,p=Math.abs(amt);
  r=Math.round(r+(t-r)*p);g=Math.round(g+(t-g)*p);b=Math.round(b+(t-b)*p);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
function regionColors(map){
  try{
    const feats=echarts.getMap(map).geoJson.features;
    return feats.map(f=>{
      const n=f.properties.name||'';let h=0;for(let i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))>>>0;
      const base=GEO_PAL[h%GEO_PAL.length];
      return {name:n,itemStyle:{areaColor:{type:'linear',x:0,y:0,x2:0,y2:1,
        colorStops:[{offset:0,color:hexShade(base,.3)},{offset:.55,color:base},{offset:1,color:hexShade(base,-.24)}]},
        borderColor:'rgba(255,255,255,.5)',borderWidth:1}};
    });
  }catch(e){return []}
}
function spotSeries(list){
  return {type:'effectScatter',coordinateSystem:'geo',geoIndex:4,rippleEffect:{brushType:'stroke',scale:3.4},
    symbolSize:9,itemStyle:{color:'#ff6b57',shadowBlur:12,shadowColor:'rgba(255,107,87,.7)'},
    data:list.map(s=>({name:s.n,value:[s.lng,s.lat],id:s.id})),zlevel:2};
}
function iconSeries(list){
  return {type:'scatter',coordinateSystem:'geo',geoIndex:4,zlevel:3,symbolSize:27,cursor:'pointer',
    emphasis:{scale:1.35},symbol:(v,p)=>iconURL(ICO[p.data.id]||'📍'),
    data:list.map(s=>({name:s.n,value:[s.lng,s.lat],id:s.id}))};
}
function lineSeries(list){
  return {type:'lines',coordinateSystem:'geo',geoIndex:4,zlevel:1,
    effect:{show:true,period:4.2,trailLength:.55,symbol:'arrow',symbolSize:5,color:'#f0d488'},
    lineStyle:{color:'#e7c76d',width:1.1,opacity:.32,curveness:.28},
    data:list.map(s=>({coords:[[116.40,39.90],[s.lng,s.lat]],id:s.id}))};
}
function baseGeo(map){return {map:map,roam:true,zoom:map==='china'?1.18:1.06,center:map==='china'?[104.5,37.5]:null,
  layoutCenter:['50%','50%'],layoutSize:'88%'}}
/* 真 3D：4 层侧壁由深到浅向下挤出 + 光照渐变顶面 */
function geoLayers(map){
  const top=baseGeo(map);
  top.regions=regionColors(map);
  top.itemStyle={areaColor:'rgba(126,146,200,.12)',borderColor:'rgba(255,255,255,.55)',borderWidth:1,shadowColor:'rgba(0,0,0,.4)',shadowBlur:12,shadowOffsetY:6};
  top.emphasis={label:{show:false},itemStyle:{areaColor:'rgba(255,220,130,.45)'}};
  const SIDES=[{y:52.9,c:'#0c1424'},{y:52.2,c:'#111d36'},{y:51.5,c:'#182747'},{y:50.8,c:'#203154'}];
  const arr=SIDES.map(s=>{
    const g=JSON.parse(JSON.stringify(top));
    g.regions=[];g.silent=true;g.emphasis={label:{show:false}};
    g.layoutCenter=['50%',s.y+'%'];
    g.itemStyle={areaColor:s.c,borderColor:'rgba(0,0,0,.4)',borderWidth:1,shadowColor:'rgba(0,0,0,.5)',shadowBlur:18,shadowOffsetY:12};
    return g;
  });
  arr.push(top);return arr;
}
function renderMap(mode){
  const elId=mode==='cn'?'#chinaMap':'#worldMap', list=SPOTS.filter(s=>mode==='cn'?s.rg==='cn':s.rg==='ab');
  if(!window.echarts)return mapFallback();
  $$(elId)[0].style.display='block';
  if(!CHARTS[mode]){
    const c=echarts.init($(elId));
    c.setOption({backgroundColor:'transparent',tooltip:{trigger:'item',backgroundColor:'rgba(15,23,42,.92)',borderColor:'rgba(231,199,109,.4)',textStyle:{color:'#fff',fontSize:12},formatter:p=>p.data&&p.data.id?('<b>'+p.data.name+'</b><br>点击标点查看详情'):(p.name||'')},
      geo:geoLayers(mode==='cn'?'china':'world'),series:[lineSeries(list),spotSeries(list),iconSeries(list)]});
    c.on('click',p=>{if(p.data&&p.data.id)openSpot(p.data.id)});
    c.on('georoam',()=>{const o=c.getOption(),t=o.geo&&o.geo[o.geo.length-1];if(!t)return;
      c.setOption({geo:o.geo.map(()=>({zoom:t.zoom,center:t.center}))})});
    CHARTS[mode]=c;
  }else syncMapGeo(CHARTS[mode]);
}
/* 尺寸重排：resize 后把最顶层(交互层)的 zoom/center 重新刷到所有层，消除错位 */
function syncMapGeo(c){
  if(!c)return;const o=c.getOption(),t=o.geo&&o.geo[o.geo.length-1];
  c.resize();
  if(t&&t.zoom!=null)c.setOption({geo:o.geo.map(()=>({zoom:t.zoom,center:t.center}))});
}
function resizeCharts(){Object.values(CHARTS).forEach(syncMapGeo)}
window.addEventListener('resize',()=>{clearTimeout(window.__winRzT);window.__winRzT=setTimeout(resizeCharts,150)});
if(window.ResizeObserver){const _ro=new ResizeObserver(()=>{clearTimeout(window.__mapRzT);window.__mapRzT=setTimeout(resizeCharts,160)});
  setTimeout(()=>['chinaMap','worldMap'].forEach(id=>{const el=document.getElementById(id);if(el)_ro.observe(el)}),0);}
function switchMap(m){
  mapMode=m;
  $$('#mapTabs button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  $('#chinaMap').style.display=m==='cn'?'block':'none';
  $('#worldMap').style.display=m==='world'?'block':'none';
  if(CHARTS[m])CHARTS[m].resize();
}
$$('#mapTabs button').forEach(b=>b.onclick=()=>switchMap(b.dataset.m));
function mapFallback(){
  $('#chinaMap').style.display='none';$('#worldMap').style.display='none';
  const fb=$('#mapFallback');fb.style.display='grid';
  fb.innerHTML=SPOTS.map(s=>`<div class="spot-mini" onclick="openSpot('${s.id}')"><img src="${IMG(P[s.id])}" loading="lazy"><div><h5>${s.n}</h5><div class="city">${s.city} · ${s.addr}</div><div class="icon-chips"><span class="hl">⏱ ${s.hrs}</span><span>${s.traf}</span></div></div></div>`).join('');
  toast('在线地图资源加载失败，已切换为列表模式');
}
/* 景点详情 */
function openSpot(id){
  const s=spotById(id);if(!s)return;
  openModal(`<button class="mx" onclick="closeModal()">✕</button>
  <div class="dhero"><img src="${IMG(P[s.id])}"><div class="dc">
    <h3>${s.n} <span class="tagpill ${s.rg}" style="vertical-align:3px">${s.rg==='cn'?'国内':'国外'}</span></h3>
    <div class="meta"><span>📍 ${s.city}</span><span>${s.tag}</span><span>⭐ ${s.rating}</span></div></div></div>
  <div class="dbody">
    <p class="desc">${s.desc}</p>
    <div class="kv">
      <div class="item">🏠 景点地址<b>${s.addr}</b></div>
      <div class="item">🌐 经纬度坐标<b class="gold">${s.lng.toFixed(3)}, ${s.lat.toFixed(3)}</b></div>
      <div class="item">⏱ 建议游玩时长<b>${s.hrs}</b></div>
      <div class="item">🚄 交通衔接<b>${s.traf}</b></div>
      <div class="item">💰 门票参考<b class="gold">${s.price}</b></div>
      <div class="item">📷 景点标签<b>${s.tag}</b></div>
    </div>
    <p class="coord-note">坐标获取方式：高德/百度坐标拾取器人工校准，可用于地图标点（demo 演示数据）。</p>
    <div class="dbtns">
      <button class="btn line" onclick="favSpot('${s.id}')">♥ 收藏</button>
      <button class="btn line" onclick="askAI('${s.city}')">🤖 让 AI 规划这里</button>
      <button class="btn gold" onclick="preCk('${s.id}')">📸 去打卡</button>
    </div>
  </div>`,true);
}
function favSpot(id){toast('已收藏「'+spotById(id).n+'」⭐')}
function preCk(id){closeModal();$('#ckDest').value=id;$('#checkin').scrollIntoView();toast('目的地已选好，来记录这一站吧 📸')}
function askAI(city){closeModal();$('#aiInput').value='我想去'+city+'玩，帮我做一份模块化攻略';$('#ai').scrollIntoView();runAI($('#aiInput').value)}
/* ================= AI 规划 ================= */
function matchPlan(q){
  for(const k in PLANS){if(q.includes(k))return PLANS[k]}
  const hit=SPOTS.find(s=>q.includes(s.n)||q.includes(s.city));
  if(hit){const base=PLANS['大理'];return {...base,dest:hit.city+' · '+hit.n,days:'2-3 天',spots:[hit.id,...base.spots.filter(i=>i!==hit.id).slice(0,2)]}}
  return null;
}
function runAI(q){
  q=(q||'').trim();if(!q)return toast('先告诉 AI 你想去哪儿吧 ✍️');
  $('#ai').scrollIntoView({block:'start'});
  const pipe=$('#pipeline');pipe.classList.add('show');
  const steps=$$('.step');steps.forEach(s=>s.classList.remove('doing','done'));
  $('#modGrid').classList.remove('show');$('#planHead').classList.remove('show');
  let p=0;$('#pipeBar').style.width='4%';
  const total=2600,seg=total/4;let si=0;
  const t1=setInterval(()=>{
    if(si>0&&steps[si-1]){steps[si-1].classList.remove('doing');steps[si-1].classList.add('done')}
    if(si<4){steps[si].classList.add('doing');p=Math.min(97,(si+1)/4*96);$('#pipeBar').style.width=p+'%';si++}
    else{clearInterval(t1);steps[3].classList.remove('doing');steps[3].classList.add('done');$('#pipeBar').style.width='100%';setTimeout(()=>{pipe.classList.remove('show');showPlan(matchPlan(q))},420)}
  },seg);
}
$('#aiGo').onclick=()=>runAI($('#aiInput').value);
$('#aiInput').addEventListener('keydown',e=>{if(e.key==='Enter')runAI(e.target.value)});
$$('#aiChips button').forEach(b=>b.onclick=()=>{$('#aiInput').value=b.textContent;runAI(b.textContent)});
function showPlan(plan){
  const grid=$('#modGrid');
  if(!plan){grid.classList.add('show');grid.innerHTML='<div class="mod col-12">暂未收录该目的地，试试：大理 / 张家界 / 成都九寨 / 日本 / 清迈 / 巴黎 / 冰岛 / 马尔代夫 / 三亚，或点击地图上的景点让 AI 规划 ✨</div>';$('#planHead').classList.remove('show');return}
  $('#planHead').innerHTML=`<div class="t">🧩 AI 已为你规划 · <b>${plan.dest}</b> · ${plan.days} · 参考预算 <b>${fmt(plan.budget)}</b></div><button class="btn line" onclick="document.getElementById('aiInput').focus()">换个问法重新规划</button>`;
  $('#planHead').classList.add('show');
  const dcs=['#e7c76d','#7ea6d9','#6cc47a','#e58fb1','#9a86d9'];
  let bg='';plan.budgetItems.forEach((b,i)=>bg+=`--dc${i+1}:${dcs[i]};`);
  grid.innerHTML=`
  <div class="mod col-12 clickable" style="animation-delay:.05s" onclick="openMod('spots','${plan.dest}')">
    <h4><span class="mi">🏞</span>景点推荐（含图标分析）<span class="go">查看详情 →</span></h4>
    <div class="spot-mini-list">${plan.spots.map(id=>{const s=spotById(id);if(!s)return'';return `<div class="spot-mini" onclick="event.stopPropagation();openSpot('${s.id}')"><img src="${IMG(P[s.id])}" loading="lazy"><div><h5>${s.n}</h5><div class="city">${s.city} · ${s.tag}</div><div class="icon-chips"><span class="hl">⭐${s.rating}</span><span>💰${s.price}</span><span>⏱${s.hrs}</span><span>🚄${s.traf.split('（')[0]}</span><span>👫 情侣友好</span><span>🎒 背包友好</span></div></div></div>`}).join('')}</div>
  </div>
  <div class="mod col-6 clickable" style="animation-delay:.15s" onclick="openMod('transport','${plan.dest}')">
    <h4><span class="mi">🚄</span>出行方式<span class="go">查看详情 →</span></h4>
    ${plan.transport.map(t=>`<div class="trow"><span class="tm">${t.m}</span><div><div class="bar"><i style="width:${t.s*100}%"></i></div><div style="font-size:10.5px;color:var(--muted);margin-top:2px">${t.note} · 约 ${t.t}</div></div><span class="tp">${t.p}</span></div>`).join('')}
  </div>
  <div class="mod col-6 clickable" style="animation-delay:.25s" onclick="openMod('budget','${plan.dest}')" >
    <h4><span class="mi">💰</span>价格规划<span class="go">查看详情 →</span></h4>
    <div class="donut-row" style="${bg}">
      <div class="donut"><b>${fmt(plan.budget).replace('¥ ','¥')}<i>总预算</i></b></div>
      <div class="dlegend">${plan.budgetItems.map(b=>`<div class="li"><span><i style="background:var(${b.c})"></i>${b.k}</span><span>${fmt(b.v)}</span></div>`).join('')}</div>
    </div>
  </div>
  <div class="mod col-6 clickable" style="animation-delay:.35s" onclick="openMod('video','${plan.dest}')">
    <h4><span class="mi">🎬</span>打卡视频推荐 · 带 BGM<span class="go">查看详情 →</span></h4>
    <div class="vcards">${plan.videos.map((v,i)=>`<div class="vcard" onclick="event.stopPropagation();openVideo({t:'${v.t}',loc:'${v.loc}',imgs:['${v.imgs.join("','")}'],bgm:'${v.bgm}'})"><img src="${IMG(P[v.imgs[0]])}" loading="lazy"><span class="play"><i>▶</i></span><span class="vtag">♪ BGM</span><div class="vfoot"><h6>${v.t}</h6><p>📍 ${v.loc}</p></div></div>`).join('')}</div>
  </div>
  <div class="mod col-6 clickable" style="animation-delay:.45s" onclick="openMod('plog','${plan.dest}')">
    <h4><span class="mi">📷</span>Plog 推荐<span class="go">查看详情 →</span></h4>
    <div class="vcards">${plan.plogs.map(v=>`<div class="vcard" onclick="event.stopPropagation();openPlog('${v.t}','${plan.dest}','${v.img}','${encodeURIComponent(v.txt)}')"><img src="${IMG(P[v.img])}" loading="lazy"><div class="vfoot"><h6>${v.t}</h6><p>📍 ${plan.dest}</p></div></div>`).join('')}</div>
  </div>
  <div class="mod col-12" style="animation-delay:.55s;border-style:dashed"><h4><span class="mi">💡</span>AI 省钱贴士</h4><p style="font-size:12.5px;color:var(--ink-2)">${plan.tips}</p></div>`;
  grid.classList.add('show');
}
function openMod(kind,dest){
  const plan=matchPlan(dest)||PLANS['大理'];
  if(kind==='spots'){
    openModal(`<button class="mx" onclick="closeModal()">✕</button><div style="padding:24px"><h3 style="font-size:18px;font-weight:900;margin-bottom:4px">🏞 ${plan.dest} · 景点清单</h3><p style="font-size:12px;color:var(--muted);margin-bottom:14px">含名称、地址、坐标、建议时长与交通衔接，可直接用于地图标点</p>
    ${plan.spots.map(id=>{const s=spotById(id);return s?`<div class="spot-mini" style="margin-bottom:10px" onclick="closeModal();openSpot('${s.id}')"><img src="${IMG(P[s.id])}"><div><h5>${s.n}</h5><div class="city">🏠 ${s.addr}</div><div class="icon-chips"><span class="hl">🌐 ${s.lng.toFixed(3)}, ${s.lat.toFixed(3)}</span><span>⏱ ${s.hrs}</span><span>🚄 ${s.traf}</span><span>💰 ${s.price}</span></div></div></div>`:''}).join('')}</div>`,true);
  }else if(kind==='transport'){
    openModal(`<button class="mx" onclick="closeModal()">✕</button><div style="padding:24px"><h3 style="font-size:18px;font-weight:900;margin-bottom:12px">🚄 ${plan.dest} · 出行方式对比</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12.5px">${'<tr style="color:var(--muted);text-align:left"><th style="padding:7px 4px;border-bottom:1px solid var(--line)">方式</th><th style="padding:7px 4px;border-bottom:1px solid var(--line)">耗时</th><th style="padding:7px 4px;border-bottom:1px solid var(--line)">参考价</th><th style="padding:7px 4px;border-bottom:1px solid var(--line)">舒适度</th></tr>'}${plan.transport.map(t=>`<tr><td style="padding:9px 4px;border-bottom:1px dashed var(--line);font-weight:700">${t.m}</td><td style="padding:9px 4px;border-bottom:1px dashed var(--line)">${t.t}</td><td style="padding:9px 4px;border-bottom:1px dashed var(--line);color:var(--gold);font-weight:700">${t.p}</td><td style="padding:9px 4px;border-bottom:1px dashed var(--line)">${'★'.repeat(Math.round(t.s*5))}</td></tr>`).join('')}</table>
    <p style="font-size:12px;color:var(--muted);margin-top:12px">💡 数据来自 AI 对全网攻略的抓取分析（演示），价格随季节波动。</p></div>`);
  }else if(kind==='budget'){
    const dcs=['#e7c76d','#7ea6d9','#6cc47a','#e58fb1','#9a86d9'];let bg='';plan.budgetItems.forEach((b,i)=>bg+=`--dc${i+1}:${dcs[i]};`);
    openModal(`<button class="mx" onclick="closeModal()">✕</button><div style="padding:24px"><h3 style="font-size:18px;font-weight:900;margin-bottom:12px">💰 ${plan.dest} · 价格规划明细</h3>
    <div class="donut-row" style="${bg}"><div class="donut"><b>${fmt(plan.budget)}<i>总预算</i></b></div><div class="dlegend">${plan.budgetItems.map(b=>`<div class="li"><span><i style="background:var(${b.c})"></i>${b.k}</span><span>${fmt(b.v)}</span></div>`).join('')}</div></div>
    <p style="font-size:12px;color:var(--muted);margin-top:12px">💡 ${plan.tips}</p></div>`);
  }else if(kind==='video'){
    openVideo(plan.videos[0]);
  }else if(kind==='plog'){
    const v=plan.plogs[0];openPlog(v.t,plan.dest,v.img,encodeURIComponent(v.txt));
  }
}
/* ================= 打卡视频播放器（含 BGM） ================= */
let vTimer=null,vProgTimer=null,vFrame=0,vData=null;
function openVideo(d){
  vData=d;vFrame=0;
  openModal(`<button class="mx" onclick="closeModal()">✕</button>
  <div class="vplayer">
    <div class="vstage" id="vStage">${d.imgs.map(k=>`<img src="${IMG(P[k],'landscape_16_9')}">`).join('')}
      <div class="vtitle"><h4>${d.t}</h4><p>📍 ${d.loc} · AI 精选打卡视频</p></div></div>
    <div class="vctl">
      <button id="vPlay" title="播放/暂停">⏸</button>
      <div class="vprog"><i id="vProg"></i></div>
      <span class="vtime" id="vTime">0:00</span>
      <button id="vBgm" title="BGM 配乐">♪</button>
    </div>
    <div class="bgm-chips" id="vBgmChips"></div>
  </div>`,true);
  startVSlide();
  $('#vPlay').onclick=toggleVSlide;
  $('#vBgm').onclick=()=>{const on=toggleBgm(d.bgm||'fresh');$('#vBgm').classList.toggle('bgm-on',on);syncBgmChips(on?d.bgm||'fresh':null)};
  if(d.bgm)setTimeout(()=>{const on=toggleBgm(d.bgm);$('#vBgm').classList.toggle('bgm-on',on)},300);
  $('#vBgmChips').innerHTML=BGM_LIST.map(b=>`<button class="bgm-chip ${b[0]===(d.bgm||'fresh')?'on':''}" data-b="${b[0]}">${b[2]} ${b[1]}</button>`).join('');
  $$('#vBgmChips .bgm-chip').forEach(ch=>ch.onclick=()=>{const on=toggleBgm(ch.dataset.b);syncBgmChips(on?ch.dataset.b:null)});
}
function syncBgmChips(active){
  $$('#vBgmChips .bgm-chip').forEach(x=>x.classList.toggle('on',x.dataset.b===active));
  $('#vBgm').classList.toggle('bgm-on',!!active);
}
function startVSlide(){
  stopVSlide();showFrame(vFrame);
  vTimer=setInterval(()=>{vFrame=(vFrame+1)%vData.imgs.length;showFrame(vFrame)},3200);
  vProgTimer=setInterval(()=>{const imgs=$$('#vStage img');if(!imgs.length)return;const cur=Math.floor((Date.now()/3200)%vData.imgs.length);$('#vProg').style.width=((cur+vPct())/vData.imgs.length*100)+'%';
    $('#vTime').textContent='0:'+String(Math.floor((Date.now()/1000)%60)).padStart(2,'0')},180);
}
function vPct(){return (Date.now()%3200)/3200}
function showFrame(i){$$('#vStage img').forEach((im,j)=>im.classList.toggle('on',j===i))}
function toggleVSlide(){
  if(vTimer){clearInterval(vTimer);vTimer=null;$('#vPlay').textContent='▶'}
  else{$('#vPlay').textContent='⏸';vTimer=setInterval(()=>{vFrame=(vFrame+1)%vData.imgs.length;showFrame(vFrame)},3200)}
}
function stopVSlide(){clearInterval(vTimer);vTimer=null;clearInterval(vProgTimer);vProgTimer=null;stopBgm()}
function openPlog(t,loc,img,txtEnc){
  openModal(`<button class="mx" onclick="closeModal()">✕</button>
  <div><div class="dhero" style="height:250px"><img src="${IMG(P[img],'landscape_16_9')}"><div class="dc"><h3>📷 ${t}</h3><div class="meta"><span>📍 ${loc}</span><span>AI 精选 Plog</span></div></div></div>
  <div class="dbody"><p class="desc" style="font-style:italic">${decodeURIComponent(txtEnc)}</p>
  <div class="dbtns"><button class="btn line" onclick="closeModal();document.getElementById('checkin').scrollIntoView()">📸 我也要写 Plog</button><button class="btn gold" onclick="closeModal();document.getElementById('community').scrollIntoView()">看更多真实 Plog</button></div></div></div>`,true);
}
/* ================= BGM 引擎（WebAudio 合成） ================= */
const PRESET={
 fresh:{wave:'triangle',gain:.06,dur:.26,seq:[659.3,784,880,1046.5,880,784]},
 calm:{wave:'sine',gain:.07,dur:.5,seq:[261.6,329.6,392,523.3,392,329.6]},
 retro:{wave:'square',gain:.035,dur:.3,seq:[392,466.2,523.3,466.2,349.2,392]},
 city:{wave:'sine',gain:.055,dur:.24,seq:[523.3,587.3,659.3,587.3,523.3,392]},
 jazz:{wave:'triangle',gain:.05,dur:.34,seq:[392,415.3,466.2,392,349.2,311.1]},
 folk:{wave:'triangle',gain:.06,dur:.3,seq:[440,523.3,587.3,659.3,587.3,523.3]},
 lofi:{wave:'sine',gain:.045,dur:.42,seq:[261.6,311.1,349.2,311.1,293.7,261.6]},
 epic:{wave:'sawtooth',gain:.028,dur:.55,seq:[196,261.6,329.6,392,523.3,392]},
 elect:{wave:'square',gain:.03,dur:.2,seq:[440,554.4,659.3,880,659.3,554.4]}
};
const BGMI=n=>{const b=BGM_LIST.find(x=>x[0]===(n||'fresh'));return b?b[2]+' '+b[1]:'♪ BGM'};
let AC=null,bgmTimer=null,bgmName=null;
function note(f,wave,dur,gain){
  const o=AC.createOscillator(),g=AC.createGain();
  o.type=wave;o.frequency.value=f;o.connect(g);g.connect(AC.destination);
  const t=AC.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.start(t);o.stop(t+dur+.05);
}
function toggleBgm(name){
  if(bgmName===name){stopBgm();return false}
  stopBgm();AC=AC||new (window.AudioContext||window.webkitAudioContext)();
  if(AC.state==='suspended')AC.resume();
  const p=PRESET[name]||PRESET.fresh;bgmName=name;let i=0;
  (function tick(){if(bgmName!==name)return;const f=p.seq[i%p.seq.length];note(f,p.wave,p.dur*.92,p.gain);i++;bgmTimer=setTimeout(tick,p.dur*1000)})();
  toast('♪ BGM 播放中 · '+name);
  return true;
}
function stopBgm(){bgmName=null;clearTimeout(bgmTimer)}
/* ================= 社区动态 ================= */
let feedFilter='all',platFilter='all',heatSort='heat';
function renderFeed(){
  const mine=JSON.parse(localStorage.getItem('fmw_posts')||'[]');
  const all=[...mine,...POSTS];
  const list=all.filter(p=>(feedFilter==='all'?true:feedFilter==='video'||feedFilter==='plog'?p.type===feedFilter:p.rg===feedFilter)&&(platFilter==='all'?true:p.plat===platFilter));
  $('#feedGrid').innerHTML=list.map(p=>{
    const pl=PLAT[p.plat||'go'];
    const typeTag=p.type==='video'?'<span class="tagpill ab">🎬 打卡视频</span>':p.type==='plog'?'<span class="tagpill cn">📷 Plog</span>':'';
    const realTag=p.real?'<span class="tagpill real">真实攻略</span>':'';
    const chips=(p.topics||[]).map(t=>topicById(t)?`<span class="topic-chip" onclick="event.stopPropagation();openTopic('${t}')"># ${topicById(t).name}</span>`:'').join('');
    return `<div class="post" onclick="openPost('${p.id}')" style="cursor:pointer">
      <div class="pimg">
        <img src="${IMG(P[p.imgs[0]])}" loading="lazy">
        ${p.type==='video'?'<span class="vbadge"><i>▶</i></span><span class="moren">'+BGMI(p.bgm)+'</span>':''}
        ${p.type==='plog'?'<span class="moren">📷 Plog</span>':''}
        <span class="plat pb-${p.plat||'go'}" style="position:absolute;top:9px;right:9px">${pl.i} ${pl.n}</span>
      </div>
      <div class="pbody">
        <div class="pu"><span class="av" style="background:${p.c}">${p.u[0]}</span><div><h5>${p.u}</h5><p>${p.time} · 📍 ${p.loc}</p></div></div>
        <p class="ptxt">${p.txt}</p>
        <div class="tchips">${chips}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:9px;align-items:center">${typeTag}${realTag}<span class="more-link">查看全文 →</span></div>
        <div class="pfoot"><span class="act" onclick="event.stopPropagation();likePost(this,'${p.id}')">♡ <i style="font-style:normal" class="ln">${p.likes}</i></span><span>💬 ${p.cmts}</span><span style="margin-left:auto;font-size:10.5px">${pl.n}</span></div>
      </div></div>`}).join('')||'<div class="empty-tip">该平台暂无内容，试试其他平台筛选～</div>';
}
$$('#feedTabs button').forEach(b=>b.onclick=()=>{feedFilter=b.dataset.f;$$('#feedTabs button').forEach(x=>x.classList.toggle('on',x===b));renderFeed()});
$$('#platTabs button').forEach(b=>b.onclick=()=>{platFilter=b.dataset.p;$$('#platTabs button').forEach(x=>x.classList.toggle('on',x===b));renderFeed()});
function likePost(el,id){el.classList.toggle('liked');const n=el.querySelector('.ln');n.textContent=+n.textContent+(el.classList.contains('liked')?1:-1);el.firstChild.textContent=el.classList.contains('liked')?'♥ ':'♡ '}
/* ---- 精选 4K 摄影 ---- */
function renderFeatured(){
  $('#featStrip').innerHTML=FEATURED.map((f,i)=>`<div class="feat-card" onclick="openFeat(${i})"><img src="${IMG(P[f.img],'landscape_16_9')}" loading="lazy"><span class="plat pb-${f.plat}">${PLAT[f.plat].i} ${PLAT[f.plat].n}</span><span class="fourk">4K</span><div class="fc-info"><h5>${f.t}</h5><p>📍 ${f.loc} · 📷 ${f.by}</p></div></div>`).join('');
}
function openFeat(i){
  const f=FEATURED[i];if(!f)return;
  openModal(`<div class="fd-img big"><img src="${IMG(P[f.img],'landscape_16_9')}"><span class="fourk">4K ULTRA HD</span><span class="plat pb-${f.plat}" style="position:absolute;top:10px;right:44px">${PLAT[f.plat].i} ${PLAT[f.plat].n}</span></div>
    <div class="dbody"><h3 style="font-size:18px;font-weight:900">${f.t}</h3>
    <div class="fd-meta">📍 ${f.loc} · 📷 ${f.by}</div>
    <p class="fd-body">这张入选「精选 4K 摄影」的作品由 AI 图片引擎按 4K 超清规格渲染，完整保留了拍摄现场的光影与色彩层次。</p>
    <p class="src-note">🖼 声明：精选图片由 AI 引擎按 4K 规格重渲染生成，场景信息来自创作者真实打卡。</p></div>`);
}
/* ---- 话题热度榜 ---- */
function renderTopics(){
  const list=[...TOPICS].sort((a,b)=>heatSort==='heat'?b.heat-a.heat:b.up-a.up);
  $('#heatList').innerHTML=list.map((t,i)=>`<div class="heat-row" onclick="openTopic('${t.id}')">
    <span class="rk ${i<3?'top':''}">${i+1}</span>
    <div class="hi"><h5># ${t.name}</h5><p>${t.spots.length} 个关联目的地 · 点击查看人群适配图表</p><div class="hbar"><i style="width:${t.heat}%"></i></div></div>
    <div class="hn"><b>${t.heat}</b><span class="up">▲ 涨幅 ${t.up}%</span></div></div>`).join('');
}
$$('#community .sorter .mini').forEach(b=>b.onclick=()=>{heatSort=b.dataset.s;$$('#community .sorter .mini').forEach(x=>x.classList.toggle('on',x===b));renderTopics()});
function openTopic(tid){
  const t=topicById(tid);if(!t)return;
  const posts=POSTS.filter(p=>(p.topics||[]).includes(tid));
  const fitRows=Object.entries(t.fit).map(([k,v])=>`<div class="fitrow"><span>${k}</span><div class="fbar"><i data-w="${v}"></i></div><b>${v}</b></div>`).join('');
  const spotChips=t.spots.map(id=>{const s=spotById(id);return s?`<span class="topic-chip" onclick="closeModal();setTimeout(()=>openSpot('${id}'),200)">📍 ${s.n}</span>`:''}).join('');
  const postRows=posts.map(p=>`<div class="mini-post" onclick="openPost('${p.id}')"><img src="${IMG(P[p.imgs[0]])}"><div style="flex:1;min-width:0"><h5>${PLAT[p.plat||'go'].i} ${PLAT[p.plat||'go'].n} · ${p.u}</h5><p>${p.txt}</p></div><span class="more-link">查看 →</span></div>`).join('')||'<p class="fd-note">该话题暂无帖子，欢迎打卡补充～</p>';
  openModal(`<div class="dbody">
    <div class="topic-head"><div><div class="kick">TOPIC COMMUNITY · 话题社区</div><h3 style="font-size:18px;font-weight:900"># ${t.name}</h3><p style="color:var(--muted);font-size:12.5px;margin-top:4px">${t.desc}</p></div>
    <div class="hn big" style="text-align:right;flex:none"><b style="font-size:26px;font-weight:900;color:var(--gold)">${t.heat}</b><span class="up" style="display:block;font-size:10.5px;color:var(--ok)">▲ 涨幅 ${t.up}%</span></div></div>
    <h4 class="fd-sec">📊 人群适配度分析（适合哪种旅行方式）</h4>
    <div class="fitwrap">${fitRows}</div>
    <h4 class="fd-sec">🗺 话题目的地索引</h4><div class="chips">${spotChips}</div>
    <h4 class="fd-sec">💬 话题社区 · 精选帖子</h4>${postRows}
    <p class="src-note">📊 声明：热度指数与人群适配度由 AI 爬虫对全网社交平台（抖音 / 小红书 / 快手 / Instagram / YouTube 等）及本站真实打卡数据抓取、清洗后加权整理生成，仅供参考，不构成出行承诺。</p></div>`);
  setTimeout(()=>$$('#modalBox .fbar i').forEach(el=>el.style.width=el.dataset.w+'%'),80);
}
/* ---- 帖子详情 ---- */
function openPost(pid){
  const p=(JSON.parse(localStorage.getItem('fmw_posts')||'[]').find(x=>x.id===pid))||POSTS.find(x=>x.id===pid);if(!p)return;
  const pl=PLAT[p.plat||'go'];
  const chips=(p.topics||[]).map(t=>topicById(t)?`<span class="topic-chip" onclick="event.stopPropagation();openTopic('${t}')"># ${topicById(t).name}</span>`:'').join('');
  const gal=p.imgs.map(k=>`<img src="${IMG(P[k])}" onclick="openImgLightbox('${k}')">`).join('');
  const videoBtn=p.type==='video'?`<button class="btn gold" style="width:100%;margin:10px 0" onclick="openVideo({t:'${(p.txt||'').slice(0,16)}…',loc:'${p.loc}',imgs:['${p.imgs.join("','")}'],bgm:'${p.bgm||'fresh'}'})">▶ 播放打卡视频（${BGMI(p.bgm)}）</button>`:'';
  openModal(`<div class="fd-img big"><img src="${IMG(P[p.imgs[0]])}">${p.type==='video'?'<span class="vbadge"><i>▶</i></span>':''}<span class="plat pb-${p.plat||'go'}" style="position:absolute;top:10px;right:10px">${pl.i} ${pl.n}</span></div>
    <div class="dbody">
    <div class="pu"><span class="av" style="background:${p.c}">${p.u[0]}</span><div><h5>${p.u}</h5><p>${p.time} · 📍 ${p.loc}</p></div></div>
    <p class="fd-body">${p.txt}</p>
    ${p.full?`<p class="fd-more">📖 <b>正文 · 攻略细节</b><br>${p.full}</p>`:''}
    ${chips?`<div class="chips" style="margin:10px 2px">${chips}</div>`:''}
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">${p.type==='video'?'<span class="tagpill ab">🎬 打卡视频</span>':p.type==='plog'?'<span class="tagpill cn">📷 Plog</span>':''}${p.real?'<span class="tagpill real">真实攻略</span>':''}</div>
    ${videoBtn}
    <div class="fd-gal">${gal}</div>
    <div class="pfoot" style="border-top:1px solid var(--line);padding-top:11px"><span>♥ ${p.likes}</span><span>💬 ${p.cmts}</span><span>⭐ 收藏 ${Math.round(p.likes/2.6)}</span><span style="margin-left:auto;font-size:10.5px">${pl.n}</span></div>
    <p class="src-note">声明：内容来源为 ${pl.n} 创作者 / 站内真实打卡同步 · 正文含路线、花费与踩坑提示 · 图片由 AI 引擎按原场景重渲染，仅供参考。</p></div>`);
}
function openImgLightbox(k){
  const s=spotById(k);
  openModal(`<div class="fd-img big"><img src="${IMG(P[k],'landscape_16_9')}"><span class="fourk">4K ULTRA HD</span></div>
    <div class="dbody"><h3 style="font-size:16px;font-weight:900">${s?s.n:'旅行瞬间'}</h3><div class="fd-meta">${s?'📍 '+s.city+' · '+s.tag:'📷 现场花絮'}</div>
    ${s?`<p class="fd-body">${s.desc}</p><div class="dbtns"><button class="btn gold" onclick="closeModal();setTimeout(()=>openSpot('${s.id}'),200)">📍 查看景点攻略</button></div>`:''}</div>`,true);
}
/* ================= 打卡 · 纪念册 ================= */
let ckImgs=[],ckLock=false;
function initCk(){
  const sel=$('#ckDest');
  sel.innerHTML='<optgroup label="🇨🇳 国内">'+SPOTS.filter(s=>s.rg==='cn').map(s=>`<option value="${s.id}">${s.n} · ${s.city}</option>`).join('')+'</optgroup><optgroup label="🌍 国外">'+SPOTS.filter(s=>s.rg==='ab').map(s=>`<option value="${s.id}">${s.n} · ${s.city}</option>`).join('')+'</optgroup>';
  $('#ckDate').value=new Date().toISOString().slice(0,10);
  addCostRow();
  $('#addCost').onclick=addCostRow;
  $('#upZone').onclick=()=>$('#ckFiles').click();
  $('#ckFiles').onchange=e=>{[...e.target.files].forEach(f=>{
    if(f.type.startsWith('image/')){downscale(f,url=>{ckImgs.push({type:'img',url,name:f.name});renderPv()})}
    else if(f.type.startsWith('video/')){ckImgs.push({type:'video',url:URL.createObjectURL(f),name:f.name});renderPv()}
    else toast('仅支持图片/视频文件');
  });e.target.value=''};
  $$('#moods button').forEach(b=>b.onclick=()=>{$$('#moods button').forEach(x=>x.classList.toggle('on',x===b))});
  $('#ckForm').onsubmit=submitCk;
}
function addCostRow(){
  const d=document.createElement('div');d.className='cost-row';
  d.innerHTML=`<select><option>🚄 交通</option><option>🏨 住宿</option><option>🍜 餐饮</option><option>🎫 门票</option><option>🛍 其他</option></select><input type="number" min="0" placeholder="金额 ¥" oninput="sumCost()"><button type="button" class="del" onclick="this.parentNode.remove();sumCost()">✕</button>`;
  $('#costRows').appendChild(d);
}
function sumCost(){let t=0;$$('#costRows input').forEach(i=>t+=+i.value||0);$('#costSum').textContent='¥ '+t.toLocaleString('zh-CN');return t}
function downscale(file,cb){
  const r=new FileReader();r.onload=e=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');const w=Math.min(760,im.width);c.width=w;c.height=im.height*w/im.width;c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.72))};im.src=e.target.result};r.readAsDataURL(file);
}
function renderPv(){
  $('#upPreviews').innerHTML=ckImgs.map((it,i)=>`<div class="pv">${it.type==='img'?`<img src="${it.url}">`:`<video src="${it.url}" muted></video><span class="vtag">视频</span>`}<span class="x" onclick="ckImgs.splice(${i},1);renderPv()">✕</span></div>`).join('');
}
function submitCk(e){
  e.preventDefault();
  if(ckLock)return;ckLock=true;setTimeout(()=>ckLock=false,1500);
  if(!user){openAuth();toast('登录后即可打卡并同步纪念册 ✨');return}
  const spot=spotById($('#ckDest').value);if(!spot)return toast('请选择目的地');
  const text=$('#ckText').value.trim()||'这一站没有留下太多文字，但照片都记得。';
  const mood=$('#moods button.on')?$('#moods button.on').textContent:'😌 治愈放松';
  const bgm=$('#ckBgm').value;
  const costs=[];$$('#costRows .cost-row').forEach(r=>{const k=r.querySelector('select').value,v=+r.querySelector('input').value||0;if(v)costs.push({k,v})});
  const total=costs.reduce((a,b)=>a+b.v,0);
  const rec={id:'ck'+Date.now(),dest:spot.n,city:spot.city,date:$('#ckDate').value,text,mood,bgm,costs,total,
    imgs:ckImgs.filter(i=>i.type==='img').map(i=>i.url).slice(0,4),hasVideo:ckImgs.some(i=>i.type==='video')};
  const albums=JSON.parse(localStorage.getItem('fmw_albums')||'[]');albums.unshift(rec);localStorage.setItem('fmw_albums',JSON.stringify(albums));
  const posts=JSON.parse(localStorage.getItem('fmw_posts')||'[]');
  posts.unshift({id:rec.id,u:user.nick,c:'#c98a2e',loc:spot.city+' · '+spot.n,rg:spot.rg,type:rec.hasVideo?'video':'img',time:'刚刚',txt:rec.text+'（'+mood+'）',likes:0,cmts:0,imgs:[spot.id],bgm:bgm==='none'?null:bgm});
  localStorage.setItem('fmw_posts',JSON.stringify(posts));
  renderFeed();renderAlbums();refreshMe();
  ckImgs=[];renderPv();$('#ckText').value='';$('#costRows').innerHTML='';addCostRow();sumCost();
  openAlbum(rec);
  toast('打卡成功，纪念册已生成，并同步到社区成为真实攻略 ✅','ok');
}
function renderAlbums(){
  const albums=JSON.parse(localStorage.getItem('fmw_albums')||'[]');
  $('#albumsGrid').innerHTML=albums.length?albums.map(a=>`<div class="album-card" onclick='openAlbum(${JSON.stringify(a).replace(/'/g,"")})'>
    <span class="tape"></span>
    <img src="${a.imgs[0]||IMG(P.gugong)}">
    <div class="ab"><h5>${a.dest}</h5><p>${a.date} · ${a.city}</p><div class="am"><span>💰 <b>${fmt(a.total)}</b></span><span>${a.mood}</span></div></div></div>`).join('')
  :'<div class="empty-tip">还没有纪念册 · 提交一次打卡就会自动生成第一页 ✨</div>';
}
function openAlbum(a){
  const costsHtml=a.costs.map(c=>`<div class="li"><span>${c.k}</span><span>${fmt(c.v)}</span></div>`).join('');
  const photos=(a.imgs.length?a.imgs:[IMG(P.gugong),IMG(P.erhai)]).slice(0,4);
  openModal(`<div class="album-modal">
    <div class="album-inner"><span class="tape"></span>
      <div class="album-cover"><img src="${a.imgs[0]||IMG(P.gugong,'landscape_16_9')}"><div class="cap">🪄 ${a.dest} · ${a.date} · ${a.city}</div></div>
      <div class="album-route"><span>🏠 家</span><span class="fly">✈️ - - - - -</span><span>📍 ${a.dest}</span><span class="fly">- - - - ✈️</span><span>🏠 带着故事回家</span></div>
      <div class="album-quote">“${a.text}” —— ${a.mood}</div>
      <div class="album-photos">${photos.map(u=>`<img src="${u}">`).join('')}</div>
      <div class="album-stats"><span>💰 实际花费 <b>${fmt(a.total)}</b></span>${a.costs.map(c=>`<span>${c.k} <b>${fmt(c.v)}</b></span>`).join('')}${a.hasVideo?'<span>🎬 含打卡视频</span>':''}${a.bgm&&a.bgm!=='none'?`<span class="bgm-btn" style="cursor:pointer" onclick="toggleBgm('${a.bgm}')">♪ 播放纪念册 BGM</span>`:''}</div>
      <div class="album-sync">✔ 已同步到社区动态，成为其他旅行者的真实攻略</div>
      <div class="dbtns"><button class="btn line" onclick="closeModal()">收起纪念册</button><button class="btn gold" onclick="closeModal();document.getElementById('community').scrollIntoView()">去社区看看</button></div>
    </div></div>`);
}
/* ================= 我的 ================= */
function refreshMe(){
  const albums=JSON.parse(localStorage.getItem('fmw_albums')||'[]');
  const total=albums.reduce((a,b)=>a+b.total,0);
  const cities=new Set(albums.map(a=>a.city));
  $('#msCk').textContent=albums.length;$('#msCost').textContent='¥'+total.toLocaleString('zh-CN');$('#msCity').textContent=cities.size;
  $('#myCkList').innerHTML=albums.length?albums.map(a=>`<div class="mycheck" style="cursor:pointer" onclick='openAlbum(${JSON.stringify(a).replace(/'/g,"")})'><span class="d">${a.date.slice(5).replace('-','/')}<br>${a.city.slice(0,3)}</span><div><b>${a.dest}</b><p>${a.text}</p></div><span class="cost">${fmt(a.total)}</span></div>`).join('')
  :'<div class="empty-tip" style="padding:18px">暂无打卡记录 · 去「打卡·纪念册」创建第一条 ✨</div>';
}
$('#meCkBtn').onclick=()=>$('#checkin').scrollIntoView();
/* ================= 导航高亮 ================= */
const secs=['home','novel','prince','map','ai','community','checkin','memories','workbench'];
window.addEventListener('scroll',()=>{
  let cur='home';secs.forEach(id=>{const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<120)cur=id});
  $$('#navLinks a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+cur));
},{passive:true});
/* ================= 旅行工作台 ================= */
$$('#wbTabs button').forEach(b=>b.onclick=()=>{
  $$('#wbTabs button').forEach(x=>x.classList.toggle('on',x===b));
  $('#wbJournal').style.display=b.dataset.w==='journal'?'':'none';
  $('#wbCollab').style.display=b.dataset.w==='collab'?'':'none';
  $('#wbShops').style.display=b.dataset.w==='shops'?'':'none';
});
/* ---- 手账工坊：目的地配色自动推荐 + 手绘风格 + 卡片输出 ---- */
function jnHue(name){let h=0;for(let i=0;i<name.length;i++)h=(h*31+name.charCodeAt(i))>>>0;return h%360}
function jnPal(spot){const h=jnHue(spot.city||spot.n);return{main:`hsl(${h},48%,46%)`,deep:`hsl(${h},50%,26%)`,bg:`hsl(${h},34%,93%)`}}
const JSTYLES={draw:{n:'手绘线稿',bd:'2px dashed',r:'14px',f:'"Kaiti SC","楷体",serif'},water:{n:'水彩晕染',bd:'0',r:'24px',f:'"Yuanti SC","幼圆","Microsoft YaHei",serif'},film:{n:'复古胶片',bd:'3px double',r:'8px',f:'Georgia,serif'}};
let jnMode='ai';
function jnDays(spot){return[
 {t:'抵达 '+spot.city,d:'初见 '+spot.n+'，'+spot.desc+' 傍晚沿街慢行，尝一份本地人推荐的小吃，把旅行的第一页留给惊喜。'},
 {t:spot.n+' 全日深度',d:'上午直奔 '+spot.tag+' 主题游览；'+spot.traffic+'；黄昏时分光线最柔，记得占好机位拍下属于你的那一帧。'},
 {t:'返程与手信',d:'睡到自然醒，带走 '+spot.city+' 的限定文创与味觉记忆，把这一页留给下一次重逢的理由。'}]}
function jnRender(mode){
  jnMode=mode;
  const spot=spotById($('#jnSpot').value)||SPOTS[0],st=JSTYLES[$('#jnStyle').value],pal=jnPal(spot);
  const sty=`--p:${pal.main};--pd:${pal.deep};--pb:${pal.bg};border:${st.bd} var(--pd);border-radius:${st.r};font-family:${st.f}`;
  const head=`<div class="jn-card jn-head" contenteditable="true" style="${sty}">
    <div class="jn-kick">${mode==='ai'?'🤖 AI 生成':'📷 自由创作'} · ${st.n}风 · 配色取自「${spot.city}」</div>
    <h3>${spot.city} 手账 · ${spot.n}</h3>
    <p>📍 ${spot.city} · ${spot.tag}<br>⏱ 建议游玩 ${spot.dur}<br>🚏 ${spot.traffic}</p>
    <div class="jn-stamp">WANDERGO TRAVEL JOURNAL · ${new Date().toLocaleDateString('zh-CN')}</div></div>`;
  const dayCards=jnDays(spot).map((d,i)=>`<div class="jn-card" contenteditable="true" style="${sty}">
    <span class="jn-day">DAY ${i+1}</span><h4>${d.t}</h4>
    <img src="${IMG(P[spot.id],'landscape_16_9')}" alt="${spot.n}"><p>${d.d}</p>
    <div class="jn-foot">✍️ 点击文字即可修改 · ${st.n}风</div></div>`).join('');
  $('#jnCards').innerHTML=head+dayCards+`<div class="jn-actions"><button class="btn gold" onclick="jnExport()">🖼 导出手账图片</button><button class="btn line" onclick="toggleBgm('calm');toast('♪ 手账 BGM · 宁静夜航')">♪ 手账 BGM</button></div>`;
}
$('#jnSpot').innerHTML=SPOTS.map(s=>`<option value="${s.id}">${s.n} · ${s.city}</option>`).join('');
$('#jnGen').onclick=()=>{jnRender('ai');toast('🤖 手账已生成 · 配色按「'+($('#jnSpot').selectedOptions[0].text.split(' · ')[1]||'目的地')+'」自动推荐')};
$('#jnFree').onclick=()=>{jnRender('free');toast('📷 自由创作模式 · 散落的照片与心得填进来')};
$('#jnStyle').onchange=$('#jnSpot').onchange=()=>{if($('#jnCards .jn-card'))jnRender(jnMode)};
function jnExport(){
  const spot=spotById($('#jnSpot').value)||SPOTS[0],pal=jnPal(spot);
  const cv=document.createElement('canvas');cv.width=1080;cv.height=1440;const g=cv.getContext('2d');
  const grd=g.createLinearGradient(0,0,0,1440);grd.addColorStop(0,pal.bg);grd.addColorStop(1,pal.main);g.fillStyle=grd;g.fillRect(0,0,1080,1440);
  g.strokeStyle=pal.deep;g.lineWidth=6;g.strokeRect(40,40,1000,1360);
  g.fillStyle=pal.deep;g.font='900 82px "Microsoft YaHei",sans-serif';g.fillText(spot.city+' 手账',80,190);
  g.font='36px "Microsoft YaHei",sans-serif';g.fillStyle='#fff';g.fillText('📍 '+spot.n+' · '+spot.tag,80,260);
  const img=new Image();img.crossOrigin='anonymous';
  const finish=()=>{try{const a=document.createElement('a');a.download='wandergo-'+spot.city+'-手账.png';a.href=cv.toDataURL('image/png');a.click();toast('🖼 手账图片已导出')}
    catch(e){g.fillStyle='rgba(255,255,255,.9)';g.fillRect(80,330,920,500);g.fillStyle=pal.deep;g.font='30px sans-serif';g.fillText('✈️ '+spot.n,110,560);g.font='24px sans-serif';g.fillText('（图片跨域受限，已用纯排版导出）',110,610);
      const a=document.createElement('a');a.download='wandergo-'+spot.city+'-手账.png';a.href=cv.toDataURL('image/png');a.click();toast('🖼 已导出（纯排版模式）')}};
  img.onload=()=>{g.drawImage(img,80,330,920,500);
    g.fillStyle='#fff';g.font='32px "Microsoft YaHei",sans-serif';
    jnDays(spot).forEach((d,i)=>g.fillText('DAY '+(i+1)+' · '+d.t,80,920+i*88));
    g.font='24px sans-serif';g.fillText('WANDERGO TRAVEL JOURNAL · '+new Date().toLocaleDateString('zh-CN'),80,1340);finish()};
  img.onerror=finish;img.src=IMG(P[spot.id],'landscape_16_9');
}
/* ---- 协同计划：机酒识别 / 记账分摊 / 共建笔记 / 投票 ---- */
let CT=JSON.parse(localStorage.getItem('fmw_ct')||'[]'),
    EX=JSON.parse(localStorage.getItem('fmw_ex')||'[]'),
    VT=JSON.parse(localStorage.getItem('fmw_vt')||'null')||[
      {id:'v1',q:'Day2 去卢浮宫还是奥赛美术馆？',a:3,b:1},{id:'v2',q:'住民宿还是连锁酒店？',a:2,b:2}];
const MEMS=[['小王',7],['阿澄',12],['Vera',19],['老周',38]];
$('#wbMems').innerHTML=MEMS.map(m=>`<span class="wb-mem" title="${m[0]}" style="background:hsl(${m[1]},50%,45%)">${m[0][0]}</span>`).join('');
function ctClass(t){return /机场|航班|MU|CA|CZ|HU|[A-Z]{2}\d{3,4}|→/.test(t)?['✈️ 机票','fly']:/酒店|民宿|Hotel|住宿|\d晚/.test(t)?['🏨 住宿','stay']:/高铁|火车|G\d+|D\d+/.test(t)?['🚄 交通','rail']:['📅 日程','plan']}
function renderCT(){
  $('#ctList').innerHTML=CT.map((t,i)=>`<div class="ct-item"><span class="ct-tag ${t.c}">${t.e}</span><span class="ct-tx" contenteditable="true">${t.t}</span><button class="ct-del" onclick="ctDel(${i})">✕</button></div>`).join('')||'<div class="empty-tip">暂无条目 · 粘贴机酒信息试试（多人共建，条目全员可改）</div>';
}
$('#ctParse').onclick=()=>{
  const lines=$('#ctInput').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(!lines.length)return toast('先粘贴机酒信息，每行一条');
  lines.forEach(t=>{const[e,c]=ctClass(t);CT.push({t,e,c})});
  $('#ctInput').value='';localStorage.setItem('fmw_ct',JSON.stringify(CT));renderCT();
  toast('🧾 已识别 '+lines.length+' 条 · 已同步给 4 位同行人');
};
function ctDel(i){CT.splice(i,1);localStorage.setItem('fmw_ct',JSON.stringify(CT));renderCT()}
function renderEX(){
  const sum=EX.reduce((a,b)=>a+b.a,0);
  $('#exList').innerHTML=EX.map((x,i)=>`<div class="ct-item"><span style="flex:1">${x.n}</span><b style="color:var(--gold)">¥${x.a}</b><button class="ct-del" onclick="exDel(${i})">✕</button></div>`).join('')||'<div class="empty-tip">还没有记账</div>';
  $('#exTotal').innerHTML=sum?`本单合计 <b>¥${sum}</b> · ${MEMS.length} 人协同，人均 <b>¥${Math.round(sum/MEMS.length)}</b>`:'';
}
$('#exAdd').onclick=()=>{
  const n=$('#exName').value.trim(),a=+$('#exAmt').value;
  if(!n||!a)return toast('填写名目和金额');
  EX.push({n,a});$('#exName').value='';$('#exAmt').value='';
  localStorage.setItem('fmw_ex',JSON.stringify(EX));renderEX();toast('💰 已记账 · 自动人均分摊');
};
function exDel(i){EX.splice(i,1);localStorage.setItem('fmw_ex',JSON.stringify(EX));renderEX()}
function renderVT(){
  $('#vtList').innerHTML=VT.map(v=>{const tot=v.a+v.b||1;return `<div class="vt-item"><p>${v.q}</p>
    <div class="vt-bars"><div class="vt-bar"><i style="width:${v.a/tot*100}%"></i><span>👍 赞成 ${v.a}</span></div>
    <div class="vt-bar alt"><i style="width:${v.b/tot*100}%"></i><span>👎 反对 ${v.b}</span></div></div>
    <div class="vt-btns"><button onclick="vtVote('${v.id}',1)">投赞成</button><button onclick="vtVote('${v.id}',-1)">投反对</button></div></div>`}).join('');
}
function vtVote(id,d){const v=VT.find(x=>x.id===id);if(!v)return;d>0?v.a++:v.b++;
  localStorage.setItem('fmw_vt',JSON.stringify(VT));renderVT();toast(d>0?'👍 已投赞成票':'👎 已投反对票')}
$('#vtAdd').onclick=()=>{const q=$('#vtInput').value.trim();if(!q)return toast('填写提案内容');
  VT.push({id:'v'+Date.now(),q,a:0,b:0});$('#vtInput').value='';
  localStorage.setItem('fmw_vt',JSON.stringify(VT));renderVT();toast('🗳 投票已发起 · 已通知同行人')};
/* ---- 文创素材库 ---- */
const SHOP_CITY=[...new Set(SHOPS.map(s=>s.city))];let shopCity='all';
function renderShops(){
  $('#shopTabs').innerHTML=['all',...SHOP_CITY].map(c=>`<button class="${c===shopCity?'on':''}" data-c="${c}">${c==='all'?'🌐 全部':c}</button>`).join('');
  $$('#shopTabs button').forEach(b=>b.onclick=()=>{shopCity=b.dataset.c;renderShops()});
  $('#shopGrid').innerHTML=SHOPS.filter(s=>shopCity==='all'||s.city===shopCity).map(s=>{
    const sp=spotById(s.near);
    return `<div class="shop-card"><div class="shop-top"><h4>${s.name}</h4><span class="shop-type">${s.type}</span></div>
    <p class="shop-row">📍 ${s.addr}</p><p class="shop-row">🕐 ${s.hours}</p>
    <p class="shop-feat">${s.feat}</p>
    ${sp?`<button class="shop-near" onclick="openSpot('${sp.id}')">🧭 顺路 · ${sp.n}（点击看景点攻略）</button>`:''}</div>`}).join('')||'<div class="empty-tip">该城市暂无收录</div>';
}
renderCT();renderEX();renderVT();renderShops();
/* ================= 全站搜索 ================= */
const POST_TYPE={video:'🎬 视频/Vlog',vlog:'🎬 Vlog',plog:'📷 Plog',post:'📝 图文'};
const PT_Q={video:'视频 vlog video',vlog:'vlog',plog:'plog 图文',post:'图文'};
const PLAT_LBL={dy:'🎵抖音',xhs:'📕小红书',ks:'⚡快手',ins:'📸Instagram',yt:'▶️YouTube',go:'🧭站内'};
function hl(text,q){const i=text.toLowerCase().indexOf(q.toLowerCase());return i<0?text:text.slice(0,i)+'<mark>'+text.slice(i,i+q.length)+'</mark>'+text.slice(i+q.length)}
function searchBooks(q){
  const out=[];
  $$('#novel .spot-mini,#prince .spot-mini').forEach(el=>{
    const m=el.getAttribute('onclick').match(/openSpot\('([^']+)'\)/);if(!m)return;
    const t=el.querySelector('h5').textContent,sub=el.querySelector('.city').textContent;
    if((t+' '+sub).toLowerCase().includes(q))out.push({id:m[1],t,sub});
  });
  return out;
}
function doSearch(raw){
  const q=(raw||'').trim().toLowerCase();
  const R=$('#srResults');
  if(!q){R.innerHTML='<div class="sr-empty">输入关键词，或点上方快捷标签开始探索 ✈️<br><span>试试：「洱海」「巴黎」「vlog」「悲惨世界」「极光」</span></div>';return}
  const groups=[];
  /* 社区动态：视频 / Vlog / Plog / 图文 */
  const posts=POSTS.filter(p=>((p.txt||'')+' '+(p.loc||'')+' '+(p.u||'')+' '+(PT_Q[p.type]||'图文')).toLowerCase().includes(q)).slice(0,6);
  if(posts.length)groups.push({icon:'💬',name:'社区动态 · 视频 / Vlog / Plog / 图文',items:posts.map(p=>({icon:POST_TYPE[p.type||'post'],t:hl((p.txt||p.loc||'').slice(0,34),q),sub:`${PLAT_LBL[p.plat||'go']} · ${p.u} · 📍${p.loc||'未知'}`,run:()=>openPost(p.id)}))});
  /* 书籍与文学地点 */
  const books=searchBooks(q).slice(0,5);
  if(books.length)groups.push({icon:'📖',name:'书籍与文学地点',items:books.map(b=>({icon:'📖',t:hl(b.t,q),sub:b.sub,run:()=>openSpot(b.id)}))});
  /* 景点 */
  const spots=SPOTS.filter(s=>((s.n||'')+' '+(s.city||'')+' '+(s.tag||'')+' '+(s.desc||'')).toLowerCase().includes(q)).slice(0,6);
  if(spots.length)groups.push({icon:'📍',name:'景点 · 攻略与坐标',items:spots.map(s=>({icon:s.tag?s.tag.split(' ')[0]:'📍',t:hl(s.n+' · '+s.city,q),sub:`${s.tag} · ⭐${s.rating}`,run:()=>openSpot(s.id)}))});
  /* 话题 */
  const tops=TOPICS.filter(t=>((t.name||'')+' '+(t.desc||'')).toLowerCase().includes(q)).slice(0,4);
  if(tops.length)groups.push({icon:'#',name:'话题社区',items:tops.map(t=>({icon:'🔥',t:hl('#'+t.name,q),sub:(t.desc||'').slice(0,30),run:()=>openTopic(t.id)}))});
  /* 文创店铺 */
  const shops=SHOPS.filter(s=>((s.name||'')+' '+(s.city||'')+' '+(s.type||'')+' '+(s.feat||'')).toLowerCase().includes(q)).slice(0,5);
  if(shops.length)groups.push({icon:'🎨',name:'小众文创店铺',items:shops.map(s=>({icon:'☕',t:hl(s.name,q),sub:`${s.city} · ${s.type} · ${s.hours}`,run:()=>{document.querySelector('#wbTabs [data-w="shops"]').click();$('#workbench').scrollIntoView();openSpot(s.near)}}))});
  /* AI 行程方案 */
  const plans=Object.keys(PLANS).filter(k=>k.toLowerCase().includes(q)).slice(0,4);
  if(plans.length)groups.push({icon:'🤖',name:'AI 行程方案',items:plans.map(k=>({icon:'🧭',t:hl(PLANS[k].dest||k,q),sub:PLANS[k].days||'点击让 AI 生成',run:()=>askAI(k)}))});
  if(!groups.length){R.innerHTML=`<div class="sr-empty">没有找到与「${raw}」相关的内容 😢<br><span>换个词试试，或去社区发布第一条笔记</span></div>`;return}
  R.innerHTML=groups.map(g=>`<div class="sr-group"><div class="sr-gtitle">${g.icon} ${g.name}</div>${g.items.map((it,i)=>`<button class="sr-item" data-g="${g.name}" data-i="${i}"><span class="sr-ic">${it.icon}</span><span class="sr-main"><b>${it.t}</b><i>${it.sub||''}</i></span><span class="sr-go">↵</span></button>`).join('')}</div>`).join('');
  $$('.sr-item').forEach(btn=>btn.onclick=()=>{
    const g=groups.find(x=>x.name===btn.dataset.g),it=g.items[+btn.dataset.i];
    closeSearch();setTimeout(it.run,120);
  });
}
function openSearch(){$('#searchOv').classList.add('show');$('#searchInput').value='';doSearch('');setTimeout(()=>$('#searchInput').focus(),60)}
function closeSearch(){$('#searchOv').classList.remove('show')}
$('#searchOpen').onclick=openSearch;
$('#searchClose').onclick=closeSearch;
$('#searchOv').onclick=e=>{if(e.target.id==='searchOv')closeSearch()};
$('#searchInput').oninput=e=>doSearch(e.target.value);
$$('#srQuick button').forEach(b=>b.onclick=()=>{$('#searchInput').value=b.dataset.q;doSearch(b.dataset.q)});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch()}
  else if(e.key==='/'&&!/input|textarea|select/i.test(document.activeElement.tagName)){e.preventDefault();openSearch()}
  else if(e.key==='Escape'){closeSearch()}
});
/* ================= 初始化 ================= */
document.addEventListener('DOMContentLoaded',()=>{
  // 图片注入
  $$('[data-img]').forEach(el=>el.src=IMG(P[el.dataset.img],el.dataset.size||'landscape_4_3'));
  refreshUser();initCk();renderFeed();renderFeatured();renderTopics();renderAlbums();refreshMe();
  // 地图
  const charts=[['#chinaMap','cn'],['#worldMap','world']];
  loadECharts(ok=>{
    if(!ok){mapFallback();return}
    try{renderMap('cn')}catch(e){console.warn(e)}
    try{renderMap('world')}catch(e){console.warn(e)}
    if(!window.echarts||(!CHARTS.cn&&!CHARTS.world))mapFallback();
  });
});
