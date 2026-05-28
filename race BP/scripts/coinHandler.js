import { system, world } from "@minecraft/server";
import { getPlayerRank } from "./rankHandler";
import { getScore, setScore } from "./scoreboard";
import { spreadCoins } from "./spreadCoin";
const coinInterval = 6.0//sec
const maxCoinAmount = 10;
const speedUpPerCoin = 0.005 //(1%)
const baseSpeed = 1;
const coinTimerMap = new Map();


export function getCoin(player, coin) {
    const coinLocation = coin.location;
    //コイン処理
    addCoin(player, 1);
    if (coin.hasTag("spread")) {
        coin.remove();
        return;
    }
    const timer = system.runTimeout(() => {
        if (world.getDimension("overworld").getPlayers({tags : ["race"]}).length == 0) return;
        world.getDimension("overworld").spawnEntity("minerace:coin", coinLocation);
    }, 20 * coinInterval);
    coin.remove();
}

export function addCoin(player, coinAmount) {
    const currentCoinAmount = getScore(player, "coin");
    if (currentCoinAmount + coinAmount > maxCoinAmount) {
        setScore(player, "coin", maxCoinAmount);
    } else {
        setScore(player, "coin", currentCoinAmount + coinAmount);
    } 
}

export function subtractCoin(player, coinAmount) {
    const currentCoinAmount = getScore(player, "coin");
    if (currentCoinAmount >= coinAmount) {
        setScore(player, "coin", currentCoinAmount - coinAmount);
        spreadCoins(player, coinAmount);
    }
    else {
        setScore(player, "coin", 0);
        spreadCoins(player, currentCoinAmount);
    }
}

export function getCoinSpeed(player) {
    const coinAmount = getScore(player, "coin");
    return baseSpeed + (speedUpPerCoin * coinAmount);
}