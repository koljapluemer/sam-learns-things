<template>
  <div class="map-wrapper inset">
    <div ref="mapContainer" class="map-container">
      <svg id="map" ref="mapSvg" viewBox="0 0 1000 1000">
        <!-- The SVG content will be loaded here -->
      </svg>
    </div>

    <div class="zoom-buttons flex justify-center gap">
      <div>Zoom To...</div>
      <button @click="zoomTo('world')">World</button>
      <button @click="zoomTo('africa')">Africa</button>
      <button @click="zoomTo('middleAmerica')">Central America</button>
      <button @click="zoomTo('mediterranean')">Mediterranean</button>
      <button @click="zoomTo('sea')">SEA</button>
      <button @click="zoomTo('oceania')">Oceania</button>
    </div>

    <div class="zoom-level-buttons flex justify-center gap">
      <button @click="zoomIn" aria-label="Zoom In">
        <svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" stroke-width="1.5"
          viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
            stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </button>
      <button @click="zoomOut" aria-label="Zoom Out">
        <svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" stroke-width="1.5"
          viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
            stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useMapInteraction } from '../composables/useMapInteraction';
import type { Country } from '../types';

const props = defineProps<{
  countries: Country[];
  targetCountry: SVGPathElement | null;
}>();

const emit = defineEmits<{
  (e: 'countryClick', country: SVGPathElement): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
const mapSvg = ref<SVGElement | null>(null);

const {
  panZoomInstance,
  smallCountryCircles,
  initializePanZoom,
  createSmallCountryCircle,
  createFinderCircle,
  zoomTo,
  isElementInViewport
} = useMapInteraction();

onMounted(async () => {
  if (!mapSvg.value) return;

  // Load the SVG content
  const response = await fetch('/map_svg_extracted.svg');
  const svgContent = await response.text();
  mapSvg.value.innerHTML = svgContent;

  // Initialize pan/zoom
  initializePanZoom('#map');

  // Create circles for small countries
  const allCountries = mapSvg.value.getElementsByTagName('path');
  for (let i = 0; i < allCountries.length; i++) {
    const country = allCountries[i];
    const smallCircle = createSmallCountryCircle(country, []);
    if (smallCircle) {
      mapSvg.value.appendChild(smallCircle);
      smallCountryCircles.value.push(smallCircle);
    }

    const finderCircle = createFinderCircle(country);
    if (finderCircle) {
      mapSvg.value.appendChild(finderCircle);
    }
  }

  // Add click handler
  mapSvg.value.addEventListener('click', handleMapClick);
});

onUnmounted(() => {
  if (mapSvg.value) {
    mapSvg.value.removeEventListener('click', handleMapClick);
  }
});

function handleMapClick(e: MouseEvent) {
  const target = e.target as SVGPathElement;
  if (target.getAttribute('name')) {
    emit('countryClick', target);
  }
}

function zoomIn() {
  if (panZoomInstance.value) {
    const currentZoom = panZoomInstance.value.getZoom();
    panZoomInstance.value.zoom(currentZoom + 0.2);
  }
}

function zoomOut() {
  if (panZoomInstance.value) {
    const currentZoom = panZoomInstance.value.getZoom();
    panZoomInstance.value.zoom(currentZoom - 0.2);
  }
}
</script>

<style scoped>
.map-wrapper {
  width: 90vw;
  height: 70vh;
  max-height: 70vh;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#map {
  width: 100%;
  height: 100%;
  z-index: -99;
  overflow: hidden;
  max-height: 100%;
  max-width: 100%;
}

.zoom-buttons {
  position: absolute;
  top: 10px;
  right: 10px;
  flex-direction: column;
}

.zoom-level-buttons {
  position: absolute;
  left: 10px;
  bottom: 10px;
  flex-direction: column;
}

button {
  border-radius: 8px;
  background: linear-gradient(145deg, #cacaca, #f0f0f0);
  box-shadow: 3px 3px 4px #d3d3d3, -2px -2px 4px #ededed;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

button:hover {
  background: linear-gradient(145deg, #cacaca, #f0f0f0);
  box-shadow: 5px 5px 5px #dedede, -5px -5px 5px #e2e2e2;
}

.icon {
  height: 18px;
  width: 18px;
  margin: auto;
}

.icon * {
  cursor: default;
}

.icon *:hover {
  fill: #ddd;
}
</style> 