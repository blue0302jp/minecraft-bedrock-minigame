import { world, system} from "@minecraft/server";
import { getPlayerRank } from "./rankHandler";
import { overworld } from "./main";
import { sendObstructMessage } from "./raceMessages";
import { raceObstructCauses } from "./raceCauseList";

const baseFlashTime = 4;
const flashTimeMultiple = 0.2;
export function flashHandle(player) {
    const usedPlayerRank = getPlayerRank(player);
    const racePlayers = overworld.getPlayers({tags : ["race"]});
    racePlayers.forEach(racePlayer => {
        if (player == racePlayer) return;
        if (racePlayer.hasTag("star") || racePlayer.hasTag("killer")) return;
        const rank = getPlayerRank(racePlayer);
        if (rank >= usedPlayerRank) return;
        
        const rankDiff = usedPlayerRank - rank;
        const flashTime = (rankDiff - 1) * flashTimeMultiple + baseFlashTime;

        racePlayer.camera.fade({fadeColor : {blue : 1, green : 1, red : 1}, fadeTime : {fadeInTime : 0.5, holdTime : flashTime, fadeOutTime : 0.5}});
        sendObstructMessage(racePlayer, player, raceObstructCauses.flash, "flash");
    });
}