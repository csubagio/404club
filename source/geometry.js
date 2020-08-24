
function geometry(positions) {
  let combined = [];
  let vertCount = positions.length / 3;
  let faceCount = vertCount / 3;
  let subAt = (x, y) => {
    return [ 
      positions[x] - positions[y],
      positions[x+1] - positions[y+1],
      positions[x+2] - positions[y+2] 
    ]
  }
  for ( let f=0; f<faceCount; ++f ) {
    let v0 = f * 3 * 3;
    let a = subAt( v0+3, v0 );
    let b = subAt( v0+6, v0 );
    let nrm = normalize(cross(a, b));
    for ( let i=0; i<3; ++i ) {
      combined.push( positions[v0+i*3] );
      combined.push( positions[v0+i*3+1] );
      combined.push( positions[v0+i*3+2] );
      combined.push.apply( combined, nrm );
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

function translateVerts(verts, x, y, z) {
  for ( let i=0; i<verts.length/3; ++i ) {
    verts[i*3] += x;
    verts[i*3+1] += y;
    verts[i*3+2] += z;
  }
}

function transformVerts(verts, m) {
  for ( let i=0; i<verts.length/3; ++i ) {
    let ii = i * 3;
    let v = [verts[ii++], verts[ii++], verts[ii++]];
    v = m4_applyVector3(m, v);
    ii = i * 3;
    verts[ii++] = v[0];    
    verts[ii++] = v[1];    
    verts[ii++] = v[2];    
  }
}


function quad(verts, points) {
  let add = (i) => verts.push.apply(verts, points[i]);
  add(0);
  add(1);
  add(3);

  add(1);
  add(2);
  add(3);
}

function box(verts, w, h, d) {
  let p1 = [-w,-h,-d];
  let p2 = [ w,-h,-d];
  let p3 = [ w, h,-d];
  let p4 = [-w, h,-d];

  let p5 = [-w,-h, d];
  let p6 = [ w,-h, d];
  let p7 = [ w, h, d];
  let p8 = [-w, h, d];

  quad( verts, [p1, p2, p3, p4]);

  quad( verts, [p1, p2, p6, p5]);
  quad( verts, [p2, p3, p7, p6]);
  quad( verts, [p3, p4, p8, p7]);
  quad( verts, [p4, p1, p5, p8]);

  quad( verts, [p5, p6, p7, p8]);
}

window.instances = [];

function makeInstance(geo, pos, rot, scl) {
  instances.push( {
    geo,
    pos: pos || [0,0,0],
    rot: rot || [0,0,0],
    scl: scl || [1,1,1],
    mtx: m4_translation(0,0,0),
    mtxs: m4_translation(0,0,0),
    prn: null,
    clr: [1,1,1],
    glow: [0,0,0]
  })
  return instances.length - 1;
}

let boxGeometry;
(function() {
  let verts = [];
  box(verts, 1, 1, 1);
  boxGeometry = geometry( verts );
})()

function setGlow(i, m, r, g, b) {
  instances[i].clr[0] *= m;
  instances[i].clr[1] *= m;
  instances[i].clr[2] *= m;
  instances[i].glow = [r, g, b];
}


let fieldWidth = 60;

(function(){
  // floor!
  let count = 10;
  w = fieldWidth / count;
  let verts = [];
  x0 = -fieldWidth / 2 + w / 2;
  for ( let y=0; y<count; ++y ) {
    for ( let x=0; x<count; ++x ) {
      let boxVerts = [];
      let s = 2.0 + unitRandom() * 0.1;
      box(boxVerts, w/s, w/s, 0.1 + unitRandom() * 0.05);
      let matrix = m4_translation( 
        x0 + x * w + Math.random() * 0.1, 
        x0 + y * w + Math.random() * 0.1, 
        -0.6 - Math.random() * 0.1
      );
      matrix = m4_xRotate( matrix, unitRandom() * 0.02 );
      matrix = m4_yRotate( matrix, unitRandom() * 0.02 );
      matrix = m4_zRotate( matrix, unitRandom() * 0.05 );
      transformVerts( boxVerts, matrix );
      verts.push.apply(verts, boxVerts);

      boxVerts = [];
      box(boxVerts, w/s, w/s, 0.2 + unitRandom() * 0.1);
      matrix = m4_translate( matrix, 0.0, 0.0, 0.2 );
      matrix = m4_scale( matrix, 0.9, 0.9, 1 );
      transformVerts( boxVerts, matrix );
      verts.push.apply(verts, boxVerts);
    }
  }

  let floorGeometry = geometry(verts);
  let floor = makeInstance(floorGeometry);
  instances[floor].clr = [0.2, 0.3, 0.2];
  //instances[floor].glow = [0.1, 0.1, 0.1];
})();



function plotPoint(p, r, g, b) {
  gl.bindBuffer(gl.ARRAY_BUFFER, boxGeometry.buf);
  vectorAttribute('pos', 0);
  vectorAttribute('nrm', 3*4);
  gl.uniform3fv(baseMaterial.uniforms.clr, [0.2,0.2,0.2]);
  gl.uniform3f(baseMaterial.uniforms.glow, r, g, b);

  let matrix = m4_translation( p[0], p[1], p[2] );
  matrix = m4_scale(matrix, 0.2, 0.2, 0.2);
  uploadMatrix(baseMaterial.uniforms.world, matrix);
  gl.drawArrays(gl.TRIANGLES, 0, boxGeometry.cnt);
}

function plotLine(p1, p2, r, g, b, up) {
  gl.bindBuffer(gl.ARRAY_BUFFER, boxGeometry.buf);
  vectorAttribute('pos', 0);
  vectorAttribute('nrm', 3*4);
  gl.uniform3fv(baseMaterial.uniforms.clr, [0.2,0.2,0.2]);
  gl.uniform3f(baseMaterial.uniforms.glow, r, g, b);

  let center = addScaledVectors( p1, 0.5, p2, 0.5 );

  let matrix = lookAt( p1, p2, up || [0,0,1] );
  let len = vectorLength(subtractVectors(p2,p1)) / 2;
  matrix = m4_translate(matrix, 0.0, 0.0, len);
  matrix = m4_scale(matrix, 0.05, 0.05, len);

  uploadMatrix(baseMaterial.uniforms.world, matrix);
  gl.drawArrays(gl.TRIANGLES, 0, boxGeometry.cnt);
}

function plotAxes(m) {
  let p = m4_extractPosition(m);
  let [x, y, z] = m4_extractDirections(m);

  plotLine(p, addScaledVectors(p,1,x,3), 1, 0, 0, y);
  plotLine(p, addScaledVectors(p,1,y,3), 0, 1, 0, z);
  plotLine(p, addScaledVectors(p,1,z,3), 0, 0, 1, x);
}
