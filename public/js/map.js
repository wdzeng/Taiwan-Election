import { Pen, Bucket } from '/js/pen.js';
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
            canvas.addEventListener('mousemove', mousemoveListener);
            _this.z.dragStart([e.offsetX * dpi, e.offsetY * dpi]);
        }
        function mouseUpListener(e) {
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
    }

    async setLayer(fgrouper, sgrouper, nLayer) {
        this.buckets = {};
        this.pens = {};
        this.z.reset();
        if (!fgrouper && !sgrouper) return;

        let topo = await loadMap(nLayer),
            group,
            geo;

        if (fgrouper) {
            group = fgrouper(topo);
            for (let k in group) {
                geo = group[k];
                if (geo) this.buckets[k] = new Bucket(geo, dfProj);
            }
        }

        if (sgrouper) {
            group = sgrouper(topo);
            for (let k in group) {
                geo = group[k];
                if (geo) this.pens[k] = new Pen(geo, dfProj);
            }
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
            if (this.styler(bname, this.ctx, false)) {
                this.ctx.beginPath();
                this.buckets[bname].draw(this.ctx, trlt, bbox);
                this.ctx.fill();
            }
        }
        for (let pname in this.pens) {
            if (this.styler(pname, this.ctx, true)) {
                this.ctx.beginPath();
                this.pens[pname].draw(this.ctx, trlt, bbox);
                this.ctx.stroke();
            }
        }
    }

    setStyler(styler) {
        this.styler = styler;
    }

    async setLayerAndDraw(fgrouper, sgrouper, styler, nLayer) {
        this.setStyler(styler);
        await this.setLayer(fgrouper, sgrouper, nLayer);
        let tm = this.z.transform();
        this.draw(tm.translate, tm.bounds, tm.scale);
    }
}

let loadMap = (function () {

    let topo = {};

    function readMap(mapPath) {
        return new Promise((resolve) => {
            d3.json(mapPath).then(topo => resolve(topo));
        });
    }

    function path(nLayer = 20) {
        return '/res/map20.json';
        /*
        if (nLayer >= 8) return '/res/map5.json';
        if (nLayer >= 4) return '/res/map20.json';
        return '/res/map.json'
        */
    }

    return async function (nLayer) {
        let mapPath = path(nLayer);
        if (!topo[mapPath]) {
            topo[mapPath] = await readMap(mapPath);
        }
        return topo[mapPath];
    }
})();
