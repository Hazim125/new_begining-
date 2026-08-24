const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("👑 DARK BOT IS ALIVE & RUNNING 24/7 👑"));
app.listen(PORT, () => console.log(`🌐 Web server running on port: ${PORT}`));

const SUPREME_OWNER = "249112520567"; 
const BOT_NAME = "DARK";

const commands = new Map();
const aliasesMap = new Map();

// --- 📂 قاعدة بيانات الرسائل ---
const dbPath = path.join(__dirname, "messages_db.json");

function loadDb() {
    if (!fs.existsSync(dbPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(dbPath, "utf8"));
    } catch {
        return {};
    }
}

function saveDb(data) {
    try {
        const keys = Object.keys(data);
        if (keys.length > 3000) {
            const keysToDelete = keys.slice(0, keys.length - 3000);
            keysToDelete.forEach(k => delete data[k]);
        }
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("خطأ في حفظ قاعدة البيانات:", e.message);
    }
}

const msgStorage = loadDb();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const adminsPath = path.join(__dirname, "admins.json");

function getAllowedAdmins() {
    let allowed = [SUPREME_OWNER];
    if (fs.existsSync(adminsPath)) {
        try {
            const fileData = JSON.parse(fs.readFileSync(adminsPath, "utf8"));
            if (Array.isArray(fileData)) allowed = fileData;
        } catch (e) { allowed = [SUPREME_OWNER]; }
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
        if (update.connection === "open") console.log(`\n✅ كينج دِارك! رادار الفضائح الدائم نشط الحين!`);
        if (update.connection === "close") startBot();
    });

    // 1️⃣ الاستماع الخاص بالتعديلات عبر messages.update (الحل المباشر للتعديل)
    sock.ev.on("messages.update", async (updates) => {
        for (const update of updates) {
            if (update.update?.message) {
                const targetId = update.key.id;
                const record = msgStorage[targetId];

                if (record && isRadarOn() === "on" && !update.key.fromMe) {
                    const newText = extractTextFromMsg(update.update.message);
                    const oldText = record.currentText || record.originalText || "";

                    if (newText && oldText && oldText !== newText) {
                        msgStorage[targetId].currentText = newText;
                        saveDb(msgStorage);

                        const myBotPrivate = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${getRandomFlag()}`;
                        const senderNum = record.sender.split("@")[0];

                        const alertMsg = `✏️ *[ رادار التعديل: نص ]*\n\n» العضو: @${senderNum}\n\n🔹 **قبل التعديل:**\n"${oldText}"\n\n🔹 **بعد التعديل:**\n"${newText}"\n\n${footer}`;

                        await sock.sendMessage(myBotPrivate, {
                            text: alertMsg,
                            mentions: [record.sender]
                        });
                    }
                }
            }
        }
    });

    // 2️⃣ استقبال الرسائل والحذف والأوامر
    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            if (chatUpdate.type !== "notify") return;
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;

            const msgId = mek.key.id;
            const type = Object.keys(mek.message)[0];
            const myBotPrivate = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${getRandomFlag()}`;

            // حفظ الرسائل الجديدة
            let extractedText = extractTextFromMsg(mek.message);
            if (!msgStorage[msgId] && type !== 'protocolMessage') {
                msgStorage[msgId] = {
                    originalText: extractedText,
                    currentText: extractedText,
                    sender: mek.key.participant || mek.key.remoteJid
                };
                saveDb(msgStorage);
            }

            // رادار الحذف
            const protocolMsg = mek.message.protocolMessage;
            if (type === 'protocolMessage' && protocolMsg?.type === 0) {
                if (isRadarOn() === "on" && !mek.key.fromMe) {
                    const deletedId = protocolMsg.key?.id;
                    const record = msgStorage[deletedId];

                    if (record) {
                        const senderNum = record.sender.split("@")[0];
                        const textToDelete = record.currentText || record.originalText;

                        if (textToDelete) {
                            const alertMsg = `🗑️ *[ رادار الحذف: نص ]*\n\n» العضو: @${senderNum}\n» حذف كلامه:\n\n💬 "${textToDelete}"\n\n${footer}`;
                            await sock.sendMessage(myBotPrivate, { text: alertMsg, mentions: [record.sender] });
                        }
                    }
                }
                return;
            }

            // تشغيل الأوامر
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
        } catch (e) { console.error("Error in upsert:", e); }
    });
}

startBot();

