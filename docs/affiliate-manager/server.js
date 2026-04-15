const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios'); // For downloading images
const app = express();

const cors = require('cors');
app.use(cors()); // Add this before your routes

app.use(express.json());
app.use(express.static('public'));

const VAULT_PATH = path.join(__dirname, 'data/product-vault.json');

app.post('/api/add-product', async (req, res) => {
    const { slug, fullName, url, imageUrl, price, asin } = req.body;
    
    try {
        // 1. Download Image to local storage
        const imgName = `${slug}.jpg`;
        const imgPath = path.join(__dirname, 'public/images', imgName);
        const response = await axios({ url: imageUrl, responseType: 'stream' });
        response.data.pipe(fs.createWriteStream(imgPath));

        // 2. Update the Vault
        const vault = await fs.readJson(VAULT_PATH).catch(() => ({}));
        vault[slug] = {
            asin,
            fullName,
            affiliateUrl: url,
            localImage: `/affiliate-automation/public/images/${imgName}`,
            price,
            lastUpdated: new Date().toISOString()
        };
        
        await fs.writeJson(VAULT_PATH, vault, { spaces: 2 });
        res.json({ success: true, message: `Saved ${slug}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('Affiliate Service running on http://localhost:3000'));