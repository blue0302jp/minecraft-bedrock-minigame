import { world, system} from "@minecraft/server";
import { overworld } from "./main";
const numberOfVelocityDigits = 4;


export function getPlayerVelocityLength(player) {
    const velocity = player.getVelocity();

    // XZ平面の速度を計算
    let velocityLength = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);

    // しきい値以下なら0にする
    const threshold = 0.05;
    if (velocityLength < threshold) velocityLength = 0;

    // 100倍して整数+小数2桁に丸め
    velocityLength = Math.round(velocityLength * 10000) / 100;

    // 整数部と小数部に分けてパディング
    const [intPart, fracPart] = velocityLength.toFixed(2).split('.');
    const paddedInt = intPart.padStart(2, '0'); // 整数部2桁以上に0パディング
    const velocityStr = `${paddedInt}.${fracPart}`;

    return velocityStr;
}

export function getAllRacingPlayers() {
    return world.getDimension("overworld").getPlayers({tags : ["race"]});
}