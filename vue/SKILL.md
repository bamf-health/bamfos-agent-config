---
name: vue
description: Vue 3 Composition API, script setup macros, reactivity system, and built-in components. Use when writing Vue SFCs, importing or registering components, naming .vue files, defineProps/defineEmits/defineModel, watchers, or using Transition/Teleport/Suspense/KeepAlive.
metadata:
  author: Shkumbin Maksuti
  source: Generated from https://github.com/vuejs/docs, scripts at https://github.com/antfu/skills
---

# Vue

> Based on Vue 3.5. Always use Composition API with `<script setup>`.

## Preferences

- Prefer JavaScript over TypeScript
- Prefer `<script setup>` over `<script>` (omit `lang="ts"` unless the project already uses TypeScript)
- For performance, prefer `shallowRef` over `ref` if deep reactivity is not needed
- Always use Composition API over Options API
- Discourage using Reactive Props Destructure
- Use runtime `defineProps` / `defineEmits` / `defineModel` (object or array), not type-based macros
- Use kebab-case for `.vue` file names and for custom component tags in templates

## Component files, imports, and usage

Custom components use kebab-case on disk and in the template. The JavaScript import binding stays PascalCase.

| | Do | Don't |
|---|-----|--------|
| File | `my-component.vue` | `MyComponent.vue` |
| Import | `import MyComponent from './my-component.vue'` | `import MyComponent from './MyComponent.vue'` |
| Template | `<my-component />` | `<MyComponent />` |

```vue
<script setup>
import MyComponent from './my-component.vue'
</script>

<template>
  <my-component />
</template>
```

- Multi-word names: `user-profile-card.vue` → `import UserProfileCard from './user-profile-card.vue'` → `<user-profile-card />`
- Vue built-ins (`Transition`, `Teleport`, `Suspense`, `KeepAlive`) stay PascalCase in templates
- In Nuxt apps, auto-imported components still use kebab-case tags (`<user-profile-card />`); only add an import when the file is not auto-imported

## Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| Script Setup & Macros | `<script setup>`, defineProps, defineEmits, defineModel, defineExpose, defineOptions | [script-setup-macros](references/script-setup-macros.md) |
| Reactivity & Lifecycle | ref, shallowRef, computed, watch, watchEffect, effectScope, lifecycle hooks, composables | [core-new-apis](references/core-new-apis.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|-----------|
| Built-in Components & Directives | Transition, Teleport, Suspense, KeepAlive, v-memo, custom directives | [advanced-patterns](references/advanced-patterns.md) |

## Quick Reference

### Component Template

```vue
<script setup>
import { computed, onMounted, watch } from 'vue'
import StatusBadge from './status-badge.vue'

const props = defineProps({
  title: String,
  count: Number,
})

const emit = defineEmits(['update'])

const model = defineModel()

const doubled = computed(() => (props.count ?? 0) * 2)

watch(() => props.title, (newVal) => {
  console.log('Title changed:', newVal)
})

onMounted(() => {
  console.log('Component mounted')
})
</script>

<template>
  <div>{{ title }} - {{ doubled }}</div>
  <status-badge />
</template>
```

### Key Imports

```js
// Reactivity
import { ref, shallowRef, computed, reactive, readonly, toRef, toRefs, toValue } from 'vue'

// Watchers
import { watch, watchEffect, watchPostEffect, onWatcherCleanup } from 'vue'

// Lifecycle
import { onMounted, onUpdated, onUnmounted, onBeforeMount, onBeforeUpdate, onBeforeUnmount } from 'vue'

// Utilities
import { nextTick, defineComponent, defineAsyncComponent } from 'vue'
```
