let ectrs = [101, 102, 103, 104, 105, 106, 107, 108, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 301, 302, 303, 304, 305, 306, 401, 402, 403, 404, 405, 406, 407, 408, 501, 502, 503, 504, 505, 601, 602, 603, 604, 605, 606, 607, 608, 609, 701, 801, 901, 1001, 1101, 1102, 1201, 1202, 1203, 1204, 1301, 1302, 1401, 1402, 1501, 1502, 1601, 1602, 1603, 1701, 1801, 1901, 2001];

let goodEctrs = [106, 104, 201, 210, 211, 212, 302, 305, 401, 403, 405, 406, 408, 501, 502, 503, 504, 505, 601, 602, 603, 604, 608];

function getAllElectorals() {
    return ectrs;
}

function isGoodElecotral(checked) {
    return checked >= 700 || goodEctrs.includes(Number(checked));
}

function getElectoral(did, vname) {

    let cid = did - did % 100;

    switch (cid) {

        case 700:  // 基隆
        case 800:  // 竹市
        case 900:  // 嘉市
        case 1000: // 竹縣
        case 1700: // 宜蘭
        case 1800: // 花蓮
        case 1900: // 臺東
        case 2000: // 澎湖
            return cid + 1;

        case 1100: switch (did) {
            case 1103: case 1104: case 1105: case 1106: case 1108: case 1109: case 1112: case 1113: return 1101;
            default: return 1102;
        }
        case 1200: switch (did) {
            case 1203: case 1204: case 1213: case 1214: case 1215: case 1216: return 1201;
            case 1201: case 1209: case 1210: return 1202;
            case 1202: case 1207: case 1211: case 1212: case 1222: case 1223: case 1224: return 1204;
            default: return 1203;
        }
        case 1300: switch (did) {
            case 1302: case 1303: case 1308: case 1309: case 1310: case 1313: return 1301;
            default: return 1302;
        }
        case 1400: switch (did) {
            case 1403: case 1405: case 1406: case 1411: case 1414: case 1415: case 1416: case 1417: case 1418: case 1419: case 1420: return 1401;
            default: return 1402;
        }
        case 1500: switch (did) {
            case 1501: case 1502: case 1503: case 1508: case 1509: case 1510: case 1511: case 1512: return 1501;
            default: return 1502;
        }
        case 1600: switch (did) {
            case 1602: case 1606: case 1607: case 1608: case 1609: case 1610: case 1611: case 1612: case 1613: case 1614: case 1626: case 1627: case 1628: case 1633: return 1601;
            case 1601: case 1605: case 1607: return 1602;
            default: return 1603;
        }

        default:
            let farray = electorals[cid.toString()];
            let len = farray.length;
            for (let i = 0; i < len; i++) {
                if (farray[i](did, vname)) return cid + i + 1;
            }
    }
}

const electorals = {

    100: [ectr101, ectr102, ectr103, ectr104, ectr105, ectr106, ectr107, ectr108],
    200: [ectr201, ectr202, ectr203, ectr204, ectr205, ectr206, ectr207, ectr208, ectr209, ectr210, ectr211, ectr212],
    300: [ectr301, ectr302, ectr303, ectr304, ectr305, ectr306],
    400: [ectr401, ectr402, ectr403, ectr404, ectr405, ectr406, ectr407, ectr408],
    500: [ectr501, ectr502, ectr503, ectr504, ectr505],
    600: [ectr601, ectr602, ectr603, ectr604, ectr605, ectr606, ectr607, ectr608, ectr609],
}

function ectr101(did, vname) {
    if (did == 109) return true;
    if (did == 108) {
        switch (vname) {
            case '德行里': case '德華里': case '忠誠里': case '蘭雅里': case '蘭興里': case '三玉里': case '天母里': case '天福里':
            case '天祿里': case '天壽里': case '天和里': case '天山里': case '天玉里': return true;
        }
    }
    return false;
}
function ectr102(did, vname) {
    if (did == 102) return true;
    if (did == 108) return !ectr101(did, vname);
    return false;
}
function ectr103(did, vname) {
    if (did == 103) return true;
    if (did == 104) {
        switch (vname) {
            case '精忠里': case '東光里': case '龍田里': case '東昌里': case '東勢里': case '中華里': case '民有里': case '民福里': case '松基里': case '莊敬里': case '東榮里': case '新益里': case '新東里': case '介壽里': case '三民里': case '富錦里': case '富泰里': case '自強里': case '鵬程里': case '安平里': return true;
        }
    }
    return false;
}
function ectr104(did) {
    return did == 110 || did == 111;
}
function ectr105(did, vname) {
    if (did == 106) return true;
    if (did == 101) {
        switch (vname) {
            case "南門里": case "新營里": case "龍福里": case "南福里": case "愛國里": case "廈安里": case "忠勤里": case "永功里": case "永昌里": case "龍興里": case "龍光里": case "黎明里": case "光復里": case "建國里": case "東門里": case "幸福里": case "梅花里": case "幸市里": case "文北里": case "文祥里": case "三愛里": return true;
        }
    }
    return false;
}
function ectr106(did) {
    return did == 105;
}
function ectr107(did, vname) {
    return did == 107 || did == 104 && !ectr103(104, vname);
}
function ectr108(did, vname) {
    return did == 112 || did == 101 && !ectr105(101, vname);
}

function ectr201(did) {
    return 212 <= did && did <= 217;
}
function ectr202(did, vname) {
    if (did == 210 || did == 211) return true;
    if (did == 209) {
        switch (vname) {
            case "富貴里": case "碧華里": case "仁華里": case "永清里": case "永順里": case "富福里": case "慈化里": case "慈惠里": case "慈愛里": case "永福里": case "慈生里": case "慈福里": case "慈祐里": case "富華里": case "五華里": case "五福里": return true;
        }
    }
    return false;
}
function ectr203(did, vname) {
    return did == 209 && !ectr202(209, vname);
}
function ectr204(did, vname) {
    return did == 202 && !ectr205(202, vname);
}
function ectr205(did, vname) {
    if (did == 206 || did == 208) return true;
    if (did == 202) {
        switch (vname) {
            case "民安里": case "民有里": case "民本里": case "光明里": case "光正里": case "光榮里": case "光和里": case "光華里": case "西盛里": return true;
        }
    }
    return false;
}
function ectr206(did, vname) {
    if (did == 201) {
        switch (vname) {
            case "九如里": case "大安里": case "大豐里": case "大觀里": case "中山里": case "五權里": case "仁愛里": case "正泰里": case "民生里": case "民族里": case "玉光里": case "光仁里": case "光復里": case "成和里": case "西安里": case "和平里": case "居仁里": case "東丘里": case "東安里": case "長安里": case "長壽里": case "信義里": case "後埔里": case "重慶里": case "香丘里": case "埔墘里": case "振興里": case "振義里": case "海山里": case "浮洲里": case "國泰里": case "堂春里": case "崑崙里": case "深丘里": case "富貴里": case "復興里": case "景星里": case "華中里": case "華東里": case "華貴里": case "華福里": case "華德里": case "華興里": case "鄉雲里": case "溪北里": case "溪洲里": case "溪福里": case "僑中里": case "福丘里": case "福安里": case "福星里": case "福祿里": case "福壽里": case "福德里": case "聚安里": case "廣新里": case "廣福里": case "廣德里": case "龍安里": case "雙玉里": case "歡園里": return true;
        }
    }
    return false;
}
function ectr207(did, vname) {
    return did == 201 && !ectr206(201, vname);
}
function ectr208(did, vname) {
    return did == 203 && !ectr209(203, vname);
}
function ectr209(did, vname) {
    if (did == 203) {
        switch (vname) {
            case "泰安里": case "安平里": case "中安里": case "安樂里": case "宜安里": case "安順里": case "安和里": case "秀明里": case "秀仁里": case "秀山里": case "秀福里": case "秀義里": case "秀景里": case "秀水里": case "秀士里": case "秀成里": case "秀峰里": return true;
        }
    }
    return did == 204;
}
function ectr210(did) {
    return did == 205 || did == 207;
}
function ectr211(did) {
    return 225 <= did && did <= 229;
}
function ectr212(did) {
    return 218 <= did && did <= 224;
}

function ectr301(did, vname) {
    if (did == 301) {
        switch (vname) {
            case "汴洲里": case "春日里": case "會稽里": case "大有里": case "寶山里": case "大興里": case "忠義里": case "三元里": case "青溪里": case "三民里": case "萬壽里": return true;
        }
        return false;
    }
    return did == 306 || did == 309;
}
function ectr302(did) {
    return did == 305 || did == 310 || did == 311 || did == 312 || did == 315;
}
function ectr304(did, vname) {
    return did == 301 && !ectr301(301, vname);
}
function ectr303(did, vname) {
    return did == 302 && !ectr306(302, vname);
}
function ectr305(did) {
    return did == 303 || did == 308;
}
function ectr306(did, vname) {
    if (did == 302) {
        switch (vname) {
            case "興仁里": case "自強里": case "中正里": case "中山里": case "篤行里": case "仁愛里": case "仁和里": case "仁祥里": case "華勛里": case "仁德里": case "中堅里": case "龍安里": return true;
        }
    }
    return did == 304 || did == 307 || did == 313;
}

function ectr401(did) {
    return 424 <= did && did <= 428;
}
function ectr402(did, vname) {
    switch (did) {
        case 421: case 422: case 412: case 411: case 423: return true;
        case 410: return vname == '東湖里' || vname == '西湖里';
    }
    return false;
}
function ectr403(did) {
    return did == 414 || did == 418 || did == 419 || did == 420;
}
function ectr404(did) {
    return did == 407 || did == 408;
}
function ectr405(did) {
    return did == 405 || did == 406;
}
function ectr406(did) {
    return 401 <= did && did <= 404;
}
function ectr407(did, vname) {
    return did == 409 || did == 410 && !ectr402(410, vname);
}
function ectr408(did) {
    switch (did) {
        case 413: case 415: case 416: case 417: case 429: return true;
    }
    return false;
}

function ectr501(did) {
    return did == 517 || 522 <= did && did <= 532;
}
function ectr502(did) {
    return 509 <= did && did <= 513 || 518 <= did && did <= 521 || 533 <= did && did <= 537;
}
function ectr503(did) {
    return did == 501 || did == 504 || did == 506;
}
function ectr504(did) {
    return did == 502 || did == 503 || did == 505;
}
function ectr505(did) {
    switch (did) {
        case 507: case 508: case 514: case 515: case 516: return true;
    }
    return false;
}

function ectr601(did) {
    return did == 617 || did == 618 || did == 625 || did == 626 || did == 627 || 630 <= did && did <= 638;
}
function ectr602(did) {
    return 619 <= did && did <= 624 || did == 628 || did == 629;
}
function ectr603(did) {
    return did == 601 || did == 602;
}
function ectr604(did) {
    return 613 <= did && did <= 616;
}
function ectr605(did, vname) {
    if (did == 610 || did == 605 || did == 603) return true;
    if (did == 604) {
        switch (vname) {
            case "川東里": case "德西里": case "裕民里": case "力行里": case "豐裕里": case "千秋里": case "千北里": case "立德里": case "千歲里": case "鳳南里": case "興德里": case "鳳北里": case "德北里": case "十全里": case "十美里": case "安邦里": case "安宜里": case "安泰里": case "民享里": case "精華里": case "德行里": case "德東里": case "立誠里": case "立業里": case "安生里": case "安和里": case "安東里": case "達明里": case "達德里": case "達仁里": case "達勇里": case "德智里": case "德仁里": case "同德里": case "建東里": case "港西里": case "長明里": case "港東里": case "港新里": case "博愛里": case "博惠里": return true;
        }
    }
    return false;
}
function ectr606(did, vname) {
    return did == 604 && !ectr605(604, vname);
}
function ectr607(did, vname) {
    if (did == 606 || did == 607 || did == 608) return true;
    if (did == 609) {
        switch (vname) {
            case "復國里": case "竹中里": case "竹北里": case "興東里": case "竹西里": case "竹東里": case "竹內里": case "竹南里": return true;
        }
    }
    return false;
}
function ectr608(did) {
    return did == 612;
}
function ectr609(did, vname) {
    return did == 611 || did == 609 && !ectr607(609, vname);
}