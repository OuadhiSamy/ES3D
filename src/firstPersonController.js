import * as THREE from 'three'

const objects = [];

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

function pointLock(controls,time, prevTime, velocity, direction, moveBackward,moveForward, moveLeft,moveRight, canJump){
    
    const raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 )

    raycaster.ray.origin.copy( controls.getObject().position );
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects( objects );

    const onObject = intersections.length > 0;

    const delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 5.0 * delta;
    velocity.z -= velocity.z * 5.0 * delta;

    velocity.y -= 9.8 * 75.0 * delta; // 100.0 = mass

    direction.z = Number( moveForward ) - Number( moveBackward );
    direction.x = Number( moveRight ) - Number( moveLeft );
    direction.normalize(); // this ensures consistent movements in all directions

    if ( moveForward || moveBackward ) velocity.z -= direction.z * 175.0 * delta;
    if ( moveLeft || moveRight ) velocity.x -= direction.x * 175.0 * delta;

    if ( onObject === true ) {

        velocity.y = Math.max( 0, velocity.y );
        canJump = true;

    }

    controls.moveRight( - velocity.x * delta );
    controls.moveForward( - velocity.z * delta );

    controls.getObject().position.y += ( velocity.y * delta ); // new behavior

    if ( controls.getObject().position.y < 15 ) {

        velocity.y = 0;
        controls.getObject().position.y = 15;

        canJump = true;

    }
}

export {pointLock}