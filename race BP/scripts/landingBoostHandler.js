import { system, world } from "@minecraft/server";
import {playerDefaultSpeed} from "./playerHandler";

export const landingBoostSpeedModifier = 1.1;
const landingBoostDuration = 0.6 //sec
const playerlandingBoostTimers = new Map(); // プレイヤーごとのダッシュ時間管理

// プレイヤーダッシュ処理
export function handlePlayerLandingBoost(player) {
    const movementBasicComponent = player.getComponent("minecraft:movement");

    if (playerlandingBoostTimers.has(player)) {
        system.clearRun(playerlandingBoostTimers.get(player)); // 以前のタイマーを解除
    } else {
        player.addTag("landingBoost");
    }

    const timer = system.runTimeout(() => {
        player.removeTag("landingBoost");
        playerlandingBoostTimers.delete(player);
    }, 20 * landingBoostDuration);

    playerlandingBoostTimers.set(player, timer);
}
