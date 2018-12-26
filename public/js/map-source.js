const HEIGHT = 18800;
const RATIO = 13046 / 18000;
const WIDTH = HEIGHT * RATIO;
const LINE_WIDTH = 2;

export default class MapSource {

    constructor(mapData) {

        // Create canvas
        let $canvas = $('<canvas></canvas>')
        $canvas.attr({
            width: WIDTH,
            height: HEIGHT
        });
        this.canvas = $canvas[0];
        let canvas = this.canvas;

        // Create path renderer
        let context = canvas.getContext('2d');
        let projection = d3.geoMercator().fitSize([WIDTH, HEIGHT], mapData);
        let pathRenderer = d3.geoPath().context(context).projection(projection);

        // Set context style
        context.strokeStyle = '#333';
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = LINE_WIDTH;

        // Draw on hidden canvas
        context.beginPath();
        pathRenderer(mapData);
        context.stroke();
    }

    drawOn(destCanvas, sx, sy, sw, sh, dw, dh) {

        let dx = 0, dy = 0;
        // Check overzoom (sx or sy is negative)
        if (sw > WIDTH) {
            dx = (destCanvas.width / 2) - (WIDTH * destCanvas.height) / (2 * HEIGHT);
            dw = dh * RATIO;
        }
        else if (sh > HEIGHT) {
            dy = (destCanvas.height / 2) - (HEIGHT * destCanvas.width) / (2 * WIDTH);
            dh = dw / RATIO;
        }

        // Copy canvas
        let destContext = destCanvas.getContext('2d');
        destContext.clearRect(0, 0, destCanvas.width, destCanvas.height);
        destContext.drawImage(this.canvas, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    drawAllOn(destCanvas) {

        let destContext = destCanvas.getContext('2d');
        let bounds = {
            x: 0,
            y: 0,
            width: WIDTH,
            height: HEIGHT
        };

        // Calculate coordinates
        let dratio = destCanvas.width / destCanvas.height;
        let dx = 0, dy = 0, dw = destCanvas.width, dh = destCanvas.height;
        if (dratio < RATIO) { // Dest too slim
            dy = (destCanvas.height / 2) - (HEIGHT * destCanvas.width) / (2 * WIDTH);
            dh = dw / RATIO;
            bounds.height = bounds.width / destCanvas.width * destCanvas.height;
            bounds.y = (HEIGHT - bounds.height) / 2
        }
        else { // Dest too wide
            dx = (destCanvas.width / 2) - (WIDTH * destCanvas.height) / (2 * HEIGHT);
            dw = dh * RATIO;
            bounds.width = bounds.height / destCanvas.height * destCanvas.width;
            bounds.x = (WIDTH - bounds.width) / 2
        }

        // Clear and draw
        destContext.clearRect(0, 0, dw, dh);
        destContext.drawImage(this.canvas, 0, 0, WIDTH, HEIGHT, dx, dy, dw, dh);
        
        return bounds;
    }
}