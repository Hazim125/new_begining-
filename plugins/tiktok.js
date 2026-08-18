const { ttdl } = require("ruhend-scraper");
const axios = require('axios');

// مخزن لمنع تكرار معالجة نفس الرسالة في نفس الوقت
const processedMessages = new Set();

module.exports = {
    name: "تيك",
    aliases: ["تيكتوك", "tiktok", "tt", "تنزيل_تيك"],

    async execute(sock, mek, args) {
        const from = mek.key.remoteJid;

        // منع التكرار التلقائي لحماية الرام والسيرفر
        if (processedMessages.has(mek.key.id)) return;
        processedMessages.add(mek.key.id);
        setTimeout(() => { processedMessages.delete(mek.key.id); }, 5 * 60 * 1000);

        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `> |  Ⓗ DARK ZENIN ᴏғғ ${randomFlag}`;

        // تجميع النص بالكامل وفك تشفيره
        let fullText = args.join(" ") || 
                       mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || 
                       mek.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || "";
        
        fullText = decodeURIComponent(fullText);

        if (!fullText) {
            return await sock.sendMessage(from, {
                text: `╭─〔 ✦ 𝗗𝗔𝗥𝗞 𝗧𝗜𝗞𝗧𝗢𝗞 ✦ 〕─╮\n\n 📊 *[ طريقة الاستخدام ]*\n » أرسل أمر *.تيك* ومعه رابط الفيديو، أو قم بالرد على الرابط الحين.\n\n╰─────────────────────╯\n${footer}`
            }, { quoted: mek });
        }

        // استخراج الرابط النظيف غصباً عن أي نصوص أو روابط تيك توك لايت إضافية محيطة به
        const tiktokRegex = /(https?:\/\/(?:vm|www|v|vt)\.tiktok\.com\/[^\s?]+)/gi;
        const match = fullText.match(tiktokRegex);

        if (!match) {
            return await sock.sendMessage(from, { text: "⚠️ لم أتمكن من العثور على رابط تيك توك صحيح في الرسالة يا كينج." }, { quoted: mek });
        }

        const cleanUrl = match[0];
        await sock.sendMessage(from, { react: { text: "🔄", key: mek.key } });

        try {
            // 🛡️ التكتيك الأجنبي الأول: استخدام مكتبة الكشط المباشرة ruhend-scraper
            let downloadData = await ttdl(cleanUrl).catch(() => null);
            
            // 🔄 التكتيك الأجنبي الثاني (Fallback): إذا فشلت المكتبة، يتوجه فوراً لسيرفر dreaded الاحترافي
            if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
                const apiResponse = await axios.get(`https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(cleanUrl)}`).catch(() => null);
                
                if (apiResponse?.data && apiResponse.data.status === 200 && apiResponse.data.tiktok) {
                    const videoUrl = apiResponse.data.tiktok.video;
                    const title = apiResponse.data.tiktok.title || "بدون عنوان";
                    
                    if (videoUrl) {
                        let captionText = `╭─〔 ✦ 𝗧𝗜𝗞𝗧𝗢𝗞 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 ✦ 〕─╮\n\n  » الوصف : ${title.slice(0, 80)}${title.length > 80 ? '...' : ''}\n\n╰─────────────────────╯\n${footer}`;
                        
                        await sock.sendMessage(from, { react: { text: "📥", key: mek.key } });
                        return await sock.sendMessage(from, {
                            video: { url: videoUrl },
                            mimetype: "video/mp4",
                            caption: captionText
                        }, { quoted: mek });
                    }
                }
            }

            // إذا نجحت المكتبة الأساسية في جلب البيانات (فيديو أو صور ألبومات)
            if (downloadData && downloadData.data && downloadData.data.length > 0) {
                await sock.sendMessage(from, { react: { text: "📥", key: mek.key } });
                
                const mediaData = downloadData.data;
                const media = mediaData[0]; // جلب الميديا الأولى والأساسية
                const mediaUrl = media.url;
                const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || media.type === 'video';

                let captionText = `╭─〔 ✦ 𝗧𝗜𝗞𝗧𝗢𝗞 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗 ✦ 〕─╮\n\n  » تم السحب بنجاح عبر النواة الأجنبية المتطورة.\n\n╰─────────────────────╯\n${footer}`;

                if (isVideo) {
                    return await sock.sendMessage(from, {
                        video: { url: mediaUrl },
                        mimetype: "video/mp4",
                        caption: captionText
                    }, { quoted: mek });
                } else {
                    return await sock.sendMessage(from, {
                        image: { url: mediaUrl },
                        caption: captionText
                    }, { quoted: mek });
                }
            }

            // إذا سقطت كلتا الطريقتين (المكتبة والسيرفر البديل)
            throw new Error("جميع الخوادم مضغوطة");

        } catch (error) {
            console.error('Error in TikTok download:', error);
            await sock.sendMessage(from, { react: { text: "❌", key: mek.key } });
            await sock.sendMessage(from, { 
                text: "❌ فشل تحميل الفيديو. يبدو أن الرابط تالف أو أن السيرفر الأجنبي تحت الصيانة الحين، جرب لاحقاً يا كينج." 
            }, { quoted: mek });
        }
    }
};

