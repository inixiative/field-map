# field-map — Agent Guide

The schema map every inixiative building block reads. Rulings (Aron, 2026-11-18, plan
`~/code/inixiative/docs/plans/field-map-package.md`):

- **One map library.** The shape is the Prisma reader's output shape; there is no second shape. A
  source that isn't Prisma (JSON Schema, OpenAPI) is read into this shape, never given its own.
- **Readonly types, strict scalar types.** A generated `as const` map is a `FieldMap` with no cast.
  An optional flag means unknown; the readers set every one.
- **Own-property reads only**, through `src/own.ts` (`test/verbs.test.ts` enforces it).
- **The root entry is browser-safe.** Anything that touches `node:fs` lives under `src/prisma/`
  and ships as `@inixiative/field-map/prisma`. No runtime dependencies.
- **What stays in json-rules:** `FieldKind` (the kind a field compares as, with `Enum`), field-map
  validation (path grammar: no `.`, no `:`), bridges and `FieldMapSet`, projection and stitch output.
- Names follow the workspace rules: `fetch` for I/O, noun phrases for lookups, no new `get*`
  (`~/code/inixiative/docs/rules/naming-and-vocabulary.md`); every export has a row in
  `docs/VERBS.md`.

Verification: `bun run check` (typecheck with the type budget, biome, tests). Primitives get PRs for
Aron; releases go through the @inixiative/config train (on hold: publish individually).
