import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import autoprefixer from 'autoprefixer'

export default defineConfig(() => {
  return {
    base: '/LKDku/',
    build: {
      outDir: 'build',
      rolldownOptions: {
        output: {
          codeSplitting: { groups: [{ name: 'polyfills', test: /node_modules[\\/]core-js[\\/]/ }] },
        },
      },
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer({}), // add options if needed
        ],
      },
    },
    plugins: [
      react(),
      {
        name: 'production-csp',
        apply: 'build',
        transformIndexHtml: () => [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content:
                "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://drive.google.com https://*.googleusercontent.com; connect-src 'self' https://script.google.com https://script.googleusercontent.com",
            },
            injectTo: 'head-prepend',
          },
        ],
      },
    ],
    resolve: {
      alias: [
        {
          find: 'src/',
          replacement: fileURLToPath(new URL('./src/', import.meta.url)),
        },
      ],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
    },
    server: {
      port: 3000,
      proxy: {
        // https://vitejs.dev/config/server-options.html
      },
    },
  }
})
