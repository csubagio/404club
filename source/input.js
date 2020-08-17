
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

`everything is
fine, nothing
to see here
(　＾∇＾)`,

`what you're
looking for,
doesn't exist
¯\\_(ツ)_/¯`,

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

  if ( !person.crouch ) {
    let speed = 10;
    if ( !person.onGround ) {
      speed = 3;
    }
    if ( inputKeys[person.keys.left] ) {
      instances[person.root].pos[1] -= dt * speed;
    }
  
    if ( inputKeys[person.keys.right] ) {
      instances[person.root].pos[1] += dt * speed;
    }
  }

  if ( inputKeys[person.keys.up] && person.onGround ) {
    person.velocity[1] = 0;
    person.velocity[2] = 60;
    if ( inputKeys[person.keys.right] ) {
      person.velocity[1] = 15;
    } else if ( inputKeys[person.keys.left] ) {
      person.velocity[1] = -15;
    }
  }

  person.crouch = false;
  if ( inputKeys[person.keys.down] && person.onGround ) {
    person.crouch = true;
  }
}
