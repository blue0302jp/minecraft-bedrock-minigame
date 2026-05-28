const rouletteConditions = {

}

export function setWaitingBet(rouletteId) {
    rouletteConditions[rouletteId] = "waitingBet";
}

export function setClosedBet(rouletteId) {
    rouletteConditions[rouletteId] = "closedBet"
}