---
name: script-setup-macros
description: Vue 3 script setup syntax and compiler macros for defining props, emits, models, and more
---

# Script Setup & Macros

`<script setup>` is the recommended syntax for Vue SFCs with Composition API. It provides better runtime performance and IDE type inference.

## Basic Syntax

```vue
<script setup>
// Top-level bindings are exposed to template
// In a Nuxt project, Vue functions, components, etc. are auto-imported.
import {ref} from 'vue'
import MyComponent from './my-component.vue'

const count = ref(0)
const increment = () => count.value++
</script>

<template>
  <button @click="increment">{{ count }}</button>
  <my-component />
</template>
```

## defineProps

Declare component props with a runtime object. Use `type` property and either `required` or `default` property to define the type of the prop.

```js
const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  count: {
    type: Number,
    default: 0,
  },
  items: {
    type: Array,
    required: true,
  },
});

// With defaults (Vue 3.5+)
const {title, count = 0} = defineProps({
  title: String,
  count: Number,
});
```

Type-based `defineProps<{ ... }>()` is a TypeScript alternative; do not use it in JavaScript SFCs.

## defineEmits

Declare emitted events with an array of names, or an object for validation.

```js
// Array syntax
const emit = defineEmits(['update', 'change', 'close']);

emit('update', 'new value');
emit('change', 1, 'name');
emit('close');
```

```js
// Object syntax with validators
const emit = defineEmits({
  update: (value) => typeof value === 'string',
  change: (id, name) => typeof id === 'number',
  close: null, // no validation
});

emit('update', 'new value');
emit('change', 1, 'name');
emit('close');
```

Type-based `defineEmits<{ update: [value: string] }>()` is TypeScript-only.

## defineModel

Two-way binding prop consumed via `v-model`. Available in Vue 3.4+.

```js
// Basic usage - creates "modelValue" prop
const model = defineModel();
model.value = 'hello';  // Emits "update:modelValue"

// Named model - consumed via v-model:name
const count = defineModel('count', { default: 0 });

// With modifiers
const [value, modifiers] = defineModel();
if (modifiers.trim) {
  // Handle trim modifier
}

// With transformers
const [value, modifiers] = defineModel({
  get(val) { return val?.toLowerCase() },
  set(val) { return modifiers.trim ? val?.trim() : val },
});
```

Parent usage:
```vue
<child v-model="name" />
<child v-model:count="total" />
<child v-model.trim="text" />
```

## defineExpose

Explicitly expose properties to parent via template refs. Components are closed by default.

```js
import {ref} from 'vue';

const count = ref(0);
const reset = () => {
  count.value = 0;
};

defineExpose({
  count,
  reset,
});
```

Parent access:
```js
const childRef = ref(null);

childRef.value?.reset();
```

## defineOptions

Declare component options without a separate `<script>` block. Available in Vue 3.3+.

```js
defineOptions({
  inheritAttrs: false,
  name: 'CustomName',
});
```

## defineSlots

Primarily a TypeScript helper for slot prop types. In JavaScript, skip `defineSlots` and use named slots in the template as usual.

```vue
<template>
  <slot name="header" :title="title" />
  <slot :item="item" :index="index" />
</template>
```

## Local Custom Directives

Use `vNameOfDirective` naming convention.

```js
const vFocus = {
  mounted: (el) => el.focus(),
};

// Or import and rename
import {myDirective as vMyDirective} from './directives';
```

```vue
<template>
  <input v-focus />
</template>
```

## Top-level await

Use `await` directly in `<script setup>`. The component becomes async and must be used with `<Suspense>` (which Nuxt automatically provides).

```vue
<script setup>
const data = await fetch('/api/data').then(r => r.json());
</script>
```

<!--
Source references:
- https://vuejs.org/api/sfc-script-setup.html
-->
