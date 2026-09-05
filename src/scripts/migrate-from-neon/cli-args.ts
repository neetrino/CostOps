export type MigrateCliOptions = {
  apply: boolean;
  createMissingRules: boolean;
  help: boolean;
};

export function parseMigrateCliArgs(argv: string[]): MigrateCliOptions {
  let apply = false;
  let createMissingRules = false;
  let help = false;
  for (const arg of argv) {
    if (arg === '--apply') {
      apply = true;
      continue;
    }
    if (arg === '--create-missing-rules') {
      createMissingRules = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return { apply, createMissingRules, help };
}

export const MIGRATE_FROM_NEON_HELP = `Usage: pnpm migrate:from-neon [--apply] [--create-missing-rules]

Default is dry-run (counts only, no writes).
Reads OLD_NEON_PROJECT_DATABASE_URL (SELECT only).
Writes CostOps DATABASE_URL only when --apply is passed.
`;
