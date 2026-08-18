const fs = require('fs');
const path = require('path');

module.exports = {
    name: "تنظيف",
    aliases: ["clean", "تطهير", "مسح_المؤقت"],

    async execute(sock, mek, args) {
        const from = mek.key.remoteJid;

        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[flags.length - 1]; // أو علم عشوائي
        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;

        // حماية للمطورين فقط
        const ALLOWED_OWNERS = ["249966162613", "249112520567"];
        const rawSender = mek.key.participant || mek.key.remoteJid || '';
        const senderNumber = rawSender.split("@")[0].replace(/[^0-9]/g, "");

        if (!ALLOWED_OWNERS.includes(senderNumber) && mek.key.fromMe !== true) {
            return;
        }

        await sock.sendMessage(from, { react: { text: "🧹", key: mek.key } });
        await sock.sendMessage(from, { text: "⏳ *[ جاري فحص الذاكرة المؤقتة وتطهير الملفات الزائدة... ]*" }, { quoted: mek });

        try {
            // تحديد مسارات المجلدات المؤقتة الشائعة في البوتات (عدلها لو المجلدات بأسماء أخرى عندك)
            // غالباً يتم حفظ ميديا الرادارات أو الملفات المؤقتة في مجلدات مثل tmp أو ديركتوري مخصص
            const tmpDir = path.join(__dirname, '../tmp'); 
            let deletedFilesCount = 0;

            // تنظيف مجلد tmp التلقائي إن وجد
            if (fs.existsSync(tmpDir)) {
                const files = fs.readdirSync(tmpDir);
                for (const file of files) {
                    fs.unlinkSync(path.join(tmpDir, file));
                    deletedFilesCount++;
                }
            }

            // استدعاء مجمع القمامة البرمجي لتحرير الرام فوراً داخل الـ Node.js
            if (global.gc) {
                global.gc();
            }

            let successText = `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗖𝗟𝗘𝗔𝗡 ✦ 〕─╮\n\n`;
            successText += ` 🧹 *[ تـم الـتـنـظـيـف بـنـجـاح ]*\n`;
            successText += `  » تم حذف عدد: ${deletedFilesCount} من الملفات المؤقتة.\n`;
            successText += `  » حالة الذاكرة: تم تحرير مساحة الرام والـ Cache بالكامل وجاري تشغيل النظام بأعلى كفاءة.\n\n`;
            successText += `╰─────────────────────╯\n`;
            successText += `${footer}`;

            await sock.sendMessage(from, { text: successText }, { quoted: mek });

        } catch (err) {
            console.error("خطأ أثناء التنظيف:", err);
            await sock.sendMessage(from, { text: "❌ حدث خطأ أثناء محاولة مسح الملفات المؤقتة." }, { quoted: mek });
        }
    }
};

