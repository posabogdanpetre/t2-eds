// codegen:layout-pattern=comparison
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'Admiral',
    cover_type: 'Comprehensive',
    included_features: [
      'Uninsured driver promise',
      'Courtesy car (repairs at approved repairer)',
      'Windscreen repair/replacement',
      'Personal accident cover',
      'DriveSure telematics option',
    ],
    optional_extras: [
      'Breakdown cover',
      'Motor legal protection',
      'Guaranteed hire car',
      'European driving extension',
    ],
    limits_summary:
      'Personal belongings up to published limit; audio/entertainment equipment covered up to policy limit.',
    excess_summary:
      'Compulsory + voluntary excess apply; exact figures shown on your quote and policy schedule.',
    best_for:
      'Everyday drivers wanting solid comprehensive cover with the flexibility to add extras.',
    source_url: 'https://www.admiral.com/car-insurance',
  },
  {
    name: 'Gold',
    cover_type: 'Comprehensive',
    included_features: [
      'Uninsured driver promise',
      'Guaranteed hire car included',
      'Windscreen repair/replacement',
      'Personal accident cover (higher limit)',
      'Motor legal protection included',
      'European driving included',
    ],
    optional_extras: [
      'Breakdown cover',
      'Enhanced personal belongings',
      'DriveSure telematics option',
    ],
    limits_summary:
      'Higher personal belongings limit; enhanced hire car and legal cover included as standard.',
    excess_summary:
      'Compulsory + voluntary excess apply; exact figures shown on your quote and policy schedule.',
    best_for:
      'Daily commuters wanting more included as standard, including a guaranteed hire car and legal cover.',
    source_url: 'https://www.admiral.com/car-insurance',
  },
];

// Brand colors from DESIGN_TOKENS' color tier — used to derive the panel background.
const PALETTE = ['#00a32e', '#005485', '#77ddff', '#4f4f4f', '#ffffff'];
const ACCENT = '#00a32e';
const SECONDARY = '#005485';

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

const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

const TERM_DEFS = {
  excess: 'Excess is the amount you pay towards a claim. A compulsory excess is set by the insurer; you can add a voluntary excess on top.',
  windscreen: 'Windscreen cover pays to repair or replace glass, often with a separate, lower excess than a standard claim.',
};

export default async function decorate(block, bridge) {
  let plans;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      plans = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || {};
      // structuredContent.plans — bare array outputSchema; key derived from actionName "compare_car_insurance_plans"
      plans = structuredContent?.plans || [];
    }
  } else {
    plans = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!Array.isArray(plans) || plans.length < 2) {
    const empty = document.createElement('p');
    empty.className = 'compare-car-insurance-plans-empty';
    empty.textContent = 'Two cover options are needed to compare.';
    block.appendChild(empty);
  } else {
    renderComparison(block, plans.slice(0, 2), bridge);
  }

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

function makeIndicator(state) {
  const span = document.createElement('span');
  span.className = `cip-ind cip-ind-${state}`;
  span.setAttribute('aria-hidden', 'true');
  span.textContent = state === 'inc' ? '✓' : state === 'opt' ? '○' : '—';
  return span;
}

function renderComparison(block, plans, bridge) {
  const container = document.createElement('div');
  container.className = 'cip-container';

  // Header panels — leading spacer keeps the plan-A/plan-B boundary aligned with the table's value columns
  const panels = document.createElement('div');
  panels.className = 'cip-panels';

  const panelSpacer = document.createElement('div');
  panelSpacer.className = 'cip-label cip-col-spacer';
  panelSpacer.setAttribute('aria-hidden', 'true');
  panels.appendChild(panelSpacer);

  plans.forEach((plan, i) => {
    const panel = document.createElement('div');
    panel.className = 'cip-panel';
    panel.style.cssText = `background:${theme?.bg ?? '#0a2818'};color:${theme?.fg ?? '#fff'}`;

    const chip = document.createElement('span');
    chip.className = 'cip-chip';
    chip.textContent = plan.cover_type || 'Cover';
    panel.appendChild(chip);

    const name = document.createElement('h3');
    name.className = 'cip-name';
    name.textContent = plan.name || `Option ${i + 1}`;
    panel.appendChild(name);

    panels.appendChild(panel);
  });
  container.appendChild(panels);

  // Attribute table
  const table = document.createElement('div');
  table.className = 'cip-table';

  const listRows = [
    { label: 'Included', key: 'included_features', ind: 'inc' },
    { label: 'Optional', key: 'optional_extras', ind: 'opt' },
  ];
  const textRows = [
    { label: 'Limits', key: 'limits_summary' },
    { label: 'Excess', key: 'excess_summary' },
    { label: 'Best for', key: 'best_for' },
  ];

  let rowIndex = 0;

  const addRow = (label, buildCells, diff) => {
    const row = document.createElement('div');
    row.className = `cip-row${rowIndex % 2 ? ' cip-row-alt' : ''}`;
    rowIndex += 1;

    const lab = document.createElement('div');
    lab.className = 'cip-label';
    lab.textContent = label;
    row.appendChild(lab);

    plans.forEach((plan, i) => {
      const cell = document.createElement('div');
      cell.className = 'cip-cell';
      if (diff) cell.classList.add('cip-diff');
      buildCells(cell, plan, i);
      row.appendChild(cell);
    });
    table.appendChild(row);
  };

  listRows.forEach(({ label, key, ind }) => {
    const values = plans.map((p) => (Array.isArray(p[key]) ? p[key] : []));
    const diff = JSON.stringify(values[0]) !== JSON.stringify(values[1]);
    addRow(label, (cell, plan) => {
      const items = Array.isArray(plan[key]) ? plan[key] : [];
      const ul = document.createElement('ul');
      ul.className = 'cip-featlist';
      items.forEach((f) => {
        const li = document.createElement('li');
        li.appendChild(makeIndicator(ind));
        const txt = document.createElement('span');
        txt.textContent = f;
        li.appendChild(txt);
        ul.appendChild(li);
      });
      cell.appendChild(ul);
    }, diff);
  });

  textRows.forEach(({ label, key }) => {
    const diff = (plans[0][key] || '') !== (plans[1][key] || '');
    addRow(label, (cell, plan) => {
      const p = document.createElement('p');
      p.className = 'cip-text';
      p.textContent = plan[key] || '—';
      cell.appendChild(p);

      const termKey = key === 'excess_summary' ? 'excess' : key === 'limits_summary' ? 'windscreen' : null;
      if (termKey) {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'cip-term-toggle';
        toggle.textContent = `What is ${termKey}?`;
        toggle.setAttribute('aria-expanded', 'false');
        const def = document.createElement('p');
        def.className = 'cip-term-def';
        def.hidden = true;
        def.textContent = TERM_DEFS[termKey];
        toggle.addEventListener('click', () => {
          const open = def.hidden;
          def.hidden = !open;
          toggle.setAttribute('aria-expanded', String(open));
        });
        cell.appendChild(toggle);
        cell.appendChild(def);
      }
    }, diff);
  });

  container.appendChild(table);

  // Per-item CTA row: Get a Car Quote (green primary conversion)
  const ctaRow = document.createElement('div');
  ctaRow.className = 'cip-cta-row';
  const spacer = document.createElement('div');
  spacer.className = 'cip-label cip-cta-spacer';
  ctaRow.appendChild(spacer);
  plans.forEach((plan) => {
    const cell = document.createElement('div');
    cell.className = 'cip-cta-cell';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cip-cta cip-cta-primary';
    btn.textContent = 'Get a Car Quote';
    if (bridge && plan.source_url) {
      btn.addEventListener('click', () => bridge.openLink(plan.source_url));
    }
    cell.appendChild(btn);
    ctaRow.appendChild(cell);
  });
  container.appendChild(ctaRow);

  // Shared secondary action row: Swap Plans + Review Optional Extras (full content width)
  const secRow = document.createElement('div');
  secRow.className = 'cip-sec-row';
  const secActions = document.createElement('div');
  secActions.className = 'cip-sec-actions';

  const swap = document.createElement('button');
  swap.type = 'button';
  swap.className = 'cip-cta cip-cta-secondary';
  swap.textContent = 'Swap Plans';
  if (bridge) swap.addEventListener('click', () => bridge.sendMessage('Swap the plans being compared'));
  secActions.appendChild(swap);

  const extras = document.createElement('button');
  extras.type = 'button';
  extras.className = 'cip-cta cip-cta-secondary';
  extras.textContent = 'Review Optional Extras';
  if (bridge) extras.addEventListener('click', () => bridge.sendMessage('Review the optional extras for these plans'));
  secActions.appendChild(extras);

  secRow.appendChild(secActions);
  container.appendChild(secRow);

  block.appendChild(container);
}
