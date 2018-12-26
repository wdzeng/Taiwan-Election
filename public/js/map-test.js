const MAP_PATH = "/res/topojson/100.json";
const DPI = 2;
const CV_WIDTH = DPI * 450, CV_HEIGHT = DPI * 600;
const EXTENT = [[0, 0], [CV_WIDTH, CV_HEIGHT]];

let dpis = [100, 50, 25, 12, 6, 3, 2];
let $body = $('body');
dpis.map(d => getMapPath(d)).forEach((path, i) => {
    d3.json(path).then(o => normalTask(o, dpis[i]));
    d3.json(path).then(o => meshTask(o, dpis[i]));
});

function getMapPath(dpi) {
    return `/res/topojson/${dpi}.json`
}

function normalTask(topoObject, dpi) {

    let mapData = topojson.feature(topoObject, topoObject.objects.villages);
    task(mapData, `Normal ${dpi}`);
}

function meshTask(topoObject, dpi) {

    let mapData = topojson.mesh(topoObject, topoObject.objects.villages);
    task(mapData, `Mesh ${dpi}`);
}

function task(mapData, msg) {
    // Init topojson
    let projection = d3.geoMercator().fitExtent(EXTENT, mapData);

    // Init context
    let context = getContext(msg);
    context.strokeStyle = '#444';
    context.fillStyle = '#C00';

    // Init path renderer
    let pathRenderer = d3.geoPath().context(context).projection(projection);

    // Draw
    draw(context, pathRenderer, mapData, msg);
}

function getContext(msg) {

    let $head = $(`<h2>${msg}</h2>`);
    let $canvas = $('<canvas></canvas>');
    let $div = $('<div></div>');
    $div.append($head).append($canvas);
    $body.append($div);

    let canvas = $canvas[0];
    canvas.width = CV_WIDTH;
    canvas.height = CV_HEIGHT;

    const scale = 15;
    let context = canvas.getContext('2d');
    context.translate(450, 600);
    context.scale(scale, scale);
    context.translate(-450, -600);
    context.lineWidth = 1 / scale;
    return context;
}

function draw(context, pathRenderer, mapData, msg) {

    setTimeout(() => {
        let t0 = new Date().getTime();
        context.beginPath();
        pathRenderer(mapData);
        context.stroke();
        let t1 = new Date().getTime();
        console.log(`${msg}: ${t1 - t0} ms`);
    }, 0);
}






