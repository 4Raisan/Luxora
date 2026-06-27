const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const isMock = String(process.env.MOCK_WHATSAPP).toLowerCase() === 'true';

let client = null;
let isReady = false;

function initWhatsAppClient() {
  if (isMock || client) {
    return;
  }

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('[WhatsApp] Scan QR to connect.');
  });

  client.on('ready', () => {
    isReady = true;
    console.log('[WhatsApp] Client is ready.');
  });

  client.on('disconnected', () => {
    isReady = false;
    console.log('[WhatsApp] Client disconnected.');
  });

  client.initialize().catch((error) => {
    console.error('[WhatsApp] Initialization failed:', error.message);
  });
}

function isWhatsAppReady() {
  return isMock || isReady;
}

async function sendWhatsAppAlert(to, message) {
  if (!to || !message) {
    throw new Error('WhatsApp number and message are required');
  }

  if (isMock) {
    console.log(`[MOCK WhatsApp] To: ${to} | ${message}`);
    return { mocked: true };
  }

  if (!client || !isReady) {
    throw new Error('WhatsApp client is not ready');
  }

  const chatId = `${to.replace(/\D/g, '')}@c.us`;
  return client.sendMessage(chatId, message);
}

module.exports = {
  initWhatsAppClient,
  isWhatsAppReady,
  sendWhatsAppAlert
};
