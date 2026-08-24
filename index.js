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
const msgStorage = new Map();

/*
 * 🛡️ حماية من تكرار تنبيه التعديل
 * لأن بعض إصدارات Baileys قد تمرر التعديل بأكثر من حدث.
 */
const editAlertCache = new Map();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (text) =>
    new Promise((resolve) => rl.question(text, resolve));

const adminsPath = path.join(__dirname, "admins.json");

function getAllowedAdmins() {
    let allowed = [SUPREME_OWNER];

    if (fs.existsSync(adminsPath)) {
        try {
            const fileData = JSON.parse(
                fs.readFileSync(adminsPath, "utf8")
            );

            if (Array.isArray(fileData)) {
                allowed = fileData;
            }
        } catch (e) {
            allowed = [SUPREME_OWNER];
        }
    }

    if (!allowed.includes(SUPREME_OWNER)) {
        allowed.push(SUPREME_OWNER);
    }

    return allowed;
}

function getBotMode() {
    const statusPath = path.join(__dirname, "status.txt");

    return fs.existsSync(statusPath)
        ? fs.readFileSync(statusPath, "utf8").trim()
        : "public";
}

function isRadarOn() {
    const radarPath = path.join(__dirname, "radar_status.txt");

    return fs.existsSync(radarPath)
        ? fs.readFileSync(radarPath, "utf8").trim()
        : "off";
}

function getRandomFlag() {
    const flags = [
        "🇲🇨",
        "🇯🇵",
        "🇸🇩",
        "🇷🇺",
        "🇨🇦",
        "🇩🇪",
        "🇰🇵",
        "🇺🇸"
    ];

    return flags[Math.floor(Math.random() * flags.length)];
}

/*
 * 📝 استخراج النص من الرسالة
 */
function extractTextFromMsg(msgObj) {
    if (!msgObj) return "";

    const type = Object.keys(msgObj)[0];

    if (type === "conversation") {
        return msgObj.conversation || "";
    }

    if (type === "extendedTextMessage") {
        return msgObj.extendedTextMessage?.text || "";
    }

    if (msgObj[type]?.caption) {
        return msgObj[type].caption;
    }

    return "";
}

/*
 * 🧹 تنظيف النص
 */
function cleanText(text) {
    if (typeof text !== "string") return "";
    return text.trim();
}

/*
 * 🔎 استخراج الرسالة المعدلة
 *
 * يدعم أكثر من شكل حتى لا يتعطل الرادار
 * بسبب اختلاف إصدار Baileys.
 */
function extractEditedMessage(update) {
    if (!update) return null;

    /*
     * الشكل الأساسي في messages.update
     *
     * update.message.editedMessage.message
     */
    if (update.message?.editedMessage?.message) {
        return update.message.editedMessage.message;
    }

    /*
     * احتياط لبعض الصيغ الأخرى
     */
    if (update.editedMessage?.message) {
        return update.editedMessage.message;
    }

    if (update.message?.protocolMessage?.editedMessage) {
        return update.message.protocolMessage.editedMessage;
    }

    return null;
}

/*
 * 🔐 فحص هل الرسالة تخص البوت نفسه
 */
function isBotMessage(key, record, myBotPrivate) {
    if (key?.fromMe === true) return true;

    if (record?.sender && record.sender === myBotPrivate) {
        return true;
    }

    return false;
}

/*
 * ✏️ معالجة التعديل
 *
 * هذه هي الوظيفة الأساسية لرادار التعديل.
 */
async function handleEditedMessage(sock, key, update, myBotPrivate, footer) {
    try {
        if (isRadarOn() !== "on") return;

        const editedMessage = extractEditedMessage(update);

        if (!editedMessage) return;

        const targetId = key?.id;

        if (!targetId) return;

        /*
         * البحث عن الرسالة الأصلية
         */
        const record = msgStorage.get(targetId);

        /*
         * إذا الرسالة الأصلية غير موجودة في الذاكرة
         * لا نستطيع معرفة النص القديم.
         */
        if (!record) {
            return;
        }

        /*
         * لا نريد مراقبة تعديلات البوت نفسه
         */
        if (isBotMessage(key, record, myBotPrivate)) {
            return;
        }

        /*
         * استخراج النص الجديد
         */
        const newText = cleanText(
            extractTextFromMsg(editedMessage)
        );

        /*
         * إذا التعديل ليس نصيًا
         */
        if (!newText) {
            return;
        }

        /*
         * النص القديم
         *
         * currentText مهم جدًا:
         *
         * سلام
         * ↓ تعديل
         * هلا
         * ↓ تعديل
         * كيفكم
         *
         * عند التعديل الثاني نقارن:
         *
         * هلا ← كيفكم
         */
        const oldText = cleanText(
            record.currentText || record.originalText || ""
        );

        /*
         * إذا لم يتغير النص فعلًا
         * لا نرسل أي تنبيه.
         */
        if (!oldText || oldText === newText) {
            return;
        }

        /*
         * حماية إضافية من التكرار
         *
         * لو وصل نفس التعديل مرتين:
         *
         * ID + النص الجديد
         *
         * لن نرسل التنبيه مرتين.
         */
        const editCacheKey = `${targetId}:${newText}`;

        if (editAlertCache.has(editCacheKey)) {
            return;
        }

        editAlertCache.set(editCacheKey, Date.now());

        /*
         * تحديث النص المخزن
         */
        record.currentText = newText;

        msgStorage.set(targetId, record);

        /*
         * بيانات صاحب الرسالة
         */
        const sender =
            record.sender ||
            key?.participant ||
            key?.remoteJid;

        if (!sender) return;

        const senderNum = sender.split("@")[0];

        /*
         * رسالة التنبيه
         */
        const alertMsg =
`✏️ *[ رادار التعديل: نص ]*

» العضو: @${senderNum}

🔹 *قبل التعديل:*
"${oldText}"

🔹 *بعد التعديل:*
"${newText}"

${footer}`;

        /*
         * إرسال التنبيه للخاص
         */
        await sock.sendMessage(myBotPrivate, {
            text: alertMsg,
            mentions: [sender]
        });

    } catch (e) {
        console.error("❌ خطأ في رادار التعديل:", e);
    }
}

/*
 * 🧹 تنظيف Cache التعديلات
 */
function cleanEditCache() {
    const now = Date.now();

    for (const [key, time] of editAlertCache.entries()) {
        /*
         * حذف العناصر الأقدم من 5 دقائق
         */
        if (now - time > 5 * 60 * 1000) {
            editAlertCache.delete(key);
        }
    }
}

/*
 * 🔌 تحميل الإضافات
 */
function loadPlugins() {
    commands.clear();
    aliasesMap.clear();

    const pluginsPath = path.join(__dirname, "plugins");

    if (!fs.existsSync(pluginsPath)) return;

    const files = fs
        .readdirSync(pluginsPath)
        .filter((file) => file.endsWith(".js"));

    for (const file of files) {
        const pluginPath = path.join(pluginsPath, file);

        try {
            delete require.cache[require.resolve(pluginPath)];

            const plugin = require(pluginPath);

            if (plugin.name && plugin.execute) {
                commands.set(
                    plugin.name.toString().trim().toLowerCase(),
                    plugin
                );

                if (plugin.aliases) {
                    plugin.aliases.forEach((alias) => {
                        aliasesMap.set(
                            alias.toString().trim().toLowerCase(),
                            plugin
                        );
                    });
                }
            }
        } catch (e) {
            console.log(`❌ خطأ في ${file}:`, e.message);
        }
    }
}

/*
 * 🤖 تشغيل البوت
 */
async function startBot() {
    loadPlugins();

    const { state, saveCreds } =
        await useMultiFileAuthState("./session");

    const { version } =
        await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        version,
        browser: ["Ubuntu", "Chrome", "20.0.0.4"]
    });

    /*
     * 🔗 نظام الربط بالكود
     */
    if (!sock.authState.creds.registered) {
        console.log(
            `\n👑 نظام ربط DARK BOT المطور عبر الكود 👑`
        );

        let phoneNumber = await question(
            "📝 أدخل رقم هاتف البوت مع رمز الدولة: "
        );

        phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

        if (!phoneNumber) process.exit(0);

        setTimeout(async () => {
            try {
                let code =
                    await sock.requestPairingCode(phoneNumber);

                code =
                    code?.match(/.{1,4}/g)?.join("-") ||
                    code;

                console.log(
                    `\n🔥 كود الربط الخاص بك هو: 【 ${code} 】\n`
                );

            } catch (err) {
                console.log(
                    "❌ خطأ في الكود:",
                    err.message
                );
            }
        }, 3000);
    }

    /*
     * 💾 حفظ بيانات الجلسة
     */
    sock.ev.on("creds.update", saveCreds);

    /*
     * 🔌 حالة الاتصال
     */
    sock.ev.on("connection.update", (update) => {
        if (update.connection === "open") {
            console.log(
                `\n✅ كينج دِارك! رادار الفضائح والميديا نشط الحين!`
            );
        }

        if (update.connection === "close") {
            startBot();
        }
    });

    /*
     * 📩 استقبال الرسائل
     *
     * هنا:
     * - الرسائل العادية
     * - الأوامر
     * - الحذف
     * - احتياط للتعديل في protocolMessage
     */
    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            if (chatUpdate.type !== "notify") return;

            const mek = chatUpdate.messages[0];

            if (!mek.message) return;

            const msgId = mek.key.id;

            const type =
                Object.keys(mek.message)[0];

            const myBotPrivate =
                sock.user.id.split(":")[0] +
                "@s.whatsapp.net";

            const footer =
                `> |  Ⓗ DARK ZENIN ᴏғғ ${getRandomFlag()}`;

            /*
             * 1️⃣ التقاط الرسالة العادية وحفظها
             */
            let extractedText =
                extractTextFromMsg(mek.message);

            if (
                !msgStorage.has(msgId) &&
                type !== "protocolMessage"
            ) {
                msgStorage.set(msgId, {
                    originalText: cleanText(extractedText),
                    currentText: cleanText(extractedText),
                    sender:
                        mek.key.participant ||
                        mek.key.remoteJid,
                    raw: mek
                });
            }

            /*
             * 🧹 تنظيف الذاكرة
             */
            if (msgStorage.size > 5000) {
                const firstKey =
                    msgStorage.keys().next().value;

                msgStorage.delete(firstKey);
            }

            /*
             * 2️⃣ احتياط لرادار التعديل
             *
             * بعض الحالات/الإصدارات قد ترسل
             * protocolMessage type 14.
             *
             * لذلك لا نعتمد عليه وحده،
             * ولكن ندعمه أيضًا.
             */
            if (
                type === "protocolMessage" &&
                mek.message.protocolMessage?.type === 14
            ) {
                const protocol =
                    mek.message.protocolMessage;

                const editedMsgObj =
                    protocol.editedMessage;

                const targetId =
                    protocol.key?.id;

                if (editedMsgObj && targetId) {
                    await handleEditedMessage(
                        sock,
                        {
                            ...protocol.key,
                            fromMe:
                                mek.key.fromMe ||
                                protocol.key?.fromMe
                        },
                        {
                            message:
                                editedMsgObj.message ||
                                editedMsgObj
                        },
                        myBotPrivate,
                        footer
                    );
                }

                /*
                 * لا نعامل التعديل كأمر
                 */
                return;
            }

            /*
             * 3️⃣ رادار الحذف
             */
            if (
                type === "protocolMessage" &&
                mek.message.protocolMessage?.type === 0
            ) {
                if (
                    isRadarOn() === "on" &&
                    !mek.key.fromMe
                ) {
                    const deletedId =
                        mek.message.protocolMessage.key.id;

                    const record =
                        msgStorage.get(deletedId);

                    if (record) {
                        const senderNum =
                            record.sender.split("@")[0];

                        const textToDelete =
                            record.currentText ||
                            record.originalText;

                        if (textToDelete) {
                            const alertMsg =
`🗑️ *[ رادار الحذف: نص ]*

» العضو: @${senderNum}
» حذف كلامه:

💬 "${textToDelete}"

${footer}`;

                            await sock.sendMessage(
                                myBotPrivate,
                                {
                                    text: alertMsg,
                                    mentions: [
                                        record.sender
                                    ]
                                }
                            );
                        }
                    }
                }

                return;
            }

            /*
             * 4️⃣ تشغيل الأوامر
             */
            let body =
                extractedText || "";

            body = body.trim();

            if (!body) return;

            const args =
                body.split(/ +/);

            const lookupName =
                args.shift().toLowerCase();

            const rawSender =
                mek.key.participant ||
                mek.key.remoteJid ||
                "";

            const senderNumber =
                rawSender
                    .split("@")[0]
                    .replace(/[^0-9]/g, "");

            const currentAdmins =
                getAllowedAdmins();

            const isOwner =
                (
                    senderNumber === SUPREME_OWNER ||
                    mek.key.fromMe === true
                );

            const isAdmin =
                currentAdmins.includes(senderNumber);

            const currentMode =
                getBotMode();

            if (
                currentMode === "self" &&
                !isAdmin &&
                !isOwner
            ) {
                return;
            }

            const command =
                commands.get(lookupName) ||
                aliasesMap.get(lookupName);

            if (command) {
                const hasPermission =
                    isOwner || isAdmin;

                await command.execute(
                    sock,
                    mek,
                    args,
                    {
                        BOT_NAME,
                        lookupName,
                        isOwner: hasPermission,
                        isAdmin,
                        currentAdmins
                    }
                );
            }

        } catch (e) {
            console.error(
                "Error in upsert:",
                e
            );
        }
    });

    /*
     * =====================================================
     * ✏️ رادار التعديل الأساسي
     * =====================================================
     *
     * Baileys يرسل تعديل الرسالة هنا.
     *
     * الشكل:
     *
     * messages.update
     *      ↓
     * update.message.editedMessage.message
     *
     */
    sock.ev.on("messages.update", async (updates) => {
        try {
            if (!Array.isArray(updates)) return;

            const myBotPrivate =
                sock.user.id.split(":")[0] +
                "@s.whatsapp.net";

            const footer =
                `> |  Ⓗ DARK ZENIN ᴏғғ ${getRandomFlag()}`;

            for (const item of updates) {
                try {
                    if (!item) continue;

                    const key =
                        item.key;

                    const update =
                        item.update;

                    if (!key || !update) {
                        continue;
                    }

                    /*
                     * إرسال التعديل إلى المعالج
                     */
                    await handleEditedMessage(
                        sock,
                        key,
                        update,
                        myBotPrivate,
                        footer
                    );

                } catch (err) {
                    console.error(
                        "❌ خطأ في معالجة تعديل:",
                        err
                    );
                }
            }

        } catch (e) {
            console.error(
                "❌ خطأ في messages.update:",
                e
            );
        }
    });

    /*
     * 🧹 تنظيف Cache التعديلات كل دقيقة
     */
    setInterval(() => {
        cleanEditCache();
    }, 60 * 1000);
}

/*
 * 🚀 تشغيل DARK BOT
 */
startBot();
