import { world, system} from "@minecraft/server";
import { setMap } from "./raceEntityMap";


// 矢を発射する関数
export function shootArrow(player) {
    const DISTANCE = 1.5;
    const direction = player.getViewDirection(); // 視線の向きを取得
    const rotation = player.getRotation(); // プレイヤーの回転（向き）
    // 矢のスポーン位置（目線の少し前）
    const spawnLocation = {
        x: player.location.x + direction.x * DISTANCE, // 1.2ブロック前にずらす
        y: player.location.y + direction.y * DISTANCE + 1.62, // 目線の高さ
        z: player.location.z + direction.z * DISTANCE
    };

    // 矢をスポーン
    const arrow = world.getDimension("overworld").spawnEntity("minecraft:arrow", spawnLocation);
    setMap(player, arrow);
    // 矢の回転をプレイヤーと同じに設定
    arrow.setRotation({x : -rotation.x, y : -rotation.y});

    // 矢の速度（弓に近い速度を再現）
    const power = 2.9; // 弓のフルチャージに近い速度
    arrow.applyImpulse({
        x: direction.x * power,
        y: direction.y * power,
        z: direction.z * power
    });

    // 矢の寿命を設定（デフォルトより少し長め）
    arrow.lifetimeTicks = 600; // 60秒 (20 ticks * 60)
}
