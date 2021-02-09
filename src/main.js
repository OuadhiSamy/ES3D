import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'
import {Howl, Howler} from 'howler';
//import gsap from 'gsap'


import Stats from 'three/examples/jsm/libs/stats.module.js';

import { Octree } from 'three/examples/jsm/math/Octree.js';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';


			const clock = new THREE.Clock();

			const scene = new THREE.Scene();
			scene.background = new THREE.Color( 0x88ccff );

			const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
			camera.rotation.order = 'YXZ';

			const ambientlight = new THREE.AmbientLight( 0x6688cc );
			scene.add( ambientlight );

			const fillLight1 = new THREE.DirectionalLight( 0xff9999, 0.5 );
			fillLight1.position.set( - 1, 1, 2 );
			scene.add( fillLight1 );

			const fillLight2 = new THREE.DirectionalLight( 0x8888ff, 0.2 );
			fillLight2.position.set( 0, - 1, 0 );
			scene.add( fillLight2 );

			const directionalLight = new THREE.DirectionalLight( 0xffffaa, 1.2 );
			directionalLight.position.set( - 5, 25, - 1 );
			directionalLight.castShadow = true;
			directionalLight.shadow.camera.near = 0.01;
			directionalLight.shadow.camera.far = 500;
			directionalLight.shadow.camera.right = 30;
			directionalLight.shadow.camera.left = - 30;
			directionalLight.shadow.camera.top	= 30;
			directionalLight.shadow.camera.bottom = - 30;
			directionalLight.shadow.mapSize.width = 1024;
			directionalLight.shadow.mapSize.height = 1024;
			directionalLight.shadow.radius = 4;
			directionalLight.shadow.bias = - 0.00006;
			scene.add( directionalLight );

			const renderer = new THREE.WebGLRenderer( { antialias: true } );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( window.innerWidth, window.innerHeight );
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.VSMShadowMap;

			const container = document.getElementById( 'container' );

			container.appendChild( renderer.domElement );

			const stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';

			container.appendChild( stats.domElement );

			const GRAVITY = 30;

			const NUM_SPHERES = 20;
			const SPHERE_RADIUS = 0.2;

			const sphereGeometry = new THREE.SphereGeometry( SPHERE_RADIUS, 32, 32 );
			const sphereMaterial = new THREE.MeshStandardMaterial( { color: 0x888855, roughness: 0.8, metalness: 0.5 } );

			const spheres = [];
			let sphereIdx = 0;

			let soundMuted = 0;
			/**
			 * Loaders
			 */

			const sound = new Howl({
				src: ['sounds/spacefunk.mp3'],
				loop: true,
				volume: 0.08,
				autoplay:true,
				preload:true
			});
				sound.play();
			
			const cafe = new Howl({
				src: ['sounds/coffee.mp3'],
				volume:0.3
			});


			//Start Menu
			const startButton = document.getElementById('start-btn')

			const startMenu = document.getElementById( 'start-screen' );
			let startDisplay = 1

			startButton.addEventListener("click", ( event ) => {
				document.body.requestPointerLock()
				startDisplay = 0
				startMenu.style.display = 'none';
				console.log('test')
			})

			//Menu Pause
			const overlay = document.getElementById( 'overlay' );
			let overlayDisplay = 1

			//Equalizer
			const eq = document.getElementById('equalizer')
			const eqBars = document.getElementsByClassName('eq-unmute')
			console.log('Bar:' + eqBars)
			
			eq.addEventListener("click", ( event ) => {
				eq.classList.toggle('mute')
			})



			// document.body.requestPointerLock();

			//document.body.innerHTML = document.body.innerHTML + '<div id="blocker"><div id="instructions"><span style="font-size:36px">Click to play</span><br /><br />Move: ZQSD<br/>Jump: SPACE<br/>Look: MOUSE</div></div>'
			//document.body.innerHTML = document.body.innerHTML + '<div class="gui"><div class="hud-layer"><div class="crosshair"><img src="/images/crosshair.svg" class="image"></div></div></div>'

			for ( let i = 0; i < NUM_SPHERES; i ++ ) {

				const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
				sphere.castShadow = true;
				sphere.receiveShadow = true;

				scene.add( sphere );

				spheres.push( { mesh: sphere, collider: new THREE.Sphere( new THREE.Vector3( 0, - 100, 0 ), SPHERE_RADIUS ), velocity: new THREE.Vector3() } );

			}

			const worldOctree = new Octree();

			const playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1, 0 ), 0.35 );

			const playerVelocity = new THREE.Vector3();
			const playerDirection = new THREE.Vector3();

			let playerOnFloor = true;

			const keyStates = {};
			console.log(document.pointerLockElement)

			document.addEventListener( 'keydown', ( event ) => {

				keyStates[ event.code ] = true;

				if ( keyStates[ 'KeyM' ] || keyStates[ 'Key,' ] ) {
					if(document.pointerLockElement === null)
					{
						document.body.requestPointerLock()
						overlayDisplay = 1
						overlay.style.display = 'none';
					}
					else{
						document.exitPointerLock();
						overlayDisplay = 0
						overlay.style.display = 'flex';
					}
					

				}

				keyStates[ event.code ] = true;
			
				if ( keyStates['Semicolon'] ) {
				  if ( soundMuted == 0 ) {
				  sound.pause();
				  soundMuted = 1;
				  console.log('mute')
				  }
				  else{
					  sound.play();
					  soundMuted = 0
					  console.log('unmute') 
					}
			  };

			} );

			document.addEventListener( 'keyup', ( event ) => {

				keyStates[ event.code ] = false;

			} );

			// document.addEventListener( 'mousedown', () => {

			// 	document.body.requestPointerLock();

			// } );

			document.body.addEventListener( 'mousemove', ( event ) => {

				if ( document.pointerLockElement === document.body ) {

					camera.rotation.y -= event.movementX / 500;
					camera.rotation.x -= event.movementY / 500;

				}

			} );

			window.addEventListener( 'resize', onWindowResize );

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

			document.addEventListener( 'click', () => {
				console.log('onclick')
				if(overlayDisplay == 1)
				{
					console.log('onclick request')
					document.body.requestPointerLock()
				}

			} );

			function playerCollitions() {

				const result = worldOctree.capsuleIntersect( playerCollider );

				playerOnFloor = false;

				if ( result ) {

					playerOnFloor = result.normal.y > 0;

					if ( ! playerOnFloor ) {

						playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );

					}

					playerCollider.translate( result.normal.multiplyScalar( result.depth ) );

				}

			}

			function updatePlayer( deltaTime ) {

				if ( playerOnFloor ) {

					const damping = Math.exp( - 3 * deltaTime ) - 1;
					playerVelocity.addScaledVector( playerVelocity, damping );

				} else {

					playerVelocity.y -= GRAVITY * deltaTime;

				}

				const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
				playerCollider.translate( deltaPosition );

				playerCollitions();

				camera.position.copy( playerCollider.end );

			}

			
			function getForwardVector() {

				camera.getWorldDirection( playerDirection );
				playerDirection.y = 0;
				playerDirection.normalize();

				return playerDirection;

			}

			function getSideVector() {

				camera.getWorldDirection( playerDirection );
				playerDirection.y = 0;
				playerDirection.normalize();
				playerDirection.cross( camera.up );

				return playerDirection;

			}

			function controls( deltaTime ) {

				const speed = 25;

				if ( playerOnFloor ) {

					if ( keyStates[ 'KeyW' ] ) {

						playerVelocity.add( getForwardVector().multiplyScalar( speed * deltaTime ) );

					}

					
					if ( keyStates[ 'KeyS' ] ) {

						playerVelocity.add( getForwardVector().multiplyScalar( - speed * deltaTime ) );

					}

					if ( keyStates[ 'KeyA' ] ) {

						playerVelocity.add( getSideVector().multiplyScalar( - speed * deltaTime ) );

					}

					if ( keyStates[ 'KeyD' ] ) {

						playerVelocity.add( getSideVector().multiplyScalar( speed * deltaTime ) );

					}

					if ( keyStates[ 'Space' ] ) {

						playerVelocity.y = 15;

					}

                    // if ( playerVelocity.y >0 || playerVelocity.y <0 && keyStates[ 'KeyW' ] ) {

					// 	playerVelocity.add( getSideVector().multiplyScalar( speed * deltaTime ) );

					// }

				}

			}

			const geometry = new THREE.PlaneGeometry( 5000, 2000, 32 );
const material = new THREE.MeshBasicMaterial( {color: 0x9A86A1, side: THREE.DoubleSide} );
const plane = new THREE.Mesh( geometry, material );
plane.rotation.x = - Math.PI / 2;
scene.add( plane );

			const loader = new GLTFLoader().setPath( './models/' );


			let mixer = null
			var action;

//CenterToCamera
var positionScreenSpace = new THREE.Vector3();
var threshold = 0.2;			
// // //Sphere 4
var sphere4 = new THREE.Mesh(
    new THREE.SphereGeometry( 0.1, 16, 16),
	new THREE.MeshStandardMaterial({ color: 0x3300FF, roughness:0.4}))
	scene.add(sphere4)
sphere4.position.y = 0.3;
var test

// var test
			
			// déclaration chaise animée
            loader.load( 'chaise.glb', ( gltf ) => {
				gltf.scene.scale.set(1,1,1)
				scene.add( gltf.scene );
				
				mixer = new THREE.AnimationMixer(gltf.scene)
				action = mixer.clipAction(gltf.animations[0])
				action.setLoop( THREE.LoopOnce );
                console.log(gltf.scene)
			})

            // const box = new THREE.Box3().setFromObject(mesh);
            // const center = box.getCenter(new THREE.Vector3());

            // mesh.position.set(
            // mesh.position.x - center.x,
            // mesh.position.y - center.y,
            // mesh.position.z - center.z
            // );

            // loader.load( 'TRY8CODE.glb', ( gltf ) => {
            //     scene.add( gltf.scene );
			// })

			loader.load( 'collions.glb', ( gltf ) => {
				scene.add( gltf.scene );

				worldOctree.fromGraphNode( gltf.scene );

				gltf.scene.traverse( child => {

					if ( child.isMesh ) {
						// child.castShadow = true;
						// child.receiveShadow = true;

						if ( child.material.map ) {

							child.material.map.anisotropy = 8;
							

						}
                            // // // set opacity to 50%
							child.material.opacity = 0.5;
                            // // // enable transparency
                            child.material.transparent = true;
					}

				} );

				// anim chaise au onclick
				document.addEventListener( 'mousedown', onDocumentMouseDown, false );

				function onDocumentMouseDown( event ) {

				    // if ( action !== null ) {

                    //     action.stop();
                    //     action.play();
					// }
                                                
                    event.preventDefault();

                    if(test == 1 && action !== null)
                    {   
                        action.stop();
                        action.play();
                        console.log('c bon')
                    }
                    else if(test == 2)
                    {
                        console.log('echec')
                    }


				}


	
				animate();

			} );

			function animate() {


				// 	fonction maxime
				test = 0
				//Check Center Screen
				positionScreenSpace.copy(sphere4.position).project(camera);
				positionScreenSpace.setZ(0);
				var isCloseToCenter = positionScreenSpace.length() < threshold;

				//If character close to object
				// console.log('Camera X : ',camera.position.x)
                // console.log('Camera Z : ',camera.position.z)
				if((camera.position.x-sphere4.position.x)<1 && (camera.position.x-sphere4.position.x)>-1 && (camera.position.z-sphere4.position.z)<1 &&(camera.position.z-sphere4.position.z)>-1){   
					console.log('proche')
					//If character targetting object
					if(isCloseToCenter){
						sphere4.material.color.set('#ff0000')
						test = 1
					}
					else{
						sphere4.material.color.set('#0000ff')
						test = 2
					}
				}
				else{
				console.log('loin')
				sphere4.material.color.set('#0000ff')
				test = 2
				}

                // if((camera.position.x-'chaise.glb'.position.x)<1 && (camera.position.x-sphere4.position.x)>-1 && (camera.position.z-sphere4.position.z)<1 &&(camera.position.z-sphere4.position.z)>-1){   
				// 	console.log('proche')
				// 	//If character targetting object
				// 	if(isCloseToCenter){
				// 		sphere4.material.color.set('#ff0000')
				// 		test = 1
				// 	}
				// 	else{
				// 		sphere4.material.color.set('#0000ff')
				// 		test = 2
				// 	}
				// }
				// else{
				// console.log('loin')
				// sphere4.material.color.set('#0000ff')
				// test = 2
				// }
		
				const deltaTime = Math.min( 0.1, clock.getDelta() );

				controls( deltaTime );

				updatePlayer( deltaTime );

				//Calcule animation de la chaise
				if( mixer !== null)
				{
					mixer.update(deltaTime)
				}

				renderer.render( scene, camera );

				stats.update();

				requestAnimationFrame( animate );

			}

