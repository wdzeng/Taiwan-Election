import { Pen as Pencil, Bucket, MapData } from '/js/pen.js';
import Zoomer from '/js/locator.js';

function dfProj(p) {
    // 725 * 1000
    return [
        p[0] * 269.1208371056967 - 32109.744400935175,
        Math.atanh(Math.sin(p[1] * 0.01745329251)) * -15419.488141663418 + 7041.455196230148
    ];
}

export default class Map {

    constructor(container, mut = 1.40084, maxnScale = 12, dpi = 2, padding = 30) {

        // Remove children
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const _this = this;

        // Create canvas and set styles
        const canvas = document.createElement('canvas');
        this.canvas = canvas;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        canvas.width = canvas.offsetWidth * dpi;
        canvas.height = canvas.offsetHeight * dpi;

        // Set resizer
        let firstResized = true;
        new ResizeObserver(function () {
            if (firstResized) {
                firstResized = false;
                return;
            }
            canvas.width = canvas.offsetWidth * dpi;
            canvas.height = canvas.offsetHeight * dpi;
            let tm = _this.z.resize(canvas.width, canvas.height, padding);
            _this.draw(tm.translate, tm.bounds, tm.scale);
        }).observe(canvas);

        // Create zoomer
        this.nScale = 0;
        this.z = new Zoomer(canvas.offsetWidth * dpi, canvas.offsetHeight * dpi, 725, 1000, padding);
        function wheelListener(e) {

            e.preventDefault();

            let zin = e.deltaY < 0;
            if (zin && _this.nScale === maxnScale || !zin && _this.nScale === 0) return;
            _this.nScale += (zin ? 1 : -1);

            let ofx = e.offsetX * dpi,
                ofy = e.offsetY * dpi;
            let tm = _this.z.zoom(zin ? mut : (1 / mut), ofx, ofy);
            _this.draw(tm.translate, tm.bounds, tm.scale);
        }
        canvas.addEventListener('wheel', wheelListener);

        // Create dragger
        function mousemoveListener(e) {
            let tm = _this.z.dragTo([e.offsetX * dpi, e.offsetY * dpi]);
            if (tm === null) return;
            _this.draw(tm.translate, tm.bounds, tm.scale);
        }
        function mousedownListener(e) {
            if (e.type == 'mousedown' && e.button != 0) return;
            canvas.addEventListener('mousemove', mousemoveListener);
            _this.z.dragStart([e.offsetX * dpi, e.offsetY * dpi]);
        }
        function mouseUpListener(e) {
            if (e.type == 'mouseup' && e.button != 0) return;
            canvas.removeEventListener('mousemove', mousemoveListener);
            _this.z.dragEnd();
        }
        canvas.addEventListener('mousedown', mousedownListener);
        canvas.addEventListener('mouseleave', mouseUpListener);
        canvas.addEventListener('mouseup', mouseUpListener);

        this.padding = padding;
        this.pens = {};
        this.buckets = {};
        this.ctx = canvas.getContext('2d');
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.dpi = dpi;
    }

    async setLayer(fgrouper, sgrouper) {

        this.buckets = {};
        this.pens = {};
        this.mapData = undefined;
        this.z.reset();

        let topo = await loadMap(),
            layers, geo;

        this.mapData = new MapData(await geoMap(), dfProj);

        layers = fgrouper(topo);
        for (let k in layers) {
            geo = layers[k];
            if (geo) this.buckets[k] = new Bucket(geo, dfProj);
        }

        layers = sgrouper(topo);
        for (let k in layers) {
            geo = layers[k];
            if (geo) this.pens[k] = new Pencil(geo, dfProj);
        }
    }

    draw(trlt, bbox, scale) {
        if (trlt === undefined && bbox === undefined && scale === undefined) {
            let tm = this.z.transform();
            trlt = tm.translate;
            bbox = tm.bounds;
            scale = tm.scale;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let bname in this.buckets) {
            if (this.styler(bname, this.ctx, scale, false)) {
                this.ctx.beginPath();
                this.buckets[bname].draw(this.ctx, trlt, bbox);
                this.ctx.fill();
            }
        }
        for (let pname in this.pens) {
            if (this.styler(pname, this.ctx, scale, true)) {
                this.ctx.beginPath();
                this.pens[pname].draw(this.ctx, trlt, bbox);
                this.ctx.stroke();
            }
        }
    }

    setStyler(styler) {
        this.styler = styler;
    }

    async setLayerAndDraw(fgrouper, sgrouper, styler) {
        this.setStyler(styler);
        await this.setLayer(fgrouper, sgrouper);
        let tm = this.z.transform();
        this.draw(tm.translate, tm.bounds, tm.scale);
    }

    follow(follower) {
        if (!this.mapData) return;
        if (follower) {
            let _this = this;
            this.tracker = function (e) {
                if (e.button == 1 || e.buttons == 1) return;
                let offset = [e.offsetX * _this.dpi, e.offsetY * _this.dpi];
                offset = _this.z.draft(offset);
                let poly = _this.mapData.parent(offset);
                follower(poly);
            }
            this.canvas.addEventListener('mousemove', this.tracker);
        }
        else {
            this.canvas.removeEventListener('mousemove', this.tracker);
        }
    }
}

let loadMap = (function () {

    let topo = null;

    function readMap() {
        return new Promise((resolve) => {
            $.getJSON('/res/map20.json').done(topo => resolve(topo));
        });
    }

    return async function () {
        if (!topo) {
            topo = await readMap();
        }
        return topo;
    }
})();

let geoMap = (function () {

    let geojson = null;

    return async function () {
        if (!geojson) {
            let topo = await loadMap();
            geojson = topojson.feature(topo, topo.objects.villages);
        }
        return geojson;
    }

})();