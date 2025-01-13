// import * as BABYLON from 'babylonjs'
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import BaseSceneManager from '../base/BaseSceneManager'
// import 'babylonjs-loaders'
import "@babylonjs/loaders/glTF"

export default class NamaqualandManager extends BaseSceneManager {
    constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement) {
        super(vcReadyObj, canvas)

        const button = document.createElement("button")
        button.style.top = "60px"
        button.style.left = "139px"
        button.textContent = "@Namaqualand"
        button.style.width = "116px"
        button.style.height = "33px"
        button.style.position = "absolute"
        button.style.color = "white"
        button.style.background = "rgba(0, 68, 82, 0.6)"
        button.style["border-radius"] = "30px"

        document.body.appendChild(button);

        button.addEventListener("click", () => {
            this.loadNamaqualand()
        })
    }

    public loadNamaqualand() {
        const engine = this.engine
        let dlCount = 0

        BABYLON.SceneLoader.Load("/datas/gltf/", "Namaqualand.glb", engine, 
            (scene) => {
                scene.executeWhenReady(() => {
                    scene.createDefaultCamera(true, true, true)
                    scene.createDefaultEnvironment({
                        createGround: false,
                        createSkybox: false
                    })

                    engine.runRenderLoop(() => {
                        /* this.vcReadyObj.viewer.render()
                        this.moveBabylonCamera()
                        this.scene.render() */
                        scene.render()
                    })

                    if (scene.activeCamera) {
                      scene.activeCamera.attachControl(this.canvas);
                    }
                })
            },
            (evt) => {
                if (evt.lengthComputable) {
                  engine.loadingUIText =
                    "Loading, please wait..." +
                    ((evt.loaded * 100) / evt.total).toFixed() +
                    "%";
                } else {
                  dlCount = evt.loaded / (1024 * 1024);
                  engine.loadingUIText =
                    "Loading, please wait..." +
                    Math.floor(dlCount * 100.0) / 100.0 +
                    " MB already loaded.";
                }
            }
        )

    }
}