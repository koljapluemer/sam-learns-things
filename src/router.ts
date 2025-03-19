import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import MapGameCircle from './tools/map-game-circle/MapGameCircle.vue'
import MapGameOriginal from './tools/map-game-original/MapGameOriginal.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: App
    },
    {
      path: '/map-game-circle',
      name: 'map-game-circle',
      component: MapGameCircle
    },
    {
      path: '/map-game-original',
      name: 'map-game-original',
      component: MapGameOriginal
    }
  ]
})

export default router 