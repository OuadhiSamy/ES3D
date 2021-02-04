import './style.css'
import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'

let camera, scene, renderer, controls;

const objects = [];
let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const gui = new dat.GUI()

function initFirstPerson() {

    camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = -120;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 50, 1000);

    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.215)
    scene.add(ambientLight)

    // const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
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

    controls = new PointerLockControls(camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {

        controls.lock();

    });

    controls.addEventListener('lock', function () {

        instructions.style.display = 'none';
        blocker.style.display = 'none';

    });

    controls.addEventListener('unlock', function () {

        blocker.style.display = 'block';
        instructions.style.display = '';

    });

    scene.add(controls.getObject());

    const onKeyDown = function (event) {

        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;

            case 'Space':
                if (canJump === true) velocity.y += 300;
                canJump = false;
                break;

        }

    };

    const onKeyUp = function (event) {

        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;

        }

    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);


    // Models
    const gltfLoader = new GLTFLoader()
    gltfLoader.load(
        '/models/TEST.glb',
        (gltf) => {
            console.log(gltf)
            gltf.scene.scale.set(30, 30, 30);
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            gltf.scene.position.x += (gltf.scene.position.x - center.x);
            gltf.scene.position.y += (gltf.scene.position.y - center.y);
            gltf.scene.position.z += (gltf.scene.position.z - center.z);
            console.log(gltf.scene.children)
            scene.add(gltf.scene)

            const loader = new THREE.TextureLoader();
            const matcap = loader.load('/textures/matcap.png')

            // for (let i = 0; i < gltf.scene.children[1].children.length; i++) {
            //     gltf.scene.children[3].children[i].material = new THREE.MeshMatcapMaterial({ matcap: matcap })

            // }
        }
    )
    // floor

    let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(- Math.PI / 2);

    // vertex displacement

    let position = floorGeometry.attributes.position;

    floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

    position = floorGeometry.attributes.position;
    const colorsFloor = [];

    const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floor);


    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);

    animate();

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {


    const time = performance.now();

    if (controls.isLocked === true) {

        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 10;

        const intersections = raycaster.intersectObjects(objects);

        const onObject = intersections.length > 0;

        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 5.0 * delta;
        velocity.z -= velocity.z * 5.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 300.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 300.0 * delta;

        if (onObject === true) {

            velocity.y = Math.max(0, velocity.y);
            canJump = true;

        }

        controls.moveRight(- velocity.x * delta);
        controls.moveForward(- velocity.z * delta);

        controls.getObject().position.y += (velocity.y * delta); // new behavior

        if (controls.getObject().position.y < -120) {

            velocity.y = 0;
            controls.getObject().position.y = -120;

            canJump = true;

        }

    }

    prevTime = time;

    renderer.render(scene, camera);

    requestAnimationFrame(animate);

}

export { initFirstPerson, animate, camera, scene, renderer, controls }