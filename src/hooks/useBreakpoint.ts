import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return {
    isDesktop: width >= BREAKPOINTS.desktop,
    isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop,
    isMobile: width < BREAKPOINTS.tablet,
    width,
  };
}
