const settings = require('./settings');
const axios = require('axios');

module.exports = async (meon, msg) => {
    const { key, message, pushName } = msg;
    const chatId = key.remoteJid;
    if (!message) return;

    let text = message.conversation || message.extendedTextMessage?.text || '';
    if (!text.startsWith(settings.prefix)) return;

    console.log(`📩 Menerima perintah dari ${pushName || chatId}: ${text}`);

    const args = text.slice(settings.prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'ping':
            await meon.sendMessage(chatId, { text: 'Pong!' });
            break;

        case 'info':
            await meon.sendMessage(chatId, { text: `🤖 Nama Bot: ${settings.botName}\n👤 Owner: ${settings.ownerName}` });
            break;

        case 'echo':
            if (args.length === 0) {
                await meon.sendMessage(chatId, { text: '⚠️ Harap masukkan teks untuk diulang!' });
            } else {
                await meon.sendMessage(chatId, { text: args.join(' ') });
            }
            break;

        case 'mediafire': {
            if (args.length === 0) return meon.sendMessage(chatId, { text: '⚠️ Masukkan link MediaFire!' });
            const mediafireUrl = args[0];
            const apiUrl = `https://bk9.fun/download/mediafire?url=${mediafireUrl}`;
            
            try {
                const response = await axios.get(apiUrl);
                if (response.data.status) {
                    const fileLink = response.data.BK9.link;
                    const fileName = response.data.BK9.filename || 'downloaded_file';
                    
                    const fileResponse = await axios.get(fileLink, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(fileResponse.data, 'binary');
                    
                    await meon.sendMessage(chatId, { 
                        document: buffer, 
                        fileName: fileName, 
                        mimetype: 'application/octet-stream' 
                    });
                } else {
                    await meon.sendMessage(chatId, { text: '❌ Gagal mengunduh file dari MediaFire!' });
                }
            } catch (error) {
                await meon.sendMessage(chatId, { text: `❌ Error: ${error.message}` });
            }
            break;
        }

        default:
            await meon.sendMessage(chatId, { text: '❌ Perintah tidak dikenal!' });
            break;
    }
};
