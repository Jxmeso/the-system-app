const SYSTEM_BADGES = [
  {id:'first-meeting',name:'First Contact',icon:'fa-handshake',goal:'Meet in person for the first time.'},
  {id:'clear-skies',name:'Clear Skies',icon:'fa-cloud-sun',goal:'Complete three days without an overthinking event.'},
  {id:'kind-reflection',name:'Kind Reflection',icon:'fa-heart',goal:'Say something genuinely positive about yourself.'},
  {id:'educated-edge',name:'Educated Edge',icon:'fa-book-open',goal:'Move a hard limit to soft through education.'},
  {id:'brave-try',name:'Brave Try',icon:'fa-compass',goal:'Move a soft limit to try or like after education or an attempt.'},
  {id:'honest-voice',name:'Honest Voice',icon:'fa-envelope-open-text',goal:'Send your first disclosure.'},
  {id:'steady-service',name:'Steady Service',icon:'fa-list-check',goal:'Complete five assigned tasks.'},
  {id:'inner-world',name:'Inner World',icon:'fa-feather',goal:'Write three journal entries.'},
  {id:'accountable',name:'Accountable',icon:'fa-shield-heart',goal:'Complete your first punishment task.'},
  {id:'gold-standard',name:'Gold Standard',icon:'fa-crown',goal:'Earn twenty-five stars.'}
];
const RULE_SECTIONS = [
  ['arrivalProcedure','Arrival Procedure','fa-door-open'],['houseRules','House Rules','fa-house'],
  ['consequences','Consequences','fa-scale-balanced'],['outOfSession','Out Of Session','fa-person-walking-arrow-right'],
  ['exercise','Exercise','fa-dumbbell'],['dietary','Dietary','fa-bowl-food'],['communication','Communication','fa-comments']
];
const LIMIT_GROUPS = [
  ['loves','Loves','fa-heart','text-rose-400'],['likes','Likes','fa-thumbs-up','text-emerald-400'],
  ['tries','Willing To Try','fa-compass','text-blue-400'],['supplements','Soft Limits','fa-shield','text-amber-400'],
  ['hard','Hard Limits','fa-ban','text-red-400']
];
const capturedEvidence = new Map();
const DIRECT_WEB_PUSH_KEY = 'BA9U0D5hD7CAFBz4dg8NFqzUmKX5wtJZbOznbJlc_wKPdBmQ2Co2tGvMsZevOJXs3BfE73a2BUuhEfvtP5qB-us';
let journalCapture = null;
let activeCapture = null;
let countdownTimer = null;

function titleCase(value='') {
  return value.trim().toLowerCase().replace(/\b([a-z])/g, letter => letter.toUpperCase());
}

function escapeText(value='') {
  const node = document.createElement('div'); node.textContent = value; return node.innerHTML;
}

function migrateEnhancedState() {
  state.dataVersion = Math.max(state.dataVersion || 0, 4);
  state.subTitle = 'Jacob';
  state.badges = Array.isArray(state.badges) ? state.badges : [];
  state.disclosures = Array.isArray(state.disclosures) ? state.disclosures : [];
  state.checkIns = Array.isArray(state.checkIns) ? state.checkIns : [];
  state.activities = Array.isArray(state.activities) ? state.activities : [];
  state.pushTokens = state.pushTokens || {dom:[],sub:[]};
  state.rules = state.rules || {};
  RULE_SECTIONS.forEach(([key]) => { if (typeof state.rules[key] !== 'string') state.rules[key] = ''; });
  state.tasks = (state.tasks || []).map(task => ({...task,title:titleCase(task.title),evidence:task.evidence||[]}));
  state.punishments = (state.punishments || []).map(item => ({...item,title:titleCase(item.title)}));
  state.journal = (state.journal || []).map(entry => ({...entry,title:titleCase(entry.title),attachments:entry.attachments||[]}));
}

async function enablePushNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const permissionPromise = Notification.permission === 'granted' ? Promise.resolve('granted') : Notification.requestPermission();
    const permission = await permissionPromise;
    if (permission !== 'granted') { showToast('Notifications are blocked. Enable them in iPhone Settings.', 'error'); return false; }
    const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js', {scope:'./'});
    await navigator.serviceWorker.ready;
    const applicationKey=urlBase64ToUint8Array(DIRECT_WEB_PUSH_KEY);
    let existing = await registration.pushManager.getSubscription();
    if(existing?.options?.applicationServerKey){const oldKey=new Uint8Array(existing.options.applicationServerKey);if(oldKey.length!==applicationKey.length||oldKey.some((byte,index)=>byte!==applicationKey[index])){await existing.unsubscribe();existing=null;}}
    const subscription = existing || await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationKey});
    if (!subscription) throw new Error('No push subscription returned');
    const snapshot = await sharedStateDocument.get();
    const remoteSubscriptions = snapshot.data()?.pushSubscriptions || {dom:[],sub:[]};
    const roleSubscriptions = [...(remoteSubscriptions[state.currentRole] || []).filter(item=>item.endpoint!==subscription.endpoint),subscription.toJSON()];
    state.pushSubscriptions = {...remoteSubscriptions,[state.currentRole]:roleSubscriptions};
    await sharedStateDocument.set({pushSubscriptions:state.pushSubscriptions},{merge:true});
    localStorage.setItem('the_system_push_ready','true');
    showToast('Notifications Enabled', 'success');
    return true;
  } catch (error) {
    console.error('Push enrolment failed', error);
    showToast('Could Not Enable Notifications', 'error');
    return false;
  }
}

function urlBase64ToUint8Array(value){
  const padding='='.repeat((4-value.length%4)%4),base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(base64);return Uint8Array.from([...raw].map(char=>char.charCodeAt(0)));
}

function showToast(message,type='info') {
  const toast=document.createElement('div');
  toast.className=`fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-2xl text-sm ${type==='error'?'bg-red-900':type==='success'?'bg-emerald-900':'bg-[#222]'}`;
  toast.textContent=message; document.body.appendChild(toast); setTimeout(()=>toast.remove(),3500);
}

function buildKeypad() {
  const screen=document.getElementById('login-screen');
  document.getElementById('bottom-navigation')?.classList.add('hidden');
  screen.innerHTML=`<div class="max-w-sm w-full px-7 text-center"><div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#8B0000] via-[#3B5998] to-[#9CAF88] mb-5"><i class="fa-solid fa-infinity text-white text-5xl"></i></div><h1 class="text-5xl heading-serif">The System</h1><p class="text-[#d4af37] mt-2 tracking-[3px] text-sm">PRIVATE ACCESS</p><div id="pin-dots" class="flex justify-center gap-4 my-8">${[0,1,2,3].map(()=>'<span class="w-4 h-4 rounded-full border border-[#d4af37]/60"></span>').join('')}</div><p id="login-error" class="text-red-400 text-sm h-6"></p><div class="grid grid-cols-3 gap-3">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="keypad-key" onclick="keypadPress('${n}')">${n}</button>`).join('')}<button class="keypad-key text-sm" onclick="keypadClear()">Clear</button><button class="keypad-key" onclick="keypadPress('0')">0</button><button class="keypad-key" onclick="keypadBack()"><i class="fa-solid fa-delete-left"></i></button></div><button onclick="showInstallGuide()" class="mt-7 text-xs text-[#d4af37]/60 underline">Install Help</button></div>`;
  window.currentPin=''; updatePinDots();
}

function keypadPress(digit){ if(currentPin.length>=4)return; currentPin+=digit; updatePinDots(); if(currentPin.length===4)setTimeout(attemptLogin,120); }
function keypadClear(){currentPin='';updatePinDots();document.getElementById('login-error').textContent='';}
function keypadBack(){currentPin=currentPin.slice(0,-1);updatePinDots();}
function updatePinDots(){document.querySelectorAll('#pin-dots span').forEach((dot,i)=>dot.className=`w-4 h-4 rounded-full border border-[#d4af37]/60 ${i<currentPin.length?'bg-[#d4af37]':''}`);}

function attemptLogin() {
  const input=window.currentPin||'';
  const role=input==='0000'?'dom':input==='1111'?'sub':null;
  const remembered=localStorage.getItem('the_system_role');
  if(!role || (remembered && role!==remembered)){
    document.getElementById('login-error').textContent='Invalid code for this device';currentPin='';updatePinDots();return;
  }
  state.currentRole=role; localStorage.setItem('the_system_role',role); localStorage.setItem('the_system_v4',JSON.stringify(state));
  document.getElementById('login-screen').classList.add('hidden');document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('bottom-navigation')?.classList.remove('hidden');
  updateRoleUI(); navigateToTab(new URLSearchParams(location.search).get('tab')||'dashboard');
  enablePushNotifications();
}

function updateRoleUI(){
  const isDom=state.currentRole==='dom';
  document.querySelectorAll('.dom-only').forEach(el=>el.style.display=isDom?'':'none');
  document.querySelectorAll('.sub-only').forEach(el=>el.style.display=isDom?'none':'');
  updateHeader();
  const button=document.getElementById('header-action');
  if(button){button.innerHTML=`<i class="fa-solid ${isDom?'fa-inbox':'fa-shield-heart'}"></i>`;button.title=isDom?'Inbox & Check-Ins':'Private Disclosure';button.onclick=isDom?showDomHub:showDisclosureComposer;}
}

function updateHeader(){
  const isDom=state.currentRole==='dom';document.getElementById('header-name').textContent=isDom?state.domTitle:state.subTitle;
  const role=document.getElementById('header-role');role.textContent=isDom?'Dominant':'Submissive';role.style.color=isDom?'#c2410f':'#9CAF88';
}

function greetingForNow(){const h=new Date().getHours();return h<12?'GOOD MORNING,':h<18?'GOOD AFTERNOON,':'GOOD EVENING,';}
function dueDateFor(item){
  if(item.dueAt)return new Date(item.dueAt);
  if(!item.due)return null;
  const date=new Date(`${item.due}T23:59:59`);return Number.isNaN(date.getTime())?null:date;
}
function getTimeLeft(value){
  const due=typeof value==='object'?dueDateFor(value):dueDateFor({due:value});if(!due)return{text:'No Deadline',color:'text-[#d4af37]/60'};
  const diff=due-Date.now();if(diff<=0)return{text:'Overdue',color:'text-red-400'};
  const d=Math.floor(diff/86400000),h=Math.floor(diff%86400000/3600000),m=Math.floor(diff%3600000/60000),s=Math.floor(diff%60000/1000);
  return{text:d?`${d}d ${h}h ${m}m`:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,color:d<1?'text-amber-400':'text-emerald-400'};
}

function renderDashboard(){
  const isDom=state.currentRole==='dom';
  document.getElementById('dash-period').textContent=greetingForNow();
  document.getElementById('dash-greeting').textContent=isDom?state.domTitle:state.subTitle;
  document.getElementById('dash-star-count').textContent=state.stars||0;
  document.getElementById('dash-tasks-done').textContent=state.tasks.filter(t=>t.status==='completed').length;
  document.getElementById('dash-tasks-total').textContent=state.tasks.length;
  document.getElementById('dash-journal-streak').textContent=calculateJournalStreak();
  document.getElementById('dash-active-punish').textContent=activePunishments().length;
  checkActivePunishmentBanner();
  const feed=document.getElementById('activity-feed');
  const completed=state.tasks.filter(t=>t.status==='completed').sort((a,b)=>String(b.completedAt||b.completedDate).localeCompare(String(a.completedAt||a.completedDate)));
  feed.innerHTML=!isDom?'<div class="text-sm text-[#d4af37]/60 px-3">Completed submissions remain private to Sir.</div>':completed.length?completed.map(t=>`<button onclick="showTaskDetailById(${t.id})" class="w-full text-left glass px-4 py-3 rounded-2xl border-l-4 border-emerald-700"><div class="text-sm text-emerald-300">Completed: ${escapeText(titleCase(t.title))}</div><div class="text-xs text-[#d4af37]/60">${formatUKDate(t.completedAt||t.completedDate)} ${t.completedAt?`at ${formatUKTime(t.completedAt)}`:''}</div></button>`).join(''):'<div class="text-sm text-[#d4af37]/60 px-3">No Completed Tasks Yet.</div>';
  const today=document.getElementById('dash-today-tasks');
  today.innerHTML=state.tasks.filter(t=>t.status==='pending').slice(0,5).map(t=>`<button onclick="showTaskDetailById(${t.id})" class="w-full text-left glass rounded-2xl px-4 py-3"><div class="font-medium">${escapeText(titleCase(t.title))}</div><div class="text-xs ${getTimeLeft(t).color}">${getTimeLeft(t).text}</div></button>`).join('')||'<div class="text-sm text-[#d4af37]/60">Nothing Pending.</div>';
  renderDashboardExtras(); updateCountdowns();
}

function activePunishments(){
  let changed=false;
  state.punishments.forEach(p=>{if(p.status==='active'&&p.kind==='timed'&&dueDateFor(p)&&dueDateFor(p)<=new Date()){p.status='completed';p.completedAt=new Date().toISOString();changed=true;}});
  if(changed)saveState();return state.punishments.filter(p=>p.status==='active');
}
function checkActivePunishmentBanner(){
  const banner=document.getElementById('active-punishment-banner');const active=activePunishments()[0];
  if(state.currentRole!=='sub'||!active){banner.classList.add('hidden');return;}banner.classList.remove('hidden');
  document.getElementById('punish-banner-title').textContent=active.title;document.getElementById('punish-banner-countdown').dataset.countdown=active.id;updateCountdowns();
}
function updateCountdowns(){
  document.querySelectorAll('[data-countdown]').forEach(el=>{const p=state.punishments.find(x=>String(x.id)===String(el.dataset.countdown));if(p)el.textContent=getTimeLeft(p).text;});
}

function renderDashboardExtras(){
  let box=document.getElementById('enhanced-dashboard');if(!box){box=document.createElement('div');box.id='enhanced-dashboard';document.getElementById('tab-dashboard').appendChild(box);}
  const pending=state.checkIns.filter(c=>c.status==='pending'&&new Date(c.expiresAt)>new Date());
  const pushReady='Notification' in window&&Notification.permission==='granted'&&localStorage.getItem('the_system_push_ready')==='true';
  box.innerHTML=`${!pushReady?`<div class="glass rounded-3xl p-5 border border-amber-500/40 mt-6"><div class="flex gap-3"><i class="fa-solid fa-bell-slash text-amber-400 mt-1"></i><div><div class="font-semibold">Background Alerts Are Off</div><div class="text-xs opacity-70 mt-1">Enable alerts to receive updates while the app is closed.</div></div></div><button onclick="enablePushNotifications().then(renderDashboardExtras)" class="w-full mt-4 py-3 bg-amber-800 rounded-2xl">Enable Notifications</button></div>`:`<div class="glass rounded-3xl p-4 border border-emerald-700/40 mt-6"><div class="flex items-center justify-between gap-4"><div><div class="text-sm font-semibold text-emerald-400"><i class="fa-solid fa-bell mr-2"></i>Background Alerts Enabled</div><div class="text-[10px] opacity-60 mt-1">${state.lastPushReceipt?`Last Received ${formatUKTime(state.lastPushReceipt.receivedAt?.toDate?.()||state.lastPushReceipt.receivedAt)}`:'Awaiting First Delivery Receipt'}</div></div><button onclick="requestPushTest(this)" class="px-4 py-2 bg-emerald-900 rounded-xl text-xs">Test Push</button></div></div>`}${state.currentRole==='sub'&&pending.length?`<div class="glass rounded-3xl p-5 border border-[#d4af37]/40 mt-6"><div class="flex justify-between"><div><div class="text-xs tracking-widest text-[#d4af37]">CHECK-IN REQUESTED</div><div class="font-semibold mt-1">Relationship Check-In</div></div><i class="fa-solid fa-stopwatch text-2xl text-[#d4af37]"></i></div><button onclick="openCheckIn('${pending[0].id}')" class="w-full mt-4 py-3 bg-[#8B0000] rounded-2xl">Complete Within 10 Minutes</button></div>`:''}`;
}

function requestPushTest(button){button.disabled=true;button.textContent='Sending…';state.pushTest={nonce:String(Date.now()),role:state.currentRole,requestedAt:new Date().toISOString()};saveState();setTimeout(()=>{button.disabled=false;button.textContent='Test Push';},4000);}

function renderTasks(){
  const list=document.getElementById('tasks-list');const tasks=state.tasks.filter(t=>t.status==='pending');
  list.innerHTML=tasks.length?tasks.map(t=>`<button onclick="showTaskDetailById(${t.id})" class="w-full text-left glass rounded-3xl p-5 dynamic-card"><div class="flex justify-between gap-4"><div><div class="font-semibold text-lg">${escapeText(titleCase(t.title))}</div><div class="text-sm text-[#d4af37]/80 mt-1">${escapeText(t.desc||'')}</div><div class="text-xs ${getTimeLeft(t).color} mt-3"><i class="fa-regular fa-clock"></i> ${getTimeLeft(t).text}</div><div class="text-xs text-[#d4af37]/70 mt-2">Requires: ${(t.requiredEvidence||[]).map(titleCase).join(', ')||'No Evidence'}</div></div><i class="fa-solid fa-chevron-right text-[#d4af37]/50 mt-2"></i></div></button>`).join(''):'<div class="text-center py-8 text-[#d4af37]/50">No Pending Tasks.</div>';
}

function showAddTaskModal(){
  const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);const modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-lg max-h-[92vh] overflow-auto rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="text-xl font-semibold mb-5">Assign New Task</div><div class="space-y-4"><input id="task-title" class="beautiful-input w-full px-4 py-3 rounded-2xl" placeholder="Task Title"><textarea id="task-desc" rows="3" class="beautiful-input w-full px-4 py-3 rounded-2xl" placeholder="Instructions"></textarea><div class="grid grid-cols-2 gap-3"><label class="text-xs text-[#d4af37]/70">DUE DATE<input id="task-due" type="date" value="${tomorrow}" class="w-full px-3 py-3 rounded-2xl mt-1"></label><label class="text-xs text-[#d4af37]/70">TIME (OPTIONAL)<input id="task-time" type="time" class="w-full px-3 py-3 rounded-2xl mt-1"></label></div><select id="task-cat" class="w-full px-4 py-3 rounded-2xl"><option>Service</option><option>Chore</option><option>Personal</option><option>Punishment Task</option></select><div><div class="text-xs text-[#d4af37]/70 mb-2">REQUIRED LIVE EVIDENCE</div><div class="grid grid-cols-2 gap-2">${[['photo','Photo'],['video','Video'],['voice','Voice Note'],['text','Text Report']].map(([id,label])=>`<label class="bg-white/5 p-3 rounded-2xl text-sm"><input type="checkbox" id="ev-${id}" class="accent-[#8B0000] mr-2">${label}</label>`).join('')}</div></div></div><div class="flex gap-3 mt-6"><button onclick="this.closest('.fixed').remove()" class="flex-1 py-3 border border-white/20 rounded-2xl">Cancel</button><button onclick="addNewTask(this)" class="flex-1 py-3 bg-[#8B0000] rounded-2xl">Assign</button></div></div></div>`;document.getElementById('modal-container').appendChild(modal);
}
function addNewTask(button){
  const title=titleCase(document.getElementById('task-title').value||'Untitled Task'),date=document.getElementById('task-due').value,time=document.getElementById('task-time').value;
  const required=['photo','video','voice','text'].filter(type=>document.getElementById(`ev-${type}`).checked);
  const task={id:Date.now(),title,desc:document.getElementById('task-desc').value.trim(),due:date,dueAt:`${date}T${time||'23:59'}:00`,category:document.getElementById('task-cat').value,status:'pending',priority:2,requiredEvidence:required,assignedAt:new Date().toISOString(),evidence:[]};
  state.tasks.unshift(task);if(task.category==='Punishment Task')state.punishments.unshift({id:Date.now()+1,title:task.title,desc:task.desc,kind:'task',linkedTaskId:task.id,status:'active',assignedAt:new Date().toISOString()});saveState();button.closest('.fixed').remove();renderTasks();renderDashboard();showConfetti(25);
}

function evidenceInput(type,task){
  if(type==='text')return`<label class="block"><span class="text-xs text-[#d4af37]/70">TEXT REPORT</span><textarea id="evidence-text" rows="4" class="w-full px-4 py-3 rounded-2xl mt-1" placeholder="Write Your Report..."></textarea></label>`;
  const icon={photo:'fa-camera',video:'fa-video',voice:'fa-microphone'}[type],label=titleCase(type==='voice'?'Voice Note':type),has=capturedEvidence.get(task.id)?.[type];
  return`<button onclick="openLiveCapture('${type}',${task.id})" class="w-full flex items-center justify-between p-4 glass rounded-2xl"><span><i class="fa-solid ${icon} mr-3 text-[#d4af37]"></i>${has?`${label} Captured`:`Capture ${label}`}</span><i class="fa-solid ${has?'fa-circle-check text-emerald-400':'fa-chevron-right'}"></i></button>`;
}
function showTaskDetail(task){
  const isSub=state.currentRole==='sub',required=task.requiredEvidence||[];const modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-lg max-h-[92vh] overflow-auto rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="flex justify-between gap-4"><div><div class="text-2xl font-semibold">${escapeText(titleCase(task.title))}</div><div class="text-xs text-[#d4af37]/70 mt-1">${formatUKDate(dueDateFor(task))} at ${formatUKTime(dueDateFor(task))}</div></div><button onclick="this.closest('.fixed').remove()" class="text-2xl">×</button></div><div class="rich-prose text-sm my-5">${escapeText(task.desc||'No Additional Instructions.')}</div>${task.status==='completed'?`<div class="space-y-3"><div class="text-xs text-emerald-400 tracking-widest">COMPLETED</div>${renderSubmittedEvidence(task)}</div>`:isSub?`<div class="space-y-3">${required.map(type=>evidenceInput(type,task)).join('')||'<div class="text-sm opacity-60">No Evidence Required.</div>'}</div><button onclick="submitTaskEvidence(${task.id},this)" class="w-full mt-6 py-3 bg-emerald-900 rounded-2xl">Submit & Complete</button>`:'<div class="text-sm text-[#d4af37]/70">Waiting For Jacob.</div>'}</div></div>`;document.getElementById('modal-container').appendChild(modal);
}

async function openLiveCapture(type,taskId,forJournal=false){
  const constraints=type==='voice'?{audio:true}:{video:{facingMode:'environment'},audio:type==='video'};
  try{
    const stream=await navigator.mediaDevices.getUserMedia(constraints);const modal=document.createElement('div');activeCapture={stream,type,taskId,forJournal,modal,recorder:null,chunks:[]};
    modal.innerHTML=`<div class="fixed inset-0 bg-black z-[250] flex flex-col p-5 safe-bottom capture-stage"><div class="flex justify-between mb-4"><div class="text-xl font-semibold">${type==='photo'?'Take Photo':type==='video'?'Record Video':'Record Voice Note'}</div><button onclick="closeCapture()" class="text-2xl">×</button></div>${type==='voice'?'<div class="flex-1 flex items-center justify-center"><i class="fa-solid fa-microphone-lines text-8xl text-[#d4af37]"></i></div>':'<video id="capture-preview" autoplay playsinline muted class="flex-1"></video>'}<div class="mt-5 flex justify-center gap-3">${type==='photo'?'<button onclick="takeLivePhoto()" class="px-8 py-4 bg-white text-black rounded-full font-semibold"><i class="fa-solid fa-camera mr-2"></i>Take Photo</button>':'<button id="record-button" onclick="toggleRecording()" class="px-8 py-4 bg-red-700 rounded-full font-semibold"><i class="fa-solid fa-circle mr-2"></i>Record</button>'}</div></div>`;document.body.appendChild(modal);if(type!=='voice')document.getElementById('capture-preview').srcObject=stream;
  }catch(error){console.error(error);alert('Camera or microphone access was not granted.');}
}
function closeCapture(){if(activeCapture){activeCapture.stream?.getTracks().forEach(t=>t.stop());activeCapture.modal?.remove();activeCapture=null;}}
function storeCapture(blob,type){
  const extension=type==='photo'?'jpg':blob.type.includes('mp4')?'mp4':'webm';
  if(activeCapture.forJournal)journalCapture={blob,type,name:`live-${type}-${Date.now()}.${extension}`};else{const entry=capturedEvidence.get(activeCapture.taskId)||{};entry[type]={blob,name:`live-${type}-${Date.now()}.${extension}`};capturedEvidence.set(activeCapture.taskId,entry);}closeCapture();showToast(`${titleCase(type)} Captured`,'success');
}
function takeLivePhoto(){const video=document.getElementById('capture-preview'),canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext('2d').drawImage(video,0,0);canvas.toBlob(blob=>storeCapture(blob,'photo'),'image/jpeg',.88);}
function toggleRecording(){
  if(!activeCapture.recorder){const candidates=activeCapture.type==='voice'?['audio/mp4','audio/webm;codecs=opus','audio/webm']:['video/mp4','video/webm;codecs=vp8,opus','video/webm'];const mime=candidates.find(t=>MediaRecorder.isTypeSupported(t));activeCapture.recorder=new MediaRecorder(activeCapture.stream,mime?{mimeType:mime}:undefined);activeCapture.chunks=[];activeCapture.recorder.ondataavailable=e=>{if(e.data.size)activeCapture.chunks.push(e.data)};activeCapture.recorder.onstop=()=>storeCapture(new Blob(activeCapture.chunks,{type:activeCapture.recorder.mimeType}),activeCapture.type);activeCapture.recorder.start();const b=document.getElementById('record-button');b.innerHTML='<i class="fa-solid fa-stop mr-2"></i>Stop & Use';b.classList.replace('bg-red-700','bg-emerald-800');}
  else activeCapture.recorder.stop();
}

async function submitTaskEvidence(taskId,button){
  const task=state.tasks.find(t=>t.id===taskId),required=task.requiredEvidence||[],captures=capturedEvidence.get(taskId)||{},text=document.getElementById('evidence-text')?.value.trim();
  if(required.includes('text')&&!text)return alert('Please Complete The Text Report.');for(const type of required.filter(t=>t!=='text'))if(!captures[type])return alert(`Please Capture The Required ${titleCase(type)}.`);
  button.disabled=true;const items=[];if(text)items.push({type:'text',value:text});
  try{for(const type of required.filter(t=>t!=='text')){const capture=captures[type],file=new File([capture.blob],capture.name,{type:capture.blob.type}),ref=evidenceStorage.ref(`evidence/${taskId}/${capture.name}`);button.textContent=`Uploading ${titleCase(type)}…`;const url=await uploadEvidenceFile(ref,file,button);items.push({type,name:capture.name,url,size:file.size,live:true});}task.evidence=items;task.report=text||'';state.evidence.unshift({id:Date.now(),taskId,title:task.title,date:new Date().toISOString(),items});button.textContent='Saving Completion…';await completeTask(taskId);capturedEvidence.delete(taskId);button.closest('.fixed').remove();}
  catch(error){console.error(error);button.disabled=false;button.textContent='Submit & Complete';alert('Submission Failed. Please Check Your Connection And Try Again.');}
}

async function completeTask(taskId){
  const task=state.tasks.find(t=>t.id===taskId);if(!task)return;const backup=JSON.stringify(state);task.status='completed';task.completedAt=new Date().toISOString();task.completedDate=task.completedAt.slice(0,10);const earned=task.priority||1;state.stars=(state.stars||0)+earned;state.starLog.unshift({id:Date.now(),date:task.completedDate,reason:`Completed: ${task.title}`,amount:earned});state.punishments.forEach(p=>{if(p.status==='active'&&String(p.linkedTaskId)===String(taskId)){p.status='completed';p.completedAt=task.completedAt;}});state.activityLog.unshift({id:Date.now(),type:'sub',entityType:'task',entityId:task.id,message:`Completed: ${task.title}`,time:formatUKTime()});localStorage.setItem('the_system_v4',JSON.stringify(state));try{await sharedStateDocument.set(getSharedState());showConfetti(50);renderDashboard();renderTasks();}catch(error){state=JSON.parse(backup);localStorage.setItem('the_system_v4',backup);throw error;}
}

function showAddPunishmentModal(){
  const today=new Date().toISOString().slice(0,10),pending=state.tasks.filter(t=>t.status==='pending');const modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="text-xl font-semibold mb-5">Assign Punishment</div><div class="space-y-4"><input id="punish-title" class="w-full px-4 py-3 rounded-2xl" placeholder="Punishment Title"><textarea id="punish-desc" class="w-full px-4 py-3 rounded-2xl" rows="3" placeholder="Details"></textarea><select id="punish-kind" onchange="togglePunishmentFields()" class="w-full px-4 py-3 rounded-2xl"><option value="timed">Timed Punishment</option><option value="task">Punishment Task</option></select><div id="timed-punishment" class="grid grid-cols-2 gap-3"><input id="punish-due" type="date" value="${today}" class="px-3 py-3 rounded-2xl"><input id="punish-time" type="time" value="23:59" class="px-3 py-3 rounded-2xl"></div><select id="punish-task" class="hidden w-full px-4 py-3 rounded-2xl">${pending.map(t=>`<option value="${t.id}">${escapeText(t.title)}</option>`).join('')}</select></div><button onclick="addNewPunishment(this)" class="w-full mt-6 py-3 bg-red-900 rounded-2xl">Assign Punishment</button></div></div>`;document.getElementById('modal-container').appendChild(modal);
}
function togglePunishmentFields(){const task=document.getElementById('punish-kind').value==='task';document.getElementById('timed-punishment').classList.toggle('hidden',task);document.getElementById('punish-task').classList.toggle('hidden',!task);}
function addNewPunishment(button){const kind=document.getElementById('punish-kind').value,date=document.getElementById('punish-due').value,time=document.getElementById('punish-time').value;state.punishments.unshift({id:Date.now(),title:titleCase(document.getElementById('punish-title').value||'Untitled Punishment'),desc:document.getElementById('punish-desc').value.trim(),kind,linkedTaskId:kind==='task'?Number(document.getElementById('punish-task').value):null,due:date,dueAt:kind==='timed'?`${date}T${time||'23:59'}:00`:null,status:'active',assignedAt:new Date().toISOString()});saveState();button.closest('.fixed').remove();renderPunishments();renderDashboard();}
function renderPunishments(){const active=document.getElementById('punishments-active'),history=document.getElementById('punishments-history'),items=activePunishments();active.innerHTML=items.map(p=>`<div class="glass border-l-4 border-red-700 p-5 rounded-3xl"><div class="font-semibold text-lg">${escapeText(p.title)}</div><div class="text-sm mt-1">${escapeText(p.desc||'')}</div><div class="text-xs text-[#d4af37]/70 mt-3">${p.kind==='task'?`Completes With Task: ${escapeText(state.tasks.find(t=>String(t.id)===String(p.linkedTaskId))?.title||'Linked Task')}`:`Time Remaining: <span class="countdown" data-countdown="${p.id}">${getTimeLeft(p).text}</span>`}</div></div>`).join('')||'<div class="text-sm text-[#d4af37]/60">No Active Punishments.</div>';history.innerHTML=state.punishments.filter(p=>p.status==='completed').map(p=>`<div class="glass rounded-2xl px-4 py-3">${escapeText(p.title)} <span class="text-emerald-400 float-right">Complete</span></div>`).join('');updateCountdowns();}

function renderStarChart(){
  document.getElementById('star-total-big').textContent=state.stars||0;const log=document.getElementById('star-log-list');log.innerHTML=(state.starLog||[]).slice(0,25).map(s=>`<div class="flex justify-between px-4 py-3 glass rounded-2xl"><span>${escapeText(s.reason)}</span><span class="text-[#d4af37]">+${s.amount} ★</span></div>`).join('')||'<div class="text-sm opacity-60">No Stars Earned Yet.</div>';
  let badges=document.getElementById('badge-grid');if(!badges){badges=document.createElement('div');badges.id='badge-grid';document.getElementById('tab-stars').appendChild(badges);}badges.innerHTML=`<div class="font-semibold text-xl mt-8 mb-3">Badges & Awards</div><div class="grid grid-cols-2 gap-3">${SYSTEM_BADGES.map(b=>{const earned=state.badges.some(x=>x.id===b.id);return`<button onclick="showBadge('${b.id}')" class="badge-tile glass rounded-3xl p-4 text-left ${earned?'border border-[#d4af37]/50':'opacity-65'}"><i class="fa-solid ${b.icon} text-2xl ${earned?'text-[#d4af37]':'text-white/40'}"></i><div class="font-semibold mt-3">${b.name}</div><div class="text-[10px] mt-1 ${earned?'text-emerald-400':'text-white/40'}">${earned?'AUTHORISED':'LOCKED'}</div></button>`}).join('')}</div>`;
}
function showBadge(id){const badge=SYSTEM_BADGES.find(b=>b.id===id),earned=state.badges.some(x=>x.id===id);const modal=document.createElement('div');modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-6" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass rounded-3xl p-7 max-w-sm text-center"><i class="fa-solid ${badge.icon} text-6xl text-[#d4af37] mb-5"></i><div class="text-2xl font-semibold">${badge.name}</div><div class="text-sm mt-3 opacity-80">${badge.goal}</div>${state.currentRole==='dom'&&!earned?`<button onclick="authoriseBadge('${id}',this)" class="w-full mt-6 py-3 bg-[#8B0000] rounded-2xl">Authorise Award</button>`:`<div class="mt-6 text-sm ${earned?'text-emerald-400':'opacity-50'}">${earned?'Awarded By Sir':'Awaiting Authorisation'}</div>`}</div></div>`;document.getElementById('modal-container').appendChild(modal);}
function authoriseBadge(id,button){state.badges.push({id,authorisedAt:new Date().toISOString()});saveState();button.closest('.fixed').remove();renderStarChart();showConfetti(60);}

function renderJournal(){const box=document.getElementById('journal-entries');box.innerHTML=state.journal.map(e=>`<button onclick="openJournalEntry(${e.id})" class="w-full text-left glass rounded-3xl p-5"><div class="flex justify-between"><div><div class="font-semibold text-lg">${escapeText(titleCase(e.title))}</div><div class="text-xs text-[#d4af37]/70">${formatUKDate(e.date)}</div></div><i class="fa-solid fa-feather text-[#d4af37]"></i></div><div class="text-sm mt-3 line-clamp-2 opacity-75">${escapeText(e.body||'')}</div></button>`).join('')||'<div class="text-center py-8 text-[#d4af37]/50">No Journal Entries Yet.</div>';}
function showNewJournalModal(){journalCapture=null;const modal=document.createElement('div');modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="text-xl font-semibold mb-5">New Journal Entry</div><input id="journal-title" class="w-full px-4 py-3 rounded-2xl mb-3" placeholder="Entry Title"><textarea id="journal-body" rows="7" class="w-full px-4 py-3 rounded-2xl" placeholder="Write Freely..."></textarea><div class="grid grid-cols-2 gap-3 mt-3"><button onclick="openLiveCapture('photo',0,true)" class="p-3 glass rounded-2xl"><i class="fa-solid fa-camera mr-2"></i>Live Photo</button><button onclick="openLiveCapture('video',0,true)" class="p-3 glass rounded-2xl"><i class="fa-solid fa-video mr-2"></i>Live Video</button></div><button onclick="addJournalEntry(this)" class="w-full mt-5 py-3 bg-[#8B0000] rounded-2xl">Save Entry</button></div></div>`;document.getElementById('modal-container').appendChild(modal);}
async function addJournalEntry(button){const title=titleCase(document.getElementById('journal-title').value||'Journal Entry'),body=document.getElementById('journal-body').value.trim();if(!body)return alert('Please Write Something First.');button.disabled=true;const attachments=[];try{if(journalCapture){button.textContent='Uploading Capture…';const file=new File([journalCapture.blob],journalCapture.name,{type:journalCapture.blob.type}),ref=evidenceStorage.ref(`journal/${Date.now()}/${journalCapture.name}`),url=await uploadEvidenceFile(ref,file,button);attachments.push({type:journalCapture.type,url,live:true});}state.journal.unshift({id:Date.now(),title,body,date:new Date().toISOString(),attachments});saveState();button.closest('.fixed').remove();renderJournal();renderDashboard();}catch(e){button.disabled=false;button.textContent='Save Entry';alert('Journal Capture Could Not Be Uploaded.');}}
function openJournalEntry(id){const e=state.journal.find(x=>x.id===id);if(!e)return;const modal=document.createElement('div');modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><article onclick="event.stopImmediatePropagation()" class="bg-[#151515] w-full max-w-2xl max-h-[94vh] overflow-auto rounded-t-[2rem] md:rounded-[2rem] p-7 safe-bottom"><button onclick="this.closest('.fixed').remove()" class="float-right text-2xl">×</button><div class="text-xs tracking-widest text-[#d4af37]">${formatUKDate(e.date)} · ${formatUKTime(e.date)}</div><h1 class="text-4xl heading-serif mt-3 mb-6">${escapeText(titleCase(e.title))}</h1><div class="rich-prose text-base">${escapeText(e.body)}</div>${(e.attachments||[]).map(a=>a.type==='photo'?`<img src="${a.url}" class="w-full rounded-3xl mt-6">`:`<video src="${a.url}" controls playsinline class="w-full rounded-3xl mt-6"></video>`).join('')}</article></div>`;document.getElementById('modal-container').appendChild(modal);}

function renderLimits(){const box=document.getElementById('limits-container');box.innerHTML=LIMIT_GROUPS.map(([key,label,icon,color])=>`<section class="glass rounded-3xl p-5"><div class="flex items-center gap-3 mb-3"><i class="fa-solid ${icon} ${color}"></i><div class="font-semibold">${label}</div></div><div class="space-y-2">${(state.limits[key]||[]).map((item,i)=>`<div class="flex gap-3 text-sm bg-white/5 rounded-2xl px-4 py-3"><span class="rule-number">${i+1}</span><span>${escapeText(typeof item==='string'?item:item.text)}</span></div>`).join('')||'<div class="text-xs opacity-40">Nothing Listed.</div>'}</div></section>`).join('');}
function showAddLimitModal(){const modal=document.createElement('div');modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="text-xl font-semibold mb-5">Add Limit Or Preference</div><select id="limit-category" class="w-full px-4 py-3 rounded-2xl mb-3">${LIMIT_GROUPS.map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select><input id="limit-text" class="w-full px-4 py-3 rounded-2xl" placeholder="Describe It"><button onclick="addLimit(this)" class="w-full mt-5 py-3 bg-[#8B0000] rounded-2xl">Add</button></div></div>`;document.getElementById('modal-container').appendChild(modal);}
function addLimit(button){const category=document.getElementById('limit-category').value,text=titleCase(document.getElementById('limit-text').value);if(!text)return alert('Please Describe It.');state.limits[category]=state.limits[category]||[];state.limits[category].push(text);saveState();button.closest('.fixed').remove();renderLimits();}
function renderRules(){const tab=document.getElementById('tab-rules');tab.innerHTML=`<div class="flex justify-between items-center mb-6"><div class="section-header">Rules & Protocols</div></div><div class="space-y-4">${RULE_SECTIONS.map(([key,label,icon])=>`<section class="glass rounded-3xl p-5"><div class="flex justify-between items-center mb-4"><div class="flex items-center gap-3"><i class="fa-solid ${icon} text-[#d4af37]"></i><div class="font-semibold">${label}</div></div>${state.currentRole==='dom'?`<button onclick="editSection('${key}')" class="text-xs px-3 py-1 bg-white/10 rounded-2xl">Edit</button>`:''}</div><div class="space-y-2">${(state.rules[key]||'').split('\n').map(x=>x.replace(/^\s*(?:[•\-]|\d+[.)])\s*/, '')).filter(Boolean).map((line,i)=>`<div class="flex gap-3 text-sm"><span class="rule-number">${i+1}</span><span>${escapeText(line)}</span></div>`).join('')||'<div class="text-xs opacity-40">Nothing Set.</div>'}</div></section>`).join('')}</div>`;}

function showDisclosureComposer(){const modal=document.createElement('div');modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-lg max-h-[90vh] overflow-auto rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="flex justify-between"><div><div class="text-xl font-semibold">Private Disclosure</div><div class="text-xs text-[#d4af37]/70 mt-1">A Safe Place For Difficult Words</div></div><button onclick="this.closest('.fixed').remove()" class="text-2xl">×</button></div><input id="disclosure-title" class="w-full px-4 py-3 rounded-2xl mt-5" placeholder="Title"><textarea id="disclosure-body" rows="7" class="w-full px-4 py-3 rounded-2xl mt-3" placeholder="Tell Sir What You Need Him To Know..."></textarea><button onclick="sendDisclosure(this)" class="w-full mt-4 py-3 bg-[#8B0000] rounded-2xl">Send Privately</button><div class="mt-7 text-xs tracking-widest text-[#d4af37]">YOUR INBOX</div><div class="space-y-2 mt-3">${state.disclosures.filter(d=>d.reply).map(d=>`<div class="glass rounded-2xl p-4"><div class="font-semibold">${escapeText(d.title)}</div><div class="text-sm text-emerald-300 mt-2">${escapeText(d.reply)}</div></div>`).join('')||'<div class="text-sm opacity-50">No Replies Yet.</div>'}</div></div></div>`;document.getElementById('modal-container').appendChild(modal);}
function sendDisclosure(button){const title=titleCase(document.getElementById('disclosure-title').value||'Private Disclosure'),body=document.getElementById('disclosure-body').value.trim();if(!body)return alert('Please Write Your Message.');state.disclosures.unshift({id:String(Date.now()),title,body,status:'unread',createdAt:new Date().toISOString(),reply:''});saveState();button.closest('.fixed').remove();showToast('Disclosure Sent Safely','success');}
function showDomHub(){const modal=document.createElement('div');modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-2xl max-h-[92vh] overflow-auto rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="flex justify-between"><div class="text-xl font-semibold">Dom Control Centre</div><button onclick="this.closest('.fixed').remove()" class="text-2xl">×</button></div><div class="grid grid-cols-2 gap-3 mt-5"><button onclick="showSendCheckIn()" class="p-4 bg-[#8B0000] rounded-2xl"><i class="fa-solid fa-heart-pulse mr-2"></i>Send Check-In</button><button onclick="showCheckInHistory()" class="p-4 bg-white/10 rounded-2xl"><i class="fa-solid fa-chart-line mr-2"></i>History</button></div><div class="text-xs tracking-widest text-[#d4af37] mt-7 mb-3">PRIVATE DISCLOSURES</div><div class="space-y-3">${state.disclosures.map(d=>`<button onclick="openDisclosure('${d.id}')" class="w-full text-left glass rounded-2xl p-4"><div class="flex justify-between"><span class="font-semibold">${escapeText(d.title)}</span><span class="text-xs ${d.reply?'text-emerald-400':'text-amber-400'}">${d.reply?'Replied':'Needs Reply'}</span></div><div class="text-sm opacity-70 mt-2 line-clamp-2">${escapeText(d.body)}</div></button>`).join('')||'<div class="text-sm opacity-50">Inbox Empty.</div>'}</div></div></div>`;document.getElementById('modal-container').appendChild(modal);}
function openDisclosure(id){const d=state.disclosures.find(x=>x.id===id);const modal=document.createElement('div');modal.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass max-w-lg w-full rounded-3xl p-6"><div class="text-xs text-[#d4af37]">${formatUKDate(d.createdAt)} at ${formatUKTime(d.createdAt)}</div><div class="text-2xl font-semibold mt-2">${escapeText(d.title)}</div><div class="rich-prose mt-5">${escapeText(d.body)}</div><textarea id="disclosure-reply" rows="4" class="w-full px-4 py-3 rounded-2xl mt-6" placeholder="A Gentle Reply...">${escapeText(d.reply||'')}</textarea><button onclick="replyDisclosure('${id}',this)" class="w-full mt-3 py-3 bg-emerald-900 rounded-2xl">Send Reply</button></div></div>`;document.getElementById('modal-container').appendChild(modal);}
function replyDisclosure(id,button){const d=state.disclosures.find(x=>x.id===id);d.reply=document.getElementById('disclosure-reply').value.trim();d.replyAt=new Date().toISOString();d.status='replied';saveState();button.closest('.fixed').remove();showToast('Reply Sent','success');}

function showSendCheckIn(){const modal=document.createElement('div');modal.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass max-w-lg w-full rounded-3xl p-6"><div class="text-xl font-semibold">Send 10-Minute Check-In</div><div class="text-sm opacity-70 mt-2">Jacob will receive a push and have ten minutes to respond.</div><textarea id="checkin-activities" rows="3" class="w-full px-4 py-3 rounded-2xl mt-5" placeholder="Optional Activities To Rate, One Per Line"></textarea><button onclick="sendCheckIn(this)" class="w-full mt-4 py-3 bg-[#8B0000] rounded-2xl">Send Check-In Now</button></div></div>`;document.getElementById('modal-container').appendChild(modal);}
function sendCheckIn(button){const now=new Date(),activities=document.getElementById('checkin-activities').value.split('\n').map(titleCase).filter(Boolean);state.checkIns.unshift({id:String(Date.now()),sentAt:now.toISOString(),expiresAt:new Date(now.getTime()+600000).toISOString(),status:'pending',activities,answers:null});saveState();button.closest('.fixed').remove();showToast('Check-In Sent','success');}
function openCheckIn(id){const c=state.checkIns.find(x=>x.id===id);if(!c||new Date(c.expiresAt)<=new Date())return alert('This Check-In Has Expired.');const dims=['Harshness','Control','Firmness','Fairness','Power'];const modal=document.createElement('div');modal.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[180] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="bg-[#151515] w-full max-w-xl max-h-[95vh] overflow-auto rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="text-xs tracking-widest text-[#d4af37]">RELATIONSHIP CHECK-IN</div><div class="text-2xl font-semibold mt-2">Are You Happy With Our Dominant Relationship Agreement?</div><select id="check-happy" class="w-full px-4 py-3 rounded-2xl mt-4"><option>Yes</option><option>Mostly</option><option>Unsure</option><option>No</option></select><div class="text-sm mt-6 mb-3">Please Detail The Following Areas</div>${dims.map(d=>`<label class="block mb-3"><span class="text-xs text-[#d4af37]/70">${d.toUpperCase()}</span><select data-dimension="${d.toLowerCase()}" class="w-full px-4 py-3 rounded-2xl mt-1"><option value="less">Less ${d}</option><option value="just-right" selected>Just Right</option><option value="more">More ${d}</option></select></label>`).join('')}${(c.activities||[]).map((a,i)=>`<div class="glass rounded-2xl p-4 mt-3"><div class="font-semibold">${escapeText(a)}</div><label class="text-xs block mt-3">1 = Less / 5 = More<input data-rating="${i}" type="range" min="1" max="5" value="3" class="w-full"></label><input data-feedback="${i}" class="w-full px-3 py-2 rounded-xl mt-2" placeholder="Five Words Maximum"></div>`).join('')}<button onclick="submitCheckIn('${id}',this)" class="w-full mt-6 py-3 bg-emerald-900 rounded-2xl">Submit Check-In</button></div></div>`;document.getElementById('modal-container').appendChild(modal);}
function submitCheckIn(id,button){const c=state.checkIns.find(x=>x.id===id);if(new Date(c.expiresAt)<=new Date())return alert('This Check-In Has Expired.');const dimensions={};document.querySelectorAll('[data-dimension]').forEach(el=>dimensions[el.dataset.dimension]=el.value);const activityRatings=(c.activities||[]).map((name,i)=>{const words=document.querySelector(`[data-feedback="${i}"]`).value.trim().split(/\s+/).filter(Boolean).slice(0,5).join(' ');return{name,rating:Number(document.querySelector(`[data-rating="${i}"]`).value),feedback:words};});c.answers={happy:document.getElementById('check-happy').value,dimensions,activityRatings};c.status='completed';c.completedAt=new Date().toISOString();saveState();button.closest('.fixed').remove();renderDashboard();showToast('Check-In Submitted','success');}
function showCheckInHistory(){const modal=document.createElement('div');modal.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[220] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass w-full max-w-2xl max-h-[92vh] overflow-auto rounded-t-3xl md:rounded-3xl p-6 safe-bottom"><div class="text-xl font-semibold mb-5">Check-In History</div><div class="space-y-3">${state.checkIns.map(c=>`<div class="glass rounded-2xl p-4"><div class="flex justify-between"><span>${formatUKDate(c.sentAt)} at ${formatUKTime(c.sentAt)}</span><span class="text-xs ${c.status==='completed'?'text-emerald-400':'text-amber-400'}">${titleCase(c.status)}</span></div>${c.answers?`<div class="mt-3 text-sm">Agreement: ${escapeText(c.answers.happy)}</div><div class="grid grid-cols-2 gap-2 mt-2 text-xs">${Object.entries(c.answers.dimensions).map(([k,v])=>`<div class="bg-white/5 rounded-xl p-2">${titleCase(k)}: ${titleCase(v.replace('-',' '))}</div>`).join('')}</div>${(c.answers.activityRatings||[]).map(a=>`<div class="text-sm mt-2">${escapeText(a.name)}: ${a.rating}/5 · ${escapeText(a.feedback)}</div>`).join('')}`:''}</div>`).join('')||'<div class="opacity-50">No Check-Ins Yet.</div>'}</div></div></div>`;document.getElementById('modal-container').appendChild(modal);}

function showSettings(){state.currentRole==='dom'?showDomHub():showDisclosureComposer();}

function enhancedInitialize(){
  loadState();migrateEnhancedState();
  if(!state.activityLog.length)state.activityLog=[];
  knownTaskStatuses=new Map(state.tasks.map(t=>[t.id,t.status]));connectFirestore();buildKeypad();updateRoleUI();navigateToTab('dashboard');
  document.querySelector('[onclick="navigateToTab(\'evidence\')"]')?.classList.add('hidden');
  clearInterval(countdownTimer);countdownTimer=setInterval(()=>{activePunishments();updateCountdowns();},1000);
}

window.onload=enhancedInitialize;
