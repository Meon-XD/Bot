const settings = require('./settings');
const fs = require('fs');

module.exports = async (meon, msg) => {
    const { key, message } = msg;
    const id = key.remoteJid;
    if (!message) return;

    let text = message.conversation || message.extendedTextMessage?.text || '';
    if (!text.startsWith(settings.prefix)) return;

    const command = text.slice(1).trim().split(' ')[0].toLowerCase();

    switch (command) {
        case 'ping':
            await meon.sendMessage(id, { text: 'Pong!' });
            break;

        case 'info':
            await meon.sendMessage(id, { 
                text: `🤖 Nama Bot: ${settings.botName}\n👤 Owner: ${settings.ownerName}` 
            });
            break;

        case 'menu': {
            let teks = `
=========[ Info Bot]>
Nama: ${settings.botName}
Nama Owner: ${settings.ownerName}

=========[ Number Info ]>
Owner: ${settings.ownerNumber}
Bot: ${settings.botNumber}

=========[  List Menu  ]>
 *.ping*
 *.info*
 *.menu*

> Created by ${settings.ownerName} ${settings.ownerNumber}
> ${settings.wagc}
`;

            try {
                let videoPath = './data/src/meon.mp4';
                if (!fs.existsSync(videoPath)) {
                    return await meon.sendMessage(id, { text: '❌ Video tidak ditemukan!' });
                }

                await meon.sendMessage(id, { 
                    video: fs.readFileSync(videoPath),
                    caption: teks,
                    gifPlayback: true
                });
            } catch (error) {
                console.error('Error mengirim video:', error);
                await meon.sendMessage(id, { text: '⚠️ Terjadi kesalahan saat mengirim video!' });
            }
            break;
        }

        default:
            await meon.sendMessage(id, { text: '❌ Perintah tidak dikenal!' });
            break;
    }
};

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update'${__filename}'`))
	delete require.cache[file]
	require(file)
})
