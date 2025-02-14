import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import BaseSceneManager from '../base/BaseSceneManager'
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic'
import HavokPhysics from '@babylonjs/havok'

registerBuiltInLoaders()

export default class ConZugdidiManager {
    private baseSceneManager: BaseSceneManager
    private zugdidiScene: BABYLON.Scene
    private rotationBroadcastID: number

    private updateSeatRotation(direction: string) {
        this.baseSceneManager.RTCMC.socket.emit('updateSeatRotation', {
            player: this.baseSceneManager.myPlayer.id,
            target: direction
        })
    }

    private addZugadidiPlayer(video: HTMLVideoElement, userid: string, self: boolean) {
        // map face UVs to draw text only on top of cylinder
        const faceUV = []
        faceUV[0] =	new BABYLON.Vector4(0, 0, 1, 1) // use only the first pixel (which has no text, just the background color)
        faceUV[1] =	new BABYLON.Vector4(0, 0, 0, 0) // use onlly the first pixel
        faceUV[2] = new BABYLON.Vector4(0, 0, 1, 1) // use the full texture

        const videoFigure = BABYLON.MeshBuilder.CreateCylinder('player-' + video.id,
            { height: 0.06, diameter: 0.39, diameterBottom: 0.43, faceUV: faceUV, tessellation: 68 },
            this.zugdidiScene)
        videoFigure.id = userid

        videoFigure.rotation.z = Math.PI
        videoFigure.rotation.y = 9 * Math.PI / 6
        videoFigure.rotation.x = 3 * Math.PI / 6

        videoFigure.material = this.baseSceneManager.prepareMaterial(video, this.zugdidiScene)

        // videoFigure.subMeshes = [];
        const verticesCount = videoFigure.getTotalVertices()

        new BABYLON.SubMesh(1, 0, verticesCount, 0, 613, videoFigure)

        if(self) {
          videoFigure.position = new BABYLON.Vector3(-1 - Math.random(), 1.693, 0.316 - Math.random())

          this.baseSceneManager.myPlayer = videoFigure
          this.baseSceneManager.myPlayer.parent = this.zugdidiScene.activeCamera

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

        this.zugdidiScene.onPointerObservable.add((event => {
            if (event.pickInfo.pickedMesh) {
                // alert('Picked Seat: ' + event.pickInfo.pickedMesh.name)

                this.baseSceneManager.myPlayer.parent = null

                if (event.pickInfo.pickedMesh.name.includes('Woman')) {
                    this.baseSceneManager.myPlayer.position.x = 10.723
                    this.baseSceneManager.myPlayer.position.y = 2.580
                    this.baseSceneManager.myPlayer.position.z = -8.720
                    this.baseSceneManager.myPlayer.rotation.y = Math.PI / 2
                    // this.updateSeatRotation('W')
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                        this.updateSeatRotation('W')
                        }
                    }, 333)

                    this.zugdidiScene.activeCamera.target.x = 9.143
                    this.zugdidiScene.activeCamera.target.y = 2.407
                    this.zugdidiScene.activeCamera.target.z = -8.576
                    this.zugdidiScene.activeCamera.alpha = -0.023
                    this.zugdidiScene.activeCamera.beta = 1.511
                    this.zugdidiScene.activeCamera.radius = 2.139
                } else if (event.pickInfo.pickedMesh.name.includes('Line001.020')) {
                    this.baseSceneManager.myPlayer.position.x = 1.611
                    this.baseSceneManager.myPlayer.position.z = -13.234
                } else if (event.pickInfo.pickedMesh.name.includes('Line001')) {
                    this.baseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.position.x - 2.70
                    this.baseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.position.z + 0.18
                }

                if (event.pickInfo.pickedMesh.name.includes('Line001')) {
                    this.baseSceneManager.myPlayer.position.y = 1.372
                    /* const myPlayerAggregate = new BABYLON.PhysicsAggregate(this.baseSceneManager.myPlayer,
                        BABYLON.PhysicsShapeType.CYLINDER,
                        {mass: 1, restitution: 1},
                        this.zugdidiScene)
                    let joint = new BABYLON.LockConstraint(
                        new BABYLON.Vector3(0.5, 0.5, -0.5),
                        new BABYLON.Vector3(-0.5, -0.5, 0.5),
                        new BABYLON.Vector3(0, 1, 0),
                        new BABYLON.Vector3(0, 1, 0),
                        this.zugdidiScene
                    )
                    // let joint = new BABYLON.DistanceConstraint(0.8, this.zugdidiScene)
                    const chairAggregate = new BABYLON.PhysicsAggregate(this.baseSceneManager.myPlayer,
                        BABYLON.PhysicsShapeType.CYLINDER,
                        {mass: 1, restitution: 1},
                        this.zugdidiScene)
                    myPlayerAggregate.body.addConstraint(chairAggregate.body, joint) */
                    this.baseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                    // this.updateSeatRotation('E')
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                        this.updateSeatRotation('E')
                        }
                    }, 333)

                    this.zugdidiScene.activeCamera.target.x = 1.323
                    this.zugdidiScene.activeCamera.target.y = 2.355
                    this.zugdidiScene.activeCamera.target.z = -11.608
                    this.zugdidiScene.activeCamera.alpha = -3.11
                    this.zugdidiScene.activeCamera.beta = 1.55
                    this.zugdidiScene.activeCamera.radius = 10.176
                }
            }
        }), BABYLON.PointerEventTypes.POINTERDOUBLETAP)
    }

    constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement) {
        this.baseSceneManager = BaseSceneManager.getInstance(vcReadyObj, canvas)

        this.baseSceneManager.createButton('@Con_Zugdidi', '535px', '109px', () => {
            this.load()
        })
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
                this.addZugadidiPlayer(streamEvent.mediaElement, streamEvent.userid, true)
            } else {
                this.addZugadidiPlayer(streamEvent.mediaElement, streamEvent.userid, false)
            }
        }

        const close = event => {
            let player: BABYLON.Mesh
            const otherPlayers = this.baseSceneManager.otherPlayers

            if(event.type === 'local') {
              player = this.baseSceneManager.myPlayer
            } else {
              player = otherPlayers[event.userid]

            player.dispose()

            if(event.type === 'local') {
              this.baseSceneManager.myPlayer = null
              clearInterval(this.baseSceneManager.positionBroadcasterID)
              clearInterval(this.rotationBroadcastID)
            } else {
              delete otherPlayers[event.userid]
            }
          }
        }
        connection.onclose = close
        connection.onstreamended = close

        connection.openOrJoin('GV-Con_Zugdidi')
    }

    public async load() {
        const engine = this.baseSceneManager.engine
        let dlCount = 0

        BABYLON.SceneLoader.Load('/datas/gltf/Con/', 'zugdidi.glb', engine,
            scene => {
                scene.executeWhenReady(async() => {
                    // scene.forceWireframe = true
                    // scene.forceShowBoundingBoxes = true
                    // scene.debugLayer.show()

                    const havokInstance = await HavokPhysics()
                    const hk = new BABYLON.HavokPlugin(true, havokInstance)
                    scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), hk)

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

                    this.zugdidiScene = scene

                    engine.runRenderLoop(() => {
                        this.zugdidiScene.render()
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
