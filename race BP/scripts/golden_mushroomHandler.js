import { system, world } from "@minecraft/server";
import { setAllHotbarItem } from "./itemboxHandler";
import { items } from "./mineraceIds";

export const golden_mushroom_handleMap = new Map();

export function goldenMushroomUsedHandle(player, itemStack) {
    const durabilityComponent = itemStack.getComponent("minecraft:durability");
    const golden_mushroom_reducingDurability = system.runInterval(() => {
        durabilityComponent.damage += 1;
        updateDurability(player, itemStack);
        if (durabilityComponent.damage == durabilityComponent.maxDurability) {
            setAllHotbarItem(player, itemStack.typeId, 0);//ホットバーのアイテムを消す
            system.clearRun(golden_mushroom_handleMap.get(player));
            golden_mushroom_handleMap.delete(player);
        }
    }, 1)
    golden_mushroom_handleMap.set(player, golden_mushroom_reducingDurability);
}

function updateDurability(player, itemStack) {
    setAllHotbarItem(player, itemStack.typeId, 1, itemStack.getComponent("minecraft:durability").damage);
}

export function clearGoldenMushroomHandle(player) {
    const goldenMushroomHandle = golden_mushroom_handleMap.get(player);
    if (goldenMushroomHandle == undefined) return;
    system.clearRun(goldenMushroomHandle);
    golden_mushroom_handleMap.delete(player);
}