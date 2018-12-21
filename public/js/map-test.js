"use strict";

(() => {

    $(() => {

        let qdata = {
            area: 0,
            no: 'elect',
            year: 2018,
            granule: 'd',
            tbName: 'local',
            queried: ['vote', 'sratio', 'ratio']
        };

        drawMap(d3.selectAll('svg.map'), null, () => {
            
            bindZoom($('svg.map'));
            $.get('/q', qdata, res => {
                res = JSON.parse(res);
                console.log(res);
                paintDists($('svg.map:first'), res);
            });

        });
    })


})();
