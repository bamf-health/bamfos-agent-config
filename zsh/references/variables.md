# Variables

## typeset over declare

Use `typeset` for explicit variable declarations. It is the native zsh builtin; `declare` is a bash compatibility synonym.

| Use                | Avoid              |
| ------------------ | ------------------ |
| `typeset -i count` | `declare -i count` |

## Type flags

Use `typeset` flags for explicit typing.

| Flag | Purpose              | Example                            |
| ---- | -------------------- | ---------------------------------- |
| `-i` | Integer              | `typeset -i count=0`               |
| `-a` | Indexed array        | `typeset -a items=(one two three)` |
| `-A` | Associative array    | `typeset -A config=([key]=value)`  |
| `-r` | Read-only            | `typeset -r CONSTANT="value"`      |
| `-g` | Global (inside func) | `typeset -g GLOBAL_VAR="value"`    |
| `-x` | Export               | `typeset -x PATH`                  |

Flags combine: `typeset -ri MAX_RETRIES=3` creates a read-only integer.


## Arrays

Zsh arrays use 1-based indexing by default. This is a key difference from Bash.

```zsh
typeset -a fruits=(apple banana cherry)

echo "${fruits[1]}"      # "apple" (not fruits[0])
echo "${fruits[-1]}"     # "cherry" (negative indexing works)
echo "${#fruits[@]}"     # 3 (array length)
echo "${fruits[@]}"      # all elements
```

| Operation        | Syntax                     |
| ---------------- | -------------------------- |
| Access element   | `${array[1]}`              |
| All elements     | `${array[@]}`              |
| Length           | `${#array[@]}`             |
| Append           | `array+=(new_item)`        |
| Slice            | `${array[2,4]}`            |
| Delete element   | `array[2]=()`              |
| Check membership | `(( ${array[(Ie)item]} ))` |

## Associative arrays

Declare associative arrays with `typeset -A`.

```zsh
typeset -A config=(
  [host]="localhost"
  [port]="8080"
  [debug]="true"
)

echo "${config[host]}"           # "localhost"
echo "${(k)config}"              # all keys
echo "${(v)config}"              # all values
echo "${(kv)config}"             # keys and values interleaved
```

## Arrays over splitting

Use arrays instead of relying on word splitting for lists.

```zsh
# Use
files=("file one.txt" "file two.txt")
cp "${files[@]}" dest/

# Avoid
files="file one.txt file two.txt"
cp ${files} dest/
```

## Declaration and assignment

Separate `local` declaration from command substitution to preserve exit codes. `local` always returns 0, masking command failures.

| Use                         | Avoid              |
| --------------------------- | ------------------ |
| `local var`<br>`var=$(cmd)` | `local var=$(cmd)` |

---

## Constants

Declare constants with `readonly` or `typeset -r`.

| Use                      | Avoid           |
| ------------------------ | --------------- |
| `readonly MAX_RETRIES=3` | `MAX_RETRIES=3` |

## typeset implicit scoping

Variables created with `typeset` inside functions are automatically local (without needing the `-g` flag). This is a difference from Bash's `declare`.

```zsh
function example() {
  typeset counter=0    # automatically local
  typeset -g shared=0  # explicitly global
}
```

## Warn on accidental globals

Enable `WARN_CREATE_GLOBAL` to catch accidental global variable creation inside functions.

```zsh
setopt WARN_CREATE_GLOBAL
```

This helps find missing `local` declarations during development.
