// ================= FAKE ORDER NOTIFICATION BOT =================
// Random fake orders generate karke Telegram channel pe bhejta hai
// Har 5-10 minute me ek random order notification

const axios = require('axios');

// ================= CONFIG (yaha apni details daalo) =================
const BOT_TOKEN = "7973091198:AAGLgaPPUZ3eToh9D_rJlkvOPby6k3zngFw";
const CHANNEL_ID = "@smmhuboffical";

// Random services list (apne panel ke real service names/IDs daal sakte ho)
const SERVICES = [
  { id: 101, name: "Instagram Followers" },
  { id: 102, name: "Instagram Likes" },
  { id: 103, name: "Instagram Views" },
  { id: 104, name: "YouTube Views" },
  { id: 105, name: "YouTube Subscribers" },
  { id: 106, name: "YouTube Likes" },
  { id: 107, name: "Facebook Page Likes" },
  { id: 108, name: "Facebook Followers" },
  { id: 109, name: "TikTok Followers" },
  { id: 110, name: "TikTok Views" },
  { id: 111, name: "Telegram Members" },
  { id: 112, name: "Telegram Post Views" },
  { id: 113, name: "Twitter Followers" },
  { id: 114, name: "Twitter Likes" },
];

// Random link samples (link ka domain service ke hisab se pick hota hai)
const LINK_SAMPLES = {
  "Instagram": ["https://instagram.com/user{n}"],
  "YouTube": ["https://youtube.com/@user{n}"],
  "Facebook": ["https://facebook.com/user{n}"],
  "TikTok": ["https://tiktok.com/@user{n}"],
  "Telegram": ["https://t.me/channel{n}"],
  "Twitter": ["https://twitter.com/user{n}"],
};

// ================= HELPERS =================
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChatId() {
  // Fake telegram-style numeric user id (9-10 digit)
  return randInt(1000000000, 9999999999);
}

function randomOrderId() {
  return randInt(100000, 999999);
}

function pickService() {
  return SERVICES[randInt(0, SERVICES.length - 1)];
}

function pickLink(serviceName) {
  const platform = Object.keys(LINK_SAMPLES).find(p => serviceName.includes(p)) || "Telegram";
  const domains = {
    "Instagram": "instagram.com",
    "YouTube": "youtube.com",
    "Facebook": "facebook.com",
    "TikTok": "tiktok.com",
    "Telegram": "t.me",
    "Twitter": "twitter.com",
  };
  const domain = domains[platform] || "t.me";
  const stars = "*".repeat(randInt(6, 10));
  return `${domain}/${stars}`;
}

function randomQuantity(serviceName) {
  if (serviceName.includes("Followers") || serviceName.includes("Subscribers") || serviceName.includes("Members")) {
    return randInt(100, 5000);
  }
  return randInt(500, 20000); // Views/Likes
}

function randomAmount(qty) {
  // Rough fake pricing — adjust rate as needed
  const rate = (Math.random() * (0.09 - 0.02) + 0.02).toFixed(4);
  return (qty * rate).toFixed(2);
}

// ================= SEND NOTIFICATION =================
async function sendFakeOrderNotification() {
  try {
    const service = pickService();
    const qty = randomQuantity(service.name);
    const amount = randomAmount(qty);
    const orderId = randomOrderId();
    const chatId = randomChatId();
    const link = pickLink(service.name);

    const message =
`🛒 *New Order Placed!*

🆔 Order ID: \`#${orderId}\`
👤 User: \`${chatId}\`
📦 Service: ${service.name}
🔗 Link: ${link}
📊 Quantity: ${qty.toLocaleString()}
💰 Amount: ₹${amount}
✅ Status: Processing

bot~@smmhubrobot`;

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHANNEL_ID,
      text: message,
      parse_mode: "Markdown"
    });

    console.log(`[${new Date().toLocaleTimeString()}] Sent fake order #${orderId} - ${service.name}`);
  } catch (err) {
    console.error("Error sending notification:", err.response?.data || err.message);
  }
}

// ================= SCHEDULER (random 5-10 min gap) =================
function scheduleNext() {
  const delayMinutes = randInt(5, 10);
  const delayMs = delayMinutes * 60 * 1000;
  console.log(`Next fake order in ${delayMinutes} minutes...`);

  setTimeout(async () => {
    await sendFakeOrderNotification();
    scheduleNext(); // repeat
  }, delayMs);
}

// ================= START =================
console.log("Fake Order Notification Bot Started...");
sendFakeOrderNotification(); // pehla order turant bhejo
scheduleNext();              // fir random gap se repeat
