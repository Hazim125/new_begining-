module.exports = {
    name: "اضف",
    aliases: ["أضف", "اضف_عضو", "add", "invite"],

    async execute(sock, mek, args, { isOwner, isAdmin }) {
        const from = mek.key.remoteJid;

        if (!from.endsWith('@g.us')) return;

        await sock.sendMessage(from, { react: { text: "➕", key: mek.key } });

        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants;
        const sender = mek.key.participant || mek.key.remoteJid;
        
        const isSenderAdmin = participants.find(p => p.id === sender)?.admin !== null;

        if (!isSenderAdmin && !isOwner && !isAdmin) {
            return await sock.sendMessage(from, { text: "❌ | هذا الأمر مخصص للمشرفين وإدارة البوت فقط!" }, { quoted: mek });
        }

        let userToInvite = "";
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            userToInvite = mek.message.extendedTextMessage.contextInfo.participant;
        } else if (args[0]) {
            userToInvite = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        }

        if (!userToInvite) {
            return await sock.sendMessage(from, { text: "⚠️ يرجى الرد على العضو أو كتابة رقمه كاملاً مع رمز الدولة لإضافته." }, { quoted: mek });
        }

        try {
            await sock.groupParticipantsUpdate(from, [userToInvite], "add");
            await sock.sendMessage(from, { text: "✅ تم إرسال طلب الإضافة أو ضم العضو للجروب بنجاح." }, { quoted: mek });
        } catch (err) {
            await sock.sendMessage(from, { text: "❌ فشل الإضافة، ربما بسبب إعدادات خصوصية العضو أو أن البوت ليس مشرفاً." }, { quoted: mek });
        }
    }
};

