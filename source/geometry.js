
function geometry(positions) {
  let combined = [];
  let vertCount = positions.length / 3;
  let faceCount = vertCount / 3;
  for ( let f=0; f<faceCount; ++f ) {
    let v0 = f * 3 * 3;
    let a = subtractVectors( positions.slice(v0+3,v0+6), positions.slice(v0,v0+3) );
    let b = subtractVectors( positions.slice(v0+6,v0+9), positions.slice(v0,v0+3) );
    let nrm = normalize(cross(a, b));
    for ( let i=0; i<3; ++i ) { 
      combined = combined.concat( positions.slice(v0+i*3,v0+i*3+3) );
      combined = combined.concat( nrm ); 
    }
  }
  let buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(combined), gl.STATIC_DRAW);
  return { buf, cnt: vertCount };
}

let triangle = geometry([
  0, 0, 0,
  0, 1, 0,
  1, 0, 0
]);

function quad(verts, points) {
  let add = (i) => verts = verts.concat(points[i]);
  add(0);
  add(1);
  add(3);

  add(1);
  add(2);
  add(3);
  return verts;
}


let instances = [];

function makeInstance(geo, pos, rot, scl) {
  instances.push( {
    geo,
    pos: pos || [0,0,0],
    rot: rot || [0,0,0],
    scl: scl || [1,1,1],
    mtx: m4_translation(0,0,0),
    mtxs: m4_translation(0,0,0),
    prn: null,
    clr: [1,1,1]
  })
  return instances.length - 1;
}