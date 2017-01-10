[DEMO](http://mcgill.jonathanlurie.fr/mniobjReader/shapeWorker.html) (we always want to see the fancy demo before reading how it works, right?)

# What is this ES6 version?
This version uses an ES6 class for `MniobjReader`, while the [other version](https://github.com/jonathanlurie/mniobjReader) is using prototypes. Other than that, they are the same.

# What is mniobj ?
mniobj is a 3D mesh file specification made by the [Montreal Neurological Institute](https://www.mcgill.ca/neuro/about). For the web, we use(d) it mainly within [BrainBrowser](https://brainbrowser.cbrain.mcgill.ca) because it is convenient and simple to use to load 3D shapes in webGL.

# What is mniobjReader ?
It's a reader and parser for mniobj files in Javascript (browser) with no dependencies. The parsed data format is intentionally left relatively raw, mainly using typed arrays. Having no dependencies makes it easier to run the parsing from within a web worker.  
In the following, examples are given for both the mono-thread **and** the web-workers way of loading mniobj files.  

Historically, the first JS mniobj reader was written by [Nicolas Kassis](https://github.com/nkassis) and [Tarek Sherif](https://github.com/tsherif) for BrainBrowser. Unfortunately, the parsing logic was strongly tight to the BrainBrowser environment and could not be used anywhere else easily. This project is an attempt to make an independent reader, free from BrainBrowser and easily importable everywhere.  

Note: **mniobjReader** uses a prototype based *object* approach.

# How to use it ?
In the following examples, you have to open the JS console to see what's happening. (nothing is *printed* onto the page.)

Also, in every cases here, we have to open the 3D model file (most likely `models/gray_left_327680.obj`) and get its content as a giant string, this it the purpose of this recurring piece of code:  

```js
getTextFile(
  // file to read - on the same server, or on one that allows cross origins things
  "models/gray_left_327680.obj",

  // callback: the loading was successful, what to do with the content?
  function( stringContent ) {
    // ... do something with this string content!
    // the parsing will go here
  },

  // callback: the loading failed :(
  function(status) {
    console.log('Something went wrong.');
  }
);
```

Since the `getTextFile()` function is just an AJAX tool and is not really part of the mniobj parsing logic, I put it in a different file: `js/getTextFile.js`. You could be reading the *mniobj* differently after all, using a *file dialog* for example.  

In the next examples, especially if you click on the DEMO links, bear in mind the model files are about 18MB and AJAX will be downloading them. You may rather want to clone the repo and try it locally.


## The almost sync way (AJAX, but no web workers)
See `simple.html`. ([DEMO](http://mcgill.jonathanlurie.fr/mniobjReader/simple.html) with nothing visual)  

Here is the foundation of using `MniObjReader`. First, create an instance and feed it:
```js
// build a parser
var mniObjReader = new MniObjReader();

// feed the parser with some string content of a mniobj file
mniObjReader.parse( mniObjString );
```

Then, retrieve some data from it:
```js
// a whole lot of data, you may not use all of them
var shapeData = mniObjReader.getShapeData();
console.log(shapeData);

// these are the very interesting data you want to use:
var indices = mniObjReader.getShapeRawIndices(0); // Uint32Array
var positions = mniObjReader.getRawVertices();  // Float32Array
var normals = mniObjReader.getRawNormals(); // Float32Array
var colors = mniObjReader.getRawColors(); // Uint8Array
var surfaceProperties = mniObjReader.getSurfaceProperties(); // object
```

## The very async way (AJAX and web workers)
See `simpleWorker.html`. ([DEMO](http://mcgill.jonathanlurie.fr/mniobjReader/simpleWorker.html) with nothing visual)  

The thing with *web workers* is to run a piece of code on another thread so that it does not block the main app. This feature comes handy in a UX context, where your user may want to interact with all these fancy buttons while actually loading a big chunk of data: it will not freeze!  
Unfortunately it comes with some downsides you have to know and pay attention to:

1. Inside a worker, URLs become relative to this worker.
See the example file `workerMniobjLoader.js`, when it comes to finding the model file, we have this:
```js
var mniobjFilePath = "../" + e.data;
```
While it's not a big deal in this situation, having to prefix the model url with `../` might become a problem in a mode complex architecture.  

2. Sending data [back to the main thread](https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope/postMessage) (most likely a `MniObjReader` instance) will strip it off from all its methods and only the data will remain. This is what we call serialization by [making a structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).  
In our case, once our `MniObjReader` instance did its parsing work, we really would like to continue using its full capabilities (ie. calling its methods) once transfered to the main thread. Thus, back in the main thread, we sort of build new instance by copy:  
```js
// ...
var mniObjReader = new MniObjReader();
mniObjReader.copy( mniObjReaderInstance );
// ...
```

3. The whole process is a bit slower, due to serialization of large typed arrays and this will get worse as your shapes have a larger amount of vertices. So you have to choose between spending more time loading a shape (using workers) and let your user interact with the rest of your app in the process, or, freeze the whole thing for a shorter while.  
Theres is no perfect answer, it depends on the size of your shapes, what your users think is acceptable, and your consideration for *good design*.

# How to actually display something?
Here, we are using [ThreeJS](https://threejs.org) to display the parsed mniobj.
## The almost sync way (AJAX but no web workers)
See `shape.html`, especially the `readMniobjFile()` function. ([DEMO](http://mcgill.jonathanlurie.fr/mniobjReader/shape.html))

## The very async way (AJAX and web workers)
See `shapeWorker.html`. ([DEMO](http://mcgill.jonathanlurie.fr/mniobjReader/shapeWorker.html))  
Same function as the *regular* version: `readMniobjFile()` but pay attention to the worker that was declared at the top:

```js
// creating the worker
var myWorker = new Worker("js/workerMniobjLoader.js");
```

Does it mean "no [hoisting](http://www.w3schools.com/js/js_hoisting.asp) for web workers!", well apparently...

# TODO
- It would be nice to have *tar.gz* compatibility using [Pako](https://github.com/nodeca/pako) because mesh files can get big!

# License
[MIT](LICENSE)
