import { world, system} from "@minecraft/server";
import { getAnimalMap, getAnimalTypeMap } from "./animalHandler";
import { convertIdToName } from "./animalList";
import { animalhuntEndHandle } from "./animalhuntEndHandler";

const gameTime = 150; //sec

export function animalhuntHandle(players) {
    var time = 0;
    const animalhuntRunInterval = system.runInterval(() => {
        const animalPlayers = getAnimalPlayers();
        const seekerPlayers = getSeekerPlayers();
        if (animalPlayers.length <= 0) {
            animalhuntEndHandle(animalPlayers);
            system.clearRun(animalhuntRunInterval);
        }
        if (gameTime - (Math.floor(time / 20)) <= 0) {
            animalhuntEndHandle(animalPlayers);
            system.clearRun(animalhuntRunInterval);
        }

        for (let i = 0; i < players.length; i ++) {
            if (players[i].hasTag("animal")) {
                players[i].runCommand(`title @s actionbar あなた : ${convertIdToName(getAnimalTypeMap(players[i]))} 残り時間 : ${gameTime - (Math.floor(time / 20))}秒 動物 : ${animalPlayers.length}人 ハンター : ${seekerPlayers.length}人`);
            } else {
                players[i].runCommand(`title @s actionbar 人 残り時間 : ${gameTime - (Math.floor(time / 20))}秒 動物 : ${animalPlayers.length}人 ハンター : ${seekerPlayers.length}人`);
                players[i].runCommand(`replaceitem entity @s slot.hotbar 0 netherite_sword 1 0 {"item_lock":{"mode":"lock_in_slot"}}`);
            }
        }
        time ++;
    })
}

function getAnimalPlayers() {
    return world.getDimension("overworld").getPlayers({tags : ["animal"]});
}
function getSeekerPlayers() {
    return world.getDimension("overworld").getPlayers({tags : ["seeker"]});
}
export function animalhuntLoadStageArea() {
    world.getDimension("overworld").runCommand("/tickingarea add -1161.63 4.00 -1656.38 -1263.48 62.00 -1553.58 animalhuntStage true");
    
}

export function removeAnimalhuntStageArea() {
    world.getDimension("overworld").runCommand("/tickingarea remove animalhuntStage");
}