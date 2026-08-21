const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const express = require("express");

// 🌐 إعداد سيرفر Express لإبقاء المنفذ مفتوحاً ومنع إغلاق السيرفر في Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("👑 DARK BOT IS ALIVE & RUNNING 24/7 👑");
});

app.listen(PORT, () => {
  console.log(`🌐 Web server is running on port: ${PORT}`);
});

const SUPREME_OWNER = "249112520567"; // تم التثبيت على رقمك الصحيح والأساسي 👑
const BOT_NAME = "DARK";

const commands = new Map();
const aliasesMap = new Map();
const msgStorage = new Map();

// إعداد واجهة القراءة من التيرمنال لإدخال الرقم
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// مسار ملف حفظ الإداريين المشترك
const adminsPath = path.join(__dirname, "admins.json");

// دالة جلب قائمة الإداريين المشتركة لتحديث الصلاحيات تلقائياً بجميع الأوامر
function getAllowedAdmins() {
    let allowed = [SUPREME_OWNER];
    if (fs.existsSync(adminsPath)) {
        try {
            const fileData = JSON.parse(fs.readFileSync(adminsPath, "utf8"));
            if (Array.isArray(fileData)) {
                allowed = fileData;
            }
        } catch (e) {
            allowed = [SUPREME_OWNER];
        }
    }
    // التأكد دائماً أن رقمك الأساسي موجود لحمايتك من الحذف بالخطأ
    if (!allowed.includes(SUPREME_OWNER)) {
        allowed.push(SUPREME_OWNER);
    }
    return allowed;
}

function getBotMode() {
    const statusPath = path.join(__dirname, "status.txt");
    return fs.existsSync(statusPath) ? fs.readFileSync(statusPath, "utf8").trim() : "public";
}

function isRadarOn() {
    const radarPath = path.join(__dirname, "radar_status.txt");
    return fs.existsSync(radarPath) ? fs.readFileSync(radarPath, "utf8").trim() : "off";
}

function loadPlugins() {
    commands.clear();
    aliasesMap.clear();
    const pluginsPath = path.join(__dirname, "plugins");
    if (!fs.existsSync(pluginsPath)) return;
    const files = fs.readdirSync(pluginsPath).filter(file => file.endsWith(".js"));
    for (const file of files) {
        const pluginPath = path.join(pluginsPath, file);
        try {
            delete require.cache[require.resolve(pluginPath)];
            const plugin = require(pluginPath);
            if (plugin.name && plugin.execute) {
                commands.set(plugin.name.toString().trim().toLowerCase(), plugin);
                if (plugin.aliases) {
                    plugin.aliases.forEach(alias => aliasesMap.set(alias.toString().trim().toLowerCase(), plugin));
                }
            }
        } catch (e) { console.log(`❌ خطأ في ${file}:`, e.message); }
    }
}

async function startBot() {
    loadPlugins();
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // معطل لأننا نستخدم كود الربط بالرقم الحين
        logger: pino({ level: "silent" }),
        version,
        browser: ["Ubuntu", "Chrome", "20.0.0.4"]
    });

    // 🔑 نظام جلب كود الربط (Pairing Code) بالرقم تلقائياً إذا لم تكن مسجلاً
    if (!sock.authState.creds.registered) {
        console.log(`\n👑 نظام ربط DARK BOT المطور عبر الكود 👑`);
        let phoneNumber = await question('📝 أدخل رقم هاتف البوت مع رمز الدولة (مثال: 249112520567): ');
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        if (!phoneNumber) {
            console.log('❌ رقم غير صحيح! أعد تشغيل البوت واكتب الرقم بشكل صحيح.');
            process.exit(0);
        }

        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n🔥 كود الربط الخاص بك هو: 【 ${code} 】`);
                console.log(`📌 افتح واتساب -> الأجهزة المرتبطة -> ربط برقم الهاتف وضعه الحين.\n`);
            } catch (err) {
                console.log('❌ خطأ أثناء طلب كود الربط:', err.message);
            }
        }, 3000);
    }

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (update) => {
        if (update.connection === "open") console.log(`\n✅ كينج دِارك! رادار الفضائح والميديا نشط الحين!`);
        if (update.connection === "close") startBot();
    });

    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            if (chatUpdate.type !== "notify") return;
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const from = mek.key.remoteJid;
            const msgId = mek.key.id;

            msgStorage.set(msgId, mek);
            if (msgStorage.size > 3000) {
                const firstKey = msgStorage.keys().next().value;
                msgStorage.delete(firstKey);
            }

            const type = Object.keys(mek.message)[0];

            if (isRadarOn() === "on" && !mek.key.fromMe) {
                const flags = ["🇲🇨","🇯🇵","🇸🇩","🇷🇺","🇨🇦","🇩🇪","🇰🇵","🇺🇸"];
                const randomFlag = flags[Math.floor(Math.random() * flags.length)];
                const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;
                const myBotPrivate = sock.user.id.split(':')[0] + '@s.whatsapp.net';

                // 🗑️ 1. رادار كشف الرسائل والميديا المحذوفة
                if (type === 'protocolMessage' && mek.message.protocolMessage?.type === 0) {
                    const deletedId = mek.message.protocolMessage.key.id;
                    const oldMsg = msgStorage.get(deletedId);

                    if (oldMsg && oldMsg.message) {
                        const oldType = Object.keys(oldMsg.message)[0];
                        const sender = oldMsg.key.participant || oldMsg.key.remoteJid;
                        const senderNum = sender.split("@")[0];

                        let oldText = oldType === 'conversation' ? oldMsg.message.conversation : (oldType === 'extendedTextMessage' ? oldMsg.message.extendedTextMessage.text : '');

                        if (oldText) {
                            const alertMsg = `🗑️ *[ رادار الحذف: نص ]*\n\n» العضو: @${senderNum}\n» حذف كلامه المكتوب:\n\n💬 "${oldText}"\n\n${footer}`;
                            await sock.sendMessage(myBotPrivate, { text: alertMsg, mentions: [sender] });
                        } else {
                            let mediaMessage = oldMsg.message[oldType];
                            let mediaTypeKey = oldType;

                            if (oldType === 'viewOnceMessage' || oldType === 'viewOnceMessageV2') {
                                mediaMessage = oldMsg.message[oldType].message[Object.keys(oldMsg.message[oldType].message)[0]];
                                mediaTypeKey = Object.keys(oldMsg.message[oldType].message)[0];
                            }

                            if (mediaMessage && (mediaTypeKey.includes('Message'))) {
                                const typeMap = {
                                    'imageMessage': { name: 'صورة 📸', stream: 'image' },
                                    'stickerMessage': { name: 'ملصق 🎭', stream: 'sticker' },
                                    'audioMessage': { name: 'ريكورد / صوت 🎵', stream: 'audio' },
                                    'videoMessage': { name: 'فيديو 🎥', stream: 'video' }
                                };
                                const mapped = typeMap[mediaTypeKey];
                                if (mapped) {
                                    try {
                                        const stream = await downloadContentFromMessage(mediaMessage, mapped.stream);
                                        let buffer = Buffer.from([]);
                                        for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
                                        const captionText = `🗑️ *[ رادار الحذف: ${mapped.name} ]*\n\n» العضو: @${senderNum}\n» قام بحذف الميديا المرفقة أعلاه الحين!\n\n${footer}`;

                                        if (mediaTypeKey === 'imageMessage') {
                                            await sock.sendMessage(myBotPrivate, { image: buffer, caption: captionText, mentions: [sender] });
                                        } else if (mediaTypeKey === 'stickerMessage') {
                                            await sock.sendMessage(myBotPrivate, { text: `🗑️ *[ رادار الحذف: ملصق 🎭 ]*\n» العضو: @${senderNum}\n» الملصق المحذوف بالأسفل:`, mentions: [sender] });
                                            await sock.sendMessage(myBotPrivate, { sticker: buffer });
                                        } else if (mediaTypeKey === 'audioMessage') {
                                            await sock.sendMessage(myBotPrivate, { text: `🗑️ *[ رادار الحذف: ريكورد 🎵 ]*\n» العضو: @${senderNum}\n» الريكورد المحذوف بالأسفل:`, mentions: [sender] });
                                            await sock.sendMessage(myBotPrivate, { audio: buffer, mimetype: 'audio/mp4', ptt: mediaMessage.ptt });
                                        } else if (mediaTypeKey === 'videoMessage') {
                                            await sock.sendMessage(myBotPrivate, { video: buffer, caption: captionText, mentions: [sender] });
                                        }
                                    } catch (err) { console.log("خطأ تحميل ميديا محذوفة:", err.message); }
                                }
                            }
                        }
                    }
                }

                // ✏️ 2. رادار قفش التعديل المعزز والذكي
                if (type === 'protocolMessage' && mek.message.protocolMessage?.type === 14) {
                    const editedId = mek.message.protocolMessage.key.id;
                    const oldMsg = msgStorage.get(editedId);
                    
                    const editedProto = mek.message.protocolMessage.editedMessage;
                    const newText = editedProto?.conversation || 
                                    editedProto?.extendedTextMessage?.text || 
                                    editedProto?.imageMessage?.caption || 
                                    editedProto?.videoMessage?.caption || '';

                    if (oldMsg && oldMsg.message && newText) {
                        const oldType = Object.keys(oldMsg.message)[0];
                        let oldText = oldType === 'conversation' ? oldMsg.message.conversation : 
                                     (oldType === 'extendedTextMessage' ? oldMsg.message.extendedTextMessage.text : 
                                     (oldMsg.message[oldType]?.caption || ''));
                                     
                        const sender = oldMsg.key.participant || oldMsg.key.remoteJid;
                        const senderNum = sender.split("@")[0];

                        if (oldText && oldText !== newText) {
                            const alertMsg = `✏️ *[ رادار قفش التعديل ]*\n\n» العضو: @${senderNum}\n\n❌ النص القديم:\n"${oldText}"\n\n✅ النص الجديد:\n"${newText}"\n\n${footer}`;
                            await sock.sendMessage(myBotPrivate, { text: alertMsg, mentions: [sender] });
                        }
                    }
                }
            }

            let body = '';
            if (type === 'conversation') body = mek.message.conversation;
            else if (type === 'extendedTextMessage') body = mek.message.extendedTextMessage.text;

            body = body.trim();
            if (!body) return;

            const args = body.split(/ +/);
            const lookupName = args.shift().toLowerCase();
            const rawSender = mek.key.participant || mek.key.remoteJid || '';
            const senderNumber = rawSender.split("@")[0].replace(/[^0-9]/g, "");

            // 👑 جدار فحص رتب الصلاحيات المطور 👑
            const currentAdmins = getAllowedAdmins();
            const isOwner = (senderNumber === SUPREME_OWNER || mek.key.fromMe === true);
            const isAdmin = currentAdmins.includes(senderNumber);

            const currentMode = getBotMode();
            if (currentMode === "self" && !isAdmin && !isOwner) return;

            const command = commands.get(lookupName) || aliasesMap.get(lookupName);
            if (command) {
                const hasPermission = isOwner || isAdmin;
                await command.execute(sock, mek, args, {
                    BOT_NAME,
                    lookupName,
                    isOwner: hasPermission,
                    isAdmin,
                    currentAdmins
                });
            }
        } catch (e) { console.error(e); }
    });
}

startBot();

