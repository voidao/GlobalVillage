import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import BaseSceneManager from '../base/BaseSceneManager'
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import HavokPhysics from '@babylonjs/havok';

registerBuiltInLoaders();

export default class MRSalaManager {
    private baseSceneManager: BaseSceneManager
    private salaScene: BABYLON.Scene
    private rotationBroadcastID: number

    private updateSeatRotation(direction: string) {
        this.baseSceneManager.RTCMC.socket.emit('updateSeatRotation', {
            player: this.baseSceneManager.myPlayer.id,
            target: direction
        });
    }

    private addSalaPlayer(video: HTMLVideoElement, userid: string, self: boolean) {
        // map face UVs to draw text only on top of cylinder
        var faceUV = [];
        faceUV[0] =	new BABYLON.Vector4(0, 0, 1, 1); // use only the first pixel (which has no text, just the background color)
        faceUV[1] =	new BABYLON.Vector4(0, 0, 0, 0); // use onlly the first pixel
        faceUV[2] = new BABYLON.Vector4(0, 0, 1, 1); // use the full texture    
        
        var videoFigure = BABYLON.MeshBuilder.CreateCylinder("player-" + video.id, 
            {height: 0.06, diameter: 0.39, diameterBottom: 0.43, faceUV: faceUV, tessellation: 68},
            this.salaScene);
        videoFigure.id = userid;
      
        videoFigure.rotation.z = Math.PI
        videoFigure.rotation.y = 9 * Math.PI / 6
        videoFigure.rotation.x = 3 * Math.PI / 6
      
        videoFigure.material = this.baseSceneManager.prepareMaterial(video, this.salaScene)
      
        // videoFigure.subMeshes = [];
        const verticesCount = videoFigure.getTotalVertices();
        
        new BABYLON.SubMesh(1, 0, verticesCount, 0, 613, videoFigure)
      
        if(self) {
          videoFigure.position = new BABYLON.Vector3(-1 - Math.random(), 1.693, 0.316 - Math.random())
          
          this.baseSceneManager.myPlayer = videoFigure;
          this.baseSceneManager.myPlayer.parent = this.salaScene.activeCamera;
      
          this.baseSceneManager.positionBroadcasterID = setInterval(() => {
            if(this.baseSceneManager.RTCMC) {
              this.baseSceneManager.updatePosition()
            }
          }, 333);
        } else {
          videoFigure.position = new BABYLON.Vector3(-1, 0.327, 0.316)
          this.baseSceneManager.otherPlayers[userid] = videoFigure;
        }

        /* const videoFigureAggregate = new BABYLON.PhysicsAggregate(videoFigure, 
            BABYLON.PhysicsShapeType.CYLINDER, 
            {mass: 1, restitution: 0.75}, 
            this.salaScene)
        videoFigureAggregate.body.disablePreStep = false

        let joint = new BABYLON.DistanceConstraint(0.8, this.salaScene)

        videoFigureAggregate.body.setMassProperties( {inertia: new BABYLON.Vector3(0, 0, 0) } )  // So that the body won't rotate.

        videoFigureAggregate.body.setCollisionCallbackEnabled(true)
        const observable = videoFigureAggregate.body.getCollisionObservable()
        const observer = observable.add((event) => {
            console.log(event.type)
            if(event.type === 'COLLISION_STARTED') {
                event.collider.addConstraint(event.collidedAgainst, joint)
                setTimeout(() => joint.dispose(), 100)
            }
        }) */

        this.salaScene.onPointerObservable.add(((event) => {
            if (event.pickInfo.pickedMesh) {
                // alert('Picked Seat: ' + event.pickInfo.pickedMesh.name)
                
                this.baseSceneManager.myPlayer.parent = null

                /* if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.007')) {
                    this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.32
                    this.baseSceneManager.myPlayer.position.y = event.pickInfo.pickedMesh.parent.position.y + 0.6
                    this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z - 0.1
                    this.baseSceneManager.myPlayer.rotation.y = Math.PI
                    this.updateSeatRotation('W')

                    this.salaScene.activeCamera.alpha = -1.751
                    this.salaScene.activeCamera.beta = 1.124
                    this.salaScene.activeCamera.radius = 1.381
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.006')) {
                    this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x + 0.95
                    this.baseSceneManager.myPlayer.position.y = event.pickInfo.pickedMesh.parent.position.y + 0.6
                    this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z
                    this.baseSceneManager.myPlayer.rotation.y = Math.PI / 2
                    this.updateSeatRotation('N')

                    this.salaScene.activeCamera.alpha = 2.79
                    this.salaScene.activeCamera.beta = 0.99
                    this.salaScene.activeCamera.radius = 1.043
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.005')) {
                    this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18 + 1.13
                    this.baseSceneManager.myPlayer.position.y = event.pickInfo.pickedMesh.parent.position.y + 0.6
                    this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.1
                    this.baseSceneManager.myPlayer.rotation.y = Math.PI / 2
                    this.updateSeatRotation('N')

                    this.salaScene.activeCamera.alpha = -0.41
                    this.salaScene.activeCamera.beta = 1.21
                    this.salaScene.activeCamera.radius = 0.662
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.004')) {
                    this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18 + 1.13
                    this.baseSceneManager.myPlayer.position.y = event.pickInfo.pickedMesh.parent.position.y + 0.6
                    this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.1
                    this.baseSceneManager.myPlayer.rotation.y = Math.PI / 2
                    this.updateSeatRotation('N')

                    this.salaScene.activeCamera.alpha = -0.20
                    this.salaScene.activeCamera.beta = 1.15
                    this.salaScene.activeCamera.radius = 2.506
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.003')) {
                    this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18 - 1.32
                    this.baseSceneManager.myPlayer.position.y = event.pickInfo.pickedMesh.parent.position.y + 0.6
                    this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.11
                    this.baseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                    this.updateSeatRotation('S')

                    this.salaScene.activeCamera.alpha = 3.32
                    this.salaScene.activeCamera.beta = 1.10
                    this.salaScene.activeCamera.radius = 1.341
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.002')) {
                    this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.28 - 1.22
                    this.baseSceneManager.myPlayer.position.y = event.pickInfo.pickedMesh.parent.position.y + 0.6
                    this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.1
                    this.baseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                    this.updateSeatRotation('S')

                    this.salaScene.activeCamera.alpha = 3.32
                    this.salaScene.activeCamera.beta = 1.02
                    this.salaScene.activeCamera.radius = 1.069
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.001')) {
                    this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 1.51
                    this.baseSceneManager.myPlayer.position.y = event.pickInfo.pickedMesh.parent.position.y + 0.6
                    this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z
                    this.baseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                    this.updateSeatRotation('S')

                    this.salaScene.activeCamera.alpha = 2.78
                    this.salaScene.activeCamera.beta = 1.03
                    this.salaScene.activeCamera.radius = 1.460
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar')) {
                    this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18
                    this.baseSceneManager.myPlayer.position.y = event.pickInfo.pickedMesh.parent.position.y + 0.6
                    this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1
                    this.baseSceneManager.myPlayer.rotation.y = 0
                    this.updateSeatRotation('E')

                    this.salaScene.activeCamera.alpha = 1.72
                    this.salaScene.activeCamera.beta = 1.03
                    this.salaScene.activeCamera.radius = 1.356
                } */
                    if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.007')) {
                        this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.32
                        this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z - 0.1
                        this.baseSceneManager.myPlayer.rotation.y = Math.PI
                        // this.updateSeatRotation('W')
                        this.rotationBroadcastID = setInterval(() => {
                            if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('W')
                            }
                        }, 333);

                        this.salaScene.activeCamera.target.x = 0.134
                        this.salaScene.activeCamera.target.z = 0.187
                        this.salaScene.activeCamera.alpha = -1.69
                        this.salaScene.activeCamera.radius = 2.255
                    } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.006')) {
                        this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x + 0.95
                        this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z
                        this.baseSceneManager.myPlayer.rotation.y = Math.PI / 2
                        // this.updateSeatRotation('N')
                        this.rotationBroadcastID = setInterval(() => {
                            if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('N')
                            }
                        }, 333);

                        this.salaScene.activeCamera.target.x = 0.190
                        this.salaScene.activeCamera.target.z = 0.475
                        this.salaScene.activeCamera.alpha = 3.07
                        this.salaScene.activeCamera.radius = 1.656
                    } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.005')) {
                        this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18 + 1.13
                        this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.1
                        this.baseSceneManager.myPlayer.rotation.y = Math.PI / 2
                        // this.updateSeatRotation('N')
                        this.rotationBroadcastID = setInterval(() => {
                            if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('N')
                            }
                        }, 333);

                        this.salaScene.activeCamera.target.x = 0.071
                        this.salaScene.activeCamera.target.z = 0.157
                        this.salaScene.activeCamera.alpha = -0.07
                        this.salaScene.activeCamera.radius = 0.975
                    } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.004')) {
                        this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18 + 1.13
                        this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.1
                        this.baseSceneManager.myPlayer.rotation.y = Math.PI / 2
                        // this.updateSeatRotation('N')
                        this.rotationBroadcastID = setInterval(() => {
                            if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('N')
                            }
                        }, 333);

                        this.salaScene.activeCamera.target.x = 0.013
                        this.salaScene.activeCamera.target.z = -0.456
                        this.salaScene.activeCamera.alpha = -0.06
                        this.salaScene.activeCamera.radius = 1.281
                    } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.003')) {
                        this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18 - 1.32
                        this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.11
                        this.baseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                        // this.updateSeatRotation('S')
                        this.rotationBroadcastID = setInterval(() => {
                            if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('S')
                            }
                        }, 333);

                        this.salaScene.activeCamera.target.x = 0.123
                        this.salaScene.activeCamera.target.z = -0.305
                        this.salaScene.activeCamera.alpha = 3.15
                        this.salaScene.activeCamera.radius = 1.940
                    } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.002')) {
                        this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.28 - 1.22
                        this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.1
                        this.baseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                        // this.updateSeatRotation('S')
                        this.rotationBroadcastID = setInterval(() => {
                            if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('S')
                            }
                        }, 333);

                        this.salaScene.activeCamera.target.x = 0.183
                        this.salaScene.activeCamera.target.z = 0.332
                        this.salaScene.activeCamera.alpha = 3.19
                        this.salaScene.activeCamera.radius = 2.008
                    } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.001')) {
                        this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 1.51
                        this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z
                        this.baseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                        // this.updateSeatRotation('S')
                        this.rotationBroadcastID = setInterval(() => {
                            if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('S')
                            }
                        }, 333);

                        this.salaScene.activeCamera.target.x = 0.189
                        this.salaScene.activeCamera.target.z = 0.432
                        this.salaScene.activeCamera.alpha = 3.10
                        this.salaScene.activeCamera.radius = 2.059
                    } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar')) {
                        this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18
                        this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1
                        this.baseSceneManager.myPlayer.rotation.y = 0
                        // this.updateSeatRotation('E')
                        this.rotationBroadcastID = setInterval(() => {
                            if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('E')
                            }
                        }, 333);

                        this.salaScene.activeCamera.target.x = 0.028
                        this.salaScene.activeCamera.target.z = -0.159
                        this.salaScene.activeCamera.alpha = 1.66
                        this.salaScene.activeCamera.radius = 2.255
                    }

                    if (event.pickInfo.pickedMesh.name.includes('cadeirajantar')) {
                        this.baseSceneManager.myPlayer.position.y = event.pickInfo.pickedMesh.parent.position.y + 0.6

                        this.salaScene.activeCamera.target.y = 1.080
                        this.salaScene.activeCamera.beta = 1.13
                    }
            }
            /* switch (event.pickInfo.pickedMesh.name) {
                case 'cadeirajantar_primitive1':
                    break;
                case '':
                    break;
                case '':
                    break;
                case '':
                    break;
                case '':
                    break;
                case '':
                    break;
                case '':
                    break;
                case '':
                    break;
            } */
        }), BABYLON.PointerEventTypes.POINTERDOUBLETAP)
    }

    constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement) {
        this.baseSceneManager = BaseSceneManager.getInstance(vcReadyObj, canvas)

        const button = document.createElement("button")
        button.style.top = "60px"
        button.style.left = "327px"
        button.textContent = "@MR_Sala"
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

            connection.setCustomSocketEvent('updateSeatRotation');
            connection.socket.on('updateSeatRotation', (playerSeatRotation) => {
                switch (playerSeatRotation.target) {
                    case 'E':
                        otherPlayers[playerSeatRotation.player].rotation.y = 0;
                        break;
                    case 'W':
                        otherPlayers[playerSeatRotation.player].rotation.y = Math.PI;
                        break;
                    case 'N':
                        otherPlayers[playerSeatRotation.player].rotation.y = Math.PI / 2;
                        break;
                    case 'S':
                        otherPlayers[playerSeatRotation.player].rotation.y = 3 * Math.PI / 2;
                        break;
                }
            });
        
            if(streamEvent.type === "local") {
                this.addSalaPlayer(streamEvent.mediaElement, streamEvent.userid, true)
            } else {
                this.addSalaPlayer(streamEvent.mediaElement, streamEvent.userid, false)
            }
        }

        connection.onclose = (event) => {
            let player: BABYLON.Mesh
            const otherPlayers = this.baseSceneManager.otherPlayers
        
            if(event.type === "local") {
              player = this.baseSceneManager.myPlayer
            } else {
              player = otherPlayers[event.userid]
        
            player.dispose()
        
            if(event.type === "local") {
              this.baseSceneManager.myPlayer = null;
              clearInterval(this.baseSceneManager.positionBroadcasterID)
              clearInterval(this.rotationBroadcastID)
            } else {
              delete otherPlayers[event.userid]
            }
          }
        }

        connection.onstreamended = (event) => {
            let player: BABYLON.Mesh
            const otherPlayers = this.baseSceneManager.otherPlayers
        
            if(event.type === "local") {
              player = this.baseSceneManager.myPlayer
            } else {
              player = otherPlayers[event.userid]
        
            player.dispose()
        
            if(event.type === "local") {
              this.baseSceneManager.myPlayer = null;
              clearInterval(this.baseSceneManager.positionBroadcasterID)
              clearInterval(this.rotationBroadcastID)
            } else {
              delete otherPlayers[event.userid]
            }
          }
        }

        connection.openOrJoin('GV-MR_Sala')
    }

    public async load() {
        const engine = this.baseSceneManager.engine
        let dlCount = 0

        BABYLON.SceneLoader.Load("/datas/gltf/MR/", "Sala de jantar.glb", engine, 
            (scene) => {
                scene.executeWhenReady(async() => {
                    // scene.forceWireframe = true
                    // scene.forceShowBoundingBoxes = true
                    // scene.debugLayer.show()

                    /* const havokInstance = await HavokPhysics()
                    const hk = new BABYLON.HavokPlugin(true, havokInstance)
                    scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), hk) */

                    scene.createDefaultCamera(true, true, true)
                    scene.createDefaultEnvironment({
                        createGround: false,
                        createSkybox: false
                    })

                    if (scene.activeCamera) {
                      scene.activeCamera.attachControl(this.baseSceneManager.canvas);
                      scene.activeCamera.alpha = 0
                      scene.activeCamera.radius = 3.168
                    }

                    this.salaScene = scene

                    engine.runRenderLoop(() => {
                        this.salaScene.render()
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