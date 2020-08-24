console.log("hello, we're still in debug");

let canvas = document.createElement('canvas');
document.body.append(canvas);

let screenWidth, screenHeight;

function windowResized() {
  screenWidth = canvas.clientWidth;
  screenHeight = canvas.clientHeight;
  canvas.width = screenWidth;
  canvas.height = screenHeight;
}

window.onresize = windowResized;
windowResized();

let gl = canvas.getContext("webgl", {
  antialising: true,
  premultipliedAlpha: false
});
