export const GREEN = {
    xxl: '#284400',
    xl: '#467500',
    l: '#64a600',
    m: '#82d900',
    s: '#a8ff24',
    xs: '#c2ff68',
    xxs: '#e8ffc4',
    foul: '#f5ffe8',
    r: '#64a600'
};

export const BLUE = {
    xxl: '#000079',
    xl: '#004b97',
    l: '#0066cc',
    m: '#0080ff',
    s: '#46a3ff',
    xs: '#84c1ff',
    xxs: '#c4e1ff',
    foul: '#ecf5ff',
    r: '#2894ff'
};

export const RED = {
    xxl: '#4d0000',
    xl: '#750000',
    l: '#ae0000',
    m: '#ea0000',
    s: '#ff5151',
    xs: '#ff9797',
    xxs: '#ffd2d2',
    foul: '#ffecec',
    r: '#ce0000'
}

export const YELLOW = {
    xxl: '#5b4b00',
    xl: '#977c00',
    l: '#c6a300',
    m: '#eac100',
    s: '#ffdc35',
    xs: '#ffe66f',
    xxs: '#fff0ac',
    foul: '#fffcec',
    r: '#ffd306'
}

export const PEACH = {
    xxl: '#600030',
    xl: '#9f0050',
    l: '#d9006c',
    m: '#ff0080',
    s: '#ff60af',
    xs: '#ff95ca',
    xxs: '#ffd9ec',
    foul: '	#fff7fb',
    r: '#f00080'
}

export const GREY = {
    xxl: '#0e0e0e',
    xl: '#121212',
    l: '#3c3c3c',
    m: '#6c6c6c',
    s: '#9d9d9d',
    xs: '#bebebe',
    xxs: '#f0f0f0',
    foul: '#fcfcfc',
    r: '#000'
}

export const ORANGE = {
    xxl: '#844200',
    xl: '#bb5e00',
    l: '#ea7500',
    m: '#ff9224',
    s: '#ffaf60',
    xs: '#ffc78e',
    xxs: '#ffe4ca',
    foul: '#fffaf4',
    r: '#ea7500'
}

export const PURPLE = {
    xxl: '#28004d',
    xl: '#4b0091',
    l: '#6f00d2',
    m: '#921aff',
    s: '#b15bff',
    xs: '#ca8eff',
    xxs: '#dcb5ff',
    foul: '#f1e1ff',
    r: '#921aff'
}

export const CYAN = {
    xxl: '#003e3e',
    xl: '#007979',
    l: '#00aeae',
    m: '#00e3e3',
    s: '#00ffff',
    xs: '#a6ffff',
    xxs: '#caffff',
    foul: '#ecffff',
    r: '#00e3e3'
}

export const PINK = {
    xxl: '#460046',
    xl: '#750075',
    l: '#ae00ae',
    m: '#e800e8',
    s: '#ff77ff',
    xs: '#ffa6ff',
    xxs: '#ffbfff',
    foul: '#ffe6ff',
    r: '#e800e8'
}

export function colorize(party, grey = true) {
    if (party === null) return (grey && GREY) || RED;
    switch (party) {
        case '中國國民黨': return BLUE;
        case '民主進步黨': case '綠黨': case '綠黨社會民主黨聯盟': return GREEN;
        case '時代力量': case '民國黨': case '新黨': return YELLOW;
        case '親民黨': case '台灣團結聯盟': case '臺灣團結聯盟': return ORANGE;
        case '中華統一促進黨': case '社會民主黨': case '無黨團結聯盟': return RED;
        case '信心希望聯盟': return PEACH;
    }
    return (grey && GREY) || RED;
}

export function scolorize(party, grey = true, index) {
    if (party === null) return [GREY, ORANGE, YELLOW]
    switch (party) {

    }
}

export function partyComparator(a, b) {
    return partyId(a) - partyId(b);
}

function partyId(p) {
    let id = parties.indexOf(p);
    return id == -1 ? 9999 : id;
}

let parties = [
    '中國國民黨', // blue
    '民主進步黨', // green
    '時代力量',   // yellow
    '親民黨',     // orange
    '綠黨社會民主黨聯盟', // peach
    '無黨團結聯盟', // red
    /* ---------------------------------- */
    '社會民主黨', // peach
    '民國黨', // yellow
    '綠黨', // green
    '台灣團結聯盟', // orange
    '新黨' // yellow
];

export class ColorCollector {

    constructor(ps, is) {

        this.parties = ps;
        this.idp = is;
    }

    distribute(grey = true) {
        let colors = [GREEN, BLUE, RED, YELLOW, PURPLE, ORANGE, PINK, PEACH, CYAN],
            list = {};
        if (grey) colors.push(GREY)

        let parray = Array.from(this.parties).sort(partyComparator);
        for (let party of parray) {
            let colorlist = partyToColor[party];
            if (!colorlist) colorlist = colors;
            for (let col of colorlist) {
                let index = colors.indexOf(col);
                if (index != -1) {
                    list[party] = col;
                    if (colors.length > 1)
                        colors.splice(index, 1);
                    break;
                }
            }
            if (!list[party]) {
                list[party] = colors[0];
                if (colors.length > 1) colors.shift();
            }
        }

        if (parray.length + this.idp.length > 10) {
            for (let name of this.idp) {
                list[name] = GREY;
            }
        }
        else {
            for (let name of this.idp) {
                list[name] = colors[0];
                if (colors.length > 1)
                    colors.shift();
            }
        }

        return list;
    }
}

export function referToColor(no, _for) {
    switch (Number(no)) {
        case 7: return _for ? BLUE : YELLOW;
        case 8: return _for ? BLUE : YELLOW;
        case 9: return _for ? BLUE : YELLOW;
        case 10: return _for ? PEACH : YELLOW;
        case 11: return _for ? PEACH : YELLOW;
        case 12: return _for ? PEACH : YELLOW;
        case 13: return _for ? GREEN : RED;
        case 14: return _for ? YELLOW : PEACH;
        case 15: return _for ? YELLOW : PEACH;
        case 16: return _for ? YELLOW : GREEN;
    }
}

const partyToColor = {
    '中國國民黨': [BLUE],
    '民主進步黨': [GREEN],
    '時代力量': [YELLOW],
    '親民黨': [ORANGE],
    '社會民主黨': [RED, PEACH],
    '民國黨': [YELLOW, ORANGE, CYAN],
    '綠黨社會民主黨聯盟': [RED, PEACH, GREEN, CYAN],
    '綠黨': [GREEN, CYAN],
    '新黨': [YELLOW, ORANGE, RED],
    '無黨團結聯盟': [RED, PEACH, PINK, PURPLE],
    '台灣團結聯盟': [ORANGE, YELLOW, GREEN, CYAN],
    '中華統一促進黨': [RED, PURPLE, PINK, PEACH],
    '信心希望聯盟': [CYAN, PEACH, PINK, PURPLE]
}