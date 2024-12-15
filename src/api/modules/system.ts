/*
 * @Author: zouyaoji@https://github.com/zouyaoji
 * @Date: 2021-09-06 17:58:31
 * @LastEditTime: 2024-01-26 14:43:10
 * @LastEditors: zouyaoji 370681295@qq.com
 * @Description:
 * @FilePath: \vue-cesium-demo\src\api\modules\system.ts
 */
import { v4 as uuidv4 } from 'uuid'
import { find, assign } from 'lodash'
import qs from 'qs'
import * as webStorage from '@src/utils/web-storage'
import router from '@src/router'

export type Menu = {
  id: string
  component: string
  icon: string
  islock: boolean
  hidden: boolean
  name: string
  path: string
  href?: string
  target?: string
  permission?: string
  sort: number
  title: string
  caption?: string
  type: number
  redirect?: string
  children?: Array<Menu>
}

const users = [
  { username: 'admin', password: 'admin', id: 'admin-uuid', name: 'Admin' },
  { username: 'editor', password: 'editor', id: 'editor-uuid', name: 'Editor' },
  { username: 'henry', password: 'henry', id: 'henry-uuid', name: 'Henry' },
  { username: 'sam', password: 'sam', id: 'sam-uuid', name: 'Sam' },
  { username: 'mark', password: 'mark', id: 'mark-uuid', name: 'Mark' }
]

const menus: Array<Menu> = [
  {
    id: uuidv4(),
    component: 'MainLayout',
    icon: 'cog',
    islock: false,
    hidden: false,
    name: 'layout',
    path: '/',
    sort: 1000,
    title: 'GlobalVillage',
    type: 10,
    children: [
      {
        id: uuidv4(),
        component: '/home',
        icon: 'cog',
        islock: false,
        hidden: false,
        name: 'home',
        path: '/home',
        sort: 1000,
        caption: 'Home',
        title: 'message.header.index',
        type: 10,
        children: [
          {
            id: uuidv4(),
            component: '',
            icon: 'eye',
            islock: false,
            hidden: false,
            name: 'left-panel',
            path: '',
            sort: 100101,
            title: '查看左侧面板',
            type: 20
          }
        ]
      },
      /* {
        id: uuidv4(),
        component: '/dynamic-render',
        icon: 'cog',
        islock: false,
        hidden: false,
        name: 'dynamic-render',
        path: '/dynamic-render',
        sort: 1000,
        caption: 'Create',
        title: 'message.header.dynamicRender',
        type: 10,
        redirect: '/dynamic-render/recursive-list',
        children: [
          {
            id: uuidv4(),
            component: '/dynamic-render/recursive-list',
            icon: 'list',
            islock: false,
            hidden: false,
            name: 'recursive-list',
            path: '/dynamic-render/recursive-list',
            sort: 1000,
            caption: 'dynamicRender',
            title: 'message.sideBar.dynamicRender.recursiveList',
            type: 10
          },
          {
            id: uuidv4(),
            component: '/dynamic-render/stack',
            icon: 'view_module',
            islock: false,
            hidden: false,
            name: 'stack',
            path: '/dynamic-render/stack',
            sort: 1000,
            caption: 'dynamicRender',
            title: 'message.sideBar.dynamicRender.stack',
            type: 10
          },
          {
            id: uuidv4(),
            component: '/dynamic-render/historical-track',
            icon: 'route',
            islock: false,
            hidden: false,
            name: 'historical-track',
            path: '/dynamic-render/historical-track',
            sort: 1000,
            caption: 'dynamicRender',
            title: 'message.sideBar.dynamicRender.historicalTrack',
            type: 10
          }
        ]
      }, */
      {
        id: uuidv4(),
        component: '/create',
        icon: 'cog',
        islock: false,
        hidden: false,
        name: 'create',
        path: '/create',
        sort: 1000,
        caption: 'Create',
        title: 'message.header.create',
        type: 10,
        redirect: '/create/tbd',
        children: [
          {
            id: uuidv4(),
            component: '/create/tbd',
            icon: 'holiday_village',
            islock: false,
            hidden: false,
            name: 'tbd',
            path: '/create/tbd',
            sort: 1000,
            caption: 'ComingSoon',
            title: 'message.sideBar.create.tbd',
            type: 10
          }
        ]
      },
      {
        id: uuidv4(),
        component: '/happiness',
        icon: 'cog',
        islock: false,
        hidden: false,
        name: 'happiness',
        path: '/happiness',
        sort: 1000,
        caption: 'Happiness',
        title: 'message.header.happiness',
        type: 10,
        redirect: '/happiness/hsa',
        children: [
          {
            id: uuidv4(),
            component: '/happiness/hsa',
            icon: 'sentiment_very_satisfied',
            islock: false,
            hidden: false,
            name: 'hsa',
            path: '/happiness/hsa',
            href: 'https://www.happinessstudies.academy',
            target: '_blank',
            sort: 1000,
            caption: 'HappinessStudiesAcademy',
            title: 'message.sideBar.happiness.hsa',
            type: 10
          }
        ]
      }
    ]
  }
]

export default ({ service, request, serviceForMock, requestForMock, mock, tools }) => ({
  /**
   * @description 登录
   * @param {Object} data 登录携带的信息
   */
  login(data) {
    if (import.meta.env.VITE_MOCK_ENABLED !== 'true') {
      return request({
        headers: {
          Authorization: 'Basic ---',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        url: '/auth/login',
        method: 'post',
        data: qs.stringify(data)
      })
    }
    // 模拟数据
    mock.onAny('/auth/login').reply(config => {
      const data = tools.parse(config.data)
      const user = find(users, {
        username: data.username,
        password: data.password
      })
      return user
        ? tools.responseSuccess(assign({}, user, { token: 'f5befe1a-962c-4cdd-bf45-77ce306dbbce' }))
        : tools.responseError({}, 'Wrong Account or Password!')
    })
    // 接口请求
    return requestForMock({
      url: '/auth/login',
      method: 'post',
      data
    })
  },
  /**
   * 获取用户信息
   * @returns 返回用户信息
   */
  getUserInfo() {
    if (import.meta.env.VITE_MOCK_ENABLED !== 'true') {
      return request({
        url: '/user/info',
        method: 'get'
      })
    }
    // 模拟数据
    mock.onAny('/user/info').reply(config => {
      const uuid = webStorage.getLocalStorage('uuid')
      const user = find(users, {
        id: uuid
      })
      if (user) {
        return tools.responseSuccess(assign({}, user))
      } else {
        webStorage.removeLocalStorage('token')
        webStorage.removeLocalStorage('uuid')
        router.push('/login')
        return tools.responseError({}, 'Please Login!')
      }
    })
    // 接口请求
    return requestForMock({
      url: '/user/info',
      method: 'post'
    })
  },
  /**
   * @description 获取有权限的菜单
   * @param {Object} data
   */
  getAccessibleMenus(data = {}) {
    if (import.meta.env.VITE_MOCK_ENABLED !== 'true') {
      return request({
        url: '/api/menu/accessible',
        method: 'post',
        data
      })
    }
    // 模拟数据
    mock.onAny('/api/menu/accessible').reply(config => {
      return tools.responseSuccess(menus)
    })
    // 接口请求
    return requestForMock({
      url: '/api/menu/accessible',
      method: 'post',
      data
    })
  }
})
