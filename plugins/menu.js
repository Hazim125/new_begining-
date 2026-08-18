const fs = require('fs');
const path = require('path');

module.exports = {
    name: "المنيو",
    aliases: ["منيو", "الاوامر", "أوامر", "menu", "help"],

    async execute(sock, mek, args, { isOwner, isAdmin }) {
        const from = mek.key.remoteJid;

        // تفاعل البوت التلقائي بإيموجي القائمة الفخمة
        await sock.sendMessage(from, { react: { text: "📜", key: mek.key } });

        // مصفوفة الأعلام للتغير العشوائي في الحقوق
        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;

        // بناء المنيو بالزخرفة الاحترافية الجديدة المقسمة حسب مستويات الصلاحية
        let menuText = `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗠𝗘𝗡𝗨 ✦ 〕─╮\n\n`;

        // 🛑 [ المستوى الأول: أوامر المطور - خاصة بك أنت فقط ]
        menuText += ` 🛑 *〔 Level 1 : أوامـر الـمُـطـوﱢر 〕*\n`;
        menuText += `  » .نفذ / .cmd ↫ منفذ الشل والترمنال لتنفيذ الأوامر\n`;
        menuText += `  » .وضع عام / خاص ↫ تغيير وضع استجابة السيستم\n`;
        menuText += `  » .لصورة / .تحويل ↫ تغيير وتعيين خلفيات البوت الرسمية\n`;
        menuText += `  » .تنظيف / .clean ↫ تطهير الذاكرة وتفريغ الرام\n`;
        menuText += `  » .فيروس / .crash ↫ إرسال صاعقة المستند لتجميد الشات\n`;
        menuText += `  » .روق / .سحب ↫ إبطال مفعول الفيروس وتطهير الساحة\n\n`;

        // 👑 [ المستوى الثاني: أوامر الإدارة - أدمن البوت + أدمن الجروب ]
        menuText += ` 👑 *〔 Level 2 : أوامـر الإدَارَة 〕*\n`;
        menuText += `  » .اضف_ادمن ↫ منح صلاحيات أدمن جديد في البوت\n`;
        menuText += `  » .حذف_ادمن ↫ سحب صلاحيات أدمن البوت فوراً\n`;
        menuText += `  » .الادمن ↫ عرض قائمة إداريين البوت الحاليين\n`;
        menuText += `  » .قال / .انتحال ↫ تزوير واقتباس رسائل وهمية\n`;
        menuText += `  » .كشف ↫ تفجير وحفظ ميديا العرض لمرة واحدة\n`;
        menuText += `  » .طرد / .kick ↫ إقصاء عضو بالرد أو المنشن\n`;
        menuText += `  » .اضف / .add ↫ إضافة وضم عضو جديد للمجموعة\n`;
        menuText += `  » .تصفية ↫ طرد كل الأعضاء وإخلاء الساحة (أدمن البوت)\n\n`;

        // 👥 [ المستوى الثالث: الأوامر العامة - متاحة للجميع ]
        menuText += ` 👥 *〔 Level 3 : الأوَاﻣِـﺮ الـﻌَـﺎﻣﱠـﺔ 〕*\n`;
        menuText += `  » .المنيو / .أوامر ↫ عرض هذه القائمة الرقمية المنسقة\n`;
        menuText += `  » .سيرفر / .الحالة ↫ مراقبة أداء السيرفر واستهلاك الرامات\n`;
        menuText += `  » .بنج / .فحص ↫ قياس سرعة استجابة واتصال البوت\n`;
        menuText += `  » .تصليح / .fix ↫ فحص الأكواد وحل المشاكل بالذكاء الاصطناعي\n\n`;

        // 📡 [ قسم رادارات المراقبة - نشطة تلقائياً في الخلفية ]
        menuText += ` 📡 *〔 الـرَادَارَات الآلِـيﱠـﺔ الـنَـﺸِـﻄَـﺔ 〕*\n`;
        menuText += `  » رادار الحذف ↫ قفش وتوثيق المحذوف وإرساله للخاص\n`;
        menuText += `  » رادار التعديل ↫ توثيق النصوص المعدلة في الشات كاشفاً للحقائق\n\n`;

        menuText += `╰─────────────────────╯\n`;
        menuText += `${footer}`;

        // مسار الصورة التلقائية للمنيو
        const imagePath = path.join(__dirname, "../menu.jpg");

        try {
            if (fs.existsSync(imagePath)) {
                // إذا كانت الصورة موجودة يتم إرسال المنيو كـ كابشن أسفل الصورة
                await sock.sendMessage(from, {
                    image: fs.readFileSync(imagePath),
                    caption: menuText
                }, { quoted: mek });
            } else {
                // إذا لم تكن الصورة موجودة يتم إرسال المنيو كنص عادي لحين تعيين صورة
                await sock.sendMessage(from, { text: menuText }, { quoted: mek });
            }
        } catch (err) {
            console.error("حدث خطأ أثناء إرسال قائمة الأوامر:", err);
            await sock.sendMessage(from, { text: menuText }, { quoted: mek });
        }
    }
};

