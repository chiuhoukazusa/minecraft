function normalizeVector(v) {
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / length, v[1] / length, v[2] / length];
  }
  
function crossVector(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function rotateVector(v, angle, axis) {
  var x = axis[0];
  var y = axis[1];
  var z = axis[2];
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var t = 1 - c;
  var mat = [
    t * x * x + c,
    t * x * y - s * z,
    t * x * z + s * y,
    0,
    t * x * y + s * z,
    t * y * y + c,
    t * y * z - s * x,
    0,
    t * x * z - s * y,
    t * y * z + s * x,
    t * z * z + c,
    0,
    0,
    0,
    0,
    1,
  ];
  var res = [
    v[0] * mat[0] + v[1] * mat[1] + v[2] * mat[2],
    v[0] * mat[4] + v[1] * mat[5] + v[2] * mat[6],
    v[0] * mat[8] + v[1] * mat[9] + v[2] * mat[10],
  ];
  return res;
}
  
function PerlinNoise(seed) {
  if (seed > 0 && seed < 1) {
    // Scale the seed out
    seed *= 65536;
  }

  seed = Math.floor(seed);
  if (seed < 256) {
    seed |= seed << 8;
  }

  this.p = new Uint8Array(256);
  this.perm = new Uint8Array(512);
  this.permMod12 = new Uint8Array(512);

  var i;
  for (i = 0; i < 256; i++) {
    if (seed > 0) {
      seed
      = (seed * 9301 + 49297) % 233280;
      this.p[i] = seed / 233280.0;
    } else {
      this.p[i] = Math.random();
    }
  }

  for (i = 0; i < 512; i++) {
    this.perm[i] = this.p[i & 255];
    this.permMod12[i] = this.perm[i] % 12;
  }
}
