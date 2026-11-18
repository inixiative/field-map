// The schema map: models, their fields, relations and enums, keyed by Prisma name. Every type is
// readonly, so a generated `as const` map is a FieldMap with no cast; FieldMapDraft is the
// writable form for code that builds one in place.

declare const dbBrand: unique symbol;

/**
 * A physical DB identifier (table or column), resolved through `@@map`/`@map`.
 *
 * Branded so a SQL builder can accept ONLY resolved identifiers: a raw Prisma
 * field name is a `string` and will not satisfy it. Both surfaces are strings,
 * so without this the two are freely interchangeable and a mix-up produces
 * valid SQL that matches nothing. Produced by `tableName` / `columnName`.
 */
export type DbIdentifier = string & { readonly [dbBrand]: 'identifier' };

/**
 * A stored DB value for an enum member, resolved through `@map` on the member.
 * Branded for the same reason — `'SOCIAL_POST'` and `'Social Post'` are both
 * strings, and only one of them matches a row. Produced by `storedValue`.
 */
export type DbValue = string & { readonly [dbBrand]: 'value' };

// ─── Annotations (the `/// @tagClass(key: value)` DSL) ───────────────────────

export type AnnoValue = string | number | boolean | readonly (string | number | boolean)[];

/** Parsed annotations, grouped by tag class: `@tree(parent: true)` → `{ tree: { parent: true } }`.
 *  The map only records the bag; consumers decide what a tag class means. */
export type Annotations = { readonly [tagClass: string]: { readonly [key: string]: AnnoValue } };

// ─── Defaults ─────────────────────────────────────────────────────────────────

export type FieldDefaultValue =
  | string
  | number
  | boolean
  | null
  | readonly FieldDefaultValue[]
  | { readonly [key: string]: FieldDefaultValue };

/** `@default(...)`: a value stored as written, or an expression the database or Prisma evaluates
 *  (`now()`, `uuid()`, `autoincrement()`, `dbgenerated(...)`), never injected. */
export type FieldDefault =
  | { readonly kind: 'literal'; readonly value: FieldDefaultValue }
  | { readonly kind: 'generated'; readonly expression: string };

// ─── Fields ───────────────────────────────────────────────────────────────────

/** The scalar types a column holds, as Prisma names them. */
export const SCALAR_TYPES = [
  'String',
  'Boolean',
  'Int',
  'BigInt',
  'Float',
  'Decimal',
  'DateTime',
  'Json',
  'Bytes',
] as const;

export type ScalarType = (typeof SCALAR_TYPES)[number];

/** Whether a type name is one of the scalar types. */
export const isScalarType = (type: unknown): type is ScalarType =>
  typeof type === 'string' && (SCALAR_TYPES as readonly string[]).includes(type);

// `isRequired`, `isList`, `isId`, `dbName`, `fromFields`, `toFields` and `values` are optional:
// absent means unknown, as a hand-written map may leave them. The Prisma readers set them all.

export type ScalarField = {
  readonly kind: 'scalar';
  readonly type: ScalarType;
  readonly isRequired?: boolean;
  readonly isList?: boolean;
  readonly isId?: boolean;
  /** Column name from `@map("...")`; absent = the field name is the column. */
  readonly dbName?: string;
  /** The values a column may hold, when a hand-written map fixes them (a `String` column with a
   *  set of codes); json-rules gates rule values against them as it does an enum's. */
  readonly values?: readonly string[];
  readonly default?: FieldDefault;
  readonly annotations?: Annotations;
};

export type EnumField = {
  readonly kind: 'enum';
  /** The enum's name, e.g. `'UserRole'`. */
  readonly type: string;
  readonly isRequired?: boolean;
  readonly isList?: boolean;
  /** Member names; absent = the map's `enums[type]`. */
  readonly values?: readonly string[];
  /** Column name from `@map("...")`; absent = the field name is the column. */
  readonly dbName?: string;
  /** Stored DB values from `@map("...")` on members, keyed by member name; sparse — an absent
   *  member stores its name. Distinct from `dbName`, which renames the column, not its contents. */
  readonly valueDbNames?: { readonly [member: string]: string };
  readonly default?: FieldDefault;
  readonly annotations?: Annotations;
};

export type RelationField = {
  readonly kind: 'object';
  /** The target model's name. */
  readonly type: string;
  readonly isList?: boolean;
  readonly isRequired?: boolean;
  /** Disambiguates several relations between the same two models. */
  readonly relationName?: string;
  /** Foreign-key fields on this model (empty for a back-relation). */
  readonly fromFields?: readonly string[];
  /** The fields they reference on the target (empty for a back-relation). */
  readonly toFields?: readonly string[];
  readonly annotations?: Annotations;
};

export type FieldEntry = ScalarField | EnumField | RelationField;

// ─── Indexes (`@@index` / `@@unique` / `@@id` / `@@fulltext`) ─────────────────

export type IndexKind = 'index' | 'unique' | 'id' | 'fulltext';

export type IndexEntry = {
  readonly kind: IndexKind;
  /** The indexed columns, in declared order. */
  readonly fields: readonly string[];
  /** An explicit `name:` / `map:`. */
  readonly name?: string;
  readonly annotations?: Annotations;
};

// ─── Models / map ─────────────────────────────────────────────────────────────

export type ModelEntry = {
  /** Table name from `@@map("...")`; null or absent = the model name is the table. */
  readonly dbName?: string | null;
  readonly fields: { readonly [field: string]: FieldEntry };
  readonly indexes?: readonly IndexEntry[];
  readonly annotations?: Annotations;
};

/** A schema map: models keyed by name, and an enum registry (enum name → members). */
export type FieldMap = {
  readonly models: { readonly [model: string]: ModelEntry };
  readonly enums?: { readonly [enumName: string]: readonly string[] };
};

type Writable<T> = T extends readonly (infer Item)[]
  ? Writable<Item>[]
  : T extends object
    ? { -readonly [K in keyof T]: Writable<T[K]> }
    : T;

/** A FieldMap that code builds in place; a FieldMapDraft is a FieldMap. */
export type FieldMapDraft = Writable<FieldMap>;

// ─── Relations ────────────────────────────────────────────────────────────────

/** A foreign key collapsed for lookup: a single same-named pair is the bare field name;
 *  otherwise a `{ referencedField: localField }` map. */
export type Identifier = string | { readonly [referencedField: string]: string };

/** A model's relation field, read for traversal. */
export type RelationInfo = {
  /** The relation field's name on the model. */
  readonly field: string;
  readonly targetModel: string;
  readonly isList: boolean;
  readonly isRequired: boolean;
  /** null for a back-relation. */
  readonly foreignKey: Identifier | null;
  readonly annotations?: Annotations;
};
