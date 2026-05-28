import { world, system} from "@minecraft/server";
import { killAnimals } from "./animalList";
import { removeAnimalhuntTags } from "../playerHandler";
import { teleportLocations } from "../teleportForm";
import { initializeAllAnimalhuntMaps } from "./animalHandler";
import { playerGameEndHandle } from "../gameEndHandler";


export function animalhuntEndHandle(animalPlayers) {
    world.sendMessage(`生存者 : ${setAnimalPlayersListString(animalPlayers)}`);
    killAnimals();
    initializeAllAnimalhuntMaps();
    const players = world.getDimension("overworld").getPlayers({tags: ["animalhunt"]});
    players.forEach(player => {
        removeAnimalhuntTags(player);
        player.runCommand("event entity @s animalhunt:change_human");
        playerGameEndHandle(player);
    });
}


function setAnimalPlayersListString(animalPlayers) {
    var animalPlayersListString = "";
    for(let i = 0; i < animalPlayers.length; i ++) {
        animalPlayersListString += `${animalPlayers[i].name}\n`;
    }
    if (animalPlayersListString == "") animalPlayersListString = "なし";
    return animalPlayersListString;
}