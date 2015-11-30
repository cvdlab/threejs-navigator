var camera,mapCamera, scene, renderer, mapRenderer;
var geometry, material, mesh;
var light;
var controls;
var trackballControls;
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

function fillOctree(scene) {
    scene.traverse(function(obj) { 
      if (obj instanceof THREE.Mesh) {
        octree.add(obj);
      }
    });
}


function generateBoundingBox() {
  var bbox,gbox,mbox,box;
    scene.traverse(function(obj) { 
      if (obj instanceof THREE.Mesh) {
        var bbox = new THREE.BoundingBoxHelper( obj, 'red' );
        bbox.update();
        bbox.position.x=obj.parent.position.x;
        bbox.position.y=obj.parent.position.y;
        bbox.position.z=obj.parent.position.z;
      }
    });      
}

function createOctree(scene) {

  octree = new THREE.Octree({
    radius: 1, // optional, default = 1, octree will grow and shrink as needed
    undeferred: false, // optional, default = false, octree will defer insertion until you call octree.update();
    depthMax: Infinity, // optional, default = Infinity, infinite depth
    objectsThreshold: 1, // optional, default = 8 //se sono nel cubo A, e in questo cubo c'è un numero di oggetti maggiore di questa soglia, allora partiziona il cubo.
    overlapPct: 0.15, // optional, default = 0.15 (15%), this helps sort objects that overlap nodes
    //scene: scene // optional, pass scene as parameter only if you wish to visualize octree
  }); 

}


function createRaysDirectionAndCaster() {

  rays = [
      new THREE.Vector3(0, 1, 0.55),//backward
      new THREE.Vector3(0.27, 1, 0.27),//backward_right
      new THREE.Vector3(0.55, 1, 0),//right 
      new THREE.Vector3(0.27, 1, -0.27), //forward_right
      new THREE.Vector3(0, 1, -0.55), //forward
      new THREE.Vector3(-0.27, 1, -0.27),//forward left
      new THREE.Vector3(-0.55, 1, 0),//left
      new THREE.Vector3(-0.27, 1, 0.27) //backward_left
     // new THREE.Vector3(0, 1, -1) //forward stairs
    ];

  caster = new THREE.Raycaster();

}


function addStats() {

  stats = new Stats();
  stats.setMode( 0 );
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  stats.domElement.style.zIndex = 100;
  document.getElementById('container').appendChild( stats.domElement );
  stats.domElement.children[ 0 ].children[ 0 ].style.color = "#3366FF";
  stats.domElement.children[ 0 ].style.background = "transparent";
  stats.domElement.children[ 0 ].children[ 1 ].style.display = "none";

}

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

function create_navigation_token() {

  var tokenMat = new THREE.MeshBasicMaterial({color: 0x82CAFF}); //0x82CAFF //0x50EBEC
  var tokenGeo = new THREE.CylinderGeometry(31, 31, 45, 50, 50);
  token = new THREE.Mesh( tokenGeo, tokenMat );
  token.position.set(mapCamera.position.x, 25, mapCamera.position.z);
  token.position.y = controls.getObject().position.y;
  token.visible = false;
  scene.add( token );

  var token_border = copy(token);
  token_border.material.color.setHex('0x000000');
  token_border.scale.x = 1.15;
  token_border.scale.z = 1.15;
  token_border.scale.y = 0.8;
  token_border.position.y -= 18;
  token.add(token_border);

  //var token_eyes_mat = new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity: 0.5});   
  var token_eyes_geo = new THREE.CylinderGeometry(25, 0, 40, 50, 50);
  var token_eyes = new THREE.Mesh(token_eyes_geo, tokenMat);
  token_eyes.position.z = -40;
  token_eyes.rotation.x = 1.57;
  token.add(token_eyes);

  var token_border_eyes = copy(token_eyes);
  token_border_eyes.material.color.setHex('0x000000');
  token_border_eyes.scale.x = 1.4;
  token_border_eyes.scale.z = 0.1;
  token_border_eyes.scale.y = 1.4;
  token_eyes.add(token_border_eyes);

}

function setGUI() {

  var GUIcontrols = new function () {
  
    this.scene = function() {

      var on_change_file = function ( event ) {
        var file = event.target.files[0];
        var reader = new FileReader();
        reader.addEventListener('load', on_read_file);
        reader.readAsText(file);
      };

      var on_read_file = function (event) {
        var text = event.target.result;
        var json = JSON.parse(text);
        var loader = new THREE.ObjectLoader();
        loader.parse(json, on_parse_text);
      };

      var on_parse_text = function (object) {
        scene.add(object);
        generate_envmap(object);
        createOctree(object);
        fillOctree(object);
      };

      var input = document.createElement( 'input' );
      input.type = 'file';
      input.addEventListener('change', on_change_file);
      input.click();
    };

    this.switchCamera = function () {
      var not_empty = scene.children.filter(function(item) {return item instanceof THREE.Scene}).length !== 0;
      if(!fp && not_empty) {  
        token.visible = true;
        trackballControls.reset();
        document.body.requestPointerLock();
        octree.update(); //in caso tornassimo in visuale dall'alto, possiamo importare una nuova scena, e quindi ci serve rifare update dell'octree
        fp = true;
      } else {
        token.visible = false;
        trackballControls = new THREE.TrackballControls(camera2);
        document.getElementById('blocker').style.display = 'none';
        fp = false;
      }
      //fp = !fp;  
    }

    this.fps = function () {
      if(fps)
        document.getElementById('container').removeChild( stats.domElement );
      else
        document.getElementById('container').appendChild( stats.domElement );
      fps = !fps;
    }

    this.remove = function () {

      for( var i = scene.children.length - 1; i >= 0; i--)
        if(scene.children[i] instanceof THREE.Scene)
          scene.remove(scene.children[i])

    }
  }

  var gui = new dat.GUI();
  
  gui.add(GUIcontrols, 'scene').name('Import JSON');
  gui.add(GUIcontrols, 'remove').name('Remove Scene');
  gui.add(GUIcontrols, 'switchCamera').name('Switch Camera');
  gui.add(GUIcontrols, 'fps').name('Show/Hide FPS');
  
  addStats();

}

var mx;
var mz;

function init() {

  scene = new THREE.Scene();
  clock = new THREE.Clock();

  //Navigator in prima persona
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  controls = new THREE.PointerLockControls(camera);
  scene.add(controls.getObject());


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

  //Navigator dall'alto
  camera2 = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 100000 );
  camera2.position.set( 500, 250, 500 );
  camera2.lookAt( new THREE.Vector3() );
  trackballControls = new THREE.TrackballControls(camera2);
  
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xffffff);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize, false);

  mapRenderer = new THREE.WebGLRenderer( {antialias:true} );
  mapRenderer.setClearColor(0xdddddd);
  mapRenderer.autoClear = false;
  mapRenderer.autoUpdateScene = false;  
  //mapRenderer.setSize(240, 160);
  mapRenderer.setPixelRatio(document.getElementById('mapCanvas').devicePixelRatio);
  document.getElementById('mapCanvas').appendChild(mapRenderer.domElement);

  create_navigation_token();

  fp = false;
  fps = true;
  
  setGUI();
  createRaysDirectionAndCaster(); 

  animate();
}

function createScene () {
  light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  geometry = new THREE.PlaneGeometry(500, 500, 50, 50);
  material = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });
  mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  scene.add(mesh);
}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate () {
  requestAnimationFrame(animate);

  stats.update();

  if(fp) {
    controls.update();
    token.position.x = controls.getObject().position.x;
    token.position.z = controls.getObject().position.z;
    token.rotation.y = controls.getObject().rotation.y;
    mapCamera.position.x = token.position.x;
    mapCamera.position.z = token.position.z;
    token.visible = false;
    renderer.render(scene, camera);
    token.visible = true; 
    document.getElementById('mapCanvas').style.visibility = 'visible';
  } else {
    renderer.render(scene, camera2);
    trackballControls.update();
    document.getElementById('mapCanvas').style.visibility = 'hidden';
  }

  mapRenderer.clear();
  mapRenderer.render(scene, mapCamera);
}

init();