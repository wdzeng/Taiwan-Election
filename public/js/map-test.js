const MAP_PATH = "/res/TopoJson/2.json";
const canvas = document.getElementById('cvmap');

d3.json(MAP_PATH).then(topoData => {

    let mapData = topojson.feature(topoData, topoData.objects.villages);
    let ms = new MapSource(mapData);
    ms.drawAllOn(canvas);
})


