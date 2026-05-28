export function setPlayerMaxLaps(player, maxLaps) {
    player.setDynamicProperty("maxLaps", maxLaps);
}

export function setPlayerLap(player, lap) {
    player.setDynamicProperty("lap", lap);
}

export function getPlayerMaxLaps(player) {
    return player.getDynamicProperty("maxLaps");
}

export function getPlayerLap(player) {
    return player.getDynamicProperty("lap");
}

export function addPlayerLap(player) {
    const currentLap = getPlayerLap(player);
    player.setDynamicProperty("lap", currentLap + 1);
}