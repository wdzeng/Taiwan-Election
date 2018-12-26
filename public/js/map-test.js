import Source from '/js/map-source.js';
import Zoom from '/js/zoom.js';

const MAP_PATH = "/res/TopoJson/2.json";
const canvas = document.getElementById('cvmap');

d3.json(MAP_PATH).then(topoData => {

    let mapData = topojson.feature(topoData, topoData.objects.villages);
    let mapSource = new Source(mapData);
    let bounds = mapSource.drawAllOn(canvas);

    new Zoom($(canvas), mapSource, bounds);
})


