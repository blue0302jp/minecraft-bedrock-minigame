import { system, world } from "@minecraft/server";
import { overworld } from "./main";
import { getPlayerRank } from "./rankHandler";

export const MARIOKART_SCOREBOARD_NAME = "mariokart";

export function setScoreboardPlayerRank(player, rank) {
    player.runCommand(`scoreboard players set @s ${MARIOKART_SCOREBOARD_NAME} ${rank}`);
}


export function updateScoreboardPlayersRank(racePlayers) {
    for (const player of racePlayers) {
        if (player.hasTag("goal")) continue;
        const rank = getPlayerRank(player);
        setScoreboardPlayerRank(player, rank);
    }
}

export function initializeMariokartScoreboard() {
    overworld.runCommand("scoreboard objectives remove mariokart");
    overworld.runCommand("scoreboard objectives add mariokart dummy §4§lMario§fKart");
}