import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import BaseSceneManager from '../base/BaseSceneManager'
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic'
import HavokPhysics from '@babylonjs/havok'

registerBuiltInLoaders()

export default class OfficeManager {
    private baseSceneManager: BaseSceneManager
    private officeScene: BABYLON.Scene
    private rotationBroadcastID: number

    constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement, officeId: string) {
        this.baseSceneManager = BaseSceneManager.getInstance(vcReadyObj, canvas)

        // setTimeout(() => this.load(officeId), 6333)
        this.load(officeId)
    }

    private enter(scene: BABYLON.Scene, officeId) {
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
                    // otherPlayers[playerRotation.player].rotation.z += Math.PI / 66
                    otherPlayers[playerRotation.player].rotation.y += Math.PI / 66
                } else if(playerRotation.target == 'right') {
                    // otherPlayers[playerRotation.player].rotation.z -= Math.PI / 66
                    otherPlayers[playerRotation.player].rotation.y -= Math.PI / 66
                }
            })

            connection.setCustomSocketEvent('updateSeatRotation')
            connection.socket.on('updateSeatRotation', playerSeatRotation => {
                switch (playerSeatRotation.target) {
                    case 'E':
                        otherPlayers[playerSeatRotation.player].rotation.y = 0
                        break
                    case 'W':
                        otherPlayers[playerSeatRotation.player].rotation.y = Math.PI
                        break
                    case 'N':
                        otherPlayers[playerSeatRotation.player].rotation.y = 3 * Math.PI / 2
                        break
                    case 'S':
                        otherPlayers[playerSeatRotation.player].rotation.y = Math.PI / 2
                        break
                    case 'NW':
                        otherPlayers[playerSeatRotation.player].rotation.y = 7.3 * Math.PI / 6
                        break
                    case 'SE':
                        otherPlayers[playerSeatRotation.player].rotation.y = - Math.PI / 6
                        break
                    case 'SW':
                        otherPlayers[playerSeatRotation.player].rotation.y = Math.PI / 6
                        break
                }
            })

            this.addOfficePlayer(streamEvent, 'meeting', scene)
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

        connection.openOrJoin('GV-Office-' + officeId)
    }

    private load(officeId: string) {
        const engine = this.baseSceneManager.engine
        let dlCount = 0

        BABYLON.SceneLoader.Load('/datas/gltf/Office/', 'Office.glb', engine,
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

                    this.officeScene = scene

                    engine.runRenderLoop(() => {
                        this.officeScene.render()
                    })

                    this.enter(this.officeScene, officeId)
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

    private updateSeatRotation(direction: string) {
        this.baseSceneManager.RTCMC.socket.emit('updateSeatRotation', {
            player: this.baseSceneManager.myPlayer.id,
            target: direction
        })
    }

    private async addOfficePlayer(streamEvent: any, sceneType: string, scene?: BABYLON.Scene) {
        // const videoFigure: BABYLON.Mesh = this.baseSceneManager.createVideoFigure(streamEvent, sceneType, scene)
        const videoFigure: BABYLON.Mesh = await this.baseSceneManager.createVideoFigure1(streamEvent, sceneType, scene)

        if(streamEvent.type === 'local') {
          videoFigure.position = new BABYLON.Vector3(-1 - Math.random(), 2.693, 3.316 - Math.random())

          this.baseSceneManager.myPlayer = videoFigure
          this.baseSceneManager.myPlayer.parent = this.officeScene.activeCamera

          this.baseSceneManager.positionBroadcasterID = setInterval(() => {
            if(this.baseSceneManager.RTCMC) {
              this.baseSceneManager.updatePosition()
            }
          }, 333)

          this.officeScene.onPointerObservable.add((event => {
            if (event.pickInfo.pickedMesh) {
                const pickedMesh = event.pickInfo.pickedMesh
                // alert('Picked Seat: ' + pickedMesh.name)

                const myPlayer = this.baseSceneManager.myPlayer
                myPlayer.parent = null
                myPlayer.position.y = 1.816

                const camera = this.officeScene.activeCamera

                if (this.rotationBroadcastID) {
                    clearInterval(this.rotationBroadcastID)
                }

                if (pickedMesh.name.includes('Cube.042') || pickedMesh.name.includes('Cube.043') || pickedMesh.name.includes('Cube.044')) {
                    myPlayer.position.x = pickedMesh.parent.position.x - 3.58
                    myPlayer.position.z = pickedMesh.parent.position.z + 5.56
                    myPlayer.rotation.y = 7.3 * Math.PI / 6
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('NW')
                        }
                    }, 333)

                    /* camera.target.x = -4.722
                    camera.target.y = 2.168
                    camera.target.z = 3.772
                    camera.alpha = -2.2721
                    camera.beta = 1.5481
                    camera.radius = 0.5247 */
                    camera.target.x = -2.865
                    camera.target.y = 1.650
                    camera.target.z = 6.113
                    camera.alpha = -8.4602
                    camera.beta = 1.3868
                    camera.radius = 1.0333
                } else if (pickedMesh.name.includes('Cube.050') || pickedMesh.name.includes('Cube.051') || pickedMesh.name.includes('Cube.052')) {
                    myPlayer.position.x = pickedMesh.parent.position.x - 3.18
                    myPlayer.position.z = pickedMesh.parent.position.z + 7.85
                    myPlayer.rotation.y = 3 * Math.PI / 2
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('N')
                        }
                    }, 333)

                    /* camera.target.x = -5.284
                    camera.target.y = 2.168
                    camera.target.z = 7.707
                    camera.alpha = -3.1632
                    camera.beta = 1.4079
                    camera.radius = 0.5247 */
                    camera.target.x = -2.934
                    camera.target.y = 1.535
                    camera.target.z = 7.829
                    camera.alpha = -9.4091
                    camera.beta = 1.2161
                    camera.radius = 0.6333
                }  else if (pickedMesh.name.includes('Cube.058') || pickedMesh.name.includes('Cube.059') || pickedMesh.name.includes('Cube.060')) {
                    myPlayer.position.x = pickedMesh.parent.position.x - 0.36
                    myPlayer.position.z = pickedMesh.parent.position.z + 7.86
                    myPlayer.rotation.y = Math.PI / 2
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('S')
                        }
                    }, 333)

                    camera.target.x = -0.699
                    camera.target.y = 1.515
                    camera.target.z = 7.643
                    camera.alpha = -6.3236
                    camera.beta = 1.3400
                    camera.radius = 0.8035
                }  else if (pickedMesh.name.includes('Cube.066') || pickedMesh.name.includes('Cube.067') || pickedMesh.name.includes('Cube.068')) {
                    myPlayer.position.x = pickedMesh.parent.position.x - 0.36
                    myPlayer.position.z = pickedMesh.parent.position.z + 6.26
                    myPlayer.rotation.y = Math.PI / 2
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('S')
                        }
                    }, 333)

                    camera.target.x = -0.758
                    camera.target.y = 1.515
                    camera.target.z = 6.084
                    camera.alpha = -6.2727
                    camera.beta = 1.3487
                    camera.radius = 0.8355
                } else if (pickedMesh.name.includes('Cube.074') || pickedMesh.name.includes('Cube.075') || pickedMesh.name.includes('Cube.076')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 1.63
                    myPlayer.position.z = pickedMesh.parent.position.z + 6.16
                    myPlayer.rotation.y = 3 * Math.PI / 2
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('N')
                        }
                    }, 333)

                    camera.target.x = 1.717
                    camera.target.y = 1.638
                    camera.target.z = 6.244
                    camera.alpha = -9.4112
                    camera.beta = 1.2896
                    camera.radius = 0.5239
                } else if (pickedMesh.name.includes('Cube.082') || pickedMesh.name.includes('Cube.083') || pickedMesh.name.includes('Cube.084')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 1.63
                    myPlayer.position.z = pickedMesh.parent.position.z + 7.81
                    myPlayer.rotation.y = 3 * Math.PI / 2
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('N')
                        }
                    }, 333)

                    camera.target.x = 1.701
                    camera.target.y = 1.661
                    camera.target.z = 7.869
                    camera.alpha = -9.4112
                    camera.beta = 1.2901
                    camera.radius = 0.5239
                } else if (pickedMesh.name.includes('Cube.090') || pickedMesh.name.includes('Cube.091') || pickedMesh.name.includes('Cube.092')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 4.89
                    myPlayer.position.z = pickedMesh.parent.position.z + 6.16
                    myPlayer.rotation.y = Math.PI / 2
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('S')
                        }
                    }, 333)

                    camera.target.x = 1.767
                    camera.target.y = 1.340
                    camera.target.z = 5.881
                    camera.alpha = -12.5627
                    camera.beta = 1.4591
                    camera.radius = 3.5952
                } else if (pickedMesh.name.includes('Cube.022') || pickedMesh.name.includes('Cube.023') || pickedMesh.name.includes('Cube.024')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 4.89
                    myPlayer.position.z = pickedMesh.parent.position.z + 7.83
                    myPlayer.rotation.y = Math.PI / 2
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('S')
                        }
                    }, 333)

                    camera.target.x = 1.755
                    camera.target.y = 1.384
                    camera.target.z = 7.717
                    camera.alpha = -12.5626
                    camera.beta = 1.4590
                    camera.radius = 3.5952
                } else if (pickedMesh.name.includes('High.001')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 3.83
                    myPlayer.position.z = pickedMesh.parent.position.z - 3.36
                    myPlayer.rotation.y = Math.PI
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('W')
                        }
                    }, 333)

                    camera.target.x = 3.765
                    camera.target.y = 1.821
                    camera.target.z = -2.977
                    camera.alpha = -20.4147
                    camera.beta = 1.4115
                    camera.radius = 0.5247
                } else if (pickedMesh.name.includes('High.002')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 2.53
                    myPlayer.position.z = pickedMesh.parent.position.z - 3.36
                    myPlayer.rotation.y = Math.PI
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('W')
                        }
                    }, 333)

                    camera.target.x = 2.380
                    camera.target.y = 1.814
                    camera.target.z = -2.986
                    camera.alpha = -20.4147
                    camera.beta = 1.4115
                    camera.radius = 0.5247
                }  else if (pickedMesh.name.includes('High.003')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 1.23
                    myPlayer.position.z = pickedMesh.parent.position.z - 3.36
                    myPlayer.rotation.y = Math.PI
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('W')
                        }
                    }, 333)

                    camera.target.x = 1.225
                    camera.target.y = 1.796
                    camera.target.z = -2.996
                    camera.alpha = -20.4147
                    camera.beta = 1.4115
                    camera.radius = 0.5247
                }  else if (pickedMesh.name.includes('High.004')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 5.08
                    myPlayer.position.z = pickedMesh.parent.position.z - 3.36
                    myPlayer.rotation.y = Math.PI
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('W')
                        }
                    }, 333)

                    camera.target.x = 5.020
                    camera.target.y = 1.819
                    camera.target.z = -2.970
                    camera.alpha = -20.4147
                    camera.beta = 1.4115
                    camera.radius = 0.5247
                } else if (pickedMesh.name.includes('High.005')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 2.49
                    myPlayer.position.z = pickedMesh.parent.position.z - 1.06
                    myPlayer.rotation.y = 0
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('E')
                        }
                    }, 333)

                    camera.target.x = 2.518
                    camera.target.y = 1.821
                    camera.target.z = -2.970
                    camera.alpha = -23.5682
                    camera.beta = 1.5091
                    camera.radius = 2.4218
                } else if (pickedMesh.name.includes('Low.006')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 3.76
                    myPlayer.position.z = pickedMesh.parent.position.z - 1.06
                    myPlayer.rotation.y = 0
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('E')
                        }
                    }, 333)

                    camera.target.x = 3.813
                    camera.target.y = 1.821
                    camera.target.z = -2.970
                    camera.alpha = -23.5682
                    camera.beta = 1.5091
                    camera.radius = 2.4218
                } else if (pickedMesh.name.includes('Low.007')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 5.09
                    myPlayer.position.z = pickedMesh.parent.position.z - 1.06
                    myPlayer.rotation.y = 0
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('E')
                        }
                    }, 333)

                    camera.target.x = 5.087
                    camera.target.y = 1.821
                    camera.target.z = -2.970
                    camera.alpha = -23.5682
                    camera.beta = 1.5091
                    camera.radius = 2.4218
                } else if (pickedMesh.name.includes('Low.008')) {
                    myPlayer.position.x = pickedMesh.parent.position.x + 1.23
                    myPlayer.position.z = pickedMesh.parent.position.z - 1.06
                    myPlayer.rotation.y = 0
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('E')
                        }
                    }, 333)

                    camera.target.x = 1.220
                    camera.target.y = 1.821
                    camera.target.z = -2.970
                    camera.alpha = -23.5682
                    camera.beta = 1.5091
                    camera.radius = 2.4218
                }  else if (pickedMesh.name.includes('Plane.056')) {
                    myPlayer.position.x = pickedMesh.parent.position.x - 13.33
                    myPlayer.position.z = pickedMesh.parent.position.z + 1.03
                    myPlayer.rotation.y = - Math.PI / 6
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('SE')
                        }
                    }, 333)

                    camera.target.x = -6.428
                    camera.target.y = 3.010
                    camera.target.z = -0.395
                    camera.alpha = -36.1383
                    camera.beta = 1.4368
                    camera.radius = 4.6459
                } else if (pickedMesh.name.includes('Plane.066')) {
                    myPlayer.position.x = pickedMesh.parent.position.x - 12.43
                    myPlayer.position.z = pickedMesh.parent.position.z + 1.23
                    myPlayer.rotation.y = 0
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('E')
                        }
                    }, 333)

                    camera.target.x = -6.428
                    camera.target.y = 3.010
                    camera.target.z = -0.395
                    camera.alpha = -36.1383
                    camera.beta = 1.4368
                    camera.radius = 4.6459
                } else if (pickedMesh.name.includes('Plane.062')) {
                    myPlayer.position.x = pickedMesh.parent.position.x - 11.53
                    myPlayer.position.z = pickedMesh.parent.position.z + 1.03
                    myPlayer.rotation.y = Math.PI / 6
                    this.rotationBroadcastID = setInterval(() => {
                        if(this.baseSceneManager.RTCMC) {
                            this.updateSeatRotation('SW')
                        }
                    }, 333)

                    camera.target.x = -6.428
                    camera.target.y = 3.010
                    camera.target.z = -0.395
                    camera.alpha = -36.1383
                    camera.beta = 1.4368
                    camera.radius = 4.6459
                }

            }
          }), BABYLON.PointerEventTypes.POINTERDOUBLETAP)
        } else {
          videoFigure.position = new BABYLON.Vector3(-1, 0.327, 0.316)
          this.baseSceneManager.otherPlayers[videoFigure.id] = videoFigure
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

    }

}
