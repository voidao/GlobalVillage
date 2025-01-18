<!--
 * @Author: Henry Ma henryma@edening.cn
 * @Date: 2025-01-14 14:54:55
 * @LastEditors: Henry Ma henryma@edening.cn
 * @LastEditTime: 2025-01-17 11:16:33
 * @FilePath: /GlobalVillage/src/pages/system/AuthCallback.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!--
 * @Author: Henry Ma henryma@edening.cn
 * @Date: 2025-01-14 14:54:55
 * @LastEditors: Henry Ma henryma@edening.cn
 * @LastEditTime: 2025-01-16 20:39:29
 * @FilePath: /GlobalVillage/src/pages/system/AuthCallback.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { useUserStore } from '../../store/system/user'
import * as webStorage from '../../utils/web-storage'

const router = useRouter()

onMounted(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    // alert('OAuth Callback: ' + event + ' ' + JSON.stringify(session))
    if (event === 'SIGNED_IN' && session) {
      if (session?.user) {
        const userInfo = session.user
        webStorage.setLocalStorage('token', session.provider_token)
        webStorage.setLocalStorage('uuid', userInfo.id)
        const userStore = useUserStore()
        userStore.set({
          ...userInfo
        })
      } else {
        console.log('session?.user is null')
      }
      router.push('/home')
    }
  })
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h2 class="text-2xl font-semibold mb-4">Completing sign in...</h2>
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
    </div>
  </div>
</template>
