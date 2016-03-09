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


function pushCoordinates (rectShape, wallCoord){
    var xCoords = [];
    var yCoords = [];

    wallCoord.forEach(function(point){
        xCoords.push(point[0]);
        yCoords.push(point[1]);
    });

    return {x: xCoords, y: yCoords};
}