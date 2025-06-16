import { VcReadyObject } from 'vue-cesium/es/utils/types'
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import HavokPhysics from '@babylonjs/havok'
import RTCMultiConnection from '@src/assets/lib/RTCMultiConnection'
import socketIO from '@src/assets/lib/socket.io'  // This line is pretty important :)

import { store } from '@src/store'

import { FreeCameraKeyboardWalkInput } from './KeyboardInputsControl'
import { Position } from '@src/types/position'
import { event } from 'quasar'

import earcut from 'earcut'

import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic'

registerBuiltInLoaders()

export default class BaseSceneManager{
  public static vcReadyObj: VcReadyObject
  public static base_point: BABYLON.Vector3
  public static base_point_up: BABYLON.Vector3
  public static engine: BABYLON.AbstractEngine
  public static scene: BABYLON.Scene
  public static root_node: BABYLON.TransformNode
  public static canvas: HTMLCanvasElement
  public static camera: BABYLON.UniversalCamera
  public static RTCMC: RTCMultiConnection
  public static positionBroadcasterID: number
  public static myPlayer: BABYLON.Mesh
  public static otherPlayers: Map<string, BABYLON.Mesh>
  public static defaultPosition: Position = {
    LNG: 120.07,
    LAT: 30.27,
    ALT: 60
  }
  public static rotationBroadcastID: number

  public static updateSeatRotation(direction: string) {
      if(BaseSceneManager.myPlayer && BaseSceneManager.RTCMC && BaseSceneManager.RTCMC.socket) {
          BaseSceneManager.RTCMC.socket.emit('updateSeatRotation', {
              player: BaseSceneManager.myPlayer.id,
              target: direction
          })
      }
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

  public initialize(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement, initialPos?: Position) {
    BaseSceneManager.vcReadyObj = vcReadyObj
    BaseSceneManager.otherPlayers = new Map<string, BABYLON.Mesh>()
    BaseSceneManager.canvas = canvas

    /* if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser!')
    } else {
        navigator.geolocation.getCurrentPosition(position => {
          BaseSceneManager.defaultPosition.LNG = position.coords.longitude
          BaseSceneManager.defaultPosition.LAT = position.coords.latitude
          BaseSceneManager.defaultPosition.ALT = position.coords.altitude

          if (initialPos) {
            BaseSceneManager.defaultPosition = initialPos
          }

          BaseSceneManager.init(canvas)
          setTimeout(() => {
            this.enter('GV-Globe', 'cesium')
          }, 3000)
        },
        () => {
          alert('Unable to retrieve your position!')
          this.enter('GV-Globe', 'cesium')
        },
        {
          timeout: 3000
        })
    } */

    BaseSceneManager.init(canvas)

    setTimeout(() => {
      this.enter('GV-XiXiWetland', 'cesium')
    }, 3000)
  }

  private static closeRTC(event: any) {
    let player: BABYLON.Mesh

    if(event.type === 'local') {
      player = BaseSceneManager.myPlayer
    } else {
      player = BaseSceneManager.otherPlayers[event.userid]
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
      BaseSceneManager.myPlayer = null
      clearInterval(BaseSceneManager.positionBroadcasterID)
    } else {
      delete BaseSceneManager.otherPlayers[event.userid]
    }
  }

  private async connectPeer(streamEvent: any, sceneType: string, scene?: BABYLON.Scene) {
    const connection = BaseSceneManager.RTCMC
    // alert('onstream: ' + streamEvent.type + '-' + streamEvent.userid)
    /* connection.setCustomSocketEvent('updatePlayer');
    connection.socket.on('updatePlayer', (player) => {
      this.otherPlayers[player.player] = player.target;
      console.log('this.otherPlayers[playerPosition.player]: ' + JSON.stringify(this.otherPlayers[player.player]))
    }); */

    connection.setCustomSocketEvent('updatePosition')
    connection.socket.on('updatePosition', playerPosition => {
      if(BaseSceneManager.otherPlayers[playerPosition.player]) {
          /* console.log('UpdatePosition@' + playerPosition.player + ': From-'+JSON.stringify(this.otherPlayers[playerPosition.player].position) + ' To-' + JSON.stringify(playerPosition.target))
          console.log('this.otherPlayers[playerPosition.player].position.x:' + this.otherPlayers[playerPosition.player].position._x + ' playerPosition.target.x: ' + playerPosition.target._x) */
          // this.otherPlayers[playerPosition.player].position = playerPosition.target /* This doesn't work with Havok, so changed to the below. */
          BaseSceneManager.otherPlayers[playerPosition.player].position.x = playerPosition.target._x
          BaseSceneManager.otherPlayers[playerPosition.player].position.y = playerPosition.target._y
          BaseSceneManager.otherPlayers[playerPosition.player].position.z = playerPosition.target._z
      }
    })

    connection.setCustomSocketEvent('updateRotation')
    connection.socket.on('updateRotation', playerRotation => {
      // console.log('updateRotation-' + playerRotation.player + ': ' + JSON.stringify(playerRotation.target))
      // this.otherPlayers[playerRotation.player].rotation = playerRotation.target; // Don't know why this doesn't work, yet!!!
      if(playerRotation.target == 'left') {
          // this.otherPlayers[playerRotation.player].rotation.z += Math.PI / 66
          BaseSceneManager.otherPlayers[playerRotation.player].rotation.y += Math.PI / 66
      } else if(playerRotation.target == 'right') {
          // this.otherPlayers[playerRotation.player].rotation.z -= Math.PI / 66
          BaseSceneManager.otherPlayers[playerRotation.player].rotation.y -= Math.PI / 66
      }
    })

    connection.setCustomSocketEvent('updateSeatRotation')
    connection.socket.on('updateSeatRotation', playerSeatRotation => {
        switch (playerSeatRotation.target) {
            case 'E':
                BaseSceneManager.otherPlayers[playerSeatRotation.player].rotation.y = 0
                break
            case 'W':
                BaseSceneManager.otherPlayers[playerSeatRotation.player].rotation.y = Math.PI
                break
            case 'N':
                BaseSceneManager.otherPlayers[playerSeatRotation.player].rotation.y = 3 * Math.PI / 2
                break
            case 'S':
                BaseSceneManager.otherPlayers[playerSeatRotation.player].rotation.y = Math.PI / 2
                break
            case 'NW':
                BaseSceneManager.otherPlayers[playerSeatRotation.player].rotation.y = 7.3 * Math.PI / 6
                break
            case 'SE':
                BaseSceneManager.otherPlayers[playerSeatRotation.player].rotation.y = - Math.PI / 6
                break
            case 'SW':
                BaseSceneManager.otherPlayers[playerSeatRotation.player].rotation.y = Math.PI / 6
                break
        }
    })

    if (streamEvent.type === 'local') {
      const user = store.system.useUserStore()
      const userName = user.info?.username || user.info?.user_metadata?.name || 'Guest'

      streamEvent.extra.userName = userName
    }

    await this.addPlayer(streamEvent, sceneType, scene)
  }

  private static initRTC() {
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
    // connection.iceServers = []
    connection.iceServers = [
      {
        urls: 'stun:stun.relay.metered.ca:80',
      },
      {
        urls: 'turn:global.relay.metered.ca:80',
        username: 'a8c932eea459fea5ad773294',
        credential: 'fKLEO19XTqPdvQo3',
      },
      {
        urls: 'turn:global.relay.metered.ca:80?transport=tcp',
        username: 'a8c932eea459fea5ad773294',
        credential: 'fKLEO19XTqPdvQo3',
      },
      {
        urls: 'turn:global.relay.metered.ca:443',
        username: 'a8c932eea459fea5ad773294',
        credential: 'fKLEO19XTqPdvQo3',
      },
      {
        urls: 'turns:global.relay.metered.ca:443?transport=tcp',
        username: 'a8c932eea459fea5ad773294',
        credential: 'fKLEO19XTqPdvQo3',
      },
  ]

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

    BaseSceneManager.RTCMC = connection
  }

  private static moveBabylonCamera() {
      const fov = BaseSceneManager.vcReadyObj.Cesium.Math.toDegrees(BaseSceneManager.vcReadyObj.viewer.camera.frustum.fovy)
      BaseSceneManager.camera.fov = fov / 180 * Math.PI

      const civm = BaseSceneManager.vcReadyObj.viewer.camera.inverseViewMatrix
      const camera_matrix = BABYLON.Matrix.FromValues(
          civm[0 ], civm[1 ], civm[2 ], civm[3 ],
          civm[4 ], civm[5 ], civm[6 ], civm[7 ],
          civm[8 ], civm[9 ], civm[10], civm[11],
          civm[12], civm[13], civm[14], civm[15]
      )

      const scaling = BABYLON.Vector3.Zero(), rotation = BABYLON.Quaternion.Zero(), transform = BABYLON.Vector3.Zero()
      camera_matrix.decompose(scaling, rotation, transform)
      const camera_pos = BaseSceneManager.cart2vec(transform),
          camera_direction = BaseSceneManager.cart2vec(BaseSceneManager.vcReadyObj.viewer.camera.direction),
          camera_up = BaseSceneManager.cart2vec(BaseSceneManager.vcReadyObj.viewer.camera.up)

      let rotation_y = Math.atan(camera_direction.z / camera_direction.x)
      if (camera_direction.x < 0) rotation_y += Math.PI
      rotation_y = Math.PI / 2 - rotation_y
      const rotation_x = Math.asin(-camera_direction.y)
      const camera_up_before_rotatez = new BABYLON.Vector3(-Math.cos(rotation_y), 0, Math.sin(rotation_y))
      let rotation_z = Math.acos(camera_up.x * camera_up_before_rotatez.x + camera_up.y * camera_up_before_rotatez.y + camera_up.z * camera_up_before_rotatez.z)
      rotation_z = Math.PI / 2 - rotation_z
      if (camera_up.y < 0) rotation_z = Math.PI - rotation_z

      BaseSceneManager.camera.position.x = camera_pos.x - BaseSceneManager.base_point.x
      BaseSceneManager.camera.position.y = camera_pos.y - BaseSceneManager.base_point.y
      BaseSceneManager.camera.position.z = camera_pos.z - BaseSceneManager.base_point.z
      BaseSceneManager.camera.rotation.x = rotation_x
      BaseSceneManager.camera.rotation.y = rotation_y
      BaseSceneManager.camera.rotation.z = rotation_z
  }

  private static runRenderLoop() {
    BaseSceneManager.engine.runRenderLoop(() => {
      BaseSceneManager.vcReadyObj.viewer.render()
      BaseSceneManager.moveBabylonCamera()
      BaseSceneManager.scene.render()
    })
  }

  private static initCesium() {
    BaseSceneManager.base_point = BaseSceneManager.cart2vec(BaseSceneManager.vcReadyObj.Cesium.Cartesian3.fromDegrees(BaseSceneManager.defaultPosition.LNG, BaseSceneManager.defaultPosition.LAT, 50))
    BaseSceneManager.base_point_up = BaseSceneManager.cart2vec(BaseSceneManager.vcReadyObj.Cesium.Cartesian3.fromDegrees(BaseSceneManager.defaultPosition.LNG, BaseSceneManager.defaultPosition.LAT, 300))

    BaseSceneManager.vcReadyObj.viewer.camera.flyTo({
        destination : BaseSceneManager.vcReadyObj.Cesium.Cartesian3.fromDegrees(BaseSceneManager.defaultPosition.LNG, BaseSceneManager.defaultPosition.LAT - 0.003, BaseSceneManager.defaultPosition.ALT + 60),
        orientation : {
            heading : BaseSceneManager.vcReadyObj.Cesium.Math.toRadians(0.0),
            pitch : BaseSceneManager.vcReadyObj.Cesium.Math.toRadians(-10.0)
        }
    })
  }

  private static async initBabylon(canvas: HTMLCanvasElement) {
    await BABYLON.InitializeCSG2Async()

    const engine = new BABYLON.Engine(canvas)
    const scene = new BABYLON.Scene(engine)

    // scene.debugLayer.show()

    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0)

    // const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, -10), this.scene)
    const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 0, -10), BaseSceneManager.scene)

    //First, set the scene's activeCamera... to be YOUR camera.
    scene.activeCamera = camera
    // Then attach the activeCamera to the canvas.
    //Parameters: canvas, noPreventDefault
    scene.activeCamera.attachControl(canvas, true)

    BaseSceneManager.root_node = new BABYLON.TransformNode('BaseNode', scene)
    BaseSceneManager.root_node.lookAt(BaseSceneManager.base_point_up.subtract(BaseSceneManager.base_point))
    BaseSceneManager.root_node.addRotation(Math.PI / 2, 0, 0)

    // New Input Management for Camera

    //First remove the default management.
    camera.inputs.removeByType('FreeCameraKeyboardMoveInput')
    camera.inputs.removeByType('FreeCameraMouseInput')

    //Add the new keys input manager to the camera.
     camera.inputs.add(new FreeCameraKeyboardWalkInput(BaseSceneManager.camera))

    //Add the new mouse input manager to the camera
    // camera.inputs.add(new FreeCameraSearchInput());

    BaseSceneManager.engine = engine
    BaseSceneManager.scene = scene
    BaseSceneManager.camera = camera

    BaseSceneManager.runRenderLoop()
  }

  public static async init(canvas: HTMLCanvasElement) {
    BaseSceneManager.initCesium()
    await BaseSceneManager.initBabylon(canvas)
    BaseSceneManager.initRTC()
  }

  public static registerPickHandler(pickedObjectName: string, canvas: HTMLCanvasElement, load: () => void) {
        const pickHandler = new BaseSceneManager.vcReadyObj.Cesium.ScreenSpaceEventHandler(canvas)
        pickHandler.setInputAction(event => {
            const pickedObject = BaseSceneManager.vcReadyObj.viewer.scene.pick(event.position)
            // alert('PickedObject: ' + JSON.stringify(pickedObject.id.name))
            if(pickedObject && pickedObject.id.name.includes(pickedObjectName)) {
                load()
            }
        }, BaseSceneManager.vcReadyObj.Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
  }

  public static createModel(url: string, scale: number, position?: Position) {
    // this.vcReadyObj.viewer.entities.removeAll()
    const posForModel = position ? position : BaseSceneManager.defaultPosition

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

    const entity = BaseSceneManager.vcReadyObj.viewer.entities.add({
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

  public static async createVideoFigure(streamEvent: any, sceneType: string, scene? : BABYLON.Scene): Promise<BABYLON.Mesh> {
      let divisor
      if (sceneType === 'cesium' || sceneType === 'XiXiWetland') {
        divisor = 1
      } else {
        divisor = 100
      }

      const radius = 10 * 3 / divisor

      // await BABYLON.InitializeCSG2Async()

      const sphere1 = BABYLON.MeshBuilder.CreateSphere('sphere1', { arc: 1, diameter: 6.68 * radius, slice: 0.1, sideOrientation: BABYLON.Mesh.DOUBLESIDE })
      const sphere1kMat = new BABYLON.StandardMaterial('mVideoFigureBack', scene)
      sphere1kMat.emissiveColor = BABYLON.Color3.Gray()
      // sphere1kMat.emissiveColor = BABYLON.Color3.Magenta()
      //   sphere1kMat.emissiveColor = new BABYLON.Color3(192,192,192)
      // sphere1kMat.emissiveColor = new BABYLON.Color3(170,169,173)

      sphere1.material = sphere1kMat
      sphere1.position.z = -31.58 * 3 / divisor
      sphere1.rotation.z = Math.PI / 2
      sphere1.rotation.y = Math.PI / 2
      sphere1.rotation.x = Math.PI

      // Create the outer wall using a Cylinder mesh
      const mOuter = BABYLON.MeshBuilder.CreateCylinder(
          'mOuter',
          {
              diameter: 20.88 * 3 / divisor,
              height: 0.36 / divisor,
              tessellation: 68
          },
          scene,
      )
      // Create the inner wall using a Tube mesh
      const mInner = BABYLON.MeshBuilder.CreateCylinder(
          'mInner',
          {
              diameter: 20.58 * 3 / divisor,
              height: 0.36 / divisor,
              tessellation: 68
          },
          scene,
      )
      // Create CSG objects from each mesh
      const outerCSG = BABYLON.CSG2.FromMesh(mOuter)
      const innerCSG = BABYLON.CSG2.FromMesh(mInner)

      // Create a new CSG object by subtracting the inner tube from the outer cylinder
      const pipeCSG = outerCSG.subtract(innerCSG)

      // Create the resulting mesh from the new CSG object
      const mPipe = pipeCSG.toMesh('mPipe', scene)
      const mPipeMat = new BABYLON.StandardMaterial('mMPipeMat', scene)
      mPipeMat.emissiveColor = new BABYLON.Color3(0.67, 0.67, 0.67)
      mPipe.material = mPipeMat
      mPipe.rotation.z = Math.PI / 2
      mPipe.rotation.y = Math.PI / 2
      mPipe.rotation.x = Math.PI

    const videoFigure = BABYLON.MeshBuilder.CreateCylinder(
          'videoFigure',
          {
              diameter: 20.58 * 3 / divisor,
              height: 0.18 / divisor,
              tessellation: 68
          },
          scene,
      )
      const videoFigureMat = new BABYLON.StandardMaterial('playerMat-' + streamEvent.mediaElement.id, scene)
      const videoTexure = new BABYLON.VideoTexture(streamEvent.mediaElement.id, streamEvent.mediaElement, scene, false, true)
      videoFigureMat.diffuseTexture = videoTexure
      videoFigureMat.roughness = 1
      videoFigureMat.emissiveColor = BABYLON.Color3.White()
      videoFigure.material = videoFigureMat
      videoFigure.position.z = 0.09 / divisor
      videoFigure.rotation.z = Math.PI / 2
      videoFigure.rotation.y = Math.PI / 2
      videoFigure.rotation.x = 3 * Math.PI / 2

    const topSliceAt = 0.88 / divisor
    const bottomSliceAt = 0.6 / divisor

    const size = 2.1 * radius

    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 2.086 * radius })

    const box1 = BABYLON.MeshBuilder.CreateBox('box1', { size: size })
    const box2 = box1.clone('box2')

    box1.position.y = topSliceAt + size / 2
    box2.position.y = bottomSliceAt - size / 2

    const removal = BABYLON.Mesh.MergeMeshes([box1, box2])
    const removalCSG = BABYLON.CSG2.FromMesh(removal)
    const sphereCSG = BABYLON.CSG2.FromMesh(sphere)
    const videoFigureBackCSG = sphereCSG.subtract(removalCSG)
    const videoFigureBack = videoFigureBackCSG.toMesh('videoFigureBack')
    const videoFigureBackMat = new BABYLON.StandardMaterial('mVideoFigureBack', scene)
    videoFigureBackMat.emissiveColor = BABYLON.Color3.Gray()
    videoFigureBack.material = videoFigureBackMat
    videoFigureBack.position.z = 0.26 / divisor
    videoFigureBack.rotation.z = Math.PI / 2
    videoFigureBack.rotation.y = Math.PI / 2

    const userName = streamEvent.extra.userName
    const fontData = await (await fetch('https://assets.babylonjs.com/fonts/Droid Sans_Regular.json')).json()
    const myText = BABYLON.MeshBuilder.CreateText('myText', userName, fontData, {
          size: 3.9 / divisor,
          resolution: 6,
          depth: 0.3 / divisor,
          // faceColors: [new BABYLON.Color4(1, 1, 1)]
      },
      scene,
      earcut
    )
    myText.rotation.z = Math.PI
    const myTextMat = new BABYLON.StandardMaterial('mMyText', scene)
    myTextMat.emissiveColor = BABYLON.Color3.White()
    myText.material = myTextMat
    const myText1 = myText.clone('myText1')
    myText.position.y = 23 / divisor
    myText1.position.z = 5.6 / divisor
    myText1.rotation.y = Math.PI

    const videoFigureWhole = BABYLON.Mesh.MergeMeshes([myText, myText1, sphere1, mPipe, videoFigure, videoFigureBack], false, true, undefined, true, true)

    videoFigureWhole.id = streamEvent.userid
    videoFigureWhole.name = 'player-' + streamEvent.userid

    videoFigureWhole.rotation.z = Math.PI
    if (sceneType === 'cesium') {
      /* videoFigureWhole.rotation.y = 5 * Math.PI / 6
      videoFigureWhole.rotation.x = - Math.PI / 3 */
      videoFigureWhole.rotation.y = Math.PI
    } else {
      videoFigureWhole.rotation.y = 9 * Math.PI / 6
    }

    // Dispose of the meshes, no longer needed
    mInner.dispose()
    mOuter.dispose()
    outerCSG.dispose()
    innerCSG.dispose()

    box1.dispose()
    box2.dispose()
    removal.dispose()
    sphere.dispose()

    pipeCSG.dispose()
    mPipe.dispose()

    sphere1.dispose()

    myText1.dispose()
    myText.dispose()

    videoFigure.dispose()
    videoFigureBack.dispose()

    return videoFigureWhole
  }

  public async addPlayer(streamEvent: any, sceneType: string, scene?: BABYLON.Scene) {

    const videoFigure: BABYLON.Mesh = await BaseSceneManager.createVideoFigure(streamEvent, sceneType, scene)

    if(streamEvent.type === 'local') {
      if(sceneType === 'cesium') {
        // alert('Setting to default position...')
        videoFigure.position = new BABYLON.Vector3(BaseSceneManager.defaultPosition.LNG - 230 * Math.random(), BaseSceneManager.defaultPosition.LAT - 80 * Math.random(), BaseSceneManager.defaultPosition.ALT)
      } else {
        videoFigure.position = new BABYLON.Vector3(1.08 - 3 * Math.random(), 3.33, 1.27 - 3 * Math.random())
      }

      BaseSceneManager.myPlayer = videoFigure
      BaseSceneManager.myPlayer.parent = BaseSceneManager.camera

      if (BaseSceneManager.positionBroadcasterID) {
          clearInterval(BaseSceneManager.positionBroadcasterID)
      }
      BaseSceneManager.positionBroadcasterID = setInterval(() => {
        if(BaseSceneManager.RTCMC) {
          BaseSceneManager.updatePosition()
        }
      }, 333)
    } else {
      if(sceneType === 'cesium') {
        videoFigure.position = BABYLON.Vector3.Zero()
        videoFigure.parent = BaseSceneManager.root_node
      } else {
        videoFigure.position = new BABYLON.Vector3(-61, 0.327, 0.316)
      }

      BaseSceneManager.otherPlayers[videoFigure.id] = videoFigure
    }

    /* const videoFigureAggregate = new BABYLON.PhysicsAggregate(videoFigure,
      BABYLON.PhysicsShapeType.CYLINDER,
      {mass: 1, restitution: 0.75},
      this.scene)
    videoFigureAggregate.body.disablePreStep = false */
  }

  public async loadScene(path: string, sceneName: string, space: string, sceneType: string, enablePhysics: boolean, alpha?: number, radius?: number) {
    let dlCount = 0
    BaseSceneManager.scene = await BABYLON.LoadSceneAsync(path + sceneName, BaseSceneManager.engine, { name: 'currentScene', onProgress:
      evt => {
          if (evt.lengthComputable) {
            BaseSceneManager.engine.loadingUIText =
              'Loading, please wait...' +
              ((evt.loaded * 100) / evt.total).toFixed() +
              '%'
          } else {
            dlCount = evt.loaded / (1024 * 1024)
            BaseSceneManager.engine.loadingUIText =
              'Loading, please wait...' +
              Math.floor(dlCount * 100.0) / 100.0 +
              ' MB already loaded.'
          }
      }
    })

    // scene.debugLayer.show()
    if (enablePhysics) {
      const havokInstance = await HavokPhysics()
        const hk = new BABYLON.HavokPlugin(true, havokInstance)
        BaseSceneManager.scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), hk)
    }

    if (sceneType !== 'wCafe') {
      BaseSceneManager.scene.createDefaultCamera(true, true, true)
      /* BaseSceneManager.scene.createDefaultEnvironment({
          createGround: false,
          createSkybox: false
      }) */
      const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData('/datas/textures/environment.dds', BaseSceneManager.scene)
      const currentSkybox = BaseSceneManager.scene.createDefaultSkybox(hdrTexture, true)
    }

    if (BaseSceneManager.scene.activeCamera) {
      BaseSceneManager.scene.activeCamera.attachControl(BaseSceneManager.canvas)
      if (alpha == 0 || alpha) {
        BaseSceneManager.scene.activeCamera.alpha = alpha
      }
      if (radius) {
        BaseSceneManager.scene.activeCamera.radius = radius
      }
    }

    this.enter(space, sceneType, BaseSceneManager.scene)
  }

  public static createButton(space: string, left: string, top: string, width: string, clickCallBack: () => void) {
    const button = document.createElement('button')
    button.textContent = space
    button.style.left = left
    button.style.width = width
    button.style.top = top
    button.style.height = '33px'
    button.style.position = 'absolute'
    button.style.color = 'white'
    button.style.background = 'rgba(0, 68, 82, 0.6)'
    button.style['border-radius'] = '30px'

    document.body.appendChild(button)

    button.addEventListener('click', clickCallBack)
  }

  public enter(space: string, sceneType: string, scene?: BABYLON.Scene) {
        const connection = BaseSceneManager.RTCMC

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

        connection.onstream = async (streamEvent: any) => await this.connectPeer(streamEvent, sceneType, scene)

        connection.onclose = (event: any) => BaseSceneManager.closeRTC(event)
        connection.onstreamended = (event: any) => BaseSceneManager.closeRTC(event)

        connection.openOrJoin(space)
  }

  public static updatePosition() {
    if(BaseSceneManager.myPlayer && BaseSceneManager.RTCMC && BaseSceneManager.RTCMC.socket) {
      BaseSceneManager.RTCMC.socket.emit('updatePosition', {
          player: BaseSceneManager.myPlayer.id,
          target: BaseSceneManager.myPlayer.position
      })
    }
  }

  public static lookLeft(angle: number) {
    BaseSceneManager.vcReadyObj.viewer.camera.lookLeft(angle)

    // Don't know why this doesn't work, yet!!!
    /* this.myPlayer.rotation.z += Math.PI / 6
    this.updateRotation() */
    BaseSceneManager.RTCMC.socket.emit('updateRotation', {
        player: BaseSceneManager.myPlayer.id,
        target: 'left'
    })
  }

  public static lookRight(angle: number) {
    BaseSceneManager.vcReadyObj.viewer.camera.lookRight(angle)

    /* this.myPlayer.rotation.z -= Math.PI / 6
    this.updateRotation() */
    BaseSceneManager.RTCMC.socket.emit('updateRotation', {
        player: BaseSceneManager.myPlayer.id,
        target: 'right'
    })
  }

  public static moveForward(amount: number) {
    BaseSceneManager.vcReadyObj.viewer.camera.moveForward(amount)

    // Needs Better Solution!!!
    // this.myPlayer.movePOV(0, 0.3, 0)
    BaseSceneManager.myPlayer.movePOV(0, 0, 0.3)
    BaseSceneManager.updatePosition()
  }

  public static moveBackward(amount: number) {
    BaseSceneManager.vcReadyObj.viewer.camera.moveBackward(amount)

    // this.myPlayer.movePOV(0, -0.3, 0)
    BaseSceneManager.myPlayer.movePOV(0, 0, -0.3)
    BaseSceneManager.updatePosition()
  }
}
