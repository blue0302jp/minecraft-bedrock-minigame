const playerLatestBetAmountListMap = new Map();

export function getPlayerLatestBetAmount(player, gameType) {
    if (playerLatestBetAmountListMap.get(player.id) == undefined) {
        initializePlayerLatestBetAmountListMap(player);
    }
    switch(gameType) {
        case "blackJack":
            return playerLatestBetAmountListMap.get(player.id).blackJack;
        case "roulette":
            return playerLatestBetAmountListMap.get(player.id).roulette;
        case "videoPoker":
            return playerLatestBetAmountListMap.get(player.id).videoPoker;
    }
}

function initializePlayerLatestBetAmountListMap(player) {
    playerLatestBetAmountListMap.set(player.id, {
        blackJack : 20,
        roulette : 10,
        videoPoker : 10
    })
}



export function setPlayerLatestBetAmount(player, gameType, betAmount) {
    switch(gameType) {
        case "blackJack":
            var playerLatestBetAmountList = playerLatestBetAmountListMap.get(player.id);
            playerLatestBetAmountList.blackJack = betAmount;
            playerLatestBetAmountListMap.set(player.id, playerLatestBetAmountList);
            break;
        case "roulette":
            var playerLatestBetAmountList = playerLatestBetAmountListMap.get(player.id);
            playerLatestBetAmountList.roulette = betAmount;
            playerLatestBetAmountListMap.set(player.id, playerLatestBetAmountList);
            return;
        case "videoPoker":
            var playerLatestBetAmountList = playerLatestBetAmountListMap.get(player.id);
            playerLatestBetAmountList.videoPoker = betAmount;
            playerLatestBetAmountListMap.set(player.id, playerLatestBetAmountList);
            return;

    }
}