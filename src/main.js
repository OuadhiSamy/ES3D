import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import {pointLock} from './firstPersonController.js'
//import gsap from 'gsap'

let camera, scene, renderer, controls;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

//bouncingSphere
const bouncingSphere = new THREE.Mesh(
    new THREE.SphereGeometry( 2, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xA7A1A9, roughness:0.4, metalness: 0.5}))
bouncingSphere.castShadow = true

//CenterToCamera
var positionScreenSpace = new THREE.Vector3();
var threshold = 0.1;

//Sphere
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry( 2, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xA7A1A9, roughness:0.4, metalness: 0.5}))
sphere.castShadow = true
sphere.position.y = 2;
let test

function init() {


    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.y = 15;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    scene.fog = new THREE.Fog( 0xffffff, 30, 1000 );

    scene.add( sphere );

    //texture
    const material = new THREE.MeshStandardMaterial()
    material.roughness = 0.7

    const light = new THREE.AmbientLight( 0x404040, 2 ); // soft white light
    scene.add( light );

    const pointLight = new THREE.PointLight(0xffffff, 2, 100)
    pointLight.position.set(25,50,15);
    scene.add(pointLight);

    pointLight.castShadow = true

    pointLight.shadow.mapSize.width = 1024
    pointLight.shadow.mapSize.height = 1024

    controls = new PointerLockControls( camera, document.body );

    const blocker = document.getElementById( 'blocker' );
    const instructions = document.getElementById( 'instructions' );

    console.log('instructions',instructions);

    instructions.addEventListener( 'click', function () {

        controls.lock();

    } );

    controls.addEventListener( 'lock', function () {

        instructions.style.display = 'none';
        blocker.style.display = 'none';

    } );

    controls.addEventListener( 'unlock', function () {

        blocker.style.display = 'block';
        instructions.style.display = '';

    } );

    scene.add( controls.getObject() );

   
    const gltfLoader = new GLTFLoader()

    // Models
    gltfLoader.load(
        '/models/structure_v3.glb',
        (gltf) => {
        console.log(gltf)
            gltf.scene.scale.set(13, 13, 13);
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            gltf.scene.position.x += (gltf.scene.position.x - center.x);
            gltf.scene.position.y = 0;
        gltf.scene.position.z += (gltf.scene.position.z - center.z);
        scene.add(gltf.scene)
        }
    )

    const onKeyDown = function ( event ) {

        switch ( event.code ) {

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
                if ( canJump === true ) velocity.y += 200;
                canJump = false;
                break;

        }
    };

    const onKeyUp = function ( event ) {

        switch ( event.code ) {

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

    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );


     //  * Floor
        //  */
         const floor = new THREE.Mesh(
             new THREE.PlaneGeometry(2000, 2000, 100, 100),
             new THREE.MeshStandardMaterial({
                 color: 0x9A86A1,
             })
         )
         floor.rotation.x = - Math.PI * 0.5
         floor.position.y = 0.05
         floor.receiveShadow = true
         console.log(floor.position)
         scene.add(floor)

    
    bouncingSphere.position.y = 0
    bouncingSphere.position.x += 10
    scene.add(bouncingSphere)


    //Shadows
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.shadowMap.enabled = true
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize );


}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

let currentIntersect = null

var step=0;

function animate() {

   // window.addEventListener('click', onDocumentMouseDown);

    //Bouncing ball
    step+=0.04;
    bouncingSphere.position.x = 20+( 10*(Math.cos(step)));
    bouncingSphere.position.y = 2 +( 10*Math.abs(Math.sin(step)));

    //Check Center Screen
    positionScreenSpace.copy(sphere.position).project(camera);
    positionScreenSpace.setZ(0);
    var isCloseToCenter = positionScreenSpace.length() < threshold;

    //If character close to object
    if((camera.position.x-sphere.position.x)<8 && (camera.position.z-sphere.position.z)<8){   
        //console.log('proche')
        //If character targetting object
        if(isCloseToCenter){
            sphere.material.color.set('#ff0000')
            test = 1
        }
        else{
            sphere.material.color.set('#0000ff')
            test = 2
        }
    }
    else{
        //console.log('loin')
        sphere.material.color.set('#0000ff')
        test = 2
    }

    requestAnimationFrame( animate );

    const time = performance.now();

    if ( controls.isLocked === true ) {
       pointLock(controls,time, prevTime, velocity, direction, moveBackward,moveForward, moveLeft,moveRight, canJump)
    }

    prevTime = time;

    renderer.render( scene, camera );
}


document.body.innerHTML = document.body.innerHTML + '<div id="blocker"><div id="instructions"><span style="font-size:36px">Click to play</span><br /><br />Move: ZQSD<br/>Jump: SPACE<br/>Look: MOUSE</div></div>'

init()
animate()
