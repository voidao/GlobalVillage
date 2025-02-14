import { VcReadyObject } from 'vue-cesium/es/utils/types'
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import HavokPhysics from '@babylonjs/havok'
import RTCMultiConnection from '@src/assets/lib/RTCMultiConnection'
import socketIO from '@src/assets/lib/socket.io'  // This line is pretty important :)

import { store } from '@src/store'

import { FreeCameraKeyboardWalkInput } from './InputsControl'
import { Position } from '@src/types/position'
import { event } from 'quasar'

export default class BaseSceneManager {
  private static instance: BaseSceneManager

  public vcReadyObj: VcReadyObject
  public base_point: BABYLON.Vector3
  public base_point_up: BABYLON.Vector3
  public engine: BABYLON.AbstractEngine
  public scene: BABYLON.Scene
  public root_node: BABYLON.TransformNode
  public canvas: HTMLCanvasElement
  public camera: BABYLON.UniversalCamera
  public RTCMC: RTCMultiConnection
  public positionBroadcasterID: number
  public myPlayer: BABYLON.Mesh
  public otherPlayers: Map<string, BABYLON.Mesh>
  public defaultPosition: Position = {
    LNG: 120.07,
    LAT: 30.27,
    ALT: 60
  }

  private static sphericalToCartesian(longitude, latitude, altitude) {
    const EarthRadius = 6378137.0

    // Convert degrees to radians
    const phi = latitude * Math.PI / 180
    const lambda = longitude * Math.PI / 180
    const r = EarthRadius + altitude

    // Cartesian coordinates
    const x = r * Math.cos(phi) * Math.cos(lambda)
    /* const y = r * Math.cos(phi) * Math.sin(lambda);
    const z = r * Math.sin(phi); */
    const z = r * Math.cos(phi) * Math.sin(lambda)
    const y = r * Math.sin(phi)

    return new BABYLON.Vector3(-x, z, -y)
    // return new BABYLON.Vector3(x, y, z);
    // return {x: x, y: y, z: z}
  }

  private static cart2vec(cart) {
    return new BABYLON.Vector3(cart.x, cart.z, cart.y)
  }

  private constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement) {
    this.vcReadyObj = vcReadyObj
    this.otherPlayers = new Map<string, BABYLON.Mesh>()
    this.canvas = canvas

    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser!')
    } else {
        navigator.geolocation.getCurrentPosition(position => {
          this.defaultPosition.LNG = position.coords.longitude
          this.defaultPosition.LAT = position.coords.latitude
          this.defaultPosition.ALT = position.coords.altitude

          this.init(canvas)
        },
        () => {
          alert('Unable to retrieve your position!')

          this.init(canvas)
        },
        {
          timeout: 3000
        })
    }
  }

  private closeRTC(event: any) {
    let player: BABYLON.Mesh

    if(event.type === 'local') {
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

    if(event.type === 'local') {
      this.myPlayer = null
      clearInterval(this.positionBroadcasterID)
    } else {
      delete this.otherPlayers[event.userid]
    }
  }

  private connectPeer(streamEvent: any, sceneType: string, scene?: BABYLON.Scene) {
    const connection = this.RTCMC
    // alert('onstream: ' + streamEvent.type + '-' + streamEvent.userid)
    /* connection.setCustomSocketEvent('updatePlayer');
    connection.socket.on('updatePlayer', (player) => {
      this.otherPlayers[player.player] = player.target;
      console.log('this.otherPlayers[playerPosition.player]: ' + JSON.stringify(this.otherPlayers[player.player]))
    }); */

    connection.setCustomSocketEvent('updatePosition')
    connection.socket.on('updatePosition', playerPosition => {
      if(this.otherPlayers[playerPosition.player]) {
          /* console.log('UpdatePosition@' + playerPosition.player + ': From-'+JSON.stringify(this.otherPlayers[playerPosition.player].position) + ' To-' + JSON.stringify(playerPosition.target))
          console.log('this.otherPlayers[playerPosition.player].position.x:' + this.otherPlayers[playerPosition.player].position._x + ' playerPosition.target.x: ' + playerPosition.target._x) */
          // this.otherPlayers[playerPosition.player].position = playerPosition.target /* This doesn't work with Havok, so changed to the below. */
          this.otherPlayers[playerPosition.player].position.x = playerPosition.target._x
          this.otherPlayers[playerPosition.player].position.y = playerPosition.target._y
          this.otherPlayers[playerPosition.player].position.z = playerPosition.target._z
      }
    })

    connection.setCustomSocketEvent('updateRotation')
    connection.socket.on('updateRotation', playerRotation => {
      // console.log('updateRotation-' + playerRotation.player + ': ' + JSON.stringify(playerRotation.target))
      // this.otherPlayers[playerRotation.player].rotation = playerRotation.target; // Don't know why this doesn't work, yet!!!
      if(playerRotation.target == 'left') {
          this.otherPlayers[playerRotation.player].rotation.z += Math.PI / 66
      } else if(playerRotation.target == 'right') {
          this.otherPlayers[playerRotation.player].rotation.z -= Math.PI / 66
      }
    })

    this.addPlayer(streamEvent, sceneType, scene)
  }

  private initRTC() {
    socketIO()
    const connection = new RTCMultiConnection()

    // this line is VERY_important
    connection.socketURL = import.meta.env.VITE_SIGNALING || 'https://muazkhan.com:9001/'
    // connection.socketURL = 'http://localhost:9001/';
    // connection.socketURL = 'https://muazkhan.com:9001/';

    // all below lines are optional; however recommended.

    connection.session = {
        audio: true,
        video: true,
        data: true
    }

    connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
    }

    // first step, ignore default STUN+TURN servers
    connection.iceServers = []

    // second step, set STUN url
    connection.iceServers.push({
        urls: 'stun:relay1.expressturn.com:3478'
    })

    // last step, set TURN url (recommended)
    connection.iceServers.push({
        urls: 'turn:relay1.expressturn.com:3478',
        credential: 'MzfF6EsaoFoedmtF',
        username: 'efJMS09F9O5E77NPFE'
    })

    this.RTCMC = connection

    this.enter('GV-Globe', 'cesium')
  }

  private moveBabylonCamera() {
      const fov = this.vcReadyObj.Cesium.Math.toDegrees(this.vcReadyObj.viewer.camera.frustum.fovy)
      this.camera.fov = fov / 180 * Math.PI

      const civm = this.vcReadyObj.viewer.camera.inverseViewMatrix
      const camera_matrix = BABYLON.Matrix.FromValues(
          civm[0 ], civm[1 ], civm[2 ], civm[3 ],
          civm[4 ], civm[5 ], civm[6 ], civm[7 ],
          civm[8 ], civm[9 ], civm[10], civm[11],
          civm[12], civm[13], civm[14], civm[15]
      )

      const scaling = BABYLON.Vector3.Zero(), rotation = BABYLON.Quaternion.Zero(), transform = BABYLON.Vector3.Zero()
      camera_matrix.decompose(scaling, rotation, transform)
      const camera_pos = BaseSceneManager.cart2vec(transform),
          camera_direction = BaseSceneManager.cart2vec(this.vcReadyObj.viewer.camera.direction),
          camera_up = BaseSceneManager.cart2vec(this.vcReadyObj.viewer.camera.up)

      let rotation_y = Math.atan(camera_direction.z / camera_direction.x)
      if (camera_direction.x < 0) rotation_y += Math.PI
      rotation_y = Math.PI / 2 - rotation_y
      const rotation_x = Math.asin(-camera_direction.y)
      const camera_up_before_rotatez = new BABYLON.Vector3(-Math.cos(rotation_y), 0, Math.sin(rotation_y))
      let rotation_z = Math.acos(camera_up.x * camera_up_before_rotatez.x + camera_up.y * camera_up_before_rotatez.y + camera_up.z * camera_up_before_rotatez.z)
      rotation_z = Math.PI / 2 - rotation_z
      if (camera_up.y < 0) rotation_z = Math.PI - rotation_z

      this.camera.position.x = camera_pos.x - this.base_point.x
      this.camera.position.y = camera_pos.y - this.base_point.y
      this.camera.position.z = camera_pos.z - this.base_point.z
      this.camera.rotation.x = rotation_x
      this.camera.rotation.y = rotation_y
      this.camera.rotation.z = rotation_z
  }

  private runRenderLoop() {
    this.engine.runRenderLoop(() => {
      this.vcReadyObj.viewer.render()
      this.moveBabylonCamera()
      this.scene.render()
    })
  }

  private initCesium (canvas: HTMLCanvasElement) {
    this.base_point = BaseSceneManager.cart2vec(this.vcReadyObj.Cesium.Cartesian3.fromDegrees(this.defaultPosition.LNG, this.defaultPosition.LAT, 50))
    this.base_point_up = BaseSceneManager.cart2vec(this.vcReadyObj.Cesium.Cartesian3.fromDegrees(this.defaultPosition.LNG, this.defaultPosition.LAT, 300))

    this.vcReadyObj.viewer.camera.flyTo({
        destination : this.vcReadyObj.Cesium.Cartesian3.fromDegrees(this.defaultPosition.LNG, this.defaultPosition.LAT - 0.003, this.defaultPosition.ALT + 60),
        orientation : {
            heading : this.vcReadyObj.Cesium.Math.toRadians(0.0),
            pitch : this.vcReadyObj.Cesium.Math.toRadians(-10.0)
        }
    })
  }

  private initBabylon(canvas: HTMLCanvasElement) {
    const engine = new BABYLON.Engine(canvas)
    const scene = new BABYLON.Scene(engine)

    // scene.debugLayer.show()

    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0)

    const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 0, -10), this.scene)

    //First, set the scene's activeCamera... to be YOUR camera.
    scene.activeCamera = camera
    // Then attach the activeCamera to the canvas.
    //Parameters: canvas, noPreventDefault
    scene.activeCamera.attachControl(canvas, true)

    this.root_node = new BABYLON.TransformNode('BaseNode', scene)
    this.root_node.lookAt(this.base_point_up.subtract(this.base_point))
    this.root_node.addRotation(Math.PI / 2, 0, 0)

    // New Input Management for Camera

    //First remove the default management.
    camera.inputs.removeByType('FreeCameraKeyboardMoveInput')
    camera.inputs.removeByType('FreeCameraMouseInput')

    //Add the new keys input manager to the camera.
    //  camera.inputs.add(new FreeCameraKeyboardWalkInput());
    camera.inputs.add(new FreeCameraKeyboardWalkInput(camera, this))

    //Add the new mouse input manager to the camera
    // camera.inputs.add(new FreeCameraSearchInput());

    this.engine = engine
    this.scene = scene
    this.camera = camera

    this.createButton('@XiXiWetland', '30px', '106px', () => {
        this.enter('GV-XiXiWetland', 'cesium')

        this.base_point = BaseSceneManager.cart2vec(this.vcReadyObj.Cesium.Cartesian3.fromDegrees(120.07, 30.27, 50))
        this.base_point_up = BaseSceneManager.cart2vec(this.vcReadyObj.Cesium.Cartesian3.fromDegrees(120.07, 30.27, 300))

        this.root_node.lookAt(this.base_point_up.subtract(this.base_point))
        this.root_node.addRotation(Math.PI / 2, 0, 0)

        this.vcReadyObj.viewer.camera.flyTo({
            destination : this.vcReadyObj.Cesium.Cartesian3.fromDegrees(120.07, 30.27 - 0.003, 60),
            orientation : {
                heading : this.vcReadyObj.Cesium.Math.toRadians(0.0),
                pitch : this.vcReadyObj.Cesium.Math.toRadians(-10.0)
            }
        })

        this.myPlayer.position = new BABYLON.Vector3(120.07  - 230 * Math.random(), 30.27  - 180 * Math.random(), 60)

        this.runRenderLoop()
    })

    this.runRenderLoop()
  }

  private init(canvas: HTMLCanvasElement) {
    this.initCesium(canvas)
    this.initBabylon(canvas)
    this.initRTC()
  }

  public static getInstance(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement): BaseSceneManager {
    if (!BaseSceneManager.instance) {
        BaseSceneManager.instance = new BaseSceneManager(vcReadyObj, canvas)
    }

    return BaseSceneManager.instance
  }

  public registerPickHandler(pickedObjectName: string, canvas: HTMLCanvasElement, load: () => void) {
        const pickHandler = new this.vcReadyObj.Cesium.ScreenSpaceEventHandler(canvas)
        pickHandler.setInputAction(event => {
            const pickedObject = this.vcReadyObj.viewer.scene.pick(event.position)
            // alert('PickedObject: ' + JSON.stringify(pickedObject.id.name))
            if(pickedObject && pickedObject.id.name.includes(pickedObjectName)) {
                load()
            }
        }, this.vcReadyObj.Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
  }

  public createModel(url: string, scale: number, position?: Position) {
    // this.vcReadyObj.viewer.entities.removeAll()
    const posForModel = position ? position : this.defaultPosition

    const pos = Cesium.Cartesian3.fromDegrees(
      posForModel.LNG,
      posForModel.LAT,
      posForModel.ALT,
    )
    const heading = Cesium.Math.toRadians(135)
    const pitch = 0
    const roll = 0
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll)
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(pos, hpr)

    const entity = this.vcReadyObj.viewer.entities.add({
      name: url,
      position: pos,
      orientation: orientation,
      model: {
        uri: url,
        // scale: scale,
        minimumPixelSize: 128,
        maximumScale: scale,
      },
    })
    // this.vcReadyObj.viewer.trackedEntity = entity
  }

  public prepareMaterial(video: HTMLVideoElement, scene: BABYLON.Scene): BABYLON.Material {
    // create material and texture
    const size = 512
    const defaultMat = new BABYLON.StandardMaterial('defaultMat', scene)
    defaultMat.emissiveColor = BABYLON.Color3.Gray()
    defaultMat.reflectionTexture = new BABYLON.CubeTexture('https://playground.babylonjs.com/textures/TropicalSunnyDay', scene)
    defaultMat.reflectionFresnelParameters = new BABYLON.FresnelParameters()
    defaultMat.reflectionFresnelParameters.leftColor = BABYLON.Color3.White()
    defaultMat.reflectionFresnelParameters.rightColor = BABYLON.Color3.Black()
    const dynamicTexture = defaultMat.diffuseTexture = new BABYLON.DynamicTexture('dynamicTexture', { width:size, height:size }, scene)

    // text settings
    const font = 'bold 96px monospace'
    const user = store.system.useUserStore()
    const text = user.info?.username || user.info?.user_metadata?.name || 'Guest'

    // get text width for centering
    const ctx = dynamicTexture.getContext()
    ctx.font = font
    const textWidth = ctx.measureText(text).width

    // draw text
    const clearColor = '#00FFFF'
    const textColor = '#FF0000'
    dynamicTexture.drawText(text, (size - textWidth) / 2, size / 2 + 24, font, textColor, clearColor, false, true)

    const videoFigureMat = new BABYLON.StandardMaterial('playerMat-' + video.id, scene)
    const videoTexure = new BABYLON.VideoTexture(video.id, video, scene, false, true)
    videoFigureMat.diffuseTexture = videoTexure
    videoFigureMat.roughness = 1
    videoFigureMat.emissiveColor = BABYLON.Color3.Gray()

    const playerMultiMat = new BABYLON.MultiMaterial('playerMultiMat', scene)

    playerMultiMat.subMaterials.push(videoFigureMat)
    playerMultiMat.subMaterials.push(defaultMat)

    return playerMultiMat
  }

  public createVideoFigure(streamEvent: any, sceneType: string, scene? : BABYLON.Scene): BABYLON.Mesh{
    const video = streamEvent.mediaElement
    const userid = streamEvent.userid

    const faceUV = []
    // map face UVs to draw text only on top of cylinder
    faceUV[0] =	new BABYLON.Vector4(0, 0, 1, 1) // use only the first pixel (which has no text, just the background color)
    faceUV[1] =	new BABYLON.Vector4(0, 0, 0, 0) // use onlly the first pixel
    faceUV[2] = new BABYLON.Vector4(0, 0, 1, 1) // use the full texture

    let videoFigure: BABYLON.Mesh
    if(sceneType === 'cesium') {
      videoFigure = BABYLON.MeshBuilder.CreateCylinder('player-' + video.id,
        { height: 9, diameter: 58, diameterBottom: 66, faceUV: faceUV, tessellation: 68 },
        this.scene)

      videoFigure.rotation.z = Math.PI
      videoFigure.rotation.y = 5 * Math.PI / 6
      videoFigure.rotation.x = 1 * Math.PI / 6
    } else {
      videoFigure = BABYLON.MeshBuilder.CreateCylinder('player-' + video.id,
        { height: 0.09, diameter: 0.68, diameterBottom: 0.73, faceUV: faceUV, tessellation: 68 },
        scene)

      videoFigure.rotation.z = Math.PI
      videoFigure.rotation.y = 9 * Math.PI / 6
      videoFigure.rotation.x = 3 * Math.PI / 6
    }

    videoFigure.id = userid
    videoFigure.material = this.prepareMaterial(video, scene? scene : this.scene)
    const verticesCount = videoFigure.getTotalVertices()
    new BABYLON.SubMesh(1, 0, verticesCount, 0, 613, videoFigure)

    return videoFigure
  }

  public addPlayer(streamEvent: any, sceneType: string, scene?: BABYLON.Scene) {

    const videoFigure: BABYLON.Mesh = this.createVideoFigure(streamEvent, sceneType, scene)

    if(streamEvent.type === 'local') {
      if(sceneType === 'cesium') {
        videoFigure.position = new BABYLON.Vector3(this.defaultPosition.LNG - 230 * Math.random(), this.defaultPosition.LAT - 180 * Math.random(), this.defaultPosition.ALT)
      } else {
        videoFigure.position = new BABYLON.Vector3(1.08 - 3 * Math.random(), 3.33, 1.27 - 3 * Math.random())
      }

      this.myPlayer = videoFigure
      this.myPlayer.parent = this.camera

      this.positionBroadcasterID = setInterval(() => {
        if(this.RTCMC) {
          this.updatePosition()
        }
      }, 333)
    } else {
      if(sceneType === 'cesium') {
        videoFigure.position = BABYLON.Vector3.Zero()
      } else {
        videoFigure.position = new BABYLON.Vector3(-61, 0.327, 0.316)
      }

      this.otherPlayers[videoFigure.id] = videoFigure
    }

    /* const videoFigureAggregate = new BABYLON.PhysicsAggregate(videoFigure,
      BABYLON.PhysicsShapeType.CYLINDER,
      {mass: 1, restitution: 0.75},
      this.scene)
    videoFigureAggregate.body.disablePreStep = false */
  }

  public createButton(space: string, left: string, width: string, clickCallBack: () => void) {
    const button = document.createElement('button')
    button.textContent = space
    button.style.left = left
    button.style.width = width
    button.style.top = '60px'
    button.style.height = '33px'
    button.style.position = 'absolute'
    button.style.color = 'white'
    button.style.background = 'rgba(0, 68, 82, 0.6)'
    button.style['border-radius'] = '30px'

    document.body.appendChild(button)

    button.addEventListener('click', clickCallBack)
  }

  public enter(space: string, sceneType: string, scene?: BABYLON.Scene) {
        const connection = this.RTCMC

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

        connection.onstream = (streamEvent: any) => this.connectPeer(streamEvent, sceneType, scene)

        connection.onclose = (event: any) => this.closeRTC(event)
        connection.onstreamended = (event: any) => this.closeRTC(event)

        connection.openOrJoin(space)
  }

  public updatePosition() {
    if(this.myPlayer && this.RTCMC && this.RTCMC.socket) {
      this.RTCMC.socket.emit('updatePosition', {
          player: this.myPlayer.id,
          target: this.myPlayer.position
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
    })
  }

  lookRight(angle: number) {
    this.vcReadyObj.viewer.camera.lookRight(angle)

    /* this.myPlayer.rotation.z -= Math.PI / 6
    this.updateRotation() */
    this.RTCMC.socket.emit('updateRotation', {
        player: this.myPlayer.id,
        target: 'right'
    })
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
