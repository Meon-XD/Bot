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
            botHandler(meon, messages[0]);
        }
    });
}

startBot();

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update'${__filename}'`))
	delete require.cache[file]
	require(file)
})
