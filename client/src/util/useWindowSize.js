// hooks/useWindowSize.js
import { useState, useEffect } from 'react';

export default function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isLaptop: window.innerWidth >= 1024 && window.innerWidth < 1440,
    isDesktop: window.innerWidth >= 1440,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setSize({
        width,
        height: window.innerHeight,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isLaptop: width >= 1024 && width < 1440,
        isDesktop: width >= 1440,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
