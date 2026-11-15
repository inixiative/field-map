# prisma-map, for its Wardens

prisma-map (`@inixiative/prisma-map`) is a small published Bun/TypeScript package. It reads the
Prisma client a project already generates and returns its models, fields, relations, foreign keys,
indexes, defaults and `///` annotations as one plain runtime object, the `PrismaMap`. It adds no
Prisma generator, never parses the DMMF, never connects to a database and never imports Prisma.
Most work here changes one of the existing parts; very little is new.

## Shape of the repository

- Three entries, built by tsup to `dist/`: `.` (`src/index.ts`: the builders, helpers, resolvers,
  `parseTagClasses` and the types), `./v7` and `./v6` (the low-level parsers). App code imports
  from the root.
- `src/`: `types.ts` (the map types), `identifiers.ts`, `columns.ts`, `relations.ts`,
  `annotations.ts`, `schemaText.ts` and `autoDetect.ts` (both internal), `v7/` (the builder over
  `internal/class.ts` and its parsers), `v6/` (the builder over `schema.prisma`, reusing v7's
  `@relation`, enum and structure parsers).
- `test/`: bun tests and a v7 fixture. `README.md` is the only doc.

## Systems other code depends on

- `buildPrismaMapV7(path?)` / `buildPrismaMapV6(path?)`: without a path they walk up from
  `process.cwd()` to find the generated client, and throw if there is none.
- The map is keyed by Prisma names. `dbName` and `valueDbNames` are the only database names and
  are sparse; `tableName`, `columnName` and `storedValue` resolve them to the branded
  `DbIdentifier` / `DbValue`, so nobody open-codes `dbName ?? name`.
- `getRelations` / `relationForeignKey` (what `@inixiative/permissions` walks) and `getColumns` /
  `pickColumns`.
- `FieldDefault`: `literal` (a value stored as written) or `generated` (`now()`, `uuid()`,
  `autoincrement()`, `dbgenerated(...)`, Bytes). The map reports defaults; generated ones are
  never injected.
- The `/// @tagClass(key: value)` DSL: recorded as `annotations`, never given a meaning here.

## Words used here

PrismaMap, model entry, field kind (scalar, enum, object), relation, back-relation, `fromFields` /
`toFields`, foreign key identifier, Prisma name vs DB name, branded identifier, column, field
default (literal, generated), annotation, tag class, index entry, generated client, v6, v7.
