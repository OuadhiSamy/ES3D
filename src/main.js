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
let threshold = 1;
let arrows = [];


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

// Load arrow cursor mesh
let arrowMesh;
gltfLoader.load('arrow.glb', (arrow) => {
	arrowMesh = arrow.scene.children[0];
	// console.log(arrowMesh)
	// arrowMesh.position.set(3.5, 2, 0.35)
	// scene.add(arrowMesh);
})

gltfLoader.load('structurev4.glb', (gltf) => {

	// scene.add(gltf.scene);

	for (const object of boxes) {
		// Add each object to the scene
		object.mesh.position.copy(object.position)
		scene.add(object.mesh)

		// Add arrow on top of each object
		// get object size
		let boundBox = new THREE.Box3().setFromObject(object.mesh);
		let objectSize = boundBox.getSize(); // objectSize is a vector3
		let newArrow = arrowMesh.clone();
		newArrow.position.set(object.mesh.position.x, objectSize.y + 0.4, object.mesh.position.z)
		newArrow.material.transparent = true;
		scene.add(newArrow)
		arrows.push(newArrow);

		// Add circle plane to each object
		let plane = new THREE.Mesh(planeGeometry, planeMaterial);

		// Rotate plane to place it on the ground
		plane.rotation.x = - Math.PI / 2;
		plane.position.copy(object.mesh.position)

		// Math.random to avoid z-fighting if plane are overlaping
		plane.position.y = 0.025 + (Math.random() * 0.01)
		// scene.add(plane)
	}

})

// let material = new THREE.MeshStandardMaterial({
// 	color:0x000000,
// 	wireframe:false,
// 	//opacity:0.9,
// 	//transparent:true,
// 	//roughness: 0.3,
// 	//metalness: 1,
// 	shading: THREE.SmoothShading,
// 	//shading:THREE.FlatShading,
// 	side:THREE.DoubleSide
// });

var material = new THREE.MeshPhongMaterial({
	color: 0x1c1c1c,
	side: THREE.DoubleSide,
	roughness: 10,
	metalness: 0.6,
	opacity: 1,
	transparent: true
});
gltfLoader.load('threejs_colliders.glb', (gltf) => {

	scene.add(gltf.scene);

	worldOctree.fromGraphNode(gltf.scene);

	gltf.scene.traverse(child => {

		if (child.isMesh) {
			child.material = material
			// if (child.material.map) {

			// 	child.material.map.anisotropy = 8;


			// }
			// child.material.opacity = 0.5;
			// child.material.transparent = true;
		}

	});


	animate();

});

/**
 * Base
 */
const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88ccff);


const box1 = new THREE.Mesh(
	new THREE.BoxBufferGeometry(1, 0.75, 1),
	material
)
const box2 = new THREE.Mesh(
	new THREE.BoxBufferGeometry(1, 1.25, 1),
	material
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

/**
 * Lights
 */
// const ambientlight = new THREE.AmbientLight(0x6688cc);
// scene.add(ambientlight);

// const fillLight1 = new THREE.DirectionalLight(0xff9999, 0.5);
// fillLight1.position.set(- 1, 1, 2);
// scene.add(fillLight1);

// const fillLight2 = new THREE.DirectionalLight(0x8888ff, 0.2);
// fillLight2.position.set(0, - 1, 0);
// scene.add(fillLight2);

// const directionalLight = new THREE.DirectionalLight(0xffffaa, 1.2);
// directionalLight.position.set(- 5, 25, - 1);
// directionalLight.castShadow = true;
// directionalLight.shadow.camera.near = 0.01;
// directionalLight.shadow.camera.far = 500;
// directionalLight.shadow.camera.right = 30;
// directionalLight.shadow.camera.left = - 30;
// directionalLight.shadow.camera.top = 30;
// directionalLight.shadow.camera.bottom = - 30;
// directionalLight.shadow.mapSize.width = 1024;
// directionalLight.shadow.mapSize.height = 1024;
// directionalLight.shadow.radius = 4;
// directionalLight.shadow.bias = - 0.00006;
// scene.add(directionalLight);

var ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
var lightFront = new THREE.SpotLight(0xFFFFFF, 2.04, 100);
// var lightBack = new THREE.PointLight(0xFFFFFF, 0.5);

// var spotLightHelper = new THREE.SpotLightHelper( lightFront );
//scene.add( spotLightHelper );

// lightFront.rotation.x = 45 * Math.PI / 180;
// lightFront.rotation.z = -45 * Math.PI / 180;
lightFront.position.set(5.2, 8.4, -3.425);
lightFront.castShadow = true;
lightFront.shadow.mapSize.width = 6000;
lightFront.shadow.mapSize.height = lightFront.shadow.mapSize.width;
lightFront.penumbra = 0.1;
// lightBack.position.set(0,15,0);

scene.add(ambientLight);
scene.add(lightFront);
// scene.add(lightBack);

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

const NUM_SPHERES = 20;
const SPHERE_RADIUS = 0.2;

const sphereGeometry = new THREE.SphereGeometry(SPHERE_RADIUS, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x888855, roughness: 0.8, metalness: 0.5 });

const spheres = [];
let sphereIdx = 0;

for (let i = 0; i < NUM_SPHERES; i++) {

	const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	sphere.castShadow = true;
	sphere.receiveShadow = true;

	scene.add(sphere);

	spheres.push({ mesh: sphere, collider: new THREE.Sphere(new THREE.Vector3(0, - 100, 0), SPHERE_RADIUS), velocity: new THREE.Vector3() });

}

const worldOctree = new Octree();

const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);

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

document.addEventListener('click', () => {

	// const sphere = spheres[ sphereIdx ];

	// camera.getWorldDirection( playerDirection );

	// sphere.collider.center.copy( playerCollider.end );
	// sphere.velocity.copy( playerDirection ).multiplyScalar( 30 );

	// sphereIdx = ( sphereIdx + 1 ) % spheres.length;

});

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

function spheresCollisions() {

	for (let i = 0; i < spheres.length; i++) {

		const s1 = spheres[i];

		for (let j = i + 1; j < spheres.length; j++) {

			const s2 = spheres[j];

			const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
			const r = s1.collider.radius + s2.collider.radius;
			const r2 = r * r;

			if (d2 < r2) {

				const normal = s1.collider.clone().center.sub(s2.collider.center).normalize();
				const v1 = normal.clone().multiplyScalar(normal.dot(s1.velocity));
				const v2 = normal.clone().multiplyScalar(normal.dot(s2.velocity));
				s1.velocity.add(v2).sub(v1);
				s2.velocity.add(v1).sub(v2);

				const d = (r - Math.sqrt(d2)) / 2;

				s1.collider.center.addScaledVector(normal, d);
				s2.collider.center.addScaledVector(normal, - d);

			}

		}

	}

}

function updateSpheres(deltaTime) {

	spheres.forEach(sphere => {

		sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

		const result = worldOctree.sphereIntersect(sphere.collider);

		if (result) {

			sphere.velocity.addScaledVector(result.normal, - result.normal.dot(sphere.velocity) * 1.5);
			sphere.collider.center.add(result.normal.multiplyScalar(result.depth));

		} else {

			sphere.velocity.y -= GRAVITY * deltaTime;

		}

		const damping = Math.exp(- 1.5 * deltaTime) - 1;
		sphere.velocity.addScaledVector(sphere.velocity, damping);

		spheresCollisions();

		sphere.mesh.position.copy(sphere.collider.center);

	});

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
	for (let object of boxes) {

		// Get distance camera --> box
		const distFromCamera = getDistanceFromVector3(object.position);
		// Compare distance to threshold
		if (distFromCamera < 1.5) {
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

					// Prevent from animate more than once
					updateInsightState(true)
					isAnimationInProgress = true

					// // Hide Arrows
					// for (const arrow of arrows) {
					// 	gsap.to(arrow.material, { duration: 0.2, opacity: 0 });
					// }

					// const prevPosY = closestObject.mesh.position.y;
					// gsap.to(closestObject.mesh.position, { duration: 1, y: closestObject.mesh.position.y + 2 })
					// gsap.to(closestObject.mesh.position, { duration: 1, y: prevPosY, delay: 1 })




					setTimeout(() => {
						isAnimationInProgress = false

						// Display Arrows
						for (const arrow of arrows) {
							gsap.to(arrow.material, { duration: 0.2, opacity: 1 });
						}
					}, 2000)

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
		if (insightElement.innerHTML.length > 0) {
			insightElement.classList.remove('visible');
			setTimeout(() => {
				//Avoid clear text before element not visible
				insightElement.innerHTML = '';
			}, 300)

			setTimeout(() => {
				insightElement.classList.add('visible')
				insightElement.innerHTML = closestObject.insight;
			}, 900)

		} else {
			insightElement.classList.add('visible')
			insightElement.innerHTML = closestObject.insight;
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

	if (closestObject && !isAnimationInProgress && isPlayerLookingAtObject()) {
		updateInteractionButtonState(true)
		canAnimate = true;
	} else {
		canAnimate = false
		updateInteractionButtonState(false)
	}

	controls(deltaTime);

	updatePlayer(deltaTime);

	updateSpheres(deltaTime);

	animateArrows(elapsedTime);

	renderer.render(scene, camera);

	stats.update();

	requestAnimationFrame(animate);

}

