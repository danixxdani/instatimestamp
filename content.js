(function () {
  'use strict';

  const PROCESSED_ATTR = 'data-ig-time-processed';

  const LOCALE_MAP = {
    en: 'en-US',
    es: 'es-ES',
    pt: 'pt-BR',
    ko: 'ko-KR',
    ja: 'ja-JP',
    zh: 'zh-CN',
  };

  function getLocalTz() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
    catch { return 'UTC'; }
  }

  function detectBrowserLang() {
    const raw = (navigator.language || navigator.languages?.[0] || 'en').toLowerCase();
    if (raw.startsWith('ko')) return 'ko';
    if (raw.startsWith('ja')) return 'ja';
    if (raw.startsWith('zh')) return 'zh';
    if (raw.startsWith('es')) return 'es';
    if (raw.startsWith('pt')) return 'pt';
    return 'en';
  }

  let currentTimezone = getLocalTz();
  let currentLang = detectBrowserLang();
  let enabled = true;

  function getLocale() {
    return LOCALE_MAP[currentLang] || 'en-US';
  }

  function getTzAbbr(date, tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(date);
      return parts.find(p => p.type === 'timeZoneName')?.value || '';
    } catch { return ''; }
  }

  function formatTime(isoString, tz) {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;
    const locale = getLocale();
    const dateStr = date.toLocaleDateString(locale, { timeZone: tz, year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString(locale, { timeZone: tz, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    const abbr = getTzAbbr(date, tz);
    return `${dateStr}, ${timeStr}${abbr ? ' ' + abbr : ''}`;
  }

  function createBadge(text) {
    const badge = document.createElement('span');
    badge.className = 'ig-exact-time-badge';
    badge.textContent = text;
    badge.style.cssText = [
      'display:inline-block', 'margin-left:6px', 'padding:1px 8px',
      'background:rgba(0,149,246,0.12)', 'color:#0095f6', 'border-radius:10px',
      'font-size:11px', 'font-weight:500', 'white-space:nowrap',
      'vertical-align:middle', 'cursor:default', 'user-select:none',
      'line-height:1.7', 'position:relative', 'z-index:9999',
    ].join(';');
    return badge;
  }

  function processElement(el) {
    if (el.hasAttribute(PROCESSED_ATTR)) return;
    const datetime = el.getAttribute('datetime');
    if (!datetime) return;
    const text = formatTime(datetime, currentTimezone);
    if (!text) return;
    el.setAttribute(PROCESSED_ATTR, '1');
    el.title = text;
    if (el.nextSibling?.classList?.contains('ig-exact-time-badge')) return;
    el.parentNode.insertBefore(createBadge(text), el.nextSibling);
  }

  function scanAll() {
    if (!enabled) return;
    document.querySelectorAll('time[datetime]').forEach(processElement);
  }

  function removeAll() {
    document.querySelectorAll('.ig-exact-time-badge').forEach(b => b.remove());
    document.querySelectorAll(`[${PROCESSED_ATTR}]`).forEach(el => el.removeAttribute(PROCESSED_ATTR));
  }

  function refreshAll() {
    removeAll();
    if (enabled) scanAll();
  }

  chrome.storage.sync.get(['timezone', 'enabled', 'lang'], (result) => {
    if (result.timezone) currentTimezone = result.timezone;
    if (result.lang) currentLang = result.lang;
    enabled = result.enabled !== false;
    scanAll();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.timezone) {
      currentTimezone = changes.timezone.newValue || getLocalTz();
      refreshAll();
    }
    if (changes.enabled) {
      enabled = changes.enabled.newValue !== false;
      refreshAll();
    }
    if (changes.lang) {
      currentLang = changes.lang.newValue || detectBrowserLang();
      refreshAll();
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TIMEZONE_CHANGED' && msg.timezone) {
      currentTimezone = msg.timezone;
      refreshAll();
    }
    if (msg.type === 'ENABLED_CHANGED') {
      enabled = msg.enabled !== false;
      refreshAll();
    }
    if (msg.type === 'LANG_CHANGED' && msg.lang) {
      currentLang = msg.lang;
      refreshAll();
    }
  });

  const observer = new MutationObserver(() => scanAll());
  observer.observe(document.body, { childList: true, subtree: true });

  let attempts = 0;
  const interval = setInterval(() => {
    scanAll();
    if (++attempts >= 20) clearInterval(interval);
  }, 500);

})();
