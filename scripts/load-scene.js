(function () {
  var progress_indicator = document.getElementById('progress-text');
  var progress_filler = document.getElementById('progress-filler');
  var progress_text = document.getElementById('progress-indicator');
  console.log('LOADING SCENE...');

  var on_parse = function (object) {
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

    var oReq = new XMLHttpRequest();
    oReq.addEventListener('progress', updateProgress);
    oReq.addEventListener('load', transferComplete);
    oReq.addEventListener('error', transferFailed);
    oReq.addEventListener('abort', transferCanceled);
    oReq.open('GET', 'inputs/scene-no-envmaps-atomized.json');
    oReq.setRequestHeader('Accept', 'application/json');
    oReq.setRequestHeader('Content-Type', 'application/json');
    oReq.send();

    function updateProgress (oEvent) {
      if (oEvent.lengthComputable) {
        var complete = (oEvent.loaded / oEvent.total * 100).toFixed(1);
        progress_indicator.textContent = complete;
        progress_filler.style.width = complete + '%';
      } else {
        console.error('Unable to compute progress information since the total size is unknown');
      }
    }

    function transferComplete(evt) {
      console.log('The transfer is complete.');
      setTimeout(function () {
        var json = JSON.parse(evt.target.responseText);
        var loader = new THREE.ObjectLoader();
        loader.parse(json, on_parse);
      }, 100);
      progress_indicator.remove();
      progress_filler.remove();
      progress_text.remove();
    }

    function transferFailed(evt) {
      console.log('An error occurred while transferring the file.');
    }

    function transferCanceled(evt) {
      console.log('The transfer has been canceled by the user.');
    }
})();
