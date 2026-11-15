# prisma-map glossary

**Every term prisma-map's region Wardens use, alphabetical, each with the region that holds it.**

<!-- Generated with the region Warden docs by the region pipeline's assemble.py. A term defined by two regions appears once per region. -->

---

## A

**annotations**  
Class tag and map property: the parsed tag bag on a model, field or index. *Region:* [Schema annotation DSL](annotations/knowledge.md)

**Annotations**  
Type { tagClass: { key: value } } holding parsed doc-comment tags. *Region:* [Schema annotation DSL](annotations/knowledge.md)

**AnnoValue**  
A tag value: boolean, number, string, or array of those. *Region:* [Schema annotation DSL](annotations/knowledge.md)

**auto-detection**  
With no path, walking up from process.cwd() through common client output directories; throws if none matches. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

## B

**back-relation**  
The relation side without FK fields (fromFields and toFields empty); its foreignKey is null. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**back-relation**  
The side of a relation without @relation(fields: …); empty fromFields/toFields. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**binding**  
A /// run attaches to the declaration directly below it; a blank line breaks it. *Region:* [Schema annotation DSL](annotations/knowledge.md)

**build-map**  
Class tag: getting a PrismaMap from a generated client with buildPrismaMapV7 / buildPrismaMapV6 and auto-detection. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**buildFromSchemaFile**  
./v6: build a PrismaMap from an exact v6 client directory, no auto-detection. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**buildPrismaMapV6**  
Root-entry builder for a Prisma 6 client; reads the client's schema.prisma; path optional. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**buildPrismaMapV7**  
Root-entry builder for a Prisma 7 client; reads internal/class.ts; path optional. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**bun run check**  
The package's full check: tsc, Biome and bun test. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

## C

**column field**  
A scalar or enum field, one with a database column. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**columnName**  
columnName(field, fieldName): a scalar or enum field's @map name if set, else the field name; rejects relation fields. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**columns**  
Class tag: listing a model's column fields and filtering rows to them. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**// comment**  
Plain comment; not parsed and breaks a /// binding. *Region:* [Schema annotation DSL](annotations/knowledge.md)

**Could not auto-detect Prisma v7/v6 generated client directory**  
The error thrown when auto-detection finds nothing; fix by passing the client path to the builder. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**custom attribute**  
A non-Prisma @attribute; Prisma rejects it, hence the doc-comment DSL. *Region:* [Schema annotation DSL](annotations/knowledge.md)

## D

**db-identifiers**  
Class tag: resolving Prisma names to database table, column and enum-value identifiers. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**@db.Text**  
Native DB type annotations; not emitted. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**DbIdentifier**  
Branded string type for a resolved table or column name. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**dbName**  
Sparse physical name on a ModelEntry (@@map) or scalar/enum field (@map); absent means the Prisma name is the DB name. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**dbName**  
Database name from @@map (model) or @map (scalar/enum field); null/absent means the Prisma name is used. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**DbValue**  
Branded string type for a resolved stored enum value. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**dev-workflow**  
Class tag: working on the package itself — bun run check and the tsup build. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**DMMF**  
Prisma's internal data model format; prisma-map never parses it. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**/// doc comment**  
Prisma comment kept in the generated client; the only place tags may be written. *Region:* [Schema annotation DSL](annotations/knowledge.md)

## E

**EnumField**  
A kind 'enum' field with ordered values and optional valueDbNames. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**EnumField**  
kind 'enum'; ordered values (Prisma member names), sparse valueDbNames. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

## F

**field-defaults**  
Class tag: a field's @default as a FieldDefault. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**FieldDefault**  
{ kind: 'literal', value } or { kind: 'generated', expression }. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**foreignKey**  
RelationInfo's collapsed FK; null on back-relations. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**fromFields**  
FK fields on this model for a relation field. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**fromFields / toFields**  
FK fields on this model / referenced fields on the target; empty arrays on back-relations. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

## G

**generated client**  
The directory Prisma generates (e.g. node_modules/.prisma/client); the only input prisma-map reads. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**generated default**  
now(), uuid(), autoincrement(), dbgenerated(...) or a Bytes value; never injected. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**getColumns**  
getColumns(map, modelName): column field names (scalar and enum) in schema order. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**getRelations**  
getRelations(map, modelName): RelationInfo[] for every relation field of the model. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

## H

**hasColumn**  
Type guard: true for scalar and enum fields, the kinds with a database column. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

## I

**Identifier**  
Collapsed FK: a bare field name for one same-named pair, else a { referencedField: localField } map. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**include**  
Prisma query option that nests related records in a row; pickColumns strips them. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**@@index / @@unique / @@id / @@fulltext**  
Index declarations that can carry annotations in IndexEntry.annotations. *Region:* [Schema annotation DSL](annotations/knowledge.md)

**IndexEntry**  
{ kind: index | unique | id | fulltext, fields, name?, annotations? }. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**@inixiative/prisma-map**  
Root entry: both builders, helpers, resolvers, parseTagClasses and the types; what app code imports. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**@inixiative/prisma-map/v6**  
Subpath adding parseSchemaText and buildFromSchemaFile. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**@inixiative/prisma-map/v7**  
Subpath adding the low-level v7 parsers, parseSchemaStructure and ModelStructure. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**inlineSchema**  
Schema text in the v7 client that keeps /// comments for parsing. *Region:* [Schema annotation DSL](annotations/knowledge.md)

**inlineSchema**  
The schema text embedded in a v7 client, parsed for modifiers, @map, @default, FKs, enums and annotations. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**internal/class.ts**  
Prisma 7 generated file holding runtimeDataModel and inlineSchema; its presence marks a v7 client. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**isEnumField**  
Type guard narrowing a ModelField to EnumField (kind 'enum'). *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**isList**  
True for to-many relation fields. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**isList / isRequired / isId**  
Field modifiers ([], absent ?, @id) recorded on fields. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**isScalarField**  
Type guard narrowing a ModelField to ScalarField (kind 'scalar'). *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

## K

**kind**  
Field discriminator: 'scalar', 'enum' or 'object' (relation). *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

## L

**literal default**  
A value stored as written: enum member, string, number, boolean, list, parsed Json, BigInt/Decimal as text. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

## M

**@@map**  
Prisma model attribute naming the database table; emitted as ModelEntry.dbName. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**@map**  
Prisma field or enum-member attribute naming the column or stored value; emitted as dbName or valueDbNames. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**map-shape**  
Class tag: what the map contains and how it is keyed. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**ModelEntry**  
{ dbName: string | null, fields, indexes?, annotations? } for one model. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**ModelField**  
Union of ScalarField, EnumField and RelationField discriminated by kind; narrow before resolving. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**ModelField**  
Union ScalarField | EnumField | RelationField, discriminated by kind. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**ModelStructure**  
Type returned per model by parseSchemaStructure (./v7). *Region:* [Schema annotation DSL](annotations/knowledge.md)

## P

**package-entries**  
Class tag: the root entry `.` vs the ./v7 and ./v6 subpaths and what each exports. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**parseEnumValues**  
./v7 low-level: each enum's ordered members and @map stored values from schema text. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**parseInlineSchema**  
./v7 low-level: return the schema text embedded in a v7 client. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**parseRelationFks**  
./v7 low-level: fields/references of every @relation in schema text; owning side only. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**parseRuntimeDataModel**  
./v7 low-level: load the runtimeDataModel object from a v7 client path. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**parseSchemaStructure**  
Low-level ./v7 parser: per-model doc-comment structure from schema text. *Region:* [Schema annotation DSL](annotations/knowledge.md)

**parseSchemaText**  
./v6: parse a Prisma schema string into a PrismaMap. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**parseTagClasses**  
Parse @tagClass(...) text into an Annotations object; undefined when none present. *Region:* [Schema annotation DSL](annotations/knowledge.md)

**pickColumns**  
pickColumns(map, modelName, row): the row with only column keys, included relations dropped. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**Prisma generator**  
A generator block in schema.prisma; prisma-map needs none. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**Prisma name**  
The schema-side name every PrismaMap key uses: map.User, fields.createdAt, enum values. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**Prisma name**  
The schema identifier; every key in the map uses it. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**PrismaMap**  
Record<modelName, ModelEntry>, keyed by Prisma model name. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

## R

**RelationField**  
A kind 'object' field; never carries dbName and has no column. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**RelationField**  
kind 'object'; relationName, fromFields, toFields; never a dbName. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**relationForeignKey**  
relationForeignKey(field): collapse one RelationField's fromFields/toFields into an Identifier or null. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**RelationInfo**  
{ relationName (the field name), targetModel, isList, foreignKey, annotations? }. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**relations**  
Class tag: walking a model's relation fields and their foreign keys. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**runtimeDataModel**  
The model/field/enum object embedded in a v7 client; lacks isList, isRequired, isId and attribute detail. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

## S

**ScalarField**  
A kind 'scalar' field carrying isId and optional dbName. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**ScalarField**  
kind 'scalar'; type, isRequired, isList, isId, optional dbName and default. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)

**schema-parsers**  
Class tag: the low-level ./v7 and ./v6 parsers the builders are composed from. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**schema.prisma (in the client)**  
The schema copy Prisma 6 places in its client directory; what buildPrismaMapV6 parses. *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

**silent fallback failure**  
A missed `?? name` produces valid SQL that matches no rows instead of erroring. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**storedValue**  
storedValue(enumField, member): the enum member's @map value if set, else the member name, as a DbValue. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**string-keyed**  
Helpers take plain model-name strings; wrap them with generated ModelName types for typing. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

## T

**tableName**  
tableName(model, modelName): the model's @@map name if set, else the model name, as a DbIdentifier. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**tag class**  
The @name in @name(key: value); several per line allowed. *Region:* [Schema annotation DSL](annotations/knowledge.md)

**@tagClass(key: value)**  
The DSL grammar written inside /// doc comments. *Region:* [Schema annotation DSL](annotations/knowledge.md)

**targetModel**  
The model a relation field points to. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**toFields**  
Referenced fields on the target model for a relation field. *Region:* [Columns and relation traversal](columns-and-relations/knowledge.md)

**tree.parent**  
Example tag on a self-relation; its meaning is set by the consumer (@inixiative/permissions). *Region:* [Schema annotation DSL](annotations/knowledge.md)

**tsup**  
Bundler that builds dist/ for the three entries (bun run build). *Region:* [Building the PrismaMap](building-the-map/knowledge.md)

## V

**valueDbNames**  
Sparse map on an EnumField from member name to its @map stored value. *Region:* [Prisma names to DB identifiers](db-identifiers/knowledge.md)

**valueDbNames**  
Sparse map of enum member to stored value from @map on members. *Region:* [PrismaMap shape and defaults](map-shape/knowledge.md)
