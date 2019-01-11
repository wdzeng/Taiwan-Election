export default class Locator {

    constructor(cvWidth, cvHeight, drWidth, drHeight, padding = 0) {
        const pad2 = padding * 2;
        this.cvw = cvWidth - pad2;
        this.cvh = cvHeight - pad2;
        this.drw = drWidth;
        this.drh = drHeight;
        this.padding = padding;
        this.reset();
    }

    zoom(scale, offx, offy) {

        offx -= this.padding;
        offy -= this.padding;
        this.scl *= scale;

        let newWidth = this.rec[2] / scale;
        let newHeight = this.rec[3] / scale;
        let mousex = this.rec[0] + this.rec[2] * offx / this.cvw;
        let mousey = this.rec[1] + this.rec[3] * offy / this.cvh;

        this.rec = ensureInRange([
            mousex - newWidth * offx / this.cvw,
            mousey - newHeight * offy / this.cvh,
            newWidth,
            newHeight
        ], [this.drw, this.drh], this.padding);
        return this.transform();
    }

    transform(bbox = this.rec) {
        const vspad = this.padding,
            vspad2 = vspad * 2;
        return {
            translate: p => [
                Math.round(vspad + this.cvw * (p[0] - bbox[0]) / bbox[2]),
                Math.round(vspad + this.cvh * (p[1] - bbox[1]) / bbox[3])
            ],
            bounds: [
                Math.round(bbox[0] - vspad),
                Math.round(bbox[1] - vspad),
                Math.round(bbox[0] + bbox[2] + vspad2),
                Math.round(bbox[1] + bbox[3] + vspad2)
            ],
            scale: this.scl
        };
    }

    resize(cvWidth, cvHeight, padding = 0) {

        cvWidth -= 2 * padding;
        cvHeight -= 2 * padding;

        let midx = this.rec[0] + this.rec[2] / 2;
        let midy = this.rec[1] + this.rec[3] / 2;

        this.rec[2] *= (cvWidth / this.cvw)
        this.rec[3] *= (cvHeight / this.cvh);
        this.rec[0] = midx - this.rec[2] / 2;
        this.rec[1] = midy - this.rec[3] / 2;
        this.rec = ensureInRange(this.rec, [this.drw, this.drh], this.padding);

        this.cvw = cvWidth;
        this.cvh = cvHeight;
        this.padding = padding;
        return this.transform();
    }

    scale() {
        return this.scl;
    }

    dragStart(offset) {
        this.startBounds = this.rec.slice(0); // copy array
        this.tmpBounds = this.rec.slice(0);   // copy array
        this.m0 = [offset[0] - this.padding, offset[1] - this.padding];
    }

    dragTo(offset) {
        let newx = this.startBounds[0] - (offset[0] - this.m0[0] - this.padding) / this.scl,
            newy = this.startBounds[1] - (offset[1] - this.m0[1] - this.padding) / this.scl,
            newrec = ensureInRange([newx, newy, this.rec[2], this.rec[3]], [this.drw, this.drh], this.padding);
        if (eqrec(newrec, this.tmpBounds)) return null;
        this.tmpBounds = newrec;
        return this.transform(newrec);
    }

    dragEnd() {
        if (!this.tmpBounds) return;
        this.rec = this.tmpBounds;
        this.startBounds = undefined;
        this.m0 = undefined;
        this.tmpBounds = undefined;
    }

    reset() {
        let cratio = this.cvw / this.cvh,
            dratio = this.drw / this.drh,
            x,
            y,
            w,
            h;
        if (cratio < dratio) {
            // Canvas too slim
            x = 0;
            w = this.drw;
            h = this.drw / cratio;
            y = (this.drh - h) / 2;
            this.scl = this.cvw / this.drw;
        }
        else {
            // Canvas too wide
            y = 0;
            h = this.drh;
            w = this.drh * cratio;
            x = (this.drw - w) / 2;
            this.scl = this.cvh / this.drh;
        }
        this.rec = [x, y, w, h];
    }

    draft(p) {
        return [
            (p[0] - this.padding) * this.rec[2] / this.cvw + this.rec[0],
            (p[1] - this.padding) * this.rec[3] / this.cvh + this.rec[1],
        ]
    }

    pureTranslate(bbox = this.rec) {
        let _this = this;
        return p => [
            _this.padding + _this.cvw * (p[0] - bbox[0]) / bbox[2],
            _this.padding + _this.cvh * (p[1] - bbox[1]) / bbox[3]
        ]
    }
}

function ensureInRange(tested, dimension) {

    if (tested[2] > dimension[0]) tested[0] = (dimension[0] - tested[2]) / 2;
    else if (tested[0] < 0) tested[0] = 0;
    else if (tested[0] + tested[2] > dimension[0]) tested[0] = dimension[0] - tested[2];

    if (tested[3] > dimension[1]) tested[1] = (dimension[1] - tested[3]) / 2;
    else if (tested[1] < 0) tested[1] = 0;
    else if (tested[1] + tested[3] > dimension[1]) tested[1] = dimension[1] - tested[3];

    return tested;
}

function eqrec(rec1, rec2) {
    return rec1[0] === rec2[0]
        && rec1[1] === rec2[1]
        && rec1[2] === rec2[2]
        && rec1[3] === rec2[3];
}