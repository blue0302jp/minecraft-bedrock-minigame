export function capitalizeFirstLetter(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}
export function truncateToThreeDecimalPlaces(value) {
    return Math.floor(value * 1000) / 1000;
}
export function roundToThreeDecimalPlaces(value) {
    return Math.round(value * 1000) / 1000;
}
export function roundVector(vector) {
    const roundedVector = {
        x: roundToThreeDecimalPlaces(vector.x),
        y: roundToThreeDecimalPlaces(vector.y),
        z: roundToThreeDecimalPlaces(vector.z)
    };
    return roundedVector;
}

export function checkEqualTwoLocations(location1, location2) {
    if (location1.x != location2.x) return false;
    else if (location1.y != location2.y) return false;
    else if (location1.z != location2.z) return false;
    return true; 
}
export const stringDoller = `§e§l$§r§f`;
export const stringColon = `§r§f : §r`;