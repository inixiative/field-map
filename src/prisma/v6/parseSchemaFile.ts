import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The `schema.prisma` Prisma v6 copies into its generated client directory. */
export const readSchemaFile = (generatedClientPath: string): string =>
  readFileSync(join(generatedClientPath, 'schema.prisma'), 'utf-8');
