
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
  let q = (a,b,c,d) => quad( verts, [ points[a], points[b], points[c], points[d] ] );
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
let limbColor = [0.5,0.3,1];
let skinColor = [1,1,1];
function addLimb(color, parent, pos, scale, rot) {
  let i = makeInstance( limbGeometry, pos, rot, scale );
  instances[i].prn = parent;
  instances[i].clr = color;
  return i;  
}




let flatFoot = rad(100);

function makePerson(index){ 
  let p = {};

  p.index = index;
  p.root = makeInstance(null);

  p.pelvis = addLimb( limbColor, p.root, [0,0,6], [2,1,1] );
  p.spine = addLimb( limbColor, p.pelvis, [0,0,1], [2,1,1] );
  p.chest = addLimb( limbColor, p.spine, [0,0,1], [2,1,2] );
  p.head = addLimb( skinColor, p.chest, [0,0,2], [1.7,1.5,2] );
  
  p.leftThigh = addLimb( limbColor, p.pelvis, [-0.5,0,0], [1,1.5,3], [PI,0,0] );
  p.rightThigh = addLimb( limbColor, p.pelvis, [0.5,0,0], [1,1.5,3], [PI,0,0] );
  
  p.leftCalf = addLimb( skinColor, p.leftThigh, [0,0,3], [1,1,3] );
  p.rightCalf = addLimb( skinColor, p.rightThigh, [0,0,3], [1,1,3] );
  
  p.leftFoot = addLimb( skinColor, p.root, [-0.7,0,0], [1,0.5,1.5], [flatFoot,-0.1,0] );
  p.rightFoot = addLimb( skinColor, p.root, [0.7,0,0,0], [1,0.5,1.5], [flatFoot,0.1,0] );
  
  p.leftUpperArm = addLimb( limbColor, p.chest, [-1.5,0,2], [1,1,2], [PI,0,0] );
  p.rightUpperArm = addLimb( limbColor, p.chest, [1.5,0,2], [1,1,2], [PI,0,0] );
  
  p.leftLowerArm = addLimb( skinColor, p.leftUpperArm, [0,0,2], [0.7,0.7,2] );
  p.rightLowerArm = addLimb( skinColor, p.rightUpperArm, [0,0,2], [0.7,0.7,2] );
  
  p.leftHand = addLimb( skinColor, p.leftLowerArm, [0,0,2], [1,0.5,1.0], [0,0,PI/2] );
  p.rightHand = addLimb( skinColor, p.rightLowerArm, [0,0,2], [1,0.5,1.0], [0,0,PI/2] );

  p.keys = {};

  p.velocity = [0,0,0];

  p.crouch = false;
  p.onGround = true;
  p.facingRight = true;
  p.pelvisHeight = 5;
  p.pelvisAdvance = 0;

  p.buffer = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

  p.state = idle;
  p.frame = 0;

  // ik enabled, feet left right, hands left right
  p.ik = [ 1, 1, 0, 0 ];

  return p;
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
  let span = subtractVectors( from, to );
  let len3 = vectorLength( span );
  // solve for triangle angle using 3 lengths
  let angle = 0.01;
  let maxDistance = (len1 + len2) * 0.999;
  if ( len3 < maxDistance ) {
    angle = max( angle, acos( ( len1 * len1 + len3 * len3 - len2 * len2 ) / ( 2 * len1 * len3 ) ) );
  } else {
    // actually can't reach, so move the target bone back to max length
    to = addScaledVectors( to, 1, span, ( len3 - maxDistance ) / len3 );
    m4_setPosition( instances[target].mtx, to[0], to[1], to[2] );
  }
  
  ins1.mtx = lookAt( from, to, forward );
  ins1.mtx = m4_multiply( ins1.mtx, m4_xRotation(angle) );

  ins2.mtx = m4_translate( ins1.mtx, ins2.pos[0], ins2.pos[1], ins2.pos[2] );
  ins2.mtx = lookAt(  m4_extractPosition(ins2.mtx), to, forward );
 
  ins1.mtx = m4_scale( ins1.mtx, bone1Scale[0], bone1Scale[1], bone1Scale[2] );
  ins2.mtx = m4_scale( ins2.mtx, bone2Scale[0], bone2Scale[1], bone2Scale[2] );
}

function getMirroredIK( person ) {
  let ik = person.ik;
  if( person.facingRight ) {
    return ik;
  }
  return [ik[1], ik[0], ik[3], ik[2]];
}

function applyIK( person, target ) {
  // fixup each leg
  let x, y, z, facingVector;
  let ik = getMirroredIK(person);

  if ( ik[0] ) {
    [x, y, z] = m4_extractDirections( instances[person.leftFoot].mtxs );
    facingVector = negate(z);
    solveIk(person.leftThigh, person.leftCalf, person.leftFoot, facingVector);
  }

  if ( ik[1] ) {
    [x, y, z] = m4_extractDirections( instances[person.rightFoot].mtxs );
    facingVector = negate(z);
    solveIk(person.rightThigh, person.rightCalf, person.rightFoot, facingVector);
  }

  if ( ik[2] ) {
    [x, y, z] = m4_extractDirections( instances[person.leftHand].mtxs );
    facingVector = negate(x);
    solveIk(person.leftUpperArm, person.leftLowerArm, person.leftHand, facingVector);
  } 

  if ( ik[3] ) {
    [x, y, z] = m4_extractDirections( instances[person.rightHand].mtxs );
    facingVector = negate(x);
    solveIk(person.rightUpperArm, person.rightLowerArm, person.rightHand, facingVector);
  } 

  // point head at other head
  instances[person.head].mtx = m4_multiply( 
    m4_multiply( 
      lookAt( 
        m4_extractPosition(instances[person.head].mtx),
        m4_extractPosition(instances[target.head].mtx),
        up  
      ),
      m4_xRotation( -PI2 )
    ),
    m4_scaling.apply(null, instances[person.head].scl)
  );
}

function orientPlayers() {
  // figure out direction from one to other
  let span = subtractVectors( instances[player1.root].pos, instances[player2.root].pos );
  let distance = vectorLength( span );
  span[0] /= distance;
  span[1] /= distance;
  
  // keep at least min distance away
  if ( distance < 4 ) {
    let correction = ( 4 - distance ) / 2;
    instances[player1.root].pos = addScaledVectors( instances[player1.root].pos, 1, span, correction);
    instances[player2.root].pos = addScaledVectors( instances[player2.root].pos, 1, span, -correction);
  }
  
  // face each other
  let angle = Math.atan2( -span[0], span[1] );
  if ( !player1.crouch ) {
    instances[player1.root].rot[2] = angle;
  }
  if ( !player2.crouch ) {
    instances[player2.root].rot[2] = PI + angle;
  }
}

function setPlayerState( person, newState ) {
  person.state = newState;
  person.frame = 0;
  person.state( person );
}

function updatePlayer( person ) {
  let axes = getInstanceAxes(person.root);
  person.facingRight = dot( axes[1], combatLine ) < 0;
  person.frame += 1;
  person.state( person );
  let ik = getMirroredIK( person );
  instances[person.leftHand].prn = ik[2] ? person.root : person.leftLowerArm;
  instances[person.rightHand].prn = ik[3] ? person.root : person.rightLowerArm;
}