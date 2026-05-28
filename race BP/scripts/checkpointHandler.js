import { system, world } from "@minecraft/server";
import { getScore, setScore } from "./scoreboard";
import { goalHandle } from "./goalHandler";
import { getCheckpointBoxBackPositions, getCheckpointBoxPositions, getMap, getMaxCheckpoints } from "./mapFunctions";
import {  checkpointPositions} from "./mapData";
import {addPlayerLap, getPlayerLap, getPlayerMaxLaps} from "./playerLapHandler";

export function playerCheckpointHandle(players) {

    const checkpointBoxPositions = getCheckpointBoxPositions();
    const checkpointBoxBackPositions = getCheckpointBoxBackPositions();
    const maxCheckpoint = getMaxCheckpoints();

    players.filter(p => !p.hasTag("goal")).forEach( player => {
        const currentCheckpoint = getPlayerCheckpoint(player);
        const lap = getPlayerLap(player);
        const maxLaps = getPlayerMaxLaps(player);
        const playerPos = player.location;

        if (checkPlayerInNextCheckpointBox(playerPos, currentCheckpoint, checkpointBoxPositions)) {
            //world.sendMessage(`${getPlayerCheckpoint(player)}, ${getScore(player, "raceRapManager")}`)
            if (currentCheckpoint >= maxCheckpoint) {
                if (lap >= maxLaps) {
                    //world.sendMessage(`${lap} goal`)
                    goalHandle(player);
                    return;
                }
                setPlayerCheckpoint(player, 1);
                addPlayerLap(player);
            } else {
                setPlayerCheckpoint(player, currentCheckpoint + 1);
                //world.sendMessage(`${getPlayerCheckpoint(player)}`);
            }
            return;
        }

        if (checkPlayerInPreviousCheckpointBox(playerPos, currentCheckpoint, checkpointBoxBackPositions)) {
            setPlayerCheckpoint(player, currentCheckpoint - 1);
            //world.sendMessage(`${getPlayerCheckpoint(player)}`);
        }
    });   
}


export function setPlayerCheckpoint(player, checkpoint) {
    player.setDynamicProperty("checkpoint", checkpoint);
}
export function getPlayerCheckpoint(player) {
    return player.getDynamicProperty("checkpoint");
}
function checkPlayerInNextCheckpointBox(playerPos, currentCheckpoint, checkpointBoxPositions) {
    if (checkpointBoxPositions[currentCheckpoint] === undefined) {
        var checkpointPosition1 = checkpointBoxPositions[0][0];
        var checkpointPosition2 = checkpointBoxPositions[0][1];
    } else {
        var checkpointPosition1 = checkpointBoxPositions[currentCheckpoint][0];
        var checkpointPosition2 = checkpointBoxPositions[currentCheckpoint][1];
    }

    return checkPlayerInBox(playerPos, checkpointPosition1, checkpointPosition2);

}

function checkPlayerInPreviousCheckpointBox(playerPos, currentCheckpoint, checkpointBoxPositions) {
    if (currentCheckpoint == 1 || currentCheckpoint == 0) return false;
    var checkpointPosition1 = checkpointBoxPositions[currentCheckpoint - 2][0];
    var checkpointPosition2 = checkpointBoxPositions[currentCheckpoint - 2][1];
    return checkPlayerInBox(playerPos, checkpointPosition1, checkpointPosition2);
}

function checkPlayerInBox(playerPos, pos1, pos2) {
    const xMin = Math.min(pos1.x, pos2.x);
    const xMax = Math.max(pos1.x, pos2.x);
    const yMin = Math.min(pos1.y, pos2.y);
    const yMax = Math.max(pos1.y, pos2.y);
    const zMin = Math.min(pos1.z, pos2.z);
    const zMax = Math.max(pos1.z, pos2.z);

     // 点 (px, py, pz) が範囲内にあるかチェック
    return playerPos.x >= xMin && playerPos.x <= xMax &&
        playerPos.y >= yMin && playerPos.y <= yMax &&
        playerPos.z >= zMin && playerPos.z <= zMax;
}

//player1 : 1位のプレイヤー　player2 : その他のプレイヤー
export function getDiffCheckpoint(player1, player2, mapNum) {
    const checkpointLength = checkpointPositions[mapNum].length;
    if (getPlayerLap(player1) == getPlayerLap(player2)) {
        const checkpoint1 = getPlayerCheckpoint(player1);
        const checkpoint2 = getPlayerCheckpoint(player2);
        return checkpoint1 - checkpoint2;
    }
    if (getPlayerLap(player1) > getPlayerLap(player2)) {
        const checkpoint1 = getPlayerCheckpoint(player1) + checkpointLength;
        const checkpoint2 = getPlayerCheckpoint(player2);
        return checkpoint1 - checkpoint2;
    }
    if (getPlayerLap(player1) < getPlayerLap(player2)) {
        const checkpoint1 = getPlayerCheckpoint(player1);
        const checkpoint2 = getPlayerCheckpoint(player2) + checkpointLength;
        return checkpoint1 - checkpoint2;
    }
}





