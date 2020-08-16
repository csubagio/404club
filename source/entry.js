
let player1 = makePerson();
limbColor = [0.4,1.0,0.5];
let player2 = makePerson();

instances[player1.root].pos[1] = -8;
instances[player2.root].pos[1] = 8;

player1.keys = { left: 'a', up: 'w', down: 's', right: 'd' };
player2.keys = { left: 'ArrowLeft', up: 'ArrowUp', down: 'ArrowDown', right: 'ArrowRight' };

mark1 = makeInstance(triangle, [0,leftWall,0], [0,0,0], [6,rightWall - leftWall,0]);
instances[mark1].clr = [1,1,1];


let time = 0;
let last = new Date;
let cameraPosition = [ 0, 1, 0 ];
let cameraFocus = [ 0, 0, 6 ];

let projectionMatrix = [];
let viewMatrix = [];
let cameraMatrix = [];

let uploadMatrix = (n,v) => gl.uniformMatrix4fv(n, false, v);

function calculateCamera(time) {
  projectionMatrix = perspective(rad(45), screenWidth/screenHeight, 0.1, 100);
  
  let p1 = m4_extractPosition( instances[player1.root].mtx );
  let p2 = m4_extractPosition( instances[player2.root].mtx );

  cameraFocus = addScaledVectors( p1, 0.5, p2, 0.5 );
  cameraFocus[2] += 6;

  let distance = Math.max( 20, vectorLength( subtractVectors(p1, p2) ) * 1.0 );
  let cameraPosition = [ cameraFocus[0] - distance, cameraFocus[1], cameraFocus[2] - 0.5 ];

  cameraMatrix = lookAt(cameraPosition, cameraFocus, up);
  // camera wants to look down negative z
  for ( let i=0; i<3; ++i ) {
    cameraMatrix[2*4+i] = -cameraMatrix[2*4+i];
  }
  //viewMatrix = m4_inverse(cameraMatrix);
}


function run( person, time ) {
  t = time * 3 + 0.1;
  instances[person.pelvis].pos[2] = 6 + abs(sin(t+2-PI/2));
  instances[person.pelvis].rot[0] = ( 0.5 + 0.5 * sin(t*2) ) * -0.1 + -0.1;
  instances[person.pelvis].rot[1] = sin(t) * 0.1;
  instances[person.chest].rot[0] = ( 0.5 + 0.5 * sin(t*2) ) * -0.4 + -0.3;
  instances[person.head].rot[0] = 0.4;

  t = time * 3;
  instances[person.leftThigh].rot[0] = lerp( PI+0.9, PI-0.4, sin(t) * 0.5 + 0.5 );
  instances[person.leftUpperArm].rot[0] = lerp( PI+0.9, PI-0.4, sin(t+PI) * 0.5 + 0.5 );
  t -= 1;
  instances[person.leftCalf].rot[0] = smoothstep(-1, 1, sin(t)) * -1.5;
  instances[person.leftLowerArm].rot[0] = smoothstep(-1, 1, sin(t)) * 1.5;

  t = time * 3 - PI;
  instances[person.rightThigh].rot[0] = lerp( PI+0.9, PI-0.4, sin(t) * 0.5 + 0.5 );
  instances[person.rightUpperArm].rot[0] = lerp( PI+0.9, PI-0.4, sin(t+PI) * 0.5 + 0.5 );
  t -= 1;
  instances[person.rightCalf].rot[0] = smoothstep(-1, 1, sin(t)) * -1.5;
  instances[person.rightLowerArm].rot[0] = smoothstep(-1, 1, sin(t)) * 1.5;
}

function idle(person, time, dt) {
  time = time * 2;

  if ( person.crouch ){
    person.pelvisHeight += ( 2.7 - person.pelvisHeight ) * 0.2;
    person.pelvisAdvance += ( -1 - person.pelvisAdvance ) * 0.2;
  } else {
    person.pelvisHeight += ( 5.2 - person.pelvisHeight ) * 0.2;
    person.pelvisAdvance += ( 0 - person.pelvisAdvance ) * 0.2;
  } 

  instances[person.pelvis].pos[1] = person.pelvisAdvance;
  
  // bob up and down
  instances[person.pelvis].pos[2] = person.pelvisHeight + sin( time * 2 ) * 0.3;

  // twist
  instances[person.pelvis].rot[2] = 0.5 + sin( time + 0.7 ) * 0.1;
  
  // sway
  instances[person.pelvis].pos[0] = cos( time + 0.3 + PI/2) * 0.4;
  let swayAngle = cos( time + 0.7 + PI/2) * -0.2;
  instances[person.pelvis].rot[1] = swayAngle;
  
  // counter sway
  instances[person.spine].rot[1] = -swayAngle;

  instances[person.leftFoot].pos[0] = -1.5;
  instances[person.leftFoot].pos[1] = -2;
  instances[person.rightFoot].pos[0] = 1.5;
  instances[person.rightFoot].pos[1] = 0.5;

  instances[person.leftFoot].rot[1] = -0.5;
  instances[person.rightFoot].rot[1] = 0.3;

  let armAngle = PI + 0.5 + sin(time*2-0.6) * 0.1;
  instances[person.leftUpperArm].rot[0] = armAngle
  instances[person.leftUpperArm].rot[2] = 0.9;
  instances[person.leftLowerArm].rot[0] = rad(120);

  instances[person.rightUpperArm].rot[0] = armAngle;
  instances[person.rightUpperArm].rot[2] = -0.25;
  instances[person.rightLowerArm].rot[0] = rad(120);

  if ( person.velocity[2] != 0 ) {
    person.velocity[2] -= dt * 140;
    instances[person.root].pos = addScaledVectors(
      instances[person.root].pos, 1, person.velocity, dt
    );
    if ( instances[person.root].pos[2] < 0 ) {
      instances[person.root].pos[2] = 0;
      person.velocity = [0,0,0];
    }
  }

  person.onGround = instances[person.root].pos[2] == 0;

  let pos = instances[person.root].pos;
  if ( pos[1] < leftWall ) { pos[1] = leftWall }
  if ( pos[1] > rightWall ) { pos[1] = rightWall }
}







let requestAnim = requestAnimationFrame;
tick = () => {
  let now = new Date;
  let dt = Math.min( now - last, 100 ) / 1000.0;
  last = now;
  time += dt;

  calculateCamera(time);

  gl.clearColor(0.1, 0.1, 0.15, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.viewport(0, 0, screenWidth, screenHeight);
  gl.cullFace(gl.FRONT_AND_BACK);
  gl.enable(gl.DEPTH_TEST);
  
  gl.useProgram(baseMaterial.program);
  
  uploadMatrix(baseMaterial.uniforms.view, m4_affine_inverse(cameraMatrix) );
  uploadMatrix(baseMaterial.uniforms.proj, projectionMatrix);
  
  let vectorAttribute = (name, offset) => {
    let id = baseMaterial.attributes[name];
    gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 6*4, offset);
    gl.enableVertexAttribArray(id);
  }
  vectorAttribute('pos', 0);
  vectorAttribute('nrm', 3*4);

  let t = 0;
  t = time * 1.5;

  if ( instances[player1.root].pos[1] < instances[player2.root].pos[1] ) {
    instances[player1.root].rot[2] = 0;
    instances[player2.root].rot[2] = PI;
  } else {
    instances[player1.root].rot[2] = PI;
    instances[player2.root].rot[2] = 0;
  }

  //run(player1, t);
  //run(player2, t + 0.7);

  applyInput(player1, dt);
  applyInput(player2, dt);

  // update local transforms
  idle(player1, t + 1.2, dt);
  idle(player2, t, dt);

  // calculate hierarchies
  for ( let ins of instances ) {
    let matrix;
    if (ins.prn != null) {
      matrix = m4_translate(instances[ins.prn].mtxs, ins.pos[0], ins.pos[1], ins.pos[2]);
    } else {
      matrix = m4_translation(ins.pos[0], ins.pos[1], ins.pos[2]);
    }
    matrix = m4_xRotate(matrix, ins.rot[0]);
    matrix = m4_yRotate(matrix, ins.rot[1]);
    matrix = m4_zRotate(matrix, ins.rot[2]);
    ins.mtxs = matrix.slice();
    matrix = m4_scale(matrix, ins.scl[0], ins.scl[1], ins.scl[2]);
    ins.mtx = matrix;
  }

  // patch up procedurals
  applyIK(player1, player2);
  applyIK(player2, player1);

  // render every instance
  for ( let ins of instances ) {
    if ( ins.geo ) {
      gl.bindBuffer(gl.ARRAY_BUFFER, ins.geo.buf);
      vectorAttribute('pos', 0);
      vectorAttribute('nrm', 3*4);
      gl.uniform3fv(baseMaterial.uniforms.clr, ins.clr)
      uploadMatrix(baseMaterial.uniforms.world, ins.mtx);
      gl.drawArrays(gl.TRIANGLES, 0, ins.geo.cnt);
    }
  }

  if ( titleFade > 0 ) {
    titleFade -= dt;
    if ( titleFade > 0 ) {
      let t = smoothstep( 0, 4.5, titleFade );
      title.style.opacity = t;
      title.style.transform = `translate(-50%,-50%) scale(${4-3*t})`
    } else {
      title.style.display = 'none';
    }
  }

  requestAnim(tick);
}
requestAnim(tick);

