/*
 * @Author: zouyaoji@https://github.com/zouyaoji
 * @Date: 2021-08-26 17:00:10
 * @LastEditTime: 2025-01-17 11:14:48
 * @LastEditors: Henry Ma henryma@edening.cn
 * @Description:
 * @FilePath: \vue-cesium-demo\src\router\routes.ts
 */
/**
 * 在布局内显示
 */
const frameIn = [
  {
    path: '/',
    name: 'layout',
    component: () => import('@src/layouts/MainLayout.vue'),
    redirect: { path: import.meta.env.VITE_VUE_DEFAULT_PATH },
    children: [
      {
        name: 'login',
        path: '/login',
        component: () => import('@src/pages/system/Login.vue')
      }
    ]
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@src/layouts/MainLayout.vue'),
    children: [
      {
        name: 'login',
        path: '/login',
        component: () => import('@src/pages/system/Login.vue')
      }
    ]
  },
  {
    path: '/create',
    name: 'create',
    component: () => import('@src/layouts/MainLayout.vue'),
    redirect: { path: '/create/tbd' },
    children: [
      {
        name: 'login',
        path: '/login',
        component: () => import('@src/pages/system/Login.vue')
      }
    ]
  },
  {
    path: '/happiness',
    name: 'happiness',
    component: () => import('@src/layouts/MainLayout.vue'),
    redirect: { path: '/happiness/hsa' },
    children: [
      {
        name: 'login',
        path: '/login',
        component: () => import('@src/pages/system/Login.vue')
      }
    ]
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@src/pages/system/AuthCallback.vue')
  }
]
/**
 * 在布局之外显示
 */
const frameOut = [
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    name: '404',
    component: () => import('@src/pages/system/Error404.vue')
  }
]

const test = [
  {
    name: 'test-on-demand',
    path: '/test-on-demand',
    meta: {
      title: 'ttt'
    },
    component: () => import('@src/pages/test/on-demand/Index.vue')
  }
]

export const frameInRoutes = frameIn

export default [...frameIn, ...test, ...frameOut]
