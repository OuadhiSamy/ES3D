import './style.css'
import * as THREE from 'three'
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'
import gsap from 'gsap'
import './firstperson.js'

const firstperson = true;
const orbitcontrol = false;

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
