import type { FieldEntry, FieldMap, ModelEntry } from './types';

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

/** A model of a field map, own-property only. */
export const modelOf = (map: FieldMap | undefined, model: string): ModelEntry | undefined =>
  own(map?.models, model);

/** A field of a model, own-property only. */
export const fieldOf = (
  map: FieldMap | undefined,
  model: string,
  field: string,
): FieldEntry | undefined => own(modelOf(map, model)?.fields, field);
