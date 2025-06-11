import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import BaseSceneManager from '../base/BaseSceneManager1'
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic'
import HavokPhysics from '@babylonjs/havok'

registerBuiltInLoaders()

export default class MRSalaManager extends BaseSceneManager{

    public async addPlayer(streamEvent: any, sceneType: string, scene?: BABYLON.Scene) {
        const videoFigure: BABYLON.Mesh = await BaseSceneManager.createVideoFigure(streamEvent, sceneType, scene)

        if(streamEvent.type === 'local') {
          videoFigure.position = new BABYLON.Vector3(-1 - Math.random(), 1.693, 0.316 - Math.random())

          BaseSceneManager.myPlayer = videoFigure
          BaseSceneManager.myPlayer.parent = BaseSceneManager.scene.activeCamera

          BaseSceneManager.positionBroadcasterID = setInterval(() => {
            if(BaseSceneManager.RTCMC) {
                BaseSceneManager.updatePosition()
            }
          }, 333)
        } else {
          videoFigure.position = new BABYLON.Vector3(-1, 0.327, 0.316)
          BaseSceneManager.otherPlayers[videoFigure.id] = videoFigure
        }

        /* const videoFigureAggregate = new BABYLON.PhysicsAggregate(videoFigure,
            BABYLON.PhysicsShapeType.CYLINDER,
            {mass: 1, restitution: 0.75},
            BaseSceneManager.scene)
        videoFigureAggregate.body.disablePreStep = false

        let joint = new BABYLON.DistanceConstraint(0.8, BaseSceneManager.scene)

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

        BaseSceneManager.scene.onPointerObservable.add((event => {
            if (event.pickInfo.pickedMesh) {
                // alert('Picked Seat: ' + event.pickInfo.pickedMesh.name)

                BaseSceneManager.myPlayer.parent = null

                if (BaseSceneManager.rotationBroadcastID) {
                    clearInterval(BaseSceneManager.rotationBroadcastID)
                }

                if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.007')) {
                    BaseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.32
                    BaseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z - 0.1
                    BaseSceneManager.myPlayer.rotation.y = Math.PI
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                        BaseSceneManager.updateSeatRotation('W')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.target.x = 0.134
                    BaseSceneManager.scene.activeCamera.target.z = 0.187
                    BaseSceneManager.scene.activeCamera.alpha = -1.69
                    BaseSceneManager.scene.activeCamera.radius = 2.255
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.006')) {
                    BaseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x + 0.95
                    BaseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z
                    BaseSceneManager.myPlayer.rotation.y = Math.PI / 2
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                        BaseSceneManager.updateSeatRotation('S')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.target.x = 0.190
                    BaseSceneManager.scene.activeCamera.target.z = 0.475
                    BaseSceneManager.scene.activeCamera.alpha = 3.07
                    BaseSceneManager.scene.activeCamera.radius = 1.656
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.005')) {
                    BaseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18 + 1.13
                    BaseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.1
                    BaseSceneManager.myPlayer.rotation.y = Math.PI / 2
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                        BaseSceneManager.updateSeatRotation('S')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.target.x = 0.071
                    BaseSceneManager.scene.activeCamera.target.z = 0.157
                    BaseSceneManager.scene.activeCamera.alpha = -0.07
                    BaseSceneManager.scene.activeCamera.radius = 0.975
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.004')) {
                    BaseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18 + 1.13
                    BaseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.1
                    BaseSceneManager.myPlayer.rotation.y = Math.PI / 2
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                        BaseSceneManager.updateSeatRotation('S')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.target.x = 0.013
                    BaseSceneManager.scene.activeCamera.target.z = -0.456
                    BaseSceneManager.scene.activeCamera.alpha = -0.06
                    BaseSceneManager.scene.activeCamera.radius = 1.281
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.003')) {
                    BaseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18 - 1.32
                    BaseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.11
                    BaseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                        BaseSceneManager.updateSeatRotation('N')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.target.x = 0.123
                    BaseSceneManager.scene.activeCamera.target.z = -0.305
                    BaseSceneManager.scene.activeCamera.alpha = 3.15
                    BaseSceneManager.scene.activeCamera.radius = 1.940
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.002')) {
                    BaseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.28 - 1.22
                    BaseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1 - 0.1
                    BaseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                        BaseSceneManager.updateSeatRotation('N')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.target.x = 0.183
                    BaseSceneManager.scene.activeCamera.target.z = 0.332
                    BaseSceneManager.scene.activeCamera.alpha = 3.19
                    BaseSceneManager.scene.activeCamera.radius = 2.008
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar.001')) {
                    BaseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 1.51
                    BaseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z
                    BaseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                        BaseSceneManager.updateSeatRotation('N')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.target.x = 0.189
                    BaseSceneManager.scene.activeCamera.target.z = 0.432
                    BaseSceneManager.scene.activeCamera.alpha = 3.10
                    BaseSceneManager.scene.activeCamera.radius = 2.059
                } else if (event.pickInfo.pickedMesh.name.includes('cadeirajantar')) {
                    BaseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.18
                    BaseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z + 0.1
                    BaseSceneManager.myPlayer.rotation.y = 0
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                        BaseSceneManager.updateSeatRotation('E')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.target.x = 0.028
                    BaseSceneManager.scene.activeCamera.target.z = -0.159
                    BaseSceneManager.scene.activeCamera.alpha = 1.66
                    BaseSceneManager.scene.activeCamera.radius = 2.255
                }

                if (event.pickInfo.pickedMesh.name.includes('cadeirajantar')) {
                    BaseSceneManager.myPlayer.position.y = event.pickInfo.pickedMesh.parent.position.y + 0.6

                    BaseSceneManager.scene.activeCamera.target.y = 1.080
                    BaseSceneManager.scene.activeCamera.beta = 1.13
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

}
