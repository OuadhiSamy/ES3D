// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { FBXLoader  } from 'three/examples/jsm/loaders/FBXLoader.js'

// export default class loaderManager {

//     constructor(scene, ) {

//     }
    
//     loadModels() {
//         console.log('Load Models calls')
//         const loader = new FBXLoader();
//         loader.setPath('./test/zombie/');
//         loader.load('mremireh_o_desbiens.fbx', (fbx) => {
//           fbx.scale.setScalar(0.1);
//           fbx.traverse(c => {
//             c.castShadow = true;
//           });
    
//           this._target = fbx;
//           this._params.scene.add(this._target);
    
//           this._mixer = new THREE.AnimationMixer(this._target);
    
//           this._manager = new THREE.LoadingManager();
//           this._manager.onLoad = () => {
//             this._stateMachine.SetState('idle');
//           };
    
//           const _OnLoad = (animName, anim) => {
//             const clip = anim.animations[0];
//             const action = this._mixer.clipAction(clip);
      
//             this._animations[animName] = {
//               clip: clip,
//               action: action,
//             };
//           };
    
//           const loader = new FBXLoader(this._manager);
//           loader.setPath('./test/zombie/');
//           loader.load('walk.fbx', (a) => { _OnLoad('walk', a); });
//           loader.load('run.fbx', (a) => { _OnLoad('run', a); });
//           loader.load('idle.fbx', (a) => { _OnLoad('idle', a); });
//           loader.load('dance.fbx', (a) => { _OnLoad('dance', a); });
//         });
//       }
// }