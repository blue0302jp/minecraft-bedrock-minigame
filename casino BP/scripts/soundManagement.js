import { world } from "@minecraft/server";
import { system } from "@minecraft/server";

export function slotSpinSound(player, slot) {
    player.playSound("slot_spinning", {location : slot.location});
    system.runTimeout(()=> {
        player.playSound("slot_stop",  {location : slot.location});
    }, 30);
    system.runTimeout(()=> {
        player.playSound("slot_stop",  {location : slot.location});
    }, 60);
    system.runTimeout(()=> {
        player.playSound("slot_stop",  {location : slot.location});
    }, 90);
}

export function slotPayoutSound(player) {
    player.playSound("slot_win")
}

export function payoutSound(player) {
    player.playSound("tip_payout", {location : player.location});
}
export function dailyBonusSound(player) {
    player.playSound("daily_bonus");
}
export function cardFlipSound(player) {
    player.playSound("card_flip", { volume: 2.0 });
}