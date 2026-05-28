import { resetSpeed, slowHandle } from "./playerSlowHandler";
import { getScore } from "./scoreboard";
import { playerSpeedEffectAmplifier, maxCoinSpeedAmplifier } from "./playerHandler";
import { getCoinSpeed } from "./coinHandler";
import { dashSpeedModifier } from "./dashHandler";
import { miniDashSpeedModifier } from "./miniDashHandler";
import { starSpeedModifier } from "./starHandler";
import { thunderSpeedModifier } from "./thunderHandler";
import { landingBoostSpeedModifier } from "./landingBoostHandler";

export const playerDefaultSpeeds = [0.1299999952316284, 0.15600000321865082, 0.18199999630451202, 0.20800000429153442, 0.23399998247623444, 0.25999999046325684]
const playerSpeedModifiers = new Map(); // プレイヤーごとのスピード補正値管理

export function initializePlayerSpeedModifiersMap(player) {
    playerSpeedModifiers.clear();
}

export function updateSpeed(player) {
    const movementComponent = player.getComponent("minecraft:movement");
    if (player.hasTag("slow")) {
        resetSpeed(player);
        movementComponent.setCurrentValue(playerDefaultSpeeds[0]);
        slowHandle(player);
    }
    else {
        var modifier = 1;
        //コインの速度補正
        modifier *= getCoinSpeed(player);

        //ダッシュ速度補正
        if (player.hasTag("dash")) modifier *= dashSpeedModifier;
        else if (player.hasTag("miniDash")) modifier *= miniDashSpeedModifier;
        else if (player.hasTag("landingBoost")) modifier *= landingBoostSpeedModifier;

        //スター速度補正
        if (player.hasTag("star")) modifier *= starSpeedModifier;

        //サンダー速度補正
        if (player.hasTag("thunder")) modifier *= thunderSpeedModifier;

        movementComponent.setCurrentValue(playerDefaultSpeeds[playerSpeedEffectAmplifier + 1] * modifier);
    }

}