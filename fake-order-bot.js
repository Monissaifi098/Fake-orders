const axios = require('axios');

// ===================== CONFIG =====================
const BOT_TOKEN    = "7973091198:AAGLgaPPUZ3eToh9D_rJlkvOPby6k3zngFw";
const CHANNEL_ID   = "@smmhuboffical";
const ADMIN_ID     = "6270522295"; // apna Telegram chat ID — sirf tujhe hi control panel dikhega

// ===================== SPEED MODES (minutes) =====================
const SPEEDS = {
  '⚡ Ultra Fast': { min: 0.5,  max: 1   },
  '🚀 Fast':       { min: 1,    max: 2   },
  '🟢 Normal':     { min: 2,    max: 4   },
  '🐢 Slow':       { min: 5,    max: 10  },
  '🌙 Night':      { min: 10,   max: 20  },
};

// ===================== STATE =====================
let currentSpeed    = '🟢 Normal';
let paused          = false;
let orderCount      = 0;
let nextInSec       = 0;
let nextTimer       = null;
let countdownTick   = null;
let controlMsgId    = null; // message ID of the pinned control panel
let controlChatId   = null; // chat ID where control panel is

// ===================== SERVICES =====================
const SERVICES = [
  { name: "Instagram Followers",    emoji: "📸", platform: "instagram", type: "profile", rate: 0.12 },
  { name: "Instagram Likes",        emoji: "❤️",  platform: "instagram", type: "post",    rate: 0.04 },
  { name: "Instagram Reel Views",   emoji: "🎬", platform: "instagram", type: "reel",    rate: 0.02 },
  { name: "Instagram Story Views",  emoji: "👁️",  platform: "instagram", type: "story",   rate: 0.015 },
  { name: "Instagram Comments",     emoji: "💬", platform: "instagram", type: "post",    rate: 0.35 },
  { name: "YouTube Views",          emoji: "▶️",  platform: "youtube",   type: "video",   rate: 0.025 },
  { name: "YouTube Subscribers",    emoji: "🔔", platform: "youtube",   type: "channel", rate: 0.45 },
  { name: "YouTube Likes",          emoji: "👍", platform: "youtube",   type: "video",   rate: 0.05 },
  { name: "YouTube Watch Time",     emoji: "⏱️",  platform: "youtube",   type: "video",   rate: 0.38 },
  { name: "Facebook Page Likes",    emoji: "👥", platform: "facebook",  type: "page",    rate: 0.09 },
  { name: "Facebook Post Likes",    emoji: "👍", platform: "facebook",  type: "post",    rate: 0.04 },
  { name: "Facebook Followers",     emoji: "➕", platform: "facebook",  type: "profile", rate: 0.08 },
  { name: "TikTok Followers",       emoji: "🎵", platform: "tiktok",    type: "profile", rate: 0.08 },
  { name: "TikTok Views",           emoji: "👀", platform: "tiktok",    type: "video",   rate: 0.01 },
  { name: "TikTok Likes",           emoji: "❤️",  platform: "tiktok",    type: "video",   rate: 0.03 },
  { name: "Telegram Members",       emoji: "✈️",  platform: "telegram",  type: "channel", rate: 0.11 },
  { name: "Telegram Post Views",    emoji: "👁️",  platform: "telegram",  type: "post",    rate: 0.008 },
  { name: "Twitter/X Followers",    emoji: "🐦", platform: "twitter",   type: "profile", rate: 0.14 },
  { name: "Twitter/X Likes",        emoji: "💙", platform: "twitter",   type: "tweet",   rate: 0.04 },
  { name: "Spotify Streams",        emoji: "🎶", platform: "spotify",   type: "track",   rate: 0.03 },
];

// ===================== LINK POOLS =====================
// Har pool me multiple entries — random pick + random variation = unique link har baar
const LINK_POOLS = {
  instagram: {
    profile: [
      "travel.india.vibes","foodie.express","techwithrohit","fitnesswithpriya",
      "cricket_updates99","desi.memes.hub","glamour.by.aisha","ishan.vlogs",
      "the.art.studio.in","motivation.urdu","daily_fashion_india","rohan.edits",
      "priya_life_vlog","music.with.aryan","comedy.with.raj"
    ],
    post: ["C9xKmLtPqRs","C8wJnMuPpQt","C7vImLtOpRs","C6uHlKsNoQr","C5tGkJrMnPq","C4sFjIqLmOp","C3rEiHpKlNm","C2qDhGoJkMl","C1pCgFoIjLk","CAxBfEnHiKj","CByCeDoGhJi","CCxDcNfGiIh"],
    reel:  ["C9xKmLtPqRs","C8wJnMuPpQt","C7vImLtOpRs","C6uHlKsNoQr","C5tGkJrMnPq","CABcDeFgHiJ","CBCdEfGhIjK","CCDeFgHiJkL"],
    story: ["travel.india.vibes","foodie.express","techwithrohit","fitnesswithpriya","ishan.vlogs"],
  },
  youtube: {
    channel: ["@TechWithRohit","@DesiKhana","@CricketTalkIndia","@MotivationHindiHub","@FitnessWithPriya","@VlogsByIshan","@TheArtStudioIn","@ComedyWithRaj","@MusicByAryan","@StudyHindiChannel"],
    video:   ["dQw4w9WgXcQ","9bZkp7q19f0","kJQP7kiw5Fk","OPf0YbXqDm0","JGwWNGJdvx8","hT_nvWreIhg","4fuT4eFzoOs","ZZ5LpwO-An4","L_jWHffIx5E","fJ9rUzIMcZQ","RgKAFK5djSk","6Zbi0XmGtMk"],
  },
  facebook: {
    page:    ["TechNewsIndia","DesiMemeHub","CricketFansIndia","FoodieExpressIN","MotivationHindiPage","ComedyWithRaj","FashionByAisha","StudyHubIndia"],
    post:    ["1234567890123","9876543210987","1122334455667","9988776655443","5544332211998","3322110099887","7766554433221"],
    profile: ["rohit.sharma.official","priya.fitness.india","ishan.vlogs.in","raj.comedy.in","aryan.music.official"],
  },
  tiktok: {
    profile: ["techwithrohit","desi.memes.hub","foodie.express","fitness.with.priya","cricket_india99","comedy_raj_official","aryan_music_tiktok"],
    video:   ["7123456789012345678","7234567890123456789","7345678901234567890","7456789012345678901","7567890123456789012","7678901234567890123","7789012345678901234"],
  },
  telegram: {
    channel: ["TechNewsIndia","DesiMemeHub","CricketFansIndia","MotivationHindi","FoodieExpressIN","StudyWithUs_India","ComedyHub_IN","MusicLoversIndia","TravelIndia_Official"],
    post:    [["TechNewsIndia",142],["DesiMemeHub",98],["CricketFansIndia",203],["MotivationHindi",77],["FoodieExpressIN",156],["StudyWithUs_India",44]],
  },
  twitter: {
    profile: ["techwithrohit","desi_meme_hub","cricket_india99","priya_fitness_in","comedy_raj","aryan_music"],
    tweet:   ["1234567890123456789","9876543210987654321","1122334455667788990","9988776655443322110","5544332211009988776","3322110099887766554"],
  },
  spotify: {
    track: ["4uLU6hMCjMI75M1A2tKUQC","7qiZfU4dY1lWllzX7mPBI3","3n3Ppam7vgaVa1iaRUIOKE","2takcwOaAZWiXQijPHIx7B","5ChkMS8OtdzJeqQ5s8Cy9h"],
  },
};

// ===================== HELPERS =====================
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr)         { return arr[randInt(0, arr.length - 1)]; }
function randUserId()      { return randInt(1000000000, 9999999999); }
function randOrderId()     { return randInt(100000, 999999); }
function getTime()         { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST'; }

// Unique link — har baar fresh combination
function makeLink(platform, type) {
  const pool = LINK_POOLS[platform];
  if (!pool) return 'https://t.me/smmhuboffical';
  const p = pool[type] || pool[Object.keys(pool)[0]];

  if (platform === 'instagram') {
    if (type === 'profile') return `https://www.instagram.com/${pick(p)}/`;
    if (type === 'post')    return `https://www.instagram.com/p/${pick(p)}/`;
    if (type === 'reel')    return `https://www.instagram.com/reel/${pick(p)}/`;
    if (type === 'story')   return `https://www.instagram.com/stories/${pick(p)}/`;
  }
  if (platform === 'youtube') {
    if (type === 'channel') return `https://www.youtube.com/${pick(p)}`;
    return `https://www.youtube.com/watch?v=${pick(p)}`;
  }
  if (platform === 'facebook') {
    if (type === 'page')    return `https://www.facebook.com/${pick(p)}`;
    if (type === 'post')    return `https://www.facebook.com/photo?fbid=${pick(p)}`;
    return `https://www.facebook.com/${pick(p)}`;
  }
  if (platform === 'tiktok') {
    if (type === 'profile') return `https://www.tiktok.com/@${pick(p)}`;
    return `https://www.tiktok.com/@${pick(LINK_POOLS.tiktok.profile)}/video/${pick(p)}`;
  }
  if (platform === 'telegram') {
    if (type === 'channel') return `https://t.me/${pick(p)}`;
    const pair = pick(p); return `https://t.me/${pair[0]}/${pair[1] + randInt(0, 50)}`;
  }
  if (platform === 'twitter') {
    if (type === 'profile') return `https://twitter.com/${pick(p)}`;
    return `https://twitter.com/${pick(LINK_POOLS.twitter.profile)}/status/${pick(p)}`;
  }
  if (platform === 'spotify') {
    return `https://open.spotify.com/track/${pick(p)}`;
  }
  return 'https://t.me/smmhuboffical';
}

function formatQty(n) { return n >= 1000 ? (n/1000).toFixed(1) + 'K' : String(n); }
function randQty(svc) {
  if (svc.name.includes('Followers') || svc.name.includes('Subscribers') || svc.name.includes('Members')) return randInt(500, 10000);
  if (svc.name.includes('Views') || svc.name.includes('Streams') || svc.name.includes('Watch')) return randInt(2000, 50000);
  return randInt(200, 5000);
}

// ===================== MESSAGE TEMPLATES =====================
const TEMPLATES = [
  (d) => `╔══════════════════════╗
  🚀 *NEW ORDER RECEIVED*
╚══════════════════════╝

${d.emoji} *${d.service}*

🆔 Order: \`#${d.orderId}\`
👤 User ID: \`${d.userId}\`
🔗 Target: ${d.link}
📊 Quantity: *${d.qty}*
💸 Charged: *₹${d.amount}*
⚡ Status: \`Processing\`
🕐 Time: ${d.time}

━━━━━━━━━━━━━━━━━━━━━━
🤖 bot~@smmhubrobot`,

  (d) => `🛒 *Order Confirmed!*

┌─────────────────────
│ ${d.emoji} ${d.service}
└─────────────────────
📌 ID: \`#${d.orderId}\`
👤 Client: \`${d.userId}\`
🔗 ${d.link}
📈 Qty: *${d.qty}*
💰 Amount: *₹${d.amount}*
✅ Status: Processing...

🕐 ${d.time}
🤖 bot~@smmhubrobot`,

  (d) => `⚡️ *INSTANT ORDER ALERT*

🎯 Service: *${d.service}* ${d.emoji}
🆔 \`#${d.orderId}\`
👤 \`${d.userId}\`
🔗 ${d.link}
📊 *${d.qty} units*
💳 *₹${d.amount}* deducted
🟢 Live Processing

🕐 ${d.time} | 🤖 bot~@smmhubrobot`,

  (d) => `━━━━━━━━━━━━━━━━━━
${d.emoji} *${d.service}*
━━━━━━━━━━━━━━━━━━
🆔 *#${d.orderId}*
👤 User: \`${d.userId}\`
🔗 Target:
${d.link}
📊 Qty: *${d.qty}*
💰 Price: *₹${d.amount}*
✅ *Order Processing*
🕐 ${d.time}
━━━━━━━━━━━━━━━━━━
🤖 bot~@smmhubrobot`,

  (d) => `🔔 *New Campaign Started!*

${d.emoji} \`${d.service}\`

🆔 Campaign ID: \`#${d.orderId}\`
🎯 Target: ${d.link}
📦 Units: *${d.qty}*
💵 Cost: *₹${d.amount}*
👤 Client: \`${d.userId}\`
📡 Status: *LIVE ✅*

🕐 ${d.time} | @smmhubrobot`,

  (d) => `╭──────────────────────╮
│  💼 ORDER PROCESSING  │
╰──────────────────────╯
${d.emoji} *${d.service}*

🆔 Ref: \`#${d.orderId}\`
🧑 UID: \`${d.userId}\`
🔗 ${d.link}
📊 Volume: *${d.qty}*
💰 Billed: *₹${d.amount}*
🔄 Status: Running...
⏰ ${d.time}

🤖 bot~@smmhubrobot`,
];

// ===================== TELEGRAM API WRAPPERS =====================
async function tgPost(method, data) {
  const r = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, data);
  return r.data;
}

async function sendOrder() {
  if (paused) return;
  try {
    const svc    = pick(SERVICES);
    const qty    = randQty(svc);
    const amount = (qty * svc.rate).toFixed(2);
    const link   = makeLink(svc.platform, svc.type);
    const tmpl   = pick(TEMPLATES);

    const msg = tmpl({
      emoji: svc.emoji, service: svc.name,
      orderId: randOrderId(), userId: randUserId(),
      link, qty: formatQty(qty), amount, time: getTime(),
    });

    await tgPost('sendMessage', {
      chat_id: CHANNEL_ID, text: msg,
      parse_mode: 'Markdown', disable_web_page_preview: false
    });

    orderCount++;
    console.log(`[${getTime()}] ✅ Order #${orderCount} sent — ${svc.emoji} ${svc.name} ₹${amount}`);
    await updateControlPanel();
  } catch (err) {
    console.error('❌ Send error:', err.response?.data || err.message);
  }
}

// ===================== SCHEDULER =====================
function scheduleNext() {
  if (nextTimer)      { clearTimeout(nextTimer);   nextTimer = null; }
  if (countdownTick)  { clearInterval(countdownTick); countdownTick = null; }
  if (paused) return;

  const spd   = SPEEDS[currentSpeed];
  const mins  = spd.min + Math.random() * (spd.max - spd.min);
  nextInSec   = Math.round(mins * 60);

  countdownTick = setInterval(() => {
    if (nextInSec > 0) nextInSec--;
  }, 1000);

  nextTimer = setTimeout(async () => {
    await sendOrder();
    scheduleNext();
  }, mins * 60 * 1000);

  console.log(`⏳ Next order in ${mins.toFixed(1)} min — speed: ${currentSpeed}`);
}

// ===================== CONTROL PANEL =====================
function formatCountdown() {
  if (paused) return '⏸️ Paused';
  const m = Math.floor(nextInSec / 60);
  const s = nextInSec % 60;
  return `${m}m ${s}s`;
}

function buildControlText() {
  return `🎛️ *Fake Order Bot — Control Panel*

📊 Status: ${paused ? '⏸️ *PAUSED*' : '🟢 *RUNNING*'}
⚡ Speed: *${currentSpeed}*
📨 Orders Sent: *${orderCount}*
⏱️ Next Order In: *${formatCountdown()}*
🕐 Updated: ${getTime()}`;
}

function buildControlKeyboard() {
  return {
    inline_keyboard: [
      // Speed row 1
      [
        { text: '⚡ Ultra Fast', callback_data: 'speed_⚡ Ultra Fast' },
        { text: '🚀 Fast',       callback_data: 'speed_🚀 Fast'       },
        { text: '🟢 Normal',     callback_data: 'speed_🟢 Normal'     },
      ],
      // Speed row 2
      [
        { text: '🐢 Slow',   callback_data: 'speed_🐢 Slow'  },
        { text: '🌙 Night',  callback_data: 'speed_🌙 Night' },
      ],
      // Actions
      [
        { text: paused ? '▶️ Resume' : '⏸️ Pause', callback_data: 'toggle_pause' },
        { text: '📤 Send Now',   callback_data: 'send_now'     },
        { text: '🔄 Refresh',   callback_data: 'refresh'      },
      ],
      // Stats / Info
      [
        { text: '📊 Stats',      callback_data: 'stats'        },
        { text: '❓ Help',       callback_data: 'help'         },
      ],
    ]
  };
}

async function sendControlPanel(chatId) {
  try {
    const res = await tgPost('sendMessage', {
      chat_id: chatId,
      text: buildControlText(),
      parse_mode: 'Markdown',
      reply_markup: buildControlKeyboard(),
    });
    controlMsgId  = res.result.message_id;
    controlChatId = chatId;
  } catch(e) { console.error('Panel send error', e.response?.data || e.message); }
}

async function updateControlPanel() {
  if (!controlMsgId || !controlChatId) return;
  try {
    await tgPost('editMessageText', {
      chat_id: controlChatId,
      message_id: controlMsgId,
      text: buildControlText(),
      parse_mode: 'Markdown',
      reply_markup: buildControlKeyboard(),
    });
  } catch(e) { /* message not modified is fine */ }
}

// Auto-refresh panel every 10 seconds so countdown stays live
setInterval(updateControlPanel, 10000);

// ===================== POLLING (receive admin commands) =====================
let lastUpdateId = 0;

async function poll() {
  try {
    const res = await tgPost('getUpdates', { offset: lastUpdateId + 1, timeout: 20, allowed_updates: ['message','callback_query'] });
    const updates = res.result || [];

    for (const upd of updates) {
      lastUpdateId = upd.update_id;

      // ---- CALLBACK QUERY (button press) ----
      if (upd.callback_query) {
        const cb     = upd.callback_query;
        const fromId = String(cb.from.id);
        if (fromId !== ADMIN_ID) {
          await tgPost('answerCallbackQuery', { callback_query_id: cb.id, text: '❌ Not authorized' });
          continue;
        }

        controlChatId = cb.message.chat.id;
        controlMsgId  = cb.message.message_id;
        const data    = cb.data;
        let   toast   = '';

        if (data.startsWith('speed_')) {
          const newSpeed = data.replace('speed_', '');
          if (SPEEDS[newSpeed]) {
            currentSpeed = newSpeed;
            scheduleNext();
            toast = `Speed set to ${currentSpeed}`;
          }
        } else if (data === 'toggle_pause') {
          paused = !paused;
          if (paused) {
            if (nextTimer)     { clearTimeout(nextTimer);    nextTimer = null; }
            if (countdownTick) { clearInterval(countdownTick); countdownTick = null; }
            toast = '⏸️ Bot paused';
          } else {
            scheduleNext();
            toast = '▶️ Bot resumed';
          }
        } else if (data === 'send_now') {
          toast = '📤 Sending now...';
          await tgPost('answerCallbackQuery', { callback_query_id: cb.id, text: toast });
          await sendOrder();
          if (!paused) scheduleNext();
          await updateControlPanel();
          continue;
        } else if (data === 'refresh') {
          toast = '🔄 Refreshed!';
        } else if (data === 'stats') {
          const spd = SPEEDS[currentSpeed];
          toast = `📊 Sent: ${orderCount} | Speed: ${spd.min}-${spd.max}m | ${paused ? 'Paused' : 'Running'}`;
        } else if (data === 'help') {
          toast = '⚡Ultra Fast=30s-1m | 🚀Fast=1-2m | 🟢Normal=2-4m | 🐢Slow=5-10m | 🌙Night=10-20m';
        }

        await tgPost('answerCallbackQuery', { callback_query_id: cb.id, text: toast, show_alert: data === 'help' || data === 'stats' });
        await updateControlPanel();
        continue;
      }

      // ---- TEXT MESSAGE (commands) ----
      if (upd.message && upd.message.text) {
        const fromId = String(upd.message.from.id);
        const chatId = upd.message.chat.id;
        const text   = upd.message.text;

        if (fromId !== ADMIN_ID) continue;

        if (text === '/start' || text === '/panel' || text === '/control') {
          await sendControlPanel(chatId);
        } else if (text === '/status') {
          await tgPost('sendMessage', { chat_id: chatId, text: buildControlText(), parse_mode: 'Markdown' });
        }
      }
    }
  } catch(e) {
    console.error('Poll error:', e.message);
  }

  poll(); // keep polling
}

// ===================== START =====================
console.log('🚀 Fake Order Bot Starting...');
console.log(`📡 Admin ID: ${ADMIN_ID} | Channel: ${CHANNEL_ID}`);
console.log(`⚡ Speed: ${currentSpeed} | Send /panel to bot to open control panel`);

// Delete any existing webhook so polling works cleanly
tgPost('deleteWebhook', {}).then(() => {
  poll();
  sendOrder().then(() => scheduleNext());
});

// Keep-alive log
setInterval(() => {
  process.stdout.write(`\r⏰ ${getTime()} | ✅ Sent: ${orderCount} | Speed: ${currentSpeed} | Next: ${formatCountdown()}   `);
}, 2000);
