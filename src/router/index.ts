/*
 * @Author: zouyaoji@https://github.com/zouyaoji
 * @Date: 2021-08-26 17:00:10
 * @LastEditTime: 2025-03-21 16:30:01
 * @LastEditors: Henry Ma henryma@edening.cn
 * @Description:
 * @FilePath: \vue-cesium-demo\src\router\index.ts
 */
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import NProgress from 'nprogress'
import { store, pinia } from '@src/store'
import 'nprogress/nprogress.css'
import * as api from '@src/api'
import * as webStorage from '@src/utils/web-storage'
import * as util from '@src/utils/util'
import { i18n } from '@src/i18n'

const createHistory = import.meta.env.SERVER
  ? createMemoryHistory
  : import.meta.env.VITE_VUE_ROUTER_MODE === 'history'
  ? createWebHistory
  : createWebHashHistory

const Router = createRouter({
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes,

  // Leave this as is and make changes in quasar.conf.js instead!
  // quasar.conf.js -> build -> vueRouterMode
  // quasar.conf.js -> build -> publicPath
  // history: createHistory(import.meta.env.MODE === 'ssr' ? void 0 : import.meta.env.VITE_VUE_ROUTER_BASE)
  history: createHistory(import.meta.env.VITE_VUE_ROUTER_BASE)
})

// const whiteList = ['/login', '/404', '/auth/callback'] // 设置白名单，避免死循环
const whiteList = ['/login', '/404', '/authcallback']
Router.beforeEach(async (to, from, next) => {
  /* if (to.path.includes('/office/')) {
    next()
    return
  } */
  // 进度条
  NProgress.start()
  // 关闭搜索面板
  store.system.useSearchStore(pinia).set(false)
  const token = webStorage.getLocalStorage('token')
  // 发一次请求 如果返回401 说明token已过期直接跳转到登录页面
  // to.path !== '/login' && api.system.getUserInfo()
  // alert('token: ' + token)
  if (token) {
    try {
      const permissionInited = store.system.usePermissionStore(pinia).inited
      if (!permissionInited) {
        const menuTreeRes = await api.system.getAccessibleMenus()
        const menuTree = [...menuTreeRes.data]
        await store.system.usePermissionStore(pinia).generateRoutes({ menuTree })
        next(to.path)
        return
      }
      if (to.path === '/login') {
        next({
          path: import.meta.env.VITE_VUE_DEFAULT_PATH
        })
      } else {
        next()
      }
    } catch (e) {
      if (whiteList.indexOf(to.path) !== -1 || to.path.includes('/office/')) {
        // 在免登录白名单，直接进入
        next()
      } else {
        next('/login')
      }
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1 || to.path.includes('/office/')) {
      next()
    } else {
      next('/login')
    }
  }
})

Router.afterEach(to => {
  // 进度条
  NProgress.done()
  // 更改标题
  if (to.meta.title) {
    util.title(i18n.global.t(to.meta.title as string))
  }
})
export default Router
