keysUp = 1;
keysDown = 1 << 1;
keysLeft = 1 << 2;
keysRight = 1 << 3;
keysPunch = 1 << 4;
keysKick = 1 << 5;
keysSpecial = 1 << 6;

keysHeldUp = 1 << (10+0);
keysHeldDown = 1 << (10+1);
keysHeldLeft = 1 << (10+2);
keysHeldRight = 1 << (10+3);
keysHeldPunch = 1 << (10+4);
keysHeldKick = 1 << (10+5);
keysHeldSpecial = 1 << (10+6);


let synth = window.speechSynthesis;
let speak = (text, voice) => {
  if ( !synth ) {
    return;
  }

  text = text.replace(/\s+/g, ' ');
  text = text.replace(/[^a-zA-Z,.?! ]*/g, '');
  let talk = new SpeechSynthesisUtterance(text);
  let voiceId = 0;
  let voices = synth.getVoices();
  if ( !voices || voices.length == 0 ) {
    return;
  }
  if ( voice ) { 
    for ( let i=0; i<voices.length; ++i ) {
      if ( voices[i].name.toLocaleLowerCase().indexOf(voice) >= 0 ) {
        voiceId = i;
        break;
      }
    }
  }
  talk.voice = voices[voiceId];
  synth.speak(talk);
}


let inputKeys = {};
let inputPressed = {};
document.body.addEventListener('keydown',(ev) => {
  if ( !inputKeys[ev.key] ) {
    inputPressed[ev.key] = true;
  }
  inputKeys[ev.key] = true;
});

document.body.addEventListener('keyup',(ev) => {
  inputKeys[ev.key] = false;
});

const titleScript = [
`please
do not 
click
`,

//`everything is
//fine, nothing
//to see here
//(　＾∇＾)`,

//`what you're
//looking for,
//doesn't exist
//¯\\_(ツ)_/¯`,

`please. 
go.
away.
( ⚆ _ ⚆ )`,

`no seriously,
go away,
it's not safe
\\( ﾟ▽ﾟ)/`,

`fine, 
it's on 
your head, then
┌∩┐(ಠ_ಠ)┌∩┐`
]


let titleFade = -100;
let title = document.querySelector('#t');
let titleStep = 0;
let titleClickTime = 0;
let titleBounce = 0;
let titleVelocity = 0;
title.addEventListener('click', (ev) => {
  let dt = ( new Date - titleClickTime );
  if ( dt < 1000 ) {
    return;
  }
  if ( titleStep >= titleScript.length - 1 ) { return; }
  titleStep += 1;
  let time = 0;
  for ( let i=0; i<1 + titleStep; ++i ) {
    setTimeout( kick, time );
    time += (450-titleStep*50) + Math.random() * 100;
  }
  titleBounce = ( titleStep * 3 + Math.random() ) * 0.2; 
  time += 500;
  title.innerHTML = '<i>404</i><p>\n\n\n\n</p>';
  setTimeout( () => {applyTitleStep(titleStep)}, time );
  if ( titleStep >= titleScript.length - 1 ) {
    titleFade = 8;
  }
  titleClickTime = new Date;
});

function tickTitle(time, dt) {
  if ( titleFade > 0 || titleBounce != 0 ) {

    if( titleFade > 0 ) {
      titleFade -= dt;
    } 

    let x = -50;
    let y = -50;
    titleVelocity += -titleBounce * 100 * dt;
    titleVelocity *= 0.95;
    titleBounce += titleVelocity * dt;
    x -= sin(time) * titleBounce;
    y += cos(time) * titleBounce;
    let transform = `translate(${x.toFixed(3)}%,${y.toFixed(3)}%)`;
    
    if ( titleFade > 0 ) {
      let t = smoothstep( 0, 4.5, titleFade );
      title.style.opacity = t;
      transform += ` scale(${4-3*t})`
    } else if ( titleFade != -100 ) {
      title.style.display = 'none';
      titleBounce = 0;
      //musicPlaying = true;

      speak( "The first rule of four oh four club, is you don't talk about four oh four club. Ready? FIGHT!", '日本' );
    }

    title.style.transform = transform;
  }
}

//DEBUG
//title.style.display = 'none';
//ENDDEBUG

function applyTitleStep(step) {
  speak( titleScript[step], 'uk' );
  title.innerHTML = `<i>404</i><p>${titleScript[step]}</p>`;
}
applyTitleStep(0);

let leftWall = -30;
let rightWall = 30;


function applyInput( person, dt ) {
  let input = 0;
  previous = person.buffer[0];
  let mapping = [0, 1, 2, 3, 4, 5, 6];
  if ( !person.facingRight ) {
    mapping = [0, 1, 3, 2, 4, 5, 6];
  }

  for (let i=0; i<=6; ++i ) {
    if ( inputKeys[person.keys[mapping[i]]] ) {
      input |= 1 << (10+i);
    }
    if ( inputPressed[person.keys[mapping[i]]] ) {
      input |= 1 << i;
    }
  }

  //input |= keysPunch;

  person.buffer.unshift( input );
  person.buffer.pop();
}


