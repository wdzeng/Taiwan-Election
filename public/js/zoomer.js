class Zoomer {

    constructor(cvWidth, cvHeight) {
        this.cvw = cvWidth;
        this.cvh = cvHeight;
        this.rec = [0, 0, cvWidth, cvHeight];
    }

    zoom(scale, offx, offy) {
        let newWidth = this.rec[2] / scale;
        let newHeight = this.rec[3] / scale;

        let tx = offx * this.rec[2] / this.cvw;
        let ty = offy * this.rec[3] / this.cvh;
        let temp = 1 - 1 / scale;
        let newX = this.rec[0] + tx * temp;
        let newY = this.rec[1] + ty * temp;
        this.rec = [newX, newY, newWidth, newHeight];
        return this;
    }

    transform() {
        return p => [
            Math.round(this.cvw * (p[0] - this.rec[0]) / this.rec[2]),
            Math.round(this.cvh * (p[1] - this.rec[1]) / this.rec[3])
        ];
    }

    bounds() {
        return [
            Math.round(this.rec[0]),
            Math.round(this.rec[1]),
            Math.round(this.rec[0] + this.rec[2]),
            Math.round(this.rec[1] + this.rec[3])
        ];
    }

}