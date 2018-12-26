const MUT = 1.2;

export default class Zoomable {

    constructor($canvas, source, bounds) {

        this.source = source;
        this.$canvas = $canvas;
        this.canvas = $canvas[0];
        this.bounds = bounds;

        this.canvas.addEventListener('wheel', e => {
            this.zoom(e.offsetX, e.offsetY, e.deltaY < 0);
            e.preventDefault();
        });
    }

    static bind(zooms) {
        // TODO
    }

    static bindNow(zooms) {
        // TODO
    }

    static unbind(zooms) {
        // TODO
    }

    zoom(offx, offy, zoomIn) {

        let bounds = this.bounds;

        // Determine the mouse coordinate in respect of the source
        let dw = this.$canvas.width();
        let dh = this.$canvas.height();
        let pctx = offx / dw;
        let pcty = offy / dh;
        let srcx = bounds.x + bounds.width * pctx;
        let srcy = bounds.y + bounds.height * pcty;

        // Determine new dimension in respect of the source
        let newWidth = zoomIn ? (bounds.width / MUT) : (bounds.width * MUT);
        let newHeight = zoomIn ? (bounds.height / MUT) : (bounds.height * MUT);
        newWidth = checkInRange(newWidth, this.canvas.width, this.source.width);
        newHeight = checkInRange(newHeight, this.canvas.height, this.source.height);

        // Ensure no trivial zoom
        if (newHeight == bounds.height && newWidth == bounds.width) return;

        // Determine new coordinate in respect of the source
        bounds.x = srcx - newWidth * pctx;
        bounds.y = srcy - newHeight * pcty;
        bounds.width = newWidth;
        bounds.height = newHeight;

        // Draw
        this.source.drawOn(this.canvas, bounds.x, bounds.y, bounds.width, bounds.height, this.canvas.width, this.canvas.height);
    }

}

function checkInRange(val, a, b) {

    if (a > b) return checkInRange(val, b, a);

    // Ensure a <= val <= b
    if (val < a) return a;
    if (val > b) return b;
    return val;
}

function isInRange(val, a, b) {

    if (a > b) return isInRange(val, b, a);
    return a <= val && val <= b;
}