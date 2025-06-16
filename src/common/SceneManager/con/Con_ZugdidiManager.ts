/*
 * @Author: Henry Ma henryma@edening.cn
 * @Date: 2025-06-06 16:37:12
 * @LastEditors: Henry Ma henryma@edening.cn
 * @LastEditTime: 2025-06-16 15:39:27
 * @FilePath: /GlobalVillage/src/common/SceneManager/con/Con_ZugdidiManager.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import BaseSceneManager from '../base/BaseSceneManager1'

export default class ConZugdidiManager extends BaseSceneManager{

    public async addPlayer(streamEvent: any, sceneType: string, scene?: BABYLON.Scene) {
        const videoFigure: BABYLON.Mesh = await BaseSceneManager.createVideoFigure(streamEvent, sceneType, scene)

        if(streamEvent.type === 'local') {
          videoFigure.position = new BABYLON.Vector3(-1 - Math.random(), 1.693, 0.316 - Math.random())

          BaseSceneManager.myPlayer = videoFigure
          BaseSceneManager.myPlayer.parent = BaseSceneManager.scene.activeCamera

          if (BaseSceneManager.positionBroadcasterID) {
            clearInterval(BaseSceneManager.positionBroadcasterID)
          }
          BaseSceneManager.positionBroadcasterID = setInterval(() => {
            if(BaseSceneManager.RTCMC) {
              BaseSceneManager.updatePosition()
            }
          }, 3000)
        } else {
          videoFigure.position = new BABYLON.Vector3(-1, 0.327, 0.316)
          BaseSceneManager.otherPlayers[videoFigure.id] = videoFigure
        }

        BaseSceneManager.scene.onPointerObservable.add((event => {
            if (event.pickInfo.pickedMesh) {
                // alert('Picked Seat: ' + event.pickInfo.pickedMesh.name)

                BaseSceneManager.myPlayer.parent = null

                if (BaseSceneManager.rotationBroadcastID) {
                    clearInterval(BaseSceneManager.rotationBroadcastID)
                }

                if (event.pickInfo.pickedMesh.name.includes('Woman')) {
                    BaseSceneManager.myPlayer.position.x = 10.723 + 0.03
                    BaseSceneManager.myPlayer.position.y = 2.580
                    BaseSceneManager.myPlayer.position.z = -8.720
                    BaseSceneManager.myPlayer.rotation.y = Math.PI / 2
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                        BaseSceneManager.updateSeatRotation('S')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.target.x = 9.143
                    BaseSceneManager.scene.activeCamera.target.y = 2.407
                    BaseSceneManager.scene.activeCamera.target.z = -8.576
                    BaseSceneManager.scene.activeCamera.alpha = -0.023
                    BaseSceneManager.scene.activeCamera.beta = 1.511
                    BaseSceneManager.scene.activeCamera.radius = 2.139
                } else if (event.pickInfo.pickedMesh.name.includes('Line001.020')) {
                    BaseSceneManager.myPlayer.position.x = 1.611
                    BaseSceneManager.myPlayer.position.z = -13.234
                } else if (event.pickInfo.pickedMesh.name.includes('Line001')) {
                    BaseSceneManager.myPlayer.position.x = event.pickInfo.pickedMesh.position.x - 2.70
                    BaseSceneManager.myPlayer.position.z = event.pickInfo.pickedMesh.position.z + 0.18
                }

                if (event.pickInfo.pickedMesh.name.includes('Line001')) {
                    BaseSceneManager.myPlayer.position.y = 1.372
                    BaseSceneManager.myPlayer.rotation.y = 3 * Math.PI / 2
                    BaseSceneManager.rotationBroadcastID = setInterval(() => {
                        if(BaseSceneManager.RTCMC) {
                        BaseSceneManager.updateSeatRotation('N')
                        }
                    }, 333)

                    BaseSceneManager.scene.activeCamera.target.x = 1.323
                    BaseSceneManager.scene.activeCamera.target.y = 2.355
                    BaseSceneManager.scene.activeCamera.target.z = -11.608
                    BaseSceneManager.scene.activeCamera.alpha = -3.11
                    BaseSceneManager.scene.activeCamera.beta = 1.55
                    BaseSceneManager.scene.activeCamera.radius = 10.176
                }
            }
        }), BABYLON.PointerEventTypes.POINTERDOUBLETAP)
    }
}
