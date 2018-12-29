import LineRenderer from './line-renderer.js';

export default class Pencil {

    constructor(proj) {

        this.proj = proj;
        this.polygons = [];
    }

    addFeatureCollection(name, fc) {
        fc.features.forEach(f => this.addFeature(name, f));
    }

    addFeature(name, fea) {
        switch (fea.geometry.type) {
            case 'Polygon':
                fea.geometry.coordinates.forEach(c => this.addPolygon(name, c));
                return;
            case 'MultiPolygon':
                fea.geometry.coordinates.forEach(c => c.forEach(c => this.addPolygon(name, c)));
                return;
        }
    }

    prepare(name, object) {

        switch (object.type) {

            case 'Feature':
                this.addFeature(name, object);
                return;

            case 'FeatureCollection':
                this.addFeatureCollection(name, object);
                return;

            case 'MultiLineString':
                object.coordinates.forEach(c => this.addPolygon(name, c))
                return;
        }
    }

    getFigure(bounds, granule = 1) {

        this.lr = new LineRenderer();
        let filted = bounds ? this.polygons.filter(pg => pg.involve(bounds)) : this.polygons;
        filted.forEach(pg => this.render(pg.coordinates, pg.bounds, granule));
        let segs = this.lr.getSegments();
        return segs;
    }

    // Bottle neck here
    render(cords, bounds, granule = 1) {

        /*
        // Check bounds
        let leftTop = rndp([bounds[0], bounds[1]], granule);
        let rightBottom = rndp([bounds[2], bounds[3]], granule);

        // 2x2 dots all filled
        if (eqp([leftTop[0] + 1, leftTop[1] + 1], rightBottom)) {
            this.lr.fill(leftTop, [rightBottom[0], rightBottom[1] - 1]);
            this.lr.fill([leftTop[0], leftTop[1] + 1], rightBottom);
            return;
        }

        // 1x2 or 2x1 dots
        if (eqp([leftTop[0], leftTop[1] + 1], rightBottom)) {
            this.lr.fill(leftTop, rightBottom); return;
        }
        if (eqp([leftTop[0] + 1, leftTop[1]], rightBottom)) {
            this.lr.fill(leftTop, rightBottom); return;
        }

        // Ignore 1x1 dot
        if (eqp(leftTop, rightBottom)) return;
        */

        // Set start point
        let pp = rndp(cords[0], granule);

        // Render lines
        let np;
        for (let i = 1; i < cords.length; i++) {
            np = rndp(cords[i], granule);
            // Check distinct points
            if (eqp(pp, np)) continue;
            // Render new line
            this.lr.fill(pp, np);
            pp = np;
        };
    }

    addPolygon(name, cords) {

        let first = this.proj(cords[0]), cvc = [first];
        let x0 = first[0], y0 = first[1], x1 = first[0], y1 = first[1];

        cords.slice(1).forEach(c => {
            c = this.proj(c);
            cvc.push(c);
            if (c[0] < x0) x0 = c[0];
            else if (c[0] > x1) x1 = c[0];
            if (c[1] < y0) y0 = c[1];
            else if (c[1] > y1) y1 = c[1];
        });

        this.polygons.push(new Polygon(name, cvc, [x0, y0, x1, y1]));
    }

    each(bounds, granule = 1, f) {

        this.lr = new LineRenderer();
        let filted = bounds ? this.polygons.filter(pg => pg.involve(bounds)) : this.polygons;
        filted.forEach(pg => this.render(pg.coordinates, pg.bounds, granule));
        let segs = this.lr.each(f);
        return segs;
    }
}

class Polygon {

    constructor(name, coordinates, bounds) {

        this.name = name;
        this.coordinates = coordinates;
        this.bounds = bounds;
    }

    involve(b) {
        return inRange(this.bounds[0], b[0], b[2]) && inRange(this.bounds[1], b[1], b[3])
            || inRange(this.bounds[2], b[0], b[2]) && inRange(this.bounds[3], b[1], b[3])
            || inRange(this.bounds[2], b[0], b[2]) && inRange(this.bounds[1], b[1], b[3])
            || inRange(this.bounds[0], b[0], b[2]) && inRange(this.bounds[3], b[1], b[3]);
    }
}

function rndp(p, g = 1) {
    return [p[0] - p[0] % g, p[1] - p[1] % g];
}

function eqp(p0, p1) {
    return p0[0] === p1[0] && p0[1] === p1[1];
}

function inRange(val, min, max) {
    return min < val && val < max;
}