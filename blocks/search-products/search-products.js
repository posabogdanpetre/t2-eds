const SAMPLE_DATA = [
  {
    name: 'Nano Puff Jacket',
    price: 249,
    category: 'Jackets & Vests',
    colors_available: 5
  },
  {
    name: 'Better Sweater Fleece',
    price: 139,
    category: 'Fleece',
    colors_available: 8
  },
  {
    name: 'Baggies Shorts',
    price: 59,
    category: 'Shorts',
    colors_available: 12
  },
  {
    name: 'Black Hole Duffel 55L',
    price: 149,
    category: 'Bags & Gear',
    colors_available: 4
  },
  {
    name: 'Capilene Cool Daily Shirt',
    price: 45,
    category: 'Baselayers',
    colors_available: 6
  }
];

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
  for (let i=0; i<20; i++) {
    const m=(lo+hi)/2;
    if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return {
    bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,
    fg:'#ffffff'
  };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.products — bare array outputSchema; key derived from actionName "search_products"
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderCarousel(block, items, bridge);

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

function renderCarousel(block, items, bridge) {
  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];
  
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const container = document.createElement('div');
  container.className = 'carousel-container';

  items.slice(0, 5).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => {
        const colorDiv = document.createElement('div');
        colorDiv.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
        img.parentNode.replaceChild(colorDiv, img);
      };
      imageContainer.appendChild(img);
    } else {
      const colorDiv = document.createElement('div');
      colorDiv.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      imageContainer.appendChild(colorDiv);
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-button';
    ctaBtn.textContent = 'View Details';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const content = document.createElement('div');
    content.className = 'card-content';
    content.style.cssText = `background: ${theme?.bg ?? '#1a1a1a'}; color: ${theme?.fg ?? '#fff'};`;

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = item.name || '';
    content.appendChild(name);

    const meta = document.createElement('div');
    meta.className = 'product-meta';

    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = item.price ? `$${item.price}` : '';
    meta.appendChild(price);

    if (item.category) {
      const category = document.createElement('span');
      category.className = 'product-category';
      category.textContent = item.category;
      meta.appendChild(category);
    }

    content.appendChild(meta);
    card.appendChild(content);
    container.appendChild(card);
  });

  wrapper.appendChild(container);

  const leftArrow = document.createElement('button');
  leftArrow.className = 'carousel-arrow arrow-left hidden';
  leftArrow.innerHTML = '◀';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.addEventListener('click', () => {
    container.scrollBy({ left: -220, behavior: 'smooth' });
  });
  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      container.scrollBy({ left: -220, behavior: 'smooth' });
    }
  });

  const rightArrow = document.createElement('button');
  rightArrow.className = 'carousel-arrow arrow-right';
  rightArrow.innerHTML = '▶';
  rightArrow.setAttribute('aria-label', 'Scroll right');
  rightArrow.addEventListener('click', () => {
    container.scrollBy({ left: 220, behavior: 'smooth' });
  });
  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      container.scrollBy({ left: 220, behavior: 'smooth' });
    }
  });

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  const fade = document.createElement('div');
  fade.className = 'fade-gradient';
  fade.style.cssText = `background: linear-gradient(to right, transparent, ${theme?.bg ?? '#1a1a1a'}cc);`;
  wrapper.appendChild(fade);

  const updateArrows = () => {
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    if (scrollLeft <= 0) {
      leftArrow.classList.add('hidden');
    } else {
      leftArrow.classList.remove('hidden');
    }
    
    if (scrollLeft >= maxScroll - 5) {
      rightArrow.classList.add('hidden');
      fade.style.opacity = '0';
    } else {
      rightArrow.classList.remove('hidden');
      fade.style.opacity = '1';
    }
  };

  container.addEventListener('scroll', updateArrows);
  updateArrows();

  block.appendChild(wrapper);
}