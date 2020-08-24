
function attackCurve(frame, wait, strike, hold, recover) {
  if ( frame < wait ) return 0;
  let t1 = wait;
  let t2 = wait + strike + hold;
  if ( frame < t2 ) return smoothstep( t1, t1 + strike, frame );
  return smoothstep( t2 + recover, t2, frame );
}

function positionInstance( name, x, y, z ) {
  instances[name].pos = [x, y, z];
}

function placeInstance( name, x, y, z, rx, ry, rz ) {
  instances[name].pos = [x, y, z];
  instances[name].rot = [rx, ry, rz];
}

function lerpInstance( name, x, y, z, rx, ry, rz, f ) {
  f = f || 0.2;
  instances[name].pos = lerpVector( instances[name].pos, [x, y, z], f );
  instances[name].rot = lerpVector( instances[name].rot, [rx, ry, rz], f );
}

function rotateInstance( name, rx, ry, rz ) {
  instances[name].rot = [rx, ry, rz];
}

function rotateLerpInstance( name, rx, ry, rz, f ) {
  f = f || 0.2;
  instances[name].rot = lerpVector( instances[name].rot, [rx, ry, rz], f );
}

function getInstanceAxes( name ) {
  return m4_extractDirections(instances[name].mtxs);
}




function lerpArmPoses(person, left, right) {
  let flip = 1;
  let lu, ll, lh, ru, rl, rh;
  if ( person.facingRight ) {
    lu = person.leftUpperArm;
    ll = person.leftLowerArm;
    lh = person.leftHand;
    ru = person.rightUpperArm;
    rl = person.rightLowerArm;
    rh = person.rightHand;
  } else {
    flip = -1;
    lu = person.rightUpperArm;
    ll = person.rightLowerArm;
    lh = person.rightHand;
    ru = person.leftUpperArm;
    rl = person.leftLowerArm;
    rh = person.leftHand;
  }

  // [ upperX, upperY, upperZ, lowerX, handX, handY ]
  rotateLerpInstance(lu, left[0], flip * left[1], flip * left[2]);
  rotateLerpInstance(ll, left[3], 0, 0);
  rotateLerpInstance(lh, flip * left[4], flip * left[5], PI2);
  instances[lh].pos = [0,0,2];

  rotateLerpInstance(ru, right[0], flip * right[1], flip * right[2]);
  rotateLerpInstance(rl, right[3], 0, 0);
  rotateLerpInstance(rh, flip * right[4], flip * right[5], PI2);
  instances[rh].pos = [0,0,2];
}

function setStance(person, pelvis, leftFoot, rightFoot, spine, chest, f) {
  let flip = 1;
  let swapLeft, swapRight;
  if ( person.facingRight ) {
    swapLeft = leftFoot;
    swapRight = rightFoot;
  } else {
    flip = -1;
    swapLeft = rightFoot;
    swapRight = leftFoot;
  }
  f = f || 0.3;
  lerpInstance(person.pelvis, pelvis[0], pelvis[1], pelvis[2], pelvis[3], flip * pelvis[4], flip * pelvis[5], f);
  lerpInstance(person.leftFoot, flip*swapLeft[0], swapLeft[1], swapLeft[2], swapLeft[3], flip * swapLeft[4], swapLeft[5], f);
  lerpInstance(person.rightFoot, flip*swapRight[0], swapRight[1], swapRight[2], swapRight[3], flip * swapRight[4], swapRight[5], f);

  rotateLerpInstance(person.spine, spine[0] || 0, flip*spine[1] || 0, flip*spine[2] || 0, f );
  rotateLerpInstance(person.spine, chest[0] || 0, flip*chest[1] || 0, flip*chest[2] || 0, f );
} 

function placeHands(person, left, right) {
  let flip = 1;
  let lh, rh;
  if ( person.facingRight ) {
    lh = person.leftHand;
    rh = person.rightHand;
  } else {
    flip = -1;
    lh = person.rightHand;
    rh = person.leftHand;
  }
  if (left) {
    instances[lh].pos = [ left[0], left[1], left[2] ];
    instances[lh].rot = [ left[3], left[4], left[5] ];
  }
  if (right) {
    instances[rh].pos = [ right[0], right[1], right[2] ];
    instances[rh].rot = [ right[3], right[4], right[5] ];
  }
}








function idle(person) {
  let input = person.buffer[0];
  if( input & keysHeldDown ) {
    return setPlayerState(person, crouching);
  }

  if ( input & keysHeldLeft ) {
    return setPlayerState(person, backWalking);
  }

  if ( input & ( keysHeldRight | keysHeldUp ) ) {
    return setPlayerState(person, forwardWalking);
  }

  if ( input & keysPunch ) {
    return setPlayerState(person, standingLightPunch);
  }

  if ( input & keysKick ) {
    return setPlayerState(person, standingLightKick);
  }

  pushCollider( person.index, person.root, 0, 0, 5, 3, 3, 10 );

  let axes = getInstanceAxes(person.root);

  let t = person.frame / 30;

  let swayPosition = cos( t + 0.3 + PI/2) * 0.4
  let swayAngle = cos( t + 0.7 + PI/2) * -0.2;
  let height = 5.2 + sin( t * 2 ) * 0.3;
  let twist = sin( t + 0.7 ) * 0.1;

  setStance( person, 
    [0, swayPosition, height, 0, swayAngle, rad(60) + twist],
    [-1.5, -1.5, 0, flatFoot, -0.2, 0],
    [1.5, 2, 0, flatFoot, 0.9, 0],
    [0, -swayAngle], []
  );

  lerpArmPoses(person, 
    [rad(180), rad(-30), rad(-30), rad(-120), rad(30), rad(-20)],
    [rad(180), rad(30), rad(-40), rad(-120), rad(-30), rad(-20)]
  );

  person.ik = [1, 1, 0, 0];
}

function forwardWalking(person) {
  let input = person.buffer[0];
  if ( !(input & ( keysHeldRight | keysHeldUp | keysHeldDown ) ) ) {
    return setPlayerState( person, idle );
  }

  pushCollider( person.index, person.root, 0, 0, 5, 3, 3, 10 );

  let t = person.frame / -10;

  let [tx, ty, tz] = m4_extractDirections( instances[person.root].mtxs );
  tx[2] = 0;
  ty[2] = 0;
  if ( input & keysHeldRight ) {
    instances[person.root].pos = addScaledVectors( instances[person.root].pos, 1, ty, -0.1 );
  } 
  if ( input & keysHeldUp ) {
    instances[person.root].pos = addScaledVectors( instances[person.root].pos, 1, tx, -0.2 );
  }
  if ( input & keysHeldDown ) {
    instances[person.root].pos = addScaledVectors( instances[person.root].pos, 1, tx, 0.2 );
  }

  let sway = sin(t+0.2)*0.05;
  setStance( person, 
    [0, 0, 5.2-sin(t*2)*0.2, 0.1, sway, rad(40)],
    [-0.6, -cos(t)*2+0.2, max(0,sin(t))*0.25,   flatFoot, -0.5, 0],
    [0.6, -cos(t+PI)*2+0.3, max(0,sin(t+PI))*0.25,   flatFoot, 0.9, 0],
    [0.2, -sway], [-0.2]
  );

  lerpArmPoses(person, 
    [rad(180), rad(-20), rad(-10), rad(-130 + sin(t)*15), rad(30), rad(-20)],
    [rad(180), rad(20), rad(-10), rad(-130 + cos(t)*5), rad(-30), rad(-20)]
  );
}


function backWalking(person) {
  let input = person.buffer[0];
  if ( !(input & keysHeldLeft) ) {
    return setPlayerState( person, idle );
  }

  pushCollider( person.index, person.root, 0, 0, 5, 3, 3, 10 );

  let t = person.frame / 10;

  let [tx, ty, tz] = m4_extractDirections( instances[person.root].mtxs );
  tx[2] = 0;
  ty[2] = 0;
  instances[person.root].pos = addScaledVectors( instances[person.root].pos, 1, ty, 0.1 );

  if ( input & keysHeldUp ) {
    instances[person.root].pos = addScaledVectors( instances[person.root].pos, 1, tx, -0.2 );
  }
  if ( input & keysHeldDown ) {
    instances[person.root].pos = addScaledVectors( instances[person.root].pos, 1, tx, 0.2 );
  }


  setStance( person, 
    [0, 0.5, 5.0-sin(t*2)*0.2, 0, 0, rad(40)],
    [-1, -cos(t)*2, max(0,sin(t)),   flatFoot, -0.6, 0],
    [1, -cos(t+PI)*2, max(0,sin(t+PI)),   flatFoot, 0.8, 0],
    [0.2], [-0.3]
  );

  lerpArmPoses(person, 
    [rad(160), rad(10), rad(-10), rad(-120), rad(30), rad(-20)],
    [rad(160), rad(30), rad(-90), rad(-90), rad(-30), rad(-20)]
  );
}

function crouching(person) {
  let input = person.buffer[0];
  if( !(input & keysHeldDown) ) {
    return setPlayerState(person, idle);
  }

  pushCollider( person.index, person.root, 0, 0, 3, 3, 3, 6 );

  let t = person.frame / 6;
  let height = 2.7 + sin(t) * 0.15;
  let sway = cos(t - 0.7) * 0.1;

  setStance( person, 
    [0, 1 + sway, height, 0, 0, rad(40)],
    [-1.5, -1.5, 0, flatFoot, -0.6, 0],
    [1.5, 2, 0, flatFoot, 1.2, 0],
    [0.2], [-0.3]
  );

  lerpArmPoses(person, 
    [rad(120), rad(10), rad(-10), rad(-120), rad(30), rad(-20)],
    [rad(140), rad(90), rad(-90), rad(-90), rad(-30), rad(-20)]
  );

  person.ik = [1, 1, 0, 0];
}



function standingLightPunch(person) {
  if ( person.frame > 12 ) {
    return setPlayerState(person, idle);
  }

  pushCollider( person.index, person.root, 0, -4.5, 8, 3, 5, 2 );
  
  let t = attackCurve( person.frame, 1, 3, 1, 8 );

  setStance( person, 
    [0, -t*1.5, 5.2-t*0.3, 0, 0, rad(70)],
    [-1.5, -1.5, 0, flatFoot, -0.2, 0],
    [1.5, 2, 0, flatFoot, 1.1, 0],
    [], []
  );

  lerpArmPoses(person, 
    [rad(90), rad(0), rad(0), rad(0), rad(30), rad(-20)],
    [rad(180), rad(30), rad(0), rad(-150), rad(-30), rad(50)]
  );

  placeHands(person, 
    [0, -3 - (5 * t), 8.7,   0, PI2, -PI2], 
    0
  );

  person.ik = [1, 1, 1, 0];
}

function standingLightKick(person) {
  if ( person.frame > 21 ) {
    return setPlayerState(person, idle);
  }

  pushCollider( person.index, person.root, 0, -5.5, 6, 3, 5, 7 );

  let t = attackCurve( person.frame, 5, 3, 5, 7 );
  let t2 = attackCurve( person.frame, 0, 3, 19, 3 );
  console.log(t2);

  setStance( person, 
    [0, -t*2.8, 5.2+t*0.3, t*-1.5, 0, rad(70 - t2*60)],
    [-1.5, -1.5-t*8, t*10, flatFoot - t*PI2, -0.2, 0],
    [1.5-t2*1.0, 2-t2*2.0, 0, flatFoot, 1.1-t2*0.7, 0],
    [t*0.7], [t*0.9], 0.7
  );

  lerpArmPoses(person, 
    [rad(180), rad(-30), rad(-30), rad(-30), rad(30), rad(50)],
    [rad(180 + t*60), rad(30), rad(0), rad(-30), rad(-30), rad(50)]
  );

  person.ik = [1, 1, 0, 0];
}
