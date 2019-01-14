"use strict";
import * as E from '/js/tw-leg-ectr.js';
import * as T from '/js/tw-town.js';
import * as Ideo from '/js/ideology.js';
import Map from '/js/map.js';

/* Form Controler */

let legis = (function () {
    let legis = false;
    return function (val) {
        if (val === undefined) return legis;
        let old = legis;
        legis = val;
        return legis !== old;
    }
})()

const $election = $('#election'),
    $secCounty = $('#sec-county'),
    $secEctr = $('#sec-ectr'),
    $secTown = $('#sec-town'),
    $eEvent = $('#e-event'),
    $granule = $('#granule'),
    $grCoun = $granule.find('option[value="c"]'),
    $grEctr = $granule.find('option[value="e"]'),
    $grTown = $granule.find('option[value="d"]'),
    $secCus = $('#sec-cus'),
    $txtCus = $('#txt-cus'),
    $secTar = $('#sec-target'),
    $colored = $('#colored'),
    $eRefer = $('#refer');

function showOption($opt) {
    $opt.css('display', 'block');
}
function hideOption($opt) {
    $opt.css('display', 'none');
    if ($opt.is(':selected')) {
        let $select = $opt.parent('select');
        $select.find('option').each(function () {
            if ($(this).css('display') != 'none') {
                $(this).prop("selected", true);
                return false;
            }
        });
    }
}

$eEvent.change(e => {

    let elval = $eEvent.val();

    // Check referendum
    if (elval === 'refer') $election.addClass('refer');
    else $election.removeClass('refer');

    // Check legislator election
    if (elval.indexOf('leg') !== -1) {
        $election.addClass('leg');
        if (legis(true)) {
            showOption($grEctr);
            hideOption($grTown);
        }
    }
    else {
        $election.removeClass('leg');
        if (legis(false)) {
            showOption($grTown);
            hideOption($grEctr);
        }
    }
});
$secCounty.change(e => {
    let coun = $secCounty.val();
    if (coun == 0) {
        $secEctr.html('<option selected value="0">全境</option>');
        $secTown.html('<option selected value="0">全境</option>');
    }
    else {
        let nectr = E.getAllElectorals().filter(e => Math.floor(e / 100) * 100 == coun).length;
        let html = '<option selected value="0">全境</option>';
        for (let i = 1; i <= nectr; i++) {
            html += `<option value="${Number(coun) + i}">${insertZero(i, 2)} 選區</option>`;
        }
        $secEctr.html(html);

        let towns = T.getAllTownIds()
            .filter(t => t != coun && Math.floor(t / 100) * 100 == coun)
            .map(t => `<option value="${t}">${T.getTownNameById(t).substring(3)}</option>`)
            .join('');
        $secTown.html(`<option selected value="0">全境</option>${towns}`);
    }
    !legis() && showOption($grCoun);
});
$secTown.change(e => {
    let tval = $secTown.val();
    if (tval == 0) showOption($grCoun);
    else hideOption($grCoun);
})
$('input[name="searched"][type="radio"]').change(e => {
    $txtCus.attr('disabled', !$secCus.is(':checked'));
})

// Miscellaneous codes should be cleaned ...

const mapContainer = document.getElementById('cv-cont');
$('#draw').click(async () => {
    let qdata = await queryData();
    qdata = JSON.parse(qdata);
    drawMap(qdata);
});

function createSizeJudger(qdata, resOnly) {
    let one = function (val) {
        if (val === undefined) return [vals[0]];
        return 'r';
    }
    if (resOnly || qdata.length === 1) return one;

    // Deal with multiple colors
    let vals = qdata
        .map(d => d.ratio || d.sratio || 0)
        .sort((a, b) => a - b),
        len = vals.length,
        min = vals[Math.floor(len * 0.1)],
        max = vals[Math.floor(len * 0.9)],
        med = (max + min) / 2,
        space = (max - min) / 5;

    let precision;
    if (space >= 0.01) precision = 2;
    else if (space >= 0.001) precision = 3;
    else precision = 4;

    let mul = Math.pow(10, precision),
        round = v => Math.round(v * mul) / mul;
    space = round(space);

    if (max >= 0.1) med = Math.round(med * 100) / 100;
    else if (max >= 0.01) med = Math.round(med * 1000) / 1000;
    else med = Math.round(med * 10000) / 10000;

    let interval = [Math.pow(10, -precision)];
    for (let i = -2; i <= 3; i++) {
        let v = med + i * space;
        if (min <= v && v <= max)
            interval.push(round(v));
    }
    let col = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl']
        .slice(3 - interval.length / 2, 3 - interval.length / 2 + interval.length);

    // Check zero possibility
    if ($secTar.find('input:checked').val() !== 'lead'
        && qdata.some(d => !d.ratio && !d.sratio)) {
        col.unshift('foul');
        interval.unshift(0);
    }

    return val => {
        if (val === 0 || val === '0') {
            return 'foul';
        }
        if (val === undefined) {
            return interval;
        }
        if (val === 'list') {
            return col;
        }
        if (val === 'precision') {
            return precision;
        }
        for (let i = interval.length - 1; i >= 0; i--) {
            if (val >= interval[i]) return col[i];
        }
        throw "Internal error";
    }
}
function paintTask(qdata, resOnly, layers, no = -1) {

    function getColorByGeo(g) {
        let key;
        if (layers.village) {
            // Check villages
            if (g.properties.v) {
                key = `${g.properties.d},${g.properties.v}`;
                if (key in keyColMap) return keyColMap[key];
            }
        }
        if (layers.town) {
            key = g.properties.d;
            if (key in keyColMap) return keyColMap[key];
        }
        if (layers.electoral) {
            key = `${Math.floor(g.properties.d / 100) * 100},${g.properties.e}`;
            if (key in keyColMap) return keyColMap[key];
        }
        if (layers.county) {
            key = Math.floor(g.properties.d / 100) * 100;
            if (key in keyColMap) return keyColMap[key];
        }
        return null;
    }
    function getKeyByDatum(d) {
        if (d.vname) {
            // village datum
            return Math.floor(d.id / 1000) + ',' + d.vname;
        }
        if (d.ectr && layers.electoral) {
            // electoral
            return d.id + ',' + d.ectr;
        }
        // town or county datum          
        return d.id;
    }

    // Create color judger
    let getColorByDatum,
        keyColMap = {},
        sizeJudger = createSizeJudger(qdata, resOnly),
        parties, icands // Used only in election
    if (no != -1) {
        // Referendum
        getColorByDatum = d => {
            if (d.it) return Ideo.referToColor(no, d.it === 'o');
            else return Ideo.referToColor(no, d);
        }
    }
    else {
        // Election
        // Get all parties and independent candidates
        let partySet = new Set(), icandSet = new Set();
        qdata.forEach(datum => {
            if (datum.p) partySet.add(datum.p);
            else icandSet.add(datum.c);
        });
        // Sort by their votes (desc)
        function nParty(party) {
            return qdata.reduce((sum, d) => d.p === party ? sum + 1 : sum, 0);
        }
        function nCand(name) {
            return qdata.reduce((sum, d) => d.c === name ? sum + 1 : sum, 0);
        }
        let n, sorter = (a, b) => n[b] - n[a];
        parties = Array.from(partySet);
        n = {};
        parties.forEach(p => n[p] = nParty(p));
        parties.sort(sorter);
        icands = Array.from(icandSet);
        n = {};
        icands.forEach(c => n[c] = nCand(c));
        icands.sort(sorter);
        let judger = Ideo.createColorJudger(parties, icands);
        getColorByDatum = d => judger(d.p || d.c || d);
    }

    // Create an data-to-color map
    (function () {
        let key, col, size,
            zeroPossible = $secTar.find('input:checked').val() !== 'lead';
        qdata.forEach(datum => {
            if (!zeroPossible && !datum.ratio && !datum.sratio) return;
            key = getKeyByDatum(datum);
            col = getColorByDatum(datum);
            size = sizeJudger(datum.ratio || datum.sratio || 0);
            keyColMap[key] = col[size];
        });
    })();

    // Create legend invoker
    let lgInvoker;
    (function () {
        if (resOnly) {
            if (no != -1) {
                lgInvoker = function () {
                    $('#map-legend').empty().append(
                        `<p><span class="legend-box" style="background:${getColorByDatum(1).r}"></span>贊成</p>
                         <p><span class="legend-box" style="background:${getColorByDatum(0).r}"></span>反對</p>`
                    );
                }
            }
            else {
                lgInvoker = function () {
                    let html = parties
                        .concat(icands)
                        .map(item => `<p><span class="legend-box" style="background: ${getColorByDatum(item).r}"></span>${item}</p>`)
                        .join('');
                    $('#map-legend').empty().append(html);
                }
            }
        }
        else {
            let legendContainer = $('#map-legend');
            function appendRatios() {
                let values = sizeJudger(),
                    prec = sizeJudger('precision'),
                    m, per;
                if (values[1] >= 0.1 || (values[1] >= 0.01 && prec === 2)) {
                    per = '%';
                    m = 100;
                    prec -= 2;
                }
                else if (values[1] >= 0.01 || (values[1] >= 0.001 && prec === 3)) {
                    per = '‰';
                    m = 1000;
                    prec -= 3;
                }
                else {
                    per = '‱';
                    m = 10000;
                    prec -= 4;
                }
                let spaces = values
                    .map(val => `<span class="legend-box legend-text">${(val * m).toFixed(prec)}${per}</span>`)
                    .join('');
                legendContainer.append(`<p>${spaces}</p>`)
            }
            function appendLegendBlocks(col, title) {
                let html = sizeJudger('list')
                    .map(c => `<span class="legend-box" style="background: ${col[c]}"></span>`)
                    .join('');
                legendContainer.append(`<p>${html}${title}</p>`);
            }
            if (no != -1) {
                lgInvoker = function () {
                    legendContainer.empty();
                    appendLegendBlocks(getColorByDatum(1), '贊成方');
                    appendLegendBlocks(getColorByDatum(0), '反對方');
                    appendRatios();
                }
            }
            else {
                let array2 = parties.concat(icands);
                lgInvoker = function () {
                    legendContainer.empty();
                    array2.forEach(item => {
                        appendLegendBlocks(getColorByDatum(item), item);
                    });
                    appendRatios();
                }
            }
        }
    })();

    // Create stroker and filler
    let stroker = function (topo) {

        function getCidOfGeo(g) {
            return Math.floor(g.properties.d / 100) * 100;
        }

        let _stroker = {}, filter;
        if (layers.village) {
            if (layers.town) {
                filter = (a, b) => {
                    return a !== b                                  // Check distinct geo
                        && a.properties.d === b.properties.d        // Check same town (and same county)
                        && (getColorByGeo(a) || getColorByGeo(b));  // Check effective geo
                };
            }
            else if (layers.county) {
                filter = (a, b) => {
                    return a !== b                                  // Check distinct geo
                        && getCidOfGeo(a) === getCidOfGeo(b)        // Check same county
                        && (getColorByGeo(a) || getColorByGeo(b));  // Check effective geo
                };
            }
            else {
                filter = (a, b) => {
                    return a !== b                                  // Check distinct geo
                        && (getColorByGeo(a) || getColorByGeo(b));  // Check effective geo
                };
            }
            _stroker['village'] = topojson.mesh(topo, topo.objects.villages, filter);
        }
        if (layers.town) {
            if (layers.county) {
                filter = (a, b) => {
                    return a !== b                                  // Check distinct geo
                        && a.properties.d !== b.properties.d        // Check distinct geo
                        && getCidOfGeo(a) === getCidOfGeo(b)        // Check same county
                        && (getColorByGeo(a) || getColorByGeo(b));  // Check effective geo
                }
            }
            else {
                filter = (a, b) => {
                    return a !== b                                  // Check distinct geo
                        && a.properties.d !== b.properties.d        // Check distinct geo
                        && (getColorByGeo(a) || getColorByGeo(b));  // Check effective geo
                }
            }
            _stroker['town'] = topojson.mesh(topo, topo.objects.villages, filter);
        }
        if (layers.electoral) {
            _stroker['electoral'] = topojson.mesh(topo, topo.objects.villages, (a, b) => {
                return a !== b
                    && a.properties.e !== b.properties.e
                    && (getColorByGeo(a) || getColorByGeo(b))
            });
        }
        if (layers.county) {
            _stroker['county'] = topojson.mesh(topo, topo.objects.villages, (a, b) => {
                return a !== b                              // Check distinct geo
                    && getCidOfGeo(a) !== getCidOfGeo(b)    // Check distinct geo
                    && (getColorByGeo(a) || getColorByGeo(b));        // Check effective geo            
            });
        }
        if (layers.coast) {
            _stroker['coast'] = topojson.mesh(topo, topo.objects.taiwan);
        }

        return _stroker;
    }
    let filler = function (topo) {

        let colGeoMap = {}, col;
        topo.objects.villages.geometries.forEach(g => {
            col = getColorByGeo(g);
            if (!col) col = 'none';                         // This geo is not involved in this query
            if (!(col in colGeoMap)) colGeoMap[col] = [];   // Init
            colGeoMap[col].push(g);
        });

        let _filler = {};
        for (let c in colGeoMap) {
            _filler[c] = topojson.merge(topo, colGeoMap[c]);
        }
        return _filler;
    }

    return {
        filler: filler,
        stroker: stroker,
        legendInvoker: lgInvoker
    };
}
async function queryData() {
    return new Promise((res, rej) => {
        let type = $eEvent.val() == 'refer' ? 'referendum' : 'election',
            prm = $.param(qObject(type)),
            url = (type == 'referendum' ? '/rq?' : '/q?') + prm;
        console.log(url);
        $.get(url).done(res).fail(rej);
    });
}
function qObject(type) {

    if (type === 'referendum') {
        return {
            granule: $granule.val(),
            area: areaCode(),
            no: $eRefer.val(),
            get: $secTar.find('input:checked').val(),
            queried: $colored.find('input:checked').val() == 'strict' ? 'sratio' : 'ratio'
        }
    }
    else {
        let $event = $eEvent.find('option:selected');
        return {
            year: $event.attr('year'),
            tbName: $event.attr('tbName'),
            area: areaCode(),
            granule: $granule.val(),
            no: no(),
            queried: $colored.find('input:checked').val() == 'strict' ? 'sratio' : 'ratio'
        }
    }
}
function areaCode() {

    if (legis()) {
        let cval = $secCounty.val();
        if (cval == 0) return 0;
        let elval = $secEctr.val();
        if (elval == 0) return cval;
        return elval;
    }

    let cval = $secCounty.val();
    if (cval == 0) return 0;
    let tval = $secTown.val();
    if (tval == 0) return cval;
    return tval;
}
function no() {
    let selected = $secTar.find('input:checked').val();
    return selected == 'other' ? $txtCus.val() : selected;
}
function layersJudger() {
    let g = $granule.val();
    if (legis()) {
        switch (g) {
            case 'v':
                return {
                    village: true,
                    electoral: true
                }
            case 'e':
                return {
                    electoral: true
                }
            default: throw 'Invalid granule: ' + g;
        }
    }
    else {
        switch (g) {
            case 'v':
                return {
                    county: $secTown.val() == 0,
                    town: true,
                    village: true
                }
            case 'd':
                return {
                    county: $secTown.val() == 0,
                    town: true,
                }
            case 'c':
                return {
                    county: true
                }
            default: throw 'Invalid granule: ' + g;
        }
    }
}
async function drawMap(data) {

    let resOnly = $colored.find('input:checked').val() === 'one',
        lj = layersJudger(),
        referNo = $eEvent.val() === 'refer' ? $eRefer.val() : -1,
        grouper = paintTask(data, resOnly, lj, referNo),
        filler = grouper.filler,
        stroker = grouper.stroker,
        map = new Map(mapContainer);

    // Show map on the screen
    await map.setLayerAndDraw(filler, stroker, styler);
    // Show legend
    grouper.legendInvoker();
    // Register follower
    regFollower(map, $granule.val(), data);
}
function regFollower(map, gr, data) {
    const $divInfo = $('#map-info');
    map.follow(function (info) {
        if (info === null) {
            $divInfo.empty();
            return;
        }

        let text;
        switch (gr) {
            case 'c':
                let c;
                if (info.d < 10000) c = info.d - info.d % 100
                else c = Math.floor(info.d / 100000) * 100;
                if (data.find(r => r.id == c)) text = T.getTownNameById(c);
                else text = '';
                break;

            case 'e':
                if (data.find(r => r.ectr == info.e))
                    text = `${T.getTownNameById(info.d - info.d % 100)} ${insertZero(info.e % 100, 2)} 選區`;
                else text = '';
                break;

            case 'd':
                if (data.find(r => r.id == info.d)) text = T.getTownNameById(info.d);
                else text = '';
                break;

            case 'v':
                if (!info.v) text = '';
                else if (legis()) {
                    if (data.find(r => r.ectr == info.e))
                        text = T.getTownNameById(info.d) + info.v;
                    else
                        text = '';
                }
                else {
                    if (data.find(r => r.id == info.d)) text = T.getTownNameById(info.d) + info.v;
                    else text = '';
                }
                break;
        }
        $divInfo.html(text);
    })
}
function styler(k, ctx, scale, isStroke) {
    if (!isStroke) {
        ctx.fillStyle = (k == 'none') ? 'grey' : k;
        return true;
    }
    switch (k) {
        case 'village':
            if (scale < 5) return false;
            ctx.lineWidth = scale < 20 ? 0.5 : scale / 20 * 0.5;
            ctx.strokeStyle = 'white';
            ctx.setLineDash([15, 5]);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            return true;
        case 'town':
            ctx.lineWidth = scale < 12 ? 0.85 : scale / 12 * 0.85;
            ctx.strokeStyle = 'white';
            ctx.setLineDash([]);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            return true;
        case 'county':
        case 'electoral':
            ctx.lineWidth = scale < 4 ? 1.5 : scale / 4 * 1.5;
            ctx.strokeStyle = 'black';
            ctx.setLineDash([]);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            return true;
    }
    return false;
}

/* Others */

function insertZero(val, len) {
    val = val.toString();
    for (let i = len - val.length; i > 0; i--)
        val = '0' + val;
    return val;
}
function toSimpleTai(str) {
    return str.replace('臺', '台');
}