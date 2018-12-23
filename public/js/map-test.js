"use strict";

(() => {

    $(() => {

        let qdata1 = {
            area: 0,
            no: 'lead',
            year: 2016,
            granule: 'e',
            tbName: 'legislator',
            queried: ['vote', 'sratio', 'ratio']
        };

        drawMap(d3.selectAll('svg.map'), null, () => {

            bindZoom($('svg.map'));

            $.get('/q', qdata1, res => {
                res = JSON.parse(res);
                console.log(res);
                paintEctrs($('svg.map:first'), res, false, STRICT_CANDIDATE, true);
            });

        });
    })

})();
