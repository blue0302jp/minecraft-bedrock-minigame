import {system, world} from "@minecraft/server";
import { getScore, setScore, addScore} from "./scoreboard";

const TICK = 20;
const MAX_TICK_TIME = 120000;
const RACETIME_SCOREBOARD_NAME ="goalTime";
export function updateRaceTime(racePlayers) {
    for (const player of racePlayers) {
        if (player.hasTag("goal") || !player.hasTag("raceTimer")) continue;
        addScore(player, "goalTime", 1);
    }
    //world.getDimension("overworld").runCommand("scoreboard players add @a[tag=!goal,tag=race,tag=raceTimer] goalTime 1");
}


export function getPlayerTimeStr(player) {
    const time = getScore(player, RACETIME_SCOREBOARD_NAME); // tick（20tick = 1秒）
    if (time == undefined) return `00:00:00`;
    
    const maxTick = 120000; // 99:59:999 に相当するtick

    if (time >= maxTick) {
        return `99:59:99`; // ミリ秒も2桁に合わせる
    }

    const totalMilliseconds = Math.floor((time / 20) * 1000);

    const minutes = Math.floor(totalMilliseconds / 60000);
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
    const milliseconds = Math.floor((totalMilliseconds % 1000) / 10); // 0〜99 にするため10分の1

    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;

    return timeStr;
}