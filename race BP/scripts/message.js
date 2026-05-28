export function sendMessage(players, text) {
    for (let i = 0; i < players.length; i ++) {
        players[i].sendMessage(`${text}`);
    }
}

export function showTitle(players, text) {
    for (let i = 0; i < players.length; i ++) {
        players[i].runCommand(`title @s title ${text}`);
    }
}

export function showSubtitle(players, text) {
    for (let i = 0; i < players.length; i ++) {
        players[i].runCommand(`title @s subtitle ${text}`);
    }
}