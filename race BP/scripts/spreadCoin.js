import { system, world } from "@minecraft/server";
import { getScore } from "./scoreboard";

const COIN_DISSAPEAR_TIME = 10 //sec
export function spreadCoins(player, spreadCoinNum) {
    const origin = player.location;

    for (let i = 0; i < spreadCoinNum; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 3 + 2; // 半径0.5〜2.5m以内にばらまく
        const heightOffset = Math.random() * 0.5 + 0.5; // 少し空中に出現させる
        const dx = Math.cos(angle) * distance;
        const dz = Math.sin(angle) * distance;

        const spawnPos = {
            x: origin.x + dx,
            y: origin.y + heightOffset,
            z: origin.z + dz
        };

        const coinEntity = world.getDimension("overworld").spawnEntity("minerace:coin", spawnPos);
        coinEntity.addTag("spread");
        // ランダムな初速で飛ばす（物理ありの場合）
        const velocity = {
            x: (Math.random() - 0.5) * 0.4,
            y: 0.2 + Math.random() * 0.3,
            z: (Math.random() - 0.5) * 0.4
        };

        try {
            coinEntity.applyImpulse(velocity);
        } catch (e) {
            // applyImpulse がないエンティティタイプなら無視
        }

        system.runTimeout(() => {
            if (coinEntity.isValid() == false) return;
            coinEntity.remove();
        }, 20 * COIN_DISSAPEAR_TIME);
    }
}