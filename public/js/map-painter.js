const maxColor = [0xEE, 0xEE, 0xEE];
const minColor = [0x33, 0x33, 0x33];

function paint($e, bg) {
    $e.css({
        fill: bg,
    });
}

function paintDists($svg, data) {

    let $dist = $('g.district', $svg);
    data.forEach(x => {
        let $painted = $(`path[did='${x.id}']`, $dist);
        let opacity = Number(x.r || x.s);
        let color = getColorByParty(x.p);
        color = mixColor(color, opacity, false);
        paint($painted, color);
    })
}

function getColorByParty(party) {

    if (party === null) return INDEPENDENT;

    switch (party) {
        case '中國國民黨': return AUTHORITARIAN;
        case '民主進步黨': return DEMOCRACY;
        case '時代力量': return EQUALITY;
    }

    return AUTOCRACY;
}

function mixColor(color, opacity, resultOnly = false) {

    return color[toLevel(opacity, resultOnly)];
}

function toLevel(opacity, resultOnly = false) {

    if (resultOnly) return 'm';

    if (opacity >= 0.775) return 'xxl';
    if (opacity >= 0.700) return 'xl';
    if (opacity >= 0.625) return 'l';
    if (opacity >= 0.550) return 'm';
    if (opacity >= 0.475) return 's';
    if (opacity >= 0.400) return 'xs';
    if (opacity >= 0.325) return 'xxs';
    return 'foul'
}