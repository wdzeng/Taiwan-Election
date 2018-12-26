class MapSource {

    constructor(mapData) {

        // Create canvas
        let $canvas = $('<canvas></canvas>')
        $canvas.attr({
            width: this.width(),
            height: this.height()
        });
        this.canvas = $canvas[0];
        let canvas = this.canvas;

        // Create path renderer
        let context = canvas.getContext('2d');
        let projection = d3.geoMercator().fitSize([this.width(), this.height()], mapData);
        let pathRenderer = d3.geoPath().context(context).projection(projection);

        // Set context style
        context.strokeStyle = '#444';
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = this.lineWidth();

        // Draw on hidden canvas
        context.beginPath();
        pathRenderer(mapData);
        context.stroke();
    }

    ratio() {
        return 13046 / 18000;
    }

    width() {
        return this.height() * this.ratio();
    }

    height() {
        return 18000;
    }

    lineWidth() {
        return this.height() / 1200;
    }

    drawOn(destContext, sx, sy, dw, dh, zoom) {

        // Calculate cooridnates
        let sw = dw / zoom;
        let sh = dh / zoom;

        // Copy canvas
        destContext.clearRect(0, 0, dw, dh);
        destContext.drawImage(this.canvas, sx, sy, sw, sh, 0, 0, dw, dh);
    }

    drawAllOn(destCanvas) {

        let destContext = destCanvas.getContext('2d');

        // Calculate coordinates
        let dratio = destCanvas.width / destCanvas.height;
        let dx, dy, dw, dh;
        if (dratio < this.ratio()) { // Too slim
            dx = 0;
            dy = (destCanvas.height / 2) - (this.height() * destCanvas.width) / (2 * this.width());
            dw = destCanvas.width;
            dh = dw / this.ratio();
        }
        else { // Too wide
            dx = (destCanvas.width / 2) - (this.width() * destCanvas.height) / (2 * this.height());
            dy = 0;
            dh = destCanvas.height;
            dw = dh * this.ratio();
        }

        // Clear and draw
        destContext.clearRect(0, 0, dw, dh);
        destContext.drawImage(this.canvas, 0, 0, this.width(), this.height(), dx, dy, dw, dh);
        console.log(this.canvas, 0, 0, this.width(), this.height(), dx, dy, dw, dh);
    }
}
