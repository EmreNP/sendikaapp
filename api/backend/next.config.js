const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['shared'],
  typescript: {
    // TypeScript hataları build'de kontrol edilir — tip hataları production'a geçemez
    ignoreBuildErrors: false,
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
  async headers() {
    return [
      {
        // Tüm route'lara güvenlik header'ları ekle
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig

