import io from 'socket.io-client'
import './game.js'
import {onSocketConnection} from './networking.js'
import { Utils } from 'phaser';
const socket = io(`ws://${window.location.host}`);

const playButton = document.getElementById('play-button');
const usernameInput = document.getElementById('username-input');

playButton.onclick = () => {
  // Play!
  
  console.log("Clicked!");
  socket.emit('chat message', "msg");
  console.log(usernameInput.value);
};

socket.on('chat message', (msg) => {
  console.log('Connected to server!' + msg);
});
