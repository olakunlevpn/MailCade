import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'inbox',
    component: () => import('@/views/InboxView.vue'),
  },
  {
    path: '/email/:id',
    name: 'email-detail',
    component: () => import('@/views/EmailDetailView.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
  },
]

const router = createRouter({
  // Use hash history for Electron
  history: createWebHashHistory(),
  routes,
})

export default router
