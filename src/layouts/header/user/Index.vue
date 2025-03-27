<!--
 * @Author: zouyaoji@https://github.com/zouyaoji
 * @Date: 2022-01-04 15:23:46
 * @LastEditTime: 2025-03-24 17:12:00
 * @LastEditors: Henry Ma henryma@edening.cn
 * @Description:
 * @FilePath: \vue-cesium-demo\src\layouts\header\user\Index.vue
-->
<template>
  <q-chip
    v-if="$route.name !== 'login'"
    dense
    rounded
    no-caps
    size="md"
    class="q-mr-sm cursor-pointer"
    auto-close
    icon="person"
    :label="user.info?.username || user.info?.user_metadata?.name || 'Guest'"
  >
    <q-menu>
      <q-list dense>
        <q-item v-close-popup clickable dense @click="onItemClick">
          <q-item-section avatar>
            <q-avatar icon="logout" />
          </q-item-section>
          <q-item-section>
            <q-item-label>LogOut</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-if="user.info?.user_metadata?.email" v-close-popup clickable dense @click="enterOffice">
          <q-item-section avatar>
            <q-avatar icon="logout" />
          </q-item-section>
          <q-item-section>
            <q-item-label>My Office</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-chip>
</template>

<script lang="ts" setup>
import { store } from '@src/store'
import { useVueCesium } from 'vue-cesium'
import { flyToCamera } from 'vue-cesium/es/utils/cesium-helpers'
import { renderData } from '@src/utils'
import router from '@src/router'

const { toggleGlobalLayout } = store.system.useLayoutStore()
const { loadDefaultLayers } = store.viewer.useLayerStore()
const user = store.system.useUserStore()
const $vc = useVueCesium()

const onItemClick = () => {
  store.system
    .useAccountStore()
    .logout({
      confirm: true
    })
    .then(isLogout => {
      if (isLogout) {
        // 注销后默认显示的图层
        loadDefaultLayers(false)

        toggleGlobalLayout({ featureInfo: false, layerManager: false })

        renderData.removeAllRenderData()

        const cameraOptions = {
          position: [105, 30, 21634101],
          heading: 360,
          pitch: -90,
          roll: 0
        }
        $vc?.viewer &&
          flyToCamera($vc?.viewer, cameraOptions, {
            duration: 3
          })
      }
    })
}

const enterOffice = () => {
  // alert('Entering My Office...' + user.info?.id)
  router.push('/office/' + user.info?.id)
  setTimeout(() => window.location.reload(), 333)
}
</script>
