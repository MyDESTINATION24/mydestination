import { isWebView } from './deviceDetect';

/**
 * The Android app draws its WebView edge-to-edge (behind the status bar) but
 * the WebView reports env(safe-area-inset-top) as 0, so every page header,
 * back button and toast ended up under the clock and battery icons.
 *
 * When we are inside the app, the inset reads 0 and the page really fills the
 * whole screen, set --app-top to the status bar height and flag <html>; the
 * rules in index.css then push the page, its fixed/sticky top bars and
 * full-screen overlays below the status bar. Browsers, and devices whose
 * WebView reports the inset properly, are left alone.
 */
const FALLBACK_STATUS_BAR = 32; // px; Android status bars are ~24-32dp

const readEnvTop = () => {
  try {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);';
    document.body.appendChild(probe);
    const value = parseFloat(getComputedStyle(probe).paddingTop) || 0;
    probe.remove();
    return value;
  } catch {
    return 0;
  }
};

export const applyAppInsets = () => {
  try {
    if (!isWebView() || !/Android/i.test(navigator.userAgent || '')) return;
    if (readEnvTop() > 0) return; // the WebView reports insets; pages handle it
    // Edge-to-edge: the page is as tall as the screen. A WebView laid out
    // below the status bar is noticeably shorter, and needs no offset.
    const gap = (window.screen?.height || 0) - window.innerHeight;
    if (gap > 24) return;
    const root = document.documentElement;
    root.style.setProperty('--app-top', `${FALLBACK_STATUS_BAR}px`);
    root.setAttribute('data-app-inset', '');
  } catch { /* never block startup */ }
};
