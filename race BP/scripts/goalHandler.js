import { system, world } from "@minecraft/server";
import { removeKiller } from "./raceFinishHandler";

export function goalHandle(player) {
    removeKiller(player);
    player.runCommand("gamemode spectator @s");
    player.runCommand("tag @s add goal");
    return;
}