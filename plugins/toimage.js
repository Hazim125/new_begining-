const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "لصورة",
    aliases: ["تحويل", "لصوره", "تو_إيمج"],

    async execute(sock, mek, args, { isOwner }) {
        const from = mek.key.remoteJid;

        // حماية مطلقة: للمطور الأساسي فقط بدون أدمنية البوت
        if (!isOwner || mek.key.fromMe === false && mek.key.participant?.split("@")[0] !== "249112520567") return;

        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;

        let quotedMek = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let messageType = mek.message?.imageMessage ? mek.message.imageMessage : null;

        if (quotedMek) {
            if (quotedMek.imageMessage) messageType = quotedMek.imageMessage;
            else if (quotedMek.viewOnceMessage?.message?.imageMessage) messageType = quotedMek.viewOnceMessage.message.imageMessage;
            else if (quotedMek.viewOnceMessageV2?.message?.imageMessage) messageType = quotedMek.viewOnceMessageV2.message.imageMessage;
        }

        if (!messageType) {
            return await sock.sendMessage(from, {
                text: `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗦𝗬𝗦𝗧𝗘𝗠 ✦ 〕─╮\n\n 📊 *[ طريقة الاستخدام ]*\n » قم بالرد على صورة باستخدام:\n 📝 *تحويل* ↫ لتغيير خلفية المنيو الرسمية.\n 📝 *تحويل حالة* ↫ لتغيير خلفية شاشة حالة السيرفر.\n\n╰─────────────────────╯\n${footer}`
            }, { quoted: mek });
        }

        try {
            await sock.sendMessage(from, { text: "⏳ *[ جاري معالجة الصورة وحفظها بالنظام... ]*" }, { quoted: mek });

            const stream = await downloadContentFromMessage(messageType, "image");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

            let fileName = "menu.jpg";
            let targetName = "خلفية رسمية للمنيو الرئيسي";

            if (args.length > 0 && (args[0] === "حالة" || args[0] === "حاله" || args[0] === "سيرفر")) {
                fileName = "status.jpg";
                targetName = "خلفية رسمية لشاشة حالة السيرفر";
            }

            const targetPath = path.join(__dirname, `../${fileName}`);
            fs.writeFileSync(targetPath, buffer);

            const successMessage = `╭─〔 ✦ 𝗜𝗠𝗔𝗚𝗘 𝗦𝗔𝗩𝗘𝗗 ✦ 〕─╮\n\n  » تم تحويل وحفظ الصورة بنجاح!\n  » تم تعيينها كـ ${targetName}.\n\n╰─────────────────────╯\n${footer}`;
            await sock.sendMessage(from, { image: buffer, caption: successMessage }, { quoted: mek });
        } catch (err) {
            await sock.sendMessage(from, { text: "❌ حدث خطأ غير متوقع أثناء معالجة الصورة في النظام." }, { quoted: mek });
        }
    }
};

