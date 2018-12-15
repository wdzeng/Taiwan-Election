const file = '../res/topojson/2.json';

function drawMaps(dSvgs, topoData, zoomable = true) {
    if (!topoData) {
        d3.json(file).then(topoData => { drawMaps(dSvgs, topoData, zoomable) });
        return;
    }
    dSvg.forEach(dSvg => drawMap(dSvg, topoData, zoomable));
}

function drawMap(dSvg, topoData, zoomable = true) {

    let sc = scale(dSvg);
    if (!topoData) {
        d3.json(file).then(topoData => { drawMap(dSvg, topoData) });
        return;
    }

    // Get geojson data (features collection)
    // let geoData = topojson.feature(topoData, topoData.objects.villages);
    let taiwan = topojson.merge(topoData, topoData.objects.villages.geometries);
    let villages = topojson.feature(topoData, topoData.objects.villages);

    // Make projection
    let proj = d3.geoMercator().fitExtent([[sc * 20, sc * -580], [sc * 930, sc * 1240]], taiwan);
    let renderer = d3.geoPath().projection(proj);

    // Draw on map
    let dC = dSvg.append('g')
        .attr('class', 'container');
    dC.append('g')
        .attr('class', 'taiwan')
        .append('path')
        .datum(taiwan)
        .attr('d', renderer);
    dC.append('g')
        .attr('class', 'village')
        .selectAll('path')
        .data(villages.features)
        .enter()
        .append('path')
        .attr('d', renderer)
        .attr('v', d => d.properties.v);

    if (!zoomable) return;
    let zoom = d3.zoom()
        .on("zoom", () => {
            dC.attr("transform", d3.event.transform);
        })
        .scaleExtent([1, 100])
        .translateExtent([[0, 0], [sc * 600, sc * 800]])

    dSvg.call(zoom);
}

function scale(dE) {
    return $(dE.node()).width() / 600;
}