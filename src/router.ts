import { createRouter, createWebHistory } from 'vue-router'
import Home from './Home.vue'
import ClozeGenerator from './modules/cloze-generator/ClozeGenerator.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/cloze-generator',
      name: 'cloze-generator',
      component: ClozeGenerator
    }
  ]
})

export default router 