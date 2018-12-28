function rangeIn(array, min, max) {

    return [lessex(array, min), greatex(array, max)];
}

function lessex(array, val) {

    let left = 0, right = array.length - 1;
    let mid;
    while (1) {
        mid = Math.floor((left + right) / 2);
        if (array[mid] === val) return mid - 1;
        if (left === right - 1) return left;
        if (array[mid] > val) right = mid;
        else left = mid;
    }
}

function greatex(array, val) {

    let left = 0, right = array.length - 1;
    let mid;
    while (1) {
        mid = Math.floor((left + right) / 2);
        if (array[mid] === val) return mid + 1;
        if (left === right - 1) return right;
        if (array[mid] > val) right = mid;
        else left = mid;
    }
}

function formula(s, f) {
    if (s[0] === f[0])
        return [Number.POSITIVE_INFINITY, s[0], s[0].toString()];

    let m = (f[1] - s[1]) / (f[0] - s[0]);
    let b = s[1] - m * s[0];
    return [m, b, m + ',' + b];
}

class LineView {

    constructor(m, b) {
        this.m = m;
        this.b = b;
        this.points = [-99999, -99998, 99998, 99999];
    }

    fill(p0, p1) {
        if (p0[0] < p1[0]) this.fillX(p0[0], p1[0]);
        else this.fillX(p1[0], p0[0]);
    }

    // Neck-bottle here. Performance as high as possible.
    // Splice is too slow!!
    fillX(lx, rx) {

        let range = rangeIn(this.points, lx, rx);
        // let newStart = range[0] & 1;
        // let newEnd = !(range[1] & 1);
        let insIndex = range[0] + 1;
        let nReplaced = range[1] - insIndex;

        if (range[0] & 1) {
            // New start point
            if (range[1] & 1) {
                // No new end point
                if (nReplaced === 1) this.points[insIndex] = lx;
                else this.points.splice(insIndex, nReplaced, lx);
                return;
            }
            // New end point
            if (nReplaced === 2) {
                this.points[insIndex] = lx;
                this.points[insIndex + 1] = rx;
            }
            else this.points.splice(insIndex, nReplaced, lx, rx);
            return;
        }

        // No new start point
        if (range[1] & 1) {
            // No new end point
            if (nReplaced) this.points.splice(insIndex, nReplaced);
            return;
        }

        // New end point
        if (nReplaced === 1) this.points[insIndex] = rx;
        else this.points.splice(insIndex, nReplaced, rx);
    }

    y(x) {
        return this.m * x + this.b;
    }

    getSegments() {
        let segments = [];
        for (let i = 2; i < this.points.length - 2; i += 2) {
            segments.push([this.points[i], this.y(this.points[i]), this.points[i + 1], this.y(this.points[i + 1])]);
        }
        return segments;
    }

    each(f) {
        for (let i = 2; i < this.points.length - 2; i += 2) {
            f([this.points[i], this.y(this.points[i]), this.points[i + 1], this.y(this.points[i + 1])]);
        }
    }
}

class VerticalLineView {

    constructor(x) {
        this.x = x;
        this.points = [-99999, -99998, 99998, 99999];
    }

    fill(p0, p1) {
        if (p0[1] < p1[1]) this.fillY(p0[1], p1[1]);
        else this.fillY(p1[1], p0[1]);
    }

    fillY(ly, ry) {

        let range = rangeIn(this.points, ly, ry);
        // let newStart = range[0] & 1;
        // let newEnd = range[1] % 2 === 0;
        let insIndex = range[0] + 1;
        let nReplaced = range[1] - insIndex;

        if (range[0] & 1) {
            if (range[1] & 1) this.points.splice(insIndex, nReplaced, ly);
            else this.points.splice(insIndex, nReplaced, ly, ry);
        }
        else {
            if (range[1] & 1) this.points.splice(insIndex, nReplaced);
            else this.points.splice(insIndex, nReplaced, ry);
        }
    }

    getSegments() {
        let segments = [];
        for (let i = 2; i < this.points.length - 2; i += 2) {
            segments.push([this.x, this.points[i], this.x, this.points[i + 1]]);
        }
        return segments;
    }

    each(f) {
        for (let i = 2; i < this.points.length - 2; i += 2) {
            f([this.x, this.points[i], this.x, this.points[i + 1]]);
        }
    }
}

export default class LineRenderer {

    constructor() {
        this.lineviews = {};
    }

    getLineView(formula) {
        let key = formula[2];
        if (this.lineviews[key]) return this.lineviews[key];

        let newLine;
        if (formula[0] === Number.POSITIVE_INFINITY) newLine = new VerticalLineView(formula[1]);
        else newLine = new LineView(formula[0], formula[1]);

        this.lineviews[key] = newLine;
        return newLine;
    }

    fill(s, f) {
        let fm = formula(s, f);
        this.getLineView(fm).fill(s, f);
    }

    getSegments() {
        let segments = [];
        Object.values(this.lineviews).forEach(lv => {
            segments = segments.concat(lv.getSegments());
        });
        return segments;
    }

    each(f) {
        Object.values(this.lineviews).forEach(lv => lv.each(f));
    }
}
