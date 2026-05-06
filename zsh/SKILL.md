---
name: zsh-style-guide
description: "Style, review, and refactoring standards for Zsh scripting. Trigger when `.zsh`, `.zshrc`, `.zprofile`, `.zshenv`, `.zlogin`, `.zlogout` files, files with `#!/usr/bin/env zsh` or `#!/bin/zsh`, or CI workflow blocks with `shell: zsh` are created, modified, or reviewed and Zsh-specific quality controls must be enforced. Additionally, trigger when creating or modifying zsh scripts in the `~/dotfiles` directory."
metadata:
  sources:
    - source_repo: https://github.com/KentoShimizu/sw-agent-skills/blob/main/skills/zsh-style-guide/
      license: Apache License 2.0
      license_url: https://github.com/KentoShimizu/sw-agent-skills/blob/main/LICENSE
    - source_repo: https://github.com/cboone/agent-harness-plugins/tree/main/plugins/write-zsh-scripts
      license: MIT License
      license_url: https://github.com/cboone/agent-harness-plugins/blob/main/LICENSE
---

# ZSH Style Guide

## Scope Boundaries
- Use this skill when the task matches the trigger condition described in `description`.
- Do not use this skill when the primary task falls outside this skill's domain.

Use this skill to write and review Zsh scripts that intentionally rely on Zsh behavior while staying safe and maintainable.

## Structure And Readability

- Use explicit Zsh shebang for executable scripts (`#!/usr/bin/env zsh`)
- Use strict mode for executable entrypoints.
- Keep functions small and orchestration in `main`.
- Call main function at end: `main "${@}"`
- Use `local` and typed variables where it improves safety.
- Keep comments short and focused on intent.

## Data Handling And Quoting

- Use arrays for argument safety.
- Avoid `eval` unless unavoidable and validated.
- Replace magic numbers with named constants including units.
- Validate external input before command execution.

## Error Handling And Safety

- Use explicit failure paths and non-zero return codes.
- Use trap-based cleanup for temporary resources.
- Avoid silent suppression patterns.
- Fail early for missing required configuration.
- Avoid exposing secrets in logs.
- Document manual verification steps when needed.
- Run `zsh -n path/to/script` for syntax checking

## Naming

- Functions: `snake_case`
- Local variables: `lower_case`
- Constants: `ALL_CAPS` with `readonly`
- Private/internal: `_underscore_prefix`

## Syntax

- Variable expansion: `${var}` not `$var`
- Command substitution: `$(...)` not backticks
- Tests: `[[ ]]` not `[ ]`
- Function syntax: `function name() { }` with both keyword and parentheses
- Arithmetic: `(( ))` for statements, `$(( ))` for expressions

### Quoting

- Always quote variable expansions: `"${var}"`
- Always quote command substitutions: `"$(cmd)"`
- Use arrays for lists, not word splitting
- Use `"${(@)array}"` to preserve elements in quoted context

### Variables and Scope

- See `./references/variables.md` for variable declaration and scope information.

### Expansion flags

Zsh supports parameter expansion flags in the `${(flags)var}` syntax. Use these instead of external commands.

| Flag     | Effect                            | Example                    |
| -------- | --------------------------------- | -------------------------- |
| `(L)`    | Lowercase                         | `${(L)str}`                |
| `(U)`    | Uppercase                         | `${(U)str}`                |
| `(C)`    | Capitalize words                  | `${(C)str}`                |
| `(s:d:)` | Split on delimiter                | `${(s:/:)path}`            |
| `(j:d:)` | Join with delimiter               | `${(j:,:)array}`           |
| `(u)`    | Remove duplicates                 | `${(u)array}`              |
| `(o)`    | Sort ascending                    | `${(o)array}`              |
| `(O)`    | Sort descending                   | `${(O)array}`              |
| `(q)`    | Shell-safe quoting                | `${(q)str}`                |
| `(Q)`    | Remove one level of quoting       | `${(Q)str}`                |
| `(P)`    | Treat value as parameter name     | `${(P)name}` (indirection) |
| `(z)`    | Lexical word splitting            | `${(z)cmdline}`            |
| `(@)`    | Preserve array elements in quotes | `"${(@)array}"`            |

### Extended globbing

Enable extended globbing for powerful pattern matching.

```zsh
setopt EXTENDED_GLOB
```

| Pattern          | Matches                                      |
| ---------------- | -------------------------------------------- |
| `**/*.zsh`       | Recursive match                              |
| `*.txt~README*`  | All `.txt` except those starting with README |
| `^*.log`         | Everything except `.log` files               |
| `file<1-10>.txt` | `file1.txt` through `file10.txt`             |
| `*(#i)readme*`   | Case-insensitive match                       |

### Glob qualifiers

Glob qualifiers filter matches by file attributes. Append them in parentheses after a glob pattern.

| Qualifier | Selects                          | Example                   |
| --------- | -------------------------------- | ------------------------- |
| `(.)`     | Regular files only               | `*(.)`                    |
| `(/)`     | Directories only                 | `*(/)`                    |
| `(@)`     | Symbolic links                   | `*(@)`                    |
| `(*)`     | Executable files                 | `*(*)`                    |
| `(m-N)`   | Modified within last N days      | `*(m-1)` (modified today) |
| `(om)`    | Sort by modification time        | `*(om)` (newest first)    |
| `(On)`    | Reverse sort by name             | `*(On)`                   |
| `(N)`     | Null glob (no error if no match) | `*.txt(N)`                |
| `(D)`     | Include dotfiles                 | `*(D)`                    |
| `([1])`   | First match only                 | `*(om[1])` (newest file)  |

Use `(N)` when a glob may match nothing, to avoid "no matches found" errors:

```zsh
for file in *.log(N); do
  process "${file}"
done
```

## Functions

### Function syntax

Use `function name() { }` with both the keyword and parentheses, matching the Bash style guide.

| Use                      | Avoid                  |
| ------------------------ | ---------------------- |
| `function my_func() { }` | `my_func() { }`        |
| `function my_func() { }` | `function my_func { }` |

### Argument declaration

Assign positional parameters to named local variables at the top.

```zsh
function process_file() {
  local input_file="${1}"
  local output_file="${2}"
  # ...
}
```

### Autoloading

Use `autoload -Uz` for functions that should be loaded on first use. The `-U` flag suppresses alias expansion during loading, and `-z` selects zsh-style autoloading semantics (as opposed to ksh-style).

```zsh
autoload -Uz my_function
```

### Anonymous functions

Anonymous functions execute immediately at the point of definition. Use them for one-time initialization that needs local scope.

```zsh
() {
  local temp_var="temporary"
  # initialization code
  # temp_var is not visible outside
}
```

Place autoloaded function files in a directory on `fpath`. Each file contains the function body without the surrounding `function name() { ... }` wrapper.

### Hook functions

Zsh provides built-in hook functions that run at specific points. Use `add-zsh-hook` to register them safely (avoids overwriting existing hooks).

```zsh
autoload -Uz add-zsh-hook

function _update_title() {
  print -Pn "\e]0;%~\a"
}
add-zsh-hook precmd _update_title
```

| Hook       | When it runs                        |
| ---------- | ----------------------------------- |
| `chpwd`    | After the working directory changes |
| `precmd`   | Before each prompt                  |
| `preexec`  | Before each command execution       |
| `periodic` | Every `PERIOD` seconds              |
| `zshexit`  | When the shell exits                |

## File extensions

Use `.zsh` for sourced library files, sourced configuration snippets, and plugin files. Use no extension for executable scripts.

| File type             | Extension | Example           |
| --------------------- | --------- | ----------------- |
| Executable script     | none      | `deploy-project`  |
| Library / plugin      | `.zsh`    | `git-helpers.zsh` |
| Completion            | none      | `_my-command`     |
| Configuration snippet | `.zsh`    | `aliases.zsh`     |

## Completions

For zsh completion function conventions, read `./references/completions.md`. Key points:

- Use `_description` for all group descriptions; never pass text directly to `compadd`
- Every `compadd` call must include `"${expl[@]}"`
- Make `curcontext` local in functions using `_arguments -C`
- Register tags before offering matches
- Return zero if matches were added, non-zero otherwise
