const { exec } = require("child_process");

module.exports = {
    // يعمل مباشرة بدون نقطة
    name: "نفذ",
    aliases: ["cmd", "شل", "terminal"],

    async execute(sock, mek, args) {
        const from = mek.key.remoteJid;

        // مصفوفة الأعلام التلقائية للحقوق
        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;

        // حماية صارمة: الأمر للمطورين فقط لخطورة التحكم في السيرفر
        const ALLOWED_OWNERS = ["249966162613", "249112520567"];
        const rawSender = mek.key.participant || mek.key.remoteJid || '';
        const senderNumber = rawSender.split("@")[0].replace(/[^0-9]/g, "");

        if (!ALLOWED_OWNERS.includes(senderNumber) && mek.key.fromMe !== true) {
            return; // تجاهل صامت تماماً لأي مستخدم آخر
        }

        // تجميع أمر اللينكس المكتوب بعد الكلمة المفتاحية
        const command = args.join(" ");

        if (!command) {
            return await sock.sendMessage(from, { 
                text: `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗧𝗘𝗥𝗠𝗜𝗡𝗔𝗟 ✦ 〕─╮\n\n ⚠️ *[ تنبيه ]*\n » يرجى كتابة أمر الـ Linux المطلوب تنفيذه بعد الكلمة.\n » مثال: *cmd ls*\n\n╰─────────────────────╯\n${footer}` 
            }, { quoted: mek });
        }

        // تفاعل البوت التلقائي بإيموجي التروس أثناء التنفيذ داخل الشل
        await sock.sendMessage(from, { react: { text: "⚙️", key: mek.key } });

        // تنفيذ الأمر داخل نظام Linux (Termux) برمجياً
        exec(command, async (error, stdout, stderr) => {
            let responseText = `╭─〔 ✦ 𝗗𝗔Ｒ𝗞 𝗧𝗘𝗥𝗠𝗜𝗡𝗔𝗟 ✦ 〕─╮\n\n`;

            if (error) {
                // في حال فشل الأمر أو حدوث خطأ في النظام
                responseText += `❌ *[ خـطـأ فـي الـتـنـفـيـذ ]*\n\`\`\`${error.message}\`\`\`\n\n`;
            } else if (stderr) {
                // في حال وجود تحذيرات أو أخطاء شل قياسية
                responseText += `⚠️ *[ تـنبـيـه الـنـظـام ]*\n\`\`\`${stderr}\`\`\`\n\n`;
            } else {
                // في حال نجاح الأمر وعودة النتيجة القياسية
                responseText += `✅ *[ نـتـيـجـة الـتـنـفـيـذ ]*\n\`\`\`${stdout || "تم تنفيذ الأمر بنجاح بدون مخرجات نصية."}\`\`\`\n\n`;
            }

            responseText += `╰─────────────────────╯\n${footer}`;

            // إرسال النتيجة المنسقة والمهيأة داخل كتل أكواد جاهزة للنسخ
            await sock.sendMessage(from, { text: responseText }, { quoted: mek });
        });
    }
};

