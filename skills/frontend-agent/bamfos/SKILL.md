---
name: bamfos
description: Use this skill when working on the frontend of a BAMFOS application.
license: MIT
metadata:
  author: Karl Swedberg
  version: "1.0"
---

# BAMFOS Frontend

## BAMFOS Nuxt Layer

The BAMFOS Nuxt layer is a set of common components, composables, and utilities that are used across across many BAMFOS applications. Before creating a new component, composable, or utility, check if it already exists in the BAMFOS Nuxt layer. If it does, use it instead of creating a new one. To see if the BAMFOS Nuxt layer is a dependency of the current project, look for the `@bamf-health/bamfos-nuxt-layer` entry in `package.json`.

## BAMFJS

The BAMFJS library is a set of common JavaScript utilities that are used across across many BAMFOS applications. Before creating a new utility function, check if it already exists in the BAMFJS library. If it does, use it instead of creating a new one. To see if the BAMFJS library is a dependency of the current project, look for the `@bamf-health/bamfjs` entry in `package.json`.

## References

- [BAMFJS](references/bamfjs.md) - Contains specific information about the utilities available in the BAMFJS library
