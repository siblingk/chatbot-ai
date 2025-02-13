import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Configuración para manejar módulos de Node.js en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        'node:fs/promises': false,
        module: false,
        perf_hooks: false,
        http: false,
        https: false,
        url: false,
        zlib: false,
        crypto: false,
        stream: false,
        path: false,
        util: false,
      };
    }

    // Configuración para pdf-parse y otros módulos
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
      sharp$: false,
      'onnxruntime-node$': false,
    };

    // Ignorar módulos problemáticos
    if (!isServer) {
      config.externals = [
        ...(config.externals || []),
        {
          canvas: 'null',
          'canvas-prebuilt': 'null',
          'pdfjs-dist': 'null',
        },
      ];
    }

    // Habilitar experimentos necesarios
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

export default nextConfig;
