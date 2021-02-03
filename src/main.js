import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'
import gsap from 'gsap'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Models
// const gltfLoader = new GLTFLoader()
// gltfLoader.load(
//     '/models/structure.glb',
//     (gltf) => {
//         console.log('success')
//         console.log(gltf)
//         gltf.scene.scale.set(1, 1, 1);
//         const box = new THREE.Box3().setFromObject(gltf.scene);
//         const center = box.getCenter(new THREE.Vector3());
//         gltf.scene.position.x += (gltf.scene.position.x - center.x);
//         gltf.scene.position.y += (gltf.scene.position.y - center.y);
//         gltf.scene.position.z += (gltf.scene.position.z - center.z);
//         scene.add(gltf.scene)
//     }
// )
// 
// Textures
const textureLoader = new THREE.TextureLoader()


/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({
        color: 0xededed,
    })
)
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Objet
 */
const character = new THREE.Mesh(
    new THREE.BoxBufferGeometry(0.5, 1.25, 0.5),
    new THREE.MeshPhysicalMaterial({ color: "red" })
)
character.position.y = character.scale.y * 0.5
scene.add(character)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.215)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

gui.add(ambientLight, 'intensity', 0, 1, 0.001).name("Global intensity")
gui.add(directionalLight, 'intensity', 0, 1, 0.001).name("DirectionalLight intensity")



/**
 * Resize canvas
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 1000000)
camera.position.set(0, 4, 6)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.45, 0)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


/**
 * Third Perso Controls
 */
// Setup events listeners
let keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    space: false,
    shift: false,
}
document.addEventListener('keydown', (e) => _onKeyDown(e), false);
document.addEventListener('keyup', (e) => _onKeyUp(e), false);


function _onKeyDown(event) {
    switch (event.keyCode) {
        case 90: // z
            keys.forward = true;
            break;
        case 81: // q
            keys.left = true;
            break;
        case 83: // s
            keys.backward = true;
            break;
        case 68: // d
            keys.right = true;
            break;
        case 32: // SPACE
            keys.space = true;
            break;
        case 16: // SHIFT
            keys.shift = true;
            break;
    }
}

function _onKeyUp(event) {
    switch (event.keyCode) {
        case 90: // z
            keys.forward = false;
            break;
        case 81: // q
            keys.left = false;
            break;
        case 83: // s
            keys.backward = false;
            break;
        case 68: // d
            keys.right = false;
            break;
        case 32: // SPACE
            keys.space = false;
            break;
        case 16: // SHIFT
            keys.shift = false;
            break;
    }
}

function Update(timeElapsed) {
    if (keys.forward) {
        character.position.z -= timeElapsed * 0.01
        console.log("forward")
    }

    if (keys.backward) {
        character.position.z += timeElapsed * 0.01
        console.log("backward")
    }

    if (keys.left) {
        character.position.x -= timeElapsed * 0.01
        console.log("left")
    }

    if (keys.right) {
        character.position.x += timeElapsed * 0.01
        console.log("right")
    }
}


/**
 * Animate
 */
const clock = new THREE.Clock()

function tick() {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Update character
    Update(elapsedTime)

    // console.log(keys.forward);

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()