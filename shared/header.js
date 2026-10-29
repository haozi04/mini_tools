/* ══════════════════════════════════════════════════
   MiniTools — Shared Header Framework
   Centralized dark mode + i18n + header injection.
   Pages include this file, then:
     1. injectHeader({ icon, title, subtitle, subtitleText })
     2. define a global TRANSLATIONS object
     3. define pageApplyTranslations() for page-specific text
   Edit here to change header behavior across all tools.
   ══════════════════════════════════════════════════ */

// ── Fonts (bbox·lab design language) ─────────────
(function loadFonts() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap';
  document.head.appendChild(link);
})();

// ── Dark mode ─────────────────────────────────────
const DARK_KEY = 'miniToolsDark';

function getInitialTheme() {
  const saved = localStorage.getItem(DARK_KEY);
  if (saved !== null) return saved === 'true';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

let isDark = getInitialTheme();

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const btn = document.getElementById('darkToggle');
  if (btn) {
    btn.textContent = dark ? '☀️' : '🌙';
    btn.title = dark
      ? (currentLang === 'zh' ? '切换到浅色模式' : 'Switch to light mode')
      : (currentLang === 'zh' ? '切换到深色模式' : 'Switch to dark mode');
  }
}

function toggleDark() {
  isDark = !isDark;
  localStorage.setItem(DARK_KEY, isDark);
  applyTheme(isDark);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (localStorage.getItem(DARK_KEY) === null) {
    isDark = e.matches;
    applyTheme(isDark);
  }
});

// ── i18n ──────────────────────────────────────────
const LANG_KEY = 'miniToolsLang';

function getInitialLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'en' || saved === 'zh') return saved;
  return (navigator.language || navigator.userLanguage || 'en')
                    .toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

let currentLang = getInitialLang();

// TRANSLATIONS is defined by each page (global const).
// Guard against pages that don't define it.
function t(key) {
  const dict = (typeof TRANSLATIONS !== 'undefined') ? TRANSLATIONS : { en: {}, zh: {} };
  return dict[currentLang][key] || dict['en'][key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  applyTranslations();
}

// Base translation application (header + common).
// Pages may define pageApplyTranslations() for page-specific work.
function applyTranslations() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';

  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    const subEl = document.getElementById('page-subtitle');
    if (subEl) {
      titleEl.childNodes[0].textContent = t('pageTitle') + ' ';
    } else {
      titleEl.textContent = t('pageTitle');
    }
  }
  const subEl = document.getElementById('page-subtitle');
  if (subEl) subEl.textContent = t('pageSubtitle');

  const btnEn = document.getElementById('btn-en');
  const btnZh = document.getElementById('btn-zh');
  if (btnEn) btnEn.classList.toggle('active', currentLang === 'en');
  if (btnZh) btnZh.classList.toggle('active', currentLang === 'zh');

  applyTheme(isDark);

  if (typeof pageApplyTranslations === 'function') pageApplyTranslations();
}

// ── Header injection ──────────────────────────────
// config.icon  — raw HTML for the icon (emoji or SVG)
// config.title — initial title text
// config.subtitle / config.subtitleText — optional subtitle span
function injectHeader(config) {
  config = config || {};
  const icon     = config.icon || '🧰';
  const title    = config.title || '';
  const subtitle = config.subtitle
    ? `<span id="page-subtitle">${config.subtitleText || ''}</span>`
    : '';

  const header = document.createElement('header');
  header.innerHTML = `
    <a href="index.html">
      ${icon}
      <h1 id="page-title">${title} ${subtitle}</h1>
    </a>
    <div class="header-actions">
      <div class="switcher">
        <button class="switcher-btn" id="btn-en" onclick="setLang('en')">EN</button>
        <button class="switcher-btn" id="btn-zh" onclick="setLang('zh')">中文</button>
      </div>
      <button class="dark-toggle" id="darkToggle" onclick="toggleDark()" title="Toggle dark mode">🌙</button>
    </div>`;
  document.body.insertBefore(header, document.body.firstChild);
}

// ── Usage Tracking ────────────────────────────────
const USAGE_KEY = 'miniToolsUsage';

function trackToolUsage() {
  // Only track on tool pages (not index)
  const path = window.location.pathname;
  
  // Skip index page (various forms)
  if (path === '/' || path === '' || path.endsWith('/')) return;
  if (path.endsWith('index.html') || path.endsWith('/index.html')) return;
  
  // Extract tool ID from filename (handle both .html and extensionless URLs)
  let filename = path.split('/').pop();
  if (!filename) return;
  
  // Remove query parameters and hash fragments
  filename = filename.split('?')[0].split('#')[0];
  
  // Remove .html extension if present
  filename = filename.replace(/\.html$/, '');
  if (!filename) return;

  // Map filenames to tool IDs used in TOOL_CARDS
  const toolIdMap = {
    'warranty-tool': 'warranty',
    'mlfb-option-code-processor': 'mlfb',
    'markdown-renderer': 'markdown',
    'format-converter': 'format',
    'city-map-wallpaper': 'map',
    '3mf-stl-converter': 'converter3d',
    '3d-viewer': 'viewer3d',
    'bbox-tool': 'bbox',
    'text-chunker': 'chunker',
    'workday-calculator': 'workday',
    'fuel-cost-comparison': 'fuel',
    'image-watermark': 'watermark'
  };

  const toolId = toolIdMap[filename];
  
  // Fallback: check for data-tool-id attribute on body or main element
  const explicitToolId = document.body?.dataset?.toolId || document.querySelector('main')?.dataset?.toolId;
  const finalToolId = toolId || explicitToolId;
  
  if (!finalToolId) return;

  // Increment usage count
  const counts = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
  counts[finalToolId] = (counts[finalToolId] || 0) + 1;
  localStorage.setItem(USAGE_KEY, JSON.stringify(counts));
}

// ── Init ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  trackToolUsage();
  applyTheme(isDark);
  applyTranslations();
});
