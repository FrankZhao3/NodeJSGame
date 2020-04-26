import Phaser from "phaser";
import dudePic from '../assets/dude.png';
import landPic from '../assets/light_grass.png';
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

var game = new Phaser.Game(config)
var currentSpeed = 5;
var land;
var player;
var cursors;
function preload() {
    this.load.spritesheet('dude', dudePic, {frameWidth:64, frameHeight:64});
    this.load.image('earth', landPic);
}

function create() {
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
    //setEventHandlers();

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
        // The speed we'll travel at
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
};

