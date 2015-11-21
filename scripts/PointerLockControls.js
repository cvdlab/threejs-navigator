/**
 * @author mrdoob / http://mrdoob.com/
 */
THREE.PointerLockControls = function ( camera ) {

  var scope = this;

  camera.rotation.set( 0, 0, 0 );

  var pitchObject = new THREE.Object3D();
  pitchObject.add( camera );

  var yawObject = new THREE.Object3D();
  yawObject.position.y = 100;
  yawObject.add( pitchObject );

  var moveForward = false;
  var pressForward = false;
  var canMoveForward = true;
  var moveBackward = false;
  var pressBackward = false;
  var canMoveBackward = true;
  var moveLeft = false;
  var pressLeft=false;
  var canMoveLeft = true;
  var moveRight = false;
  var pressRight =false;
  var canMoveRight = true;

  //var canMoveForwardStairs=true;

  var isOnObject = false;
  var canJump = false;

  var prevTime = performance.now();

  var velocity = new THREE.Vector3();

  var PI_2 = Math.PI / 2;

  var onMouseMove = function ( event ) {

    if ( scope.enabled === false ) return;

    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    yawObject.rotation.y -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;

    pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

  };
/*
  var onKeyDown = function ( event ) {

    switch ( event.keyCode ) {

      case 38: // up
      case 87: // w
        moveForward = true && canMoveForward;
        break;

      case 37: // left
      case 65: // a
        moveLeft = true && canMoveLeft; break;

      case 40: // down
      case 83: // s
        moveBackward = true && canMoveBackward;
        break;

      case 39: // right
      case 68: // d
        moveRight = true && canMoveRight;
        break;

      case 32: // space
        if ( canJump === true ) velocity.y += 350;
        canJump = false;
        break;

    }

  };
*/
  var onKeyDown = function ( event ) {

    switch ( event.keyCode ) {

      case 38: // up
      case 87: // w
        pressForward = true;
        break;

      case 37: // left
      case 65: // a
        pressLeft = true; 
        break;

      case 40: // down
      case 83: // s
        pressBackward = true;
        break;

      case 39: // right
      case 68: // d
        pressRight = true;
        break;

      case 32: // space
        if ( canJump === true ) velocity.y += 350;
        canJump = false;
        break;

    }

  };

/*
  var onKeyUp = function ( event ) {

    switch( event.keyCode ) {

      case 38: // up
      case 87: // w
        moveForward = false;
        break;

      case 37: // left
      case 65: // a
        moveLeft = false;
        break;

      case 40: // down
      case 83: // s
        moveBackward = false;
        break;

      case 39: // right
      case 68: // d
        moveRight = false;
        break;

    }

  };
*/
  var onKeyUp = function ( event ) {

    switch( event.keyCode ) {

      case 38: // up
      case 87: // w
        pressForward = false;
        break;

      case 37: // left
      case 65: // a
        pressLeft = false;
        break;

      case 40: // down
      case 83: // s
        pressBackward = false;
        break;

      case 39: // right
      case 68: // d
        pressRight = false;
        break;

    }

  };

  document.addEventListener( 'mousemove', onMouseMove, false );
  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false );

  this.enabled = false;

  this.getObject = function () {

    return yawObject;

  };

  this.isOnObject = function ( boolean ) {

    isOnObject = boolean;
    canJump = boolean;

  };

  this.canMoveRight = function (boolean){
    canMoveRight=boolean;

  };

  this.canMoveLeft = function (boolean){
    canMoveLeft=boolean;

  };

  this.canMoveBackward = function (boolean){
    canMoveBackward=boolean;

  };

  this.canMoveForward = function (boolean){
    canMoveForward=boolean;

  };
/*
  this.canMoveForwardStairs = function (boolean){
    canMoveForwardStairs=boolean;
  };*/

 this.canMove =function(){

    this.checkObstacles();
    
    moveForward=pressForward && canMoveForward;
    moveLeft=pressLeft && canMoveLeft;
    moveRight=pressRight && canMoveRight;
    moveBackward=pressBackward && canMoveBackward;
  };

this.checkObstacles = function() {
  var collisions,i,octreeResults,vec,move;
  var distance = 86;

  controls.canMoveBackward(true);
  controls.canMoveRight(true);
  controls.canMoveForward(true);
  controls.canMoveLeft(true);
 // controls.canMoveForwardStairs(true);

  for (i = 0; i < rays.length; i += 1) {
    vec = new THREE.Vector3();
    vec.x = controls.getObject().position.x;
    vec.y = controls.getObject().position.y * 0.15;
    vec.z = controls.getObject().position.z;
    caster.set(vec, controls.getDirection(rays[i]));
    octreeResults = octree.search(caster.ray.origin,caster.ray.far,true,caster.ray.direction);//caster.ray.direction.applyEuler(rotation)); 
    collisions = caster.intersectOctreeObjects(octreeResults);
    if (collisions.length > 0 && collisions[0].distance <= distance) {
      switch ( i ) {
        case 0: // backward
          controls.canMoveBackward(false);
          break;
        case 1: // backward right
          //controls.canMoveBackward(false);
          controls.canMoveRight(false);         
          break;
        case 2: // right
          controls.canMoveRight(false);
          break;
        case 3: // forward right
          //controls.canMoveForward(false);
          controls.canMoveRight(false);
          break;
        case 4: // forward
          controls.canMoveForward(false);
          break;
        case 5: // forward left
          //controls.canMoveForward(false);
          controls.canMoveLeft(false);
          break;
        case 6: // left
          controls.canMoveLeft(false);
          break;
        case 7: // backward left
          //controls.canMoveBackward(false);
          controls.canMoveLeft(false);
          break;
  /*      case 8: // forward stairs
          controls.canMoveForward(false);
          controls.canMoveForwardStairs(false);
          break;*/
      }
    }
  }
};


  this.getDirection = function() {

    var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

    return function(direction) {

      var v = new THREE.Vector3();

      rotation.set(0, yawObject.rotation.y, 0 );

      v.copy( direction ).applyEuler( rotation );

      return v;

    }

  }();

  this.update = function () {
    controls.canMove();

    if ( scope.enabled === false ) return;

    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    if ( moveForward ) velocity.z -= 1000.0 * delta;
    if ( moveBackward ) velocity.z += 1000.0 * delta;

    if ( moveLeft ) velocity.x -= 1000.0 * delta;
    if ( moveRight ) velocity.x += 1000.0 * delta;

    if ( isOnObject === true ) {

      velocity.y = Math.max( 0, velocity.y );

    }

    yawObject.translateX( velocity.x * delta );
    yawObject.translateY( velocity.y * delta ); 
    yawObject.translateZ( velocity.z * delta );

    if ( yawObject.position.y < 100 ) {

      velocity.y = 0;
      yawObject.position.y = 100;

      canJump = true;

    }

    prevTime = time;

  };

};