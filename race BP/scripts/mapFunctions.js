import { getScore } from "./scoreboard";
import { startPositions, observePositions, entityPositions, checkpointBoxPositions, checkpointboxBackPositions, checkpointPositions, coinPositions, itemboxPositions, maxCheckpoints}  from "./mapData";
export function getMap() {
    return getScore("mapSelector", "raceManager");
}

export function getEntityPositions() {
    return entityPositions[getMap()];
}

export function getStartPositions() {
    return startPositions[getMap()];
}
export function getObservePositions() {
    return observePositions[getMap()];
}
export function getCheckpointBoxPositions() {
    return checkpointBoxPositions[getMap()];
}
export function getCheckpointBoxBackPositions() {
    return checkpointboxBackPositions[getMap()];
}
export function getCheckpointPositions() {
    return checkpointPositions[getMap()];
}
export function getCoinPositions() {
    return coinPositions[getMap()];
}
export function getItemboxPositions() {
    return itemboxPositions[getMap()];
}
export function getMaxCheckpoints() {
    return maxCheckpoints[getMap()];
}