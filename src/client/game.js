import Phaser from "phaser";
import dudePic from '../assets/dude.png';
import landPic from '../assets/light_grass.png';
import banana from '../assets/banana.png';
import chairPic from '../assets/chair.png';
import fullscreen from '../assets/fullscreen.png'
import {Player, Chair, Block} from './gameObject.js';
import io from 'socket.io-client'
import constant from '../shared/constant.js';
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
var currentSpeed = 200;
var land;
var cursors;
var playerLst = [];
var chairLst = [];
var blockLst = [];
var playerNameDict = {};
var playerName;
var blockCount = constant.INIT_BLOCK_NUM;
var myPlayer = null;
var playerScore;
var socket;
var game; 
var timeText;
var remainingTime;
var timeInterval;

export const startGame= (username)=>{
    console.log('Initializing game for ' + username);
    new Phaser.Game(config);
    playerName = username;
};


function preload() {
    this.load.spritesheet('dude', dudePic, {frameWidth:64, frameHeight:64});
    this.load.image('earth', landPic);
    this.load.image('chair', chairPic);
    this.load.image('block', banana);
    this.load.spritesheet('fullscreen', fullscreen, { frameWidth: 64, frameHeight: 64 });
};

function create() {
    // set up socket
    socket = io(`/`);
    // set game
    game = this;
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
    land = this.add.tileSprite(0, 0, constant.WIDTH, constant.HEIGHT, 'earth');
    land.fixedToCamera = true;
    this.physics.world.setBounds(0, 0, 950, 950);

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
    // set timer
    remainingTime = constant.TOTAL_TIME;
    timeText = this.add.text(350, 10, `Waiting for players...Time remain:${remainingTime}s`);
    // event handlers
    setEventHandlers();

};

function update() {
    // set collide
    if(myPlayer) {
        myPlayer.sprite.setVelocity(0);
        var pressed = true;
        if(myPlayer.sprite.movable == true) {
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
            var value = getFaceDir(myPlayer.sprite.angle);
            if(cursors.space.isDown && myPlayer.getBlockNum() > 0 && myPlayer.sprite.hasPower) {
                socket.emit('add block', {id: blockCount++, x : myPlayer.getX() + value[0], y: myPlayer.getY() + value[1]});
                myPlayer.setBlockNum(myPlayer.getBlockNum() - 1);
                myPlayer.game.time.delayedCall(500, triggerAbility, [], myPlayer.game);    
                myPlayer.sprite.hasPower = false;       
            } 
        }

        // move name
        moveText(playerNameDict[playerName], myPlayer);
        
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
    }
};

function setEventHandlers () {
    // Socket connection successful
    socket.on('connect player', (data)=>{
        console.log('Player ' + data.id + ' Connected to socket server');
        if(data.playerCount < constant.MAX_PLAYER_NUM) {
            // add player
            var startX = constant.PLAYER_POSITION[data.playerCount].X;
            var startY = constant.PLAYER_POSITION[data.playerCount].Y;

            myPlayer = new Player(game, null, startX, startY, 0, playerName);
            var textX = Math.floor(myPlayer.sprite.x - myPlayer.sprite.width / 2);
            var textY = Math.floor(myPlayer.sprite.y - myPlayer.sprite.height / 2);
            playerNameDict[playerName] = game.add.text(textX, textY, playerName);
            playerScore = game.add.text(10, 10, `My score: ${myPlayer.getScore()}`);
                
            // add keys
            cursors = game.input.keyboard.addKeys({
                up: 'up',
                down: 'down',
                left: 'left',
                right: 'right',
                space: 'space'
            }); 
        
            myPlayer.setId(data.id);
            playerLst.push(myPlayer);
            socket.emit('boardcast player', { id: data.id, x: myPlayer.getX(), y: myPlayer.getY(), 
                                            angle: myPlayer.getAngle(), name: myPlayer.getName()});
        } else {
            playerScore = game.add.text(10, 10, '');
            alert("You are in watching mode");
        }
    });
    
    // Loading other players
    socket.on('load players', (data)=>{
        var dataLst = jsonify.parse(data);
        dataLst.forEach(player => {
            let newPlayer = new Player(game, player.id, player.x, player.y, player.angle, player.name);
            playerLst.push(newPlayer);            
            playerNameDict[player.name] = game.add.text(player.x, player.y, player.name);
            moveText(playerNameDict[player.name], newPlayer);
        })
    });
    
    socket.on('load chairs', (data)=>{
        var dataLst = jsonify.parse(data);
        dataLst.forEach(chair => {
            let newChair = new Chair(game, chair.id, chair.x, chair.y, chair.angle);
            chairLst.push(newChair);
            if(myPlayer) {
                // add collider for your player and all chairs
                myPlayer.game.physics.add.collider(myPlayer.sprite, newChair.sprite, (player, chair)=> {
                    console.log(`${player.id} grab a chair: ${chair.id}`);
                    socket.emit('remove chair', {chairId: chair.id, playerId: player.id, score: player.score});
                });
            }
        });
    
    });

    socket.on('load blocks', (data) => {
        let dataLst = jsonify.parse(data);
        dataLst.forEach(elem => {
            let newBlock = new Block(game, elem.id, elem.x, elem.y, elem.angle);
            blockLst.push(newBlock);
            if(myPlayer) {
                // add collider 
                myPlayer.game.physics.add.collider(myPlayer.sprite, newBlock.sprite, onHitBlock);
            }
        });
    });

    socket.on('start game', () => {
        myPlayer.sprite.movable = true;
        timeInterval = setInterval(updateTime, 1000); // counting down time
    });

    socket.on('add block', (data) => {
        let newBlock = new Block(myPlayer.game, data.id, data.x, data.y, 0);
        blockLst.push(newBlock);
        // add collider
        myPlayer.game.physics.add.collider(myPlayer.sprite, newBlock.sprite, onHitBlock);
    });

    socket.on('remove chair', (data) => {
        var chair = removeChairInChairLst(data.id);
        if(!chair) {
            console.log('chair not found');
        }
    });

    socket.on('remove block', (data) => {
        var block = removeBlockFromBlockLst(data.id);
        if(!block) {
            console.log('block not found');
        }
    });

    socket.on('update score', (data) => {  
        if(data.playerId == myPlayer.getId()) {
            myPlayer.setScore(data.score);
        }
        var text;
        if(myPlayer) {   
            text = `My score: ${myPlayer.getScore()}\n` + `LeaderBoard\n`;
        } else {
            text = `LeaderBoard\n`;
        }
        var scoreLst = jsonify.parse(data.scoreLst);
        for(var i = 0; i < Math.min(scoreLst.length, constant.MAX_LEADERBOARD_LENGTH); i++) {
            text += `${i + 1}.${scoreLst[i].name}:${scoreLst[i].score}\n`;
        }
        playerScore.setText(text);
    });

    // Socket disconnection
    socket.on('disconnect player', (data)=>{
        console.log('Remove player:', data.id);
        var player = findPlayerInPlayerLst(data.id);
        if(player) {
            playerNameDict[player.getName()].destroy();
            playerNameDict[player.getName()] = null;
            removePlayerInPlayerLst(data.id);
        } else {
            console.log('player not found');
        }
    });
  
    // other player joined message received
    socket.on('new player', (data)=>{
        console.log('New player connected:', data.id);
        // adding other player
        if(data.id != myPlayer.getId()) {
            var newPlayer = new Player(myPlayer.game, data.id, data.x, data.y, data.angle, data.name);
            playerLst.push(newPlayer);
            playerNameDict[data.name] = game.add.text(data.x, data.y, data.name);
            moveText(playerNameDict[data.name], newPlayer);
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

        moveText(playerNameDict[movePlayer.getName()], movePlayer);

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

function removeBlockFromBlockLst(blockId) {
    for(var i = 0; i < blockLst.length; i++) {
        if(blockLst[i].sprite.id == blockId) {
            blockLst[i].sprite.destroy();
            blockLst.splice(i, 1);
            return true;
      }
    }
    return null;
}

function onEvent() {
    console.log('trigger time event');
    myPlayer.sprite.movable = true;
}

function triggerAbility() {
    console.log('trigger ability');
    myPlayer.sprite.hasPower = true;
}

function getFaceDir(angle) {
    switch(angle) {
        case -180:
            return [-70, 0];
        case 0:
            return [70, 0];
        case -90:
            return [0, -70];  
        case 90:
            return [0, 70];     
        default:
            return [0, 0]; 
    }
}

function onHitBlock(player, block) {
    console.log(`${player.name} hit a block: ${block.id}`);
    player.movable = false;
    socket.emit('remove block', {playerId: player.id, blockId: block.id});
    myPlayer.game.time.delayedCall(3000, onEvent, [], myPlayer.game);
    player.blockNum++;
}

function moveText(playerName, player) {
    playerName.setX(player.getX() - player.sprite.width / 2);
    playerName.setY(player.getY() - player.sprite.height);
}

function updateTime() {
    remainingTime -= 1;
    timeText.setText(`Time remain:${remainingTime}s`);
    timeText.setX(400);
    if(remainingTime == 0) {
        clearInterval(timeInterval);
        clearGameObjects();
    }
}

function clearGameObjects() {
    // removing game objects from scene
    playerLst.forEach(elem=>{
        elem.clear();
    });

    chairLst.forEach(elem=>{
        elem.clear();
    });

    blockLst.forEach(elem=>{
        elem.clear();
    });
    
    for(var key in playerNameDict) {
        var text = playerNameDict[key]
        if(text) text.destroy();
    }

    playerNameDict = null;
    myPlayer = null;
    playerScore.setX(400);
    playerScore.setY(400);
    socket.emit('game over');
}