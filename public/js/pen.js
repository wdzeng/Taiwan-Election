class Polygon {

    constructor(coordinates, granule) {
        let prev = round(coordinates[0], granule),
            next,
            x0 = prev[0],
            y0 = prev[1],
            x1 = x0,
            y1 = y0,
            arr = [prev];

        for (let i = 1; i < coordinates.length; i++) {
            next = round(coordinates[i], granule);
            if (eq(prev, next)) continue;
            if (next[0] < x0) x0 = next[0];
            else if (next[0] > x1) x1 = next[0];
            if (next[1] < y0) y0 = next[1];
            else if (next[1] > y1) y1 = next[1];
            arr.push(next);
            prev = next;
        }

        this._coordinates = arr;
        this._bounds = [x0, y0, x1, y1];
    }

    bounds() {
        return this._bounds;
    }

    coordiates() {
        return this._coordinates;
    }
}

class Pen {

    constructor(geo, proj, granule = 1 / 256) {
        switch (geo.type) {
            case 'MultiLineString':
                this.polygons = geo.coordinates.map(c => new Polygon(c.map(p => proj(p)), granule));
                break;
            case 'MultiPolygon':
                this.polygons = geo.coordinates.flat().map(c => new Polygon(c.map(p => proj(p)), granule));
                break;
        }
    }

    draw(ctx, tf2, bbox) {
        let tf4 = function (rec) {
            let lt = tf2([rec[0], rec[1]]);
            let rb = tf2([rec[2], rec[3]]);
            return [lt[0], lt[1], rb[0], rb[1]];
        }
        this.polygons.forEach(p => {
            this._drawPolygon(ctx, p, tf2, tf4, bbox);
        })
    }

    _drawPolygon(ctx, poly, tf2, tf4, bbox) {

        let bounds = tf4(poly.bounds());
        if (isSep(bounds, bbox)) return;
        if (isDot(bounds)) {
            drawDot(ctx, bounds[0], bounds[1]);
            return;
        }

        let coos = poly.coordiates(),
            prev = tf2(coos[0]),
            next;

        ctx.moveTo(prev[0], prev[1]);
        for (let i = 1, len = coos.length; i < len; i++) {
            next = tf2(coos[i]);
            if (eq(prev, next)) {
                continue;
            }
            ctx.lineTo(next[0], next[1]);
            prev = next;
        }
    }
}

class Bucket {

    constructor(geo, proj, granule = 1 / 256) {
        switch (geo.type) {
            case 'MultiPolygon':
                this.polygons = geo.coordinates.flat().map(c => new Polygon(c.map(p => proj(p)), granule));
                break;
        }
    }

    draw(ctx, tf2, bbox) {
        let tf4 = function (rec) {
            let lt = tf2([rec[0], rec[1]]);
            let rb = tf2([rec[2], rec[3]]);
            return [lt[0], lt[1], rb[0], rb[1]];
        }
        this.polygons.forEach(p => {
            this._drawPolygon(ctx, p, tf2, tf4, bbox);
        })
    }

    _drawPolygon(ctx, poly, tf2, tf4, bbox) {

        let bounds = tf4(poly.bounds());
        if (isSep(bounds, bbox) || isDot(bounds)) return;
        
        let coos = poly.coordiates(),
            prev = tf2(coos[0]),
            next;

        ctx.moveTo(prev[0], prev[1]);
        for (let i = 1, len = coos.length; i < len; i++) {
            next = tf2(coos[i]);
            if (eq(prev, next)) {
                continue;
            }
            ctx.lineTo(next[0], next[1]);
            prev = next;
        }
    }
}

function eq(p0, p1) {
    return p0[0] === p1[0] && p0[1] === p1[1];
}

function isSep(rec1, rec2) {

    return rec1[0] > rec2[2]
        || rec1[1] > rec2[3]
        || rec1[2] < rec2[0]
        || rec1[3] < rec2[1];
}

function isDot(bounds) {
    return (bounds[2] - bounds[0] === 1) && (bounds[3] - bounds[1] === 1);
}

function drawDot(ctx, x, y) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + 1, y + 1);
}

function round(point, granule) {
    return [point[0] - (point[0] % granule), point[1] - (point[1] % granule)];
}





