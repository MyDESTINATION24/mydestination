import React from 'react';
import { OverlayView, OverlayViewF } from '@react-google-maps/api';
import { useSmoothedLatLng } from '../hooks/useSmoothedLatLng';
import { resolveIconHeadingOffset } from '../utils/vehicleIconHeading';

// The tween runs at 60fps, and it deliberately lives INSIDE this component.
// Held in the page instead, every animation frame re-rendered the whole
// tracking screen -- drawer, cards, the lot -- which on a mid-range phone
// starved the frame budget and made the vehicle appear to crawl.
// Keeping it here means only the marker re-renders per frame.

const getPixelPositionOffset = (width, height) => ({
  x: -(width / 2),
  y: -(height / 2),
});

const normalizeHeading = (value, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return ((numeric % 360) + 360) % 360;
};

const SmoothVehicleMarker = ({
  position,
  heading = 0,
  iconUrl,
  fallbackIcon,
  bundledIcons = [],
  title = 'Driver',
  // The live route. Given this, a marker that has fallen behind (stalled socket)
  // drives the road to catch up instead of sliding across it in a straight line.
  routePath = null,
}) => {
  const { position: smoothPosition, heading: smoothHeading } = useSmoothedLatLng(position, heading, {
    path: routePath,
  });
  const renderPosition = smoothPosition || position;

  if (!renderPosition) {
    return null;
  }

  // Bundled artwork is drawn nose-up; admin uploads are drawn nose-left.
  const headingOffset = resolveIconHeadingOffset(iconUrl, bundledIcons);

  return (
    <OverlayViewF
      position={renderPosition}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={getPixelPositionOffset}
    >
      <div title={title} className="pointer-events-none flex h-14 w-14 items-center justify-center">
        {/* No CSS transition here: JS drives the rotation frame by frame, and a
            transition would re-ease every intermediate value and lag behind. */}
        <div
          className="flex h-11 w-11 items-center justify-center"
          style={{ transform: `rotate(${normalizeHeading(smoothHeading + headingOffset)}deg)` }}
        >
          <img
            src={iconUrl || fallbackIcon}
            alt={title}
            className="h-12 w-12 object-contain drop-shadow-[0_8px_10px_rgba(15,23,42,0.35)]"
            draggable={false}
          />
        </div>
      </div>
    </OverlayViewF>
  );
};

export default SmoothVehicleMarker;
