const axios = require('axios');

module.exports = {
    name: "رشق",
    aliases: ["زيادة", "views"],

    async execute(sock, mek, args, { isOwner }) {
        const from = mek.key.remoteJid;

        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;

        // حماية الأمر لك أنت فقط 👑
        if (!isOwner) {
            return await sock.sendMessage(from, { text: "⚠️ هذا الأمر خاص بكينج السيستم فقط لحماية السيرفر 👑" }, { quoted: mek });
        }

        const type = args[0]; // النوع
        const targetUrl = args[1]; // الرابط

        // اللوحات المجانية العامة تسمح برشق المشاهدات حالياً بدون كابتشا
        if (!type || !targetUrl || type !== "مشاهدات") {
            let helpText = `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗙𝗥𝗘𝗘 𝗦𝗠𝗠 ✦ 〕─╮\n\n`;
            helpText += ` 📊 *[ طريقة الرشق المجاني ]*\n`;
            helpText += ` » *.رشق مشاهدات [الرابط]*\n\n`;
            helpText += ` 💡 *[ مثال واضح ]*:\n`;
            helpText += `  » .رشق مشاهدات https://tiktok.com/...\n\n`;
            helpText += ` ⚠️ *[ تنبيه ]*: المتابعين واللايكات تتطلب كابتشا يدوية، لذلك الرشق التلقائي المجاني متاح للمشاهدات الحين بـ 1000 مشاهدة لكل طلب!\n`;
            helpText += `╰─────────────────────╯\n${footer}`;
            return await sock.sendMessage(from, { text: helpText }, { quoted: mek });
        }

        await sock.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        try {
            // استدعاء سيرفر الكشط المجاني المفتوح لضخ المشاهدات (بمعدل 1000 مشاهدة تلقائية)
            const res = await axios.get(`https://api.kyuurzy.site/api/tools/tiktok-views?url=${encodeURIComponent(targetUrl)}`).catch(() => null);

            // إذا السيرفر الأول مضغوط، نتحول تلقائياً للسيرفر البديل (Fallback)
            if (!res || !res.data || res.data.status !== true) {
                const fallbackRes = await axios.get(`https://api.sandipbaruwal.codes/tiktok/view?url=${encodeURIComponent(targetUrl)}`);
                if (fallbackRes.data && fallbackRes.data.status === "success") {
                    return await sendSuccessMessage(sock, from, mek, footer);
                }
                throw new Error("جميع الخوادم المجانية مضغوطة حالياً");
            }

            return await sendSuccessMessage(sock, from, mek, footer);

        } catch (err) {
            console.error("خطأ رشق مجاني:", err.message);
            await sock.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await sock.sendMessage(from, { 
                text: "❌ السيرفرات المجانية العامة تحت ضغط عالي الحين يا كينج.\nجرب ترسل الطلب مرة ثانية بعد دقيقة." 
            }, { quoted: mek });
        }
    }
};

// دالة إرسال رسالة النجاح الموحدة
async function sendSuccessMessage(sock, from, mek, footer) {
    await sock.sendMessage(from, { react: { text: "🚀", key: mek.key } });
    let successMsg = `╭─〔 ✦ 𝗦𝗠𝗠 𝗙𝗥𝗘𝗘 𝗦𝗨𝗖𝗖𝗘𝗦𝗦 ✦ 〕─╮\n\n`;
    successMsg += ` 🔥 *تم بدء ضخ المشاهدات بنجاح مجاناً!*\n\n`;
    successMsg += `  » الـنﱠـوع : مشاهدات تيك توك\n`;
    successMsg += `  » الـعَـدد : +1000 مشاهدة طلقة ⚡\n`;
    successMsg += `  » الـحـالـة : جاري الإرسال في الخلفية...\n\n`;
    successMsg += `╰─────────────────────╯\n${footer}`;
    return await sock.sendMessage(from, { text: successMsg }, { quoted: mek });
}

