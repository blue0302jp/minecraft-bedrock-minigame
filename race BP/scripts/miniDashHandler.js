import { system, world } from "@minecraft/server";
import {playerDefaultSpeed} from "./playerHandler";

export const miniDashSpeedModifier = 1.23;
const miniDashDuration = 1.4 //sec
const playerminiDashTimers = new Map(); // プレイヤーごとのダッシュ時間管理

// プレイヤーダッシュ処理
export function handlePlayerMiniDash(player) {
    const movementBasicComponent = player.getComponent("minecraft:movement");

    if (playerminiDashTimers.has(player)) {
        system.clearRun(playerminiDashTimers.get(player)); // 以前のタイマーを解除
    } else {
        player.addTag("miniDash");
    }

    const timer = system.runTimeout(() => {
        player.removeTag("miniDash");
        playerminiDashTimers.delete(player);
    }, 20 * miniDashDuration); // 2秒後（20 ticks * 2）

    playerminiDashTimers.set(player, timer);
}


