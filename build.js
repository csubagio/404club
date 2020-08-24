const gulp = require('gulp');
const zip = require('gulp-zip');
const fs = require('fs');
const csso = require('csso');
const terser = require("terser");
const spawnSync = require('child_process').spawnSync;
const  _7z = require('7zip')['7z']
const path = require('path');




async function zip7(inputFilename, zipFilename) {
  let result = spawnSync(_7z, ['a', zipFilename, '-y', '-mx9', inputFilename]);
  if ( result.error ) {
    console.log( '' + result.error );
  }
  //console.log( '' + result.output );
}



async function buildCode( debugBuild ) {
  let source = {};

  let order = [
    'init.js',
    'music.js',
    'input.js',
    'math.js', 
    'material.js', 
    'geometry.js', 
    'colliders.js',
    'person.js',
    'states.js',
    'entry.js'
  ];

  for ( let i of order ) {
    source[i] = fs.readFileSync(`source/${i}`, 'utf8');
    if ( !debugBuild ) {
      source[i] = source[i].replace( /\/\/DEBUG[\s\S]*?\/\/ENDDEBUG/g, ' ' );
    }
  }

  var options = {
    mangle: {
      toplevel: true,
      properties: false
    },
    compress: {
      defaults: true,
      drop_console: !debugBuild,
      ecma: 8,
      keep_fargs: false,
      passes: 10,
      toplevel: true,
      unsafe: true,
      unsafe_arrows: true,
      unsafe_math: true
    },
    output: {
      ecma: 8
    },
    nameCache: {}
  };

  if ( debugBuild ) {
    options.sourceMap = {
      filename: 'debug.js',
      url: 'debug.js.map',
      root: './source',
    }
  }

  let js = await terser.minify(source, options);

  if ( !debugBuild ) {

    let propMangles = [
      'root',
      'pelvis',
      'spine',
      'chest',
      'head',
      'leftThigh',
      'rightThigh',
      'leftCalf',
      'rightCalf',
      'leftFoot',
      'rightFoot',
      'leftUpperArm',
      'rightUpperArm',
      'leftLowerArm',
      'rightLowerArm',
      'leftHand',
      'rightHand',
      'keys',
      'velocity',
      'crouch',
      'onGround',
      'pelvisHeight',
      'pelvisAdvance'
    ]

    for ( let i=0; i<propMangles.length; ++i ) {
      let prop = propMangles[i];
      let replacement = String.fromCharCode( 'a'.charCodeAt(0) + i );
      let test = new RegExp( '\\.' + prop, 'g' );
      js.code = js.code.replace( test, '.' + replacement );
    }

  }

  if ( js.warnings ) {
    console.warn( js.warnings );
  }

  if ( js.error ) {
    console.error( js.error );
    broken = true;
    return null;
  }

  return js;
}

async function build( debugBuild ) {
  let html = fs.readFileSync('source/index.html', 'utf8');

  let broken = false;

  let code = await buildCode(debugBuild);
  if ( code ) {
    html = html.replace("{{SCRIPTCONTENTS}}", code.code);
    if ( debugBuild ) {
      fs.writeFileSync('debug.js.map', code.map, 'utf8');
    }
  } else {
    broken = true;
  }
  
  let cssSource = fs.readFileSync('source/main.css', 'utf8');
  let css = csso.minify(cssSource);
  html = html.replace("{{CSSCONTENTS}}", `<style>${css.css}</style>`);

  let debugFile = path.join(__dirname, 'debug.html');
  let targetFile = path.join(__dirname, 'index.html');
  let targetZip = path.join(__dirname, '404CLUB.zip');

  if ( !broken ) {
    if ( debugBuild ) {
      fs.writeFileSync(debugFile, html, 'utf8');
    } else {
      fs.writeFileSync(targetFile, html, 'utf8');

      let complete = () => {
        let info = fs.statSync(targetZip);
        let p = info.size / 13312 * 100;
        let t = (new Date).toLocaleString();
        let report = `${t} zip size: ${info.size}b / 13312b, ${p.toFixed(2)}%`;
        console.log(report);
        fs.appendFileSync('history.log', report + '\n');
      }
     
      if ( process.platform == 'win32' ) {
        await zip7(
          path.normalize( targetFile ),
          path.normalize( targetZip )
        );
        complete();
      } else {
        gulp.src('index.html')
        .pipe(zip('404CLUB.zip'))
        .pipe(gulp.dest(__dirname))
        .on('end', complete);
      } 
    }
  }
}

//build();

const chokidar = require('chokidar');

let debounce = null;

const excludes = [ 'source/packed.js.map', 'source/site/index.html' ];

chokidar.watch('source').on('all', (event, path) => {
  path = path.replace(/\\/g, '/');
  console.log(event, path);
  if ( debounce ) { 
    return;
  }
  if ( excludes.find( s => s === path ) ) {
    return;
  }
  debounce = setTimeout( () => {
    build(true);
    build(false);
    debounce = null;
  }, 200 );
});