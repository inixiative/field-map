import { autoDetectV6Path } from '../autoDetect';
import { finishPrismaRead, type PrismaRead } from '../read';
import { readSchemaFile } from './parseSchemaFile';
import { parseSchemaText } from './parseSchemaText';

/** A field map from Prisma schema text: what `readPrismaClientV6` reads from its copy. */
export const readPrismaSchema = (schema: string): PrismaRead =>
  finishPrismaRead(parseSchemaText(schema));

/**
 * A field map from a Prisma v6 generated client directory, read from the `schema.prisma` Prisma
 * copies there.
 *
 * @param generatedClientPath - the client directory (the one containing `schema.prisma`). If
 *   omitted, auto-detected by walking up from `process.cwd()`.
 */
export const readPrismaClientV6 = (generatedClientPath?: string): PrismaRead =>
  readPrismaSchema(readSchemaFile(generatedClientPath ?? autoDetectV6Path()));
