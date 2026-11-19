import { modelOf } from './own';
import type { FieldMap } from './types';

/**
 * Every unique key of a model, each as its field names: a field-level `@id` or `@unique` as a
 * one-field key, then each `@@id` and `@@unique` index in declared order. A field of a compound
 * `@@id` is marked `isId` but is not a key on its own; it appears only inside its index.
 *
 * @throws if `modelName` is not in the map.
 */
export const uniqueKeysOf = (map: FieldMap, modelName: string): string[][] => {
  const model = modelOf(map, modelName);
  if (!model) throw new Error(`Model ${modelName} not found in the field map`);

  const indexKeys = (model.indexes ?? [])
    .filter((index) => index.kind === 'unique' || index.kind === 'id')
    .map((index) => [...index.fields]);
  const compoundIdFields = new Set(
    (model.indexes ?? []).filter((index) => index.kind === 'id').flatMap((index) => index.fields),
  );
  const fieldKeys = Object.entries(model.fields)
    .filter(
      ([name, field]) =>
        field.kind !== 'object' &&
        (field.isUnique || (field.kind === 'scalar' && field.isId && !compoundIdFields.has(name))),
    )
    .map(([name]) => [name]);

  return [...fieldKeys, ...indexKeys];
};
