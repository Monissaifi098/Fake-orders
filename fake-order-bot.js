const axios = require('axios');

// ===================== CONFIG =====================
const BOT_TOKEN    = "7973091198:AAGLgaPPUZ3eToh9D_rJlkvOPby6k3zngFw";
const CHANNEL_ID   = "@smmhuboffical";
const ADMIN_ID     = "6270522295";

// ===================== SPEED MODES (minutes) =====================
const SPEEDS = {
  '⚡ Ultra Fast': { min: 0.5,  max: 1   },
  '🚀 Fast':       { min: 1,    max: 2   },
  '🟢 Normal':     { min: 2,    max: 4   },
  '🐢 Slow':       { min: 5,    max: 10  },
  '🌙 Night':      { min: 10,   max: 20  },
};

// ===================== STATE =====================
let currentSpeed      = '🟢 Normal';
let paused            = false;
let orderCount        = 0;
let totalRevenue      = 0;
let nextInSec         = 0;
let nextTimer         = null;
let countdownTick     = null;
let controlMsgId      = null;
let controlChatId     = null;
let filterPlatform    = 'all';        // 'all' | 'instagram' | 'youtube' | etc.
let customAmountMin   = 0.1;          // ₹ min
let customAmountMax   = 150;          // ₹ max
let autoDeleteSec     = randBetween(120, 180); // 2-3 min
let broadcastMsg      = '';
let sessionStart      = Date.now();

// ===================== SERVICES =====================
const SERVICES = [
  { name: "Instagram Followers",   emoji: "📸", platform: "instagram", type: "profile", rate: 0.12 },
  { name: "Instagram Likes",       emoji: "❤️",  platform: "instagram", type: "post",    rate: 0.04 },
  { name: "Instagram Reel Views",  emoji: "🎬", platform: "instagram", type: "reel",    rate: 0.02 },
  { name: "Instagram Story Views", emoji: "👁️",  platform: "instagram", type: "story",   rate: 0.015},
  { name: "Instagram Comments",    emoji: "💬", platform: "instagram", type: "post",    rate: 0.35 },
  { name: "YouTube Views",         emoji: "▶️",  platform: "youtube",   type: "video",   rate: 0.025},
  { name: "YouTube Subscribers",   emoji: "🔔", platform: "youtube",   type: "channel", rate: 0.45 },
  { name: "YouTube Likes",         emoji: "👍", platform: "youtube",   type: "video",   rate: 0.05 },
  { name: "YouTube Watch Time",    emoji: "⏱️",  platform: "youtube",   type: "video",   rate: 0.38 },
  { name: "Facebook Page Likes",   emoji: "👥", platform: "facebook",  type: "page",    rate: 0.09 },
  { name: "Facebook Post Likes",   emoji: "👍", platform: "facebook",  type: "post",    rate: 0.04 },
  { name: "Facebook Followers",    emoji: "➕", platform: "facebook",  type: "profile", rate: 0.08 },
  { name: "TikTok Followers",      emoji: "🎵", platform: "tiktok",    type: "profile", rate: 0.08 },
  { name: "TikTok Views",          emoji: "👀", platform: "tiktok",    type: "video",   rate: 0.01 },
  { name: "TikTok Likes",          emoji: "❤️",  platform: "tiktok",    type: "video",   rate: 0.03 },
  { name: "Telegram Members",      emoji: "✈️",  platform: "telegram",  type: "channel", rate: 0.11 },
  { name: "Telegram Post Views",   emoji: "👁️",  platform: "telegram",  type: "post",    rate: 0.008},
  { name: "Twitter/X Followers",   emoji: "🐦", platform: "twitter",   type: "profile", rate: 0.14 },
  { name: "Twitter/X Likes",       emoji: "💙", platform: "twitter",   type: "tweet",   rate: 0.04 },
  { name: "Spotify Streams",       emoji: "🎶", platform: "spotify",   type: "track",   rate: 0.03 },
];

// ===================== LINK POOLS =====================
const LINK_POOLS = {
  instagram: {
    profile: ["travel.india.vibes","foodie.express","techwithrohit","fitnesswithpriya","cricket_updates99","desi.memes.hub","glamour.by.aisha","ishan.vlogs","the.art.studio.in","motivation.urdu","daily_fashion_india","rohan.edits","priya_life_vlog","music.with.aryan","comedy.with.raj"],
    post:    ["C9xKmLtPqRs","C8wJnMuPpQt","C7vImLtOpRs","C6uHlKsNoQr","C5tGkJrMnPq","C4sFjIqLmOp","C3rEiHpKlNm","C2qDhGoJkMl","C1pCgFoIjLk","CAxBfEnHiKj","CByCeDoGhJi","CCxDcNfGiIh"],
    reel:    ["C9xKmLtPqRs","C8wJnMuPpQt","C7vImLtOpRs","C6uHlKsNoQr","C5tGkJrMnPq","CABcDeFgHiJ","CBCdEfGhIjK","CCDeFgHiJkL"],
    story:   ["travel.india.vibes","foodie.express","techwithrohit","fitnesswithpriya","ishan.vlogs"],
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
function randInt(min, max)   { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randBetween(a, b)   { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr)           { return arr[randInt(0, arr.length - 1)]; }
function randUserId()        { return randInt(1000000000, 9999999999); }
function randOrderId()       { return randInt(100000, 999999); }
function getTime()           { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST'; }
function uptime()            { const s = Math.floor((Date.now()-sessionStart)/1000); return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`; }

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

// ===================== REALISTIC AMOUNT (₹0.1 - ₹150) =====================
function realisticAmount() {
  const r = Math.random();
  // 55% chance: ₹0.1–₹20   (small orders — most common)
  // 30% chance: ₹20–₹80    (medium)
  // 15% chance: ₹80–₹150   (big orders)
  let amt;
  if (r < 0.55)      amt = (Math.random() * 19.9  + 0.1).toFixed(2);
  else if (r < 0.85) amt = (Math.random() * 60    + 20 ).toFixed(2);
  else               amt = (Math.random() * 70    + 80 ).toFixed(2);

  // Clamp to admin-set range
  amt = Math.max(customAmountMin, Math.min(customAmountMax, parseFloat(amt)));
  return amt.toFixed(2);
}

// ===================== BATTERY ANIMATION BUILDER =====================
function batteryFrames(amount) {
  const pct = Math.min(100, Math.round((parseFloat(amount) / 150) * 100));
  const filled = Math.round(pct / 10);
  const bars   = '█'.repeat(filled) + '░'.repeat(10 - filled);
  return `[${bars}] ${pct}%`;
}

// ===================== ANIMATED NOTIFICATION TEMPLATES =====================
const ANIM_HEADERS = [
  '🔥','💥','⚡','🚀','✨','🎯','💫','🌟','🎉','🏆',
];
const LOADING_DOTS = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

function buildAnimMsg(d) {
  const hdr   = pick(ANIM_HEADERS);
  const dot   = pick(LOADING_DOTS);
  const batt  = batteryFrames(d.amount);
  const bar   = ['▓▓▓▓▓▓▓▓▓▓','▒▒▒▒▒▒▒▒▒▒','░░░░░░░░░░'];
  const style = randInt(0, 2);

  const templates = [
    // Style A — battery + fire
    `${hdr} *ORDER ALERT* ${hdr}

${d.emoji} *${d.service}*

🔋 *Amount Meter*
${batt}
💸 *₹${d.amount} Charged!*

🆔 \`#${d.orderId}\`
👤 User: \`${d.userId}\`
🔗 ${d.link}
📊 Qty: *${d.qty}*
${dot} Status: *Processing...*

⏰ ${d.time}
🤖 @smmhubrobot`,

    // Style B — glowing progress
    `╔══════════════════╗
   ${hdr} *NEW ORDER* ${hdr}
╚══════════════════╝

${d.emoji} *${d.service}*

⚡ *Progress*
${bar[style]}▶ *LIVE*

🆔 \`#${d.orderId}\`
👤 \`${d.userId}\`
🔗 ${d.link}
📦 *${d.qty} units*
💰 *₹${d.amount}*
✅ Status: Running

🕐 ${d.time} | 🤖 @smmhubrobot`,

    // Style C — minimal animated
    `${hdr}${hdr}${hdr} *SMMHUB ORDER* ${hdr}${hdr}${hdr}

${d.emoji} \`${d.service}\`
━━━━━━━━━━━━━━━━━━━━

🔋 ${batt}
💳 *₹${d.amount} deducted*

🆔 *#${d.orderId}*
👤 *${d.userId}*
🔗 ${d.link}
📈 *${d.qty}* units
${dot} *Processing Live*

⏰ ${d.time}
✈️ @smmhubrobot`,

    // Style D — premium box
    `┌─────────────────────┐
│  ${hdr} *ORDER RECEIVED*  ${hdr}  │
└─────────────────────┘

${d.emoji} *${d.service}*

🔋 *Wallet Meter*
${batt}
💸 *₹${d.amount}*

┌──────────────────────
│ 🆔 #${d.orderId}
│ 👤 ${d.userId}
│ 📊 ${d.qty} units
│ 🔗 ${d.link}
│ ✅ Processing
└──────────────────────
🕐 ${d.time} | 🤖 @smmhubrobot`,

    // Style E — fire blast
    `🔥🔥🔥 *FIRE ORDER ALERT* 🔥🔥🔥

${d.emoji} *${d.service}*

💥 *BOOM! Order placed*
🔋 ${batt}

🎯 Amount: *₹${d.amount}*
🆔 Order: \`#${d.orderId}\`
👤 User: \`${d.userId}\`
🔗 ${d.link}
📊 *${d.qty}* units
⚡ *LIVE PROCESSING*

⏰ ${d.time}
🚀 @smmhubrobot`,
  ];

  return pick(templates);
}

// ===================== TELEGRAM API =====================
async function tgPost(method, data) {
  const r = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, data);
  return r.data;
}

// ===================== SEND ORDER (with auto-delete) =====================
async function sendOrder() {
  if (paused) return;
  try {
    // Service filter
    let pool = SERVICES;
    if (filterPlatform !== 'all') pool = SERVICES.filter(s => s.platform === filterPlatform);
    if (!pool.length) pool = SERVICES;

    const svc    = pick(pool);
    const qty    = randQty(svc);
    const amount = realisticAmount();   // ₹0.1–₹150
    const link   = makeLink(svc.platform, svc.type);

    const d = {
      emoji: svc.emoji, service: svc.name,
      orderId: randOrderId(), userId: randUserId(),
      link, qty: formatQty(qty), amount, time: getTime(),
    };

    const msg = buildAnimMsg(d);

    const res = await tgPost('sendMessage', {
      chat_id: CHANNEL_ID,
      text: msg,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });

    const msgId = res.result.message_id;
    orderCount++;
    totalRevenue += parseFloat(amount);
    console.log(`[${getTime()}] ✅ Order #${orderCount} — ${svc.emoji} ${svc.name} ₹${amount} | MsgID: ${msgId}`);

    // Auto-delete after 2–3 minutes
    const delayMs = randBetween(120, 180) * 1000;
    setTimeout(async () => {
      try {
        await tgPost('deleteMessage', { chat_id: CHANNEL_ID, message_id: msgId });
        console.log(`[${getTime()}] 🗑️ Auto-deleted msg ${msgId}`);
      } catch (e) {
        console.log(`[${getTime()}] ⚠️ Delete failed (may be too old): ${e.message}`);
      }
    }, delayMs);

    await updateControlPanel();
  } catch (err) {
    console.error('❌ Send error:', err.response?.data || err.message);
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

  nextTimer = setTimeout(async () => {
    await sendOrder();
    scheduleNext();
  }, mins * 60 * 1000);

  console.log(`⏳ Next order in ${mins.toFixed(1)} min`);
}

// ===================== CONTROL PANEL =====================
function formatCountdown() {
  if (paused) return '⏸️ Paused';
  const m = Math.floor(nextInSec / 60);
  const s = nextInSec % 60;
  return `${m}m ${s}s`;
}

const PLATFORM_EMOJIS = {
  all: '🌐', instagram: '📸', youtube: '▶️', facebook: '👥',
  tiktok: '🎵', telegram: '✈️', twitter: '🐦', spotify: '🎶',
};

function buildControlText() {
  return `🎛️ *Fire Order Bot — Control Panel v5*

📊 Status: ${paused ? '⏸️ *PAUSED*' : '🟢 *RUNNING*'}
⚡ Speed: *${currentSpeed}*
📨 Orders Sent: *${orderCount}*
💰 Total Revenue: *₹${totalRevenue.toFixed(2)}*
⏱️ Next Order In: *${formatCountdown()}*
🎯 Platform Filter: *${PLATFORM_EMOJIS[filterPlatform]} ${filterPlatform.toUpperCase()}*
💸 Amount Range: *₹${customAmountMin} – ₹${customAmountMax}*
🗑️ Auto-Delete: *2–3 min after send*
⏰ Uptime: *${uptime()}*
🕐 Updated: ${getTime()}`;
}

function buildControlKeyboard() {
  return {
    inline_keyboard: [
      // Speed
      [
        { text: '⚡ Ultra Fast', callback_data: 'speed_⚡ Ultra Fast' },
        { text: '🚀 Fast',       callback_data: 'speed_🚀 Fast'       },
        { text: '🟢 Normal',     callback_data: 'speed_🟢 Normal'     },
      ],
      [
        { text: '🐢 Slow',  callback_data: 'speed_🐢 Slow'  },
        { text: '🌙 Night', callback_data: 'speed_🌙 Night' },
      ],
      // Actions row 1
      [
        { text: paused ? '▶️ Resume' : '⏸️ Pause', callback_data: 'toggle_pause' },
        { text: '📤 Send Now',  callback_data: 'send_now'  },
        { text: '🔄 Refresh',  callback_data: 'refresh'   },
      ],
      // Actions row 2
      [
        { text: '📊 Stats',        callback_data: 'stats'         },
        { text: '🔄 Reset Stats',  callback_data: 'reset_stats'   },
        { text: '❓ Help',         callback_data: 'help'          },
      ],
      // Platform filter
      [
        { text: '🌐 All',  callback_data: 'filter_all'       },
        { text: '📸 IG',   callback_data: 'filter_instagram' },
        { text: '▶️ YT',   callback_data: 'filter_youtube'   },
        { text: '👥 FB',   callback_data: 'filter_facebook'  },
      ],
      [
        { text: '🎵 TikTok',  callback_data: 'filter_tiktok'   },
        { text: '✈️ TG',      callback_data: 'filter_telegram' },
        { text: '🐦 Twitter', callback_data: 'filter_twitter'  },
        { text: '🎶 Spotify', callback_data: 'filter_spotify'  },
      ],
      // Amount range presets
      [
        { text: '💸 ₹0.1–20',   callback_data: 'amt_low'   },
        { text: '💰 ₹20–80',    callback_data: 'amt_mid'   },
        { text: '💎 ₹80–150',   callback_data: 'amt_high'  },
        { text: '🌈 ₹0.1–150',  callback_data: 'amt_all'   },
      ],
      // Bot link
      [
        { text: '🤖 Open SMMHU Bot', url: 'https://t.me/smmhubrobot' },
        { text: '📢 Open Channel',   url: 'https://t.me/smmhuboffical' },
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
  } catch(e) { /* message not modified — ignore */ }
}

// Auto-refresh panel every 10s
setInterval(updateControlPanel, 10000);

// ===================== POLLING =====================
let lastUpdateId = 0;

async function poll() {
  try {
    const res = await tgPost('getUpdates', { offset: lastUpdateId + 1, timeout: 20, allowed_updates: ['message','callback_query'] });
    const updates = res.result || [];

    for (const upd of updates) {
      lastUpdateId = upd.update_id;

      // ---- CALLBACK QUERY ----
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

        // Speed
        if (data.startsWith('speed_')) {
          const newSpeed = data.replace('speed_', '');
          if (SPEEDS[newSpeed]) {
            currentSpeed = newSpeed;
            scheduleNext();
            toast = `✅ Speed: ${currentSpeed}`;
          }
        }
        // Pause/Resume
        else if (data === 'toggle_pause') {
          paused = !paused;
          if (paused) {
            if (nextTimer)     { clearTimeout(nextTimer);    nextTimer = null; }
            if (countdownTick) { clearInterval(countdownTick); countdownTick = null; }
            toast = '⏸️ Bot paused';
          } else {
            scheduleNext();
            toast = '▶️ Bot resumed!';
          }
        }
        // Send Now
        else if (data === 'send_now') {
          toast = '📤 Sending now...';
          await tgPost('answerCallbackQuery', { callback_query_id: cb.id, text: toast });
          await sendOrder();
          if (!paused) scheduleNext();
          await updateControlPanel();
          continue;
        }
        // Refresh
        else if (data === 'refresh') {
          toast = '🔄 Panel refreshed!';
        }
        // Stats
        else if (data === 'stats') {
          const spd = SPEEDS[currentSpeed];
          toast = `📊 Orders: ${orderCount} | Revenue: ₹${totalRevenue.toFixed(2)} | Speed: ${spd.min}-${spd.max}m | Uptime: ${uptime()}`;
        }
        // Reset Stats
        else if (data === 'reset_stats') {
          orderCount    = 0;
          totalRevenue  = 0;
          sessionStart  = Date.now();
          toast = '🔄 Stats reset! Starting fresh 🚀';
        }
        // Help
        else if (data === 'help') {
          toast = '⚡Ultra=30s-1m | 🚀Fast=1-2m | 🟢Normal=2-4m | 🐢Slow=5-10m | 🌙Night=10-20m | 🗑️Auto-delete 2-3min';
        }
        // Platform filter
        else if (data.startsWith('filter_')) {
          filterPlatform = data.replace('filter_', '');
          toast = `🎯 Filter: ${PLATFORM_EMOJIS[filterPlatform]} ${filterPlatform.toUpperCase()}`;
        }
        // Amount presets
        else if (data === 'amt_low') {
          customAmountMin = 0.1; customAmountMax = 20;
          toast = '💸 Amount: ₹0.1–₹20 (small orders)';
        }
        else if (data === 'amt_mid') {
          customAmountMin = 20; customAmountMax = 80;
          toast = '💰 Amount: ₹20–₹80 (medium orders)';
        }
        else if (data === 'amt_high') {
          customAmountMin = 80; customAmountMax = 150;
          toast = '💎 Amount: ₹80–₹150 (big orders)';
        }
        else if (data === 'amt_all') {
          customAmountMin = 0.1; customAmountMax = 150;
          toast = '🌈 Amount: ₹0.1–₹150 (all range)';
        }

        await tgPost('answerCallbackQuery', { callback_query_id: cb.id, text: toast, show_alert: ['help','stats','reset_stats'].includes(data) });
        await updateControlPanel();
        continue;
      }

      // ---- TEXT MESSAGE ----
      if (upd.message && upd.message.text) {
        const fromId = String(upd.message.from.id);
        const chatId = upd.message.chat.id;
        const text   = upd.message.text.trim();

        if (fromId !== ADMIN_ID) continue;

        if (['/start','/panel','/control'].includes(text)) {
          await sendControlPanel(chatId);

        } else if (text === '/status') {
          await tgPost('sendMessage', { chat_id: chatId, text: buildControlText(), parse_mode: 'Markdown' });

        } else if (text === '/stats') {
          const msg = `📊 *Session Stats*\n\n📨 Orders: *${orderCount}*\n💰 Revenue: *₹${totalRevenue.toFixed(2)}*\n⏰ Uptime: *${uptime()}*\n🎯 Filter: *${filterPlatform}*\n⚡ Speed: *${currentSpeed}*`;
          await tgPost('sendMessage', { chat_id: chatId, text: msg, parse_mode: 'Markdown' });

        } else if (text === '/send') {
          await tgPost('sendMessage', { chat_id: chatId, text: '📤 Sending manual order...' });
          await sendOrder();

        } else if (text === '/pause') {
          paused = true;
          if (nextTimer)     clearTimeout(nextTimer);
          if (countdownTick) clearInterval(countdownTick);
          await tgPost('sendMessage', { chat_id: chatId, text: '⏸️ Bot paused.' });

        } else if (text === '/resume') {
          paused = false;
          scheduleNext();
          await tgPost('sendMessage', { chat_id: chatId, text: '▶️ Bot resumed!' });

        } else if (text === '/reset') {
          orderCount = 0; totalRevenue = 0; sessionStart = Date.now();
          await tgPost('sendMessage', { chat_id: chatId, text: '🔄 Stats reset!' });

        } else if (text.startsWith('/filter ')) {
          const plat = text.replace('/filter ','').toLowerCase().trim();
          if (PLATFORM_EMOJIS[plat]) {
            filterPlatform = plat;
            await tgPost('sendMessage', { chat_id: chatId, text: `🎯 Filter set: ${PLATFORM_EMOJIS[plat]} ${plat}` });
          } else {
            await tgPost('sendMessage', { chat_id: chatId, text: `❌ Unknown platform. Use: all, instagram, youtube, facebook, tiktok, telegram, twitter, spotify` });
          }

        } else if (text === '/help') {
          const helpMsg = `🤖 *Bot Commands*

/start — Open control panel
/status — Current status
/stats — Session statistics
/send — Send order now
/pause — Pause bot
/resume — Resume bot
/reset — Reset stats
/filter <platform> — Filter by platform
  (all, instagram, youtube, facebook, tiktok, telegram, twitter, spotify)
/help — This message`;
          await tgPost('sendMessage', { chat_id: chatId, text: helpMsg, parse_mode: 'Markdown' });
        }
      }
    }
  } catch(e) {
    console.error('Poll error:', e.message);
  }
  poll();
}

// ===================== START =====================
console.log('🔥 Fire Order Bot v5 Starting...');
console.log(`📡 Admin: ${ADMIN_ID} | Channel: ${CHANNEL_ID}`);
console.log(`⚡ Speed: ${currentSpeed} | Amount: ₹${customAmountMin}–₹${customAmountMax}`);
console.log(`🗑️ Auto-delete: 2–3 min after each order`);
console.log(`\n➡️ Send /panel to bot to open control panel\n`);

tgPost('deleteWebhook', {}).then(() => {
  poll();
  sendOrder().then(() => scheduleNext());
});

// Keep-alive log
setInterval(() => {
  process.stdout.write(`\r⏰ ${getTime()} | ✅ Sent: ${orderCount} | 💰 ₹${totalRevenue.toFixed(2)} | Speed: ${currentSpeed} | Next: ${formatCountdown()}   `);
}, 2000);
