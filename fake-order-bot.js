const axios = require('axios');

// ===================== CONFIG =====================
const BOT_TOKEN   = "7973091198:AAGLgaPPUZ3eToh9D_rJlkvOPby6k3zngFw";
const CHANNEL_ID  = "@smmhuboffical";
const MIN_MINUTES = 2;   // ← minimum gap (minutes)
const MAX_MINUTES = 4;   // ← maximum gap (minutes)  change karo jab chahiye

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

// ===================== REAL-STYLE LINKS =====================
const LINK_POOLS = {
  instagram: {
    profile: ["https://www.instagram.com/travel.india.vibes/","https://www.instagram.com/foodie.express/","https://www.instagram.com/techwithrohit/","https://www.instagram.com/fitnesswithpriya/","https://www.instagram.com/cricket_updates99/","https://www.instagram.com/desi.memes.hub/","https://www.instagram.com/glamour.by.aisha/","https://www.instagram.com/ishan.vlogs/","https://www.instagram.com/the.art.studio.in/","https://www.instagram.com/motivation.urdu/"],
    post:    ["https://www.instagram.com/p/C9xKmLtPqRs/","https://www.instagram.com/p/C8wJnMuPpQt/","https://www.instagram.com/p/C7vImLtOpRs/","https://www.instagram.com/p/C6uHlKsNoQr/","https://www.instagram.com/p/C5tGkJrMnPq/","https://www.instagram.com/p/C4sFjIqLmOp/","https://www.instagram.com/p/C3rEiHpKlNm/","https://www.instagram.com/p/C2qDhGoJkMl/"],
    reel:    ["https://www.instagram.com/reel/C9xKmLtPqRs/","https://www.instagram.com/reel/C8wJnMuPpQt/","https://www.instagram.com/reel/C7vImLtOpRs/","https://www.instagram.com/reel/C6uHlKsNoQr/","https://www.instagram.com/reel/C5tGkJrMnPq/"],
    story:   ["https://www.instagram.com/stories/travel.india.vibes/","https://www.instagram.com/stories/foodie.express/","https://www.instagram.com/stories/techwithrohit/"],
  },
  youtube: {
    channel: ["https://www.youtube.com/@TechWithRohit","https://www.youtube.com/@DesiKhana","https://www.youtube.com/@CricketTalkIndia","https://www.youtube.com/@MotivationHindiHub","https://www.youtube.com/@FitnessWithPriya","https://www.youtube.com/@VlogsByIshan","https://www.youtube.com/@TheArtStudioIn"],
    video:   ["https://www.youtube.com/watch?v=dQw4w9WgXcQ","https://www.youtube.com/watch?v=9bZkp7q19f0","https://www.youtube.com/watch?v=kJQP7kiw5Fk","https://www.youtube.com/watch?v=OPf0YbXqDm0","https://www.youtube.com/watch?v=JGwWNGJdvx8","https://www.youtube.com/watch?v=hT_nvWreIhg"],
  },
  facebook: {
    page:    ["https://www.facebook.com/TechNewsIndia","https://www.facebook.com/DesiMemeHub","https://www.facebook.com/CricketFansIndia","https://www.facebook.com/FoodieExpressIN","https://www.facebook.com/MotivationHindiPage"],
    post:    ["https://www.facebook.com/photo?fbid=1234567890123","https://www.facebook.com/photo?fbid=9876543210987","https://www.facebook.com/permalink.php?story_fbid=112233445566","https://www.facebook.com/permalink.php?story_fbid=998877665544"],
    profile: ["https://www.facebook.com/rohit.sharma.official","https://www.facebook.com/priya.fitness.india","https://www.facebook.com/ishan.vlogs.in"],
  },
  tiktok: {
    profile: ["https://www.tiktok.com/@techwithrohit","https://www.tiktok.com/@desi.memes.hub","https://www.tiktok.com/@foodie.express","https://www.tiktok.com/@fitness.with.priya","https://www.tiktok.com/@cricket_india99"],
    video:   ["https://www.tiktok.com/@techwithrohit/video/7123456789012345678","https://www.tiktok.com/@foodie.express/video/7234567890123456789","https://www.tiktok.com/@desi.memes.hub/video/7345678901234567890"],
  },
  telegram: {
    channel: ["https://t.me/TechNewsIndia","https://t.me/DesiMemeHub","https://t.me/CricketFansIndia","https://t.me/MotivationHindi","https://t.me/FoodieExpressIN","https://t.me/StudyWithUs_India"],
    post:    ["https://t.me/TechNewsIndia/142","https://t.me/DesiMemeHub/98","https://t.me/CricketFansIndia/203","https://t.me/MotivationHindi/77"],
  },
  twitter: {
    profile: ["https://twitter.com/techwithrohit","https://twitter.com/desi_meme_hub","https://twitter.com/cricket_india99","https://twitter.com/priya_fitness_in"],
    tweet:   ["https://twitter.com/techwithrohit/status/1234567890123456789","https://twitter.com/cricket_india99/status/9876543210987654321","https://twitter.com/desi_meme_hub/status/1122334455667788990"],
  },
  spotify: {
    track:   ["https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC","https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3","https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUIOKE"],
  },
};

// ===================== MESSAGE TEMPLATES =====================
// 6 alag alag formats — random rotate hoga
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
🔗 Target Link:
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

// ===================== HELPERS =====================
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function randUserId() {
  return randInt(1000000000, 9999999999);
}
function randOrderId() {
  return randInt(100000, 999999);
}
function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST';
}
function pickLink(platform, type) {
  const pool = LINK_POOLS[platform];
  if (!pool) return 'https://t.me/smmhuboffical';
  const typePool = pool[type] || pool[Object.keys(pool)[0]];
  return pick(typePool);
}
function randQty(svc) {
  if (svc.name.includes('Followers') || svc.name.includes('Subscribers') || svc.name.includes('Members')) return randInt(500, 10000);
  if (svc.name.includes('Views') || svc.name.includes('Streams') || svc.name.includes('Watch')) return randInt(2000, 50000);
  return randInt(200, 5000);
}
function formatQty(n) {
  return n >= 1000 ? (n/1000).toFixed(1) + 'K' : String(n);
}

// ===================== LIVE CLOCK IN CONSOLE =====================
let orderCount = 0;
let clockInterval;

function startClock() {
  process.stdout.write('\x1Bc'); // clear screen
  clockInterval = setInterval(() => {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    process.stdout.write(`\r⏰ ${now} IST | ✅ Orders sent: ${orderCount} | Next in: ${nextInSec}s   `);
  }, 1000);
}

// ===================== SEND ORDER =====================
let nextInSec = 0;
let countdownInterval;

async function sendOrder() {
  try {
    const svc    = pick(SERVICES);
    const qty    = randQty(svc);
    const amount = (qty * svc.rate).toFixed(2);
    const link   = pickLink(svc.platform, svc.type);
    const tmpl   = pick(TEMPLATES);

    const msg = tmpl({
      emoji:   svc.emoji,
      service: svc.name,
      orderId: randOrderId(),
      userId:  randUserId(),
      link,
      qty:     formatQty(qty),
      amount,
      time:    getTime(),
    });

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id:    CHANNEL_ID,
      text:       msg,
      parse_mode: 'Markdown',
      disable_web_page_preview: false
    });

    orderCount++;
    console.log(`\n✅ [${getTime()}] Order sent — ${svc.emoji} ${svc.name} | ₹${amount}`);
  } catch (err) {
    console.error('\n❌ Error:', err.response?.data || err.message);
  }
}

// ===================== SCHEDULER =====================
function scheduleNext() {
  const mins  = randInt(MIN_MINUTES, MAX_MINUTES);
  nextInSec   = mins * 60;

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => { if (nextInSec > 0) nextInSec--; }, 1000);

  setTimeout(async () => {
    await sendOrder();
    scheduleNext();
  }, mins * 60 * 1000);
}

// ===================== START =====================
console.log('🚀 Fake Order Bot Starting...');
startClock();
sendOrder().then(() => scheduleNext());
