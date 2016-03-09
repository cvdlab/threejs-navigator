function create_navigation_token() {

  var tokenMat = new THREE.MeshBasicMaterial({color: 0x82CAFF}); //0x82CAFF //0x50EBEC
  var tokenGeo = new THREE.CylinderGeometry(31, 31, 45, 50, 50);
  token = new THREE.Mesh( tokenGeo, tokenMat );
  token.position.set(mapCamera.position.x, 25, mapCamera.position.z);
  token.position.y = pointerlockcontrols.getObject().position.y;
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