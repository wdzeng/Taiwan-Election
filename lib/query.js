let mysql = require('mysql');
let async = require('async');
let secret = require('./secret.js');
let idmng = require('./district-id.js');

const PR = 'president';
const LG = 'legislator';
const LS = 'party_listed_legislator';
const LC = 'local';
const CD = '_candidate';
const VT = '_voter';


function candidateVote(item, cb) {

    let sql = null;
    let tname = null;
    let election = null;

    switch (election) {
        case '縣市長':
            tname = LC;
            election = item.year + '地方';
            break;
        case '立委':
            tname = LG;
            election = item.year + (item.year == 2008 ? '立委' : '全國');
            break;
        case '不分區':
            tname = LS;
            election = item.year + (item.year == 2008 ? '立委' : '全國');
            break;
        case '總統':
            tname = PR;
            election = item.year + (item.year == 2008 ? '總統' : '全國');
            break;
        default: cb(); return;
    }

    let election = item.year + item.election;
    let areaSelector;

    /**
     * {c: 0}   全台各縣市票數
     * {c: 600} 高雄市票數總和
     * {d: 0}   全台各區票數
     * {d: 600} 高雄市各區票數總和
     * {v: 600} 高雄市各里票數
     * {d: 601} 高雄市某某區票數總和
     * {v: 601} 高雄市某某區各里票數
     */

    if ('c' in item.district) {
        const cid = item.district.c;
        // Some county
        if (cid) {
            sql = `SELECT 
                        c.name AS cd, 
                        SUM(vote) AS t 
                   FROM ${tname} e INNER JOIN village v ON e.election=v.election AND e.vid=v.vid
                   INNER JOIN local_candidate c ON e.election=c.election AND e.no = c.no
                   WHERE e.election='${election}' 
                        AND (v.did BETWEEN ${cid + 1} AND ${cid + 99})
                        AND ${tname == LC ? 'c.cid=500' : '1'}
                   GROUP BY c.name
                   ORDER BY c.no`;
        }
        // All counties
        else {
            sql = `SELECT 
                        v.did div 100 * 100 as county, 
                        c.${tname == LS ? 'party' : 'name'} as candidate, 
                        SUM(vote) AS t 
                   FROM ${tname} e
                   INNER JOIN village v ON e.election=v.election AND e.vid=v.vid
                   INNER JOIN ${tname}_candidate c ON e.election=c.election AND e.no = c.no
                   WHERE e.election=${tname}
                        AND ${tname == LC ? 'c.cid = (v.did div 100 * 100)' : '1'}
                        AND ${tname == LG ? 'c.cid = (v.did div 100 * 100)' : '1'}
                   GROUP BY c.name, v.did div 100
                   ORDER BY v.did div 100, c.no`;
        }
    }
    else if ('d' in item.district) {
        // All districts in taiwan
        if (d == 0) {
            let res = {};
            async.each(
                idmng.ids,
                (id, cb) => {
                    if (id % 100 == 0) { cb(); return; }
                    let sql = `SELECT vid, SUM(vote) AS t, no FROM ${tname}
                               WHERE election='${election}' AND did=${id}`;
                    q(sql, (err, r) => {
                        if (err) throw err;
                        res[id.toString()] = r;
                        cb()
                    });
                },
                err => { if (err) throw err; cb(null, res); }
            )
        }
        // Some district
        else if (item.district.d % 100) {
            let sql = `SELECT vid, SUM(vote) AS t, no FROM ${tname}
                       WHERE election='${election}' AND did=${id}`;
            q(sql, cb);
            return;
        }
        // All districts in some county
        else {
            let res = {};
            let h = item.district.d / 100;
            async.each(
                idmng.ids,
                (id, cb) => {
                    if (id % 100 == 0 || h != Math.floor(id / 100)) { cb(); return; }
                    let sql = `SELECT vid, SUM(vote) AS t, no FROM ${tname}
                               WHERE election='${election}' AND did=${id}`;
                    q(sql, (err, r) => {
                        if (err) throw err;
                        res[id.toString()] = r;
                        cb()
                    });
                },
                err => { if (err) throw err; cb(null, res); }
            )
        }
    }
    else if ('v' in item.district) {
        // All villages in taiwan
        if (v == 0) {
            let sql = `SELECT vid, vote AS votes, no FROM ${tname}
                       WHERE election='${election}'`;
        }
        // All villages in some district
        else if (item.district.v % 100) {

        }
        // All villages in some county
        else {

        }
    }
    else {
        cb();
        return;
    }

    let sql = `SELECT vid, SUM(vote) AS t, no FROM ${tname}
               WHERE election='${areaSelector}'`;
    switch (info.election) {
        case 'president':
        case 'local':
        case 'legislator':
        case 'party_listed_legislator':
    }
}

exports.local = function (info, cb) {

    let sql = null;
    let area = info.area;
    let election = info.election;
    let no = info.no;
    let collect = info.collect;

    let candSt = null;
    if (!no) candSt = "1";
    else {
        if (Array.isArray(no)) {
            candSt = no.map(n => ` c.no=${n} `).join('OR');
        }
        else {
            candSt = `c.no=${no}`;
        }
    }

    // 1 全台各縣市長票總和            
    // 2 某縣市長得票總和          
    // 3 全台各縣市長各區得票總和       
    // 4 某縣市長各區得票總和       
    // 5 全台各縣市長各村得票
    // 6 某縣市長各村得票
    // 7 某縣市長某區各村得票

    if ('c' in area) {

        if (area.c == 0) { // 1

            sql = collect == 'ticket' ? `

                SELECT c.cid AS ct, c.no AS no, c.name AS cd, c.party as p, SUM(vote) AS t
                FROM local e
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid
                WHERE e.election='${election}' AND (v.did div 100)=c.cid/100
                    AND (${candSt})
                GROUP BY c.cid, c.no
                ORDER BY c.cid, c.no`
                : `

                SELECT c.cid AS ct, c.no AS no, c.name AS cd, c.party as p, SUM(vote)/(
                    select sum(vote)
                    from local se
                    inner join village sv
                    on se.election=sv.election and se.vid=sv.vid
                    where (sv.did div 100)=c.cid/100 and se.no<>-1 and se.election='${election}'
                ) AS r
                FROM local e
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid
                WHERE e.election='${election}' AND (v.did div 100)=c.cid/100
                    AND (${candSt})
                GROUP BY c.cid, c.no
                ORDER BY c.cid, c.no
                `
        }

        else { // 2
            sql = collect == 'ticket' ? `

                SELECT c.cid AS ct, c.no AS no, c.name AS cd, c.party as p, SUM(vote) AS t
                FROM local e
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid
                WHERE e.election='${election}' AND c.cid=${area.c} AND ${area.c}/100=(v.did div 100)
                    AND (${candSt})
                GROUP BY c.cid, c.no
                ORDER BY c.cid, c.no`
                : `

                select v.did as dist, e.no as no, sum(vote)/(
                    select sum(vote)
                    from local se
                    inner join village sv
                    on se.election=sv.election and se.vid=sv.vid
                    where sv.did=v.did and se.no<>-1
                    and sv.election='${election}'
                ) as ratio
                from local e
                inner join village v
                on e.election=v.election
                and e.vid = v.vid
                where v.did BETWEEN 501 and 599
                and e.election='${election}'
                group by dist, no`;
        }
    }

    else if ('d' in area) {

        if (area.d == 0) { // 3
            sql = collect == 'ticket' ? `
            
                SELECT v.did as d, c.no AS no, c.name AS cd, c.party as p, SUM(vote) AS t 
                FROM local e 
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
                WHERE e.election='${election}' AND (v.did div 100)=c.cid/100
                    AND (${candSt})
                GROUP BY v.did, c.no
                ORDER BY v.did, c.no`
                : `
            
                SELECT v.did as d, c.no AS no, c.name AS cd, c.party as p, SUM(vote)/(
                    select sum(vote) from local se
                    inner join village  sv
                    on se.election=sv.election and se.vid=sv.vid
                    where se.election='${election}' and no<>-1 and sv.did=v.did
                ) AS r 
                FROM local e 
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
                WHERE e.election='${election}' AND (v.did div 100)=c.cid/100
                    AND (${candSt})
                GROUP BY v.did, c.no
                ORDER BY v.did, c.no`;
        }

        else { // 4
            let cid = area.d;
            sql = collect == 'ticket' ? `
            
                SELECT v.did as d, c.no AS no, c.name AS cd, c.party as p, SUM(vote) AS t 
                FROM local e 
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
                WHERE e.election='${election}' AND (v.did between ${cid + 1} and ${cid + 99}) and c.cid=${cid}
                    AND (${candSt})
                GROUP BY v.did, c.no
                ORDER BY v.did, c.no`
                : `

                SELECT v.did as d, c.no AS no, c.name AS cd, c.party as p, SUM(vote)/(
                    select sum(vote) from local se
                    inner join village sv on se.vid=sv.vid and se.election=sv.election
                    where se.election='${election}' AND sv.did=v.did and se.no<>-1
                ) AS r 
                FROM local e 
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
                WHERE e.election='${election}' AND (v.did between ${cid + 1} and ${cid + 99}) and c.cid=${cid}
                    AND (${candSt})
                GROUP BY v.did, c.no
                ORDER BY v.did, c.no`;
        }
    }

    else {

        if (area.v == 0) { // 5
            sql = collect == 'ticket' ? `
            
                SELECT v.did as d, v.village as v, c.no AS no, c.name AS cd, c.party as p, e.vote AS t 
                FROM local e 
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
                WHERE e.election='${election}' AND (v.did div 100)=c.cid/100 
                    AND (${candSt})
                ORDER BY v.did, v.village, c.no`
                : `

                SELECT v.did as d, v.village as v, c.no AS no, c.name AS cd, c.party as p, e.vote/(
                    select sum(vote) from local se
                    where se.vid=v.vid and se.no<>-1 and se.election='${election}'
                ) AS r 
                FROM local e 
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
                WHERE e.election='${election}' AND (v.did div 100)=c.cid/100 
                    AND (${candSt})
                ORDER BY v.did, v.village, c.no`
        }

        else if (area.v % 100 == 0) { // 6

            let cid = area.v;
            sql = collect == 'ticket' ? `

                SELECT v.did as d, v.village as v, c.no AS no, c.name AS cd, c.party as p, e.vote AS t 
                FROM local e 
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
                WHERE e.election='${election}' AND (v.did between ${cid + 1} and ${cid + 99}) AND c.cid=${cid} 
                    AND (${candSt})
                ORDER BY v.did, v.village, c.no`

                : `
                SELECT v.did as d, v.village as v, c.no AS no, c.name AS cd, c.party as p, e.vote/(
                    select sum(vote) from local se
                    inner join village sv on se.election=sv.election and se.vid=sv.vid
                    where se.election='${election}' and sv.vid=v.vid
                ) AS r
                FROM local e 
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
                WHERE e.election='${election}' AND (v.did between ${cid + 1} and ${cid + 99}) AND c.cid=${cid}
                    AND (${candSt})
                ORDER BY v.did, v.village, c.no`
        }

        else { // 7
            sql = collect == 'ticket' ? `

                SELECT v.did as d, v.village as v, c.no AS no, c.name AS cd, c.party as p, e.vote AS t 
                FROM local e 
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
                WHERE e.election='${election}' AND (v.did div 100)=c.cid/100 AND v.did=${area.v}
                    AND (${candSt})
                ORDER BY v.did, v.village, c.no`
                : `            
                
                SELECT v.did as d, v.village as v, c.no AS no, c.name AS cd, c.party as p, e.vote/(
                    select sum(vote) from local se
                    inner join village sv on se.election=sv.election and se.vid=sv.vid
                    where se.election='${election}' and sv.vid=v.vid and no<>-1
                ) AS r 
                FROM local e 
                INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
                INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
                WHERE e.election='${election}' AND (v.did div 100)=c.cid/100 AND v.did=${area.v}
                    AND (${candSt})
                ORDER BY v.did, v.village, c.no`
        }
    }

    q(sql, cb);
}

function q(sql, cb) {
    console.log(sql);
    let conn = mysql.createConnection(secret.dbInfo());
    conn.connect(err => {
        if (err) throw err;
        conn.query(sql, (err, res) => {
            cb(err, res);
            conn.end();
        })
    })
}