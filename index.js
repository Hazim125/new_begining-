const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("👑 DARK BOT IS ALIVE & RUNNING 24/7 👑");
});

app.listen(PORT, () => {
  console.log(`🌐 Web server is running on port: ${PORT}`);
});

const SUPREME_OWNER = "249112520567"; 
const BOT_NAME = "DARK";

const commands = new Map();
const aliasesMap = new Map();
const msgStorage = new Map();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const adminsPath = path.join(__dirname, "admins.json");

function getAllowedAdmins() {
    let allowed = [SUPREME_OWNER];
    if (fs.existsSync(adminsPath)) {
        try {
            const fileData = JSON.parse(fs.readFileSync(adminsPath, "utf8"));
            if (Array.isArray(fileData)) allowed = fileData;
        } catch (e) {
            allowed = [SUPREME_OWNER];
        }
    }
    if (!allowed.includes(SUPREME_OWNER)) allowed.push(SUPREME_OWNER);
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

function getRandomFlag() {
    const flags = ["🇲🇨","🇯🇵","🇸🇩","🇷🇺","🇨🇦","🇩🇪","🇰🇵","🇺🇸"];
    return flags[Math.floor(Math.random() * flags.length)];
}

function extractTextFromMsg(msgObj) {
    if (!msgObj) return '';
    const type = Object.keys(msgObj)[0];
    if (type === 'conversation') return msgObj.conversation || '';
    if (type === 'extendedTextMessage') return msgObj.extendedTextMessage?.text || '';
    if (msgObj[type]?.caption) return msgObj[type].caption;
    return '';
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
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        version,
        browser: ["Ubuntu", "Chrome", "20.0.0.4"]
    });

    if (!sock.authState.creds.registered) {
        console.log(`\n👑 نظام ربط DARK BOT المطور عبر الكود 👑`);
        let phoneNumber = await question('📝 أدخل رقم هاتف البوت مع رمز الدولة: ');
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        if (!phoneNumber) process.exit(0);

        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n🔥 كود الربط الخاص بك هو: 【 ${code} 】\n`);
            } catch (err) { console.log('❌ خطأ في الكود:', err.message); }
        }, 3000);
    }

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (update) => {
        if (update.connection === "open") console.log(`\n✅ كينج دِارك! رادار الفضائح والميديا نشط الحين!`);
        if (update.connection === "close") startBot();
    });

    // 📩 استقبال الرسائل ورادار الحذف
    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            if (chatUpdate.type !== "notify") return;
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const msgId = mek.key.id;
            const type = Object.keys(mek.message)[0];

            let extractedText = extractTextFromMsg(mek.message);

            if (!msgStorage.has(msgId) && type !== 'protocolMessage') {
                msgStorage.set(msgId, {
                    originalText: extractedText,
                    currentText: extractedText,
                    sender: mek.key.participant || mek.key.remoteJid,
                    raw: mek
                });
            }

            if (msgStorage.size > 5000) {
                const firstKey = msgStorage.keys().next().value;
                msgStorage.delete(firstKey);
            }

            if (isRadarOn() === "on" && !mek.key.fromMe) {
                const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${getRandomFlag()}`;
                const myBotPrivate = sock.user.id.split(':')[0] + '@s.whatsapp.net';

                if (type === 'protocolMessage' && mek.message.protocolMessage?.type === 0) {
                    const deletedId = mek.message.protocolMessage.key.id;
                    const record = msgStorage.get(deletedId);

                    if (record) {
                        const senderNum = record.sender.split("@")[0];
                        const textToDelete = record.currentText || record.originalText;

                        if (textToDelete) {
                            const alertMsg = `🗑️ *[ رادار الحذف: نص ]*\n\n» العضو: @${senderNum}\n» حذف كلامه:\n\n💬 "${textToDelete}"\n\n${footer}`;
                            await sock.sendMessage(myBotPrivate, { text: alertMsg, mentions: [record.sender] });
                        }
                    }
                }
            }

            let body = extractedText || '';
            body = body.trim();
            if (!body) return;

            const args = body.split(/ +/);
            const lookupName = args.shift().toLowerCase();
            const rawSender = mek.key.participant || mek.key.remoteJid || '';
            const senderNumber = rawSender.split("@")[0].replace(/[^0-9]/g, "");

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

    // ✏️ رادار التعديل (من → إلى)
    sock.ev.on("messages.update", async (updates) => {
        try {
            for (const update of updates) {
                const edited =
                    update.update?.message?.editedMessage ||
                    update.message?.editedMessage ||
                    (update.update?.message?.protocolMessage?.editedMessage);

                if (edited) {
                    const targetId = update.key?.id || update.update?.key?.id;
                    const record = msgStorage.get(targetId);

                    if (record) {
                        const newText =
                            edited.message?.conversation ||
                            edited.message?.extendedTextMessage?.text ||
                            edited.message?.imageMessage?.caption ||
                            edited.message?.videoMessage?.caption ||
                            "";

                        if (newText) {
                            const oldText = record.currentText || record.originalText || "";
                            record.currentText = newText;
                            msgStorage.set(targetId, record);

                            const senderNum = record.sender.split("@")[0];
                            const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ✏️`;
                            const myBotPrivate = sock.user.id.split(':')[0] + '@s.whatsapp.net';

                            const alertMsg = `✏️ *[ رادار التعديل: نص ]*\n\n» العضو: @${senderNum}\n» عدل كلامه:\n\n🔹 من:\n"${oldText}"\n\n🔹 إلى:\n"${newText}"\n\n${footer}`;

                            await sock.sendMessage(myBotPrivate, {
                                text: alertMsg,
                                mentions: [record.sender]
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error("خطأ تحديث التعديل:", e.message);
        }
    });
}

startBot();

