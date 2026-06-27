/* The System v5 redesign overlay. Drop-in replacement for app-enhancements.js. */
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
const capturedEvidence = new Map();
let activeCapture = null;
let journalCapture = null;
let countdownTimer = null;
let activeProtocolPanel = 'rules';
let activeNotificationsFilter = 'all';

function titleCase(value='') { return String(value).trim().toLowerCase().replace(/\b([a-z])/g, letter => letter.toUpperCase()); }
function escapeText(value='') { const node = document.createElement('div'); node.textContent = value == null ? '' : String(value); return node.innerHTML; }
function appNow(){ return new Date(); }
function ensureArray(value){ return Array.isArray(value) ? value : []; }
function safeJson(value){ try { return JSON.stringify(value, null, 2); } catch(_) { return '{}'; } }
function showToast(message,type='info'){
  const toast=document.createElement('div');
  toast.className=`fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-2xl text-sm ${type==='error'?'bg-red-900':type==='success'?'bg-emerald-900':'bg-[#202020]'}`;
  toast.textContent=message; document.body.appendChild(toast); setTimeout(()=>toast.remove(),3200);
}

function defaultSystemState(role='dom'){
  const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
  return {
    dynamicName:'The System', domTitle:'Sir', subTitle:'James', currentRole:role, avatar:DEFAULT_PHOTO,
    stars:8, starLog:[{id:1,date:new Date().toISOString(),reason:'Initial system setup',amount:8}],
    tasks:[{id:101,title:'Morning Meditation + Gratitude',desc:"10 minutes + write 3 things you're grateful for",due:tomorrow,dueAt:`${tomorrow}T23:59:00`,status:'pending',priority:2,requiredEvidence:['text'],assignedAt:new Date().toISOString(),evidence:[]}],
    punishments:[{id:201,title:'TikTok Ban',desc:'Restricted app access until the timer completes.',kind:'timed',due:tomorrow,dueAt:`${tomorrow}T23:59:00`,status:'active',assignedAt:new Date().toISOString()}],
    journal:[], evidence:[], activityLog:[{id:1,type:'dom',message:'Welcome to The System. Your first task is waiting.',time:'now'}],
    limits:{hard:['Chems'],supplements:['Public protocol'],tries:['Timed focus'],likes:['Praise','Clear instructions'],loves:['Calm voice','Aftercare']},
    rules:{
      arrivalProcedure:'1. Text when 10 minutes away.\n2. Remove shoes at the door.\n3. Wait in the entryway until greeted.\n4. Offer collar.',
      houseRules:'1. Always address me as Sir.\n2. Daily good morning and good night messages required.\n3. Permission rules apply during protocol time.',
      protocols:'1. Tasks must be acknowledged.\n2. Evidence must be submitted when requested.\n3. Reviews are handled by Sir.',
      consequences:'1. Minor: extra tasks or written reflection.\n2. Moderate: temporary loss of privilege.\n3. Severe: review and reset.',
      communication:'1. Speak clearly.\n2. Ask when unsure.\n3. Log meaningful changes.',
      outOfSession:'1. Boundaries remain active.\n2. Check-ins remain private.\n3. No public assumptions.'
    },
    notifications:[], disclosures:[], checkIns:[], badges:[], dataVersion:5,
    subProfile: defaultSubProfile(), bodyMaps: defaultBodyMaps(), personalRecords: defaultPersonalRecords(), appSettings:{reduceMotion:false}
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
  const electroLabels=['Left Nipple','Right Nipple','Upper Abdomen','Mid Abdomen','Lower Abdomen','Inner Thigh','Genital Area','Anal S','Anal M','Anal L','Urethral Sound','Loops','Violet Wand'];
  return {
    breath:{longestHold:'',rebreathe3L:'',rebreathe5L:'',rebreathe6L:'',bubbleBottleLarge:'',bubbleBottleSmall:'',resistanceMaximum:''},
    electro:Object.fromEntries(electroLabels.map((label,i)=>[label,{min:8+i,max:65+i,pleasureStart:22+i,pleasureEnd:46+i}]))
  };
}
function migrateEnhancedState(){
  state = {...defaultSystemState(state?.currentRole || 'dom'), ...(state || {})};
  if (state.subTitle === 'Jacob') state.subTitle = 'James';
  state.dataVersion = 5;
  state.badges = ensureArray(state.badges);
  state.disclosures = ensureArray(state.disclosures);
  state.checkIns = ensureArray(state.checkIns);
  state.notifications = ensureArray(state.notifications);
  state.tasks = ensureArray(state.tasks).map(task => ({...task,title:titleCase(task.title),evidence:ensureArray(task.evidence)}));
  state.punishments = ensureArray(state.punishments).map(item => ({...item,title:titleCase(item.title),kind:item.kind||'timed'}));
  state.journal = ensureArray(state.journal).map(entry => ({...entry,title:titleCase(entry.title),attachments:ensureArray(entry.attachments)}));
  state.limits = {...defaultSystemState().limits, ...(state.limits || {})};
  state.rules = {...defaultSystemState().rules, ...(state.rules || {})};
  state.subProfile = {...defaultSubProfile(), ...(state.subProfile || {})};
  state.subProfile.measurements = {...defaultSubProfile().measurements, ...(state.subProfile.measurements || {})};
  state.subProfile.anatomy = {...defaultSubProfile().anatomy, ...(state.subProfile.anatomy || {})};
  state.bodyMaps = {...defaultBodyMaps(), ...(state.bodyMaps || {})};
  state.personalRecords = {...defaultPersonalRecords(), ...(state.personalRecords || {})};
  state.personalRecords.breath = {...defaultPersonalRecords().breath, ...(state.personalRecords.breath || {})};
  state.personalRecords.electro = {...defaultPersonalRecords().electro, ...(state.personalRecords.electro || {})};
}

function buildKeypad(){
  const screen=document.getElementById('login-screen');
  document.getElementById('bottom-navigation')?.classList.add('hidden');
  screen.className='fixed inset-0 z-50 flex items-center justify-center elegant-dark lux-bg';
  screen.innerHTML=`<div class="max-w-sm w-full px-7 text-center">
    <div class="logo-orb inline-flex items-center justify-center w-24 h-24 rounded-[2rem] mb-6"><i class="fa-solid fa-infinity text-white text-6xl"></i></div>
    <h1 class="text-6xl heading-serif">The System</h1>
    <p class="text-[var(--gold)] mt-2 tracking-[3px] text-sm">PRIVATE ACCESS</p>
    <div id="pin-dots" class="flex justify-center gap-4 my-8">${[0,1,2,3].map(()=>'<span class="pin-dot w-4 h-4 rounded-full border border-[var(--gold)]/60"></span>').join('')}</div>
    <p id="login-error" class="text-red-400 text-sm h-6"></p>
    <div class="grid grid-cols-3 gap-3">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="tap keypad-key aspect-[1.35] flex items-center justify-center text-2xl rounded-2xl bg-white/10" onclick="keypadPress('${n}')">${n}</button>`).join('')}<button class="tap keypad-key aspect-[1.35] flex items-center justify-center text-sm rounded-2xl bg-white/10" onclick="keypadClear()">Clear</button><button class="tap keypad-key aspect-[1.35] flex items-center justify-center text-2xl rounded-2xl bg-white/10" onclick="keypadPress('0')">0</button><button class="tap keypad-key aspect-[1.35] flex items-center justify-center text-xl rounded-2xl bg-white/10" onclick="keypadBack()"><i class="fa-solid fa-delete-left"></i></button></div>
    <button onclick="showInstallGuide()" class="mt-7 text-xs text-[var(--gold)]/70 underline">Install Help</button>
  </div>`;
  window.currentPin=''; updatePinDots();
}
function keypadPress(digit){ if((window.currentPin||'').length>=4)return; window.currentPin=(window.currentPin||'')+digit; updatePinDots(); if(window.currentPin.length===4)setTimeout(attemptLogin,140); }
function keypadClear(){ window.currentPin=''; updatePinDots(); const err=document.getElementById('login-error'); if(err)err.textContent=''; }
function keypadBack(){ window.currentPin=(window.currentPin||'').slice(0,-1); updatePinDots(); }
function updatePinDots(){ document.querySelectorAll('#pin-dots span').forEach((dot,i)=>dot.classList.toggle('filled',i<(window.currentPin||'').length)); }
function attemptLogin(){
  const input=window.currentPin || document.getElementById('passcode-input')?.value?.trim() || '';
  const role=input==='0000'?'dom':input==='1111'?'sub':null;
  if(!role){ const err=document.getElementById('login-error'); if(err)err.textContent='Incorrect code'; window.currentPin=''; updatePinDots(); return; }
  state.currentRole=role; localStorage.setItem('the_system_v4',JSON.stringify(state));
  document.getElementById('login-screen').classList.add('hidden'); document.getElementById('main-app').classList.remove('hidden'); document.getElementById('bottom-navigation')?.classList.remove('hidden');
  updateRoleUI(); navigateToTab(new URLSearchParams(location.search).get('tab') || 'dashboard');
  try { enablePushNotifications(); } catch(error) { console.warn(error); }
}

function installNavigation(){
  const nav=document.getElementById('bottom-navigation'); if(!nav)return;
  nav.innerHTML=`<div class="max-w-3xl mx-auto grid grid-cols-5 text-center text-xs safe-bottom pt-1">${NAV_ITEMS.map(([tab,label,icon])=>`<button onclick="navigateToTab('${tab}')" class="nav-item tap py-2 cursor-pointer" data-tab="${tab}"><span class="nav-icon"><i class="fa-solid ${icon} text-lg"></i></span><div class="text-[10px]">${label}</div></button>`).join('')}</div>`;
}
function installScreens(){
  const host=document.querySelector('#main-app .max-w-3xl'); if(!host)return;
  if(!document.getElementById('tab-protocols')) host.insertAdjacentHTML('beforeend',`<div id="tab-protocols" class="tab-content hidden"></div>`);
  if(!document.getElementById('tab-notifications')) host.insertAdjacentHTML('beforeend',`<div id="tab-notifications" class="tab-content hidden"></div>`);
  if(!document.getElementById('tab-settings')) host.insertAdjacentHTML('beforeend',`<div id="tab-settings" class="tab-content hidden"></div>`);
}
function updateHeader(){
  const isDom=state.currentRole==='dom';
  const nameEl=document.getElementById('header-name'); if(nameEl) nameEl.textContent=isDom ? state.domTitle : state.subTitle;
  const role=document.getElementById('header-role'); if(role){ role.textContent=isDom?'Dominant':'Submissive'; role.style.color=isDom?'var(--red)':'var(--sage)'; }
  const avatar=document.getElementById('header-avatar'); if(avatar) avatar.src=isDom ? (state.avatar || DEFAULT_PHOTO) : (state.subProfile?.photo || DEFAULT_PHOTO);
  const headerButtons=document.querySelector('.app-header .flex.items-center.gap-x-2:last-child');
  if(headerButtons){
    headerButtons.innerHTML=`<span class="pill px-3 py-2 text-[10px] hide-tiny"><span class="inline-block w-2 h-2 rounded-full bg-[var(--sage)] mr-1"></span>Connected</span>
    <button onclick="navigateToTab('notifications')" class="relative tap w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-[var(--gold)]"><i class="fa-solid fa-bell"></i>${unreadNotifications().length?`<span class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--red)] text-white text-[10px] flex items-center justify-center">${unreadNotifications().length}</span>`:''}</button>
    <button onclick="showSettings()" class="tap w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-[var(--ivory)]"><i class="fa-solid fa-bars"></i></button>`;
  }
}
function updateRoleUI(){
  const isDom=state.currentRole==='dom';
  document.querySelectorAll('.dom-only').forEach(el=>el.style.display=isDom?'':'none');
  document.querySelectorAll('.sub-only').forEach(el=>el.style.display=isDom?'none':'');
  updateHeader();
}
function navigateToTab(tab){
  if(tab==='limits'||tab==='rules'||tab==='punishments'){ activeProtocolPanel=tab==='limits'?'boundaries':tab==='rules'?'rules':'consequences'; tab='protocols'; }
  document.querySelectorAll('.tab-content').forEach(el=>el.classList.add('hidden'));
  const panel=document.getElementById(`tab-${tab}`) || document.getElementById('tab-dashboard'); panel?.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(el=>{el.classList.remove('nav-active','font-semibold'); if(el.dataset.tab===tab)el.classList.add('nav-active','font-semibold');});
  renderCurrentTab();
}
function renderCurrentTab(){
  const active=document.querySelector('.tab-content:not(.hidden)'); if(!active)return;
  const tab=active.id.replace('tab-','');
  switch(tab){
    case 'dashboard': renderDashboard(); break;
    case 'tasks': renderTasks(); break;
    case 'protocols': renderProtocols(); break;
    case 'journal': renderJournal(); break;
    case 'stars': renderRewards(); break;
    case 'notifications': renderNotifications(); break;
    case 'settings': renderSettings(); break;
    case 'evidence': renderEvidence?.(); break;
  }
  updateHeader();
}

function greetingForNow(){const h=new Date().getHours();return h<12?'GOOD MORNING,':h<18?'GOOD AFTERNOON,':'GOOD EVENING,';}
function formatUKDate(value){ if(!value)return ''; const d=new Date(value); if(Number.isNaN(d.getTime()))return String(value); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
function formatUKTime(value=new Date()){ const d=new Date(value); if(Number.isNaN(d.getTime()))return ''; return d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); }
function dueDateFor(item){ if(!item)return null; if(item.dueAt)return new Date(item.dueAt); if(!item.due)return null; const d=new Date(`${item.due}T23:59:59`); return Number.isNaN(d.getTime())?null:d; }
function getTimeLeft(value){
  const due=typeof value==='object'?dueDateFor(value):dueDateFor({due:value}); if(!due)return{text:'No deadline',color:'text-[var(--stone)]',pct:0};
  const diff=due-Date.now(); if(diff<=0)return{text:'Overdue',color:'text-red-400',pct:100};
  const d=Math.floor(diff/86400000),h=Math.floor(diff%86400000/3600000),m=Math.floor(diff%3600000/60000),s=Math.floor(diff%60000/1000);
  return{text:d?`${d}d ${h}h ${m}m`:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,color:d<1?'text-amber-400':'text-emerald-400',pct:Math.max(8,Math.min(95,100-(diff/86400000*100)))};
}
function calculateJournalStreak(){ return ensureArray(state.journal).length ? Math.min(99, ensureArray(state.journal).length) : 0; }
function activePunishments(){
  let changed=false;
  ensureArray(state.punishments).forEach(p=>{ if(p.status==='active'&&p.kind==='timed'&&dueDateFor(p)&&dueDateFor(p)<=new Date()){p.status='completed';p.completedAt=new Date().toISOString();changed=true;} });
  if(changed) saveState(); return ensureArray(state.punishments).filter(p=>p.status==='active');
}
function updateCountdowns(){ document.querySelectorAll('[data-countdown]').forEach(el=>{const p=state.punishments.find(x=>String(x.id)===String(el.dataset.countdown)); if(p) el.textContent=getTimeLeft(p).text;}); }
function checkActivePunishmentBanner(){
  const banner=document.getElementById('active-punishment-banner'),active=activePunishments()[0]; if(!banner)return;
  if(state.currentRole!=='sub'||!active){banner.classList.add('hidden');return;} banner.classList.remove('hidden');
  document.getElementById('punish-banner-title').textContent=active.title; document.getElementById('punish-banner-countdown').dataset.countdown=active.id; updateCountdowns();
}
function renderDashboard(){
  const isDom=state.currentRole==='dom';
  document.getElementById('dash-period') && (document.getElementById('dash-period').textContent=greetingForNow());
  document.getElementById('dash-greeting') && (document.getElementById('dash-greeting').textContent=isDom?state.domTitle:state.subTitle);
  document.getElementById('dash-star-count') && (document.getElementById('dash-star-count').textContent=state.stars||0);
  document.getElementById('dash-tasks-done') && (document.getElementById('dash-tasks-done').textContent=state.tasks.filter(t=>t.status==='completed').length);
  document.getElementById('dash-tasks-total') && (document.getElementById('dash-tasks-total').textContent=state.tasks.length);
  document.getElementById('dash-journal-streak') && (document.getElementById('dash-journal-streak').textContent=calculateJournalStreak());
  document.getElementById('dash-active-punish') && (document.getElementById('dash-active-punish').textContent=activePunishments().length);
  checkActivePunishmentBanner();
  const feed=document.getElementById('activity-feed');
  if(feed){
    const recent=derivedNotifications().slice(0,5);
    feed.innerHTML=recent.map(n=>`<button onclick="openNotification('${n.id}')" class="w-full text-left glass px-4 py-3 rounded-2xl border-l-4 ${n.colourBorder}"><div class="text-sm font-medium">${escapeText(n.title)}</div><div class="text-xs text-[var(--stone)]">${escapeText(n.body)}</div></button>`).join('')||'<div class="text-sm text-[var(--gold)]/60 px-3">No Recent Activity Yet.</div>';
  }
  const today=document.getElementById('dash-today-tasks');
  if(today) today.innerHTML=state.tasks.filter(t=>t.status==='pending').slice(0,4).map(t=>`<button onclick="showTaskDetailById(${t.id})" class="w-full text-left glass rounded-2xl px-4 py-3 tap"><div class="font-medium">${escapeText(titleCase(t.title))}</div><div class="text-xs ${getTimeLeft(t).color}">${getTimeLeft(t).text}</div></button>`).join('')||'<div class="text-sm text-[var(--gold)]/60">Nothing Pending.</div>';
  updateCountdowns();
}

function renderTasks(){
  const list=document.getElementById('tasks-list'); if(!list)return;
  const tasks=state.tasks.filter(t=>t.status==='pending');
  list.innerHTML=tasks.length?tasks.map(t=>`<button onclick="showTaskDetailById(${t.id})" class="w-full text-left card p-5 tap"><div class="flex justify-between gap-4"><div><div class="font-semibold text-lg">${escapeText(titleCase(t.title))}</div><div class="text-sm text-[var(--stone)] mt-1">${escapeText(t.desc||'')}</div><div class="text-xs ${getTimeLeft(t).color} mt-3"><i class="fa-regular fa-clock"></i> ${getTimeLeft(t).text}</div><div class="text-xs text-[var(--gold)]/70 mt-2">Proof: ${(t.requiredEvidence||[]).map(titleCase).join(', ')||'None'}</div></div><i class="fa-solid fa-chevron-right text-[var(--gold)]/50 mt-2"></i></div></button>`).join(''):'<div class="text-center py-8 text-[var(--gold)]/50">No Pending Tasks.</div>';
}
function showTaskDetailById(taskId){ const task=state.tasks.find(item=>String(item.id)===String(taskId)); if(task) showTaskDetail(task); }
function evidenceInput(type,task){
  if(type==='text') return `<label class="block"><span class="text-xs text-[var(--gold)]/70">TEXT REPORT</span><textarea id="evidence-text" rows="4" class="w-full px-4 py-3 rounded-2xl mt-1" placeholder="Write Your Report..."></textarea></label>`;
  const label=titleCase(type==='voice'?'Voice Note':type); return `<label class="block"><span class="text-xs text-[var(--gold)]/70">${label.toUpperCase()}</span><input id="evidence-${type}" type="file" accept="${type==='photo'?'image/*':type==='video'?'video/*':type==='voice'?'audio/*':'*/*'}" class="w-full px-4 py-3 rounded-2xl mt-1 text-sm"></label>`;
}
function renderSubmittedEvidence(task){ const items=task.evidence||[]; if(!items.length)return '<div class="text-sm opacity-60">No Evidence Submitted.</div>'; return items.map(item=>item.type==='text'?`<div class="glass rounded-2xl p-4"><div class="text-xs text-[var(--gold)]/70 mb-1">TEXT REPORT</div><div class="text-sm whitespace-pre-wrap">${escapeText(item.value)}</div></div>`:`<a href="${item.url}" target="_blank" rel="noopener" class="glass rounded-2xl p-4 flex items-center justify-between"><span><i class="fa-solid fa-paperclip mr-2"></i>${escapeText(item.name||item.type)}</span><i class="fa-solid fa-arrow-up-right-from-square text-[var(--gold)]"></i></a>`).join(''); }
function showTaskDetail(task){
  const isSub=state.currentRole==='sub', required=task.requiredEvidence||[]; const modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-lg max-h-[92vh] overflow-auto rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="flex justify-between gap-4"><div><div class="text-2xl font-semibold">${escapeText(titleCase(task.title))}</div><div class="text-xs text-[var(--gold)]/70 mt-1">${formatUKDate(dueDateFor(task))} at ${formatUKTime(dueDateFor(task))}</div></div><button onclick="this.closest('.fixed').remove()" class="text-2xl">×</button></div><div class="rich-prose text-sm my-5">${escapeText(task.desc||'No Additional Instructions.')}</div>${task.status==='completed'?`<div class="space-y-3"><div class="text-xs text-emerald-400 tracking-widest">COMPLETED</div>${renderSubmittedEvidence(task)}</div>`:isSub?`<div class="space-y-3">${required.map(type=>evidenceInput(type,task)).join('')||'<div class="text-sm opacity-60">No Evidence Required.</div>'}</div><button onclick="submitTaskEvidence(${task.id},this)" class="w-full mt-6 py-3 bg-emerald-900 rounded-2xl">Submit & Complete</button>`:'<div class="text-sm text-[var(--gold)]/70">Waiting for completion.</div>'}</div></div>`;
  document.getElementById('modal-container').appendChild(modal);
}
async function submitTaskEvidence(taskId,button){
  const task=state.tasks.find(t=>String(t.id)===String(taskId)); if(!task)return; const required=task.requiredEvidence||[], text=document.getElementById('evidence-text')?.value.trim();
  if(required.includes('text')&&!text)return alert('Please complete the text report.'); button.disabled=true; const items=[]; if(text)items.push({type:'text',value:text});
  try{
    for(const type of required.filter(t=>t!=='text')){ const file=document.getElementById(`evidence-${type}`)?.files?.[0]; if(!file)return alert(`Please add the required ${titleCase(type)}.`); const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'); const ref=evidenceStorage.ref(`evidence/${taskId}/${Date.now()}-${safeName}`); button.textContent=`Uploading ${titleCase(type)}…`; const url=await uploadEvidenceFile(ref,file,button); items.push({type,name:file.name,url,size:file.size}); }
    task.evidence=items; task.report=text||''; state.evidence.unshift({id:Date.now(),taskId,title:task.title,date:new Date().toISOString(),items}); button.textContent='Saving Completion…'; await completeTask(taskId); button.closest('.fixed').remove();
  }catch(error){ console.error(error); button.disabled=false; button.textContent='Submit & Complete'; alert('Submission failed. Please check your connection and try again.'); }
}
async function completeTask(taskId){
  const task=state.tasks.find(t=>String(t.id)===String(taskId)); if(!task)return; const backup=JSON.stringify(state); task.status='completed'; task.completedAt=new Date().toISOString(); task.completedDate=task.completedAt.slice(0,10); const earned=task.priority||1; state.stars=(state.stars||0)+earned; state.starLog.unshift({id:Date.now(),date:task.completedDate,reason:`Completed: ${task.title}`,amount:earned}); state.punishments.forEach(p=>{if(p.status==='active'&&String(p.linkedTaskId)===String(taskId)){p.status='completed';p.completedAt=task.completedAt;}}); state.activityLog.unshift({id:Date.now(),type:'sub',entityType:'task',entityId:task.id,message:`Completed: ${task.title}`,time:formatUKTime()}); addNotification('review','Proof submitted',`${task.title} is awaiting review.`,'tasks'); localStorage.setItem('the_system_v4',JSON.stringify(state)); try{ await sharedStateDocument.set(getSharedState()); showConfetti(35); renderDashboard(); renderTasks(); }catch(error){ state=JSON.parse(backup); localStorage.setItem('the_system_v4',backup); throw error; }
}
function uploadEvidenceFile(reference,file,button){ return new Promise((resolve,reject)=>{ const upload=reference.put(file,{contentType:file.type}); upload.on('state_changed', snapshot=>{ const percent=snapshot.totalBytes?Math.round(snapshot.bytesTransferred/snapshot.totalBytes*100):0; button.textContent=`Uploading ${file.name} · ${percent}%`; }, reject, async()=>{ try{ resolve(await reference.getDownloadURL()); }catch(error){ reject(error); } }); }); }
function showAddTaskModal(){
  const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10), modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-lg max-h-[92vh] overflow-auto rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="text-xl font-semibold mb-5">Assign Task</div><div class="space-y-4"><input id="task-title" class="w-full px-4 py-3 rounded-2xl" placeholder="Task Title"><textarea id="task-desc" rows="3" class="w-full px-4 py-3 rounded-2xl" placeholder="Instructions"></textarea><div class="grid grid-cols-2 gap-3"><label class="text-xs text-[var(--gold)]/70">DUE DATE<input id="task-due" type="date" value="${tomorrow}" class="w-full px-3 py-3 rounded-2xl mt-1"></label><label class="text-xs text-[var(--gold)]/70">TIME<input id="task-time" type="time" class="w-full px-3 py-3 rounded-2xl mt-1"></label></div><select id="task-cat" class="w-full px-4 py-3 rounded-2xl"><option>Service</option><option>Chore</option><option>Personal</option><option>Consequence Task</option></select><div><div class="text-xs text-[var(--gold)]/70 mb-2">REQUIRED PROOF</div><div class="grid grid-cols-2 gap-2">${[['photo','Photo'],['video','Video'],['voice','Voice Note'],['text','Text Report']].map(([id,label])=>`<label class="bg-white/5 p-3 rounded-2xl text-sm"><input type="checkbox" id="ev-${id}" class="accent-[var(--red)] mr-2">${label}</label>`).join('')}</div></div></div><div class="flex gap-3 mt-6"><button onclick="this.closest('.fixed').remove()" class="flex-1 py-3 border border-white/20 rounded-2xl">Cancel</button><button onclick="addNewTask(this)" class="flex-1 py-3 bg-[var(--red)] rounded-2xl">Assign</button></div></div></div>`;
  document.getElementById('modal-container').appendChild(modal);
}
function addNewTask(button){
  const title=titleCase(document.getElementById('task-title').value||'Untitled Task'), date=document.getElementById('task-due').value, time=document.getElementById('task-time').value;
  const required=['photo','video','voice','text'].filter(type=>document.getElementById(`ev-${type}`).checked);
  const task={id:Date.now(),title,desc:document.getElementById('task-desc').value.trim(),due:date,dueAt:`${date}T${time||'23:59'}:00`,category:document.getElementById('task-cat').value,status:'pending',priority:2,requiredEvidence:required,assignedAt:new Date().toISOString(),evidence:[]};
  state.tasks.unshift(task); if(task.category==='Consequence Task') state.punishments.unshift({id:Date.now()+1,title:task.title,desc:task.desc,kind:'task',linkedTaskId:task.id,status:'active',assignedAt:new Date().toISOString()}); addNotification('task','Task assigned',task.title,'tasks'); saveState(); button.closest('.fixed').remove(); renderTasks(); renderDashboard(); showConfetti(20);
}

function panelButton(id,label,icon){ return `<button onclick="setProtocolPanel('${id}')" class="tap pill px-3 py-2 text-xs ${activeProtocolPanel===id?'bg-[var(--red-2)] text-white border-[var(--red)]':''}"><i class="fa-solid ${icon} mr-1"></i>${label}</button>`; }
function setProtocolPanel(panel){ activeProtocolPanel=panel; renderProtocols(); }
function renderProtocols(){
  const tab=document.getElementById('tab-protocols'); if(!tab)return;
  tab.innerHTML=`<div class="flex justify-between items-start mb-5"><div><div class="text-4xl heading-serif">Protocols</div><div class="text-sm text-[var(--stone)] mt-1">Rules, boundaries, records and consequences.</div></div><button onclick="showProfileModal()" class="tap pill px-3 py-2 text-xs"><i class="fa-solid fa-user mr-1"></i>Sub Profile</button></div><div class="flex flex-wrap gap-2 mb-5">${panelButton('rules','Rules','fa-section')}${panelButton('boundaries','Boundaries','fa-shield')}${panelButton('bodymaps','Body Maps','fa-person')}${panelButton('records','Records','fa-chart-simple')}${panelButton('consequences','Consequences','fa-hourglass-half')}</div><div id="protocol-panel"></div>`;
  const box=document.getElementById('protocol-panel');
  if(activeProtocolPanel==='rules') box.innerHTML=renderProtocolRules();
  if(activeProtocolPanel==='boundaries') box.innerHTML=renderBoundaryPanel();
  if(activeProtocolPanel==='bodymaps') box.innerHTML=renderBodyMapsPanel();
  if(activeProtocolPanel==='records') box.innerHTML=renderPersonalRecordsPanel();
  if(activeProtocolPanel==='consequences') { box.innerHTML='<div id="punishments-active" class="space-y-4 mb-6"></div><div class="text-xs text-[var(--gold)]/60 mb-2 px-1">HISTORY</div><div id="punishments-history" class="space-y-2 text-sm"></div>'; renderPunishments(); }
}
function renderProtocolRules(){ return `<div class="space-y-4">${RULE_SECTIONS.map(([key,label,glyph])=>`<section class="card p-5"><div class="flex justify-between items-center mb-4"><div class="flex items-center gap-3"><span class="icon-tile">${glyph}</span><div class="font-semibold">${label}</div></div>${state.currentRole==='dom'?`<button onclick="editSection('${key}')" class="text-xs px-3 py-1 bg-white/10 rounded-2xl">Edit</button>`:''}</div><div class="space-y-2">${String(state.rules[key]||'').split('\n').map(x=>x.replace(/^\s*(?:[•\-]|\d+[.)])\s*/,'')).filter(Boolean).map((line,i)=>`<div class="flex gap-3 text-sm"><span class="rule-number">${i+1}</span><span>${escapeText(line)}</span></div>`).join('')||'<div class="text-xs opacity-40">Nothing Set.</div>'}</div></section>`).join('')}</div>`; }
function renderBoundaryPanel(){ return `<div class="flex justify-between mb-4"><div><div class="text-2xl font-semibold">Boundaries</div><div class="text-xs text-[var(--stone)]">Same icon treatment as Protocols.</div></div>${state.currentRole==='dom'?'<button onclick="showAddLimitModal()" class="tap px-4 py-2 bg-[var(--red)] rounded-2xl text-sm">+ Add</button>':''}</div><div class="space-y-4">${LIMIT_GROUPS.map(([key,label,glyph])=>`<section class="card p-5"><div class="flex items-center gap-3 mb-3"><span class="icon-tile">${glyph}</span><div class="font-semibold">${label}</div></div><div class="flex flex-wrap gap-2">${(state.limits[key]||[]).map((item,i)=>`<span class="pill px-4 py-2 text-sm">${escapeText(typeof item==='string'?item:item.text)}</span>`).join('')||'<div class="text-xs opacity-40">Nothing Listed.</div>'}</div></section>`).join('')}</div>`; }
function humanOutline(kind,view){ const zones=(state.bodyMaps[kind]||[]).filter(z=>z.view===view); return `<div class="human-outline"><svg viewBox="0 0 180 300" aria-hidden="true"><circle cx="90" cy="32" r="22"/><path d="M64 70 L116 70 L132 158 L110 230 L96 288"/><path d="M64 70 L48 158 L70 230 L84 288"/><path d="M62 82 L25 145 L34 220"/><path d="M118 82 L155 145 L146 220"/><path d="M58 170 L122 170"/></svg>${zones.map(z=>`<span class="body-zone pulse-dot ${kind==='ticklish'?'zone-ticklish':'zone-sensitive'}" style="left:${z.x}%;top:${z.y}%; "></span>`).join('')}</div>`; }
function renderBodyMapsPanel(){ return `<div class="space-y-4"><section class="card p-5"><div class="flex justify-between"><div><div class="font-semibold text-xl">Ticklish Areas</div><div class="text-xs text-[var(--stone)] mt-1">Saved for easy reference. Tap to edit zones.</div></div><span class="pill px-3 py-2 text-xs">Dom edit only</span></div><div class="grid grid-cols-2 gap-4 mt-5 text-center"><div><div class="text-xs text-[var(--sage)] mb-2">Front</div>${humanOutline('ticklish','front')}</div><div><div class="text-xs text-[var(--sage)] mb-2">Back</div>${humanOutline('ticklish','back')}</div></div></section><section class="card p-5"><div class="flex justify-between"><div><div class="font-semibold text-xl">Sensitive Areas</div><div class="text-xs text-[var(--stone)] mt-1">Saved for easy reference. Tap to edit zones.</div></div><span class="pill px-3 py-2 text-xs">Dom edit only</span></div><div class="grid grid-cols-2 gap-4 mt-5 text-center"><div><div class="text-xs text-[var(--rose)] mb-2">Front</div>${humanOutline('sensitive','front')}</div><div><div class="text-xs text-[var(--rose)] mb-2">Back</div>${humanOutline('sensitive','back')}</div></div></section></div>`; }
function measurementRows(){ const m=state.subProfile.measurements; return [['Height',m.height],['Weight',m.weight],['Neck',m.neck],['Chest',m.chest],['Bicep L',m.bicepL],['Bicep R',m.bicepR],['Waist',m.waist],['Hips',m.hips],['Inside Leg',m.insideLeg]]; }
function anatomyRows(){ const a=state.subProfile.anatomy; return [['Soft Length',a.softLength],['Hard Length',a.hardLength],['Soft Girth',a.softGirth],['Hard Girth',a.hardGirth],['Testicular Circumference',a.testicularCircumference]]; }
function renderPersonalRecordsPanel(){
  const breath=state.personalRecords.breath;
  return `<div class="space-y-4"><section class="card p-5"><div class="flex gap-4"><img src="${state.subProfile.photo||DEFAULT_PHOTO}" class="w-28 h-32 object-cover rounded-3xl grayscale" alt="Sub profile"><div class="flex-1"><div class="text-3xl heading-serif">${escapeText(state.subProfile.name||state.subTitle)}</div><div class="text-sm text-[var(--sage)]">Submissive</div><div class="text-sm text-[var(--gold)] mt-2">Dominant: ${escapeText(state.subProfile.dominant||state.domTitle)}</div><div class="pill inline-flex px-3 py-2 text-xs mt-3"><i class="fa-solid fa-lock mr-2"></i>Dom edit only</div></div></div></section><section class="card p-5"><div class="flex justify-between mb-4"><div class="font-semibold text-xl">Measurements</div><span class="pill px-3 py-1 text-xs text-[var(--blue)]">Reference only</span></div><div class="grid grid-cols-2 gap-3">${measurementRows().map(([k,v])=>`<div class="subtle-card p-3"><div class="text-[10px] text-[var(--stone)] uppercase">${k}</div><div class="text-sm font-semibold mt-1">${escapeText(v||'—')}</div></div>`).join('')}</div></section><section class="card p-5"><div class="flex justify-between mb-4"><div class="font-semibold text-xl">Personal Records</div><span class="pill px-3 py-1 text-xs text-[var(--blue)]">Record keeping</span></div><div class="grid grid-cols-2 gap-3">${anatomyRows().map(([k,v])=>`<div class="subtle-card p-3"><div class="text-[10px] text-[var(--stone)] uppercase">${k}</div><div class="text-sm font-semibold mt-1">${escapeText(v||'—')}</div></div>`).join('')}</div><div class="text-xs text-[var(--stone)] mt-4">For reference and record keeping only.</div></section><section class="card p-5"><div class="font-semibold text-xl mb-4">Breath Control Records</div><div class="grid grid-cols-2 gap-3">${Object.entries({longestHold:'Longest Hold',rebreathe3L:'3 L Rebreathe',rebreathe5L:'5 L Rebreathe',rebreathe6L:'6 L Rebreathe',bubbleBottleLarge:'Bubble Bottle Large',bubbleBottleSmall:'Bubble Bottle Small',resistanceMaximum:'Resistance Maximum'}).map(([key,label])=>`<div class="subtle-card p-3"><div class="text-[10px] text-[var(--stone)] uppercase">${label}</div><div class="text-sm font-semibold mt-1">${escapeText(breath[key]||'—')}</div></div>`).join('')}</div></section><section class="card p-5"><div class="font-semibold text-xl mb-4">Electro Response</div><div class="space-y-3">${Object.entries(state.personalRecords.electro).map(([label,row])=>rangeRow(label,row)).join('')}</div><div class="text-xs text-[var(--stone)] mt-4">Values use a 1 to 100 reference scale.</div></section></div>`;
}
function rangeRow(label,row){ const min=Number(row.min)||0,max=Number(row.max)||0,start=Number(row.pleasureStart)||min,end=Number(row.pleasureEnd)||max; return `<div><div class="flex justify-between text-xs mb-1"><span>${escapeText(label)}</span><span class="text-[var(--stone)]">${min}–${max}</span></div><div class="range-track"><div class="range-fill" style="margin-left:${Math.max(0,min)}%;width:${Math.max(5,max-min)}%"></div></div><div class="text-[10px] text-[var(--sage)] mt-1">Pleasure zone: ${start}–${end}</div></div>`; }
function renderPunishments(){ const active=document.getElementById('punishments-active'),history=document.getElementById('punishments-history'); if(!active)return; const items=activePunishments(); active.innerHTML=items.map(p=>{ const time=getTimeLeft(p); return `<div class="card p-5 border-l-4 border-[var(--red)]"><div class="flex gap-4"><div class="ring w-24 h-24 flex items-center justify-center shrink-0" style="--p:${time.pct};--c:var(--red)"><span class="countdown text-xs text-center px-2" data-countdown="${p.id}">${time.text}</span></div><div><div class="font-semibold text-lg">${escapeText(p.title)}</div><div class="text-sm mt-1 text-[var(--stone)]">${escapeText(p.desc||'')}</div><div class="text-xs text-[var(--gold)]/70 mt-3">${p.kind==='task'?`Linked task`:'Active timer'}</div></div></div></div>`; }).join('')||'<div class="text-sm text-[var(--gold)]/60">No Active Consequences.</div>'; if(history)history.innerHTML=state.punishments.filter(p=>p.status==='completed').map(p=>`<div class="glass rounded-2xl px-4 py-3">${escapeText(p.title)} <span class="text-emerald-400 float-right">Complete</span></div>`).join('')||'<div class="text-sm opacity-50">No history yet.</div>'; updateCountdowns(); }

function renderRewards(){
  const tab=document.getElementById('tab-stars'); if(!tab)return;
  tab.innerHTML=`<div class="text-center mb-8"><div class="logo-orb inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"><i class="fa-solid fa-star text-white text-6xl"></i></div><div class="text-2xl font-semibold tracking-tight">Stars Earned</div><div id="star-total-big" class="text-6xl font-bold text-[var(--gold)] tabular-nums mt-1">${state.stars||0}</div></div><div class="card p-5 mb-5"><div class="font-semibold text-xl mb-4">Recent Awards</div><div class="space-y-2">${(state.starLog||[]).slice(0,25).map(s=>`<div class="flex justify-between px-4 py-3 bg-white/5 rounded-2xl"><span>${escapeText(s.reason)}</span><span class="text-[var(--gold)]">+${s.amount} ★</span></div>`).join('')||'<div class="text-sm opacity-60">No Stars Earned Yet.</div>'}</div></div><div class="grid grid-cols-2 gap-3">${SYSTEM_BADGES.map(b=>{const earned=state.badges.some(x=>x.id===b.id);return`<button onclick="showBadge('${b.id}')" class="card p-4 text-left ${earned?'border border-[var(--gold)]/50':'opacity-65'}><i class="fa-solid ${b.icon} text-2xl ${earned?'text-[var(--gold)]':'text-white/40'}"></i><div class="font-semibold mt-3">${b.name}</div><div class="text-[10px] mt-1 ${earned?'text-emerald-400':'text-white/40'}">${earned?'AUTHORISED':'LOCKED'}</div></button>`}).join('')}</div>`;
}
function showBadge(id){ const badge=SYSTEM_BADGES.find(b=>b.id===id), earned=state.badges.some(x=>x.id===b.id); const modal=document.createElement('div'); modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-6" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass rounded-3xl p-7 max-w-sm text-center"><i class="fa-solid ${badge.icon} text-6xl text-[var(--gold)] mb-5"></i><div class="text-2xl font-semibold">${badge.name}</div><div class="text-sm mt-3 opacity-80">${badge.goal}</div>${state.currentRole==='dom'&&!earned?`<button onclick="authoriseBadge('${id}',this)" class="w-full mt-6 py-3 bg-[var(--red)] rounded-2xl">Authorise Award</button>`:`<div class="mt-6 text-sm ${earned?'text-emerald-400':'opacity-50'}">${earned?'Awarded By Sir':'Awaiting Authorisation'}</div>`}</div></div>`; document.getElementById('modal-container').appendChild(modal); }
function authoriseBadge(id,button){ state.badges.push({id,authorisedAt:new Date().toISOString()}); saveState(); button.closest('.fixed').remove(); renderRewards(); showConfetti(40); }

function renderJournal(){ const box=document.getElementById('journal-entries'); if(!box)return; box.innerHTML=state.journal.map(e=>`<button onclick="openJournalEntry(${e.id})" class="w-full text-left card p-5"><div class="flex justify-between"><div><div class="font-semibold text-lg">${escapeText(titleCase(e.title))}</div><div class="text-xs text-[var(--gold)]/70">${formatUKDate(e.date)}</div></div><i class="fa-solid fa-feather text-[var(--gold)]"></i></div><div class="text-sm mt-3 line-clamp-2 opacity-75">${escapeText(e.body||'')}</div></button>`).join('')||'<div class="text-center py-8 text-[var(--gold)]/50">No Journal Entries Yet.</div>'; }
function showNewJournalModal(){ const modal=document.createElement('div'); modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="font-semibold text-xl mb-5">New Journal Entry</div><input id="journal-title" class="w-full px-4 py-3 rounded-2xl mb-3" placeholder="Title"><textarea id="journal-body" rows="7" class="w-full px-4 py-3 rounded-2xl" placeholder="Write your entry..."></textarea><button onclick="addJournalEntry(this)" class="w-full mt-5 py-3 bg-[var(--red)] rounded-2xl">Save Entry</button></div></div>`; document.getElementById('modal-container').appendChild(modal); }
function addJournalEntry(button){ const title=titleCase(document.getElementById('journal-title').value||'Journal Entry'), body=document.getElementById('journal-body').value.trim(); if(!body)return alert('Please write something before saving.'); state.journal.unshift({id:Date.now(),title,body,date:new Date().toISOString(),attachments:[]}); addNotification('journal','Journal saved',title,'journal'); saveState(); button.closest('.fixed').remove(); renderJournal(); renderDashboard(); }
function openJournalEntry(id){ const e=state.journal.find(x=>String(x.id)===String(id)); if(!e)return; const modal=document.createElement('div'); modal.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[200] flex items-end md:items-center justify-center" onclick="this.remove()"><article onclick="event.stopImmediatePropagation()" class="bg-[#151515] w-full max-w-2xl max-h-[94vh] overflow-auto rounded-t-[2rem] md:rounded-[2rem] p-7 safe-bottom"><button onclick="this.closest('.fixed').remove()" class="float-right text-2xl">×</button><div class="text-xs tracking-widest text-[var(--gold)]">${formatUKDate(e.date)} · ${formatUKTime(e.date)}</div><h1 class="text-4xl heading-serif mt-3 mb-6">${escapeText(titleCase(e.title))}</h1><div class="rich-prose text-base whitespace-pre-wrap leading-7">${escapeText(e.body)}</div></article></div>`; document.getElementById('modal-container').appendChild(modal); }

function derivedNotifications(){
  const manual=(state.notifications||[]).map(n=>({...n,manual:true}));
  const tasks=state.tasks.filter(t=>t.status==='pending').slice(0,3).map(t=>({id:`task-${t.id}`,type:'task',title:'Task due soon',body:t.title,time:getTimeLeft(t).text,tab:'tasks',read:false,colourBorder:'border-[var(--blue)]'}));
  const cons=activePunishments().slice(0,2).map(p=>({id:`consequence-${p.id}`,type:'consequence',title:'Consequence active',body:p.title,time:getTimeLeft(p).text,tab:'protocols',panel:'consequences',read:false,colourBorder:'border-[var(--red)]'}));
  const rewards=(state.starLog||[]).slice(0,1).map(s=>({id:`reward-${s.id}`,type:'reward',title:'Reward earned',body:`+${s.amount} stars · ${s.reason}`,time:formatUKDate(s.date),tab:'stars',read:false,colourBorder:'border-[var(--gold)]'}));
  return [...manual,...tasks,...cons,...rewards];
}
function unreadNotifications(){ return derivedNotifications().filter(n=>!n.read); }
function addNotification(type,title,body,tab='dashboard'){ state.notifications=ensureArray(state.notifications); state.notifications.unshift({id:`n-${Date.now()}`,type,title,body,tab,read:false,createdAt:new Date().toISOString(),colourBorder:type==='reward'?'border-[var(--gold)]':type==='consequence'?'border-[var(--red)]':type==='review'?'border-[var(--sage)]':'border-[var(--blue)]'}); if(state.notifications.length>40)state.notifications.length=40; }
function renderNotifications(){
  const tab=document.getElementById('tab-notifications'); if(!tab)return; const items=derivedNotifications().filter(n=>activeNotificationsFilter==='all'||n.type===activeNotificationsFilter);
  const filters=[['all','All'],['task','Tasks'],['review','Reviews'],['consequence','Consequences'],['reward','Rewards']];
  tab.innerHTML=`<div class="flex justify-between items-start mb-5"><div><div class="text-4xl heading-serif">Notifications</div><div class="text-sm text-[var(--stone)] mt-1">Everything important lands here.</div></div><button onclick="markAllNotificationsRead()" class="tap pill px-3 py-2 text-xs">Mark read</button></div><div class="flex gap-2 overflow-x-auto pb-2 mb-4">${filters.map(([id,label])=>`<button onclick="setNotificationFilter('${id}')" class="pill px-4 py-2 text-xs whitespace-nowrap ${activeNotificationsFilter===id?'bg-[var(--red-2)] border-[var(--red)]':''}">${label}</button>`).join('')}</div><div class="space-y-3">${items.map(n=>`<button onclick="openNotification('${n.id}')" class="w-full text-left card p-4 border-l-4 ${n.colourBorder||'border-[var(--blue)]'}"><div class="flex justify-between gap-3"><div><div class="font-semibold">${escapeText(n.title)}</div><div class="text-sm text-[var(--stone)] mt-1">${escapeText(n.body)}</div><div class="text-xs text-[var(--gold)]/70 mt-2">${escapeText(n.time||formatUKTime(n.createdAt)||'Now')}</div></div>${!n.read?'<span class="w-2.5 h-2.5 rounded-full bg-[var(--blue)] shrink-0 mt-2"></span>':'<i class="fa-solid fa-chevron-right text-white/30 mt-2"></i>'}</div></button>`).join('')||'<div class="text-center py-8 text-[var(--gold)]/50">No Notifications.</div>'}</div>`;
}
function setNotificationFilter(filter){ activeNotificationsFilter=filter; renderNotifications(); }
function openNotification(id){ const n=derivedNotifications().find(x=>x.id===id); if(!n)return; const stored=state.notifications.find(x=>x.id===id); if(stored)stored.read=true; if(n.panel)activeProtocolPanel=n.panel; saveState(); navigateToTab(n.tab||'dashboard'); }
function markAllNotificationsRead(){ state.notifications=ensureArray(state.notifications).map(n=>({...n,read:true})); saveState(); renderNotifications(); updateHeader(); }

function showProfileModal(){
  const isDom=state.currentRole==='dom'; const modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-lg max-h-[92vh] overflow-auto rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="flex justify-between"><div><div class="text-xs tracking-widest text-[var(--gold)]">SUB PROFILE</div><div class="text-4xl heading-serif mt-1">${escapeText(state.subProfile.name||state.subTitle)}</div><div class="text-sm text-[var(--stone)] mt-1">Visible to sub. Editable by Dom only.</div></div><button onclick="this.closest('.fixed').remove()" class="text-2xl">×</button></div><div class="card p-5 mt-5"><div class="flex gap-4"><img src="${state.subProfile.photo||DEFAULT_PHOTO}" class="w-28 h-32 object-cover rounded-3xl grayscale" alt="Sub profile"><div class="flex-1"><div class="text-2xl heading-serif">${escapeText(state.subProfile.name||state.subTitle)}</div><div class="text-sm text-[var(--sage)]">${escapeText(state.subProfile.role||'Submissive')}</div><div class="text-sm text-[var(--gold)] mt-2">Dominant: ${escapeText(state.subProfile.dominant||state.domTitle)}</div><div class="pill inline-flex px-3 py-2 text-xs mt-3"><i class="fa-solid fa-lock mr-2"></i>${isDom?'Dom edit enabled':'Read only'}</div></div></div></div><div class="card p-5 mt-4"><div class="font-semibold text-xl mb-4">Measurements</div><div class="grid grid-cols-2 gap-3">${measurementRows().map(([k,v])=>`<div class="subtle-card p-3"><div class="text-[10px] text-[var(--stone)] uppercase">${k}</div><div class="text-sm font-semibold mt-1">${escapeText(v||'—')}</div></div>`).join('')}</div></div><div class="flex gap-3 mt-5">${isDom?'<button onclick="showEditSubProfileModal()" class="flex-1 py-3 bg-[var(--red)] rounded-2xl">Edit Profile</button>':''}<button onclick="this.closest('.fixed').remove(); activeProtocolPanel='records'; navigateToTab('protocols')" class="flex-1 py-3 bg-white/10 rounded-2xl">Open Records</button></div></div></div>`;
  document.getElementById('modal-container').appendChild(modal);
}
function showEditSubProfileModal(){
  const p=state.subProfile,m=p.measurements,a=p.anatomy; const modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[220] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-xl max-h-[94vh] overflow-auto rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="flex justify-between"><div class="text-xl font-semibold">Edit Sub Profile</div><button onclick="this.closest('.fixed').remove()" class="text-2xl">×</button></div><div class="space-y-3 mt-5"><input id="sub-name" class="w-full px-4 py-3 rounded-2xl" value="${escapeText(p.name||'')}" placeholder="Name"><input id="sub-photo" class="w-full px-4 py-3 rounded-2xl" value="${escapeText(p.photo||'')}" placeholder="Photo URL"><div class="grid grid-cols-2 gap-3">${Object.entries(m).map(([key,val])=>`<label class="text-xs text-[var(--gold)]/70 uppercase">${key.replace(/[A-Z]/g,' $&')}<input data-measure="${key}" class="w-full px-3 py-3 rounded-2xl mt-1" value="${escapeText(val||'')}"></label>`).join('')}</div><div class="text-xs tracking-widest text-[var(--gold)] mt-4">PERSONAL RECORDS</div><div class="grid grid-cols-2 gap-3">${Object.entries(a).map(([key,val])=>`<label class="text-xs text-[var(--gold)]/70 uppercase">${key.replace(/[A-Z]/g,' $&')}<input data-anatomy="${key}" class="w-full px-3 py-3 rounded-2xl mt-1" value="${escapeText(val||'')}"></label>`).join('')}</div></div><button onclick="saveSubProfileEditor(this)" class="w-full mt-5 py-3 bg-[var(--red)] rounded-2xl">Save Profile</button></div></div>`;
  document.getElementById('modal-container').appendChild(modal);
}
function saveSubProfileEditor(button){ state.subProfile.name=document.getElementById('sub-name').value.trim()||state.subProfile.name; state.subTitle=state.subProfile.name; state.subProfile.photo=document.getElementById('sub-photo').value.trim()||DEFAULT_PHOTO; document.querySelectorAll('[data-measure]').forEach(el=>state.subProfile.measurements[el.dataset.measure]=el.value.trim()); document.querySelectorAll('[data-anatomy]').forEach(el=>state.subProfile.anatomy[el.dataset.anatomy]=el.value.trim()); addNotification('profile','Profile updated','Sub profile records were changed.','protocols'); saveState(); button.closest('.fixed').remove(); document.querySelectorAll('.fixed').forEach(m=>m.remove()); updateHeader(); activeProtocolPanel='records'; navigateToTab('protocols'); }

function showAddLimitModal(){ const modal=document.createElement('div'); modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="text-xl font-semibold mb-5">Add Boundary Or Preference</div><select id="limit-category" class="w-full px-4 py-3 rounded-2xl mb-3">${LIMIT_GROUPS.map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select><input id="limit-text" class="w-full px-4 py-3 rounded-2xl" placeholder="Describe It"><button onclick="addLimit(this)" class="w-full mt-5 py-3 bg-[var(--red)] rounded-2xl">Add</button></div></div>`; document.getElementById('modal-container').appendChild(modal); }
function addLimit(button){ const category=document.getElementById('limit-category').value, text=titleCase(document.getElementById('limit-text').value); if(!text)return alert('Please describe it.'); state.limits[category]=state.limits[category]||[]; state.limits[category].push(text); saveState(); button.closest('.fixed').remove(); renderProtocols(); }
function editSection(section){ const labels=Object.fromEntries(RULE_SECTIONS.map(([k,l])=>[k,l])); const modal=document.createElement('div'); modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="font-semibold text-xl mb-5">Edit ${labels[section]||section}</div><textarea id="section-editor" rows="10" class="w-full px-4 py-3 rounded-2xl"></textarea><button onclick="saveSection('${section}', this)" class="w-full mt-5 py-3 bg-[var(--red)] rounded-2xl">Save Changes</button></div></div>`; document.getElementById('modal-container').appendChild(modal); document.getElementById('section-editor').value=state.rules[section]||''; }
function saveSection(section,button){ state.rules[section]=document.getElementById('section-editor').value.trim(); saveState(); button.closest('.fixed').remove(); renderProtocols(); }

function showSettings(){ navigateToTab('settings'); }
function renderSettings(){
  const tab=document.getElementById('tab-settings'); if(!tab)return;
  tab.innerHTML=`<div class="flex justify-between items-start mb-6"><div><div class="text-4xl heading-serif">Settings</div><div class="text-sm text-[var(--stone)] mt-1">Data, reset and app controls.</div></div><button onclick="switchRole()" class="tap pill px-3 py-2 text-xs">Lock</button></div><section class="card p-5 mb-5"><div class="font-semibold text-xl mb-3">Data Management</div><div class="grid grid-cols-2 gap-3"><button onclick="exportSystemBackup()" class="tap subtle-card p-4 text-left"><i class="fa-solid fa-download text-[var(--gold)]"></i><div class="font-semibold mt-2">Export Backup</div><div class="text-xs text-[var(--stone)]">JSON download</div></button><label class="tap subtle-card p-4 text-left cursor-pointer"><i class="fa-solid fa-upload text-[var(--blue)]"></i><div class="font-semibold mt-2">Restore Backup</div><div class="text-xs text-[var(--stone)]">Import JSON</div><input type="file" accept="application/json" class="hidden" onchange="restoreSystemBackup(this)"></label></div></section><section class="card p-5 mb-5"><div class="font-semibold text-xl mb-3">Reset From Scratch</div><div class="space-y-2">${[['demo','Reset demo data'],['profile','Reset profile'],['protocols','Reset protocols'],['tasks','Reset tasks'],['rewards','Reset rewards'],['notifications','Reset notifications'],['local','Clear local device cache']].map(([key,label])=>`<button onclick="resetSection('${key}')" class="w-full tap flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl"><span>${label}</span><i class="fa-solid fa-rotate-left text-[var(--stone)]"></i></button>`).join('')}</div></section><section class="card p-5 border border-[var(--red)]/40"><div class="font-semibold text-xl text-[var(--red)] mb-2">Danger Zone</div><div class="text-sm text-[var(--stone)] mb-4">This backs up the current system locally, then resets all shared app data.</div><button onclick="resetEverything()" class="w-full py-3 bg-[var(--red)] rounded-2xl">Reset Everything</button></section>`;
}
function exportSystemBackup(){ const blob=new Blob([safeJson(state)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`the-system-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); }
function restoreSystemBackup(input){ const file=input.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{ try{ const next=JSON.parse(reader.result); state={...defaultSystemState(state.currentRole),...next,currentRole:state.currentRole}; migrateEnhancedState(); saveState(); showToast('Backup Restored','success'); navigateToTab('dashboard'); }catch(error){ alert('Backup file is not valid JSON.'); } }; reader.readAsText(file); }
function backupBeforeReset(){ localStorage.setItem(`the_system_backup_before_reset_${Date.now()}`, JSON.stringify(state)); }
function resetSection(section){ if(!confirm(`Reset ${section}?`))return; backupBeforeReset(); const fresh=defaultSystemState(state.currentRole); if(section==='demo'){ state.tasks=fresh.tasks; state.punishments=fresh.punishments; state.starLog=fresh.starLog; state.stars=fresh.stars; state.activityLog=fresh.activityLog; } if(section==='profile'){ state.subProfile=fresh.subProfile; state.subTitle=fresh.subTitle; } if(section==='protocols'){ state.rules=fresh.rules; state.limits=fresh.limits; state.bodyMaps=fresh.bodyMaps; state.personalRecords=fresh.personalRecords; } if(section==='tasks'){ state.tasks=[]; state.evidence=[]; } if(section==='rewards'){ state.stars=0; state.starLog=[]; state.badges=[]; } if(section==='notifications'){ state.notifications=[]; } if(section==='local'){ localStorage.removeItem('the_system_v4'); location.reload(); return; } saveState(); showToast('Reset Complete','success'); renderSettings(); }
function resetEverything(){ const typed=prompt('Type RESET THE SYSTEM to reset everything from scratch.'); if(typed!=='RESET THE SYSTEM')return; backupBeforeReset(); const role=state.currentRole; state=defaultSystemState(role); saveState(); showToast('System Reset','success'); navigateToTab('dashboard'); }

function switchRole(){ document.getElementById('main-app').classList.add('hidden'); document.getElementById('login-screen').classList.remove('hidden'); document.getElementById('bottom-navigation')?.classList.add('hidden'); buildKeypad(); }
function saveState(){ localStorage.setItem('the_system_v4', JSON.stringify(state)); if(typeof firestoreConnected!=='undefined' && firestoreConnected && !applyingRemoteState){ sharedStateDocument.set(getSharedState()).catch(error=>console.error('Could not sync changes to Firebase:',error)); } }
function loadState(){ const saved=localStorage.getItem('the_system_v4'); if(saved){ try{ state={...state,...JSON.parse(saved)}; }catch(error){ console.warn('Saved state could not be parsed',error); } } }
function showConfetti(count=40){ const colors=['#8f1118','#315b7a','#8faf97','#c6a642']; for(let i=0;i<count;i++){ const c=document.createElement('div'); c.className='confetti'; c.style.left=Math.random()*window.innerWidth+'px'; c.style.top='-10px'; c.style.background=colors[Math.floor(Math.random()*colors.length)]; document.body.appendChild(c); setTimeout(()=>c.remove(),1200); } }
function enhancedInitialize(){
  loadState(); migrateEnhancedState(); installScreens(); installNavigation(); buildKeypad(); updateRoleUI();
  try{ knownTaskStatuses=new Map(state.tasks.map(t=>[t.id,t.status])); connectFirestore(); }catch(error){ console.warn('Firebase connection skipped',error); }
  document.querySelector('[onclick="navigateToTab(\'evidence\')"]')?.classList.add('hidden');
  clearInterval(countdownTimer); countdownTimer=setInterval(()=>{ activePunishments(); updateCountdowns(); },1000);
  navigateToTab('dashboard');
}
window.onload=enhancedInitialize;
