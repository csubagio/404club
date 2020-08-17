

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
`what you're
looking for
doesn't exist
¯\\_(ツ)_/¯`,

`no seriously
go away
it's not safe
( ﾟ▽ﾟ)/`,

`fine it's
on your head
┌∩┐(ಠ_ಠ)┌∩┐`
]


let titleFade = -1;
let title = document.querySelector('#t');
let titleStep = 0;
let titleClickTime = 0;
title.addEventListener('click', () => {
  let dt = ( new Date - titleClickTime );
  if ( dt < 1000 ) {
    return;
  }
  if ( titleStep >= 2 ) { return; }
  titleStep += 1;
  applyTitleStep(titleStep);
  for ( let i=0; i<3; ++i ) {
    setTimeout( kick, i * 300 );
  }
  if ( titleStep >= 2 ) {
    titleFade = 6;
  }
  titleClickTime = new Date;
});

//DEBUG
title.style.display = 'none';
//ENDDEBUG

function applyTitleStep(step) {
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
