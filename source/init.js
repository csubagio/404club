console.log("hello, we're still in debug");

let canvas = document.createElement('canvas');
document.body.appendChild(canvas);

let screenWidth = canvas.clientWidth;
let screenHeight = canvas.clientHeight;
canvas.width = screenWidth;
canvas.height = screenHeight;

let gl = canvas.getContext("webgl");
