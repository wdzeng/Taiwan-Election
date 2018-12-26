const MAP_PATH = "/res/topojson/2.json";
const DPI = 2;
const CV_WIDTH = DPI * 450, CV_HEIGHT = DPI * 600;
const EXTENT = [[0, 0], [CV_WIDTH, CV_HEIGHT]];

let canvas = document.getElementById('cvmap');
canvas.width = CV_WIDTH;
canvas.height = CV_HEIGHT;
let context = canvas.getContext('2d');
let mapData = null;
let projection = null;
let pathRenderer = null;

d3.json(MAP_PATH).then(topoObject => {

    mapData = topojson.feature(topoObject, topoObject.objects.villages);
    projection = d3.geoMercator().fitExtent(EXTENT, mapData);
    pathRenderer = d3.geoPath().context(context).projection(projection);

    context.strokeStyle = '#444';
    context.fillStyle = 'white';
    context.lineWidth = 0.2;

    context.translate(450, 600);
    context.scale(1, 1);
    context.translate(-450, -600);

    asyncDraw();
    asyncDraw();
    asyncDraw();
    asyncDraw();
    asyncDraw();

})


function asyncDraw() {
    setTimeout(function () {
        draw();
    }, 0);
}

// d3.select('#cvmap').call(d3.zoom().scaleExtent([1, 8]).on('zoom', zoom));

function zoom() {
    var transform = d3.event.transform;
    context.clearRect(0, 0, CV_WIDTH, CV_HEIGHT);
    projection.translate([transform.x, transform.y]).scale(transform.k);
    draw();
}

function draw() {
    let t0 = new Date().getTime();
    context.beginPath();
    pathRenderer(mapData);
    context.stroke();
    let t1 = new Date().getTime();
    console.log((t1 - t0) + ' ms')
}






