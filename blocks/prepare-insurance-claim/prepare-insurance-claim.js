// codegen:layout-pattern=generic-detail
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult (a single flat result object).
const SAMPLE_DATA = {
  claim_type: 'Motor',
  status: 'Routine claim preparation',
  urgent_actions: [
    'Check that you and any passengers are safe and unhurt; call 999 if anyone is injured.',
    'Photograph the damage to the rear door and the position of both vehicles before moving anything.',
    'Exchange names, contact details, vehicle registrations and insurer details with the third party.',
  ],
  information_checklist: [
    "Your Admiral policy number and the registered keeper's details.",
    'Date, approximate time and exact location of the incident.',
    "The third party's name, address, phone number and vehicle registration.",
    "The third party's insurer and policy number if available.",
    'Names and contact details of any witnesses.',
  ],
  evidence_checklist: [
    'Photos of the dented rear door from several angles.',
    "Wide photos showing both vehicles' positions on the road.",
    'Any dashcam footage of the incident.',
    'A note of the weather, light and road conditions at the time.',
  ],
  timing_note:
    'Report the incident to Admiral as soon as reasonably possible — ideally within a few days — even if you do not intend to make a claim, so your policy stays valid.',
  reporting_route:
    'Report online via the Admiral claims page or call the Admiral motor claims line; you can also manage the claim in MyAccount.',
  source_url: 'https://www.admiral.com/make-a-claim',
};

const ADMIRAL_HOME = 'https://www.admiral.com';

function isUrgent(status) {
  const s = (status || '').toLowerCase();
  return s.includes('emergency') || s.includes('urgent');
}

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA;
    } else {
      // Detail / single-object concept — structuredContent IS the item (flat).
      const _result = await bridge.toolResult;
      item = _result?.structuredContent || {};
    }
  } else {
    item = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!item?.claim_type && !(item?.urgent_actions && item.urgent_actions.length)) {
    const empty = document.createElement('p');
    empty.className = 'pic-empty';
    empty.textContent = 'No claim preparation details were found.';
    block.appendChild(empty);
  } else {
    renderDashboard(block, item, bridge);
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

function renderDashboard(block, item, bridge) {
  const root = document.createElement('div');
  root.className = 'pic-card';

  const urgent = isUrgent(item.status);

  // --- Urgent actions panel ---
  if (Array.isArray(item.urgent_actions) && item.urgent_actions.length) {
    const panel = document.createElement('div');
    panel.className = `pic-urgent${urgent ? ' pic-urgent--critical' : ''}`;

    const h = document.createElement('div');
    h.className = 'pic-urgent-title';
    h.textContent = 'Do this now';
    panel.appendChild(h);

    const list = document.createElement('div');
    list.className = 'pic-urgent-list';
    item.urgent_actions.forEach((text) => {
      const row = document.createElement('div');
      row.className = 'pic-urgent-row';
      const glyph = document.createElement('span');
      glyph.className = 'pic-urgent-glyph';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.textContent = '⚠';
      const span = document.createElement('span');
      span.className = 'pic-urgent-text';
      span.textContent = text;
      row.appendChild(glyph);
      row.appendChild(span);
      list.appendChild(row);
    });
    panel.appendChild(list);
    root.appendChild(panel);
  }

  // --- Summary card ---
  const summary = document.createElement('div');
  summary.className = 'pic-summary';

  const chips = document.createElement('div');
  chips.className = 'pic-chips';
  if (item.claim_type) {
    const claimChip = document.createElement('span');
    claimChip.className = 'pic-chip pic-chip--claim';
    claimChip.textContent = item.claim_type;
    chips.appendChild(claimChip);
  }
  if (item.status) {
    const statusChip = document.createElement('span');
    statusChip.className = `pic-chip pic-chip--status${urgent ? ' pic-chip--urgent' : ' pic-chip--routine'}`;
    statusChip.textContent = item.status;
    chips.appendChild(statusChip);
  }
  summary.appendChild(chips);

  if (item.reporting_route) {
    const route = document.createElement('div');
    route.className = 'pic-route';
    const label = document.createElement('span');
    label.className = 'pic-meta-label';
    label.textContent = 'How to report';
    const val = document.createElement('span');
    val.className = 'pic-route-val';
    val.textContent = item.reporting_route;
    route.appendChild(label);
    route.appendChild(val);
    summary.appendChild(route);
  }

  if (item.timing_note) {
    const timing = document.createElement('div');
    timing.className = 'pic-timing';
    const label = document.createElement('span');
    label.className = 'pic-meta-label';
    label.textContent = 'Timing';
    const val = document.createElement('span');
    val.className = 'pic-timing-val';
    val.textContent = item.timing_note;
    timing.appendChild(label);
    timing.appendChild(val);
    summary.appendChild(timing);
  }
  root.appendChild(summary);

  // --- Checklists ---
  const lists = document.createElement('div');
  lists.className = 'pic-lists';
  lists.appendChild(buildChecklist('Information to gather', item.information_checklist));
  lists.appendChild(buildChecklist('Evidence to collect', item.evidence_checklist));
  root.appendChild(lists);

  // --- CTA row ---
  const ctas = document.createElement('div');
  ctas.className = 'pic-ctas';

  const startBtn = document.createElement('button');
  startBtn.type = 'button';
  startBtn.className = 'pic-btn pic-btn--primary';
  startBtn.textContent = 'Start Official Claim';
  const startTarget = item.source_url || ADMIRAL_HOME;
  startBtn.addEventListener('click', () => {
    if (bridge) bridge.openLink(startTarget);
  });
  ctas.appendChild(startBtn);

  const accountBtn = document.createElement('button');
  accountBtn.type = 'button';
  accountBtn.className = 'pic-btn pic-btn--secondary';
  accountBtn.textContent = 'Open MyAccount';
  accountBtn.addEventListener('click', () => {
    if (bridge) bridge.openLink(ADMIRAL_HOME);
  });
  ctas.appendChild(accountBtn);

  root.appendChild(ctas);

  block.appendChild(root);
}

function buildChecklist(title, items) {
  const col = document.createElement('div');
  col.className = 'pic-list';

  const h = document.createElement('div');
  h.className = 'pic-list-title';
  h.textContent = title;
  col.appendChild(h);

  const ul = document.createElement('ul');
  ul.className = 'pic-list-items';
  (Array.isArray(items) ? items : []).forEach((text) => {
    const li = document.createElement('li');
    li.className = 'pic-list-item';
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-pressed', 'false');

    const box = document.createElement('span');
    box.className = 'pic-check';
    box.setAttribute('aria-hidden', 'true');
    box.textContent = '☐';

    const span = document.createElement('span');
    span.className = 'pic-list-text';
    span.textContent = text;

    const toggle = () => {
      const done = li.classList.toggle('pic-checked');
      box.textContent = done ? '☑' : '☐';
      li.setAttribute('aria-pressed', done ? 'true' : 'false');
    };
    li.addEventListener('click', toggle);
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    li.appendChild(box);
    li.appendChild(span);
    ul.appendChild(li);
  });
  col.appendChild(ul);
  return col;
}
