const express = require('express');
const socketio = require('socket.io');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const config = require('../../webpack.dev.config.js');

// Setup an Express server
const app = express();
app.use(express.static('public'));

// Setup Webpack for development
if (process.env.NODE_ENV === 'development') {
  // Setup Webpack for development
  const compiler = webpack(config);
  app.use(webpackDevMiddleware(compiler));
} else {
  // Static serve the dist/ folder in production
  app.use(express.static('dist'));
}

// Listen on port
const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

// Setup socket.io
const io = socketio(server);
const initChairNum = 15;

var playerPosLst = [];
var chairPosLst = [];

// Listen for socket.io connections
io.on('connection', (socket) => {
  console.log('Player connected!', socket.id);
  io.to(socket.id).emit('connect player', {id: socket.id});
  playerPosLst.forEach(elem => {
    io.to(socket.id).emit('load players', {id: elem.id, x: elem.x, y: elem.y, angle: elem.angle}); //private reply
  });
  
  // init chair pos when the first player join in the game
  if(chairPosLst.length == 0) {
    // add chairs
    for(var i = 0; i < initChairNum; i++) {
      chairPosLst.push({id : i, x: Math.random() * 500 + 200, y: Math.random() * 500 + 200, angle: 0});  
    }
  }

  chairPosLst.forEach(elem=> {
    io.to(socket.id).emit('load chairs', {id: elem.id, x: elem.x, y: elem.y, angle: elem.angle});
  });

  // socket.on('chat message', (msg) => {
  //   io.emit('chat message', "some msg");
  //   console.log('msg: ' + msg);
  // });

  socket.on('boardcast player', (data) => {
    console.log('boardcast player: ' + data.id);
    console.log(data.x + " " + data.y + " " + data.angle);
    playerPosLst.push({id: data.id, x:data.x, y:data.y, angle:data.angle});
    socket.broadcast.emit('new player', data);
  });

  socket.on('move player', (data)=>{
    console.log('move player', data.id);
    updatePlayerPosLst(data);
    socket.broadcast.emit('move player', data); // boardcast to other players to update location
  });

  socket.on('stop player', (data)=>{
    console.log('stop player', data.id);
    socket.broadcast.emit('stop player', data);
  });
  
  socket.on('disconnect', ()=>{
    console.log('remove player', socket.id);
    removePlayerPosLst(socket.id);
    socket.broadcast.emit('disconnect player', {id: socket.id});
  })

  socket.on('remove chair', (data)=>{
    console.log('remove chair ' + data.id);
    removeChairFromChairPosLst(data.id);
    io.emit('remove chair', {id: data.id});
  }); 
});


function updatePlayerPosLst(data) {
  var i;
  for(i = 0; i < playerPosLst.length; i++) {
      if(playerPosLst[i].id == data.id) {
          playerPosLst[i].x = data.x;
          playerPosLst[i].y = data.y;
          playerPosLst[i].angle = data.angle;
      }
  }
};

function removePlayerPosLst(removeId) {
  var i;
  for(i = 0; i < playerPosLst.length; i++) {
      if(playerPosLst[i].id == removeId) {
        playerPosLst.splice(i, 1);
      }
  }
}

function removeChairFromChairPosLst(chairId) {
  for(var i = 0; i < chairPosLst.length; i++) {
    if(chairPosLst[i].id == chairId) {
      chairPosLst.splice(i, 1);
    }
  }
}