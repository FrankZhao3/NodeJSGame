import Phaser from "phaser";
import dudePic from '../assets/dude.png';
import landPic from '../assets/light_grass.png';
import chairPic from '../assets/chair.png';
import fullscreen from '../assets/fullscreen.png'
import {Player, Chair} from './gameObject.js';
import io from 'socket.io-client'

// Creating the game

//draw canvas
var config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 1000,
    backgroundColor: "#000000",
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
    physics: {
        default: 'arcade'
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var jsonify = require('jsonify');
var maxScoreDisplayNum = 3;
var currentSpeed = 200;
var chairPoint = 10;
var land;
var cursors;
var playerLst = [];
var chairLst = [];
var myPlayer;
var playerName;
var playerScore;
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
    this.load.spritesheet('fullscreen', fullscreen, { frameWidth: 64, frameHeight: 64 });
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
    myPlayer = new Player(this, null, startX, startY, 0, playerName);
    var textX = Math.floor(myPlayer.sprite.x - myPlayer.sprite.width / 2);
    var textY = Math.floor(myPlayer.sprite.y - myPlayer.sprite.height / 2);
    playerName = this.add.text(textX, textY, playerName);
    playerScore = this.add.text(10, 10, `My score: ${myPlayer.getScore()}`);

    // add keys
    cursors = this.input.keyboard.addKeys({
        up: 'up',
        down: 'down',
        left: 'left',
        right: 'right'
    }); 

    //set fullscreen mode
    var button = this.add.image(1000 - 16, 16, 'fullscreen', 0).setOrigin(1, 0).setInteractive();

    button.on('pointerup', function () {
        if (this.scale.isFullscreen) {
            button.setFrame(0);
            this.scale.stopFullscreen();
        }
        else {
            button.setFrame(1);
            this.scale.startFullscreen();
        }
    }, this);

    // event handlers
    setEventHandlers();

};

function update() {
    // set collide
    myPlayer.sprite.setVelocity(0);
    var pressed = true;
    if (cursors.left.isDown) {
        myPlayer.sprite.setVelocityX(-currentSpeed);
        myPlayer.sprite.angle = 180;
    } else if (cursors.right.isDown) {
        myPlayer.sprite.setVelocityX(currentSpeed);
        myPlayer.sprite.angle = 0;
    } else if (cursors.up.isDown) {
        myPlayer.sprite.setVelocityY(-currentSpeed);
        myPlayer.sprite.angle = -90;
    } else if(cursors.down.isDown){
        myPlayer.sprite.setVelocityY(currentSpeed);
        myPlayer.sprite.angle = 90;
    } else {
        pressed = false;
    }

    // move name
    playerName.setX(myPlayer.getX() - myPlayer.sprite.width / 2);
    playerName.setY(myPlayer.getY() - myPlayer.sprite.height);
    
    // Changing animation
    if(pressed)
    {
        if(myPlayer.sprite.anims.isPaused)
            myPlayer.sprite.anims.play('walk');
        socket.emit('move player', {id: myPlayer.getId(), x: myPlayer.getX(), y: myPlayer.getY(), angle: myPlayer.getAngle() });
    } else {
        if (!myPlayer.sprite.anims.isPaused)
        {
            myPlayer.sprite.anims.pause();
            socket.emit('stop player', {id: myPlayer.getId(), x: myPlayer.getX(), y: myPlayer.getY(), angle: myPlayer.getAngle() });
        }
    }
};

function setEventHandlers () {
    // Socket connection successful
    socket.on('connect player', (data)=>{
        console.log('Player ' + data.id + ' Connected to socket server');
        myPlayer.setId(data.id);
        playerLst.push(myPlayer);
        socket.emit('boardcast player', { id: data.id, x: myPlayer.getX(), y: myPlayer.getY(), 
                                        angle: myPlayer.getAngle(), name: myPlayer.getName()});
    });
    
    // Loading other players
    socket.on('load players', (data)=>{
        var aNewPlayer = new Player(myPlayer.game, data.id, data.x, data.y, data.angle, data.name);
        playerLst.push(aNewPlayer);
    });
    
    socket.on('load chairs', (data)=>{
        var newChair = new Chair(myPlayer.game, data.id, data.x, data.y, data.angle);
        chairLst.push(newChair);
        // add collider for your player and all chairs
        myPlayer.game.physics.add.collider(myPlayer.sprite, newChair.sprite, (player, chair)=> {
            console.log(`${player.id} grab a chair: ${chair.id}`);
            socket.emit('remove chair', {chairId: chair.id, playerId: player.id, score: player.score});
            player.score += chairPoint;
        });
    });

    socket.on('remove chair', (data) => {
        var chair = removeChairInChairLst(data.id);
        if(!chair) {
            console.log('chair not found');
        }
    });

    socket.on('update score', (data) => {     
        var text = `My score: ${myPlayer.getScore()}\n` + `LeaderBoard\n`;
        var scoreLst = jsonify.parse(data.scoreLst);
        for(var i = 0; i < Math.min(scoreLst.length, maxScoreDisplayNum); i++) {
            text += `${i + 1}.${scoreLst[i].name}:${scoreLst[i].score}\n`;
        }
        playerScore.setText(text);
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
        if(data.id != myPlayer.getId()) {
            var newPlayer = new Player(myPlayer.game, data.id, data.x, data.y, data.angle);
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