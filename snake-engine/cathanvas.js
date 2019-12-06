class Cathanvas {
    constructor(containerID, options = {}) {
        this.container = document.getElementById(containerID);
        this.width = options.width || 800;
        this.height = options.height || 600;
        this.center = {x: this.width / 2, y: this.height / 2};
        this.id = options.id || 'cathanvas';
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.id = this.id;
        this.context = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        this.anims = [];
        this.animating = false;
        this.animate = this.animate.bind(this);
    }

    drawDot(coords, style) {
        this.context.fillStyle = style || '#FFFFFF';
        this.context.fillRect(coords.x, coords.y, 1, 1);
    }

    drawLineFrom(source = [this.center.x, this.center.y], target, style) {
        this.context.strokeStyle = style || '#FFFFFF';
        this.context.moveTo(source[0], source[1]);
        this.context.lineTo(target[0], target[1]);
        this.context.stroke();
    }

    drawLineFromCenter(coords, style) {
        this.context.strokeStyle = style || '#FFFFFF';
        this.context.moveTo(this.center.x, this.center.y);
        this.context.lineTo(coords.x, coords.y);
        this.context.stroke();
    }

    animate = () => {
        // clear canvas
        this.context.clearRect(0, 0, this.width, this.height);

        // re-populate bg
        this.context.fillStyle = '#99b7e8';
        this.context.fillRect(0, 0, this.width, this.height);

        // draw animated shapes
        this.anims.forEach(obj => this.draw(obj));

        // restore canvas state
        if (this.animating) {
            console.log('requesting animation frame');
            requestAnimationFrame(this.animate);
        }
    };

    animateObject(obj) {
        // Add to animation queue
        this.anims.push(obj)
    }

    startAnimating() {
        this.animating = true;
        this.animate();
    }

    stopAnimating() {
        this.animating = false;
    }

    draw(obj) {
        if (!obj.render) {
            return;
        }

        obj.render(canvas);
    }
}

class CanvasObject  {
    render(canvas) {
        console.warn('Please extend the render() method!');
    }
}