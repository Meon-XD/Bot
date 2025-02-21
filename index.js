const {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const inquirer = require("inquirer");
const fs = require("fs");
const chalk = require('chalk')
const readline = require('readline');

usePairingCode = true

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



//Bot Info

  botName = 'meon Bot'
  //wagc: 'https://chat.whatsapp.com/C0ZVjPYNaOF1Uk0lOA3L2g'
  ch = 'https://whatsapp.com/channel/0029VajUoDV9mrGmUXtZy91a'
  thumb = fs.readFileSync('./meon.png')
  
  async function reply(sock, msg, text) {
    try {
        await sock.sendMessage(msg.jid, { 
            text: text, 
            contextInfo: {
                mentionedJid: [msg.sender],
                externalAdReply: {
                    title: botName,
                    mediaType: 1,
                    previewType: 0,
                    thumbnail: thumb,
                    renderLargerThumbnail: true,
                    sourceUrl: ch
                }
            },
            quoted: msg
        });
    } catch (err) {
        console.error("Error saat mengirim reply:", err);
    }
}



//fitur group
async function groupFitur(sock, msg, action) {
    if (!msg.isGroup) return;
    const participants = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (participants.length === 0) return;
    
    try {
        await sock.groupParticipantsUpdate(msg.jid, participants, action);
        await sock.sendMessage(msg.jid, { text: `Sukses ${action} peserta!` });
    } catch (error) {
        console.error(`Gagal ${action} peserta:`, error);
    }
}



async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("./sesi");
  const sock = makeWASocket({
    logger: pino({ level: "fatal" }),
    auth: state,
    printQRInTerminal: !usePairingCode,
    defaultQueryTimeoutMs: undefined,
    keepAliveIntervalMs: 30000,
    browser: Browsers.macOS("Edge"),
    shouldSyncHistoryMessage: () => false,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
  });
  
  //Di dalam Fungsi
if (usePairingCode && !state.creds.registered) {
    const phoneNumber = await question(
      chalk.greenBright('Masukkan nomor WhatsApp Anda (contoh: 628xxx): ')
    );
    const code = await sock.requestPairingCode(phoneNumber.trim());
    console.log(chalk.yellowBright(`Kode pairing Anda adalah: ${code}`));
  }
  
  
  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("Menjalankan ulang");
        connectToWhatsApp();
      }
    }
    if (connection === "open") {
      console.log("Terhubung");
    }
  });
  sock.ev.on("creds.update", saveCreds);
  // Event Messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    // Jika bukan sebuah pesan text atau media kita abaikan saja
    if (!msg.message) return;
    // message jid
    msg.jid = msg.key.remoteJid;
    // jika sebuah status kita tambahkan auto read status
    if (msg.jid === "status@broadcast") return sock.readMessages([msg.key]);
    // Message from group
    msg.isGroup = msg.jid.endsWith("@g.us");
    // User jid || Jika dari group kita ambil dari participan namun jika bukan dari group, kita ambil dari remoteJid
    msg.userJid = msg.isGroup ? msg.key.participant : msg.key.remoteJid; // Atau msg.jid
    // Nama dari profile pengirim
    msg.userName = msg.pushName;
    // Jika pesan dari bot
    msg.fromMe = msg.key.fromMe;
    //group
    if(msg.text === 'test') {
      const code = await sock.groupRevokeInvite(jid)
     console.log('New group code: ' + code)
    }
    
    
    // Type dari sebuah pesan
    msg.type = Object.keys(msg.message)[0];
    // Pesan text & Jika pesan extendedTextMessage kita ambil textnya dan jika pesan conversation kita ambil conversation. Namun jika bukan dari extendedTextMessage dan juga bukan dari conversation kita beri empty string.
    msg.text =
      msg.type === "extendedTextMessage"
        ? msg.message.extendedTextMessage.text
        : msg.type === "conversation"
        ? msg.message.conversation
        : msg.type === "imageMessage"
        ? msg.message.imageMessage.caption
        : msg.type === "videoMessage"
        ? msg.message.videoMessage.caption
        : "";
        await sock.readMessages([msg.key]);
    /// Command
    msg.cmd = msg.text.trim().split(" ")[0].replace(".", "").toLowerCase();
    /// Arguments
    msg.args = msg.text
      .replace(/^\S*\b/g, "")
      .trim()
      .split("|");
    console.log(msg);
    switch (msg.cmd) {
            case "menu": {
        const teks = `
        Halo kak ${msg.userName}
        =======[ List Menu ]=======
        - .menu
        - .ping
        - .ytdl
        
        ====[ Group Menu ]=====
        - .createGc
        - .add <number>
        - .leave
        - .kick
        - .setsubject
        - .setdesc
        - .promote
        - .demote
        - .revoke
        - .linkgc
        ==========================
        `;
        reply(msg, teks);
        break;
      }

      break;
      
      case "ping": {
        console.log("Command ping");
      }
        break;
        
      case "ytdl": {
        console.log("Command ytdl");
        reply(sock, msg, 'fitur ini belum tersedia ')
      }
        break;

       case 'creategc': case 'newgc': { 
       if (!msg.text) { 
         await sock.sendMessage(msg.jid, { 
           text: 'Silakan masukkan nama grup! Contoh: .creategc NamaGrup' }); return; 
     }
try {
    const group = await sock.groupCreate(msg.text, [msg.jid]);
    let teks = `Selamat Bergabung di *${msg.text}`
    reply(teks)
} catch (error) {
    let teks = 'Gagal membuat grup! Pastikan akun ini memiliki izin untuk membuat grup.' 
    reply(sock, msg, teks)
    console.error(error);
}}
     break;
     
     case 'newlink': case 'revoke': {
       const code = await sock.groupRevokeInvite(msg.jid)
       let teks = 'Link Grup Update Kak :\n\n https://chat.whatsapp.com/' 
       reply(sock, msg, teks + code)
     }
     break;
      case "add":
        case "remove":
        case "promote":
        case "demote":
            await groupFitur(sock, msg, msg.cmd);
     break;
     
     case 'linkgc': {
       const code = await sock.groupInviteCode(msg.jid)
       let teks = 'group code: https://chat.whatsapp.com/'
       reply(sock, msg, teks + code)
     }
     break;
     
     case 'tagall': {
       try {
        // Ambil daftar semua grup yang diikuti bot
        const groups = await sock.groupFetchAllParticipating();
        // Pastikan bot berada di grup yang sesuai
        const groupMetadata = groups[msg.jid];
        if (!groupMetadata) {
            await sock.sendMessage(msg.jid, { text: "Bot tidak ada di grup ini!" });
            }
      
        // Ambil semua peserta grup
        const participants = groupMetadata.participants.map(p => p.id);
        
        // Buat pesan mention
        let mentionText = `👥 *${msg.text}* 👥\n`;
        mentionText += participants.map(p => `@${p.split('@')[0]}`).join("\n");

        await sock.sendMessage(msg.jid, {
    text: mentionText,
    mentions: `Name ${participants}`
});
    } catch (err) {
        console.error("Error saat menjalankan tagall:", err);
        await sock.sendMessage(msg.jid, { text: "Terjadi kesalahan saat menjalankan tagall." });
    }
        }
     break;
     
        default:
        if (msg.fromMe) return;
        reply(sock, msg, "Fitur tidak ditemukan.");
        break;

    }
  });
  
  
  
  sock.ev.on("group-participants.update", async (group) => {
    console.log(group);

    const { id, action, participants } = group; // Ambil ID grup dan peserta yang terlibat

    let newMember = "Selamat Bergabung!";
    let outMember = "Goodbye, teman!";
    let promoteMsg = "Selamat atas kenaikan jabatan!";
    let demoteMsg = "Jabatan Anda telah diturunkan.";

    try {
        let teks;
        if (action === "add") {
            teks = newMember;
        } else if (action === "remove") {
            teks = outMember;
        } else if (action === "promote") {
            teks = promoteMsg;
        } else if (action === "demote") {
            teks = demoteMsg;
        }

        if (teks) {
            await sock.sendMessage(id, { 
                text: teks, 
                mentions: participants // Menyebut peserta yang terlibat
            });
        }
    } catch (err) {
        console.log("Error:", err);
    }
});

sock.ev.on("call", async (call) => {
    if (call[0].status === "offer") {
        await sock.rejectCall(call[0].id, call[0].from);
        let callMsg = "Sedang tidak dapat menerima panggilan video/suara, mohon coba beberapa saat lagi.";
        await sock.sendMessage(call[0].from, { text: callMsg });
        console.log(call);
    }
});

}

connectToWhatsApp();

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update '${__filename}'`));
    delete require.cache[file];
    require(file);
});
