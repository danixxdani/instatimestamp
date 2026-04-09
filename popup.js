(function () {
  const searchEl      = document.getElementById('search');
  const selectEl      = document.getElementById('tz-select');
  const langSelectEl  = document.getElementById('lang-select');
  const currentTimeEl = document.getElementById('current-time');
  const currentTzEl   = document.getElementById('current-tz-name');
  const resultCountEl = document.getElementById('result-count');
  const btnSave       = document.getElementById('btn-save');
  const btnReset      = document.getElementById('btn-reset');

  let selectedTz   = null;
  let currentLang  = 'en';
  let clockTimer   = null;

  // ── i18n ──────────────────────────────────────────

  function t(key, ...args) {
    const dict = I18N[currentLang] || I18N.en;
    const val = dict[key] ?? I18N.en[key];
    return typeof val === 'function' ? val(...args) : val;
  }

  function applyStrings() {
    document.getElementById('hdr-sub').textContent    = t('subtitle');
    document.getElementById('lbl-tz').textContent     = t('sectionLabel');
    searchEl.placeholder                              = t('searchPlaceholder');
    document.getElementById('lbl-current').textContent = t('currentLabel');
    document.getElementById('lbl-footer').textContent = t('footer');
    btnSave.textContent                               = t('save');
    btnReset.textContent                              = t('reset');
    rebuildOptions(searchEl.value);
  }

  // ── Language selector ─────────────────────────────

  function buildLangOptions() {
    langSelectEl.innerHTML = '';
    LANG_OPTIONS.forEach(({ code, label }) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = label;
      if (code === currentLang) opt.selected = true;
      langSelectEl.appendChild(opt);
    });
  }

  langSelectEl.addEventListener('change', () => {
    currentLang = langSelectEl.value;
    chrome.storage.sync.set({ lang: currentLang });
    applyStrings();
  });

  // ── Timezone dropdown ─────────────────────────────

  function getLocalTz() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  function getTzAbbr(tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, timeZoneName: 'short',
      }).formatToParts(new Date());
      return parts.find(p => p.type === 'timeZoneName')?.value || '';
    } catch { return ''; }
  }

  function getTzMeta(tz) {
    return TIMEZONES.find(t => t.tz === tz);
  }

  function rebuildOptions(query) {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? TIMEZONES.filter(item =>
          item.label.toLowerCase().includes(q) ||
          item.tz.toLowerCase().includes(q) ||
          item.offset.toLowerCase().includes(q)
        )
      : TIMEZONES;

    selectEl.innerHTML = '';

    if (filtered.length === 0) {
      const opt = document.createElement('option');
      opt.disabled = true;
      opt.textContent = t('noResults');
      selectEl.appendChild(opt);
      resultCountEl.textContent = '';
      return;
    }

    filtered.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.tz;
      opt.textContent = `${item.offset}  ${item.label}`;
      if (item.tz === selectedTz) opt.selected = true;
      selectEl.appendChild(opt);
    });

    if (!filtered.find(f => f.tz === selectedTz) && filtered.length > 0) {
      selectedTz = filtered[0].tz;
      selectEl.selectedIndex = 0;
    }

    resultCountEl.textContent = q ? t('resultCount', filtered.length) : '';
    updateClock();
  }

  // ── Clock preview ─────────────────────────────────

  function updateClock() {
    if (!selectedTz) return;
    try {
      currentTimeEl.textContent = new Date().toLocaleTimeString('en-US', {
        timeZone: selectedTz,
        hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
      });
      const meta = getTzMeta(selectedTz);
      const abbr = getTzAbbr(selectedTz);
      currentTzEl.textContent = meta
        ? `${meta.label}  (${abbr || meta.offset})`
        : selectedTz;
    } catch { currentTimeEl.textContent = '--'; }
  }

  function startClock() {
    clearInterval(clockTimer);
    updateClock();
    clockTimer = setInterval(updateClock, 1000);
  }

  // ── Events ────────────────────────────────────────

  searchEl.addEventListener('input', () => rebuildOptions(searchEl.value));

  selectEl.addEventListener('change', () => {
    selectedTz = selectEl.value;
    updateClock();
  });

  btnSave.addEventListener('click', () => {
    if (!selectedTz) return;
    chrome.storage.sync.set({ timezone: selectedTz }, () => {
      btnSave.textContent = t('saved');
      btnSave.classList.add('saved');
      setTimeout(() => {
        btnSave.textContent = t('save');
        btnSave.classList.remove('saved');
      }, 1500);
    });
  });

  btnReset.addEventListener('click', () => {
    chrome.storage.sync.set({ timezone: '' }, () => {
      selectedTz = getLocalTz();
      rebuildOptions(searchEl.value);
      const orig = btnReset.textContent;
      btnReset.textContent = '✓';
      setTimeout(() => { btnReset.textContent = t('reset'); }, 1200);
    });
  });

  // ── Init ─────────────────────────────────────────

  chrome.storage.sync.get(['timezone', 'lang'], (result) => {
    currentLang = result.lang || detectBrowserLang();
    selectedTz  = result.timezone || getLocalTz();

    buildLangOptions();
    applyStrings();
    startClock();
  });

})();
