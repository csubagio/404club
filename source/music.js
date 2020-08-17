let audioContext;
let audioMaster;

let audioMinGain = 0.01;
let audioMinFrequency = 0.001;

let kick;
let snare;
let hiHat;
let audioNoiseBuffer;

function generateNoise() {
  let length = 4096;
  let buf = audioContext.createBuffer(1, length, audioContext.sampleRate);
  let data = buf.getChannelData(0);
  for (var i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  audioNoiseBuffer = buf;
}

function setupAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext);
  audioMaster = audioContext.createGain();
  audioMaster.connect( audioContext.destination );

  let wait = 0.15;
  let power = 0.05;
  for ( let i=0; i<4; ++i ) {
    let delay = audioContext.createDelay();
    delay.delayTime.value = wait + Math.random() * 0.05;
    let delayGain = audioContext.createGain();
    delayGain.gain.value = power;
    wait += 0.15;
    power /= 2;
    delay.connect(delayGain);
    delayGain.connect(audioContext.destination);
    audioMaster.connect(delay);
  }

  let length = audioContext.sampleRate * 1.0;
  let buf = audioContext.createBuffer(1, length, audioContext.sampleRate);
  let data = buf.getChannelData(0);
  for (var i = 0; i < length; i++) {
    t = 1.0 * i / length;
    data[i] = Math.min( 1.0, Math.max( -1.0, 
      Math.tan( t * 270 ) * 0.1 + 
      Math.tan( t * 430 ) * 0.2 + 
      Math.tan( t * 100 ) * 0.2 + 
      ( Math.random() * 2 - 1 ) * 0.1
    )) * Math.pow( ( 1.0 - t ), 4.0 ) * 0.1;
  }

  let convolver = audioContext.createConvolver();
  convolver.buffer = buf;
  convolver.connect(audioContext.destination);
  //audioMaster.connect(convolver);

  generateNoise();
} 

function justOscillator(type, frequency) {
  let o = audioContext.createOscillator();
  o.type = type;
  o.frequency.value = frequency;
  return o;
}

function oscillator(type) {
  let o = audioContext.createOscillator();
  let g = audioContext.createGain();
  o.type = type;
  o.connect(g);
  g.connect(audioMaster);
  return [ o, g ];
}

function rampingGain( startTime, startValue, endTime, endValue ) {
  let g = audioContext.createGain();
  rampParam( g.gain, startTime, startValue, endTime, endValue );
  g.connect( audioMaster );
  return g;
}

function rampParam( param, startTime, startValue, endTime, endValue ) {
  param.setValueAtTime(startValue, startTime);
  param.exponentialRampToValueAtTime(endValue, endTime);
}

function fireGenerator( osc, startTime, endTime ) {
  osc.start( startTime );
  osc.stop( endTime );
}

function setupKick() {
  if ( !audioContext ) {
    setupAudio();
  }

  kick = () => {
    let [tri, trigain] = oscillator('triangle');
    let [sine, sinegain] = oscillator('sine');
  
    let start = audioContext.currentTime;
    let end = start + 0.1;
    rampParam( trigain.gain, start, 1.5, end, audioMinGain );
    rampParam( tri.frequency, start, 120, end, audioMinFrequency );
    rampParam( sinegain.gain, start, 2, end, audioMinGain );
    rampParam( sine.frequency, start, 50, end, audioMinFrequency );
    fireGenerator(tri, start, end);
    fireGenerator(sine, start, end);
  };

  kick();
}
kick = setupKick;

function setupSnare() {
  if ( !audioContext ) {
    setupAudio();
  }

  snare = () => {
    let start = audioContext.currentTime;
    let end = start + 0.2;

    let node = audioContext.createBufferSource();
    node.buffer = audioNoiseBuffer;
    node.loop = true;

    let filter = audioContext.createBiquadFilter();
    filter.type = "highpass";
    rampParam( filter.frequency, start, 100, end, 1000 );
    node.connect( filter );
    let filterGain = rampingGain( start, 0.7, end, audioMinGain );
    filter.connect( filterGain );

    let [tri, trigain] = oscillator('triangle');
    rampParam( trigain.gain, start, 1, end, audioMinGain );
    rampParam( tri.frequency, start, 120, end, audioMinFrequency );

    fireGenerator(node, start, end);
    fireGenerator(tri, start, end);
  }

  snare();
}
snare = setupSnare;


function setupHiHat() {
  if ( !audioContext ){
    setupAudio();
  }

  hiHat = () => {
    let start = audioContext.currentTime;
    let end = start + 0.05;

    let gain = rampingGain( start, 1, end, audioMinGain );
    gain.connect( audioMaster );    

    var highpass = audioContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 7000;
    highpass.connect(gain);
  
    let bandpass = audioContext.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 10000;
    bandpass.connect(highpass);
  
    let fundamental = 40;
    let ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];
    
    ratios.forEach( (ratio) => {
      let osc = justOscillator('square', fundamental * ratio);
      osc.connect( bandpass );
      fireGenerator(osc, start, end);
    });
  }

  hiHat();
}
hiHat = setupHiHat;


let synthOn;
let synthOff = () => {};
function setupSynth( frequency ) {
  if ( !audioContext ) {
    setupAudio();
  }

  let oscs = [];
  let gains = [];
  let playing = false;

  synthOn = ( frequency ) => {
    synthOff();
    playing = true;

    let gain = audioContext.createGain();
    gains.push(gain);
    gain.connect(audioMaster);

    let ratios = [0.5, 1];
    for ( r of ratios ) {
      console.log(frequency);
      let osc = justOscillator( (ratios == 1 ? "sawtooth" : "square"), frequency * r );
      osc.connect(gain);
      osc.start(audioContext.currentTime);
      oscs.push(osc);

      /*
      let lfo = justOscillator('triangle', 0.5);
      let lfoGain = audioContext.createGain();
      lfoGain.gain.value = 5;
      lfo.connect( lfoGain );
      lfoGain.connect( osc.frequency );
      lfo.start();
      oscs.push( lfo );
      */
    }
    oscs[1].detune = 0.5;
  }

  synthOff = () => {
    if ( !playing ) { return; }
    playing = false;
    let end = audioContext.currentTime + 0.2;
    oscs.forEach( o => o.stop(end) );
    gains.forEach( g => g.gain.exponentialRampToValueAtTime(audioMinGain, end) );
    oscs = [];
    gains = [];
  }

  synthOn( frequency );
}
synthOn = setupSynth;



let musicTime = 0;
let beatDuration = 0.25;
let measureDuration = beatDuration * 16;
let lastBeat = 0;
let musicPlaying = false;

let drumLines = [];
(function() {
  for ( let i=0; i<3; ++i ) {
    let d = [ [], [], [] ];
    drumLines.push(d);
  }
  let ds = drumLines;
  
  for ( let beat=0; beat<16; ++beat ) {
    ds[0][2][beat] = 1;
    ds[1][2][beat] = 1;
    
    if ( (beat % 2) == 0 ) {
      ds[1][0][beat] = 1;
    }
    if ( (beat % 4) == 0 ) {
      ds[0][0][beat] = 1;
      ds[2][0][beat] = 1;
      ds[2][2][beat] = 1;
    }
    if ( (beat % 8) == 0 ) {
      ds[0][1][beat] = 1;
    }
    if ( beat >= 13 ) {
      ds[1][1][beat] = 1;
    }
    if ( beat == 15 ) {
      ds[2][1][beat] = 1;
    }
  }
})();

let drumLine = drumLines[2]; 

function tickMusic(dt) {
  if ( musicPlaying ) {
    musicTime += dt;
    if ( musicTime > measureDuration ) {
      musicTime = musicTime % measureDuration;
      drumLine = drumLines[Math.floor( Math.random() * drumLines.length )];
    } 
    let beat = Math.floor( musicTime / beatDuration );
    if ( beat != lastBeat ) {
      if ( drumLine[0][beat] ) { kick(); }
      if ( drumLine[1][beat] ) { snare(); }
      if ( drumLine[2][beat] ) { hiHat(); }
      lastBeat = beat;
    }
  }
//DEBUG
  if ( inputPressed['0'] ) {
    kick();
  }
  if ( inputPressed['9'] ) {
    snare();
  }
  if ( inputPressed['8'] ) {
    hiHat();
  }

  if ( inputPressed['4'] ) {
    synthOn(frequencies[12]);
  } 
  if ( inputPressed['5'] ) {
    synthOn(frequencies[13]);
  }
  if ( inputPressed['6'] ) {
    synthOn(frequencies[14]);
  }
  if ( inputPressed['7'] ) {
    synthOn(frequencies[15]);
  }
  
  if ( !inputKeys['4'] && !inputKeys['5'] && !inputKeys['6'] && !inputKeys['7'] ) {
    synthOff();
  }



  //ENDDEBUG
  if ( inputPressed['='] ) {
    musicPlaying = !musicPlaying;
  }
}

// c4 to c6
let frequencies = [
  261.63, // 0 c4
  277.18, // 1 c#
  293.66, // 2 d
  311.13, // 3 d#
  329.63, // 4 e
  349.23, // 5 f
  369.99, // 6 f#
  392.00, // 7 g
  415.30, // 8 g#
  440.00, // 9 a
  466.16, // 10 a#
  493.88, // 11 b
  523.25, // 12 c
  554.37, // 13 c#
  587.33, // 14 d
  622.25, // 15 d#
  659.25, // e
  698.46, // f
  739.99, // f#
  783.99, // g
  830.61, // g#
  880.00, // a
  932.33,
  987.77,
  1046.50,
  1108.73
]