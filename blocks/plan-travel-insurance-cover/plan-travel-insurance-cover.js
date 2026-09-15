// codegen:layout-pattern=plan-carousel

// Sample data for standalone/preview mode. Shaped to the action outputSchema
// (Admiral travel-cover configurations). In production, data comes dynamically
// from bridge.toolResult.
const SAMPLE_DATA = [
  {
    plan_name: 'Annual Multi-Trip · Gold',
    policy_type: 'Annual',
    cover_level: 'Gold',
    trip_eligibility: 'Unlimited trips up to 31 days each — fits three trips a year.',
    key_limits: ['Medical expenses up to £10m', 'Cancellation up to £3,000', 'Baggage up to £2,000'],
    recommended_extras: ['Winter Sports', 'Enhanced Disruption'],
    excess_summary: 'Standard excess £75 per person, per section.',
    important_exclusions: ['Undeclared pre-existing conditions', 'Trips over 31 days'],
    source_url: 'https://www.admiral.com/travel-insurance',
  },
  {
    plan_name: 'Annual Multi-Trip · Platinum',
    policy_type: 'Annual',
    cover_level: 'Platinum',
    trip_eligibility: 'Unlimited trips up to 45 days each; winter sports included as standard.',
    key_limits: ['Medical expenses up to £15m', 'Cancellation up to £5,000', 'Baggage up to £3,000'],
    recommended_extras: ['Cruise', 'Gadget'],
    excess_summary: 'Standard excess £50 per person, per section.',
    important_exclusions: ['Undeclared pre-existing conditions', 'Trips over 45 days'],
    source_url: 'https://www.admiral.com/travel-insurance',
  },
  {
    plan_name: 'Single Trip · Gold (Ski Week)',
    policy_type: 'Single Trip',
    cover_level: 'Gold',
    trip_eligibility: 'One trip up to 31 days — matches a skiing week in France with winter sports added.',
    key_limits: ['Medical expenses up to £10m', 'Cancellation up to £3,000', 'Piste closure cover'],
    recommended_extras: ['Winter Sports'],
    excess_summary: 'Standard excess £75 per person, per section.',
    important_exclusions: ['Off-piste without a guide', 'Undeclared pre-existing conditions'],
    source_url: 'https://www.admiral.com/travel-insurance',
  },
  {
    plan_name: 'Single Trip · Admiral (Summer)',
    policy_type: 'Single Trip',
    cover_level: 'Admiral',
    trip_eligibility: 'One trip up to 45 days — an economical base for a longer summer holiday.',
    key_limits: ['Medical expenses up to £5m', 'Cancellation up to £1,500', 'Baggage up to £1,000'],
    recommended_extras: ['Enhanced Disruption'],
    excess_summary: 'Standard excess £100 per person, per section.',
    important_exclusions: ['Winter sports not covered', 'Undeclared pre-existing conditions'],
    source_url: 'https://www.admiral.com/travel-insurance',
  },
  {
    plan_name: 'Annual Multi-Trip · Admiral',
    policy_type: 'Annual',
    cover_level: 'Admiral',
    trip_eligibility: 'Unlimited trips up to 17 days each — best value for several short breaks.',
    key_limits: ['Medical expenses up to £5m', 'Cancellation up to £1,500', 'Baggage up to £1,000'],
    recommended_extras: ['Gadget'],
    excess_summary: 'Standard excess £100 per person, per section.',
    important_exclusions: ['Trips over 17 days', 'Undeclared pre-existing conditions'],
    source_url: 'https://www.admiral.com/travel-insurance',
  },
];

// Brand palette from designTokens (accent green, coastal navy/aqua). getThemedCardBg()
// darkens PALETTE[0] to luminance <= 0.12 so white text keeps WCAG AA contrast.
const PALETTE = ['#00a32e', '#005485', '#77ddff', '#4f4f4f'];

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
  for (let i = 0; i < 20; i += 1) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

// Cover-level band colors (no image field in outputSchema — a colored band stands in).
const LEVEL_COLORS = {
  Admiral: '#005485',
  Gold: '#b8860b',
  Platinum: '#4a5568',
};
const BAND_FALLBACK = ['#005485', '#007120', '#4a5568', '#6b4f8a', '#8a5a2b'];

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
      // structuredContent.plans — derived from action name "plan_travel_insurance_cover" (bare array outputSchema rule)
      items = structuredContent?.plans || [];
    }
  } else {
    items = SAMPLE_DATA;
  }
  if (!items || !items.length) items = SAMPLE_DATA;

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

function chipRow(values, className) {
  const row = document.createElement('div');
  row.className = className;
  values.slice(0, 3).forEach((v) => {
    const chip = document.createElement('span');
    chip.className = 'plan-travel-insurance-cover-chip';
    chip.textContent = v;
    row.appendChild(chip);
  });
  return row;
}

function renderCarousel(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'plan-travel-insurance-cover-wrapper';

  const btnLeft = document.createElement('button');
  btnLeft.className = 'plan-travel-insurance-cover-arrow plan-travel-insurance-cover-arrow-left';
  btnLeft.setAttribute('aria-label', 'Scroll left');
  btnLeft.textContent = '◄';

  const trackWrap = document.createElement('div');
  trackWrap.className = 'plan-travel-insurance-cover-track-wrap';

  const track = document.createElement('div');
  track.className = 'plan-travel-insurance-cover-track';

  const btnRight = document.createElement('button');
  btnRight.className = 'plan-travel-insurance-cover-arrow plan-travel-insurance-cover-arrow-right';
  btnRight.setAttribute('aria-label', 'Scroll right');
  btnRight.textContent = '►';

  const fade = document.createElement('div');
  fade.className = 'plan-travel-insurance-cover-fade';
  fade.style.background = `linear-gradient(to right, transparent, ${theme?.bg ?? '#1a1a1a'}cc)`;

  items.slice(0, 6).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'plan-travel-insurance-cover-card';

    // Cover-level band (stands in for the image top of the plan carousel).
    const band = document.createElement('div');
    band.className = 'plan-travel-insurance-cover-band';
    band.style.background = LEVEL_COLORS[item.cover_level] || BAND_FALLBACK[i % BAND_FALLBACK.length];

    const level = document.createElement('span');
    level.className = 'plan-travel-insurance-cover-level';
    level.textContent = item.cover_level || 'Cover';
    band.appendChild(level);

    if (item.policy_type) {
      const policy = document.createElement('span');
      policy.className = 'plan-travel-insurance-cover-policy';
      policy.textContent = item.policy_type;
      band.appendChild(policy);
    }
    card.appendChild(band);

    const info = document.createElement('div');
    info.className = 'plan-travel-insurance-cover-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    const name = document.createElement('div');
    name.className = 'plan-travel-insurance-cover-name';
    name.textContent = item.plan_name || '';
    info.appendChild(name);

    if (item.trip_eligibility) {
      const elig = document.createElement('div');
      elig.className = 'plan-travel-insurance-cover-elig';
      elig.textContent = item.trip_eligibility;
      info.appendChild(elig);
    }

    if (Array.isArray(item.key_limits) && item.key_limits.length) {
      const limits = document.createElement('ul');
      limits.className = 'plan-travel-insurance-cover-limits';
      item.key_limits.slice(0, 3).forEach((lim) => {
        const li = document.createElement('li');
        li.textContent = lim;
        limits.appendChild(li);
      });
      info.appendChild(limits);
    }

    if (Array.isArray(item.recommended_extras) && item.recommended_extras.length) {
      info.appendChild(chipRow(item.recommended_extras, 'plan-travel-insurance-cover-chips'));
    }

    if (item.excess_summary) {
      const excess = document.createElement('div');
      excess.className = 'plan-travel-insurance-cover-excess';
      excess.textContent = item.excess_summary;
      info.appendChild(excess);
    }

    const cta = document.createElement('button');
    cta.className = 'plan-travel-insurance-cover-cta';
    cta.textContent = 'Get a Travel Quote';
    if (bridge) {
      cta.addEventListener('click', () => {
        if (item.source_url) bridge.openLink(item.source_url);
        else bridge.sendMessage(`Tell me more about ${item.plan_name || 'this Admiral travel cover'}`);
      });
    }
    info.appendChild(cta);

    card.appendChild(info);
    track.appendChild(card);
  });

  trackWrap.appendChild(track);
  trackWrap.appendChild(fade);
  wrapper.appendChild(btnLeft);
  wrapper.appendChild(trackWrap);
  wrapper.appendChild(btnRight);
  block.appendChild(wrapper);

  const cardWidth = 240 + 16;
  btnLeft.addEventListener('click', () => track.scrollBy({ left: -cardWidth, behavior: 'smooth' }));
  btnRight.addEventListener('click', () => track.scrollBy({ left: cardWidth, behavior: 'smooth' }));
  const updateArrows = () => {
    btnLeft.style.display = track.scrollLeft <= 0 ? 'none' : 'flex';
    btnRight.style.display = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4 ? 'none' : 'flex';
  };
  track.addEventListener('scroll', updateArrows);
  updateArrows();
}
