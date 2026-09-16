---
name: bamfjs
description: This guide is designed for AI agents working on projects that include `@bamf-health/bamfjs` as a dependency. Use this reference to quickly locate, import, and apply the appropriate utility functions instead of reinventing existing utilities.
---

# @bamf-health/bamfjs — AI Agent Integration Guide

## Quick Reference & Installation

- **Package Name**: `@bamf-health/bamfjs`
- **Module Format**: ES Modules only (v2.x+)
- **Registry**: GitHub Packages (`https://npm.pkg.github.com`)

### `.npmrc` Configuration

```ini
@bamf-health:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

### Import Conventions

Subpath imports using `.mjs` are preferred for optimal tree-shaking and explicit module boundaries:

```js
// Subpath import
import {debounce, delay} from '@bamf-health/bamfjs/timer.mjs';
import {deepCopy, getProperty, setProperty} from '@bamf-health/bamfjs/object.mjs';
import {$, $1, addClass, removeClass} from '@bamf-health/bamfjs/dom.mjs';

```


## Runtime Compatibility

| Module | Environment | Key Dependencies / Browser APIs |
| :--- | :--- | :--- |
| `ajax` | Browser | `XMLHttpRequest`, `DOMParser`, `fetch`, `FormData` |
| `array` | Universal (Browser + Node) | `Intl.Collator` (for `sort`), `Object.groupBy` (fallback included) |
| `color` | Universal (Browser + Node) | Pure math / string transformations |
| `cookie` | Browser | `document.cookie`, `location` |
| `dom` | Browser | `document`, `window`, `Node`, `Element`, `DOMParser` |
| `event` | Browser | `window`, `document`, `CustomEvent`, `addEventListener` |
| `form` | Browser | `FormData`, `HTMLFormElement`, `HTMLSelectElement` |
| `jsonp` | Browser | `document.createElement('script')`, `window` |
| `math` | Universal (Browser + Node) | Pure math |
| `object` | Universal (Browser + Node) | `structuredClone` (with circular-reference fallback) |
| `promise` | Universal (Browser + Node) | ES Promises, `async`/`await` |
| `selection` | Browser | `window.getSelection`, `document.selection`, input elements |
| `storage` | Browser | `window.localStorage`, `window.sessionStorage` |
| `string` | Universal (Browser + Node) | Pure string transformations, `btoa`/`atob` for base64 |
| `timer` | Universal / Browser | `setTimeout`, `requestAnimationFrame`, `requestIdleCallback` |
| `url` | Universal / Browser | String parsing with optional `window.location` fallback |

---

## Module Index & API Reference

### 1. `array` (`@bamf-health/bamfjs/array.mjs`)

  Utilities for array manipulation, filtering, sorting, and grouping.

```js
import {
  isArray, inArray, objectToArray, makeArray, randomItem,
  pluck, shuffle, merge, intersect, unique, diff,
  chunk, range, pad, sort, groupBy, groupByMap, arrayToMap
} from '@bamf-health/bamfjs/array.mjs';
```

  - **`isArray(arr)`** `⇒ boolean`: Tests if value is a true array.
  - **`inArray(el, arr)`** `⇒ boolean`: Checks whether element exists in array.
  - **`objectToArray(obj)`** `⇒ Array<{name: string, value: any}>`: Converts object `{foo: 'bar'}` to `[{name: 'foo', value: 'bar'}]`.
  - **`makeArray(value, [delimiter=/\s+/], [wrapObject=false])`** `⇒ Array`: Converts string (split by delimiter), object, or primitive into an array. Returns array directly; returns `[]` for `null`/`undefined`.
  - **`randomItem(arr)`** `⇒ any`: Returns a single random element from array.
  - **`pluck(arr, prop)`** `⇒ Array`: Extracts property values across array of objects (returns `null` for missing properties).
  - **`shuffle(arr)`** `⇒ Array`: In-place Fisher-Yates (Knuth) shuffle (mutates and returns `arr`).
  - **`merge(...arrays)`** `⇒ Array`: Combines 2+ arrays into a new array. (`collapse` is a deprecated alias).
  - **`intersect(array1, array2, [prop])`** `⇒ Array`: Returns elements in `array1` that also exist in `array2`. Compares objects deeply or by `prop` if provided.
  - **`unique(arr, [prop])`** `⇒ Array`: Returns deduplicated array. Compares primitives, deep objects, or by `prop`.
  - **`diff(array1, array2, [prop])`** `⇒ Array`: Returns elements in `array1` that do not exist in `array2`.
  - **`chunk(arr, n)`** `⇒ Array<Array>`: Splits array into chunks of size `n`.
  - **`range(a, [b], [step=1])`** `⇒ Array<number>`: Generates numeric array from `0` to `a - 1` (if `b` omitted) or from `a` to `b` (inclusive) with step.
  - **`pad(arr, size, value)`** `⇒ Array`: Mutates and pads array with `value` until reaching `size`.
  - **`sort(arr, [prop], [options])`** `⇒ Array`: Natural/locale-aware sort using `Intl.Collator` (`numeric: true`, `sensitivity: 'base'`, `locale: 'en-US'`). Sorts numbers before letters and handles object properties.
  - **`groupBy(arr, callbackOrProperty)`** `⇒ Object`: Groups array items into an object of arrays keyed by property name or callback function. Uses native `Object.groupBy` when available.
  - **`groupByMap(arr, callbackOrProperty)`** `⇒ Map`: Groups array items into a `Map` keyed by property name or callback function.
  - **`arrayToMap(arr, property)`** `⇒ Map`: Converts array of objects into a `Map` keyed by `item[property]`.

---

### 2. `object` (`@bamf-health/bamfjs/object.mjs`)

Deep operations, nested property navigation, comparison, and merging.

```js
import {
  isObject, isPlainObject, clone, deepCopy, isDeepEqual,
  extend, getProperty, getFirstValue, getLastDefined,
  isEmptyObject, setProperty, forEachValue, pick, omit
} from '@bamf-health/bamfjs/object.mjs';
```

- **`isObject(obj)`** `⇒ boolean`: Tests if value is a non-null object/array (excludes DOM nodes and `window`).
- **`isPlainObject(obj)`** `⇒ boolean`: Tests if value is a POJO (`{}` or `Object.create(null)`).
- **`deepCopy(obj, [forceFallback])`** `⇒ Object`: Deep copy supporting `Date`, `Set`, `Map`, `Array`, `RegExp`, and circular references. Uses `structuredClone` when available.
- **`clone(obj)`** `⇒ Object`: Graph-theory based deep clone avoiding circular references.
- **`isDeepEqual(objectA, objectB)`** `⇒ boolean`: Deep equality comparison supporting primitives, nested objects, arrays, Dates, RegExps, and functions.
- **`extend(target, ...objects)`** `⇒ Object`: Deep merge into `target` (mutates and returns `target`, similar to `jQuery.extend(true, ...)`).
- **`getProperty(root, properties, [defaultVal=null])`** `⇒ any`: Safe nested property access by dot-path (`'user.profile.name'`) or array `['user', 'profile', 'name']`.
- **`getFirstValue(obj, keys, [defaultValue])`** `⇒ any`: Returns the first non-null/defined value found for any of the given dot-paths in `keys`.
- **`getLastDefined(root, properties)`** `⇒ any`: Returns the value of the last property path in `properties` that has a defined value.
- **`isEmptyObject(obj)`** `⇒ boolean`: Returns `true` if object has no own keys or array has 0 length. Throws `TypeError` on non-objects.
- **`setProperty(root, properties, value)`** `⇒ Object`: Safely sets nested property using dot-path or array, creating intermediate objects as needed. Mutates and returns `root`.
- **`forEachValue(obj, fn)`** `⇒ void`: Loops over own keys, calling `fn(value, key)`.
- **`pick(obj, props, [options={deep: true}])`** `⇒ Object`: Returns new object with only specified keys.
- **`omit(obj, props, [options={deep: true}])`** `⇒ Object`: Returns new object excluding specified keys.

---

### 3. `timer` (`@bamf-health/bamfjs/timer.mjs`)

  Debouncing, throttling, frame synchronization, delays, and time constants.

```js
import {
  SECOND, MINUTE, HOUR, DAY, YEAR,
  debounce, unbounce, throttle, raf, idle, deadline, delay
} from '@bamf-health/bamfjs/timer.mjs';
```

  - **Time Constants**: `SECOND = 1000`, `MINUTE = 60000`, `HOUR = 3600000`, `DAY = 86400000`, `YEAR = 31536000000`.
  - **`debounce(fn, [timerDelay=200], [ctx])`** `⇒ Function`: Trailing-edge debounce (fires after calls stop).
  - **`unbounce(fn, [timerDelay=200], [ctx])`** `⇒ Function`: Leading-edge debounce (fires immediately on first call, ignores subsequent calls until delay passes).
  - **`throttle(fn, [timerDelay=200], [ctx])`** `⇒ Function`: Throttles execution rate to at most once per `timerDelay` ms.
  - **`raf(fn, [ctx])`** `⇒ Function`: Batches calls to execute before the next browser repaint via `requestAnimationFrame`.
  - **`idle(fn, [ctx])`** `⇒ Function`: Executes when UI thread is idle using `requestIdleCallback` (falls back to `raf`).
  - **`delay(timeout)`** `⇒ Promise<void>`: Promise-based sleep helper: `await delay(500)`.
  - **`deadline(promise, ms, [exception])`** `⇒ Promise<any>`: Rejects if `promise` does not resolve within `ms` milliseconds.

---

### 4. `string` (`@bamf-health/bamfjs/string.mjs`)

Casing, formatting, slugifying, encoding, and templating.

```js
import {
  changeCase, slugify, truncate, parseStringTemplate, stringTo,
  pluralize, rot13, hashCode, base64Encode, base64Decode,
  randomString, stripTags
} from '@bamf-health/bamfjs/string.mjs';
```

- **`changeCase(str, transforms, [options])`** `⇒ string`: Converts case.
  - Types: `'title'`, `'sentence'`, `'caps'`, `'camel'`, `'pascal'`, `'slug'`, `'snake'`, `'camelToSnake'`.
  - Can pass single type or array of steps: `changeCase('foo-bar', 'title', {unslugify: true})` or `changeCase('fooBar', ['camelToSnake', 'title'])`.
  - Options: `{preserve: ['iPad'], uppercase: ['USA'], unslugify: true, unsnake: true}`.
- **`slugify(str)`** `⇒ string`: Transliterates diacritics/currencies/symbols and returns a clean URL-safe slug (e.g. `'Hello, World!'` → `'hello-world'`).
- **`truncate(str, [options])`** `⇒ string`: Truncates with `options`: `{start: 10, end: 10, separator: '...'}`.
- **`parseStringTemplate(str, obj)`** `⇒ string`: Replaces `${key}` tokens with values from `obj`: `parseStringTemplate('/users/${id}', {id: 42})`.
- **`stringTo(value, [type], [options])`** `⇒ any`: Casts string to `Boolean`, `Number`, `Array`, or infers type automatically.
- **`pluralize(str, num, [ending='s'])`** `⇒ string`: Appends `ending` when `num !== 1`.
- **`hashCode(str, [prefix])`** `⇒ number|string`: Non-negative 32-bit integer hash code (or prefixed string).
- **`randomString([sep='.'], [prefix=''])`** `⇒ string`: Generates random alphanumeric ID with timestamp component.
- **`stripTags(str)`** `⇒ string`: Strips `<tags>` from HTML/XML string.
- **`base64Encode(str)`** / **`base64Decode(str)`** `⇒ string`: Base64 encoders with UTF-8 URL encoding safety.
- **`rot13(str)`** `⇒ string`: Caesar cipher by 13 places.

---

### 5. `promise` (`@bamf-health/bamfjs/promise.mjs`)

  Sequential/parallel async collection iterators and error handling.

```js
import {peach, pmap, pfilter, tryCatch} from '@bamf-health/bamfjs/promise.mjs';
```

  - **`peach(arr, async (item, i, arr) => ...)`** `⇒ Promise<Array>`: Sequential async `forEach`. Each item waits for previous promise to resolve before starting.
  - **`pmap(arr, async (item, i) => ..., [order='sequence'])`** `⇒ Promise<Array>`: Async map. Set `order: 'parallel'` for concurrent execution or `'sequence'` (default) for serial execution.
  - **`pfilter(arr, async (item, i) => ..., [order='sequence'])`** `⇒ Promise<Array>`: Async filter with `'sequence'` (default) or `'parallel'` ordering.
  - **`tryCatch(async () => ..., [rejectFn])`** `⇒ Promise<[error, result]>`: Go-style tuple error handler. Returns `[null, result]` on success, `[error]` on failure.

```js
const [err, data] = await tryCatch(() => fetchJson('/api/data'));

if (err) {
  console.error('Request failed:', err);
} else {
  console.log('Received:', data);
}
```

---

### 6. `math` (`@bamf-health/bamfjs/math.mjs`)

Array arithmetic, clamping, rounding, and statistics.

```js
import {
  add, subtract, multiply, divide, mod,
  randomInteger, average, median, min, max, clamp, round
} from '@bamf-health/bamfjs/math.mjs';
```

- **`add(numbersArray)`** `⇒ number`: Sum of array elements.
- **`subtract(numbersArray)`** `⇒ number`: Difference across array elements.
- **`multiply(numbersArray)`** `⇒ number`: Product of array elements.
- **`divide(numbersArray)`** `⇒ number`: Quotient across array elements.
- **`mod(dividend, divisor)`** `⇒ number`: Modulo (supports two args or single `[dividend, divisor]` array).
- **`randomInteger(min, max)`** `⇒ number`: Random integer between `min` and `max` inclusive.
- **`average(numbersArray)`** `⇒ number`: Arithmetic mean.
- **`median(numbersArray)`** `⇒ number`: Median value (handles odd/even lengths).
- **`min(numbersArray)`** / **`max(numbersArray)`** `⇒ number`: Minimum / maximum value in array.
- **`clamp(min, number, max)`** `⇒ number`: Clamps `number` between `min` and `max` (CSS clamp parameter order).
- **`round(number, [decimalPlaces=0], [direction='round'])`** `⇒ number`: Rounds to decimal places. `direction` can be `'round'`, `'floor'`, or `'ceil'`.



### 7. `color` (`@bamf-health/bamfjs/color.mjs`)

Color conversions, luminance, and contrast calculations.

```js
import {
  hex2Rgb, rgb2Hex, rgba2Hex, rgb2Luminance,
  getContrastColor, simpleContrast
} from '@bamf-health/bamfjs/color.mjs';
```

- **`hex2Rgb(hex, [alpha])`** `⇒ string`: Converts 3-, 4-, 6-, or 8-digit hex to `'rgb(r, g, b)'` or `'rgba(r, g, b, a)'`.
- **`rgb2Hex(rgb)`** `⇒ string`: Converts RGB string or `[r, g, b]` array to 6-digit hex `'#rrggbb'`.
- **`rgba2Hex(rgba)`** `⇒ string`: Converts RGBA string or `[r, g, b, a]` array to 8-digit hex `'#rrggbbaa'`.
- **`rgb2Luminance(rgb)`** `⇒ number`: Calculates WCAG relative luminance (0 to 1).
- **`getContrastColor(bgColor, [darkColor='#000'], [lightColor='#fff'])`** `⇒ string`: Returns `darkColor` if `bgColor` is light (luminance > 0.179), else `lightColor`.
- **`simpleContrast(bgColor, [darkColor='#000'], [lightColor='#fff'])`** `⇒ string`: Fast luminance contrast calculation.



### 8. `dom` (`@bamf-health/bamfjs/dom.mjs`)

DOM querying, manipulation, tree generation, and script loading.

```js
import {
  $, $1, toNodes, addClass, removeClass, toggleClass, replaceClass,
  getOffset, setStyles, setAttrs, getAttrs, toggleAttr,
  prepend, append, before, after, createTree, createHTML,
  sanitizeHtml, remove, empty, replace, loadScript
} from '@bamf-health/bamfjs/dom.mjs';
```

- **`$(selector, [context=document])`** `⇒ Array<Element>`: Returns array of elements matching selector within context.
- **`$1(selector, [context=document])`** `⇒ Element|null`: Returns first element matching selector.
- **`toNodes(element)`** `⇒ Array<Element>`: Normalizes selector string, Node, NodeList, or collection to an Array of DOM nodes.
- **`addClass(el, ...classNames)`** / **`removeClass(el, ...classNames)`** `⇒ string`: Adds/removes classes.
- **`toggleClass(el, className, [toggle])`** `⇒ string`: Toggles class (optional boolean flag).
- **`replaceClass(el, oldClass, newClass)`** `⇒ string`: Swaps one class for another.
- **`getOffset(el)`** `⇒ {top, left, scrollTop, scrollLeft}`: Calculates element position relative to document top/left.
- **`setStyles(el, stylesObject)`** `⇒ Element`: Sets inline styles.
- **`setAttrs(el, attrsObject)`** `⇒ Element`: Sets attributes, handling boolean attributes and class/for mappings.
- **`getAttrs(el, attrsArray)`** `⇒ Object`: Returns key-value object of requested attributes.
- **`toggleAttr(el, attribute, [toggle])`** `⇒ string|undefined`: Toggles boolean attribute.
- **`prepend(el, toInsert)`** / **`append(el, toInsert)`** `⇒ Element`: Inserts DOM element or HTML string as first / last child.
- **`before(el, toInsert)`** / **`after(el, toInsert)`** `⇒ Element`: Inserts element or HTML string as previous / next sibling.
- **`createTree({tag, text, children, ...attrs})`** `⇒ Element|DocumentFragment`: Creates DOM node hierarchy from nested descriptor object.
- **`createHTML({tag, text, attrs, children})`** `⇒ string`: Generates HTML string from descriptor object.
- **`sanitizeHtml(html, [options])`** `⇒ string`: Cleans HTML by stripping dangerous elements (`<script>`, `<iframe>`, `<object>`) and dangerous attributes (`on*`, `javascript:`, etc.).
- **`remove(el)`** `⇒ Element`: Removes element from DOM and cleans inline event handlers.
- **`empty(el)`** `⇒ Element`: Clears all children from element.
- **`replace(oldEl, replacement)`** `⇒ Element`: Replaces `oldEl` with element, array of elements, or text node.
- **`loadScript(options)`** `⇒ Promise`: Loads dynamic script (`{src, textContent, async, id, onDuplicateId, completeDelay}`).


### 9. `event` (`@bamf-health/bamfjs/event.mjs`)

Event listener management and custom event dispatching.

```js
import {addEvent, removeEvent, triggerEvent} from '@bamf-health/bamfjs/event.mjs';
```

- **`addEvent(el, type, handler, [options=false])`** `⇒ void`: Attaches event handler with automatic passive support on touch/wheel events, `once` support, and retroactive execution if listening for `window.load` after it already fired.
- **`removeEvent(el, type, handler, [options=false])`** `⇒ void`: Removes attached event listener.
- **`triggerEvent(el, type, [detail={}])`** `⇒ void`: Dispatches bubbling, cancelable `CustomEvent` with `detail` payload.



### 10. `form` (`@bamf-health/bamfjs/form.mjs`)

Form serialization and FormData utilities.

```js
import {getFormData, valuesToFormData} from '@bamf-health/bamfjs/form.mjs';
```

- **`getFormData(form, [type='object'])`** `⇒ any`: Extracts successful form controls.
  - Sub-methods:
    - `getFormData.object(form)` `⇒ Object` (key-value pairs, parses array fields like `meals[]`)
    - `getFormData.string(form)` `⇒ string` (URL query string)
    - `getFormData.formData(form)` `⇒ FormData`
    - `getFormData.array(form)` `⇒ Array<{name, value}>`
- **`valuesToFormData(values)`** `⇒ FormData`: Converts plain object or `{name, value}` array to a `FormData` instance. Handles `{files: [...]}` arrays seamlessly.



### 11. `storage` (`@bamf-health/bamfjs/storage.mjs`)

Namespaced, JSON-serialized web storage (`localStorage` and `sessionStorage`).

```js
import {Storage} from '@bamf-health/bamfjs/storage.mjs';

// Instantiate (defaults to 'local' storage with 'bamf' namespace)
const localStore = new Storage('local', 'myApp_');
const sessionStore = new Storage('session', 'myApp_');
```

- **`store.get(key)`** `⇒ any`: Retrieves and `JSON.parse`s item.
- **`store.set(key, value)`** `⇒ string`: Serializes item with `JSON.stringify` and saves.
- **`store.remove(key)`** `⇒ void`: Removes key.
- **`store.clear()`** `⇒ void`: Clears all items under this namespace only.
- **`store.getAll()`** `⇒ Object`: Returns all namespaced keys and parsed values as an object.
- **`store.keys()`** `⇒ Array<string>`: Returns array of un-prefixed keys.
- **`store.each((key, value) => ...)`** `⇒ void`: Iterates through items (return `false` to break).
- **`store.map((key, value) => ...)`** `⇒ Object`: Maps items into a new object.
- **`store.filter((key, value) => ...)`** `⇒ Object`: Filters items into a new object.
- **`store.toArray()`** `⇒ Array<Object>`: Converts stored objects into an array of objects with `.key` properties.
- **`store.merge([deep=false], key, value)`** `⇒ Object`: Merges object into existing stored object under `key`.



### 12. `url` (`@bamf-health/bamfjs/url.mjs`)

URL parsing, query serialization, and path segment extraction.

```js
import {
  pathname, basename, segments, segment, loc,
  hashSanitize, serialize, unserialize
} from '@bamf-health/bamfjs/url.mjs';
```

- **`pathname([obj=window.location])`** `⇒ string`: Returns normalized path (ensures leading `/`).
- **`basename([obj=window.location], [ext])`** `⇒ string`: Extracts filename/last segment, optionally stripping `ext`.
- **`segments([obj=window.location])`** `⇒ Array<string>`: Splits path into segment array.
- **`segment(index, [obj=window.location])`** `⇒ string`: Gets nth segment (supports negative index for reverse slicing).
- **`loc([el=window.location])`** `⇒ Object`: Parses URL string or location into `{pathname, basename, protocol, host, hostname, port, href, search, hash}`.
- **`hashSanitize(hash)`** `⇒ string`: Sanitizes hash fragments.
- **`serialize(data, [options])`** `⇒ string`: Serializes object/array to query string.
  - Options: `{raw: false, prefix: '', arrayToString: false, arrayBrackets: false, indexed: false}`.
- **`unserialize([string=location.search], [options])`** `⇒ Object`: Parses query string into structured object.
  - Handles nested brackets (`foo[bar]=baz`), array notation (`foo[]=1&foo[]=2`), and comma splitting (`splitValues: true`).



### 13. `ajax` (`@bamf-health/bamfjs/ajax.mjs`)

XHR-based request handling, JSON shortcuts, and partial HTML extraction.

```js
import {ajax, getJSON, postJSON, postFormData, fetchHTML} from '@bamf-health/bamfjs/ajax.mjs';
```

- **`ajax(url, [options])`** `⇒ Promise`: Core XHR request wrapper.
  - Options: `method` ('GET', 'POST', etc.), `dataType` ('json', 'html', 'xml', 'form', 'formData'), `data`, `cache`, `memcache`, `headers`, `form`.
- **`getJSON(url, [options])`** `⇒ Promise<any>`: Sends GET request expecting JSON response.
- **`postJSON(url, [options])`** `⇒ Promise<any>`: Sends POST request with JSON-serialized body and parsed JSON response.
- **`postFormData(url, [options])`** `⇒ Promise<any>`: Sends POST request with `FormData` extracted from `options.form`.
- **`fetchHTML(url, [selector])`** `⇒ Promise<string>`: Fetches HTML document using fetch API and DOMParser, returning either the full string or `innerHTML` matching `selector`.



### 14. `cookie` (`@bamf-health/bamfjs/cookie.mjs`)

Cookie management.

```js
import {getCookie, setCookie, removeCookie} from '@bamf-health/bamfjs/cookie.mjs';
```

- **`getCookie(name)`** `⇒ string|null`: Reads cookie by name.
- **`setCookie(name, value, [options])`** `⇒ string`: Sets cookie.
  - Options: `path` ('/'), `domain`, `expires` (in days), `maxAge` (in seconds), `samesite` ('strict'|'lax'), `secure` (boolean).
- **`removeCookie(name, [path])`** `⇒ void`: Deletes cookie (iterates all parent pathname segments if `path` is omitted).



### 15. `selection` (`@bamf-health/bamfjs/selection.mjs`)

Text selection and range manipulation for inputs, textareas, and contenteditable elements.

```js
import {
  getSelection, setSelection, setSelectionAll,
  replaceSelection, wrapSelection
} from '@bamf-health/bamfjs/selection.mjs';
```

- **`getSelection(el)`** `⇒ {start: number, end: number, length: number, text: string}`: Returns selection coordinates and selected text.
- **`setSelection(elem, [startPos=0], [endPos])`** `⇒ Element`: Sets cursor or selection range.
- **`setSelectionAll(el)`** `⇒ Element`: Selects all content inside element.
- **`replaceSelection(elem, replaceString)`** `⇒ Object`: Replaces selected text in element and preserves selection range.
- **`wrapSelection(elem, {before, after, [offset], [length]})`** `⇒ Object`: Wraps selected text with prefix/suffix strings.



### 16. `jsonp` (`@bamf-health/bamfjs/jsonp.mjs`)

Cross-domain JSONP script requester (legacy/fallback API).

```js
import {getJSONP} from '@bamf-health/bamfjs/jsonp.mjs';

getJSONP({url: 'https://example.com/api', data: {id: 123}}, (data) => {
  console.log(data);
});
```


## Common Recipes for AI Agents

### 1. Safe Deep Merging of Configuration Objects
```js
import {extend, deepCopy} from '@bamf-health/bamfjs/object.mjs';

const defaultConfig = {api: {timeout: 3000, headers: {'X-Custom': '1'}}};
const userConfig = {api: {timeout: 5000}};

// Approach 1: Deep merge into an empty object
const merged = extend({}, defaultConfig, userConfig);

// Approach 2: clone default first to avoid mutating it, then deep merge
const merged2 = extend(deepCopy(defaultConfig), userConfig);
```

### 2. Debouncing Search Input with Event Handling
```js
import {$1} from '@bamf-health/bamfjs/dom.mjs';
import {addEvent} from '@bamf-health/bamfjs/event.mjs';
import {debounce} from '@bamf-health/bamfjs/timer.mjs';

const searchInput = $1('#search');
const handleSearch = debounce((event) => {
  console.log('Searching for:', event.target.value);
}, 300);

addEvent(searchInput, 'input', handleSearch);
```

### 3. Sequential Async Tasks with Tuple Error Handling
```js
import {peach, tryCatch} from '@bamf-health/bamfjs/promise.mjs';

const userIds = [1, 2, 3, 4];

await peach(userIds, async(id) => {
  const [err, user] = await tryCatch(() => fetchUser(id));

  if (err) {
    console.warn(`Skipping user ${id} due to error:`, err);

    return;
  }

  processUser(user);
});
```

### 4. Query String Parsing and Building
```js
import {serialize, unserialize} from '@bamf-health/bamfjs/url.mjs';

const params = unserialize(window.location.search);
const nextUrl = `/search?${serialize({...params, page: 2})}`;
```


## Best Practices for Agents

1. **Prefer `bamfjs` over custom utility helpers**: Check this reference before writing custom debounce, deep copy, object-path traversal, query string serializers, or color converters.
2. **Import from subpaths**: Use `@bamf-health/bamfjs/<module>.mjs` to keep consumer bundles lightweight and imports clean.
3. **Be mindful of mutation**:
  - Mutating: `extend(target, ...)`, `shuffle(arr)`, `pad(arr, ...)`.
  - Immutable / Cloned: `deepCopy(obj)`, `pick(obj, ...)`, `omit(obj, ...)`, `merge(...arrays)`, `diff(a, b)`, `intersect(a, b)`.
4. **Respect environment constraints**: Do not invoke `dom`, `cookie`, `form`, `event`, or `selection` modules in Node.js / server-side execution contexts without appropriate DOM mocks (`jsdom`).
