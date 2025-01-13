// import * as BABYLON from 'babylonjs'
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import BaseSceneManager from '../base/BaseSceneManager'
// import 'babylonjs-loaders'
// import "@babylonjs/loaders/glTF"
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";

registerBuiltInLoaders();

export default class NamaqualandManager {
    private baseSceneManager: BaseSceneManager

    constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement) {
        this.baseSceneManager = BaseSceneManager.getInstance(vcReadyObj, canvas)

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
            this.load()

            const connection = this.baseSceneManager.RTCMC

            // disconnect with all users
            connection.getAllParticipants().forEach(function(pid) {
                connection.disconnectWith(pid);
            });
        
            // stop all local cameras
            connection.attachStreams.forEach(function(localStream) {
                localStream.stop();
            });
        
            // close socket.io connection
            connection.closeSocket();

            connection.onstream = (streamEvent) => {
                connection.setCustomSocketEvent('updatePosition');
                connection.socket.on('updatePosition', (playerPosition) => {
                if(this.baseSceneManager.otherPlayers[playerPosition.player]) {
                    this.baseSceneManager.otherPlayers[playerPosition.player].position = playerPosition.target
                }
                });
        
                connection.setCustomSocketEvent('updateRotation');
                connection.socket.on('updateRotation', (playerRotation) => {
                if(playerRotation.target == 'left') {
                    this.baseSceneManager.otherPlayers[playerRotation.player].rotation.z += Math.PI / 66;
                } else if(playerRotation.target == 'right') {
                    this.baseSceneManager.otherPlayers[playerRotation.player].rotation.z -= Math.PI / 66;
                }
                });
        
                connection.setCustomSocketEvent('movePOV');
                connection.socket.on('movePOV', (playerPosition) => {
                this.baseSceneManager.otherPlayers[playerPosition.player].movePOV(0, playerPosition.target.y, 0)
                });
            
                if(streamEvent.type === "local") {
                this.baseSceneManager.addPlayer(streamEvent.mediaElement, streamEvent.userid, true)
                } else {
                this.baseSceneManager.addPlayer(streamEvent.mediaElement, streamEvent.userid, false)
                }
            }

            connection.openOrJoin('GV-Namaqualand')
        })
    }

    public async load() {
        const engine = this.baseSceneManager.engine
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
                        scene.render()
                    })

                    if (scene.activeCamera) {
                      scene.activeCamera.attachControl(this.baseSceneManager.canvas);
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

        // await BABYLON.appendSceneAsync('/datas/gltf/Namaqualand.glb', this.baseSceneManager.scene)
        // await BABYLON.appendSceneAsync('/datas/gltf/Namaqualand/Namaqualand.gltf', this.baseSceneManager.scene)
        // await BABYLON.loadSceneAsync('/datas/gltf/Namaqualand.glb', this.baseSceneManager.engine)

    }
}