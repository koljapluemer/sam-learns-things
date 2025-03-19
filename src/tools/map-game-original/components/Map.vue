<template>
  <div class="map-wrapper inset">
    <div class="challenge-wrapper mv2 fs2 flex flex-items-center">
      Click on
      <div class="challenge-country inset display p1 mh1">
        {{ targetCountryName }}
      </div>
    </div>

    <div ref="mapContainer" class="map-container">
      <svg id="map" ref="mapSvg" viewBox="0 0 1000 1000">
        <MapSVG />
      </svg>
    </div>

    <div class="feedback-wrapper flex gap mv2 flex-items-center">
      <div class="led" :style="{ backgroundColor: feedbackColor }"></div>
      <div class="feedback">{{ feedback }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useMapInteraction } from '../composables/useMapInteraction';
import type { Country } from '../types';
import MapSVG from './MapSVG.vue';
const props = defineProps<{
  targetCountryName: string;
  feedback: string;
  feedbackColor: string;
}>();

const emit = defineEmits<{
  (e: 'country-click', country: SVGPathElement): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
const mapSvg = ref<SVGElement | null>(null);
const { initializePanZoom, createSmallCountryCircle, createFinderCircle, isElementInViewport } = useMapInteraction();

onMounted(async () => {
  if (!mapSvg.value) return;

  // Load the SVG content
  const response = await fetch('/map_svg_extracted.svg');
  const svgContent = await response.text();
  mapSvg.value.innerHTML = svgContent;

  // Initialize pan/zoom
  initializePanZoom('#map');

  // Add click handler to the map
  mapSvg.value.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as SVGPathElement;
    if (target.tagName === 'path' && target.getAttribute('name')) {
      emit('country-click', target);
    }
  });
});
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
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
  z-index: -99;
  overflow: hidden;
  max-height: 100%;
  max-width: 100%;
}

.challenge-wrapper {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 999;
  background-color: #ebebeb;
  padding: 12px;
  border-radius: 12px;
}

.challenge-country {
  min-width: 200px;
}

.feedback-wrapper {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 999;
  background-color: #ebebeb;
  padding: 8px;
  border-radius: 12px;
}

.feedback {
  min-width: 300px;
}

.led {
  border-radius: 50%;
  min-height: 20px;
  height: 20px;
  min-width: 20px;
  width: 20px;
  background: #e0e0e0;
  box-shadow: inset 5px 5px 10px rgba(56, 56, 56, 0.4),
    inset -5px -5px 10px rgba(255, 255, 255, 0.4);
}
</style> 