"use strict";

function paintVillage($svg, painter) {

}

function paintDistrict($svg, data, color, f) {
    let alpha = null;
    data.forEach(d => {
        alpha = f(d);
        alpha = Math.floor(alpha * 255);
        $(`g.district path[did='${d.d}']`, $svg).css('fill', `rgba(${alpha}, ${alpha}, ${alpha})`);
    })
}

function paintCounty($svg, painter) {
    for (let i = 100; i <= 2000; i += 100) {
        $(`path[did='${i}']`, $svg).css(painter(i));
    }
}

function paint($svg, data, color, f) {
    let test = data[0];
    if ('v' in test.area) {
        paintVillage($svg, data, color, f);
    } else if ('d' in test.area) {
        paintDistrict($svg, data, color, f);
    } else if ('c' in test.area) {
        paintCounty($svg, data, color, f);
    }
}

