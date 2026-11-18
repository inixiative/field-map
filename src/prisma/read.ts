import { own, putOwn } from '../own';
import {
  type Annotations,
  type EnumField,
  type FieldMap,
  type FieldMapDraft,
  type IndexEntry,
  isScalarType,
  type RelationField,
  type ScalarField,
} from '../types';

/** A field as a Prisma parser reads it: a scalar's type is Prisma's name, `Unsupported` included. */
export type RawField = (Omit<ScalarField, 'type'> & { type: string }) | EnumField | RelationField;

export type RawModel = {
  dbName: string | null;
  fields: Record<string, RawField>;
  indexes?: IndexEntry[];
  annotations?: Annotations;
};

export type RawModels = Record<string, RawModel>;

/** What a Prisma reader returns: the field map, and per model the `Unsupported(...)` columns the
 *  client can't select (generated columns a raw query still reads), sorted. */
export type PrismaRead = {
  map: FieldMap;
  unsupportedColumns: { readonly [model: string]: readonly string[] };
};

const byName = <T>(entries: [string, T][]): [string, T][] =>
  entries.sort(([left], [right]) => left.localeCompare(right));

/**
 * The one finishing step of every Prisma reader: models and fields sorted by name, each enum's
 * members registered in `enums` (sorted), `Unsupported` columns moved out of the map into
 * `unsupportedColumns`, and any other scalar type the map doesn't know refused. `unsupported`
 * names the Unsupported columns when the raw models came from the client, which omits them.
 */
export const finishPrismaRead = (
  raw: RawModels,
  unsupported: Record<string, string[]> = {},
): PrismaRead => {
  const models: FieldMapDraft['models'] = {};
  const enums: Record<string, string[]> = {};
  const unsupportedColumns: Record<string, string[]> = {};
  const noteUnsupported = (model: string, field: string) => {
    const list = own(unsupportedColumns, model) ?? [];
    if (!list.includes(field)) list.push(field);
    putOwn(unsupportedColumns, model, list);
  };
  for (const [model, fields] of Object.entries(unsupported))
    for (const field of fields) noteUnsupported(model, field);

  for (const [modelName, model] of byName(Object.entries(raw))) {
    const fields: FieldMapDraft['models'][string]['fields'] = {};
    for (const [fieldName, field] of byName(Object.entries(model.fields))) {
      if (field.kind === 'scalar' && field.type === 'Unsupported') {
        noteUnsupported(modelName, fieldName);
        continue;
      }
      if (field.kind === 'scalar' && !isScalarType(field.type))
        throw new Error(
          `${modelName}.${fieldName}: scalar type '${field.type}' is not one a field map holds`,
        );
      if (field.kind === 'enum' && field.values && !own(enums, field.type))
        putOwn(enums, field.type, [...field.values].sort());
      putOwn(fields, fieldName, field as FieldMapDraft['models'][string]['fields'][string]);
    }
    putOwn(models, modelName, { ...(model as FieldMapDraft['models'][string]), fields });
  }

  for (const list of Object.values(unsupportedColumns)) list.sort();
  return {
    map: {
      models,
      enums: Object.fromEntries(byName(Object.entries(enums))),
    },
    unsupportedColumns: Object.fromEntries(byName(Object.entries(unsupportedColumns))),
  };
};
