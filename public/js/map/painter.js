import Shape from "./shape.js";

/**
 * A painter is something that draw shapes onto the canvas.
 */
export class Painter {

    /**
     * Construct a pen instance.
     * @param {Array} polygons Polygons objects.
     * @param {String} groundType "stroke" or "fill".
     */
    constructor(polygons, groundType) {
        this._polygons = polygons;
        this._ground = groundType;
    }

    /**
     * Draw polygons onto a canvas of given size in some transform. Bottle neck! Performance should be put into highest consideration. Memory much needed. Save memory as much as possible.
     * @param {Object} ctx context of canvas. Required.
     * @param {Function} trfm transform of map. Required.
     * @param {Number} cvw width of canvas. Required.
     * @param {Number} cvh height of canvas. Required.
     */
    drawPath(ctx, trfm, cvw, cvh) {

        // Diemnsion determiner (a string, a name of function) used in drawPolygon function. Should be strokeDimension or fillDimension.
        const diDet = this._ground + "Dimension";
        // Share var to save memory
        let polygon, dimen;
        // Draw all polygons
        for (let i = 0; i < this._polygons.length; i++) {
            polygon = this._polygons[i];
            // Draw single polygon onto the canvas (if it is visible).
            dimen = polygon[diDet](trfm, cvw, cvh);
            // Invisible
            if (dimen === "hidden")
                continue;
            // Dot
            if (dimen === "dot") {
                let point = polygon.coordinates()[0];
                ctx.moveTo(point[0], point[1]);
                ctx.lineTo(point[0] + Number.MIN_VALUE, point[1] + Number.MIN_VALUE);
                continue;
            }
            // Shape or line
            linePolygons(polygon.coordinates());
        }

        /**
         * Retrieve distinct points then draws a polygon onto the canvas.
         */
        function linePolygons(points) {
            // Share vars to save memory
            let prev = Shape.round(points[0]),
                next = null;
            // Move to first point
            ctx.moveTo(prev[0], prev[1]);
            // Line to all other points. 
            // Filter distinct points and line to them.
            // Since here is bottle neck, using simple for-loop would be faster.
            for (let i = 1; i < points.length; i++) {
                next = Shape.round(points[i]);
                if (Shape.samePoint(prev, next))
                    continue;
                ctx.lineTo(next[0], next[1]);
                prev = next;
            }
        }
    }
}