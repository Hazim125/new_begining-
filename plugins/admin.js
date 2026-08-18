module.exports = {
    name: "طرد",
    aliases: ["تصفية", "kick", "تصفيه", "احذف"],

    async execute(sock, mek, args, { isOwner, isAdmin, lookupName }) {
        const from = mek.key.remoteJid;

        // الأوامر تعمل فقط داخل المجموعات
        if (!from.endsWith('@g.us')) {
            return await sock.sendMessage(from, { text: "❌ هذا الأمر مخصص للمجموعات فقط." }, { quoted: mek });
        }

        const rawSender = mek.key.participant || mek.key.remoteJid || '';
        const senderNumber = rawSender.split("@")[0].replace(/[^0-9]/g, "");

        // جلب معلومات المشرفين داخل الجروب
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        // التحقق هل الشخص أدمن في الجروب نفسه؟
        const isGroupAdmin = participants.find(p => p.id.replace(/[^0-9]/g, "") === senderNumber)?.admin;
        
        // الصلاحية المجمعة للأدمن (أدمن جروب OR أدمن بوت OR مطور)
        const hasAdminPermission = isGroupAdmin || isAdmin || isOwner;

        // مصفوفة الأعلام المتغيرة تلقائياً
        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;

        // ════════════════════════════════════════════════
        // [ الخيار الأول: أمر تصفية المجموعة ] -> (للمطور وأدمن البوت فقط 🛑)
        // ════════════════════════════════════════════════
        if (lookupName === "تصفية" || lookupName === "تصفيه") {
            // فحص الصلاحية عبر المتغيرات القادمة من الـ index (المطور وأدمن البوت المضاف بملف json فقط)
            if (!isOwner && !isAdmin) {
                await sock.sendMessage(from, { react: { text: "🔒", key: mek.key } });
                const noPermission = `╭─〔 ✦ 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡基层𝗗 ✦ 〕─╮\n\n  » تنبيه : صلاحية منعدمة\n  » السبب  : هذا الأمر الإستراتيجي مخصص لإدارة البوت العليا فقط!\n\n╰─────────────────────╯\n${footer}`;
                return await sock.sendMessage(from, { text: noPermission }, { quoted: mek });
            }

            await sock.sendMessage(from, { react: { text: "🚨", key: mek.key } });
            const startMessage = `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗖𝗟𝗘𝗔𝗡 ✦ 〕─╮\n\n  » جاري بدء تصفية المجموعة بالكامل الحين...\n\n╰─────────────────────╯`;
            await sock.sendMessage(from, { text: startMessage }, { quoted: mek });

            const myBotJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            
            // تصفية المجموعة مع استثناء البوت، وأدمن البوت والمطور
            for (let participant of participants) {
                const userJid = participant.id;
                
                // إذا كان العضو هو البوت نفسه، أو مالك البوت/أدمن البوت تخطاه ولا تحذفه
                if (userJid === myBotJid || userJid.includes(senderNumber)) {
                    continue;
                }

                try {
                    await sock.groupParticipantsUpdate(from, [userJid], "remove");
                    await new Promise(resolve => setTimeout(resolve, 400)); // تأخير بسيط لتجنب حظر الرقم
                } catch (err) {
                    return await sock.sendMessage(from, { text: "⚠️ توقفت التصفية! تأكد من رفع البوت مشرفاً بالجروب." });
                }
            }

            const endMessage = `╭─〔 ✦ 𝗖𝗟𝗘𝗔𝗡 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗘𝗗 ✦ 〕─╮\n\n  » تم إنهاء التصفية وإخلاء الساحة بنجاح.\n\n╰─────────────────────╯\n${footer}`;
            return await sock.sendMessage(from, { text: endMessage });
        }

        // ════════════════════════════════════════════════
        // [ الخيار الثاني: أمر الطرد العادي ] -> (متاح لأدمن الجروب + أدمن البوت + المطور 👥)
        // ════════════════════════════════════════════════
        if (lookupName === "طرد" || lookupName === "kick" || lookupName === "احذف") {
            // التحقق إذا كان الشخص يمتلك أي نوع من أنواع الإدارة
            if (!hasAdminPermission) {
                await sock.sendMessage(from, { react: { text: "❌", key: mek.key } });
                const noAdmin = `╭─〔 ✦ 𝗔𝗖Ｃ𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗 ✦ 〕─╮\n\n  » تنبيه : صلاحية منعدمة\n  » السبب  : هذا الأمر مخصص للمشرفين فقط!\n\n╰─────────────────────╯\n${footer}`;
                return await sock.sendMessage(from, { text: noAdmin }, { quoted: mek });
            }

            let target = mek.message?.extendedTextMessage?.contextInfo?.participant;
            if (!target && mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                target = mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }

            if (!target) {
                return await sock.sendMessage(from, { text: "📊 يرجى الرد على رسالة العضو أو عمل منشن له لطرده." }, { quoted: mek });
            }

            const myBotNumber = sock.user.id.split(':')[0].replace(/[^0-9]/g, "");
            const targetNumber = target.split("@")[0].replace(/[^0-9]/g, "");
            
            if (targetNumber === myBotNumber) {
                return await sock.sendMessage(from, { text: "⚠️ لا يمكنني طرد نفسي يا كينج!" }, { quoted: mek });
            }

            await sock.sendMessage(from, { react: { text: "👞", key: mek.key } });

            try {
                await sock.groupParticipantsUpdate(from, [target], "remove");
                const kickMessage = `╭─〔 ✦ 𝗠𝗘𝗠𝗕𝗘𝗥 𝗞𝗜𝗖𝗞𝗘𝗗 ✦ 〕─╮\n\n  » تم إقصاء العضو بنجاح من المجموعة.\n\n╰─────────────────────╯\n${footer}`;
                await sock.sendMessage(from, { text: kickMessage }, { quoted: mek });
            } catch (err) {
                return await sock.sendMessage(from, { text: "⚠️ فشل الإجراء! يرجى التأكد أن البوت مشرف في المجموعة." }, { quoted: mek });
            }
        }
    }
};

