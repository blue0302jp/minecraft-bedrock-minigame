import { maxCoinSpeedAmplifier, playerDefaultSpeed, playerSpeedEffectAmplifier } from "./playerHandler";
import { getScore } from "./scoreboard";
const slowSpeedModifier = 0.45;

// プレイヤーダッシュ処理
export function slowHandle(player) {
    const movementBasicComponent = player.getComponent("minecraft:movement");
    //const currentSpeed = movementBasicComponent.currentValue; //現在の速度を取得
    //movementBasicComponent.setCurrentValue(playerDefaultSpeed * slowSpeedModifier);
    player.runCommand("effect @s slowness infinite 3 true");
    player.addTag("slow");
    player.runCommand("inputpermission set @s jump disabled");
    player.runCommand("effect @s speed 0 0 true");
}

export function resetSpeed(player) {
    const movementBasicComponent = player.getComponent("minecraft:movement");
    //const currentSpeed = movementBasicComponent.currentValue; //現在の速度を取得
    //movementBasicComponent.setCurrentValue(playerDefaultSpeed);
    player.runCommand("effect @s slowness 0 4 true");
    player.removeTag("slow");
    if (!player.hasTag("thunder")) player.runCommand("inputpermission set @s jump enabled");
    player.runCommand(`effect @s speed infinite ${playerSpeedEffectAmplifier} true`);
}   