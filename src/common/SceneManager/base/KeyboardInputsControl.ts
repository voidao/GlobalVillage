import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import BaseSceneManager from './BaseSceneManager1'

//Key Input Manager To Use Keys to Move Forward and BackWard and Look to the Left or Right
export class FreeCameraKeyboardWalkInput implements BABYLON.ICameraInput<BABYLON.UniversalCamera> {
    camera: BABYLON.UniversalCamera

    private _keys = []
    private keysUp = [38]
    private keysDown = [40]
    private keysLeft = [37]
    private keysRight = [39]
    private _onKeyDown: any
    private _onKeyUp: any

    private _onLostFocus(e: any) {
        this._keys = []
    }

    getClassName(): string {
        return 'FreeCameraKeyboardWalkInput'
    }
    getSimpleName(): string {
        return 'keyboard'
    }
    attachControl(noPreventDefault?: boolean): void {
        const engine = this.camera.getEngine()
        const element = engine.getInputElement()
        if (!this._onKeyDown) {
            element.tabIndex = 1
            this._onKeyDown = evt => {
                if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                    this.keysDown.indexOf(evt.keyCode) !== -1 ||
                    this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    this.keysRight.indexOf(evt.keyCode) !== -1) {
                    const index = this._keys.indexOf(evt.keyCode)
                    if (index === -1) {
                        this._keys.push(evt.keyCode)
                    }
                    if (!noPreventDefault) {
                        evt.preventDefault()
                    }
                }
            }
            this._onKeyUp = evt => {
                if (this.keysUp.indexOf(evt.keyCode) !== -1 ||
                    this.keysDown.indexOf(evt.keyCode) !== -1 ||
                    this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                    this.keysRight.indexOf(evt.keyCode) !== -1) {
                    const index = this._keys.indexOf(evt.keyCode)
                    if (index >= 0) {
                        this._keys.splice(index, 1)
                    }
                    if (!noPreventDefault) {
                        evt.preventDefault()
                    }
                }
            }
            element.addEventListener('keydown', this._onKeyDown, false)
            element.addEventListener('keyup', this._onKeyUp, false)
        }
    }
    detachControl(): void {
        const engine = this.camera.getEngine()
        const element = engine.getInputElement()
        if (this._onKeyDown) {
            element.removeEventListener('keydown', this._onKeyDown)
            element.removeEventListener('keyup', this._onKeyUp)
            BABYLON.Tools.UnregisterTopRootEvents(window, [
                { name: 'blur', handler: this._onLostFocus }
            ])
            this._keys = []
            this._onKeyDown = null
            this._onKeyUp = null
        }
    }
    checkInputs() {
        if (this._onKeyDown) {
            const camera = this.camera

            const speed = 0.3
            const angularSpeed = 0.03
            const angle = Math.PI/2
            const direction = new BABYLON.Vector3(Math.cos(angle), 0, Math.sin(angle))
            for (let index = 0; index < this._keys.length; index++) {
                const keyCode = this._keys[index]
                if (this.keysLeft.indexOf(keyCode) !== -1) {
                    BaseSceneManager.lookLeft(angularSpeed)
                }
                else if (this.keysRight.indexOf(keyCode) !== -1) {
                    BaseSceneManager.lookRight(angularSpeed)
                }
                else if (this.keysUp.indexOf(keyCode) !== -1) {
                    BaseSceneManager.moveForward(speed)
                }
                else if (this.keysDown.indexOf(keyCode) !== -1) {
                    BaseSceneManager.moveBackward(speed)
                }
                /* if (camera.getScene().useRightHandedSystem) {
                    camera.direction.z *= -1;
                } */
                camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix)
                BABYLON.Vector3.TransformNormalToRef(direction, camera._cameraTransformMatrix, camera._transformedDirection)
                camera.cameraDirection.addInPlace(camera._transformedDirection)
            }
        }
    };

    constructor(camera: BABYLON.UniversalCamera) {
        this.camera = camera
    }
}


//The Mouse Manager to use the mouse (touch) to search around including above and below
