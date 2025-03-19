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
    if (routeName === 'countryStats' && params.length > 0) {
      navigate({ name: 'countryStats', params: { country: params[0] } });
    } else if (['play', 'stats', 'challenge'].includes(routeName)) {
      navigate({ name: routeName as MapGameRoute });
    }
  }

  return {
    route,
    navigate,
    initializeFromHash
  };
} 