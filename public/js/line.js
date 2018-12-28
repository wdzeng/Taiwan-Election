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

    fillX(lx, rx) {

        let range = rangeIn(this.points, lx, rx);
        let newStart = range[0] % 2 === 1;
        let newEnd = range[1] % 2 === 0;
        let insIndex = range[0] + 1;
        let nReplaced = range[1] - range[0] - 1;

        if (newStart) {
            if (newEnd) this.points.splice(insIndex, nReplaced, lx, rx);
            else this.points.splice(insIndex, nReplaced, lx);
        }
        else {
            if (newEnd) this.points.splice(insIndex, nReplaced, rx);
            else this.points.splice(insIndex, nReplaced);
        }
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
}

class VertView {

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
        let newStart = range[0] % 2 === 1;
        let newEnd = range[1] % 2 === 0;
        let insIndex = range[0] + 1;
        let nReplaced = range[1] - range[0] - 1;

        if (newStart) {
            if (newEnd) this.points.splice(insIndex, nReplaced, ly, ry);
            else this.points.splice(insIndex, nReplaced, ly);
        }
        else {
            if (newEnd) this.points.splice(insIndex, nReplaced, ry);
            else this.points.splice(insIndex, nReplaced);
        }
    }

    getSegments() {
        let segments = [];
        for (let i = 2; i < this.points.length - 2; i += 2) {
            segments.push([this.x, this.points[i], this.x, this.points[i + 1]]);
        }
        return segments;
    }
}

// TODO
function inRange(array, min, max) {

    let left = 0, right = 0;

    let i = 0;
    for (; i < array.length; i++) {
        if (array[i] >= min) {
            left = i;
            break;
        }
    }
    for (; i < array.length; i++) {
        if (array[i] > max) {
            right = i - 1;
            break;
        }
    }

    return [left, right];
}

export default class Lines {

    constructor() {
        this.lineviews = {};
    }

    getLineView(formula) {
        let key = formula[2];
        if (this.lineviews[key]) return this.lineviews[key];

        let newLine;
        if (formula[0] === Number.POSITIVE_INFINITY) newLine = new VertView(formula[1]);
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

}

function formula(s, f) {
    if (s[0] === f[0])
        return [Number.POSITIVE_INFINITY, s[0], s[0].toString()];

    let m = (f[1] - s[1]) / (f[0] - s[0]);
    let b = s[1] - m * s[0];
    return [m, b, m + ',' + b];
}

