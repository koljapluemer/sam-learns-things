<template>
  <div class="map-game">
    <div class="game-container">
      <div class="map-container" ref="mapContainer">
        <div class="map-wrapper" ref="mapWrapper">
          <svg id="map" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500">
            <MapSVG />
          </svg>
        </div>
      </div>

      <div class="game-ui">
        <div class="game-header">
          <h1>Map Game</h1>
          <p class="subtitle">Learn the world's countries by clicking on them!</p>
        </div>

        <div class="game-content">
          <div v-if="targetCountry" class="challenge">
            <p>Click on <strong>{{ targetCountry.name }}</strong></p>
          </div>

          <div v-if="feedback" class="feedback" :class="feedback.type">
            {{ feedback.message }}
          </div>

          <div class="game-stats">
            <Stats
              :global-streak="stats.globalStreak"
              :accuracy="accuracy"
              :training-units="stats.trainingUnits"
              :due-countries="dueCountries"
              :training-units-this-session="stats.trainingUnitsThisSession"
              :training-units-last-session="stats.trainingUnitsLastSession"
              :average-thinking-time="stats.averageThinkingTime"
              :hardest-country="stats.hardestCountry"
              :most-confused-a="stats.mostConfusedA"
              :most-confused-b="stats.mostConfusedB"
              :nemesis="stats.nemesis"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="controls-container">
      <Controls
        @zoom="handleZoom"
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @toggle-tiny-countries="handleTinyCountriesToggle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameState } from './composables/useGameState';
import { useMapInteraction } from './composables/useMapInteraction';
import Stats from './components/Stats.vue';
import Controls from './components/Controls.vue';
import MapSVG from './components/MapSVG.vue';
import type { PanZoomInstance, MapPosition } from './types';
import { presetPositions } from './composables/useMapInteraction';

const mapContainer = ref<HTMLElement | null>(null);
const mapWrapper = ref<HTMLElement | null>(null);

const {
  countries,
  targetCountry,
  feedback,
  waitingForClick,
  includeTinyCountries,
  stats,
  accuracy,
  dueCountries,
  handleGuess,
  pickRandomChallenge,
  loadFromStorage,
  saveToStorage
} = useGameState();

const {
  initializePanZoom,
  createSmallCountryCircle,
  createFinderCircle,
  zoomTo,
  hideAllCircles,
  showAllCircles,
  isElementInViewport
} = useMapInteraction();

let panZoomInstance: PanZoomInstance | null = null;

onMounted(async () => {
  // Initialize the game
  loadFromStorage();
  pickRandomChallenge();

  // Initialize map interactions
  if (mapContainer.value) {
    panZoomInstance = initializePanZoom('#map');
    
    // Create circles for small countries
    const paths = document.querySelectorAll('#countries path');
    paths.forEach((path) => {
      createSmallCountryCircle(path as SVGPathElement, []);
    });
  }

  // Add click handlers to countries
  document.querySelectorAll('#countries path').forEach((path) => {
    path.addEventListener('click', handleCountryClick);
  });
});

onUnmounted(() => {
  // Clean up
  document.querySelectorAll('#countries path').forEach((path) => {
    path.removeEventListener('click', handleCountryClick);
  });
  if (panZoomInstance) {
    panZoomInstance.destroy();
  }
  saveToStorage();
});

const handleCountryClick = (event: Event) => {
  const path = event.target as SVGPathElement;
  const countryName = path.getAttribute('data-name');
  if (countryName && waitingForClick.value) {
    handleGuess(countryName);
  }
};

const handleZoom = (position: keyof typeof presetPositions) => {
  zoomTo(position);
};

const handleZoomIn = () => {
  if (panZoomInstance) {
    panZoomInstance.zoomIn();
  }
};

const handleZoomOut = () => {
  if (panZoomInstance) {
    panZoomInstance.zoomOut();
  }
};

const handleTinyCountriesToggle = (value: boolean) => {
  includeTinyCountries.value = value;
};
</script>

<style scoped>
.map-game {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  height: 100vh;
  background: #f0f0f0;
}

.game-container {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.map-container {
  flex: 1;
  background: #e0e0e0;
  box-shadow: inset 2px 2px 2px #bebebe, inset -2px -2px 2px #ffffff;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.map-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#map {
  width: 100%;
  height: 100%;
}

#countries path {
  fill: #e0e0e0;
  stroke: #bebebe;
  stroke-width: 0.5;
  transition: fill 0.2s ease;
}

#countries path:hover {
  fill: #d0d0d0;
  cursor: pointer;
}

.game-ui {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #e0e0e0;
  box-shadow: inset 2px 2px 2px #bebebe, inset -2px -2px 2px #ffffff;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
}

.game-header {
  text-align: center;
}

.game-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #666;
}

.challenge {
  text-align: center;
  font-size: 18px;
  color: #333;
}

.feedback {
  text-align: center;
  padding: 8px;
  border-radius: 4px;
  font-weight: bold;
}

.feedback.correct {
  background: #56b156;
  color: white;
}

.feedback.incorrect {
  background: #ff6b6b;
  color: white;
}

.controls-container {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 100;
}

@media only screen and (max-width: 1024px) {
  .game-container {
    flex-direction: column;
  }

  .game-ui {
    width: 100%;
  }
}

@media only screen and (max-width: 600px) {
  .map-game {
    padding: 8px;
  }

  .game-header h1 {
    font-size: 20px;
  }

  .subtitle {
    font-size: 12px;
  }

  .challenge {
    font-size: 16px;
  }
}
</style>
