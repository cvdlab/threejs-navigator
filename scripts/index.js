var camera, scene, renderer;
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
        //bbox = new THREE.Box3().setFromObject(obj);
        //obj.geometry.boundingBox=bbox;
        var bbox = new THREE.BoundingBoxHelper( obj, 'red' );
        //bbox.position.copy( obj.matrixWorld.getPosition() );
        bbox.update();
        /*
        console.log(obj.parent.position.x);
        console.log(obj.parent.position.y);
        console.log(obj.parent.position.z);
        */
        bbox.position.x=obj.parent.position.x;
        bbox.position.y=obj.parent.position.y;
        bbox.position.z=obj.parent.position.z;
       // bbox.position.copy( obj.parent.position )
        //scene.add( bbox );
        //console.log(obj);
        //console.log(bbox);
       // gbox= new THREE.BoxGeometry(bbox.max.x-bbox.min.x,bbox.max.y-bbox.min.y,bbox.max.z-bbox.min.z);
       // mbox= new THREE.MeshBasicMaterial({color:'red'});
       // box=new THREE.Mesh(gbox,mbox);
        //box.visible=false;

       // box.position.copy( obj.matrixWorld.getPosition() );
        //box.position.copy(obj.position);
       // scene.add(box);
        //obj.add(box);
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
/*
function createRaysDirectionAndCaster() {

  rays = [
      new THREE.Vector3(0, 1, 0.35),//backward
      new THREE.Vector3(0.35, 1, 0.35),//backward_right
      new THREE.Vector3(0.35, 1, 0),//right 
      new THREE.Vector3(0.35, 1, -0.35), //forward_right
      new THREE.Vector3(0, 1, -0.35), //forward
      new THREE.Vector3(-0.35, 1, -0.35),//forward left
      new THREE.Vector3(-0.35, 1, 0),//left
      new THREE.Vector3(-0.35, 1, 0.35) //backward_left
     // new THREE.Vector3(0, 1, -1) //forward stairs
    ];

  caster = new THREE.Raycaster();

}*/


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
        //generateBoundingBox();
        createOctree(object);
        fillOctree(object);
      };

      var input = document.createElement( 'input' );
      input.type = 'file';
      input.addEventListener('change', on_change_file);
      input.click();
    };

    this.switchCamera = function () {
      if(!fp) {  
        trackballControls.reset();
        document.body.requestPointerLock();
        octree.update(); //in caso tornassimo in visuale dall'alto, possiamo importare una nuova scena, e quindi ci serve rifare update dell'octree
      } else {
        trackballControls = new THREE.TrackballControls(camera2);
        document.getElementById('blocker').style.display = 'none';
      }
      fp = !fp;  
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

  //Navigator in prima persona
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  controls = new THREE.PointerLockControls(camera);
  scene.add(controls.getObject());


  var gx = new THREE.MeshBasicMaterial({color: 0xff0000});
  var gz = new THREE.MeshBasicMaterial({color: 0x0000ff});

  var cubo = new THREE.BoxGeometry(10,10,10);

  mx = new THREE.Mesh(cubo,gx);
  mz = new THREE.Mesh(cubo,gz);

  //controls.getObject().add(mx);
  //controls.getObject().add(mz);

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
  document.body.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize, false);

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
    renderer.render(scene, camera);
  } else {
    renderer.render(scene, camera2);
    trackballControls.update();
  }
}

init();