import Lines from './line.js';

export default class CanvasPainter {

    constructor(proj) {
        this.proj = proj;
        this.set = new Lines();
    }

    add(object) {
        switch (object.type) {
            case 'Feature': this.addFeature(object); return;
            case 'FeatureCollection': this.addFeatureCollection(object); return;
        }
    }

    addFeatureCollection(collection) {
        collection.features.forEach(f => this.addFeature(f));
    }

    addFeature(feature) {
        switch (feature.geometry.type) {
            case 'Polygon': feature.geometry.coordinates.forEach(c => this.addPolygon(c)); return;
            case 'MultiPolygon': feature.geometry.coordinates.forEach(c => c.forEach(c => this.addPolygon(c))); return;
        }
    }

    addPolygon(poly) {

        // Set start point
        let prevPoint = roundPoint(this.proj(poly[0]));

        // Add lines
        let nextPoint;
        poly.slice(1).forEach(v => {
            nextPoint = roundPoint(this.proj(v));
            if (eqPoint(prevPoint, nextPoint)) return;
            this.set.fill(prevPoint, nextPoint);
            prevPoint = nextPoint;
        });
    }

    drawCanvas(context) {
        let segs = this.set.getSegments();

        let t0 = new Date().getTime();
        context.beginPath();
        segs.forEach(line => {
            context.moveTo(line[0], line[1]);
            context.lineTo(line[2], line[3]);
        })
        context.stroke();
        let t1 = new Date().getTime();
        console.log(`Drawing takes ${t1 - t0} ms. There are ${segs.length} segments.`);
    }

    getLines() {
        return this.set.getSegments();
    }

}

const GRANULE = 1;

function roundPoint(p) {
    return [p[0] - p[0] % GRANULE, p[1] - p[1] % GRANULE];
}

function eqPoint(p0, p1) {
    return p0[0] === p1[0] && p0[1] === p1[1];
}

