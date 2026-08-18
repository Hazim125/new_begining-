const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = {
    name: "سحب",
    aliases: ["اسحب", "get", "pull"],

    async execute(sock, mek, args, { isOwner }) {
        const from = mek.key.remoteJid;

        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;

        // حماية الأمر: المالك الأساسي فقط هو من يستطيع سحب الميديا لخصوصيتك 👑
        if (!isOwner) {
            return await sock.sendMessage(from, { text: "⚠️ هذا الأمر الاستخباراتي خاص بمالك السيستم فقط! 👑" }, { quoted: mek });
        }

        // جلب معلومات الرسالة التي قمت بالرد عليها (Quoted Message)
        const quotedMek = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedContext = mek.message?.extendedTextMessage?.contextInfo;

        if (!quotedMek) {
            return await sock.sendMessage(from, {
                text: `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗣𝗨𝗟𝗟 ✦ 〕─╮\n\n 📊 *[ طريقة الاستخدام ]*\n » قم بالرد (Reply) على أي (صورة، ريكورد، فيديو، نص) واكتب أمر *.سحب*\n\n 📌 *[ النتيجة ]*: سيقوم البوت بسحب الميديا وإرسالها إلى خاص حسابك فوراً بصورة سرية.\n╰─────────────────────╯\n${footer}`
            }, { quoted: mek });
        }

        // تحديد رقمك الخاص (الخاص بالبوت) لإرسال السحب إليه
        const myBotPrivate = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const targetType = Object.keys(quotedMek)[0];
        
        // تفاعل البوت آلياً لبدء عملية السحب السرية
        await sock.sendMessage(from, { react: { text: "⚡", key: mek.key } });

        try {
            // 1. إذا كانت الرسالة المستهدفة عبارة عن نص عادي أو نص ممتد
            if (targetType === 'conversation' || targetType === 'extendedTextMessage') {
                const textToPull = quotedMek.conversation || quotedMek.extendedTextMessage?.text || "";
                const senderNum = quotedContext.participant?.split("@")[0] || "مجهول";

                let captionText = `📥 *[ تم سحب رسالة نصية ]*\n\n`;
                captionText += `👤 *من العضو:* @${senderNum}\n`;
                captionText += `💬 *النص المسحوب:*\n"${textToPull}"\n\n${footer}`;

                await sock.sendMessage(myBotPrivate, { text: captionText, mentions: [quotedContext.participant] });
                return await sock.sendMessage(from, { react: { text: "✅", key: mek.key } });
            }

            // 2. معالجة رسائل العرض لمرة واحدة (View Once) إذا كانت صورة أو فيديو
            let mediaMessage = quotedMek[targetType];
            let mediaTypeKey = targetType;

            if (targetType === 'viewOnceMessage' || targetType === 'viewOnceMessageV2') {
                mediaMessage = quotedMek[targetType].message[Object.keys(quotedMek[targetType].message)[0]];
                mediaTypeKey = Object.keys(quotedMek[targetType].message)[0];
            }

            // خريطة أنواع الميديا لفك تشفيرها وسحبها من سيرفر واتساب
            const typeMap = {
                'imageMessage': { name: 'صورة 📸', stream: 'image', ext: 'imageMessage' },
                'stickerMessage': { name: 'ملصق 🎭', stream: 'sticker', ext: 'stickerMessage' },
                'audioMessage': { name: 'صوت / ريكورد 🎵', stream: 'audio', ext: 'audioMessage' },
                'videoMessage': { name: 'فيديو 🎥', stream: 'video', ext: 'videoMessage' },
                'documentMessage': { name: 'ملف / مستند 📄', stream: 'document', ext: 'documentMessage' }
            };

            const mapped = typeMap[mediaTypeKey];

            if (mapped) {
                // تحميل البافر (Buffer) الخاص بالميديا مباشرة من بروتوكول الـ Baileys
                const stream = await downloadContentFromMessage(mediaMessage, mapped.stream);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) { 
                    buffer = Buffer.concat([buffer, chunk]); 
                }

                const senderNum = quotedContext.participant?.split("@")[0] || "مجهول";
                let baseCaption = `📥 *[ تم سحب ميديا: ${mapped.name} ]*\n\n👤 *من العضو:* @${senderNum}\n\n${footer}`;

                // إرسال الميديا المسحوبة إلى خاص البوت حسب نوعها الصافي وبأعلى جودة
                if (mediaTypeKey === 'imageMessage') {
                    await sock.sendMessage(myBotPrivate, { image: buffer, caption: baseCaption, mentions: [quotedContext.participant] });
                } else if (mediaTypeKey === 'stickerMessage') {
                    await sock.sendMessage(myBotPrivate, { text: `📥 *[ تم سحب ملصق 🎭 ]* من العضو: @${senderNum}\nالملصق بالأسفل:`, mentions: [quotedContext.participant] });
                    await sock.sendMessage(myBotPrivate, { sticker: buffer });
                } else if (mediaTypeKey === 'audioMessage') {
                    await sock.sendMessage(myBotPrivate, { text: `📥 *[ تم سحب ريكورد 🎵 ]* من العضو: @${senderNum}\nالريكورد بالأسفل:`, mentions: [quotedContext.participant] });
                    await sock.sendMessage(myBotPrivate, { audio: buffer, mimetype: 'audio/mp4', ptt: mediaMessage.ptt });
                } else if (mediaTypeKey === 'videoMessage') {
                    await sock.sendMessage(myBotPrivate, { video: buffer, caption: baseCaption, mentions: [quotedContext.participant] });
                } else if (mediaTypeKey === 'documentMessage') {
                    await sock.sendMessage(myBotPrivate, { 
                        document: buffer, 
                        mimetype: mediaMessage.mimetype, 
                        fileName: mediaMessage.fileName || "dark_pulled_file", 
                        caption: baseCaption, 
                        mentions: [quotedContext.participant] 
                    });
                }

                // تفاعل بالنجاح في المجموعة الأصلية دون إرسال رسالة تفضح العملية
                return await sock.sendMessage(from, { react: { text: "✅", key: mek.key } });
            }

            // إذا كانت الميديا غير مدعومة
            throw new Error("نوع الميديا غير مدعوم أو تالف");

        } catch (err) {
            console.error("خطأ أثناء سحب الميديا:", err.message);
            await sock.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return await sock.sendMessage(from, { text: "❌ فشل سحب الميديا! تأكد أن الرسالة تحتوي على داتا صحيحة يا كينج." }, { quoted: mek });
        }
    }
};

