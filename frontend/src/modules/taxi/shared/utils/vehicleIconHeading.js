// Map markers are rotated by the vehicle's compass bearing, which assumes the
// artwork is drawn top-down with the nose pointing UP (north). The bundled
// icons (car/bike/auto/delivery) follow that.
//
// Map icons uploaded through the admin panel are drawn nose-LEFT (west), so
// they need a quarter turn clockwise before the bearing is applied -- otherwise
// they sit permanently 90 degrees off and appear to drive sideways.
export const CUSTOM_MAP_ICON_HEADING_OFFSET = 90;

// Anything that is not one of the imported bundle assets came from the admin
// upload, so it follows the nose-left convention.
export const resolveIconHeadingOffset = (iconUrl, bundledIcons = []) => {
  const url = String(iconUrl || '').trim();

  if (!url || bundledIcons.includes(iconUrl)) {
    return 0;
  }

  return CUSTOM_MAP_ICON_HEADING_OFFSET;
};

export default resolveIconHeadingOffset;
