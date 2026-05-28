import { world, system} from "@minecraft/server";
import { ActionFormData, ModalFormData} from "@minecraft/server-ui";

export function showGameStartForm(player, gameName, maxPlayers, startCallback) {
    const form = new ActionFormData();
    form.title("§q§lgameStart");
    form.body(`§bGame : ${gameName}  max players num : ${maxPlayers}`);
    form.button("募集開始");
    
    form.show(player).then(response => {
        if (response.selection == 0) {
            startCallback(); // ゲームごとの初期設定を実行
        }
    }).catch(error => {
        console.error("Error showing form:", error);
    });
}

export function startGameQueue(gameType, startFunction) {
    var waitingPlayersTime = 0;
    const waitingPlayers = system.runInterval(() => {
        inviteAllPlayers(gameType);
        const allPlayers = getAllPlayers();
        const joinPlayers = getJoinPlayers();
        showActionbar(allPlayers, joinPlayers.length);
        
        if ((joinPlayers.length == 12 || allPlayers.length == joinPlayers.length) || 
            (time >= waitingPlayersTime && joinPlayers.length > 0)) {
            startFunction();
            overworld.runCommand("clear @a paper");
            system.clearRun(waitingPlayers);
        }
        else if (time >= waitingPlayersTime && joinPlayers.length == 0) {
            clearInvite(allPlayers);
            system.clearRun(waitingPlayers);
        }
        
        waitingPlayersTime++;
    }, 20);
}