"use strict";
const file = '../res/topojson/2.json';

function drawMaps(dSvgs, topoData) {
    if (!topoData) {
        d3.json(file).then(topoData => { drawMaps(dSvgs, topoData) });
        return;
    }
    dSvgs.forEach(dSvg => drawMap(dSvg, topoData));
}

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
    let dC = dSvg.append('g').attr('class', 'map-root');

    // Draw taiwan
    dC.append('g')
        .attr('class', 'taiwan')
        .append('path')
        .datum(taiwan)
        .attr('d', renderer);
    taiwan = null;

    // Draw villages
    let villages = topojson.feature(topoData, topoData.objects.villages);
    dC.append('g')
        .attr('class', 'village')
        .selectAll('path')
        .data(villages.features)
        .enter()
        .append('path')
        .attr('d', renderer)
        .attr('v', d => d.properties.v);
    villages = null;

}

function bindZoom(dSvgs) {
    let sc = scale(dSvgs);
    let zoom = d3.zoom()
        .on("zoom", () => dSvgs.selectAll('.map-root').attr("transform", d3.event.transform))
        .scaleExtent([1, 100])
        .translateExtent([[0, 0], [sc * 600, sc * 800]])
    dSvgs.call(zoom);
    dSvgs.nodes().forEach(n => {
        n.onwheel = e => e.preventDefault();
        n.onmousewheel = e => e.preventDefault();
    })
}

function scale(dE) {
    return $(dE.node()).width() / 600;
}