const express = require('express');
const cors = require('cors');
const translate = require('google-translate-api-x');
const path = require('path');

const app = express();
const PORT = 1000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/translate', async (req, res) => {
    try {
        const { text, from, to } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        const resTranslation = await translate(text, { from: from || 'auto', to: to || 'en' });
        res.json({ translatedText: resTranslation.text });
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ error: 'Translation failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
