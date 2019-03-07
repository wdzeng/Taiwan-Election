/**
 * Find the transformation coefficient to transform a line to another by linear transformation.
 * @param {Array} i The input line [x0,x1].
 * @param {Array} o The output line [y0,y1].
 * @return {Object} An object indicating a and b such that input(x) is converted to output(y) by a * x + b = y.
 */
function lineTransformer(i, o) {
    const a = (o[1] - o[0]) / (i[1] - i[0]);
    const b = o[0] - a * i[0];
    return { a: a, b: b };
}

/**
 * Find the transformation coefficient to transform a rectangle to another by linear transformation.
 * @param {Array} i The input rectangle [leftTop,rightBottom] where two args are of the form [x,y].
 * @param {Array} o The output rectangle [leftTop,rightBottom] where two args are of the form [x,y].
 * @returns {Object} An object indicating a, bx, by such that input([x0,y0]) is converted to output([x1,y1]) by a * x0 + bx = x1 and a * y0 + by = y1. 
 */
function recTransformer(i, o) {

    // Functions to get width or height of a rectangle.
    const
        w = rec => rec[1][0] - rec[0][0],
        h = rec => rec[1][1] - rec[0][1];

    // Get width, height and ratio of input and output.
    const
        iw = w(i),
        ih = h(i),
        ir = ih / iw,
        ow = w(o),
        oh = h(o),
        or = oh / ow;

    // Find coefficient.
    if (or > ir) { // Output too high
        let correspondOutputHeight = ow * ir,
            space = (oh - correspondOutputHeight) / 2,
            xTrans = lineTransformer([i[0][0], i[1][0]], [o[0][0], o[1][0]]),
            yTrans = lineTransformer([i[0][1], i[1][1]], [spcae, oh - space]);
        return { a: xTrans.a, bx: xTrans.b, by: yTrans.b }; // xTrans.a is equaled to yTrans.a
    }
    else { // Output too wide
        let correspondOutputWidth = oh / ir,
            space = (ow - correspondOutputWidth) / 2,
            yTrans = lineTransformer([i[0][1], i[1][1]], [o[0][1], o[1][1]]),
            xTrans = lineTransformer([i[0][0], i[1][1]], [space, ow - space]);
        return { a: yTrans.x, bx: xTrans.b, by: yTrans.b }; // xTrans.a is equaled to yTrans.a
    }
}

/**
 * This class used to determine the transform function of a map. If given a point [x,y], transform this point to [ax*x+bx,ay*y+by].
 */
export class Locator {

    /**
     * Constructs a locator with init info.
     * @param {Array} bbox Visible part of the map. Of the form [ [x0,y0], [x1,y1] ].
     * @param {Array} cvSize Size of canvas [canvasWidth,canvasHeight].
     * @param {Number} pad Padding, default to zero.
     */
    constructor(bbox, cvSize, pad = 0) {

        // Find the canvas bbox
        const cvBox = [[pad, pad], [cvSize[0] - pad, cvSize[1] - pad]];

        // Find coefficient.
        // Convert a point(x0,y0) to canvas coordinate(x1,y1) by a * x0 + bx = x1 and a * y0 + by = y1
        const coeffs = recTransformer(bbox, cvBox);
        this._a = coeffs.a;
        this._bx = coeffs.bx;
        this._by = coeffs.by;
    }

    /**
     * Zoom the map. Call this method then transformer to get the updated transformation function.
     * @param {Number} scale The scale of zoom. Greater than 1 indicating zoom in; otherwise zoom out. 
     * @param {Array} msLoc Location of mouse [x,y]. 
     * @param {Array} cvSize Size of canvas [width,height].
     * @param returns this.
     */
    zoom(scale, msLoc, cvSize) {

        // Find the new viewbox, then find the transformation from old viewbox to the new one.
        // From the source point(x0,y0) to the old viewbox(x1,y1) then to new viewbox(x2,y2).
        // Using secondTransformer to convert (x1,y1) to (x2,y2)
        const
            newLeftTop = [-msLoc[0] * scale, -msLoc[1] * scale],
            newRightBottom = [(cvSize[0] - msLoc[0]) * scale, (cvSize[1] - msLoc[1]) * scale],
            secondTransformer = recTransformer([[0, 0], cvSize], [newLeftTop, newRightBottom]);

        // Flatten the two transformation function to one.
        this._a *= secondTransformer.a;
        this._bx = secondTransformer.a * this._bx + secondTransformer.bx;
        this._by = secondTransformer.b * this._by + secondTransformer.by;

        return this;
    }

    /**
     * Get the transformer which coverts a point to another. The point should have been projected (ex by mercator).
     */
    transformer() {
        return function (point) {
            return [
                this._a * point[0] + this._bx,
                this._a * point[1] + this._by
            ];
        }
    }
}