var objectsList = [];

function fillOctree(scene) {
    scene.traverse(function(obj) {
      if (obj instanceof THREE.Mesh) {
        octree.add(obj);
        objectsList.push(obj);
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
