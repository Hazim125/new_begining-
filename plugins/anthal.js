const fs = require('fs');
const path = require('path');

module.exports = {
    name: "انتحل",
    aliases: ["انتحال", "clone"],

    async execute(sock, mek, args, { isOwner }) {
        const from = mek.key.remoteJid;
        
        // التحقق من الإدارة لعدم التخريب
        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants;
        const sender = mek.key.participant || mek.key.remoteJid;
        const isSenderAdmin = participants.find(p => p.id === sender)?.admin !== null;

        if (!isSenderAdmin && !isOwner) return;

        let target = "";
        if (mek.message?.extendedTextMessage?.contextInfo?.participant) {
            target = mek.message.extendedTextMessage.contextInfo.participant;
        } else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        if (!target || args.length < 2) {
            return await sock.sendMessage(from, { text: "⚠️ | منشن الضحية واكتب الكلام. مثال:\n`.انتحل @عضو انا غبي`" }, { quoted: mek });
        }

        // عزل النص المراد إرساله
        let textToSend = args.slice(1).join(" ");

        try {
            await sock.sendMessage(from, { react: { text: "🎭", key: mek.key } });

            // جلب بيانات الضحية (الاسم والصورة)
            const contact = await sock.onWhatsApp(target);
            let ppUrl = "https://pps.whatsapp.net/v/t61.24694-24/...", profileName = "🎯 TARGET";
            
            try { ppUrl = await sock.profilePictureUrl(target, 'image'); } catch {}
            
            // هنا تخدع الجروب عبر إرسال النص مع منشن مخفي أو بصيغة توحي بأنه هو المتحدث
            // ملاحظة: محاكاة الشات تتطلب إرسال سياق وهمي (Quoted Context)
            let fakeContact = {
                key: { remoteJid: from, fromMe: false, id: "FAKECHAT123", participant: target },
                message: { conversation: textToSend }
            };

            await sock.sendMessage(from, { text: `*🗣️ منتحل قسراً:* ${textToSend}` }, { quoted: fakeContact });

        } catch (err) {
            console.error(err);
        }
    }
};

