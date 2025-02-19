const { makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const chalk = require('chalk');
const botHandler = require('./bot');
const fs = require('fs')

const usePairingCode = true; // Gunakan kode pairing jika true

// Fungsi untuk membaca input dari terminal
const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(text, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./meon');

    const meon = makeWASocket({
        auth: state,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: 'fatal' }),
        browser: Browsers.macOS('Safari'), // Menentukan jenis browser
        syncFullHistory: true,
        markOnlineOnConnect: false,
    });

    // Jika menggunakan pairing code dan belum terdaftar
    if (usePairingCode && !state.creds.registered) {
        const phoneNumber = await question(
            chalk.greenBright('Masukkan nomor WhatsApp Anda (contoh: 628xxx): ')
        );

        const code = await meon.requestPairingCode(phoneNumber.trim());
        console.log(chalk.yellowBright(`Kode pairing Anda adalah: ${code}`));
    }

    meon.ev.on('creds.update', saveCreds);
    meon.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            console.log('Koneksi terputus, mencoba menghubungkan kembali...');
            startBot();
        } else if (connection === 'open') {
            console.log('Bot terhubung ke WhatsApp!');
        }
    });

    meon.ev.on('messages.upsert', async ({ messages }) => {
        if (!messages[0].key.fromMe) {
          const msg = messages[0]
            botHandler(meon, msg);
            meon.readMessages(msg.key)
        }
    });
    
    
    //React Pesan
    const react = await meon.sendMessage(msg.jid, { react: {
      text: "🤖",
      key: msg.key
    }})
    console.log(react)
    
    
    if(!msg.type !== "extendedTextMessage") return;
    
    if(!msg.fromMe || msg.text !== "p") return;
    const sendMsg = await meon.sendMessage(msg.jid, { text: "ada yang bisa di bantu"});
    
    
    if(!msg.messages) return;
     console.log(msg)
    
    //Auto read status wa
    if(msg.jid === "status@broadcast") return
    meon.readMessage([message[0].key]);
    
    //Pesan dari grup
    msg.isGroup = msg.jid.endsWith("@g.us");
    msg.userJid = msg.isGroup ? msg.key.participants : msg.key.remoteJid
    
    //Name frmo profile
    msg.userName = msg.pushName;
    msg.fromMe = msg.mey.fromMe
    
    msg.type = object.keys(msg.message)[0];
    
    //menerima informasi mengenai grup
    meon.ev.on("group.participants.update",(group) => {
      console.log(group)
    });
    
    //Anti Call
    meon.ev.on("call", (call) => {
      if(call[0].status === "offer") {
        meon.rejectCall(call[0].id, call[0].from)
        console.log(call);
      }
    })
}

startBot();

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update'${__filename}'`))
	delete require.cache[file]
	require(file)
})
