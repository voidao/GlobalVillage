import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import BaseSceneManager from '../base/BaseSceneManager'
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import HavokPhysics from '@babylonjs/havok';

registerBuiltInLoaders();

export default class WCafeManager {
    private baseSceneManager: BaseSceneManager
    private wCafeScene: BABYLON.Scene

    private addWCafePlayer(video: HTMLVideoElement, userid: string, self: boolean) {
        // map face UVs to draw text only on top of cylinder
        var faceUV = [];
        faceUV[0] =	new BABYLON.Vector4(0, 0, 1, 1); // use only the first pixel (which has no text, just the background color)
        faceUV[1] =	new BABYLON.Vector4(0, 0, 0, 0); // use onlly the first pixel
        faceUV[2] = new BABYLON.Vector4(0, 0, 1, 1); // use the full texture    
        
        var videoFigure = BABYLON.MeshBuilder.CreateCylinder("player-" + video.id, 
            {height: 0.09, diameter: 0.68, diameterBottom: 0.73, faceUV: faceUV, tessellation: 68},
            this.wCafeScene);
        videoFigure.id = userid;
      
        videoFigure.rotation.z = Math.PI
        videoFigure.rotation.y = 9 * Math.PI / 6
        videoFigure.rotation.x = 3 * Math.PI / 6
      
        videoFigure.material = this.baseSceneManager.prepareMaterial(video, this.wCafeScene)
      
        // videoFigure.subMeshes = [];
        const verticesCount = videoFigure.getTotalVertices();
        
        new BABYLON.SubMesh(1, 0, verticesCount, 0, 613, videoFigure)
      
        if(self) {
          videoFigure.position = new BABYLON.Vector3(-61 - 3 * Math.random(), 1.693, 0.316 - Math.random())
          
          this.baseSceneManager.myPlayer = videoFigure;
          this.baseSceneManager.myPlayer.parent = this.wCafeScene.activeCamera;
      
          this.baseSceneManager.positionBroadcasterID = setInterval(() => {
            if(this.baseSceneManager.RTCMC) {
              this.baseSceneManager.updatePosition()
            }
          }, 3000);
        } else {
          videoFigure.position = new BABYLON.Vector3(-61, 0.327, 0.316)
          this.baseSceneManager.otherPlayers[userid] = videoFigure;
        }

        const videoFigureAggregate = new BABYLON.PhysicsAggregate(videoFigure, 
            BABYLON.PhysicsShapeType.CYLINDER, 
            {mass: 1, restitution: 0.75}, 
            this.wCafeScene)
        videoFigureAggregate.body.disablePreStep = false

        let joint = new BABYLON.DistanceConstraint(0.8, this.wCafeScene)

        videoFigureAggregate.body.setMassProperties( {inertia: new BABYLON.Vector3(0, 0, 0) } )  // So that the body won't rotate.

        videoFigureAggregate.body.setCollisionCallbackEnabled(true)
        const observable = videoFigureAggregate.body.getCollisionObservable()
        const observer = observable.add((event) => {
            console.log(event.type)
            if(event.type === 'COLLISION_STARTED') {
                event.collider.addConstraint(event.collidedAgainst, joint)
                setTimeout(() => joint.dispose(), 100)
            }
        })

        /* videoFigureAggregate.body.setCollisionEndedCallbackEnabled(true)
        const observable1 = videoFigureAggregate.body.getCollisionEndedObservable()
        const observer1 = observable1.add((event) => {
            if(event.type === 'COLLISION_FINISHED') {
                console.log(event.type)
                event.collider.transformNode.rotation.z = Math.PI
                event.collider.transformNode.rotation.y = 9 * Math.PI / 6
                event.collider.transformNode.rotation.x = 3 * Math.PI / 6

                event.collidedAgainst.transformNode.rotation.z = Math.PI
                event.collidedAgainst.transformNode.rotation.y = 9 * Math.PI / 6
                event.collidedAgainst.transformNode.rotation.x = 3 * Math.PI / 6
            }
        }) */
    }

    constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement) {
        this.baseSceneManager = BaseSceneManager.getInstance(vcReadyObj, canvas)

        const button = document.createElement("button")
        button.style.top = "60px"
        button.style.left = "228px"
        button.textContent = "@WCafe"
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
                    // otherPlayers[playerPosition.player].position = playerPosition.target
                    otherPlayers[playerPosition.player].position.x = playerPosition.target._x
                    otherPlayers[playerPosition.player].position.y = playerPosition.target._y
                    otherPlayers[playerPosition.player].position.z = playerPosition.target._z
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
                this.addWCafePlayer(streamEvent.mediaElement, streamEvent.userid, true)
            } else {
                this.addWCafePlayer(streamEvent.mediaElement, streamEvent.userid, false)
            }
        }

        connection.openOrJoin('GV-WCafe')
    }

    public async load() {
        const engine = this.baseSceneManager.engine
        let dlCount = 0

        BABYLON.SceneLoader.Load("/datas/babylon/WCafe/", "WCafe.babylon", engine, 
            (scene) => {
                scene.executeWhenReady(async() => {
                    // scene.forceWireframe = true
                    // scene.forceShowBoundingBoxes = true
                    // scene.debugLayer.show()

                    const havokInstance = await HavokPhysics()
                    const hk = new BABYLON.HavokPlugin(true, havokInstance)
                    scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), hk)

                    if (scene.activeCamera) {
                      scene.activeCamera.attachControl(this.baseSceneManager.canvas);
                    }

                    this.wCafeScene = scene

                    engine.runRenderLoop(() => {
                        this.wCafeScene.render()
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
        
        // await BABYLON.appendSceneAsync('/datas/babylon/WCafe/WCafe.babylon', this.baseSceneManager.scene)
        // await BABYLON.loadSceneAsync('/datas/babylon/WCafe/WCafe.babylon', engine)
    }
}