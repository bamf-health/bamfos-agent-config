---
name: vue-nuxt
description: >-
  Nuxt (Vue 3) conventions: Composition API, script setup, auto-imports, SSR,
  Pinia, data fetching, routing, and Tailwind. Use when writing or debugging
  Vue SFCs or Nuxt apps (pages, components, composables, server/, layers).
license: MIT
metadata:
  author: Karl Swedberg
---

# Vue + Nuxt

Vue >= 3.5 + current Nuxt. **Nuxt is the default.** Plain Vue notes apply only when the project is not Nuxt.

Prefer JavaScript and JSDoc over TypeScript. Composition API + `<script setup>` only (no Options API, no `lang="ts"` unless the repo already uses TypeScript).

For JS style, load [javascript](../javascript/SKILL.md).
For FormKit, load [formkit](../formkit/SKILL.md).

## Non-negotiables

- **SFC order:** `<template>`, then `<script setup>`, then `<style>` if needed.
- **Names:** kebab-case files and template tags; PascalCase import bindings. Vue built-ins stay PascalCase (`Transition`, `Teleport`, `KeepAlive`).
- **Macros:** runtime `defineProps` / `defineEmits` / `defineModel` (object or array). No type-based macros. Do not destructure `defineProps`.
- **Props:** each prop has `type` and either `required` or `default`.
- **Reactivity:** `shallowRef` over `ref` when deep tracking is not needed. Return refs from composables (not `reactive` objects).
- **Auto-imports (Nuxt):** do not import Vue APIs, components, composables, or stores. Import a `.vue` file only when it is not auto-imported.
- **SSR:** components must be isomorphic. Branch with `import.meta.client` / `import.meta.server`. Use `<client-only>` for client-only template trees.

```vue
<template>
  <user-profile-card />
  <Transition name="fade">
    <p v-if="ok">ok</p>
  </Transition>
</template>

<script setup>
const ok = shallowRef(true);
</script>
```

| | Do | Don't |
| File | `user-profile-card.vue` | `UserProfileCard.vue` |
| Import | `import UserProfileCard from './user-profile-card.vue'` | import from `UserProfileCard.vue` |
| Template | `<user-profile-card />` | `<UserProfileCard />` |

## Nuxt layout

Follow [Nuxt directory structure](https://nuxt.com/docs/4.x/directory-structure). Typical app paths: `app/pages/`, `app/components/`, `app/composables/`, `app/middleware/`. Pinia stores by domain. Shared app and server helpers go in `shared/utils/` (auto-imported both sides). Layers’ components/composables/utils are auto-imported too.

- File-based routes in `app/pages/`.
- Extract reusable logic into `app/composables/` (`use*` names). VueUse first for common utilities.
- Global state: Pinia `defineStore` using state, getters, and actions — with actions owning async work; local state: `ref` / `shallowRef` / `computed`.
- `provide`/`inject` only for deep trees that props cannot cover.
- Lazy-load off-critical UI with the `lazy-` component prefix (or `defineAsyncComponent` when auto-import does not apply).
- ESLint: `@nuxt/eslint` + `eslint-config-kswedberg/flat/nuxt.mjs`.

## Data, routing, errors

- **Fetch** with `useFetch` / `useAsyncData` / `$fetch`, or the project’s `$fetch` wrapper. Handle pending/error/data. Cancel or ignore stale results on unmount or param change.
- **Navigate** with `navigateTo` (not `$router.push`). Use `useRoute` / `useRouter` when you need the objects. Route guards live in `app/middleware/`. Use `useRouteQuery` when the project provides it.
- **Forms**: FormKit when the project has it. Errors/warnings: `b-banners` + `useBanner` when present.
- **Tests**: Vitest via `@nuxt/test-utils`; e2e with Playwright when the repo already uses it. Test behavior, not implementation.

## Tailwind

If the project uses Tailwind, utilities in the template are the default. `<style>` only for what utilities handle poorly (keyframes, odd selectors, scrollbars, dynamic CSS variables). Details and the `@reference` Vite plugin: [references/tailwind.md](references/tailwind.md).

## Load as needed

- [references/vue.md](references/vue.md) — macros, reactivity, watchers, composables, built-ins
- [references/nuxt.md](references/nuxt.md) — SSR gating, auto-imports, `useFetch` / `useAsyncData`
- [references/tailwind.md](references/tailwind.md) — Tailwind v4 in Nuxt
