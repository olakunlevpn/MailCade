<template>
  <div class="h-screen flex flex-col">
    <div class="p-4 border-b border-secondary-200 dark:border-secondary-700">
      <button
        @click="router.back()"
        class="px-4 py-2 text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary"
      >
        ← Back to Inbox
      </button>
    </div>
    <div class="flex-1 overflow-auto p-6">
      <EmailDetail />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import EmailDetail from '@/components/email/EmailDetail.vue'

const router = useRouter()
</script>
