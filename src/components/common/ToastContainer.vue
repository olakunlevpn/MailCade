<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-50 space-y-2">
      <TransitionGroup
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm',
            'bg-white dark:bg-secondary-800 border',
            typeClasses[toast.type],
          ]"
        >
          <div class="flex-shrink-0">
            <component :is="getIcon(toast.type)" class="w-5 h-5" />
          </div>
          
          <div class="flex-1 min-w-0">
            <p v-if="toast.title" class="font-semibold text-sm mb-1">{{ toast.title }}</p>
            <p class="text-sm text-secondary-600 dark:text-secondary-300">{{ toast.message }}</p>
          </div>
          
          <button
            @click="remove(toast.id)"
            class="flex-shrink-0 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { useToast, type ToastType } from '@/composables/useToast'

const { toasts, remove } = useToast()

const typeClasses = {
  success: 'border-green-500 text-green-900 dark:text-green-100',
  error: 'border-red-500 text-red-900 dark:text-red-100',
  warning: 'border-amber-500 text-amber-900 dark:text-amber-100',
  info: 'border-primary text-secondary-900 dark:text-secondary-100',
}

const getIcon = (type: ToastType) => {
  const icons = {
    success: () => h('svg', {
      class: 'text-green-500',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      }),
    ]),
    error: () => h('svg', {
      class: 'text-red-500',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      }),
    ]),
    warning: () => h('svg', {
      class: 'text-amber-500',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      }),
    ]),
    info: () => h('svg', {
      class: 'text-primary',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      }),
    ]),
  }
  
  return icons[type]
}
</script>
