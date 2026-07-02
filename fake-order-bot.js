const axios = require('axios');

// ===================== CONFIG =====================
const BOT_TOKEN  = "7973091198:AAGLgaPPUZ3eToh9D_rJlkvOPby6k3zngFw";
const CHANNEL_ID = "@smmhuboffical";
const ADMIN_ID   = "6270522295";

// ===================== SPEED MODES =====================
const SPEEDS = {
  '⚡ Ultra Fast': { min: 0.08, max: 0.25  }, // 5–15 sec
  '🚀 Fast':       { min: 0.33, max: 0.67  }, // 20–40 sec
  '🟢 Normal':     { min: 2,    max: 4     }, // 2–4 min
  '🐢 Slow':       { min: 5,    max: 10    },
  '🌙 Night':      { min: 10,   max: 20    },
};

// ===================== ANIMATION STYLES =====================
// Admin can cycle through these
const ANIM_STYLES = ['rainbow', 'fire', 'ice', 'gold', 'neon'];
let currentAnimStyle = 'rainbow'; // default

// Color block sets per style
const BLOCK_SETS = {
  rainbow: { low: '🟥', mid: '🟧', high: '🟨', full: '🟩', empty: '⬛' },
  fire:    { low: '🟥', mid: '🟥', high: '🟧', full: '🟧', empty: '⬛' },
  ice:     { low: '🟦', mid: '🟦', high: '🟦', full: '🟦', empty: '⬜' },
  gold:    { low: '🟨', mid: '🟨', high: '🟨', full: '🟨', empty: '⬛' },
  neon:    { low: '🟪', mid: '🟦', high: '🟩', full: '🟩', empty: '⬛' },
};

// ===================== STATE =====================
let currentSpeed   = '🟢 Normal';
let paused         = false;
let orderCount     = 0;
let totalRevenue   = 0;
let nextInSec      = 0;
let nextTimer      = null;
let countdownTick  = null;
let controlMsgId   = null;
let controlChatId  = null;
let filterPlatform = 'all';
let amtMin         = 0.1;
let amtMax         = 150;
let sessionStart   = Date.now();

// ===================== SERVICES =====================
const SERVICES = [
  { name: "Instagram Followers",   emoji: "📸", platform: "instagram", type: "profile" },
  { name: "Instagram Likes",       emoji: "❤️",  platform: "instagram", type: "post"    },
  { name: "Instagram Reel Views",  emoji: "🎬", platform: "instagram", type: "reel"    },
  { name: "Instagram Story Views", emoji: "👁️",  platform: "instagram", type: "story"   },
  { name: "Instagram Comments",    emoji: "💬", platform: "instagram", type: "post"    },
  { name: "YouTube Views",         emoji: "▶️",  platform: "youtube",   type: "video"   },
  { name: "YouTube Subscribers",   emoji: "🔔", platform: "youtube",   type: "channel" },
  { name: "YouTube Likes",         emoji: "👍", platform: "youtube",   type: "video"   },
  { name: "YouTube Watch Time",    emoji: "⏱️",  platform: "youtube",   type: "video"   },
  { name: "Facebook Page Likes",   emoji: "👥", platform: "facebook",  type: "page"    },
  { name: "Facebook Post Likes",   emoji: "👍", platform: "facebook",  type: "post"    },
  { name: "Facebook Followers",    emoji: "➕", platform: "facebook",  type: "profile" },
  { name: "TikTok Followers",      emoji: "🎵", platform: "tiktok",    type: "profile" },
  { name: "TikTok Views",          emoji: "👀", platform: "tiktok",    type: "video"   },
  { name: "TikTok Likes",          emoji: "❤️",  platform: "tiktok",    type: "video"   },
  { name: "Telegram Members",      emoji: "✈️",  platform: "telegram",  type: "channel" },
  { name: "Telegram Post Views",   emoji: "👁️",  platform: "telegram",  type: "post"    },
  { name: "Twitter/X Followers",   emoji: "🐦", platform: "twitter",   type: "profile" },
  { name: "Twitter/X Likes",       emoji: "💙", platform: "twitter",   type: "tweet"   },
  { name: "Spotify Streams",       emoji: "🎶", platform: "spotify",   type: "track"   },
];

// ===================== REAL LINK POOLS =====================
const LINKS = {
  instagram: {
    profile: () => `https://www.instagram.com/${pick(["cristiano","leomessi","selenagomez","kyliejenner","therock","arianagrande","kimkardashian","beyonce","justinbieber","natgeo"])}/`,
    post:    () => `https://www.instagram.com/p/${randB62(11)}/`,
    reel:    () => `https://www.instagram.com/reel/${randB62(11)}/`,
    story:   () => `https://www.instagram.com/stories/${pick(["cristiano","leomessi","selenagomez","therock","arianagrande"])}/`,
  },
  youtube: {
    channel: () => `https://www.youtube.com/${pick(["@MrBeast","@PewDiePie","@T-Series","@CocomeisterEspa","@SET","@BBCNews","@NASAgovVideo","@NatGeo"])}`,
    video:   () => `https://www.youtube.com/watch?v=${randYtId()}`,
  },
  facebook: {
    page:    () => `https://www.facebook.com/${pick(["NASA","NatGeo","BBCNews","CricketIndia","Marvel","FCBarcelona","RealMadrid","ChennaiSuperKings"])}`,
    post:    () => `https://www.facebook.com/photo?fbid=${randNum(15)}`,
    profile: () => `https://www.facebook.com/profile.php?id=${randNum(15)}`,
  },
  tiktok: {
    profile: () => `https://www.tiktok.com/@${pick(["khaby.lame","charlidamelio","bellapoarch","addisonre","zachking","mrbeast"])}`,
    video:   () => `https://www.tiktok.com/@${pick(["khaby.lame","charlidamelio","bellapoarch"])}/video/${randNum(19)}`,
  },
  telegram: {
    channel: () => `https://t.me/${pick(["durov","telegram","TechCrunch","BBCBreaking","Reuters","CoinDesk","IndianNews24","CricketUpdatesIN"])}`,
    post:    () => { const ch = pick(["TechNewsIndia","CricketFansIndia","MotivationHindi","FoodieExpressIN"]); return `https://t.me/${ch}/${randInt(50,500)}`; },
  },
  twitter: {
    profile: () => `https://twitter.com/${pick(["elonmusk","BillGates","NASA","BBCBreaking","ViratKohli18","imVkohli","narendramodi","sachin_rt"])}`,
    tweet:   () => `https://twitter.com/${pick(["elonmusk","BillGates","NASA","ViratKohli18"])}/status/${randNum(19)}`,
  },
  spotify: {
    track: () => `https://open.spotify.com/track/${pick(["4uLU6hMCjMI75M1A2tKUQC","7qiZfU4dY1lWllzX7mPBI3","3n3Ppam7vgaVa1iaRUIOKE","11dFghVXANMlKmJXsNCbNl","6habFhsOp2NvshLv26DqMb"])}`,
  },
};

function makeLink(platform, type) {
  try { return LINKS[platform][type](); } catch { return 'https://t.me/smmhuboffical'; }
}

// ===================== HELPERS =====================
function randInt(a, b)  { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr)       { return arr[randInt(0, arr.length - 1)]; }
function randNum(len)    { let s=''; for(let i=0;i<len;i++) s+=randInt(0,9); return s; }
function randYtId()      { const c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'; let s=''; for(let i=0;i<11;i++) s+=c[randInt(0,c.length-1)]; return s; }
function randB62(len)    { const c='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let s=''; for(let i=0;i<len;i++) s+=c[randInt(0,c.length-1)]; return s; }
function randUserId()    { return randInt(100000000, 999999999); }
function randOrderId()   { return randInt(100000, 999999); }
function getTime()       { return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true,timeZone:'Asia/Kolkata'})+' IST'; }
function uptime()        { const s=Math.floor((Date.now()-sessionStart)/1000); return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`; }

// ===================== AMOUNT (₹ based, realistic) =====================
function realisticAmount() {
  const r = Math.random();
  let amt;
  if      (r < 0.50) amt = (Math.random() * 19.9  + 0.1 ).toFixed(2); // 50% → ₹0.1–20
  else if (r < 0.80) amt = (Math.random() * 60    + 20  ).toFixed(2); // 30% → ₹20–80
  else               amt = (Math.random() * 70    + 80  ).toFixed(2); // 20% → ₹80–150
  amt = Math.max(amtMin, Math.min(amtMax, parseFloat(amt)));
  return amt.toFixed(2);
}

// ===================== QTY FROM AMOUNT =====================
// Qty realistic ke hisaab se amount pe depend karta hai
function qtyFromAmount(svcName, amount) {
  const amt = parseFloat(amount);
  let base;
  if      (svcName.includes('Views') || svcName.includes('Streams') || svcName.includes('Watch')) base = amt * 800;
  else if (svcName.includes('Likes') || svcName.includes('Comments'))                             base = amt * 300;
  else if (svcName.includes('Followers') || svcName.includes('Subscribers') || svcName.includes('Members')) base = amt * 150;
  else                                                                                             base = amt * 200;
  // ±15% variation
  const variation = base * (0.85 + Math.random() * 0.30);
  const qty = Math.max(10, Math.round(variation));
  return qty >= 1000 ? (qty/1000).toFixed(1)+'K' : String(qty);
}

// ===================== COLORED BLOCK ANIMATION =====================
function colorBar(amount) {
  const amt   = parseFloat(amount);
  const pct   = Math.min(100, Math.round((amt / 150) * 100));
  const total = 10;
  const filled = Math.round((pct / 100) * total);
  const blocks = BLOCK_SETS[currentAnimStyle];

  // Color of filled blocks changes with amount
  let fillBlock;
  if      (pct <= 20)  fillBlock = blocks.low;
  else if (pct <= 50)  fillBlock = blocks.mid;
  else if (pct <= 80)  fillBlock = blocks.high;
  else                 fillBlock = blocks.full;

  const bar = fillBlock.repeat(filled) + blocks.empty.repeat(total - filled);
  return `${bar} ${pct}%`;
}

// ===================== NOTIFICATION TEMPLATES (all with color bar) =====================
function buildMsg(d) {
  const bar = colorBar(d.amount);
  const styleLabel = currentAnimStyle.toUpperCase();
  const t = randInt(0, 4);

  if (t === 0) return (
`🔥 *ORDER RECEIVED* 🔥

${d.emoji} *${d.service}*

⚡ ${bar}
💸 *₹${d.amount} Charged*

🆔 \`#${d.orderId}\`
👤 \`${d.userId}\`
🔗 ${d.link}
📊 *${d.qty}*
✅ Processing...

🕐 ${d.time} | @smmhubrobot`
  );

  if (t === 1) return (
`╔══════════════════╗
  🚀 *NEW ORDER* 🚀
╚══════════════════╝

${d.emoji} *${d.service}*

${bar}
💰 *₹${d.amount}*

🆔 *#${d.orderId}*  👤 *${d.userId}*
📦 Qty: *${d.qty}*
🔗 ${d.link}
🟢 Status: *LIVE*

⏰ ${d.time} | @smmhubrobot`
  );

  if (t === 2) return (
`⚡ *INSTANT ORDER ALERT* ⚡

${d.emoji} \`${d.service}\`
━━━━━━━━━━━━━━━━━━━━
${bar}
━━━━━━━━━━━━━━━━━━━━
💳 *₹${d.amount} deducted*
📊 Qty: *${d.qty}*

🆔 \`#${d.orderId}\`
👤 \`${d.userId}\`
🔗 ${d.link}
⚙️ *Running...*

🕐 ${d.time} | @smmhubrobot`
  );

  if (t === 3) return (
`💥 *BOOM — ORDER FIRED!* 💥

${d.emoji} *${d.service}*

${bar}
💎 *₹${d.amount}*  📦 *${d.qty} units*

┌─────────────────────
│ 🆔 #${d.orderId}
│ 👤 ${d.userId}
│ 📊 ${d.qty}
│ 🔗 ${d.link}
│ ✅ PROCESSING
└─────────────────────
⏰ ${d.time} | @smmhubrobot`
  );

  // t === 4
  return (
`🎯 *Campaign Started!* 🎯

${d.emoji} *${d.service}*

${bar}
🏷️ *₹${d.amount}*  |  📈 *${d.qty} units*

🔢 \`#${d.orderId}\`
🧑 \`${d.userId}\`
🌐 ${d.link}
📡 Status: *LIVE ✅*

🕐 ${d.time} | @smmhubrobot`
  );
}

// ===================== TELEGRAM API =====================
async function tgPost(method, data) {
  const r = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, data);
  return r.data;
}

// ===================== SEND ORDER =====================
async function sendOrder() {
  if (paused) return;
  try {
    let pool = filterPlatform === 'all' ? SERVICES : SERVICES.filter(s => s.platform === filterPlatform);
    if (!pool.length) pool = SERVICES;

    const svc    = pick(pool);
    const amount = realisticAmount();
    const qty    = qtyFromAmount(svc.name, amount);
    const link   = makeLink(svc.platform, svc.type);

    const d = {
      emoji: svc.emoji, service: svc.name,
      orderId: randOrderId(), userId: randUserId(),
      link, qty, amount, time: getTime(),
    };

    const res = await tgPost('sendMessage', {
      chat_id: CHANNEL_ID,
      text: buildMsg(d),
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });

    const msgId = res.result.message_id;
    orderCount++;
    totalRevenue += parseFloat(amount);
    console.log(`[${getTime()}] ✅ #${orderCount} ${svc.emoji} ${svc.name} ₹${amount} qty:${qty}`);

    // Auto-delete 2–3 min
    const delMs = randInt(120, 180) * 1000;
    setTimeout(async () => {
      try { await tgPost('deleteMessage', { chat_id: CHANNEL_ID, message_id: msgId }); }
      catch {}
    }, delMs);

    await updateControlPanel();
  } catch (err) {
    console.error('❌', err.response?.data || err.message);
  }
}

// ===================== SCHEDULER =====================
function scheduleNext() {
  if (nextTimer)     { clearTimeout(nextTimer);     nextTimer = null; }
  if (countdownTick) { clearInterval(countdownTick); countdownTick = null; }
  if (paused) return;
  const spd  = SPEEDS[currentSpeed];
  const mins = spd.min + Math.random() * (spd.max - spd.min);
  nextInSec  = Math.round(mins * 60);
  countdownTick = setInterval(() => { if (nextInSec > 0) nextInSec--; }, 1000);
  nextTimer = setTimeout(async () => { await sendOrder(); scheduleNext(); }, mins * 60 * 1000);
}

// ===================== CONTROL PANEL =====================
function fmtCountdown() {
  if (paused) return '⏸️ Paused';
  const m = Math.floor(nextInSec / 60), s = nextInSec % 60;
  return `${m}m ${s}s`;
}

const PLT_EMOJI = { all:'🌐', instagram:'📸', youtube:'▶️', facebook:'👥', tiktok:'🎵', telegram:'✈️', twitter:'🐦', spotify:'🎶' };
const ANIM_EMOJI = { rainbow:'🌈', fire:'🔥', ice:'🧊', gold:'✨', neon:'💜' };

function panelText() {
  const bar = colorBar('75'); // preview bar in panel
  return `🎛️ *SMMHUB Fire Bot — v6*

${bar}

📊 Status: ${paused ? '⏸️ *PAUSED*' : '🟢 *RUNNING*'}
⚡ Speed: *${currentSpeed}*
🎨 Anim: *${ANIM_EMOJI[currentAnimStyle]} ${currentAnimStyle}*
📨 Sent: *${orderCount}*  |  💰 *₹${totalRevenue.toFixed(2)}*
⏱️ Next: *${fmtCountdown()}*
🎯 Filter: *${PLT_EMOJI[filterPlatform]} ${filterPlatform}*
💸 Range: *₹${amtMin}–₹${amtMax}*
⏰ Uptime: *${uptime()}*
🕐 ${getTime()}`;
}

function panelKeyboard() {
  return { inline_keyboard: [
    // Speed — single row
    [
      { text: '⚡ Ultra',  callback_data: 'spd_⚡ Ultra Fast' },
      { text: '🚀 Fast',   callback_data: 'spd_🚀 Fast'       },
      { text: '🟢 Normal', callback_data: 'spd_🟢 Normal'     },
      { text: '🐢 Slow',   callback_data: 'spd_🐢 Slow'       },
      { text: '🌙 Night',  callback_data: 'spd_🌙 Night'      },
    ],
    // Actions
    [
      { text: paused ? '▶️ Resume' : '⏸️ Pause', callback_data: 'pause'    },
      { text: '📤 Send Now',                      callback_data: 'send_now' },
      { text: '🔄 Refresh',                       callback_data: 'refresh'  },
      { text: '🔄 Reset',                         callback_data: 'reset'    },
    ],
    // Animation style
    [
      { text: '🌈 Rainbow', callback_data: 'anim_rainbow' },
      { text: '🔥 Fire',    callback_data: 'anim_fire'    },
      { text: '🧊 Ice',     callback_data: 'anim_ice'     },
      { text: '✨ Gold',    callback_data: 'anim_gold'    },
      { text: '💜 Neon',    callback_data: 'anim_neon'    },
    ],
    // Amount range
    [
      { text: '₹0–20',    callback_data: 'amt_low'  },
      { text: '₹20–80',   callback_data: 'amt_mid'  },
      { text: '₹80–150',  callback_data: 'amt_high' },
      { text: '₹All',     callback_data: 'amt_all'  },
    ],
    // Platform filter
    [
      { text: '🌐', callback_data: 'plt_all'       },
      { text: '📸', callback_data: 'plt_instagram' },
      { text: '▶️', callback_data: 'plt_youtube'   },
      { text: '👥', callback_data: 'plt_facebook'  },
      { text: '🎵', callback_data: 'plt_tiktok'    },
      { text: '✈️', callback_data: 'plt_telegram'  },
      { text: '🐦', callback_data: 'plt_twitter'   },
      { text: '🎶', callback_data: 'plt_spotify'   },
    ],
  ]};
}

async function sendPanel(chatId) {
  try {
    const res = await tgPost('sendMessage', { chat_id: chatId, text: panelText(), parse_mode: 'Markdown', reply_markup: panelKeyboard() });
    controlMsgId = res.result.message_id; controlChatId = chatId;
  } catch(e) { console.error(e.response?.data || e.message); }
}

async function updateControlPanel() {
  if (!controlMsgId) return;
  try { await tgPost('editMessageText', { chat_id: controlChatId, message_id: controlMsgId, text: panelText(), parse_mode: 'Markdown', reply_markup: panelKeyboard() }); }
  catch {}
}

setInterval(updateControlPanel, 10000);

// ===================== POLLING =====================
let lastUpdateId = 0;

async function poll() {
  try {
    const res = await tgPost('getUpdates', { offset: lastUpdateId + 1, timeout: 20, allowed_updates: ['message','callback_query'] });
    for (const upd of (res.result || [])) {
      lastUpdateId = upd.update_id;

      if (upd.callback_query) {
        const cb = upd.callback_query;
        if (String(cb.from.id) !== ADMIN_ID) { await tgPost('answerCallbackQuery', { callback_query_id: cb.id, text: '❌ Unauthorized' }); continue; }
        controlChatId = cb.message.chat.id; controlMsgId = cb.message.message_id;
        const d = cb.data; let toast = '';

        if (d.startsWith('spd_')) {
          const s = d.replace('spd_','');
          if (SPEEDS[s]) { currentSpeed = s; scheduleNext(); toast = `✅ Speed: ${s}`; }
        }
        else if (d === 'pause') {
          paused = !paused;
          if (paused) { clearTimeout(nextTimer); clearInterval(countdownTick); nextTimer=null; countdownTick=null; toast='⏸️ Paused'; }
          else { scheduleNext(); toast='▶️ Running!'; }
        }
        else if (d === 'send_now') {
          await tgPost('answerCallbackQuery', { callback_query_id: cb.id, text: '📤 Sending...' });
          await sendOrder(); if (!paused) scheduleNext(); await updateControlPanel(); continue;
        }
        else if (d === 'refresh') { toast = '🔄 Refreshed!'; }
        else if (d === 'reset')   { orderCount=0; totalRevenue=0; sessionStart=Date.now(); toast='🔄 Stats reset!'; }
        else if (d.startsWith('anim_')) { currentAnimStyle = d.replace('anim_',''); toast = `🎨 Style: ${ANIM_EMOJI[currentAnimStyle]} ${currentAnimStyle}`; }
        else if (d.startsWith('amt_')) {
          if (d==='amt_low')  { amtMin=0.1;  amtMax=20;  toast='💸 ₹0.1–20'; }
          if (d==='amt_mid')  { amtMin=20;   amtMax=80;  toast='💰 ₹20–80';  }
          if (d==='amt_high') { amtMin=80;   amtMax=150; toast='💎 ₹80–150'; }
          if (d==='amt_all')  { amtMin=0.1;  amtMax=150; toast='🌈 ₹0.1–150';}
        }
        else if (d.startsWith('plt_')) { filterPlatform = d.replace('plt_',''); toast = `🎯 ${PLT_EMOJI[filterPlatform]} ${filterPlatform}`; }

        await tgPost('answerCallbackQuery', { callback_query_id: cb.id, text: toast });
        await updateControlPanel();
        continue;
      }

      if (upd.message?.text) {
        const fromId = String(upd.message.from.id);
        const chatId = upd.message.chat.id;
        const txt    = upd.message.text.trim();
        if (fromId !== ADMIN_ID) continue;

        if (['/start','/panel'].includes(txt))  await sendPanel(chatId);
        else if (txt === '/send')  { await sendOrder(); }
        else if (txt === '/pause') { paused=true;  clearTimeout(nextTimer); clearInterval(countdownTick); await tgPost('sendMessage',{chat_id:chatId,text:'⏸️ Paused'}); }
        else if (txt === '/resume'){ paused=false; scheduleNext(); await tgPost('sendMessage',{chat_id:chatId,text:'▶️ Running!'}); }
        else if (txt === '/reset') { orderCount=0;totalRevenue=0;sessionStart=Date.now(); await tgPost('sendMessage',{chat_id:chatId,text:'🔄 Reset done!'}); }
        else if (txt === '/stats') { await tgPost('sendMessage',{chat_id:chatId,text:`📊 Sent: ${orderCount} | ₹${totalRevenue.toFixed(2)} | ${uptime()}`,parse_mode:'Markdown'}); }
      }
    }
  } catch(e) { console.error('Poll error:', e.message); }
  poll();
}

// ===================== START =====================
console.log('🔥 SMMHUB Fire Bot v6');
console.log(`📡 Admin: ${ADMIN_ID} | Channel: ${CHANNEL_ID}`);
tgPost('deleteWebhook',{}).then(()=>{ poll(); sendOrder().then(()=>scheduleNext()); });
setInterval(()=>{ process.stdout.write(`\r⏰ ${getTime()} | ✅ ${orderCount} | ₹${totalRevenue.toFixed(2)} | ${currentSpeed} | Next: ${fmtCountdown()}   `); }, 2000);
