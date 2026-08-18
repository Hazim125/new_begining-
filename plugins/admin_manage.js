const fs = require("fs");
const path = require("path");

// مسار ملف حفظ الإداريين المشترك
const adminsPath = path.join(__dirname, "../admins.json");

// دالة لجلب قائمة الإداريين الحالية
function getAdmins() {
    if (!fs.existsSync(adminsPath)) {
        // رقمك الأساسي الصحيح يتم تثبيته هنا كجدار حماية افتراضي
        const defaultAdmins = ["249112520567"];
        fs.writeFileSync(adminsPath, JSON.stringify(defaultAdmins, null, 2));
        return defaultAdmins;
    }
    try {
        return JSON.parse(fs.readFileSync(adminsPath, "utf8"));
    } catch (e) {
        return ["249112520567"];
    }
}

// دالة لحفظ القائمة
function saveAdmins(adminsList) {
    fs.writeFileSync(adminsPath, JSON.stringify(adminsList, null, 2));
}

module.exports = {
    name: "أدمن",
    aliases: ["اضف_ادمن", "حذف_ادمن", "الادمن"],

    async execute(sock, mek, args, { lookupName }) {
        const from = mek.key.remoteJid;
        
        // جلب رقم مرسل الأمر
        const rawSender = mek.key.participant || mek.key.remoteJid || '';
        const senderNumber = rawSender.split("@")[0].replace(/[^0-9]/g, "");
        
        // جدار الحماية: الرقم الأساسي الصحيح لك فقط لضمان السيطرة الكاملة
        const SUPREME_OWNER = "249112520567";
        if (senderNumber !== SUPREME_OWNER && mek.key.fromMe !== true) return;

        // الحقوق والزخرفة المعتمدة بالكامل
        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `>  𝘋𝘈𝘙𝘒 𝘉𝘖𝘛 · ${randomFlag}`;

        let currentAdmins = getAdmins();

        // ─────── [ 1. أمر إضافة أدمن بـ 3 طرق ] ───────
        if (lookupName === "اضف_ادمن") {
            let targetNum = "";

            // 1. طريقة الرد على الرسالة (Reply)
            if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
                targetNum = mek.message.extendedTextMessage.contextInfo.participant.split("@")[0];
            } 
            // 2. طريقة المنشن (Mention)
            else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                targetNum = mek.message.extendedTextMessage.contextInfo.mentionedJid[0].split("@")[0];
            } 
            // 3. طريقة كتابة الرقم مباشرة في نص الأمر (Text)
            else if (args[0]) {
                targetNum = args[0].replace(/[^0-9]/g, "");
            }

            if (!targetNum || targetNum.length < 8) {
                return await sock.sendMessage(from, { 
                    text: `⚠️ *يرجى تحديد العضو بإحدى الطرق التالية:*\n1. الرد على رسالته (.اضف_ادمن)\n2. منشن العضو (.اضف_ادمن @اسم_الشخص)\n3. كتابة رقمه مباشرة (.اضف_ادمن 2491111111)` 
                }, { quoted: mek });
            }

            if (currentAdmins.includes(targetNum)) {
                return await sock.sendMessage(from, { text: `📊 العضو @${targetNum} مضاف بالفعل كأدمن في النظام الحين.`, mentions: [`${targetNum}@s.whatsapp.net`] }, { quoted: mek });
            }

            currentAdmins.push(targetNum);
            saveAdmins(currentAdmins);

            await sock.sendMessage(from, { react: { text: "👑", key: mek.key } });
            return await sock.sendMessage(from, { 
                text: `✅ *تمت إضافة أدمن جديد لنظام الحماية:*\n\n» العضو: @${targetNum}\n» بات يمتلك صلاحية كاملة لاستخدام الأوامر الحين.\n\n${footer}`,
                mentions: [`${targetNum}@s.whatsapp.net`]
            }, { quoted: mek });
        }

        // ─────── [ 2. أمر حذف أدمن بـ 3 طرق ] ───────
        if (lookupName === "حذف_ادمن") {
            let targetNum = "";

            if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
                targetNum = mek.message.extendedTextMessage.contextInfo.participant.split("@")[0];
            } else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
                targetNum = mek.message.extendedTextMessage.contextInfo.mentionedJid[0].split("@")[0];
            } else if (args[0]) {
                targetNum = args[0].replace(/[^0-9]/g, "");
            }

            if (!targetNum) {
                return await sock.sendMessage(from, { text: `⚠️ يرجى الرد على الإداري، أو منشنته، أو كتابة رقمه لسحب صلاحياته.` }, { quoted: mek });
            }

            if (targetNum === SUPREME_OWNER) {
                return await sock.sendMessage(from, { text: `❌ لا يمكنك حذف نفسك من النظام كمالك أساسي يا كينج.` }, { quoted: mek });
            }

            if (!currentAdmins.includes(targetNum)) {
                return await sock.sendMessage(from, { text: `📊 العضو ليس أدمن في النظام من البداية.` }, { quoted: mek });
            }

            currentAdmins = currentAdmins.filter(num => num !== targetNum);
            saveAdmins(currentAdmins);

            await sock.sendMessage(from, { react: { text: "⚙️", key: mek.key } });
            return await sock.sendMessage(from, { 
                text: `🗑️ *تم سحب صلاحيات الأدمن بنجاح:*\n\n» العضو: @${targetNum}\n» تم إقصاؤه وعاد كعضو عادي الحين في السيستم.\n\n${footer}`,
                mentions: [`${targetNum}@s.whatsapp.net`]
            }, { quoted: mek });
        }

        // ─────── [ 3. أمر عرض القائمة الحالية ] ───────
        if (lookupName === "الادمن" || lookupName === "أدمن") {
            let listMsg = `*👑 قـائـمـة إداريـيـن 𝘋𝘈𝘙𝘒 𝘉𝘖𝘛 👑*\n\n`;
            const mentionsArray = [];

            currentAdmins.forEach((admin, index) => {
                listMsg += `${index + 1} - @${admin}\n`;
                mentionsArray.push(`${admin}@s.whatsapp.net`);
            });

            listMsg += `\n${footer}`;
            return await sock.sendMessage(from, { text: listMsg, mentions: mentionsArray }, { quoted: mek });
        }
    }
};

