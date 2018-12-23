"use strict";

(() => {

    $(() => {

        let qdata = {
            area: 0,
            no: 'lead',
            year: 2014,
            granule: 'v',
            tbName: 'local',
            queried: ['vote', 'sratio', 'ratio']
        };

        drawMap(d3.selectAll('svg.map'), null, () => {
            
            bindZoom($('svg.map'));
            $.get('/q', qdata, res => {
                res = JSON.parse(res);
                console.log(res);
                paintVillages($('svg.map:first'), res, true);
            });

        });
    })

})();
