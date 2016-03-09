var camera,mapCamera, scene, sceneMap, mapScene, wallScene, sceneRotation ,renderer, mapRenderer;
var geometry, material, mesh;
var light;
var pointerlockcontrols;
var trackballControls;
var deviceorientationcontrols;
var stats;
var fp;
var fps;
var fpcube;
var octree;
var cubeCamera;
var mesh;
var rays;
var caster;
var clock;
var update_last_position;
var effect;
var enable_vr = false;
var renderer_vr;
var gui;
var camera_vr;
var showMap = false;

function generate_envmap(object) {
  var camere = []
  object.traverse(function(obj) {
    if(obj instanceof THREE.CubeCamera) {
      camere.push(obj);
    }
  });
    
  object.updateMatrixWorld(true);
  camere.forEach(function (camera) {

    var parent = camera.parent;
    camera.position.getPositionFromMatrix ( parent.matrixWorld );
    camera.renderTarget.mapping = camera.mapping;
    object.add(camera);
    parent.material.envMap = camera.renderTarget;

  });

  camere.forEach(function (camera) {
    camera.updateCubeMap(renderer,scene);
  });
}

function copy(mesh) {
    var geometry=mesh.geometry.clone();
    var material=mesh.material.clone();
    var copy = new THREE.Mesh( geometry, material );
    
    copy.scale.x=mesh.scale.x;
    copy.scale.y=mesh.scale.y;
    copy.scale.z=mesh.scale.z;

    return copy;
} 

function setOrientationControls(e) {
    if (!e.alpha) {
      return;
    }

    /* la camera del deviceorientationcontrol prender la position dell'object del pointerlock,
    *  in questo modo se quest'ultimo si ferma a causa di collisioni, anche il device control di ferma
    */
    //scene.add(deviceorientationcontrols.object); waa
    deviceorientationcontrols.object.position.copy(pointerlockcontrols.getObject().position);

    /* il pointer lock deve prendere la rotazione dal device, e non il movimento del mouse
    */
    pointerlockcontrols.getObject().rotation.y = deviceorientationcontrols.object.rotation.y;
    
    deviceorientationcontrols.connect();
    deviceorientationcontrols.update();

    renderer.domElement.addEventListener('click', fullscreen, false);

    window.removeEventListener('deviceorientation', setOrientationControls, true);
}

function fullscreen() {
  var container = document.getElementById('container');

  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if (container.msRequestFullscreen) {
    container.msRequestFullscreen();
  } else if (container.mozRequestFullScreen) {
    container.mozRequestFullScreen();
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
  }
}

var mx;
var mz;

function init() {

  scene = new THREE.Scene();
  sceneMap = new THREE.Scene();

  clock = new THREE.Clock();

  /* creazione controlli con le rispettive camere */

  //Navigator in prima persona
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  //camera per device controls
  camera_vr = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 1, 2000);
  //Navigator dall'alto
  camera2 = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 100000 );
  camera2.position.set( 500, 250, 500 );
  camera2.lookAt( new THREE.Vector3() );
  
  trackballControls = new THREE.TrackballControls(camera2);
  pointerlockcontrols = new THREE.PointerLockControls(camera);
  deviceorientationcontrols = new THREE.DeviceOrientationControls(camera_vr, true);

  
  update_last_position = false;
  scene.add(pointerlockcontrols.getObject());
  scene.add(deviceorientationcontrols.object);
  scene.add(camera2);
  //sceneMap.add(pointerlockcontrols.getObject());

  //map camera
  mapCamera = new THREE.OrthographicCamera(
      window.innerWidth / -2,   // Left
      window.innerWidth / 2,    // Right
      window.innerHeight / 2,   // Top
      window.innerHeight / -2,  // Bottom
      -500,                  // Near 
      1000 );                // Far 
  mapCamera.position.set(0,500,0);
  mapCamera.lookAt( new THREE.Vector3(0,0,0) );
    
  var gx = new THREE.MeshBasicMaterial({color: 0xff0000});
  var gz = new THREE.MeshBasicMaterial({color: 0x0000ff});

  var cubo = new THREE.BoxGeometry(10,10,10);

  mx = new THREE.Mesh(cubo,gx);
  mz = new THREE.Mesh(cubo,gz);

  mx.position.x += -100;
  mz.position.z += -100;

  mz.position.x += 30;

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xffffff);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
  
  window.addEventListener('resize', onWindowResize, false);

  //Effect per il VR
  renderer_vr = new THREE.WebGLRenderer();
  renderer_vr.setClearColor(0xffffff);
  renderer_vr.setSize(window.innerWidth, window.innerHeight);
  effect = new THREE.StereoEffect(renderer_vr); 
  effect.setSize(window.innerWidth, window.innerHeight); 
 

  mapRenderer = new THREE.WebGLRenderer( {antialias:true} );
  mapRenderer.setClearColor(0xffffff);
  mapRenderer.autoClear = false;
  mapRenderer.autoUpdateScene = false;  
  //mapRenderer.setSize(240, 160);
  mapRenderer.setPixelRatio(document.getElementById('mapCanvas').devicePixelRatio);
  document.getElementById('mapCanvas').appendChild(mapRenderer.domElement);
  document.getElementById('mapCanvas').style.height = mapRenderer.domElement.height+'px';
  document.getElementById('mapCanvas').style.width = mapRenderer.domElement.width+'px';

  create_navigation_token();

  fp = false;
  fps = false;
  
  setGUI();
  createRaysDirectionAndCaster(); 

  animate();
}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera2.aspect = window.innerWidth / window.innerHeight;
  camera_vr.aspect = window.innerWidth / window.innerHeight;
  
  camera.updateProjectionMatrix();
  camera2.updateProjectionMatrix();
  camera_vr.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer_vr.setSize(window.innerWidth, window.innerHeight);
  mapRenderer.setSize(window.innerWidth, window.innerHeight);
}

function animate () {
  requestAnimationFrame(animate);

  stats.update();

  if(fp) {
    pointerlockcontrols.update();
    if(update_last_position) {
      pointerlockcontrols.getObject().position.copy(last_position);
      update_last_position = false;
    }
    token.position.x = pointerlockcontrols.getObject().position.x;
    token.position.y = pointerlockcontrols.getObject().position.y;
    token.position.z = pointerlockcontrols.getObject().position.z;
    token.rotation.y = pointerlockcontrols.getObject().rotation.y;
    mapCamera.position.x = token.position.x;
    mapCamera.position.y = token.position.y;
    mapCamera.position.z = token.position.z;
    var objectsDistance = 5;
    if (octree) {
      var visibleList = octree.search(token.position, objectsDistance, true).map(function (x) {
        return x.object;
      });
      objectsList.forEach(function (object) {
        object.visible = (visibleList.indexOf(object) >= 0);
      });
    }
    token.visible = false;
    renderer.render(scene, camera);
    token.visible = true;
    if (showMap) { 
      if (sceneMap.children.length>1) {
        //sceneMap.add( token );
        scene.remove( token );
        sceneMap.add( token );
        mapRenderer.clear();
        mapRenderer.render(sceneMap, mapCamera);
      }
      else{
        mapRenderer.clear();
        mapRenderer.render(mapScene, mapCamera);      
      }
    }
  } else {
    if(enable_vr) {
      pointerlockcontrols.update();
      if(deviceorientationcontrols) {
        /* la camera del deviceorientationcontrol prender la position dell'object del pointerlock,
        *  in questo modo se quest'ultimo si ferma a causa di collisioni, anche il device control di ferma
        */
        deviceorientationcontrols.object.position.copy(pointerlockcontrols.getObject().position);
        /* il pointer lock deve prendere la rotazione dal device, e non il movimento del mouse
        */
        pointerlockcontrols.getObject().rotation.y = deviceorientationcontrols.object.rotation.y;     

        deviceorientationcontrols.update();
      }
      effect.render(scene, camera_vr);
    } else {
      trackballControls.update();
      renderer.render(scene, camera2);
    }
  }
}




init();
