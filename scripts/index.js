var camera,mapCamera, scene, sceneMap, mapScene, wallScene, sceneRotation ,renderer, mapRenderer;
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
var update_last_position;

function fillOctree(scene) {
    scene.traverse(function(obj) { 
      //if (obj instanceof THREE.Mesh && (obj.geometry.type!=="PlaneGeometry")) {
      //if (obj instanceof THREE.Mesh && (obj.geometry.type!=="PlaneGeometry")) {
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
      new THREE.Vector3(-0.27, 1, 0.27), //backward_left
      new THREE.Vector3(0, -1, 0), //bottom

      new THREE.Vector3(0, -1, 0.75), //bottom backward
      new THREE.Vector3(0.75, -1, 0), //bottom right
      new THREE.Vector3(0, -1, -0.75), //bottom forward
      //new THREE.Vector3(0, 0, -1), //bottom forward
      new THREE.Vector3(-0.75, -1, 0), //bottom left

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
  //sceneMap.add( token );
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

function updateMapScene(value) {

  if(value === "Walls") {
    if(wallScene.children.length === 0) {
      wallScene = new THREE.Scene();
      wallScene.add(new THREE.Object3D());
      wallScene.children[0].rotation.copy(sceneRotation);
      scene.traverse(function(obj) {
        if(obj instanceof THREE.Mesh && obj.name.indexOf("wall") > -1) {
          wallScene.children[0].add(obj.clone());
        }
      });
    }
    mapScene = wallScene;
  } 
  else {
    mapScene = scene;
  }
    
  mapScene.add(token);
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

      /*var on_parse_text = function (object) {
        scene.add(object);
        generate_envmap(object);
        createOctree(object);
        fillOctree(object);
      }; */

      var on_parse_text = function (object) {
        if(object.children.length === 1) {
          sceneRotation = object.children[0].rotation.clone();
        }
        else {
          sceneRotation = new THREE.Euler();
        }
        scene.add(object);
        generate_envmap(object);
        createOctree(object);
        fillOctree(object);
        mapScene = scene;
        wallScene = new THREE.Scene();
      };

      var input = document.createElement( 'input' );
      input.type = 'file';
      input.addEventListener('change', on_change_file);
      input.click();
    };


    this.importMap = function() {

      var on_change_file = function ( event ) {
        console.log('changeeee');
        var file = event.target.files[0];
        var reader = new FileReader();
        reader.addEventListener('load', on_read_file);
        reader.readAsText(file);
      };

      var on_read_file = function (event) {
        console.log('readddd');
        try {
          text = event.target.result;
          json = JSON.parse(text);
          wallsFromJSON(json);
        } catch (error) {
            alert(error+': error with json')
        }
      };

      console.log('CIAOOOO');

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
        document.getElementById('mapCanvas').style.visibility = 'visible';
    
      } else {
        token.visible = false;
        trackballControls = new THREE.TrackballControls(camera2);
        document.getElementById('blocker').style.display = 'none';
        document.getElementById('mapCanvas').style.visibility = 'hidden';
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

/*
    this.importMap = function () {



    }*/

    this.remove = function () {

      for( var i = scene.children.length - 1; i >= 0; i--)
        if(scene.children[i] instanceof THREE.Scene)
          scene.remove(scene.children[i])

      mapScene = new THREE.Scene();
      wallScene = new THREE.Scene();
    }

    this.minimap = "All";

  }

  var gui = new dat.GUI();
  
  gui.add(GUIcontrols, 'scene').name('Import JSON');
  gui.add(GUIcontrols, 'importMap').name('Import JSON 2D MAP');
  gui.add(GUIcontrols, 'remove').name('Remove Scene');
  gui.add(GUIcontrols, 'switchCamera').name('Switch Camera');
  gui.add(GUIcontrols, 'fps').name('Show/Hide FPS');
  var folder_minimap = gui.addFolder('minimap');
  var minimap = folder_minimap.add( GUIcontrols, 'minimap', ["All", "Walls"] ).name('show').listen();
  minimap.onChange( function(value) {
    updateMapScene(value);
  });

  addStats();

}

var mx;
var mz;

function init() {

  scene = new THREE.Scene();
  sceneMap = new THREE.Scene();

  clock = new THREE.Clock();

  //Navigator in prima persona
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  controls = new THREE.PointerLockControls(camera);
  update_last_position = false;
  scene.add(controls.getObject());
  //sceneMap.add(controls.getObject());


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
  document.getElementById('mapCanvas').style.height = mapRenderer.domElement.height+'px';
  document.getElementById('mapCanvas').style.width = mapRenderer.domElement.width+'px';

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



 function wallsFromJSON (json){
    //var editor = this;

    if(! 'walls' in json){
      return;
    }
    var walls =json.walls;

    console.log(walls);

    walls.forEach(function (wall) {

      var wallArray = wall.path;

      var holes=[];
      var holesJson = wall.holes;

      holesJson.forEach(function (coordinates){
        holes.push(coordinates.path);
      });
      var tickness = wall.tickness;

      var shape = createShapeWall (wallArray , tickness, holes , [0,0], [1,1]);
      shape.position.x += wall.position[0];
      shape.position.y += wall.position[1];
      shape.position.z += wall.position[2];
      shape.rotation.y = wall.rotation;
      //editor.add_object(shape);
      sceneMap.add(shape);
      //scene.add(shape);

    });
  }

  function createShapeWall (wallCoord, tickness, holes, holepos, holesca){

      console.log('evviva');
      var rectShape = new THREE.Shape();
      //var editor =this;
      
      var coordinates = pushCoordinates(rectShape, wallCoord);

      //createHole(rectShape, holes, holepos, holesca);

      maxX= Math.max.apply(null, coordinates.x);
      //maxY= Math.max.apply(null, coordinates.y);

      /*
      var geometry = new THREE.ShapeGeometry( rectShape );
      var geometryExtr = new THREE.ExtrudeGeometry( rectShape ,{ amount: tickness, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 });
  
      //editor.assignUVs(geometry);

      var plane1 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({side : THREE.BackSide}));
      plane1.position.z = - 1.65;
      plane1.noNeedsHelper=true;

      var plane2 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial());
      plane2.position.z = tickness + 1.65;
      plane2.noNeedsHelper=true;
      */

      var geometryPlane = new THREE.PlaneGeometry( maxX, tickness, 32 );

      //var wall = new THREE.Mesh(geometryExtr, new THREE.MeshPhongMaterial());
      var wall = new THREE.Mesh(geometryPlane, new THREE.MeshPhongMaterial());
      wall.position.z = + tickness/2;
      wall.position.x = + maxX/2;
      wall.rotation.x = - Math.PI / 2;

      //var obj = new THREE.Group;

      //wall.add( plane1 );
      //wall.add( plane2 );

      return wall;
   
  }

/*
  function createHole (rectShape, holes, holepos, holesca){
      holes.forEach(function(hole){
        var holeShape = new THREE.Path();
        holeShape.moveTo( (hole[0][0]  * holesca[0]) + holepos[0], (hole[0][1] * holesca[1]) + holepos[1] );

        hole.forEach(function(point){
          if(hole.indexOf(point)!==0){
            holeShape.lineTo( (point[0] * holesca[0]) + holepos[0], (point[1] * holesca[1]) + holepos[1]);
          }
        });

        rectShape.holes.push(holeShape);
      });
  }*/


/*
  function createWall (rectShape, wallCoord){

    var xCoords = [];
    var yCoords = [];

    rectShape.moveTo(wallCoord[0][0], wallCoord[0][1]);
    xCoords.push(wallCoord[0][0]);
    yCoords.push(wallCoord[0][1]);

    wallCoord.forEach(function(point){
      if(wallCoord.indexOf(point)!==0){
        rectShape.lineTo(point[0],point[1]);
        xCoords.push(point[0]);
        yCoords.push(point[1]);
      }
    });

    return {x: xCoords, y: yCoords};
  }*/


function pushCoordinates (rectShape, wallCoord){
    var xCoords = [];
    var yCoords = [];

    wallCoord.forEach(function(point){
        xCoords.push(point[0]);
        yCoords.push(point[1]);
    });

    return {x: xCoords, y: yCoords};
}


function animate () {
  requestAnimationFrame(animate);

  stats.update();

  if(fp) {
    controls.update();
    if(update_last_position) {
      controls.getObject().position.copy(last_position);
      update_last_position = false;
    }
    token.position.x = controls.getObject().position.x;
    token.position.y = controls.getObject().position.y;
    token.position.z = controls.getObject().position.z;
    token.rotation.y = controls.getObject().rotation.y;
    mapCamera.position.x = token.position.x;
    mapCamera.position.y = token.position.y;
    mapCamera.position.z = token.position.z;
    token.visible = false;
    renderer.render(scene, camera);
    token.visible = true; 
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
  } else {
    renderer.render(scene, camera2);
    trackballControls.update();
  }
}




init();