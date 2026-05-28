import { world } from "@minecraft/server";
import { system } from "@minecraft/server";

export function slotSpin(slot) {
    slot.playAnimation(`animation.slot.spin`);

}