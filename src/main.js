import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'
import gsap from 'gsap'
import { initFirstPerson, animate, camera, scene, renderer, controls } from './firstPersonController.js'


const viewMode = {
    firstPerson: true
}

// Debug
const gui = new dat.GUI()

function initOrbitControl() {
    if (!viewMode.firstPerson) {

        //HTML
        document.body.innerHTML = document.body.innerHTML + '<canvas class="webgl"></canvas>'

        // Canvas
        const canvas = document.querySelector('canvas.webgl')

        // Scene
        const scene = new THREE.Scene()

        /**
         * Loaders
         */
        // Models
        const gltfLoader = new GLTFLoader()
        gltfLoader.load(
            '/models/TEST.glb',
            (gltf) => {
                console.log(gltf)
                gltf.scene.scale.set(1, 1, 1);
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const center = box.getCenter(new THREE.Vector3());
                gltf.scene.position.x += (gltf.scene.position.x - center.x);
                gltf.scene.position.y += (gltf.scene.position.y - center.y);
                gltf.scene.position.z += (gltf.scene.position.z - center.z);
                scene.add(gltf.scene)
                console.log(gltf.scene.children[11])
                for (let i = 0; i < gltf.scene.children.length; i++) {
                    gltf.scene.children[i].material = new THREE.MeshBasicMaterial({color: "#ff0000"})
                    
                }
            }
        )

        /**
         * Lights
         */
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.215)
        scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
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
        camera.position.set(45, 45, 75)
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
         * Animate
         */
        const clock = new THREE.Clock()

        const tick = () => {
            const elapsedTime = clock.getElapsedTime()

            // Update controls
            controls.update()

            // Render
            renderer.render(scene, camera)

            // Call tick again on the next frame
            window.requestAnimationFrame(tick)
        }

        tick()
    }
    
}

function exitFPSMode() {

}

// Render
function render() {

    if(viewMode.firstPerson == true) {
        document.body.innerHTML = document.body.innerHTML + '<div id="blocker"><div id="instructions"><span style="font-size:36px">Click to play</span><br /><br />Move: ZQSD<br/>Jump: SPACE<br/>Look: MOUSE</div></div>'
        initFirstPerson()
    }
    else 
        initOrbitControl()
}

render();