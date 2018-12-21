"use strict";
const MAP_PATH = '/res/topojson/5.json';

function initMap(dSvg, topoData) {

    // Init Data and init root
    let sc = scale(dSvg);
    let twData = topojson.merge(topoData, topoData.objects.villages.geometries);
    let proj = d3.geoMercator().fitExtent([[sc * 20, sc * -580], [sc * 930, sc * 1240]], twData);
    let pathRenderer = d3.geoPath().projection(proj);
    let dRoot = dSvg.append('g').attr('class', 'map-root no-village');

    // Draw Taiwan
    dRoot.append('g')
        .attr('class', 'taiwan')
        .append('path')
        .datum(twData)
        .attr('d', pathRenderer);

    return [pathRenderer, dRoot];
}

function drawCountiesAndDistricts(dRoot, topoData, pathRenderer) {

    // First district, then county (concerning z-order)
    let gd = dRoot.append('g')
        .attr('class', 'district')
    let gc = dRoot.append('g')
        .attr('class', 'county');

    let distIds = getAllDistrictIds();
    distIds.forEach(id => {
        // District
        if (id % 100) {
            let td = topojson.merge(topoData, topoData.objects.villages.geometries.filter(p => p.properties.d == id));
            gd.append('path').datum(td).attr('d', pathRenderer).attr('did', id);
        }
        // County
        else {
            let min = id;
            let max = id + 100;
            let td = topojson.merge(topoData, topoData.objects.villages.geometries.filter(p => min < p.properties.d && p.properties.d < max));
            gc.append('path').datum(td).attr('d', pathRenderer).attr('cid', id);
        }
    });
}

function drawVillages(dRoot, topoData, pathRenderer) {

    let villages = topojson.feature(topoData, topoData.objects.villages);
    dRoot.append('g')
        .attr('class', 'village')
        .selectAll('path')
        .data(villages.features)
        .enter()
        .append('path')
        .attr('d', pathRenderer)
        .attr('vid', d => d.properties.v);
}

function drawMap(dSvg, topoData, cb) {

    if (!topoData) {
        d3.json(MAP_PATH).then(topoData => { drawMap(dSvg, topoData, cb) });
        return;
    }

    // First init this map
    let tempArray = initMap(dSvg, topoData);
    let pathRenderer = tempArray[0];
    let dRoot = tempArray[1];
    
    drawCountiesAndDistricts(dRoot, topoData, pathRenderer);
    drawVillages(dRoot, topoData, pathRenderer);

    // Callback
    cb && cb();
}

function bindZoom($svgs) {
    $svgs.on('mousewheel mouseup mousedown mousemove mouseleave', (() => {

        let scale = 1;
        let tx = 0;
        let ty = 0;
        let drag = false;

        const height = $svgs.height();
        const width = $svgs.width();
        const showVillage = 4;
        const sm = 1.12;

        function checkRange(val, min, max) {
            return Math.max(Math.min(val, max), min);
        }

        function wheel(e) {
            e.preventDefault();

            let x = e.offsetX;
            let y = e.offsetY;
            let us = (e.originalEvent.wheelDelta > 0 ? scale * sm : scale / sm);
            us = checkRange(us, 1, 25);
            if (scale === us) {
                return;
            }

            let ux = tx + x / us - x / scale;
            ux = checkRange(ux, -width * (us - 1), 0)
            let uy = ty + y / us - y / scale;
            uy = checkRange(uy, -height * (us - 1), 0);

            let $root = $('.map-root', $svgs);
            // Check changing village border
            if ((scale - showVillage) * (us - showVillage) < 0) $root.toggleClass('no-village');
            $root.attr('transform', `scale(${us}) translate(${ux}, ${uy})`);
            scale = us;
            tx = ux;
            ty = uy;
        }

        function move(e) {
            tx += e.originalEvent.movementX / scale;
            tx = checkRange(tx, -width * (scale - 1), 0);
            ty += e.originalEvent.movementY / scale;
            ty = checkRange(ty, -height * (scale - 1), 0);
            $('.map-root', $svgs).attr('transform', `scale(${scale}) translate(${tx}, ${ty})`);
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