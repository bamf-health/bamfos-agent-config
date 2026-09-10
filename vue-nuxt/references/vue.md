# Vue API (Composition + `<script setup>`)

Nuxt auto-imports Vue APIs. Add `import {…} from 'vue'` only in a non-Nuxt app (or a file outside auto-import).

## Macros

```js
const props = defineProps({
  title: {type: String, default: null},
  count: {type: Number, default: 0},
  items: {type: Array, required: true},
});

const emit = defineEmits(['update', 'close']);
// or validators: defineEmits({update: (v) => typeof v === 'string', close: null})

const model = defineModel();
const count = defineModel('count', {default: 0});

defineExpose({reset});
defineOptions({inheritAttrs: false, name: 'CustomName'});
```

- Do not use `defineProps<{…}>()` / `defineEmits<{…}>()` in JS SFCs.
- Do not destructure `defineProps` (including Vue 3.5 reactive destructure).
- Skip `defineSlots` in JavaScript; declare slots in the template.

```vue
<template>
  <slot name="header" :title="title" />
  <slot :item="item" :index="index" />
</template>
```

## Directives

Local directives: name the binding `vFocus` (or import as `vMyDirective`).

```js
const vFocus = {mounted: (el) => el.focus()};
```

Top-level `await` in `<script setup>` makes the component async. **Nuxt already wraps pages in Suspense** — do not add `<Suspense>` around page content unless you have a nested async boundary you must control.

## Reactivity

```js
const user = ref({name: 'A', profile: {age: 30}});
user.value.profile.age = 31; // tracked

const data = shallowRef({items: []});
data.value.items.push('x'); // not tracked
data.value = {items: ['x']}; // tracked
```

- Prefer `shallowRef` for large or replace-as-a-whole data.
- `computed(() => …)` read-only; `{get, set}` when writable.
- `reactive()` drops reactivity if destructured — use `ref` / `toRefs` / `toValue`.

```js
watch(count, (n, o) => {});
watch(() => props.id, (id) => fetchData(id), {immediate: true});
watch([a, b], ([x, y]) => {});
watch(state, cb, {deep: 2}); // Vue 3.5+ depth
watch(source, cb, {once: true});
watch(source, cb, {flush: 'post'}); // DOM already updated
```

```js
watchEffect(async() => {
  const controller = new AbortController();
  onWatcherCleanup(() => controller.abort());
  data.value = await fetch(`/api/${id.value}`, {signal: controller.signal}).then((r) => r.json());
});
const {pause, resume, stop} = watchEffect(() => {});
```

Lifecycle (cleanup side effects in `onUnmounted`): `onBeforeMount`, `onMounted`, `onBeforeUpdate`, `onUpdated`, `onBeforeUnmount`, `onUnmounted`, `onErrorCaptured`, `onActivated` / `onDeactivated` (KeepAlive), `onServerPrefetch` (SSR).

`effectScope` + `onScopeDispose` only when you need to dispose a bundle of effects at once.

## Composables

`use*` in `app/composables/` (Nuxt auto-imports). Accept refs/getters/plain values via `toValue()`. Always return a plain object of refs.

```js
export const useFetchUrl = (url) => {
  const data = shallowRef(null);
  const error = shallowRef(null);

  watchEffect(async() => {
    data.value = null;
    error.value = null;
    try {
      data.value = await fetch(toValue(url)).then((r) => r.json());
    } catch (err) {
      error.value = err;
    }
  });

  return {data, error};
};
```

In Nuxt, prefer `useFetch` / `useAsyncData` over a hand-rolled fetch composable.

## Built-ins

- `Transition` / `TransitionGroup` — `mode="out-in"` when swapping views; list children need unique `key`.
- `Teleport` — `to="body"` or a selector; `defer` if the target mounts later (Vue 3.5+).
- `KeepAlive` — `include` / `exclude` / `max`; pair with `onActivated` / `onDeactivated`.
- `v-memo="[deps]"` to skip list-item re-renders; `v-once` for never-again.
- Do not reach for experimental `<Suspense>` in Nuxt pages; Nuxt handles the page boundary.

```vue
<Teleport to="body">
  <div v-if="open" class="modal">…</div>
</Teleport>

<KeepAlive :max="10">
  <component :is="currentTab" />
</KeepAlive>
```
