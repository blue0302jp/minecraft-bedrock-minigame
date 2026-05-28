import { system, world } from "@minecraft/server";

const spiny_shellMap = new Map();
const spiny_shellSystemMap = new Map();
const spiny_shell_time = 20;

const thunderMap = new Map();
const thunder_systemMap = new Map();
const thunder_time = 30;

export function initializeItemCooldownMap(mapNum) {
    spiny_shellMap.delete(mapNum);
    spiny_shellSystemMap.delete(mapNum);
    thunderMap.delete(mapNum);
    thunder_systemMap.delete(mapNum);
}

export function setSpiny_shellMap(mapNum) {
    if (spiny_shellMap.get(mapNum) === undefined) {
        spiny_shellMap.set(mapNum, false);
    } else if (spiny_shellSystemMap.has(mapNum)) {
        const timerId = spiny_shellSystemMap.get(mapNum);
        if (typeof timerId === "number") {
            system.clearRun(timerId);
        }
    }

    const waitTimer = system.runTimeout(() => {
        spiny_shellMap.set(mapNum, true);
        spiny_shellSystemMap.delete(mapNum);
    }, 20 * spiny_shell_time);
    
    spiny_shellSystemMap.set(mapNum, waitTimer);
}

export function canGetSpiny_shell(mapNum) {
    if (spiny_shellMap.get(mapNum) == undefined) {
        spiny_shellMap.set(mapNum, true);
        return true;
    }
    return spiny_shellMap.get(mapNum);
}

export function setThunderMap(mapNum) {
    if (thunderMap.get(mapNum) === undefined) {
        thunderMap.set(mapNum, false);
    } else if (thunder_systemMap.has(mapNum)) {  // 追加
        const timerId = thunder_systemMap.get(mapNum);
        if (typeof timerId === "number") {  // タイマーIDが正しいか確認
            system.clearRun(timerId);
        }
    }

    thunderMap.set(mapNum, false);
    const waitTimer = system.runTimeout(() => {
        thunderMap.set(mapNum, true);
        thunder_systemMap.delete(mapNum);
    }, 20 * thunder_time);
    thunder_systemMap.set(mapNum, waitTimer);
}

export function canGetThunder(mapNum) {
    if (thunderMap.get(mapNum) == undefined) {
        thunderMap.set(mapNum, true);
        return true;
    }
    return thunderMap.get(mapNum);
}


export function setItemCooldownMap(mapNum) {
    setSpiny_shellMap(mapNum);
    setThunderMap(mapNum);
}