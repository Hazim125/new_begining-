const axios = require('axios');

module.exports = {
    name: "تصليح",
    aliases: ["fix", "صلح", "اصلاح"],

    async execute(sock, mek, args) {
        const from = mek.key.remoteJid;

        // تفاعل البوت التلقائي بإيموجي المطرقة والمفك أثناء المعالجة
        await sock.sendMessage(from, { react: { text: "🛠️", key: mek.key } });

        // مصفوفة الأعلام التلقائية للحقوق
        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;

        let codeToFix = "";

        // 1. جلب الكود أو الخطأ عن طريق الرد (Reply) على الرسالة
        if (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = mek.message.extendedTextMessage.contextInfo.quotedMessage;
            codeToFix = quoted.conversation || quoted.extendedTextMessage?.text || "";
        } 
        // 2. جلب الكود إذا تم كتابته مباشرة بعد الأمر
        else if (args.length > 0) {
            codeToFix = args.join(" ");
        }

        // إذا لم يتم توفير كود أو خطأ لتصليحه
        if (!codeToFix) {
            return await sock.sendMessage(from, { 
                text: `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗠𝗘𝗡𝗨 ✦ 〕─╮\n\n ⚠️ *[ تنبيه النظام ]*\n » يرجى الرد على الكود/الخطأ بأمر *.fix* أو كتابته مباشرة بعد الأمر.\n\n╰─────────────────────╯\n${footer}` 
            }, { quoted: mek });
        }

        // إعلام المستخدم بأن المعالجة الذكية بدأت
        await sock.sendMessage(from, { text: "⏳ *[ جاري تحليل الكود واستخراج الأخطاء برمجياً... ]*" }, { quoted: mek });

        try {
            // صياغة البرومبت الموجه للذكاء الاصطناعي ليعطي إجابة برمجية بحتة ومختصرة
            const systemPrompt = `أنت خبير برمجي ومطور حلول ذكي. قم بتحليل الكود أو الخطأ التالي واكتشف المشكلة، ثم قم بإعطائي الكود المصحح كاملاً ونظيفاً مع شرح سريع جداً ومختصر لمكان الخطأ وكيف تم حله باللغة العربية.`;
            
            // استخدام الـ API المجاني البديل والمفتوح للجميع دون الحاجة لمفتاح
            const response = await axios.get(`https://aemt.me/gpt4`, {
                params: {
                    text: `${systemPrompt}\n\nالمحتوى المطلوب فصحه:\n${codeToFix}`
                }
            });

            // استخراج النص الراجع من السيرفر المجاني
            const aiResult = response.data.result || response.data.text;

            if (!aiResult) throw new Error("استجابة فارغة من السيرفر");

            // بناء واجهة النتيجة بزخرفتك المفضلة
            let resultText = `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗙𝗜𝗫 ✦ 〕─╮\n\n`;
            resultText += `${aiResult}\n\n`;
            resultText += `╰─────────────────────╯\n`;
            resultText += `${footer}`;

            await sock.sendMessage(from, { text: resultText }, { quoted: mek });

        } catch (err) {
            console.error("خطأ في الاتصال بالسيرفر المجاني:", err);
            
            // رسالة خطأ احتياطية منسقة بالزخرفة في حال فشل السيرفر المؤقت
            let errorText = `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗙𝗜𝗫 ✦ 〕─╮\n\n`;
            errorText += `❌ *فشل الاتصال بالنواة الذكية.*\n`;
            errorText += `يبدو أن خادم المعالجة المجاني مضغوط حالياً، يرجى المحاولة مرة أخرى لاحقاً.\n\n`;
            errorText += `╰─────────────────────╯\n`;
            errorText += `${footer}`;

            await sock.sendMessage(from, { text: errorText }, { quoted: mek });
        }
    }
};

