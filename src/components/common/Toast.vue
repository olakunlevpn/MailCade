<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="visible"
        :class="[
          'fixed bottom-4 right-4 z-50 flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm',
          'bg-white dark:bg-secondary-800 border',
          typeClasses[type],
        ]"
      >
        <div class="flex-shrink-0">
          <component :is="iconComponent" class="w-5 h-5" />
        </div>
        
        <div class="flex-1 min-w-0">
          <p v-if="title" class="font-semibold text-sm">{{ title }}</p>
          <p class="text-sm text-secondary-600 dark:text-secondary-300">{{ message }}</p>
        </div>
        
        <button
          @click="close"
          class="flex-shrink-0 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
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
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Props {
  type?: ToastType
  title?: string
  message: string
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 5000,
})

const emit = defineEmits<{
  close: []
}>()

const visible = ref(false)

const typeClasses = {
  success: 'border-green-500 text-green-900 dark:text-green-100',
  error: 'border-red-500 text-red-900 dark:text-red-100',
  warning: 'border-amber-500 text-amber-900 dark:text-amber-100',
  info: 'border-primary text-secondary-900 dark:text-secondary-100',
}

const iconComponent = computed(() => {
  switch (props.type) {
    case 'success':
      return {
        template: `
          <svg class="text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
      }
    case 'error':
      return {
        template: `
          <svg class="text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
      }
    case 'warning':
      return {
        template: `
          <svg class="text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        `,
      }
    default:
      return {
        template: `
          <svg class="text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `,
      }
  }
})

const close = () => {
  visible.value = false
  setTimeout(() => emit('close'), 300)
}

onMounted(() => {
  visible.value = true
  
  if (props.duration > 0) {
    setTimeout(close, props.duration)
  }
})
</script>
