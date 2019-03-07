const QUARTER_PI = Math.PI / 4;
const DEG_RAD_RATIO = Math.PI / 180;

/**
 * Converts degree to radios.
 */
export function degToRad(angle) {
    return angle * DEG_RAD_RATIO;
}

/**
 * Convert longtitude and latitude to coordinate system.
 * @param point The point [longitude,latitude]. The longtitude and latitude is in degree.
 * @returns coordinate [x,y] in radius. x from -PI to PI; y from -PI/2 to PI/2
 */
export function mercator(point) {
    let x = degToRad(point[0]),
        y = degToRad(point[1]);
    y = Math.log(Math.tan(QUARTER_PI + y / 2));
    return [x, y];
}