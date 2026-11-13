import { useEffect, useState } from 'react';

// Phone-width check matching Tailwind's `md` breakpoint (768px). The mobile
// service tabs and the pages that hide their own header for them both use it,
// so they always agree on which layout is showing.
const QUERY = '(max-width: 767px)';

const read = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY).matches : false);

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(read);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const media = window.matchMedia(QUERY);
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);
  return isMobile;
};

export default useIsMobile;
