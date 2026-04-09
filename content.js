(function () {
  'use strict';

  const PROCESSED_ATTR = 'data-ig-time-processed';
  let currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 시간대 약어 가져오기 (e.g. PST, KST, EST)
  function getTzAbbr(date, tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short',
      }).formatToParts(date);
      const tzPart = parts.find(p => p.type === 'timeZoneName');
      return tzPart ? tzPart.value : '';
    } catch {
      return '';
    }
  }

  function formatTime(isoString, tz) {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;

    const dateStr = date.toLocaleDateString('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const timeStr = date.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const abbr = getTzAbbr(date, tz);
    return `${dateStr}, ${timeStr}${abbr ? ' ' + abbr : ''}`;
  }

  function createBadge(text) {
    const badge = document.createElement('span');
    badge.className = 'ig-exact-time-badge';

    badge.textContent = text;

    badge.style.cssText = [
      'display:inline-block',
      'margin-left:6px',
      'padding:1px 8px',
      'background:rgba(0,149,246,0.12)',
      'color:#0095f6',
      'border-radius:10px',
      'font-size:11px',
      'white-space:nowrap',
      'vertical-align:middle',
      'cursor:default',
      'user-select:none',
      'line-height:1.7',
      'position:relative',
      'z-index:9999',
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

    if (el.nextSibling && el.nextSibling.classList && el.nextSibling.classList.contains('ig-exact-time-badge')) return;

    const badge = createBadge(text);
    el.parentNode.insertBefore(badge, el.nextSibling);
  }

  function scanAll() {
    document.querySelectorAll('time[datetime]').forEach(processElement);
  }

  function refreshAll() {
    document.querySelectorAll('.ig-exact-time-badge').forEach(b => b.remove());
    document.querySelectorAll(`[${PROCESSED_ATTR}]`).forEach(el => {
      el.removeAttribute(PROCESSED_ATTR);
    });
    scanAll();
  }

  chrome.storage.sync.get(['timezone'], (result) => {
    if (result.timezone) currentTimezone = result.timezone;
    scanAll();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.timezone) {
      currentTimezone = changes.timezone.newValue || Intl.DateTimeFormat().resolvedOptions().timeZone;
      refreshAll();
    }
  });

  const observer = new MutationObserver(() => scanAll());
  observer.observe(document.body, { childList: true, subtree: true });

  // SPA 초기 렌더링 대응: 10초간 0.5초마다 재시도
  let attempts = 0;
  const interval = setInterval(() => {
    scanAll();
    if (++attempts >= 20) clearInterval(interval);
  }, 500);

})();
