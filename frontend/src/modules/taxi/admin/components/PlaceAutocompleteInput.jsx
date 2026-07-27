import { useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { HAS_VALID_GOOGLE_MAPS_KEY, useAppGoogleMapsLoader } from '../utils/googleMaps';

// A text input with Google Places suggestions attached.
//
// Falls back to a plain input when the Maps key is missing or the SDK has not
// loaded yet, so a bad key degrades to typing an address by hand rather than
// leaving an admin with a dead field.
//
// onPlaceSelected receives coordinates as well as the formatted address --
// several models (PoolingRoute stops, for one) already carry latitude and
// longitude fields that nothing was filling in.
const PlaceAutocompleteInput = ({
  value = '',
  onChange,
  onPlaceSelected,
  className = '',
  placeholder = '',
  types,
  country = 'in',
}) => {
  const { isLoaded } = useAppGoogleMapsLoader();
  const [autocomplete, setAutocomplete] = useState(null);

  const plainInput = (
    <input
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      className={className}
      placeholder={placeholder}
    />
  );

  if (!isLoaded || !HAS_VALID_GOOGLE_MAPS_KEY) {
    return plainInput;
  }

  const handlePlaceChanged = () => {
    const place = autocomplete?.getPlace?.();
    if (!place) return;

    const address = place.formatted_address || place.name || '';
    if (address) {
      onChange?.(address);
    }

    onPlaceSelected?.({
      address,
      name: place.name || '',
      latitude: place.geometry?.location?.lat?.() ?? null,
      longitude: place.geometry?.location?.lng?.() ?? null,
    });
  };

  return (
    <Autocomplete
      onLoad={setAutocomplete}
      onPlaceChanged={handlePlaceChanged}
      options={{
        componentRestrictions: country ? { country } : undefined,
        fields: ['formatted_address', 'name', 'geometry'],
        ...(types ? { types } : {}),
      }}
    >
      {plainInput}
    </Autocomplete>
  );
};

export default PlaceAutocompleteInput;
