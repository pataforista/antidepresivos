// Applies persisted UI settings before first paint to avoid FOUC.
// Loaded synchronously (no defer/async) so it runs before the browser renders.
(function () {
  try {
    var persisted = JSON.parse(localStorage.getItem('pwa_antidep_2026::v0'));
    var ui = (persisted && persisted.state && persisted.state.ui) ? persisted.state.ui : {};

    var theme = ui.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    var metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#1A1610' : '#F9F7F2');

    var fontSizeMap = { normal: '1rem', large: '1.125rem', xl: '1.25rem' };
    var fontSize = ui.fontSize || 'normal';
    document.documentElement.style.setProperty('--font-size-base', fontSizeMap[fontSize] || '1rem');
    document.documentElement.setAttribute('data-font-size', fontSize);

    if (ui.animations === false) document.documentElement.setAttribute('data-reduced-motion', 'true');
    if (ui.compact === true) document.documentElement.setAttribute('data-compact', 'true');
  } catch (e) { /* silently ignore storage errors */ }
}());
