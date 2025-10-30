<template>
  <div
    :class="[
      'p-4 border-b border-secondary-200 dark:border-secondary-700 cursor-pointer transition-colors',
      selected
        ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-l-primary'
        : 'hover:bg-secondary-50 dark:hover:bg-secondary-800',
      !email.Read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
    ]"
  >
    <div class="flex items-start justify-between mb-1">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <!-- Unread indicator dot -->
        <div
          v-if="!email.Read"
          class="w-2 h-2 rounded-full bg-primary flex-shrink-0"
          title="Unread"
        />
        <p :class="['truncate', !email.Read ? 'font-bold' : 'font-semibold']">
          {{ email.From.Name || email.From.Address }}
        </p>
      </div>
      <span class="text-xs text-secondary-500 ml-2 flex-shrink-0">
        {{ formatDate(email.Date) }}
      </span>
    </div>

    <p :class="['text-sm truncate mb-1', !email.Read ? 'font-bold' : 'font-medium']">
      {{ email.Subject || '(No subject)' }}
    </p>

    <p class="text-xs text-secondary-600 dark:text-secondary-400 truncate">
      {{ email.Text ? email.Text.substring(0, 100) : 'No preview available' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import type { Email } from '@/types/email.types'

interface Props {
  email: Email
  selected?: boolean
}

defineProps<Props>()

const formatDate = (dateString: string) => {
  try {
    if (!dateString) {
      return 'No date'
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      // Try parsing as ISO string
      const isoDate = new Date(dateString.replace(' ', 'T'))
      if (!isNaN(isoDate.getTime())) {
        return formatDistanceToNow(isoDate, { addSuffix: true })
      }
      return 'Just now'
    }
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (err) {
    console.error('Date parse error:', err, 'for date:', dateString)
    return 'Just now'
  }
}
</script>
