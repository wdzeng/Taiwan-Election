const MAX_COLOR = [0xEE, 0xEE, 0xEE];
const MIN_COLOR = [0x33, 0x33, 0x33];
const STRICT_CANDIDATE = 3;
const SOFT_CANDIDATE = 2;
const SMALL_CANDIDATE = 1;

function paintCounties($svg, data, rsOnly = true, strict = STRICT_CANDIDATE) {

    $('g.taiwan', $svg).show();
    $('g.county>*', $svg).hide();
    $('g.district', $svg).hide();
    $('g.village', $svg).hide();

    let $county = $('g.county', $svg);
    let $painted, color;

    data.forEach(x => {
        $painted = $(`path[cid='${x.id}']`, $county);
        color = mixColor(getColorByParty(x.p), Number(x.r || x.s), strict, rsOnly);
        $painted.show().css('fill', color);
    })

    $('g.county.fg', $svg).filter(c => !data.some(d => d.id == c.attr('cid'))).css('bg')
}

function paintDists($svg, data, rsOnly = true, strict = STRICT_CANDIDATE) {

    let $dist = $('g.district', $svg);
    let $county = $('g.county', $svg);
    $county.children('*').hide();
    $dist.children('*').hide();
    $('g.taiwan', $svg).show();
    $('g.village', $svg).hide();

    let $painted, color;
    data.forEach(x => {
        if (x.id % 100 == 0) return;
        $painted = $(`path[did='${x.id}']`, $dist);
        color = mixColor(getColorByParty(x.p), Number(x.r || x.s), strict, rsOnly);
        $painted.show().css('fill', color);
        $county.children(`path[cid='${x.id - (x.id % 100)}']`).show();
    })
}

function paintEctrs($svg, data, rsOnly = true, strict = STRICT_CANDIDATE) {

    let $ectr = $('g.electoral', $svg);
    $ectr.children('*').hide();
    $('g.county', $svg).hide();
    $('g.district', $svg).hide();
    $('g.village', $svg).hide();
    $('g.taiwan', $svg).show();

    let $painted = null, color = null;

    data.forEach(x => {
        $painted = $ectr.children(`*[ectr='${x.ectr}']`);
        color = mixColor(getColorByParty(x.p), Number(x.r || x.s), strict, rsOnly);
        $painted.show().css('fill', color);
    })
}

function paintVillages($svg, data, rsOnly = true, strict = STRICT_CANDIDATE, islg = false) {

    $('g.taiwan', $svg).show();
    let $super = null;
    if (islg) {
        $super = $('g.electoral', $svg).show();
    } else {
        $super = $('g.county', $svg).show();
        $('g.electoral', $svg).hide();
    }
    let $county = $('g.county', $svg).show();
    let $dist = $('g.district', $svg).show();
    let $vill = $('g.village', $svg);
    $super.children('*').hide();
    $county.children('*').hide();
    $dist.children('*').hide();
    $vill.children('*').hide();

    let $painted, color;
    data.forEach(x => {
        if (x.id < 10000) {
            if (islg) {
                if (isGoodElecotral(x.ectr)) {
                    $painted = $dist.children(`*[did='${x.id}']`);
                    $super.children(`*[ectr='${x.ectr}']`).show();
                } else {
                    $painted = $super.children(`*[ectr='${x.ectr}']`);
                    // $dist.children(`*[did='${x.id}']`).show();
                }
            }
            else {
                $painted = $dist.children(`*[did='${x.id}']`);
                $super.children(`*[cid='${x.id - x.id % 100}']`).show();
            }
        }
        else {
            $painted = $(`*[did='${Math.floor(x.id / 1000)}'][vname='${x.vname}']`, $vill);
        }
        color = mixColor(getColorByParty(x.p), Number(x.r || x.s), strict, rsOnly);
        $painted.show().css('fill', color);
    })
}

function getColorByParty(party) {

    if (party === null) return INDEPENDENT;

    switch (party) {
        case '中國國民黨': return AUTHORITARIAN;
        case '民主進步黨': return DEMOCRACY;
        case '時代力量': return EQUALITY;
        case '親民黨':
        case '民國黨': return OUTSIDER;
    }

    return AUTOCRACY;
}

function mixColor(color, opacity, strict = STRICT_CANDIDATE, rsOnly = false) {

    if (opacity == 0) return 'inherit';
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