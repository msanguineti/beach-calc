import {
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from 'next/constants.js'

/** @type {(phase: string, defaultConfig: import("next").NextConfig) => Promise<import("next").NextConfig>} */
export default async (phase) => {
  /** @type {import("next").NextConfig} */
  const nextConfig = {
    output: 'export',
    images: { unoptimized: true },
  }

  if (phase === PHASE_PRODUCTION_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withSerwist = (await import('@serwist/next')).default({
      // Note: This is only an example. If you use Pages Router,
      // use something else that works, such as "service-worker/index.ts".
      swSrc: 'src/app/sw.ts',
      swDest: 'public/sw.js',
    })
    return withSerwist({
      ...nextConfig,
      basePath: '/beach-calc',
    })
  }

  return nextConfig
}
