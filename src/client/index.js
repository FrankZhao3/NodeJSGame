import io from 'socket.io-client'

const socket = io(`ws://${window.location.host}`);

const playButton = document.getElementById('play-button');
const usernameInput = document.getElementById('username-input');

socket.on('connect', () => {
  console.log('Connected to server!');
  socket.emit('chat message', "a message");
});

Promise.all([
  
]).then(()=> {
  playButton.onclick = () => {
    // Play!
    console.log("Clicked!");
    console.log(usernameInput.value);
    socket.emit('chat message', usernameInput.value);
  };
}).catch(console.error);;
