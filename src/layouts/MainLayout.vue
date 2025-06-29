<!--
 * @Author: zouyaoji@https://github.com/zouyaoji
 * @Date: 2021-12-14 16:36:31
 * @LastEditTime: 2025-06-26 23:34:06
 * @LastEditors: Henry Ma henryma@edening.cn
 * @Description:
 * @FilePath: \vue-cesium-demo\src\layouts\MainLayout.vue
-->
<template>
  <q-layout view="hHh Lpr fFf" class="main-layout" :class="{ 'gray-mode': grayActive }">
    <q-drawer
      v-if="asideMenus?.length && globalLayout.header"
      v-model="drawer"
      show-if-above
      :width="180"
      :breakpoint="500"
      bordered
      :mini="globalLayout.leftDrawerMini"
    >
      <q-list class="drawer-menu-list">
        <template v-for="(menuItem, index) in asideMenus" :key="index">
          <q-item
            v-ripple
            clickable
            active-class="menu-active-item"
            :active="menuItem.name === currentRouteName"
            :href="menuItem.href"
            :target="menuItem.target"
            @click="$router.push(menuItem.path)"
          >
            <q-item-section avatar>
              <q-icon :name="menuItem.icon" />
            </q-item-section>
            <q-item-section>
              {{ $t(menuItem.title) || menuItem.caption }}
            </q-item-section>
            <q-tooltip
              v-if="globalLayout.leftDrawerMini"
              transition-show="scale"
              transition-hide="scale"
              anchor="center right"
              self="center left"
            >
              {{ $t(menuItem.title) || menuItem.caption }}
            </q-tooltip>
          </q-item>
          <q-separator v-if="menuItem.separator" :key="'sep' + index" />
        </template>
      </q-list>
    </q-drawer>
    <!-- header -->
    <!-- <q-header v-if="globalLayout.header" elevated class="main-header-container">
      <main-header />
    </q-header> -->
    <q-page-container class="no-padding">
      <q-page class="interaction-root">
        <!-- vc-viewer -->
        <main-viewer>
          <!-- header -->
          <!-- <header v-show="globalLayout.header" elevated reveal class="absolute text-h4 text-center">
            <main-header />
          </header> -->
          <header v-if="globalLayout.header" elevated class="main-header-container text-h4 text-center text-white">
            <main-header />
          </header>
          <!-- overylay-content / router-view -->
          <div v-if="globalLayout.content" class="content">
            <main-interaction />
            <router-view />
          </div>
          <!-- footer -->
        </main-viewer>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { get } from 'lodash'
import MainHeader from '@src/layouts/header/Index.vue'
import MainInteraction from '@src/components/interaction/Index.vue'
import MainViewer from '@src/components/viewer/Index.vue'
import { pinia } from '@src/store'
import { store } from '@src/store'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { ThemeOptions } from '@src/types/theme'
import { AppFullscreen } from 'quasar'

defineOptions({
  name: 'VcDemoMainLayout'
})

const $route = useRoute()
// state
const globalLayout = storeToRefs(store.system.useLayoutStore()).global
const { active: grayActive } = storeToRefs(store.system.useGrayStore())
const menuStore = store.system.useMenuStore()

const drawer = ref(false)

// computed
const headerMenus = computed(() => {
  const header = menuStore.header
  return header.length ? header[0].children : []
})

const asideMenus = computed(() => {
  return menuStore.aside
})

const currentRouteName = computed(() => {
  return $route.name
})

const theme = computed<ThemeOptions>(() => {
  const themeStore = store.system.useThemeStore()
  return themeStore.themeConfig[themeStore.activeName]
})

// watch
watch(
  () => $route.matched,
  val => {
    if (val.length > 1) {
      const side = headerMenus.value.filter(menu => menu.path === val[1].path)
      if (side.length) {
        const children = side[0]?.children?.filter(v => v.type === 10)
        if (children?.length) {
          menuStore.asideSet(children)
        } else {
          menuStore.asideSet([])
        }
      } else {
        menuStore.asideSet([])
      }
    }
  },
  {
    immediate: true
  }
)

// lifecyle
onMounted(() => {
  // 用户登录后从本地数据库加载一系列的设置
  store.system.useAccountStore().load()
  window.onunhandledrejection = error => {
    store.system.useLogStore(pinia).push({
      message: get(error, 'reason.message', 'Unknown error'),
      type: 'danger',
      meta: {
        error: get(error, 'reason'),
        trace: get(error, 'reason.stack')
      }
    })
  }
  window.onerror = (event, source, lineno, colno, error) => {
    store.system.useLogStore(pinia).push({
      message: get(error, 'message', 'Unknown error'),
      type: 'danger',
      meta: {
        error,
        trace: get(error, 'stack'),
        source: `${source}@${lineno}:${colno}`,
        event: event
      }
    })
  }

  window.addEventListener('keydown', function (e) {
    if (e.code === 'F11') {
      e.preventDefault()
      AppFullscreen.toggle()
    }
  })
})
</script>
<style lang="scss" scoped>
.main-layout {
  width: 100%;
  overflow: hidden;

  ::v-deep(.q-page-container) {
    padding-top: 70px;
  }
  ::v-deep(.q-drawer) {
    // height: 350px;
    height: fit-content;
    top: 63px;
    left: 118px;
  }
  ::v-deep(.q-drawer--left) {
    background: var(--themeQMenuBackgroundColor);
  }
  &.gray-mode {
    -webkit-filter: grayscale(100%);
    -moz-filter: grayscale(100%);
    -ms-filter: grayscale(100%);
    -o-filter: grayscale(100%);
    filter: grayscale(100%);
    filter: gray;
  }

  .main-header-container {
    height: 50px;
    line-height: 50px;
    position: absolute;
    z-index: $z-fab + 20;
    pointer-events: none;
    width: 100%;
    background-color: v-bind('theme.header.themeHeaderContentBackgroundColor');
  }

  .drawer-menu-list {
    height: fit-content;
    overflow: hidden;
    color: v-bind('theme.menu.themeMenuColor') !important;
    .menu-active-item {
      color: v-bind('theme.menu.themeMenuActiveColor');
      font-size: 16px;
      // background-color: v-bind('theme.menu.themeMenuActiveBackgroundColor');
    }
  }

  .interaction-root {
    height: 100vh;
    position: relative;
    flex-basis: 100%;
  }
}
</style>
