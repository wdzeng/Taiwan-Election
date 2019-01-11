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
        legis = val;
    }
})()
function showOption($opt, flag) {
    if (flag) $opt.removeClass('disabled');
    else {
        $opt.addClass('disabled');
        if ($opt.is(':selected')) {
            let $parent = $opt.parent();
            $parent.val($parent.children(':not(.disabled):first').val())
        }
    }
}

const $secCounty = $('#sec-county'),
    $eEvent = $('#e-event'),
    $secEctr = $('#sec-ectr'),
    $secTown = $('#sec-town'),
    $granule = $('#granule'),
    $grCoun = $granule.find('option[value="c"]'),
    $grTown = $granule.find('option[value="d"]'),
    $grEctr = $granule.find('option[value="e"]'),
    $secCus = $('#sec-cus'),
    $txtCus = $('#txt-cus'),
    $secTar = $('#sec-target'),
    $secElect = $secTar.find('input[value="elect"]'),
    $secLead = $secTar.find('input[value="lead"]'),
    $colored = $('#colored');

function refreshElectorals() {

    if (!legis()) {
        $secEctr.css('display', 'none');
        return;
    }

    $secEctr.css('display', 'block');

    const coun = $secCounty.val();
    if (coun == 0) {
        $secEctr.html('<option selected value="0">全境</option>').attr('disabled', true);
        return;
    }

    let options = E.getAllElectorals().filter(e => Math.floor(e / 100) * 100 == coun);
    if (options.length > 1) {
        options = options.sort((a, b) => a - b)
            .map(e => {
                return `<option value="${e}">${insertZero(e % 100, 2)} 選區</option>`;
            })
            .join();
        $secEctr.html('<option selected value="0">全境</option>' + options).attr('disabled', false);
    }
    else {
        $secEctr.html(`<option selected value="${options[0]}">01 選區</option>'`).attr('disabled', false);
    }
}
function refreshTowns() {

    function optimizeTownName(id) {
        return toSimpleTai(T.getTownNameById(id).substring(3));
    }
    const all = '<option selected value="0">全境</option>';

    if (!legis()) {

        $secTown.css('display', 'block');
        let coun = $secCounty.val();
        if (coun == 0) {
            $secTown.html(all).attr('disabled', true);
            return;
        }

        let options = T.getAllTownIds().filter(id => id != coun && Math.floor(id / 100) * 100 == coun)
            .sort((a, b) => a - b)
            .map(id => `<option value="${id}">${optimizeTownName(id)}</option>`)
            .join();
        $secTown.html(all + options).attr('disabled', false);
        return;
    }

    let coun = $secCounty.val();
    if (coun == 0) {
        $secTown.html(all).attr('disabled', true);
        return;
    }

    let ectr = $secEctr.val();
    if (ectr == 0) {
        $secTown.html(all).attr('disabled', true);
        return;
    }

    if (!E.isGoodElectoral(ectr)) {
        $secTown.html('<option value="0">全境</option>').attr('disabled', true);
        return;
    }

    let options = T.getAllTownIds()
        .filter(id => id != coun && Math.floor(id / 100) * 100 == coun && E.getElectoral(id) == ectr);
    if (options.length == 1) {
        $secTown.html(`<option val=${options[0]}>${optimizeTownName(options[0])}</option>`)
            .attr('disabled', false)
    }
    else {
        options = options.sort((a, b) => a - b)
            .map(id => `<option value="${id}">${optimizeTownName(id)}</option>`)
            .join();
        $secTown.html(all + options).attr('disabled', false);
    }
}
function refreshGranule() {
    if (!legis()) {
        showOption($grEctr, false);
        showOption($grTown, true);

        let town = $secTown.val();
        if (town == 0) {
            showOption($grCoun, true)
        }
        else {
            showOption($grCoun, false);
        }
        return;
    }

    showOption($grCoun, false);
    showOption($grEctr, true);
    let coun = $secCounty.val();
    if (coun == 0) {
        showOption($grTown, false);
        return;
    }

    let ectr = $secEctr.val();
    if (ectr == 0) {
        showOption($grTown, E.isGoodElectoral(coun));
        return;
    }

    let isGoodEctr = $secTown.css('display') != 'none';
    if (isGoodEctr) {
        showOption($grTown, true);
        let town = $secTown.val();
        showOption($grEctr, town == 0)
    }
    else {
        showOption($grTown, false);
        showOption($grEctr, true)
    }
}
function refreshSearchedTarget() {
    let e = $eEvent.find('option:selected').attr('tbName');
    if (e === 'party_listed_legislator') {
        $secElect.attr('disabled', true).prop('checked', false);
        $secLead.prop('checked', true)
    }
    else {
        $secElect.attr('disabled', false)
    }
}

$eEvent.change(e => {
    legis($eEvent.find('option:selected').attr('tbName') == 'legislator');
    refreshElectorals();
    refreshTowns();
    refreshGranule();
    refreshSearchedTarget();
});
$secCounty.change(e => {
    refreshElectorals();
    refreshTowns();
    refreshGranule()
});
$secTar.find('input[type="radio"]').change(e => {
    if ($secCus.is(':checked')) $txtCus.attr('disabled', false);
    else $txtCus.val('').attr('disabled', true);
})
$secEctr.change(e => {
    refreshTowns();
    refreshGranule()
});
$secTown.change(e => refreshGranule());

/* Map Drawing functions */

const mapContainer = document.getElementById('cv-cont');
$('#draw').click(queryData);

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

        // Determine the intercal
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
    let k, col,
        idToCol = {},
        numJudger = createNumberJudger(),
        partyset = new Set(),
        $maplen = $('#map-legend').empty();

    qdata.forEach(res => {
        if (res.vname) k = Math.floor(res.id / 1000) + ',' + res.vname; // village
        else if (res.ectr && layers[1]) k = res.id + ',' + res.ectr;    // electoral
        else k = res.id;                                                // town or county
        col = Ideo.colorize(res.party)[numJudger(res.ratio || res.sratio)];
        partyset.add(res.party);
        idToCol[k] = col;
    });

    // Show legend
    const parray = Array.from(partyset).sort(Ideo.partyComparator);
    if (resOnly) {
        parray.forEach(p => {
            let $span = $('<span></span>').addClass('legend-box').css('background', Ideo.colorize(p).r);
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

        parray.forEach(party => {
            let $p = $('<p></p>'), $span;
            cols.forEach(c => {
                $span = $('<span></span>').addClass('legend-box').css('background', Ideo.colorize(party)[c]);
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
function queryData() {
    let prm = $.param(qObject());
    $.get('/q?' + prm, drawMap);
    console.log(prm);
}
function qObject() {
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
        let tval = $secTown.val();
        if ($secTown.css('display') == 'none' || tval == 0) {
            let etval = $secEctr.val();
            if (etval != 0) return etval;
            return $secCounty.val();
        }
        return tval;
    }

    let tval = $secTown.val();
    if (tval != 0) return tval;
    return $secCounty.val();
}
function no() {
    let selected = $secTar.find('input:checked').val();
    return selected == 'other' ? $txtCus.val() : selected;
}
function layersJudger() {
    let g = $granule.val();
    if (legis()) {
        switch (g) {
            case 'v': return [false, true, $grTown.css('display') != 'none', true];
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
        grouper = layerGrouper(data, one, layersJudger()),
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