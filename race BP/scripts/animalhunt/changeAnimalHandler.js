import { world, system} from "@minecraft/server";
import { getAnimalMap, getAnimalTypeMap, initializeAnimalMap, setAnimalMap } from "./animalHandler";

export function changeAnimal(player, animalType) {
    const animal = world.getDimension("overworld").spawnEntity(animalType, player.location);
    animal.addTag("animal");
    //Mapに登録
    setAnimalMap(player, animal);
    world.sendMessage(`animaltype : ${getAnimalMap(player).typeId}`);

    player.addTag("invincible");
    player.addTag("animal");
    player.addEffect("invisibility", 20000000, {amplifier : 0, showParticles : false});
    player.triggerEvent("animalhunt:change_animal");
}

export function changeHuman(player) {
    const animal = getAnimalMap(player);
    if (animal.isValid()) {
        animal.remove();
        initializeAnimalMap(player);
    }
    player.runCommand("title @s title 正体がばれた！");
    player.runCommand("effect @s invisibility 0")
    player.removeTag("invincible");
    player.removeEffect("invisibility");
    player.triggerEvent("animalhunt:change_human");
    
    //一定時間後に動物に戻る
    const waitingChangeAnimal = system.runTimeout(() => {
        if (player.hasTag("animal")) {
            changeAnimal(player, getAnimalTypeMap(player));
        }

        system.clearRun(waitingChangeAnimal);
    }, 20 * 15);
}

export function changeSeeker(player) {
    player.removeTag("animal");
    player.removeTag("human");
    player.addTag("seeker");
    player.runCommand("effect @s weakness 0");
    player.runCommand("effect @s regeneration infinite 1 true");
}