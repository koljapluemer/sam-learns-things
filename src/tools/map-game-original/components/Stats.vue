<template>
  <div class="stats">
    <div class="gauge-wrapper" id="streak-wrapper">
      <div class="label">
        streak
        <div class="tooltip">
          <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          <div class="tooltiptext">One bar for every country you got right in a row.</div>
        </div>
      </div>
      <div class="streak-bars">
        <div v-for="i in globalStreak" :key="i" class="progress-bar-iterator"
          :style="{ width: `${Math.min(20, Math.max(3, 800 / globalStreak))}px` }"></div>
      </div>
    </div>

    <div class="gauge-wrapper" id="accuracy-wrapper">
      <div class="label">
        accuracy
        <div class="tooltip">
          <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          <div class="tooltiptext">The percentage of guesses you got right.</div>
        </div>
      </div>
      <div class="gauge">{{ accuracy }}%</div>
    </div>

    <div class="gauge-wrapper" id="units-wrapper">
      <div class="label">
        training units done
        <div class="tooltip">
          <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          <div class="tooltiptext">The number of guesses you made on this page.</div>
        </div>
      </div>
      <div class="gauge">{{ trainingUnits }}</div>
    </div>

    <div class="gauge-wrapper" id="due-wrapper">
      <div class="label">
        countries learned
        <div class="tooltip">
          <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          <div class="tooltiptext">The amount of countries that you're currently retaining, according to my Spaced Repetition algorithm (out of the max. nr. of 255)</div>
        </div>
      </div>
      <progress :max="255" :value="255 - dueCountries"></progress>
    </div>

    <div class="gauge-wrapper" id="units-this-session-wrapper">
      <div class="label">
        training units this session
        <div class="tooltip">
          <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          <div class="tooltiptext">The amount of guesses you made since loading the page.</div>
        </div>
      </div>
      <div class="gauge">{{ trainingUnitsThisSession }}</div>
    </div>

    <div class="gauge-wrapper" id="units-last-session-wrapper">
      <div class="label">
        training units last session
        <div class="tooltip">
          <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          <div class="tooltiptext">The amount of guesses you made in the session before your current page load.</div>
        </div>
      </div>
      <div class="gauge">{{ trainingUnitsLastSession }}</div>
    </div>

    <div class="gauge-wrapper" id="thinking-time-wrapper">
      <div class="label">
        average thinking time
        <div class="tooltip">
          <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          <div class="tooltiptext">The mean time you need between seeing a new country and clicking (for this session; every guess time is capped at 60s).</div>
        </div>
      </div>
      <div class="gauge">{{ averageThinkingTime }}s</div>
    </div>

    <div class="gauge-wrapper" id="hardest-country-wrapper">
      <div class="label">
        hardest country
        <div class="tooltip">
          <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          <div class="tooltiptext">The country which you most often placed incorrectly.</div>
        </div>
      </div>
      <div class="gauge">{{ hardestCountry || '-' }}</div>
    </div>

    <div class="gauge-wrapper" id="most-confused-wrapper">
      <div class="label">
        most confused
        <div class="tooltip">
          <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          <div class="tooltiptext">Your most common mix up.</div>
        </div>
      </div>
      <div class="flex gap flex-items-center">
        <div class="gauge small-gauge">{{ mostConfusedA || '-' }}</div>
        <div class="gauge small-gauge">&</div>
        <div class="gauge small-gauge">{{ mostConfusedB || '-' }}</div>
      </div>
    </div>

    <div class="gauge-wrapper" id="nemesis-wrapper">
      <div class="label">
        latest nemesis
        <div class="tooltip">
          <svg class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          <div class="tooltiptext">The country with the longest ongoing streak of incorrect guesses.</div>
        </div>
      </div>
      <div class="gauge">{{ nemesis || '-' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  globalStreak: number;
  accuracy: number;
  trainingUnits: number;
  dueCountries: number;
  trainingUnitsThisSession: number;
  trainingUnitsLastSession: string;
  averageThinkingTime: number;
  hardestCountry: string | null;
  mostConfusedA: string | null;
  mostConfusedB: string | null;
  nemesis: string | null;
}>();
</script>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(6, auto);
  grid-template-rows: auto;
  grid-template-areas:
    "a a a a a a"
    "b b b c c c"
    "d d d d d d"
    "e e f f g g"
    "h h i i j j";
  max-width: min(95vw, 1200px);
  margin: 0 auto;
  gap: 8px;
}

.gauge-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin: 20px 0;
  flex-direction: column;
  background: #e0e0e0;
  box-shadow: inset 2px 2px 2px #bebebe, inset -2px -2px 2px #ffffff;
  padding: 8px;
}

.label {
  background: linear-gradient(145deg, #cacaca, #f0f0f0);
  box-shadow: 2px 2px 2px #bebebe, -2px -2px 2px #ffffff;
  padding: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.gauge {
  border-radius: 20px;
  background: #e0e0e0;
  box-shadow: inset 6px 6px 7px #bebebe, inset -6px -6px 7px #ffffff;
  padding: 12px 20px;
  font-weight: bold;
  font-size: 22px;
}

.small-gauge {
  font-size: 14px;
  border-radius: 14px;
  padding: 8px 12px;
}

.progress-bar-iterator {
  box-shadow: inset 2px 2px 2px #bebebe, inset -2px -2px 2px #ffffff;
  min-height: 20px;
  height: 20px;
  min-width: 3px;
  width: 3px;
  background: #56b156;
}

.streak-bars {
  display: flex;
  flex-wrap: nowrap;
}

#streak-wrapper {
  grid-area: a;
}

#due-wrapper {
  grid-area: d;
}

#accuracy-wrapper {
  grid-area: b;
}

#units-wrapper {
  grid-area: c;
}

#units-this-session-wrapper {
  grid-area: e;
}

#units-last-session-wrapper {
  grid-area: f;
}

#thinking-time-wrapper {
  grid-area: g;
}

#hardest-country-wrapper {
  grid-area: i;
}

#most-confused-wrapper {
  grid-area: h;
}

#nemesis-wrapper {
  grid-area: j;
}

.tooltip {
  position: relative;
  display: flex;
  align-items: center;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 240px;
  background-color: black;
  color: #fff;
  text-align: center;
  padding: 12px;
  border-radius: 6px;
  margin-left: 24px;
  position: absolute;
  z-index: 1;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}

.icon {
  height: 18px;
  width: 18px;
  margin: auto;
}

@media only screen and (max-width: 600px) {
  .stats {
    display: flex;
    flex-direction: column;
    max-width: 95vw;
    margin: 0;
  }
}
</style> 