# @inixiative/field-map

> One of the [inixiative](https://www.inixiative.com) building blocks. Stop rediscovering what you need to build. See [all the projects](https://github.com/inixiative).

The schema map every inixiative building block reads: your models, their fields, relations and
enums, keyed by Prisma name, as one plain serializable object with strict types. Read it from the
Prisma client you already generate, or from a JSON Schema (zod, OpenAPI) for data that has no
Prisma schema. Generate it as a module with literal types, and model names and field paths are
checked at compile time.

`@inixiative/json-rules` reads it as the map behind a lens, `@inixiative/permissions` walks
relations through it, and `@inixiative/rules-builder` builds pickers from it. It replaces
`@inixiative/prisma-map`, whose Prisma reader lives here now.

## Installation

```bash
bun add @inixiative/field-map
```

## Generate the map from your Prisma client

```bash
bunx field-map generate --client src/generated/client --out src/generated/prismaMap.gen.ts
```

Run it after `prisma generate` (template's `db:generate` does). It reads the generated client
(Prisma v7's `internal/class.ts`, or the `schema.prisma` Prisma v6 copies there; `--layout` picks one
when detection can't) and writes:

```ts
export const prismaMap = { models: { … }, enums: { … } } as const satisfies FieldMap;
export type PrismaMap = typeof prismaMap;
export const unsupportedColumns = { Account: ['search'] } as const;
```

Models, fields and enum members are sorted, so a regenerate with no schema change is no diff.
`@ignore` fields and `@@ignore` models are left out, as the client leaves them out.
`Unsupported(...)` columns, which the client can't select, are not fields: they are listed in
`unsupportedColumns` for the raw queries that read them.

In code: `readPrismaClientV7(dir?)`, `readPrismaClientV6(dir?)` and `readPrismaSchema(text)` from
`@inixiative/field-map/prisma` (Node only) return `{ map, unsupportedColumns }`.

## The shape

```ts
type FieldMap = {
  models: { [model: string]: ModelEntry };
  enums?: { [enumName: string]: readonly string[] };
};

type ModelEntry = {
  dbName?: string | null; // @@map
  fields: { [field: string]: ScalarField | EnumField | RelationField };
  indexes?: IndexEntry[]; // @@index / @@unique / @@id / @@fulltext
  annotations?: Annotations; // see Annotation DSL
};
```

```ts
{ kind: 'scalar', type: 'DateTime', isRequired: true, isList: false, isId: false, isUnique: false, dbName: 'created_at', default: { kind: 'generated', expression: 'now()' } }
{ kind: 'enum', type: 'Role', isRequired: true, isList: false, values: ['ADMIN', 'USER'], valueDbNames: { ADMIN: 'admin' } }
{ kind: 'object', type: 'User', isList: false, isRequired: true, relationName: 'PostToUser', fromFields: ['authorId'], toFields: ['id'] }
```

- A scalar's `type` is one of `SCALAR_TYPES`: `String`, `Boolean`, `Int`, `BigInt`, `Float`,
  `Decimal`, `DateTime`, `Json`, `Bytes`.
- Every type is readonly, so a generated `as const` map is a `FieldMap` with no cast. Code that
  builds a map in place uses `FieldMapDraft`.
- `isRequired`, `isList`, `isId`, `isUnique`, `dbName`, `fromFields`, `toFields`, `values` and `default` are
  optional: absent means unknown, as a hand-written map may leave them. The Prisma readers always
  set them. An enum field without `values` takes them from `enums[type]`.

## Compile-time paths

Over the generated map's type, names and paths are checked as you write them:

```ts
import type { ModelNameOf, ScalarPath, RelationPath } from '@inixiative/field-map';
import type { PrismaMap } from './generated/prismaMap.gen';

const model: ModelNameOf<PrismaMap> = 'OrganizationUser';
const value: ScalarPath<PrismaMap, 'OrganizationUser'> = 'organization.name'; // through a to-one relation
const json: ScalarPath<PrismaMap, 'AuditLog'> = 'changes.any.sub.path'; // into a Json column
const list: RelationPath<PrismaMap, 'OrganizationUser'> = 'tokens'; // what an array or aggregate rule names
// @ts-expect-error a path past a to-many relation reads no single row
const bad: ScalarPath<PrismaMap, 'OrganizationUser'> = 'tokens.name';
```

`ScalarPath` follows to-one relations up to a depth (default 3) and never passes a to-many relation,
as json-rules reads a field rule. Over a map typed only as `FieldMap`, every path type is `string`,
so code without a literal map is unchanged. Also: `FieldNameOf`, `ScalarFieldNameOf`,
`RelationFieldNameOf`, `RelationTargetOf`, `RelationPathTarget`, `IsToMany`. The check holds them to
a compile-time budget over a real 35-model map.

## Reading a map

Every read is own-property only: a model or field named `toString` never resolves from
`Object.prototype`.

```ts
import { modelOf, fieldOf, fieldAtPath, relationTarget, relationsOf, columnsOf, pickColumns, uniqueKeysOf } from '@inixiative/field-map';

fieldAtPath(prismaMap, 'OrganizationUser', 'organization.name'); // the ScalarField
relationTarget(prismaMap, 'OrganizationUser', 'user.organizationUsers'); // 'OrganizationUser'
relationsOf(prismaMap, 'Inquiry'); // [{ field, targetModel, isList, isRequired, foreignKey, annotations? }]
columnsOf(prismaMap, 'User'); // scalar and enum field names
uniqueKeysOf(prismaMap, 'User'); // one-field keys (@id, @unique) in map order, then each @@id / @@unique as its fields
pickColumns(prismaMap, 'User', row); // the row without included relations
```

`relationForeignKey(field)` collapses one relation's foreign key: a bare field name for one
same-named pair, a `{ referencedField: localField }` map otherwise, `null` for a back-relation.

## From a JSON Schema

```ts
import { fieldMapFromJsonSchema } from '@inixiative/field-map';

const events = fieldMapFromJsonSchema(z.toJSONSchema(EventEnvelope), { model: 'Event' });
const rewards = fieldMapFromJsonSchema(spec.components.schemas.Reward, { model: 'Reward', document: spec });
```

The root object is `model`; a nested object is the model `<parent>.<field>`; an array of objects is
a to-many relation. A `$ref` (`#/$defs/…`, `#/definitions/…`, or with `document` any local pointer
such as OpenAPI's `#/components/schemas/…`) is the model named after its key, built once, so a
reused or recursive reference is a relation to it. Strings, `date-time` strings, integers, numbers
and booleans are String / DateTime / Int / Float / Boolean; a string enum, `const` or union of string
literals is an enum, registered in `enums`. A nullable shape (`anyOf` with `null`, `type: [X,
'null']`, `nullable: true`) is X, not required. Records, unions of several shapes, `allOf` of
several members, tuples and anything untyped are Json, which a rule can still read into by path.

## Resolving DB identifiers

Every key in the map is the **Prisma** name. `dbName` / `valueDbNames` are the only crossings to
the physical database, and both are sparse: absent means the Prisma name is the DB identifier.
Resolve them rather than open-coding `?? name`; a missed fallback fails silently (an unmapped enum
member selects zero rows instead of erroring).

```ts
import { columnName, hasColumn, isEnumField, storedValue, tableName, type DbIdentifier, type DbValue } from '@inixiative/field-map';

const model = prismaMap.models.BrandMissions;
tableName(model, 'BrandMissions'); // '@@map' if set, else 'BrandMissions'
const createdAt = model.fields.createdAt;
if (hasColumn(createdAt)) columnName(createdAt, 'createdAt'); // 'created_at' via '@map'
const typeName = model.fields.typeName;
if (isEnumField(typeName)) storedValue(typeName, 'SOCIAL_POST'); // 'Social Post' via '@map' on the member
```

They return branded `DbIdentifier` / `DbValue`, so a SQL builder typed with the brands rejects a raw
Prisma name at compile time:

```ts
const eq = (column: DbIdentifier, value: DbValue) => `${column} = '${value}'`;
eq('missionTypeName', 'SOCIAL_POST'); // compile error
```

## Annotation DSL (`/// @tagClass(key: value)`)

Prisma rejects custom attributes but keeps `///` doc comments, in the v7 client's inline schema and
the `schema.prisma` v6 copies. The readers parse a small DSL out of them into `annotations`,
without assigning the tags any meaning.

```prisma
model Category {
  id       String     @id
  parentId String?
  /// @tree(parent: true)
  parent   Category?  @relation("tree", fields: [parentId], references: [id])
  children Category[] @relation("tree")

  /// @search(fuzzy: true)
  @@index([name])
}
```

```ts
prismaMap.models.Category.fields.parent.annotations; // { tree: { parent: true } }
prismaMap.models.Category.indexes; // [{ kind: 'index', fields: ['name'], annotations: { search: { fuzzy: true } } }]
```

- **Grammar:** `@<tagClass>(<key>: <value>, …)`; several tag classes per line.
- **Values:** `true`/`false` → boolean, numerics → number, `"quoted"`/bare words → string, `[a, b]` → array.
- **Placement:** a `///` run binds to the declaration directly below it: a model, a field, or an
  index. A blank line or a plain `//` breaks the binding.
- What a tag class means (`tree.parent`, `permissions.down`) is the consumer's to decide.

## Auto-detection

With no path, the readers walk up from `process.cwd()` through `node_modules/.prisma/client`,
`node_modules/@prisma/client`, `prisma/generated/client`, `src/generated/client`,
`src/generated/prisma` and `generated/client`. v7 needs `internal/class.ts`; v6 needs
`schema.prisma` without it.

## Notes and limits

- `@@map` is `ModelEntry.dbName`; `@map` on a column is the field's `dbName`; `@map` on enum
  members is the field's `valueDbNames`. Relation fields never carry `dbName`.
- Native type annotations (`@db.Text`) are not emitted.
- The verbs, one per operation, are in [`docs/VERBS.md`](docs/VERBS.md).

## Development

```bash
bun run check   # typecheck (with the type budget), lint, tests
bun run build
```

## License

MIT
