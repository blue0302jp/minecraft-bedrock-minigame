const opList = ["blue0302", "manabima555", "Blue0302sub", "BLUE0302subb"];

export function checkOP(player) {
    for (let i = 0; i < opList.length; i ++) {
        if (player.name == opList[i]) return true;
    }
    return false;
}

export function addOPTag(player) {
    player.addTag("op");
}