export default class Zoomer {

    constructor(cvWidth, cvHeight) {
        this.cvw = cvWidth;
        this.cvh = cvHeight;
        this.reset();
    }

    zoom(scale, offx, offy) {
        this.scl *= scale;

        let newWidth = this.rec[2] / scale;
        let newHeight = this.rec[3] / scale;

        let tx = offx * this.rec[2] / this.cvw;
        let ty = offy * this.rec[3] / this.cvh;
        let temp = 1 - 1 / scale;
        let newX = this.rec[0] + tx * temp;
        let newY = this.rec[1] + ty * temp;

        this.rec = [newX, newY, newWidth, newHeight];
        return this.transform();
    }

    transform(rec = this.rec) {
        return {
            translate: p => [
                Math.round(this.cvw * (p[0] - rec[0]) / rec[2]),
                Math.round(this.cvh * (p[1] - rec[1]) / rec[3])
            ],
            bounds: [
                Math.round(rec[0]),
                Math.round(rec[1]),
                Math.round(rec[0] + rec[2]),
                Math.round(rec[1] + rec[3])
            ]
        };
    }

    resize(cvWidth, cvHeight) {
        // TODO
    }

    scale() {
        return this.scl;
    }

    dragStart(offset) {
        this.startBounds = this.rec.slice(0);
        this.tmpBounds = this.rec.slice(0);
        this.m0 = offset;
    }

    dragTo(offset) {
        this.tmpBounds[0] = this.startBounds[0] + (offset[0] - this.m0[0]) * this.scl;
        this.tmpBounds[1] = this.startBounds[1] + (offset[1] - this.m0[1]) * this.scl;
        return this.transform(this.tmpBounds);
    }

    dragEnd() {
        this.rec = this.tmpBounds;
        this.startBounds = undefined;
        this.m0 = undefined;
        this.tmpBounds = undefined;
    }

    reset() {
        this.rec = [0, 0, this.cvw, this.cvh];
        this.scl = 1;
    }

}