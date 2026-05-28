import { world, system} from "@minecraft/server";
import { getPlayerCheckpoint } from "./checkpointHandler";
import { getCheckpointPositions, getMap } from "./mapFunctions";
import { checkpointPositions } from "./mapData";
import { getPlayerLap } from "./playerLapHandler";
const playerRank = [];

/**
 * プレイヤーの順位をソートし、playerRank に保存する
 * @param {Array} checkPointPositions - マップごとのチェックポイント座標リスト
 */
export function sortPlayerRank(racePlayers) {
    if (!racePlayers || typeof racePlayers[Symbol.iterator] !== "function") {
        return;
    }
    const checkPointPositions = getCheckpointPositions();
    const players = Array.from(racePlayers);
    if (!Array.isArray(players) || players.length === 0) {
        world.sendMessage("レース参加者がいません！");
        return;
    }

    let maxCheckpoints = checkPointPositions.length;

    // **playerRank のリセット**
    playerRank.length = 0;

    // **ゴールしたプレイヤーを先に取得し、ゴールした時間でソート**
    let finishedPlayers = players
        .filter(player => player.hasTag("goal"))
        .map(player => {
            const goalTime = getScore(player, "goalTime"); // ゴール時のtickを取得
            return { player, goalTime };
        })
        .sort((a, b) => a.goalTime - b.goalTime) // ゴールが早い順に並べる
        .map(entry => entry.player);

    // **ゴールしていないプレイヤーを取得**
    let activePlayers = players.filter(player => !player.hasTag("goal"));

    let playerData = activePlayers.map(player => {
        const raceLap = getPlayerLap(player);
        const currentCheckpoint = getPlayerCheckpoint(player);
        const nextCheckpoint = currentCheckpoint >= maxCheckpoints ? 1 : currentCheckpoint + 1;
        const position = player.location;
        const nextCheckpointPosition = checkPointPositions[nextCheckpoint - 1] || { x: 0, y: 0, z: 0 };
        const distance = getDistanceSquared(position, nextCheckpointPosition);

        // **順位計算のための基準**
        const checkpointProgress = (raceLap - 1) * maxCheckpoints + currentCheckpoint;

        return { player, raceLap, checkpointProgress, distance };
    });

    // **ゴールしたプレイヤーを先頭にし、ゴールしていないプレイヤーを順位順に並べる**
    playerData.sort((a, b) => {
        if (b.raceLap !== a.raceLap) return b.raceLap - a.raceLap;
        if (b.checkpointProgress !== a.checkpointProgress) return b.checkpointProgress - a.checkpointProgress;
        return a.distance - b.distance;
    });

    // **最終的に playerRank を更新**
    playerRank.push(...finishedPlayers, ...playerData.map(data => data.player));
}

/**
 * 指定したプレイヤーの順位を取得する
 * @param {Player} targetPlayer - 順位を取得したいプレイヤー
 * @returns {number | null} 順位 (1位からスタート) / 存在しない場合は null
 */
export function getPlayerRank(targetPlayer) {
    if (!targetPlayer) return null;

    // `playerRank` のデバッグ
    //world.sendMessage("🔍 playerRank デバッグ: " + playerRank.map(p => p?.name ?? "undefined").join(", "));

    // `id` を使って検索
    const index = playerRank.findIndex(p => p?.id === targetPlayer.id);

    if (index === -1) {
        //world.sendMessage(`⚠ ${targetPlayer.name} は playerRank に存在しません！`);
    } else {
        //world.sendMessage(`✅ ${targetPlayer.name} の順位: ${index + 1}`);
    }

    return index !== -1 ? index + 1 : null;
}

/**
 * スコアボードのスコア取得
 * @param {Player} player
 * @param {string} objective
 * @returns {number}
 */
function getScore(player, objective) {
    try {
        return world.scoreboard.getObjective(objective).getScore(player) || 0;
    } catch {
        return 0;
    }
}
/**
 * 2点間の距離を計算
 * @param {Object} pos1 {x, y, z}
 * @param {Object} pos2 {x, y, z}
 * @returns {number} ユークリッド距離
 */
function getDistanceSquared(pos1, pos2) {
    return (pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2 + (pos1.z - pos2.z) ** 2;
}
/**
 * 現在のプレイヤー順位を取得
 * @returns {Array} playerRank（順位順）
 */
export function getPlayersRank() {
    if (!Array.isArray(playerRank) || playerRank.length === 0) {
        world.sendMessage("⚠ getPlayerRank(): 順位データが存在しません！");
        return [];
    }
    return playerRank;
}

export function getRankColor(rank) {
    var color = "";
    if (rank == 1) {
        color += "§g"
    } else if (rank == 2) {
        color += "§i";
    } else if (rank == 3) {
        color += "§n"
    }
    return color;
}

export function getPlayerCheckpointPosition(player) {
    const raceCheckPointPositions = getCheckpointPositions();
    const raceMap = world.scoreboard.getObjective("raceManager").getScore("mapSelector");
    const checkpoint = getPlayerCheckpoint(player);
    if (checkpoint == 0) {
        //無理やりチェックポイント1に
        return checkpointPositions[raceMap][0]
    } else {
        return checkpointPositions[raceMap][checkpoint - 1];
    }
}

