"use strict";

const COMPRESS = 50;
const MAP_PATH = `/res/topojson/${COMPRESS}.json`;
const CANVAS_PIXEL = 2;

function getExtent(sc) {
    return (sc === 2 || sc === 5) ?
        [[sc * 20, sc * -580], [sc * 930, sc * 1240]] :
        [[sc * 10, sc * -830], [sc * 1110, sc * 1480]];
}

const VILLAGE_VISIBLE = 5;
const ZOOM_RATIO = 1.22;

function initMap(droot, topoData) {

    // Init Data and init root
    let sc = scale(droot);
    let twData = topojson.merge(topoData, topoData.objects.villages.geometries);
    let proj = d3.geoMercator().fitExtent(getExtent(sc), twData);
    let pathRenderer = d3.geoPath().projection(proj);

    // Draw Taiwan
    droot.append('g')
        .attr('class', 'taiwan')
        .append('path')
        .datum(twData)
        .attr('d', pathRenderer);

    return pathRenderer;
}

function drawCountiesAndDistricts(droot, topoData, pathRenderer) {

    // First district, then county (concerning z-order)
    let gd = droot.append('g').attr('class', 'district');
    let gc = droot.append('g').attr('class', 'county');
    let td = null;

    let distIds = getAllDistrictIds();
    distIds.forEach(id => {

        // District
        if (id % 100) {
            td = topojson.merge(topoData, topoData.objects.villages.geometries.filter(p => p.properties.d == id));
            gd.append('path').datum(td).attr('d', pathRenderer).attr('did', id);
        }
        // County
        else {
            td = topojson.merge(topoData, topoData.objects.villages.geometries.filter(p => id < p.properties.d && p.properties.d < (id + 100)));
            gc.append('path').datum(td).attr('d', pathRenderer).attr('cid', id);
        }
    });
}

function drawVillages(droot, topoData, pathRenderer) {

    let villages = topojson.feature(topoData, topoData.objects.villages);
    droot.append('g')
        .attr('class', 'village')
        .selectAll('path')
        .data(villages.features.filter(v => v.properties.v))
        .enter()
        .append('path')
        .attr('d', pathRenderer)
        .attr('vname', d => d.properties.v)
        .attr('did', d => d.properties.d);
}

function drawElectorals(droot, topoData, pathRenderer) {

    let ge = droot.append('g').attr('class', 'electoral');
    let te = null;

    getAllElectorals().forEach(e => {
        te = topojson.merge(topoData, topoData.objects.villages.geometries.filter(
            p => getElectoral(p.properties.d, p.properties.v) == e)
        );
        ge.append('path').datum(te).attr('d', pathRenderer).attr('ectr', e);
    })
}

function drawMap(droot, topoData, cb) {

    if (!topoData) {
        d3.json(MAP_PATH).then(topoData => { drawMap(droot, topoData, cb) });
        return;
    }

    let pathRenderer = initMap(droot, topoData);
    drawCountiesAndDistricts(droot, topoData, pathRenderer);
    drawElectorals(droot, topoData, pathRenderer);
    drawVillages(droot, topoData, pathRenderer);

    // Callback
    cb && cb();
}

function initCanvas($canvas) {

    let w = $canvas.width() * CANVAS_PIXEL;
    let h = $canvas.height() * CANVAS_PIXEL;
    $canvas.each((i, e) => {
        e.width = w;
        e.height = h;
    })
}

function drawFirstCanvas($dataTree, canvas, scale, translation) {

    function drawBg($path) {
        if ($path.is('[invisible]')) return;
        let $e = null;
        ctx.fillStyle = $path.css('fill');
        $path.children().each((i, e) => {
            $e = $(e);
            ctx.fill(new Path2D($e.attr('d')));
        });

    }

    function drawFg($path) {
        if ($path.is('[invisible]')) return;
        let $e = null;
        $path.children().each((i, e) => {
            $e = $(e);
            ctx.strokeStyle = $e.css('stroke');
            ctx.lineWidth = parseFloat($e.css('stroke-width'));
            ctx.stroke(new Path2D($e.attr('d')));
        });

    }

    let ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each layer
    ctx.scale(CANVAS_PIXEL * scale, CANVAS_PIXEL * scale);
    let $tw = $dataTree.children('g.taiwan');
    let $coun = $dataTree.children('g.county');
    let $dist = $dataTree.children('g.district');
    let $vill = $dataTree.children('g.village');
    drawBg($tw);
    drawBg($coun);
    drawBg($dist);
    drawBg($vill);
    drawFg($vill);
    drawFg($dist);
    drawFg($coun);
}

function drawCanvas($dataTree, $canvas, scale = 1, translation) {

    let first = $canvas[0];
    drawFirstCanvas($dataTree, first, scale, translation);
    $canvas.each((i, e) => {
        if (i == 0) return;
        e.getContext('2d').drawImage(first, 0, 0);
    })
}

function bindZoom($canvas) {

    function ensureInRange(val, min, max) {
        return Math.max(Math.min(val, max), min);
    }

    $canvas.on('mousewheel mouseup mousedown mousemove mouseleave', (() => {

        let scale = 1;
        let tx = 0;
        let ty = 0;
        let drag = false;

        const HEIGHT = $canvas.height();
        const WIDTH = $canvas.width();

        function wheel(e) {

            // Stop bubbling
            e.preventDefault();

            // Check zooming
            let x = e.offsetX;
            let y = e.offsetY;
            let us = (e.originalEvent.wheelDelta > 0 ? scale * ZOOM_RATIO : scale / ZOOM_RATIO);
            us = ensureInRange(us, 1, 25);
            if (scale === us) {
                return;
            }

            let ux = tx + x / us - x / scale;
            ux = ensureInRange(ux, -WIDTH * (us - 1), 0)
            let uy = ty + y / us - y / scale;
            uy = ensureInRange(uy, -HEIGHT * (us - 1), 0);

            // Check showing / hiding village border
            let $root = $('g.map-root', $canvas);
            if ((scale - VILLAGE_VISIBLE) * (us - VILLAGE_VISIBLE) < 0) {
                $root.toggleClass('no-village');
            }

            // Zoom
            $root.attr('transform', `scale(${us}) translate(${ux}, ${uy})`);

            // Update
            scale = us;
            tx = ux;
            ty = uy;
        }

        function move(e) {
            tx += e.originalEvent.movementX / scale;
            tx = ensureInRange(tx, -WIDTH * (scale - 1), 0);
            ty += e.originalEvent.movementY / scale;
            ty = ensureInRange(ty, -HEIGHT * (scale - 1), 0);
            $('.map-root', $canvas).attr('transform', `scale(${scale}) translate(${tx}, ${ty})`);
        }

        return e => {
            switch (e.type) {
                case 'mousemove': drag && move(e); break;
                case 'mouseleave':
                case 'mouseup': drag = false; break;
                case 'mousewheel': wheel(e); break;
                case 'mousedown': drag = true; break;
            }
        }
    })());
}

function scale(dE) {
    return $(dE.node()).width() / 600;
}