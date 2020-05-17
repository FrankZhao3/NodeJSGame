import {startGame} from './game.js'
import '.././css/game.css';

const playButton = document.getElementById('play-button');
const usernameInput = document.getElementById('username-input');
// init socket

playButton.onclick = () => {
  // Play!
  console.log("Username: ", usernameInput.value);
  console.log(usernameInput.value);
  // notify server to start the game
  if(usernameInput.value.length >= 3 && usernameInput.value.length <= 8) {
    startGame(usernameInput.value);
    // playButton.classList.add('hidden');
  }
  else {
    alert(`Username must greater than 3 and less than 8`);
  }
};

