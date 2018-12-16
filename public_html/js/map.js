"use strict";
const file = '/res/topojson/2.json';

function drawMap(dSvg, topoData) {

    let sc = scale(dSvg);
    if (!topoData) {
        d3.json(file).then(topoData => { drawMap(dSvg, topoData) });
        return;
    }

    // Make projection
    let taiwan = topojson.merge(topoData, topoData.objects.villages.geometries);
    let proj = d3.geoMercator().fitExtent([[sc * 20, sc * -580], [sc * 930, sc * 1240]], taiwan);
    let renderer = d3.geoPath().projection(proj);

    // Draw on map
    let dC = dSvg.append('g').attr('class', 'map-root nv');

    // Draw taiwan
    dC.append('g')
        .attr('class', 'taiwan')
        .append('path')
        .datum(taiwan)
        .attr('d', renderer);
    taiwan = null;

    // Draw counties and districts
    let county = dC.append('g')
        .attr('class', 'county');
    let district = dC.append('g')
        .attr('class', 'district')
    let dids = getAllDistrictIds();
    dids.forEach(id => {
        // District
        if (id % 100) {
            let td = topojson.merge(topoData, topoData.objects.villages.geometries.filter(p => p.properties.d == id));
            district.append('path').datum(td).attr('d', renderer).attr('dist', id);
        }
        // County
        else {
            let min = id;
            let max = id + 100;
            let td = topojson.merge(topoData, topoData.objects.villages.geometries.filter(p => min < p.properties.d && p.properties.d < max));
            county.append('path').datum(td).attr('d', renderer).attr('did', id);
        }
    });
    district = null;
    county = null;

    // Draw villages
    let villages = topojson.feature(topoData, topoData.objects.villages);
    dC.append('g')
        .attr('class', 'village')
        .selectAll('path')
        .data(villages.features)
        .enter()
        .append('path')
        .attr('d', renderer)
        .attr('vid', d => d.properties.v);
    villages = null;

}

function bindZoom($svgs) {
    $svgs.on('mousewheel', (() => {
        let scale = 1;
        let tx = 0;
        let ty = 0;
        let height = $svgs.height();
        let width = $svgs.width();
        function checkRange(val, min, max) {
            return Math.max(Math.min(val, max), min);
        }
        return e => {
            e.preventDefault();

            let x = e.offsetX;
            let y = e.offsetY;
            let us = (e.originalEvent.wheelDelta > 0 ? scale * 1.2 : scale / 1.2);
            us = checkRange(us, 1, 25);
            if (scale === us) {
                return;
            }

            let ux = tx + x / us - x / scale;
            ux = checkRange(ux, -width, 0)
            let uy = ty + y / us - y / scale;
            uy = checkRange(uy, -height, scale);
            $('.map-root', $svgs).attr('transform', `scale(${us}) translate(${ux}, ${uy})`);
            scale = us;
            tx = ux;
            ty = uy;
        }
    })());
}

function scale(dE) {
    return $(dE.node()).width() / 600;
}