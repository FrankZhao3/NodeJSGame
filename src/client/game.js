import Phaser from "phaser";
import dudePic from '../assets/dude.png';
import landPic from '../assets/light_grass.png';
import chairPic from '../assets/chair.png';

import {Player, Chair} from './gameObject.js';
import io from 'socket.io-client'

// Creating the game

//draw canvas
var config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 1000,
    backgroundColor: "#000000",
    physics: {
        default: 'arcade'
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var currentSpeed = 200;
var land;
var cursors;
var playerLst = [];
var chairLst = [];
var this_player;
var playerName;
var game;
var socket;

export const startGame= (username)=>{
    console.log('initializing game for ' + username);
    game = new Phaser.Game(config);
    playerName = username;
};


function preload() {
    this.load.spritesheet('dude', dudePic, {frameWidth:64, frameHeight:64});
    this.load.image('earth', landPic);
    this.load.image('chair', chairPic);
};

function create() {
    // set up socket
    socket = io(`ws://${window.location.host}`);
    // walk anim
    var walkAnim = {
        key: 'walk',
        frames: this.anims.generateFrameNumbers('dude'),
        frameRate: 4,
        yoyo: true,
        repeat: -1
    };

    var stopAnim = {
        key: 'walk',
        frames: this.anims.generateFrameNumbers('dude', {start: 3, end:4}),
        frameRate: 4,
        yoyo: true,
        repeat: -1
    }
    this.anims.create(walkAnim);
    this.anims.create(stopAnim);

  // Our tiled scrolling background
    land = this.add.tileSprite(0, 0, 2000, 2000, 'earth');
    land.fixedToCamera = true;
    this.physics.world.setBounds(0, 0, 950, 950);
    // add a player to the game
    var startX = Math.round(Math.random() * (200) + 50);
    var startY = Math.round(Math.random() * (200) + 50);
    this_player = new Player(this, null, startX, startY, 0);
    var textX = Math.floor(this_player.sprite.x - this_player.sprite.width / 2);
    var textY = Math.floor(this_player.sprite.y - this_player.sprite.height / 2);
    playerName = this.add.text(textX, textY, playerName);
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
    // set collide
    this_player.sprite.setVelocity(0);
    var pressed = true;
    if (cursors.left.isDown) {
        this_player.sprite.setVelocityX(-currentSpeed);
        this_player.sprite.angle = 180;
    } else if (cursors.right.isDown) {
        this_player.sprite.setVelocityX(currentSpeed);
        this_player.sprite.angle = 0;
    } else if (cursors.up.isDown) {
        this_player.sprite.setVelocityY(-currentSpeed);
        this_player.sprite.angle = -90;
    } else if(cursors.down.isDown){
        this_player.sprite.setVelocityY(currentSpeed);
        this_player.sprite.angle = 90;
    } else {
        pressed = false;
    }

    // move name
    playerName.setX(this_player.getX() - this_player.sprite.width / 2);
    playerName.setY(this_player.getY() - this_player.sprite.height);

    if(pressed)
    {
        if(this_player.sprite.anims.isPaused)
            this_player.sprite.anims.play('walk');
        socket.emit('move player', {id: this_player.getId(), x: this_player.getX(), y: this_player.getY(), angle: this_player.getAngle() });
    } else {
        if (!this_player.sprite.anims.isPaused)
        {
            this_player.sprite.anims.pause();
            socket.emit('stop player', {id: this_player.getId(), x: this_player.getX(), y: this_player.getY(), angle: this_player.getAngle() });
        }
    }
};

function setEventHandlers () {
    // Socket connection successful
    socket.on('connect player', (data)=>{
        console.log('Player ' + data.id + ' Connected to socket server');
        this_player.setId(data.id);
        playerLst.push(this_player);
        socket.emit('boardcast player', { id: data.id, x: this_player.getX(), y: this_player.getY(), angle: this_player.getAngle() });
    });
    
    // Loading other players
    socket.on('load players', (data)=>{
        var aNewPlayer = new Player(this_player.game, data.id, data.x, data.y, data.angle);
        playerLst.push(aNewPlayer);
    });
    
    socket.on('load chairs', (data)=>{
        var newChair = new Chair(this_player.game, data.id, data.x, data.y, data.angle);
        chairLst.push(newChair);
        // add collider for your player and all chairs
        this_player.game.physics.add.collider(this_player.sprite, newChair.sprite, (player, chair)=> {
            console.log(`${player.id} grab a chair: ${chair.id}`);
            socket.emit('remove chair', {id: chair.id});
        });
    });

    socket.on('remove chair', (data) => {
        var chair = removeChairInChairLst(data.id);
        if(!chair) {
            console.log('chair not found');
        }
    });

    // Socket disconnection
    socket.on('disconnect player', (data)=>{
        console.log('Remove player:', data.id);
        var removedPlayer = removePlayerInPlayerLst(data.id);
        if(!removedPlayer) {
            console.log('player not found');
        }
    });
  
    // other player joined message received
    socket.on('new player', (data)=>{
        console.log('New player connected:', data.id);
        // adding other player
        if(data.id != this_player.getId()) {
            var newPlayer = new Player(this_player.game, data.id, data.x, data.y, data.angle);
            playerLst.push(newPlayer);
        }
    });
  
    // Player move message received
    socket.on('move player', (data)=>{
        console.log('Move player:', data.id);
        var movePlayer = findPlayerInPlayerLst(data.id);
        if(!movePlayer) {
            console.log('player not found');
            return;
        }
        movePlayer.sprite.x = data.x;
        movePlayer.sprite.y = data.y;
        movePlayer.sprite.angle = data.angle;

        if(movePlayer.sprite.anims.isPaused)
            movePlayer.sprite.anims.play('walk');
    });

    socket.on('stop player', (data)=>{
        var findPlayer = findPlayerInPlayerLst(data.id);
        if(findPlayer != null && findPlayer.sprite != null && !findPlayer.sprite.anims.isPaused)
            findPlayer.sprite.anims.pause();
    });
};

function findPlayerInPlayerLst(find_id) {
    for(var i = 0; i < playerLst.length; i++) {
        if(playerLst[i].getId() == find_id) {
            return playerLst[i];
        }
    }
    return null;
};

function removePlayerInPlayerLst(find_id) {
    for(var i = 0; i < playerLst.length; i++) {
        if(playerLst[i].getId() == find_id) {
            playerLst[i].sprite.destroy();
            playerLst.splice(i, 1);
            return true;
        }
    }
    return null;
};

function findChairInChairLst(find_id) {
    for(var i = 0; i < chairLst.length; i++) {
        if(chairLst[i].id == find_id) {
            return chairLst[i];
        }
    }
    return null;
}

function removeChairInChairLst(find_id) {
    for(var i = 0; i < chairLst.length; i++) {
        if(chairLst[i].getId() == find_id) {
            chairLst[i].sprite.destroy();
            chairLst.splice(i, 1);
            return true;
        }
    }
    return null;
}