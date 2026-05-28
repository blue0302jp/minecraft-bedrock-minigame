import { system, world } from "@minecraft/server";
import { ARROW_ID, BANANA_ID, KILLER_ID, RED_SHELL_ID, SPINY_SHELL_ID, TNT_ID, GREEN_SHELL_ID } from "./mineraceIds";

export const bananaMap = new Map();
export const arrowMap = new Map();
export const red_shellMap = new Map();
export const tntMap = new Map();
export const killerMap = new Map();
export const spiny_shellMap = new Map();
export const green_shellMap = new Map(); 

//エンティティの所有者を設定
export function setMap(player, entity) {
    switch(entity.typeId) {
        case BANANA_ID:
            bananaMap.set(entity.id, player);
            return;
        case ARROW_ID:
            arrowMap.set(entity.id, player);
            return;
        case RED_SHELL_ID:
            red_shellMap.set(entity.id, player);
            return;
        case GREEN_SHELL_ID:
            green_shellMap.set(entity.id, player);
            return;
        case TNT_ID:
            tntMap.set(entity.id, player);
            return;
        case KILLER_ID:
            killerMap.set(entity.id, player);
            return;
        case SPINY_SHELL_ID:
            spiny_shellMap.set(entity.id, player);
            return;
        default:
            return;
    }
}

export function deleteEntityOwner(entity) {
    switch(entity.typeId) {
        case BANANA_ID:
            bananaMap.delete(entity.id);
            return;
        case ARROW_ID:
            arrowMap.delete(entity.id);
            return;
        case red_shellMap:
            red_shellMap.delete(entity.id);
            return;
        case green_shellMap:
            green_shellMap.delete(entity.id);
            return;
        case TNT_ID:
            tntMap.delete(entity.id);
            return;
        case KILLER_ID:
            killerMap.delete(entity.id);
            return;
        case SPINY_SHELL_ID:
            spiny_shellMap.delete(entity.id);
            return;
        default:
            return;
    }
}


//エンティティの所有者を取得
export function getOwnerEntity(entity) {
    switch(entity.typeId) {
        case BANANA_ID:
            return bananaMap.get(entity.id);
        case ARROW_ID:
            return arrowMap.get(entity.id);
        case RED_SHELL_ID:
            return red_shellMap.get(entity.id);
        case GREEN_SHELL_ID:
            return green_shellMap.get(entity.id);
        case TNT_ID:
            return tntMap.get(entity.id);
        case KILLER_ID:
            return killerMap.get(entity.id);
        case SPINY_SHELL_ID:
            return spiny_shellMap.get(entity.id);
        default:
            return undefined;
    }
}

export function resetAllRaceEntityMap() {
    bananaMap.clear();
    arrowMap.clear();
    red_shellMap.clear();
    green_shellMap.clear();
    tntMap.clear();
    killerMap.clear();
    spiny_shellMap.clear();
}