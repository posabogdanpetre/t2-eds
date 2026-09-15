// codegen:layout-pattern=booking-form
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  confirmation_id: 'ADM-QT-8842107',
  status: 'Ready to continue',
  message: 'Your comprehensive car cover summary is ready. Continue to Admiral to confirm your price and any required declarations.',
  product_type: 'Car Insurance',
  prefilled_context: [
    'Main car chosen as the vehicle to insure',
    'Comprehensive cover preference',
    'Existing no-claims bonus to carry over',
    'Prefers to lock in a price today',
  ],
  missing_information: [
    'Vehicle registration number',
    'Estimated annual mileage',
    'Main driver date of birth',
    'Address and postcode',
  ],
  quote_flow_url: 'https://www.admiral.com/car-insurance',
};

// Brand colors from DESIGN_TOKENS' color tier.
const PALETTE = ['#00a32e', '#005485', '#77ddff', '#4f4f4f', '#ffffff'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const HERO_IMAGE = 'https://www.admiral.com/sites/default/files/public/styles/magazine_article_1280/public/2019-08/insurance-documents-and-car-key.jpg';

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA;
    } else {
      // Detail/confirmation concept — structuredContent IS the item (flat).
      const _result = await bridge.toolResult;
      item = _result?.structuredContent || {};
    }
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  } else {
    item = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!item || (!item.product_type && !item.status && !item.message)) {
    const empty = document.createElement('p');
    empty.className = 'gq-empty';
    empty.textContent = 'No quote handoff is ready yet.';
    block.appendChild(empty);
    return;
  }

  renderForm(block, item, bridge);
}

function renderForm(block, item, bridge) {
  const card = document.createElement('div');
  card.className = 'gq-card';

  // Header block (palette-colored)
  const header = document.createElement('div');
  header.className = 'gq-header';
  header.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  if (HERO_IMAGE) {
    const hero = document.createElement('div');
    hero.className = 'gq-hero';
    const img = document.createElement('img');
    img.src = HERO_IMAGE;
    img.alt = item.product_type || 'Admiral quote';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${theme?.bg ?? '#00a32e'};`;
      img.parentNode.replaceChild(d, img);
    };
    hero.appendChild(img);
    header.appendChild(hero);
  }

  const headText = document.createElement('div');
  headText.className = 'gq-headtext';

  const title = document.createElement('h3');
  title.className = 'gq-title';
  title.textContent = item.product_type || 'Admiral Quote';
  headText.appendChild(title);

  if (item.status) {
    const status = document.createElement('span');
    status.className = 'gq-status';
    status.textContent = item.status;
    headText.appendChild(status);
  }

  if (item.message) {
    const msg = document.createElement('p');
    msg.className = 'gq-message';
    msg.textContent = item.message;
    headText.appendChild(msg);
  }

  header.appendChild(headText);
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'gq-body';

  // Section 1: progress + prefilled context summary
  const prefilled = Array.isArray(item.prefilled_context) ? item.prefilled_context : [];
  const missing = Array.isArray(item.missing_information) ? item.missing_information : [];
  const total = prefilled.length + missing.length;
  const pct = total > 0 ? Math.round((prefilled.length / total) * 100) : 0;

  const progSection = document.createElement('div');
  progSection.className = 'gq-section';

  const progLabel = document.createElement('div');
  progLabel.className = 'gq-label';
  progLabel.textContent = `Quote progress · ${pct}%`;
  progSection.appendChild(progLabel);

  const track = document.createElement('div');
  track.className = 'gq-progress-track';
  const fill = document.createElement('div');
  fill.className = 'gq-progress-fill';
  fill.style.width = `${pct}%`;
  track.appendChild(fill);
  progSection.appendChild(track);

  if (prefilled.length) {
    const chips = document.createElement('div');
    chips.className = 'gq-chips';
    prefilled.forEach((p) => {
      const chip = document.createElement('span');
      chip.className = 'gq-chip';
      chip.textContent = p;
      chips.appendChild(chip);
    });
    progSection.appendChild(chips);
  }
  body.appendChild(progSection);

  // Section 2: missing information checklist
  if (missing.length) {
    const missSection = document.createElement('div');
    missSection.className = 'gq-section';

    const missLabel = document.createElement('div');
    missLabel.className = 'gq-label';
    missLabel.textContent = 'Still needed by Admiral';
    missSection.appendChild(missLabel);

    const list = document.createElement('ul');
    list.className = 'gq-checklist';
    missing.forEach((m) => {
      const li = document.createElement('li');
      const box = document.createElement('span');
      box.className = 'gq-checkbox';
      box.setAttribute('aria-hidden', 'true');
      const txt = document.createElement('span');
      txt.className = 'gq-check-text';
      txt.textContent = m;
      li.appendChild(box);
      li.appendChild(txt);
      list.appendChild(li);
    });
    missSection.appendChild(list);
    body.appendChild(missSection);
  }

  // Section 3: actions
  const actions = document.createElement('div');
  actions.className = 'gq-actions';

  const primary = document.createElement('button');
  primary.type = 'button';
  primary.className = 'gq-cta-primary';
  primary.textContent = 'Continue to Admiral Quote';
  if (bridge) {
    primary.addEventListener('click', () => {
      if (item.quote_flow_url) bridge.openLink(item.quote_flow_url);
    });
  }
  actions.appendChild(primary);

  const secondary = document.createElement('button');
  secondary.type = 'button';
  secondary.className = 'gq-cta-secondary';
  secondary.textContent = 'Choose Different Cover';
  if (bridge) {
    secondary.addEventListener('click', () => {
      bridge.sendMessage('Show me other Admiral cover options');
    });
  }
  actions.appendChild(secondary);

  body.appendChild(actions);
  card.appendChild(body);
  block.appendChild(card);
}
