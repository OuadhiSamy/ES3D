import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'
import { gsap } from 'gsap'

import Stats from 'three/examples/jsm/libs/stats.module.js';

import { Octree } from 'three/examples/jsm/math/Octree.js';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';
import { Mesh, Vector3 } from 'three'

const gui = new dat.GUI();

/**
 * Global Variables Declarations
 */
let closestObject = null;
let isAnimationInProgress = false;
let canAnimate = false;
let positionScreenSpace = new THREE.Vector3();
let threshold = 2.5;
let arrows = [];
let wallMaterial = new THREE.MeshPhysicalMaterial({
	color: 0x1c1c1c,
	roughness: 10,
	metalness: 0.6,
});


let mixer = null;

/**
 * Parameters map, used to link an object to his informations (position, insight), using
 */
let paramMap = [
	{
		name: "chaise",
		mesh: null,
		position: new Vector3(5, 0, 1.25),
		action: null,
		duration: 10,
		insight: "Encore une chaise jaune. Cet objet est présent dans tout le campus, à tel point que vous avez l'impression que celle-ci vous suit partout. Elle vient de vous regarder mal là, non ?"
	},
	{
		name: "machine_a_cafe",
		mesh: null,
		position: new Vector3(5, 0, -2.8),
		action: null,
		duration: 10,
		insight: "Vous insérez une pièce dans la machine et vous sélectionnez un grand café fort pour vous remettre de votre code sprint. La machine se lance, mais vous présente finalement un gobelet vide. Vous auriez mieux fait de choisir un café en intraveineuse."
	},
]

/**
 * Content that will be display
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
		loadingTimeline.to(".overlay", { delay: 1.5, duration: 1, opacity: 0 })


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
			console.log(object.mesh)
			const helper = new THREE.Box3Helper(boundBox, 0xffff00);
			scene.add(helper);
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
const planeTexture = textureLoader.load('textures/circle.png');

const gltfLoader = new GLTFLoader(loadingManager).setPath('./models/');

gltfLoader.load('threejs_colliders_v3.glb', (gltf) => {

	scene.add(gltf.scene);


	worldOctree.fromGraphNode(gltf.scene);

	gltf.scene.traverse(child => {

		if (child.isMesh) {
			child.material.opacity = 0;
			child.material.transparent = true;
		}

	});

	console.log(scene)

	animate();

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
		object.scene.position.copy(objectParams.position)
		objectParams.mesh = object.scene.children[0];
		objectParams.action = mixer.clipAction(object.animations[0], objectParams.mesh);
		objectParams.action.setDuration(objectParams.duration);
		objectParams.action.setLoop(THREE.LoopOnce);
		sceneItems.push(objectParams);
		scene.add(object.scene)
	} else {
		console.log("is not mesh", object.scene.children[0])
	}
}

// load chair
gltfLoader.load('chaise.glb', (gltf) => {
	setUpObject(gltf);

})

gltfLoader.load('machine.glb', (gltf) => {
	setUpObject(gltf);
})

// Load arrow cursor mesh
let arrowMesh;
gltfLoader.load('arrow.glb', (arrow) => {
	arrowMesh = arrow.scene.children[0];
})


/**
 * Base
 */
const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88ccff);

mixer = new THREE.AnimationMixer(scene)


const box1 = new THREE.Mesh(
	new THREE.BoxBufferGeometry(1, 0.75, 1),
	wallMaterial
)
const box2 = new THREE.Mesh(
	new THREE.BoxBufferGeometry(1, 1.25, 1),
	wallMaterial
)

const planeGeometry = new THREE.PlaneBufferGeometry(3.5, 3.5);
const planeMaterial = new THREE.MeshBasicMaterial({ map: planeTexture })
planeMaterial.side = THREE.DoubleSide;

const boxes = [
	{
		name: "red cube",
		mesh: box1, position: new Vector3(5, 0.75 / 2, -2),
		insight: "Vous insérez une pièce dans la machine et vous sélectionnez un grand café fort pour vous remettre de votre code sprint. La machine se lance, mais vous présente finalement un gobelet vide.Vous auriez mieux fait de choisir un café en intraveineuse."
	},
	{
		name: "blue cube",
		mesh: box2,
		position: new Vector3(7, 1.25 / 2, 1.25),
		insight: "Vous avez une pause entre deux sessions de recherches UX, le fatboy vous fait de l’œil. Il a l'air moelleux et réconfortant. Vous vous sentez attiré(e) par son aura. Alors que vous êtes sur le point de vous laisser engloutir par la tentation, votre meilleur ami vous tapote l'épaule et vous ramène à la réalité."
	},
];


/**
 * Positions Helper
 */
const posXElement = document.querySelector('.positionX');
const posYElement = document.querySelector('.positionY');
const posZElement = document.querySelector('.positionZ');
const distB1 = document.querySelector('.distB1');
const distB2 = document.querySelector('.distB2');
function updatePositionHelper() {

	posXElement.innerHTML = `posX : ${Math.round(camera.position.x * 100) / 100}`
	posYElement.innerHTML = `posY : ${Math.round(camera.position.y * 100) / 100}`
	posZElement.innerHTML = `posZ : ${Math.round(camera.position.z * 100) / 100}`

	let distFromRed = getDistanceFromVector3(boxes[0].position);
	let distFromBlue = getDistanceFromVector3(boxes[1].position);
	distB1.innerHTML = `Distance from red : ${Math.round(distFromRed * 100) / 100}`
	distB2.innerHTML = `Distance from blue : ${Math.round(distFromBlue * 100) / 100}`


}

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';
camera.rotateY(- Math.PI * 0.5);

var ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
var lightFront = new THREE.SpotLight(0xFFFFFF, 2.04, 100);

lightFront.position.set(5.2, 8.4, -3.425);
lightFront.castShadow = true;
lightFront.shadow.mapSize.width = 6000;
lightFront.shadow.mapSize.height = lightFront.shadow.mapSize.width;
lightFront.penumbra = 0.1;

scene.add(ambientLight);
scene.add(lightFront);

gui.add(ambientLight, 'intensity', 0, 20, 0.01)
gui.add(lightFront, 'intensity', 0, 10, 0.01)
gui.add(lightFront.position, 'x', -25, 25, 0.001)
gui.add(lightFront.position, 'y', -25, 25, 0.001)
gui.add(lightFront.position, 'z', -25, 25, 0.001)

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

const container = document.getElementById('container');

container.appendChild(renderer.domElement);

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';

container.appendChild(stats.domElement);

const GRAVITY = 30;

const worldOctree = new Octree();

const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1.25, 0), 0.35);

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

	document.body.requestPointerLock();

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
		if (distFromCamera < 2) {
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

	const speed = 25;

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
			setTimeout(() => {
				// Avoid clearing text before element not visible
				insightElement.innerHTML = '';
			}, 300)

			setTimeout(() => {
				insightElement.classList.add('visible')
				insightElement.innerHTML = insight;
			}, 900)

		} else {
			insightElement.classList.add('visible')
			insightElement.innerHTML = insight;
		}

	} else {
		insightElement.classList.remove('visible')
		insightElement.innerHTML = '';
	}
}
function closeInsight() {
	insightElement.classList.remove('visible')
	setTimeout(() => {
		//Avoid clear text before element not visible
		insightElement.innerHTML = '';
	}, 300)
}


function animateArrows(elapsedTime) {
	for (const arrow of arrows) {
		arrow.position.y = arrow.position.y + (Math.cos(elapsedTime) * 0.002)
		arrow.rotation.y = elapsedTime * 0.5
	}
}

function isPlayerLookingAtObject(deltaTime) {
	if (closestObject) {
		positionScreenSpace.copy(closestObject.position).project(camera);
		positionScreenSpace.setZ(0);
		return positionScreenSpace.length() < threshold;
	} else return false
}


function animate() {

	const deltaTime = Math.min(0.1, clock.getDelta());
	const elapsedTime = clock.getElapsedTime()

	updatePositionHelper();

	closestObject = getClosestObject();

	// if(closestObject)
	// console.log(closestObject.mesh.position)

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

	// updateSpheres(deltaTime);

	animateArrows(elapsedTime);

	renderer.render(scene, camera);

	stats.update();

	requestAnimationFrame(animate);

}

