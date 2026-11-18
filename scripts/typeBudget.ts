// The path types are checked over template's generated map; this fails the check when compiling
// them grows past the budget, so a change that makes them expensive shows up here first.
const BUDGET = 400_000;

const run = Bun.spawnSync([
  'bunx',
  'tsc',
  '--noEmit',
  '-p',
  'tsconfig.check.json',
  '--extendedDiagnostics',
]);
const output = run.stdout.toString();
const instantiations = Number(output.match(/Instantiations:\s+(\d+)/)?.[1]);
if (run.exitCode !== 0 || !Number.isFinite(instantiations)) {
  console.error(output);
  process.exit(1);
}
if (instantiations > BUDGET) {
  console.error(`type budget: ${instantiations} instantiations, over ${BUDGET}`);
  process.exit(1);
}
console.log(`type budget: ${instantiations} instantiations (budget ${BUDGET})`);
