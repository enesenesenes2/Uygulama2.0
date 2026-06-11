// api/generate.js (Gizli Oda Kodu)
export default async function handler(req, res) {
    // Tarayıcı engellerini (CORS) tamamen kaldırmak için gerekli izinler
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Yalnızca POST istekleri kabul edilir.' });
    }

    const { promptInput, isRecipeMode } = req.body;
    
    // API anahtarını Vercel'in gizli kasasından çekiyoruz
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Sistem Hatası: API Anahtarı Vercel panelinde tanımlanmamış!' });
    }

    let systemMsg = "Sen sert, disiplinli, motivasyon veren bir spor ve gelişim koçusun. Kısa, net, samimi ve gaza getirici Türkçe cevaplar ver.";
    if (isRecipeMode) {
        systemMsg = "Sen sadece tarifleri analiz eden bir robotsun. Verilen tarifi incele, toplam kalori ve protein değerlerini hesapla. Bana SADECE şu formatta tek bir satır yanıt ver, başka hiçbir kelime ekleme: Yemek İsmi,ToplamKalori,ToplamProtein Örnek çıktı: Protein Yulaf,410,25";
    }

    try {
        // İstek tarayıcıdan değil, bu gizli sunucu kodundan atıldığı için engel YENMİŞ OLUYOR
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.1-70b-versatile",
                messages: [
                    { role: "system", content: systemMsg },
                    { role: "user", content: promptInput }
                ],
                temperature: 0.3
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(500).json({ error: data.error.message });
        }

        const reply = data.choices[0].message.content.trim();
        return res.status(200).json({ reply });

    } catch (error) {
        return res.status(500).json({ error: 'Sunucu bağlantı hatası oluştu.' });
    }
}

