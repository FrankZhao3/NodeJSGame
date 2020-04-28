import Phaser from "phaser";
import dudePic from '../assets/dude.png';
import landPic from '../assets/light_grass.png';
import Player from './player.js';
import io from 'socket.io-client'

// Creating the game

//draw canvas
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#ffffff",
    physics: {
        default: 'arcade'
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var socket;
var game = new Phaser.Game(config)
var currentSpeed = 5;
var land;
var player;
var cursors;
var playerLst = [];

function preload() {
    this.load.spritesheet('dude', dudePic, {frameWidth:64, frameHeight:64});
    this.load.image('earth', landPic);
};

function create() {
    // init socket
    socket = io(`ws://${window.location.host}`);

    // player settings
  // Our tiled scrolling background
    land = this.add.tileSprite(0, 0, 1500, 1500, 'earth');
    land.fixedToCamera = true;
    player = this.physics.add.sprite(50, 50, 'dude');

    // walk anim
    var config = {
        key: 'walk',
        frames: this.anims.generateFrameNumbers('dude'),
        frameRate: 4,
        yoyo: true,
        repeat: -1
    };

    var anim = this.anims.create(config);
    player.anims.load('walk');

    // add keys
    cursors = this.input.keyboard.addKeys({
        up: 'up',
        down: 'down',
        left: 'left',
        right: 'right'
    }); 
    // event handlers
    setEventHandlers();

};

function update() {
    var pressed = true;
    if (cursors.left.isDown) {
        player.x -= currentSpeed
        player.angle = 180;
    } else if (cursors.right.isDown) {
        player.x += currentSpeed;
        player.angle = 0;
    } else if (cursors.up.isDown) {
        player.y -= currentSpeed;
        player.angle = -90;
    } else if(cursors.down.isDown){
        player.y += currentSpeed;
        player.angle = 90;
    } else {
        pressed = false;
    }
    
    if(pressed)
    {
        if(player.anims.isPaused)
            player.anims.play('walk');
    } else {
        if (!player.anims.isPaused)
        {
            player.anims.pause();
        }
    }

    socket.emit('move player', { x: player.x, y: player.y, angle: player.angle })

};

function setEventHandlers () {
    // Socket connection successful
    socket.on('connect player', (data)=>{
        console.log('Player ' + data + ' Connected to socket server');
        socket.emit('new player' + data, { x: player.x, y: player.y, angle: player.angle });
    });
  
    // Socket disconnection
    socket.on('disconnect player', (data)=>{
        console.log('Player' + data.id + 'Disconnected from socket server');       
    });
  
    // New player message received
    socket.on('new player', (data)=>{
        console.log('New player connected:', data.id);
        playerLst.push(new Player(data.id, data.x, data.y, data.angle));
    });
  
    // Player move message received
    socket.on('move player', (data)=>{
        console.log('Move player:', data.id);
        movePlayer = findPlayerInPlayerLst(data.id);
        if(!movePlayer) {
            console.log('player not found');
            return;
        }
        movePlayer.x = data.x;
        movePlayer.y = data.y;
        movePlayerangle = data.angle;
    })
  
    // Player removed message received
    socket.on('remove player', (data)=>{
        console.log('Remove player:', data.id);
        removedPlayer = removePlayerInPlayerLst(data.id);
        if(!removedPlayer) {
            console.log('player not found');
            return;
        }
    });
};

function findPlayerInPlayerLst(find_id) {
    var i;
    for(i = 0; i < playerLst.length; i++) {
        if(player[i].id == find_id) {
            return player;
        }
    }
    return false
};

function removePlayerInPlayerLst(find_id) {
    var i;
    for(i = 0; i < playerLst.length; i++) {
        if(player[i].id == find_id) {
             playerLst.splice(i, 1);
             return true;
        }
    }
    return false
};