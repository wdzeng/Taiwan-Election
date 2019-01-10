"use strict";
import * as E from '/js/tw-leg-ectr.js';
import * as T from '/js/tw-town.js';
import * as Ideo from '/js/ideology.js';
import Map from '/js/map.js';

/*  Form Controler */

function toSimpleTai(str) {
    return str.replace('臺', '台');
}
function isLeg() {
    return $eEvent.val().includes('leg');
}
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

    if (!isLeg()) {
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
                let num = e % 100;
                num = num > 9 ? num : ('0' + num);
                return `<option value="${e}">${num} 選區</option>`;
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

    if (!isLeg()) {

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
    if (!isLeg()) {
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

$secCounty.change(e => {
    refreshElectorals();
    refreshTowns();
    refreshGranule()
});
$eEvent.change(e => {
    refreshElectorals();
    refreshTowns();
    refreshGranule();
    refreshSearchedTarget();
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
        if (resOnly || qdata.length == 1) return () => 'r';
        let vals = qdata.map(d => d.ratio || d.sratio);
        vals.sort((a, b) => a - b);
        let len = vals.length,
            min = vals[Math.floor(len * 0.1)],
            max = vals[Math.floor(len * 0.9)];
        return function (val) {
            if (val == 0) return 'foul';
            if (val < min) return 'xxs';
            if (val < min * 0.8 + max * 0.2) return 'xs';
            if (val < min * 0.6 + max * 0.4) return 's';
            if (val < min * 0.4 + max * 0.6) return 'm';
            if (val < min * 0.2 + max * 0.8) return 'l';
            if (val < max) return 'xl';
            return 'xxl';
        }
    }

    let k, col, idToCol = {}, numJudger = createNumberJudger();
    qdata.forEach(res => {

        if (res.vname) k = Math.floor(res.id / 1000) + ',' + res.vname; // village
        else if (res.ectr && layers[1]) k = res.id + ',' + res.ectr; // electoral
        else k = res.id; // town or county

        col = Ideo.colorize(res.party)[numJudger(res.ratio || res.sratio)];
        idToCol[k] = col;
    });

    const keys = [
        g => Math.floor(g.properties.d / 100) * 100,
        g => {
            if (g.properties.e) return Math.floor(g.properties.d / 100) * 100 + ',' + g.properties.e;
            else return null;
        },
        g => g.properties.d,
        (function () {
            if (isLeg()) {
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
        gn = layers.lastIndexOf(true),
        involve = function (g) {
            let k, col;
            for (let i = gn; i >= 0; i--) {
                k = keys[i](g);
                if (!k) continue;
                col = idToCol[k];
                if (col) return col;
            }
            return null;
        }

    let stroker = function (topo) {

        function county(g) {
            return Math.floor(g.properties.d / 100) * 100;
        }

        // village, towns, counties
        let sv = layers[3] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a !== b // distinct
                && (!layers[2] || a.properties.d === b.properties.d) // same town
                && (involve(a) || involve(b)); // effective
        }) : null;
        let st = layers[2] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a !== b
                && a.properties.d !== b.properties.d
                && (!layers[0] || county(a) === county(b))
                && (involve(a) || involve(b)); // effective
        }) : null;
        let se = layers[1] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a.properties.e !== b.properties.e;
        }) : null;
        let sc = layers[0] ? topojson.mesh(topo, topo.objects.villages, (a, b) => {
            return a !== b
                && county(a) !== county(b)
                && (involve(a) || involve(b)); // effective
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
    let n = 0;
    let filler = function (topo) {

        let colToGeo = {}, col;
        topo.objects.villages.geometries.forEach(g => {
            col = involve(g);
            if (!col) col = 'none';
            if (!colToGeo[col]) {
                colToGeo[col] = [];
                n++;
            };
            colToGeo[col].push(g);
        });

        let _filler = {};
        for (let c in colToGeo) {
            _filler[c] = topojson.merge(topo, colToGeo[c]);
        }
        return _filler;
    }

    return [filler, stroker, n];
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

    if (isLeg()) {
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
    if (isLeg()) {
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
        styler = (k, ctx, stroke) => {
            if (!stroke) {
                ctx.fillStyle = (k == 'none') ? 'grey' : k;
                return true;
            }
            switch (k) {
                case 'villages':
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = 'white';
                    ctx.setLineDash([2,2]);
                    return true;
                case 'towns':
                    ctx.lineWidth = 0.75;
                    ctx.strokeStyle = 'white';
                    ctx.setLineDash([]);
                    return true;
                case 'counties':
                case 'electorals':
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = 'black';
                    ctx.setLineDash([]);
                    return true;
            }
            return false;
        },
        map = new Map(mapContainer);

    map.setLayerAndDraw(filler, stroker, styler, n)
}

