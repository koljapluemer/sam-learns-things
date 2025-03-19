<template>
  <div class="controls">
    <div class="zoom-buttons">
      <button @click="$emit('zoom', 'world')" class="zoom-button">World</button>
      <button @click="$emit('zoom', 'africa')" class="zoom-button">Africa</button>
      <button @click="$emit('zoom', 'middleAmerica')" class="zoom-button">Central America</button>
      <button @click="$emit('zoom', 'mediterranean')" class="zoom-button">Mediterranean</button>
      <button @click="$emit('zoom', 'sea')" class="zoom-button">SEA</button>
      <button @click="$emit('zoom', 'oceania')" class="zoom-button">Oceania</button>
    </div>

    <div class="zoom-level-buttons">
      <button @click="$emit('zoom-in')" class="zoom-level-button">
        <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
          viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4.5v15m7.5-7.5h-15" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </button>
      <button @click="$emit('zoom-out')" class="zoom-level-button">
        <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
          viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.5 12h-15" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </button>
    </div>

    <div class="settings">
      <label class="toggle-switch">
        <input type="checkbox" :checked="includeTinyCountries" @change="handleTinyCountriesToggle">
        <span class="toggle-slider"></span>
        <span class="toggle-label">Include tiny countries</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const includeTinyCountries = ref(false);

const handleTinyCountriesToggle = (event: Event) => {
  const target = event.target as HTMLInputElement;
  includeTinyCountries.value = target.checked;
  emit('toggle-tiny-countries', target.checked);
};

const emit = defineEmits<{
  (e: 'zoom', position: string): void;
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'toggle-tiny-countries', value: boolean): void;
}>();
</script>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #e0e0e0;
  box-shadow: inset 2px 2px 2px #bebebe, inset -2px -2px 2px #ffffff;
  border-radius: 8px;
}

.zoom-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.zoom-button {
  padding: 8px;
  border: none;
  border-radius: 4px;
  background: #e0e0e0;
  box-shadow: 2px 2px 2px #bebebe, -2px -2px 2px #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zoom-button:hover {
  background: #d0d0d0;
  box-shadow: inset 2px 2px 2px #bebebe, inset -2px -2px 2px #ffffff;
}

.zoom-level-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.zoom-level-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #e0e0e0;
  box-shadow: 2px 2px 2px #bebebe, -2px -2px 2px #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.zoom-level-button:hover {
  background: #d0d0d0;
  box-shadow: inset 2px 2px 2px #bebebe, inset -2px -2px 2px #ffffff;
}

.icon {
  width: 24px;
  height: 24px;
}

.settings {
  display: flex;
  justify-content: center;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 40px;
  height: 20px;
  background: #e0e0e0;
  box-shadow: inset 2px 2px 2px #bebebe, inset -2px -2px 2px #ffffff;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.toggle-slider:before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 2px;
  top: 2px;
  background: #e0e0e0;
  box-shadow: 2px 2px 2px #bebebe, -2px -2px 2px #ffffff;
  border-radius: 50%;
  transition: all 0.2s ease;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
  background: #56b156;
}

.toggle-label {
  font-size: 14px;
  color: #666;
}

@media only screen and (max-width: 600px) {
  .zoom-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 