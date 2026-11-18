import type { FieldMap } from './types';

/** Own-property read: a name that only exists on Object.prototype reads as absent. */
export const own = <T>(
  record: { readonly [key: string]: T } | undefined,
  key: string,
): T | undefined => (record !== undefined && Object.hasOwn(record, key) ? record[key] : undefined);

/** An own entry of `record`, created by `make` when absent — never one Object.prototype names. */
export const ownEntry = <T>(record: Record<string, T>, key: string, make: () => T): T => {
  if (!Object.hasOwn(record, key)) record[key] = make();
  return record[key];
};

/** Write an own data property, even one named `__proto__`: a schema's names are input. */
export const putOwn = <T>(record: Record<string, T>, key: string, value: T): void => {
  Object.defineProperty(record, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
};

/** The structure `modelOf` / `fieldOf` read: a FieldMap, or a map a consumer extends (json-rules'
 *  stitched and projected maps), so one reader serves both. */
type ModelsOf = { readonly models: { readonly [model: string]: { readonly fields: object } } };
// Over a literal map (no index signature) a model is the union of its models, and a field the
// union of their fields.
type ModelOf<M extends ModelsOf> = M['models'][keyof M['models']];
type FieldsOfEach<Model> = Model extends { readonly fields: infer Fields }
  ? Fields[keyof Fields]
  : never;
type FieldOf<M extends ModelsOf> = FieldsOfEach<ModelOf<M>>;

/** A model of a field map, own-property only. */
export const modelOf = <M extends ModelsOf = FieldMap>(
  map: M | undefined,
  model: string,
): ModelOf<M> | undefined =>
  own(map?.models as { readonly [name: string]: ModelOf<M> } | undefined, model);

/** A field of a model, own-property only. */
export const fieldOf = <M extends ModelsOf = FieldMap>(
  map: M | undefined,
  model: string,
  field: string,
): FieldOf<M> | undefined =>
  own(modelOf(map, model)?.fields as { readonly [name: string]: FieldOf<M> } | undefined, field);
