"use client";

import { useState, useEffect } from "react";

interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Hook to track window dimensions and device type
 */
export const useScreenSize = (): ScreenSize => {
  // Default to desktop dimensions as fallback for SSR
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: 1200,
    height: 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === "undefined") return;

    // Function to update screen dimensions and device type
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1200,
        isDesktop: width >= 1200,
      });
    };

    // Set initial size
    updateScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", updateScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  return screenSize;
};
