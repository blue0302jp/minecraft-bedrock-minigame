import { world, system} from "@minecraft/server";
import { ActionFormData, ModalFormData} from "@minecraft/server-ui";
import {showRaceManager} from "./raceStartHandler";
import {showPrepareBomberman} from "./bomberman/bombermanStartHandler";
import { showPrepareAnimalhunt } from "./animalhunt/animalhuntStartHandler";
import { showPrepareSoccer } from "./soccer/soccerStartHandler";

export function showGameSelectManager(player) {
    const form = new ActionFormData();
    form.title("§q§lselectGame");
    form.body(`§b遊ぶゲームを選択`);
    form.button("マリオカート");
    form.button("ボンバーマン");
    form.button("動物ハント");
    form.button("サッカー");
    form.show(player).then(response => {
        if (response.selection == undefined) return;
        switch(response.selection) {
            case 0:
                showRaceManager(player);
                break;
            case 1:
                showPrepareBomberman(player);
                break;
            case 2:
                showPrepareAnimalhunt(player);
                break;
            case 3:
                showPrepareSoccer(player);
                break;
        }
    }).catch(error => {
        console.error("Error showing form:", error);
    });
}