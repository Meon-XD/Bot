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
const axios = require('axios')
const yts = require('yt-search')
const { default: fetch } = require('node-fetch')

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
  wagc = 'https://chat.whatsapp.com/C0ZVjPYNaOF1Uk0lOA3L2g'
  ch = 'https://whatsapp.com/channel/0029VajUoDV9mrGmUXtZy91a'
  thumb = fs.readFileSync('./meon.png')
  ownerName = 'RDT'
  
  async function reply(sock, msg, text) {
    try {
        await sock.sendMessage(msg.jid, { 
            text: text, 
            mentions: msg.userJid,
            contextInfo: {
                mentionedJid: [msg.text],
                externalAdReply: {
                    title: botName,
                    mediaType: 1,
                    previewType: 0,
                    thumbnail: thumb,
                    renderLargerThumbnail: true,
                    sourceUrl: ch,
                }
            },
            externalAdReply: {
							showAdAttribution: true,
							title: botName,
							body: ownerName,
							previewType: "PHOTO",
							thumbnail: thumb,
							sourceUrl: wagc
						}
					
        }, {quoted: msg });
    } catch (err) {
        console.error("Error saat mengirim reply:", err);
    }
}



//fitur group
async function groupFitur(sock, msg, action) {
    if (!msg.isGroup) return reply(sock, msg, "Perintah ini hanya bisa digunakan dalam grup!");

    let participants = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];

    // Jika tidak ada tag, cek apakah pengguna langsung mengetik nomor
    if (participants.length === 0 && msg.args.length > 0) {
        participants = msg.args.map(num => num.replace(/\D/g, "") + "@s.whatsapp.net"); // Ubah ke format JID
    }

    if (participants.length === 0) return reply(sock, msg, "Tag pengguna atau ketik nomornya!");

    try {
        let teks = "";
        let usernames = participants.map(p => `@${p.split('@')[0]}`).join(", ");
        
        if (action === "add") {
            await sock.groupParticipantsUpdate(msg.jid, participants, "add");
            teks = `✅ Berhasil menambahkan ${usernames} ke dalam grup!`;
        } else if (action === "kick") {
            await sock.groupParticipantsUpdate(msg.jid, participants, "remove");
            teks = `⛔ ${usernames} telah dikeluarkan dari grup!`;
        } else if (action === "promote") {
            await sock.groupParticipantsUpdate(msg.jid, participants, "promote");
            teks = `🎉 Selamat! ${usernames} sekarang adalah admin grup!`;
        } else if (action === "demote") {
            await sock.groupParticipantsUpdate(msg.jid, participants, "demote");
            teks = `😢 ${usernames} telah diturunkan dari jabatan admin.`;
        }

        await sock.sendMessage(msg.jid, {
            text: teks,
            mentions: participants
        });

    } catch (err) {
        console.error(`Gagal menjalankan ${action} peserta:`, err);
        reply(sock, msg, `❌ Gagal menjalankan perintah ${action}. Pastikan bot memiliki izin admin.`);
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
### **List Menu**
- .menu
- .ping
- .ytdl

### **Group Menu**
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
- .tagall

 **Downloader Menu
- .mediafire <link> – Download file dari MediaFire
- .play <judul lagu> – Download lagu dari YouTube
- .spotifydown <link> – Download lagu dari Spotify
- .ttdown <link> – Download video TikTok
- .gitclone <link> – Clone repository GitHub

### **Search Menu**
- .stalkch <link> – Stalk channel WhatsApp
- .webtoons <judul> – Cari webtoon
- .spotifysearch <judul> – Cari lagu di Spotify
- .halodoc <pertanyaan> – Cari artikel kesehatan dari Halodoc
- .gimage <query> – Cari gambar di Google

### **AI & Tools Menu**
- .ai <pertanyaan> – Chat dengan AI GPT-4o
- .gpt <pertanyaan> – Chat dengan AI GPT-4o
        `;
        await sock.sendMessage(msg.jid, {
          text: teks, 
          contextInfo: {
                mentionedJid: [msg.sender],
                externalAdReply: {
                    title: botName,
                    mediaType: 1,
                    previewType: 0,
                    thumbnail: thumb,
                    renderLargerThumbnail: true,
                    sourceUrl: ch,
                }
            },
            quoted: msg
        })
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
         reply(sock, msg, 'Masukan Nama Grup setelah Perintah '); 
     }
try {
    const group = await sock.groupCreate(msg.text[1], [msg.jid]);
    let teks = `Selamat Bergabung di *${msg.text[1]}`
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
    case "kick":
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
     case 'mediafire': {
    if (!msg.args[0]) return reply(sock, msg, 'Masukkan link MediaFire');
    const url = `https://bk9.fun/download/mediafire?url=${msg.args[0]}`;
    
    try {
        const response = await axios.get(url);
        const result = response.data;

        if (result.status) {
            const link = result.BK9.link;
            const fileResponse = await axios.get(link, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(fileResponse.data, 'binary');

            await sock.sendMessage(msg.jid, { 
                document: buffer, 
                fileName: result.BK9.filename || 'file.zip', 
                mimetype: result.BK9.mimetype || 'application/zip'
            }, { quoted: msg });

        } else {
            reply(sock, msg, 'Gagal mengunduh file MediaFire');
        }

    } catch (error) {
        console.error('Error saat mengunduh:', error);
        reply(sock, msg, 'Terjadi kesalahan saat mengunduh file.');
    }
    break;
}

       break;
       case 'play': {
    let text = msg.args.join(' ');
    if (!msg.text) return reply(sock, msg, 'Penggunaan: .play <judul lagu>\nContoh: .play dandelion');


    try {
        const searchResults = await yts(msg.text);
        const video = searchResults.videos[0];
        if (!video) return reply(sock, msg, 'Tidak ditemukan hasil untuk pencarian tersebut.');

        const { title, url, timestamp, ago, views, author, thumbnail } = video;

        const caption = `
🎵 *YouTube MP3 Downloader* 🎵

🎶 *Judul*   : ${title}
👤 *Channel* : ${author.name}
🕒 *Durasi*  : ${timestamp}
👁️ *Dilihat* : ${views} kali
🗓️ *Diunggah*: ${ago}

📥 *Mengunduh audio...*
`;

        await sock.sendMessage(msg.text, {
            text: caption,
            contextInfo: {
                externalAdReply: {
                    title: `${title}`,
                    body: 'Klik untuk menonton di YouTube',
                    thumbnailUrl: thumbnail,
                    mediaType: 1,
                    mediaUrl: url,
                    sourceUrl: url,
                },
            },
        });

        const apiUrl = `https://api.vreden.web.id/api/ytmp3?url=${encodeURIComponent(url)}`;
        const { result } = await fetch(apiUrl).then((res) => res.json());

        if (!result?.status || !result?.download?.url) return reply(sock, msg, 'Gagal mengunduh audio.');

        const audioBuffer = await fetch(result.download.url).then((res) => res.buffer());
        await sock.sendMessage(msg.text, { 
            audio: audioBuffer, 
            mimetype: 'audio/mpeg', 
            fileName: `${title}.mp3` 
        }, { quoted: msg });
    } catch (err) {
        //reply(sock, msg, 'Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.');
        
       console.log(err)
    }
    break;
}
       break;
       case 'stalkch': {
  if (!msg.args[0]) return reply(sock, msg, 'Masukkan link channel WhatsApp');
  
  const url = `https://fastrestapis.fasturl.cloud/stalk/wachannel?url=${encodeURIComponent(msg.args[0])}`;
  
  try {
    const response = await axios.get(url);
    const result = response.data;
    
    if (result.status === 200) {
      const data = result.result;
      let teks = `*Informasi Channel WhatsApp:*
`;
      teks += `- *Nama:* ${data.name}\n`;
      teks += `- *Pengikut:* ${data.followers}\n`;
      teks += `- *Deskripsi:* ${data.description}\n`;
      teks += `- *Link Channel:* ${data.channelLink}\n`;
      
      const buttons = [
        {buttonId: `.stalkch ${msg.args[0]}`, buttonText: {displayText: '🔄 Cek Ulang'}, type: 1},
        {buttonId: `${data.channelLink}`, buttonText: {displayText: '🔗 Kunjungi Channel'}, type: 1}
      ];
      
      let buttonMessage = {
        text: teks,
        footer: '📢 Stalk Channel WhatsApp',
        buttons: buttons,
        headerType: 1,
        image: {url: data.image}
      };
      
      await sock.sendMessage(msg.jid, buttonMessage, { quoted: msg });
    } else {
      reply(sock, msg, 'Gagal mengambil data channel WhatsApp');
    }
  } catch (error) {
    reply(sock, msg, 'Error: ' + error.message);
  }
  
  break;
}

       break;
       case 'spotifydown': {
  if (!msg.args[0]) return reply(sock, reply, 'Masukkan link Spotify yang ingin diunduh');
  const url = `https://fastrestapis.fasturl.cloud/downup/spotifydown?url=${encodeURIComponent(msg.args[0])}`;

  try {
    let { data } = await sock.get(url);
    if (data.status === 200) {
      const metadata = data.result.metadata;
      const link = data.result.link;
      const judul = metadata.title;
      const artis = metadata.artists;
      const album = metadata.album;
      const cover = metadata.cover;
      const releaseDate = metadata.releaseDate;

      await sock.sendMessage(msg.text, {
        audio: { url: link },
        fileName: `${judul}.mp3`,
        mimetype: 'audio/mpeg',
        caption: `🎵 *Judul:* ${judul}\n🎤 *Artis:* ${artis}\n💽 *Album:* ${album}\n📅 *Rilis:* ${releaseDate}`
      }, { quoted: msg });
    } else {
      reply(sock, msg, '⚠️ Gagal mengunduh lagu dari Spotify.');
    }
  } catch (error) {
    reply(sock, msg, '❌ Error: ' + error.message);
  }
  break;
}

       break;
      case 'ttdown': {
        if (!msg.text) return reply(sock, msg, 'Masukkan URL TikTok yang ingin diunduh');
        const url = `https://fastrestapis.fasturl.cloud/downup/ttdown?url=${msg.text}`;
        axios.get(url)
          .then(response => {
            const result = response.data;
            if (result.status === 200) {
              const title = result.result.title;
              const author = result.result.author;
              const videoUrl = result.result.media.videoUrl;
              const coverUrl = result.result.media.coverUrl;
              sock.sendMessage(msg.jid, { video: { url: videoUrl }, caption: `${title}\n\nAuthor: ${author}` }, { quoted: msg });
            } else {
              reply(sock, msg, 'Gagal mengunduh video TikTok');
            }
          })
          .catch(error => {
            reply(sock, msg, 'Error: ' + error);
          });
        break;
      }
       break;

      case 'ai':
      case 'gpt': {
        if (!msg.text) return reply(sock, msg, `Hai, ada yang bisa ${botName} saya bantu?`);
        const url = `https://fastrestapis.fasturl.cloud/aillm/gpt-4o-turbo?ask=${encodeURIComponent(msg.text)}`;
        axios.get(url)
          .then(response => {
            const result = response.data;
            if (result.status === 200) {
              const jawaban = result.result;
              let teks = `*Meon Bantu Jawab Nih*\n\n`
              reply(sock, msg, teks, jawaban);
            } else {
              reply(sock, msg, 'Gagal mendapatkan jawaban');
            }
          })
          .catch(error => {
            reply(sock, msg, 'Error: ' + error);
          });
        break;
      }
       break;

       case 'webtoons': {
        if (!msg.text) return reply(sock, msg, 'Apa yang ingin Anda cari?');
        const url = `https://api.diioffc.web.id/api/search/webtoons?query=${msg.text}`;
        axios.get(url)
          .then(response => {
            const result = response.data;
            if (result.status) {
              const webtoons = result.result;
              let teks = '';
              webtoons.forEach(webtoon => {
                teks += `*${webtoon.judul}*\n`;
                teks += `Genre: ${webtoon.genre}\n`;
                teks += `Author: ${webtoon.author}\n`;
                teks += `Likes: ${webtoon.likes}\n`;
                teks += `Link: ${webtoon.link}\n\n`;
              });
              reply(sock, msg, teks);
            } else {
              reply(sock, msg, 'Gagal mendapatkan hasil pencarian webtoons');
            }
          })
          .catch(error => {
            reply(sock, msg, 'Error: ' + error);
          });
        break;
      }

       break;



        case 'gitclone': {
          if (!msg.text) return reply(sock, msg, 'Masukkan URL Git yang ingin di-clone');
          const url = `https://api.diioffc.web.id/api/download/gitclone?url=$msg.{text}`;
          axios.get(url)
            .then(response => {
              const result = response.data;
              if (result.status) {
                const urllink = result.result.urllink;
                const filename = result.result.filename;
                axios.get(urllink, { responseType: 'arraybuffer' })
                  .then(response => {
                    const buffer = Buffer.from(response.data, 'binary');
                    sock.sendMessage(msg.jid, { document: buffer, fileName: filename, mimetype: 'application/zip' }, { quoted: msg});
                    reply(sock, msg, `Berhasil mengunduh file Git!\n\nFilename: ${filename}`);
                  })
                  .catch(error => {
                    reply(sock, msg, sock,);
                  });
              } else {
                reply(sock, msg, 'Gagal mendapatkan link clone Git');
              }
            })
            .catch(error => {
              reply(sock, msg, 'Error: ' + error);
            });
          break;
        }
       break;

      case 'gimage': {
  if (!msg.text) return reply(sock, msg, 'Masukkan query pencarian');
  const url = `https://api.diioffc.web.id/api/search/gimage?query=${msg.text}`;
  axios.get(url)
    .then(response => {
      const data = response.data.result;
      if (!data.length) return reply(sock, msg, 'Gambar tidak ditemukan');
      let result = 'Hasil Pencarian Gambar:\n\n';
      data.forEach(gambar => {
        result += `* Judul: ${gambar.title}\n`;
        result += `* Link: ${gambar.link}\n`;
        result += `* Ukuran: ${gambar.image.byteSize} byte\n`;
        result += `* Resolusi: ${gambar.image.width}x${gambar.image.height}\n\n`;
        sock.sendMessage(msg.jid, { image: { url: gambar.link } }, { quoted: msg });
      });
      reply(sock, msg, result);
    })
    .catch(error => {
      reply(sock, msg, 'Error: ' + error);
    });
  break;
}
       break;
      case 'halodoc': {
  if (!msg.text) return reply(sock, msg, 'Apa yang ingin Anda tanyakan?');
  const url = `https://api.diioffc.web.id/api/search/halodoc?query=${msg.text}`;
  axios.get(url)
    .then(response => {
      const result = response.data;
      if (result.status) {
        const articles = result.result;
        let teks = '';
        articles.forEach(article => {
          teks += `*${article.judul}*\n${article.deskripsi}\n${article.tautan}\n\n`;
        });
        reply(teks);
      } else {
        reply(sock, msg, 'Gagal mendapatkan hasil pencarian');
      }
    })
    .catch(error => {
      reply(sock, msg, 'Error:' + error);
    });
  break;
}
       break;
      case 'spotifysearch': {
  if (!msg.text) return reply(sock, msg, 'Masukkan query pencarian');
  const query = msg.text;
  const url = `https://api.siputzx.my.id/api/s/spotify?query=${query}`;
  axios.get(url)
    .then(response => {
      const data = response.data.data;
      if (!data.length) return reply(sock,msg, 'Lagu tidak ditemukan');
      let result = 'Hasil Pencarian Lagu:\n\n';
      data.forEach(lagu => {
        result += `* Judul: ${lagu.title}\n`;
        result += `* Artis: ${lagu.artist.name}\n`;
        result += `* Durasi: ${lagu.duration}\n`;
        result += `* Thumbnail: ${lagu.thumbnail}\n\n`;
      });
      reply(sock, msg, result);
    })
    .catch(error => {
      reply(sock, msg, 'Error: ' + error);
    });
  break;
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

    const { id, action, participants } = group;
    let usernames = participants.map(p => `@${p.split('@')[0]}`).join(", ");
    
    let teks = "";
    if (action === "add") {
        teks = `👋 Selamat datang ${usernames}! Jangan lupa baca deskripsi grup ya!`;
    } else if (action === "remove") {
        teks = `👋 Selamat tinggal ${usernames}, semoga sukses di tempat lain!`;
    } else if (action === "promote") {
        teks = `🎉 Selamat! ${usernames} sekarang adalah admin grup!`;
    } else if (action === "demote") {
        teks = `😢 ${usernames} telah diturunkan dari jabatan admin.`;
    }

    if (teks) {
        await sock.sendMessage(id, { 
            text: teks, 
            mentions: participants 
        });
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
