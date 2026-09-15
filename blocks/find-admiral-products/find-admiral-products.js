// codegen:layout-pattern=plan-carousel
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'Car Insurance',
    description: 'Comprehensive, third party fire & theft, or third party only cover across four tiers (Essential, Admiral, Gold, Platinum), with benefits like courtesy car, windscreen cover and uninsured driver promise.',
    category: 'Motor Insurance',
    image_url: 'https://www.admiral.com/sites/default/files/public/styles/magazine_article_1280/public/2019-08/insurance-documents-and-car-key.jpg',
  },
  {
    name: 'MultiCar Insurance',
    description: 'Insure two or more cars in the household on one policy, each keeping its own no-claims bonus, with a shared renewal date.',
    category: 'Motor Insurance',
    image_url: 'https://mktgblobpubaccess1.blob.core.windows.net/eui-frontend-assets/admiral/images/product-pods/product-pods-illustration-multicar@2x.png',
  },
  {
    name: 'MultiCover Insurance',
    description: 'Combine eligible car, van, home and landlord policies into one, each added policy earning a discount and sharing a single renewal date and paperwork. 10% of customers saved £388 vs identical single policies (Nov 25 - Apr 26).',
    category: 'Bundled Insurance',
    price: 'Save up to £388',
    image_url: 'https://www.admiral.com/sites/default/files/public/styles/magazine_article_1280/public/2018-09/mother-and-daughter-using-a-tablet.jpg',
  },
  {
    name: 'Travel Insurance',
    description: 'Single Trip or Annual cover at Admiral, Gold and Platinum levels, covering medical expenses, cancellation and belongings, with add-ons for winter sports, cruise, gadget and enhanced trip disruption.',
    category: 'Travel Insurance',
    image_url: 'https://mktgblobpubaccess1.blob.core.windows.net/eui-frontend-assets/admiral/images/product-pods/product-pods-couple-with-backpack@2x.png',
  },
  {
    name: 'Van Insurance',
    description: 'Cover for private and commercial van use, addable to MultiCover for a discount.',
    category: 'Motor Insurance',
  },
  {
    name: 'Home Insurance',
    description: 'Buildings, contents or combined home cover, with optional extras and a contents calculator to size cover.',
    category: 'Home Insurance',
  },
  {
    name: 'Landlord Insurance',
    description: 'Cover for rental properties including buildings, tenant-related damage and loss of rental income; eligible for MultiCover bundling.',
    category: 'Property Insurance',
  },
  {
    name: 'Pet Insurance',
    description: "Cover for cats and dogs, addable alongside Admiral's other products.",
    category: 'Pet Insurance',
  },
  {
    name: 'Breakdown Cover',
    description: 'Roadside and recovery breakdown assistance, available standalone or as an optional extra on car cover.',
    category: 'Motor Assistance',
  },
  {
    name: 'Personal Loans',
    description: 'Unsecured personal loans with fixed monthly repayments; get an accurate rate with no impact on your credit score. Representative example: £10,000 over 60 months at 12.9% APR representative.',
    category: 'Lending',
    price: '12.9% APR representative',
  },
];

// Brand colors from DESIGN_TOKENS' color tier.
const PALETTE = ['#00a32e', '#005485', '#77ddff', '#4f4f4f', '#ffffff'];
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0; let hi = 1;
  for (let i = 0; i < 20; i += 1) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const CARD_COLORS = ['#00a32e', '#005485', '#77ddff', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca'];

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || {};
      // structuredContent.products — bare array outputSchema; key derived from actionName "find_admiral_products"
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderItems(block, items, bridge);

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

function ctaLabelFor(category) {
  const c = (category || '').toLowerCase();
  if (c.includes('lending') || c.includes('loan') || c.includes('finance')) return 'Check Eligibility';
  if (c.includes('bundled')) return 'Compare Cover';
  return 'Get a Quote';
}

function renderItems(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'find-admiral-products-wrapper';

  const track = document.createElement('div');
  track.className = 'find-admiral-products-track';

  const list = (items || []).slice(0, 5);

  list.forEach((item, i) => {
    const card = document.createElement('article');
    card.className = 'find-admiral-products-card';

    const imageBox = document.createElement('div');
    imageBox.className = 'find-admiral-products-image';
    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode && img.parentNode.replaceChild(colorDiv(), img);
      imageBox.appendChild(img);
    } else {
      imageBox.appendChild(colorDiv());
    }
    card.appendChild(imageBox);

    const info = document.createElement('div');
    info.className = 'find-admiral-products-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    const name = document.createElement('h3');
    name.className = 'find-admiral-products-name';
    name.textContent = item.name || '';
    info.appendChild(name);

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'find-admiral-products-badge';
      badge.textContent = item.category;
      info.appendChild(badge);
    }

    let summaryText = item.summary || item.description;
    if (summaryText) {
      if (summaryText.length > 96) summaryText = `${summaryText.slice(0, 95).trimEnd()}…`;
      const summary = document.createElement('p');
      summary.className = 'find-admiral-products-summary';
      summary.textContent = summaryText;
      info.appendChild(summary);
    }

    const fitReasons = Array.isArray(item.fit_reasons) ? item.fit_reasons.slice(0, 2) : [];
    if (fitReasons.length) {
      const ul = document.createElement('ul');
      ul.className = 'find-admiral-products-fits';
      fitReasons.forEach((reason) => {
        const li = document.createElement('li');
        li.textContent = reason;
        ul.appendChild(li);
      });
      info.appendChild(ul);
    }

    if (item.price) {
      const price = document.createElement('span');
      price.className = 'find-admiral-products-price';
      price.textContent = item.price;
      info.appendChild(price);
    }

    if (typeof item.quote_available === 'boolean') {
      const quote = document.createElement('span');
      quote.className = 'find-admiral-products-quote';
      quote.textContent = item.quote_available ? 'Quote available' : 'No online quote';
      info.appendChild(quote);
    }

    const cta = document.createElement('button');
    cta.className = 'find-admiral-products-cta';
    cta.type = 'button';
    cta.textContent = ctaLabelFor(item.category);
    if (bridge) {
      cta.addEventListener('click', () => {
        if (item.source_url) {
          bridge.openLink(item.source_url);
        } else {
          bridge.sendMessage(`Tell me more about ${item.name}`);
        }
      });
    }
    info.appendChild(cta);

    card.appendChild(info);
    track.appendChild(card);
  });

  const fade = document.createElement('div');
  fade.className = 'find-admiral-products-fade';
  fade.style.cssText = `background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);`;

  const scrollByCard = (dir) => {
    track.scrollBy({ left: dir * 236, behavior: 'smooth' });
  };

  const leftBtn = document.createElement('button');
  leftBtn.className = 'find-admiral-products-arrow find-admiral-products-arrow-left';
  leftBtn.type = 'button';
  leftBtn.setAttribute('aria-label', 'Scroll left');
  leftBtn.textContent = '◀';
  leftBtn.addEventListener('click', () => scrollByCard(-1));

  const rightBtn = document.createElement('button');
  rightBtn.className = 'find-admiral-products-arrow find-admiral-products-arrow-right';
  rightBtn.type = 'button';
  rightBtn.setAttribute('aria-label', 'Scroll right');
  rightBtn.textContent = '▶';
  rightBtn.addEventListener('click', () => scrollByCard(1));

  const updateArrows = () => {
    const atStart = track.scrollLeft <= 2;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    leftBtn.style.display = atStart ? 'none' : 'flex';
    rightBtn.style.display = atEnd ? 'none' : 'flex';
    fade.style.display = atEnd ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateArrows);

  wrapper.appendChild(track);
  wrapper.appendChild(fade);
  wrapper.appendChild(leftBtn);
  wrapper.appendChild(rightBtn);
  block.appendChild(wrapper);

  requestAnimationFrame(updateArrows);
}
