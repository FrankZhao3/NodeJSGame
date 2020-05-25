const express = require('express');
const socketio = require('socket.io');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const config = require('../../webpack.dev.config.js');
var arraySort = require('array-sort');
var jsonify = require('jsonify');


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
const initBlockNum = 10;
const rewardPoint = 10;

var playerPosLst = [];
var chairPosLst = [];
var scoreLst = [];
var blockLst = [];

// Listen for socket.io connections
io.on('connection', (socket) => {
  console.log('Player connected!', socket.id);

  // init chair pos when the first player join in the game
  if(chairPosLst.length == 0 && playerPosLst.length == 0) {
    // add chairs
    for(var i = 0; i < initChairNum; i++) {
      chairPosLst.push({id : i, x: Math.random() * 500 + 200, y: Math.random() * 500 + 200, angle: 0});  
    }
    // clear the rest of blocks
    blockLst = [];
    for(var i = 0; i < initBlockNum; i++) {
      blockLst.push({id : i, x: Math.random() * 800 + 100, y: Math.random() * 800 + 100, angle: 0});
    }
  }

  io.to(socket.id).emit('connect player', {id: socket.id});
  
  // playerPosLst.forEach(elem => {
  //   io.to(socket.id).emit('load players', {id: elem.id, x: elem.x, y: elem.y, angle: elem.angle, name: elem.name}); //private reply
  // });

  // chairPosLst.forEach(elem=> {
  //   io.to(socket.id).emit('load chairs', {id: elem.id, x: elem.x, y: elem.y, angle: elem.angle});
  // });
  io.to(socket.id).emit('load players', jsonify.stringify(playerPosLst));
  io.to(socket.id).emit('load chairs', jsonify.stringify(chairPosLst));
  io.to(socket.id).emit('load blocks', jsonify.stringify(blockLst));

  socket.on('boardcast player', (data) => {
    console.log('boardcast player: ' + data.id);
    console.log(data.x + " " + data.y + " " + data.angle);
    playerPosLst.push({id: data.id, x:data.x, y:data.y, angle:data.angle});
    scoreLst.push({id: data.id, score: 0, name: data.name});
    socket.broadcast.emit('new player', data);
  });

  socket.on('move player', (data)=>{
    // console.log('move player', data.id);
    updatePlayerPosLst(data);
    socket.broadcast.emit('move player', data); // boardcast to other players to update location
  });

  socket.on('stop player', (data)=>{
    // console.log('stop player', data.id);
    socket.broadcast.emit('stop player', data);
  });
  
  socket.on('disconnect', ()=>{
    console.log('disconnecting player', socket.id);
    removePlayerPosLst(socket.id);
    removePlayerScore(socket.id);
    socket.broadcast.emit('disconnect player', {id: socket.id});
    io.emit('update score', {scoreLst: jsonify.stringify(scoreLst)});
  })

  socket.on('remove chair', (data)=>{
    // console.log('remove chair ' + data.chairId);
    removeChairFromChairPosLst(data.chairId);
    io.emit('remove chair', {id: data.chairId});
    updateScore(data.playerId);
    arraySort(scoreLst, 'score', {reverse: true});
    io.emit('update score', {scoreLst: jsonify.stringify(scoreLst)});
  }); 

  socket.on('remove block', (data)=>{
    console.log('remove block ' + data.blockId);
    removeBlockFromBlockLst(data.blockId);
    io.emit('remove block', {id: data.blockId});
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

function removeBlockFromBlockLst(blockId) {
  for(var i = 0; i < blockLst.length; i++) {
    if(blockLst[i].id == blockId) {
      blockLst.splice(i, 1);
    }
  }
}

function removePlayerScore(playerId) {
  for(var i = 0; i < scoreLst.length; i++) {
    if(scoreLst[i].id == playerId) {
      scoreLst.splice(i, 1);
    }
  }
}
function updateScore(playerId) {
  for(var i = 0; i < scoreLst.length; i++) {
    if(scoreLst[i].id == playerId) {
      scoreLst[i].score += rewardPoint;
    }
  }
}