const REPOS = {
  pkgs:  { label: 'ferret-pkgs',  wordmark: 'Packages Repository' },
  kmods: { label: 'ferret-kmods', wordmark: 'Kmods Repository' },
};

let activeRepo = 'pkgs';
const cache = {};

const $ = id => document.getElementById(id);

function switchRepo(repo) {
  activeRepo = repo;

  const search = $('search-input');
  const repoSelect = $('repo-select');
  const wordmark = $('navbar-repo-name');
  if (repoSelect) repoSelect.value = repo;
  if (search) search.value = '';
  if (wordmark) wordmark.textContent = REPOS[repo].wordmark;

  loadRepo(repo);
}

// ── Load & parse repodata ────────────────────────────────
async function loadRepo(repo) {
  const list = $('pkg-list');
  if (cache[repo]) { updateStats(repo, cache[repo]); renderPackages(); return; }

  list.innerHTML = stateBox(`loading ${repo}…`, 'fetching repodata', `<div class="spinner"></div>`, true);

  try {
    const base = `${repo}/x86_64/repodata/`;

    // Step 1: find real primary filename from repomd.xml
    const repomdRes = await fetch(base + 'repomd.xml');
    if (!repomdRes.ok) throw new Error('HTTP ' + repomdRes.status);
    const repomdDoc = new DOMParser().parseFromString(await repomdRes.text(), 'application/xml');
    const primaryHref = [...repomdDoc.querySelectorAll('data')]
      .find(el => el.getAttribute('type') === 'primary')
      ?.querySelector('location')?.getAttribute('href');
    if (!primaryHref) throw new Error('primary not found in repomd.xml');

    // Step 2: fetch & decompress primary.xml.gz
    const res = await fetch(base + primaryHref.split('/').pop());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const xml = await decompressGz(await res.arrayBuffer());

    cache[repo] = parseXml(xml);
    updateStats(repo, cache[repo]);
    renderPackages();
  } catch (err) {
    list.innerHTML = stateBox('failed to load packages', `could not fetch repodata — ${esc(err.message)}`, errorIcon);
  }
}

// ── Decompress gzip ──────────────────────────────────────
async function decompressGz(buf) {
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(new Uint8Array(buf));
  writer.close();
  const chunks = [];
  for (const reader = ds.readable.getReader();;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const out = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0));
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return new TextDecoder().decode(out);
}

// ── Parse primary.xml ────────────────────────────────────
function parseXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return [...doc.querySelectorAll('package[type="rpm"]')].map(el => {
    const ver = el.querySelector('version');
    const loc = el.querySelector('location');
    const href = loc?.getAttribute('href') || '';
    const xmlBase = loc?.getAttribute('xml:base') || '';
    return {
      name:    el.querySelector('name')?.textContent    || '',
      arch:    el.querySelector('arch')?.textContent    || '',
      version: ver ? `${ver.getAttribute('ver')}-${ver.getAttribute('rel')}` : '',
      summary: el.querySelector('summary')?.textContent || '',
      size:    parseInt(el.querySelector('size')?.getAttribute('package') || 0),
      time:    parseInt(el.querySelector('time')?.getAttribute('file')    || 0),
      dlUrl:   xmlBase ? xmlBase + href : href,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

// ── Stats ────────────────────────────────────────────────
function updateStats(repo, pkgs) {
  $('stat-repo').textContent = REPOS[repo].label;
  $('stat-total').textContent = pkgs.length;
  const newest = pkgs.reduce((m, p) => p.time > m ? p.time : m, 0);
  $('stat-updated').textContent = newest ? new Date(newest * 1000).toISOString().slice(0, 10) : '—';
}

// ── Render ───────────────────────────────────────────────
function renderPackages() {
  const list  = $('pkg-list');
  const query = $('search-input').value.toLowerCase().trim();
  const sort  = $('sort-select').value;
  const pkgs  = cache[activeRepo];
  if (!pkgs) return;

  let out = pkgs.filter(p =>
    p.name.toLowerCase().includes(query) || p.summary.toLowerCase().includes(query)
  );

  const sorters = {
    size:    (a, b) => b.size - a.size,
    name:    (a, b) => a.name.localeCompare(b.name),
    version: (a, b) => a.version.localeCompare(b.version),
  };
  if (sorters[sort]) out.sort(sorters[sort]);

  if (!out.length) {
    list.innerHTML = stateBox('no packages found', `no results for "<strong>${esc(query)}</strong>"`, searchIcon);
    return;
  }

  list.innerHTML = out.map((p, i) => `
    <div class="download-card" style="animation-delay:${Math.min(i * 18, 300)}ms">
      <div class="download-card__main">
        <div class="download-card__header">
          <span class="download-card__name">${esc(p.name)}</span>
          <span class="download-card__arch ${p.arch === 'noarch' ? 'arch-noarch' : p.arch.includes('86') ? 'arch-x86' : ''}">${esc(p.arch)}</span>
          <span class="download-card__item">${clockIcon} ${esc(p.version)}</span>
          ${p.size ? `<span class="download-card__item">${dlIcon} ${fmtSize(p.size)}</span>` : ''}
        </div>
        ${p.summary ? `<div class="download-card__summary">${esc(p.summary)}</div>` : ''}
      </div>
      ${p.dlUrl ? `<a class="download-card__btn btn btn--primary" href="${p.dlUrl}" target="_blank" rel="noopener">${dlIcon} .rpm</a>` : ''}
    </div>`).join('');
}

// ── Helpers ──────────────────────────────────────────────
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtSize = b => !b ? '' : b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b > 1024 ? (b / 1024).toFixed(0) + ' KB' : b + ' B';
const stateBox = (title, msg, icon, noPad) => `<div class="state-box"${noPad ? ' style="padding-top:var(--space-8);padding-bottom:var(--space-8);"' : ''}>${icon}<span>${title}</span><p>${msg}</p></div>`;

const errorIcon  = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const searchIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const clockIcon  = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M6 3.5v2.5l1.5 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`;
const dlIcon     = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 2v6M3.5 5.5L6 8l2.5-2.5M2 10h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// ── Boot ─────────────────────────────────────────────────
const initialRepo = new URLSearchParams(window.location.search).get('repo');
if (initialRepo && REPOS[initialRepo]) {
  activeRepo = initialRepo;
  const repoSelect = $('repo-select');
  if (repoSelect) repoSelect.value = initialRepo;
}
const wordmark = $('navbar-repo-name');
if (wordmark) wordmark.textContent = REPOS[activeRepo].wordmark;
loadRepo(activeRepo);

$('search-input')?.addEventListener('input', renderPackages);
$('sort-select')?.addEventListener('change', renderPackages);
$('repo-select')?.addEventListener('change', e => switchRepo(e.target.value));