import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { sortEnvFile, writeSortedEnv, SortOrder } from '../storage/env-sort';
import { serializeEnv } from '../env/parser';

export function getVaultDir(): string {
  return path.join(process.cwd(), '.envault');
}

export function registerSortCommand(program: Command): void {
  program
    .command('sort <envfile>')
    .description('Sort keys in a .env file alphabetically')
    .option('-o, --order <order>', 'Sort order: asc or desc', 'asc')
    .option('-g, --group-by-prefix', 'Group keys by prefix before sorting', false)
    .option('--in-place', 'Overwrite the input file with sorted output', false)
    .option('--output <file>', 'Write sorted output to a specific file')
    .action((envfile: string, opts) => {
      const inputPath = path.resolve(envfile);
      if (!fs.existsSync(inputPath)) {
        console.error(`File not found: ${inputPath}`);
        process.exit(1);
      }

      const order = opts.order as SortOrder;
      if (order !== 'asc' && order !== 'desc') {
        console.error(`Invalid order: ${order}. Must be 'asc' or 'desc'.`);
        process.exit(1);
      }

      const options = { order, groupByPrefix: opts.groupByPrefix };

      if (opts.inPlace) {
        writeSortedEnv(inputPath, inputPath, options);
        console.log(`Sorted ${inputPath} in place.`);
      } else if (opts.output) {
        const outputPath = path.resolve(opts.output);
        writeSortedEnv(inputPath, outputPath, options);
        console.log(`Sorted output written to ${outputPath}`);
      } else {
        const sorted = sortEnvFile(inputPath, options);
        process.stdout.write(serializeEnv(sorted));
      }
    });
}
