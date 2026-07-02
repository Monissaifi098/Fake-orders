const axios = require('axios');

// ===================== CONFIG =====================
const BOT_TOKEN  = "7973091198:AAGLgaPPUZ3eToh9D_rJlkvOPby6k3zngFw";
const CHANNEL_ID = "@smmhuboffical";
const ADMIN_ID   = "6270522295";

// ===================== SPEED MODES =====================
const SPEEDS = {
  '⚡ Ultra': { min: 0.5, max: 1   },
  '🚀 Fast':  { min: 1,   max: 2   },
  '🟢 Normal':{ min: 2,   max: 4   },
  '🐢 Slow':  { min: 5,   max: 10  },
  '🌙 Night': { min: 10,  max: 20  },
};

// ===================== STATE =====================
let currentSpeed    = '🟢 Normal';
let paused          = false;
let orderCount      = 0;
let totalRevenue    = 0;
let nextInSec       = 0;
let nextTimer       = null;
let countdownTick   = null;
let controlMsgId    = null;
let controlChatId   = null;
let filterPlatform  = 'all';
let amtMin          = 0.1;
let amtMax          = 150;
let sessionStart    = Date.now();
let activeAnims     = 0;   // how many battery animations running right now

// ===================== SERVICES =====================
const SERVICES = [
  { name:"Instagram Followers",   emoji:"📸", platform:"instagram", type:"profile", rate:0.12  },
  { name:"Instagram Likes",       emoji:"❤️",  platform:"instagram", type:"post",    rate:0.04  },
  { name:"Instagram Reel Views",  emoji:"🎬", platform:"instagram", type:"reel",    rate:0.02  },
  { name:"Instagram Story Views", emoji:"👁️",  platform:"instagram", type:"story",   rate:0.015 },
  { name:"Instagram Comments",    emoji:"💬", platform:"instagram", type:"post",    rate:0.35  },
  { name:"YouTube Views",         emoji:"▶️",  platform:"youtube",   type:"video",   rate:0.025 },
  { name:"YouTube Subscribers",   emoji:"🔔", platform:"youtube",   type:"channel", rate:0.45  },
  { name:"YouTube Likes",         emoji:"👍", platform:"youtube",   type:"video",   rate:0.05  },
  { name:"YouTube Watch Time",    emoji:"⏱️",  platform:"youtube",   type:"video",   rate:0.38  },
  { name:"Facebook Page Likes",   emoji:"👥", platform:"facebook",  type:"page",    rate:0.09  },
  { name:"Facebook Post Likes",   emoji:"👍", platform:"facebook",  type:"post",    rate:0.04  },
  { name:"Facebook Followers",    emoji:"➕", platform:"facebook",  type:"profile", rate:0.08  },
  { name:"TikTok Followers",      emoji:"🎵", platform:"tiktok",    type:"profile", rate:0.08  },
  { name:"TikTok Views",          emoji:"👀", platform:"tiktok",    type:"video",   rate:0.01  },
  { name:"TikTok Likes",          emoji:"❤️",  platform:"tiktok",    type:"video",   rate:0.03  },
  { name:"Telegram Members",      emoji:"✈️",  platform:"telegram",  type:"channel", rate:0.11  },
  { name:"Telegram Post Views",   emoji:"👁️",  platform:"telegram",  type:"post",    rate:0.008 },
  { name:"Twitter/X Followers",   emoji:"🐦", platform:"twitter",   type:"profile", rate:0.14  },
  { name:"Twitter/X Likes",       emoji:"💙", platform:"twitter",   type:"tweet",   rate:0.04  },
  { name:"Spotify Streams",       emoji:"🎶", platform:"spotify",   type:"track",   rate:0.03  },
];

// ===================== LINK POOLS =====================
const LINK_POOLS = {
  instagram:{
    profile:["travel.india.vibes","foodie.express","techwithrohit","fitnesswithpriya","cricket_updates99","desi.memes.hub","glamour.by.aisha","ishan.vlogs","the.art.studio.in","motivation.urdu","daily_fashion_india","rohan.edits","priya_life_vlog","music.with.aryan","comedy.with.raj"],
    post:   ["C9xKmLtPqRs","C8wJnMuPpQt","C7vImLtOpRs","C6uHlKsNoQr","C5tGkJrMnPq","C4sFjIqLmOp","C3rEiHpKlNm","C2qDhGoJkMl","C1pCgFoIjLk","CAxBfEnHiKj"],
    reel:   ["C9xKmLtPqRs","C8wJnMuPpQt","C7vImLtOpRs","CABcDeFgHiJ","CBCdEfGhIjK","CCDeFgHiJkL"],
    story:  ["travel.india.vibes","foodie.express","techwithrohit","fitnesswithpriya","ishan.vlogs"],
  },
  youtube:{
    channel:["@TechWithRohit","@DesiKhana","@CricketTalkIndia","@MotivationHindiHub","@FitnessWithPriya","@VlogsByIshan","@ComedyWithRaj","@MusicByAryan","@StudyHindiChannel"],
    video:  ["dQw4w9WgXcQ","9bZkp7q19f0","kJQP7kiw5Fk","OPf0YbXqDm0","JGwWNGJdvx8","hT_nvWreIhg","4fuT4eFzoOs","ZZ5LpwO-An4","fJ9rUzIMcZQ","RgKAFK5djSk"],
  },
  facebook:{
    page:   ["TechNewsIndia","DesiMemeHub","CricketFansIndia","FoodieExpressIN","MotivationHindiPage","ComedyWithRaj","FashionByAisha"],
    post:   ["1234567890123","9876543210987","1122334455667","9988776655443","5544332211998"],
    profile:["rohit.sharma.official","priya.fitness.india","ishan.vlogs.in","raj.comedy.in","aryan.music.official"],
  },
  tiktok:{
    profile:["techwithrohit","desi.memes.hub","foodie.express","fitness.with.priya","cricket_india99","comedy_raj_official"],
    video:  ["7123456789012345678","7234567890123456789","7345678901234567890","7456789012345678901","7567890123456789012"],
  },
  telegram:{
    channel:["TechNewsIndia","DesiMemeHub","CricketFansIndia","MotivationHindi","FoodieExpressIN","StudyWithUs_India","ComedyHub_IN","MusicLoversIndia"],
    post:   [["TechNewsIndia",142],["DesiMemeHub",98],["CricketFansIndia",203],["MotivationHindi",77],["FoodieExpressIN",156]],
  },
  twitter:{
    profile:["techwithrohit","desi_meme_hub","cricket_india99","priya_fitness_in","comedy_raj","aryan_music"],
    tweet:  ["1234567890123456789","9876543210987654321","1122334455667788990","9988776655443322110"],
  },
  spotify:{
    track:["4uLU6hMCjMI75M1A2tKUQC","7qiZfU4dY1lWllzX7mPBI3","3n3Ppam7vgaVa1iaRUIOKE","2takcwOaAZWiXQijPHIx7B"],
  },
};

// ===================== HELPERS =====================
function ri(a,b)    { return Math.floor(Math.random()*(b-a+1))+a; }
function pick(arr)  { return arr[ri(0,arr.length-1)]; }
function uid()      { return ri(1000000000,9999999999); }
function oid()      { return ri(100000,999999); }
function getTime()  { return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true,timeZone:'Asia/Kolkata'})+' IST'; }
function uptime()   { const s=Math.floor((Date.now()-sessionStart)/1000); return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`; }
function fmtQty(n)  { return n>=1000?(n/1000).toFixed(1)+'K':String(n); }
function sleep(ms)  { return new Promise(r=>setTimeout(r,ms)); }

function makeLink(platform, type) {
  const pool = LINK_POOLS[platform]; if(!pool) return 'https://t.me/smmhuboffical';
  const p = pool[type]||pool[Object.keys(pool)[0]];
  if(platform==='instagram'){
    if(type==='profile') return `https://www.instagram.com/${pick(p)}/`;
    if(type==='post')    return `https://www.instagram.com/p/${pick(p)}/`;
    if(type==='reel')    return `https://www.instagram.com/reel/${pick(p)}/`;
    return `https://www.instagram.com/stories/${pick(p)}/`;
  }
  if(platform==='youtube'){ if(type==='channel') return `https://www.youtube.com/${pick(p)}`; return `https://www.youtube.com/watch?v=${pick(p)}`; }
  if(platform==='facebook'){ if(type==='page') return `https://www.facebook.com/${pick(p)}`; if(type==='post') return `https://www.facebook.com/photo?fbid=${pick(p)}`; return `https://www.facebook.com/${pick(p)}`; }
  if(platform==='tiktok'){ if(type==='profile') return `https://www.tiktok.com/@${pick(p)}`; return `https://www.tiktok.com/@${pick(LINK_POOLS.tiktok.profile)}/video/${pick(p)}`; }
  if(platform==='telegram'){ if(type==='channel') return `https://t.me/${pick(p)}`; const pair=pick(p); return `https://t.me/${pair[0]}/${pair[1]+ri(0,50)}`; }
  if(platform==='twitter'){ if(type==='profile') return `https://twitter.com/${pick(p)}`; return `https://twitter.com/${pick(LINK_POOLS.twitter.profile)}/status/${pick(p)}`; }
  if(platform==='spotify') return `https://open.spotify.com/track/${pick(p)}`;
  return 'https://t.me/smmhuboffical';
}

function randQty(svc) {
  if(svc.name.includes('Followers')||svc.name.includes('Subscribers')||svc.name.includes('Members')) return ri(500,10000);
  if(svc.name.includes('Views')||svc.name.includes('Streams')||svc.name.includes('Watch')) return ri(2000,50000);
  return ri(200,5000);
}

function realisticAmount() {
  const r = Math.random();
  let a;
  if(r<0.55)      a = (Math.random()*19.9 +0.1);
  else if(r<0.85) a = (Math.random()*60   +20 );
  else             a = (Math.random()*70   +80 );
  a = Math.max(amtMin, Math.min(amtMax, a));
  return a.toFixed(2);
}

// ===================== BATTERY BAR BUILDER =====================
// Steps: 0,10,20,30,40,50,60,70,80,90,100  (11 frames)
// Each step adds one filled block
function buildBatteryLine(pct) {
  // pct: 0–100
  const filled = Math.round(pct/10);
  const empty  = 10 - filled;

  // Pick color style based on level
  let bar;
  if(pct <= 30)       bar = '🟥'.repeat(filled) + '⬜'.repeat(empty);
  else if(pct <= 60)  bar = '🟧'.repeat(filled) + '⬜'.repeat(empty);
  else if(pct <= 80)  bar = '🟨'.repeat(filled) + '⬜'.repeat(empty);
  else                bar = '🟩'.repeat(filled) + '⬜'.repeat(empty);

  const bolt = pct === 100 ? '⚡' : '🔋';
  return `${bolt} ${bar} *${pct}%*`;
}

function buildOrderMsg(d, pct) {
  const batt = buildBatteryLine(pct);
  const statusLine = pct < 100 ? `⏳ *Processing...*` : `✅ *Order Complete!* 🎉`;

  // Pick a template style based on orderCount mod 4
  const style = d.style;

  if(style === 0) return (
`🔥 *ORDER RECEIVED* 🔥

${d.emoji} *${d.service}*

${batt}
${statusLine}

🆔 \`#${d.orderId}\`
👤 User: \`${d.userId}\`
🔗 ${d.link}
📊 Qty: *${d.qty}*
💸 Charged: *₹${d.amount}*
🕐 ${d.time}
🤖 @smmhubrobot`
  );

  if(style === 1) return (
`╔══════════════════╗
   ⚡ *NEW ORDER* ⚡
╚══════════════════╝

${d.emoji} *${d.service}*

${batt}
${statusLine}

🆔 *#${d.orderId}*  👤 \`${d.userId}\`
🔗 ${d.link}
📦 *${d.qty}* units  💰 *₹${d.amount}*
🕐 ${d.time} | 🤖 @smmhubrobot`
  );

  if(style === 2) return (
`💥 *SMMHUB ALERT* 💥

${d.emoji} \`${d.service}\`
━━━━━━━━━━━━━━━━━━

${batt}
${statusLine}

🆔 *#${d.orderId}*
👤 *${d.userId}*
🔗 ${d.link}
📈 *${d.qty}* • 💳 *₹${d.amount}*

⏰ ${d.time} | ✈️ @smmhubrobot`
  );

  // style 3
  return (
`┌─────────────────────┐
│  🚀 *ORDER LIVE* 🚀  │
└─────────────────────┘

${d.emoji} *${d.service}*

${batt}
${statusLine}

┌──────────────────────
│ 🆔 #${d.orderId}
│ 👤 ${d.userId}
│ 📊 ${d.qty} units
│ 💰 ₹${d.amount}
│ 🔗 ${d.link}
└──────────────────────
🕐 ${d.time} | 🤖 @smmhubrobot`
  );
}

// ===================== TELEGRAM API =====================
async function tgPost(method, data) {
  const r = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, data);
  return r.data;
}

// ===================== LIVE BATTERY ANIMATION =====================
// Steps: 0% → 10% → 20% → ... → 100% (send, then edit 10 times)
// Each step waits a random gap so it looks organic
// After 100% reached → wait 8–15s → delete message
async function runBatteryAnimation(d) {
  activeAnims++;
  try {
    // Step 0 — initial send at 0%
    let msgId;
    try {
      const res = await tgPost('sendMessage', {
        chat_id: CHANNEL_ID,
        text: buildOrderMsg(d, 0),
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });
      msgId = res.result.message_id;
    } catch(e) {
      console.error('❌ Send error:', e.response?.data || e.message);
      activeAnims--;
      return;
    }

    // Steps 10% to 100%  —  random gap between each step: 4–10 seconds
    // Total fill time: ~40–100 seconds (feels real)
    for(let pct = 10; pct <= 100; pct += 10) {
      const gap = ri(4000, 10000);   // 4–10 sec between each step
      await sleep(gap);

      const txt = buildOrderMsg(d, pct);
      try {
        await tgPost('editMessageText', {
          chat_id: CHANNEL_ID,
          message_id: msgId,
          text: txt,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        });
      } catch(e) {
        // If message was deleted externally — stop
        if(e.response?.data?.description?.includes('message to edit not found')) break;
      }
    }

    // After 100% complete — wait 8–15 sec then auto-delete
    const holdSec = ri(8, 15);
    console.log(`[${getTime()}] ⚡ Battery 100% for #${d.orderId} — deleting in ${holdSec}s`);
    await sleep(holdSec * 1000);

    try {
      await tgPost('deleteMessage', { chat_id: CHANNEL_ID, message_id: msgId });
      console.log(`[${getTime()}] 🗑️ Auto-deleted #${d.orderId}`);
    } catch(e) {
      console.log(`[${getTime()}] ⚠️ Delete skipped: ${e.message}`);
    }

  } catch(e) {
    console.error('Animation error:', e.message);
  }
  activeAnims--;
}

// ===================== SEND ORDER =====================
async function sendOrder() {
  if(paused) return;
  try {
    let pool = SERVICES;
    if(filterPlatform !== 'all') pool = SERVICES.filter(s => s.platform === filterPlatform);
    if(!pool.length) pool = SERVICES;

    const svc    = pick(pool);
    const qty    = randQty(svc);
    const amount = realisticAmount();
    const link   = makeLink(svc.platform, svc.type);
    const style  = orderCount % 4;

    const d = {
      emoji: svc.emoji, service: svc.name,
      orderId: oid(), userId: uid(),
      link, qty: fmtQty(qty), amount, time: getTime(), style,
    };

    orderCount++;
    totalRevenue += parseFloat(amount);
    console.log(`[${getTime()}] 🚀 Order #${orderCount} — ${svc.emoji} ${svc.name} ₹${amount} | Anim starting...`);

    // Run animation in background (don't await — next order can start independently)
    runBatteryAnimation(d);

    await updateControlPanel();
  } catch(err) {
    console.error('❌ sendOrder error:', err.message);
  }
}

// ===================== SCHEDULER =====================
function scheduleNext() {
  if(nextTimer)     { clearTimeout(nextTimer);     nextTimer = null; }
  if(countdownTick) { clearInterval(countdownTick); countdownTick = null; }
  if(paused) return;

  const spd  = SPEEDS[currentSpeed];
  const mins = spd.min + Math.random()*(spd.max - spd.min);
  nextInSec  = Math.round(mins*60);

  countdownTick = setInterval(() => { if(nextInSec>0) nextInSec--; }, 1000);
  nextTimer = setTimeout(async () => { await sendOrder(); scheduleNext(); }, mins*60*1000);
  console.log(`⏳ Next in ${mins.toFixed(1)}m`);
}

// ===================== CONTROL PANEL =====================
function fmtCD() {
  if(paused) return '⏸️ Paused';
  const m=Math.floor(nextInSec/60), s=nextInSec%60;
  return `${m}m ${s}s`;
}

const PE = { all:'🌐',instagram:'📸',youtube:'▶️',facebook:'👥',tiktok:'🎵',telegram:'✈️',twitter:'🐦',spotify:'🎶' };

function panelText() {
  return `🎛️ *Fire Order Bot v6*

${paused?'⏸️ *PAUSED*':'🟢 *RUNNING*'} | ⚡ *${currentSpeed}*
📨 Orders: *${orderCount}* | 💰 Rev: *₹${totalRevenue.toFixed(2)}*
⏱️ Next: *${fmtCD()}* | 🎞️ Live Anims: *${activeAnims}*
🎯 Filter: *${PE[filterPlatform]} ${filterPlatform}* | 💸 Range: *₹${amtMin}–₹${amtMax}*
⏰ Uptime: *${uptime()}* | 🕐 ${getTime()}`;
}

function panelKeyboard() {
  return { inline_keyboard: [
    // Row 1 — Speed
    [
      {text:'⚡ Ultra', callback_data:'sp_⚡ Ultra'},
      {text:'🚀 Fast',  callback_data:'sp_🚀 Fast'},
      {text:'🟢 Normal',callback_data:'sp_🟢 Normal'},
      {text:'🐢 Slow',  callback_data:'sp_🐢 Slow'},
      {text:'🌙 Night', callback_data:'sp_🌙 Night'},
    ],
    // Row 2 — Actions
    [
      {text: paused?'▶️ Resume':'⏸️ Pause', callback_data:'toggle_pause'},
      {text:'📤 Now',   callback_data:'send_now'},
      {text:'🔄 Refresh',callback_data:'refresh'},
      {text:'📊 Stats', callback_data:'stats'},
      {text:'🗑️ Reset', callback_data:'reset_stats'},
    ],
    // Row 3 — Platform filter part 1
    [
      {text:'🌐 All',    callback_data:'f_all'},
      {text:'📸 Insta',  callback_data:'f_instagram'},
      {text:'▶️ YouTube',callback_data:'f_youtube'},
      {text:'👥 FB',     callback_data:'f_facebook'},
    ],
    // Row 4 — Platform filter part 2
    [
      {text:'🎵 TikTok', callback_data:'f_tiktok'},
      {text:'✈️ TG',     callback_data:'f_telegram'},
      {text:'🐦 Twitter',callback_data:'f_twitter'},
      {text:'🎶 Spotify',callback_data:'f_spotify'},
    ],
    // Row 5 — Amount presets
    [
      {text:'💸 ₹0–20',  callback_data:'a_low'},
      {text:'💰 ₹20–80', callback_data:'a_mid'},
      {text:'💎 ₹80–150',callback_data:'a_high'},
      {text:'🌈 ₹0–150', callback_data:'a_all'},
    ],
    // Row 6 — Quick links
    [
      {text:'🤖 Bot',     url:'https://t.me/smmhubrobot'},
      {text:'📢 Channel', url:'https://t.me/smmhuboffical'},
      {text:'❓ Help',    callback_data:'help'},
    ],
  ]};
}

async function sendPanel(chatId) {
  const res = await tgPost('sendMessage',{
    chat_id:chatId, text:panelText(), parse_mode:'Markdown', reply_markup:panelKeyboard()
  });
  controlMsgId  = res.result.message_id;
  controlChatId = chatId;
}

async function updateControlPanel() {
  if(!controlMsgId||!controlChatId) return;
  try {
    await tgPost('editMessageText',{
      chat_id:controlChatId, message_id:controlMsgId,
      text:panelText(), parse_mode:'Markdown', reply_markup:panelKeyboard()
    });
  } catch(e) { /* not modified — fine */ }
}

setInterval(updateControlPanel, 10000);

// ===================== POLLING =====================
let lastUpdateId = 0;

async function poll() {
  try {
    const res = await tgPost('getUpdates',{ offset:lastUpdateId+1, timeout:20, allowed_updates:['message','callback_query'] });
    for(const upd of (res.result||[])) {
      lastUpdateId = upd.update_id;

      // CALLBACK
      if(upd.callback_query) {
        const cb=upd.callback_query, fromId=String(cb.from.id);
        if(fromId!==ADMIN_ID){
          await tgPost('answerCallbackQuery',{callback_query_id:cb.id,text:'❌ Not authorized'});
          continue;
        }
        controlChatId = cb.message.chat.id;
        controlMsgId  = cb.message.message_id;
        const d=cb.data; let toast='', showAlert=false;

        if(d.startsWith('sp_')) {
          const spd=d.replace('sp_','');
          if(SPEEDS[spd]){ currentSpeed=spd; scheduleNext(); toast=`✅ Speed: ${currentSpeed}`; }

        } else if(d==='toggle_pause') {
          paused=!paused;
          if(paused){ clearTimeout(nextTimer); clearInterval(countdownTick); nextTimer=null; countdownTick=null; toast='⏸️ Paused'; }
          else { scheduleNext(); toast='▶️ Running!'; }

        } else if(d==='send_now') {
          await tgPost('answerCallbackQuery',{callback_query_id:cb.id,text:'📤 Sending...'});
          await sendOrder();
          if(!paused) scheduleNext();
          await updateControlPanel();
          continue;

        } else if(d==='refresh') {
          toast='🔄 Refreshed!';

        } else if(d==='stats') {
          toast=`📊 Orders:${orderCount} | Rev:₹${totalRevenue.toFixed(2)} | Live:${activeAnims} | Up:${uptime()}`;
          showAlert=true;

        } else if(d==='reset_stats') {
          orderCount=0; totalRevenue=0; sessionStart=Date.now();
          toast='🔄 Stats reset! Fresh start 🚀'; showAlert=true;

        } else if(d==='help') {
          toast='⚡0.5-1m|🚀1-2m|🟢2-4m|🐢5-10m|🌙10-20m | Battery fills 0→100% then auto-deletes';
          showAlert=true;

        } else if(d.startsWith('f_')) {
          filterPlatform=d.replace('f_','');
          toast=`🎯 Filter: ${PE[filterPlatform]||'?'} ${filterPlatform}`;

        } else if(d==='a_low')  { amtMin=0.1;  amtMax=20;  toast='💸 Range: ₹0.1–₹20';
        } else if(d==='a_mid')  { amtMin=20;   amtMax=80;  toast='💰 Range: ₹20–₹80';
        } else if(d==='a_high') { amtMin=80;   amtMax=150; toast='💎 Range: ₹80–₹150';
        } else if(d==='a_all')  { amtMin=0.1;  amtMax=150; toast='🌈 Range: ₹0.1–₹150'; }

        await tgPost('answerCallbackQuery',{callback_query_id:cb.id,text:toast,show_alert:showAlert});
        await updateControlPanel();
        continue;
      }

      // TEXT MESSAGE
      if(upd.message?.text) {
        const fromId=String(upd.message.from.id), chatId=upd.message.chat.id, txt=upd.message.text.trim();
        if(fromId!==ADMIN_ID) continue;

        if(['/start','/panel','/control'].includes(txt)) { await sendPanel(chatId); }
        else if(txt==='/status') { await tgPost('sendMessage',{chat_id:chatId,text:panelText(),parse_mode:'Markdown'}); }
        else if(txt==='/stats')  { await tgPost('sendMessage',{chat_id:chatId,text:`📊 *Stats*\nOrders: ${orderCount}\nRevenue: ₹${totalRevenue.toFixed(2)}\nLive Anims: ${activeAnims}\nUptime: ${uptime()}`,parse_mode:'Markdown'}); }
        else if(txt==='/send')   { await sendOrder(); }
        else if(txt==='/pause')  { paused=true; clearTimeout(nextTimer); clearInterval(countdownTick); await tgPost('sendMessage',{chat_id:chatId,text:'⏸️ Paused'}); }
        else if(txt==='/resume') { paused=false; scheduleNext(); await tgPost('sendMessage',{chat_id:chatId,text:'▶️ Resumed!'}); }
        else if(txt==='/reset')  { orderCount=0; totalRevenue=0; sessionStart=Date.now(); await tgPost('sendMessage',{chat_id:chatId,text:'🔄 Reset done!'}); }
        else if(txt.startsWith('/filter ')) {
          const pl=txt.replace('/filter ','').toLowerCase().trim();
          if(PE[pl]){ filterPlatform=pl; await tgPost('sendMessage',{chat_id:chatId,text:`🎯 Filter: ${PE[pl]} ${pl}`}); }
          else await tgPost('sendMessage',{chat_id:chatId,text:'❌ Use: all, instagram, youtube, facebook, tiktok, telegram, twitter, spotify'});
        }
        else if(txt==='/help') {
          await tgPost('sendMessage',{chat_id:chatId,parse_mode:'Markdown',text:`🤖 *Commands*
/start /panel — control panel
/status — current status
/stats — session stats
/send — manual order now
/pause /resume — toggle bot
/reset — reset stats
/filter <platform> — platform filter
/help — this message`});
        }
      }
    }
  } catch(e) { console.error('Poll error:', e.message); }
  poll();
}

// ===================== START =====================
console.log('🔥 Fire Order Bot v6 — Battery Animation Edition');
console.log(`📡 Admin: ${ADMIN_ID} | Channel: ${CHANNEL_ID}`);
console.log(`⚡ Mode: ${currentSpeed} | Range: ₹${amtMin}–₹${amtMax}`);
console.log(`🔋 Battery fills 0%→100% step by step then auto-deletes`);
console.log(`➡️  Send /panel to bot\n`);

tgPost('deleteWebhook',{}).then(()=>{ poll(); sendOrder().then(()=>scheduleNext()); });

setInterval(()=>{
  process.stdout.write(`\r⏰ ${getTime()} | ✅ ${orderCount} orders | 💰 ₹${totalRevenue.toFixed(2)} | 🎞️ ${activeAnims} live | ⏭️ ${fmtCD()}   `);
},2000);
