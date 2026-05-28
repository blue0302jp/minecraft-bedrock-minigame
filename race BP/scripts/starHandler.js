import { system, world } from "@minecraft/server";
import { resetSpeed } from "./playerSlowHandler";
import { clearSystems } from "./clearSystems";

//変数定義
export const starSpeedModifier = 1.2;
const starDuration = 8; //sec
const playerStarTimers = new Map(); // プレイヤーごとのダッシュ時間管理

//スター処理
export function star(player) {
    const movementBasicComponent = player.getComponent("minecraft:movement");


    if (playerStarTimers.has(player)) {
        system.clearRun(playerStarTimers.get(player)); // 以前のタイマーを解除
    } else {
        if (player.hasTag("slow")) {
            resetSpeed(player);
        }
        player.addTag("star");
    }


    const timer = system.runTimeout(() => {
        player.removeTag("star");
        playerStarTimers.delete(player);
    }, 20 * starDuration);

    playerStarTimers.set(player, timer);
}

export function removeStarTimer() {
    const timers = [...playerStarTimers.values()];
    clearSystems(timers);
}
