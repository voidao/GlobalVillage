/*
 * @Author: Henry Ma henryma@edening.cn
 * @Date: 2025-06-05 12:22:39
 * @LastEditors: Henry Ma henryma@edening.cn
 * @LastEditTime: 2025-06-09 14:15:35
 * @FilePath: /GlobalVillage/src/common/SceneManager/wcafe/WCafeManager.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import BaseSceneManager from '@src/common/SceneManager/base/BaseSceneManager1'
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic'

registerBuiltInLoaders()

export default class WCafeManager extends BaseSceneManager{

    async addPlayer(streamEvent: any, sceneType: string, scene?: BABYLON.Scene) {

        const videoFigure: BABYLON.Mesh = await BaseSceneManager.createVideoFigure(streamEvent, sceneType, scene)

        if(streamEvent.type === 'local') {
          videoFigure.position = new BABYLON.Vector3(-61 - 3 * Math.random(), 1.693, 0.316 - Math.random())

          BaseSceneManager.myPlayer = videoFigure
          BaseSceneManager.myPlayer.parent = BaseSceneManager.camera

          BaseSceneManager.positionBroadcasterID = setInterval(() => {
            if(BaseSceneManager.RTCMC) {
                BaseSceneManager.updatePosition()
            }
          }, 333)
        } else {
          videoFigure.position = new BABYLON.Vector3(-61, 0.327, 0.316)
          BaseSceneManager.otherPlayers[videoFigure.id] = videoFigure
        }

        const videoFigureAggregate = new BABYLON.PhysicsAggregate(videoFigure,
            BABYLON.PhysicsShapeType.CYLINDER,
            { mass: 1, restitution: 0.75 },
            BaseSceneManager.scene)
        videoFigureAggregate.body.disablePreStep = false

        const joint = new BABYLON.DistanceConstraint(0.8, BaseSceneManager.scene)

        videoFigureAggregate.body.setMassProperties( { inertia: new BABYLON.Vector3(0, 0, 0) } )  // So that the body won't rotate.

        videoFigureAggregate.body.setCollisionCallbackEnabled(true)
        const observable = videoFigureAggregate.body.getCollisionObservable()
        const observer = observable.add(event => {
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
}
