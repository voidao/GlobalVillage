import { VcReadyObject } from 'vue-cesium/es/utils/types'
// import * as BABYLON from 'babylonjs'
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import RTCMultiConnection from '@src/assets/lib/RTCMultiConnection'
import socketIO from '@src/assets/lib/socket.io'  // This line is pretty important :)

import { store } from '@src/store'

import { FreeCameraKeyboardWalkInput } from './InputsControl'

export default class BaseSceneManager {
  public vcReadyObj: VcReadyObject
  private base_point: BABYLON.Vector3
  private base_point_up: BABYLON.Vector3
  public engine: BABYLON.AbstractEngine
  public scene: BABYLON.Scene
  private root_node: BABYLON.TransformNode
  public canvas: HTMLCanvasElement
  private camera: BABYLON.UniversalCamera
  public RTCMC: RTCMultiConnection
  public positionBroadcasterID: number
  public myPlayer: BABYLON.Mesh
  public otherPlayers: Map<string, BABYLON.Mesh>
  private defaultPosition = {
    LNG: 120.07,
    LAT: 30.27,
    ALT: 60
  }

  private static sphericalToCartesian(longitude, latitude, altitude) {
    const EarthRadius = 6378137.0;

    // Convert degrees to radians
    const phi = latitude * Math.PI / 180;
    const lambda = longitude * Math.PI / 180;
    const r = EarthRadius + altitude;

    // Cartesian coordinates
    const x = r * Math.cos(phi) * Math.cos(lambda);
    /* const y = r * Math.cos(phi) * Math.sin(lambda);
    const z = r * Math.sin(phi); */
    const z = r * Math.cos(phi) * Math.sin(lambda);
    const y = r * Math.sin(phi);

    return new BABYLON.Vector3(-x, z, -y);
    // return new BABYLON.Vector3(x, y, z);
    // return {x: x, y: y, z: z}
  }

  private static cart2vec(cart) {
    return new BABYLON.Vector3(cart.x, cart.z, cart.y);
  }

  public addPlayer(video: HTMLVideoElement, userid: string, self: boolean) {
    // create material and texture
    var size = 512;
    const defaultMat = new BABYLON.StandardMaterial("defaultMat", this.scene);
    defaultMat.emissiveColor = BABYLON.Color3.Gray();
    defaultMat.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/TropicalSunnyDay", this.scene);
    defaultMat.reflectionFresnelParameters = new BABYLON.FresnelParameters();
    defaultMat.reflectionFresnelParameters.leftColor = BABYLON.Color3.White();
    defaultMat.reflectionFresnelParameters.rightColor = BABYLON.Color3.Black();
    var dynamicTexture = defaultMat.diffuseTexture = new BABYLON.DynamicTexture("dynamicTexture", {width:size, height:size}, this.scene);
  
    // text settings
    var font = "bold 96px monospace";
    const user = store.system.useUserStore()
    var text = user.info?.username || "Hello!";
  
    // get text width for centering
    var ctx = dynamicTexture.getContext();
    ctx.font = font
    var textWidth = ctx.measureText(text).width;    
  
    // draw text
    var clearColor = "#00FFFF";
    var textColor = "#FF0000";
    dynamicTexture.drawText(text, (size - textWidth) / 2, size / 2 + 24, font, textColor, clearColor, false, true);
  
    // map face UVs to draw text only on top of cylinder
    var faceUV = [];
    faceUV[0] =	new BABYLON.Vector4(0, 0, 1, 1); // use only the first pixel (which has no text, just the background color)
    faceUV[1] =	new BABYLON.Vector4(0, 0, 0, 0); // use onlly the first pixel
    faceUV[2] = new BABYLON.Vector4(0, 0, 1, 1); // use the full texture    
    
    var videoFigure = BABYLON.MeshBuilder.CreateCylinder("player-" + video.id, {height: 9, diameter: 58, diameterBottom: 66, faceUV: faceUV}, this.scene);
    videoFigure.id = userid;
  
    videoFigure.rotation.z = Math.PI;
    videoFigure.rotation.y = 5 * Math.PI / 6;
    videoFigure.rotation.x = 1 * Math.PI / 6;
    
    var videoFigureMat = new BABYLON.StandardMaterial("playerMat-" + video.id, this.scene);
    var videoTexure = new BABYLON.VideoTexture(video.id, video, this.scene, false, true);
    videoFigureMat.diffuseTexture = videoTexure;
    videoFigureMat.roughness = 1;
    videoFigureMat.emissiveColor = BABYLON.Color3.Gray();
    videoFigureMat.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/TropicalSunnyDay", this.scene);
    videoFigureMat.reflectionFresnelParameters = new BABYLON.FresnelParameters();
    videoFigureMat.reflectionFresnelParameters.leftColor = BABYLON.Color3.White();
    videoFigureMat.reflectionFresnelParameters.rightColor = BABYLON.Color3.Black();
  
    const playerMultiMat = new BABYLON.MultiMaterial("playerMultiMat", this.scene);
    
    playerMultiMat.subMaterials.push(videoFigureMat);
    playerMultiMat.subMaterials.push(defaultMat);
  
    videoFigure.material = playerMultiMat;
  
    // videoFigure.subMeshes = [];
    const verticesCount = videoFigure.getTotalVertices();
    
    new BABYLON.SubMesh(0, 0, verticesCount, 0, 51, videoFigure);
    new BABYLON.SubMesh(1, 0, verticesCount, 51, 51, videoFigure);
    new BABYLON.SubMesh(1, 0, verticesCount, 51*2, 116, videoFigure);
    
    this.scene.onPointerObservable.add((evt) => {
            if(evt.pickInfo.pickedMesh === videoFigure){
                    if(videoTexure.video.paused)
                        videoTexure.video.play();
                    else
                        videoTexure.video.pause();
                    console.log(videoTexure.video.paused?"paused":"playing");
            }
    }, BABYLON.PointerEventTypes.POINTERPICK);
  
    if(self) {
      videoFigure.position = new BABYLON.Vector3(this.defaultPosition.LNG - 230 * Math.random(), this.defaultPosition.LAT - 180 * Math.random(), this.defaultPosition.ALT);
      
      this.myPlayer = videoFigure;
      this.myPlayer.parent = this.camera;
  
      this.positionBroadcasterID = setInterval(() => {
        if(this.RTCMC) {
          this.updatePosition()
        }
      }, 3000);
    } else {
      videoFigure.position = BABYLON.Vector3.Zero();
      this.otherPlayers[userid] = videoFigure;
    }
  }

  private initRTC() {
    socketIO();
    const connection = new RTCMultiConnection();
  
    // this line is VERY_important
    connection.socketURL = import.meta.env.VITE_SIGNALING || 'https://muazkhan.com:9001/';
    // connection.socketURL = 'http://localhost:9001/';
    // connection.socketURL = 'https://muazkhan.com:9001/';
  
    // all below lines are optional; however recommended.
  
    connection.session = {
        audio: true,
        video: true,
        data: true
    };
  
    connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    };
  
    connection.onstream = (streamEvent) => {
      /* connection.setCustomSocketEvent('updatePlayer');
      connection.socket.on('updatePlayer', (player) => {
        this.otherPlayers[player.player] = player.target;
        console.log('this.otherPlayers[playerPosition.player]: ' + JSON.stringify(this.otherPlayers[player.player]))
      }); */
      connection.setCustomSocketEvent('updateScaling');
      connection.socket.on('updateScaling', (playerScaling) => {
        // this.otherPlayers[playerScaling.player].scaling = playerScaling.target;
        // this.otherPlayers[playerScaling.player].scaling = new BABYLON.Vector3(1.8, 1, 1.8)
        this.otherPlayers[playerScaling.player].scaling = new BABYLON.Vector3(18, 10, 18)
        // console.log('this.otherPlayers[playerScaling.player].scaling: ' + JSON.stringify(this.otherPlayers[playerScaling.player].scaling))
      });

      connection.setCustomSocketEvent('updatePosition');
      connection.socket.on('updatePosition', (playerPosition) => {
        this.otherPlayers[playerPosition.player].position = playerPosition.target;
        // console.log('this.otherPlayers[playerPosition.player].position: ' + JSON.stringify(this.otherPlayers[playerPosition.player].position))
      });

      connection.setCustomSocketEvent('updateRotation');
      connection.socket.on('updateRotation', (playerRotation) => {
        // console.log('updateRotation-' + playerRotation.player + ': ' + JSON.stringify(playerRotation.target))
        // this.otherPlayers[playerRotation.player].rotation = playerRotation.target; // Don't know why this doesn't work, yet!!!
        if(playerRotation.target == 'left') {
            this.otherPlayers[playerRotation.player].rotation.z += Math.PI / 66;
        } else if(playerRotation.target == 'right') {
            this.otherPlayers[playerRotation.player].rotation.z -= Math.PI / 66;
        }
      });

      connection.setCustomSocketEvent('movePOV');
      connection.socket.on('movePOV', (playerPosition) => {
        this.otherPlayers[playerPosition.player].movePOV(0, playerPosition.target.y, 0)
      });
  
      if(streamEvent.type === "local") {
        this.addPlayer(streamEvent.mediaElement, streamEvent.userid, true)
      } else {
        this.addPlayer(streamEvent.mediaElement, streamEvent.userid, false)
      }
    }
  
    connection.onclose = (event) => {
      let player: BABYLON.Mesh
  
      if(event.type === "local") {
        player = this.myPlayer
      } else {
        player = this.otherPlayers[event.userid]
      }
  
      /* const videoEl = player.material.diffuseTexture.video
  
      // Remove any <source> elements, etc.
      while (videoEl.firstChild) {
          videoEl.removeChild(videoEl.lastChild);
      }
  
      // Set a blank src
      videoEl.src = ''
  
      // Prevent non-important errors in some browsers
      videoEl.removeAttribute('src')
  
      // Get certain browsers to let go
      videoEl.load()
  
      videoEl.remove() */
  
      player.dispose()
  
      if(event.type === "local") {
        this.myPlayer = null;
        clearInterval(this.positionBroadcasterID);
      } else {
        delete this.otherPlayers[event.userid]
      }
    }
  
    connection.onstreamended = (event) => {
      let player: BABYLON.Mesh
  
      if(event.type === "local") {
        player = this.myPlayer;
      } else {
        player = this.otherPlayers[event.streamid];
      }
  
      const videoEl = player.material.diffuseTexture.video;
  
      // Remove any <source> elements, etc.
      while (videoEl.firstChild) {
          videoEl.removeChild(videoEl.lastChild);
      }
  
      // Set a blank src
      videoEl.src = ''
  
      // Prevent non-important errors in some browsers
      videoEl.removeAttribute('src')
  
      // Get certain browsers to let go
      videoEl.load()
  
      videoEl.remove()
  
      player.dispose();
      
      if(event.type === "local") {
        this.myPlayer = null;
      } else {
        delete this.otherPlayers[event.userid]
      }   
    }
  
    connection.openOrJoin("GV-Globe");
  
    this.RTCMC = connection;
  }
  
  public moveBabylonCamera() {
      let fov = this.vcReadyObj.Cesium.Math.toDegrees(this.vcReadyObj.viewer.camera.frustum.fovy)
      this.camera.fov = fov / 180 * Math.PI;
  
      let civm = this.vcReadyObj.viewer.camera.inverseViewMatrix;
      let camera_matrix = BABYLON.Matrix.FromValues(
          civm[0 ], civm[1 ], civm[2 ], civm[3 ],
          civm[4 ], civm[5 ], civm[6 ], civm[7 ],
          civm[8 ], civm[9 ], civm[10], civm[11],
          civm[12], civm[13], civm[14], civm[15]
      );
  
      let scaling = BABYLON.Vector3.Zero(), rotation = BABYLON.Quaternion.Zero(), transform = BABYLON.Vector3.Zero();
      camera_matrix.decompose(scaling, rotation, transform);
      let camera_pos = BaseSceneManager.cart2vec(transform),
          camera_direction = BaseSceneManager.cart2vec(this.vcReadyObj.viewer.camera.direction),
          camera_up = BaseSceneManager.cart2vec(this.vcReadyObj.viewer.camera.up);
  
      let rotation_y = Math.atan(camera_direction.z / camera_direction.x);
      if (camera_direction.x < 0) rotation_y += Math.PI;
      rotation_y = Math.PI / 2 - rotation_y;
      let rotation_x = Math.asin(-camera_direction.y);
      let camera_up_before_rotatez = new BABYLON.Vector3(-Math.cos(rotation_y), 0, Math.sin(rotation_y));
      let rotation_z = Math.acos(camera_up.x * camera_up_before_rotatez.x + camera_up.y * camera_up_before_rotatez.y + camera_up.z * camera_up_before_rotatez.z);
      rotation_z = Math.PI / 2 - rotation_z;
      if (camera_up.y < 0) rotation_z = Math.PI - rotation_z;
  
      this.camera.position.x = camera_pos.x - this.base_point.x;
      this.camera.position.y = camera_pos.y - this.base_point.y;
      this.camera.position.z = camera_pos.z - this.base_point.z;
      this.camera.rotation.x = rotation_x;
      this.camera.rotation.y = rotation_y;
      this.camera.rotation.z = rotation_z;
  }

  private initCesium () {
    this.base_point = BaseSceneManager.cart2vec(this.vcReadyObj.Cesium.Cartesian3.fromDegrees(this.defaultPosition.LNG, this.defaultPosition.LAT, 50));
    this.base_point_up = BaseSceneManager.cart2vec(this.vcReadyObj.Cesium.Cartesian3.fromDegrees(this.defaultPosition.LNG, this.defaultPosition.LAT, 300));

    this.vcReadyObj.viewer.camera.flyTo({
        destination : this.vcReadyObj.Cesium.Cartesian3.fromDegrees(this.defaultPosition.LNG, this.defaultPosition.LAT - 0.003, this.defaultPosition.ALT + 60),
        orientation : {
            heading : this.vcReadyObj.Cesium.Math.toRadians(0.0),
            pitch : this.vcReadyObj.Cesium.Math.toRadians(-10.0)
        }
    });
  }

  private initBabylon(canvas: HTMLCanvasElement) {
    const engine = new BABYLON.Engine(canvas);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    /* scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "W",
        },
        () => {
            this.myPlayer.position.y += 3;
            this.RTCMC.socket.emit('updatePosition', {
                player: this.myPlayer.id,
                target: this.myPlayer.position
            });
        },
        ),
    );
    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "S",
        },
        () => {
            this.myPlayer.position.y -= 3;
            this.RTCMC.socket.emit('updatePosition', {
                player: this.myPlayer.id,
                target: this.myPlayer.position
            });
        },
        ),
    );
    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "A",
        },
        () => {
            this.myPlayer.position.x += 3;
            this.RTCMC.socket.emit('updatePosition', {
                player: this.myPlayer.id,
                target: this.myPlayer.position
            });
        },
        ),
    );
    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "D",
        },
        () => {
            this.myPlayer.position.x -= 3;
            this.RTCMC.socket.emit('updatePosition', {
                player: this.myPlayer.id,
                target: this.myPlayer.position
            });
        },
        ),
    );
    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "Q",
        },
        () => {
            this.myPlayer.position.z += 3;
            this.RTCMC.socket.emit('updatePosition', {
                player: this.myPlayer.id,
                target: this.myPlayer.position
            });
        },
        ),
    );
    scene.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "E",
        },
        () => {
            this.myPlayer.position.z -= 3;
            this.RTCMC.socket.emit('updatePosition', {
                player: this.myPlayer.id,
                target: this.myPlayer.position
            });
        },
        ),
    ); */

    const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 0, -10), this.scene);

    //First, set the scene's activeCamera... to be YOUR camera.
    scene.activeCamera = camera;
    // Then attach the activeCamera to the canvas.
    //Parameters: canvas, noPreventDefault
    scene.activeCamera.attachControl(canvas, true);

    this.root_node = new BABYLON.TransformNode("BaseNode", scene);
    this.root_node.lookAt(this.base_point_up.subtract(this.base_point));
    this.root_node.addRotation(Math.PI / 2, 0, 0);

    // New Input Management for Camera
    
    //First remove the default management.
    camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    camera.inputs.removeByType("FreeCameraMouseInput");

    //Add the new keys input manager to the camera.
    //  camera.inputs.add(new FreeCameraKeyboardWalkInput());
    camera.inputs.add(new FreeCameraKeyboardWalkInput(camera, this));

    //Add the new mouse input manager to the camera
    // camera.inputs.add(new FreeCameraSearchInput());

    this.engine = engine
    this.scene = scene
    this.camera = camera

    const button = document.createElement("button");
    button.style.top = "60px";
    button.style.left = "30px";
    button.textContent = "@XiXiWetland";
    button.style.width = "106px"
    button.style.height = "33px"
    button.style.position = "absolute";
	button.style.color = "white";
    button.style.background = "rgba(0, 68, 82, 0.6)"
    button.style["border-radius"] = "30px"

    document.body.appendChild(button);

    button.addEventListener("click", () => {
        this.base_point = BaseSceneManager.cart2vec(this.vcReadyObj.Cesium.Cartesian3.fromDegrees(120.07, 30.27, 50));
        this.base_point_up = BaseSceneManager.cart2vec(this.vcReadyObj.Cesium.Cartesian3.fromDegrees(120.07, 30.27, 300));

        this.root_node.lookAt(this.base_point_up.subtract(this.base_point));
        this.root_node.addRotation(Math.PI / 2, 0, 0);

        this.vcReadyObj.viewer.camera.flyTo({
            destination : this.vcReadyObj.Cesium.Cartesian3.fromDegrees(120.07, 30.27 - 0.003, 60),
            orientation : {
                heading : this.vcReadyObj.Cesium.Math.toRadians(0.0),
                pitch : this.vcReadyObj.Cesium.Math.toRadians(-10.0)
            }
        });

        this.myPlayer.position = new BABYLON.Vector3(120.07  - 230 * Math.random(), 30.27  - 180 * Math.random(), 60)

        engine.runRenderLoop(() => {
            this.vcReadyObj.viewer.render();
            this.moveBabylonCamera();
            this.scene.render();
        });
    })

    engine.runRenderLoop(() => {
        this.vcReadyObj.viewer.render();
        this.moveBabylonCamera();
        this.scene.render();
    });
  }

  private init(canvas: HTMLCanvasElement) {
    this.initCesium()
    this.initBabylon(canvas)
    this.initRTC()
  }

  private updateScaling() {
    this.RTCMC.socket.emit('updateScaling', {
        player: this.myPlayer.id,
        target: this.myPlayer.scaling
    });
  }

  public updatePosition() {
    this.RTCMC.socket.emit('updatePosition', {
        player: this.myPlayer.id,
        target: this.myPlayer.position
    });
  }

  private updateRotation() {
    this.RTCMC.socket.emit('updateRotation', {
        player: this.myPlayer.id,
        target: this.myPlayer.rotation
    });
  }

  private updatePlayer() {
    this.RTCMC.socket.emit('updatePlayer', {
        player: this.myPlayer.id,
        target: this.myPlayer
    })
  }

  constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement) {
    this.vcReadyObj = vcReadyObj
    this.otherPlayers = new Map<string, BABYLON.Mesh>()
    this.canvas = canvas

    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser!')
    } else {
        navigator.geolocation.getCurrentPosition((position) => {
          this.defaultPosition.LNG = position.coords.longitude
          this.defaultPosition.LAT = position.coords.latitude
          this.defaultPosition.ALT = position.coords.altitude
    
          this.init(canvas);
        },
        () => {
          alert('Unable to retrieve your position!')
    
          this.init(canvas);
        },
        {
          timeout: 3000
        })
    }
  }

  lookLeft(angle: number) {
    this.vcReadyObj.viewer.camera.lookLeft(angle)

    // Don't know why this doesn't work, yet!!!
    /* this.myPlayer.rotation.z += Math.PI / 6
    this.updateRotation() */
    this.RTCMC.socket.emit('updateRotation', {
        player: this.myPlayer.id,
        target: 'left'
    });
  }

  lookRight(angle: number) {
    this.vcReadyObj.viewer.camera.lookRight(angle)

    /* this.myPlayer.rotation.z -= Math.PI / 6
    this.updateRotation() */
    this.RTCMC.socket.emit('updateRotation', {
        player: this.myPlayer.id,
        target: 'right'
    });
  }

  rotateLeft(angle: number) {
    this.vcReadyObj.viewer.camera.rotateLeft(angle)
  }

  rotateRight(angle: number) {
    this.vcReadyObj.viewer.camera.rotateRight(angle)
  }

  moveForward(amount: number) {
    this.vcReadyObj.viewer.camera.moveForward(amount)

    // Needs Better Solution!!!
    this.myPlayer.movePOV(0, 0.3, 0)
    this.updatePosition()
  }

  moveBackward(amount: number) {
    this.vcReadyObj.viewer.camera.moveBackward(amount)

    this.myPlayer.movePOV(0, -0.3, 0)
    this.updatePosition()
  }
}