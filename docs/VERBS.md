# Verbs

Every operation field-map performs has one verb, one public name per thing it applies to, and one
implementation. `test/verbs.test.ts` enforces it: every exported function of both entry points
(`@inixiative/field-map`, `@inixiative/field-map/prisma`) must appear in this file, and a
field-map record is read through `own` only.

## Public API: `@inixiative/field-map`

| Verb | Name | What it does |
| --- | --- | --- |
| read | `own` | An own property of a record; a name only `Object.prototype` has reads as absent. |
| read | `ownEntry` | An own entry of a record, created when absent, never one `Object.prototype` names. |
| read | `modelOf` | A model of a field map, own-property only. |
| read | `fieldOf` | A field of a model, own-property only. |
| read | `fieldAtPath` | The field a dotted path ends on, through to-one and to-many relations; undefined past a column. |
| read | `relationTarget` | The model a path of relations leads to; null when it doesn't end on a relation. |
| read | `relationTargetOf` | The model one relation field leads to; null for a column. |
| list | `relationsOf` | A model's relation fields as `RelationInfo` (field, target, list-ness, required-ness, foreign key, annotations). |
| list | `columnsOf` | A model's column fields (scalar and enum), in map order. |
| list | `uniqueKeysOf` | Every unique key of a model as its field names: field-level `@id` / `@unique`, then each `@@id` / `@@unique`. |
| pick | `pickColumns` | A row with only its model's column keys. |
| collapse | `relationForeignKey` | A relation's foreign-key columns as one lookup `Identifier`; null for a back-relation. |
| resolve a DB name | `tableName` | A model's table: `@@map`, else the model name, branded `DbIdentifier`. |
| resolve a DB name | `columnName` | A column: `@map`, else the field name, branded `DbIdentifier`. |
| resolve a DB name | `storedValue` | The value an enum member is stored as: its `@map`, else its name, branded `DbValue`. |
| narrow | `isScalarField` | Whether a field is a scalar. |
| narrow | `isEnumField` | Whether a field is an enum. |
| narrow | `hasColumn` | Whether a field has a column (scalar or enum). |
| narrow | `isScalarType` | Whether a type name is one of `SCALAR_TYPES`. |
| parse | `parseTagClasses` | The `@tagClass(key: value)` annotations in a `///` doc comment, grouped by tag class. |
| convert | `fieldMapFromJsonSchema` | A field map read from a JSON Schema (zod's `z.toJSONSchema`, or an OpenAPI component schema with its `document`). |
| write | `fieldMapModuleSource` | The text of a module holding a field map `as const satisfies FieldMap`, its type, and extra exports. |

Types: `FieldMap`, `FieldMapDraft` (and the generic `Draft`, the writable form of a readonly map type), `ModelEntry`, `FieldEntry`, `ScalarField`, `EnumField`,
`RelationField`, `IndexEntry`, `IndexKind`, `Annotations`, `AnnoValue`, `FieldDefault`,
`FieldDefaultValue`, `DbIdentifier`, `DbValue`, `Identifier`, `RelationInfo`, `ScalarType`
(and the const `SCALAR_TYPES`), `JsonSchema`, `JsonSchemaNode`, `FieldMapFromJsonSchemaOptions`,
`FieldMapModuleOptions`.

Path types (compile time; over a map typed only as `FieldMap`, each is `string`): `ModelNameOf`,
`FieldNameOf`, `ScalarFieldNameOf`, `RelationFieldNameOf`, `RelationTargetOf` (the type twin of
`relationTargetOf`), `RelationPathTarget`, `IsToMany`, `ScalarPath` (to a value, through to-one
relations and into Json), `RelationPath` (to a relation).

## Public API: `@inixiative/field-map/prisma`

| Verb | Name | What it does |
| --- | --- | --- |
| read | `readPrismaClientV7` | A field map from a Prisma v7 generated client, with its `Unsupported` columns apart. |
| read | `readPrismaClientV6` | A field map from a Prisma v6 generated client's `schema.prisma`, with its `Unsupported` columns apart. |
| read | `readPrismaSchema` | A field map from Prisma schema text. |

Type: `PrismaRead` (`{ map, unsupportedColumns }`).

## CLI

`field-map generate --client <dir> --out <file> [--layout v6|v7] [--export <name>]`: reads a
generated client and writes `fieldMapModuleSource` with `unsupportedColumns` beside the map.

## Internal verbs

| Verb | Only in | Note |
| --- | --- | --- |
| read a field-map record (own-property) | `src/own.ts` | everything else calls `own` / `modelOf` / `fieldOf` |
| finish a Prisma read (sort, enums, Unsupported, scalar check) | `src/prisma/read.ts` | `finishPrismaRead`, shared by both readers |
