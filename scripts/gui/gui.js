function addStats() {

  stats = new Stats();
  stats.setMode( 0 );
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  stats.domElement.style.zIndex = 100;
  //document.getElementById('container').appendChild( stats.domElement );
  stats.domElement.children[ 0 ].children[ 0 ].style.color = "#3366FF";
  stats.domElement.children[ 0 ].style.background = "transparent";
  stats.domElement.children[ 0 ].children[ 1 ].style.display = "none";

}

function setGUI() {

  var GUIcontrols = new function () {
  
    this.scene = function() {

      var on_change_file = function ( event ) {
        //event.stopPropagation();
        var file = event.target.files[0];
        var reader = new FileReader();
        reader.addEventListener('load', on_read_file);
        reader.readAsText(file);
      };

      var on_read_file = function (event) {
        //event.stopPropagation();
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
        //event.stopPropagation();
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

      var old_input =  document.getElementById('container').querySelector('input');
      if(old_input!=null){
        old_input.remove();
      }
      document.getElementById('container').appendChild( input );

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

    
      var input = document.createElement( 'input' );
      input.type = 'file';

      var old_input =  document.getElementById('container').querySelector('input');
      if(old_input!=null){
        old_input.remove();
      }
      document.getElementById('container').appendChild( input );

      input.addEventListener('change', on_change_file);
      input.click();
    };

    this.switchCamera = function () {
      if(enable_vr) {
        return;
      }
      var not_empty = scene.children.filter(function(item) {return item instanceof THREE.Scene}).length !== 0;
      if(!fp && not_empty) { 
        //scene.add(pointerlockcontrols.getObject()); waa
        token.visible = true;
        trackballControls.reset();
        /* se lo faccio da telefono, sono fare questo ma pointerlock.enabled = true */
        document.body.requestPointerLock();
        octree.update(); //in caso tornassimo in visuale dall'alto, possiamo importare una nuova scena, e quindi ci serve rifare update dell'octree
        fp = true;
        if (showMap) {
          document.getElementById('mapCanvas').style.visibility = 'visible';
        }
    
      } else {
        //scene.remove(pointerlockcontrols.getObject()); waa
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
    }
    */

    this.remove = function () {

      for( var i = scene.children.length - 1; i >= 0; i--)
        if(scene.children[i] instanceof THREE.Scene)
          scene.remove(scene.children[i])

      mapScene = new THREE.Scene();
      wallScene = new THREE.Scene();
    }

    this.minimap = "All";
    this.show = false;

    this.cardboard = function () {
      if(fp) {
        return;
      }
      var empty = scene.children.filter(function(item) {return item instanceof THREE.Scene}).length == 0;

      if(empty){
        return;
      }

      enable_vr = !enable_vr;

      if(!enable_vr) {
        renderer_vr.domElement.remove();
        document.body.appendChild(renderer.domElement);
        trackballControls = new THREE.TrackballControls(camera2);
        document.getElementById('blocker').style.display = 'none';
        document.getElementById('mapCanvas').style.visibility = 'hidden';
        fp = false;

        //Add e connect in setOrientationControls
        deviceorientationcontrols.disconnect();
        //scene.remove(deviceorientationcontrols.object); //WAA
        
        pointerlockcontrols.enabled = false;
      }
      else {
        renderer.domElement.remove();
        document.body.appendChild(renderer_vr.domElement);
        //effect.setSize(window.innerWidth, window.innerHeight);
        window.addEventListener('deviceorientation', setOrientationControls, true);
        trackballControls.reset();

        /* Basta che il pointerlock sia enabled (non serve blocker ecc) */
        //document.body.requestPointerLock(); //basta attivare questo e non funge
        pointerlockcontrols.enabled = true;
        
        octree.update(); //in caso tornassimo in visuale dall'alto, possiamo importare una nuova scena, e quindi ci serve rifare update dell'octree
        
      }

    }

  }

  gui = new dat.GUI();
    
  gui.add(GUIcontrols, 'scene').name('Import JSON');
  gui.add(GUIcontrols, 'remove').name('Remove Scene');
  
  gui.add(GUIcontrols, 'switchCamera').name('Switch Camera');
  /*
  gui.add(GUIcontrols, 'fps').name('Show/Hide FPS');
  gui.add(GUIcontrols, 'cardboard').name('EnableVR');
  */
  /*
  gui.add(GUIcontrols, 'importMap').name('Import 2D minimap');
  
  var folder_minimap = gui.addFolder('3D minimap');
  var minimap = folder_minimap.add( GUIcontrols, 'minimap', ["All", "Walls"] ).name('show').listen();
  minimap.onChange( function(value) {  
      updateMapScene(value);
  });
  var check_map = folder_minimap.add( GUIcontrols, 'show').name('display minimap').onChange(function(value) {console.log(value)});
  */
  addStats(); 

}
