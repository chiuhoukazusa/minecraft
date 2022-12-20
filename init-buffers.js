var g_positions = [];

var g_indices = [];

var g_textureCoordinates = [];

var g_vertexNormals = [];

var g_index = 0;

function initBuffers(gl, terraindata, _x, _z) {
  g_positions = [];

  g_indices = [];
  
  g_textureCoordinates = [];
  
  g_vertexNormals = [];
  
  g_index = 0;

  console.log("start");
  for(var x = _x * 12; x < _x * 12 + 12; x++){
    for(var z = _z * 12; z < _z * 12 + 12; z++){
      for(var y = 0; y < terraindata[(x + z * 2048) * 4] / 16; y++){
        setBlock(gl, g_positions, x, y, z);
        setIndices(gl, g_indices, g_index);
        setTextureBuffer(gl, g_textureCoordinates);
        setNormalBuffer(gl, g_vertexNormals);
        g_index++;
      }
    }
  }
  console.log("complete", g_index);

  const positionBuffer = initPositionBuffer(gl);

  const textureCoordBuffer = initTextureBuffer(gl);

  const indexBuffer = initIndexBuffer(gl);

  const normalBuffer = initNormalBuffer(gl);

  return {
    position: positionBuffer,
    normal: normalBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
    vertexCount: g_index * 36,
  };
}

//function updateBuffers

function setBlock(gl, positions, x, y, z) {
  positions.push(
    // Front face
    -1.0 + x * 2, -1.0 + y * 2, 1.0 + z * 2,
    1.0 + x * 2, -1.0 + y * 2, 1.0 + z * 2,
    1.0 + x * 2, 1.0 + y * 2, 1.0 + z * 2,
    -1.0 + x * 2, 1.0 + y * 2, 1.0 + z * 2,

    // Back face
    -1.0 + x * 2, -1.0 + y * 2, -1.0 + z * 2,
    -1.0 + x * 2, 1.0 + y * 2, -1.0 + z * 2,
    1.0 + x * 2, 1.0 + y * 2, -1.0 + z * 2,
    1.0 + x * 2, -1.0 + y * 2, -1.0 + z * 2,

    // Top face
    -1.0 + x * 2, 1.0 + y * 2, -1.0 + z * 2,
    -1.0 + x * 2, 1.0 + y * 2, 1.0 + z * 2,
    1.0 + x * 2, 1.0 + y * 2, 1.0 + z * 2,
    1.0 + x * 2, 1.0 + y * 2, -1.0 + z * 2,

    // Bottom face
    -1.0 + x * 2, -1.0 + y * 2, -1.0 + z * 2,
    1.0 + x * 2, -1.0 + y * 2, -1.0 + z * 2,
    1.0 + x * 2, -1.0 + y * 2, 1.0 + z * 2,
    -1.0 + x * 2, -1.0 + y * 2, 1.0 + z * 2,

    // Right face
    1.0 + x * 2, -1.0 + y * 2, -1.0 + z * 2,
    1.0 + x * 2, 1.0 + y * 2, -1.0 + z * 2,
    1.0 + x * 2, 1.0 + y * 2, 1.0 + z * 2,
    1.0 + x * 2, -1.0 + y * 2, 1.0 + z * 2,

    // Left face
    -1.0 + x * 2, -1.0 + y * 2, -1.0 + z * 2,
    -1.0 + x * 2, -1.0 + y * 2, 1.0 + z * 2,
    -1.0 + x * 2, 1.0 + y * 2, 1.0 + z * 2,
    -1.0 + x * 2, 1.0 + y * 2, -1.0 + z * 2,
  );
}

function setIndices(gl, indices, _index) {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  const index = _index * 24;
  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  indices.push(
    0 + index,
    1 + index,
    2 + index,
    0 + index,
    2 + index,
    3 + index, // front
    4 + index,
    5 + index,
    6 + index,
    4 + index,
    6 + index,
    7 + index, // back
    8 + index,
    9 + index,
    10 + index,
    8 + index,
    10 + index,
    11 + index, // top
    12 + index,
    13 + index,
    14 + index,
    12 + index,
    14 + index,
    15 + index, // bottom
    16 + index,
    17 + index,
    18 + index,
    16 + index,
    18 + index,
    19 + index, // right
    20 + index,
    21 + index,
    22 + index,
    20 + index,
    22 + index,
    23 + index, // left
  );

  return indexBuffer;
}

function setTextureBuffer(gl, textureCoordinates) {
  textureCoordinates.push(
  // Front
  0.0, 1.0 / 16.0,
  1.0 / 16.0, 1.0 / 16.0,
  1.0 / 16.0, 2.0 / 16.0,
  0.0, 2.0 / 16.0,
  // Back
  1.0 / 16.0, 1.0 / 16.0,
  1.0 / 16.0, 2.0 / 16.0,
  0.0, 2.0 / 16.0,
  0.0, 1.0 / 16.0,
  // Top
  0.0, 2.0 / 16.0,
  1.0 / 16.0, 2.0 / 16.0,
  1.0 / 16.0, 3.0 / 16.0,
  0.0, 3.0 / 16.0,
  // Bottom
  0.0, 0.0,
  1.0 / 16.0, 0.0,
  1.0 / 16.0, 1.0 / 16.0,
  0.0, 1.0 / 16.0,
  // Right
  1.0 / 16.0, 1.0 / 16.0,
  1.0 / 16.0, 2.0 / 16.0,
  0.0, 2.0 / 16.0,
  0.0, 1.0 / 16.0,
  // Left
  0.0, 1.0 / 16.0,
  1.0 / 16.0, 1.0 / 16.0,
  1.0 / 16.0, 2.0 / 16.0,
  0.0, 2.0 / 16.0,)
}

function setNormalBuffer(gl, vertexNormals) {
  vertexNormals.push(
    // Front
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

    // Back
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,

    // Top
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

    // Bottom
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

    // Right
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

    // Left
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  )
}

function initColorBuffer(gl) {
  const faceColors = [
    [1.0, 1.0, 1.0, 1.0], // Front face: white
    [1.0, 0.0, 0.0, 1.0], // Back face: red
    [0.0, 1.0, 0.0, 1.0], // Top face: green
    [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
    [1.0, 1.0, 0.0, 1.0], // Right face: yellow
    [1.0, 0.0, 1.0, 1.0], // Left face: purple
  ];

  // Convert the array of colors into a table for all the vertices.

  var colors = [];

  for (var j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];
    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return colorBuffer;
}

function initPositionBuffer(gl) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_positions), gl.STATIC_DRAW);

  return positionBuffer;
}

function initIndexBuffer(gl) {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(g_indices),
    gl.STATIC_DRAW
  );

  return indexBuffer;
}

function initTextureBuffer(gl) {
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(g_textureCoordinates),
    gl.STATIC_DRAW
  );

  return textureCoordBuffer;
}

function initNormalBuffer(gl) {
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(g_vertexNormals),
    gl.STATIC_DRAW
  );

  return normalBuffer;
}
