import { node } from '@inixiative/config/tsup';

export default node({
  entry: ['src/index.ts', 'src/prisma/index.ts', 'src/cli.ts'],
  minify: true,
  treeshake: true,
  platform: 'node',
});
