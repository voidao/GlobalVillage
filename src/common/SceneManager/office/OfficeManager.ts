import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import BaseSceneManager from '../base/BaseSceneManager1'
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic'

registerBuiltInLoaders()

export default class OfficeManager extends BaseSceneManager {

    public async addPlayer(streamEvent: any, sceneType: string, scene?: BABYLON.Scene) {
        const videoFigure: BABYLON.Mesh = await BaseSceneManager.createVideoFigure(streamEvent, sceneType, scene)

        if(streamEvent.type === 'local') {
          videoFigure.position = new BABYLON.Vector3(-1 - Math.random(), 2.693, 3.316 - Math.random())

          BaseSceneManager.myPlayer = videoFigure
          BaseSceneManager.myPlayer.parent = BaseSceneManager.scene.activeCamera

          BaseSceneManager.positionBroadcasterID = setInterval(() => {
            if(BaseSceneManager.RTCMC) {
              BaseSceneManager.updatePosition()
            }
          }, 333)

          BaseSceneManager.scene.onPointerObservable.add((event => {
            if (event.pickInfo.pickedMesh) {
                const pickedMesh = event.pickInfo.pickedMesh
                // alert('Picked Seat: ' + pickedMesh.name)

                const myPlayer = BaseSceneManager.myPlayer
                myPlayer.parent = null
                myPlayer.position.y = 1.816

                const camera = BaseSceneManager.scene.activeCamera

                if (BaseSceneManager.rotationBroadcastID) {
                    clearInterval(BaseSceneManager.rotationBroadcastID)
                }

                if (pickedMesh.name.includes('Cube.042') || pickedMesh.name.includes('Cube.043') || pickedMesh.name.includes('Cube.044')) {
                    myPlayer.position.x = pickedMesh.parent.position.x - 3.58
                    myPlayer.position.z = pickedMesh.parent.position.z + 5.56
                    myPlayer.rotation.y = 7.3 * Math.PI / 6
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('NW')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('N')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('S')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('S')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('N')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('N')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('S')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('S')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('W')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('W')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('W')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('W')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('E')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('E')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('E')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('E')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('SE')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('E')
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
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('SW')
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
          BaseSceneManager.otherPlayers[videoFigure.id] = videoFigure
        }

        /* const videoFigureAggregate = new BABYLON.PhysicsAggregate(videoFigure,
            BABYLON.PhysicsShapeType.CYLINDER,
            {mass: 1, restitution: 0.75},
            BaseSceneManager.salaScene)
        videoFigureAggregate.body.disablePreStep = false

        let joint = new BABYLON.DistanceConstraint(0.8, BaseSceneManager.salaScene)

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
