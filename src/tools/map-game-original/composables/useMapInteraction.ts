import { ref } from 'vue';
import type { PanZoomInstance, MapPosition } from '../types';

export const presetPositions = {
  world: { x: 0, y: 0, zoom: 1 },
  middleAmerica: { x: -200, y: 100, zoom: 2 },
  mediterranean: { x: 100, y: 50, zoom: 2 },
  sea: { x: 400, y: 100, zoom: 2 },
  africa: { x: 100, y: 200, zoom: 2 },
  oceania: { x: 600, y: 200, zoom: 2 }
} as const;

export function useMapInteraction() {
  const panZoomInstance = ref<PanZoomInstance | null>(null);
  const smallCountryCircles = ref<SVGCircleElement[]>([]);

  function initializePanZoom(mapElement: string): PanZoomInstance {
    // Initialize pan/zoom functionality
    // This is a placeholder - you'll need to implement the actual initialization
    return {
      getPan: () => ({ x: 0, y: 0 }),
      reset: () => {},
      resetZoom: () => {},
      resetPan: () => {},
      zoom: () => {},
      pan: () => {},
      zoomIn: () => {},
      zoomOut: () => {},
      destroy: () => {}
    };
  }

  function createSmallCountryCircle(country: SVGPathElement, excludeList: string[]): void {
    // Create a small circle for countries that are too small or in the exclude list
    // This is a placeholder - you'll need to implement the actual circle creation
  }

  function createFinderCircle(country: SVGPathElement): void {
    // Create a larger circle for countries based on their bounding box dimensions
    // This is a placeholder - you'll need to implement the actual circle creation
  }

  function zoomTo(position: keyof typeof presetPositions): void {
    if (!panZoomInstance.value) return;
    
    const { x, y, zoom } = presetPositions[position];
    panZoomInstance.value.reset();
    panZoomInstance.value.pan({ x, y });
    panZoomInstance.value.zoom(zoom);
  }

  function hideAllCircles(): void {
    smallCountryCircles.value.forEach(circle => {
      circle.style.display = 'none';
    });
  }

  function showAllCircles(): void {
    smallCountryCircles.value.forEach(circle => {
      circle.style.display = 'block';
    });
  }

  function isElementInViewport(el: SVGPathElement): boolean {
    if (!panZoomInstance.value) return false;
    
    const bbox = el.getBBox();
    const pan = panZoomInstance.value.getPan();
    const zoom = 1; // You'll need to get the actual zoom level
    
    // Check if the element is within the viewport
    return (
      bbox.x * zoom + pan.x >= 0 &&
      bbox.y * zoom + pan.y >= 0 &&
      (bbox.x + bbox.width) * zoom + pan.x <= window.innerWidth &&
      (bbox.y + bbox.height) * zoom + pan.y <= window.innerHeight
    );
  }

  return {
    panZoomInstance,
    initializePanZoom,
    createSmallCountryCircle,
    createFinderCircle,
    zoomTo,
    hideAllCircles,
    showAllCircles,
    isElementInViewport
  };
} 