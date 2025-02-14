//Key Input Manager To Use Keys to Move Forward and BackWard and Look to the Left or Right

// import { ICameraInput, UniversalCamera } from "babylonjs";
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import BaseSceneManager from './BaseSceneManager'

export class FreeCameraKeyboardWalkInput implements BABYLON.ICameraInput<BABYLON.UniversalCamera> {
    private sceneManager: BaseSceneManager
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
                    this.sceneManager.lookLeft(angularSpeed)
                }
                else if (this.keysRight.indexOf(keyCode) !== -1) {
                    this.sceneManager.lookRight(angularSpeed)
                }
                else if (this.keysUp.indexOf(keyCode) !== -1) {
                    this.sceneManager.moveForward(speed)
                }
                else if (this.keysDown.indexOf(keyCode) !== -1) {
                    this.sceneManager.moveBackward(speed)
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

    constructor(camera: BABYLON.UniversalCamera, sceneManager: BaseSceneManager) {
        this.camera = camera
        this.sceneManager = sceneManager
    }
}


/* //The Mouse Manager to use the mouse (touch) to search around including above and below
var FreeCameraSearchInput = function (touchEnabled) {
    if (touchEnabled === void 0) { touchEnabled = true; }
    this.touchEnabled = touchEnabled;
    this.buttons = [0, 1, 2];
    this.angularSensibility = 2000.0;
    this.restrictionX = 100;
    this.restrictionY = 60;
}

//add attachment control which also contains the code to react to the input from the mouse
FreeCameraSearchInput.prototype.attachControl = function (noPreventDefault) {
    var _this = this;
    var engine = this.camera.getEngine();
    var element = engine.getInputElement();
    var angle = {x:0, y:0};
    if (!this._pointerInput) {
        this._pointerInput = function (p, s) {
            var evt = p.event;
            if (!_this.touchEnabled && evt.pointerType === "touch") {
                return;
            }
            if (p.type !== BABYLON.PointerEventTypes.POINTERMOVE && _this.buttons.indexOf(evt.button) === -1) {
                return;
            }
            if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                try {
                    evt.srcElement.setPointerCapture(evt.pointerId);
                }
                catch (e) {
                    //Nothing to do with the error. Execution will continue.
                }
                _this.previousPosition = {
                    x: evt.clientX,
                    y: evt.clientY
                };
                if (!noPreventDefault) {
                    evt.preventDefault();
                    element.focus();
                }
            }
            else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {
                try {
                    evt.srcElement.releasePointerCapture(evt.pointerId);
                }
                catch (e) {
                    //Nothing to do with the error.
                }
                _this.previousPosition = null;
                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            }
            else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                if (!_this.previousPosition || engine.isPointerLock) {
                    return;
                }
                var offsetX = evt.clientX - _this.previousPosition.x;
                var offsetY = evt.clientY - _this.previousPosition.y;
                angle.x +=offsetX;
                angle.y -=offsetY;
                if(Math.abs(angle.x) > _this.restrictionX )  {
                    angle.x -=offsetX;
                }
                if(Math.abs(angle.y) > _this.restrictionY )  {
                    angle.y +=offsetY;
                }
                if (_this.camera.getScene().useRightHandedSystem) {
                    if(Math.abs(angle.x) < _this.restrictionX )  {
                        _this.camera.cameraRotation.y -= offsetX / _this.angularSensibility;
                    }
                }
                else {
                    if(Math.abs(angle.x) < _this.restrictionX )  {
                        _this.camera.cameraRotation.y += offsetX / _this.angularSensibility;
                    }
                }
                if(Math.abs(angle.y) < _this.restrictionY )  {
                    _this.camera.cameraRotation.x += offsetY / _this.angularSensibility;
                }
                _this.previousPosition = {
                    x: evt.clientX,
                    y: evt.clientY
                };
                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            }
        };
    }
    this._onSearchMove = function (evt) {
        if (!engine.isPointerLock) {
            return;
        }
        var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
        var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
        if (_this.camera.getScene().useRightHandedSystem) {
            _this.camera.cameraRotation.y -= offsetX / _this.angularSensibility;
        }
        else {
            _this.camera.cameraRotation.y += offsetX / _this.angularSensibility;
        }
        _this.camera.cameraRotation.x += offsetY / _this.angularSensibility;
        _this.previousPosition = null;
        if (!noPreventDefault) {
            evt.preventDefault();
        }
    };
    this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
    element.addEventListener("mousemove", this._onSearchMove, false);
};

//Add detachment control
FreeCameraSearchInput.prototype.detachControl = function () {
    var engine = this.camera.getEngine();
    var element = engine.getInputElement();
    if (this._observer && element) {
        this.camera.getScene().onPointerObservable.remove(this._observer);
        element.removeEventListener("mousemove", this._onSearchMove);
        this._observer = null;
        this._onSearchMove = null;
        this.previousPosition = null;
    }
};

//Add the two required functions for names
FreeCameraSearchInput.prototype.getClassName = function () {
    return "FreeCameraSearchInput";
};

FreeCameraSearchInput.prototype.getSimpleName = function () {
    return "MouseSearchCamera";
}; */
