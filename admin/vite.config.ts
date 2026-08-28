import fs from 'node:fs'
import path from 'node:path'

const fallbackNodeModules = path.resolve(__dirname, '../client/node_modules')
const shouldUseFallbackDeps = !fs.existsSync(path.resolve(__dirname, 'node_modules/react')) && fs.existsSync(fallbackNodeModules)

export default {
  base: '/',
  resolve: shouldUseFallbackDeps
    ? {
        alias: {
          react: path.join(fallbackNodeModules, 'react'),
          'react-dom': path.join(fallbackNodeModules, 'react-dom'),
          'react/jsx-runtime': path.join(fallbackNodeModules, 'react/jsx-runtime.js'),
        },
      }
    : undefined,
  server: {
    host: 'admin.localhost',
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'admin-assets',
  },
}
