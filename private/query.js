let mysql = require('mysql');
let secret = require('./secret.js');
let async = require('async');
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
                        c.name as candidate, 
                        SUM(vote) AS votes 
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
                        SUM(vote) AS votes 
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
                    let sql = `SELECT vid, SUM(vote) AS votes, no FROM ${tname}
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
            let sql = `SELECT vid, SUM(vote) AS votes, no FROM ${tname}
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
                    let sql = `SELECT vid, SUM(vote) AS votes, no FROM ${tname}
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

    let sql = `SELECT vid, SUM(vote) AS votes, no FROM ${tname}
               WHERE election='${areaSelector}'`;
    switch (info.election) {
        case 'president':
        case 'local':
        case 'legislator':
        case 'party_listed_legislator':
    }
}

function queryLocal(area = { c: 0 }, no = 0, count = true, cb) {
    
    let sql = null;
    let election = null;
    let csct = null;
    if (no == 0) csct = "1";
    else {
        if (typeof (no) == 'array') {
            csct = no.map(n => ` no=${n} `).join('OR');
        }
        else {
            csct = `no=${no}`;
        }
    }

    // 1 全台各縣市長票總和            
    // 2 全台某縣市長得票總和          
    // 3 全台各縣市長各區得票總和       
    // 4 全台某縣市長各區得票總和       
    // 5 全台各縣市長各村得票
    // 6 全台某縣市長各村得票
    // 7 全台某縣市長某區各村得票

    if ('c' in area) {

        if (area.c == 0) { // 1
            sql = `SELECT c.cid AS county, c.no AS no, c.name AS candidate, SUM(vote) AS votes
            FROM local e
            INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no
            INNER JOIN village v ON e.election=v.election AND e.vid=v.vid
            WHERE e.election='${election}' AND (v.did div 100)=c.cid/100
                AND (${csct})
            GROUP BY c.cid, c.no
            ORDER BY c.cid, c.no`;
        }

        else { // 2
            sql = `SELECT c.cid AS county, c.no AS no, c.name AS candidate, SUM(vote) AS votes
            FROM local e
            INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no
            INNER JOIN village v ON e.election=v.election AND e.vid=v.vid
            WHERE e.election='${election}' AND c.cid=${area.c} AND ${area.c / 100}=(v.did div 100)
                AND (${csct})
            GROUP BY c.cid, c.no
            ORDER BY c.cid, c.no`;
        }
    }

    else if ('d' in area) {

        if (area.d == 0) { // 3
            sql = `SELECT v.did as district, c.no AS no, c.name AS candidate, SUM(vote) AS votes 
            FROM local e 
            INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
            INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
            WHERE e.election='${election}' AND (v.did div 100)=c.cid/100
                AND (${csct})
            GROUP BY v.did, c.no
            ORDER BY v.did, c.no`;
        }

        else { // 4
            let cid = area.d;
            sql = `SELECT v.did as district, c.no AS no, c.name AS candidate, SUM(vote) AS votes 
            FROM local e 
            INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
            INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
            WHERE e.election='${election}' AND (v.did div 100)=${cid / 100} and c.cid=${cid}
                AND (${csct})
            GROUP BY v.did, c.no
            ORDER BY v.did, c.no`;
        }

    }

    else {

        if (area.v == 0) { // 5
            sql = `SELECT v.did as district, v.village as village, c.no AS no, c.name AS candidate, e.vote AS votes 
            FROM local e 
            INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
            INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
            WHERE e.election='${election}' AND (v.did div 100)=c.cid/100 
                AND (${csct})
            ORDER BY v.did, v.village, c.no`;
        }

        else if (area.v % 100 == 0) { // 6
            sql = `SELECT v.did as district, v.village as village, c.no AS no, c.name AS candidate, e.vote AS votes 
            FROM local e 
            INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
            INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
            WHERE e.election='${election}' AND (v.did div 100)=c.cid/100 AND c.cid=${area.v} 
                AND (${csct})
            ORDER BY v.did, v.village, c.no`;
        }

        else { // 7
            sql = `SELECT v.did as district, v.village as village, c.no AS no, c.name AS candidate, e.vote AS votes 
            FROM local e 
            INNER JOIN local_candidate c ON e.election=c.election AND e.no=c.no 
            INNER JOIN village v ON e.election=v.election AND e.vid=v.vid 
            WHERE e.election='${election}' AND (v.did div 100)=c.cid/100 AND v.did=${area.v}
                AND (${csct})
            ORDER BY v.did, v.village, c.no`;
        }

    }

    q(sql, cb);
}

function q(sql, cb) {
    let conn = mysql.createConnection(secret.dbInfo);
    conn.connect(err => {
        if (err) throw err;
        conn.query(sql, (err, res) => {
            cb(err, res);
            conn.end();
        })
    })
}