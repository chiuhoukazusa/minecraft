var cameraPos = [0, 13, 0];
var cameraTarget = [0, 13, -1];
var cameraUp = [0, 1, 0];
var cameraDir = [cameraTarget[0] - cameraPos[0], cameraTarget[1] - cameraPos[1], cameraTarget[2] - cameraPos[2]];

function drawScene(gl, programInfo, buffers, texture, xMove, yMove, loadedChunkCoords, terraindata) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 10000.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelMatrix = mat4.create();

  const viewMatrix = mat4.create();
  cameraDir = [cameraTarget[0] - cameraPos[0], cameraTarget[1] - cameraPos[1], cameraTarget[2] - cameraPos[2]];
  var cameraZ = normalizeVector(crossVector(cameraDir, cameraUp));

  mat4.lookAt(viewMatrix, cameraPos, cameraTarget, cameraUp);

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  mat4.translate(
    modelMatrix, // destination matrix
    modelMatrix, // matrix to translate
    [-0.0, 0.0, -6.0]
  ); // amount to translate

  // Set the camera
  window.onkeydown = function(event) { 
    if(event.keyCode == 87)
    {
      cameraPos = [cameraPos[0] + cameraDir[0], cameraPos[1] + cameraDir[1], cameraPos[2] + cameraDir[2]];
      cameraTarget = [cameraTarget[0] + cameraDir[0], cameraTarget[1] + cameraDir[1], cameraTarget[2] + cameraDir[2]];
    }
    if(event.keyCode == 83)
    {
      cameraPos = [cameraPos[0] - cameraDir[0], cameraPos[1] - cameraDir[1], cameraPos[2] - cameraDir[2]];
      cameraTarget = [cameraTarget[0] - cameraDir[0], cameraTarget[1] - cameraDir[1], cameraTarget[2] - cameraDir[2]];
    }
    if(event.keyCode == 65)
    {
      cameraPos = [cameraPos[0] - cameraZ[0], cameraPos[1] - cameraZ[1], cameraPos[2] - cameraZ[2]];
      cameraTarget = [cameraTarget[0] - cameraZ[0], cameraTarget[1] - cameraZ[1], cameraTarget[2] - cameraZ[2]];
    }
    if(event.keyCode == 68)
    {
      cameraPos = [cameraPos[0] + cameraZ[0], cameraPos[1] + cameraZ[1], cameraPos[2] + cameraZ[2]];
      cameraTarget = [cameraTarget[0] + cameraZ[0], cameraTarget[1] + cameraZ[1], cameraTarget[2] + cameraZ[2]];
    }
    if(event.keyCode == 32)
    {
      cameraPos[1] += 1;
      cameraTarget[1] += 1;
    }
    if(event.keyCode == 17)
    {
      cameraPos[1] -= 1;
      cameraTarget[1] -= 1;
    }
  }; 

  cameraDir = rotateVector(cameraDir, -xMove * 0.001, [0, 1, 0]);
  cameraDir = rotateVector(cameraDir, -yMove * 0.001, cameraZ);

  cameraTarget = [cameraPos[0] + cameraDir[0], cameraPos[1] + cameraDir[1], cameraPos[2] + cameraDir[2]];

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, viewMatrix * modelMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  var chunkX = parseInt(cameraPos[0] / 12);
  var chunkZ = parseInt(cameraPos[2] / 12);

  if(chunkX < 0){
    chunkX = 0;
  }
  if(chunkZ < 0){
    chunkZ = 0;
  }

  if(!includesDeep(loadedChunkCoords, [chunkX + 5, chunkZ + 5]))
  {
    for(var i = chunkX - 10; i < chunkX + 10; i++)
    {
      for(var j = chunkZ - 10; j < chunkZ + 10; j++)
      {
        if(i >= 0 && j >= 0 && !includesDeep(loadedChunkCoords, [i, j]))
        {
          console.log("Loading chunk " + i + " " + j);
          loadedChunkCoords.push([i, j]);
          buffers.push(initBuffers(gl, terraindata, i, j));
        }
      }
    }
  }

  var loadedChunks = buffers.length;

  for(var i = 0; i < loadedChunks; i++)
  {
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    setPositionAttribute(gl, buffers[i], programInfo);

    setTextureAttribute(gl, buffers[i], programInfo);

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers[i].indices);

    setNormalAttribute(gl, buffers[i], programInfo);

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix
    );
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelMatrix,
      false,
      modelMatrix
    );
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.viewMatrix,
      false,
      viewMatrix
    );
    gl.uniformMatrix4fv(
      programInfo.uniformLocations.normalMatrix,
      false,
      normalMatrix
    );
    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    {
      const vertexCount = buffers[i].vertexCount;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, offset);
    }
    
  }
}

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(gl, buffers, programInfo) {
  const numComponents = 3;
  const type = gl.FLOAT; // the data in the buffer is 32bit floats
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

// Tell WebGL how to pull out the colors from the color buffer
// into the vertexColor attribute.
function setColorAttribute(gl, buffers, programInfo) {
  const numComponents = 4;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

// tell webgl how to pull out the texture coordinates from buffer
function setTextureAttribute(gl, buffers, programInfo) {
  const num = 2; // every coordinate composed of 2 values
  const type = gl.FLOAT; // the data in the buffer is 32-bit float
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set to the next
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
  gl.vertexAttribPointer(
    programInfo.attribLocations.textureCoord,
    num,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
}

// Tell WebGL how to pull out the normals from
// the normal buffer into the vertexNormal attribute.
function setNormalAttribute(gl, buffers, programInfo) {
  const numComponents = 3;
  const type = gl.FLOAT;
  const normalize = false;
  const stride = 0;
  const offset = 0;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexNormal,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
}

function includesDeep(array, element) {
  for (const item of array) {
    if (Array.isArray(item) && Array.isArray(element)) {
      if (item.length !== element.length) continue;
      let equal = true;
      for (let i = 0; i < item.length; i++) {
        if (item[i] !== element[i]) {
          equal = false;
          break;
        }
      }
      if (equal) return true;
    } else if (item === element) {
      return true;
    }
  }
  return false;
}

export { drawScene };