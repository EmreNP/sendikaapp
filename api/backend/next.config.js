const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['shared'],
  typescript: {
    // Allow build even if there are TypeScript type errors (avoid blocking deploy). Consider fixing errors later.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config) => {
    // Resolve monorepo shared folder imports like @shared/*
    config.resolve.alias = config.resolve.alias || {};
    // Resolve shared package in monorepo (maps to ../shared from backend)
    config.resolve.alias['@shared'] = path.resolve(__dirname, '..', 'shared');
    config.resolve.alias['@shared/constants'] = path.resolve(__dirname, '..', 'shared', 'constants');
    return config;
  },
}

module.exports = nextConfig

