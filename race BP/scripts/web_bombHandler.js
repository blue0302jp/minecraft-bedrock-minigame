import { world, system} from "@minecraft/server";
import { setMap } from "./raceEntityMap";
import { overworld } from "./main";

const webTime = 7 //sec
const webPositions = new Map();
const webTimeoutRunnings = new Map();
// 矢を発射する関数
export function shootWeb(player) {
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
    const web = world.getDimension("overworld").spawnEntity("minerace:web_bomb", spawnLocation);
    webHandle(web);

    // 矢の回転をプレイヤーと同じに設定
    web.setRotation({x : -rotation.x, y : -rotation.y});

    // 矢の速度（弓に近い速度を再現）
    const power = 2.9; // 弓のフルチャージに近い速度
    web.applyImpulse({
        x: direction.x * power,
        y: direction.y * power,
        z: direction.z * power
    });

    // 矢の寿命を設定（デフォルトより少し長め）
    web.lifetimeTicks = 600; // 60秒 (20 ticks * 60)
}

function webHandle(web) {
    const intervalId = system.runInterval(() => {
        if (web.isValid() == true) {
            setWebPosition(web);
        } else {
            const webPos = getWebPosition(web);
            overworld.runCommandAsync(`fill ${webPos.x -2} ${webPos.y -1} ${webPos.z -2} ${webPos.x +2} ${webPos.y +1} ${webPos.z +2} web replace air`);
            system.clearRun(intervalId);
            const webTimeout = system.runTimeout(() => {
                clearWeb(web);
                return;
            }, webTime * 20);
            webTimeoutRunnings.set(web.id, webTimeout);
            return;
        }

    })
}

function setWebPosition(web) {
    webPositions.set(web.id, web.location);
}

function getWebPosition(web) {
    return webPositions.get(web.id);
}

function removeWebPosition(web) {
    webPositions.delete(web.id);
}

function clearWebPositions() {
    webPositions.clear();
}
function clearWebTimeoutRunnnings() {
    webTimeoutRunnings.clear();
}

export function clearAllWeb() {
    for (const [id, pos] of webPositions.entries()) {
        overworld.runCommandAsync(
            `fill ${pos.x - 2} ${pos.y - 1} ${pos.z - 2} ${pos.x + 2} ${pos.y + 1} ${pos.z + 2} air replace web`
        );
    }
    for (const [id, timeoutRunnings] of webTimeoutRunnings.entries()) {
        system.clearRun(timeoutRunnings);
    }
    clearWebPositions(); // マップをクリアして状態をリセット
    clearWebTimeoutRunnnings();
}

function clearWeb(web) {
    const webPos = getWebPosition(web);
    overworld.runCommandAsync(`fill ${webPos.x -2} ${webPos.y -1} ${webPos.z -2} ${webPos.x +2} ${webPos.y +1} ${webPos.z +2} air replace web`);
    removeWebPosition(web);
}