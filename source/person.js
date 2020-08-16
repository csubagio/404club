
function makeLimbGeometry() {
  let verts = [];
  let points = [];
  let point = (x, y, z) => points.push([x,y,z]);
  slice = (w, l) => {
    point(-w, -w, l);
    point( w, -w, l);
    point( w,  w, l);
    point(-w,  w, l);
  }
  slice(0.1, 0);
  slice(0.5, 0.1);
  slice(0.3, 0.7);
  slice(0.1, 1);
  let q = (a,b,c,d) => verts = quad( verts, [ points[a], points[b], points[c], points[d] ] );
  let wall = (a,b,c,d, e,f,g,h) => {
    q( a, b, f, e );
    q( b, c, g, f );
    q( c, d, h, g );
    q( d, a, e, h );
  }
  q( 0, 1, 2, 3 );
  wall( 0, 1, 2, 3,  4, 5, 6, 7 );
  wall( 4, 5, 6, 7,  8, 9, 10, 11 );
  wall( 8, 9, 10, 11,  12, 13, 14, 15 );
  q( 12, 13, 14, 15 );
  return geometry( verts );
}

let limbGeometry = makeLimbGeometry();
let limbColor = [1,0.5,0.4];
function addLimb(parent, pos, scale, rot) {
  let i = makeInstance( limbGeometry, pos, rot, scale );
  instances[i].prn = parent;
  instances[i].clr = limbColor;
  return i;  
}

function solveIk( bone1, bone2, target, forward ) {
  let ins1 = instances[bone1];
  let ins2 = instances[bone2];

  let from = m4_extractPosition(ins1.mtx);
  let to = m4_extractPosition(instances[target].mtx);
  
  let bone1Scale = ins1.scl;
  let bone2Scale = ins2.scl;

  // bone 1 length, bone 2 length, distance to target, for a triangle
  let len1 = bone1Scale[2];
  let len2 = bone2Scale[2];
  let len3 = vectorLength( subtractVectors( from, to ) );
  // solve for triangle angle using 3 lengths
  let angle = 0;
  if ( len3 < (len1 + len2) * 0.999999 ) {
    angle = -acos( ( len1 * len1 + len3 * len3 - len2 * len2 ) / ( 2 * len1 * len3 ) );
  }
  
  ins1.mtx = lookAt( from, to, forward );
  ins1.mtx = m4_multiply( ins1.mtx, m4_xRotation(angle) );

  ins2.mtx = m4_translate( ins1.mtx, ins2.pos[0], ins2.pos[1], ins2.pos[2] );
  ins2.mtx = lookAt(  m4_extractPosition(ins2.mtx), to, forward );
 
  ins1.mtx = m4_scale( ins1.mtx, bone1Scale[0], bone1Scale[1], bone1Scale[2] );
  ins2.mtx = m4_scale( ins2.mtx, bone2Scale[0], bone2Scale[1], bone2Scale[2] );
}

function makePerson(){ 
  let p = {};

  p.root = makeInstance(null);

  p.pelvis = addLimb( p.root, [0,0,6], [2,1,1] );
  p.spine = addLimb( p.pelvis, [0,0,1], [2,1,1] );
  p.chest = addLimb( p.spine, [0,0,1], [2,1,2] );
  p.head = addLimb( p.chest, [0,0,2], [1.7,1.5,2] );
  
  p.leftThigh = addLimb( p.pelvis, [-0.5,0,0], [1,1.5,3], [PI,0,0] );
  p.rightThigh = addLimb( p.pelvis, [0.5,0,0], [1,1.5,3], [PI,0,0] );
  
  p.leftCalf = addLimb( p.leftThigh, [0,0,3], [1,1,3] );
  p.rightCalf = addLimb( p.rightThigh, [0,0,3], [1,1,3] );
  
  p.leftFoot = addLimb( p.root, [-0.7,0,0], [1,0.5,1.5], [rad(-95),-0.1,0] );
  p.rightFoot = addLimb( p.root, [0.7,0,0,0], [1,0.5,1.5], [rad(-95),0.1,0] );
  
  p.leftUpperArm = addLimb( p.chest, [-1.5,0,2], [1,1,2], [PI,0,0] );
  p.rightUpperArm = addLimb( p.chest, [1.5,0,2], [1,1,2], [PI,0,0] );
  
  p.leftLowerArm = addLimb( p.leftUpperArm, [0,0,2], [0.7,0.7,2] );
  p.rightLowerArm = addLimb( p.rightUpperArm, [0,0,2], [0.7,0.7,2] );
  
  p.leftHand = addLimb( p.leftLowerArm, [0,0,2], [1,0.5,1.0], [0,0,PI/2] );
  p.rightHand = addLimb( p.rightLowerArm, [0,0,2], [1,0.5,1.0], [0,0,PI/2] );

  return p;
}

