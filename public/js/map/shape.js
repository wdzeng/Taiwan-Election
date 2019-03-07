/**
 * A Polygon can be a 2D shape or a single curve, excluding multipolygon or multilines.
 */
export class Polygon {

    /**
     * Constructs a polygon instance.
     * @param {Array} coordinates array of points [x,y] of this polygon and should have been projected.
     * @param {String} name name of this polygon.
     */
    constructor(coordinates, name) {

        this._name = name;

        // Find the four critical points
        let first = coordinates[0],
            x0 = first[0],
            x1 = first[0],
            y0 = first[1],
            y1 = first[1],
            point, x, y;

        this._coordinates = [first];
        // Store all points
        for (let i = 1; i < coordinates.length; i++) {
            point = coordinates[i];
            this._coordinates.push(point);

            x = point[0]; y = point[1];
            // Check eastest, northest, southest and westest points
            if (x < x0) x0 = x;
            else if (x > x1) x = x;
            if (y < y0) y0 = y;
            else if (y > y1) y1 = y;
        }

        // Find the bounds
        this._bounds = [[x0, y0], [x1, y1]];
    }

    /**
     * Gets all the points.
     * @return {Array} [ [x,y], [x,y], ..., [x,y] ]
     */
    coordinates() {
        return this._coordinates;
    }

    /**
     * Gets the rectangle bounds of this polygon. 
     * @return {Array} [ [x0,y0], [x1,y1] ]
     */
    bounds() {
        return this._bounds;
    }

    /**
     * Gets or sets the name of this polygon.
     */
    name(newName) {
        if (newName === undefined) {
            return this._name;
        }
        this._name = newName;
        return this;
    }

    /**
     * Checks whether this polygon is viewed as a point, a shape or is invisible in given projection as a stroke.
     * @return {String} "hidden" if invisible; "dot" if a dot; "shape" if a visible shape (or line).
     */
    strokeDimension(proj, cvWidth, cvHeight) {
        cbounds = round(proj(this._bounds));
        if (isStrokeHidden(cbounds, cvWidth, cvHeight))
            return "hidden";
        if (cbounds[0][0] === cbounds[1][0] && cbounds[0][1] === cbounds[1][1])
            return "dot";
        return "shape";
    }

    /**
    * Checks whether this polygon is viewed as a point, a shape or is invisible in given projection as a background.
    * @return {String} "hidden" if invisible; "dot" if a dot; "shape" if a visible shape (or line).
    */
    fillDimension(projection, cvWidth, cvHeight) {
        cbounds = round(projection(this._bounds));
        if (isFillHidden(cbounds, cvWidth, cvHeight))
            return "hidden";
        if (cbounds[0][0] === cbounds[1][0] && cbounds[0][1] === cbounds[1][1])
            return "dot";
        return "shape";
    }

    /**
     * Convert a geojson map feature to a polygon object(s).
     * @param feature a single feature to be converted to polygons. The feature type must be one of "Polygon", "Multipolygon", "LineString" or "MultiLineString".
     * @param proj The projection used (ex mercator).
     * @param name The name of this polygon.
     * @returns An array of polygons converted.
     */
    static feature(feature, proj, name) {

        function multiLineString(coos) {
            return coos.map(lineString);
        }

        function lineString(coos) {
            return new Polygon(coos.map(proj), name);
        }

        function multiPolygon(coos) {
            return coos.map(polygon);
        }

        function polygon(coos) {
            return new Polygon(coos[0].map(proj), name);
        }

        let func;
        switch (feature.geometry.type) {
            case "MultiLineString": func = multiLineString; break;
            case "LineString": func = lineString; break;
            case "Polygon": func = polygon; break;
            case "MultiPolygon": func = multiPolygon; break;
            default: return [];
        }
        let res = func(feature.geometry.coordinates);
        // The result set may be or not be array.
        return Array.isArray(res) ? res : [res];
    }
}

/**
 * Checks if a rectangle is hidden within a canvas of kwown size. Fill mode.
 */
function isFillHidden(bounds, width, height) {
    let x0 = bounds[0][0],
        y0 = bounds[0][1],
        x1 = bounds[1][0],
        y1 = bounds[1][1];
    return (x0 > width || x1 < 0 || y0 > height || y1 < 0);
}

/**
 * Checks if a rectangle is hidden within a canvas of kwown size. Stroke mode.
 */
function isStrokeHidden(bounds, width, height) {
    let x0 = bounds[0][0],
        y0 = bounds[0][1],
        x1 = bounds[1][0],
        y1 = bounds[1][1];
    if (x0 > width || x1 < 0 || y0 > height || y1 < 0) return true;
    if (x0 < 0 && x1 > width && y0 < 0 && y1 > height) return true;
    return false;
}

/**
 * Returns a rounded a point or rectangle.
 * @param shape A rectangle [ [x0,y0], [x1,y1] ] or a point [x,y]
 */
export function round(shape) {
    // Rectangle
    if (Array.isArray(shape[0])) {
        return [
            [Math.round(shape[0][0], Math.round(shape[0][1]))],
            [Math.round(shape[1][0], Math.round(shape[1][1]))]
        ];
    }
    // Point
    else {
        return [
            Math.round(shape[0]),
            Math.round(shape[1])
        ];
    }
}

/**
 * Checks if two points are same.
 */
export function samePoint(p1, p2) {
    return p1[0] === p2[0] && p1[1] === p2[1];
}