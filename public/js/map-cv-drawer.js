function draw(srcCanvas, destCtx, bound) {

    let t0 = new Date().getTime();
    destCtx.drawImage(srcCanvas, bound.x, bound.y, bound.w, bound.h, 0, 0, ORG_WIDTH * DPI, ORG_HEIGHT * DPI);
    let t1 = new Date().getTime();
    console.log(`It takes ${t1 - t0} ms to copy a map.`);
}

function createHiddenCanvas(mapData, height) {

    const WIDTH = ORG_WIDTH * DPI * MAX_ZOOM;
    const HEIGHT = ORG_HEIGHT * DPI * MAX_ZOOM;

    // Create a hidden canvas
    let $canvas = $('<canvas id="map-source"></canvas>').attr({
        width: WIDTH,
        height: HEIGHT
    }).css('display', 'none');

    // Create path renderer
    let canvas = $canvas[0];
    let context = canvas.getContext('2d');
    let projection = d3.geoMercator().fitHeight(height, mapData);
    let pathRenderer = d3.geoPath().context(context).projection(projection);

    // Set context style
    context.strokeStyle = '#444';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = MAX_ZOOM;

    // Draw on hidden map
    context.beginPath();
    pathRenderer(mapData);
    context.stroke();

    return canvas;
}