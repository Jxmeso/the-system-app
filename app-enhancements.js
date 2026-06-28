/* ============================================================
   The System v5 — app-enhancements.js
   Drop-in overlay for index.html.
   Replaces window.onload, nav, login screen and ALL tab renders.
   ============================================================ */

/* ── Version gate: forces one clean navigation when new build detected ── */
(function(){
  var BUILD='v5-20260628-05';
  try{
    if(localStorage.getItem('_sys_build')!==BUILD){
      try{localStorage.setItem('_sys_build',BUILD);}catch(_){}
      location.replace(location.href.replace(/[?#].*$/,''));
    }
  }catch(_){}
  /* execution always continues — window.onload=enhancedInitialize is set below */
})();

/* ── Constants ── */
const SYSTEM_BADGES = [
  {id:'first-contact',name:'First Contact',icon:'fa-handshake',goal:'First successful connection.'},
  {id:'steady-service',name:'Steady Service',icon:'fa-list-check',goal:'Complete five assigned tasks.'},
  {id:'inner-world',name:'Inner World',icon:'fa-feather',goal:'Write three journal entries.'},
  {id:'accountable',name:'Accountable',icon:'fa-shield-heart',goal:'Complete your first consequence.'},
  {id:'gold-standard',name:'Gold Standard',icon:'fa-crown',goal:'Earn twenty-five stars.'}
];
const RULE_SECTIONS = [
  ['arrivalProcedure','Arrival Procedure','A'],
  ['houseRules','House Rules','H'],
  ['protocols','Protocols','P'],
  ['consequences','Consequences','C'],
  ['communication','Communication','M'],
  ['outOfSession','Out Of Session','O']
];
const LIMIT_GROUPS = [
  ['hard','Hard Limits','H'],
  ['supplements','Soft Limits','S'],
  ['tries','Willing To Try','T'],
  ['likes','Likes','L'],
  ['loves','Loves','V']
];
const NAV_ITEMS = [
  ['dashboard','Home','fa-house'],
  ['tasks','Tasks','fa-square-check'],
  ['protocols','Protocols','fa-section'],
  ['journal','Journal','fa-book-open'],
  ['stars','Rewards','fa-star']
];
const DEFAULT_PHOTO = 'https://i.pravatar.cc/320?img=12';

/* ── State: do NOT redeclare `state` — index.html's inline script already
   declares `let state`. Both classic scripts share the same global lexical
   environment, so we reference and assign that SAME binding here. Declaring
   it again (var/let) throws "Identifier 'state' has already been declared"
   and kills this entire file. ── */
var countdownTimer = null;
var activeProtocolPanel = 'rules';
var activeNotificationsFilter = 'all';

/* ── Utilities ── */
function titleCase(v){ return String(v||'').trim().toLowerCase().replace(/\b([a-z])/g,l=>l.toUpperCase()); }
function escapeText(v){ const d=document.createElement('div'); d.textContent=v==null?'':String(v); return d.innerHTML; }
function ensureArray(v){ return Array.isArray(v)?v:[]; }
function safeJson(v){ try{return JSON.stringify(v,null,2);}catch(_){return '{}';} }

function showToast(msg,type='info'){
  const t=document.createElement('div');
  t.className=`fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium ${type==='error'?'bg-red-900 text-white':type==='success'?'bg-emerald-900 text-white':'bg-[#222] text-[var(--ivory)]'}`;
  t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),3000);
}

/* ── Sync: pull fresh state from localStorage before each render ── */
function _syncState(){
  if(!state) return;
  const s=localStorage.getItem('the_system_v4');
  if(s){ try{ const p=JSON.parse(s); state={...state,...p}; }catch(_){} }
}

/* ── Default data ── */
function defaultSystemState(role){
  role=role||'dom';
  const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
  return {
    dynamicName:'The System',domTitle:'Sir',subTitle:'James',currentRole:role,avatar:DEFAULT_PHOTO,
    stars:8,starLog:[{id:1,date:new Date().toISOString(),reason:'Initial system setup',amount:8}],
    tasks:[{id:101,title:'Morning Meditation + Gratitude',desc:"10 minutes + write 3 things you're grateful for",due:tomorrow,dueAt:tomorrow+'T23:59:00',status:'pending',priority:2,requiredEvidence:['text'],assignedAt:new Date().toISOString(),evidence:[]}],
    punishments:[{id:201,title:'TikTok Ban',desc:'Restricted app access until the timer completes.',kind:'timed',due:tomorrow,dueAt:tomorrow+'T23:59:00',status:'active',assignedAt:new Date().toISOString()}],
    journal:[],evidence:[],activityLog:[{id:1,type:'dom',message:'Welcome to The System. Your first task is waiting.',time:'now'}],
    limits:{hard:['Chems'],supplements:['Public protocol'],tries:['Timed focus'],likes:['Praise','Clear instructions'],loves:['Calm voice','Aftercare']},
    rules:{
      arrivalProcedure:'1. Text when 10 minutes away.\n2. Remove shoes at the door.\n3. Wait in the entryway until greeted.\n4. Offer collar.',
      houseRules:'1. Always address me as Sir.\n2. Daily good morning and good night messages required.\n3. Permission rules apply during protocol time.',
      protocols:'1. Tasks must be acknowledged.\n2. Evidence must be submitted when requested.\n3. Reviews are handled by Sir.',
      consequences:'1. Minor: extra tasks or written reflection.\n2. Moderate: temporary loss of privilege.\n3. Severe: review and reset.',
      communication:'1. Speak clearly.\n2. Ask when unsure.\n3. Log meaningful changes.',
      outOfSession:'1. Boundaries remain active.\n2. Check-ins remain private.\n3. No public assumptions.'
    },
    notifications:[],disclosures:[],checkIns:[],badges:[],dataVersion:5,
    subProfile:defaultSubProfile(),bodyMaps:defaultBodyMaps(),personalRecords:defaultPersonalRecords(),appSettings:{reduceMotion:false}
  };
}
function defaultSubProfile(){
  return {
    photo:DEFAULT_PHOTO,name:'James',role:'Submissive',dominant:'Sir',notes:'Visible to sub. Editable by Dom only.',
    measurements:{height:'6 ft 2',weight:'12 st 4 lb',neck:'15.5 in',chest:'39 in',bicepL:'12.5 in',bicepR:'12.6 in',waist:'30 in',hips:'36 in',insideLeg:'34 in'},
    anatomy:{softLength:'',hardLength:'',softGirth:'',hardGirth:'',testicularCircumference:''}
  };
}
function defaultBodyMaps(){
  return {
    ticklish:[{view:'front',x:39,y:34},{view:'front',x:25,y:54},{view:'back',x:50,y:58}],
    sensitive:[{view:'front',x:50,y:33},{view:'front',x:50,y:62},{view:'back',x:50,y:46}]
  };
}
function defaultPersonalRecords(){
  const el=['Left Nipple','Right Nipple','Upper Abdomen','Mid Abdomen','Lower Abdomen','Inner Thigh','Genital Area','Anal S','Anal M','Anal L','Urethral Sound','Loops','Violet Wand'];
  return {
    breath:{longestHold:'',rebreathe3L:'',rebreathe5L:'',rebreathe6L:'',bubbleBottleLarge:'',bubbleBottleSmall:'',resistanceMaximum:''},
    electro:Object.fromEntries(el.map((label,i)=>[label,{min:8+i,max:65+i,pleasureStart:22+i,pleasureEnd:46+i}]))
  };
}
function migrateEnhancedState(){
  state={...defaultSystemState(state&&state.currentRole?state.currentRole:'dom'),...(state||{})};
  if(state.subTitle==='Jacob') state.subTitle='James';
  state.dataVersion=5;
  state.badges=ensureArray(state.badges);
  state.disclosures=ensureArray(state.disclosures);
  state.checkIns=ensureArray(state.checkIns);
  state.notifications=ensureArray(state.notifications);
  state.tasks=ensureArray(state.tasks).map(t=>({...t,title:titleCase(t.title),evidence:ensureArray(t.evidence)}));
  state.punishments=ensureArray(state.punishments).map(p=>({...p,title:titleCase(p.title),kind:p.kind||'timed'}));
  state.journal=ensureArray(state.journal).map(e=>({...e,title:titleCase(e.title),attachments:ensureArray(e.attachments)}));
  state.limits={...defaultSystemState().limits,...(state.limits||{})};
  state.rules={...defaultSystemState().rules,...(state.rules||{})};
  state.subProfile={...defaultSubProfile(),...(state.subProfile||{})};
  state.subProfile.measurements={...defaultSubProfile().measurements,...(state.subProfile.measurements||{})};
  state.subProfile.anatomy={...defaultSubProfile().anatomy,...(state.subProfile.anatomy||{})};
  state.bodyMaps={...defaultBodyMaps(),...(state.bodyMaps||{})};
  state.personalRecords={...defaultPersonalRecords(),...(state.personalRecords||{})};
  state.personalRecords.breath={...defaultPersonalRecords().breath,...(state.personalRecords.breath||{})};
  state.personalRecords.electro={...defaultPersonalRecords().electro,...(state.personalRecords.electro||{})};
}

/* ── State persistence ── */
function saveState(){
  localStorage.setItem('the_system_v4',JSON.stringify(state));
  try{ if(typeof firestoreConnected!=='undefined'&&firestoreConnected&&!applyingRemoteState){ sharedStateDocument.set(getSharedState()).catch(e=>console.error('Firebase sync error',e)); } }catch(_){}
}
function loadState(){
  const s=localStorage.getItem('the_system_v4');
  if(s){ try{ state={...(state||{}),...JSON.parse(s)}; }catch(e){ console.warn('State parse error',e); } }
}

/* ── Install: replace nav and add new screen containers ── */
function installNavigation(){
  const nav=document.getElementById('bottom-navigation'); if(!nav)return;
  nav.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(7,7,7,.95);border-top:1px solid rgba(255,255,255,.1);backdrop-filter:blur(22px)';
  nav.innerHTML=`<div class="max-w-3xl mx-auto grid grid-cols-5 text-center text-xs" style="padding-bottom:max(1.1rem,env(safe-area-inset-bottom));padding-top:.5rem">${NAV_ITEMS.map(([tab,label,icon])=>`<button onclick="navigateToTab('${tab}')" class="nav-item tap py-1 flex flex-col items-center gap-0 cursor-pointer" data-tab="${tab}"><span class="nav-icon"><i class="fa-solid ${icon} text-lg"></i></span><span class="text-[10px] tracking-wide">${label}</span></button>`).join('')}</div>`;
}
function installScreens(){
  /* Append next to the EXISTING tabs so we inherit the content wrapper's
     px-5 padding + max-width. #main-app has two .max-w-3xl divs (header +
     content); using an existing tab's parent guarantees the content one. */
  const anchor=document.getElementById('tab-dashboard');
  const host=(anchor&&anchor.parentElement)||document.querySelector('#main-app .max-w-3xl.px-5')||document.getElementById('main-app');
  if(!host)return;
  ['protocols','notifications','settings'].forEach(id=>{
    if(!document.getElementById('tab-'+id)){
      const d=document.createElement('div');
      d.id='tab-'+id; d.className='tab-content hidden';
      host.appendChild(d);
    }
  });
}

/* ── Login: keypad ── */
function showInstallGuide(){
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass rounded-3xl p-7 max-w-sm text-center"><i class="fa-solid fa-circle-info text-4xl text-[var(--gold)] mb-4"></i><div class="text-xl font-semibold mb-3">Install Help</div><div class="text-sm text-[var(--stone)] leading-relaxed mb-2">On iPhone: open in Safari, tap the <strong>Share</strong> button, then <strong>Add to Home Screen</strong>.</div><div class="text-sm text-[var(--stone)] leading-relaxed">On Android: tap the browser menu and select <strong>Add to Home Screen</strong>.</div><button onclick="this.closest('.fixed').remove()" class="w-full mt-6 py-3 bg-[var(--red)] rounded-2xl">Got It</button></div></div>`;
  document.body.appendChild(m);
}
function buildKeypad(){
  const screen=document.getElementById('login-screen'); if(!screen)return;
  document.getElementById('bottom-navigation').style.display='none';
  screen.style.cssText='position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:#070707';
  screen.innerHTML=`<div style="max-width:22rem;width:100%;padding:0 1.75rem;text-align:center">
    <div class="logo-orb" style="display:inline-flex;align-items:center;justify-content:center;width:6rem;height:6rem;border-radius:2rem;margin-bottom:1.5rem"><i class="fa-solid fa-infinity" style="color:#fff;font-size:3rem"></i></div>
    <h1 class="heading-serif" style="font-size:3.5rem;line-height:1;margin:0">The System</h1>
    <p style="color:var(--gold);margin-top:.5rem;letter-spacing:3px;font-size:.75rem">PRIVATE ACCESS</p>
    <div id="pin-dots" style="display:flex;justify-content:center;gap:1rem;margin:2rem 0">${[0,1,2,3].map(()=>`<span class="pin-dot" style="width:1rem;height:1rem;border-radius:999px;border:1.5px solid rgba(198,166,66,.55);display:inline-block"></span>`).join('')}</div>
    <p id="login-error" style="color:#f87171;font-size:.8rem;height:1.2rem;margin-bottom:.5rem"></p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="tap" onclick="keypadPress('${n}')" style="aspect-ratio:1.35;font-size:1.5rem;border-radius:1.25rem;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);color:var(--ivory);display:flex;align-items:center;justify-content:center">${n}</button>`).join('')}<button class="tap" onclick="keypadClear()" style="aspect-ratio:1.35;font-size:.8rem;border-radius:1.25rem;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);color:var(--ivory);letter-spacing:.05em">CLEAR</button><button class="tap" onclick="keypadPress('0')" style="aspect-ratio:1.35;font-size:1.5rem;border-radius:1.25rem;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);color:var(--ivory)">0</button><button class="tap" onclick="keypadBack()" style="aspect-ratio:1.35;font-size:1.25rem;border-radius:1.25rem;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);color:var(--ivory)"><i class="fa-solid fa-delete-left"></i></button></div>
    <button onclick="showInstallGuide()" style="margin-top:1.75rem;font-size:.7rem;color:rgba(198,166,66,.6);text-decoration:underline">Install Help</button>
  </div>`;
  window.currentPin='';
}
function keypadPress(d){ if((window.currentPin||'').length>=4)return; window.currentPin=(window.currentPin||'')+d; updatePinDots(); if(window.currentPin.length===4)setTimeout(attemptLogin,140); }
function keypadClear(){ window.currentPin=''; updatePinDots(); const e=document.getElementById('login-error'); if(e)e.textContent=''; }
function keypadBack(){ window.currentPin=(window.currentPin||'').slice(0,-1); updatePinDots(); }
function updatePinDots(){
  document.querySelectorAll('#pin-dots span').forEach((dot,i)=>{
    dot.style.background=i<(window.currentPin||'').length?'var(--gold)':'transparent';
    dot.style.boxShadow=i<(window.currentPin||'').length?'0 0 18px rgba(198,166,66,.4)':'none';
    dot.style.border=i<(window.currentPin||'').length?'1.5px solid var(--gold)':'1.5px solid rgba(198,166,66,.55)';
  });
}
function attemptLogin(){
  const input=window.currentPin||document.getElementById('passcode-input')?.value?.trim()||'';
  const role=input==='0000'?'dom':input==='1111'?'sub':null;
  if(!role){ const e=document.getElementById('login-error'); if(e)e.textContent='Incorrect code'; window.currentPin=''; updatePinDots(); return; }
  state.currentRole=role; saveState();
  document.getElementById('login-screen').style.display='none';
  document.getElementById('main-app').style.display='';
  document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('bottom-navigation').style.display='';
  updateRoleUI();
  navigateToTab(new URLSearchParams(location.search).get('tab')||'dashboard');
  try{ enablePushNotifications(); }catch(_){}
}

/* ── Header ── */
function updateHeader(){
  if(!state)return;
  const isDom=state.currentRole==='dom';
  const nameEl=document.getElementById('header-name'); if(nameEl) nameEl.textContent=isDom?state.domTitle:state.subTitle;
  const roleEl=document.getElementById('header-role'); if(roleEl){ roleEl.textContent=isDom?'Dominant':'Submissive'; roleEl.style.color=isDom?'var(--red)':'var(--sage)'; }
  const avatar=document.getElementById('header-avatar'); if(avatar) avatar.src=isDom?(state.avatar||DEFAULT_PHOTO):(state.subProfile&&state.subProfile.photo?state.subProfile.photo:DEFAULT_PHOTO);
  /* Replace right-side header buttons */
  const btns=document.querySelector('.app-header .flex.items-center.gap-x-2:last-child')||document.getElementById('header-action')?.parentElement;
  if(btns){
    const unread=unreadNotifications().length;
    btns.innerHTML=`<span class="pill px-3 py-2 text-[10px] hide-tiny" style="display:inline-flex;align-items:center;gap:.3rem"><span style="width:.5rem;height:.5rem;border-radius:999px;background:var(--sage);display:inline-block"></span>Connected</span><button onclick="navigateToTab('notifications')" style="position:relative;width:2.5rem;height:2.5rem;display:flex;align-items:center;justify-content:center;border-radius:1rem;background:rgba(255,255,255,.05);color:var(--gold)" class="tap"><i class="fa-solid fa-bell"></i>${unread?`<span style="position:absolute;top:-.25rem;right:-.25rem;min-width:1.2rem;height:1.2rem;padding:0 .2rem;border-radius:999px;background:var(--red);color:#fff;font-size:.6rem;display:flex;align-items:center;justify-content:center">${unread}</span>`:''}</button><button onclick="showSettings()" style="width:2.5rem;height:2.5rem;display:flex;align-items:center;justify-content:center;border-radius:1rem;background:rgba(255,255,255,.05);color:var(--ivory)" class="tap"><i class="fa-solid fa-bars"></i></button>`;
  }
}
function updateRoleUI(){
  if(!state)return;
  const isDom=state.currentRole==='dom';
  document.querySelectorAll('.dom-only').forEach(el=>el.style.display=isDom?'':'none');
  document.querySelectorAll('.sub-only').forEach(el=>el.style.display=isDom?'none':'');
  updateHeader();
}

/* ── Navigation ── */
function navigateToTab(tab){
  if(tab==='limits'||tab==='rules'||tab==='punishments'){ activeProtocolPanel=tab==='limits'?'boundaries':tab==='rules'?'rules':'consequences'; tab='protocols'; }
  document.querySelectorAll('.tab-content').forEach(el=>el.classList.add('hidden'));
  const panel=document.getElementById('tab-'+tab)||document.getElementById('tab-dashboard');
  if(panel) panel.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(el=>{
    el.classList.remove('nav-active','font-semibold');
    if(el.dataset.tab===tab) el.classList.add('nav-active','font-semibold');
  });
  renderCurrentTab();
}
function renderCurrentTab(){
  _syncState();
  const active=document.querySelector('.tab-content:not(.hidden)'); if(!active)return;
  const tab=active.id.replace('tab-','');
  if(tab==='dashboard') renderDashboard();
  else if(tab==='tasks') renderTasks();
  else if(tab==='protocols') renderProtocols();
  else if(tab==='journal') renderJournal();
  else if(tab==='stars') renderRewards();
  else if(tab==='notifications') renderNotifications();
  else if(tab==='settings') renderSettings();
  updateHeader();
}

/* ── Time helpers ── */
function greetingForNow(){ const h=new Date().getHours(); return h<12?'GOOD MORNING,':h<18?'GOOD AFTERNOON,':'GOOD EVENING,'; }
function formatUKDate(v){ if(!v)return''; const d=new Date(v); if(isNaN(d))return String(v); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
function formatUKTime(v){ const d=new Date(v||Date.now()); if(isNaN(d))return''; return d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); }
function dueDateFor(item){ if(!item)return null; if(item.dueAt)return new Date(item.dueAt); if(!item.due)return null; const d=new Date(item.due+'T23:59:59'); return isNaN(d)?null:d; }
function getTimeLeft(item){
  const due=dueDateFor(item); if(!due)return{text:'No deadline',color:'text-[var(--stone)]',pct:0};
  const diff=due-Date.now(); if(diff<=0)return{text:'Overdue',color:'text-red-400',pct:100};
  const d=Math.floor(diff/86400000),h=Math.floor(diff%86400000/3600000),m=Math.floor(diff%3600000/60000),s=Math.floor(diff%60000/1000);
  return{text:d?`${d}d ${h}h ${m}m`:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,color:d<1?'text-amber-400':'text-emerald-400',pct:Math.max(8,Math.min(95,100-(diff/86400000*100)))};
}
function calculateJournalStreak(){ return Math.min(99,ensureArray(state.journal).length); }
function activePunishments(){
  let changed=false;
  ensureArray(state.punishments).forEach(p=>{ if(p.status==='active'&&p.kind==='timed'&&dueDateFor(p)&&dueDateFor(p)<=new Date()){p.status='completed';p.completedAt=new Date().toISOString();changed=true;} });
  if(changed) saveState();
  return ensureArray(state.punishments).filter(p=>p.status==='active');
}
function updateCountdowns(){ document.querySelectorAll('[data-countdown]').forEach(el=>{ const p=state.punishments.find(x=>String(x.id)===String(el.dataset.countdown)); if(p) el.textContent=getTimeLeft(p).text; }); }

/* ── Dashboard — FULL REBUILD ── */
function renderDashboard(){
  const tab=document.getElementById('tab-dashboard'); if(!tab)return;
  const isDom=state.currentRole==='dom';
  const pending=state.tasks.filter(t=>t.status==='pending');
  const completedCount=state.tasks.filter(t=>t.status==='completed').length;
  const activeP=activePunishments();
  const showBanner=activeP.length>0&&!isDom;

  tab.innerHTML=`
    <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:1.5rem">
      <div>
        <div style="color:var(--gold);font-size:.75rem;letter-spacing:3px">${greetingForNow()}</div>
        <h2 class="heading-serif" style="font-size:3rem;line-height:1;margin:0">${escapeText(isDom?state.domTitle:state.subTitle)}</h2>
      </div>
      <div style="text-align:right">
        <div style="font-size:2.5rem;font-weight:700;color:var(--gold);font-variant-numeric:tabular-nums">${state.stars||0}</div>
        <div style="font-size:.6rem;color:rgba(198,166,66,.6);letter-spacing:2px">STARS EARNED</div>
      </div>
    </div>

    ${showBanner?`<div id="active-punishment-banner" class="card" style="padding:1rem;border-left:4px solid var(--red);margin-bottom:1.25rem">
      <div style="font-size:.65rem;letter-spacing:3px;color:var(--red);font-weight:700">ACTIVE CONSEQUENCE</div>
      <div id="punish-banner-title" style="font-weight:600;margin-top:.25rem">${escapeText(activeP[0].title)}</div>
      <div id="punish-banner-countdown" class="countdown" data-countdown="${activeP[0].id}" style="font-size:.75rem;font-family:monospace;margin-top:.5rem;color:#fbbf24">${getTimeLeft(activeP[0]).text}</div>
      <button onclick="activeProtocolPanel='consequences';navigateToTab('protocols')" style="font-size:.7rem;text-decoration:underline;color:rgba(198,166,66,.7);margin-top:.5rem">View details</button>
    </div>`:`<div id="active-punishment-banner" class="hidden"></div>`}

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin-bottom:2rem">
      <div class="card" style="padding:1rem;text-align:center">
        <div style="font-size:.6rem;color:rgba(198,166,66,.7);letter-spacing:2px;margin-bottom:.5rem">TASKS</div>
        <div style="font-size:2.25rem;font-weight:700;font-variant-numeric:tabular-nums">${completedCount}<span style="color:var(--stone);font-size:1rem">/${state.tasks.length}</span></div>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <div style="font-size:.6rem;color:rgba(198,166,66,.7);letter-spacing:2px;margin-bottom:.5rem">JOURNAL</div>
        <div style="font-size:2.25rem;font-weight:700;font-variant-numeric:tabular-nums">${calculateJournalStreak()}</div>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <div style="font-size:.6rem;color:rgba(198,166,66,.7);letter-spacing:2px;margin-bottom:.5rem">ACTIVE</div>
        <div id="dash-active-punish" style="font-size:2.25rem;font-weight:700;font-variant-numeric:tabular-nums">${activeP.length}</div>
      </div>
    </div>

    <div style="margin-bottom:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <span style="font-weight:600;font-size:1.1rem">Today's Focus</span>
        ${isDom?`<button onclick="showAddTaskModal()" class="pill tap" style="font-size:.7rem;padding:.35rem .9rem;color:var(--gold)">+ Assign</button>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        ${pending.slice(0,4).map(t=>`
          <button onclick="showTaskDetailById(${t.id})" class="tap glass" style="text-align:left;padding:.85rem 1rem;border-radius:1.25rem;display:block;width:100%">
            <div style="font-weight:600">${escapeText(titleCase(t.title))}</div>
            <div style="font-size:.72rem;margin-top:.25rem" class="${getTimeLeft(t).color}">${getTimeLeft(t).text}</div>
          </button>
        `).join('')||`<div style="font-size:.85rem;color:rgba(198,166,66,.5);padding:.5rem">Nothing Pending.</div>`}
      </div>
    </div>

    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <span style="font-weight:600;font-size:1.1rem">Activity</span>
        <button onclick="navigateToTab('notifications')" class="pill tap" style="font-size:.7rem;padding:.35rem .9rem;color:var(--gold)">View All</button>
      </div>
      <div id="activity-feed" style="display:flex;flex-direction:column;gap:.5rem">
        ${derivedNotifications().slice(0,5).map(n=>`
          <button onclick="openNotification('${n.id}')" class="tap glass" style="text-align:left;padding:.85rem 1rem;border-radius:1.25rem;display:block;width:100%;border-left:3px solid transparent" class="${n.colourBorder}">
            <div style="font-size:.85rem;font-weight:500">${escapeText(n.title)}</div>
            <div style="font-size:.75rem;color:var(--stone);margin-top:.2rem">${escapeText(n.body)}</div>
          </button>
        `).join('')||`<div style="font-size:.85rem;color:rgba(198,166,66,.5);padding:.5rem">No Recent Activity Yet.</div>`}
      </div>
    </div>
  `;
  updateCountdowns();
}

/* ── Tasks — FULL REBUILD ── */
function renderTasks(){
  const tab=document.getElementById('tab-tasks'); if(!tab)return;
  const isDom=state.currentRole==='dom';
  const pending=state.tasks.filter(t=>t.status==='pending');
  const completed=state.tasks.filter(t=>t.status==='completed');
  tab.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem">
      <div>
        <div class="heading-serif" style="font-size:2.5rem">Tasks</div>
        <div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">${pending.length} pending · ${completed.length} completed</div>
      </div>
      ${isDom?`<button onclick="showAddTaskModal()" class="tap" style="padding:.55rem 1.1rem;background:var(--red);border-radius:1rem;font-size:.8rem;color:#fff"><i class="fa-solid fa-plus" style="margin-right:.3rem"></i>Assign</button>`:''}
    </div>
    <div id="tasks-list" style="display:flex;flex-direction:column;gap:.75rem">
      ${pending.length?pending.map(t=>`
        <button onclick="showTaskDetailById(${t.id})" class="card tap" style="text-align:left;padding:1.25rem;display:block;width:100%">
          <div style="display:flex;justify-content:space-between;gap:1rem">
            <div style="flex:1">
              <div style="font-weight:600;font-size:1.05rem">${escapeText(titleCase(t.title))}</div>
              ${t.desc?`<div style="font-size:.8rem;color:var(--stone);margin-top:.3rem">${escapeText(t.desc)}</div>`:''}
              <div style="font-size:.72rem;margin-top:.75rem" class="${getTimeLeft(t).color}"><i class="fa-regular fa-clock" style="margin-right:.25rem"></i>${getTimeLeft(t).text}</div>
              ${ensureArray(t.requiredEvidence).length?`<div style="font-size:.7rem;color:rgba(198,166,66,.7);margin-top:.35rem">Proof: ${ensureArray(t.requiredEvidence).map(titleCase).join(', ')}</div>`:''}
            </div>
            <i class="fa-solid fa-chevron-right" style="color:rgba(198,166,66,.4);margin-top:.25rem;flex-shrink:0"></i>
          </div>
        </button>
      `).join(''):`<div style="text-align:center;padding:2rem;color:rgba(198,166,66,.5)">No Pending Tasks.</div>`}
    </div>
    ${completed.length?`
    <div style="margin-top:1.5rem">
      <div style="font-size:.65rem;color:var(--stone);letter-spacing:3px;margin-bottom:.75rem;padding-left:.25rem">COMPLETED</div>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        ${completed.slice(0,10).map(t=>`
          <div class="glass" style="padding:.75rem 1rem;border-radius:1rem;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:.85rem">${escapeText(titleCase(t.title))}</span>
            <span style="font-size:.7rem;color:#34d399"><i class="fa-solid fa-check" style="margin-right:.25rem"></i>${formatUKDate(t.completedDate)}</span>
          </div>
        `).join('')}
      </div>
    </div>`:''}
  `;
}

/* ── Task detail modal ── */
function showTaskDetailById(id){ const t=state.tasks.find(x=>String(x.id)===String(id)); if(t) showTaskDetail(t); }
function evidenceInput(type){
  if(type==='text') return `<label style="display:block"><span style="font-size:.7rem;color:rgba(198,166,66,.7)">TEXT REPORT</span><textarea id="evidence-text" rows="4" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-top:.35rem;resize:none" placeholder="Write Your Report..."></textarea></label>`;
  const label=titleCase(type==='voice'?'Voice Note':type); const accept=type==='photo'?'image/*':type==='video'?'video/*':type==='voice'?'audio/*':'*/*';
  return `<label style="display:block"><span style="font-size:.7rem;color:rgba(198,166,66,.7)">${label.toUpperCase()}</span><input id="evidence-${type}" type="file" accept="${accept}" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-top:.35rem;font-size:.8rem"></label>`;
}
function renderSubmittedEvidence(task){
  const items=task.evidence||[]; if(!items.length)return`<div style="font-size:.85rem;opacity:.6">No Evidence Submitted.</div>`;
  return items.map(item=>item.type==='text'?`<div class="glass" style="padding:1rem;border-radius:1rem"><div style="font-size:.65rem;color:rgba(198,166,66,.7);margin-bottom:.35rem">TEXT REPORT</div><div style="font-size:.85rem;white-space:pre-wrap">${escapeText(item.value)}</div></div>`:`<a href="${item.url}" target="_blank" rel="noopener" class="glass" style="padding:1rem;border-radius:1rem;display:flex;justify-content:space-between;align-items:center"><span style="font-size:.85rem"><i class="fa-solid fa-paperclip" style="margin-right:.5rem"></i>${escapeText(item.name||item.type)}</span><i class="fa-solid fa-arrow-up-right-from-square" style="color:var(--gold)"></i></a>`).join('');
}
function showTaskDetail(task){
  const isSub=state.currentRole==='sub', required=ensureArray(task.requiredEvidence);
  const modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;max-height:92vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="display:flex;justify-content:space-between;gap:1rem;margin-bottom:1.25rem"><div><div style="font-size:1.4rem;font-weight:600">${escapeText(titleCase(task.title))}</div><div style="font-size:.7rem;color:rgba(198,166,66,.7);margin-top:.2rem">${formatUKDate(dueDateFor(task))} at ${formatUKTime(dueDateFor(task))}</div></div><button onclick="this.closest('.fixed').remove()" style="font-size:1.5rem;color:var(--stone)">×</button></div><div style="font-size:.9rem;margin-bottom:1.5rem;white-space:pre-wrap">${escapeText(task.desc||'No additional instructions.')}</div>${task.status==='completed'?`<div style="gap:.75rem;display:flex;flex-direction:column"><div style="font-size:.65rem;color:#34d399;letter-spacing:3px">COMPLETED</div>${renderSubmittedEvidence(task)}</div>`:isSub?`<div style="display:flex;flex-direction:column;gap:.75rem">${required.map(t=>evidenceInput(t)).join('')||`<div style="font-size:.85rem;opacity:.6">No Evidence Required.</div>`}</div><button onclick="submitTaskEvidence(${task.id},this)" style="width:100%;margin-top:1.5rem;padding:.85rem;background:#064e3b;border-radius:1rem;color:#fff">Submit & Complete</button>`:`<div style="font-size:.85rem;color:rgba(198,166,66,.7)">Waiting for completion.</div>`}</div></div>`;
  document.getElementById('modal-container').appendChild(modal);
}
async function submitTaskEvidence(taskId,button){
  const task=state.tasks.find(t=>String(t.id)===String(taskId)); if(!task)return;
  const required=ensureArray(task.requiredEvidence), textVal=document.getElementById('evidence-text')?.value.trim();
  if(required.includes('text')&&!textVal)return alert('Please complete the text report.');
  button.disabled=true; const items=[]; if(textVal)items.push({type:'text',value:textVal});
  try{
    for(const type of required.filter(t=>t!=='text')){
      const file=document.getElementById('evidence-'+type)?.files?.[0];
      if(!file)return alert('Please add the required '+titleCase(type)+'.');
      const ref=evidenceStorage.ref('evidence/'+taskId+'/'+Date.now()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_'));
      button.textContent='Uploading '+titleCase(type)+'…';
      const url=await uploadEvidenceFile(ref,file,button);
      items.push({type,name:file.name,url,size:file.size});
    }
    task.evidence=items; task.report=textVal||'';
    state.evidence.unshift({id:Date.now(),taskId,title:task.title,date:new Date().toISOString(),items});
    button.textContent='Saving…'; await completeTask(taskId); button.closest('.fixed').remove();
  }catch(err){ console.error(err); button.disabled=false; button.textContent='Submit & Complete'; alert('Submission failed. Check your connection.'); }
}
async function completeTask(taskId){
  const task=state.tasks.find(t=>String(t.id)===String(taskId)); if(!task)return;
  const backup=JSON.stringify(state); task.status='completed'; task.completedAt=new Date().toISOString(); task.completedDate=task.completedAt.slice(0,10);
  const earned=task.priority||1; state.stars=(state.stars||0)+earned;
  state.starLog.unshift({id:Date.now(),date:task.completedDate,reason:'Completed: '+task.title,amount:earned});
  state.punishments.forEach(p=>{ if(p.status==='active'&&String(p.linkedTaskId)===String(taskId)){p.status='completed';p.completedAt=task.completedAt;} });
  addNotification('review','Proof submitted',task.title+' is awaiting review.','tasks');
  localStorage.setItem('the_system_v4',JSON.stringify(state));
  try{ await sharedStateDocument.set(getSharedState()); showConfetti(35); renderDashboard(); renderTasks(); }
  catch(err){ state=JSON.parse(backup); localStorage.setItem('the_system_v4',backup); throw err; }
}
function uploadEvidenceFile(ref,file,button){ return new Promise((resolve,reject)=>{ const u=ref.put(file,{contentType:file.type}); u.on('state_changed',s=>{ const p=s.totalBytes?Math.round(s.bytesTransferred/s.totalBytes*100):0; button.textContent='Uploading '+file.name+' · '+p+'%'; },reject,async()=>{ try{resolve(await ref.getDownloadURL());}catch(e){reject(e);} }); }); }

/* ── Add task modal ── */
function showAddTaskModal(){
  const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
  const modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;max-height:92vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1.25rem">Assign Task</div><div style="display:flex;flex-direction:column;gap:.85rem"><input id="task-title" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" placeholder="Task Title"><textarea id="task-desc" rows="3" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none" placeholder="Instructions"></textarea><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem"><label style="font-size:.7rem;color:rgba(198,166,66,.7)">DUE DATE<input id="task-due" type="date" value="${tomorrow}" class="beautiful-input" style="width:100%;padding:.7rem .85rem;border-radius:.85rem;margin-top:.25rem;display:block"></label><label style="font-size:.7rem;color:rgba(198,166,66,.7)">TIME<input id="task-time" type="time" class="beautiful-input" style="width:100%;padding:.7rem .85rem;border-radius:.85rem;margin-top:.25rem;display:block"></label></div><select id="task-cat" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem"><option>Service</option><option>Chore</option><option>Personal</option><option>Consequence Task</option></select><div><div style="font-size:.7rem;color:rgba(198,166,66,.7);margin-bottom:.5rem">REQUIRED PROOF</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">${[['photo','Photo'],['video','Video'],['voice','Voice Note'],['text','Text Report']].map(([id,label])=>`<label class="glass" style="padding:.75rem;border-radius:1rem;font-size:.85rem;display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" id="ev-${id}" style="accent-color:var(--red)">${label}</label>`).join('')}</div></div></div><div style="display:flex;gap:.75rem;margin-top:1.5rem"><button onclick="this.closest('.fixed').remove()" style="flex:1;padding:.85rem;border:1px solid rgba(255,255,255,.2);border-radius:1rem">Cancel</button><button onclick="addNewTask(this)" style="flex:1;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Assign</button></div></div></div>`;
  document.getElementById('modal-container').appendChild(modal);
}
function addNewTask(button){
  const title=titleCase(document.getElementById('task-title').value||'Untitled Task');
  const date=document.getElementById('task-due').value, time=document.getElementById('task-time').value;
  const required=['photo','video','voice','text'].filter(t=>document.getElementById('ev-'+t)?.checked);
  const task={id:Date.now(),title,desc:document.getElementById('task-desc').value.trim(),due:date,dueAt:date+'T'+(time||'23:59')+':00',category:document.getElementById('task-cat').value,status:'pending',priority:2,requiredEvidence:required,assignedAt:new Date().toISOString(),evidence:[]};
  state.tasks.unshift(task);
  if(task.category==='Consequence Task') state.punishments.unshift({id:Date.now()+1,title:task.title,desc:task.desc,kind:'task',linkedTaskId:task.id,status:'active',assignedAt:new Date().toISOString()});
  addNotification('task','Task assigned',task.title,'tasks'); saveState(); button.closest('.fixed').remove(); renderTasks(); renderDashboard(); showConfetti(20);
}

/* ── Protocols hub ── */
function panelBtn(id,label,icon){ return `<button onclick="setProtocolPanel('${id}')" class="tap pill" style="padding:.4rem .85rem;font-size:.72rem;${activeProtocolPanel===id?'background:var(--red-2);border-color:var(--red);color:#fff':''}"><i class="fa-solid ${icon}" style="margin-right:.3rem"></i>${label}</button>`; }
function setProtocolPanel(p){ activeProtocolPanel=p; renderProtocols(); }
function renderProtocols(){
  const tab=document.getElementById('tab-protocols'); if(!tab)return;
  tab.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem"><div><div class="heading-serif" style="font-size:2.5rem">Protocols</div><div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">Rules, boundaries, records and consequences.</div></div><button onclick="showProfileModal()" class="pill tap" style="font-size:.72rem;padding:.4rem .85rem;flex-shrink:0"><i class="fa-solid fa-user" style="margin-right:.3rem"></i>Sub Profile</button></div><div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.25rem">${panelBtn('rules','Rules','fa-section')}${panelBtn('boundaries','Boundaries','fa-shield')}${panelBtn('bodymaps','Body Maps','fa-person')}${panelBtn('records','Records','fa-chart-simple')}${panelBtn('consequences','Consequences','fa-hourglass-half')}</div><div id="protocol-panel"></div>`;
  const box=document.getElementById('protocol-panel');
  if(activeProtocolPanel==='rules') box.innerHTML=renderProtocolRules();
  else if(activeProtocolPanel==='boundaries') box.innerHTML=renderBoundaryPanel();
  else if(activeProtocolPanel==='bodymaps') box.innerHTML=renderBodyMapsPanel();
  else if(activeProtocolPanel==='records') box.innerHTML=renderPersonalRecordsPanel();
  else if(activeProtocolPanel==='consequences'){ box.innerHTML='<div id="punishments-active" style="display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem"></div><div style="font-size:.65rem;color:rgba(198,166,66,.6);letter-spacing:3px;margin-bottom:.5rem">HISTORY</div><div id="punishments-history" style="display:flex;flex-direction:column;gap:.5rem;font-size:.85rem"></div>'; renderPunishments(); }
}
function renderProtocolRules(){
  return`<div style="display:flex;flex-direction:column;gap:1rem">${RULE_SECTIONS.map(([key,label,glyph])=>`<section class="card" style="padding:1.25rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><div style="display:flex;align-items:center;gap:.75rem"><span class="icon-tile">${glyph}</span><div style="font-weight:600">${label}</div></div>${state.currentRole==='dom'?`<button onclick="editSection('${key}')" style="font-size:.7rem;padding:.3rem .75rem;background:rgba(255,255,255,.1);border-radius:.75rem">Edit</button>`:''}</div><div style="display:flex;flex-direction:column;gap:.5rem">${String(state.rules[key]||'').split('\n').map(x=>x.replace(/^\s*(?:[•\-]|\d+[.)])\s*/,'')).filter(Boolean).map((line,i)=>`<div style="display:flex;gap:.75rem;font-size:.85rem"><span class="rule-number">${i+1}</span><span>${escapeText(line)}</span></div>`).join('')||'<div style="font-size:.75rem;opacity:.4">Nothing Set.</div>'}</div></section>`).join('')}</div>`;
}
function renderBoundaryPanel(){
  return`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><div><div style="font-size:1.4rem;font-weight:600">Boundaries</div><div style="font-size:.75rem;color:var(--stone)">Same icon treatment as Protocols.</div></div>${state.currentRole==='dom'?`<button onclick="showAddLimitModal()" class="tap" style="padding:.5rem 1rem;background:var(--red);border-radius:.85rem;font-size:.8rem">+ Add</button>`:''}</div><div style="display:flex;flex-direction:column;gap:1rem">${LIMIT_GROUPS.map(([key,label,glyph])=>`<section class="card" style="padding:1.25rem"><div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem"><span class="icon-tile">${glyph}</span><div style="font-weight:600">${label}</div></div><div style="display:flex;flex-wrap:wrap;gap:.5rem">${ensureArray(state.limits[key]).map(item=>`<span class="pill" style="padding:.4rem 1rem;font-size:.85rem">${escapeText(typeof item==='string'?item:item.text)}</span>`).join('')||'<div style="font-size:.75rem;opacity:.4">Nothing Listed.</div>'}</div></section>`).join('')}</div>`;
}
function humanOutline(kind,view){
  const zones=ensureArray(state.bodyMaps[kind]).filter(z=>z.view===view);
  return`<div class="human-outline"><svg viewBox="0 0 180 300" aria-hidden="true"><circle cx="90" cy="32" r="22"/><path d="M64 70 L116 70 L132 158 L110 230 L96 288"/><path d="M64 70 L48 158 L70 230 L84 288"/><path d="M62 82 L25 145 L34 220"/><path d="M118 82 L155 145 L146 220"/><path d="M58 170 L122 170"/></svg>${zones.map(z=>`<span class="body-zone pulse-dot ${kind==='ticklish'?'zone-ticklish':'zone-sensitive'}" style="left:${z.x}%;top:${z.y}%"></span>`).join('')}</div>`;
}
function renderBodyMapsPanel(){
  return`<div style="display:flex;flex-direction:column;gap:1rem"><section class="card" style="padding:1.25rem"><div style="display:flex;justify-content:space-between"><div><div style="font-size:1.2rem;font-weight:600">Ticklish Areas</div><div style="font-size:.75rem;color:var(--stone);margin-top:.2rem">Saved for easy reference.</div></div><span class="pill" style="font-size:.65rem;padding:.35rem .75rem;flex-shrink:0">Dom edit only</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.25rem;text-align:center"><div><div style="font-size:.7rem;color:var(--sage);margin-bottom:.5rem">Front</div>${humanOutline('ticklish','front')}</div><div><div style="font-size:.7rem;color:var(--sage);margin-bottom:.5rem">Back</div>${humanOutline('ticklish','back')}</div></div></section><section class="card" style="padding:1.25rem"><div style="display:flex;justify-content:space-between"><div><div style="font-size:1.2rem;font-weight:600">Sensitive Areas</div><div style="font-size:.75rem;color:var(--stone);margin-top:.2rem">Saved for easy reference.</div></div><span class="pill" style="font-size:.65rem;padding:.35rem .75rem;flex-shrink:0">Dom edit only</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.25rem;text-align:center"><div><div style="font-size:.7rem;color:var(--rose);margin-bottom:.5rem">Front</div>${humanOutline('sensitive','front')}</div><div><div style="font-size:.7rem;color:var(--rose);margin-bottom:.5rem">Back</div>${humanOutline('sensitive','back')}</div></div></section></div>`;
}
function measurementRows(){ const m=state.subProfile.measurements; return [['Height',m.height],['Weight',m.weight],['Neck',m.neck],['Chest',m.chest],['Bicep L',m.bicepL],['Bicep R',m.bicepR],['Waist',m.waist],['Hips',m.hips],['Inside Leg',m.insideLeg]]; }
function anatomyRows(){ const a=state.subProfile.anatomy; return [['Soft Length',a.softLength],['Hard Length',a.hardLength],['Soft Girth',a.softGirth],['Hard Girth',a.hardGirth],['Testicular Circumference',a.testicularCircumference]]; }
function renderPersonalRecordsPanel(){
  const br=state.personalRecords.breath;
  const breathKeys={longestHold:'Longest Hold',rebreathe3L:'3 L Rebreathe',rebreathe5L:'5 L Rebreathe',rebreathe6L:'6 L Rebreathe',bubbleBottleLarge:'Bubble Bottle Large',bubbleBottleSmall:'Bubble Bottle Small',resistanceMaximum:'Resistance Maximum'};
  return`<div style="display:flex;flex-direction:column;gap:1rem"><section class="card" style="padding:1.25rem"><div style="display:flex;gap:1rem"><img src="${escapeText(state.subProfile.photo||DEFAULT_PHOTO)}" style="width:7rem;height:8.5rem;object-fit:cover;border-radius:1.5rem;filter:grayscale(1)" alt="Sub profile"><div style="flex:1"><div class="heading-serif" style="font-size:1.75rem">${escapeText(state.subProfile.name||state.subTitle)}</div><div style="font-size:.8rem;color:var(--sage)">Submissive</div><div style="font-size:.8rem;color:var(--gold);margin-top:.5rem">Dominant: ${escapeText(state.subProfile.dominant||state.domTitle)}</div><span class="pill" style="display:inline-flex;align-items:center;gap:.35rem;font-size:.7rem;padding:.35rem .75rem;margin-top:.75rem"><i class="fa-solid fa-lock"></i>Dom edit only</span></div></div></section><section class="card" style="padding:1.25rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><div style="font-size:1.2rem;font-weight:600">Measurements</div><span class="pill" style="font-size:.65rem;padding:.3rem .7rem;color:var(--blue)">Reference only</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">${measurementRows().map(([k,v])=>`<div class="subtle-card" style="padding:.75rem"><div style="font-size:.6rem;color:var(--stone);text-transform:uppercase;letter-spacing:1px">${k}</div><div style="font-size:.9rem;font-weight:600;margin-top:.25rem">${escapeText(v||'—')}</div></div>`).join('')}</div></section><section class="card" style="padding:1.25rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><div style="font-size:1.2rem;font-weight:600">Personal Records</div><span class="pill" style="font-size:.65rem;padding:.3rem .7rem;color:var(--blue)">Record keeping</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">${anatomyRows().map(([k,v])=>`<div class="subtle-card" style="padding:.75rem"><div style="font-size:.6rem;color:var(--stone);text-transform:uppercase;letter-spacing:1px">${k}</div><div style="font-size:.9rem;font-weight:600;margin-top:.25rem">${escapeText(v||'—')}</div></div>`).join('')}</div><div style="font-size:.75rem;color:var(--stone);margin-top:.85rem">For reference and record keeping only.</div></section><section class="card" style="padding:1.25rem"><div style="font-size:1.2rem;font-weight:600;margin-bottom:1rem">Breath Control Records</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">${Object.entries(breathKeys).map(([k,label])=>`<div class="subtle-card" style="padding:.75rem"><div style="font-size:.6rem;color:var(--stone);text-transform:uppercase;letter-spacing:1px">${label}</div><div style="font-size:.9rem;font-weight:600;margin-top:.25rem">${escapeText(br[k]||'—')}</div></div>`).join('')}</div></section><section class="card" style="padding:1.25rem"><div style="font-size:1.2rem;font-weight:600;margin-bottom:1rem">Electro Response</div><div style="display:flex;flex-direction:column;gap:.85rem">${Object.entries(state.personalRecords.electro).map(([label,row])=>rangeRow(label,row)).join('')}</div><div style="font-size:.75rem;color:var(--stone);margin-top:.85rem">Values use a 1 to 100 reference scale.</div></section></div>`;
}
function rangeRow(label,row){
  const min=Number(row.min)||0,max=Number(row.max)||0,start=Number(row.pleasureStart)||min,end=Number(row.pleasureEnd)||max;
  return`<div><div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:.3rem"><span>${escapeText(label)}</span><span style="color:var(--stone)">${min}–${max}</span></div><div class="range-track"><div class="range-fill" style="margin-left:${Math.max(0,min)}%;width:${Math.max(5,max-min)}%"></div></div><div style="font-size:.65rem;color:var(--sage);margin-top:.25rem">Pleasure zone: ${start}–${end}</div></div>`;
}
function renderPunishments(){
  const activeEl=document.getElementById('punishments-active'),histEl=document.getElementById('punishments-history'); if(!activeEl)return;
  const items=activePunishments();
  activeEl.innerHTML=items.map(p=>{ const time=getTimeLeft(p); return`<div class="card" style="padding:1.25rem;border-left:4px solid var(--red)"><div style="display:flex;gap:1rem"><div class="ring" style="width:6rem;height:6rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;--p:${time.pct};--c:var(--red)"><span class="countdown" data-countdown="${p.id}" style="font-size:.7rem;text-align:center;padding:0 .5rem;position:relative;z-index:1">${time.text}</span></div><div><div style="font-weight:600;font-size:1.05rem">${escapeText(p.title)}</div><div style="font-size:.8rem;margin-top:.35rem;color:var(--stone)">${escapeText(p.desc||'')}</div><div style="font-size:.7rem;color:rgba(198,166,66,.7);margin-top:.75rem">${p.kind==='task'?'Linked task':'Active timer'}</div></div></div></div>`; }).join('')||`<div style="font-size:.85rem;color:rgba(198,166,66,.5)">No Active Consequences.</div>`;
  if(histEl) histEl.innerHTML=state.punishments.filter(p=>p.status==='completed').map(p=>`<div class="glass" style="padding:.75rem 1rem;border-radius:1rem;display:flex;justify-content:space-between">${escapeText(p.title)}<span style="color:#34d399">Complete</span></div>`).join('')||`<div style="opacity:.5">No history yet.</div>`;
  updateCountdowns();
}

/* ── Rewards — FULL REBUILD ── */
function renderRewards(){
  const tab=document.getElementById('tab-stars'); if(!tab)return;
  tab.innerHTML=`<div style="text-align:center;margin-bottom:2rem"><div class="logo-orb" style="display:inline-flex;align-items:center;justify-content:center;width:6rem;height:6rem;border-radius:999px;margin-bottom:1rem"><i class="fa-solid fa-star" style="color:#fff;font-size:3rem"></i></div><div style="font-size:1.25rem;font-weight:600">Stars Earned</div><div style="font-size:3.75rem;font-weight:700;color:var(--gold);font-variant-numeric:tabular-nums">${state.stars||0}</div></div><div class="card" style="padding:1.25rem;margin-bottom:1.25rem"><div style="font-weight:600;font-size:1.1rem;margin-bottom:1rem">Recent Awards</div><div style="display:flex;flex-direction:column;gap:.5rem">${ensureArray(state.starLog).slice(0,25).map(s=>`<div style="display:flex;justify-content:space-between;padding:.75rem 1rem;background:rgba(255,255,255,.05);border-radius:1rem;font-size:.85rem"><span>${escapeText(s.reason)}</span><span style="color:var(--gold)">+${s.amount} ★</span></div>`).join('')||`<div style="font-size:.85rem;opacity:.6">No Stars Earned Yet.</div>`}</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">${SYSTEM_BADGES.map(b=>{ const earned=ensureArray(state.badges).some(x=>x.id===b.id); return`<button onclick="showBadge('${b.id}')" class="card tap" style="padding:1rem;text-align:left;${earned?'border-color:rgba(198,166,66,.4)':'opacity:.6'}"><i class="fa-solid ${b.icon}" style="font-size:1.5rem;color:${earned?'var(--gold)':'rgba(255,255,255,.3)'}"></i><div style="font-weight:600;margin-top:.75rem">${b.name}</div><div style="font-size:.65rem;margin-top:.25rem;letter-spacing:2px;color:${earned?'#34d399':'rgba(255,255,255,.3)'}">${earned?'AUTHORISED':'LOCKED'}</div></button>`; }).join('')}</div>`;
}
function showBadge(id){ const b=SYSTEM_BADGES.find(x=>x.id===id), earned=ensureArray(state.badges).some(x=>x.id===id); const m=document.createElement('div'); m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-6" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="max-width:22rem;width:100%;border-radius:2rem;padding:1.75rem;text-align:center"><i class="fa-solid ${b.icon}" style="font-size:3.5rem;color:var(--gold);margin-bottom:1.25rem;display:block"></i><div style="font-size:1.4rem;font-weight:600">${b.name}</div><div style="font-size:.85rem;margin-top:.75rem;opacity:.8">${b.goal}</div>${state.currentRole==='dom'&&!earned?`<button onclick="authoriseBadge('${id}',this)" style="width:100%;margin-top:1.5rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Authorise Award</button>`:`<div style="margin-top:1.5rem;font-size:.85rem;color:${earned?'#34d399':'rgba(255,255,255,.4)'}">${earned?'Awarded By Sir':'Awaiting Authorisation'}</div>`}</div></div>`; document.getElementById('modal-container').appendChild(m); }
function authoriseBadge(id,button){ ensureArray(state.badges); state.badges.push({id,authorisedAt:new Date().toISOString()}); saveState(); button.closest('.fixed').remove(); renderRewards(); showConfetti(40); }

/* ── Journal — FULL REBUILD ── */
function renderJournal(){
  const tab=document.getElementById('tab-journal'); if(!tab)return;
  tab.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem"><div><div class="heading-serif" style="font-size:2.5rem">Journal</div><div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">${state.journal.length} entries</div></div><button onclick="showNewJournalModal()" class="tap" style="padding:.55rem 1.1rem;background:var(--red);border-radius:1rem;font-size:.8rem;color:#fff;flex-shrink:0"><i class="fa-solid fa-pen" style="margin-right:.3rem"></i>New Entry</button></div><div id="journal-entries" style="display:flex;flex-direction:column;gap:1rem">${state.journal.map(e=>`<button onclick="openJournalEntry(${e.id})" class="card tap" style="text-align:left;padding:1.25rem;display:block;width:100%"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-weight:600;font-size:1.05rem">${escapeText(titleCase(e.title))}</div><div style="font-size:.7rem;color:rgba(198,166,66,.7);margin-top:.25rem">${formatUKDate(e.date)}</div></div><i class="fa-solid fa-feather" style="color:var(--gold);flex-shrink:0"></i></div><div style="font-size:.85rem;margin-top:.75rem;opacity:.75;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escapeText(e.body||'')}</div></button>`).join('')||`<div style="text-align:center;padding:2rem;color:rgba(198,166,66,.5)">No Journal Entries Yet.</div>`}</div>`;
}
function showNewJournalModal(){ const m=document.createElement('div'); m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:28rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1.25rem">New Journal Entry</div><input id="journal-title" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-bottom:.75rem" placeholder="Title"><textarea id="journal-body" rows="7" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none" placeholder="Write your entry..."></textarea><button onclick="addJournalEntry(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Save Entry</button></div></div>`; document.getElementById('modal-container').appendChild(m); }
function addJournalEntry(button){ const title=titleCase(document.getElementById('journal-title').value||'Journal Entry'), body=document.getElementById('journal-body').value.trim(); if(!body)return alert('Please write something before saving.'); state.journal.unshift({id:Date.now(),title,body,date:new Date().toISOString(),attachments:[]}); addNotification('journal','Journal saved',title,'journal'); saveState(); button.closest('.fixed').remove(); renderJournal(); renderDashboard(); }
function openJournalEntry(id){ const e=state.journal.find(x=>String(x.id)===String(id)); if(!e)return; const m=document.createElement('div'); m.innerHTML=`<div class="fixed inset-0 z-[200] flex items-end md:items-center justify-center" style="background:rgba(0,0,0,.95)" onclick="this.remove()"><article onclick="event.stopImmediatePropagation()" style="background:#151515;width:100%;max-width:44rem;max-height:94vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.75rem;padding-bottom:max(1.75rem,env(safe-area-inset-bottom))"><button onclick="this.closest('[onclick]').remove()" style="float:right;font-size:1.5rem;color:var(--stone)">×</button><div style="font-size:.7rem;letter-spacing:3px;color:var(--gold)">${formatUKDate(e.date)} · ${formatUKTime(e.date)}</div><h1 class="heading-serif" style="font-size:2.5rem;margin:.75rem 0 1.5rem">${escapeText(titleCase(e.title))}</h1><div style="font-size:1rem;white-space:pre-wrap;line-height:1.8">${escapeText(e.body)}</div></article></div>`; document.getElementById('modal-container').appendChild(m); }

/* ── Notifications ── */
function derivedNotifications(){
  const manual=ensureArray(state.notifications).map(n=>({...n,manual:true}));
  const tasks=state.tasks.filter(t=>t.status==='pending').slice(0,3).map(t=>({id:'task-'+t.id,type:'task',title:'Task due soon',body:t.title,time:getTimeLeft(t).text,tab:'tasks',read:false,colourBorder:'border-l-[var(--blue)]'}));
  const cons=activePunishments().slice(0,2).map(p=>({id:'consequence-'+p.id,type:'consequence',title:'Consequence active',body:p.title,time:getTimeLeft(p).text,tab:'protocols',panel:'consequences',read:false,colourBorder:'border-l-[var(--red)]'}));
  const rewards=ensureArray(state.starLog).slice(0,1).map(s=>({id:'reward-'+s.id,type:'reward',title:'Reward earned',body:'+'+s.amount+' stars · '+s.reason,time:formatUKDate(s.date),tab:'stars',read:false,colourBorder:'border-l-[var(--gold)]'}));
  return [...manual,...tasks,...cons,...rewards];
}
function unreadNotifications(){ return derivedNotifications().filter(n=>!n.read); }
function addNotification(type,title,body,tab){ state.notifications=ensureArray(state.notifications); const colourBorder=type==='reward'?'border-l-[var(--gold)]':type==='consequence'?'border-l-[var(--red)]':type==='review'?'border-l-[var(--sage)]':'border-l-[var(--blue)]'; state.notifications.unshift({id:'n-'+Date.now(),type,title,body,tab:tab||'dashboard',read:false,createdAt:new Date().toISOString(),colourBorder}); if(state.notifications.length>40)state.notifications.length=40; }
function renderNotifications(){
  const tab=document.getElementById('tab-notifications'); if(!tab)return;
  const items=derivedNotifications().filter(n=>activeNotificationsFilter==='all'||n.type===activeNotificationsFilter);
  const filters=[['all','All'],['task','Tasks'],['review','Reviews'],['consequence','Consequences'],['reward','Rewards']];
  tab.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem"><div><div class="heading-serif" style="font-size:2.5rem">Notifications</div><div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">Everything important lands here.</div></div><button onclick="markAllNotificationsRead()" class="pill tap" style="font-size:.72rem;padding:.4rem .85rem;flex-shrink:0">Mark read</button></div><div style="display:flex;gap:.5rem;overflow-x:auto;padding-bottom:.5rem;margin-bottom:1rem">${filters.map(([id,label])=>`<button onclick="setNotificationFilter('${id}')" class="pill tap" style="padding:.4rem 1rem;font-size:.72rem;white-space:nowrap;${activeNotificationsFilter===id?'background:var(--red-2);border-color:var(--red);color:#fff':''}">${label}</button>`).join('')}</div><div style="display:flex;flex-direction:column;gap:.75rem">${items.map(n=>`<button onclick="openNotification('${n.id}')" class="card tap" style="text-align:left;padding:1rem;display:block;width:100%;border-left:3px solid ${n.type==='reward'?'var(--gold)':n.type==='consequence'?'var(--red)':n.type==='review'?'var(--sage)':'var(--blue)'}"><div style="display:flex;justify-content:space-between;gap:.75rem"><div><div style="font-weight:600">${escapeText(n.title)}</div><div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">${escapeText(n.body)}</div><div style="font-size:.7rem;color:rgba(198,166,66,.7);margin-top:.5rem">${escapeText(n.time||formatUKTime(n.createdAt)||'Now')}</div></div>${!n.read?`<span style="width:.6rem;height:.6rem;border-radius:999px;background:var(--blue);flex-shrink:0;margin-top:.35rem;display:inline-block"></span>`:`<i class="fa-solid fa-chevron-right" style="color:rgba(255,255,255,.2);margin-top:.35rem"></i>`}</div></button>`).join('')||`<div style="text-align:center;padding:2rem;color:rgba(198,166,66,.5)">No Notifications.</div>`}</div>`;
}
function setNotificationFilter(f){ activeNotificationsFilter=f; renderNotifications(); }
function openNotification(id){ const n=derivedNotifications().find(x=>x.id===id); if(!n)return; const stored=state.notifications.find(x=>x.id===id); if(stored)stored.read=true; if(n.panel)activeProtocolPanel=n.panel; saveState(); navigateToTab(n.tab||'dashboard'); }
function markAllNotificationsRead(){ state.notifications=ensureArray(state.notifications).map(n=>({...n,read:true})); saveState(); renderNotifications(); updateHeader(); }

/* ── Sub Profile modal ── */
function showProfileModal(){
  const isDom=state.currentRole==='dom', m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;max-height:92vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="display:flex;justify-content:space-between;margin-bottom:1.25rem"><div><div style="font-size:.65rem;letter-spacing:3px;color:var(--gold)">SUB PROFILE</div><div class="heading-serif" style="font-size:2.25rem;margin-top:.2rem">${escapeText(state.subProfile.name||state.subTitle)}</div><div style="font-size:.8rem;color:var(--stone);margin-top:.2rem">Visible to sub. Editable by Dom only.</div></div><button onclick="this.closest('.fixed').remove()" style="font-size:1.5rem;color:var(--stone)">×</button></div><div class="card" style="padding:1.25rem"><div style="display:flex;gap:1rem"><img src="${escapeText(state.subProfile.photo||DEFAULT_PHOTO)}" style="width:7rem;height:8.5rem;object-fit:cover;border-radius:1.5rem;filter:grayscale(1)" alt="Sub profile"><div><div class="heading-serif" style="font-size:1.5rem">${escapeText(state.subProfile.name||state.subTitle)}</div><div style="font-size:.8rem;color:var(--sage)">${escapeText(state.subProfile.role||'Submissive')}</div><div style="font-size:.8rem;color:var(--gold);margin-top:.4rem">Dominant: ${escapeText(state.subProfile.dominant||state.domTitle)}</div><span class="pill" style="display:inline-flex;align-items:center;gap:.3rem;font-size:.7rem;padding:.3rem .7rem;margin-top:.6rem"><i class="fa-solid fa-lock"></i>${isDom?'Dom edit enabled':'Read only'}</span></div></div></div><div class="card" style="padding:1.25rem;margin-top:.85rem"><div style="font-weight:600;margin-bottom:.85rem">Measurements</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">${measurementRows().map(([k,v])=>`<div class="subtle-card" style="padding:.65rem"><div style="font-size:.6rem;color:var(--stone);text-transform:uppercase">${k}</div><div style="font-size:.85rem;font-weight:600;margin-top:.2rem">${escapeText(v||'—')}</div></div>`).join('')}</div></div><div style="display:flex;gap:.75rem;margin-top:1.25rem">${isDom?`<button onclick="showEditSubProfileModal()" style="flex:1;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Edit Profile</button>`:''}<button onclick="this.closest('.fixed').remove(); activeProtocolPanel='records'; navigateToTab('protocols')" style="flex:1;padding:.85rem;background:rgba(255,255,255,.08);border-radius:1rem">Open Records</button></div></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function showEditSubProfileModal(){
  const p=state.subProfile, m=p.measurements, a=p.anatomy, modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[220] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:38rem;max-height:94vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="display:flex;justify-content:space-between;margin-bottom:1.25rem"><div style="font-size:1.25rem;font-weight:600">Edit Sub Profile</div><button onclick="this.closest('.fixed').remove()" style="font-size:1.5rem;color:var(--stone)">×</button></div><div style="display:flex;flex-direction:column;gap:.75rem"><input id="sub-name" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" value="${escapeText(p.name||'')}" placeholder="Name"><input id="sub-photo" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" value="${escapeText(p.photo||'')}" placeholder="Photo URL"><div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem">${Object.entries(m).map(([key,val])=>`<label style="font-size:.65rem;color:rgba(198,166,66,.7);text-transform:uppercase;letter-spacing:1px">${key.replace(/[A-Z]/g,' $&')}<input data-measure="${key}" class="beautiful-input" style="width:100%;padding:.7rem .85rem;border-radius:.85rem;margin-top:.2rem;display:block" value="${escapeText(val||'')}"></label>`).join('')}</div><div style="font-size:.65rem;color:var(--gold);letter-spacing:3px;margin-top:.5rem">PERSONAL RECORDS</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem">${Object.entries(a).map(([key,val])=>`<label style="font-size:.65rem;color:rgba(198,166,66,.7);text-transform:uppercase;letter-spacing:1px">${key.replace(/[A-Z]/g,' $&')}<input data-anatomy="${key}" class="beautiful-input" style="width:100%;padding:.7rem .85rem;border-radius:.85rem;margin-top:.2rem;display:block" value="${escapeText(val||'')}"></label>`).join('')}</div></div><button onclick="saveSubProfileEditor(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Save Profile</button></div></div>`;
  document.getElementById('modal-container').appendChild(modal);
}
function saveSubProfileEditor(button){ state.subProfile.name=document.getElementById('sub-name').value.trim()||state.subProfile.name; state.subTitle=state.subProfile.name; state.subProfile.photo=document.getElementById('sub-photo').value.trim()||DEFAULT_PHOTO; document.querySelectorAll('[data-measure]').forEach(el=>state.subProfile.measurements[el.dataset.measure]=el.value.trim()); document.querySelectorAll('[data-anatomy]').forEach(el=>state.subProfile.anatomy[el.dataset.anatomy]=el.value.trim()); addNotification('profile','Profile updated','Sub profile records were changed.','protocols'); saveState(); button.closest('.fixed').remove(); document.querySelectorAll('.fixed').forEach(m=>m.remove()); updateHeader(); activeProtocolPanel='records'; navigateToTab('protocols'); }

/* ── Limits & Rules ── */
function showAddLimitModal(){ const m=document.createElement('div'); m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:28rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1.25rem">Add Boundary Or Preference</div><select id="limit-category" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-bottom:.75rem">${LIMIT_GROUPS.map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select><input id="limit-text" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" placeholder="Describe It"><button onclick="addLimit(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Add</button></div></div>`; document.getElementById('modal-container').appendChild(m); }
function addLimit(button){ const cat=document.getElementById('limit-category').value, text=titleCase(document.getElementById('limit-text').value||''); if(!text)return alert('Please describe it.'); if(!Array.isArray(state.limits[cat]))state.limits[cat]=[]; state.limits[cat].push(text); saveState(); button.closest('.fixed').remove(); renderProtocols(); }
function editSection(section){ const labels=Object.fromEntries(RULE_SECTIONS.map(([k,l])=>[k,l])); const m=document.createElement('div'); m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1.25rem">Edit ${labels[section]||section}</div><textarea id="section-editor" rows="10" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none"></textarea><button onclick="saveSection('${section}',this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Save Changes</button></div></div>`; document.getElementById('modal-container').appendChild(m); document.getElementById('section-editor').value=state.rules[section]||''; }
function saveSection(section,button){ state.rules[section]=document.getElementById('section-editor').value.trim(); saveState(); button.closest('.fixed').remove(); renderProtocols(); }

/* ── Settings ── */
function showSettings(){ navigateToTab('settings'); }
function renderSettings(){
  const tab=document.getElementById('tab-settings'); if(!tab)return;
  tab.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem"><div><div class="heading-serif" style="font-size:2.5rem">Settings</div><div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">Data, reset and app controls.</div></div><button onclick="switchRole()" class="pill tap" style="font-size:.72rem;padding:.4rem .85rem">Lock</button></div><section class="card" style="padding:1.25rem;margin-bottom:1.25rem"><div style="font-weight:600;font-size:1.1rem;margin-bottom:.85rem">Data Management</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem"><button onclick="exportSystemBackup()" class="subtle-card tap" style="padding:1rem;text-align:left;display:block;cursor:pointer"><i class="fa-solid fa-download" style="color:var(--gold)"></i><div style="font-weight:600;margin-top:.5rem;font-size:.9rem">Export Backup</div><div style="font-size:.75rem;color:var(--stone)">JSON download</div></button><label class="subtle-card tap" style="padding:1rem;text-align:left;display:block;cursor:pointer"><i class="fa-solid fa-upload" style="color:var(--blue)"></i><div style="font-weight:600;margin-top:.5rem;font-size:.9rem">Restore Backup</div><div style="font-size:.75rem;color:var(--stone)">Import JSON</div><input type="file" accept="application/json" style="display:none" onchange="restoreSystemBackup(this)"></label></div></section><section class="card" style="padding:1.25rem;margin-bottom:1.25rem"><div style="font-weight:600;font-size:1.1rem;margin-bottom:.85rem">Reset From Scratch</div><div style="display:flex;flex-direction:column;gap:.5rem">${[['demo','Reset demo data'],['profile','Reset profile'],['protocols','Reset protocols'],['tasks','Reset tasks'],['rewards','Reset rewards'],['notifications','Reset notifications'],['local','Clear local device cache']].map(([key,label])=>`<button onclick="resetSection('${key}')" class="tap" style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:rgba(255,255,255,.05);border-radius:1rem;text-align:left"><span>${label}</span><i class="fa-solid fa-rotate-left" style="color:var(--stone)"></i></button>`).join('')}</div></section><section class="card" style="padding:1.25rem;border:1px solid rgba(143,17,24,.4)"><div style="font-weight:600;font-size:1.1rem;color:var(--red);margin-bottom:.5rem">Danger Zone</div><div style="font-size:.85rem;color:var(--stone);margin-bottom:1rem">This backs up the current system locally, then resets all shared app data. Requires typed confirmation.</div><button onclick="resetEverything()" style="width:100%;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Reset Everything</button></section>`;
}
function exportSystemBackup(){ const blob=new Blob([safeJson(state)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='the-system-backup-'+new Date().toISOString().slice(0,10)+'.json'; a.click(); URL.revokeObjectURL(url); }
function restoreSystemBackup(input){ const file=input.files&&input.files[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{ try{ const next=JSON.parse(reader.result); state={...defaultSystemState(state.currentRole),...next,currentRole:state.currentRole}; migrateEnhancedState(); saveState(); showToast('Backup Restored','success'); navigateToTab('dashboard'); }catch(err){ alert('Backup file is not valid JSON.'); } }; reader.readAsText(file); }
function backupBeforeReset(){ localStorage.setItem('the_system_backup_before_reset_'+Date.now(),JSON.stringify(state)); }
function resetSection(section){
  if(!confirm('Reset '+section+'?'))return; backupBeforeReset(); const fresh=defaultSystemState(state.currentRole);
  if(section==='demo'){ state.tasks=fresh.tasks; state.punishments=fresh.punishments; state.starLog=fresh.starLog; state.stars=fresh.stars; state.activityLog=fresh.activityLog; }
  if(section==='profile'){ state.subProfile=fresh.subProfile; state.subTitle=fresh.subTitle; }
  if(section==='protocols'){ state.rules=fresh.rules; state.limits=fresh.limits; state.bodyMaps=fresh.bodyMaps; state.personalRecords=fresh.personalRecords; }
  if(section==='tasks'){ state.tasks=[]; state.evidence=[]; }
  if(section==='rewards'){ state.stars=0; state.starLog=[]; state.badges=[]; }
  if(section==='notifications'){ state.notifications=[]; }
  if(section==='local'){ localStorage.removeItem('the_system_v4'); location.reload(); return; }
  saveState(); showToast('Reset Complete','success'); renderSettings();
}
function resetEverything(){ const typed=prompt('Type RESET THE SYSTEM to reset everything from scratch.'); if(typed!=='RESET THE SYSTEM')return; backupBeforeReset(); const role=state.currentRole; state=defaultSystemState(role); migrateEnhancedState(); saveState(); showToast('System Reset','success'); navigateToTab('dashboard'); }

/* ── Role / lock ── */
function switchRole(){ document.getElementById('main-app').style.display='none'; document.getElementById('login-screen').style.display='flex'; buildKeypad(); }

/* ── Confetti ── */
function showConfetti(count){ const colors=['#8f1118','#315b7a','#8faf97','#c6a642']; count=count||40; for(let i=0;i<count;i++){ const c=document.createElement('div'); c.className='confetti'; c.style.left=Math.random()*window.innerWidth+'px'; c.style.background=colors[Math.floor(Math.random()*colors.length)]; document.body.appendChild(c); setTimeout(()=>c.remove(),1300); } }

/* ── Boot ── */
function enhancedInitialize(){
  /* Load saved state then migrate */
  loadState();
  migrateEnhancedState();
  /* Patch HTML structure */
  installScreens();
  installNavigation();
  buildKeypad();
  updateRoleUI();
  /* Kick Firebase (original connectFirestore is in index.html inline script) */
  try{ connectFirestore(); }catch(e){ console.warn('Firebase skipped',e); }
  /* Countdown ticker */
  clearInterval(countdownTimer);
  countdownTimer=setInterval(function(){ if(!state)return; activePunishments(); updateCountdowns(); },1000);
  /* Start on dashboard */
  navigateToTab('dashboard');
}

/* Override window.onload — runs after everything in the page is ready */
window.onload=enhancedInitialize;
