const NORTH = 'north';
const SOUTH = 'south';
const EAST = 'east';
const WEST = 'west';

class Snake extends CanvasObject {
    constructor(cathanvas, game, options = {}) {
        super();
        this.length = options.length || 5;
        this.bodyLocation = this.initBody(cathanvas);
        this.style = options.style || "#000000";
        this.orientation = 'east';
        this.canvas = cathanvas;
        this.game = game;
        this.addListeners();
    }

    addListeners = () => {
        window.addEventListener('keydown', this.changeDirection);
    };

    removeListeners = () => {
        window.removeEventListener('keydown', this.changeDirection);
    };

    changeDirection = (e) => {
        switch (e.key) {
            case 'ArrowUp':
                this.orientation = NORTH;
                break;
            case 'ArrowRight':
                this.orientation = EAST;
                break;
            case 'ArrowDown':
                this.orientation = SOUTH;
                break;
            case 'ArrowLeft':
                this.orientation = WEST;
                break;
        }
    };

    initBody = (canvas) => {
        const centerx = canvas.width / 2;
        const centery = canvas.height / 2;
        return [
            {x: centerx, y: centery},
            {x: centerx - 1, y: centery},
            {x: centerx - 2, y: centery},
            {x: centerx - 3, y: centery},
            {x: centerx - 4, y: centery},
        ];
    };

    render = (cathanvas) => {
        for (let i = 0; i < this.bodyLocation.length; i++) {
            let b = this.bodyLocation[i];
            cathanvas.drawDot(b, this.style);
        }
        this.moveSnake();
    };

    moveSnake = () => {
        let segment = this.moveBodySegment(this.bodyLocation[0], this.orientation);

        if (this.isAtBounds(segment, this.canvas)) {
            this.game.endGame();
            return;
        }

        for (let i = 0; i < this.bodyLocation.length; i++) {
            const next = this.bodyLocation[i];
            this.bodyLocation[i] = segment;
            segment = next;
        }
    };

    moveBodySegment = (coords, orientation) => {
        if (this.isAtBounds(coords, this.canvas)) {
            return;
        }

        switch (orientation) {
            case NORTH:
                return { x: coords.x, y: coords.y - 1 };
                break;
            case EAST:
                return { x: coords.x + 1, y: coords.y };
                break;
            case SOUTH:
                return { x: coords.x, y: coords.y + 1};
                break;
            case WEST:
                return { x: coords.x - 1, y: coords.y };
        }
    };

    isAtBounds = (coords, cathanvas) => {
        if (coords.x < 0 || coords.x >= cathanvas.width) {
            return true;
        }

        if (coords.y < 0 || coords.y >= cathanvas.height) {
            return true;
        }

        return false;
    };
}

class Game {
    constructor(cathanvas) {
        this.canvas = cathanvas;
        this.startGame();
    }

    startGame = () => {
        this.snake = new Snake(canvas, this);
        canvas.animateObject(this.snake);
        canvas.startAnimating();
    };

    endGame = () => {
        window.alert("Game Over!");
        canvas.stopAnimating();
    };

    render(cathanvas) {

    }
}

class Collider {
    constructor(bounds, options = {}) {
        this.bounds = bounds;
    }


}
