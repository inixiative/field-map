import { hasColumn } from './identifiers';
import { modelOf } from './own';
import type { FieldMap } from './types';

/**
 * The field names of a model's columns (scalar and enum fields), in map order. The counterpart of
 * `relationsOf`.
 *
 * @throws if `modelName` is not in the map.
 */
export const columnsOf = (map: FieldMap, modelName: string): string[] => {
  const model = modelOf(map, modelName);
  if (!model) throw new Error(`Model ${modelName} not found in the field map`);
  return Object.entries(model.fields)
    .filter(([, field]) => hasColumn(field))
    .map(([name]) => name);
};

/**
 * Keep only a row's column keys, dropping included relations and anything else that is not a
 * column of the model.
 *
 * @throws if `modelName` is not in the map.
 */
export const pickColumns = <T extends Record<string, unknown>>(
  map: FieldMap,
  modelName: string,
  row: T,
): Partial<T> => {
  const columns = new Set(columnsOf(map, modelName));
  return Object.fromEntries(Object.entries(row).filter(([key]) => columns.has(key))) as Partial<T>;
};
