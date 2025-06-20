/*
 * @Author: zouyaoji@https://github.com/zouyaoji
 * @Date: 2021-12-08 23:26:13
 * @LastEditTime: 2025-04-01 09:00:20
 * @LastEditors: Henry Ma henryma@edening.cn
 * @Description:
 * @FilePath: \vue-cesium-demo\vite.config.mts
 */
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import vueJsx from '@vitejs/plugin-vue-jsx'

import { viteStaticCopy } from 'vite-plugin-static-copy'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('./package.json')

const htmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      return html.replace(/<title>(.*?)<\/title>/, `<title>${process.env.VITE_VUE_APP_TITLE}</title>`)
    }
  }
}

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }
  return defineConfig({
    base: process.env.VITE_VUE_ROUTER_BASE,
    plugins: [
      vue({
        template: { transformAssetUrls }
      }),
      vueJsx(),
      quasar({
        sassVariables: true
      }),
      htmlPlugin(),
      viteStaticCopy({
        targets: [
          {
            src: 'dist/*',
            dest: 'office'
          }
        ]
      })
    ],
    resolve: {
      alias: {
        '@src': resolve(__dirname, './src'),
        '@api': resolve(__dirname, './src/api'),
        '@assets': resolve(__dirname, './src/assets'),
        '@common': resolve(__dirname, './src/common'),
        '@components': resolve(__dirname, './src/components'),
        '@composables': resolve(__dirname, './src/composables'),
        '@config': resolve(__dirname, './src/config'),
        '@i18n': resolve(__dirname, './src/i18n'),
        '@layouts': resolve(__dirname, './src/layouts'),
        '@pages': resolve(__dirname, './src/pages'),
        '@router': resolve(__dirname, './src/router'),
        '@store': resolve(__dirname, './src/store'),
        '@types': resolve(__dirname, './src/types'),
        '@utils': resolve(__dirname, './src/utils')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@src/assets/style/variables.scss";'
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
      proxy: {
        '/traffictile': {
          target: 'https://tm.amap.com/trafficengine/mapabc/traffictile',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/traffictile/, '/')
        },
        '/v3': {
          target: 'https://restapi.amap.com/v3',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/v3/, '/')
        }
      }
    },
    optimizeDeps: { exclude: ['@babylonjs/havok'] },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true
        }
      },
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/node_modules/')) {
              const modules = ['quasar', 'vue-cesium', 'echarts', 'lodash', 'axios', 'interactjs', 'lowdb', 'pinia', '@supabase/supabase-js']
              const chunk = modules.find(module => id.includes(`/node_modules/${module}`))
              return chunk ? `vendor-${chunk}` : 'vendor'
            }
          }
        }
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      'process.env': {}
    }
  })
}
