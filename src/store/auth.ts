/*
 * @Author: Henry Ma henryma@edening.cn
 * @Date: 2025-01-14 14:27:54
 * @LastEditors: Henry Ma henryma@edening.cn
 * @LastEditTime: 2025-01-16 12:07:29
 * @FilePath: /GlobalVillage/src/store/auth.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Provider } from '@supabase/supabase-js'
import { useUserStore } from './system/user'
import * as webStorage from '@src/utils/web-storage'

interface User {
  email: string
  id: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    if (data.user) {
      user.value = {
        email: data.user.email!,
        id: data.user.id
      }
      isAuthenticated.value = true
    }
  }

  async function loginWithOAuth(provider: Provider) {

    /* const session = await supabase.auth.getSession()
    alert('session: ' + JSON.stringify(session))

    const user = await supabase.auth.getUser()
    alert('user: ' + JSON.stringify(user)) */

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    // alert('loginWithOAuth: ' + JSON.stringify(data))

    const session = await supabase.auth.getSession()
    alert('session: ' + JSON.stringify(session))

    const user = await supabase.auth.getUser()
    alert('user: ' + JSON.stringify(user))

    if (data) {
      console.log('loginUser: ', JSON.stringify(data.user))

      return data.user
    }

    if (error) throw error
  }

  async function register(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error

    if (data.user) {
      user.value = {
        email: data.user.email!,
        id: data.user.id
      }
      isAuthenticated.value = true
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    user.value = null
    isAuthenticated.value = false
  }

  // Initialize auth state
  supabase.auth.onAuthStateChange((event, session) => {
    // alert('onAuthStateChange: ' + event + ' ' + JSON.stringify(session))

    if (session?.user) {
        const userInfo = session.user
        webStorage.setLocalStorage('token', session.provider_token)
        webStorage.setLocalStorage('uuid', userInfo.id)
        const userStore = useUserStore()
        userStore.set({
          ...userInfo
        })

      user.value = {
        email: session.user.email!,
        id: session.user.id
      }
      isAuthenticated.value = true
    } else {
      user.value = null
      isAuthenticated.value = false
    }
  })

  return {
    user,
    isAuthenticated,
    login,
    loginWithOAuth,
    register,
    logout
  }
})
