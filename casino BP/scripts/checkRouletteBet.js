export function checkBet(player, betAmount, maxBet, currentBetAmount) {
    var canBet = 0;
    if (currentBetAmount >= maxBet) {
        player.sendMessage(`§4最大掛け金に達しています！！`);
    } else if (currentBetAmount + betAmount > maxBet) {
        player.sendMessage(`§4最大掛け金に達しました！！`);
        canBet = maxBet - currentBetAmount;
    } else {
        canBet = betAmount;
    }
    return canBet;
}