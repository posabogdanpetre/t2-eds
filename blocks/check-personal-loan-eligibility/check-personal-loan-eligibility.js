// codegen:layout-pattern=generic-detail
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  overall_status: 'Appears to meet the published quote criteria',
  criteria_results: [
    { criterion: 'UK residency', status: 'pass', explanation: 'You told us you are a permanent resident of Wales and have lived in the UK for 12 continuous years, which meets the published residency requirement.' },
    { criterion: 'UK bank account', status: 'pass', explanation: 'You confirmed you hold a UK bank account in your own name.' },
    { criterion: 'Employment status', status: 'pass', explanation: 'You reported being in full-time employment, one of the accepted employment or retirement statuses.' },
    { criterion: 'Minimum annual income', status: 'pass', explanation: 'Your self-reported annual income of £32,000 is above the published minimum for requesting a quote.' },
    { criterion: 'Adverse-credit conditions', status: 'review', explanation: 'You indicated no current bankruptcy, CCJ, DRO or IVA. This is confirmed at the quote stage, so keep any relevant paperwork to hand.' },
  ],
  quote_process_notes: [
    'Getting a quote shows your personalised rate with no impact on your credit score.',
    'A quote is not a full application and does not guarantee approval.',
    'A full application involves a credit search, which may affect your credit score.',
    'The rate you are offered may differ from the 12.9% APR representative example.',
  ],
  required_preparation: [
    'Proof of identity and current UK address.',
    'Details of your income and employment.',
    'Your UK bank account details for repayments.',
    'The loan amount and repayment term you are considering.',
  ],
  source_url: 'https://www.admiral.com/personal-loans',
};

function statusLabel(status) {
  const s = (status || '').toLowerCase();
  if (s === 'pass') return 'Pass';
  if (s === 'fail') return 'Not met';
  return 'Review';
}

function statusClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'pass') return 'pass';
  if (s === 'fail') return 'fail';
  return 'review';
}

function buildPanel(heading, listItems) {
  const panel = document.createElement('section');
  panel.className = 'cple-panel';

  const h = document.createElement('h3');
  h.className = 'cple-panel-title';
  h.textContent = heading;
  panel.appendChild(h);

  const ul = document.createElement('ul');
  ul.className = 'cple-panel-list';
  (listItems || []).forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    ul.appendChild(li);
  });
  panel.appendChild(ul);
  return panel;
}

function renderEligibility(block, data, bridge) {
  const wrap = document.createElement('div');
  wrap.className = 'cple-card';

  // Status banner
  const banner = document.createElement('div');
  banner.className = 'cple-banner';
  const overall = (data.overall_status || '').toLowerCase();
  let overallClass = 'review';
  if (overall.includes('meet') && !overall.includes('not') && !overall.includes("don't") && !overall.includes('do not')) overallClass = 'pass';
  if (overall.includes('not meet') || overall.includes('do not meet') || overall.includes("don't meet")) overallClass = 'fail';
  banner.classList.add(`cple-banner-${overallClass}`);

  const bannerLabel = document.createElement('span');
  bannerLabel.className = 'cple-banner-label';
  bannerLabel.textContent = 'Eligibility check';
  banner.appendChild(bannerLabel);

  const bannerStatus = document.createElement('span');
  bannerStatus.className = 'cple-banner-status';
  bannerStatus.textContent = data.overall_status || 'Needs review';
  banner.appendChild(bannerStatus);

  wrap.appendChild(banner);

  // Criteria rows
  const list = document.createElement('div');
  list.className = 'cple-criteria';
  (data.criteria_results || []).forEach((c) => {
    const row = document.createElement('div');
    row.className = 'cple-row';

    const top = document.createElement('div');
    top.className = 'cple-row-top';

    const label = document.createElement('span');
    label.className = 'cple-criterion';
    label.textContent = c.criterion || '';
    top.appendChild(label);

    const pill = document.createElement('span');
    pill.className = `cple-pill cple-pill-${statusClass(c.status)}`;
    pill.textContent = statusLabel(c.status);
    top.appendChild(pill);

    row.appendChild(top);

    const exp = document.createElement('p');
    exp.className = 'cple-explanation';
    exp.textContent = c.explanation || '';
    row.appendChild(exp);

    list.appendChild(row);
  });
  wrap.appendChild(list);

  // Panels
  const panels = document.createElement('div');
  panels.className = 'cple-panels';
  if ((data.quote_process_notes || []).length) {
    panels.appendChild(buildPanel('Quote vs. full application', data.quote_process_notes));
  }
  if ((data.required_preparation || []).length) {
    panels.appendChild(buildPanel('What to prepare', data.required_preparation));
  }
  wrap.appendChild(panels);

  // Actions — max 2 per generic-detail card budget
  const actions = document.createElement('div');
  actions.className = 'cple-actions';

  const actionDefs = [
    {
      label: 'Review My Answers',
      variant: 'secondary',
      run: () => bridge.sendMessage('Let me review my answers for the personal loan eligibility check'),
    },
    {
      label: 'Get a Personal Loan Quote',
      variant: 'primary',
      run: () => {
        if (data.source_url) bridge.openLink(data.source_url);
        else bridge.sendMessage('I would like to get a personal loan quote');
      },
    },
  ];

  actionDefs.forEach((def) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cple-btn cple-btn-${def.variant}`;
    btn.textContent = def.label;
    if (bridge) btn.addEventListener('click', def.run);
    actions.appendChild(btn);
  });

  wrap.appendChild(actions);

  block.appendChild(wrap);
}

export default async function decorate(block, bridge) {
  let data;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      data = SAMPLE_DATA;
    } else {
      // Detail concept — structuredContent IS the item (flat). No wrapper key.
      const _result = await bridge.toolResult;
      data = _result?.structuredContent || {};
    }
  } else {
    data = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!data || !data.overall_status) {
    const empty = document.createElement('p');
    empty.className = 'cple-empty';
    empty.textContent = 'No eligibility result is available yet.';
    block.appendChild(empty);
  } else {
    renderEligibility(block, data, bridge);
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
