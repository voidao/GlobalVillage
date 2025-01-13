import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import BaseSceneManager from '../base/BaseSceneManager'
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";

registerBuiltInLoaders();

export default class IslandManager {
    private baseSceneManager: BaseSceneManager
    private islandScene: BABYLON.Scene

    private addIslandPlayer(video: HTMLVideoElement, userid: string, self: boolean) {
      
        // map face UVs to draw text only on top of cylinder
        var faceUV = [];
        faceUV[0] =	new BABYLON.Vector4(0, 0, 1, 1); // use only the first pixel (which has no text, just the background color)
        faceUV[1] =	new BABYLON.Vector4(0, 0, 0, 0); // use onlly the first pixel
        faceUV[2] = new BABYLON.Vector4(0, 0, 1, 1); // use the full texture    
        
        var videoFigure = BABYLON.MeshBuilder.CreateCylinder("player-" + video.id, 
            {height: 0.09, diameter: 0.68, diameterBottom: 0.73, faceUV: faceUV, tessellation: 68},
            this.islandScene);
        videoFigure.id = userid;
      
        videoFigure.rotation.z = Math.PI;
        videoFigure.rotation.y = 9 * Math.PI / 6;
        videoFigure.rotation.x = 3 * Math.PI / 6;
      
        videoFigure.material = this.baseSceneManager.prepareMaterial(video, this.islandScene);
      
        // videoFigure.subMeshes = [];
        const verticesCount = videoFigure.getTotalVertices();
        
        new BABYLON.SubMesh(1, 0, verticesCount, 0, 613, videoFigure)
      
        if(self) {
          videoFigure.position = new BABYLON.Vector3(1.08 - 3 * Math.random(), 3.33, 1.27 - 3 * Math.random())
          
          this.baseSceneManager.myPlayer = videoFigure;
          this.baseSceneManager.myPlayer.parent = this.islandScene.activeCamera;
      
          this.baseSceneManager.positionBroadcasterID = setInterval(() => {
            if(this.baseSceneManager.RTCMC) {
              this.baseSceneManager.updatePosition()
            }
          }, 3000);
        } else {
          videoFigure.position = new BABYLON.Vector3(-61, 0.327, 0.316)
          this.baseSceneManager.otherPlayers[userid] = videoFigure;
        }
    }

    constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement) {
        this.baseSceneManager = BaseSceneManager.getInstance(vcReadyObj, canvas)

        const button = document.createElement("button")
        button.style.top = "60px"
        button.style.left = "139px"
        button.textContent = "@Island"
        button.style.width = "86px"
        button.style.height = "33px"
        button.style.position = "absolute"
        button.style.color = "white"
        button.style.background = "rgba(0, 68, 82, 0.6)"
        button.style["border-radius"] = "30px"

        document.body.appendChild(button);

        button.addEventListener("click", () => {
            this.load()
        })
    }

    public enter() {
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
            const otherPlayers = this.baseSceneManager.otherPlayers
        
            connection.setCustomSocketEvent('updatePosition');
            connection.socket.on('updatePosition', (playerPosition) => {
                if(otherPlayers[playerPosition.player]) {
                    otherPlayers[playerPosition.player].position = playerPosition.target
                }
            });
        
            connection.setCustomSocketEvent('updateRotation');
            connection.socket.on('updateRotation', (playerRotation) => {
                if(playerRotation.target == 'left') {
                    otherPlayers[playerRotation.player].rotation.z += Math.PI / 66;
                } else if(playerRotation.target == 'right') {
                    otherPlayers[playerRotation.player].rotation.z -= Math.PI / 66;
                }
            });
        
            if(streamEvent.type === "local") {
                this.addIslandPlayer(streamEvent.mediaElement, streamEvent.userid, true)
            } else {
                this.addIslandPlayer(streamEvent.mediaElement, streamEvent.userid, false)
            }
        }

        connection.openOrJoin('GV-Island')
    }

    public async load() {
        const engine = this.baseSceneManager.engine
        let dlCount = 0

        BABYLON.SceneLoader.Load("/datas/gltf/Island/", "island.glb", engine, 
            (scene) => {
                scene.executeWhenReady(() => {
                    // scene.debugLayer.show()

                    scene.createDefaultCamera(true, true, true)
                    scene.createDefaultEnvironment({
                        createGround: false,
                        createSkybox: false
                    })

                    if (scene.activeCamera) {
                      scene.activeCamera.attachControl(this.baseSceneManager.canvas);
                      scene.activeCamera.alpha = 0
                      scene.activeCamera.radius = 31.168
                    }

                    this.islandScene = scene

                    engine.runRenderLoop(() => {
                        this.islandScene.render()
                    })

                    this.enter()
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