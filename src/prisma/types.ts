// What the Prisma readers parse on the way to a FieldMap. Not exported from the package.

export type RuntimeField = {
  name: string;
  kind: 'scalar' | 'object' | 'enum';
  type: string;
  relationName?: string;
  isRequired: boolean;
  isList: boolean;
  isId: boolean;
};

export type RuntimeModel = {
  fields: RuntimeField[];
  dbName: string | null;
};

export type RuntimeDataModel = {
  models: Record<string, RuntimeModel>;
  enums: Record<string, unknown>;
  types: Record<string, unknown>;
};

export type EnumValues = {
  values: string[]; // member names, in declared order
  dbNames?: Record<string, string>; // member name -> stored DB value, for members with `@map`
};

export type RelationFkMapping = {
  fields: string[];
  references: string[];
};
