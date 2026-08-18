const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports = {
    // يعمل مباشرة بدون نقطة
    name: "حالة_السيرفر",
    aliases: ["status", "الحالة", "سيرفر"],

    async execute(sock, mek, args) {
        const from = mek.key.remoteJid;

        // تفاعل تلقائي بإيموجي الكمبيوتر
        await sock.sendMessage(from, { react: { text: "🖥️", key: mek.key } });

        // مصفوفة الأعلام التلقائية للحقوق
        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;

        // 1. حساب تشغيل السيرفر (Uptime) تحويله لساعات ودقائق
        const uptimeSeconds = os.uptime();
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const uptimeString = `${hours} ساعة و ${minutes} دقيقة`;

        // 2. حساب استهلاك الذاكرة العشوائية (RAM) بـ الجيجا بايت
        const totalMemory = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
        const freeMemory = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
        const usedMemory = (totalMemory - freeMemory).toFixed(2);

        // 3. جلب معلومات نظام التشغيل والمعالج مع حماية Termux
        const platform = os.platform() === 'linux' ? '🐧 Linux (Termux)' : os.platform();
        
        let cpuModel = "Android / Termux Processor";
        try {
            const cpus = os.cpus();
            if (cpus && cpus.length > 0 && cpus[0].model) {
                cpuModel = cpus[0].model.replace(/\s+/g, ' ').trim();
            }
        } catch (e) {
            // حماية في حال عدم صلاحية القراءة من أندرويد
        }

        // بناء تقرير المراقبة بالزخرفة المفضلة
        let statusText = `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗦𝗧𝗔𝗧𝗨𝗦 ✦ 〕─╮\n\n`;
        statusText += ` 📡 *〔 مُـرَاقِـب الـنﱢـﻈَـﺎم 〕*\n`;
        statusText += `  » نظام التشغيل: ${platform}\n`;
        statusText += `  » مدة التشغيل: ${uptimeString}\n\n`;
        
        statusText += ` 🧠 *〔 الـذﱠاﻛِـﺮَﺓ الـﻌَـﺸْـﻮَاﺋِـﻴﱠـﺔ 〕*\n`;
        statusText += `  » المستهلك: ${usedMemory} GB\n`;
        statusText += `  » المتبقي: ${freeMemory} GB\n`;
        statusText += `  » الإجمالي: ${totalMemory} GB\n\n`;

        statusText += ` ⚙️ *〔 الـﻤُـﻌَـﺎﻟِـﺞ CPU 〕*\n`;
        statusText += `  » النوع: ${cpuModel}\n\n`;
        
        statusText += `╰─────────────────────╯\n`;
        statusText += `${footer}`;

        // مسار صورة حالة السيرفر الخاصة والمنفصلة تماماً
        const imagePath = path.join(__dirname, "../status.jpg");

        try {
            if (fs.existsSync(imagePath)) {
                // إذا كانت صورة status.jpg موجودة يتم إرسال التقرير أسفلها
                await sock.sendMessage(from, {
                    image: fs.readFileSync(imagePath),
                    caption: statusText
                }, { quoted: mek });
            } else {
                // إذا لم تكن موجودة يتم إرسال النص عادي لحين وضع الصورة في مجلد البوت الرئيسي
                await sock.sendMessage(from, { text: statusText }, { quoted: mek });
            }
        } catch (err) {
            console.error("حدث خطأ أثناء إرسال حالة السيرفر:", err);
            await sock.sendMessage(from, { text: statusText }, { quoted: mek });
        }
    }
};

