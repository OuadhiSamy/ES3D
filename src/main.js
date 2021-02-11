import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as dat from 'dat.gui'
import { gsap } from 'gsap'

import Stats from "three/examples/jsm/libs/stats.module.js";

import { Octree } from 'three/examples/jsm/math/Octree.js';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';
import { Vector3 } from 'three'

import { Howl, Howler } from "howler";

// const gui = new dat.GUI();

/**
 * Global Variables Declarations
 */
let closestObject = null;
let isAnimationInProgress = false;
let canAnimate = false;
let positionScreenSpace = new THREE.Vector3();
let threshold = 2.25;
let arrows = [];
let wallMaterial = new THREE.MeshPhysicalMaterial({
	color: 0x1c1c1c,
	roughness: 10,
	metalness: 0.6,
});

//Compression 3D
// const dracoLoader = new DRACOLoader()
// dracoLoader.setDecoderPath('/draco/')

let mixer = null;

let soundMuted = 0;
/**
 * Loaders
 */

const jsloader = document.getElementById('js-loader');
const jsloaderinner = document.getElementById('loader');
window.setTimeout(function(){
  jsloader.classList.toggle('hide');
  jsloaderinner.classList.toggle('hide');
  // jsloader.addEventListener('transitionend', () => jsloader.remove());
}, 2000)

window.setTimeout(function(){
  jsloader.remove()
}, 3000)

const sound = new Howl({
	src: ["sounds/Cyber-Dream.mp3"],
	loop: true,
	volume: 0.08,
	autoplay: true,
	preload: true,
});
sound.play();

const cafe = new Howl({
	src: ["sounds/coffee.mp3"],
	volume: 0.3,
});

const scream = new Howl({
	src: ["sounds/wilhelm-scream.mp3"],
	volume: 0.3,
});

//Equalizer
const eq = document.getElementById("equalizer");
const eqBars = document.getElementsByClassName("eq-unmute");

eq.addEventListener("click", (event) => {
	eq.classList.toggle("mute");
	if (soundMuted == 0) {
		sound.pause();
		soundMuted = 1;
		console.log("mute");
	} else {
		sound.play();
		soundMuted = 0;
		console.log("unmute");
	}
});

//Pause
const pauseBtn = document.getElementById("pause-btn");
const closeBtn = document.getElementById("close-btn");
const quitBtn = document.getElementById("quit-btn");

pauseBtn.style.visibility = "hidden";

pauseBtn.addEventListener("click", (event) => {
  console.log('inpause')
	if (document.pointerLockElement === null) {
    overlayDisplay = 0;
		overlay.style.display = "none";
		document.body.requestPointerLock();
	} else {
		document.exitPointerLock();
		overlayDisplay = 1;
		overlay.style.display = "flex";
	}
});

closeBtn.addEventListener("click", (event) => {
	if (document.pointerLockElement === null) {
		document.body.requestPointerLock();
		overlayDisplay = 0;
		overlay.style.display = "none";
	} else {
		document.exitPointerLock();
		overlayDisplay = 1;
		overlay.style.display = "flex";
	}
});

quitBtn.addEventListener("click", (event) => {
	//Code pour reset la partie
  startDisplay = 1;
  sound.stop();
  sound.play();
  startMenu.style.display = "flex";
	pauseBtn.style.visibility = "hidden";
  overlayDisplay = 0;
  overlay.style.display = "none";
});

//Start Menu
const startButton = document.getElementById("start-btn");
const startMenu = document.getElementById("start-screen");
let startDisplay = 1;

startButton.addEventListener("click", (event) => {
	document.body.requestPointerLock();
	startDisplay = 0;
	initLoading();
	startMenu.style.display = "none";
	pauseBtn.style.visibility = "visible";
	// video.play();
	// sound.stop();
});

//Video
var video = document.getElementById("video-trailer");

// video.onended = function(){
// 	let videocontainer = document.getElementsByClassName('intro-video');
// 	videocontainer.remove();
// 	sound.play();
// }

function playVid() {
    video.play();
}

function pauseVid() {
    video.pause();
}

//Menu Pause
const overlay = document.getElementById("overlay");
let overlayDisplay = 0;

document.addEventListener("keydown", (event) => {
	keyStates[event.code] = true;

	if (keyStates["KeyP"]) {
		if (document.pointerLockElement === null) {
			document.body.requestPointerLock();
			overlayDisplay = 0;
			overlay.style.display = "none";
		} else {
			document.exitPointerLock();
			overlayDisplay = 1;
			overlay.style.display = "flex";
		}
	}

	keyStates[event.code] = true;

	if (keyStates["Semicolon"]) {
		eq.classList.toggle("mute");
		if (soundMuted == 0) {
			sound.pause();
			soundMuted = 1;
			console.log("mute");
		} else {
			sound.play();
			soundMuted = 0;
			console.log("unmute");
		}
	}
});

/**
 * Parameters map, used to link an object to his informations (position, insight), using
 */
let paramMap = [
	{
		name: "chaise",
		mesh: null,
		position: new Vector3(5, 0, 1.25),
		action: null,
		duration: 2,
		insight: "Encore une chaise jaune. Cet objet est présent dans tout le campus, à tel point que vous avez l'impression que celle-ci vous suit partout. Elle vient de vous regarder mal là, non ?"
	},
	{
		name: "machine_a_cafe",
		mesh: null,
		position: new Vector3(5, 0, -2.8),
		action: null,
		duration: 2,
		insight: "Vous insérez une pièce dans la machine et vous sélectionnez un grand café fort pour vous remettre de votre Code Sprint. La machine se lance, mais vous présente finalement un gobelet vide. Vous auriez mieux fait de choisir un café en intraveineuse."
	},
	{
		name: "fat_boy",
		mesh: null,
		position: new Vector3(1.76, 0, 1.92),
		rotation: Math.PI,
		action: null,
		duration: 2,
		insight: "Vous avez une pause entre deux sessions de recherche UX, le fatboy vous fait de l’œil. Il a l'air moelleux et réconfortant. Vous vous sentez attiré(e) par son aura. Alors que vous êtes sur le point de vous laisser engloutir par la tentation, votre meilleur ami vous tapote l'épaule et vous ramène à la réalité."
	},
	{
		name: "multiprise",
		mesh: null,
		position: new Vector3(2, 0, 0.5),
		rotation: Math.PI,
		action: null,
		duration: 4,
		insight: "Cette multiprise gît sur le sol après une bataille acharnée dans le cours des B1. Le conflit millénaire pour brancher son ordinateur a laissé la multiprise inerte sur le sol. Enfin, jusqu'au cours suivant."
	},
	{
		name: "ascenseur",
		mesh: null,
		position: new Vector3(-0.16, 0, -2.8),
		action: null,
		duration: 4,
		insight: "Vous passez devant l'ascenseur et l'envie vous prend de l'emprunter. Après tout, vous méritez bien cette économie d'énergie après une journée si chargée. Les portes s'ouvrent mais, au moment où vous mettez un pied dedans, vous entendez la voix de Malika qui vous rappelle que les élèves doivent utiliser les escaliers."
	},
]

/**
 * Content that will be displayed
 */
let sceneItems = []


/**
 * Loaders
 */
// const loadingContainerElement = document.querySelector('.progress-container')
const loadingTextElement = document.querySelector('.progress-text');
const loadingBarElement = document.querySelector('.progress-bar');

const loadingManager = new THREE.LoadingManager(
	// Loaded
	() => {
		// Animations after loading, can be done w/o gsap
		let loadingTimeline = gsap.timeline();
		loadingTimeline.to(".progress-container", { delay: 0.4, duration: 0.4, opacity: 0, y: 100, ease: "ease-in" })
		loadingTimeline.to(".loading-overlay", { delay: 1.5, duration: 1, visibility:'hidden' })


		for (const object of sceneItems) {

			// Add each object to the scene, acconrding to his position set in paramMap
			// object.mesh.parent.position.copy(object.position)
			// object.mesh.position.copy(object.position)
			// console.log(object.mesh.parent.position)
			// console.log(object)
			// scene.add(object.mesh)

			// Add arrow on top of each object
			// get object size
			let boundBox = new THREE.Box3().setFromObject(object.mesh);
			// const helper = new THREE.Box3Helper(boundBox, 0xffff00);
			// scene.add(helper);
			let objectSize = boundBox.getSize(); // objectSize is a vector3
			let newArrow = arrowMesh.clone();
			newArrow.position.set(object.mesh.parent.position.x, objectSize.y + 0.4, object.mesh.parent.position.z)
			newArrow.material.transparent = true;
			scene.add(newArrow)
			arrows.push(newArrow);

			// // Add circle plane to each object
			// let plane = new THREE.Mesh(planeGeometry, planeMaterial);

			// // Rotate plane to place it on the ground
			// plane.rotation.x = - Math.PI / 2;
			// plane.position.copy(object.mesh.position)

			// // Math.random to avoid z-fighting if plane are overlaping
			// plane.position.y = 0.025 + (Math.random() * 0.01)
			// scene.add(plane)

			document.body.requestPointerLock();


			animate();

		}


	},
	// Progress
	(itemUrl, itemsLoaded, itemsTotal) => {
		const progressRatio = itemsLoaded / itemsTotal;
		loadingTextElement.innerHTML = `${Math.round(progressRatio * 100)}%`
		loadingBarElement.style.transform = `scaleX(${progressRatio})`

	}
)

const textureLoader = new THREE.TextureLoader(loadingManager);
// const planeTexture = textureLoader.load('textures/circle.png');

const gltfLoader = new GLTFLoader(loadingManager).setPath('./models/');
// gltfLoader.setDRACOLoader(dracoLoader)

let arrowMesh;
function initLoading() {
	
	// Load structures
	gltfLoader.load('threejs_colliders_v3.glb', (gltf) => {

		scene.add(gltf.scene);
		worldOctree.fromGraphNode(gltf.scene);

		gltf.scene.traverse(child => {
			if (child.isMesh) {
				child.material.opacity = 0;
				child.material.transparent = true;
			}
		});


	});

	gltfLoader.load('threejs_structure_v3.glb', (gltf) => {

		scene.add(gltf.scene);

		gltf.scene.traverse(child => {
			if (child.isMesh) {
				child.material = wallMaterial
				child.material.opacity = 1;
			}
		});
	})


	// load animated models
	gltfLoader.load('chaise.glb', (gltf) => {
		setUpObject(gltf);

	})

	gltfLoader.load('machine.glb', (gltf) => {
		setUpObject(gltf);
	})

	gltfLoader.load('fatboy.glb', (gltf) => {
		setUpObject(gltf);
	})

	gltfLoader.load('ascenseur.glb', (gltf) => {
		setUpObject(gltf);
	})

	gltfLoader.load('multiprise.gltf', (gltf) => {
		setUpObject(gltf);
	})

	// Load arrow cursor mesh
	gltfLoader.load('arrow.glb', (arrow) => {
		arrowMesh = arrow.scene.children[0];
	})
}

function getInformationFromContentMap(objectName) {
	let result;
	paramMap.filter(obj => {
		if (obj.name === objectName) result = obj
	})
	return result;
}

/**
 * Load insight models
 */
function setUpObject(object) {
	// Get informations, using the gltf name and the content map
	let objectParams = getInformationFromContentMap(object.scene.children[0].name);

	if (objectParams) {
		if (objectParams.rotation) object.scene.rotation.y = objectParams.rotation;
		object.scene.position.copy(objectParams.position)
		objectParams.mesh = object.scene.children[0];
		objectParams.action = mixer.clipAction(object.animations[0], objectParams.mesh.parent);
		objectParams.action.setDuration(objectParams.duration);
		objectParams.action.setLoop(THREE.LoopOnce);
		sceneItems.push(objectParams);
		scene.add(object.scene)
	} else {
		console.log("is not mesh", object.scene.children[0])
	}
}


/**
 * Base
 */
const clock = new THREE.Clock();
const scene = new THREE.Scene();
{
  const color = 0x673ab7;  // white
  const near = 4;
  const far = 20;
  // scene.fog = new THREE.Fog(color, near, far);
}
scene.background = new THREE.Color(0x673ab7);

mixer = new THREE.AnimationMixer(scene)

// const planeGeometry = new THREE.PlaneBufferGeometry(3.5, 3.5);
// const planeMaterial = new THREE.MeshBasicMaterial({ map: planeTexture })
// planeMaterial.side = THREE.DoubleSide;


/**
 * Positions Helper
 */
const posXElement = document.querySelector('.positionX');
const posYElement = document.querySelector('.positionY');
const posZElement = document.querySelector('.positionZ');
// function updatePositionHelper() {

// 	posXElement.innerHTML = `posX : ${Math.round(camera.position.x * 100) / 100}`
// 	posYElement.innerHTML = `posY : ${Math.round(camera.position.y * 100) / 100}`
// 	posZElement.innerHTML = `posZ : ${Math.round(camera.position.z * 100) / 100}`

// }

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';
camera.rotateY(- Math.PI * 0.5);

var ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
var hemisphereLight = new THREE.HemisphereLight(0xff0000, 0x0000ff,0.5);
var lightFront = new THREE.SpotLight(0xFFFFFF, 2.04, 100);

lightFront.position.set(5.2, 8.4, -3.425);
lightFront.castShadow = true;
lightFront.shadow.mapSize.width = 6000;
lightFront.shadow.mapSize.height = lightFront.shadow.mapSize.width;
lightFront.penumbra = 0.1;

scene.add(ambientLight);
scene.add(hemisphereLight);
scene.add(lightFront);

// gui.add(ambientLight, 'intensity', 0, 20, 0.01)
// gui.add(lightFront, 'intensity', 0, 10, 0.01)
// gui.add(hemisphereLight, 'intensity', 0, 100, 0.01)
// gui.add(lightFront.position, 'x', -25, 25, 0.001)
// gui.add(lightFront.position, 'y', -25, 25, 0.001)
// gui.add(lightFront.position, 'z', -25, 25, 0.001)

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.VSMShadowMap;

const container = document.getElementById('container');

container.appendChild(renderer.domElement);

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';

// container.appendChild(stats.domElement);

const GRAVITY = 30;

const worldOctree = new Octree();

const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1.5, 0), 0.35);

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = true;

const keyStates = {};

document.addEventListener('keydown', (event) => {

	keyStates[event.code] = true;

});

document.addEventListener('keyup', (event) => {

	keyStates[event.code] = false;

});

document.addEventListener('mousedown', () => {

	if (overlayDisplay == 0 && startDisplay == 0) document.body.requestPointerLock();

});

document.body.addEventListener('mousemove', (event) => {

	if (document.pointerLockElement === document.body) {

		camera.rotation.y -= event.movementX / 500;
		camera.rotation.x -= event.movementY / 500;

	}

});

window.addEventListener('resize', onWindowResize);

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

}



function playerCollitions() {

	const result = worldOctree.capsuleIntersect(playerCollider);

	playerOnFloor = false;

	if (result) {

		playerOnFloor = result.normal.y > 0;

		if (!playerOnFloor) {

			playerVelocity.addScaledVector(result.normal, - result.normal.dot(playerVelocity));

		}

		playerCollider.translate(result.normal.multiplyScalar(result.depth));

	}
  // else{
  //   scream.play()
  // }

}

function updatePlayer(deltaTime) {

	if (playerOnFloor) {

		const damping = Math.exp(- 3 * deltaTime) - 1;
		playerVelocity.addScaledVector(playerVelocity, damping);

	} else {

		playerVelocity.y -= GRAVITY * deltaTime;

	}

	const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
	playerCollider.translate(deltaPosition);

	playerCollitions();

	camera.position.copy(playerCollider.end);

}

function getForwardVector() {

	camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();

	return playerDirection;

}

function getSideVector() {

	camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();
	playerDirection.cross(camera.up);

	return playerDirection;

}

function getDistanceFromVector3(vec3) {
	return camera.position.distanceTo(vec3)
}


function getClosestObject() {

	let closestObject = null;
	// Maybe get element and copy position insted
	for (let object of sceneItems) {

		// Get distance camera --> box
		const distFromCamera = getDistanceFromVector3(object.position);
		// Compare distance to threshold
		if (distFromCamera < threshold) {
			if (closestObject === null) {
				closestObject = object;
				// If an obj is already stored, replace if closer
			} else if (distFromCamera < getDistanceFromVector3(closestObject.position)) {
				closestObject = object;
			}
		}
		else if(distFromCamera < (threshold+0.75) && object.name == 'ascenseur'){
			if (closestObject === null) {
				closestObject = object;
				// If an obj is already stored, replace if closer
			} else if (distFromCamera < getDistanceFromVector3(closestObject.position)) {
				closestObject = object;
			}
		}
	}

	return closestObject;
}


function controls(deltaTime) {

	const speed = 20;

	if (playerOnFloor) {

		if (keyStates['KeyW']) {

			playerVelocity.add(getForwardVector().multiplyScalar(speed * deltaTime));

		}

		if (keyStates['KeyS']) {

			playerVelocity.add(getForwardVector().multiplyScalar(- speed * deltaTime));

		}

		if (keyStates['KeyA']) {

			playerVelocity.add(getSideVector().multiplyScalar(- speed * deltaTime));

		}

		if (keyStates['KeyD']) {

			playerVelocity.add(getSideVector().multiplyScalar(speed * deltaTime));

		}

		if (keyStates['Space']) {

			playerVelocity.y = 10;

		}

		if (keyStates['KeyE']) {

			if (closestObject && canAnimate) {
				if (!isAnimationInProgress) {
					let animationDuration = closestObject.duration;

					// Prevent from animate more than once
					updateInsightState(true)
					isAnimationInProgress = true

					//play action chair
					closestObject.action.stop();
					closestObject.action.play();

					// Hide Arrows
					for (const arrow of arrows) {
						gsap.to(arrow.material, { duration: 0.2, opacity: 0 });
					}

					// const prevPosY = closestObject.mesh.position.y;
					// gsap.to(closestObject.mesh.position, { duration: 1, y: closestObject.mesh.position.y + 2 })
					// gsap.to(closestObject.mesh.position, { duration: 1, y: prevPosY, delay: 1 })



					setTimeout(() => {
						isAnimationInProgress = false

						// Display Arrows
						for (const arrow of arrows) {
							gsap.to(arrow.material, { duration: 1, opacity: 1 });
						}
					}, animationDuration * 1000)

				} else {
					return
				}
			} else return

		}

		if (keyStates['KeyC']) {
			closeInsight()
		}

	}

}

const interactionElement = document.querySelector('.interaction-text');
function updateInteractionButtonState(visible) {

	if (visible) {
		interactionElement.classList.add('visible')
	}
	else {
		interactionElement.classList.remove('visible')
	}
}

const insightElement = document.querySelector('.insight');
function updateInsightState(visible) {

	if (visible) {

		//Store insight to avoid losing insight if player go away during transition states
		let insight = closestObject.insight;

		if (insightElement.innerHTML.length > 0) {
			insightElement.classList.remove('visible');
			interactionElement.classList.remove('above');
			setTimeout(() => {
				// Avoid clearing text before element not visible
				insightElement.innerHTML = '';
			}, 300)

			setTimeout(() => {
				insightElement.classList.add('visible');
				interactionElement.classList.add('above');
				insightElement.innerHTML = insight;
			}, 900)

		} else {
			insightElement.classList.add('visible');
			interactionElement.classList.add('above');
			insightElement.innerHTML = insight;
			if(closestObject.name == 'ascenseur'){
				interactionElement.classList.add('ascenseur');
			}
			else{
				interactionElement.classList.remove('ascenseur');
			}
		}

	} else {
		insightElement.classList.remove('visible');
		interactionElement.classList.remove('above');
		insightElement.innerHTML = '';
	}
}
function closeInsight() {
	interactionElement.classList.remove('above');
	insightElement.classList.remove('visible');
	setTimeout(() => {
		//Avoid clear text before element not visible
		insightElement.innerHTML = '';
	}, 400)
}

function animateArrows(elapsedTime) {
	for (const arrow of arrows) {
		arrow.position.y = arrow.position.y + (Math.cos(elapsedTime) * 0.002)
		arrow.rotation.y = elapsedTime * 0.5
	}
}

function isPlayerLookingAtObject() {
	if (closestObject) {
		positionScreenSpace.copy(closestObject.position).project(camera);
		positionScreenSpace.setZ(0);
		return positionScreenSpace.length() < threshold;
	}
	else 
	{
		return false
	}
}


function animate() {

	const deltaTime = Math.min(0.1, clock.getDelta());
	const elapsedTime = clock.getElapsedTime()

	// updatePositionHelper();

	closestObject = getClosestObject();
	if(closestObject == null){
		console.log('closeinsight')
		closeInsight()
	}


	if (closestObject && !isAnimationInProgress && isPlayerLookingAtObject()) {
		updateInteractionButtonState(true)
		canAnimate = true;

	} else {
		canAnimate = false
		updateInteractionButtonState(false)
	}

	//Calcul mixer
	if (mixer !== null) {
		mixer.update(deltaTime)
	}

	controls(deltaTime);

	updatePlayer(deltaTime);

	animateArrows(elapsedTime);

	renderer.render(scene, camera);

	// stats.update();

	requestAnimationFrame(animate);

}

