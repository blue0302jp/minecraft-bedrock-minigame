import { system, world } from "@minecraft/server";
import {clearSystems} from "./clearSystems";

export const dashSpeedModifier = 1.4;
const dashDuration = 2.5 //sec
const playerDashTimers = new Map(); // プレイヤーごとのダッシュ時間管理

// プレイヤーダッシュ処理
export function handlePlayerDash(player) {
    const movementBasicComponent = player.getComponent("minecraft:movement");
    //world.sendMessage(`${movementBasicComponent.currentValue}`)

    if (playerDashTimers.has(player)) {
        system.clearRun(playerDashTimers.get(player)); // 以前のタイマーを解除
    } else {
        player.addTag("dash");
    }

    const timer = system.runTimeout(() => {
        player.removeTag("dash");
        playerDashTimers.delete(player);
    }, 20 * dashDuration); // 2秒後（20 ticks * 2）

    playerDashTimers.set(player, timer);
}

export function removeDashTimer() {
    const timers = [...playerDashTimers.values()];
    clearSystems(timers);
}

