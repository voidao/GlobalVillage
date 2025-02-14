/*
 * @Author: Henry Ma henryma@edening.cn
 * @Date: 2025-01-03 14:21:17
 * @LastEditors: Henry Ma henryma@edening.cn
 * @LastEditTime: 2025-02-14 11:53:06
 * @FilePath: /GlobalVillage/src/common/SceneManager/island/IslandManager.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import BaseSceneManager from '../base/BaseSceneManager'
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic'

registerBuiltInLoaders()

export default class IslandManager {
    private baseSceneManager: BaseSceneManager
    private islandScene: BABYLON.Scene

    constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement) {
        this.baseSceneManager = BaseSceneManager.getInstance(vcReadyObj, canvas)

        this.baseSceneManager.createButton('@Island', '139px', '86px', () => {
            this.load()
        })
    }

    public async load() {
        const engine = this.baseSceneManager.engine
        let dlCount = 0

        BABYLON.SceneLoader.Load('/datas/gltf/Island/', 'island.glb', engine,
            scene => {
                scene.executeWhenReady(() => {
                    // scene.debugLayer.show()

                    scene.createDefaultCamera(true, true, true)
                    scene.createDefaultEnvironment({
                        createGround: false,
                        createSkybox: false
                    })

                    if (scene.activeCamera) {
                      scene.activeCamera.attachControl(this.baseSceneManager.canvas)
                      scene.activeCamera.alpha = 0
                      scene.activeCamera.radius = 31.168
                    }

                    this.islandScene = scene

                    engine.runRenderLoop(() => {
                        this.islandScene.render()
                    })

                    this.baseSceneManager.enter('GV-Island', 'babylon', this.islandScene)
                })
            },
            evt => {
                if (evt.lengthComputable) {
                  engine.loadingUIText =
                    'Loading, please wait...' +
                    ((evt.loaded * 100) / evt.total).toFixed() +
                    '%'
                } else {
                  dlCount = evt.loaded / (1024 * 1024)
                  engine.loadingUIText =
                    'Loading, please wait...' +
                    Math.floor(dlCount * 100.0) / 100.0 +
                    ' MB already loaded.'
                }
            }
        )
    }
}
