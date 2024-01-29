/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: process.env.NODE_ENV === 'production' ? '/beach-calc' : '',
}

/** @type {import('@serwist/next')} */
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
})

module.exports = withSerwist({
  ...nextConfig,
})
