// affiliate-receiver.js
const fs = require('fs');
const https = require('https');
const path = require('path');

// Logic to download image
const downloadImage = (url, slug) => {
  const file = fs.createWriteStream(path.join(__dirname, 'assets/img/products', `${slug}.jpg`));
  https.get(url, (response) => {
    response.pipe(file);
  });
};

// Logic to update JSON
const updateVault = (data) => {
  const vault = JSON.parse(fs.readFileSync('apiary-product-vault.json', 'utf8'));
  vault[data.slug] = {
    asin: data.asin,
    fullName: data.fullName,
    price: data.price,
    url: data.url,
    image: `assets/img/products/${data.slug}.jpg`
  };
  fs.writeFileSync('apiary-product-vault.json', JSON.stringify(vault, null, 2));
};