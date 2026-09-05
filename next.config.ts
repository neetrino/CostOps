import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  serverExternalPackages: ['pino', 'pg', '@prisma/adapter-pg'],
};

export default nextConfig;
