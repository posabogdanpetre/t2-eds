// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  name: 'Men\'s Torrentshell 3L Rain Jacket',
  description: 'A versatile, 3-layer H2No Performance Standard shell made with 100% recycled nylon ripstop. Adjustable hood and hem, handwarmer pockets with zippers.',
  price: 199,
  category: 'Jackets',
  materials: '100% recycled nylon ripstop with waterproof H2No Performance Standard coating',
  sizes_available: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  image_url: 'https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw3c8e9e0e/images/hi-res/83802_NUVG.jpg'
};

// Brand palette from BuildWidgetRequest — empty in this payload, using fallback.
const PALETTE = [];
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) { const m=(lo+hi)/2; if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m; }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let product;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      product = SAMPLE_DATA;
    } else {
      // structuredContent IS the product object (single-object outputSchema)
      const result = await bridge.toolResult;
      const structuredContent = result?.structuredContent || result;
      product = structuredContent || {};
    }
  } else {
    product = SAMPLE_DATA;
  }

  block.textContent = '';
  renderProduct(block, product, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderProduct(block, product, bridge) {
  const card = document.createElement('div');
  card.className = 'detail-card';

  // Left: Image section
  const imageSection = document.createElement('div');
  imageSection.className = 'image-section';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];
  const fallbackColor = CARD_COLORS[0];

  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };

  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageSection.appendChild(img);
  } else {
    imageSection.appendChild(colorDiv());
  }

  // CTA button on image
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-on-image';
  ctaBtn.textContent = 'Shop Now';
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`I want to purchase ${product.name}`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Right: Content section with darkened palette bg
  const contentSection = document.createElement('div');
  contentSection.className = 'content-section';
  contentSection.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = product.name || 'Product Name';
  contentSection.appendChild(name);

  if (product.category) {
    const categoryChip = document.createElement('span');
    categoryChip.className = 'category-chip';
    categoryChip.textContent = product.category;
    contentSection.appendChild(categoryChip);
  }

  const description = document.createElement('p');
  description.className = 'product-description';
  description.textContent = product.description || '';
  contentSection.appendChild(description);

  if (product.price !== undefined) {
    const priceLabel = document.createElement('div');
    priceLabel.className = 'price-label';
    priceLabel.textContent = `$${product.price}`;
    contentSection.appendChild(priceLabel);
  }

  if (product.materials) {
    const materialsSection = document.createElement('div');
    materialsSection.className = 'materials-section';

    const materialsLabel = document.createElement('div');
    materialsLabel.className = 'section-label';
    materialsLabel.textContent = 'Materials';
    materialsSection.appendChild(materialsLabel);

    const materialsText = document.createElement('p');
    materialsText.className = 'materials-text';
    materialsText.textContent = product.materials;
    materialsSection.appendChild(materialsText);

    contentSection.appendChild(materialsSection);
  }

  if (product.sizes_available && product.sizes_available.length > 0) {
    const sizesSection = document.createElement('div');
    sizesSection.className = 'sizes-section';

    const sizesLabel = document.createElement('div');
    sizesLabel.className = 'section-label';
    sizesLabel.textContent = 'Available Sizes';
    sizesSection.appendChild(sizesLabel);

    const sizesText = document.createElement('p');
    sizesText.className = 'sizes-text';
    sizesText.textContent = product.sizes_available.join(', ');
    sizesSection.appendChild(sizesText);

    contentSection.appendChild(sizesSection);
  }

  card.appendChild(contentSection);
  block.appendChild(card);
}
