import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import BaseSceneManager from '../base/BaseSceneManager'
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic'
import HavokPhysics from '@babylonjs/havok'

registerBuiltInLoaders()

export default class MROneOneManager {
    private baseSceneManager: BaseSceneManager
    private oneOneScene: BABYLON.Scene
    private rotationBroadcastID: number

    private updateSeatRotation(direction: string) {
        if(this.baseSceneManager.myPlayer && this.baseSceneManager.RTCMC && this.baseSceneManager.RTCMC.socket) {
            this.baseSceneManager.RTCMC.socket.emit('updateSeatRotation', {
                player: this.baseSceneManager.myPlayer.id,
                target: direction
            })
        }
    }

    private addOneOnePlayer(video: HTMLVideoElement, userid: string, self: boolean) {
        // map face UVs to draw text only on top of cylinder
        const faceUV = []
        faceUV[0] =	new BABYLON.Vector4(0, 0, 1, 1) // use only the first pixel (which has no text, just the background color)
        faceUV[1] =	new BABYLON.Vector4(0, 0, 0, 0) // use onlly the first pixel
        faceUV[2] = new BABYLON.Vector4(0, 0, 1, 1) // use the full texture

        const videoFigure = BABYLON.MeshBuilder.CreateCylinder('player-' + video.id,
            { height: 0.06, diameter: 0.39, diameterBottom: 0.43, faceUV: faceUV, tessellation: 68 },
            this.oneOneScene)
        videoFigure.id = userid

        videoFigure.rotation.z = Math.PI
        videoFigure.rotation.y = 9 * Math.PI / 6
        videoFigure.rotation.x = 3 * Math.PI / 6

        videoFigure.material = this.baseSceneManager.prepareMaterial(video, this.oneOneScene)

        // videoFigure.subMeshes = [];
        const verticesCount = videoFigure.getTotalVertices()

        new BABYLON.SubMesh(1, 0, verticesCount, 0, 613, videoFigure)

        if(self) {
          videoFigure.position = new BABYLON.Vector3(-1 - Math.random(), 1.693, 0.316 - Math.random())

          this.baseSceneManager.myPlayer = videoFigure
          this.baseSceneManager.myPlayer.parent = this.oneOneScene.activeCamera

          this.baseSceneManager.positionBroadcasterID = setInterval(() => {
            if(this.baseSceneManager.RTCMC) {
              this.baseSceneManager.updatePosition()
            }
          }, 3000)
        } else {
          videoFigure.position = new BABYLON.Vector3(-1, 0.327, 0.316)
          this.baseSceneManager.otherPlayers[userid] = videoFigure
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

        this.oneOneScene.onPointerObservable.add((event => {
            if (event.pickInfo.pickedMesh) {
                // alert('Picked Seat: ' + event.pickInfo.pickedMesh.name)

                this.baseSceneManager.myPlayer.parent = null

                if (event.pickInfo.pickedMesh.name == 'Stool2') {
                    this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x + 0.66
                    this.baseSceneManager.myPlayer.position.y = 1.193
                    this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z
                    this.baseSceneManager.myPlayer.rotation.y = Math.PI / 2
                    // this.updateSeatRotation('W')
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                        this.updateSeatRotation('W')
                        }
                    }, 333)

                    this.oneOneScene.activeCamera.alpha = -0.023
                    this.oneOneScene.activeCamera.beta = 1.020
                    this.oneOneScene.activeCamera.radius = 3.254
                } else if (event.pickInfo.pickedMesh.name == 'Stool') {
                    this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.66
                    this.baseSceneManager.myPlayer.position.y = 1.193
                    this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z
                    this.baseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                    // this.updateSeatRotation('E')
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                        this.updateSeatRotation('E')
                        }
                    }, 333)

                    this.oneOneScene.activeCamera.alpha = -3.145
                    this.oneOneScene.activeCamera.beta = 1.020
                    this.oneOneScene.activeCamera.radius = 3.254
                }
            }
        }), BABYLON.PointerEventTypes.POINTERDOUBLETAP)
    }

    constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement) {
        this.baseSceneManager = BaseSceneManager.getInstance(vcReadyObj, canvas)

        const button = document.createElement('button')
        button.style.top = '60px'
        button.style.left = '416px'
        button.textContent = '@MR_OneOne'
        button.style.width = '106px'
        button.style.height = '33px'
        button.style.position = 'absolute'
        button.style.color = 'white'
        button.style.background = 'rgba(0, 68, 82, 0.6)'
        button.style['border-radius'] = '30px'

        document.body.appendChild(button)

        button.addEventListener('click', () => {
            this.load()
        })

        this.baseSceneManager.createModel('/datas/gltf/MR/LowPolyHouse.glb', 1, {
            LNG: 120.07,
            LAT: 30.27,
            ALT: 0
        })
        /* this.baseSceneManager.createModel('/datas/gltf/MR/OneOne.glb', 1, {
            LNG: 120.07,
            LAT: 30.27,
            ALT: 0
        }) */

        this.baseSceneManager.registerPickHandler('LowPolyHouse', canvas, () => this.load())
    }

    public enter() {
        const connection = this.baseSceneManager.RTCMC

        // disconnect with all users
        connection.getAllParticipants().forEach(function(pid) {
            connection.disconnectWith(pid)
        })

        // stop all local cameras
        connection.attachStreams.forEach(function(localStream) {
            localStream.stop()
        })

        // close socket.io connection
        connection.closeSocket()

        connection.onstream = streamEvent => {
            const otherPlayers = this.baseSceneManager.otherPlayers

            connection.setCustomSocketEvent('updatePosition')
            connection.socket.on('updatePosition', playerPosition => {
                if(otherPlayers[playerPosition.player]) {
                    otherPlayers[playerPosition.player].position.x = playerPosition.target._x
                    otherPlayers[playerPosition.player].position.y = playerPosition.target._y
                    otherPlayers[playerPosition.player].position.z = playerPosition.target._z
                }
            })

            connection.setCustomSocketEvent('updateRotation')
            connection.socket.on('updateRotation', playerRotation => {
                if(playerRotation.target == 'left') {
                    otherPlayers[playerRotation.player].rotation.z += Math.PI / 66
                } else if(playerRotation.target == 'right') {
                    otherPlayers[playerRotation.player].rotation.z -= Math.PI / 66
                }
            })

            connection.setCustomSocketEvent('updateSeatRotation')
            connection.socket.on('updateSeatRotation', playerSeatRotation => {
                switch (playerSeatRotation.target) {
                    case 'E':
                        otherPlayers[playerSeatRotation.player].rotation.y = 3 * Math.PI / 2
                        break
                    case 'W':
                        otherPlayers[playerSeatRotation.player].rotation.y = Math.PI / 2
                        break
                }
            })

            if(streamEvent.type === 'local') {
                this.addOneOnePlayer(streamEvent.mediaElement, streamEvent.userid, true)
            } else {
                this.addOneOnePlayer(streamEvent.mediaElement, streamEvent.userid, false)
            }
        }

        const close = event => {
            let player: BABYLON.Mesh
            const otherPlayers = this.baseSceneManager.otherPlayers

            if(event.type === 'local') {
              player = this.baseSceneManager.myPlayer
            } else {
              player = otherPlayers[event.userid]
            }

            player.dispose()

            if(event.type === 'local') {
              this.baseSceneManager.myPlayer = null
              clearInterval(this.baseSceneManager.positionBroadcasterID)
              clearInterval(this.rotationBroadcastID)
            } else {
              delete otherPlayers[event.userid]
            }
        }

        connection.onclose = close
        connection.onstreamended = close

        connection.openOrJoin('GV-MR_OneOne')
    }

    public async load() {
        const engine = this.baseSceneManager.engine
        let dlCount = 0

        BABYLON.SceneLoader.Load('/datas/gltf/MR/', 'OneOne.glb', engine,
            scene => {
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
                      scene.activeCamera.attachControl(this.baseSceneManager.canvas)
                      scene.activeCamera.alpha = 0
                      scene.activeCamera.radius = 3.168
                    }

                    this.oneOneScene = scene

                    engine.runRenderLoop(() => {
                        this.oneOneScene.render()
                    })

                    this.enter()
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
