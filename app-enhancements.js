/* ============================================================
   The System v5 — app-enhancements.js
   Drop-in overlay for index.html.
   Replaces window.onload, nav, login screen and ALL tab renders.
   ============================================================ */

/* ── Version gate: forces one clean navigation when new build detected ── */
(function(){
  var BUILD='v5-20260629-01';
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
/* 15 aspiration badges — longer-term goals James can award */
const ASPIRATION_BADGES = [
  {id:'asp-devotion',name:'Devotion',icon:'fa-hands-praying',goal:'Maintain protocol for a full month.'},
  {id:'asp-discipline',name:'Iron Discipline',icon:'fa-dumbbell',goal:'Complete twenty tasks.'},
  {id:'asp-truth',name:'Open Book',icon:'fa-book-open-reader',goal:'Write fifteen honest journal entries.'},
  {id:'asp-poise',name:'Poise',icon:'fa-chess-king',goal:'No missed deadlines for two weeks.'},
  {id:'asp-trust',name:'Deep Trust',icon:'fa-handshake-angle',goal:'Complete a hard limit conversation.'},
  {id:'asp-service',name:'True Service',icon:'fa-bell-concierge',goal:'Earn one hundred stars.'},
  {id:'asp-ritual',name:'Ritual Keeper',icon:'fa-hourglass-half',goal:'Complete ten consequences.'},
  {id:'asp-grace',name:'Grace',icon:'fa-dove',goal:'Thirty days of good-morning messages.'},
  {id:'asp-focus',name:'Stillness',icon:'fa-spa',goal:'Complete every meditation task for a week.'},
  {id:'asp-courage',name:'Courage',icon:'fa-fire',goal:'Try three new things from your list.'},
  {id:'asp-presence',name:'Presence',icon:'fa-eye',goal:'Submit evidence on first request, ten times.'},
  {id:'asp-loyalty',name:'Loyalty',icon:'fa-shield',goal:'Six months in the dynamic.'},
  {id:'asp-growth',name:'Growth',icon:'fa-seedling',goal:'Raise a check-in score over time.'},
  {id:'asp-surrender',name:'Surrender',icon:'fa-feather-pointed',goal:'Complete a full scene as instructed.'},
  {id:'asp-legend',name:'Cornerstone',icon:'fa-gem',goal:'Earn five hundred stars.'}
];
function allBadges(){ return [...SYSTEM_BADGES,...ASPIRATION_BADGES,...ensureArray(state.customBadges)]; }

/* Service ladder — milestone levels Jacob climbs through starred dedication */
const SERVICE_LADDER = [
  {id:'sl-1', level:1, title:'Prospect',    icon:'fa-seedling',   stars:0,   col:'#9b9890', desc:'Just starting out.'},
  {id:'sl-2', level:2, title:'Initiate',    icon:'fa-fire',       stars:25,  col:'#c6a642', desc:'Beginning to understand.'},
  {id:'sl-3', level:3, title:'Committed',   icon:'fa-link',       stars:75,  col:'#8faf97', desc:'Proven, consistent service.'},
  {id:'sl-4', level:4, title:'Devoted',     icon:'fa-heart',      stars:150, col:'#d97c8a', desc:'Deep loyalty demonstrated.'},
  {id:'sl-5', level:5, title:'Established', icon:'fa-shield',     stars:300, col:'#315b7a', desc:'Trusted in all things.'},
  {id:'sl-6', level:6, title:'Cornerstone', icon:'fa-gem',        stars:500, col:'#c6a642', desc:'The gold standard. Irreplaceable.'}
];
/* Rules sections — no "Protocols" naming */
const RULE_SECTIONS = [
  ['arrivalProcedure','Arrival Procedure','fa-door-open'],
  ['houseRules','House Rules','fa-house-chimney'],
  ['communication','Communication Rules','fa-comments'],
  ['outOfSession','Out Of Session','fa-moon']
];
/* Consequence categories — numbered lists James builds */
const CONSEQUENCE_CATEGORIES = [
  ['humiliation','Humiliation','fa-face-flushed'],
  ['degradation','Degradation','fa-arrow-down-wide-short'],
  ['identification','Identification','fa-id-badge'],
  ['pain','Pain','fa-bolt'],
  ['service','Service','fa-hands-holding'],
  ['control','Control','fa-hand-fist'],
  ['loss','Loss','fa-ban'],
  ['timewaste','Time Waste','fa-hourglass-half'],
  ['phone','Phone','fa-mobile-screen'],
  ['application','Application','fa-mobile-button']
];
/* Order top→bottom: Loves, Likes, Tries, Soft, Hard (Hard last, hideable) */
const LIMIT_GROUPS = [
  ['loves','Loves','fa-heart'],
  ['likes','Likes','fa-thumbs-up'],
  ['tries','Willing To Try','fa-flask'],
  ['supplements','Soft Limits','fa-hand'],
  ['hard','Hard Limits','fa-ban']
];
/* Impact play — implements + body areas for mapping */
const IMPACT_IMPLEMENTS = ['Dragon Cane','Leather Paddle','Long Riding Crop','Rubber Flogger','Rubber Paddle','School Cane','Short Riding Crop','Spiked Paddle','Tawse','Whip','Wooden Paddle'];
const IMPACT_AREAS = ['Armpit','Ass Cheeks','Asshole','Bicep','Balls','Chest','Dick Shaft Bottom','Dick Shaft Top','Dickhead Bottom','Dickhead Top','Face','Inner Thighs','Lower Back','Lower Calf','Lower Tummy','Neck','Nipple','Obliques','Outer Thigh','Shoulders','Side Of Balls','Tongue','Underneath Ass Cheeks','Underneath Balls','Upper Ass Cheek','Upper Back'];
/* Electro items — alphabetised */
const ELECTRO_ITEMS = ['Anal Plug, Extra Large','Anal Plug, Large','Anal Plug, Medium','Anal Plug, Small','Arsehole','Glands / Dickhead','Gucci','Tongue'];
const NAV_ITEMS = [
  ['dashboard','Home','fa-house'],
  ['tasks','Tasks','fa-square-check'],
  ['protocols','Rules','fa-section'],
  ['stars','Rewards','fa-star']
];
const DOM_NAV_ITEMS = [...NAV_ITEMS.slice(0,3),['evidence','Evidence','fa-photo-film'],NAV_ITEMS[3]];
const DEFAULT_PHOTO = 'https://i.pravatar.cc/320?img=12';

/* ── State: do NOT redeclare `state` — index.html's inline script already
   declares `let state`. Both classic scripts share the same global lexical
   environment, so we reference and assign that SAME binding here. Declaring
   it again (var/let) throws "Identifier 'state' has already been declared"
   and kills this entire file. ── */
var countdownTimer = null;
var activeProtocolPanel = 'rules';
var activeNotificationsFilter = 'all';
var activeEvidenceFilter = 'all';

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
  normalizeState();
}

/* ── Default data ── */
function defaultSystemState(role){
  role=role||'dom';
  const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
  return {
    dynamicName:'The System',domTitle:'James',subTitle:'Jacob',currentRole:role,avatar:DEFAULT_PHOTO,
    stars:8,starLog:[{id:1,date:new Date().toISOString(),reason:'Initial system setup',amount:8}],
    rewardsCatalog:defaultRewardsCatalog(),domProfile:defaultDomProfile(),
    tasks:[{id:101,title:'Morning Meditation + Gratitude',desc:"10 minutes + write 3 things you're grateful for",due:tomorrow,dueAt:tomorrow+'T23:59:00',status:'pending',priority:2,requiredEvidence:['text'],assignedAt:new Date().toISOString(),evidence:[]}],
    punishments:[{id:201,title:'TikTok Ban',desc:'Restricted app access until the timer completes.',kind:'timed',due:tomorrow,dueAt:tomorrow+'T23:59:00',status:'active',assignedAt:new Date().toISOString()}],
    journal:[],journalTags:['reflection','obedience','gratitude','discipline'],evidence:[],activityLog:[{id:1,type:'dom',message:'Welcome to The System. Your first task is waiting.',time:'now'}],
    limits:{hard:['Chems'],supplements:['Public protocol'],tries:['Timed focus'],likes:['Praise','Clear instructions'],loves:['Calm voice','Aftercare']},
    rules:{
      arrivalProcedure:'1. Text when 10 minutes away.\n2. Remove shoes at the door.\n3. Wait in the entryway until greeted.\n4. Offer collar.',
      houseRules:'1. Always address me as Sir.\n2. Daily good morning and good night messages required.\n3. Permission rules apply during protocol time.',
      protocols:'1. Tasks must be acknowledged.\n2. Evidence must be submitted when requested.\n3. Reviews are handled by Sir.',
      communication:'1. Speak clearly.\n2. Ask when unsure.\n3. Log meaningful changes.',
      outOfSession:'1. Boundaries remain active.\n2. Check-ins remain private.\n3. No public assumptions.'
    },
    notifications:[],readNotifIds:[],disclosures:[],checkIns:[],badges:[],customBadges:[],dataVersion:6,
    hideHardLimits:false,auth:{configured:false},pinFails:0,appLock:{locked:false},forceJacobPinChange:false,
    voice:{enabled:false,samples:[]},
    requests:[],helpers:[],memories:[],suggestions:[],suggestionBoxOpen:false,requestBoxOpen:true,activeCheckIn:null,redactedRecords:[],
    consequenceLists:{},bodyPhotos:[],bodyPhotosVisible:false,impactMap:{},
    subProfile:defaultSubProfile(),bodyMaps:defaultBodyMaps(),personalRecords:defaultPersonalRecords(),
    appSettings:{reduceMotion:false,starSpending:true}
  };
}
/* Helper types — each with a strong, instantly-recognisable colour */
const HELPER_TYPES = [
  ['overthinking','Overthinking','fa-brain','#6d5ad6'],
  ['refocusing','Refocusing','fa-bullseye','#2f8f7f'],
  ['timeout','Time Out','fa-hourglass-half','#c77d3a'],
  ['linewriting','Line Writing','fa-pen-nib','#315b7a']
];
/* End-of-video messages from James — degradation/praise play, Title Case.
   Consensual D/s between James and Jacob. A random one shows after the red flash. */
const PRAISE_MESSAGES = [
  'Well Done, Faggot','Such A Good Boy','Such A Little Fag','Well Done, Boy',"Who's A Good Boy Now?",
  'And Control, You? Fuck, Yes!',"Let's Hope That Was Good Enough…",'Well, That Was A Good One',
  "You Look Pathetic. Wait, Was That A Mistake? We'll Have To See…",
  'Oh My God, You Must Feel So Humiliated Right Now','Pathetic Little Boy Of Mine',
  'This Is A Random Message, But You Should Ask Me To Punish You For No Reason. Do It Now',
  'You Belong To Me Now',"One Day, I'm Gonna Make You Watch This Over And Over Again",
  'Go On Then, Say Thank You Out Loud 20 Times Now For Me',
  'Oh Fuck It, Send Me On WhatsApp, Do It Now Fag',"He's A Good Boy, And His Ass Tastes Fucking Great",
  "I've Got A Surprise For You Next Time I See You, And It's Fucking Horrendous",
  "Don't Mention You've Seen This","You're Gonna Hate To Love It",
  'Good Boy. Now Thank Me Properly','Mine. Every Inch Of You',"Filthy Little Thing, Aren't You",
  'I Own That Face And That Hole','Beg Me For The Next One','You Did That For Me. Remember It',
  'Disgusting. Do It Again Tomorrow','Such An Obedient Little Pet',"That's Going In My Collection",
  'Kneel And Thank Me When You Read This','Good Pet. Sit. Wait For Me',
  "You're Blushing, Aren't You, Boy",'Pathetic And Perfect. My Favourite',
  'Send Me Three More Just Like It','That Was Almost Good Enough. Almost'
];
function randomPraise(){ const a=PRAISE_MESSAGES; return a[Math.floor(Math.random()*a.length)]; }
/* Structured questions every request must answer */
const REQUEST_QUESTIONS = [
  ['who','Who will you be with?'],
  ['where','Where will you be?'],
  ['back','What time will you be home?'],
  ['drinks','Any alcohol? How much?']
];
/* Dimensions Jacob rates 1–5 in a check-in (3 = just right) */
const CHECKIN_DIMENSIONS = [
  ['control','Control','How much control you want me to take'],
  ['power','Power Exchange','Depth of the power dynamic'],
  ['forcefulness','Forcefulness','How forceful you want me to be'],
  ['strictness','Strictness','How strict the rules should be'],
  ['intensity','Intensity','Overall intensity of play'],
  ['affection','Affection / Aftercare','Warmth and aftercare you need']
];
function defaultSubProfile(){
  return {
    photo:DEFAULT_PHOTO,name:'Jacob',role:'Submissive',dominant:'James',notes:'Visible to Jacob. Edited by James only.',
    measurements:{height:'6 ft 2',weight:'12 st 4 lb',neck:'15.5 in',chest:'39 in',bicepL:'12.5 in',bicepR:'12.6 in',waist:'30 in',hips:'36 in',insideLeg:'34 in'},
    anatomy:{softLength:'',hardLength:'',softGirth:'',hardGirth:'',testicularCircumference:''}
  };
}
function defaultDomProfile(){
  return {
    photo:'https://i.pravatar.cc/320?img=58',name:'James',role:'Dominant',honorific:'Sir',
    notes:'Edited by James only. Visible to Jacob.',
    details:{pronouns:'He / Him',dynamicStart:'2024',contact:'In person + app',aftercareStyle:'Calm voice, water, quiet',
             expectations:'Honesty, prompt replies, evidence on request',hardNo:'No public exposure without consent'}
  };
}
function defaultRewardsCatalog(){
  return [
    {id:'r1',name:'Movie Night Pick',cost:10,icon:'fa-film',desc:'Choose what we watch together.'},
    {id:'r2',name:'Lie-In Pass',cost:15,icon:'fa-bed',desc:'One morning, no early alarm.'},
    {id:'r3',name:'Favourite Meal',cost:20,icon:'fa-utensils',desc:'Request a meal of your choice.'},
    {id:'r4',name:'Day Off Protocol',cost:40,icon:'fa-dove',desc:'A full day with protocol relaxed.'},
    {id:'r5',name:'Special Treat',cost:60,icon:'fa-gift',desc:'A surprise chosen by James.'}
  ];
}
function defaultBodyMaps(){
  /* No preset zones — James adds them by tapping the body. */
  return { ticklish:[], sensitive:[] };
}
function defaultPersonalRecords(){
  return {
    breath:{longestHold:'',rebreathe3L:'',rebreathe5L:'',rebreathe6L:'',bubbleBottleLarge:'',bubbleBottleSmall:'',resistanceMaximum:''},
    /* alphabetised electro items, blank defaults — James fills via the slider editor */
    electro:Object.fromEntries(ELECTRO_ITEMS.map(label=>[label,{min:0,max:0,pleasureStart:0,pleasureEnd:0}]))
  };
}
function migrateEnhancedState(){
  state={...defaultSystemState(state&&state.currentRole?state.currentRole:'dom'),...(state||{})};
  /* Naming: Dom is James, Sub is Jacob */
  if(state.subTitle==='James'||!state.subTitle) state.subTitle='Jacob';
  if(state.domTitle==='Sir'||!state.domTitle) state.domTitle='James';
  state.dataVersion=5;
  state.badges=ensureArray(state.badges);
  state.disclosures=ensureArray(state.disclosures);
  state.checkIns=ensureArray(state.checkIns);
  state.notifications=ensureArray(state.notifications);
  state.journalTags=ensureArray(state.journalTags).length?ensureArray(state.journalTags):defaultSystemState().journalTags;
  state.rewardsCatalog=ensureArray(state.rewardsCatalog).length?ensureArray(state.rewardsCatalog):defaultRewardsCatalog();
  state.tasks=ensureArray(state.tasks).map(t=>({...t,title:titleCase(t.title),evidence:ensureArray(t.evidence)}));
  state.punishments=ensureArray(state.punishments).map(p=>({...p,title:titleCase(p.title),kind:p.kind||'timed'}));
  state.journal=ensureArray(state.journal).map(e=>({...e,title:titleCase(e.title),attachments:ensureArray(e.attachments),tags:ensureArray(e.tags)}));
  state.limits={...defaultSystemState().limits,...(state.limits||{})};
  state.rules={...defaultSystemState().rules,...(state.rules||{})};
  state.subProfile={...defaultSubProfile(),...(state.subProfile||{})};
  if(state.subProfile.name==='James') state.subProfile.name='Jacob';
  state.subProfile.dominant='James';
  state.subProfile.measurements={...defaultSubProfile().measurements,...(state.subProfile.measurements||{})};
  state.subProfile.anatomy={...defaultSubProfile().anatomy,...(state.subProfile.anatomy||{})};
  state.domProfile={...defaultDomProfile(),...(state.domProfile||{})};
  state.domProfile.details={...defaultDomProfile().details,...(state.domProfile.details||{})};
  state.bodyMaps={...defaultBodyMaps(),...(state.bodyMaps||{})};
  state.bodyMaps.ticklish=ensureArray(state.bodyMaps.ticklish);
  state.bodyMaps.sensitive=ensureArray(state.bodyMaps.sensitive);
  state.personalRecords={...defaultPersonalRecords(),...(state.personalRecords||{})};
  state.personalRecords.breath={...defaultPersonalRecords().breath,...(state.personalRecords.breath||{})};
  state.personalRecords.electro={...defaultPersonalRecords().electro,...(state.personalRecords.electro||{})};
}

/* ── Normalize: enforce naming + new structures on ANY state source
   (local default, localStorage, OR remote Firebase snapshot). Runs after
   remote state is applied because the inline onSnapshot calls our
   updateRoleUI()/renderCurrentTab(). Persists the fix back so it sticks. ── */
function normalizeState(){
  if(!state) return;
  let changed=false;
  if(state.domTitle==='Sir'||!state.domTitle){ state.domTitle='James'; changed=true; }
  if(state.subTitle==='James'||!state.subTitle){ state.subTitle='Jacob'; changed=true; }
  if(!state.domProfile){ state.domProfile=defaultDomProfile(); changed=true; }
  else { const dd=defaultDomProfile(); state.domProfile.details={...dd.details,...(state.domProfile.details||{})}; }
  if(state.subProfile){ if(state.subProfile.name==='James'){ state.subProfile.name='Jacob'; changed=true; } if(state.subProfile.dominant!=='James'){ state.subProfile.dominant='James'; changed=true; } }
  if(!Array.isArray(state.rewardsCatalog)||!state.rewardsCatalog.length){ state.rewardsCatalog=defaultRewardsCatalog(); changed=true; }
  if(!Array.isArray(state.journalTags)||!state.journalTags.length){ state.journalTags=defaultSystemState().journalTags; changed=true; }
  if(!state.bodyMaps) state.bodyMaps={ticklish:[],sensitive:[]};
  state.bodyMaps.ticklish=ensureArray(state.bodyMaps.ticklish);
  state.bodyMaps.sensitive=ensureArray(state.bodyMaps.sensitive);
  state.journal=ensureArray(state.journal).map(e=>({...e,tags:ensureArray(e.tags)}));
  state.readNotifIds=ensureArray(state.readNotifIds);
  state.customBadges=ensureArray(state.customBadges);
  state.checkIns=ensureArray(state.checkIns);
  if(!state.auth) state.auth={configured:false};
  if(typeof state.pinFails!=='number') state.pinFails=0;
  if(!state.appLock) state.appLock={locked:false};
  if(!state.voice) state.voice={enabled:false,samples:[]};
  state.voice.samples=ensureArray(state.voice.samples);
  state.requests=ensureArray(state.requests);
  state.helpers=ensureArray(state.helpers);
  state.memories=ensureArray(state.memories);
  state.suggestions=ensureArray(state.suggestions);
  if(typeof state.suggestionBoxOpen!=='boolean') state.suggestionBoxOpen=false;
  if(typeof state.requestBoxOpen!=='boolean') state.requestBoxOpen=true;
  state.redactedRecords=ensureArray(state.redactedRecords);
  state.bodyPhotos=ensureArray(state.bodyPhotos);
  if(typeof state.bodyPhotosVisible!=='boolean') state.bodyPhotosVisible=false;
  if(!state.consequenceLists||typeof state.consequenceLists!=='object') state.consequenceLists={};
  if(!state.impactMap||typeof state.impactMap!=='object') state.impactMap={};
  if(typeof state.hideHardLimits!=='boolean'){ state.hideHardLimits=false; }
  state.appSettings={reduceMotion:false,starSpending:true,...(state.appSettings||{})};
  if(typeof state.appSettings.starSpending!=='boolean'){ state.appSettings.starSpending=true; changed=true; }
  /* Consequences moved to its own panel — drop the duplicated rule section */
  if(state.rules&&state.rules.consequences!==undefined){ delete state.rules.consequences; changed=true; }
  /* one-time clear of legacy demo zones — James adds his own */
  if(!state.bmClearedV6){ state.bodyMaps={ticklish:[],sensitive:[]}; state.bmClearedV6=true; changed=true; }
  /* one-time clear of staggered demo electro numbers */
  if(!state.electroClearedV6){ state.personalRecords=state.personalRecords||{}; state.personalRecords.electro=defaultPersonalRecords().electro; state.electroClearedV6=true; changed=true; }
  /* re-seed electro to the alphabetised item set if old keys remain */
  if(!state.electroClearedV7){ state.personalRecords=state.personalRecords||{}; state.personalRecords.electro=defaultPersonalRecords().electro; state.electroClearedV7=true; changed=true; }
  /* drop the old "Protocols" rule section */
  if(state.rules&&state.rules.protocols!==undefined){ delete state.rules.protocols; changed=true; }
  if(changed){ try{ saveState(); }catch(_){} }
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
  const items=state&&state.currentRole==='dom'?DOM_NAV_ITEMS:NAV_ITEMS;
  nav.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(7,7,7,.95);border-top:1px solid rgba(255,255,255,.1);backdrop-filter:blur(22px)';
  nav.innerHTML=`<div class="max-w-3xl mx-auto grid text-center text-xs" style="grid-template-columns:repeat(${items.length},minmax(0,1fr));padding-bottom:max(1.1rem,env(safe-area-inset-bottom));padding-top:.5rem">${items.map(([tab,label,icon])=>`<button onclick="navigateToTab('${tab}')" class="nav-item tap py-1 flex flex-col items-center gap-0 cursor-pointer" data-tab="${tab}"><span class="nav-icon"><i class="fa-solid ${icon} text-lg"></i></span><span class="text-[10px] tracking-wide">${label}</span></button>`).join('')}</div>`;
}
function installScreens(){
  /* Append next to the EXISTING tabs so we inherit the content wrapper's
     px-5 padding + max-width. #main-app has two .max-w-3xl divs (header +
     content); using an existing tab's parent guarantees the content one. */
  const anchor=document.getElementById('tab-dashboard');
  const host=(anchor&&anchor.parentElement)||document.querySelector('#main-app .max-w-3xl.px-5')||document.getElementById('main-app');
  if(!host)return;
  ['protocols','evidence','notifications','settings'].forEach(id=>{
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
/* Clean monogram logo — bold S lettermark inside a double-ring halo.
   Draws in on load, floats gently, glows at end-points. */
function systemLogoSVG(size){
  size=size||118;
  return `<svg class="sys-logo" viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="The System">
    <defs>
      <linearGradient id="slG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e8c84a"/>
        <stop offset="100%" stop-color="#9a7620"/>
      </linearGradient>
      <filter id="slGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="slSoft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <!-- Outer halo ring -->
    <circle cx="50" cy="50" r="46" stroke="rgba(198,166,66,0.25)" stroke-width="1"/>
    <!-- Inner ring, slowly rotating dashes -->
    <circle class="sl-ring" cx="50" cy="50" r="41" stroke="rgba(198,166,66,0.18)" stroke-width="1" stroke-dasharray="8 12" fill="none"/>
    <!-- S lettermark: clean cubic-bezier S path -->
    <path class="sl-s" filter="url(#slSoft)"
      d="M 65 30 C 65 18 35 18 35 30 C 35 42 65 58 65 70 C 65 82 35 82 35 70"
      stroke="url(#slG)" stroke-width="7" stroke-linecap="round" fill="none"
      stroke-dasharray="160" stroke-dashoffset="160"/>
    <!-- End-cap dots -->
    <circle class="sl-dot sl-dot-r" cx="65" cy="30" r="4" fill="#cf333c" filter="url(#slGlow)"/>
    <circle class="sl-dot sl-dot-s" cx="35" cy="70" r="4" fill="#8faf97" filter="url(#slGlow)"/>
  </svg>`;
}
function _loginHelpLinks(){
  const fails=state.pinFails||0;
  if(fails<2) return '';
  return `<div style="margin-top:1.5rem;display:flex;flex-direction:column;gap:.55rem;align-items:center">
    <button onclick="forgotPin()" style="font-size:.72rem;color:rgba(198,166,66,.7);text-decoration:underline">I've forgotten my PIN</button>
    <button onclick="showInstallGuide()" style="font-size:.7rem;color:rgba(198,166,66,.45);text-decoration:underline">Install Help</button>
  </div>`;
}
function buildKeypad(){
  const screen=document.getElementById('login-screen'); if(!screen)return;
  const _nav=document.getElementById('bottom-navigation'); if(_nav)_nav.style.display='none';
  screen.style.cssText='position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:#070707';
  screen.innerHTML=`<div style="max-width:22rem;width:100%;padding:0 1.75rem;text-align:center">
    <div style="display:flex;justify-content:center;margin-bottom:1rem">${systemLogoSVG(112)}</div>
    <h1 class="heading-serif" style="font-size:3.2rem;line-height:1;margin:0;letter-spacing:-.04em">The System</h1>
    ${(state.appLock&&state.appLock.locked)?'<p style="color:var(--rose);margin-top:.5rem;letter-spacing:3px;font-size:.75rem">LOCKED</p>':''}
    ${(state.appLock&&state.appLock.locked)?`<div style="margin:1rem auto 0;max-width:18rem;padding:.6rem .9rem;border-radius:.9rem;background:rgba(143,17,24,.2);border:1px solid rgba(143,17,24,.5);font-size:.72rem;color:#fca5a5">${escapeText(state.appLock.reason||"Awaiting James's judgement")}</div>`:''}
    <div id="pin-dots" style="display:flex;justify-content:center;gap:.7rem;margin:1.75rem 0">${[0,1,2,3,4,5].map(()=>`<span class="pin-dot" style="width:.85rem;height:.85rem;border-radius:999px;border:1.5px solid rgba(198,166,66,.55);display:inline-block"></span>`).join('')}</div>
    <p id="login-error" style="color:#f87171;font-size:.8rem;height:1.2rem;margin-bottom:.5rem"></p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem">${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="tap" onclick="keypadPress('${n}')" style="aspect-ratio:1.35;font-size:1.5rem;border-radius:1.25rem;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);color:var(--ivory);display:flex;align-items:center;justify-content:center">${n}</button>`).join('')}<button class="tap" onclick="keypadClear()" style="aspect-ratio:1.35;font-size:.8rem;border-radius:1.25rem;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);color:var(--ivory);letter-spacing:.05em">CLEAR</button><button class="tap" onclick="keypadPress('0')" style="aspect-ratio:1.35;font-size:1.5rem;border-radius:1.25rem;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);color:var(--ivory)">0</button><button class="tap" onclick="keypadBack()" style="aspect-ratio:1.35;font-size:1.25rem;border-radius:1.25rem;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.12);color:var(--ivory)"><i class="fa-solid fa-delete-left"></i></button></div>
    <div id="login-help-links">${_loginHelpLinks()}</div>
  </div>`;
  window.currentPin='';
}
/* ════════════ PHASE 4: PIN SECURITY ════════════
   6-digit PIN, PBKDF2 salted hash (never plaintext, never in repo), weak-PIN
   rejection, 5-attempt lockout, forgotten-PIN request, James-forced reset.
   Bootstrap codes only work until James sets real PINs — and a recovery path
   (Settings → Reset access) means nobody can be permanently locked out. */
const BOOTSTRAP_DOM='000000', BOOTSTRAP_SUB='111111';
const PIN_ITER=120000;
function _hex(buf){ return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join(''); }
function _randSaltHex(){ const a=new Uint8Array(16); (crypto.getRandomValues?crypto:window.crypto).getRandomValues(a); return _hex(a.buffer); }
async function pbkdf2(pin,saltHex,iter){
  const enc=new TextEncoder();
  const salt=new Uint8Array(saltHex.match(/.{2}/g).map(h=>parseInt(h,16)));
  const key=await crypto.subtle.importKey('raw',enc.encode(pin),{name:'PBKDF2'},false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:iter||PIN_ITER,hash:'SHA-256'},key,256);
  return _hex(bits);
}
async function makePinRecord(pin){ const salt=_randSaltHex(); const hash=await pbkdf2(pin,salt,PIN_ITER); return {salt,hash,iter:PIN_ITER}; }
async function verifyPin(pin,rec){ if(!rec||!rec.salt||!rec.hash)return false; const h=await pbkdf2(pin,rec.salt,rec.iter||PIN_ITER); return h===rec.hash; }
function isWeakPin(pin){
  if(!/^\d{6}$/.test(pin)) return true;
  const banned=['000000','111111','222222','333333','444444','555555','666666','777777','888888','999999','123456','654321','121212','112233','123123','456789','987654','159753','147258'];
  if(banned.includes(pin)) return true;
  if(/^(\d)\1{5}$/.test(pin)) return true;                 // repeated digit
  const d=pin.split('').map(Number);
  if(d.every((n,i)=>i===0||n===d[i-1]+1)) return true;     // ascending
  if(d.every((n,i)=>i===0||n===d[i-1]-1)) return true;     // descending
  if(/^(\d\d)\1\1$/.test(pin)) return true;                // 2-digit repeat e.g. 121212
  // obvious date patterns DDMMYY / MMDDYY-ish: first two 01-31 and a 19/20 century not required; flag 19xx/20xx anywhere
  if(/^(19|20)\d{4}$/.test(pin)) return true;
  return false;
}
function weakPinReason(pin){ if(!/^\d{6}$/.test(pin)) return 'PIN must be exactly 6 digits.'; return 'That PIN is too easy to guess. Choose something stronger.'; }
function authConfigured(){ return !!(state.auth&&state.auth.configured&&state.auth.james&&state.auth.jacob); }

function keypadPress(d){ if((window.currentPin||'').length>=6)return; window.currentPin=(window.currentPin||'')+d; updatePinDots(); if(window.currentPin.length===6)setTimeout(attemptLogin,140); }
function keypadClear(){ window.currentPin=''; updatePinDots(); const e=document.getElementById('login-error'); if(e)e.textContent=''; }
function keypadBack(){ window.currentPin=(window.currentPin||'').slice(0,-1); updatePinDots(); }
function updatePinDots(){
  document.querySelectorAll('#pin-dots span').forEach((dot,i)=>{
    dot.style.background=i<(window.currentPin||'').length?'var(--gold)':'transparent';
    dot.style.boxShadow=i<(window.currentPin||'').length?'0 0 16px rgba(198,166,66,.4)':'none';
    dot.style.border=i<(window.currentPin||'').length?'1.5px solid var(--gold)':'1.5px solid rgba(198,166,66,.55)';
  });
}
function _loginError(msg){ const e=document.getElementById('login-error'); if(e)e.textContent=msg; window.currentPin=''; updatePinDots(); const hl=document.getElementById('login-help-links'); if(hl)hl.innerHTML=_loginHelpLinks(); }
async function attemptLogin(){
  const input=window.currentPin||'';
  const locked=state.appLock&&state.appLock.locked;
  let role=null;
  if(authConfigured()){
    if(await verifyPin(input,state.auth.james)) role='dom';
    else if(await verifyPin(input,state.auth.jacob)) role='sub';
  } else {
    if(input===BOOTSTRAP_DOM) role='dom';
    else if(input===BOOTSTRAP_SUB) role='sub';
  }
  if(!role){
    state.pinFails=(state.pinFails||0)+1;
    if(state.pinFails>=5){
      state.appLock={locked:true,reason:'Access locked. Awaiting James'+String.fromCharCode(8217)+'s judgement.',at:new Date().toISOString()};
      addNotification('review','Jacob failed PIN entry 5 times','Access is locked until you release it.','dashboard');
      saveState(); buildKeypad(); _loginError('Too many failed attempts.');
    } else { saveState(); _loginError('Incorrect PIN. '+(5-state.pinFails)+' left.'); }
    return;
  }
  /* Locked: only James can release */
  if(locked){
    if(role!=='dom'){ _loginError("Awaiting James"+String.fromCharCode(8217)+'s judgement.'); return; }
    state.appLock={locked:false}; addNotification('review','Lock released by James','Access restored.','dashboard');
  }
  state.pinFails=0;
  /* Phase 5: surprise voice check for Jacob when James has enabled it */
  if(role==='sub'&&state.voice&&state.voice.enabled&&ensureArray(state.voice.samples).length>=5){
    startVoiceVerify(()=>completeLogin('sub'));
    return;
  }
  completeLogin(role);
}
function completeLogin(role){
  state.currentRole=role; saveState();
  document.getElementById('login-screen').style.display='none';
  document.getElementById('main-app').style.display='';
  document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('bottom-navigation').style.display='';
  updateRoleUI();
  navigateToTab(new URLSearchParams(location.search).get('tab')||'dashboard');
  try{ enablePushNotifications(); }catch(_){}
  if(!authConfigured()&&role==='dom') setTimeout(()=>showPinSetup(true),400);
  else if(role==='dom'&&state.forceJacobPinChange) setTimeout(()=>showToast('Reminder: Jacob still needs to change his PIN','info'),600);
  else if(role==='sub'&&state.voice&&state.voice.enabled&&ensureArray(state.voice.samples).length<5) setTimeout(()=>showVoiceSetup(),500);
}
function forgotPin(){
  state.appLock={locked:true,reason:'PIN reset requested. Awaiting James'+String.fromCharCode(8217)+'s judgement.',at:new Date().toISOString()};
  addNotification('review','Jacob requested PIN release','Jacob pressed “forgotten PIN”. Release or reset from Settings.','dashboard');
  saveState(); buildKeypad(); _loginError('Request sent to James.');
}
/* ── PIN setup / change (James) ── */
function showPinSetup(initial){
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[260] flex items-end md:items-center justify-center" ${initial?'':'onclick="this.remove()"'}><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:30rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))">
    <div style="font-size:1.3rem;font-weight:600;margin-bottom:.3rem">${initial?'Set Up Access':'Change PINs'}</div>
    <div style="font-size:.78rem;color:var(--stone);margin-bottom:1.25rem">6 digits each. Stored only as a salted hash — never in plain text.</div>
    <label style="font-size:.65rem;color:rgba(198,166,66,.7);text-transform:uppercase">James's PIN<input id="pin-james" inputmode="numeric" maxlength="6" pattern="\\d*" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-top:.25rem;display:block;letter-spacing:.4em;text-align:center" placeholder="••••••"></label>
    <label style="font-size:.65rem;color:rgba(198,166,66,.7);text-transform:uppercase;display:block;margin-top:.85rem">Jacob's PIN<input id="pin-jacob" inputmode="numeric" maxlength="6" pattern="\\d*" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-top:.25rem;display:block;letter-spacing:.4em;text-align:center" placeholder="••••••"></label>
    <p id="pin-setup-error" style="color:#f87171;font-size:.78rem;height:1.1rem;margin-top:.6rem"></p>
    <button onclick="savePins(this,${initial?'true':'false'})" style="width:100%;margin-top:.5rem;padding:.9rem;background:var(--red);border-radius:1rem;color:#fff;font-weight:600">Save PINs</button>
    ${initial?'':'<button onclick="this.closest(\'.fixed\').remove()" style="width:100%;margin-top:.5rem;padding:.6rem;color:var(--stone);font-size:.8rem">Cancel</button>'}
  </div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
async function savePins(button,initial){
  const err=document.getElementById('pin-setup-error');
  const jp=document.getElementById('pin-james').value.trim(), kp=document.getElementById('pin-jacob').value.trim();
  if(isWeakPin(jp)){ err.textContent='James: '+weakPinReason(jp); return; }
  if(isWeakPin(kp)){ err.textContent='Jacob: '+weakPinReason(kp); return; }
  if(jp===kp){ err.textContent='James and Jacob must have different PINs.'; return; }
  button.disabled=true; button.textContent='Saving…';
  state.auth={configured:true,james:await makePinRecord(jp),jacob:await makePinRecord(kp)};
  state.pinFails=0; state.forceJacobPinChange=false;
  addNotification('review','PIN'+(initial?'s set':'s changed'),'Access PINs were updated by James.','dashboard');
  saveState(); button.closest('.fixed').remove(); showToast('PINs saved','success');
}

/* ── Header ── */
function updateHeader(){
  if(!state)return;
  const isDom=state.currentRole==='dom';
  const nameEl=document.getElementById('header-name'); if(nameEl) nameEl.textContent=isDom?state.domTitle:state.subTitle;
  const roleEl=document.getElementById('header-role'); if(roleEl){ roleEl.textContent=isDom?'Dominant':'Owned by James'; roleEl.style.color=isDom?'var(--red)':'var(--sage)'; }
  /* Avatar opens the relevant profile (Jacob taps his picture; James taps his). */
  const avatar=document.getElementById('header-avatar');
  if(avatar){ avatar.src=isDom?((state.domProfile&&state.domProfile.photo)||state.avatar||DEFAULT_PHOTO):(state.subProfile&&state.subProfile.photo?state.subProfile.photo:DEFAULT_PHOTO); avatar.style.cursor='pointer'; avatar.onclick=()=>{ isDom?showDomProfileModal():showProfileModal(); }; }
  /* Right side: cycling countdown chip + bell. Only James gets the Settings menu. */
  const btns=document.querySelector('.app-header .flex.items-center.gap-x-2:last-child')||document.getElementById('header-action')?.parentElement;
  if(btns){
    const unread=unreadNotifications().length;
    const menuBtn=isDom
      ? `<button onclick="showSettings()" title="Settings" style="width:2.5rem;height:2.5rem;display:flex;align-items:center;justify-content:center;border-radius:1rem;background:rgba(255,255,255,.05);color:var(--ivory)" class="tap"><i class="fa-solid fa-bars"></i></button>`
      : '';
    btns.innerHTML=`<button id="hdr-timer" onclick="openHeaderTimer()" class="tap" style="display:none;align-items:center;gap:.4rem;height:2.5rem;padding:0 .7rem;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)"></button><button onclick="navigateToTab('notifications')" style="position:relative;width:2.5rem;height:2.5rem;display:flex;align-items:center;justify-content:center;border-radius:1rem;background:rgba(255,255,255,.05);color:var(--gold)" class="tap"><i class="fa-solid fa-bell"></i>${unread?`<span style="position:absolute;top:-.25rem;right:-.25rem;min-width:1.2rem;height:1.2rem;padding:0 .2rem;border-radius:999px;background:var(--red);color:#fff;font-size:.6rem;display:flex;align-items:center;justify-content:center">${unread}</span>`:''}</button>${menuBtn}`;
    updateHeaderTimer();
  }
}
var _hdrTimerIdx=0;
function openHeaderTimer(){ const items=timedItems(); if(!items.length)return; const it=items[_hdrTimerIdx%items.length]; openTimedItem(it.kind,it.refId); }
function updateHeaderTimer(){
  const el=document.getElementById('hdr-timer'); if(!el)return;
  const items=timedItems();
  if(!items.length){ el.style.display='none'; return; }
  _hdrTimerIdx=_hdrTimerIdx%items.length;
  const it=items[_hdrTimerIdx]; const tl=getTimeLeft(it.item); const over=tl.text==='Overdue';
  const mins=(dueDateFor(it.item)-Date.now())/60000;
  const col=over?'var(--red)':(mins<=15?'#e0852f':it.kind==='punishment'?'var(--red)':'var(--blue)');
  el.style.display='inline-flex';
  el.innerHTML=`<span class="mini-ring" style="--p:${tl.pct};--c:${col}"><i class="fa-solid ${it.kind==='punishment'?'fa-hourglass-half':'fa-clock'}"></i></span><span class="countdown" style="font-size:.7rem;font-variant-numeric:tabular-nums;color:${over?'#fca5a5':'var(--ivory)'}">${tl.text}</span>${items.length>1?`<span style="font-size:.55rem;color:var(--stone)">${(_hdrTimerIdx+1)}/${items.length}</span>`:''}`;
}
function updateRoleUI(){
  if(!state)return;
  normalizeState();
  const isDom=state.currentRole==='dom';
  document.querySelectorAll('.dom-only').forEach(el=>el.style.display=isDom?'':'none');
  document.querySelectorAll('.sub-only').forEach(el=>el.style.display=isDom?'none':'');
  document.body.classList.toggle('sub-role',!isDom);
  const main=document.getElementById('main-app');
  if(main&&!main.classList.contains('hidden')&&main.style.display!=='none') installNavigation();
  updateHeader();
  enforceLock(); renderTimerStrip();
}

/* ── Navigation ── */
/* Screens Jacob may never reach — Dom-only (Jacob keeps his own notifications) */
const DOM_ONLY_TABS=['settings','evidence'];
function navigateToTab(tab){
  if(tab==='limits'||tab==='rules'||tab==='punishments'){ activeProtocolPanel=tab==='limits'?'boundaries':tab==='rules'?'rules':'consequences'; tab='protocols'; }
  /* Phase 1 access control: Jacob cannot open Dom-only screens */
  if(state&&state.currentRole!=='dom'&&DOM_ONLY_TABS.includes(tab)) tab='dashboard';
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
  else if(tab==='evidence') renderEvidenceBank();
  else if(tab==='stars') renderRewards();
  else if(tab==='notifications') renderNotifications();
  else if(tab==='settings') renderSettings();
  updateHeader(); renderTimerStrip();
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

/* ════════════ PHASE 3: TIMERS, WARNINGS & LOCKDOWN ════════════ */
function timedItems(){
  const out=[];
  ensureArray(state.tasks).filter(t=>t.status==='pending'&&dueDateFor(t)).forEach(t=>out.push({refId:t.id,kind:'task',title:titleCase(t.title),item:t}));
  ensureArray(state.punishments).filter(p=>p.status==='active'&&p.kind==='timed'&&dueDateFor(p)).forEach(p=>out.push({refId:p.id,kind:'punishment',title:titleCase(p.title),item:p}));
  return out.sort((a,b)=>dueDateFor(a.item)-dueDateFor(b.item));
}
/* The countdown now lives in the top banner (updateHeaderTimer) — no overlapping strip. */
function renderTimerStrip(){ const strip=document.getElementById('timer-strip'); if(strip)strip.remove(); updateHeaderTimer(); }
function openTimedItem(kind,id){ if(kind==='task'){ const t=state.tasks.find(x=>String(x.id)===String(id)); if(t)showTaskDetail(t); } else { activeProtocolPanel='consequences'; navigateToTab('protocols'); } }
const WARN_THRESHOLDS=[60,45,30,15,10,5,1];
function tickTimers(){
  if(!state) return; const now=Date.now(); let changed=false;
  ensureArray(state.tasks).filter(t=>t.status==='pending'&&dueDateFor(t)).forEach(t=>{
    t.warned=ensureArray(t.warned);
    const mins=(dueDateFor(t)-now)/60000;
    WARN_THRESHOLDS.forEach(th=>{ if(mins<=th&&mins>th-1&&!t.warned.includes(th)){ t.warned.push(th); addNotification('task','Task due in '+th+' min',titleCase(t.title),'tasks'); changed=true; } });
    if(mins<=0&&!t.overdueHandled){ t.overdueHandled=true; changed=true; handleOverdue(t); }
  });
  if(changed) saveState();
  /* cycle the header countdown chip through active timers every ~3s */
  _hdrTick=(_hdrTick||0)+1; if(_hdrTick%3===0) _hdrTimerIdx++;
  updateHeaderTimer(); updateCountdowns(); enforceLock();
}
var _hdrTick=0;
function handleOverdue(item){
  addNotification('review','Jacob is overdue','“'+titleCase(item.title)+'” passed its deadline.','tasks');
  state.appLock={locked:true,reason:'Awaiting judgement as a result of failure.',at:new Date().toISOString(),scope:'overdue'};
}
/* In-session lock overlay — Jacob can be logged in but cannot use the app */
function enforceLock(){
  const main=document.getElementById('main-app');
  let ov=document.getElementById('lock-overlay');
  const locked=state&&state.appLock&&state.appLock.locked&&state.currentRole==='sub'&&main&&main.style.display!=='none';
  if(!locked){ if(ov)ov.remove(); return; }
  if(!ov){ ov=document.createElement('div'); ov.id='lock-overlay'; document.body.appendChild(ov); }
  ov.style.cssText='position:fixed;inset:0;z-index:300;background:#070707;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem';
  ov.innerHTML=`<div style="margin-bottom:1.5rem">${systemLogoSVG(120)}</div><div style="font-size:.7rem;letter-spacing:3px;color:var(--red)">LOCKED</div><div class="heading-serif" style="font-size:1.9rem;margin-top:.6rem;max-width:18rem;line-height:1.1">${escapeText(state.appLock.reason||"Awaiting James"+String.fromCharCode(8217)+"s judgement")}</div><div style="font-size:.8rem;color:var(--stone);margin-top:1.1rem">Only James can release the app.</div>`;
}
/* Screenshot / screen-record guard — best effort only (iOS web cannot fully block) */
function initScreenshotGuard(){
  document.addEventListener('keyup',e=>{ if(e.key==='PrintScreen') triggerScreenshotLock(); });
  document.addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.shiftKey&&['3','4','5','s','S'].includes(e.key)) triggerScreenshotLock(); });
}
function triggerScreenshotLock(){
  if(!state||state.currentRole!=='sub')return;
  addNotification('review','Screenshot attempt detected','Jacob attempted a screenshot or recording.','dashboard');
  state.appLock={locked:true,reason:'Attempt to screenshot. Awaiting judgement.',at:new Date().toISOString(),scope:'screenshot'};
  saveState(); enforceLock();
}

/* ════════════ PHASE 5: VOICE MATCHING (ritual verification) ════════════
   Approximate, by design — compares the average spectral signature of a live
   phrase to Jacob's enrolled samples (cosine similarity). Not a trained speaker
   model; real security still rests on PIN + lockout + James's release. */
const VOICE_PHRASE='Yes Sir, it is me.';
const VOICE_REC_SECONDS=3;
function voiceCentroid(){ const s=ensureArray(state.voice&&state.voice.samples); if(!s.length)return null; const n=s[0].length; const c=new Array(n).fill(0); s.forEach(v=>v.forEach((x,i)=>c[i]+=x)); return c.map(x=>x/s.length); }
function _cosine(a,b){ if(!a||!b)return 0; let d=0,na=0,nb=0; for(let i=0;i<a.length;i++){ d+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; } return d/((Math.sqrt(na)*Math.sqrt(nb))||1); }
async function recordVoiceVector(seconds){
  let stream;
  try{ stream=await navigator.mediaDevices.getUserMedia({audio:true}); }catch(e){ throw new Error('mic'); }
  const AC=window.AudioContext||window.webkitAudioContext; const ac=new AC();
  const src=ac.createMediaStreamSource(stream); const an=ac.createAnalyser(); an.fftSize=64; src.connect(an);
  const bins=an.frequencyBinCount; const acc=new Float64Array(bins); let frames=0;
  return await new Promise(resolve=>{
    const iv=setInterval(()=>{ const d=new Uint8Array(bins); an.getByteFrequencyData(d); for(let i=0;i<bins;i++)acc[i]+=d[i]; frames++; },80);
    setTimeout(()=>{ clearInterval(iv); stream.getTracks().forEach(t=>t.stop()); try{src.disconnect();ac.close();}catch(_){}
      const v=[...acc].map(x=>x/(frames||1)); const norm=Math.sqrt(v.reduce((s,x)=>s+x*x,0))||1; resolve(v.map(x=>x/norm));
    }, seconds*1000);
  });
}
/* ── Enrolment: Jacob records samples ── */
function showVoiceSetup(){
  state.voice=state.voice||{enabled:true,samples:[]}; state.voice.samples=ensureArray(state.voice.samples);
  const m=document.createElement('div'); m.id='voice-setup';
  m.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[260] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:30rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom));text-align:center">
    <div style="font-size:1.3rem;font-weight:600">Voice Enrolment</div>
    <div style="font-size:.8rem;color:var(--stone);margin:.5rem 0 1.25rem">Record this phrase ${10} times so James can verify you.<br><span style="color:var(--gold);font-style:italic">“${VOICE_PHRASE}”</span></div>
    <div class="voice-wave" id="vs-wave" style="opacity:.3">${[...Array(7)].map((_,i)=>`<span style="animation-delay:${i*0.1}s"></span>`).join('')}</div>
    <div id="vs-count" style="font-size:2rem;font-weight:700;color:var(--gold);margin:.75rem 0">${state.voice.samples.length}/10</div>
    <button id="vs-btn" onclick="recordVoiceSample(this)" class="tap" style="width:100%;padding:.9rem;background:var(--red);border-radius:1rem;color:#fff;font-weight:600"><i class="fa-solid fa-microphone" style="margin-right:.4rem"></i>Record sample</button>
    <button onclick="this.closest('.fixed').remove()" style="width:100%;margin-top:.5rem;padding:.6rem;color:var(--stone);font-size:.8rem">Later</button>
  </div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
async function recordVoiceSample(btn){
  btn.disabled=true; const wave=document.getElementById('vs-wave'); if(wave)wave.style.opacity='1';
  btn.innerHTML='<i class="fa-solid fa-circle" style="margin-right:.4rem;color:#fff;animation:pulseZone 1s infinite"></i>Listening…';
  try{
    const v=await recordVoiceVector(VOICE_REC_SECONDS);
    state.voice.samples=ensureArray(state.voice.samples); state.voice.samples.push(v);
    if(state.voice.samples.length>10) state.voice.samples=state.voice.samples.slice(-10);
    saveState();
    const c=document.getElementById('vs-count'); if(c)c.textContent=state.voice.samples.length+'/10';
    if(wave)wave.style.opacity='.3';
    if(state.voice.samples.length>=10){ btn.closest('.fixed').remove(); showToast('Voice enrolled','success'); }
    else { btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-microphone" style="margin-right:.4rem"></i>Record sample'; }
  }catch(e){ btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-microphone" style="margin-right:.4rem"></i>Record sample'; if(wave)wave.style.opacity='.3'; showToast('Microphone needed','error'); }
}
/* ── Verification ── */
function startVoiceVerify(onPass){
  const m=document.createElement('div'); m.id='voice-verify';
  m.innerHTML=`<div class="fixed inset-0 z-[280]" style="background:#070707;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem">
    <div style="font-size:.7rem;letter-spacing:3px;color:var(--gold)">VOICE VERIFICATION</div>
    <div style="font-size:.9rem;color:var(--stone);margin:.6rem 0 1.5rem">Say the phrase clearly:<br><span style="color:var(--ivory);font-style:italic">“${VOICE_PHRASE}”</span></div>
    <div class="voice-wave big" id="vv-wave" style="opacity:.35">${[...Array(9)].map((_,i)=>`<span style="animation-delay:${i*0.09}s"></span>`).join('')}</div>
    <div id="vv-status" style="font-size:.85rem;color:var(--stone);margin-top:1.5rem;height:1.2rem"></div>
    <button id="vv-btn" onclick="runVoiceVerify(this)" class="tap" style="margin-top:1.5rem;padding:.9rem 2rem;background:var(--red);border-radius:1rem;color:#fff;font-weight:600"><i class="fa-solid fa-microphone" style="margin-right:.4rem"></i>Start</button>
  </div>`;
  document.getElementById('modal-container').appendChild(m);
  window._voicePass=onPass;
}
async function runVoiceVerify(btn){
  btn.disabled=true; const wave=document.getElementById('vv-wave'), status=document.getElementById('vv-status');
  if(wave)wave.style.opacity='1'; btn.style.display='none'; status.textContent='Listening…';
  let live;
  try{ live=await recordVoiceVector(VOICE_REC_SECONDS); }
  catch(e){ status.textContent='Microphone permission needed.'; btn.style.display=''; btn.disabled=false; if(wave)wave.style.opacity='.35'; return; }
  status.textContent='Matching voice…';
  /* deliberate ~5s tense animation */
  await new Promise(r=>setTimeout(r,5000));
  const sim=_cosine(live,voiceCentroid());
  const band=sim>=0.93?'green':sim>=0.82?'amber':'red';
  state.voice.lastResult={band,score:Math.round(sim*100),at:new Date().toISOString()};
  if(band==='red'){
    addNotification('review','Voice verification failed','Jacob failed voice match ('+Math.round(sim*100)+'%).','dashboard');
    state.appLock={locked:true,reason:'Voice verification failed. Awaiting James'+String.fromCharCode(8217)+'s judgement.',at:new Date().toISOString(),scope:'voice'};
    saveState();
    if(wave){ wave.style.setProperty('--vc','var(--red)'); }
    status.innerHTML='<span style="color:var(--red);font-weight:600">Verification failed.</span>';
    setTimeout(()=>{ document.getElementById('voice-verify')?.remove(); buildKeypad(); const ls=document.getElementById('login-screen'); if(ls)ls.style.display='flex'; _loginError("Voice failed. Awaiting James"+String.fromCharCode(8217)+'s judgement.'); },1400);
    return;
  }
  addNotification('review','Voice match '+(band==='amber'?'accepted (amber)':'accepted'),'Jacob verified at '+Math.round(sim*100)+'%.','dashboard');
  if(wave) wave.style.setProperty('--vc',band==='amber'?'var(--gold)':'var(--sage)');
  status.innerHTML=`<span style="color:${band==='amber'?'var(--gold)':'var(--sage)'};font-weight:600">${band==='amber'?'Imperfect but accepted.':'Voice match accepted.'}</span>`;
  saveState();
  setTimeout(()=>{ document.getElementById('voice-verify')?.remove(); const cb=window._voicePass; window._voicePass=null; if(cb)cb(); },1300);
}

/* ════════════ PHASE 6: DOM TOOLS ════════════ */
/* ── James's dashboard launcher ── */
function domToolsCard(){
  const pendingReq=ensureArray(state.requests).filter(r=>r.status==='requested').length;
  return `<button onclick="showDomTools()" class="tap card" style="display:flex;align-items:center;gap:.85rem;width:100%;text-align:left;padding:1rem 1.15rem;margin-bottom:1.25rem;border-left:3px solid var(--red)">
    <span style="width:2.6rem;height:2.6rem;border-radius:1rem;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(143,17,24,.25);color:var(--red)"><i class="fa-solid fa-toolbox"></i></span>
    <span style="flex:1"><span style="font-weight:600;display:block">James's Tools</span><span style="font-size:.75rem;color:var(--stone)">Tasks, check-in, helpers, memories, requests${pendingReq?` · ${pendingReq} request${pendingReq>1?'s':''}`:''}</span></span>
    ${pendingReq?`<span style="min-width:1.4rem;height:1.4rem;border-radius:999px;background:var(--red);color:#fff;font-size:.7rem;display:flex;align-items:center;justify-content:center;padding:0 .3rem">${pendingReq}</span>`:`<i class="fa-solid fa-chevron-right" style="color:rgba(198,166,66,.4)"></i>`}
  </button>`;
}
function showDomTools(){
  const tools=[
    ['fa-square-plus','Assign Task','var(--red)','showAddTaskModal()'],
    ['fa-sliders','Send Check-In','var(--blue)','sendCheckIn()'],
    ['fa-hands-holding-circle','Send Helper','var(--sage)','showSendHelper()'],
    ['fa-clock-rotate-left','Send Memory','var(--rose)','showSendMemory()'],
    ['fa-photo-film','View Memories','var(--rose)','showMemoriesReview()'],
    ['fa-inbox','Requests','var(--gold)','showRequestsReview()'],
    ['fa-clipboard-question','View Check-Ins','var(--sage)','showCheckInModal()'],
    ['fa-comment-dots','Suggestions','var(--blue)','showSuggestions()']
  ];
  const sg=ensureArray(state.suggestions).filter(s=>!s.seen).length;
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:30rem;max-height:92vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))">
    <div style="font-size:1.3rem;font-weight:600;margin-bottom:1rem">James's Tools</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">
      ${tools.map(([ic,label,col,fn])=>`<button onclick="this.closest('.fixed').remove();${fn}" class="tap subtle-card" style="padding:1rem;text-align:left;position:relative"><i class="fa-solid ${ic}" style="color:${col};font-size:1.2rem"></i><div style="font-weight:600;margin-top:.5rem;font-size:.85rem">${label}</div>${label==='Suggestions'&&sg?`<span style="position:absolute;top:.6rem;right:.6rem;min-width:1.2rem;height:1.2rem;border-radius:999px;background:var(--red);color:#fff;font-size:.6rem;display:flex;align-items:center;justify-content:center">${sg}</span>`:''}</button>`).join('')}
    </div>
    <div style="font-size:.65rem;letter-spacing:2px;color:var(--stone);margin:1.25rem 0 .6rem">WHAT JACOB CAN DO</div>
    <div class="tap" onclick="toggleRequestBox();this.querySelector('.switch').classList.toggle('on')" style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:rgba(255,255,255,.05);border-radius:1rem;cursor:pointer;margin-bottom:.5rem">
      <div><div style="font-weight:600;font-size:.9rem">Request box</div><div style="font-size:.72rem;color:var(--stone)">Let Jacob ask for things out of routine</div></div>
      <span class="switch${state.requestBoxOpen?' on':''}"><span class="knob"></span></span>
    </div>
    <div class="tap" onclick="toggleSuggestionBox();this.querySelector('.switch').classList.toggle('on')" style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:rgba(255,255,255,.05);border-radius:1rem;cursor:pointer">
      <div><div style="font-weight:600;font-size:.9rem">Suggestion box</div><div style="font-size:.72rem;color:var(--stone)">Let Jacob suggest his own consequences</div></div>
      <span class="switch${state.suggestionBoxOpen?' on':''}"><span class="knob"></span></span>
    </div>
  </div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function toggleRequestBox(){ if(state.currentRole!=='dom')return; state.requestBoxOpen=!state.requestBoxOpen; saveState(); showToast('Request box '+(state.requestBoxOpen?'opened':'closed'),'success'); }
/* ── Jacob's active items — helpers as sparkle bubbles; others as chips ── */
function subActiveCards(){
  const activeHelpers=ensureArray(state.helpers).filter(h=>h.active);
  const chips=[];
  if(state.activeCheckIn&&!state.activeCheckIn.done){ const left=getTimeLeft({dueAt:state.activeCheckIn.dueAt}); chips.push(_chip('fa-sliders','var(--blue)','Check-In','showCheckInModal()',left.text==='Overdue'?'now':left.text)); }
  ensureArray(state.memories).filter(mm=>!mm.reflectionDone).forEach(mm=>{ chips.push(_chip('fa-clock-rotate-left','var(--rose)','Memory',`viewMemory('${mm.id}')`,mm.viewed?'reflect':'view')); });
  if(state.suggestionBoxOpen) chips.push(_chip('fa-lightbulb','var(--gold)','Suggest','showSuggestPunishment()'));
  if(state.requestBoxOpen) chips.push(_chip('fa-hand','var(--gold)','Request','showMakeRequest()'));
  const helperHtml=activeHelpers.map(h=>{
    const def=HELPER_TYPES.find(t=>t[0]===h.type)||['','Helper','fa-hands-holding-circle','#888'];
    return `<button onclick="viewHelper('${h.id}')" class="tap helper-bubble" style="--hc:${def[3]};width:100%;margin-bottom:.9rem;display:block">
      <div class="helper-sparkle-ring"></div>
      <div style="display:flex;align-items:center;gap:1rem;position:relative;z-index:1">
        <div class="helper-icon-wrap" style="--hc:${def[3]}"><i class="fa-solid ${def[2]}" style="font-size:1.6rem;color:${def[3]}"></i></div>
        <div style="flex:1;text-align:left">
          <div style="font-size:.6rem;letter-spacing:3px;color:${def[3]};margin-bottom:.25rem">FROM JAMES</div>
          <div style="font-weight:700;font-size:1.05rem;color:var(--ivory)">${def[1]}</div>
          ${h.note?`<div style="font-size:.8rem;color:rgba(242,239,232,.65);margin-top:.2rem;line-height:1.4">${escapeText(h.note)}</div>`:''}
        </div>
        <i class="fa-solid fa-chevron-right" style="color:${def[3]};opacity:.6;flex-shrink:0"></i>
      </div>
    </button>`;
  }).join('');
  const chipHtml=chips.length?`<div class="seg-scroll" style="display:flex;gap:.5rem;overflow-x:auto;margin-bottom:1.1rem;padding-bottom:.3rem">${chips.join('')}</div>`:'';
  return helperHtml+chipHtml;
}
function _chip(icon,col,label,fn,badge){
  return `<button onclick="${fn}" class="tap" style="flex-shrink:0;display:inline-flex;align-items:center;gap:.45rem;padding:.5rem .85rem;border-radius:999px;background:${col}1f;border:1px solid ${col}55"><i class="fa-solid ${icon}" style="color:${col};font-size:.85rem"></i><span style="font-size:.78rem;font-weight:600;color:var(--ivory)">${label}</span>${badge?`<span style="font-size:.62rem;color:${col};font-variant-numeric:tabular-nums">${escapeText(badge)}</span>`:''}</button>`;
}
/* ── Dynamic check-in: James sends, Jacob has 10 minutes ── */
function sendCheckIn(){
  if(state.currentRole!=='dom')return;
  state.activeCheckIn={sentAt:new Date().toISOString(),dueAt:new Date(Date.now()+10*60000).toISOString(),done:false};
  addNotification('task','James has sent you a check-in','Fill it in within 10 minutes.','dashboard');
  saveState(); showToast('Check-in sent to Jacob','success'); renderDashboard();
}
/* ── Helpers ── */
function showSendHelper(){
  if(state.currentRole!=='dom')return;
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:28rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1rem">Send a Helper</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">${HELPER_TYPES.map(([id,label,icon,col])=>`<button onclick="document.querySelectorAll('#helper-pick button').forEach(x=>x.style.outline='none');this.style.outline='2px solid ${col}';window._helperPick='${id}'" data-h="${id}" class="tap subtle-card" style="padding:1rem;text-align:left"><i class="fa-solid ${icon}" style="color:${col};font-size:1.3rem"></i><div style="font-weight:600;margin-top:.5rem;font-size:.85rem">${label}</div></button>`).join('')}</div><div id="helper-pick"></div><textarea id="helper-note" rows="3" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none;margin-top:.85rem" placeholder="A short note for Jacob (optional)"></textarea><button onclick="sendHelper(this)" style="width:100%;margin-top:1rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Send to Jacob</button></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function sendHelper(button){
  const type=window._helperPick; if(!type)return alert('Pick a helper type.');
  const def=HELPER_TYPES.find(t=>t[0]===type);
  state.helpers.unshift({id:'h'+Date.now(),type,note:document.getElementById('helper-note').value.trim(),active:true,sentAt:new Date().toISOString()});
  addNotification('task','James has sent you a helper',def[1],'dashboard');
  window._helperPick=null; saveState(); button.closest('.fixed').remove(); renderDashboard(); showToast('Helper sent','success');
}
function viewHelper(id){
  const h=ensureArray(state.helpers).find(x=>x.id===id); if(!h)return;
  const def=HELPER_TYPES.find(t=>t[0]===h.type)||['','Helper','fa-hands-holding-circle','#888'];
  const isDom=state.currentRole==='dom';
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-6" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="max-width:22rem;width:100%;border-radius:2rem;padding:2rem 1.75rem;text-align:center;border-top:4px solid ${def[3]}"><i class="fa-solid ${def[2]}" style="font-size:3rem;color:${def[3]}"></i><div style="font-size:1.4rem;font-weight:600;margin-top:1rem">${def[1]}</div><div style="font-size:.9rem;color:var(--stone);margin-top:.75rem;white-space:pre-wrap">${escapeText(h.note||'Take a moment. James is helping you with this.')}</div><button onclick="dismissHelper('${id}',this)" style="width:100%;margin-top:1.5rem;padding:.85rem;background:${def[3]};border-radius:1rem;color:#fff">${isDom?'Close':'Done'}</button></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function dismissHelper(id,button){ const h=ensureArray(state.helpers).find(x=>x.id===id); if(h&&state.currentRole==='sub'){ h.active=false; saveState(); } button.closest('.fixed').remove(); renderDashboard(); }
/* ── Send Memory ── */
function showSendMemory(){
  if(state.currentRole!=='dom')return;
  const items=ensureArray(state.evidence).flatMap(e=>ensureArray(e.items).filter(i=>i.url).map(i=>({...i,from:e.title,date:e.date})));
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:30rem;max-height:90vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:.3rem">Send a Memory</div><div style="font-size:.75rem;color:var(--stone);margin-bottom:1rem">Pick a past piece of evidence. Jacob must view it, then reflect.</div>${items.length?`<div style="display:flex;flex-direction:column;gap:.5rem">${items.map((it,idx)=>`<button onclick="sendMemory(${idx})" class="tap subtle-card" style="padding:.85rem 1rem;text-align:left;display:flex;justify-content:space-between;align-items:center"><span style="font-size:.85rem"><i class="fa-solid ${it.type==='video'?'fa-video':it.type==='voice'?'fa-microphone':it.type==='photo'?'fa-image':'fa-paperclip'}" style="margin-right:.5rem;color:var(--rose)"></i>${titleCase(it.type)} · ${escapeText(it.from||'')}</span><span style="font-size:.7rem;color:var(--stone)">${formatUKDate(it.date)}</span></button>`).join('')}</div>`:`<div style="font-size:.85rem;opacity:.6;padding:1rem 0">No past evidence yet.</div>`}<div id="memlist-data" style="display:none"></div></div></div>`;
  document.getElementById('modal-container').appendChild(m);
  window._memItems=items;
}
function sendMemory(idx){
  const it=(window._memItems||[])[idx]; if(!it)return;
  state.memories.unshift({id:'m'+Date.now(),item:it,sentAt:new Date().toISOString(),viewed:false,reflectionDone:false});
  addNotification('task','James has sent you a memory','You must view it and reflect.','dashboard');
  saveState(); document.querySelectorAll('.fixed').forEach(x=>x.remove()); showToast('Memory sent','success'); renderDashboard();
}
function viewMemory(id){
  const mm=ensureArray(state.memories).find(x=>x.id===id); if(!mm)return;
  const it=mm.item; mm.viewed=true; saveState();
  const media=it.type==='video'?`<video src="${it.url}" controls autoplay playsinline style="width:100%;border-radius:1rem;max-height:55vh"></video>`
    :it.type==='photo'?`<img src="${it.url}" style="width:100%;border-radius:1rem">`
    :it.type==='voice'?`<audio src="${it.url}" controls autoplay style="width:100%"></audio>`
    :`<a href="${it.url}" target="_blank" rel="noopener" style="color:var(--gold)">Open evidence</a>`;
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 z-[200] flex items-end md:items-center justify-center" style="background:rgba(0,0,0,.95)" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;max-height:94vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:.65rem;letter-spacing:3px;color:var(--rose)">MEMORY FROM JAMES</div><div style="margin:1rem 0">${media}</div>${state.currentRole==='sub'?`<div style="font-size:.7rem;color:var(--gold);margin-bottom:.4rem">REFLECT — what does this bring up for you?</div><textarea id="mem-reflect" rows="4" onpaste="return false" class="beautiful-input no-paste" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none" placeholder="Write your reflection for James…"></textarea><button onclick="submitMemoryReflection('${id}',this)" style="width:100%;margin-top:1rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Send reflection to James</button>`:`<div style="font-size:.85rem;color:var(--stone)">${mm.reflection?'<b>Jacob:</b> '+escapeText(mm.reflection):'No reflection yet.'}</div>`}<button onclick="this.closest('.fixed').remove()" style="width:100%;margin-top:.5rem;padding:.6rem;color:var(--stone);font-size:.8rem">Close</button></div></div>`;
  document.getElementById('modal-container').appendChild(m);
  renderDashboard();
}
function showMemoriesReview(){
  if(state.currentRole!=='dom')return;
  const mems=ensureArray(state.memories);
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:32rem;max-height:90vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1rem">Memories Sent</div><div style="display:flex;flex-direction:column;gap:.6rem">${mems.length?mems.map(mm=>`<button onclick="viewMemory('${mm.id}')" class="tap subtle-card" style="text-align:left;padding:.9rem 1rem;display:flex;justify-content:space-between;align-items:center"><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:.9rem"><i class="fa-solid ${mm.item&&mm.item.type==='video'?'fa-video':mm.item&&mm.item.type==='voice'?'fa-microphone':'fa-image'}" style="margin-right:.4rem;color:var(--rose)"></i>${titleCase(mm.item&&mm.item.type||'memory')} · ${escapeText(mm.item&&mm.item.from||'')}</div><div style="font-size:.72rem;color:var(--stone);margin-top:.2rem">${mm.reflectionDone?'Reflection: '+escapeText((mm.reflection||'').slice(0,50)):(mm.viewed?'Viewed, awaiting reflection':'Not viewed yet')}</div></div><i class="fa-solid fa-chevron-right" style="color:rgba(198,166,66,.4);flex-shrink:0;margin-left:.5rem"></i></button>`).join(''):'<div style="opacity:.6">No memories sent yet.</div>'}</div></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function submitMemoryReflection(id,button){
  const mm=ensureArray(state.memories).find(x=>x.id===id); if(!mm)return;
  const val=document.getElementById('mem-reflect').value.trim(); if(!val)return alert('Write a reflection first.');
  mm.reflection=val; mm.reflectionDone=true; mm.reflectedAt=new Date().toISOString();
  addNotification('review','Jacob reflected on a memory','You need to review this.','dashboard');
  saveState(); button.closest('.fixed').remove(); renderDashboard(); showToast('Reflection sent','success');
}
/* ── Suggestion box ── */
function toggleSuggestionBox(){ if(state.currentRole!=='dom')return; state.suggestionBoxOpen=!state.suggestionBoxOpen; saveState(); showToast('Suggestion box '+(state.suggestionBoxOpen?'opened':'closed'),'success'); renderDashboard(); }
function showSuggestPunishment(){
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:28rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:.3rem">Suggest a Consequence</div><div style="font-size:.75rem;color:var(--stone);margin-bottom:1rem">This is only taken into consideration. James decides.</div><textarea id="sugg-text" rows="4" onpaste="return false" class="beautiful-input no-paste" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none" placeholder="What do you think would be fair…"></textarea><button onclick="submitSuggestion(this)" style="width:100%;margin-top:1rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Submit suggestion</button></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function submitSuggestion(button){
  const val=document.getElementById('sugg-text').value.trim(); if(!val)return alert('Write a suggestion first.');
  state.suggestions.unshift({id:'sg'+Date.now(),text:val,at:new Date().toISOString(),seen:false});
  addNotification('review','Jacob suggested a consequence','Taken into consideration.','dashboard');
  saveState(); button.closest('.fixed').remove(); showToast('Suggestion submitted','success');
}
function showSuggestions(){
  if(state.currentRole!=='dom')return;
  ensureArray(state.suggestions).forEach(s=>s.seen=true); saveState();
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:30rem;max-height:88vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1rem">Jacob's Suggestions</div><div style="display:flex;flex-direction:column;gap:.6rem">${ensureArray(state.suggestions).map(s=>`<div class="subtle-card" style="padding:.85rem 1rem"><div style="font-size:.85rem;white-space:pre-wrap">${escapeText(s.text)}</div><div style="font-size:.65rem;color:var(--stone);margin-top:.35rem">${formatUKDate(s.at)} · ${formatUKTime(s.at)}</div></div>`).join('')||'<div style="opacity:.6">No suggestions.</div>'}</div></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
/* ── Requests ── */
function showMakeRequest(){
  const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:30rem;max-height:92vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:.3rem">Make a Request</div><div style="font-size:.75rem;color:var(--stone);margin-bottom:1rem">Keep it short — about 10 words. James decides.</div>
    <input id="req-text" maxlength="80" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-bottom:.75rem" placeholder="e.g. Night out with friends Saturday">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:.75rem"><label style="font-size:.62rem;color:var(--stone)">DATE<input id="req-date" type="date" value="${tomorrow}" class="beautiful-input" style="width:100%;padding:.6rem;border-radius:.7rem;margin-top:.15rem;display:block"></label><label style="font-size:.62rem;color:var(--stone)">TIME<input id="req-time" type="time" class="beautiful-input" style="width:100%;padding:.6rem;border-radius:.7rem;margin-top:.15rem;display:block"></label></div>
    ${REQUEST_QUESTIONS.map(([k,q])=>`<label style="font-size:.65rem;color:rgba(198,166,66,.7);display:block;margin-bottom:.6rem">${q}<input data-rq="${k}" class="beautiful-input" style="width:100%;padding:.7rem 1rem;border-radius:1rem;margin-top:.2rem;display:block"></label>`).join('')}
    <textarea id="req-comments" rows="2" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none" placeholder="Optional comments"></textarea>
    <button onclick="submitRequest(this)" style="width:100%;margin-top:1rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Send to James</button>
  </div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function submitRequest(button){
  const text=document.getElementById('req-text').value.trim(); if(!text)return alert('Describe your request.');
  const answers={}; document.querySelectorAll('[data-rq]').forEach(el=>answers[el.dataset.rq]=el.value.trim());
  state.requests.unshift({id:'rq'+Date.now(),text,date:document.getElementById('req-date').value,time:document.getElementById('req-time').value,answers,comments:document.getElementById('req-comments').value.trim(),status:'requested',createdAt:new Date().toISOString(),archived:false});
  addNotification('review','Jacob submitted a request',text,'dashboard');
  saveState(); button.closest('.fixed').remove(); showToast('Request sent to James','success'); renderDashboard();
}
function showRequestsReview(){
  const isDom=state.currentRole==='dom';
  const live=ensureArray(state.requests).filter(r=>!r.archived);
  const archived=ensureArray(state.requests).filter(r=>r.archived);
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:32rem;max-height:90vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1rem">Requests</div>
    <div style="display:flex;flex-direction:column;gap:.6rem">${live.length?live.map(r=>requestCard(r,isDom)).join(''):'<div style="opacity:.6">No open requests.</div>'}</div>
    ${isDom&&archived.length?`<div style="font-size:.62rem;letter-spacing:2px;color:var(--stone);margin:1.25rem 0 .5rem">ARCHIVE</div><div style="display:flex;flex-direction:column;gap:.5rem">${archived.map(r=>requestCard(r,false,true)).join('')}</div>`:''}
  </div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function requestCard(r,isDom,archived){
  const col=r.status==='approved'?'var(--sage)':r.status==='denied'?'var(--red)':'var(--gold)';
  const ans=Object.entries(r.answers||{}).map(([k,v])=>v?`<div style="font-size:.72rem;color:var(--stone)"><b>${(REQUEST_QUESTIONS.find(q=>q[0]===k)||[,k])[1]}</b> ${escapeText(v)}</div>`:'').join('');
  return `<div class="subtle-card" style="padding:1rem;border-left:3px solid ${col};${archived?'opacity:.7':''}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="font-weight:600">${escapeText(r.text)}</div><span class="pill" style="font-size:.6rem;padding:.2rem .6rem;color:${col};text-transform:capitalize">${r.status}</span></div>
    <div style="font-size:.72rem;color:rgba(198,166,66,.7);margin-top:.25rem">${formatUKDate(r.date)} ${r.time||''}</div>
    ${ans?`<div style="margin-top:.5rem;display:flex;flex-direction:column;gap:.15rem">${ans}</div>`:''}
    ${r.comments?`<div style="font-size:.72rem;color:var(--stone);margin-top:.4rem;font-style:italic">"${escapeText(r.comments)}"</div>`:''}
    ${r.response?`<div style="font-size:.75rem;color:${col};margin-top:.5rem"><b>James:</b> ${escapeText(r.response)}</div>`:''}
    ${isDom&&r.status==='requested'?`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.4rem;margin-top:.7rem"><button onclick="respondRequest('${r.id}','approved')" class="tap" style="padding:.5rem;background:var(--sage-2);border-radius:.7rem;color:#fff;font-size:.75rem">Yes</button><button onclick="respondRequest('${r.id}','denied')" class="tap" style="padding:.5rem;background:rgba(143,17,24,.3);border-radius:.7rem;color:var(--rose);font-size:.75rem">No</button><button onclick="respondRequest('${r.id}','propose')" class="tap" style="padding:.5rem;background:rgba(255,255,255,.06);border-radius:.7rem;font-size:.75rem">Propose</button></div>`:''}
  </div>`;
}
function respondRequest(id,kind){
  const r=ensureArray(state.requests).find(x=>x.id===id); if(!r)return;
  if(kind==='propose'){ const alt=prompt('Propose an alternative for Jacob:'); if(!alt)return; r.status='approved'; r.response='Alternative: '+alt.trim(); addNotification('task','James proposed an alternative',r.text,'dashboard'); }
  else if(kind==='approved'){ r.status='approved'; r.response='Approved.'; addNotification('reward','James approved your request',r.text,'dashboard'); }
  else { r.status='denied'; r.response='Denied.'; addNotification('consequence','James denied your request',r.text,'dashboard'); }
  r.archived=true; saveState();
  document.querySelectorAll('.fixed').forEach(x=>x.remove()); showRequestsReview(); renderDashboard();
}

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

    ${isDom?domToolsCard():subActiveCards()}

    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;margin-bottom:2rem">
      <button onclick="navigateToTab('tasks')" class="card tap" style="padding:1rem;text-align:center">
        <div style="font-size:.6rem;color:rgba(198,166,66,.7);letter-spacing:2px;margin-bottom:.5rem">TASKS</div>
        <div style="font-size:2.25rem;font-weight:700;font-variant-numeric:tabular-nums">${completedCount}<span style="color:var(--stone);font-size:1rem">/${state.tasks.length}</span></div>
      </button>
      <button onclick="activeProtocolPanel='consequences';navigateToTab('protocols')" class="card tap" style="padding:1rem;text-align:center">
        <div style="font-size:.6rem;color:rgba(198,166,66,.7);letter-spacing:2px;margin-bottom:.5rem">ACTIVE CONSEQUENCES</div>
        <div id="dash-active-punish" style="font-size:2.25rem;font-weight:700;font-variant-numeric:tabular-nums">${activeP.length}</div>
      </button>
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
  /* Jacob sees only his active To-Do; completed history is James-only */
  const showCompleted=isDom;
  tab.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem">
      <div>
        <div class="heading-serif" style="font-size:2.5rem">${isDom?'Tasks':'To Do'}</div>
        <div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">${isDom?`${pending.length} pending · ${completed.length} completed`:`${pending.length} to do for James`}</div>
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
    ${showCompleted&&completed.length?`
    <div style="margin-top:1.5rem">
      <div style="font-size:.65rem;color:var(--stone);letter-spacing:3px;margin-bottom:.75rem;padding-left:.25rem">COMPLETED</div>
      <div style="display:flex;flex-direction:column;gap:.5rem">
        ${completed.slice(0,15).map(t=>`
          <button onclick="showTaskDetailById(${t.id})" class="glass tap" style="width:100%;text-align:left;padding:.85rem 1rem;border-radius:1rem;display:flex;justify-content:space-between;align-items:center;gap:.75rem">
            <span style="font-size:.85rem;flex:1">${escapeText(titleCase(t.title))}${ensureArray(t.evidence).length?` <span style="color:rgba(198,166,66,.6);font-size:.7rem">· ${ensureArray(t.evidence).length} item${ensureArray(t.evidence).length>1?'s':''}</span>`:''}${t.reviewed?'':` <span style="color:var(--gold);font-size:.66rem">· review</span>`}</span>
            <span style="font-size:.7rem;color:#34d399;flex-shrink:0"><i class="fa-solid fa-check" style="margin-right:.25rem"></i>${formatUKDate(t.completedDate)}</span>
            <i class="fa-solid fa-chevron-right" style="color:rgba(198,166,66,.4);flex-shrink:0"></i>
          </button>
        `).join('')}
      </div>
    </div>`:''}
  `;
}

/* ── Task detail modal ── */
function showTaskDetailById(id){ const t=state.tasks.find(x=>String(x.id)===String(id)); if(t) showTaskDetail(t); }
/* ════════════ PHASE 2: LIVE EVIDENCE ENGINE ════════════
   No uploads, no camera roll, no file picker. Everything Jacob submits is
   captured live inside the app: photos via shutter, video for an exact
   duration set by James, voice notes with a minimum length, text reports
   with word limits and no paste. ───────────────────────────────────── */
var _pend=null;            /* pending captured blobs for the open task */
var _cap={stream:null,recorder:null,chunks:[],timer:null,startedAt:0};
function _wordCount(s){ return (String(s||'').trim().match(/\S+/g)||[]).length; }
function taskReqs(task){ return (task&&task.evidenceReqs)||{}; }

function evidenceCaptureControls(task){
  const reqs=taskReqs(task);
  const required=ensureArray(task.requiredEvidence);
  _pend={taskId:task.id,photo:[],video:[],voice:[]};
  return `<div id="evidence-controls" style="display:flex;flex-direction:column;gap:.85rem">${required.map(type=>evidenceControl(task,type)).join('')||`<div style="font-size:.85rem;opacity:.6">No Evidence Required.</div>`}</div>`;
}
function evidenceControl(task,type){
  const reqs=taskReqs(task);
  if(type==='text'){
    const min=reqs.text&&reqs.text.minWords||0, max=reqs.text&&reqs.text.maxWords||0, spell=!!(reqs.text&&reqs.text.spellcheck);
    return `<div class="glass" style="padding:1rem;border-radius:1rem">
      <div style="font-size:.65rem;color:rgba(198,166,66,.7);letter-spacing:1px;margin-bottom:.4rem">TEXT REPORT${min||max?` · ${min||0}${max?'–'+max:'+'} words`:''}</div>
      <textarea id="evidence-text" rows="5" spellcheck="${spell}" oninput="updateWordCount(${task.id})" onpaste="return false" oncopy="return false" oncut="return false" class="beautiful-input no-paste" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none" placeholder="Type your report — pasting is disabled."></textarea>
      <div id="wc-${task.id}" style="font-size:.7rem;color:var(--stone);margin-top:.35rem">0 words</div>
    </div>`;
  }
  if(type==='photo'){
    const min=reqs.photo&&reqs.photo.min||1;
    return `<div class="glass" style="padding:1rem;border-radius:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:.65rem;color:rgba(198,166,66,.7);letter-spacing:1px"><i class="fa-solid fa-camera" style="margin-right:.4rem"></i>PHOTO · need ${min}</div><span id="cap-count-photo" style="font-size:.72rem;color:var(--sage)">0/${min}</span></div>
      <div id="cap-thumbs-photo" style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.6rem"></div>
      <button onclick="openCapture('photo',${task.id})" class="tap" style="width:100%;margin-top:.6rem;padding:.7rem;background:var(--blue-2);border-radius:.85rem;color:#fff;font-size:.85rem"><i class="fa-solid fa-camera" style="margin-right:.4rem"></i>Open Camera</button>
    </div>`;
  }
  if(type==='video'){
    const secs=reqs.video&&reqs.video.seconds||15;
    return `<div class="glass" style="padding:1rem;border-radius:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:.65rem;color:rgba(198,166,66,.7);letter-spacing:1px"><i class="fa-solid fa-video" style="margin-right:.4rem"></i>VIDEO · exactly ${secs}s</div><span id="cap-count-video" style="font-size:.72rem;color:var(--sage)">Not recorded</span></div>
      <button onclick="openCapture('video',${task.id})" class="tap" style="width:100%;margin-top:.6rem;padding:.7rem;background:var(--blue-2);border-radius:.85rem;color:#fff;font-size:.85rem"><i class="fa-solid fa-circle-dot" style="margin-right:.4rem"></i>Record ${secs}s Video</button>
    </div>`;
  }
  if(type==='voice'){
    const secs=reqs.voice&&reqs.voice.minSeconds||10;
    return `<div class="glass" style="padding:1rem;border-radius:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:.65rem;color:rgba(198,166,66,.7);letter-spacing:1px"><i class="fa-solid fa-microphone" style="margin-right:.4rem"></i>VOICE NOTE · min ${secs}s</div><span id="cap-count-voice" style="font-size:.72rem;color:var(--sage)">Not recorded</span></div>
      <button onclick="openCapture('voice',${task.id})" class="tap" style="width:100%;margin-top:.6rem;padding:.7rem;background:var(--blue-2);border-radius:.85rem;color:#fff;font-size:.85rem"><i class="fa-solid fa-microphone" style="margin-right:.4rem"></i>Record Voice Note</button>
    </div>`;
  }
  return '';
}
function updateWordCount(taskId){
  const ta=document.getElementById('evidence-text'); const el=document.getElementById('wc-'+taskId); if(!ta||!el)return;
  const task=state.tasks.find(t=>String(t.id)===String(taskId)); const r=taskReqs(task).text||{};
  const n=_wordCount(ta.value); let msg=n+' word'+(n===1?'':'s');
  if(r.minWords&&n<r.minWords) msg+=` · need ${r.minWords}`;
  if(r.maxWords&&n>r.maxWords) msg+=` · over by ${n-r.maxWords}`;
  el.textContent=msg;
  el.style.color=(r.minWords&&n<r.minWords)||(r.maxWords&&n>r.maxWords)?'var(--red)':'var(--stone)';
}
/* ── Live capture modal ── */
/* pick a recordable mime the device actually supports (iOS = mp4, others = webm) */
function _pickMime(kind){
  const cands=kind==='video'
    ? ['video/mp4;codecs=h264,aac','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']
    : ['audio/mp4','audio/aac','audio/webm;codecs=opus','audio/webm'];
  for(const c of cands){ try{ if(window.MediaRecorder&&MediaRecorder.isTypeSupported(c)) return c; }catch(_){} }
  return '';
}
function _ext(mime){ if(/mp4/.test(mime))return 'mp4'; if(/webm/.test(mime))return 'webm'; if(/aac/.test(mime))return 'm4a'; return 'dat'; }
/* James decides the camera at assign time. For Jacob, video & voice are a
   fully automatic ritual: 3-2-1 countdown → records the exact time on the
   chosen camera → edges flash near the end → "Thank you, Sir." → done.
   No flip, no cancel, no stop, no re-record. */
function openCapture(type,taskId){
  const task=state.tasks.find(t=>String(t.id)===String(taskId)); const reqs=taskReqs(task);
  if(!_pend||String(_pend.taskId)!==String(taskId)) _pend={taskId,photo:[],video:[],voice:[]};
  _cap.type=type; _cap.taskId=taskId; _cap.reqs=reqs;
  _cap.facing=(type==='photo'?(reqs.photo&&reqs.photo.camera):type==='video'?(reqs.video&&reqs.video.camera):null)||'environment';
  const mirror=_cap.facing==='user';
  const m=document.createElement('div'); m.id='capture-modal';
  m.innerHTML=`<div class="fixed inset-0 z-[260]" style="background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem">
    <div id="cap-flash" style="position:absolute;inset:0;pointer-events:none;z-index:2"></div>
    <div style="position:relative;width:100%;max-width:30rem;z-index:1">
      <video id="cap-video" autoplay muted playsinline style="width:100%;border-radius:1.25rem;background:#111;${type==='voice'?'display:none':''};${mirror?'transform:scaleX(-1)':''}"></video>
    </div>
    ${type==='voice'?`<div id="cap-voicewrap" style="width:12rem;height:12rem;border-radius:999px;background:radial-gradient(circle,rgba(143,17,24,.25),transparent);display:flex;align-items:center;justify-content:center;z-index:1"><i class="fa-solid fa-microphone" style="font-size:3.5rem;color:var(--rose)"></i></div>`:''}
    <div id="cap-timer" style="font-size:2.4rem;font-weight:800;color:#fff;margin-top:1rem;font-variant-numeric:tabular-nums;z-index:1">—</div>
    <div id="cap-hint" style="font-size:.8rem;color:var(--stone);margin-top:.25rem;text-align:center;max-width:22rem;z-index:1"></div>
    <div id="cap-message" style="display:none;z-index:3"></div>
    <div id="cap-actions" style="display:flex;gap:1rem;margin-top:1.5rem;flex-wrap:wrap;justify-content:center;z-index:1"></div>
  </div>`;
  document.getElementById('modal-container').appendChild(m);
  startCaptureFlow(type,taskId,reqs);
}
async function startCaptureFlow(type,taskId,reqs){
  const actions=document.getElementById('cap-actions'), hint=document.getElementById('cap-hint'), timer=document.getElementById('cap-timer');
  _stopStream();
  try{
    const constraints=type==='voice'?{audio:true}:{video:{facingMode:{ideal:_cap.facing}},audio:type==='video'};
    _cap.stream=await navigator.mediaDevices.getUserMedia(constraints);
  }catch(err){ if(hint)hint.textContent='Camera / microphone permission is required.'; if(actions)actions.innerHTML=`<button onclick="cancelCapture()" class="tap" style="padding:.7rem 1.4rem;background:var(--red);border-radius:1rem;color:#fff">Close</button>`; return; }
  if(type!=='voice'){ const v=document.getElementById('cap-video'); if(v){ v.style.display=''; v.srcObject=_cap.stream; } }
  if(type==='photo'){
    if(timer)timer.textContent=''; if(hint)hint.textContent=`Take ${(reqs.photo&&reqs.photo.min)||1} on the ${_cap.facing==='user'?'front':'back'} camera.`;
    if(actions)actions.innerHTML=`<button onclick="snapPhoto(${taskId})" class="tap" style="width:4.5rem;height:4.5rem;border-radius:999px;background:#fff;border:4px solid var(--red)"></button><button onclick="finishCapture()" class="tap" style="padding:.7rem 1.4rem;background:var(--sage-2);border-radius:1rem;color:#fff">Done</button>`;
  } else if(type==='video'){
    autoCountdown('video',(reqs.video&&reqs.video.seconds)||15);
  } else if(type==='voice'){
    autoCountdown('voice',(reqs.voice&&reqs.voice.minSeconds)||10);
  }
}
function snapPhoto(taskId){
  const v=document.getElementById('cap-video'); if(!v||!v.videoWidth)return;
  const c=document.createElement('canvas'); c.width=v.videoWidth; c.height=v.videoHeight;
  if(_cap.facing==='user'){ const ctx=c.getContext('2d'); ctx.translate(c.width,0); ctx.scale(-1,1); ctx.drawImage(v,0,0); } else { c.getContext('2d').drawImage(v,0,0); }
  c.toBlob(blob=>{ if(!blob)return; _pend.photo.push({blob,mime:'image/jpeg',ext:'jpg'}); const t=document.getElementById('cap-timer'); if(t)t.textContent=_pend.photo.length+' captured'; },'image/jpeg',0.9);
}
/* 3-2-1 then auto record */
function autoCountdown(kind,secs){
  const timer=document.getElementById('cap-timer'), hint=document.getElementById('cap-hint'), actions=document.getElementById('cap-actions');
  if(actions)actions.innerHTML=''; if(hint)hint.textContent='Get ready…';
  let c=3; if(timer){ timer.textContent=c; timer.classList.add('cap-big'); }
  _cap.timer=setInterval(()=>{ c--; if(c>0){ if(timer)timer.textContent=c; } else { clearInterval(_cap.timer); _cap.timer=null; if(timer)timer.classList.remove('cap-big'); doAutoRecord(kind,secs); } },850);
}
function doAutoRecord(kind,secs){
  if(!_cap.stream){ return; }
  const reqs=_cap.reqs||{}; const surprise=(kind==='video'&&reqs.video&&reqs.video.surprise&&reqs.video.surprise.extraSeconds>0)?reqs.video.surprise:null;
  const timer=document.getElementById('cap-timer'), hint=document.getElementById('cap-hint'), flash=document.getElementById('cap-flash');
  const mime=_pickMime(kind==='video'?'video':'audio');
  _cap.chunks=[]; _cap.recorder=mime?new MediaRecorder(_cap.stream,{mimeType:mime}):new MediaRecorder(_cap.stream);
  _cap.recorder.ondataavailable=e=>{ if(e.data.size) _cap.chunks.push(e.data); };
  _cap.recorder.onstop=()=>{ const mt=_cap.recorder.mimeType||mime||(kind==='video'?'video/mp4':'audio/mp4'); const blob=new Blob(_cap.chunks,{type:mt}); const item={blob,mime:mt,ext:_ext(mt)}; if(kind==='video')_pend.video=[item]; else _pend.voice=[item]; endAutoRecord(kind); };
  _cap.recorder.start(); let left=secs; let surprised=false; if(timer)timer.textContent=left+'s'; if(hint)hint.innerHTML='<i class="fa-solid fa-circle" style="color:var(--red);margin-right:.4rem;animation:pulseZone 1s infinite"></i>Recording — hold still.';
  _cap.timer=setInterval(()=>{
    left--; if(timer)timer.textContent=Math.max(0,left)+'s';
    if(left<=3&&left>0&&flash)flash.classList.add('cap-flash-on');
    if(left<=0){
      if(surprise&&!surprised){
        /* SEAMLESS fake-out: keep recording, flash blue, extend */
        surprised=true; if(flash){ flash.classList.remove('cap-flash-on'); flash.classList.add('cap-flash-blue'); setTimeout(()=>flash.classList.remove('cap-flash-blue'),1400); }
        const sm=document.getElementById('cap-message'); if(sm){ sm.style.display=''; sm.innerHTML=`<div class="cap-surprise">${escapeText(surprise.message||'Surprise. More.')}</div>`; setTimeout(()=>{ if(sm)sm.style.display='none'; },1800); }
        left=surprise.extraSeconds; if(timer)timer.textContent=left+'s';
      } else {
        clearInterval(_cap.timer); _cap.timer=null; try{_cap.recorder.stop();}catch(_){}
      }
    }
  },1000);
}
function endAutoRecord(kind){
  _stopStream();
  const flash=document.getElementById('cap-flash'); if(flash){ flash.classList.remove('cap-flash-on'); flash.classList.add('cap-flash-on'); setTimeout(()=>flash&&flash.classList.remove('cap-flash-on'),700); }
  const v=document.getElementById('cap-video'); if(v)v.style.display='none';
  const w=document.getElementById('cap-voicewrap'); if(w)w.style.display='none';
  const timer=document.getElementById('cap-timer'); if(timer)timer.textContent='';
  const hint=document.getElementById('cap-hint'); if(hint)hint.textContent='';
  const msg=document.getElementById('cap-message'); if(msg){ msg.style.display=''; msg.innerHTML=`<div class="cap-praise">${escapeText(randomPraise())}</div>`; }
  setTimeout(()=>{ finishCapture(true); },2600);
}
function _stopStream(){ if(_cap.stream){ _cap.stream.getTracks().forEach(t=>t.stop()); _cap.stream=null; } if(_cap.timer){ clearInterval(_cap.timer); _cap.timer=null; } }
function cancelCapture(){ try{ if(_cap.recorder&&_cap.recorder.state==='recording') _cap.recorder.stop(); }catch(_){} _stopStream(); _cap.recorder=null; const m=document.getElementById('capture-modal'); if(m)m.remove(); }
function finishCapture(autoFromRecord){
  _stopStream(); _cap.recorder=null; const m=document.getElementById('capture-modal'); if(m)m.remove();
  refreshEvidenceCounts();
  /* one chance: if a media-only task is fully captured, submit automatically */
  if(autoFromRecord&&_pend){
    const task=state.tasks.find(t=>String(t.id)===String(_pend.taskId)); const req=ensureArray(task&&task.requiredEvidence);
    const noText=!req.includes('text');
    const photoOk=!req.includes('photo')||_pend.photo.length>=((taskReqs(task).photo&&taskReqs(task).photo.min)||1);
    const videoOk=!req.includes('video')||_pend.video.length;
    const voiceOk=!req.includes('voice')||_pend.voice.length;
    if(noText&&photoOk&&videoOk&&voiceOk){ document.querySelectorAll('.fixed').forEach(x=>x.remove()); autoSubmitEvidence(_pend.taskId); }
  }
}
/* Upload captured media + complete the task without a Submit button (one-chance flow) */
async function autoSubmitEvidence(taskId){
  const task=state.tasks.find(t=>String(t.id)===String(taskId)); if(!task||!_pend)return;
  const uploads=[];
  _pend.photo.forEach((p,i)=>uploads.push({type:'photo',blob:p.blob,mime:p.mime||'image/jpeg',name:'photo-'+(i+1)+'.'+(p.ext||'jpg')}));
  _pend.video.forEach((p)=>uploads.push({type:'video',blob:p.blob,mime:p.mime||p.blob.type||'video/mp4',name:'video.'+(p.ext||'mp4')}));
  _pend.voice.forEach((p)=>uploads.push({type:'voice',blob:p.blob,mime:p.mime||p.blob.type||'audio/mp4',name:'voice.'+(p.ext||'m4a')}));
  const items=[]; showToast('Sending to James…','info');
  try{
    for(const u of uploads){
      const ref=evidenceStorage.ref('evidence/'+taskId+'/'+Date.now()+'-'+u.name);
      const file=new File([u.blob],u.name,{type:u.mime});
      const url=await uploadEvidenceFile(ref,file,{textContent:'',disabled:false});
      items.push({type:u.type,name:u.name,url,mime:u.mime,size:u.blob.size});
    }
    task.evidence=items; state.evidence.unshift({id:Date.now(),taskId,title:task.title,date:new Date().toISOString(),items});
    _pend=null; await completeTask(taskId); showToast("That's it. Sent.",'success');
  }catch(err){ console.error(err); showToast('Send failed — check connection','error'); }
}
function refreshEvidenceCounts(){
  if(!_pend)return;
  const task=state.tasks.find(t=>String(t.id)===String(_pend.taskId)); const reqs=taskReqs(task);
  const pc=document.getElementById('cap-count-photo'); if(pc) pc.textContent=_pend.photo.length+'/'+((reqs.photo&&reqs.photo.min)||1);
  const th=document.getElementById('cap-thumbs-photo'); if(th) th.innerHTML=_pend.photo.map(p=>`<img src="${URL.createObjectURL(p.blob)}" style="width:3rem;height:3rem;object-fit:cover;border-radius:.5rem">`).join('');
  const vc=document.getElementById('cap-count-video'); if(vc&&_pend.video.length) vc.textContent='Recorded ✓';
  const oc=document.getElementById('cap-count-voice'); if(oc&&_pend.voice.length) oc.textContent='Recorded ✓';
}
function renderSubmittedEvidence(task){
  const items=task.evidence||[]; if(!items.length)return`<div style="font-size:.85rem;opacity:.6">No Evidence Submitted.</div>`;
  const isDom=state.currentRole==='dom';
  return items.map(item=>{
    if(item.type==='text') return `<div class="glass" style="padding:1rem;border-radius:1rem"><div style="font-size:.65rem;color:rgba(198,166,66,.7);margin-bottom:.35rem">TEXT REPORT</div><div style="font-size:.85rem;white-space:pre-wrap">${escapeText(item.value)}</div></div>`;
    /* Only James can re-open / re-watch evidence. Jacob sees it is on file but cannot view. */
    if(!isDom) return `<div class="glass" style="padding:1rem;border-radius:1rem;display:flex;justify-content:space-between;align-items:center;opacity:.7"><span style="font-size:.85rem"><i class="fa-solid fa-paperclip" style="margin-right:.5rem"></i>${titleCase(item.type)} submitted</span><i class="fa-solid fa-lock" style="color:var(--stone)"></i></div>`;
    if(item.type==='video') return `<div class="glass" style="padding:.75rem;border-radius:1rem"><div style="font-size:.65rem;color:rgba(198,166,66,.7);margin-bottom:.5rem">VIDEO</div><video controls playsinline preload="metadata" style="width:100%;border-radius:.75rem;max-height:60vh"><source src="${item.url}" type="${item.mime||'video/mp4'}"></video><a href="${item.url}" target="_blank" rel="noopener" style="font-size:.7rem;color:var(--gold);display:inline-block;margin-top:.4rem">Open / download if it won't play</a></div>`;
    if(item.type==='photo') return `<a href="${item.url}" target="_blank" rel="noopener" class="glass" style="padding:.75rem;border-radius:1rem;display:block"><div style="font-size:.65rem;color:rgba(198,166,66,.7);margin-bottom:.5rem">PHOTO</div><img src="${item.url}" style="width:100%;border-radius:.75rem" loading="lazy"></a>`;
    if(item.type==='voice') return `<div class="glass" style="padding:1rem;border-radius:1rem"><div style="font-size:.65rem;color:rgba(198,166,66,.7);margin-bottom:.5rem">VOICE NOTE</div><audio controls preload="metadata" style="width:100%"><source src="${item.url}" type="${item.mime||'audio/mp4'}"></audio></div>`;
    return `<a href="${item.url}" target="_blank" rel="noopener" class="glass" style="padding:1rem;border-radius:1rem;display:flex;justify-content:space-between;align-items:center"><span style="font-size:.85rem"><i class="fa-solid fa-paperclip" style="margin-right:.5rem"></i>${escapeText(item.name||item.type)}</span><i class="fa-solid fa-arrow-up-right-from-square" style="color:var(--gold)"></i></a>`;
  }).join('');
}

/* Dominant-only evidence bank: every submitted item, grouped and playable. */
function evidenceBankItems(){
  const records=ensureArray(state.evidence).slice();
  const indexed=new Set(records.map(r=>String(r.taskId)));
  ensureArray(state.tasks).forEach(task=>{
    if(ensureArray(task.evidence).length&&!indexed.has(String(task.id))){
      records.push({id:'task-'+task.id,taskId:task.id,title:task.title,date:task.completedAt||task.completedDate||task.assignedAt,items:task.evidence});
    }
  });
  return records.flatMap(record=>ensureArray(record.items).map(item=>({...item,record})));
}
function setEvidenceFilter(filter){ activeEvidenceFilter=filter; renderEvidenceBank(); }
function evidenceBankMedia(item){
  if(item.type==='video') return `<div class="evidence-media"><video controls playsinline preload="metadata" src="${item.url}"></video></div>`;
  if(item.type==='photo') return `<a href="${item.url}" target="_blank" rel="noopener" class="evidence-media"><img src="${item.url}" loading="lazy" alt="Submitted photo"></a>`;
  if(item.type==='voice') return `<div class="card" style="padding:1rem"><audio controls preload="metadata" src="${item.url}" style="width:100%"></audio></div>`;
  if(item.type==='text') return `<div class="card" style="padding:1rem;font-size:.88rem;white-space:pre-wrap;line-height:1.65">${escapeText(item.value||'')}</div>`;
  return `<a href="${item.url}" target="_blank" rel="noopener" class="card tap" style="padding:1rem;display:flex;justify-content:space-between"><span>${escapeText(item.name||'Attachment')}</span><i class="fa-solid fa-arrow-up-right-from-square" style="color:var(--gold)"></i></a>`;
}
function renderEvidenceBank(){
  const tab=document.getElementById('tab-evidence'); if(!tab||state.currentRole!=='dom')return;
  const all=evidenceBankItems();
  const filters=[['all','All','fa-layer-group'],['video','Videos','fa-video'],['photo','Photos','fa-image'],['text','Text','fa-align-left'],['voice','Voice','fa-microphone'],['file','Files','fa-paperclip']];
  const visible=activeEvidenceFilter==='all'?all:all.filter(item=>item.type===activeEvidenceFilter);
  tab.innerHTML=`<div style="margin-bottom:1.25rem"><div class="heading-serif" style="font-size:2.5rem">Evidence Bank</div><div style="font-size:.8rem;color:var(--stone);margin-top:.2rem">Jacob’s submitted evidence, organised for your review.</div></div>
    <div class="seg-scroll" style="display:flex;gap:.45rem;overflow-x:auto;padding-bottom:.65rem;margin-bottom:1rem">${filters.map(([id,label,icon])=>`<button onclick="setEvidenceFilter('${id}')" class="pill tap" style="padding:.45rem .85rem;white-space:nowrap;font-size:.72rem;${activeEvidenceFilter===id?'background:var(--gold);color:#111;border-color:var(--gold)':''}"><i class="fa-solid ${icon}" style="margin-right:.35rem"></i>${label} <span style="opacity:.6">${id==='all'?all.length:all.filter(x=>x.type===id).length}</span></button>`).join('')}</div>
    <div style="display:flex;flex-direction:column;gap:1.25rem">${visible.map(item=>`<section><div style="display:flex;justify-content:space-between;align-items:end;margin:0 .2rem .45rem"><div><div style="font-weight:650">${escapeText(titleCase(item.record.title||'Evidence'))}</div><div style="font-size:.68rem;color:var(--stone)">${formatUKDate(item.record.date)} · ${formatUKTime(item.record.date)}</div></div><span style="font-size:.6rem;color:var(--gold);letter-spacing:1.5px;text-transform:uppercase">${escapeText(item.type)}</span></div>${evidenceBankMedia(item)}</section>`).join('')||`<div class="empty-bank"><i class="fa-solid fa-box-archive"></i><div>No ${activeEvidenceFilter==='all'?'evidence':activeEvidenceFilter} yet.</div></div>`}</div>`;
}
function showTaskDetail(task){
  const isDom=state.currentRole==='dom', isSub=!isDom;
  const redo=task.attempt&&task.attempt>1;
  let body;
  if(task.status==='completed'){
    body=`<div style="gap:.75rem;display:flex;flex-direction:column"><div style="font-size:.65rem;color:#34d399;letter-spacing:3px">EVIDENCE${task.reviewed?' · REVIEWED':' · AWAITING JAMES'}</div>${renderSubmittedEvidence(task)}</div>${isDom?domReviewControls(task):''}`;
  } else if(isSub){
    body=`${redo?`<div class="card" style="padding:.85rem 1rem;border-left:3px solid var(--red);margin-bottom:1rem"><div style="font-size:.7rem;color:var(--red);font-weight:700">SENT BACK BY JAMES — ATTEMPT ${task.attempt}</div>${task.redoReason?`<div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">${escapeText(task.redoReason)}</div>`:''}</div>`:''}${evidenceCaptureControls(task)}<button onclick="submitTaskEvidence(${task.id},this)" style="width:100%;margin-top:1.5rem;padding:.85rem;background:#064e3b;border-radius:1rem;color:#fff">Submit Evidence to James</button>`;
  } else {
    body=`<div style="font-size:.85rem;color:rgba(198,166,66,.7);margin-bottom:1rem">Awaiting Jacob's evidence.</div>${domPendingControls(task)}`;
  }
  const modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;max-height:92vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="display:flex;justify-content:space-between;gap:1rem;margin-bottom:1.25rem"><div><div style="font-size:1.4rem;font-weight:600">${escapeText(titleCase(task.title))}</div><div style="font-size:.7rem;color:rgba(198,166,66,.7);margin-top:.2rem">${formatUKDate(dueDateFor(task))} at ${formatUKTime(dueDateFor(task))}</div></div><button onclick="this.closest('.fixed').remove()" style="font-size:1.5rem;color:var(--stone)">×</button></div><div style="font-size:.9rem;margin-bottom:1.5rem;white-space:pre-wrap">${escapeText(task.desc||'No additional instructions.')}</div>${body}</div></div>`;
  document.getElementById('modal-container').appendChild(modal);
  if(task.status!=='completed'&&isSub) setTimeout(()=>updateWordCount(task.id),0);
}
function domPendingControls(task){
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
    <button onclick="revokeTask(${task.id},this)" class="tap" style="padding:.7rem;background:rgba(255,255,255,.06);border-radius:.85rem;font-size:.8rem">Revoke (silent)</button>
    <button onclick="deleteTask(${task.id},this)" class="tap" style="padding:.7rem;background:rgba(143,17,24,.2);border-radius:.85rem;font-size:.8rem;color:var(--red)">Delete</button>
  </div>`;
}
function domReviewControls(task){
  return `<div style="margin-top:1.25rem;border-top:1px solid rgba(255,255,255,.1);padding-top:1.1rem">
    <div style="font-size:.65rem;letter-spacing:2px;color:var(--gold);margin-bottom:.75rem">JAMES'S REVIEW</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
      <button onclick="approveTask(${task.id},this)" class="tap" style="padding:.75rem;background:var(--sage-2);border-radius:.85rem;color:#fff;font-size:.82rem"><i class="fa-solid fa-check" style="margin-right:.3rem"></i>Approve</button>
      <button onclick="redoTask(${task.id},this)" class="tap" style="padding:.75rem;background:var(--red);border-radius:.85rem;color:#fff;font-size:.82rem"><i class="fa-solid fa-rotate-left" style="margin-right:.3rem"></i>Send back / Redo</button>
      <button onclick="deductStarsFor(${task.id})" class="tap" style="padding:.75rem;background:rgba(143,17,24,.25);border-radius:.85rem;color:var(--rose);font-size:.82rem"><i class="fa-solid fa-star-half-stroke" style="margin-right:.3rem"></i>Deduct stars</button>
      <button onclick="requestReflectionFor(${task.id})" class="tap" style="padding:.75rem;background:rgba(255,255,255,.06);border-radius:.85rem;font-size:.82rem">Request reflection</button>
      <button onclick="addConsequenceFor(${task.id})" class="tap" style="padding:.75rem;background:rgba(255,255,255,.06);border-radius:.85rem;font-size:.82rem">Add consequence</button>
      <button onclick="downloadEvidence(${task.id})" class="tap" style="padding:.75rem;background:rgba(255,255,255,.06);border-radius:.85rem;font-size:.82rem"><i class="fa-solid fa-download" style="margin-right:.3rem"></i>Download</button>
    </div>
    <button onclick="deleteTask(${task.id},this)" class="tap" style="width:100%;margin-top:.5rem;padding:.6rem;color:var(--stone);font-size:.75rem">Delete task</button>
  </div>`;
}
async function submitTaskEvidence(taskId,button){
  const task=state.tasks.find(t=>String(t.id)===String(taskId)); if(!task)return;
  const required=ensureArray(task.requiredEvidence), reqs=taskReqs(task);
  const items=[];
  /* text validation */
  if(required.includes('text')){
    const ta=document.getElementById('evidence-text'); const val=(ta&&ta.value||'').trim();
    const n=_wordCount(val), r=reqs.text||{};
    if(!val) return alert('Please complete the text report.');
    if(r.minWords&&n<r.minWords) return alert(`Your report needs at least ${r.minWords} words (you have ${n}).`);
    if(r.maxWords&&n>r.maxWords) return alert(`Your report must be at most ${r.maxWords} words (you have ${n}).`);
    items.push({type:'text',value:val});
  }
  /* media counts */
  if(required.includes('photo')){ const need=(reqs.photo&&reqs.photo.min)||1; if(!_pend||_pend.photo.length<need) return alert(`Capture ${need} photo${need>1?'s':''} first (you have ${_pend?_pend.photo.length:0}).`); }
  if(required.includes('video')&&(!_pend||!_pend.video.length)) return alert('Record the video first.');
  if(required.includes('voice')&&(!_pend||!_pend.voice.length)) return alert('Record the voice note first.');
  button.disabled=true;
  try{
    const blobUploads=[];
    if(_pend){
      _pend.photo.forEach((p,i)=>blobUploads.push({type:'photo',blob:p.blob,mime:p.mime||'image/jpeg',name:'photo-'+(i+1)+'.'+(p.ext||'jpg')}));
      _pend.video.forEach((p)=>blobUploads.push({type:'video',blob:p.blob,mime:p.mime||p.blob.type||'video/mp4',name:'video.'+(p.ext||'mp4')}));
      _pend.voice.forEach((p)=>blobUploads.push({type:'voice',blob:p.blob,mime:p.mime||p.blob.type||'audio/mp4',name:'voice.'+(p.ext||'m4a')}));
    }
    for(const u of blobUploads){
      button.textContent='Uploading '+titleCase(u.type)+'…';
      const ref=evidenceStorage.ref('evidence/'+taskId+'/'+Date.now()+'-'+u.name);
      const file=new File([u.blob],u.name,{type:u.mime});
      const url=await uploadEvidenceFile(ref,file,button);
      items.push({type:u.type,name:u.name,url,mime:u.mime,size:u.blob.size});
    }
    task.evidence=items; task.report=(items.find(i=>i.type==='text')||{}).value||'';
    state.evidence.unshift({id:Date.now(),taskId,title:task.title,date:new Date().toISOString(),items});
    button.textContent='Saving…'; _pend=null; await completeTask(taskId); button.closest('.fixed').remove();
  }catch(err){ console.error(err); button.disabled=false; button.textContent='Submit Evidence to James'; alert('Submission failed. Check your connection.'); }
}
/* ── James's task controls ── */
function approveTask(id,btn){ const t=state.tasks.find(x=>String(x.id)===String(id)); if(!t)return; t.reviewed=true; t.approved=true; addNotification('reward','James approved this','“'+titleCase(t.title)+'” approved.','tasks'); saveState(); btn.closest('.fixed').remove(); renderTasks(); showToast('Approved','success'); }
function redoTask(id){ const t=state.tasks.find(x=>String(x.id)===String(id)); if(!t)return; const reason=prompt('Why is this being sent back? (optional)')||''; t.status='pending'; t.attempt=(t.attempt||1)+1; t.redoReason=reason.trim(); t.evidence=[]; t.reviewed=false; t.approved=false; addNotification('redo','James sent this back as a redo',titleCase(t.title),'tasks'); saveState(); document.querySelectorAll('.fixed').forEach(x=>x.remove()); renderTasks(); renderDashboard(); showToast('Sent back for redo','success'); }
function deductStarsFor(id){ const t=state.tasks.find(x=>String(x.id)===String(id)); const amt=parseInt(prompt('How many stars to deduct?','2')||'0',10); if(!amt||amt<=0)return; state.stars=Math.max(0,(state.stars||0)-amt); state.starLog.unshift({id:Date.now(),date:new Date().toISOString().slice(0,10),reason:'Deducted by James: '+(t?titleCase(t.title):'task'),amount:-amt}); addNotification('consequence','James deducted stars','−'+amt+' stars','stars'); saveState(); renderRewards&&renderRewards(); updateHeader(); showToast('−'+amt+' stars','success'); }
function requestReflectionFor(id){ const t=state.tasks.find(x=>String(x.id)===String(id)); if(!t)return; const refl={id:Date.now(),title:'Reflection: '+titleCase(t.title),desc:'Reflect on why this happened and what you will do better.',due:new Date(Date.now()+86400000).toISOString().slice(0,10),dueAt:new Date(Date.now()+86400000).toISOString(),category:'Reflective log',status:'pending',priority:1,requiredEvidence:['text'],evidenceReqs:{text:{minWords:40}},assignedAt:new Date().toISOString(),evidence:[],attempt:1}; state.tasks.unshift(refl); addNotification('task','James requested a reflection',refl.title,'tasks'); saveState(); document.querySelectorAll('.fixed').forEach(x=>x.remove()); renderTasks(); showToast('Reflection requested','success'); }
function addConsequenceFor(id){ const t=state.tasks.find(x=>String(x.id)===String(id)); const title=prompt('Consequence title:', t?('Consequence: '+titleCase(t.title)):'Consequence'); if(!title)return; const reason=prompt('Why? (Jacob will see this explanation)')||''; state.punishments.unshift({id:Date.now(),title:titleCase(title),desc:'',reason:reason.trim(),source:t?('From reviewing the task “'+titleCase(t.title)+'”'):'Added directly by James',kind:'timed',due:new Date(Date.now()+86400000).toISOString().slice(0,10),dueAt:new Date(Date.now()+86400000).toISOString(),status:'active',assignedAt:new Date().toISOString()}); addNotification('consequence','James added a consequence',titleCase(title),'protocols'); saveState(); document.querySelectorAll('.fixed').forEach(x=>x.remove()); showToast('Consequence added','success'); }
function downloadEvidence(id){ const t=state.tasks.find(x=>String(x.id)===String(id)); if(!t)return; ensureArray(t.evidence).filter(e=>e.url).forEach(e=>{ const a=document.createElement('a'); a.href=e.url; a.target='_blank'; a.rel='noopener'; a.download=e.name||e.type; a.click(); }); showToast('Opening evidence…','info'); }
function revokeTask(id,btn){ if(!confirm('Revoke this task silently? Jacob is not notified.'))return; state.tasks=state.tasks.filter(x=>String(x.id)!==String(id)); saveState(); btn.closest('.fixed').remove(); renderTasks(); renderDashboard(); /* deliberately no notification */ }
function deleteTask(id,btn){ if(!confirm('Delete this task?'))return; state.tasks=state.tasks.filter(x=>String(x.id)!==String(id)); saveState(); btn.closest('.fixed').remove(); renderTasks(); renderDashboard(); }
async function completeTask(taskId){
  const task=state.tasks.find(t=>String(t.id)===String(taskId)); if(!task)return;
  const backup=JSON.stringify(state); task.status='completed'; task.completedAt=new Date().toISOString(); task.completedDate=task.completedAt.slice(0,10);
  const earned=task.priority||1; state.stars=(state.stars||0)+earned;
  state.starLog.unshift({id:Date.now(),date:task.completedDate,reason:'Completed: '+task.title,amount:earned});
  state.punishments.forEach(p=>{ if(p.status==='active'&&String(p.linkedTaskId)===String(taskId)){p.status='completed';p.completedAt=task.completedAt;} });
  addNotification('review','Jacob has submitted evidence','“'+titleCase(task.title)+'” — you need to review this.','tasks');
  localStorage.setItem('the_system_v4',JSON.stringify(state));
  try{ await sharedStateDocument.set(getSharedState()); showConfetti(35); renderDashboard(); renderTasks(); }
  catch(err){ state=JSON.parse(backup); localStorage.setItem('the_system_v4',backup); throw err; }
}
function uploadEvidenceFile(ref,file,button){ return new Promise((resolve,reject)=>{ const u=ref.put(file,{contentType:file.type}); u.on('state_changed',s=>{ const p=s.totalBytes?Math.round(s.bytesTransferred/s.totalBytes*100):0; button.textContent='Uploading '+file.name+' · '+p+'%'; },reject,async()=>{ try{resolve(await ref.getDownloadURL());}catch(e){reject(e);} }); }); }

/* ── Add task modal ── */
function _localDateTimeValue(d){
  const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function setTaskDeadline(minsFromNow){
  const d=new Date(Date.now()+minsFromNow*60000);
  const inp=document.getElementById('task-deadline'); if(inp) inp.value=_localDateTimeValue(d);
  document.querySelectorAll('.qd-btn').forEach(b=>b.classList.remove('qd-on'));
  const hit=document.querySelector(`.qd-btn[data-min="${minsFromNow}"]`); if(hit) hit.classList.add('qd-on');
}
function showAddTaskModal(){
  const def=new Date(Date.now()+24*60*60000);
  const quick=[['10 min',10],['30 min',30],['1 hr',60],['3 hr',180],['Tonight',null],['Tomorrow',1440]];
  const modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;max-height:92vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))">
    <div style="font-size:1.25rem;font-weight:600;margin-bottom:1.25rem">Assign Task</div>
    <div style="display:flex;flex-direction:column;gap:.85rem">
      <input id="task-title" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" placeholder="Task Title">
      <textarea id="task-desc" rows="3" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none" placeholder="Instructions"></textarea>
      <div>
        <div style="font-size:.7rem;color:rgba(198,166,66,.7);margin-bottom:.5rem">QUICK DEADLINE — e.g. “complete in 10 minutes”</div>
        <div style="display:flex;flex-wrap:wrap;gap:.4rem">${quick.map(([label,min])=>`<button type="button" class="qd-btn pill tap" data-min="${min===null?'tonight':min}" onclick="${min===null?'setTaskTonight()':`setTaskDeadline(${min})`}" style="padding:.4rem .9rem;font-size:.72rem">${label}</button>`).join('')}</div>
      </div>
      <label style="font-size:.7rem;color:rgba(198,166,66,.7)">DUE DATE &amp; TIME<input id="task-deadline" type="datetime-local" value="${_localDateTimeValue(def)}" class="beautiful-input" style="width:100%;padding:.75rem .85rem;border-radius:.85rem;margin-top:.3rem;display:block"></label>
      <select id="task-cat" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem"><option>Service</option><option>Chore</option><option>Personal</option><option>Reflective log</option><option>Consequence Task</option></select>
      <div><div style="font-size:.7rem;color:rgba(198,166,66,.7);margin-bottom:.5rem">REQUIRED PROOF — captured live, no uploads</div><div style="display:flex;flex-direction:column;gap:.55rem">
        ${proofRow('photo','Photo','fa-camera',`<label style="font-size:.62rem;color:var(--stone)">Minimum photos<input id="req-photo-min" type="number" min="1" value="1" class="beautiful-input" style="width:100%;padding:.55rem;border-radius:.6rem;margin-top:.15rem;display:block"></label>${_cameraPicker('photo')}`)}
        ${proofRow('video','Video','fa-video',`<label style="font-size:.62rem;color:var(--stone)">Shown duration (seconds)<input id="req-video-sec" type="number" min="1" value="15" class="beautiful-input" style="width:100%;padding:.55rem;border-radius:.6rem;margin-top:.15rem;display:block"></label>${_cameraPicker('video')}<label style="display:flex;align-items:center;gap:.5rem;font-size:.7rem;margin-top:.6rem"><input type="checkbox" id="req-video-surprise" style="accent-color:var(--red)" onchange="document.getElementById('req-video-surprise-box').style.display=this.checked?'block':'none'">Surprise extension (fake-out)</label><div id="req-video-surprise-box" style="display:none;margin-top:.4rem;border-top:1px solid rgba(255,255,255,.08);padding-top:.5rem"><label style="font-size:.62rem;color:var(--stone)">Extra seconds added on the surprise<input id="req-video-extra" type="number" min="1" value="60" class="beautiful-input" style="width:100%;padding:.55rem;border-radius:.6rem;margin-top:.15rem;display:block"></label><input id="req-video-smsg" class="beautiful-input" style="width:100%;padding:.55rem;border-radius:.6rem;margin-top:.4rem;font-size:.8rem" placeholder="Surprise message (blue flash)" value="Surprise. You're not done."></div>`)}
        ${proofRow('voice','Voice Note','fa-microphone',`<label style="font-size:.62rem;color:var(--stone)">Minimum length (seconds)<input id="req-voice-sec" type="number" min="1" value="10" class="beautiful-input" style="width:100%;padding:.55rem;border-radius:.6rem;margin-top:.15rem;display:block"></label>`)}
        ${proofRow('text','Text Report','fa-pen',`<div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem"><label style="font-size:.62rem;color:var(--stone)">Min words<input id="req-text-min" type="number" min="0" value="0" class="beautiful-input" style="width:100%;padding:.55rem;border-radius:.6rem;margin-top:.15rem;display:block"></label><label style="font-size:.62rem;color:var(--stone)">Max words<input id="req-text-max" type="number" min="0" value="0" class="beautiful-input" style="width:100%;padding:.55rem;border-radius:.6rem;margin-top:.15rem;display:block"></label></div><label style="display:flex;align-items:center;gap:.5rem;font-size:.72rem;margin-top:.5rem"><input type="checkbox" id="req-text-spell" style="accent-color:var(--red)">Require spell-check</label>`)}
      </div></div>
    </div>
    <div style="display:flex;gap:.75rem;margin-top:1.5rem"><button onclick="this.closest('.fixed').remove()" style="flex:1;padding:.85rem;border:1px solid rgba(255,255,255,.2);border-radius:1rem">Cancel</button><button onclick="addNewTask(this)" style="flex:1;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Assign</button></div>
  </div></div>`;
  document.getElementById('modal-container').appendChild(modal);
}
function _cameraPicker(kind){
  return `<div style="font-size:.62rem;color:var(--stone);margin-top:.5rem">CAMERA (you choose — Jacob can't change it)</div>
  <div style="display:flex;gap:.4rem;margin-top:.2rem">
    <button type="button" onclick="this.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('qd-on'));this.classList.add('qd-on');window['_cam_${kind}']='environment'" class="qd-btn pill tap qd-on" style="flex:1;padding:.45rem;font-size:.72rem"><i class="fa-solid fa-camera" style="margin-right:.3rem"></i>Back</button>
    <button type="button" onclick="this.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('qd-on'));this.classList.add('qd-on');window['_cam_${kind}']='user'" class="qd-btn pill tap" style="flex:1;padding:.45rem;font-size:.72rem"><i class="fa-solid fa-user" style="margin-right:.3rem"></i>Front</button>
  </div>`;
}
function setTaskTonight(){
  const d=new Date(); d.setHours(21,0,0,0); if(d<new Date()) d.setDate(d.getDate()+1);
  const inp=document.getElementById('task-deadline'); if(inp) inp.value=_localDateTimeValue(d);
  document.querySelectorAll('.qd-btn').forEach(b=>b.classList.remove('qd-on'));
  const hit=document.querySelector('.qd-btn[data-min="tonight"]'); if(hit) hit.classList.add('qd-on');
}
function proofRow(id,label,icon,reqHtml){
  return `<div class="glass" style="padding:.7rem .9rem;border-radius:1rem">
    <label style="display:flex;align-items:center;gap:.6rem;cursor:pointer;font-size:.88rem"><input type="checkbox" id="ev-${id}" style="accent-color:var(--red)" onchange="document.getElementById('req-${id}').style.display=this.checked?'block':'none'"><i class="fa-solid ${icon}" style="color:var(--rose);width:1.1rem;text-align:center"></i>${label}</label>
    <div id="req-${id}" style="display:none;margin-top:.6rem;padding-top:.6rem;border-top:1px solid rgba(255,255,255,.08)">${reqHtml}</div>
  </div>`;
}
function addNewTask(button){
  const title=titleCase(document.getElementById('task-title').value||'Untitled Task');
  const dl=document.getElementById('task-deadline').value; // datetime-local: YYYY-MM-DDTHH:MM
  const dueAt=dl?dl+':00':new Date(Date.now()+86400000).toISOString();
  const date=(dl||new Date(Date.now()+86400000).toISOString()).slice(0,10);
  const required=['photo','video','voice','text'].filter(t=>document.getElementById('ev-'+t)?.checked);
  const numv=(id,d)=>{ const e=document.getElementById(id); const n=e?parseInt(e.value,10):NaN; return isNaN(n)?d:n; };
  const evidenceReqs={};
  if(required.includes('photo')) evidenceReqs.photo={min:Math.max(1,numv('req-photo-min',1)),camera:window._cam_photo||'environment'};
  if(required.includes('video')){ evidenceReqs.video={seconds:Math.max(1,numv('req-video-sec',15)),camera:window._cam_video||'environment'}; if(document.getElementById('req-video-surprise')?.checked){ evidenceReqs.video.surprise={extraSeconds:Math.max(1,numv('req-video-extra',60)),message:(document.getElementById('req-video-smsg')?.value||'').trim()||"Surprise. You're not done."}; } }
  if(required.includes('voice')) evidenceReqs.voice={minSeconds:Math.max(1,numv('req-voice-sec',10))};
  if(required.includes('text')) evidenceReqs.text={minWords:Math.max(0,numv('req-text-min',0)),maxWords:Math.max(0,numv('req-text-max',0)),spellcheck:!!document.getElementById('req-text-spell')?.checked};
  const task={id:Date.now(),title,desc:document.getElementById('task-desc').value.trim(),due:date,dueAt,category:document.getElementById('task-cat').value,status:'pending',priority:2,requiredEvidence:required,evidenceReqs,attempt:1,assignedAt:new Date().toISOString(),evidence:[]};
  state.tasks.unshift(task);
  if(task.category==='Consequence Task') state.punishments.unshift({id:Date.now()+1,title:task.title,desc:task.desc,reason:task.desc||'',source:'Assigned as a consequence task by James',kind:'task',linkedTaskId:task.id,status:'active',assignedAt:new Date().toISOString()});
  addNotification('task','Task assigned',task.title,'tasks'); saveState(); button.closest('.fixed').remove(); renderTasks(); renderDashboard(); showConfetti(20);
}

/* ── Protocols hub ── */
const PROTOCOL_TABS=[['rules','Rules','fa-section'],['consequences','Consequences','fa-hourglass-half'],['boundaries','Boundaries','fa-shield-halved'],['body','Body','fa-person'],['impact','Impact','fa-gavel']];
function setProtocolPanel(p){ activeProtocolPanel=p; renderProtocols(); }
function renderProtocols(){
  const tab=document.getElementById('tab-protocols'); if(!tab)return;
  /* legacy panel ids → new */
  if(activeProtocolPanel==='bodymaps'||activeProtocolPanel==='records') activeProtocolPanel='body';
  tab.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.1rem">
      <div><div class="heading-serif" style="font-size:2.5rem">The Dynamic</div><div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">Rules, consequences, boundaries and records.</div></div>
      <button onclick="showProfileModal()" class="pill tap" style="font-size:.72rem;padding:.4rem .85rem;flex-shrink:0"><i class="fa-solid fa-user" style="margin-right:.3rem"></i>Profile</button>
    </div>
    <div class="seg-scroll" style="display:flex;gap:.4rem;overflow-x:auto;margin-bottom:1.25rem;padding-bottom:.4rem">
      ${PROTOCOL_TABS.map(([id,label,icon])=>`<button onclick="setProtocolPanel('${id}')" class="seg-btn tap${activeProtocolPanel===id?' seg-on':''}"><i class="fa-solid ${icon}"></i><span>${label}</span></button>`).join('')}
    </div>
    <div id="protocol-panel"></div>`;
  const box=document.getElementById('protocol-panel');
  if(activeProtocolPanel==='rules') box.innerHTML=renderProtocolRules();
  else if(activeProtocolPanel==='boundaries') box.innerHTML=renderBoundaryPanel();
  else if(activeProtocolPanel==='body') box.innerHTML=renderBodyPanel();
  else if(activeProtocolPanel==='impact') box.innerHTML=renderImpactPanel();
  else if(activeProtocolPanel==='consequences'){ box.innerHTML=renderConsequenceCategories()+'<div style="font-size:.65rem;color:rgba(198,166,66,.6);letter-spacing:3px;margin:1.5rem 0 .5rem">ACTIVE</div><div id="punishments-active" style="display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem"></div><div style="font-size:.65rem;color:rgba(198,166,66,.6);letter-spacing:3px;margin-bottom:.5rem">HISTORY</div><div id="punishments-history" style="display:flex;flex-direction:column;gap:.5rem;font-size:.85rem"></div>'; renderPunishments(); }
}
/* ── Consequence categories (numbered lists James builds) ── */
function renderConsequenceCategories(){
  const isDom=state.currentRole==='dom'; const cl=state.consequenceLists||{};
  return `<div style="display:flex;flex-direction:column;gap:1rem">${CONSEQUENCE_CATEGORIES.map(([key,label,icon])=>{
    const items=ensureArray(cl[key]);
    return `<section class="card" style="padding:1.1rem 1.25rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${items.length?'.75rem':'.25rem'}"><div style="display:flex;align-items:center;gap:.7rem"><span class="icon-tile"><i class="fa-solid ${icon}"></i></span><div style="font-weight:600">${label}</div></div>${isDom?`<button onclick="addConsequenceListItem('${key}')" class="pill tap" style="font-size:.65rem;padding:.28rem .7rem;color:var(--gold)">+ Add</button>`:''}</div>${items.length?`<ol style="margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:.4rem">${items.map((it,i)=>`<li style="display:flex;gap:.6rem;font-size:.85rem;align-items:flex-start"><span class="rule-number">${i+1}</span><span style="flex:1">${escapeText(it)}</span>${isDom?`<span onclick="removeConsequenceListItem('${key}',${i})" style="cursor:pointer;color:var(--stone)">×</span>`:''}</li>`).join('')}</ol>`:`<div style="font-size:.72rem;opacity:.4;padding-left:.25rem">${isDom?'Add options for this category.':'Nothing listed.'}</div>`}</section>`;
  }).join('')}</div>`;
}
function addConsequenceListItem(key){ if(state.currentRole!=='dom')return; const v=(prompt('Add a '+key+' consequence:')||'').trim(); if(!v)return; state.consequenceLists=state.consequenceLists||{}; state.consequenceLists[key]=ensureArray(state.consequenceLists[key]); state.consequenceLists[key].push(v); saveState(); renderProtocols(); }
function removeConsequenceListItem(key,i){ if(state.currentRole!=='dom')return; ensureArray(state.consequenceLists[key]).splice(i,1); saveState(); renderProtocols(); }
/* ── Body area: dated photos + body maps + records together ── */
function renderBodyPanel(){
  return renderBodyPhotosSection()+'<div style="height:1rem"></div>'+renderBodyMapsPanel()+'<div style="height:1rem"></div>'+renderPersonalRecordsPanel();
}
function renderBodyPhotosSection(){
  const isDom=state.currentRole==='dom';
  const photos=ensureArray(state.bodyPhotos).slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  const canSee=isDom||state.bodyPhotosVisible;
  return `<section class="card" style="padding:1.25rem">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><div><div style="font-size:1.2rem;font-weight:600"><i class="fa-solid fa-camera-retro" style="color:var(--rose);margin-right:.4rem"></i>Body Record</div><div style="font-size:.72rem;color:var(--stone);margin-top:.15rem">Dated photos — progress over time.</div></div>
    ${isDom?`<div style="display:flex;gap:.4rem"><button onclick="toggleBodyPhotosVisible()" class="pill tap" style="font-size:.62rem;padding:.28rem .7rem;${state.bodyPhotosVisible?'color:var(--sage)':'color:var(--stone)'}"><i class="fa-solid ${state.bodyPhotosVisible?'fa-eye':'fa-eye-slash'}" style="margin-right:.25rem"></i>${state.bodyPhotosVisible?'Jacob sees':'Hidden'}</button><button onclick="captureBodyPhoto()" class="pill tap" style="font-size:.62rem;padding:.28rem .7rem;color:var(--gold)">+ Photo</button></div>`:''}</div>
    ${!canSee?`<div class="redact-shimmer" style="border-radius:1rem;min-height:5rem;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.35);font-size:.8rem"><i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Hidden by James</div>`
      :photos.length?`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem">${photos.map(p=>`<a href="${p.url}" target="_blank" rel="noopener" style="display:block;position:relative;border-radius:.75rem;overflow:hidden"><img src="${p.url}" style="width:100%;aspect-ratio:.8;object-fit:cover" loading="lazy"><span style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.8));color:#fff;font-size:.6rem;padding:.4rem .3rem .25rem;text-align:center">${formatUKDate(p.date)}</span>${isDom?`<span onclick="event.preventDefault();removeBodyPhoto('${p.id}')" style="position:absolute;top:.2rem;right:.2rem;width:1.4rem;height:1.4rem;border-radius:999px;background:rgba(0,0,0,.6);color:#fff;font-size:.8rem;display:flex;align-items:center;justify-content:center">×</span>`:''}</a>`).join('')}</div>`
      :`<div style="font-size:.78rem;opacity:.5;padding:.5rem 0">${isDom?'No photos yet — tap + Photo to add one with today’s date.':'Nothing here yet.'}</div>`}
  </section>`;
}
function toggleBodyPhotosVisible(){ if(state.currentRole!=='dom')return; state.bodyPhotosVisible=!state.bodyPhotosVisible; saveState(); renderProtocols(); }
function removeBodyPhoto(id){ if(state.currentRole!=='dom')return; if(!confirm('Remove this photo?'))return; state.bodyPhotos=ensureArray(state.bodyPhotos).filter(p=>p.id!==id); saveState(); renderProtocols(); }
async function captureBodyPhoto(){
  if(state.currentRole!=='dom')return;
  const m=document.createElement('div'); m.id='bodyphoto-modal';
  m.innerHTML=`<div class="fixed inset-0 z-[260]" style="background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem"><video id="bp-video" autoplay muted playsinline style="width:100%;max-width:30rem;border-radius:1.25rem;background:#111"></video><div id="bp-hint" style="font-size:.8rem;color:var(--stone);margin-top:.75rem">Today: ${formatUKDate(new Date().toISOString())}</div><div id="bp-actions" style="display:flex;gap:1rem;margin-top:1.25rem"></div><button onclick="closeBodyPhoto()" style="margin-top:1.25rem;font-size:.8rem;color:var(--stone)">Cancel</button></div>`;
  document.getElementById('modal-container').appendChild(m);
  try{ _bpStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}); document.getElementById('bp-video').srcObject=_bpStream; document.getElementById('bp-actions').innerHTML=`<button onclick="snapBodyPhoto(this)" class="tap" style="width:4.5rem;height:4.5rem;border-radius:999px;background:#fff;border:4px solid var(--rose)"></button>`; }
  catch(e){ document.getElementById('bp-hint').textContent='Camera permission needed.'; }
}
var _bpStream=null;
function closeBodyPhoto(){ if(_bpStream){ _bpStream.getTracks().forEach(t=>t.stop()); _bpStream=null; } const m=document.getElementById('bodyphoto-modal'); if(m)m.remove(); }
async function snapBodyPhoto(btn){
  const v=document.getElementById('bp-video'); if(!v||!v.videoWidth)return; btn.disabled=true;
  const c=document.createElement('canvas'); c.width=v.videoWidth; c.height=v.videoHeight; c.getContext('2d').drawImage(v,0,0);
  document.getElementById('bp-hint').textContent='Saving…';
  c.toBlob(async blob=>{
    try{ const ref=evidenceStorage.ref('bodyphotos/'+Date.now()+'.jpg'); const file=new File([blob],'body.jpg',{type:'image/jpeg'}); const url=await uploadEvidenceFile(ref,file,{textContent:'',disabled:false}); state.bodyPhotos=ensureArray(state.bodyPhotos); state.bodyPhotos.unshift({id:'bp'+Date.now(),url,date:new Date().toISOString()}); saveState(); closeBodyPhoto(); renderProtocols(); showToast('Photo saved','success'); }
    catch(e){ document.getElementById('bp-hint').textContent='Save failed.'; btn.disabled=false; }
  },'image/jpeg',0.9);
}
/* ── Impact play: implements × body areas ── */
function renderImpactPanel(){
  const isDom=state.currentRole==='dom'; const map=state.impactMap||{};
  return `<div style="font-size:.78rem;color:var(--stone);margin-bottom:1rem">Tap an implement to map the body areas it's used on.</div><div style="display:flex;flex-direction:column;gap:.75rem">${IMPACT_IMPLEMENTS.map(imp=>{
    const areas=ensureArray(map[imp]);
    return `<section class="card" style="padding:1rem 1.15rem"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-weight:600;font-size:.95rem"><i class="fa-solid fa-gavel" style="color:var(--red);margin-right:.5rem"></i>${imp}</div>${isDom?`<button onclick="editImpactAreas('${escapeText(imp)}')" class="pill tap" style="font-size:.62rem;padding:.28rem .7rem;color:var(--gold)">Map</button>`:''}</div>${areas.length?`<div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.6rem">${areas.map(a=>`<span class="pill" style="font-size:.68rem;padding:.22rem .6rem;color:var(--rose)">${escapeText(a)}</span>`).join('')}</div>`:`<div style="font-size:.7rem;opacity:.4;margin-top:.4rem">No areas mapped.</div>`}</section>`;
  }).join('')}</div>`;
}
function editImpactAreas(imp){
  if(state.currentRole!=='dom')return;
  const sel=new Set(ensureArray((state.impactMap||{})[imp]));
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[220] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:32rem;max-height:90vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.2rem;font-weight:600;margin-bottom:.3rem">${escapeText(imp)}</div><div style="font-size:.72rem;color:var(--stone);margin-bottom:1rem">Tap the areas this is used on.</div><div id="impact-areas" style="display:flex;flex-wrap:wrap;gap:.4rem">${IMPACT_AREAS.map(a=>`<button type="button" data-area="${escapeText(a)}" onclick="this.classList.toggle('tag-on')" class="pill tap${sel.has(a)?' tag-on':''}" style="font-size:.72rem;padding:.35rem .8rem">${escapeText(a)}</button>`).join('')}</div><button onclick="saveImpactAreas('${escapeText(imp)}',this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Save</button></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function saveImpactAreas(imp,button){
  const areas=[...document.querySelectorAll('#impact-areas .tag-on')].map(b=>b.dataset.area);
  state.impactMap=state.impactMap||{}; state.impactMap[imp]=areas; saveState(); button.closest('.fixed').remove(); renderProtocols();
}
function renderProtocolRules(){
  return`<div style="display:flex;flex-direction:column;gap:1rem">${RULE_SECTIONS.map(([key,label,icon])=>`<section class="card" style="padding:1.25rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><div style="display:flex;align-items:center;gap:.75rem"><span class="icon-tile"><i class="fa-solid ${icon}"></i></span><div style="font-weight:600">${label}</div></div>${state.currentRole==='dom'?`<button onclick="editSection('${key}')" style="font-size:.7rem;padding:.3rem .75rem;background:rgba(255,255,255,.1);border-radius:.75rem">Edit</button>`:''}</div><div style="display:flex;flex-direction:column;gap:.5rem">${String(state.rules[key]||'').split('\n').map(x=>x.replace(/^\s*(?:[•\-]|\d+[.)])\s*/,'')).filter(Boolean).map((line,i)=>`<div style="display:flex;gap:.75rem;font-size:.85rem"><span class="rule-number">${i+1}</span><span>${escapeText(line)}</span></div>`).join('')||'<div style="font-size:.75rem;opacity:.4">Nothing Set.</div>'}</div></section>`).join('')}</div>`;
}
function renderBoundaryPanel(){
  const isDom=state.currentRole==='dom';
  return`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><div><div style="font-size:1.4rem;font-weight:600">Boundaries</div><div style="font-size:.75rem;color:var(--stone)">Loves first · hard limits last.</div></div>${isDom?`<button onclick="showAddLimitModal()" class="tap" style="padding:.5rem 1rem;background:var(--red);border-radius:.85rem;font-size:.8rem">+ Add</button>`:''}</div><div style="display:flex;flex-direction:column;gap:1rem">${LIMIT_GROUPS.map(([key,label,icon])=>{
    const isHard=key==='hard';
    if(isHard&&state.hideHardLimits){
      return`<section class="card" style="padding:1rem 1.25rem;display:flex;justify-content:space-between;align-items:center;opacity:.7"><div style="display:flex;align-items:center;gap:.75rem"><span class="icon-tile"><i class="fa-solid fa-eye-slash"></i></span><div><div style="font-weight:600">Hard Limits</div><div style="font-size:.7rem;color:var(--stone)">Hidden</div></div></div><button onclick="toggleHardLimits()" class="pill tap" style="font-size:.7rem;padding:.35rem .85rem">Show</button></section>`;
    }
    const accent=isHard?'border-left:3px solid var(--red);':key==='loves'?'border-left:3px solid var(--rose);':'';
    return`<section class="card" style="padding:1.25rem;${accent}"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem"><div style="display:flex;align-items:center;gap:.75rem"><span class="icon-tile"${isHard?' style="color:var(--red)"':key==='loves'?' style="color:var(--rose)"':''}><i class="fa-solid ${icon}"></i></span><div style="font-weight:600">${label}</div></div>${isHard?`<button onclick="toggleHardLimits()" class="tap" style="font-size:.65rem;color:var(--stone)"><i class="fa-solid fa-eye-slash" style="margin-right:.25rem"></i>Hide</button>`:''}</div><div style="display:flex;flex-wrap:wrap;gap:.5rem">${ensureArray(state.limits[key]).map((item,idx)=>`<span class="pill" style="padding:.4rem .9rem;font-size:.85rem;display:inline-flex;align-items:center;gap:.4rem">${escapeText(typeof item==='string'?item:item.text)}${isDom?`<span onclick="removeLimit('${key}',${idx})" style="cursor:pointer;color:var(--stone)">×</span>`:''}</span>`).join('')||'<div style="font-size:.75rem;opacity:.4">Nothing Listed.</div>'}</div></section>`;
  }).join('')}</div>`;
}
function toggleHardLimits(){ state.hideHardLimits=!state.hideHardLimits; saveState(); renderProtocols(); }
function removeLimit(key,idx){ if(state.currentRole!=='dom')return; ensureArray(state.limits[key]).splice(idx,1); saveState(); renderProtocols(); }
/* Anatomically-shaped silhouette (front + back share the same body form) */
function bodySilhouette(view){
  const back = view==='back';
  /* Masculine male figure — broad shoulders, V-taper torso, muscular legs */
  const body = `M100 14
    c-12 0 -21 9 -21 21 c0 7 3 13 8 17
    c-2 4 -3 8 -8 9 l-2 8
    c-14 4 -28 9 -38 16 c-7 5 -11 12 -12 21 l-2 16 c-1 6 8 8 9 1 l3 -16 c1 -6 5 -11 11 -14
    c-2 9 -3 19 -1 28 l2 14 -3 18 c-2 12 -1 25 2 37 l5 22
    c2 14 1 29 -2 43 l-4 26 c-1 9 13 10 15 2 l7 -28 c3 -12 4 -25 4 -37
    c0 -8 1 -16 3 -24 l2 0 c2 8 3 16 3 24 c0 12 1 25 4 37 l7 28 c2 8 16 7 15 -2 l-4 -26
    c-3 -14 -4 -29 -2 -43 l5 -22 c3 -12 4 -25 2 -37 l-3 -18 2 -14 c2 -9 1 -19 -1 -28
    c6 3 10 8 11 14 l3 16 c1 7 10 5 9 -1 l-2 -16 c-1 -9 -5 -16 -12 -21 c-10 -7 -24 -12 -38 -16
    l-2 -8 c-5 -1 -6 -5 -8 -9 c5 -4 8 -10 8 -17 c0 -12 -9 -21 -21 -21 z`;
  const detail = back
    ? `<path class="bm-line" d="M100 96 L100 188" /><path class="bm-line" d="M74 120 q26 14 52 0" /><path class="bm-line" d="M78 150 q22 10 44 0" />`
    : `<path class="bm-line" d="M76 88 q24 12 48 0" /><circle class="bm-line" cx="86" cy="98" r="2.6"/><circle class="bm-line" cx="114" cy="98" r="2.6"/><path class="bm-line" d="M100 104 L100 170" /><path class="bm-line" d="M84 132 q16 6 32 0" /><path class="bm-line" d="M84 150 q16 6 32 0" />`;
  return `<svg viewBox="0 0 200 320" preserveAspectRatio="xMidYMid meet"><path class="bm-body" d="${body}"/>${detail}</svg>`;
}
function bodyFigure(kind,view){
  const zones=ensureArray(state.bodyMaps[kind]).filter(z=>z.view===view);
  const dom=state.currentRole==='dom';
  return`<div class="human-outline${dom?' bm-editable':''}" data-kind="${kind}" data-view="${view}"${dom?` onclick="handleBodyClick(event,'${kind}','${view}')"`:''}>${bodySilhouette(view)}${zones.map((z,i)=>`<span class="body-zone pulse-dot ${kind==='ticklish'?'zone-ticklish':'zone-sensitive'}" style="left:${z.x}%;top:${z.y}%"${dom?` onclick="event.stopPropagation();removeBodyZone('${kind}','${view}',${i})" title="Remove zone"`:''}></span>`).join('')}</div>`;
}
function renderBodyMapsPanel(){
  const dom=state.currentRole==='dom';
  const hint=dom?'<div style="font-size:.72rem;color:var(--gold);margin-top:.2rem">Tap the body to add a zone · tap a dot to remove it.</div>':'<div style="font-size:.75rem;color:var(--stone);margin-top:.2rem">Saved for easy reference.</div>';
  const lock=dom?'':'<span class="pill" style="font-size:.65rem;padding:.35rem .75rem;flex-shrink:0">View only</span>';
  return`<div style="display:flex;flex-direction:column;gap:1rem">
    <section class="card" style="padding:1.25rem">
      <div style="display:flex;justify-content:space-between"><div><div style="font-size:1.2rem;font-weight:600"><i class="fa-solid fa-feather" style="color:var(--sage);margin-right:.4rem"></i>Ticklish Areas</div>${hint}</div>${lock}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.25rem;text-align:center"><div><div style="font-size:.7rem;color:var(--sage);margin-bottom:.5rem;letter-spacing:2px">FRONT</div>${bodyFigure('ticklish','front')}</div><div><div style="font-size:.7rem;color:var(--sage);margin-bottom:.5rem;letter-spacing:2px">BACK</div>${bodyFigure('ticklish','back')}</div></div>
    </section>
    <section class="card" style="padding:1.25rem">
      <div style="display:flex;justify-content:space-between"><div><div style="font-size:1.2rem;font-weight:600"><i class="fa-solid fa-hand-sparkles" style="color:var(--rose);margin-right:.4rem"></i>Sensitive Areas</div>${hint}</div>${lock}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.25rem;text-align:center"><div><div style="font-size:.7rem;color:var(--rose);margin-bottom:.5rem;letter-spacing:2px">FRONT</div>${bodyFigure('sensitive','front')}</div><div><div style="font-size:.7rem;color:var(--rose);margin-bottom:.5rem;letter-spacing:2px">BACK</div>${bodyFigure('sensitive','back')}</div></div>
    </section>
  </div>`;
}
function handleBodyClick(ev,kind,view){
  if(state.currentRole!=='dom')return;
  const box=ev.currentTarget.getBoundingClientRect();
  const x=Math.round(((ev.clientX-box.left)/box.width)*100);
  const y=Math.round(((ev.clientY-box.top)/box.height)*100);
  if(x<0||x>100||y<0||y>100)return;
  ensureArray(state.bodyMaps[kind]).push({view,x,y});
  saveState(); renderProtocols();
  showToast('Zone added','success');
}
function removeBodyZone(kind,view,indexInView){
  const all=ensureArray(state.bodyMaps[kind]);
  let seen=-1;
  for(let i=0;i<all.length;i++){ if(all[i].view===view){ seen++; if(seen===indexInView){ all.splice(i,1); break; } } }
  saveState(); renderProtocols();
}
function measurementRows(){ const m=state.subProfile.measurements; return [['Height',m.height],['Weight',m.weight],['Neck',m.neck],['Chest',m.chest],['Bicep L',m.bicepL],['Bicep R',m.bicepR],['Waist',m.waist],['Hips',m.hips],['Inside Leg',m.insideLeg]]; }
function anatomyRows(){ const a=state.subProfile.anatomy; return [['Soft Length',a.softLength],['Hard Length',a.hardLength],['Soft Girth',a.softGirth],['Hard Girth',a.hardGirth],['Testicular Circumference',a.testicularCircumference]]; }
function recordRedacted(key){ return ensureArray(state.redactedRecords).includes(key); }
function toggleRedact(key){ if(state.currentRole!=='dom')return; const a=ensureArray(state.redactedRecords); const i=a.indexOf(key); if(i>=0)a.splice(i,1); else a.push(key); state.redactedRecords=a; saveState(); renderProtocols(); }
function _redactBtn(key){ if(state.currentRole!=='dom')return ''; const on=recordRedacted(key); return `<button onclick="event.stopPropagation();toggleRedact('${key}')" class="pill tap" style="font-size:.62rem;padding:.28rem .7rem;${on?'color:var(--rose);border-color:rgba(217,124,138,.5)':'color:var(--stone)'}"><i class="fa-solid ${on?'fa-eye-slash':'fa-eye'}" style="margin-right:.25rem"></i>${on?'Hidden':'Visible'}</button>`; }
function _redactWrap(key,bodyHtml){
  if(state.currentRole==='dom'||!recordRedacted(key)) return bodyHtml;
  return `<div class="redact-shimmer" style="border-radius:1rem;min-height:5rem;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.35);font-size:.8rem"><i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Hidden by James</div>`;
}
function renderPersonalRecordsPanel(){
  const isDom=state.currentRole==='dom';
  const br=state.personalRecords.breath;
  const breathKeys={longestHold:'Longest Hold',rebreathe3L:'3 L Rebreathe',rebreathe5L:'5 L Rebreathe',rebreathe6L:'6 L Rebreathe',bubbleBottleLarge:'Bubble Bottle Large',bubbleBottleSmall:'Bubble Bottle Small',resistanceMaximum:'Resistance Maximum'};
  const measureBody=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">${measurementRows().map(([k,v])=>`<div class="subtle-card" style="padding:.75rem"><div style="font-size:.6rem;color:var(--stone);text-transform:uppercase;letter-spacing:1px">${k}</div><div style="font-size:.9rem;font-weight:600;margin-top:.25rem">${escapeText(v||'—')}</div></div>`).join('')}</div>`;
  const anatomyBody=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">${anatomyRows().map(([k,v])=>`<div class="subtle-card" style="padding:.75rem"><div style="font-size:.6rem;color:var(--stone);text-transform:uppercase;letter-spacing:1px">${k}</div><div style="font-size:.9rem;font-weight:600;margin-top:.25rem">${escapeText(v||'—')}</div></div>`).join('')}</div><div style="font-size:.75rem;color:var(--stone);margin-top:.85rem">For reference and record keeping only.</div>`;
  const breathBody=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">${Object.entries(breathKeys).map(([k,label])=>`<div class="subtle-card" style="padding:.75rem"><div style="font-size:.6rem;color:var(--stone);text-transform:uppercase;letter-spacing:1px">${label}</div><div style="font-size:.9rem;font-weight:600;margin-top:.25rem">${escapeText(br[k]||'—')}</div></div>`).join('')}</div>`;
  const electroBody=`<div style="display:flex;flex-direction:column;gap:.85rem">${Object.entries(state.personalRecords.electro).map(([label,row])=>rangeRow(label,row)).join('')}</div><div style="font-size:.75rem;color:var(--stone);margin-top:.85rem">Values use a 1 to 100 reference scale.</div>`;
  const sec=(key,title,extra,body)=>`<section class="card" style="padding:1.25rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;gap:.5rem"><div style="font-size:1.2rem;font-weight:600">${title}</div><div style="display:flex;gap:.4rem;align-items:center">${extra}${_redactBtn(key)}</div></div>${_redactWrap(key,body)}</section>`;
  return`<div style="display:flex;flex-direction:column;gap:1rem">
    <section class="card" style="padding:1.25rem"><div style="display:flex;gap:1rem"><img src="${escapeText(state.subProfile.photo||DEFAULT_PHOTO)}" style="width:7rem;height:8.5rem;object-fit:cover;border-radius:1.5rem;filter:grayscale(1)" alt="Sub profile"><div style="flex:1"><div class="heading-serif" style="font-size:1.75rem">${escapeText(state.subProfile.name||state.subTitle)}</div><div style="font-size:.8rem;color:var(--sage)">Submissive</div><div style="font-size:.8rem;color:var(--gold);margin-top:.5rem">Dominant: ${escapeText(state.subProfile.dominant||state.domTitle)}</div><span class="pill" style="display:inline-flex;align-items:center;gap:.35rem;font-size:.7rem;padding:.35rem .75rem;margin-top:.75rem"><i class="fa-solid fa-lock"></i>James edits</span></div></div></section>
    ${sec('measurements','Measurements','<span class="pill" style="font-size:.65rem;padding:.3rem .7rem;color:var(--blue)">Reference</span>',measureBody)}
    ${sec('anatomy','Personal Records','<span class="pill" style="font-size:.65rem;padding:.3rem .7rem;color:var(--blue)">Record keeping</span>',anatomyBody)}
    ${sec('breath','Breath Control',isDom?`<button onclick="showEditBreathModal()" class="pill tap" style="font-size:.68rem;padding:.3rem .8rem">Edit</button>`:'',breathBody)}
    ${sec('electro','Electro Response',isDom?`<button onclick="showEditElectroModal()" class="pill tap" style="font-size:.68rem;padding:.3rem .8rem">Edit</button>`:'',electroBody)}
  </div>`;
}
function rangeRow(label,row){
  const min=Number(row.min)||0,max=Number(row.max)||0,start=Number(row.pleasureStart)||min,end=Number(row.pleasureEnd)||max;
  if(!min&&!max) return`<div style="display:flex;justify-content:space-between;font-size:.78rem;padding:.2rem 0"><span>${escapeText(label)}</span><span style="color:var(--muted)">Not set</span></div>`;
  return`<div><div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:.3rem"><span>${escapeText(label)}</span><span style="color:var(--stone)">${min}–${max}</span></div><div class="range-track"><div class="range-fill" style="margin-left:${Math.max(0,min)}%;width:${Math.max(5,max-min)}%"></div></div><div style="font-size:.65rem;color:var(--sage);margin-top:.25rem">Pleasure zone: ${start}–${end}</div></div>`;
}
function showEditBreathModal(){
  if(state.currentRole!=='dom')return;
  const br=state.personalRecords.breath;
  const labels={longestHold:'Longest Hold',rebreathe3L:'3 L Rebreathe',rebreathe5L:'5 L Rebreathe',rebreathe6L:'6 L Rebreathe',bubbleBottleLarge:'Bubble Bottle Large',bubbleBottleSmall:'Bubble Bottle Small',resistanceMaximum:'Resistance Maximum'};
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[220] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:32rem;max-height:94vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1.25rem">Edit Breath Records</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem">${Object.entries(labels).map(([k,label])=>`<label style="font-size:.62rem;color:rgba(198,166,66,.7);text-transform:uppercase">${label}<input data-breath="${k}" class="beautiful-input" style="width:100%;padding:.7rem .85rem;border-radius:.85rem;margin-top:.2rem;display:block" value="${escapeText(br[k]||'')}"></label>`).join('')}</div><button onclick="saveBreath(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Save</button></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function saveBreath(button){ document.querySelectorAll('[data-breath]').forEach(el=>state.personalRecords.breath[el.dataset.breath]=el.value.trim()); saveState(); button.closest('.fixed').remove(); renderProtocols(); showToast('Saved','success'); }
function showEditElectroModal(){
  if(state.currentRole!=='dom')return;
  const e=state.personalRecords.electro;
  const sliderRow=(label,row)=>{
    const v={min:Number(row.min)||0,max:Number(row.max)||0,pleasureStart:Number(row.pleasureStart)||0,pleasureEnd:Number(row.pleasureEnd)||0};
    if(!(v.min||v.max)){ v.min=10;v.max=70;v.pleasureStart=25;v.pleasureEnd=50; }
    const sl=(k,col,val)=>`<input type="range" min="0" max="100" step="1" value="${val}" data-ek="${k}" oninput="clampElectro(this)" class="ci-slider electro-slider" style="--ecol:${col}">`;
    return `<div data-erow="${escapeText(label)}" class="subtle-card" style="padding:.85rem 1rem">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.5rem"><span style="font-weight:600;font-size:.85rem">${escapeText(label)}</span><span class="e-readout" style="font-size:.68rem;color:var(--stone);font-variant-numeric:tabular-nums">${v.min}–${v.max} · ♥ ${v.pleasureStart}–${v.pleasureEnd}</span></div>
      <div style="font-size:.55rem;color:var(--blue);text-transform:uppercase">Min</div>${sl('min','var(--blue)',v.min)}
      <div style="font-size:.55rem;color:var(--rose);text-transform:uppercase;margin-top:.3rem">Pleasure start</div>${sl('pleasureStart','var(--rose)',v.pleasureStart)}
      <div style="font-size:.55rem;color:var(--rose);text-transform:uppercase;margin-top:.3rem">Pleasure end</div>${sl('pleasureEnd','var(--gold)',v.pleasureEnd)}
      <div style="font-size:.55rem;color:var(--gold);text-transform:uppercase;margin-top:.3rem">Max</div>${sl('max','var(--gold)',v.max)}
    </div>`;
  };
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[220] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;max-height:94vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:.4rem">Edit Electro Response</div><div style="font-size:.72rem;color:var(--stone);margin-bottom:1rem">Sliders, 0–100. They can't cross: Min ≤ Pleasure start ≤ Pleasure end ≤ Max.</div><div style="display:flex;flex-direction:column;gap:.85rem">${Object.entries(e).map(([label,row])=>sliderRow(label,row)).join('')}</div><button onclick="saveElectro(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Save</button></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
/* enforce Min ≤ P-start ≤ P-end ≤ Max so sliders never cross */
function clampElectro(input){
  const rowEl=input.closest('[data-erow]'); if(!rowEl)return;
  const get=k=>rowEl.querySelector(`[data-ek="${k}"]`);
  let min=+get('min').value, ps=+get('pleasureStart').value, pe=+get('pleasureEnd').value, max=+get('max').value;
  const k=input.dataset.ek;
  if(k==='min'){ if(min>ps)get('pleasureStart').value=ps=min; if(ps>pe)get('pleasureEnd').value=pe=ps; if(pe>max)get('max').value=max=pe; }
  else if(k==='pleasureStart'){ if(ps<min)get('min').value=min=ps; if(ps>pe)get('pleasureEnd').value=pe=ps; if(pe>max)get('max').value=max=pe; }
  else if(k==='pleasureEnd'){ if(pe>max)get('max').value=max=pe; if(pe<ps)get('pleasureStart').value=ps=pe; if(ps<min)get('min').value=min=ps; }
  else if(k==='max'){ if(max<pe)get('pleasureEnd').value=pe=max; if(pe<ps)get('pleasureStart').value=ps=pe; if(ps<min)get('min').value=min=ps; }
  const ro=rowEl.querySelector('.e-readout'); if(ro)ro.textContent=`${min}–${max} · ♥ ${ps}–${pe}`;
}
function saveElectro(button){
  document.querySelectorAll('[data-erow]').forEach(rowEl=>{ const label=rowEl.dataset.erow; const row={}; rowEl.querySelectorAll('[data-ek]').forEach(inp=>{ row[inp.dataset.ek]=Number(inp.value)||0; }); state.personalRecords.electro[label]=row; });
  saveState(); button.closest('.fixed').remove(); renderProtocols(); showToast('Saved','success');
}
function renderPunishments(){
  const activeEl=document.getElementById('punishments-active'),histEl=document.getElementById('punishments-history'); if(!activeEl)return;
  const items=activePunishments();
  activeEl.innerHTML=items.map(p=>{ const time=getTimeLeft(p); return`<button onclick="showConsequenceDetail('${p.id}')" class="card tap" style="width:100%;text-align:left;padding:1.25rem;border-left:4px solid var(--red)"><div style="display:flex;gap:1rem"><div class="ring" style="width:6rem;height:6rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;--p:${time.pct};--c:var(--red)"><span class="countdown" data-countdown="${p.id}" style="font-size:.7rem;text-align:center;padding:0 .5rem;position:relative;z-index:1">${time.text}</span></div><div style="flex:1"><div style="font-weight:600;font-size:1.05rem">${escapeText(p.title)}</div><div style="font-size:.8rem;margin-top:.35rem;color:var(--stone)">${escapeText(p.reason||p.desc||'Tap to see why.')}</div><div style="font-size:.68rem;color:rgba(198,166,66,.7);margin-top:.6rem"><i class="fa-solid fa-circle-info" style="margin-right:.3rem"></i>${escapeText(p.source||(p.kind==='task'?'Linked task':'Set by James'))}</div></div></div></button>`; }).join('')||`<div style="font-size:.85rem;color:rgba(198,166,66,.5)">No Active Consequences.</div>`;
  if(histEl) histEl.innerHTML=state.punishments.filter(p=>p.status==='completed').map(p=>`<button onclick="showConsequenceDetail('${p.id}')" class="glass tap" style="width:100%;text-align:left;padding:.75rem 1rem;border-radius:1rem;display:flex;justify-content:space-between;align-items:center"><span>${escapeText(p.title)}</span><span style="color:#34d399;flex-shrink:0">Complete</span></button>`).join('')||`<div style="opacity:.5">No history yet.</div>`;
  updateCountdowns();
}
function showConsequenceDetail(id){
  const p=ensureArray(state.punishments).find(x=>String(x.id)===String(id)); if(!p)return;
  const time=getTimeLeft(p); const active=p.status==='active';
  const linked=p.linkedTaskId?state.tasks.find(t=>String(t.id)===String(p.linkedTaskId)):null;
  const isDom=state.currentRole==='dom';
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:28rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))">
    <div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-size:.65rem;letter-spacing:3px;color:var(--red)">CONSEQUENCE</div><div style="font-size:1.4rem;font-weight:600;margin-top:.2rem">${escapeText(p.title)}</div></div><button onclick="this.closest('.fixed').remove()" style="font-size:1.5rem;color:var(--stone)">×</button></div>
    ${active?`<div class="ring" style="width:5rem;height:5rem;margin:1rem 0;display:flex;align-items:center;justify-content:center;--p:${time.pct};--c:var(--red)"><span class="countdown" data-countdown="${p.id}" style="font-size:.7rem;position:relative;z-index:1">${time.text}</span></div>`:`<div style="margin:.75rem 0;color:#34d399;font-size:.85rem"><i class="fa-solid fa-circle-check" style="margin-right:.3rem"></i>Completed</div>`}
    <div style="margin-top:.5rem"><div style="font-size:.62rem;letter-spacing:2px;color:var(--gold)">WHY</div><div style="font-size:.9rem;margin-top:.25rem">${escapeText(p.reason||p.desc||'No reason recorded.')}</div></div>
    <div style="margin-top:1rem"><div style="font-size:.62rem;letter-spacing:2px;color:var(--gold)">WHERE IT CAME FROM</div><div style="font-size:.9rem;margin-top:.25rem">${escapeText(p.source||(linked?('Linked to the task “'+titleCase(linked.title)+'”'):'Set directly by James'))}</div></div>
    ${linked?`<button onclick="this.closest('.fixed').remove();showTaskDetailById(${linked.id})" class="tap" style="width:100%;margin-top:1.1rem;padding:.7rem;background:rgba(255,255,255,.06);border-radius:1rem;font-size:.82rem">Open the linked task</button>`:''}
    ${isDom?`<button onclick="completeConsequence('${p.id}',this)" class="tap" style="width:100%;margin-top:.5rem;padding:.7rem;background:var(--sage-2);border-radius:1rem;color:#fff;font-size:.82rem">Mark completed / lift</button>`:''}
  </div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function completeConsequence(id,button){ const p=ensureArray(state.punishments).find(x=>String(x.id)===String(id)); if(p){ p.status='completed'; p.completedAt=new Date().toISOString(); saveState(); } button.closest('.fixed').remove(); renderProtocols(); }

/* ── Rewards — animated stars, redeemable catalog, badge progress ── */
function badgeProgress(id){
  const completed=state.tasks.filter(t=>t.status==='completed').length;
  const journals=state.journal.length;
  const consDone=state.punishments.filter(p=>p.status==='completed').length;
  switch(id){
    case 'first-contact': return {cur:Math.min(1,completed+journals?1:0),goal:1};
    case 'steady-service': return {cur:Math.min(completed,5),goal:5};
    case 'inner-world': return {cur:Math.min(journals,3),goal:3};
    case 'accountable': return {cur:Math.min(consDone,1),goal:1};
    case 'gold-standard': return {cur:Math.min(state.stars||0,25),goal:25};
    default: return {cur:0,goal:1};
  }
}
function animateStars(toValue){
  const el=document.getElementById('star-count'); if(!el)return;
  const from=parseInt(el.dataset.val||'0',10), to=toValue;
  const start=performance.now(), dur=700;
  function step(now){ const p=Math.min(1,(now-start)/dur); const eased=1-Math.pow(1-p,3); el.textContent=Math.round(from+(to-from)*eased); if(p<1) requestAnimationFrame(step); else { el.dataset.val=to; el.classList.remove('star-pop'); void el.offsetWidth; el.classList.add('star-pop'); } }
  requestAnimationFrame(step);
}
function badgeCardHtml(b){
  const earned=ensureArray(state.badges).some(x=>x.id===b.id); const pr=badgeProgress(b.id); const pct=Math.round(pr.cur/pr.goal*100);
  return`<button onclick="showBadge('${b.id}')" class="card tap badge-card${earned?' badge-earned':''}" style="padding:1.1rem;text-align:center;${earned?'':'opacity:.92'}">
    <div class="badge-medallion${earned?' shine':''}"><i class="fa-solid ${b.icon}"></i></div>
    <div style="font-weight:600;margin-top:.6rem;font-size:.85rem">${escapeText(b.name)}</div>
    ${earned?`<div style="font-size:.6rem;margin-top:.3rem;letter-spacing:2px;color:#34d399">EARNED</div>`
      :`<div class="badge-bar" style="margin-top:.5rem"><span style="width:${pct}%"></span></div><div style="font-size:.6rem;margin-top:.25rem;color:var(--stone)">${pr.cur}/${pr.goal}</div>`}
  </button>`;
}
function _serviceLadderHtml(stars){
  const totalEarned=ensureArray(state.starLog).filter(s=>s.amount>0).reduce((a,s)=>a+s.amount,0);
  const current=SERVICE_LADDER.slice().reverse().find(r=>totalEarned>=r.stars)||SERVICE_LADDER[0];
  const next=SERVICE_LADDER.find(r=>r.stars>totalEarned);
  const pct=next?Math.min(100,Math.round((totalEarned-current.stars)/(next.stars-current.stars)*100)):100;
  return `<div class="card" style="padding:1.25rem;margin-bottom:1.75rem">
    <div style="font-size:.6rem;letter-spacing:3px;color:rgba(198,166,66,.6);margin-bottom:.85rem">SERVICE LADDER</div>
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
      <div style="width:3rem;height:3rem;border-radius:1.1rem;background:${current.col}22;border:2px solid ${current.col}55;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fa-solid ${current.icon}" style="color:${current.col};font-size:1.3rem"></i>
      </div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:1.1rem">${escapeText(current.title)}</div>
        <div style="font-size:.75rem;color:var(--stone)">${escapeText(current.desc)}</div>
      </div>
      <div style="text-align:right;flex-shrink:0"><div style="font-size:1.4rem;font-weight:800;color:var(--gold)">${totalEarned}</div><div style="font-size:.6rem;color:var(--stone)">TOTAL ★</div></div>
    </div>
    ${next?`<div style="margin-bottom:.5rem"><div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--stone);margin-bottom:.35rem"><span>→ ${escapeText(next.title)}</span><span>${totalEarned} / ${next.stars} ★</span></div><div style="height:.45rem;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden"><div style="height:100%;border-radius:999px;background:linear-gradient(90deg,${current.col},${next.col});width:${pct}%;transition:width .6s ease"></div></div></div>`:
    `<div style="text-align:center;font-size:.8rem;color:var(--gold);padding:.25rem 0"><i class="fa-solid fa-crown" style="margin-right:.4rem"></i>Maximum level achieved.</div>`}
    <div style="display:flex;gap:.4rem;overflow-x:auto;padding-top:.85rem;margin-top:.25rem;border-top:1px solid rgba(255,255,255,.07)">${SERVICE_LADDER.map(r=>{const done=totalEarned>=r.stars; return `<div title="${escapeText(r.title)}: ${r.stars}★" style="flex-shrink:0;width:2.2rem;height:2.2rem;border-radius:.75rem;background:${done?r.col+'33':'rgba(255,255,255,.04)'};border:1.5px solid ${done?r.col+'77':'rgba(255,255,255,.08)'};display:flex;align-items:center;justify-content:center"><i class="fa-solid ${r.icon}" style="font-size:.9rem;color:${done?r.col:'rgba(255,255,255,.18)'}"></i></div>`; }).join('')}</div>
  </div>`;
}
function renderRewards(){
  const tab=document.getElementById('tab-stars'); if(!tab)return;
  const isDom=state.currentRole==='dom';
  const stars=state.stars||0;
  const spending=state.appSettings&&state.appSettings.starSpending!==false;
  const catalog=ensureArray(state.rewardsCatalog);
  const customs=ensureArray(state.customBadges);
  tab.innerHTML=`
    <div class="reward-hero" style="text-align:center;margin-bottom:1.75rem;position:relative;overflow:hidden;border-radius:2rem;padding:2rem 1rem 1.75rem">
      <div class="star-orb"><i class="fa-solid fa-star"></i></div>
      <div style="font-size:.7rem;letter-spacing:3px;color:rgba(198,166,66,.8);margin-top:1rem">STAR BALANCE</div>
      <div id="star-count" data-val="${stars}" class="star-big" style="font-size:4.5rem;font-weight:800;color:var(--gold);font-variant-numeric:tabular-nums;line-height:1">${stars}</div>
      ${isDom
        ? `<button onclick="showEditStarsModal()" class="pill tap" style="font-size:.7rem;padding:.35rem 1rem;margin-top:.4rem;color:var(--gold)"><i class="fa-solid fa-pen" style="margin-right:.3rem"></i>Adjust stars</button>`
        : `<div style="font-size:.8rem;color:var(--stone)">${spending?'Collect stars · redeem them below':'Collect stars'}</div>`}
    </div>

    ${spending?`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.85rem">
      <span style="font-weight:600;font-size:1.15rem"><i class="fa-solid fa-gift" style="color:var(--rose);margin-right:.4rem"></i>Reward Shop</span>
      ${isDom?`<button onclick="showAddRewardModal()" class="pill tap" style="font-size:.7rem;padding:.35rem .9rem;color:var(--gold)">+ Add</button>`:''}
    </div>
    <div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.75rem">
      ${catalog.map(r=>{ const affordable=stars>=r.cost; return `
        <div class="card reward-card${affordable?' affordable':''}" style="padding:1rem 1.15rem;display:flex;align-items:center;gap:1rem">
          <div class="reward-icon"><i class="fa-solid ${r.icon||'fa-gift'}"></i></div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600">${escapeText(r.name)}</div>
            <div style="font-size:.75rem;color:var(--stone);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeText(r.desc||'')}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:.9rem;color:var(--gold);font-weight:700">${r.cost}★</div>
            ${isDom
              ? `<button onclick="removeReward('${r.id}')" class="tap" style="font-size:.65rem;color:var(--stone);margin-top:.25rem">remove</button>`
              : `<button onclick="redeemReward('${r.id}',this)" ${affordable?'':'disabled'} class="tap" style="margin-top:.3rem;font-size:.7rem;padding:.3rem .8rem;border-radius:.8rem;${affordable?'background:var(--sage-2);color:#fff':'background:rgba(255,255,255,.06);color:var(--stone)'}">${affordable?'Redeem':'Locked'}</button>`}
          </div>
        </div>`; }).join('')||`<div style="font-size:.85rem;opacity:.6;padding:.5rem">No rewards yet.</div>`}
    </div>`:`<div class="card" style="padding:1rem 1.15rem;margin-bottom:1.75rem;display:flex;align-items:center;gap:.75rem;color:var(--stone);font-size:.85rem"><i class="fa-solid fa-lock"></i>Star spending is turned off.${isDom?' Toggle it in Settings.':''}</div>`}

    ${_serviceLadderHtml(stars)}

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.85rem">
      <span style="font-weight:600;font-size:1.15rem"><i class="fa-solid fa-medal" style="color:var(--gold);margin-right:.4rem"></i>Badges</span>
      ${isDom?`<button onclick="showAddBadgeModal()" class="pill tap" style="font-size:.7rem;padding:.35rem .9rem;color:var(--gold)">+ Add</button>`:''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.25rem">
      ${SYSTEM_BADGES.map(badgeCardHtml).join('')}
    </div>
    <div style="font-size:.62rem;letter-spacing:3px;color:rgba(198,166,66,.6);margin:.5rem 0 .75rem">ASPIRATION</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:${customs.length?'1.25rem':'1.75rem'}">
      ${ASPIRATION_BADGES.map(badgeCardHtml).join('')}
    </div>
    ${customs.length?`<div style="font-size:.62rem;letter-spacing:3px;color:rgba(198,166,66,.6);margin:.5rem 0 .75rem">CUSTOM</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.75rem">${customs.map(badgeCardHtml).join('')}</div>`:''}

    <div class="card" style="padding:1.25rem"><div style="font-weight:600;font-size:1.05rem;margin-bottom:1rem">Recent Activity</div><div style="display:flex;flex-direction:column;gap:.5rem">${ensureArray(state.starLog).slice(0,25).map(s=>`<div style="display:flex;justify-content:space-between;padding:.7rem 1rem;background:rgba(255,255,255,.05);border-radius:1rem;font-size:.85rem"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeText(s.reason)}</span><span style="color:${s.amount<0?'var(--rose)':'var(--gold)'};flex-shrink:0;margin-left:.5rem">${s.amount>0?'+':''}${s.amount} ★</span></div>`).join('')||`<div style="font-size:.85rem;opacity:.6">No Stars Earned Yet.</div>`}</div></div>`;
  const starEl=document.getElementById('star-count'); if(starEl){ starEl.dataset.val='0'; animateStars(stars); }
}
function redeemReward(id,btn){
  const r=ensureArray(state.rewardsCatalog).find(x=>x.id===id); if(!r)return;
  if((state.stars||0)<r.cost) return showToast('Not enough stars yet','error');
  if(!confirm(`Redeem “${r.name}” for ${r.cost} stars?`))return;
  state.stars-=r.cost;
  state.starLog.unshift({id:Date.now(),date:new Date().toISOString().slice(0,10),reason:'Redeemed: '+r.name,amount:-r.cost});
  addNotification('reward','Reward redeemed',r.name+' — '+r.cost+' stars','stars');
  saveState(); showConfetti(50); renderRewards(); updateHeader();
  showToast('Redeemed '+r.name,'success');
}
function showAddRewardModal(){
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:28rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1.25rem">Add Reward</div><input id="rw-name" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-bottom:.75rem" placeholder="Reward name"><input id="rw-desc" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-bottom:.75rem" placeholder="Short description"><input id="rw-cost" type="number" min="1" value="15" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" placeholder="Star cost"><button onclick="addReward(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Add Reward</button></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function addReward(button){
  const name=document.getElementById('rw-name').value.trim(); if(!name)return alert('Name required.');
  const cost=Math.max(1,parseInt(document.getElementById('rw-cost').value||'10',10));
  state.rewardsCatalog.push({id:'r'+Date.now(),name,desc:document.getElementById('rw-desc').value.trim(),cost,icon:'fa-gift'});
  saveState(); button.closest('.fixed').remove(); renderRewards();
}
function removeReward(id){ state.rewardsCatalog=ensureArray(state.rewardsCatalog).filter(r=>r.id!==id); saveState(); renderRewards(); }
function showBadge(id){
  const b=allBadges().find(x=>x.id===id); if(!b)return;
  const isDom=state.currentRole==='dom', earned=ensureArray(state.badges).some(x=>x.id===id), pr=badgeProgress(id), pct=Math.round(pr.cur/pr.goal*100);
  const isCustom=ensureArray(state.customBadges).some(x=>x.id===id);
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-6" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="max-width:22rem;width:100%;border-radius:2rem;padding:2rem 1.75rem;text-align:center"><div class="badge-medallion big ${earned?'shine':''}" style="margin:0 auto"><i class="fa-solid ${b.icon}"></i></div><div style="font-size:1.4rem;font-weight:600;margin-top:1.25rem">${escapeText(b.name)}</div><div style="font-size:.85rem;margin-top:.6rem;opacity:.8">${escapeText(b.goal)}</div>
  ${earned
    ? `<div style="margin-top:1.5rem;font-size:.85rem;color:#34d399"><i class="fa-solid fa-circle-check" style="margin-right:.3rem"></i>Awarded by James</div>${isDom?`<button onclick="revokeBadge('${id}',this)" style="width:100%;margin-top:1rem;padding:.7rem;background:rgba(255,255,255,.06);border-radius:1rem;color:var(--stone);font-size:.8rem">Revoke award</button>`:''}`
    : `<div class="badge-bar" style="margin:1.5rem 0 .4rem"><span style="width:${pct}%"></span></div><div style="font-size:.7rem;color:var(--stone)">${pr.cur} of ${pr.goal}</div>${isDom?`<button onclick="authoriseBadge('${id}',this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Authorise Award</button>`:''}`}
  ${isDom&&isCustom?`<button onclick="deleteCustomBadge('${id}')" style="width:100%;margin-top:.5rem;padding:.6rem;color:var(--red);font-size:.75rem">Delete badge</button>`:''}
  </div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function authoriseBadge(id,button){ state.badges=ensureArray(state.badges); if(!state.badges.some(x=>x.id===id)) state.badges.push({id,authorisedAt:new Date().toISOString()}); saveState(); button.closest('.fixed').remove(); renderRewards(); showConfetti(50); }
function revokeBadge(id,button){ state.badges=ensureArray(state.badges).filter(x=>x.id!==id); saveState(); button.closest('.fixed').remove(); renderRewards(); }
function deleteCustomBadge(id){ state.customBadges=ensureArray(state.customBadges).filter(b=>b.id!==id); state.badges=ensureArray(state.badges).filter(x=>x.id!==id); saveState(); document.querySelectorAll('.fixed').forEach(x=>x.remove()); renderRewards(); }
function showEditStarsModal(){
  if(state.currentRole!=='dom')return;
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:24rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:.4rem">Adjust Stars</div><div style="font-size:.75rem;color:var(--stone);margin-bottom:1rem">Set the balance directly, or add / subtract.</div><label style="font-size:.65rem;color:rgba(198,166,66,.7);text-transform:uppercase">New balance<input id="star-set" type="number" value="${state.stars||0}" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-top:.25rem;display:block"></label><input id="star-reason" class="beautiful-input" style="width:100%;padding:.75rem 1rem;border-radius:1rem;margin-top:.75rem;font-size:.85rem" placeholder="Reason (optional)"><div style="display:flex;gap:.5rem;margin-top:.85rem">${[-5,-1,1,5].map(n=>`<button onclick="document.getElementById('star-set').value=(parseInt(document.getElementById('star-set').value||'0',10)+(${n}))" class="pill tap" style="flex:1;padding:.5rem;font-size:.8rem">${n>0?'+':''}${n}</button>`).join('')}</div><button onclick="saveStarEdit(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Save</button></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function saveStarEdit(button){
  const next=Math.max(0,parseInt(document.getElementById('star-set').value||'0',10));
  const reason=document.getElementById('star-reason').value.trim()||'Manual adjustment by James';
  const delta=next-(state.stars||0);
  state.stars=next;
  if(delta!==0) state.starLog.unshift({id:Date.now(),date:new Date().toISOString().slice(0,10),reason,amount:delta});
  saveState(); button.closest('.fixed').remove(); renderRewards(); updateHeader(); showToast('Stars updated','success');
}
function showAddBadgeModal(){
  if(state.currentRole!=='dom')return;
  const icons=['fa-crown','fa-trophy','fa-medal','fa-award','fa-star','fa-heart','fa-fire','fa-gem','fa-bolt','fa-shield','fa-dove','fa-paw'];
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:28rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1.25rem">New Badge</div><input id="bd-name" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-bottom:.75rem" placeholder="Badge name"><input id="bd-goal" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-bottom:1rem" placeholder="What it's awarded for"><div style="font-size:.65rem;color:rgba(198,166,66,.7);margin-bottom:.5rem">ICON</div><div id="bd-icons" style="display:flex;flex-wrap:wrap;gap:.4rem">${icons.map((ic,i)=>`<button type="button" onclick="document.querySelectorAll('#bd-icons button').forEach(x=>x.classList.remove('tag-on'));this.classList.add('tag-on')" data-icon="${ic}" class="pill tap${i===0?' tag-on':''}" style="width:2.6rem;height:2.6rem"><i class="fa-solid ${ic}"></i></button>`).join('')}</div><button onclick="addCustomBadge(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Add Badge</button></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function addCustomBadge(button){
  const name=document.getElementById('bd-name').value.trim(); if(!name)return alert('Name required.');
  const goal=document.getElementById('bd-goal').value.trim()||'Awarded by James.';
  const icon=(document.querySelector('#bd-icons .tag-on')||{}).dataset?.icon||'fa-star';
  state.customBadges=ensureArray(state.customBadges); state.customBadges.push({id:'cb-'+Date.now(),name,goal,icon});
  saveState(); button.closest('.fixed').remove(); renderRewards();
}

/* ── Journal — search by word/tag, Dom-only tags, sub view list only ── */
var journalSearch='';
var journalTagFilter='';
function journalMatches(e){
  const q=journalSearch.trim().toLowerCase();
  if(journalTagFilter && !ensureArray(e.tags).includes(journalTagFilter)) return false;
  if(!q) return true;
  const hay=(titleCase(e.title)+' '+(e.body||'')+' '+ensureArray(e.tags).join(' ')).toLowerCase();
  return hay.includes(q);
}
function renderJournal(){
  const tab=document.getElementById('tab-journal'); if(!tab)return;
  const isDom=state.currentRole==='dom';
  const allTags=[...new Set([...ensureArray(state.journalTags),...state.journal.flatMap(e=>ensureArray(e.tags))])];
  const list=state.journal.filter(journalMatches);
  tab.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
      <div><div class="heading-serif" style="font-size:2.5rem">Journal</div><div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">${state.journal.length} entries</div></div>
      <button onclick="showNewJournalModal()" class="tap" style="padding:.55rem 1.1rem;background:var(--red);border-radius:1rem;font-size:.8rem;color:#fff;flex-shrink:0"><i class="fa-solid fa-pen" style="margin-right:.3rem"></i>New</button>
    </div>
    <div style="position:relative;margin-bottom:.85rem">
      <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:1rem;top:50%;transform:translateY(-50%);color:var(--stone);font-size:.85rem"></i>
      <input id="journal-search" oninput="journalSearch=this.value;refreshJournalList()" value="${escapeText(journalSearch)}" placeholder="Search words or tags…" class="beautiful-input" style="width:100%;padding:.8rem 1rem .8rem 2.5rem;border-radius:1rem">
    </div>
    ${allTags.length?`<div style="display:flex;gap:.4rem;overflow-x:auto;padding-bottom:.5rem;margin-bottom:.85rem">
      <button onclick="journalTagFilter='';renderJournal()" class="pill tap" style="padding:.35rem .9rem;font-size:.7rem;white-space:nowrap;${journalTagFilter===''?'background:var(--red-2);border-color:var(--red);color:#fff':''}">All</button>
      ${allTags.map(t=>`<button onclick="journalTagFilter='${escapeText(t)}';renderJournal()" class="pill tap" style="padding:.35rem .9rem;font-size:.7rem;white-space:nowrap;${journalTagFilter===t?'background:var(--red-2);border-color:var(--red);color:#fff':''}">#${escapeText(t)}</button>`).join('')}
    </div>`:''}
    <div id="journal-entries" style="display:flex;flex-direction:column;gap:1rem">${journalCards(list,isDom)}</div>`;
}
function journalCards(list,isDom){
  if(!list.length) return `<div style="text-align:center;padding:2rem;color:rgba(198,166,66,.5)">${state.journal.length?'No entries match your search.':'No Journal Entries Yet.'}</div>`;
  return list.map(e=>{
    const tags=ensureArray(e.tags);
    const hasComment=!!(e.domComment&&e.domComment.text);
    const tagHtml=tags.length?`<div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.6rem">${tags.map(t=>`<span class="pill" style="font-size:.62rem;padding:.2rem .6rem;color:var(--gold)">#${escapeText(t)}</span>`).join('')}</div>`:'';
    /* entries James has commented on get a distinct icon */
    const icon=hasComment
      ? `<i class="fa-solid fa-comment-dots" style="color:var(--rose);flex-shrink:0" title="James responded"></i>`
      : `<i class="fa-solid fa-feather" style="color:var(--gold);flex-shrink:0"></i>`;
    const stanceColor=e.domComment&&e.domComment.stance==='agree'?'var(--sage)':e.domComment&&e.domComment.stance==='disagree'?'var(--red)':'var(--gold)';
    const stanceLabel=e.domComment?(e.domComment.stance==='agree'?'Agrees':e.domComment.stance==='disagree'?'Sees it differently':'Noted'):'';
    const commentHtml=hasComment?`<div style="margin-top:.75rem;padding:.7rem .85rem;border-radius:.85rem;background:rgba(217,124,138,.1);border-left:3px solid ${stanceColor}"><div style="font-size:.6rem;letter-spacing:1px;color:${stanceColor};text-transform:uppercase;margin-bottom:.2rem">James · ${stanceLabel}</div><div style="font-size:.8rem;color:var(--ivory)">${escapeText(e.domComment.text)}</div></div>`:'';
    const inner=`<div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-weight:600;font-size:1.05rem">${escapeText(titleCase(e.title))}</div><div style="font-size:.7rem;color:rgba(198,166,66,.7);margin-top:.25rem">${formatUKDate(e.date)}</div></div>${icon}</div><div style="font-size:.85rem;margin-top:.75rem;opacity:.75;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escapeText(e.body||'')}</div>${tagHtml}${commentHtml}`;
    // Dom can re-open to read/respond; sub sees preview + James's response only
    return isDom
      ? `<button onclick="openJournalEntry(${e.id})" class="card tap" style="text-align:left;padding:1.25rem;display:block;width:100%">${inner}</button>`
      : `<div class="card" style="padding:1.25rem;position:relative">${inner}</div>`;
  }).join('');
}
function refreshJournalList(){
  const box=document.getElementById('journal-entries'); if(!box)return;
  box.innerHTML=journalCards(state.journal.filter(journalMatches),state.currentRole==='dom');
}
function showNewJournalModal(){
  const isDom=state.currentRole==='dom';
  const tags=ensureArray(state.journalTags);
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[100] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:28rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1.25rem">New Journal Entry</div><input id="journal-title" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-bottom:.75rem" placeholder="Title"><textarea id="journal-body" rows="6" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none" placeholder="Write your entry..."></textarea>
  ${isDom?`<div style="font-size:.65rem;color:var(--gold);letter-spacing:2px;margin:1rem 0 .5rem">TAGS (James only)</div><div id="jtag-picker" style="display:flex;flex-wrap:wrap;gap:.4rem">${tags.map(t=>`<button type="button" onclick="this.classList.toggle('tag-on')" data-tag="${escapeText(t)}" class="pill tap" style="padding:.3rem .8rem;font-size:.7rem">#${escapeText(t)}</button>`).join('')}</div><input id="jtag-new" class="beautiful-input" style="width:100%;padding:.6rem 1rem;border-radius:1rem;margin-top:.6rem;font-size:.8rem" placeholder="+ new tag, then Save">`:`<div style="font-size:.7rem;color:var(--stone);margin-top:.75rem">Tags are added by James.</div>`}
  <button onclick="addJournalEntry(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Save Entry</button></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function addJournalEntry(button){
  const title=titleCase(document.getElementById('journal-title').value||'Journal Entry');
  const body=document.getElementById('journal-body').value.trim();
  if(!body)return alert('Please write something before saving.');
  let tags=[];
  if(state.currentRole==='dom'){
    tags=[...document.querySelectorAll('#jtag-picker .tag-on')].map(b=>b.dataset.tag);
    const nv=(document.getElementById('jtag-new')?.value||'').trim().toLowerCase().replace(/^#/,'');
    if(nv){ tags.push(nv); if(!state.journalTags.includes(nv)) state.journalTags.push(nv); }
  }
  state.journal.unshift({id:Date.now(),title,body,date:new Date().toISOString(),attachments:[],tags});
  addNotification('review','Jacob submitted a journal entry',title,'journal','dom'); saveState(); button.closest('.fixed').remove(); renderJournal(); renderDashboard();
}
function openJournalEntry(id){
  if(state.currentRole!=='dom') return; /* sub cannot re-open */
  const e=state.journal.find(x=>String(x.id)===String(id)); if(!e)return;
  const tags=ensureArray(e.tags);
  const allTags=[...new Set([...ensureArray(state.journalTags),...state.journal.flatMap(x=>ensureArray(x.tags))])];
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 z-[200] flex items-end md:items-center justify-center" style="background:rgba(0,0,0,.95)" onclick="this.remove()"><article onclick="event.stopImmediatePropagation()" style="background:#151515;width:100%;max-width:44rem;max-height:94vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.75rem;padding-bottom:max(1.75rem,env(safe-area-inset-bottom))"><button onclick="this.closest('[onclick]').remove()" style="float:right;font-size:1.5rem;color:var(--stone)">×</button><div style="font-size:.7rem;letter-spacing:3px;color:var(--gold)">${formatUKDate(e.date)} · ${formatUKTime(e.date)}</div><h1 class="heading-serif" style="font-size:2.5rem;margin:.75rem 0 1rem">${escapeText(titleCase(e.title))}</h1>
  <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1.25rem">${tags.map(t=>`<span class="pill" style="font-size:.7rem;padding:.3rem .8rem;color:var(--gold)">#${escapeText(t)} <span onclick="removeJournalTag(${e.id},'${escapeText(t)}')" style="cursor:pointer;margin-left:.2rem;color:var(--stone)">×</span></span>`).join('')}
  <button onclick="promptAddJournalTag(${e.id})" class="pill tap" style="font-size:.7rem;padding:.3rem .8rem;color:var(--sage)"><i class="fa-solid fa-plus" style="margin-right:.2rem"></i>tag</button></div>
  <div style="font-size:1rem;white-space:pre-wrap;line-height:1.8">${escapeText(e.body)}</div>
  <div style="margin-top:1.75rem;border-top:1px solid rgba(255,255,255,.1);padding-top:1.25rem">
    <div style="font-size:.65rem;letter-spacing:2px;color:var(--rose);margin-bottom:.6rem">JAMES'S RESPONSE</div>
    <div style="display:flex;gap:.4rem;margin-bottom:.6rem">
      ${[['agree','Agree','fa-thumbs-up','var(--sage)'],['neutral','Note','fa-circle-dot','var(--gold)'],['disagree','Disagree','fa-thumbs-down','var(--red)']].map(([s,lab,ic,col])=>`<button type="button" onclick="this.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('stance-on'));this.classList.add('stance-on')" data-stance="${s}" class="stance-btn pill tap${(e.domComment&&e.domComment.stance===s)||(!e.domComment&&s==='neutral')?' stance-on':''}" style="flex:1;padding:.45rem;font-size:.72rem;--sc:${col}"><i class="fa-solid ${ic}" style="margin-right:.3rem"></i>${lab}</button>`).join('')}
    </div>
    <textarea id="dom-comment" rows="3" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none" placeholder="Give your take — agree, disagree, guidance…">${escapeText(e.domComment&&e.domComment.text||'')}</textarea>
    <button onclick="saveDomComment(${e.id},this)" style="width:100%;margin-top:.85rem;padding:.8rem;background:var(--red);border-radius:1rem;color:#fff">${e.domComment?'Update Response':'Send Response'}</button>
    ${e.domComment?`<button onclick="removeDomComment(${e.id})" style="width:100%;margin-top:.5rem;padding:.6rem;background:rgba(255,255,255,.06);border-radius:1rem;color:var(--stone);font-size:.8rem">Remove Response</button>`:''}
  </div></article></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function saveDomComment(id,button){
  if(state.currentRole!=='dom')return;
  const e=state.journal.find(x=>String(x.id)===String(id)); if(!e)return;
  const text=document.getElementById('dom-comment').value.trim();
  if(!text)return alert('Write a response first.');
  const stanceBtn=button.closest('article').querySelector('.stance-btn.stance-on');
  const stance=stanceBtn?stanceBtn.dataset.stance:'neutral';
  e.domComment={text,stance,at:new Date().toISOString()};
  addNotification('review','James responded to your journal',titleCase(e.title),'journal');
  saveState(); button.closest('.fixed').remove(); renderJournal(); showToast('Response sent','success');
}
function removeDomComment(id){ const e=state.journal.find(x=>String(x.id)===String(id)); if(e){ delete e.domComment; saveState(); } document.querySelectorAll('.fixed').forEach(x=>x.remove()); renderJournal(); }
function promptAddJournalTag(id){
  const t=(prompt('Add a tag for this entry:')||'').trim().toLowerCase().replace(/^#/,''); if(!t)return;
  const e=state.journal.find(x=>String(x.id)===String(id)); if(!e)return;
  e.tags=ensureArray(e.tags); if(!e.tags.includes(t)) e.tags.push(t);
  if(!state.journalTags.includes(t)) state.journalTags.push(t);
  saveState(); document.querySelectorAll('.fixed').forEach(x=>x.remove()); openJournalEntry(id); renderJournal();
}
function removeJournalTag(id,tag){
  const e=state.journal.find(x=>String(x.id)===String(id)); if(!e)return;
  e.tags=ensureArray(e.tags).filter(t=>t!==tag); saveState();
  document.querySelectorAll('.fixed').forEach(x=>x.remove()); openJournalEntry(id); renderJournal();
}

/* ── Dynamic Check-In: Jacob rates each dimension 1–5 (3 = just right),
   can add new kinks with their own 1–5 slider. James reviews the feedback. ── */
function lastCheckInLabel(){
  const last=ensureArray(state.checkIns)[0];
  if(!last) return '';
  return ' · last '+formatUKDate(last.date);
}
function scaleWord(v){ v=Number(v); return v<=1?'Much less':v===2?'A little less':v===3?'Just right':v===4?'A little more':'Much more'; }
function showCheckInModal(){
  const isDom=state.currentRole==='dom';
  const last=ensureArray(state.checkIns)[0];
  const vals=(last&&last.scores)||{};
  const kinks=(last&&last.kinks)||[];
  const dimHtml=CHECKIN_DIMENSIONS.map(([key,label,hint])=>{
    const v=vals[key]||3;
    return `<div data-dim="${key}" style="margin-bottom:1.1rem">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:600;font-size:.9rem">${label}</span><span class="ci-out" style="font-size:.72rem;color:var(--gold)">${scaleWord(v)}</span></div>
      <div style="font-size:.7rem;color:var(--stone);margin-bottom:.4rem">${hint}</div>
      <input type="range" min="1" max="5" step="1" value="${v}" ${isDom?'disabled':''} class="ci-slider" oninput="this.closest('[data-dim]').querySelector('.ci-out').textContent=['','Much less','A little less','Just right','A little more','Much more'][this.value]">
      <div style="display:flex;justify-content:space-between;font-size:.55rem;color:var(--muted);margin-top:.1rem"><span>Less</span><span>Just right</span><span>More</span></div>
    </div>`;
  }).join('');
  const m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[210] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;max-height:94vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))">
    <div style="display:flex;justify-content:space-between;margin-bottom:.4rem"><div style="font-size:1.4rem;font-weight:600">Dynamic Check-In</div><button onclick="this.closest('.fixed').remove()" style="font-size:1.5rem;color:var(--stone)">×</button></div>
    <div style="font-size:.78rem;color:var(--stone);margin-bottom:1.25rem">${isDom?'How Jacob wants the dynamic tuned. Read only for you.':'Slide each one to where you want it. 3 is just right.'}</div>
    <div id="checkin-dims">${dimHtml}</div>
    <div style="border-top:1px solid rgba(255,255,255,.1);padding-top:1rem;margin-top:.5rem">
      <div style="font-weight:600;font-size:.9rem;margin-bottom:.25rem">Kinks & Interests</div>
      <div style="font-size:.7rem;color:var(--stone);margin-bottom:.75rem">${isDom?'How keen Jacob is on each (1–5).':'Rate how into each you are. Add new ones below.'}</div>
      <div id="checkin-kinks" style="display:flex;flex-direction:column;gap:.85rem">${kinks.map(k=>kinkRow(k.name,k.value,isDom)).join('')||(isDom?'<div style="font-size:.78rem;color:var(--muted)">None added yet.</div>':'')}</div>
      ${isDom?'':`<div style="display:flex;gap:.5rem;margin-top:.85rem"><input id="ci-newkink" class="beautiful-input" style="flex:1;padding:.7rem 1rem;border-radius:1rem;font-size:.85rem" placeholder="Add a new kink…"><button onclick="addKinkRow()" class="tap" style="padding:.7rem 1.1rem;background:var(--sage-2);border-radius:1rem;color:#fff;font-size:.85rem">Add</button></div>`}
    </div>
    ${isDom?'':`<button onclick="saveCheckIn(this)" style="width:100%;margin-top:1.5rem;padding:.9rem;background:var(--red);border-radius:1rem;color:#fff;font-weight:600">Send Check-In to James</button>`}
  </div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function kinkRow(name,value,disabled){
  value=value||3;
  return `<div data-kink="${escapeText(name)}">
    <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:.85rem">${escapeText(name)}</span><span class="kk-out" style="font-size:.72rem;color:var(--rose)">${value}/5</span></div>
    <input type="range" min="1" max="5" step="1" value="${value}" ${disabled?'disabled':''} class="ci-slider rose" oninput="this.closest('[data-kink]').querySelector('.kk-out').textContent=this.value+'/5'">
  </div>`;
}
function addKinkRow(){
  const inp=document.getElementById('ci-newkink'); const name=(inp.value||'').trim(); if(!name)return;
  const box=document.getElementById('checkin-kinks');
  const placeholder=box.querySelector('div[style*="muted"]'); if(placeholder) placeholder.remove();
  box.insertAdjacentHTML('beforeend',kinkRow(name,3,false));
  inp.value='';
}
function saveCheckIn(button){
  const scores={};
  document.querySelectorAll('#checkin-dims [data-dim]').forEach(el=>{ scores[el.dataset.dim]=Number(el.querySelector('input').value); });
  const kinks=[...document.querySelectorAll('#checkin-kinks [data-kink]')].map(el=>({name:el.dataset.kink,value:Number(el.querySelector('input').value)}));
  state.checkIns=ensureArray(state.checkIns);
  state.checkIns.unshift({id:Date.now(),date:new Date().toISOString(),by:state.currentRole,scores,kinks});
  if(state.checkIns.length>30) state.checkIns.length=30;
  if(state.activeCheckIn) state.activeCheckIn.done=true;
  addNotification('review','New check-in from Jacob','Jacob shared how he wants the dynamic tuned.','dashboard');
  saveState(); button.closest('.fixed').remove(); renderDashboard(); showToast('Check-in sent','success');
}

/* ── Notifications ── */
function _isRead(id,baseRead){ return baseRead||ensureArray(state.readNotifIds).includes(id); }
/* Audience routing — James and Jacob have COMPLETELY separate bells.
   James (dom) sees what Jacob does; Jacob (sub) sees what James sends/decides. */
function _inferAudience(title){
  const t=(title||'').toLowerCase();
  if(t.startsWith('jacob')||/new check-in from jacob|screenshot attempt|voice (verification|match)|reward redeemed/.test(t)) return 'dom';
  if(t.startsWith('james')||/task assigned|task due|lock released|requires you to change/.test(t)) return 'sub';
  return 'both';
}
function _forRole(n,role){ const a=n.audience||'both'; return a==='both'||a===role; }
function derivedNotifications(){
  const role=state.currentRole, r=ensureArray(state.readNotifIds);
  const manual=ensureArray(state.notifications).filter(n=>_forRole(n,role)).map(n=>({...n,manual:true,read:_isRead(n.id,n.read)}));
  /* Derived reminders are Jacob-facing only (his tasks/consequences/rewards) */
  let derived=[];
  if(role==='sub'){
    const tasks=state.tasks.filter(t=>t.status==='pending').slice(0,3).map(t=>({id:'task-'+t.id,type:'task',title:'Task due soon',body:titleCase(t.title),time:getTimeLeft(t).text,tab:'tasks',read:r.includes('task-'+t.id),colourBorder:'border-l-[var(--blue)]'}));
    const cons=activePunishments().slice(0,2).map(p=>({id:'consequence-'+p.id,type:'consequence',title:'Consequence active',body:titleCase(p.title),time:getTimeLeft(p).text,tab:'protocols',panel:'consequences',read:r.includes('consequence-'+p.id),colourBorder:'border-l-[var(--red)]'}));
    derived=[...tasks,...cons];
  } else {
    /* James: tasks awaiting his review */
    const review=state.tasks.filter(t=>t.status==='completed'&&!t.reviewed).slice(0,4).map(t=>({id:'review-'+t.id,type:'review',title:'Awaiting your review',body:titleCase(t.title),time:formatUKDate(t.completedDate),tab:'tasks',read:r.includes('review-'+t.id),colourBorder:'border-l-[var(--sage)]'}));
    derived=[...review];
  }
  return [...manual,...derived];
}
function unreadNotifications(){ return derivedNotifications().filter(n=>!n.read); }
function addNotification(type,title,body,tab,audience){ state.notifications=ensureArray(state.notifications); const colourBorder=type==='reward'?'border-l-[var(--gold)]':type==='consequence'?'border-l-[var(--red)]':type==='review'?'border-l-[var(--sage)]':'border-l-[var(--blue)]'; state.notifications.unshift({id:'n-'+Date.now(),type,title,body,tab:tab||'dashboard',audience:audience||_inferAudience(title),read:false,createdAt:new Date().toISOString(),colourBorder}); if(state.notifications.length>40)state.notifications.length=40; }
function renderNotifications(){
  const tab=document.getElementById('tab-notifications'); if(!tab)return;
  const items=derivedNotifications().filter(n=>activeNotificationsFilter==='all'||n.type===activeNotificationsFilter);
  const filters=[['all','All'],['task','Tasks'],['review','Reviews'],['consequence','Consequences'],['reward','Rewards']];
  tab.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem"><div><div class="heading-serif" style="font-size:2.5rem">Notifications</div><div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">Everything important lands here.</div></div><button onclick="markAllNotificationsRead()" class="pill tap" style="font-size:.72rem;padding:.4rem .85rem;flex-shrink:0">Mark read</button></div><div style="display:flex;gap:.5rem;overflow-x:auto;padding-bottom:.5rem;margin-bottom:1rem">${filters.map(([id,label])=>`<button onclick="setNotificationFilter('${id}')" class="pill tap" style="padding:.4rem 1rem;font-size:.72rem;white-space:nowrap;${activeNotificationsFilter===id?'background:var(--red-2);border-color:var(--red);color:#fff':''}">${label}</button>`).join('')}</div><div style="display:flex;flex-direction:column;gap:.75rem">${items.map(n=>`<div class="card tap" style="text-align:left;padding:1rem;display:flex;gap:.6rem;align-items:flex-start;width:100%;border-left:3px solid ${n.type==='reward'?'var(--gold)':n.type==='consequence'?'var(--red)':n.type==='review'?'var(--sage)':'var(--blue)'};${n.read?'opacity:.55':''}"><div onclick="openNotification('${n.id}')" style="flex:1;min-width:0;cursor:pointer"><div style="display:flex;align-items:center;gap:.5rem"><div style="font-weight:600">${escapeText(n.title)}</div>${!n.read?`<span style="width:.55rem;height:.55rem;border-radius:999px;background:var(--blue);display:inline-block;flex-shrink:0"></span>`:''}</div><div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">${escapeText(n.body)}</div><div style="font-size:.7rem;color:rgba(198,166,66,.7);margin-top:.5rem">${escapeText(n.time||formatUKTime(n.createdAt)||'Now')}</div></div><button onclick="clearNotification('${n.id}',event)" class="tap" title="Clear" style="flex-shrink:0;width:1.8rem;height:1.8rem;border-radius:.7rem;background:rgba(255,255,255,.06);color:var(--stone);font-size:.9rem">×</button></div>`).join('')||`<div style="text-align:center;padding:2rem;color:rgba(198,166,66,.5)">No Notifications.</div>`}</div>`;
}
function setNotificationFilter(f){ activeNotificationsFilter=f; renderNotifications(); }
function openNotification(id){ const n=derivedNotifications().find(x=>x.id===id); if(!n)return; state.readNotifIds=[...new Set([...ensureArray(state.readNotifIds),id])]; const stored=state.notifications.find(x=>x.id===id); if(stored)stored.read=true; if(n.panel)activeProtocolPanel=n.panel; saveState(); updateHeader(); navigateToTab(n.tab||'dashboard'); }
function markAllNotificationsRead(){
  const ids=derivedNotifications().map(n=>n.id);
  state.readNotifIds=[...new Set([...ensureArray(state.readNotifIds),...ids])];
  state.notifications=ensureArray(state.notifications).map(n=>({...n,read:true}));
  saveState(); renderNotifications(); updateHeader();
  showToast('All notifications cleared','success');
}
function clearNotification(id,ev){ if(ev)ev.stopPropagation(); state.readNotifIds=[...new Set([...ensureArray(state.readNotifIds),id])]; saveState(); renderNotifications(); updateHeader(); }

/* ── Jacob's Profile modal ── */
function showProfileModal(){
  const isDom=state.currentRole==='dom', m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;max-height:92vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="display:flex;justify-content:space-between;margin-bottom:1.25rem"><div><div style="font-size:.65rem;letter-spacing:3px;color:var(--gold)">SUB PROFILE</div><div class="heading-serif" style="font-size:2.25rem;margin-top:.2rem">${escapeText(state.subProfile.name||state.subTitle)}</div><div style="font-size:.8rem;color:var(--stone);margin-top:.2rem">Visible to Jacob. Edited by James only.</div></div><button onclick="this.closest('.fixed').remove()" style="font-size:1.5rem;color:var(--stone)">×</button></div><div class="card" style="padding:1.25rem"><div style="display:flex;gap:1rem"><img src="${escapeText(state.subProfile.photo||DEFAULT_PHOTO)}" style="width:7rem;height:8.5rem;object-fit:cover;border-radius:1.5rem;filter:grayscale(1)" alt="Sub profile"><div><div class="heading-serif" style="font-size:1.5rem">${escapeText(state.subProfile.name||state.subTitle)}</div><div style="font-size:.8rem;color:var(--sage)">${escapeText(state.subProfile.role||'Submissive')}</div><div style="font-size:.8rem;color:var(--gold);margin-top:.4rem">Dominant: ${escapeText(state.subProfile.dominant||state.domTitle)}</div><span class="pill" style="display:inline-flex;align-items:center;gap:.3rem;font-size:.7rem;padding:.3rem .7rem;margin-top:.6rem"><i class="fa-solid fa-lock"></i>${isDom?'James can edit':'Read only'}</span></div></div></div><div class="card" style="padding:1.25rem;margin-top:.85rem"><div style="font-weight:600;margin-bottom:.85rem">Measurements</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">${measurementRows().map(([k,v])=>`<div class="subtle-card" style="padding:.65rem"><div style="font-size:.6rem;color:var(--stone);text-transform:uppercase">${k}</div><div style="font-size:.85rem;font-weight:600;margin-top:.2rem">${escapeText(v||'—')}</div></div>`).join('')}</div></div><div style="display:flex;gap:.75rem;margin-top:1.25rem">${isDom?`<button onclick="showEditSubProfileModal()" style="flex:1;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Edit Profile</button>`:''}<button onclick="this.closest('.fixed').remove(); activeProtocolPanel='records'; navigateToTab('protocols')" style="flex:1;padding:.85rem;background:rgba(255,255,255,.08);border-radius:1rem">Open Records</button></div></div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function showEditSubProfileModal(){
  const p=state.subProfile, m=p.measurements, a=p.anatomy, modal=document.createElement('div');
  modal.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[220] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:38rem;max-height:94vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="display:flex;justify-content:space-between;margin-bottom:1.25rem"><div style="font-size:1.25rem;font-weight:600">Edit Jacob's Profile</div><button onclick="this.closest('.fixed').remove()" style="font-size:1.5rem;color:var(--stone)">×</button></div><div style="display:flex;flex-direction:column;gap:.75rem"><input id="sub-name" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" value="${escapeText(p.name||'')}" placeholder="Name"><input id="sub-photo" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" value="${escapeText(p.photo||'')}" placeholder="Photo URL"><div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem">${Object.entries(m).map(([key,val])=>`<label style="font-size:.65rem;color:rgba(198,166,66,.7);text-transform:uppercase;letter-spacing:1px">${key.replace(/[A-Z]/g,' $&')}<input data-measure="${key}" class="beautiful-input" style="width:100%;padding:.7rem .85rem;border-radius:.85rem;margin-top:.2rem;display:block" value="${escapeText(val||'')}"></label>`).join('')}</div><div style="font-size:.65rem;color:var(--gold);letter-spacing:3px;margin-top:.5rem">PERSONAL RECORDS</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem">${Object.entries(a).map(([key,val])=>`<label style="font-size:.65rem;color:rgba(198,166,66,.7);text-transform:uppercase;letter-spacing:1px">${key.replace(/[A-Z]/g,' $&')}<input data-anatomy="${key}" class="beautiful-input" style="width:100%;padding:.7rem .85rem;border-radius:.85rem;margin-top:.2rem;display:block" value="${escapeText(val||'')}"></label>`).join('')}</div></div><button onclick="saveSubProfileEditor(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Save Profile</button></div></div>`;
  document.getElementById('modal-container').appendChild(modal);
}
function saveSubProfileEditor(button){ state.subProfile.name=document.getElementById('sub-name').value.trim()||state.subProfile.name; state.subTitle=state.subProfile.name; state.subProfile.photo=document.getElementById('sub-photo').value.trim()||DEFAULT_PHOTO; document.querySelectorAll('[data-measure]').forEach(el=>state.subProfile.measurements[el.dataset.measure]=el.value.trim()); document.querySelectorAll('[data-anatomy]').forEach(el=>state.subProfile.anatomy[el.dataset.anatomy]=el.value.trim()); addNotification('profile','Profile updated','Sub profile records were changed.','protocols'); saveState(); button.closest('.fixed').remove(); document.querySelectorAll('.fixed').forEach(m=>m.remove()); updateHeader(); activeProtocolPanel='records'; navigateToTab('protocols'); }

/* ── Dom (James) profile ── */
function domDetailRows(){ const d=state.domProfile.details; return [['Pronouns',d.pronouns],['Dynamic Since',d.dynamicStart],['Contact',d.contact],['Aftercare Style',d.aftercareStyle],['Expectations',d.expectations],['Hard No',d.hardNo]]; }
function showDomProfileModal(){
  const isDom=state.currentRole==='dom', p=state.domProfile, m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;max-height:92vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))">
    <div style="display:flex;justify-content:space-between;margin-bottom:1.25rem"><div><div style="font-size:.65rem;letter-spacing:3px;color:var(--red)">DOMINANT PROFILE</div><div class="heading-serif" style="font-size:2.25rem;margin-top:.2rem">${escapeText(p.name)}</div><div style="font-size:.8rem;color:var(--stone);margin-top:.2rem">${escapeText(p.notes)}</div></div><button onclick="this.closest('.fixed').remove()" style="font-size:1.5rem;color:var(--stone)">×</button></div>
    <div class="card" style="padding:1.25rem"><div style="display:flex;gap:1rem"><img src="${escapeText(p.photo)}" style="width:7rem;height:8.5rem;object-fit:cover;border-radius:1.5rem" alt="Dom profile"><div><div class="heading-serif" style="font-size:1.5rem">${escapeText(p.name)}</div><div style="font-size:.8rem;color:var(--red)">${escapeText(p.role)} · ${escapeText(p.honorific)}</div><span class="pill" style="display:inline-flex;align-items:center;gap:.3rem;font-size:.7rem;padding:.3rem .7rem;margin-top:.6rem"><i class="fa-solid ${isDom?'fa-pen':'fa-lock'}"></i>${isDom?'You can edit this':'View only'}</span></div></div></div>
    <div class="card" style="padding:1.25rem;margin-top:.85rem"><div style="font-weight:600;margin-bottom:.85rem">Details</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">${domDetailRows().map(([k,v])=>`<div class="subtle-card" style="padding:.7rem"><div style="font-size:.6rem;color:var(--stone);text-transform:uppercase;letter-spacing:1px">${k}</div><div style="font-size:.85rem;font-weight:600;margin-top:.2rem">${escapeText(v||'—')}</div></div>`).join('')}</div></div>
    ${isDom?`<button onclick="showEditDomProfileModal()" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Edit My Profile</button>`:''}
  </div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function showEditDomProfileModal(){
  if(state.currentRole!=='dom')return;
  const p=state.domProfile, d=p.details, m=document.createElement('div');
  m.innerHTML=`<div class="fixed inset-0 bg-black/95 z-[220] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;max-height:94vh;overflow:auto;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))">
    <div style="display:flex;justify-content:space-between;margin-bottom:1.25rem"><div style="font-size:1.25rem;font-weight:600">Edit My Profile</div><button onclick="this.closest('.fixed').remove()" style="font-size:1.5rem;color:var(--stone)">×</button></div>
    <div style="display:flex;flex-direction:column;gap:.75rem">
      <input id="dom-name" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" value="${escapeText(p.name)}" placeholder="Name">
      <input id="dom-honorific" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" value="${escapeText(p.honorific)}" placeholder="Honorific (e.g. Sir)">
      <input id="dom-photo" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" value="${escapeText(p.photo)}" placeholder="Photo URL">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">${Object.entries(d).map(([key,val])=>`<label style="font-size:.62rem;color:rgba(198,166,66,.7);text-transform:uppercase;letter-spacing:1px">${key.replace(/[A-Z]/g,' $&')}<input data-domdetail="${key}" class="beautiful-input" style="width:100%;padding:.7rem .85rem;border-radius:.85rem;margin-top:.2rem;display:block" value="${escapeText(val||'')}"></label>`).join('')}</div>
    </div>
    <button onclick="saveDomProfileEditor(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Save</button>
  </div></div>`;
  document.getElementById('modal-container').appendChild(m);
}
function saveDomProfileEditor(button){
  state.domProfile.name=document.getElementById('dom-name').value.trim()||state.domProfile.name;
  state.domTitle=state.domProfile.name;
  state.domProfile.honorific=document.getElementById('dom-honorific').value.trim()||state.domProfile.honorific;
  state.domProfile.photo=document.getElementById('dom-photo').value.trim()||state.domProfile.photo;
  document.querySelectorAll('[data-domdetail]').forEach(el=>state.domProfile.details[el.dataset.domdetail]=el.value.trim());
  state.subProfile.dominant=state.domProfile.name;
  saveState(); document.querySelectorAll('.fixed').forEach(x=>x.remove()); updateHeader(); renderSettings();
  showToast('Profile saved','success');
}

/* ── Limits & Rules ── */
function showAddLimitModal(){ const m=document.createElement('div'); m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:28rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1.25rem">Add Boundary Or Preference</div><select id="limit-category" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;margin-bottom:.75rem">${LIMIT_GROUPS.map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select><input id="limit-text" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem" placeholder="Describe It"><button onclick="addLimit(this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Add</button></div></div>`; document.getElementById('modal-container').appendChild(m); }
function addLimit(button){ const cat=document.getElementById('limit-category').value, text=titleCase(document.getElementById('limit-text').value||''); if(!text)return alert('Please describe it.'); if(!Array.isArray(state.limits[cat]))state.limits[cat]=[]; state.limits[cat].push(text); saveState(); button.closest('.fixed').remove(); renderProtocols(); }
function editSection(section){ const labels=Object.fromEntries(RULE_SECTIONS.map(([k,l])=>[k,l])); const m=document.createElement('div'); m.innerHTML=`<div class="fixed inset-0 bg-black/90 z-[150] flex items-end md:items-center justify-center" onclick="this.remove()"><div onclick="event.stopImmediatePropagation()" class="glass" style="width:100%;max-width:34rem;border-radius:2rem 2rem 0 0;padding:1.5rem;padding-bottom:max(1.5rem,env(safe-area-inset-bottom))"><div style="font-size:1.25rem;font-weight:600;margin-bottom:1.25rem">Edit ${labels[section]||section}</div><textarea id="section-editor" rows="10" class="beautiful-input" style="width:100%;padding:.85rem 1rem;border-radius:1rem;resize:none"></textarea><button onclick="saveSection('${section}',this)" style="width:100%;margin-top:1.25rem;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Save Changes</button></div></div>`; document.getElementById('modal-container').appendChild(m); document.getElementById('section-editor').value=state.rules[section]||''; }
function saveSection(section,button){ state.rules[section]=document.getElementById('section-editor').value.trim(); saveState(); button.closest('.fixed').remove(); renderProtocols(); }

/* ── Settings ── */
function showSettings(){ if(state.currentRole!=='dom'){ showProfileModal(); return; } navigateToTab('settings'); }
function renderSettings(){
  const tab=document.getElementById('tab-settings'); if(!tab)return;
  const isDom=state.currentRole==='dom';
  if(!isDom){ tab.innerHTML=`<div style="text-align:center;padding:4rem 1rem;color:var(--stone)"><i class="fa-solid fa-lock" style="font-size:2rem;color:var(--red);margin-bottom:1rem"></i><div style="font-weight:600;font-size:1.1rem">Settings are James's</div><div style="font-size:.85rem;margin-top:.5rem">This area is controlled by James.</div></div>`; return; }
  tab.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem"><div><div class="heading-serif" style="font-size:2.5rem">Settings</div><div style="font-size:.8rem;color:var(--stone);margin-top:.25rem">Profiles, data, reset and app controls.</div></div><button onclick="switchRole()" class="pill tap" style="font-size:.72rem;padding:.4rem .85rem">Lock</button></div>
  <section class="card" style="padding:1.25rem;margin-bottom:1.25rem"><div style="font-weight:600;font-size:1.1rem;margin-bottom:.85rem">Profiles</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
    <button onclick="showDomProfileModal()" class="subtle-card tap" style="padding:1rem;text-align:left;display:block;cursor:pointer"><img src="${escapeText(state.domProfile.photo)}" style="width:2.5rem;height:2.5rem;border-radius:.9rem;object-fit:cover"><div style="font-weight:600;margin-top:.5rem;font-size:.9rem">James (Dominant)</div><div style="font-size:.72rem;color:var(--stone)">${isDom?'View &amp; edit':'View only'}</div></button>
    <button onclick="showProfileModal()" class="subtle-card tap" style="padding:1rem;text-align:left;display:block;cursor:pointer"><img src="${escapeText(state.subProfile.photo||DEFAULT_PHOTO)}" style="width:2.5rem;height:2.5rem;border-radius:.9rem;object-fit:cover"><div style="font-weight:600;margin-top:.5rem;font-size:.9rem">Jacob (Submissive)</div><div style="font-size:.72rem;color:var(--stone)">${isDom?'James edits':'View only'}</div></button>
  </div></section>
  <section class="card" style="padding:1.25rem;margin-bottom:1.25rem"><div style="font-weight:600;font-size:1.1rem;margin-bottom:.85rem">App Controls</div>
    <div class="tap" onclick="toggleStarSpending()" style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:rgba(255,255,255,.05);border-radius:1rem;cursor:pointer">
      <div><div style="font-weight:600;font-size:.9rem">Star Spending</div><div style="font-size:.72rem;color:var(--stone)">Let Jacob redeem stars for rewards</div></div>
      <span class="switch${state.appSettings&&state.appSettings.starSpending!==false?' on':''}"><span class="knob"></span></span>
    </div>
  </section>
  <section class="card" style="padding:1.25rem;margin-bottom:1.25rem"><div style="font-weight:600;font-size:1.1rem;margin-bottom:.5rem">Security &amp; Access</div>
    <div style="font-size:.75rem;color:var(--stone);margin-bottom:.85rem">${authConfigured()?'6-digit PINs are set (stored as salted hashes).':'Access is still on bootstrap codes — set real PINs now.'}${state.appLock&&state.appLock.locked?' · <span style="color:var(--red)">App is LOCKED for Jacob</span>':''}</div>
    <div style="display:flex;flex-direction:column;gap:.5rem">
      <button onclick="showPinSetup(false)" class="tap" style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:rgba(255,255,255,.05);border-radius:1rem;text-align:left"><span>${authConfigured()?'Change PINs':'Set up PINs'}</span><i class="fa-solid fa-key" style="color:var(--gold)"></i></button>
      <button onclick="forceJacobPin()" class="tap" style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:rgba(255,255,255,.05);border-radius:1rem;text-align:left"><span>Force Jacob to change PIN</span><i class="fa-solid fa-rotate" style="color:var(--stone)"></i></button>
      ${state.appLock&&state.appLock.locked?`<button onclick="releaseLock()" class="tap" style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:rgba(143,175,151,.18);border-radius:1rem;text-align:left;color:var(--sage)"><span>Release lock</span><i class="fa-solid fa-lock-open"></i></button>`:''}
      <button onclick="resetAccessBootstrap()" class="tap" style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:rgba(143,17,24,.15);border-radius:1rem;text-align:left;color:var(--rose)"><span>Reset access (recovery)</span><i class="fa-solid fa-life-ring"></i></button>
    </div>
    <div class="tap" onclick="toggleVoiceVerify()" style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:rgba(255,255,255,.05);border-radius:1rem;cursor:pointer;margin-top:.5rem">
      <div><div style="font-weight:600;font-size:.9rem">Voice verification</div><div style="font-size:.72rem;color:var(--stone)">Surprise voice check after Jacob's PIN${state.voice&&state.voice.enabled?` · ${ensureArray(state.voice.samples).length}/10 enrolled`:''}${state.voice&&state.voice.lastResult?` · last ${state.voice.lastResult.band} ${state.voice.lastResult.score}%`:''}</div></div>
      <span class="switch${state.voice&&state.voice.enabled?' on':''}"><span class="knob"></span></span>
    </div>
    ${state.voice&&state.voice.enabled?`<div style="font-size:.72rem;color:var(--stone);margin-top:.5rem;padding:.6rem .85rem;background:rgba(49,91,122,.15);border-radius:.85rem"><i class="fa-solid fa-circle-info" style="margin-right:.3rem;color:var(--blue)"></i>Jacob enrols his voice <b>on his own device</b> — he'll be prompted automatically next time he logs in (${ensureArray(state.voice.samples).length}/10 done).${ensureArray(state.voice.samples).length>=10?` <button onclick="resetVoiceEnrolment()" style="color:var(--rose);text-decoration:underline">Reset</button>`:''}</div>`:''}
  </section>
  <section class="card" style="padding:1.25rem;margin-bottom:1.25rem"><div style="font-weight:600;font-size:1.1rem;margin-bottom:.85rem">Data Management</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem"><button onclick="exportSystemBackup()" class="subtle-card tap" style="padding:1rem;text-align:left;display:block;cursor:pointer"><i class="fa-solid fa-download" style="color:var(--gold)"></i><div style="font-weight:600;margin-top:.5rem;font-size:.9rem">Export Backup</div><div style="font-size:.75rem;color:var(--stone)">JSON download</div></button><label class="subtle-card tap" style="padding:1rem;text-align:left;display:block;cursor:pointer"><i class="fa-solid fa-upload" style="color:var(--blue)"></i><div style="font-weight:600;margin-top:.5rem;font-size:.9rem">Restore Backup</div><div style="font-size:.75rem;color:var(--stone)">Import JSON</div><input type="file" accept="application/json" style="display:none" onchange="restoreSystemBackup(this)"></label></div></section><section class="card" style="padding:1.25rem;margin-bottom:1.25rem"><div style="font-weight:600;font-size:1.1rem;margin-bottom:.85rem">Reset From Scratch</div><div style="display:flex;flex-direction:column;gap:.5rem">${[['demo','Reset demo data'],['profile','Reset profile'],['protocols','Reset protocols'],['tasks','Reset tasks'],['rewards','Reset rewards'],['notifications','Reset notifications'],['local','Clear local device cache']].map(([key,label])=>`<button onclick="resetSection('${key}')" class="tap" style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:rgba(255,255,255,.05);border-radius:1rem;text-align:left"><span>${label}</span><i class="fa-solid fa-rotate-left" style="color:var(--stone)"></i></button>`).join('')}</div></section><section class="card" style="padding:1.25rem;border:1px solid rgba(143,17,24,.4)"><div style="font-weight:600;font-size:1.1rem;color:var(--red);margin-bottom:.5rem">Danger Zone</div><div style="font-size:.85rem;color:var(--stone);margin-bottom:1rem">This backs up the current system locally, then resets all shared app data. Requires typed confirmation.</div><button onclick="resetEverything()" style="width:100%;padding:.85rem;background:var(--red);border-radius:1rem;color:#fff">Reset Everything</button></section>`;
}
function toggleStarSpending(){ state.appSettings=state.appSettings||{}; state.appSettings.starSpending=!(state.appSettings.starSpending!==false); saveState(); renderSettings(); }
function toggleVoiceVerify(){ if(state.currentRole!=='dom')return; state.voice=state.voice||{enabled:false,samples:[]}; state.voice.enabled=!state.voice.enabled; saveState(); renderSettings(); if(state.voice.enabled&&ensureArray(state.voice.samples).length<10) showToast("Jacob will be asked to enrol his voice on his own device",'info'); }
function resetVoiceEnrolment(){ if(state.currentRole!=='dom')return; if(!confirm("Clear Jacob's voice samples? He'll re-enrol on his device next login."))return; state.voice.samples=[]; saveState(); renderSettings(); }
function forceJacobPin(){ if(state.currentRole!=='dom')return; state.forceJacobPinChange=true; addNotification('task','James requires you to change your PIN','Set a new 6-digit PIN.','dashboard'); saveState(); showToast('Jacob will be asked to change his PIN','success'); }
function releaseLock(){ if(state.currentRole!=='dom')return; state.appLock={locked:false}; state.pinFails=0; ensureArray(state.tasks).forEach(t=>{ t.overdueHandled=false; }); saveState(); renderSettings(); enforceLock(); showToast('Lock released','success'); }
function resetAccessBootstrap(){ if(state.currentRole!=='dom')return; if(!confirm('Reset access to the bootstrap codes? You will set fresh PINs at next login. Use this only if you are locked out.'))return; state.auth={configured:false}; state.appLock={locked:false}; state.pinFails=0; saveState(); showToast('Access reset — set new PINs at next login','success'); }
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
  /* Countdown + warning/overdue ticker */
  clearInterval(countdownTimer);
  countdownTimer=setInterval(function(){ if(!state)return; activePunishments(); tickTimers(); },1000);
  try{ initScreenshotGuard(); }catch(_){}
  /* Start on dashboard */
  navigateToTab('dashboard');
}

/* Override window.onload — runs after everything in the page is ready */
window.onload=enhancedInitialize;

/* Jacob's installed-app surface never exposes desktop-style selection or clipboard actions. */
['copy','cut','paste','contextmenu','selectstart','dragstart'].forEach(type=>{
  document.addEventListener(type,event=>{
    if(document.body.classList.contains('sub-role')) event.preventDefault();
  },true);
});
