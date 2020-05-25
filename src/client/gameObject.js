export class Player {
    constructor(game, id, x, y, angle, name) {
        this.game = game;
        this.sprite = game.physics.add.sprite(x, y, 'dude' + id);
        this.sprite.id = id;
        this.sprite.angle = angle;
        this.game.physics.world.enable(this.sprite);
        this.sprite.body.setBounce(0.2).setCollideWorldBounds(true);
        this.sprite.body.immovable = true;
        this.sprite.anims.load('walk');
        this.sprite.score = 0;
        this.sprite.name = name;
    }

    // getter and setter
    setId(id) {
        this.sprite.id = id;
    }

    setX(x) {
        this.sprite.x = x;
    }

    setY(y) {
        this.sprite.y = y;
    }
    
    setAngle(angle) {
        this.sprite.angle = angle;
    }

    setScore(score) {
        this.sprite.score = score;
    }

    setName(name) {
        this.sprite.name = name;
    }

    getName() {
        return this.sprite.name;
    }

    getScore() {
        return this.sprite.score;
    }

    getAngle() {
        return this.sprite.angle;
    }
    getId() {
        return this.sprite.id;
    }

    getX() {
        return this.sprite.x;
    }

    getY() {
        return this.sprite.y;
    }
}

export class Chair {
    constructor(game, id, x, y, angle) {
        this.sprite = game.physics.add.sprite(x, y, 'chair');
            //scale evenly
        this.sprite.angle = angle;
        this.sprite.id = id;
        this.sprite.displayWidth = 50;
        this.sprite.scaleY = this.sprite.scaleX;
        this.sprite.body.setBounce(0.2).setCollideWorldBounds(true);
        this.sprite.body.immovable = true;
    }

        // getter and setter

        setId(id) {
            this.sprite.id = id;
        }
    
        setX(x) {
            this.sprite.x = x;
        }
    
        setY(y) {
            this.sprite.y = y;
        }

        setAngle(angle) {
            this.sprite.angle = angle;
        }

        getAngle() {
            return this.sprite.angle;
        }

        getId() {
            return this.sprite.id;
        }
    
        getX() {
            return this.sprite.x;
        }
    
        getY() {
            return this.sprite.y;
        }
}

export class Block {
    constructor(game, id, x, y, angle) {
        this.sprite = game.physics.add.sprite(x, y, 'block');
        //scale evenly
        this.sprite.angle = angle;
        this.sprite.id = id;
        this.sprite.displayWidth = 50;
        this.sprite.scaleY = this.sprite.scaleX;
        this.sprite.body.setBounce(0.2).setCollideWorldBounds(true);
        this.sprite.body.immovable = true;
    }
        // getter and setter

        setId(id) {
            this.sprite.id = id;
        }
    
        setX(x) {
            this.sprite.x = x;
        }
    
        setY(y) {
            this.sprite.y = y;
        }

        setAngle(angle) {
            this.sprite.angle = angle;
        }

        getAngle() {
            return this.sprite.angle;
        }

        getId() {
            return this.sprite.id;
        }
    
        getX() {
            return this.sprite.x;
        }
    
        getY() {
            return this.sprite.y;
        }

}