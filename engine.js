import { drawScene } from "./draw-scene.js";

let deltaTime = 0;
var xMove = 0;
var yMove = 0;

var terraindata = loadImage("Assets/map/map1.png", function (data) {
  terraindata = data;
  console.log("Loaded terrain data");
  main(terraindata);
});

function main(terraindata) {
  const canvas = document.querySelector("#glcanvas");
  canvas.width = window.screen.width;
  canvas.height = window.screen.height;
  const gl = canvas.getContext("webgl");

  //Lock the mouse to the canvas
  canvas.addEventListener("click", ev => {
    canvas.requestPointerLock(); 
  });

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  var directionalLight = {
    direction: [0.85, 0.8, 0.75],
    ambientIntensity: [0.3, 0.3, 0.3],
    diffuseIntensity: [1.0, 1.0, 1.0],
  }

  //skybox shader program
  const skyboxvsSource = `
    attribute vec4 a_position;
    varying vec4 v_position;
    void main() {
      v_position = a_position;
      gl_Position = a_position;
      gl_Position.z = 1.0;
    }
  `
  const skyboxfsSource = `
    precision highp float;

    uniform samplerCube u_skybox;
    uniform mat4 u_viewDirectionProjectionInverse;
    
    varying vec4 v_position;
    void main() {
      vec4 t = u_viewDirectionProjectionInverse * v_position;
      gl_FragColor = textureCube(u_skybox, normalize(t.xyz / t.w));
    }
  `

  const skyboxShaderProgram = initShaderProgram(gl, skyboxvsSource, skyboxfsSource);

  const skyboxProgramInfo = {
    program: skyboxShaderProgram,
    attribLocations: {
      positionLocation: gl.getAttribLocation(skyboxShaderProgram, "a_position"),
    },
    uniformLocations: {
      skyboxLocation: gl.getUniformLocation(skyboxShaderProgram, "u_skybox"),
      viewDirectionProjectionInverseLocation: gl.getUniformLocation(skyboxShaderProgram, "u_viewDirectionProjectionInverse"),
    },
  };
  // Create a buffer for positions
  var skyboxPositionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, skyboxPositionBuffer);
  // Put the positions in the buffer
  setSkybox(gl);

  // Create a texture.
  var skyboxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: 'Assets/skybox/front.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: 'Assets/skybox/back.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: 'Assets/skybox/top.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: 'Assets/skybox/bottom.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: 'Assets/skybox/right.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: 'Assets/skybox/left.png',
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const {target, url} = faceInfo;

    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1024;
    const height = 1024;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // setup each face so it's immediately renderable
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  // Vertex shader program
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;
    uniform mat4 uNormalMatrix;
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;

    uniform vec3 lightDirection;
    uniform vec3 AmbientIntensity;
    uniform vec3 DiffuseIntensity;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vNormal;
    varying highp vec3 vlightDirection;
    varying highp vec3 vAmbientIntensity;
    varying highp vec3 vDiffuseIntensity;

    void main(void) {
      gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
      vNormal = (uNormalMatrix * vec4(aVertexNormal, 1.0)).xyz;
      vlightDirection = lightDirection;
      vAmbientIntensity = AmbientIntensity;
      vDiffuseIntensity = DiffuseIntensity;
    }
`;

  // Fragment shader program

  const fsSource = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vNormal;
    varying highp vec3 vlightDirection;
    varying highp vec3 vAmbientIntensity;
    varying highp vec3 vDiffuseIntensity;
    uniform sampler2D uSampler;
    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

      // Apply lighting effect
      highp vec3 Ia = vAmbientIntensity;
      highp vec3 ambient = Ia * texelColor.rgb;
      highp vec3 directionalLightColor = vDiffuseIntensity;
      highp vec3 directionalVector = normalize(vlightDirection);
      highp float directional = max(dot(vNormal, directionalVector), 0.0);
      highp vec3 diffuse = texelColor.rgb * directionalLightColor * directional;

      highp vec3 color = ambient + diffuse;

      gl_FragColor = vec4(color, 1.0);
    }
`;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVertexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelMatrix: gl.getUniformLocation(shaderProgram, "uModelMatrix"),
      viewMatrix: gl.getUniformLocation(shaderProgram, "uViewMatrix"),
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
      lightDirection: gl.getUniformLocation(shaderProgram, "lightDirection"),
      AmbientIntensity: gl.getUniformLocation(shaderProgram, "AmbientIntensity"),
      DiffuseIntensity: gl.getUniformLocation(shaderProgram, "DiffuseIntensity"),
      uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  console.log("init buffers");
  var buffers = [];
  var loadedChunkCoords = [];
  buffers.push(initBuffers(gl, terraindata, 0, 0));
  //buffers.push(initBuffers(gl, terraindata, 0, 1));
  //buffers.push(initBuffers(gl, terraindata, 1, 0));
  loadedChunkCoords.push([0, 0]);

  // Load texture
  const texture = loadTexture(gl, "Assets/texture-opaque.png");

  // Flip image pixels into the bottom-to-top order that WebGL expects.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  let then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, texture, xMove, yMove, loadedChunkCoords, terraindata,
       skyboxProgramInfo, skyboxPositionBuffer, directionalLight);

    xMove = 0;
    yMove = 0;

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  document.addEventListener("mousemove", ev => {
    xMove = ev.movementX;
    yMove = ev.movementY;
  });
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REAPET);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REAPET);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NAREAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NAREAREST);
    }
  };
  image.src = url;

  return texture;
}

//skybox cube
function setSkybox(gl) {
  var positions = new Float32Array(
    [
      -1.0, -1.0, 
       1.0, -1.0, 
      -1.0,  1.0, 
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}


function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

function loadImage(url, callback) {
  var img = new Image();

  img.onload = function(pixeldata) {
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    pixeldata = canvas.getContext('2d').getImageData(0, 0, img.width, img.height).data;
    callback(pixeldata);
  };

  img.src = url;
}