// Map markers are rotated by the vehicle's compass bearing, which assumes the
// artwork is drawn top-down with the nose pointing UP (north). The bundled
// icons (car/bike/auto/delivery) follow that.
//
// Admin uploads do NOT follow one convention -- the Bike icon is drawn nose-up
// while the Auto icon is drawn nose-left. A single blanket offset is therefore
// always wrong for one of them, and a vehicle rotated 90 degrees off its
// direction of travel reads as sliding sideways rather than driving.
//
// A top-down vehicle is always longest along its travel axis, so the image's
// own shape says which way it points: taller than wide means the nose runs
// vertically (up), wider than tall means it runs horizontally (left).
export const CUSTOM_MAP_ICON_HEADING_OFFSET = 90;

// Near-square art carries no reliable signal, so treat it as nose-up rather
// than guessing a quarter turn that might be wrong.
const LANDSCAPE_RATIO_THRESHOLD = 1.15;

export const isBundledIcon = (iconUrl, bundledIcons = []) =>
  !iconUrl || bundledIcons.includes(iconUrl);

// aspectRatio is naturalWidth / naturalHeight, measured once the image loads.
// Until it is known, assume nose-up: that is correct for bundled art and for
// half the uploads, and it never introduces a rotation we cannot justify.
export const resolveIconHeadingOffset = (iconUrl, bundledIcons = [], aspectRatio = null) => {
  if (isBundledIcon(iconUrl, bundledIcons)) {
    return 0;
  }

  if (!Number.isFinite(Number(aspectRatio)) || Number(aspectRatio) <= 0) {
    return 0;
  }

  return Number(aspectRatio) >= LANDSCAPE_RATIO_THRESHOLD ? CUSTOM_MAP_ICON_HEADING_OFFSET : 0;
};

export default resolveIconHeadingOffset;
