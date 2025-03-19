import { ref, computed } from 'vue';

export type MapGameRoute = 'play' | 'stats' | 'challenge' | 'countryStats';

interface RouteState {
  name: MapGameRoute;
  params?: Record<string, string>;
}

const currentRoute = ref<RouteState>({ name: 'play' });

export function useMapGameRouter() {
  const route = computed(() => currentRoute.value);

  function navigate(to: RouteState) {
    // Validate route name
    if (!['play', 'stats', 'challenge', 'countryStats'].includes(to.name)) {
      console.error(`Invalid route name: ${to.name}`);
      return;
    }

    // Update route state
    currentRoute.value = to;

    // Update URL hash without triggering browser navigation
    const hash = to.params 
      ? `#${to.name}/${Object.values(to.params).join('/')}`
      : `#${to.name}`;
    window.history.replaceState(null, '', hash);
  }

  // Initialize route from URL hash if present
  function initializeFromHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const [routeName, ...params] = hash.split('/');
    
    // Validate route name
    if (!['play', 'stats', 'challenge', 'countryStats'].includes(routeName)) {
      console.error(`Invalid route name in hash: ${routeName}`);
      return;
    }

    if (routeName === 'countryStats' && params.length > 0) {
      navigate({ name: 'countryStats', params: { country: params[0] } });
    } else {
      navigate({ name: routeName as MapGameRoute });
    }
  }

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    initializeFromHash();
  });

  return {
    route,
    navigate,
    initializeFromHash
  };
} 