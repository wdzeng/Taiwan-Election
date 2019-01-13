let mysql = require('mysql');
let secret = require('./secret.js');
const MAX_DID = 2204;

let example = {
    no: 9,
    queried: 'vote' | 'ratio' | 'sratio',
    granule: 'c' | 'd' | 'v',
    area: 0 | 100 | 101,
    get: 'for' | 'against' | 'elect' | 'lead'
}

function vidNamer(object) {
    switch (object.granule) {
        case 'v': return 'vote.vid AS id, v.village as vname';
        case 'd':
        case 'c': return 'vote.vid AS id';
        default: throw "Invalid granule: " + object.granule;
    }
}

exports.search = function (object, cb) {

    let sql = ` SELECT ${vidNamer(object)}, ${queried(object)}
                FROM referendum vote
                    ${ object.queried == 'sratio' ? `INNER JOIN referendum_voter voter
                        ON vote.vid = voter.vid` : ``}
                    ${ object.granule == 'v' ? `LEFT JOIN village v
                        ON vote.vid = v.vid
                           AND v.election = '2018地方' ` : ``}
                WHERE (${areaFilter(object)})
                    AND (vote.no = ${object.no})
                ORDER BY id
                    `
    q(sql, cb);
}

function areaFilter(obj) {
    obj.area = Number(obj.area);
    if (obj.area == 0) {
        switch (obj.granule) {
            case 'c': return `vote.vid <= ${MAX_DID} AND vote.vid % 100 = 0`
            case 'd': return `vote.vid <= ${MAX_DID}`
            case 'v': return '1';
            default: throw "Invalid granule: " + obj.granule;
        }
    }
    if (obj.area % 100 == 0) {
        switch (obj.granule) {
            case 'c': return `vote.vid = ${obj.area}`
            case 'd': return `vote.vid BETWEEN ${obj.area} AND ${obj.area + 99}`
            case 'v': return `(vote.vid BETWEEN ${obj.area} AND ${obj.area + 99})
                                OR (vote.vid BETWEEN ${obj.area * 1000} AND ${obj.area * 1000 + 99999})`;
            default: throw "Invalid granule: " + obj.granule;
        }
    }
    switch (obj.granule) {
        case 'd': return `vote.vid = ${obj.area}`
        case 'v': return `vote.vid BETWEEN ${obj.area * 1000} AND ${obj.area * 1000 + 999}`;
        default: throw "Invalid granule: " + obj.granule;
    }
}

function queried(obj) {
    let up, down, t, it;
    switch (obj.queried) {
        case 'vote': down = 1; t = 't'; break;
        case 'ratio': down = `(vote.agree + vote.against)`; t = 'ratio'; break;
        case 'sratio': down = `(voter.voter)`; t = 'sratio'; break;
        default: throw "Invalid quried: " + obj.queried;
    }
    switch (obj.get) {
        case 'lead':
            up = 'GREATEST(vote.agree, vote.against)';
            it = `  (CASE
                        WHEN vote.agree > vote.against THEN 'o'
                        ELSE 'x'
                     END)`;

            break;
        case 'elect':
            up = `vote.${elect(obj.no) ? 'agree' : 'against'}`;
            it = up === 'agree' ? `'o'` : `'x'`;
            break;
        case 'for':
            up = `vote.agree`;
            it = `'o'`;
            break;
        case 'against':
            it = `'x'`;
            up = `vote.against`;
            break;
        default:
            throw "Invalid queried: " + obj.get;
    }

    if (down == 1) return `${up} AS ${t}, ${it} AS it`;
    else return `ROUND(${up}/${down}, 4) AS ${t}, ${it} AS it`;
}

function q(sql, cb) {

    let conn = mysql.createConnection(secret.dbInfo());
    console.log(sql.replace(/[\r\n|\r|\n]/g, "").replace(/\s+/g, ' ').trim());
    conn.connect(err => {
        if (err) { cb(err); return; }
        conn.query(sql, (err, res) => {
            conn.end();
            cb(err, res);
        })
    })
}

function elect(no) {
    switch (Number(no)) {
        case 7: return true;
        case 8: return true;
        case 9: return true;
        case 10: return true;
        case 11: return true;
        case 12: return true;
        case 13: return false;
        case 14: return false;
        case 15: return false;
        case 16: return true;
    }
    throw "Invalid no: " + no;
}