import 'dotenv/config';
import { defineConfig } from 'prisma/config';

function cliDatasourceUrl(): string {
  const direct = process.env.DIRECT_URL?.trim();
  const pooled = process.env.DATABASE_URL?.trim();
  return direct || pooled || 'postgresql://127.0.0.1:5432/costops_generate';
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: cliDatasourceUrl(),
  },
});
