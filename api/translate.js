const translate = require('google-translate-api-x');

module.exports = async (req, res) => {
    // Enable CORS for Vercel Serverless Function
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    try {
        const { text, from, to } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const resTranslation = await translate(text, { from: from || 'auto', to: to || 'en' });
        res.status(200).json({ translatedText: resTranslation.text });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
};
