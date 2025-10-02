/**
 * Mobile zoom utilities for automatic screen fitting
 */

export interface ViewportInfo {
  width: number;
  height: number;
  scale: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Get current viewport information
 */
export function getViewportInfo(): ViewportInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = window.devicePixelRatio || 1;
  
  return {
    width,
    height,
    scale,
    isMobile: width <= 768,
    isTablet: width > 768 && width <= 1024,
    isDesktop: width > 1024,
  };
}

/**
 * Detect if the device supports touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get optimal zoom level for current device
 */
export function getOptimalZoom(): number {
  const viewport = getViewportInfo();
  
  // For very small screens, suggest a slight zoom out
  if (viewport.width < 360) {
    return 0.9;
  }
  
  // For small mobile screens, keep at 1x
  if (viewport.width < 480) {
    return 1.0;
  }
  
  // For larger mobile screens, allow slight zoom
  if (viewport.width < 768) {
    return 1.0;
  }
  
  // For tablets and larger, allow more zoom
  return 1.0;
}

/**
 * Apply automatic zoom adjustment
 */
export function applyAutoZoom(): void {
  const optimalZoom = getOptimalZoom();
  const currentZoom = parseFloat(
    getComputedStyle(document.documentElement).zoom || '1'
  );
  
  // Only adjust if there's a significant difference
  if (Math.abs(currentZoom - optimalZoom) > 0.1) {
    document.documentElement.style.zoom = optimalZoom.toString();
  }
}

/**
 * Initialize mobile zoom handling
 */
export function initMobileZoom(): void {
  // Apply initial zoom
  applyAutoZoom();
  
  // Listen for orientation changes
  window.addEventListener('orientationchange', () => {
    // Wait for orientation change to complete
    setTimeout(applyAutoZoom, 100);
  });
  
  // Listen for resize events
  window.addEventListener('resize', () => {
    // Debounce resize events
    clearTimeout((window as any).resizeTimeout);
    (window as any).resizeTimeout = setTimeout(applyAutoZoom, 150);
  });
  
  // Listen for viewport changes (for browsers that support it)
  if ('visualViewport' in window) {
    (window as any).visualViewport.addEventListener('resize', applyAutoZoom);
  }
}

/**
 * Check if content overflows viewport
 */
export function checkContentOverflow(): boolean {
  const body = document.body;
  const html = document.documentElement;
  
  const bodyWidth = Math.max(
    body.scrollWidth,
    body.offsetWidth,
    html.clientWidth,
    html.scrollWidth,
    html.offsetWidth
  );
  
  const viewportWidth = window.innerWidth;
  
  return bodyWidth > viewportWidth;
}

/**
 * Auto-fit content to prevent horizontal scrolling
 */
export function autoFitContent(): void {
  if (checkContentOverflow()) {
    // Apply CSS to prevent overflow
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    
    // Add a class to indicate overflow prevention
    document.body.classList.add('overflow-prevented');
  }
}

/**
 * Initialize all mobile optimizations
 */
export function initMobileOptimizations(): void {
  // Initialize zoom handling
  initMobileZoom();
  
  // Auto-fit content
  autoFitContent();
  
  // Re-run on resize
  window.addEventListener('resize', () => {
    clearTimeout((window as any).resizeTimeout);
    (window as any).resizeTimeout = setTimeout(() => {
      autoFitContent();
    }, 150);
  });
}