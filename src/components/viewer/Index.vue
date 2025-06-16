<!--
 * @Author: zouyaoji@https://github.com/zouyaoji
 * @Date: 2022-01-04 16:12:47
 * @LastEditTime: 2025-06-16 15:41:46
 * @LastEditors: Henry Ma henryma@edening.cn
 * @Description:
 * @FilePath: \vue-cesium-demo\src\components\viewer\Index.vue
-->
<template>
  <vc-config-provider :locale="vclocale" :cesium-path="cesiumPath" :access-token="accesstToken">
    <vc-viewer ref="viewerRef" class="main-viewer" @ready="onViewerReady" @cesium-ready="onCesiumReady">
      <!-- 导航罗盘控件 -->
      <vc-navigation
        :offset="navOffset"
        :compass-opts="compassOpts"
        :zoom-opts="zoomOpts"
        :print-opts="printOpts"
        :location-opts="locationOpts"
        :other-opts="otherOpts"
      />
      <!-- 请求进度条 -->
      <vc-ajax-bar position="bottom" color="#21BA45" size="3px" positioning="fixed"></vc-ajax-bar>
      <!-- 动态渲染的数据 -->
      <!-- <dynamic-render-data></dynamic-render-data> -->
      <!-- 底图图层 & 叠加图层 -->
      <template v-for="(item, index) in layerList" :key="'layer' + index">
        <component :is="item.component" v-bind="item.props">
          <template v-for="(subItem, subIndex) in item?.children" :key="index + '_' + subIndex">
            <component :is="subItem.component" v-bind="subItem.props" />
          </template>
        </component>
      </template>
      <!-- 地形图层 -->
      <template v-for="(item, index) in terrainLayers" :key="'terrain' + index">
        <component :is="item.component" v-if="item.props.show" v-bind="item.props" />
      </template>
      <!-- 名称 overlay -->
      <vc-overlay-html
        v-if="mouseOverNameOpts.show"
        :position="mouseOverNameOpts.position"
        :pixel-offset="mouseOverNameOpts.pixelOffset"
      >
        <div class="vc-drawtip vc-tooltip--style">
          {{ mouseOverNameOpts.text }}
        </div>
      </vc-overlay-html>
      <slot />
    </vc-viewer>
  </vc-config-provider>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router'
import useTimeout from 'vue-cesium/es/composables/private/use-timeout'
import { ref, computed } from 'vue'
import { store } from '@src/store'
import {
  VcCompassProps,
  VcConfigProvider,
  VcMyLocationProps,
  VcPrintProps,
  VcViewerRef,
  VcZoomControlProps
} from 'vue-cesium'
import { useI18n } from 'vue-i18n'
import DynamicRenderData from '../dynamic-render-data'
import enUS from 'vue-cesium/es/locale/lang/en-us'
import zhCN from 'vue-cesium/es/locale/lang/zh-hans'
import { ThemeOptions } from '@src/types/theme'
import { VcNavigationOtherOpts } from 'vue-cesium/es/components/controls/navigation/defaultProps'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import BaseSceneManager from '@src/common/SceneManager/base/BaseSceneManager1'
import NamaqualandManager from '@src/common/SceneManager/namaqualand/NamaqualandManager'
import WCafeManager from '@src/common/SceneManager/wcafe/WCafeManager'
import IslandManager from '@src/common/SceneManager/island/IslandManager'
import MRSalaManager from '@src/common/SceneManager/mr_sala/MRSalaManager'
import MROneOneManager from '@src/common/SceneManager/mr_oneone/MROneOneManager'
import ConZugdidiManager from '@src/common/SceneManager/con/Con_ZugdidiManager'

import OfficeManager from '@src/common/SceneManager/office/OfficeManager'

defineOptions({
  name: 'VcDemoViewer'
})

const route = useRoute()

const language = {
  'en-US': enUS,
  'zh-CN': zhCN
}
const { locale } = useI18n()
const cesiumPath = import.meta.env.VITE_VUE_CESIUMJS_PATH
const accesstToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5Y2U0ZTk2Ni1jNzdkLTQ3OWYtYjVmYS0yMGM3YTk3NjgzMmUiLCJpZCI6Njk5Nywic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0ODA1MTc0OH0.Csy6yyAnv6JSBppH0Ou3ahshqcHFEhP27iOz5gjQMEo'
const emit = defineEmits(['viewerReady', 'cesiumReady', 'leftClick', 'destroyed'])
const vclocale = computed(() => {
  return language[locale.value]
})

// state
const themeStore = store.system.useThemeStore()
const theme = computed<ThemeOptions>(() => {
  return themeStore.themeConfig[themeStore.activeName]
})

const { toggleGlobalLayout } = store.system.useLayoutStore()

const { registerTimeout } = useTimeout()
const viewerRef = ref<VcViewerRef>(null)
const navOffset = ref<[number, number]>([0, 75])

const compassOpts = computed<VcCompassProps>(() => {
  return {
    outerOptions: {
      icon: theme.value.navigation.themeVcCompassOuterIcon,
      color: theme.value.navigation.themeVcCompassOuterColor
    },
    innerOptions: {
      icon: theme.value.navigation.themeVcCompassInnerIcon,
      color: theme.value.navigation.themeVcCompassInnerColor,
      background: theme.value.navigation.themeVcCompassInnerBackgroundColor
    },
    markerOptions: {
      color: theme.value.global.themeColorAlpha
    },
    duration: 5
  }
})

const zoomOpts = computed<VcZoomControlProps>(() => {
  return {
    background: theme.value.navigation.themeVcZoomControlBackgroundColor,
    color: theme.value.global.themeColor,
    border: `solid 1px ${theme.value.commonPanel.themeCommonPanelListBorderColor}`,
    zoomInOptions: {
      color: theme.value.global.themeColor
    },
    zoomOutOptions: {
      color: theme.value.global.themeColor
    },
    zoomResetOptions: {
      color: theme.value.global.themeColor
    }
  }
})

const printOpts = computed<VcPrintProps>(() => {
  return {
    color: theme.value.global.themeColor,
    background: theme.value.navigation.themeVcPrintBackgroundColor,
    round: true
  }
})

const locationOpts = computed<VcMyLocationProps>(() => {
  return {
    color: theme.value.global.themeColor,
    background: theme.value.navigation.themeVcPrintBackgroundColor,
    round: true
  }
})

const otherOpts = computed<VcNavigationOtherOpts>(() => {
  return {
    position: 'bottom-right',
    offset: [0, 10],
    statusBarOpts: {
      color: theme.value.global.themeColor,
      background: theme.value.navigation.themeVcStatusBarBackgroundColor
    },
    distancelegendOpts: {
      color: theme.value.global.themeColor,
      background: theme.value.navigation.themeVcDistanceLegendBackgroundColor
    }
  }
})

const mouseOverNameOpts = store.viewer.useOverlayStore().mouseOverNameOpts
const selectedRenderData = store.viewer.useRenderStore().selectedRenderData

// computed
const layerList = computed(() => [
  ...store.viewer.useLayerStore().baseLayers,
  ...store.viewer.useLayerStore().overlayLayers
])
const terrainLayers = computed(() => store.viewer.useLayerStore().terrainLayers)

// const canvas = document.getElementById('babylonCanvas');
const canvas = document.getElementsByTagName('canvas')[0]

// methods
const onViewerReady = (readyObj: VcReadyObject) => {
  emit('viewerReady', readyObj)

  toggleGlobalLayout({
    header: true
  })
  registerTimeout(() => {
    toggleGlobalLayout({
      content: true
    })
  }, 500)

  let baseSceneManager = new BaseSceneManager()
  baseSceneManager.initialize(readyObj, canvas)

  BaseSceneManager.createButton('@Island', '3px', '60px', '86px', () => {
    baseSceneManager.loadScene('/datas/gltf/Island/', 'island.glb', 'GV-Island', 'babylon', false, 0, 31.168)
  })

  const wCafeManager = new WCafeManager()
  BaseSceneManager.createButton('@WCafe', '3px', '95px', '86px', () => {
    wCafeManager.loadScene('/datas/babylon/WCafe/', 'WCafe.babylon', 'GV-WCafe', 'wCafe', true)
  })
  BaseSceneManager.createModel('/datas/gltf/villa.glb', 1, {
    LNG: 120.07 + 0.0003,
    LAT: 30.27,
    ALT: 0
  })
  BaseSceneManager.registerPickHandler('villa', canvas, () =>
    wCafeManager.loadScene('/datas/babylon/WCafe/', 'WCafe.babylon', 'GV-WCafe', 'wCafe', true)
  )

  const salaManager = new MRSalaManager()
  BaseSceneManager.createButton('@MR_Sala', '3px', '130px', '89px', () => {
    salaManager.loadScene('/datas/gltf/MR/', 'Sala de jantar.glb', 'GV-MR_Sala', 'babylon', false, 0, 3.168)
  })
  BaseSceneManager.createModel('/datas/gltf/MR/Contemporary.glb', 1, {
    LNG: 120.07 - 0.0006,
    LAT: 30.27,
    ALT: 0
  })
  BaseSceneManager.registerPickHandler('Contemporary', canvas, () =>
    salaManager.loadScene('/datas/gltf/MR/', 'Sala de jantar.glb', 'GV-MR_Sala', 'babylon', false, 0, 3.168)
  )

  const oneOneManager = new MROneOneManager()
  BaseSceneManager.createButton('@MR_OneOne', '3px', '165px', '116px', () => {
    oneOneManager.loadScene('/datas/gltf/MR/', 'OneOne.glb', 'GV-MR_OneOne', 'babylon', false, 0, 3.168)
  })
  BaseSceneManager.createModel('/datas/gltf/MR/LowPolyHouse.glb', 1, {
    LNG: 120.07,
    LAT: 30.27,
    ALT: 0
  })
  BaseSceneManager.registerPickHandler('LowPolyHouse', canvas, () =>
    oneOneManager.loadScene('/datas/gltf/MR/', 'OneOne.glb', 'GV-MR_OneOne', 'babylon', false, 0, 3.168)
  )

  const zugdidiManager = new ConZugdidiManager()
  BaseSceneManager.createButton('@Con_Zugdidi', '3px', '200px', '116px', () => {
    zugdidiManager.loadScene('/datas/gltf/Con/', 'zugdidi.glb', 'GV-Con_Zugdidi', 'babylon', false, 0, 3.168)
  })

  if (route.path.includes('/office/')) {
    const officeId = route.params.officeId
    setTimeout(() => {
      // alert('officeId: ' + route.params.officeId)
      // new OfficeManager(readyObj, canvas, officeId)
      const officeManager = new OfficeManager()
      officeManager.loadScene('/datas/gltf/Office/', 'Office.glb', 'GV-Office-' + officeId, 'babylon', false, 0, 3.168)
    }, 6333)
  }
}

const onCesiumReady = readyObj => {
  emit('cesiumReady', readyObj)

  // console.log(readyObj);
}

const onLeftClick = e => {
  emit('leftClick', e)
}

const onDestroyed = e => {
  emit('destroyed', e)
  // 球销毁了头部和路由都隐藏
  toggleGlobalLayout({
    content: false,
    header: false,
    layerManager: false,
    footer: false,
    featureInfo: false
  })
  // 销毁名称 overlay
  // clearMouseOverlayLabel()
}
</script>
