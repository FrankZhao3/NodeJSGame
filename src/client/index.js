import {startGame} from './game.js'

const playButton = document.getElementById('play-button');
const usernameInput = document.getElementById('username-input');
// init socket

playButton.onclick = () => {
  // Play!
  console.log("Username: ", usernameInput.value);
  console.log(usernameInput.value);
  // notify server to start the game

  startGame(usernameInput.value);

};

