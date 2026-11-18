import { own, putOwn } from './own';
import type { FieldEntry, FieldMap, FieldMapDraft, ScalarType } from './types';

/**
 * The slice of JSON Schema (draft 2020-12, draft-07, OpenAPI 3.x) a field map is read from.
 * `z.toJSONSchema(...)` output is assignable to it; any other keyword is ignored.
 */
export type JsonSchema = {
  readonly [keyword: string]: unknown;
  readonly type?: string | readonly string[];
  readonly format?: string;
  readonly enum?: readonly unknown[];
  readonly const?: unknown;
  readonly nullable?: boolean;
  readonly properties?: { readonly [field: string]: JsonSchemaNode };
  readonly required?: readonly string[];
  readonly items?: JsonSchemaNode | readonly JsonSchemaNode[];
  readonly prefixItems?: readonly JsonSchemaNode[];
  readonly anyOf?: readonly JsonSchemaNode[];
  readonly allOf?: readonly JsonSchemaNode[];
  readonly oneOf?: readonly JsonSchemaNode[];
  readonly $ref?: string;
  readonly $defs?: { readonly [name: string]: JsonSchemaNode };
  readonly definitions?: { readonly [name: string]: JsonSchemaNode };
};

/** A schema position: a schema, or `true` (anything) / `false` (nothing). */
export type JsonSchemaNode = boolean | JsonSchema;

// A schema position with its `$ref`s followed and its null arm removed.
type Unwrapped = {
  schema: JsonSchema;
  nullable: boolean;
  // The `$defs` / `definitions` key the last `$ref` landed on; '#' for the root.
  refName?: string;
  // The node the last `$ref` landed on, which names its model once however often it's reached.
  refTarget?: JsonSchema;
};

type Build = {
  root: JsonSchema;
  // What a `#/...` pointer other than `$defs` / `definitions` resolves against: the OpenAPI
  // document for `#/components/schemas/<name>`.
  document: unknown;
  models: FieldMapDraft['models'];
  enums: Record<string, readonly string[]>;
  // A `$ref` target, or an object on the stack of models being built, to its model name.
  named: Map<JsonSchema, string>;
};

const ANY: JsonSchema = {};

const asSchema = (node: JsonSchemaNode | undefined): JsonSchema =>
  typeof node === 'object' && node !== null ? node : ANY;

const isNullSchema = (node: JsonSchemaNode): boolean => {
  const schema = asSchema(node);
  return schema.type === 'null' || (Object.hasOwn(schema, 'const') && schema.const === null);
};

// A JSON pointer segment as written, then pointer-unescaped, then URI-decoded too (zod writes
// ids unencoded).
const segmentSpellings = (segment: string): string[] => {
  const pointer = (text: string): string => text.replaceAll('~1', '/').replaceAll('~0', '~');
  const spellings = [segment, pointer(segment)];
  try {
    spellings.push(pointer(decodeURIComponent(segment)));
  } catch {
    // not URI-encoded
  }
  return spellings;
};

// `$defs` / `definitions` resolve against the root schema; any other local pointer
// (`#/components/schemas/User`) against the caller's document.
const followRef = (ref: string, build: Build): { schema: JsonSchema; name: string } => {
  if (ref === '#') return { schema: build.root, name: '#' };
  const match = /^#\/(.+)\/([^/]+)$/.exec(ref);
  if (!match)
    throw new Error(`fieldMapFromJsonSchema: '$ref' '${ref}' is not a local '#/...' reference`);
  const containerPath = match[1].split('/');
  const inRoot = containerPath.length === 1 && ['$defs', 'definitions'].includes(containerPath[0]);
  let container: unknown = inRoot ? build.root : build.document;
  for (const segment of containerPath) {
    const next = segmentSpellings(segment)
      .map((name) => own(container as Record<string, unknown> | undefined, name))
      .find((value) => value !== undefined);
    container = next;
  }
  for (const name of segmentSpellings(match[2])) {
    const target = own(container as Record<string, JsonSchemaNode> | undefined, name);
    if (target !== undefined) return { schema: asSchema(target), name };
  }
  throw new Error(
    inRoot || build.document !== undefined
      ? `fieldMapFromJsonSchema: '$ref' '${ref}' has no target`
      : `fieldMapFromJsonSchema: '$ref' '${ref}' needs the document it points into ({ document })`,
  );
};

// String-valued branches only: an enum's or const's members, or undefined when any isn't a string.
const stringMembers = (schema: JsonSchema): string[] | undefined => {
  const members = Object.hasOwn(schema, 'const') ? [schema.const] : schema.enum;
  if (!members?.length) return undefined;
  return members.every((member) => typeof member === 'string')
    ? [...new Set(members as string[])]
    : undefined;
};

/**
 * Follow `$ref`s and drop the null arm: `anyOf`/`oneOf` with a `{ type: 'null' }` branch,
 * `type: [X, 'null']`, OpenAPI's `nullable: true`, or `null` among `enum` members. A one-member
 * `allOf` is its member (OpenAPI 3.0 writes a described or nullable `$ref` that way). A union of
 * string literals reads as one enum; any other union of several shapes, and a shape that only
 * reaches itself, is Json.
 */
const unwrap = (
  node: JsonSchemaNode | undefined,
  build: Build,
  seen: ReadonlySet<JsonSchema> = new Set(),
): Unwrapped => {
  let schema = asSchema(node);
  let nullable = false;
  let refName: string | undefined;
  let refTarget: JsonSchema | undefined;
  const visited = new Set(seen);
  for (;;) {
    if (visited.has(schema)) return { schema: ANY, nullable };
    visited.add(schema);
    if (schema.nullable === true) nullable = true;
    if (schema.$ref !== undefined) {
      const target = followRef(schema.$ref, build);
      schema = target.schema;
      refName = target.name;
      refTarget = target.schema;
      continue;
    }
    if (schema.allOf?.length === 1) {
      schema = asSchema(schema.allOf[0]);
      continue;
    }
    const branches = schema.anyOf ?? schema.oneOf;
    if (branches) {
      const present = branches.filter((branch) => !isNullSchema(branch));
      if (present.length < branches.length) nullable = true;
      if (present.length === 1) {
        schema = asSchema(present[0]);
        continue;
      }
      const literals = present.map((branch) =>
        stringMembers(unwrap(branch, build, visited).schema),
      );
      if (present.length > 1 && literals.every((members) => members !== undefined))
        return { schema: { type: 'string', enum: [...new Set(literals.flat())] }, nullable };
      return { schema: ANY, nullable };
    }
    break;
  }
  if (Array.isArray(schema.type) && schema.type.includes('null')) {
    nullable = true;
    const types = schema.type.filter((type) => type !== 'null');
    schema = { ...schema, type: types.length === 1 ? types[0] : types };
  }
  if (schema.enum?.includes(null)) {
    nullable = true;
    schema = { ...schema, enum: schema.enum.filter((member) => member !== null) };
  }
  return { schema, nullable, refName, refTarget };
};

const primaryType = (schema: JsonSchema): string | undefined =>
  typeof schema.type === 'string'
    ? schema.type
    : schema.type === undefined && schema.properties !== undefined
      ? 'object'
      : undefined;

const scalarKind = (schema: JsonSchema): ScalarType => {
  switch (primaryType(schema)) {
    case 'string':
      return schema.format === 'date-time' ? 'DateTime' : 'String';
    case 'integer':
      return 'Int';
    case 'number':
      return 'Float';
    case 'boolean':
      return 'Boolean';
    default:
      return 'Json';
  }
};

const isModel = (schema: JsonSchema): boolean =>
  primaryType(schema) === 'object' && Object.keys(schema.properties ?? {}).length > 0;

const claimName = (name: string, build: Build, node: JsonSchema): string => {
  if (Object.hasOwn(build.models, name) || [...build.named.values()].includes(name))
    throw new Error(`fieldMapFromJsonSchema: two shapes would both be model '${name}'`);
  build.named.set(node, name);
  return name;
};

const registerEnum = (name: string, values: readonly string[], build: Build): void => {
  const existing = own(build.enums, name);
  if (existing && existing.join('\u0000') !== values.join('\u0000'))
    throw new Error(`fieldMapFromJsonSchema: enum '${name}' is declared with two value sets`);
  putOwn(build.enums, name, values);
};

// One property's entry; an object shape builds (or reuses) its model.
const fieldEntry = (
  node: JsonSchemaNode,
  path: string,
  isRequired: boolean,
  build: Build,
): FieldEntry => {
  const outer = unwrap(node, build);
  const required = isRequired && !outer.nullable;
  // A tuple (`prefixItems`, or draft-04 `items: [...]`) is heterogeneous, so Json, rest or not.
  const listItems =
    primaryType(outer.schema) === 'array' && outer.schema.prefixItems === undefined
      ? outer.schema.items
      : undefined;
  const isList = listItems !== undefined && !Array.isArray(listItems);
  const target = isList ? unwrap(listItems as JsonSchemaNode, build) : outer;
  const shape = { isList, isRequired: required };

  const members = stringMembers(target.schema);
  if (members) {
    const type = target.refName && target.refName !== '#' ? target.refName : path;
    registerEnum(type, members, build);
    return { kind: 'enum', type, values: members, ...shape };
  }
  if (isModel(target.schema))
    return { kind: 'object', type: modelFor(target, path, build), ...shape };
  return { kind: 'scalar', type: scalarKind(target.schema), ...shape };
};

// The model an object shape is: one already named (a `$ref` target, or an object still being
// built — recursion), else a new one named after its `$defs` key or its path.
const modelFor = (target: Unwrapped, path: string, build: Build): string => {
  const node = target.refTarget ?? target.schema;
  const existing = build.named.get(node);
  if (existing !== undefined) return existing;
  const name = claimName(target.refName ?? path, build, node);
  buildModel(target.schema, name, build);
  if (target.refTarget === undefined) build.named.delete(node);
  return name;
};

const buildModel = (schema: JsonSchema, name: string, build: Build): void => {
  const required = new Set(schema.required ?? []);
  const fields: Record<string, FieldEntry> = {};
  putOwn(build.models, name, { fields });
  for (const [field, node] of Object.entries(schema.properties ?? {}))
    putOwn(fields, field, fieldEntry(node, `${name}.${field}`, required.has(field), build));
};

/** `model`: the name of the root object's model. `document`: what a `#/...` pointer outside
 *  `$defs` / `definitions` resolves against (an OpenAPI document, for `#/components/schemas/…`). */
export type FieldMapFromJsonSchemaOptions = { model: string; document?: unknown };

/**
 * A field map read from a JSON Schema — `z.toJSONSchema(zodSchema)`, or an OpenAPI component
 * schema with its document — so the map of a source's data comes from the schema that already
 * describes it instead of a hand-written one. Models with `kind` / `type` / `isList` /
 * `isRequired` fields, enums in `enums` (and on the field as `values`).
 *
 * The root object (or a root array's items) is `model`. A nested object is the model
 * `<parent>.<field>`; an array of objects is a to-many relation. A `$ref` is the model named after
 * its key (`'#'` is the root), built once: a recursive or reused reference is a relation to the
 * model already built. Strings, `date-time` strings, integers, numbers and booleans are String /
 * DateTime / Int / Float / Boolean; a string enum, `const`, or union of string literals is an
 * enum. A nullable shape (`anyOf` with `null`, `type: [X, 'null']`, `nullable: true`) is X, not
 * required. Json, which a rule may still read into by dotted path: an object without properties
 * (a record), a union of several shapes, `allOf` of several members, tuples, and anything untyped.
 */
export const fieldMapFromJsonSchema = (
  schema: JsonSchema,
  { model, document }: FieldMapFromJsonSchemaOptions,
): FieldMap => {
  const build: Build = { root: schema, document, models: {}, enums: {}, named: new Map() };
  const top = unwrap(schema, build);
  const rootItems = primaryType(top.schema) === 'array' ? top.schema.items : undefined;
  const anchor =
    rootItems !== undefined && !Array.isArray(rootItems)
      ? unwrap(rootItems as JsonSchemaNode, build)
      : top;
  if (!isModel(anchor.schema))
    throw new Error(
      `fieldMapFromJsonSchema: '${model}' has no fields — the schema is not an object with properties`,
    );
  build.named.set(schema, model);
  if (anchor.refTarget) build.named.set(anchor.refTarget, model);
  build.named.set(anchor.schema, model);
  buildModel(anchor.schema, model, build);

  return Object.keys(build.enums).length > 0
    ? { models: build.models, enums: build.enums }
    : { models: build.models };
};
