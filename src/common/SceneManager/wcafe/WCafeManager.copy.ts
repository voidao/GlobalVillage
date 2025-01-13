import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { VcReadyObject } from 'vue-cesium/es/utils/types'
import NamaqualandManager from "../namaqualand/NamaqualandManager";

import { store } from '@src/store'

export default class WCafeManager extends NamaqualandManager {
      
    constructor(vcReadyObj: VcReadyObject, canvas: HTMLCanvasElement) {
        super(vcReadyObj, canvas)

        const button = document.createElement("button")
        button.style.top = "60px"
        button.style.left = "258px"
        button.textContent = "@WCafe"
        button.style.width = "86px"
        button.style.height = "33px"
        button.style.position = "absolute"
        button.style.color = "white"
        button.style.background = "rgba(0, 68, 82, 0.6)"
        button.style["border-radius"] = "30px"

        document.body.appendChild(button);

        button.addEventListener("click", () => {
            this.loadWCafe()
        })
    }

    public addPlayer(video: HTMLVideoElement, userid: string, self: boolean) {
        alert('WCafeManager.addPlayer...')

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
        //   videoFigure.position = new BABYLON.Vector3(this.defaultPosition.LNG - 230 * Math.random(), this.defaultPosition.LAT - 180 * Math.random(), this.defaultPosition.ALT);
          videoFigure.position = BABYLON.Vector3.Zero();
          
          this.myPlayer = videoFigure;
        //   this.myPlayer.parent = this.camera;
      
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

    public enter() {
        const connection = this.RTCMC

        // disconnect with all users
        connection.getAllParticipants().forEach(function(pid) {
            connection.disconnectWith(pid);
        });
    
        // stop all local cameras
        connection.attachStreams.forEach(function(localStream) {
            localStream.stop();
        });
    
        // close socket.io connection
        connection.closeSocket();

        /* this.baseSceneManager.defaultPosition = {
            LNG: 0,
            LAT: 0,
            ALT: 0
        } */

        connection.openOrJoin('GV-WCafe')

        alert('Entering GV-WCafe...')
    }

    public loadWCafe() {
        const engine = this.engine
        let dlCount = 0

        BABYLON.SceneLoader.Load("/datas/babylon/WCafe/", "WCafe.babylon", engine, 
            (scene) => {
                scene.executeWhenReady(() => {
                    engine.runRenderLoop(() => {
                        scene.render()
                    })

                    if (scene.activeCamera) {
                      scene.activeCamera.attachControl(this.canvas);
                    }

                    this.enter()
                })
            },
            (evt) => {
                if (evt.lengthComputable) {
                  engine.loadingUIText =
                    "Loading, please wait..." +
                    ((evt.loaded * 100) / evt.total).toFixed() +
                    "%";
                } else {
                  dlCount = evt.loaded / (1024 * 1024);
                  engine.loadingUIText =
                    "Loading, please wait..." +
                    Math.floor(dlCount * 100.0) / 100.0 +
                    " MB already loaded.";
                }
            }
        )

    }
}