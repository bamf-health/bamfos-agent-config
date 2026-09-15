# Nuxt conventions

SSR is on. Gate browser-only work:

```js
if (import.meta.server) {/* server-only */}
if (import.meta.client) {/* browser-only */}
```

```vue
<client-only>
  <browser-widget />
</client-only>
```

## Auto-imports

No import for Vue APIs, `app/components/`, `app/composables/`, Pinia stores, `shared/utils/`, or layer equivalents. `server/` auto-imports Nitro/H3 and server utils. Import third-party modules and anything Nuxt is not scanning.

## Data fetching

```js
const {data, pending, error, refresh} = await useFetch('/api/items', {
  query: {page},
});
```

- `useFetch` when the URL is the cache key; `useAsyncData` when the key and fetcher are separate.
- Prefer the project `$fetch` wrapper when one exists.
- Surface pending and error in the UI. Ignore or abort stale requests when params change.

`lazy-` prefix for below-fold components. Do not also wrap those in `defineAsyncComponent`. Use `v-once` / `v-memo` only when profiling shows extra work.
