
window.player1 = makePerson(0);
limbColor = [0.4,1.0,0.5];
window.player2 = makePerson(1);

instances[player1.root].pos[1] = -8;
instances[player2.root].pos[1] = 8;


player1.keys = ['w', 's', 'a', 'd', 'v', 'b', 'n'];
player2.keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'p', '[', ']'];


let cameraPosition = [ 0, 1, 0 ];
let cameraFocus = [ 0, 0, 6 ];

let projectionMatrix = [];
let viewMatrix = [];
let cameraMatrix = [];
let cameraDirection = [];
let combatLine = [];

let uploadMatrix = (n,v) => gl.uniformMatrix4fv(n, false, v);

function calculateCamera() {
  let aspect = 1.0 * screenWidth/screenHeight;
  projectionMatrix = perspective(rad(60), aspect, 0.1, 300);
  
  let p1 = m4_extractPosition( instances[player1.root].mtx );
  let p2 = m4_extractPosition( instances[player2.root].mtx );

  combatLine = subtractVectors( p2, p1 );
  combatLine[2] = 0;
  combatLine = normalize( combatLine );

  let cameraDirection = [combatLine[1], -combatLine[0], 0];

  cameraFocus = addScaledVectors( p1, 0.5, p2, 0.5 );
  cameraFocus[2] += 6;

  let distance = Math.max( 30, vectorLength( subtractVectors(p1, p2) ) * 1.4 );
  cameraPosition = [ cameraFocus[0], cameraFocus[1], cameraFocus[2] - 0.5 ];
  cameraPosition = addScaledVectors( cameraPosition, 1, cameraDirection, -distance );

  cameraMatrix = lookAt(cameraPosition, cameraFocus, up);
  // camera wants to look down negative z
  for ( let i=0; i<3; ++i ) {
    cameraMatrix[2*4+i] = -cameraMatrix[2*4+i];
  }
  //viewMatrix = m4_inverse(cameraMatrix);
}




function runFrame() {
  let dt = 1.0 / 60;
  calculateCamera();

  gl.colorMask(true, true, true, true);
  gl.clearColor(0.1, 0.1, 0.15, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.colorMask(true, true, true, false);

  gl.viewport(0, 0, screenWidth, screenHeight);
  gl.cullFace(gl.FRONT_AND_BACK);
  gl.enable(gl.DEPTH_TEST);
  
  gl.useProgram(baseMaterial.program);
  
  uploadMatrix(baseMaterial.uniforms.view, m4_affine_inverse(cameraMatrix) );
  uploadMatrix(baseMaterial.uniforms.proj, projectionMatrix);
  
  vectorAttribute('pos', 0);
  vectorAttribute('nrm', 3*4);

  // cycle input buffers
  applyInput(player1, dt);
  applyInput(player2, dt);

  colliders = [ [], [] ];

  // update anims + logic
  updatePlayer(player1);
  updatePlayer(player2);
  
  orientPlayers();

  // calculate hierarchies
  for ( let ins of instances ) {
    let matrix;
    if (ins.prn != null) {
      matrix = m4_translate(instances[ins.prn].mtxs, ins.pos[0], ins.pos[1], ins.pos[2]);
    } else {
      matrix = m4_translation(ins.pos[0], ins.pos[1], ins.pos[2]);
    }
    matrix = m4_zRotate(matrix, ins.rot[2]);
    matrix = m4_xRotate(matrix, ins.rot[0]);
    matrix = m4_yRotate(matrix, ins.rot[1]);
    ins.mtxs = matrix.slice();
    matrix = m4_scale(matrix, ins.scl[0], ins.scl[1], ins.scl[2]);
    ins.mtx = matrix;
  }

  // patch up procedurals
  applyIK(player1, player2);
  applyIK(player2, player1);
}



let last = 0;
let accumulator = 0;
let requestAnim = requestAnimationFrame;
tick = (now) => {
  // fixed time step
  
  // every callback we accumulate elapsed time
  dt = Math.min( 100, now - last );
  last = now;
  accumulator += dt;
  dt /= 1000;

  let time = now / 1000;

  // we move as many logic updates forward as we can
  let oneTick = 1000 / 60;
  while ( accumulator > oneTick ) {
    runFrame()
    accumulator -= oneTick;
  }

  // then render once 

  // render every instance
  for ( let ins of instances ) {
    if ( ins.geo ) {
      gl.bindBuffer(gl.ARRAY_BUFFER, ins.geo.buf);
      vectorAttribute('pos', 0);
      vectorAttribute('nrm', 3*4);
      gl.uniform3fv(baseMaterial.uniforms.clr, ins.clr)
      gl.uniform3fv(baseMaterial.uniforms.glow, ins.glow)
      uploadMatrix(baseMaterial.uniforms.world, ins.mtx);
      gl.drawArrays(gl.TRIANGLES, 0, ins.geo.cnt);
      //gl.drawArrays(gl.LINES, 0, ins.geo.cnt);
    }
  }

  drawColliders();

  tickTitle(time, dt);
  tickMusic(dt);

  inputPressed = {};

//DEBUG
  //tickInputDebugger();
//ENDDEBUG

  requestAnim(tick);
}
requestAnim(tick);


//DEBUG
let inputDebugger = document.createElement('div');
document.body.append( inputDebugger );
(function() {
  let s = inputDebugger.style;
  s.position = 'absolute';
  s.left = '0';
  s.top = '0';
  s.background = '#000';
  s.color = '#fff';
  s.padding = '0.5em';
  s.font = '16px monospace';
})();
function tickInputDebugger() {
  inputDebugger.innerText = player1.buffer.join(', ');
}
//ENDDEBUG

