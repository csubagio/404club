let colliders = [ [], [] ];

function pushCollider( player, parent, x, y, z, w, d, h ) {
  colliders[player].push({ 
    parent: parent, 
    mtx: m4_translation(0,0,0),
    x, y, z, 
    w:w/2, d:d/2, h:h/2, 
    clr: [1,1,1],
    rot: 0
  });
}

function drawColliders() {

  let update = (list) => {
    for ( let b of list ) {
      if ( b.parent !== undefined ) {
        b.mtx = m4_translate(instances[b.parent].mtxs, b.x, b.y, b.z);
        b.mtx = m4_xRotate(b.mtx, b.rot);
      }
    }
  }

  let draw = (list) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, boxGeometry.buf);
    for ( let b of list ) {
      vectorAttribute('pos', 0);
      vectorAttribute('nrm', 3*4);
      gl.uniform3fv(baseMaterial.uniforms.clr, [0.2,0.2,0.2]);
      gl.uniform3fv(baseMaterial.uniforms.glow, b.clr)

      let matrix = m4_scale(b.mtx, b.w, b.d, b.h);
      uploadMatrix(baseMaterial.uniforms.world, matrix);
      gl.drawArrays(gl.TRIANGLES, 0, boxGeometry.cnt);
    }
  }

  update( colliders[0] );
  update( colliders[1] );

  for ( let a of colliders[0] ) {
    for ( let b of colliders[1] ) {
      if ( box_intersect( a, b ) ) {
        a.clr = [0.6, 0, 0];
        b.clr = [0.6, 0, 0];
      } else {
        a.clr = [0, 0.6, 0];
        b.clr = [0, 0.6, 0];
      }
    }
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);  
  draw( colliders[0] );
  draw( colliders[1] );
  gl.disable(gl.BLEND);
  //gl.blendFunc(gl.ONE, gl.ZERO);  
}

function box_points(b) {
  let points = [];
  let p = (x, y, z) => {
    points.push( m4_applyVector3( b.mtx, [x, y, z]) );
  }
  p(-b.w,-b.d,-b.h);
  p( b.w,-b.d,-b.h);
  p(-b.w, b.d,-b.h);
  p( b.w, b.d,-b.h);

  p(-b.w,-b.d, b.h);
  p( b.w,-b.d, b.h);
  p(-b.w, b.d, b.h);
  p( b.w, b.d, b.h);
  return points;
}



function box_intersect( a, b ) {
  // not efficient at all... but possibly shorter?
  let pointsA = box_points(a);
  let pointsB = box_points(b);

  let separateAlongAxis = ( axis ) => {
    let pa = pointsA.map( x => dot(x, axis) );
    let pb = pointsB.map( x => dot(x, axis) );
    let minA = min.apply(0, pa);
    let maxA = max.apply(0, pa);
    let minB = min.apply(0, pb);
    let maxB = max.apply(0, pb);
    return minB > maxA || minA > maxB;
  }

  let axesA = m4_extractDirections(a.mtx); 
  let axesB = m4_extractDirections(b.mtx); 

  for ( let y=0; y<3; ++y ) {
    if ( separateAlongAxis(axesA[y]) ) { return false; }
    if ( separateAlongAxis(axesB[y]) ) { return false; }

    //for ( let x=0; x<3; ++x ) {
      //if ( separateAlongAxis(cross(axesA[x], axesB[y])) ) { return false; }
    //}
  }

  return true;
}