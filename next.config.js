if (process.env.NODE_ENV === 'production') {
  const withSerwist = require('@serwist/next').default({
    swSrc: 'src/app/sw.ts',
    swDest: 'public/sw.js',
  })

  module.exports = withSerwist({
    output: 'export',
    images: { unoptimized: true },
    basePath: '/beach-calc',
  })
} else {
  module.exports = {
    output: 'export',
    images: { unoptimized: true },
  }
}
