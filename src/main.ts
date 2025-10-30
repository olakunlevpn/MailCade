import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme.store'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

// Initialize theme (async to load from settings)
setTimeout(() => {
  try {
    const themeStore = useThemeStore()
    const initPromise = themeStore.initTheme()
    
    if (initPromise && typeof initPromise.catch === 'function') {
      initPromise.catch((err: Error) => {
        console.error('Failed to initialize theme:', err)
      })
    }
  } catch (err) {
    console.error('Failed to initialize theme store:', err)
  }
}, 100)
