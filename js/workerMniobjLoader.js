onmessage = function(e) {
  importScripts('getTextFile.js');
  importScripts('MniObjReader.js');

  var mniobjFilePath = "../" + e.data;

  // some async file reading job
  getTextFile(mniobjFilePath, function( mniObjString ) {

    var reader = new MniObjReader();
    reader.parse( mniObjString );

    // send back the data to the main thread
    postMessage(reader);

  }, function(status) {
  	console.log('Something went wrong.');
  });

}
