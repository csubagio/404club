
const vertexShaderSource = 
`attribute vec3 pos;
attribute vec3 nrm;
uniform mat4 proj;
uniform mat4 view;
uniform mat4 world;
varying vec3 vnrm;
void main() {
  vnrm = (world * vec4( nrm.xyz, 0 )).xyz;
  gl_Position = proj * view * world * vec4( pos.xyz, 1 );
}`

const fragmentShaderSource = 
`precision mediump float;
varying vec3 vnrm;
uniform vec3 clr;
void main() {
  gl_FragColor=vec4(0,0,0,1);
  vec3 nrm = vnrm;
  vec3 col = clr;
  if ( !gl_FrontFacing ) {nrm = -nrm;}
  float i = 0.1;
  gl_FragColor.rgb += col * vec3(1.0,0.6,0.5) * i;
  i = max(0.0,dot(normalize(vec3(1,0.2,1)),nrm));
  gl_FragColor.rgb += col * vec3(1.0,0.6,0.5) * i;
  i = max(0.0,dot(normalize(vec3(-1,0.2,-0.3)),nrm));
  gl_FragColor.rgb += col * vec3(0.3,0.4,0.5) * i;
}
`

function createShader(type, source) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) { return shader; }
  console.log(gl.getShaderInfoLog(shader));
}

function createProgram(vertexShader, fragmentShader) {
  let program = gl.createProgram();
  let a = (s) => gl.attachShader(program, s);
  a(vertexShader);
  a(fragmentShader);
  gl.linkProgram(program);
  let success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) { return program; }
  console.log(gl.getProgramInfoLog(program));
}

function material(vertexSource, fragmentSource, attributeNames, uniformNames) {
  let vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
  let fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);
  let program = createProgram(vertexShader, fragmentShader);

  let attributes = {};
  for ( let name of attributeNames ) {
    attributes[name] = gl.getAttribLocation(program, name);
  }

  let uniforms = {};
  for ( let name of uniformNames ) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  return { program, attributes, uniforms };
}

let baseMaterial = material( vertexShaderSource, fragmentShaderSource, ['pos','nrm'], ['proj','view','world','clr'] );
