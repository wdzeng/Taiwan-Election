import Locator from "./locator.js";
import Polygon from "./shape.js";

/**
 * It is convenient to build a Map using MapBuilder.
 */
export class MapBuilder {

    constructor() {
    }

    namer(namer) {
        this._namer = namer;
        return this;
    }

    proj(proj) {
        this._projection = proj;
        return this;
    }

    source(geojson) {
        this._source = geojson;
        return this;
    }

    container(element) {
        this._container = element;
        return this;
    }

    padding(pad) {
        this._padding = pad;
        return this;
    }

    zoomScale(scale) {
        this._zoomScale = scale;
        return this;
    }

    maxZoom(maxNum) {
        this.maxNum = maxNum;
        return this;
    }

    build() {
        return new Map(this._source, this._container, this._projection, this._namer, this._padding, this._zoomScale, this.maxNum);
    }
}


/**
 * This class helps draw topojson onto the canvas. Once a map instance is created, geojson is not immediately be converted into polygon objects. Instead, this process runs everytime when layers are reset. Pens are used to draw strokes; buckets are used to draw backgrounds.
 */
class Map {

    /**
     * Generates a map object.
     * @param {Object} geo Geojson object of the map.
     * @param {Element} box Container element to put canvas.
     * @param {Function} proj Map projection used. Ex merctor projection.
     * @param {Function} namer This function determines the name of each polygon. Geojson feature object is passed in and should return name of this feature.
     * @param {Number} pad Padding of canvas.
     * @param {Number} zscale Magnification of zoom action.
     * @param {Number} maxz Max number of zoom times.
     */
    constructor(geo, box, proj, namer, pad, zscale, maxz) {

        // Check if source is valid
        if (geo.type !== "FeatureCollection")
            throw "This source is invalid.";
        // Filter polygon and multipolygons
        this._features = geo.features
            .filter(fea => fea.geometry.type === "Polygon" || fea.geometry.type === "MultiPolygon");

        this._proj = proj;
        this._pgNamer = namer;
        this._pad = pad;
        this._zscale = zscale;
        this._maxz = maxz;
        this._box = box;
    }

    /**
     * Get or set the padding.
     * @param {Number} pad padding; 
     */
    padding(pad) {
        if (pad === undefined) {
            return this._pad;
        }
        this._pad = pad;
        return this;
    }

    /**
     * Get or set the drawing style of each layers by given styler.
     * @param {Function} styler Function returning drawing style info object.
     */
    style(styler) {
        if (styler === undefined) {
            return this._styler;
        }
        this._styler = styler;
        return this;
    }

    /**
     * Get or set layers. Not bottle-neck.
     * @param strokeTokenGenerator A function that returns a string indicating a token of a passed-in feature. Features having same token are considered to be in same stroke layer. If returning false, the feature is ignored.
     * @param fillTokenGenerator Same as above.
     * @returns this.
     */
    layers(strokeTokenGenerator, fillTokenGenerator) {

        // Reset pens and buckets
        this._strokeLayers = {}; this._fillLayers = {};
        let pgName;
        this._features.forEach(feature => {
            pgName = this._pgNamer(feature);
            addFeatureToPainter(this._strokeLayers, feature, strokeTokenGenerator(feature), pgName);
            addFeatureToPainter(this._fillLayers, feature, fillTokenGenerator(feature), pgName);
        });

        return this;
    }

    /**
     * Draw or redraw map onto canvas. If canvas has not been create, create an canvas into the container.
     * @returns this.
     */
    paint(tfm) {

        const ctx = null;   // TODO
        const cvWidth = 0;  // TODO
        const cvHeight = 0; // TODO

        // Check if canvas is created
        // TODO

        // If transformer is undefined, use default transformer which draws the whole map.
        this._tfm || this.fit();

        function drawBackground() {
            for (let key in this._buckets) {
                let style = this._styler(key);
                // Check if this layer is ignroed
                if (!style || !style.background) continue;
                // Set style
                ctx.fillStyle = style.background;
                // Draw
                ctx.beginPath();
                this._buckets[key].drawPath(ctx, tfm, cvWidth, cvHeight);
                ctx.fill();
            }
        }

        function drawStrokes() {
            for (let key in this._pens) {
                let style = this._styler(key).lineWidth;
                // Check if this layer is ignroed
                if (!style || !style.strokeWidth || !style.strokeColor) continue;
                // Set style                
                ctx.lineWidth = style.strokeWidth;
                ctx.strokeStyle = style.strokeColor;
                ctx.setLineDash(style.strokeDash || []); // If line dash info is omitted, draw solid line
                // Draw
                ctx.beginPath();
                this._pens[key].drawPath(ctx, tfm, cvWidth, cvHeight);
                ctx.stroke();
            }
        }

        drawBackground();
        drawStrokes();
    }

    /**
     * Zoom the map so that it fits the given area. The canvas would not be refreshed until paint method is called.
     * @param {String} polygon Let this map fit this geology polygon area; or omit to fit the whole area. 
     * @return this.
     */
    fit(polygon) {
        this._locator = 
    }

    /**
     * Set zooming policy. User can still call fit method to set canvas though set this to false.
     * @param {boolean} flag true indicating this map is zoomable by mouse. 
     */
    zoomable(flag) {

    }
}

/**
 * Convert a feature to polygon(s) and put it into the painter.
 * @param {*} painter Painter to put in polygon(s).
 * @param {*} feature Geology feature to be converted to polygon(s).
 * @param {*} token Name of layer.
 * @param {*} polygonName Name of polygon.
 */
function addFeatureToPainter(painter, feature, token, polygonName) {
    // If token is false, ignore this feature
    if (!token) return;
    // Check if the layer has been created
    if (painter[token] === undefined) painter[token] = [];
    // Each pen at first is a feature array. These features will be merged after
    painter[token].push(Polygon.feature(feature, polygonName));
}