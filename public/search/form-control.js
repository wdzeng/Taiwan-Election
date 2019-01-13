"use strict";
import * as E from '/js/tw-leg-ectr.js';
import * as T from '/js/tw-town.js';
import * as Ideo from '/js/ideology.js';
import Map from '/js/map.js';
import { ColorCollector as Colorer } from '/js/ideology.js';

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
$('#draw').click(e => queryData(drawMap));

function referLayerGrouper(qdata, resOnly, layers, no) {

    function createNumberJudger() {
        if (resOnly) return () => 'r';
        let vals = qdata.map(d => d.ratio || d.sratio);
        if (vals.length == 1) {
            return function (val) {
                if (val === undefined) return [vals[0]];
                return 'r';
            }
        }

        vals.sort((a, b) => a - b);
        let len = vals.length,
            min = vals[Math.floor(len * 0.1)],
            max = vals[Math.floor(len * 0.9)],
            diff = max - min;

        // Determine the range
        let xx;
        if (diff > 0.05) xx = 100;
        else if (diff > 0.005) xx = 1000;
        else xx = 10000;
        function xround(val) {
            return Math.round(val * xx) / xx;
        }

        let range = xround((max - min) / 5);
        min = xround(min);

        // Determine the interval
        let interval = [
            0,
            min,
            min + range,
            min + range * 2,
            min + range * 3,
            min + range * 4,
            min + range * 5
        ],
            col = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl'];

        return function (val) {
            if (val === undefined) return interval;
            for (let i = 1; i <= 6; i++) {
                if (val < interval[i]) return col[i - 1];
            }
            return 'xxl';
        }
    }

    // Order data
    let k,
        idToCol = {},
        numJudger = createNumberJudger(),
        $maplen = $('#map-legend').empty();

    qdata.forEach(res => {
        if (res.vname) k = Math.floor(res.id / 1000) + ',' + res.vname; // village
        else if (res.ectr && layers[1]) k = res.id + ',' + res.ectr;    // electoral
        else k = res.id;                                                // town or county
        let col = Ideo.referToColor(no, res.it == 'o')
        if (!col) return;
        idToCol[k] = col[numJudger(res.ratio || res.sratio)];
    });

    // Show legend
    if (resOnly) {
        let _for = Ideo.referToColor(no, true)['r'];
        let against = Ideo.referToColor(no, false)['r'];
        $maplen.append(`<p><span class="legend-box" style="background:${_for}"></span>贊成</p><p><span class="legend-box" style="background:${against}"></span>反對</p>`)
    }
    else {
        let clist = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl'];
        let col = Ideo.referToColor(no, true); // For
        let $p = $('<p></p>');
        clist.forEach(c => $p.append($('<span class="legend-box"></span>').css('background', col[c])));
        $p.append('贊成');
        $maplen.append($p);
        col = Ideo.referToColor(no, false); // For
        $p = $('<p></p>');
        clist.forEach(c => $p.append($('<span class="legend-box"></span>').css('background', col[c])));
        $p.append('反對');
        $maplen.append($p);
        $p = $('<p></p>');
        let interval = numJudger();
        interval.forEach(i => {
            let compOper = (i !== 0) ? '' : '≤';
            if (i === 0) i = interval[1];
            let text = compOper + Math.round(i * 100) + '%',
                $span = $('<span></span>').addClass('legend-box legend-text').html(text);
            $p.append($span);
        })
        $maplen.append($p)
    }

    const keyGenerators = [
        g => Math.floor(g.properties.d / 100) * 100,
        g => {
            if (g.properties.e) return Math.floor(g.properties.d / 100) * 100 + ',' + g.properties.e;
            else return null;
        },
        g => g.properties.d,
        (function () {
            if (legis()) {
                return function (g) {
                    if (g.properties.v) return `${g.properties.d},${g.properties.v}`;
                    else return (Math.floor(g.properties.d / 100) * 100) + ',' + g.properties.e;
                }
            }
            else {
                return function (g) {
                    return g.properties.v ? `${g.properties.d},${g.properties.v}` : g.properties.d;
                }
            }
        })()
    ],
        smxGr = layers.lastIndexOf(true),
        getColor = function (g) {
            let k, col;
            for (let i = smxGr; i >= 0; i--) {
                k = keyGenerators[i](g);
                if (!k) continue;
                col = idToCol[k];
                if (col) return col;
            }
            return null;
        }

    // Determine stroker
    let stroker = function (topo) {

        function county(g) {
            return Math.floor(g.properties.d / 100) * 100;
        }

        // village, towns, counties
        let sv = layers[3] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a !== b // distinct
                && (!layers[2] || a.properties.d === b.properties.d) // same town
                && (getColor(a) || getColor(b)); // effective
        }) : null;
        let st = layers[2] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a !== b
                && a.properties.d !== b.properties.d
                && (!layers[0] || county(a) === county(b))
                && (getColor(a) || getColor(b)); // effective
        }) : null;
        let se = layers[1] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a.properties.e !== b.properties.e;
        }) : null;
        let sc = layers[0] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a !== b
                && county(a) !== county(b)
                && (getColor(a) || getColor(b)); // effective
        }) : null;
        let coast = layers[4] ? topojson.mesh(topo, topo.objects.taiwan) : null;
        return {
            villages: sv,
            towns: st,
            electorals: se,
            counties: sc,
            coast: coast
        }
    }

    // Determine filler
    let filler = function (topo) {

        let colToGeo = {}, col;
        topo.objects.villages.geometries.forEach(g => {
            col = getColor(g);
            if (!col) col = 'none';
            if (!colToGeo[col]) colToGeo[col] = [];
            colToGeo[col].push(g);
        });

        let _filler = {};
        for (let c in colToGeo) _filler[c] = topojson.merge(topo, colToGeo[c]);
        return _filler;
    }

    return [filler, stroker];

}
function layerGrouper(qdata, resOnly, layers) {

    function createNumberJudger() {
        if (resOnly) return () => 'r';
        let vals = qdata.map(d => d.ratio || d.sratio);
        if (vals.length == 1) {
            return function (val) {
                if (val === undefined) return [vals[0]];
                return 'r';
            }
        }

        vals.sort((a, b) => a - b);
        let len = vals.length,
            min = vals[Math.floor(len * 0.1)],
            max = vals[Math.floor(len * 0.9)],
            diff = max - min;

        // Determine the range
        let xx;
        if (diff > 0.05) xx = 100;
        else if (diff > 0.005) xx = 1000;
        else xx = 10000;
        function xround(val) {
            return Math.round(val * xx) / xx;
        }

        let range = xround((max - min) / 5);
        min = xround(min);

        // Determine the interval
        let interval = [
            0,
            min,
            min + range,
            min + range * 2,
            min + range * 3,
            min + range * 4,
            min + range * 5
        ],
            col = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl'];

        return function (val) {
            if (val === undefined) return interval;
            for (let i = 1; i <= 6; i++) {
                if (val < interval[i]) return col[i - 1];
            }
            return 'xxl';
        }
    }

    // Determine colors
    let partyset = new Set(qdata.filter(res => res.p).map(res => res.p)),
        idp = Array.from(new Set(qdata.filter(res => !res.p && (res.id < 2100 || res.id >= 10000 && res.id < 2100000)).map(res => res.c)))

    idp.sort((a, b) => {
        return qdata.find(res => res.c == a).ratio - qdata.find(res => res.c == b).ratio;
    })
    let colorer = new Colorer(partyset, idp).distribute();

    // Order data
    let k,
        idToCol = {},
        numJudger = createNumberJudger(),
        $maplen = $('#map-legend').empty();

    qdata.forEach(res => {
        if (res.vname) k = Math.floor(res.id / 1000) + ',' + res.vname; // village
        else if (res.ectr && layers[1]) k = res.id + ',' + res.ectr;    // electoral
        else k = res.id;                                                // town or county
        let col = colorer[res.p || res.c]
        if (!col) return;
        idToCol[k] = col[numJudger(res.ratio || res.sratio)];
    });


    // Show legend
    const parray = Array.from(partyset).sort(Ideo.partyComparator);
    if (resOnly) {
        parray.concat(idp).forEach(p => {
            let $span = $('<span></span>').addClass('legend-box').css('background', colorer[p].r);
            let $p = $('<p></p>').append($span).append(p || '無黨籍');
            $maplen.append($p)
        });
    }
    else {

        let interval = numJudger(),
            ilen = interval.length,
            cols;

        if (ilen === 1) {
            cols = ['r'];
        }
        else {
            let lowb = 3 - Math.floor(ilen / 2),
                upb = 3 - lowb + ilen;
            cols = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl'].slice(lowb, upb);
        }

        let diff = (interval[ilen - 1] - interval[1]) / (ilen - 1),
            m, per;

        if (ilen === 1) {
            if (interval[0] >= 0.01) { m = 100; per = '%' }
            else { m = 1000; per = '‰' }
        }
        else if (diff >= 0.01) { m = 100; per = '%' }
        else { m = 1000; per = '‰' }

        parray.concat(idp).forEach(party => {
            let $p = $('<p></p>'), $span;
            cols.forEach(c => {
                $span = $('<span></span>').addClass('legend-box').css('background', colorer[party][c]);
                $p.append($span);
            })
            $p.append(party || '無黨籍');
            $maplen.append($p)
        });
        let $p = $('<p></p>');
        interval.forEach(i => {
            let compOper = (ilen === 1 || i !== 0) ? '' : '≤';
            if (i === 0) i = interval[1];
            let text = compOper + Math.round(i * m) + per,
                $span = $('<span></span>').addClass('legend-box legend-text').html(text);
            $p.append($span);
        })
        $maplen.append($p)
    }

    const keyGenerators = [
        g => Math.floor(g.properties.d / 100) * 100,
        g => {
            if (g.properties.e) return Math.floor(g.properties.d / 100) * 100 + ',' + g.properties.e;
            else return null;
        },
        g => g.properties.d,
        (function () {
            if (legis()) {
                return function (g) {
                    if (g.properties.v) return `${g.properties.d},${g.properties.v}`;
                    else return (Math.floor(g.properties.d / 100) * 100) + ',' + g.properties.e;
                }
            }
            else {
                return function (g) {
                    return g.properties.v ? `${g.properties.d},${g.properties.v}` : g.properties.d;
                }
            }
        })()
    ],
        smxGr = layers.lastIndexOf(true),
        getColor = function (g) {
            let k, col;
            for (let i = smxGr; i >= 0; i--) {
                k = keyGenerators[i](g);
                if (!k) continue;
                col = idToCol[k];
                if (col) return col;
            }
            return null;
        }

    // Determine stroker
    let stroker = function (topo) {

        function county(g) {
            return Math.floor(g.properties.d / 100) * 100;
        }

        // village, towns, counties
        let sv = layers[3] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a !== b // distinct
                && (!layers[2] || a.properties.d === b.properties.d) // same town
                && (getColor(a) || getColor(b)); // effective
        }) : null;
        let st = layers[2] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a !== b
                && a.properties.d !== b.properties.d
                && (!layers[0] || county(a) === county(b))
                && (getColor(a) || getColor(b)); // effective
        }) : null;
        let se = layers[1] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a.properties.e !== b.properties.e;
        }) : null;
        let sc = layers[0] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a !== b
                && county(a) !== county(b)
                && (getColor(a) || getColor(b)); // effective
        }) : null;
        let coast = layers[4] ? topojson.mesh(topo, topo.objects.taiwan) : null;
        return {
            villages: sv,
            towns: st,
            electorals: se,
            counties: sc,
            coast: coast
        }
    }

    // Determine filler
    let filler = function (topo) {

        let colToGeo = {}, col;
        topo.objects.villages.geometries.forEach(g => {
            col = getColor(g);
            if (!col) col = 'none';
            if (!colToGeo[col]) colToGeo[col] = [];
            colToGeo[col].push(g);
        });

        let _filler = {};
        for (let c in colToGeo) _filler[c] = topojson.merge(topo, colToGeo[c]);
        return _filler;
    }

    return [filler, stroker];
}
function queryData(cb) {
    let prm = $.param(qObject());
    $.get(($eEvent.val() == 'refer' ? '/rq?' : '/q?') + prm, cb);
    console.log(prm);
}
function qObject() {

    // Referendum
    if ($eEvent.val() == 'refer') {
        return {
            granule: $granule.val(),
            area: areaCode(),
            no: $eRefer.val(),
            get: $secTar.find('input:checked').val(),
            queried: $colored.find('input:checked').val() == 'strict' ? 'sratio' : 'ratio'
        }
    }

    // Election
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
            case 'v': return [false, true, false, true];
            case 'd': return [false, true, true];
            case 'e': return [false, true];
        }
    }
    else {
        switch (g) {
            case 'v': return [$secTown.val() == 0, false, true, true];
            case 'd': return [$secTown.val() == 0, false, true];
            case 'c': return [true];
        }
    }
    throw "Inner error."
}
async function drawMap(data) {

    data = JSON.parse(data);

    let one = $colored.find('input:checked').val() == 'one',
        grouper = $eEvent.val() == 'refer' ? referLayerGrouper(data, one, layersJudger(), $eRefer.val()) : layerGrouper(data, one, layersJudger()),
        filler = grouper[0],
        stroker = grouper[1],
        n = grouper[2],
        map = new Map(mapContainer);

    // Show map on the screen
    await map.setLayerAndDraw(filler, stroker, styler, n);

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
        case 'villages':
            if (scale < 5) return false;
            ctx.lineWidth = scale < 20 ? 0.5 : scale / 20 * 0.5;
            ctx.strokeStyle = 'white';
            ctx.setLineDash([15, 5]);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            return true;
        case 'towns':
            ctx.lineWidth = scale < 12 ? 0.85 : scale / 12 * 0.85;
            ctx.strokeStyle = 'white';
            ctx.setLineDash([]);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            return true;
        case 'counties':
        case 'electorals':
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