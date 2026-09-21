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

## SSR best practices

See [./nuxt-ssr.md](./nuxt-ssr.md) for SSR best practices and avoiding common SSR pitfalls.

## Auto-imports

No need to import Vue APIs, `app/components/`, `app/composables/`, `app/utils/`, Pinia stores, or layer equivalents. The `server/` directory auto-imports Nitro/H3 and `server/utils`. Both `app/` and `server` auto-import `shared/utils`. Files in nested directories within composables and utils are NOT auto-imported.

Explicitly import third-party modules and anything Nuxt is not scanning.

## Data fetching

```js
const {data, pending, error, refresh} = await useFetch('/api/items', {
  query: {page},
});
```

Information information about data fetching is at [./nuxt-data-fetching.md](./nuxt-data-fetching.md).

`lazy-` prefix for below-fold components. Do not also wrap those in `defineAsyncComponent`. Use `v-once` / `v-memo` only when profiling shows extra work.
