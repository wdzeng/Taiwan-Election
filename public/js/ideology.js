// Green
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

// Blue
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

// Red
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

// Yellow
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

// Pink
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

// Grey
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

// Orange
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

export function colorize(party) {
    if (party === null) return GREY;
    switch (party) {
        case '中國國民黨': return BLUE;
        case '民主進步黨': case '綠黨': case '綠黨社會民主黨聯盟': return GREEN;
        case '時代力量': case '民國黨': case '新黨': return YELLOW;
        case '親民黨': case '台灣團結聯盟': case '臺灣團結聯盟': return ORANGE;
        case '中華統一促進黨': case '社會民主黨': case '無黨團結聯盟': return RED;
        case '信心希望聯盟': return PEACH;
    }
    return GREY;
}