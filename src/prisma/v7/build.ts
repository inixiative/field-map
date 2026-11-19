import type { EnumField, RelationField } from '../../types';
import { autoDetectV7Path } from '../autoDetect';
import { finishPrismaRead, type PrismaRead, type RawField, type RawModels } from '../read';
import { parseSchemaText } from '../v6/parseSchemaText';
import { parseFieldModifiers } from './fieldModifiers';
import { parseInlineSchema } from './inlineSchema';
import { parseEnumValues } from './parseEnumValues';
import { parseRelationFks } from './relationFks';
import { parseRuntimeDataModel } from './runtimeDataModel';
import { parseSchemaStructure } from './schemaStructure';

/**
 * A field map from a Prisma v7 generated client directory: models and fields from the client's
 * runtime data model, list / required / id flags, `@map`, `@default`, FKs, enum values and `///`
 * annotations from its inline schema. `Unsupported(...)` columns, which the runtime data model
 * leaves out, come from the inline schema into `unsupportedColumns`.
 *
 * @param generatedClientPath - the client directory (the one containing `internal/class.ts`). If
 *   omitted, auto-detected by walking up from `process.cwd()`.
 */
export const readPrismaClientV7 = (generatedClientPath?: string): PrismaRead => {
  const resolvedPath = generatedClientPath ?? autoDetectV7Path();
  const dataModel = parseRuntimeDataModel(resolvedPath);
  const inlineSchema = parseInlineSchema(resolvedPath);
  const relationFks = parseRelationFks(inlineSchema);
  const enumValuesMap = parseEnumValues(inlineSchema);
  const fieldModifiers = parseFieldModifiers(inlineSchema);
  const structure = parseSchemaStructure(inlineSchema);

  const map: RawModels = {};

  for (const [modelName, model] of Object.entries(dataModel.models)) {
    const modelFks = relationFks.get(modelName);
    const modelMods = fieldModifiers.get(modelName);
    const modelStructure = structure.get(modelName);
    const fields: Record<string, RawField> = {};

    for (const field of model.fields) {
      // Prisma v7's runtimeDataModel omits isList/isRequired/isId/isUnique — read them from the schema.
      const mods = modelMods?.get(field.name);
      const isList = mods?.isList ?? field.isList ?? false;
      const isRequired = mods?.isRequired ?? field.isRequired ?? true;
      const isId = mods?.isId ?? field.isId ?? false;
      const isUnique = mods?.isUnique ?? false;
      const fieldAnno = modelStructure?.fields.get(field.name);
      const withAnno = fieldAnno ? { annotations: fieldAnno } : {};
      const withDbName = mods?.dbName ? { dbName: mods.dbName } : {};
      const withDefault = mods?.default ? { default: mods.default } : {};
      const valueDbNames = enumValuesMap.get(field.type)?.dbNames;
      const withValueDbNames = valueDbNames ? { valueDbNames } : {};

      if (field.kind === 'scalar') {
        const scalarField: RawField = {
          kind: 'scalar',
          type: field.type,
          isRequired,
          isList,
          isId,
          isUnique,
          ...withDbName,
          ...withDefault,
          ...withAnno,
        };
        fields[field.name] = scalarField;
      } else if (field.kind === 'enum') {
        const enumField: EnumField = {
          kind: 'enum',
          type: field.type,
          isRequired,
          isList,
          isUnique,
          values: enumValuesMap.get(field.type)?.values ?? [],
          ...withValueDbNames,
          ...withDbName,
          ...withDefault,
          ...withAnno,
        };
        fields[field.name] = enumField;
      } else if (field.kind === 'object') {
        const fkMapping = modelFks?.get(field.name);
        const relationField: RelationField = {
          kind: 'object',
          type: field.type,
          isList,
          isRequired,
          ...(field.relationName ? { relationName: field.relationName } : {}),
          fromFields: fkMapping?.fields ?? [],
          toFields: fkMapping?.references ?? [],
          ...withAnno,
        };
        fields[field.name] = relationField;
      }
    }

    map[modelName] = {
      dbName: model.dbName,
      fields,
      ...(modelStructure?.indexes.length ? { indexes: modelStructure.indexes } : {}),
      ...(modelStructure?.annotations ? { annotations: modelStructure.annotations } : {}),
    };
  }

  return finishPrismaRead(map, unsupportedColumnsIn(inlineSchema));
};

// The `Unsupported(...)` columns a schema declares, per model.
const unsupportedColumnsIn = (schema: string): Record<string, string[]> => {
  const columns: Record<string, string[]> = {};
  for (const [model, entry] of Object.entries(parseSchemaText(schema))) {
    const names = Object.entries(entry.fields)
      .filter(([, field]) => field.kind === 'scalar' && field.type === 'Unsupported')
      .map(([name]) => name);
    if (names.length) columns[model] = names;
  }
  return columns;
};
