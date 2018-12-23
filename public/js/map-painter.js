const MAX_COLOR = [0xEE, 0xEE, 0xEE];
const MIN_COLOR = [0x33, 0x33, 0x33];
const STRICT_CANDIDATE = 3;
const SOFT_CANDIDATE = 2;
const SMALL_CANDIDATE = 1;

function paint($e, bg) {
    $e.css({
        fill: bg,
    });
}

function see(borders) {
    if ('v' in borders) {
        $('g.county', $svg).css('display', borders.v ? 'auto' : 'none');
    }
    if ('d' in borders) {
        $('g.district', $svg).css('display', borders.v ? 'auto' : 'none');
    }
    if ('e' in borders) {
        $('g.electoral', $svg).css('display', borders.v ? 'auto' : 'none');
    }
    if ('c' in borders) {
        $('g.county', $svg).css('display', borders.v ? 'auto' : 'none');
    }
}

function paintDists($svg, data, rsOnly) {

    let $dist = $('g.district', $svg);
    let $painted, color;

    data.forEach(x => {
        $painted = $(`path[did='${x.id}']`, $dist);
        color = mixColor(getColorByParty(x.p), Number(x.r || x.s), null, rsOnly);
        paint($painted, color);
    })
}

function paintEctrs($svg, data, rsOnly) {

    let $ectr = $('g.electoral', $svg);
    let $painted, color;

    data.forEach(x => {
        $painted = $(`path[ectr='${x.id}']`, $ectr);
        color = mixColor(getColorByParty(x.p), Number(x.r || x.s), null, rsOnly);
        paint($painted, color);
    })
}

function getColorByParty(party) {

    if (party === null) return INDEPENDENT;

    switch (party) {
        case '中國國民黨': return AUTHORITARIAN;
        case '民主進步黨': return DEMOCRACY;
        case '時代力量': return EQUALITY;
        case '親民黨': return OUTSIDER;
    }

    return AUTOCRACY;
}

function mixColor(color, opacity, strict = STRICT_CANDIDATE, rsOnly = false) {

    if (opacity == 0) return INDEPENDENT['m'];
    return color[toLevel(opacity, strict, rsOnly)];
}

function toLevel(opacity, strict = STRICT_CANDIDATE, rsOnly = false) {

    if (rsOnly) return 'r';

    switch (strict) {
        case STRICT_CANDIDATE:
            if (opacity >= 0.775) return 'xxl';
            if (opacity >= 0.700) return 'xl';
            if (opacity >= 0.625) return 'l';
            if (opacity >= 0.550) return 'm';
            if (opacity >= 0.475) return 's';
            if (opacity >= 0.400) return 'xs';
            if (opacity >= 0.325) return 'xxs';
            return 'foul';

        case SOFT_CANDIDATE:
            if (opacity >= 0.15) return 'xxl';
            if (opacity >= 0.12) return 'xl';
            if (opacity >= 0.09) return 'l';
            if (opacity >= 0.07) return 'm';
            if (opacity >= 0.05) return 's';
            if (opacity >= 0.03) return 'xs';
            if (opacity >= 0.01) return 'xxs';
            return 'foul';

        case SMALL_CANDIDATE:
            if (opacity >= 0.065) return 'xxl';
            if (opacity >= 0.055) return 'xl';
            if (opacity >= 0.045) return 'l';
            if (opacity >= 0.035) return 'm';
            if (opacity >= 0.025) return 's';
            if (opacity >= 0.015) return 'xs';
            if (opacity >= 0.005) return 'xxs';
            return 'foul';

        default:
            throw "Invalid argument: " + strict;
    }

}