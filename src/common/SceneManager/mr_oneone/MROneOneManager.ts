/*
 * @Author: Henry Ma henryma@edening.cn
 * @Date: 2025-06-05 12:22:39
 * @LastEditors: Henry Ma henryma@edening.cn
 * @LastEditTime: 2025-06-11 16:12:11
 * @FilePath: /GlobalVillage/src/common/SceneManager/mr_oneone/MROneOneManager.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import BaseSceneManager from '@src/common/SceneManager/base/BaseSceneManager1'
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic'

registerBuiltInLoaders()

export default class MROneOneManager extends BaseSceneManager{

    async addPlayer(streamEvent: any, sceneType: string, scene?: BABYLON.Scene) {
        const videoFigure: BABYLON.Mesh = await BaseSceneManager.createVideoFigure(streamEvent, sceneType, scene)

        if(streamEvent.type === 'local') {
          videoFigure.position = new BABYLON.Vector3(-1 - Math.random(), 1.693, 0.316 - Math.random())

          BaseSceneManager.myPlayer = videoFigure
          BaseSceneManager.myPlayer.parent = BaseSceneManager.camera

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

        BaseSceneManager.scene.onPointerObservable.add((event => {
            if (event.pickInfo.pickedMesh) {
                // alert('Picked Seat: ' + event.pickInfo.pickedMesh.name)

                BaseSceneManager.myPlayer.parent = null

                if (BaseSceneManager.rotationBroadcastID) {
                    clearInterval(BaseSceneManager.rotationBroadcastID)
                }

                if (event.pickInfo.pickedMesh.name == 'Stool2') {
                    BaseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x + 0.66
                    BaseSceneManager.myPlayer.position.y = 1.193
                    BaseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z
                    BaseSceneManager.myPlayer.rotation.y = Math.PI / 2
                    // this.updateSeatRotation('W')
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('S')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.alpha = -0.023
                    BaseSceneManager.scene.activeCamera.beta = 1.020
                    BaseSceneManager.scene.activeCamera.radius = 3.254
                } else if (event.pickInfo.pickedMesh.name == 'Stool') {
                    BaseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.parent.position.x - 0.66
                    BaseSceneManager.myPlayer.position.y = 1.193
                    BaseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.parent.position.z
                    BaseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                    // this.updateSeatRotation('E')
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                            BaseSceneManager.updateSeatRotation('N')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.alpha = -3.145
                    BaseSceneManager.scene.activeCamera.beta = 1.020
                    BaseSceneManager.scene.activeCamera.radius = 3.254
                }
            }
        }), BABYLON.PointerEventTypes.POINTERDOUBLETAP)
    }
}
