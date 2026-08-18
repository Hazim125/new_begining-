const os = require('os');

module.exports = {
    name: "بنج",
    aliases: ["ping", "فحص"],

    async execute(sock, mek, args, { BOT_NAME }) {
        const from = mek.key.remoteJid;
        
        // حساب سرعة الاستجابة (Ping)
        const startTime = Date.now();
        const ping = Date.now() - startTime; 

        // حساب وقت تشغيل السيرفر (Uptime)
        const uptimeSeconds = os.uptime();
        const days = Math.floor(uptimeSeconds / (24 * 3600));
        const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        
        let uptimeString = '';
        if (days > 0) uptimeString += `${days} يوم `;;
        if (hours > 0) uptimeString += `${hours} ساعة `;;
        uptimeString += `${minutes} دقيقة`;

        // جلب معلومات استهلاك الذاكرة والنظام
        const totalRam = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
        const freeRam = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
        const usedRam = (totalRam - freeRam).toFixed(2);

        // مصفوفة تحتوي على الـ 4 زخرفات الفخمة التي أرسلتها بالترتيب
        const designs = [
            // التصميم الأول
`╭━━━〔 ⚡ 𝗗𝗔𝗥𝗞 𝗦𝗬𝗦𝗧𝗘𝗠 ⚡ 〕━━━╮

┃ 🛰️ 𝗣𝗜𝗡𝗚 𝗦𝗧𝗔𝗧𝗨𝗦
┃
┃ ⏱️ السرعة     :: ${ping} ms
┃ ⌛ التشغيل    :: ${uptimeString}
┃ 🟢 الحالة     :: مستقر ونشط
┃ 🖥️ المعمارية  :: ${os.arch()}
┃ 💾 الرام       :: ${usedRam} GB / ${totalRam} GB
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
⚡ Powered By DARK ⚡`,

            // التصميم الثاني
`┏━━━━━━━━━━━━━━━━━━━━┓
┃ 𖤍 𝗗𝗔𝗥𝗞 𝗖𝗢𝗥𝗘 𖤍
┗━━━━━━━━━━━━━━━━━━━━┛

╭─〔 ⚡ SYSTEM STATUS 〕─╮

➤ Response : ${ping} ms
➤ Uptime   : ${uptimeString}
➤ Status   : ONLINE 🟢
➤ Arch     : ${os.arch()}
➤ Memory   : ${usedRam} GB / ${totalRam} GB

╰─────────────────────╯`,

            // التصميم الثالث
`╔══════════════════════╗
║      ⚡ 𝗗𝗔𝗥𝗞 ⚡      ║
╚══════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━┓
┃ 📡 PING INFORMATION
┣━━━━━━━━━━━━━━━━━━━━━┫
┃ ⚙️ Response : ${ping} ms
┃ ⏳ Uptime   : ${uptimeString}
┃ 🟢 Status   : Stable
┃ 🖥️ Arch     : ${os.arch()}
┃ 💾 Memory   : ${usedRam} GB / ${totalRam} GB
┗━━━━━━━━━━━━━━━━━━━━━┛

『 𝗗𝗔𝗥𝗞 𝗕𝗢𝗧 𝗦𝗬𝗦𝗧𝗘𝗠 』`,

            // التصميم الرابع
`┌─❖
│ ✦ 𝗗𝗔𝗥𝗞 𝗣𝗜𝗡𝗚 𝗣𝗔𝗡𝗘𝗟 ✦
├─────────────────
│ ⚡ Speed      » ${ping} ms
│ ⏳ Uptime     » ${uptimeString}
│ 🟢 Status     » Active
│ 🖥️ Architecture » ${os.arch()}
│ 💾 RAM        » ${usedRam} GB / ${totalRam} GB
└─────────────────
       ⚔️ DARK SYSTEM ⚔️`
        ];

        // اختيار تصميم عشوائي من المصفوفة في كل مرة يتم فيها كتابة الأمر
        const finalResponse = designs[Math.floor(Math.random() * designs.length)];

        // إرسال النتيجة بالرد المباشر
        await sock.sendMessage(from, { text: finalResponse }, { quoted: mek });
    }
};

