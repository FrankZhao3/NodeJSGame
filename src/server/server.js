const express = require('express');
const socketio = require('socket.io');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const config = require('../../webpack.dev.config.js');
var arraySort = require('array-sort');
var jsonify = require('jsonify');
var constant = require('../shared/constant.js');

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
const port = process.env.PORT || 8080;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

// Setup socket.io
const io = socketio(server);
var totalPlayerNum = 0;
var playerDataLst = [];
var chairPosLst = [];
var scoreLst = [];
var blockLst = [];

// Listen for socket.io connections
io.on('connection', (socket) => {
  console.log('Player connected!', socket.id);

  // init chair pos when the first player join in the game
  if(chairPosLst.length == 0 && playerDataLst.length == 0) {
    // add chairs
    for(var i = 0; i < constant.INIT_CHAIR_NUM; i++) {
      chairPosLst.push({id : i, x: Math.random() * 500 + 200, y: Math.random() * 500 + 200, angle: 0});  
    }

    for(var i = 0; i < constant.INIT_BLOCK_NUM; i++) {
      blockLst.push({id : i, x: Math.random() * 800 + 100, y: Math.random() * 800 + 100, angle: 0});
    }
  }

  io.to(socket.id).emit('connect player', {id: socket.id, playerCount: totalPlayerNum});
  io.to(socket.id).emit('load players', jsonify.stringify(playerDataLst));
  io.to(socket.id).emit('load chairs', jsonify.stringify(chairPosLst));
  io.to(socket.id).emit('load blocks', jsonify.stringify(blockLst));

  socket.on('boardcast player', (data) => {
    console.log('boardcast player: ' + data.id);
    console.log(data.x + " " + data.y + " " + data.angle);
    playerDataLst.push({id: data.id, x:data.x, y:data.y, angle:data.angle, name: data.name});
    scoreLst.push({id: data.id, score: 0, name: data.name});
    socket.broadcast.emit('new player', data);
    totalPlayerNum++;
    if(totalPlayerNum >= constant.MAX_PLAYER_NUM) {
      console.log('start game');
      io.emit('start game', {});
    }

  });

  socket.on('move player', (data)=>{
    updatePlayerPosLst(data);
    socket.broadcast.emit('move player', data); // boardcast to other players to update location
  });

  socket.on('stop player', (data)=>{
    socket.broadcast.emit('stop player', data);
  });
  
  socket.on('disconnect', ()=>{
    console.log('disconnecting player', socket.id);
    if(removePlayerPosLst(socket.id)) {
      totalPlayerNum--;
    }
    removePlayerScore(socket.id);
    if(playerDataLst.length == 0) {
      chairPosLst = [];
      blockLst = [];
    }
    socket.broadcast.emit('disconnect player', {id: socket.id});
    io.emit('update score', {scoreLst: jsonify.stringify(scoreLst)});
  });

  socket.on('remove chair', (data)=>{
    removeChairFromChairPosLst(data.chairId);
    io.emit('remove chair', {id: data.chairId});
    let newScore = updateScore(data.playerId, constant.REWARD_POINT);
    arraySort(scoreLst, 'score', {reverse: true});
    io.emit('update score', {scoreLst: jsonify.stringify(scoreLst), playerId: data.playerId, score: newScore});
  }); 

  socket.on('remove block', (data)=>{
    console.log('remove block ' + data.blockId);
    let newScore = updateScore(data.playerId, constant.PENALTY_POINT)
    removeBlockFromBlockLst(data.blockId);
    arraySort(scoreLst, 'score', {reverse: true});
    io.emit('update score', {scoreLst: jsonify.stringify(scoreLst), playerId: data.playerId, score: newScore});
    io.emit('remove block', {id: data.blockId});
  });

  socket.on('add block', (data)=> {
      blockLst.push({id: data.id, x : data.x, y: data.y, angle:0});
      io.emit('add block', {id: data.id, x:data.x, y:data.y});
  });

  socket.on('game over', ()=>{
    totalPlayerNum = 0;
    playerDataLst = [];
    chairPosLst = [];
    scoreLst = [];
    blockLst = [];
  });
  
});


function updatePlayerPosLst(data) {
  var i;
  for(i = 0; i < playerDataLst.length; i++) {
      if(playerDataLst[i].id == data.id) {
          playerDataLst[i].x = data.x;
          playerDataLst[i].y = data.y;
          playerDataLst[i].angle = data.angle;
      }
  }
};

function removePlayerPosLst(removeId) {
  var i;
  for(i = 0; i < playerDataLst.length; i++) {
      if(playerDataLst[i].id == removeId) {
        playerDataLst.splice(i, 1);
        return true;
      }
  }
  return false;
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

function updateScore(playerId, score) {
  for(var i = 0; i < scoreLst.length; i++) {
    if(scoreLst[i].id == playerId) {
      scoreLst[i].score += score;
      return scoreLst[i].score;
    }
  }
  return 0;
}