const fs = require('fs');
const path = require('path');

module.exports = {
    name: "وضع",
    aliases: ["mode", "الوضع"],

    async execute(sock, mek, args, { isOwner }) {
        const from = mek.key.remoteJid;

        if (!isOwner) {
            const accessDenied = `\n╭─〔 ✦ 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗 ✦ 〕─╮\n  » خطأ   : غير مصرح لك\n  » السبب : هذا الأمر خاص بالمالك فقط!\n╰─────────────────────╯\n`;
            return await sock.sendMessage(from, { text: accessDenied }, { quoted: mek });
        }

        const action = args[0];
        const statusPath = path.join(__dirname, "../status.txt");

        if (!action || (action !== "عام" && action !== "خاص")) {
            const modeUsage = `┏━━━━━━━━━━━━━━━━━━━━┓\n┃ 𖤍 𝗧𝗛𝗘 𝗗𝗔𝗥𝗞 𝗠𝗢𝗗𝗘𝗦 𖤍\n┗━━━━━━━━━━━━━━━━━━━━┛\n\n╭─〔 ⚡ التحكم بالأوضاع 〕─╮\n  » لتفعيل وضع الجميع:\n    .وضع عام\n\n  » لتفعيل وضع الخاص:\n    .وضع خاص\n╰─────────────────────╯\n`;
            return await sock.sendMessage(from, { text: modeUsage }, { quoted: mek });
        }

        if (action === "عام") {
            fs.writeFileSync(statusPath, "public");
            const publicSuccess = `┏━━━━━━━━━━━━━━━━━━━━┓\n┃ 𖤍 𝗠𝗢𝗗𝗘 𝗨𝗣𝗗𝗔𝗧𝗘𝗗 𖤍\n┗━━━━━━━━━━━━━━━━━━━━┛\n\n╭─〔 ⚡ نظام التشغيل 〕─╮\n\n  » الوضع الحالي : PUBLIC 🟢\n  » الحالة       : البوت يستجيب للجميع الآن\n╰─────────────────────╯\n`;
            return await sock.sendMessage(from, { text: publicSuccess }, { quoted: mek });
        }

        if (action === "خاص") {
            fs.writeFileSync(statusPath, "self");
            const selfSuccess = `╔══════════════════════╗\n║      ⚡ 𝗗𝗔𝗥𝗞 ⚡      ║\n╚══════════════════════╝\n\n┏━━━━━━━━━━━━━━━━━━━━━┓\n┃ 📡 حـالـة الـنـظـام\n┣━━━━━━━━━━━━━━━━━━━━━┫\n┃ » الوضع الحالي : PRIVATE 🔒\n┃ » الحالة       : الاستجابة للمالك فقط\n┗━━━━━━━━━━━━━━━━━━━━━┛`;
            return await sock.sendMessage(from, { text: selfSuccess }, { quoted: mek });
        }
    }
};

