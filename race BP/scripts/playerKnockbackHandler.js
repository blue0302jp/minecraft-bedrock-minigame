const horizontalPower = 1.8;
const verticalPower = 0.85;
const miniPowerModifier = 0.75;

const bigKnockbackHorizontalPower = 6;
const bigKnockbackVerticalPower = 0.3;
export function knockbackHandler(player) {
    const direction = player.getViewDirection(); // 視線の向きを取得
    player.applyKnockback(direction.x, direction.z, horizontalPower, verticalPower);
    //player.sendMessage(`${player.name} : knockbackhandler`)
    addLandingBoost(player);
}

export function miniKnockbackHandler(player) {
    const direction = player.getViewDirection(); // 視線の向きを取得
    player.applyKnockback(direction.x, direction.z, horizontalPower * miniPowerModifier, verticalPower * miniPowerModifier);
    //player.sendMessage(`${player.name} : miniknockbackhandler`)
    addLandingBoost(player);
}

export function bigKnockbackHandler(player) {
    const direction = player.getViewDirection(); // 視線の向きを取得
    player.applyKnockback(direction.x, direction.z, bigKnockbackHorizontalPower, bigKnockbackVerticalPower);
    //player.sendMessage(`${player.name} : bigknockbackhandler`)
    addLandingBoost(player);
}

function addLandingBoost(player) {
    player.addTag("prepareLandingBoost")
}