let mysql = require('mysql');
let async = require('async');
let secret = require('./secret.js');
let idmng = require('./district-id.js');

const TK = 'vote', RT = 'ratio', ST = 'sratio';
const PR = 'president', LC = 'local', LG = 'legislator', LS = 'party_listed_legislator';
const MAX_DID = 2204;

exports.search = function (data, cb) {

    /*
        example1 = {
            granule: 'c',
            area: 0,
            no: 'all',
            data: 'vote',
            e: 'local',
            year: 2018
        }
        
        SELECT e.vid AS vid, e.no as no, c.name AS candidate, c.party as party, e.vote as vote
        FROM local e
        INNER JOIN local_candidate c 
            ON  e.no = c.no 
            AND e.election = c.election
    :::     AND e.vid = c.cid AND 
        WHERE e.election = '2018地方'
    :::     AND e.vid % 100 = 0 
        ORDER BY e.vid, c.no

        exmaple2 = {
            granule: 'd',
            area: 0,
            no: 'elect',
            data: 'ratio',
            e: 'president',
            year: 2016
        }

    ::: SELECT e.vid AS vid, e.no as no, c.president AS candidate, c.party as party, ROUND(e.ratio, 4) as ratio
        FROM president e
        INNER JOIN president_candidate c 
            ON  e.no = c.no 
            AND e.election = c.election
        WHERE e.election = '2016全國'
    :::     AND e.vid <= 9999 
        ORDER BY e.vid, c.no

        example3 = {
            granule: 'v',
            area: 501,
            no: 'lead',
            data: 'sratio',
            e: 'party_listed_legislator'
            year: 2016
        }

    ::: SELECT e.vid AS vid, e.no as no, c.party as party, ROUND(e.sratio, 4) as sratio
        FROM party_listed_legislator e
        INNER JOIN party_listed_legislator_candidate c 
            ON  e.no = c.no 
            AND e.election = c.election
        WHERE e.election = '2016全國'
    :::  	AND (e.vid BETWEEN 501001 AND 501999)
        ORDER BY e.vid, c.no

        exmaple4 = {
            granule: 'e',
            area: 501,                   
            no: 3,                       
            data: ['ticket', 'ratio'],   
            e: 'legislator'              
            year: 2016
        }

    ::: SELECT e.vid AS vid, e.no as no, c.party as party, e.vote as vote, ROUND(e.sratio, 4) as sratio
        FROM legislator e
        INNER JOIN legislator c 
            ON  e.no = c.no 
            AND e.election = c.election
        WHERE e.election = '2016全國'
          	AND (e.vid BETWEEN 501001 AND 501999)
        ORDER BY e.vid, c.no
    */

    checkYaerAndTableName(data.tbName, data.year);

    let sql = ` 
    SELECT  ${filtIdField(data.tbName, data.granule)}   AS vid, 
            e.no    AS no, 
            ${filtCandidateField(data.tbName)}, 
            ${filtQueried(data.queried)}
    FROM    ${data.tbName} e
            INNER JOIN ${data.tbName}_candidate c
                ON  e.no = c.no
                    AND e.election  = c.election
                    AND (${ectrJoin(data.tbName)})
    WHERE   e.election = '${event(data)}'
            AND (${filtArea(data.area, data.granule)})
            AND (${filtCand(data.no, data.tbName)})
    ORDER   BY  ${filtIdField(data.tbName, data.granule)},
                c.no
    `;

    q(sql, cb);
}

function filtIdField(tableName, granule) {
    switch (tableName) {
        case LC:
        case PR:
        case LS:
            return 'e.vid';
        case LG:
            switch (granule) {
                case 'd': // NOT GOOD
                case 'v':
                    return 'e.vid';
                case 'c':
                case 'e':
                    return 'e.electoral';
                default: throw "Invalid granule: " + granule;
            }
        default: throw "Invalid table name: " + tableName;
    }
}

function filtCandidateField(tableName) {
    switch (tableName) {
        case LC: return 'c.name AS candidate, c.party as party'
        case LG: return 'c.name AS candidate, c.party as party ';
        case PR: return 'c.president AS candidate, c.party as party';
        case LS: return 'c.party as party';
        default: throw "Invalid table name: " + tableName;
    }
}

function ectrJoin(tbName) {
    return tbName == LC || tbName == LG ? "e.electoral = c.electoral" : "1";
}

function event(data) {

    switch (data.year) {
        case 2008:
            switch (data.tbName) {
                case PR: return '2008總統';
                case LG:
                case LS: return '2008立委';
            }
        case 2009:
        case 2010:
        case 2014:
        case 2018:
            if (data.tbName == LC) return data.year + '地方';
        case 2012:
        case 2016:
            switch (data.tbName) {
                case PR:
                case LG:
                case LS:
                    return data.year + '全國';
            }
    }

    throw "Invalid: " + data;
}

function checkYaerAndTableName(tbName, year) {

    switch (year) {
        case 2008:
        case 2009:
            if (tbName != PR && tbName != LG) throw "Invalid data: " + year + ", " + tbName;
            break;
        case 2010:
        case 2014:
        case 2018:
            if (tbName != LC) throw "Invalid data: " + year + ", " + tbName;
            break;
        case 2012:
        case 2016:
            if (tbName != PR && tbName != LG && tbName != LS) throw "Invalid data: " + year + ", " + tbName;
            break;
        default:
            throw "Invalid data: " + year + ", " + tbName;
    }
}

function filtQueried(queried) {

    // Check array
    if (Array.isArray(queried)) {

        // Check size
        if (queried.length == 0) throw 'Query: nothing';
        if (queried.length > 3) throw `Query: ${queried} `;
        // Check valid fields
        if (queried.some(e => e !== TK && e !== RT && e !== ST)) throw `Query: ${queried} `;

        // Generate sql
        let fname = []
        queried.forEach(q => {
            switch (q) {
                case TK: fname.push('e.vote AS vote'); break;
                case RT: fname.push('ROUND(e.ratio,4) AS ratio'); break;
                case ST: fname.push('ROUND(e.sratio,4) AS sratio'); break;
                default: throw `Invalid field: ${q} `;
            }
        })
        return fname.join(',');
    }

    // Check string
    switch (queried) {
        case TK: return 'c.party AS party, e.vote AS vote';
        case RT: return 'c.party AS party, ROUND(e.ratio,4) AS ratio';
        case ST: return 'c.party AS party, ROUND(e.sratio,4) AS sratio';
        case LS: return 'c.party AS party';
        default: throw `Invalid field: ${q} `;
    }
}

function filtArea(area, granule) {

    if (Array.isArray(area)) return area.map(a => "(" + filtArea(a, granule) + ")").join(" OR ");
    if (!Number.isInteger(area) || area < 0) throw "Invalid area: " + JSON.stringify(area);

    switch (granule) {

        case 'c':
            if (area % 100 != 0) throw "Invalid data: " + data;
            return area ? `e.vid = ${area}` : `e.vid <= ${MAX_DID} AND e.vid % 100 = 0`;

        case 'd':
            if (area == 0) return `e.vid <= ${MAX_DID} AND e.vid % 100 != 0`;
            if (area % 100 == 0) return `e.vid BETWEEN ${area + 1} AND ${area + 99}`;
            return `e.vid = ${area}`;

        case 'v':
            if (area == 0) return `e.vid >= 100000`;
            if (area <= MAX_DID) return `(e.vid BETWEEN ${area * 1000 + 1} AND ${area * 1000 + 999})`;
            return `e.vid = ${area}`;

        case 'e':
            if (area == 0) return `e.vid % 100 = 0`;
            if (area % 100 == 0) return `e.vid = ${area} AND (e.electoral BETWEEN ${area + 1} AND ${area + 99})`;
            return `e.vid = ${area}`;

        default:
            throw "Invalid data: " + data;
    }
}

function nennia(array) {

    if (!Array.isArray(array)) throw "Not array.";
    if (array.length == 0) throw "Empty.";
    if (array.some(e => !Number.isInteger(e) || e < 0)) throw "Invalid: " + array;
}

function filtCand(cand, tableName) {

    if (Array.isArray(cand)) {
        nennia(cand);
        return cand.map(c => "(" + filtCand(c) + ")").join(" OR ");
    }

    if (Number.isInteger(cand)) {
        if (cand <= 0) throw "Illegal no: " + cand;
        return "c.no = " + cand;
    }

    switch (cand) {
        case 'all':
            return "1";
        case 'elect':
            return "c.result='elect'";
        case 'lead':
            return `e.no = (   
                    SELECT no FROM ${tableName}
                    WHERE vid = e.vid AND election = e.election
                    ORDER BY vote DESC
                    LIMIT 1  )`;
        default: throw "Invalid: " + cand;
    }
}

function requireNonNegativeNumberOrArray(identifier, fieldName, checked) {

    // Check array
    if (Array.isArray(checked)) {

        // Check non-empty
        if (checked.length == 0) throw `Empty ${fieldName} `;
        // Check integers
        if (checked.some(a => !Number.isInteger(a) || a < 0)) throw `Invalid ${fieldName}: ${checked} `;

        // Generate sql
        if (checked.length == 1) return `${identifier}=${checked[0]} `;
        return `${identifier} IN(${checked.join(',')})`;
    }

    // Check integer
    if (Number.isInteger(checked) && checked >= 0) return `${idIdentifier}=${area} `

    throw `Invalid ${fieldName}: ${checked} `;
}

function groupOrder(data) {

}

function normal(data) {
}

function multiArea(data) {

}

function multiCandidate(data) {

}

function q(sql, cb) {

    console.log(sql);
    return;

    let conn = mysql.createConnection(secret.dbInfo);
    conn.connect(err => {
        if (err) throw err;
        conn.query(sql, (err, res) => {
            cb(err, res);
            conn.end();
        })
    })
}