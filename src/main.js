import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'

//import post prod 
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SMAAPass} from 'three/examples/jsm/postprocessing/SMAAPass.js';

import { ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader} from 'three/examples/jsm/shaders/CopyShader.js';

import { UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

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


			const worldOctree = new Octree();

			const playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1, 0 ), 0.35 );

			const playerVelocity = new THREE.Vector3();
			const playerDirection = new THREE.Vector3();

			let playerOnFloor = true;

			const keyStates = {};

			document.addEventListener( 'keydown', ( event ) => {

				keyStates[ event.code ] = true;

			} );

			document.addEventListener( 'keyup', ( event ) => {

				keyStates[ event.code ] = false;

			} );

			document.addEventListener( 'mousedown', () => {

				document.body.requestPointerLock();

			} );

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

				// Update effect composer
				effectComposer.setPixelRatio(Math.min(window.devicePixelRatio,2))
				effectComposer.setSize(window.innerWidth, window.innerHeight)

			}

			document.addEventListener( 'click', () => {

				// const sphere = spheres[ sphereIdx ];

				// camera.getWorldDirection( playerDirection );

				// sphere.collider.center.copy( playerCollider.end );
				// sphere.velocity.copy( playerDirection ).multiplyScalar( 30 );

				// sphereIdx = ( sphereIdx + 1 ) % spheres.length;

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

			//copiécollé
			camera.layers.enable(1);
			renderer.autoClear = false;


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
				
			// Add Plane
				const geometry = new THREE.PlaneGeometry( 5000, 2000, 32 );
				const material = new THREE.MeshBasicMaterial( {color: 0x3D2B1F, side: THREE.DoubleSide} );
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


			/*Post processing*/

			// Optimisation du calcul pour basculer sur WebGLMultisampleRenderTarget s'il est supporté par le navigateur
			let RenderTargetClass = null

			if(renderer.getPixelRatio() === 1 && renderer.capabilities.isWebGL2)
			{
				RenderTargetClass = THREE.WebGLMultisampleRenderTarget
				// console.log('Using WebGLMultisampleRenderTarget')
			}
			else
			{
				RenderTargetClass = THREE.WebGLRenderTarget
				// console.log('Using WebGLRenderTarget')
			}


			const renderTarget = new THREE.WebGLRenderTarget(
				800,
				600,
				{
					minFilter: THREE.LinearFilter,
					magFilter: THREE.LinearFilter,
					format: THREE.RGBAFormat,
					encoding: THREE.sRGBEncoding
				}
			)
			

			////Effect Composer
			const effectComposer = new EffectComposer( renderer, renderTarget );
			effectComposer.setPixelRatio(Math.min(window.devicePixelRatio,2))
			effectComposer.setSize(window.innerWidth, window.innerHeight)
			// console.log(effectComposer)
			const renderPass = new RenderPass(scene, camera)
			effectComposer.addPass(renderPass)

			const bloomPass = new UnrealBloomPass()
			bloomPass.enabled = true
			bloomPass.strength = 0.5
			bloomPass.radius = 0.55
			bloomPass.threshold = 0.21
			effectComposer.addPass(bloomPass)

			////Recalcule l'antialiasing seulement si WebGL2 n'est pas supporté par le navigateur
			
			if(renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2)
			{
				const smaaPass = new SMAAPass()
				effectComposer.addPass(smaaPass)
				console.log('Using SMAA')		
			}
			

			// //Cube


			// déclaration chaise animée
            loader.load( 'chaise.glb', ( gltf ) => {
				gltf.scene.scale.set(1,1,1)
				scene.add( gltf.scene );

				// console.log(gltf)
				mixer = new THREE.AnimationMixer(gltf.scene)
				action = mixer.clipAction(gltf.animations[0])
				action.setLoop( THREE.LoopOnce );
			})

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
				
		
				////cube rouge
				var cube = new THREE.Mesh(
					new THREE.BoxGeometry(1, 1, 1),
					new THREE.MeshStandardMaterial({ color: 0xff0000}))
					scene.add(cube)

					var obj = cube;
					obj.layers.set(0);
					obj.position.z = 2;
					scene.add(obj);

				////cube vert
				var cube2 = new THREE.Mesh(
					new THREE.BoxGeometry(1, 6, 1),
					new THREE.MeshStandardMaterial({ color: 0x20680a}))
					scene.add(cube2)

					var objBack = cube2
					objBack.position.z = -2;				
					objBack.layers.set(1);
					scene.add(objBack);
				
				
				console.log(scene);
				
				animate();

			} );

			

			

			function animate() {


				// 	fonction maxime
				test = 0
				//Check Center Screen
				positionScreenSpace.copy(scene.children[6].children[2].position).project(camera);
				positionScreenSpace.setZ(0);
				var isCloseToCenter = positionScreenSpace.length() < threshold;

				//If character close to object
				//console.log('Camera : ',camera.position.x)
				//console.log('Sphere : ',sphere4.position.x)
				if((camera.position.x-scene.children[6].children[2].position.x)<4 && (camera.position.x-scene.children[6].children[2].position.x)>-4 && (camera.position.z-scene.children[6].children[2].position.z)<4 &&(camera.position.z-scene.children[6].children[2].position.z)>-4){   
					// console.log('proche')
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
				// console.log('loin')
				sphere4.material.color.set('#0000ff')
			
				test = 2
				}
		
				const deltaTime = Math.min( 0.1, clock.getDelta() );

				controls( deltaTime );

				updatePlayer( deltaTime );

				// updateSpheres( deltaTime );

				//Calcule animation de la chaise
				if( mixer !== null)
				{
					mixer.update(deltaTime)
				}

				
				//selection anim glow
				renderer.clearDepth();
				camera.layers.set(0);
				renderer.render( scene, camera );


				//selection anim glow
				renderer.clear();
				camera.layers.set(1);
				effectComposer.render()

				

				stats.update();


				requestAnimationFrame( animate );
				

			}

