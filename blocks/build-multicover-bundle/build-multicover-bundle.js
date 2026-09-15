// codegen:layout-pattern=plan-carousel
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    option_name: 'Car + Home Starter Bundle',
    included_policies: ['Car Insurance', 'Home Insurance'],
    renewal_alignment: "Bring both to your car's renewal date; the home policy aligns at its next renewal.",
    discount_explanation: 'Each additional eligible policy earns a MultiCover discount, confirmed at quote.',
    management_benefits: ['Single renewal date', 'One set of paperwork', 'Manage online in one account'],
    eligibility_notes: ['Home must be owner-occupied', 'Confirm combination online or by phone'],
    quote_required: true,
    source_url: 'https://www.admiral.com/multicover',
  },
  {
    option_name: 'Two-Car + Home Bundle',
    included_policies: ['Car Insurance', 'Car Insurance', 'Home Insurance'],
    renewal_alignment: 'Both cars and the home share one renewal date; each car keeps its own no-claims bonus.',
    discount_explanation: 'Adding a second car and the home each earns a further MultiCover discount; total saving shown at quote.',
    management_benefits: ['Shared renewal date', 'One account for all policies', 'Fewer separate payments'],
    eligibility_notes: ['Online limit applies to number of policies', 'Some combinations need a phone quote'],
    quote_required: true,
    source_url: 'https://www.admiral.com/multicover',
  },
  {
    option_name: 'Car + Home + Van Bundle',
    included_policies: ['Car Insurance', 'Home Insurance', 'Van Insurance'],
    renewal_alignment: 'Van joins at its next renewal; all three then share a single renewal date.',
    discount_explanation: 'Van is addable to MultiCover for a discount; combined saving requires a quote.',
    management_benefits: ['One renewal date across motor and home', 'Single paperwork bundle'],
    eligibility_notes: ['Van cover must be eligible for MultiCover', 'Speak to Admiral to confirm van + home mix'],
    quote_required: true,
    source_url: 'https://www.admiral.com/multicover',
  },
  {
    option_name: 'Family MultiCover Bundle',
    included_policies: ['Car Insurance', 'Home Insurance', 'Landlord Insurance'],
    renewal_alignment: 'Immediate-family policies align to a shared renewal once each reaches renewal.',
    discount_explanation: 'Eligible family policies each add a discount; exact figure confirmed at quote.',
    management_benefits: ['Family policies in one place', 'Shared renewal date'],
    eligibility_notes: ['Family members must be immediate family at same address', 'Landlord + family mix may need a phone quote'],
    quote_required: true,
    source_url: 'https://www.admiral.com/multicover',
  },
];

// Brand colors from DESIGN_TOKENS' color tier.
const PALETTE = ['#00a32e', '#005485', '#77ddff', '#4f4f4f'];
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
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

function chipRow(labels, className) {
  const row = document.createElement('div');
  row.className = className;
  labels.forEach((label) => {
    const chip = document.createElement('span');
    chip.className = `${className}-chip`;
    chip.textContent = label;
    row.appendChild(chip);
  });
  return row;
}

function renderItems(block, items, bridge) {
  block.textContent = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'mcb-wrapper';

  const track = document.createElement('div');
  track.className = 'mcb-track';

  items.slice(0, 5).forEach((item) => {
    const card = document.createElement('article');
    card.className = 'mcb-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const body = document.createElement('div');
    body.className = 'mcb-body';

    const titleRow = document.createElement('div');
    titleRow.className = 'mcb-title-row';
    const title = document.createElement('h3');
    title.className = 'mcb-title';
    title.textContent = item.option_name || '';
    titleRow.appendChild(title);
    if (item.quote_required) {
      const badge = document.createElement('span');
      badge.className = 'mcb-quote-badge';
      badge.textContent = 'Quote required';
      titleRow.appendChild(badge);
    }
    body.appendChild(titleRow);

    if (Array.isArray(item.included_policies) && item.included_policies.length) {
      body.appendChild(chipRow(item.included_policies, 'mcb-assets'));
    }

    if (item.renewal_alignment) {
      const renewal = document.createElement('p');
      renewal.className = 'mcb-line';
      const rk = document.createElement('strong');
      rk.textContent = 'Renewal: ';
      renewal.appendChild(rk);
      renewal.appendChild(document.createTextNode(item.renewal_alignment));
      body.appendChild(renewal);
    }

    if (item.discount_explanation) {
      const disc = document.createElement('p');
      disc.className = 'mcb-line';
      const dk = document.createElement('strong');
      dk.textContent = 'Discount: ';
      disc.appendChild(dk);
      disc.appendChild(document.createTextNode(item.discount_explanation));
      body.appendChild(disc);
    }

    if (Array.isArray(item.management_benefits) && item.management_benefits.length) {
      body.appendChild(chipRow(item.management_benefits, 'mcb-benefits'));
    }

    if (Array.isArray(item.eligibility_notes) && item.eligibility_notes.length) {
      body.appendChild(chipRow(item.eligibility_notes, 'mcb-notes'));
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mcb-cta';
    btn.textContent = 'Get a MultiCover Quote';
    btn.addEventListener('click', () => {
      if (!bridge) return;
      if (item.source_url) bridge.openLink(item.source_url);
      else bridge.sendMessage(`Tell me more about ${item.option_name}`);
    });
    body.appendChild(btn);

    card.appendChild(body);
    track.appendChild(card);
  });

  const fade = document.createElement('div');
  fade.className = 'mcb-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;`;

  const btnLeft = document.createElement('button');
  btnLeft.type = 'button';
  btnLeft.className = 'mcb-nav mcb-nav-left';
  btnLeft.setAttribute('aria-label', 'Scroll left');
  btnLeft.textContent = '◀';
  const btnRight = document.createElement('button');
  btnRight.type = 'button';
  btnRight.className = 'mcb-nav mcb-nav-right';
  btnRight.setAttribute('aria-label', 'Scroll right');
  btnRight.textContent = '▶';

  const step = 236;
  const updateNav = () => {
    btnLeft.style.display = track.scrollLeft <= 4 ? 'none' : 'flex';
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    btnRight.style.display = atEnd ? 'none' : 'flex';
    fade.style.display = atEnd ? 'none' : 'block';
  };
  const scrollBy = (dir) => track.scrollBy({ left: dir * step, behavior: 'smooth' });
  btnLeft.addEventListener('click', () => scrollBy(-1));
  btnRight.addEventListener('click', () => scrollBy(1));
  [btnLeft, btnRight].forEach((b, i) => b.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollBy(i === 0 ? -1 : 1); }
  }));
  track.addEventListener('scroll', updateNav);

  wrapper.appendChild(track);
  wrapper.appendChild(fade);
  wrapper.appendChild(btnLeft);
  wrapper.appendChild(btnRight);
  block.appendChild(wrapper);
  requestAnimationFrame(updateNav);
}

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
      // structuredContent.bundles — bare array outputSchema; key derived from actionName "build_multicover_bundle"
      items = structuredContent?.bundles || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

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
