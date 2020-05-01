export default class Player {
    constructor(game, id, x, y, angle) {
        this.game = game;
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.sprite = game.physics.add.sprite(x, y, 'dude' + id);
        this.game.physics.world.enable(this.sprite);
        this.sprite.body.setBounce(0.2).setCollideWorldBounds(true);
        this.sprite.anims.load('walk');
    }
}