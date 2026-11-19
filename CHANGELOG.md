## 0.1.2 — isUnique on scalar and enum fields, and uniqueKeysOf

A field-level `@unique` now sets `isUnique: true` on its scalar or enum field. Both Prisma readers
set it on every scalar and enum field. A key over several fields stays an `indexes` entry of kind
`unique` and marks none of its fields, the same split as `isId` and `@@id`.

`uniqueKeysOf(map, model)` returns every unique key of a model as its field names: the field-level
`@id` and `@unique` keys in map order, then each `@@id` and `@@unique` index. A field of a compound
`@@id` carries `isId` but is not a key on its own, so it appears only inside its index; reading
`isId` field by field gets that wrong.

Why: the template's factory contract test checks that every unique key a factory fills changes with
the sequence (a faker-only default collides by chance; it held a Zealot production deploy). It
needs every unique key of a model. The map recorded `@@unique` and not `@unique`, Prisma 7 ships no
runtime data model to read instead, and each consumer was stitching the keys together itself.

## 0.1.1 — modelOf / fieldOf over a literal map

Fix: over a literal map (`typeof prismaMap`, no index signature), `modelOf` and `fieldOf` typed
their result `{}`, because `M['models'][string]` doesn't index an object with known keys. They now
type it as the union of the map's models, and of their fields. Found moving template onto 0.1.0
(`Object.entries(modelOf(prismaMap, model)?.fields ?? {})`).

## 0.1.0 — the schema map in one package, with compile-time paths

Unreleased. Why: the map every building block reads was written twice (prisma-map's `PrismaMap`
and json-rules' `FieldMap`, "structurally compatible" by comment), every app cast between them
(`as unknown as FieldMap`), four app scripts finished prisma-map's output by hand, and four
converters read JSON Schema or OpenAPI into a map. Aron, 2026-11-18: one package, "with prisma-map
folded into it as the Prisma reader", plus typed paths. Plan: inixiative
`docs/plans/field-map-package.md`, after an adversarial review and a duplication audit.

- **The types**, from prisma-map and json-rules: `FieldMap` (`{ models, enums }`), `ModelEntry`,
  `ScalarField` / `EnumField` / `RelationField` (`FieldEntry`), indexes, annotations, defaults, the
  `DbIdentifier` / `DbValue` brands. Readonly throughout, so a generated `as const` map needs no
  cast; `FieldMapDraft` to build one in place. A scalar's `type` is a `ScalarType`.
- **The Prisma readers** (`@inixiative/field-map/prisma`): `readPrismaClientV7`,
  `readPrismaClientV6`, `readPrismaSchema` return `{ map, unsupportedColumns }`: sorted, enums
  registered, `@ignore` / `@@ignore` left out, `Unsupported(...)` columns apart, an unknown scalar
  type refused. Were prisma-map's `buildPrismaMapV7` / `V6`, which returned a bare `PrismaMap`.
- **`field-map generate`**: the CLI that replaces the apps' `generatePrismaMap.ts`, writing
  `fieldMapModuleSource` (`as const satisfies FieldMap`, its type, `unsupportedColumns`).
- **Readers**: `own`, `ownEntry`, `modelOf`, `fieldOf` (from json-rules), `fieldAtPath`,
  `relationTarget`, `relationTargetOf`; prisma-map's `getRelations` → `relationsOf` (`RelationInfo`
  gains `isRequired`; `relationName`, which held the field name, is `field`), `getColumns` →
  `columnsOf`, `pickColumns`, `relationForeignKey`, `tableName`, `columnName`, `storedValue`,
  `hasColumn`, `isScalarField`, `isEnumField`, `parseTagClasses`. All own-property only.
- **`fieldMapFromJsonSchema(schema, { model, document? })`**: json-rules #45's `lensFromJsonSchema`,
  returning the map, and resolving any local pointer (OpenAPI `#/components/schemas/…`) against
  `document`.
- **Path types**: `ModelNameOf`, `FieldNameOf`, `ScalarFieldNameOf`, `RelationFieldNameOf`,
  `RelationTargetOf`, `RelationPathTarget`, `IsToMany`, `ScalarPath`, `RelationPath`; `string` over
  a non-literal map. Held to a type budget in the check.
