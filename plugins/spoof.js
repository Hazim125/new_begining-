module.exports = {
    name: "قالت",
    aliases: ["قال", "انتحال", "spoof", "تحكم", "تزوير"],

    async execute(sock, mek, args, { isOwner, isAdmin }) {
        const from = mek.key.remoteJid;

        // حماية: الأمر متاح لإدارة البوت العليا (المطور + أدمن البوت)
        if (!isOwner && !isAdmin) return;

        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `> |  𝘛𝘏𝘌 𝘋𝘈𝘙𝘒 𝘉𝘖𝘛 · 会`;

        if (!args.length) {
            return await sock.sendMessage(from, {
                text: `❌ *طريقة الاستخدام الصحيحة:*\nقم بالرد (Reply) على رسالة الشخص واكتب:\n.قال [النص المزيف الذي تريده أن يقوله]\n\n${footer}`
            }, { quoted: mek });
        }

        let targetJid;
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = mek.message.extendedTextMessage.contextInfo.participant;
        } else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            targetJid = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else {
            return await sock.sendMessage(from, { text: `❌ يرجى عمل ريبلاي على الشخص المراد محاكاة هويته.` }, { quoted: mek });
        }

        const spoofedText = args.join(" ");

        try {
            await sock.sendMessage(from, { react: { text: "🎭", key: mek.key } });

            const fakeQuoted = {
                key: {
                    remoteJid: from,
                    fromMe: false,
                    id: 'FAKE' + Math.random().toString(36).substring(2, 10).toUpperCase(),
                    participant: targetJid
                },
                message: { conversation: spoofedText }
            };

            await sock.sendMessage(from, { text: `⚡ تم تزوير واقتباس التصريح بنجاح الحين.\n\n${footer}` }, { quoted: fakeQuoted });
        } catch (err) {
            await sock.sendMessage(from, { text: "❌ حدث خطأ داخلي أثناء محاكاة الهوية." }, { quoted: mek });
        }
    }
};

