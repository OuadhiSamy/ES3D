import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'
import gsap from 'gsap'
import { BasicCharacterController } from "./characterController.js"
// import loaderManager from "./loaderManager.js"

// const loaderMnger = new loaderManager();

// loaderMnger.loadModels()

class initThirdPersoControls {
    constructor() {
      this._Initialize();
    }
  
    _Initialize() {
      this._threejs = new THREE.WebGLRenderer({
        antialias: true,
      });
      this._threejs.outputEncoding = THREE.sRGBEncoding;
      this._threejs.shadowMap.enabled = true;
      this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
      this._threejs.setPixelRatio(window.devicePixelRatio);
      this._threejs.setSize(window.innerWidth, window.innerHeight);
  
      document.body.appendChild(this._threejs.domElement);
  
      window.addEventListener('resize', () => {
        this._OnWindowResize();
      }, false);
  
      const fov = 60;
      const aspect = window.innerWidth / window.innerHeight;
      const near = 1.0;
      const far = 1000.0;
      this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this._camera.position.set(25, 10, 25);
  
      this._scene = new THREE.Scene();
  
      let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
      light.position.set(-100, 100, 100);
      light.target.position.set(0, 0, 0);
      light.castShadow = true;
      light.shadow.bias = -0.001;
      light.shadow.mapSize.width = 4096;
      light.shadow.mapSize.height = 4096;
      light.shadow.camera.far = 500.0;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.left = 50;
      light.shadow.camera.right = -50;
      light.shadow.camera.top = 50;
      light.shadow.camera.bottom = -50;
      this._scene.add(light);
  
      light = new THREE.AmbientLight(0xFFFFFF, 0.25);
      this._scene.add(light);
  
      const loader = new THREE.CubeTextureLoader();
      var gridHelper = new THREE.GridHelper( 200, 10 );
      this._scene.add( gridHelper );
  
      this._mixers = [];
      this._previousRAF = null;
  
      this._LoadAnimatedModel();
      this._RAF();
    }
  
    _LoadAnimatedModel() {
      const params = {
        camera: this._camera,
        scene: this._scene,
      }
      this._controls = new BasicCharacterController(params);
  
      this._thirdPersonCamera = new ThirdPersonCamera({
        camera: this._camera,
        target: this._controls,
      });
    }
  
    _OnWindowResize() {
      this._camera.aspect = window.innerWidth / window.innerHeight;
      this._camera.updateProjectionMatrix();
      this._threejs.setSize(window.innerWidth, window.innerHeight);
    }
  
    _RAF() {
      requestAnimationFrame((t) => {
        if (this._previousRAF === null) {
          this._previousRAF = t;
        }
  
        this._RAF();
  
        this._threejs.render(this._scene, this._camera);
        this._Step(t - this._previousRAF);
        this._previousRAF = t;
      });
    }
  
    _Step(timeElapsed) {
      const timeElapsedS = timeElapsed * 0.001;
      if (this._mixers) {
        this._mixers.map(m => m.update(timeElapsedS));
      }
  
      if (this._controls) {
        this._controls.Update(timeElapsedS);
      }
  
      this._thirdPersonCamera.Update(timeElapsedS);
    }
  }
  
  
  let _APP = null;
  
  window.addEventListener('DOMContentLoaded', () => {
    _APP = new initThirdPersoControls();
  });

// /**
//  * Base
//  */
// // Debug
// const gui = new dat.GUI()

// // Canvas
// const canvas = document.querySelector('canvas.webgl')

// // Scene
// const scene = new THREE.Scene()

// /**
//  * Loaders
//  */
// // Models
// // const gltfLoader = new GLTFLoader()
// // gltfLoader.load(
// //     '/models/structure.glb',
// //     (gltf) => {
// //         console.log('success')
// //         console.log(gltf)
// //         gltf.scene.scale.set(1, 1, 1);
// //         const box = new THREE.Box3().setFromObject(gltf.scene);
// //         const center = box.getCenter(new THREE.Vector3());
// //         gltf.scene.position.x += (gltf.scene.position.x - center.x);
// //         gltf.scene.position.y += (gltf.scene.position.y - center.y);
// //         gltf.scene.position.z += (gltf.scene.position.z - center.z);
// //         scene.add(gltf.scene)
// //     }
// // )
// // 
// // Textures
// const textureLoader = new THREE.TextureLoader()


// /**
//  * Floor
//  */
// const floor = new THREE.Mesh(
//     new THREE.PlaneGeometry(20, 20),
//     new THREE.MeshBasicMaterial({
//         color: 0xededed,
//     })
// )
// floor.rotation.x = - Math.PI * 0.5
// scene.add(floor)

// /**
//  * Objet
//  */
// const character = new THREE.Mesh(
//     new THREE.BoxBufferGeometry(0.5, 1.25, 0.5),
//     new THREE.MeshPhysicalMaterial({ color: "red" })
// )
// character.position.y = character.scale.y * 0.5
// const box = new THREE.BoxHelper(character, 0xffff00);
// scene.add(character, box)

// /**
//  * Lights
//  */
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.215)
// scene.add(ambientLight)

// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
// directionalLight.castShadow = true
// directionalLight.shadow.mapSize.set(1024, 1024)
// directionalLight.shadow.camera.far = 15
// directionalLight.shadow.camera.left = - 7
// directionalLight.shadow.camera.top = 7
// directionalLight.shadow.camera.right = 7
// directionalLight.shadow.camera.bottom = - 7
// directionalLight.position.set(5, 5, 5)
// scene.add(directionalLight)

// gui.add(ambientLight, 'intensity', 0, 1, 0.001).name("Global intensity")
// gui.add(directionalLight, 'intensity', 0, 1, 0.001).name("DirectionalLight intensity")



// /**
//  * Resize canvas
//  */
// const sizes = {
//     width: window.innerWidth,
//     height: window.innerHeight
// }

// window.addEventListener('resize', () => {
//     // Update sizes
//     sizes.width = window.innerWidth
//     sizes.height = window.innerHeight

//     // Update camera
//     camera.aspect = sizes.width / sizes.height
//     camera.updateProjectionMatrix()

//     // Update renderer
//     renderer.setSize(sizes.width, sizes.height)
//     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
// })

// /**
//  * Camera
//  */
// // Base camera
// const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 1000000)
// camera.position.set(0, 4, 6)
// scene.add(camera)

// // Controls
// const controls = new OrbitControls(camera, canvas)
// controls.target.set(0, 0.45, 0)
// controls.enableDamping = true

// /**
//  * Renderer
//  */
// const renderer = new THREE.WebGLRenderer({
//     canvas: canvas,
//     antialias: true
// })
// renderer.shadowMap.enabled = true
// renderer.shadowMap.type = THREE.PCFSoftShadowMap
// renderer.setSize(sizes.width, sizes.height)
// renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


// /**
//  * Third Perso Controls
//  */
// // Setup events listeners
// let keys = {
//     forward: false,
//     backward: false,
//     left: false,
//     right: false,
// }
// document.addEventListener('keydown', (e) => _onKeyDown(e), false);
// document.addEventListener('keyup', (e) => _onKeyUp(e), false);


// function _onKeyDown(event) {
//     switch (event.keyCode) {
//         case 90: // z
//             keys.forward = true;
//             break;
//         case 81: // q
//             keys.left = true;
//             break;
//         case 83: // s
//             keys.backward = true;
//             break;
//         case 68: // d
//             keys.right = true;
//             break;
//     }
// }

// function _onKeyUp(event) {
//     switch (event.keyCode) {
//         case 90: // z
//             keys.forward = false;
//             break;
//         case 81: // q
//             keys.left = false;
//             break;
//         case 83: // s
//             keys.backward = false;
//             break;
//         case 68: // d
//             keys.right = false;
//             break;
//     }
// }

// function Update(timeElapsed) {
//     if (keys.forward) {
//         character.position.z -= timeElapsed * 0.01
//         console.log("forward")
//     }

//     if (keys.backward) {
//         character.position.z += timeElapsed * 0.01
//         console.log("backward")
//     }

//     if (keys.left) {
//         const acceleration = new THREE.Vector3(1, 0.25, 50.0)
//         const controlObject = character;
//         const _Q = new THREE.Quaternion();
//         const _A = new THREE.Vector3();
//         const _R = controlObject.quaternion.clone();

//         _A.set(0, 1, 0);
//         _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeElapsed);
//         _R.multiply(_Q);

//         controlObject.rotation.y = _R

//         console.log("left", _R)
//     }

//     if (keys.right) {
//         character.rotation.y -= timeElapsed * 0.01
//         console.log("right")
//     }
// }


// /**
//  * Animate
//  */
// const clock = new THREE.Clock()

// function tick() {
//     const elapsedTime = clock.getElapsedTime()

//     // Update controls
//     controls.update()

//     // Update character
//     Update(elapsedTime)

//     // console.log(keys.forward);

//     // Render
//     renderer.render(scene, camera)

//     // Call tick again on the next frame
//     window.requestAnimationFrame(tick)
// }

// tick()