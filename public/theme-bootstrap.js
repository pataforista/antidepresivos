// Applies persisted UI settings before first paint to avoid FOUC.
// Loaded synchronously (no defer/async) so it runs before the browser renders.
(function () {
  try {
    var persisted = JSON.parse(localStorage.getItem('pwa_antidep_2026::v0'));
    var ui = (persisted && persisted.state && persisted.state.ui) ? persisted.state.ui : {};

    var sharedTheme = localStorage.getItem('theme');
    var theme = (sharedTheme === 'dark' || sharedTheme === 'light') ? sharedTheme : null;

    if (!theme && ui.theme && (ui.theme === 'dark' || ui.theme === 'light')) {
      theme = ui.theme;
    }

    if (!theme) {
      theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', theme);
    var themeColor = theme === 'dark' ? '#191A2B' : '#FBF1EC';
    var metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) metaTheme.setAttribute('content', themeColor);
    var metaThemeLight = document.getElementById('meta-theme-color-light');
    if (metaThemeLight && theme === 'dark') metaThemeLight.setAttribute('content', themeColor);

    var fontSizeMap = { normal: '1rem', large: '1.125rem', xl: '1.25rem' };
    var fontSize = ui.fontSize || 'normal';
    document.documentElement.style.setProperty('--font-size-base', fontSizeMap[fontSize] || '1rem');
    document.documentElement.setAttribute('data-font-size', fontSize);

    if (ui.animations === false) document.documentElement.setAttribute('data-reduced-motion', 'true');
    if (ui.compact === true) document.documentElement.setAttribute('data-compact', 'true');
  } catch (e) {
    // Storage inaccesible: se aplica el tema por defecto.
    console.warn('[theme-bootstrap] No se pudieron leer las preferencias:', e);
  }
}());
