import { world, system} from "@minecraft/server";
export const animalsList = ["minecraft:sheep", "minecraft:cow", "minecraft:pig", "minecraft:chicken", "minecraft:wolf"];

export function convertIdToName(typeId) {
    switch(typeId) {
        case animalsList[0] :
            return "羊";
        case animalsList[1]:
            return "牛";
        case animalsList[2]:
            return "豚";
        case animalsList[3]:
            return "鶏";
        case animalsList[4]:
            return "狼";
    }
}

export function killAnimals() {
    for(let i = 0; i < animalsList.length; i ++) {
        world.getDimension("overworld").runCommand(`kill @e[type=${animalsList[i]}]`);
    }
}