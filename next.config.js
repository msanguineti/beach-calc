/** @type {import('next/config').NextConfig} */
const nextConfig = {
  output: 'export',
}

/** @type {import('@serwist/next')} */
const withSerwist = require('@serwist/next').default({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
})

module.exports = withSerwist({
  ...nextConfig,
})
