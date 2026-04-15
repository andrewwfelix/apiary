const vault = JSON.parse(fs.readFileSync('./affiliate-automation/data/product-vault.json'));

function injectAffiliateBoxes(content) {
  // Regex to find [[AFF:product-slug]]
  return content.replace(/\[\[AFF:(.*?)\]\]/g, (match, slug) => {
    const p = vault[slug];
    if (!p) return ``;
    
    return `
      <div class="aff-box" data-asin="${p.asin}">
        <img src="${p.localImage}" alt="${p.fullName}">
        <div class="aff-info">
          <h4>${p.fullName}</h4>
          <span class="aff-price">${p.price}</span>
          <a href="${p.affiliateUrl}" target="_blank" rel="nofollow" class="aff-btn">View on Amazon</a>
        </div>
      </div>
    `;
  });
}