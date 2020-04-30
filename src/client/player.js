export default class Player {
    constructor(game, id, x, y, angle) {
        this.game = game;
        this.id = id;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.sprite = game.add.sprite(x, y, 'dude' + id);
        this.game.physics.world.enable(this.sprite);
        this.sprite.body.setBounce(1, 1).setCollideWorldBounds(true);
        this.sprite.anims.load('walk');
    }
}