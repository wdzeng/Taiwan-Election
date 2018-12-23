"use strict";

(() => {

    $(() => {

        let qdata = {
            area: 0,
            no: 'lead',
            year: 2016,
            granule: 'c',
            tbName: 'president',
            queried: ['vote', 'sratio', 'ratio']
        };

        drawMap(d3.selectAll('svg.map'), null, () => {
            
            bindZoom($('svg.map'));
            $.get('/q', qdata, res => {
                res = JSON.parse(res);
                console.log(res);
                paintEctrs($('svg.map:first'), res, true);
            });

        });
    })


})();
