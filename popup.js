(function () {
  const langSelectEl  = document.getElementById('lang-select');
  const toggleTrack   = document.getElementById('toggle-track');
  const tzSection     = document.getElementById('tz-section');
  const comboRow      = document.getElementById('combo-row');
  const comboInput    = document.getElementById('combo-input');
  const comboClear    = document.getElementById('combo-clear');
  const comboArrow    = document.getElementById('combo-arrow');
  const comboList     = document.getElementById('combo-list');
  const currentTimeEl = document.getElementById('current-time');
  const currentTzEl   = document.getElementById('current-tz-name');
  const btnReset      = document.getElementById('btn-reset');
  const bmcBtn        = document.getElementById('bmc-btn');

  let selectedTz  = null;
  let currentLang = 'en';
  let enabled     = true;
  let clockTimer  = null;
  let isOpen      = false;

  function t(key, ...args) {
    const dict = I18N[currentLang] || I18N.en;
    const val = dict[key] ?? I18N.en[key];
    return typeof val === 'function' ? val(...args) : val;
  }

  function applyStrings() {
    document.getElementById('hdr-sub').textContent     = t('subtitle');
    document.getElementById('lbl-tz').textContent      = t('sectionLabel');
    document.getElementById('lbl-current').textContent = t('currentLabel');
    document.getElementById('lbl-footer').textContent  = t('footer');
    document.getElementById('lbl-toggle').textContent  = t('toggleLabel');
    document.getElementById('lbl-toggle-sub').textContent = t('toggleSub');
    btnReset.textContent = t('reset');
    bmcBtn.textContent = t('buyMeCoffee');
    if (!comboInput.value) comboInput.placeholder = t('searchPlaceholder');
  }

  // ── Language ──────────────────────────────────────

  function buildLangOptions() {
    langSelectEl.innerHTML = '';
    LANG_OPTIONS.forEach(({ code, label }) => {
      const opt = document.createElement('option');
      opt.value = code; opt.textContent = label;
      if (code === currentLang) opt.selected = true;
      langSelectEl.appendChild(opt);
    });
  }

  langSelectEl.addEventListener('change', () => {
    currentLang = langSelectEl.value;
    chrome.storage.sync.set({ lang: currentLang });
    applyStrings();
    sendToInstagram({ type: 'LANG_CHANGED', lang: currentLang });
  });

  // ── Toggle ────────────────────────────────────────

  function setEnabled(val) {
    enabled = val;
    toggleTrack.classList.toggle('on', enabled);
    tzSection.classList.toggle('disabled-section', !enabled);
  }

  toggleTrack.addEventListener('click', () => {
    setEnabled(!enabled);
    chrome.storage.sync.set({ enabled });
    sendToInstagram({ type: 'ENABLED_CHANGED', enabled });
  });

  // ── Combobox ──────────────────────────────────────

  function getLocalTz() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch { return 'UTC'; }
  }

  function getTzAbbr(tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date());
      return parts.find(p => p.type === 'timeZoneName')?.value || '';
    } catch { return ''; }
  }

  function getTzMeta(tz) {
    return TIMEZONES.find(t => t.tz === tz);
  }

  function openCombo() {
    isOpen = true;
    comboRow.classList.add('open');
    comboArrow.classList.add('open');
    comboList.classList.add('open');
    comboInput.focus();
    setTimeout(() => comboInput.select(), 0);
    comboClear.classList.toggle('visible', comboInput.value.length > 0);
    renderList(comboInput.value);
  }

  function closeCombo() {
    isOpen = false;
    comboRow.classList.remove('open');
    comboArrow.classList.remove('open');
    comboList.classList.remove('open');
    const meta = getTzMeta(selectedTz);
    comboInput.value = meta ? meta.label : selectedTz || '';
    comboClear.classList.toggle('visible', comboInput.value.length > 0);
    comboInput.placeholder = t('searchPlaceholder');
  }

  function renderList(query) {
    const q = (query || '').trim().toLowerCase();
    const filtered = q
      ? TIMEZONES.filter(item =>
          item.label.toLowerCase().includes(q) ||
          item.tz.toLowerCase().includes(q) ||
          item.offset.toLowerCase().includes(q))
      : TIMEZONES;

    comboList.innerHTML = '';

    if (filtered.length === 0) {
      const el = document.createElement('div');
      el.className = 'combo-no-results';
      el.textContent = t('noResults');
      comboList.appendChild(el);
      return;
    }

    filtered.forEach(item => {
      const el = document.createElement('div');
      el.className = 'combo-item' + (item.tz === selectedTz ? ' selected' : '');
      el.innerHTML = `<span class="combo-item-offset">${item.offset}</span><span class="combo-item-label">${item.label}</span>${item.tz === selectedTz ? '<span class="combo-item-check">✓</span>' : ''}`;
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectedTz = item.tz;
        closeCombo();
        updateClock();
        chrome.storage.sync.set({ timezone: selectedTz });
        sendToInstagram({ type: 'TIMEZONE_CHANGED', timezone: selectedTz });
      });
      comboList.appendChild(el);
    });

    // scroll selected into view
    const sel = comboList.querySelector('.selected');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  comboRow.addEventListener('click', () => {
    if (!isOpen) openCombo(); else closeCombo();
  });

  comboInput.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isOpen) openCombo();
    else setTimeout(() => comboInput.select(), 0);
  });

  comboInput.addEventListener('input', () => {
    comboClear.classList.toggle('visible', comboInput.value.length > 0);
    renderList(comboInput.value);
    if (!isOpen) openCombo();
  });

  comboClear.addEventListener('mousedown', (e) => {
    e.preventDefault();
    comboInput.value = '';
    comboClear.classList.remove('visible');
    renderList('');
    comboInput.focus();
  });

  document.addEventListener('click', (e) => {
    if (isOpen && !document.querySelector('.combo-wrap').contains(e.target)) closeCombo();
  });

  // ── Clock ─────────────────────────────────────────

  function updateClock() {
    if (!selectedTz) return;
    try {
      currentTimeEl.textContent = new Date().toLocaleTimeString('en-US', {
        timeZone: selectedTz, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
      });
      const meta = getTzMeta(selectedTz);
      const abbr = getTzAbbr(selectedTz);
      currentTzEl.textContent = meta ? `${meta.label}  (${abbr || meta.offset})` : selectedTz;
    } catch { currentTimeEl.textContent = '--'; }
  }

  // ── Save / Reset ──────────────────────────────────



  btnReset.addEventListener('click', () => {
    const localTz = getLocalTz();
    chrome.storage.sync.set({ timezone: '' }, () => {
      selectedTz = localTz;
      closeCombo();
      updateClock();
      sendToInstagram({ type: 'TIMEZONE_CHANGED', timezone: localTz });
    });
  });

  function sendToInstagram(msg) {
    chrome.tabs.query({ url: 'https://www.instagram.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
      });
    });
  }

  bmcBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://buymeacoffee.com/danibutfreer' });
  });

  // ── Init ──────────────────────────────────────────

  chrome.storage.sync.get(['timezone', 'lang', 'enabled'], (result) => {
    currentLang = result.lang || detectBrowserLang();
    selectedTz  = result.timezone || getLocalTz();
    enabled     = result.enabled !== false;

    buildLangOptions();
    applyStrings();
    setEnabled(enabled);

    const meta = getTzMeta(selectedTz);
    comboInput.value = meta ? meta.label : selectedTz;

    updateClock();
    clockTimer = setInterval(updateClock, 1000);
  });

})();
