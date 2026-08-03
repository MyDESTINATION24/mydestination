/**
 * Calculates a dynamic CSS filter style for the logo image
 * to match any primary theme hex color seamlessly.
 *
 * @param {string} primaryColor - Hex color string (e.g. '#FFD000', '#FF1053', '#5F8575')
 * @returns {object} Inline React style object with CSS filter
 */
export const getLogoFilterStyle = (primaryColor) => {
  if (!primaryColor || typeof primaryColor !== 'string') {
    return {};
  }

  const cleanHex = primaryColor.trim().replace('#', '');
  if (cleanHex.length !== 3 && cleanHex.length !== 6) {
    return {};
  }

  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map((c) => c + c).join('');
  }

  const r = parseInt(fullHex.substring(0, 2), 16) / 255;
  const g = parseInt(fullHex.substring(2, 4), 16) / 255;
  const b = parseInt(fullHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h /= 6;
  }

  const targetHue = Math.round(h * 360);
  const baseLogoGreenHue = 140; // Base green logo hue angle
  const hueShift = targetHue - baseLogoGreenHue;

  return {
    filter: `hue-rotate(${hueShift}deg) saturate(1.4) brightness(1.05)`,
    transition: 'filter 0.3s ease'
  };
};
