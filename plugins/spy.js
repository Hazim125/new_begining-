const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const path = require("path");
const fs = require("fs");

module.exports = {
    name: "كشف",
    aliases: ["كشف_تشغيل", "كشف_إيقاف", "كشف_ايقاف"],

    async execute(sock, mek, args, { isOwner, isAdmin, lookupName }) {
        const from = mek.key.remoteJid;

        const rawSender = mek.key.participant || mek.key.remoteJid || '';
        const senderNumber = rawSender.split("@")[0].replace(/[^0-9]/g, "");

        // جلب مشرفي الجروب والتحقق من رتبة العضو داخل المحادثة
        let isGroupAdmin = false;
        if (from.endsWith('@g.us')) {
            try {
                const groupMetadata = await sock.groupMetadata(from);
                isGroupAdmin = groupMetadata.participants.find(p => p.id.replace(/[^0-9]/g, "") === senderNumber)?.admin;
            } catch (e) {
                isGroupAdmin = false;
            }
        }

        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;

        const statusPath = path.join(__dirname, "../radar_status.txt");

        // الخدعة البرمجية: جعل أي أدمن مضاف في السيستم بمثابة المالك للأوامر فوراً
        const hasPermission = isOwner || isAdmin;

        // 🛑 تشغيل رادار التجسس الشامل: للمطور وأدمن البوت المضافين فقط
        if (lookupName === "كشف_تشغيل") {
            if (!hasPermission) return;
            await sock.sendMessage(from, { react: { text: "📡", key: mek.key } });
            fs.writeFileSync(statusPath, "on");
            const msg = `\n╭─〔 ✦ 📡 𝗥𝗔𝗗𝗔𝗥 𝗢𝗡 ✦ 〕─╮\n\n  » تم تفعيل رادار التجسس الشامل بنجاح!\n  » البوت يراقب النصوص، الصور، الملصقات، والريكوردات المحذوفة تلقائياً الحين.\n\n╰─────────────────────╯\n${footer}`;
            return await sock.sendMessage(from, { text: msg }, { quoted: mek });
        }

        // 🛑 إيقاف رادار التجسس الشامل: للمطور وأدمن البوت المضافين فقط
        if (lookupName === "كشف_إيقاف" || lookupName === "كشف_ايقاف") {
            if (!hasPermission) return;
            await sock.sendMessage(from, { react: { text: "😴", key: mek.key } });
            fs.writeFileSync(statusPath, "off");
            const msg = `\n╭─〔 ✦ 😴 𝗥𝗔𝗗𝗔𝗥 𝗢𝗙𝗙 ✦ 〕─╮\n\n  » تم إيقاف الرادار بنجاح.\n\n╰─────────────────────╯\n${footer}`;
            return await sock.sendMessage(from, { text: msg }, { quoted: mek });
        }

        // 👑 أمر كشف ميديا العرض لمرة واحدة المباشر: متاح للمطور، أدمن البوت، وأدمن الجروب
        if (lookupName === "كشف") {
            if (!hasPermission && !isGroupAdmin) {
                await sock.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return await sock.sendMessage(from, { text: "❌ هذا الأمر الإشرافي مخصص للمشرفين وكينج السيستم فقط حماية للخصوصية." }, { quoted: mek });
            }

            let quotedContext = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedContext) {
                return await sock.sendMessage(from, { text: "📊 يرجى الرد مباشرة على ميديا (عرض لمرة واحدة) لتفجيرها وكشفها الحين." }, { quoted: mek });
            }

            let viewOnceMsg = null;
            let mediaType = "";
            const viewOnceKeys = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV3', 'viewOnceMessageV2Extension'];

            // فحص كافة طبقات ومفاتيح بروتوكول واتساب المتقدم لرسائل المشاهدة لمرة واحدة
            for (let key of viewOnceKeys) {
                if (quotedContext[key]?.message) {
                    const innerMsg = quotedContext[key].message;
                    if (innerMsg.imageMessage) { viewOnceMsg = innerMsg.imageMessage; mediaType = "image"; break; }
                    else if (innerMsg.videoMessage) { viewOnceMsg = innerMsg.videoMessage; mediaType = "video"; break; }
                }
            }

            // فحص الاحتياط للرسائل الموسومة بالعرض لمرة واحدة بشكل مباشر
            if (!viewOnceMsg) {
                if (quotedContext.imageMessage?.viewOnce) { viewOnceMsg = quotedContext.imageMessage; mediaType = "image"; }
                else if (quotedContext.videoMessage?.viewOnce) { viewOnceMsg = quotedContext.videoMessage; mediaType = "video"; }
            }

            if (!viewOnceMsg) {
                return await sock.sendMessage(from, { text: "📊 يرجى الرد مباشرة على ميديا (عرض لمرة واحدة) لتفجيرها وكشفها الحين." }, { quoted: mek });
            }

            // التفاعل الأولي داخل المجموعة للإشارة إلى بدء المعالجة الصامتة
            await sock.sendMessage(from, { react: { text: "⚡", key: mek.key } });

            // 🔐 تحديد شات الخاص بالمطور لإرسال التجسس إليه سرّاً
            const myBotPrivate = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const senderContext = mek.message?.extendedTextMessage?.contextInfo?.participant || "مجهول";
            const senderNum = senderContext.split("@")[0];

            try {
                // سحب بافر الميديا الصافي مباشرة من خوادم ميتـا عبر دالة البايلز المعززة
                const stream = await downloadContentFromMessage(viewOnceMsg, mediaType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

                const captionText = `\n╭─〔 ✦ 𝗩𝗜𝗘𝗪_𝗢𝗡𝗖𝗘 𝗕𝗨𝗦𝗧𝗘𝗗 ✦ 〕─╮\n\n  » تم تفجير وكشف الميديا السرية بنجاح!\n  » المرسل في الجروب: @${senderNum}\n\n╰─────────────────────╯\n${footer}`;
                
                // 🚀 تحويل الإرسال بالكامل إلى شاتك الخاص (myBotPrivate) وليس الجروب (from)
                if (mediaType === "image") {
                    await sock.sendMessage(myBotPrivate, { image: buffer, caption: captionText, mentions: [senderContext] });
                } else if (mediaType === "video") {
                    await sock.sendMessage(myBotPrivate, { video: buffer, caption: captionText, mentions: [senderContext] });
                }

                // تفاعل بالنجاح في المجموعة الأصلية بـ إيموجي فقط دون فضيحة أو إرسال الميديا هناك!
                return await sock.sendMessage(from, { react: { text: "✅", key: mek.key } });

            } catch (err) {
                console.error("خطأ تفجير الميديا السرية:", err.message);
                await sock.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return await sock.sendMessage(from, { text: "❌ فشل لقط الميديا، ربما انتهت صلاحيتها أو السيرفر مضغوط." }, { quoted: mek });
            }
        }
    }
};

