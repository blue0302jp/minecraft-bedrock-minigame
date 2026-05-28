import {world, system} from "@minecraft/server";
import {getJoinPlayers, startCountdown, showGameStartForm, startGameQueue} from "../gameStartHandler";
import { playerSpeedEffectAmplifier } from "../playerHandler";
import { animalsList } from "./animalList";
import { changeAnimal, changeSeeker } from "./changeAnimalHandler";
import { animalHandle, setAnimalTypeMap } from "./animalHandler";
import { animalhuntHandle, animalhuntLoadStageArea } from "./animalhuntHandler";

export const maxAnimalhuntPlayers = 16; //人

export const seekerWaitTime = 30; //sec
const animalhuntGameName = "動物ハント";

export const animalhuntStartPosition = {x : -1213.50, y : 4.00, z : -1605.50};

export function showPrepareAnimalhunt(player) {
    showGameStartForm(
        player,
        animalhuntGameName,
        maxAnimalhuntPlayers,
        () => {
            startGameQueue("animalhunt", animalhuntStart);
        }
    );
}


function animalhuntStart() {
    world.sendMessage(`start() `);
    animalhuntLoadStageArea();
    //処理を遅らす　tickingareaで読み込むため
    system.runTimeout(() => {
        const participatingPlayers = getJoinPlayers();

        const {seekers, animals} = dividePlayers(participatingPlayers);
        
        //動物処理
        animals.forEach(animalPlayer => {
            animalPlayer.runCommand("clear @s");
            animalPlayer.teleport(animalhuntStartPosition);
            animalPlayer.addTag("animal");
            animalPlayer.addTag("animalhunt");
            animalPlayer.runCommand("effect @s regeneration 0 0 true");
            const selectAnimal = Math.floor(Math.random() * animalsList.length);
            setAnimalTypeMap(animalPlayer, animalsList[selectAnimal]);
            changeAnimal(animalPlayer, animalsList[selectAnimal]);
            animalPlayer.runCommand("title @s title 隠れろ！");
        });
        
        seekers.forEach(seekerPlayer => {
            seekerPlayer.runCommand("clear @s");
            seekerPlayer.addTag("animalhunt");
            seekerPlayer.teleport({x : -1154.0, y : 4.00, z : -1606.0});
            changeSeeker(seekerPlayer);
        });
        animalHandle(participatingPlayers);
        const waitingCountdown = system.runTimeout(() => {
            startCountdown(participatingPlayers, animalhuntStartAction, seekers, participatingPlayers);
            system.clearRun(waitingCountdown);
        }, 20 * 27)
    }, 20 * 1);

}

function dividePlayers(participatingPlayers) {
    const players = [...participatingPlayers];
    const seekerNum = Math.floor(players.length / 8 + 1);
    world.sendMessage(`seekerNum : ${seekerNum}`);
    const seekers = [];
    for (let i = 0; i < seekerNum; i ++) {
        const randomIndex = Math.floor(Math.random() * players.length);
        seekers.push(players[randomIndex]);
        players.splice(randomIndex, 1);
    }

    const animals = players;
    world.sendMessage(`動物 : ${players.length}`);
    world.sendMessage(`seeker : ${seekers.length}`);
    return {
        seekers,
        animals
    };
}

function animalhuntStartAction(seekers, participatingPlayers) {
    seekers.forEach(seekerPlayer => {
        seekerPlayer.teleport(animalhuntStartPosition);
    })
    world.sendMessage("ハンター放出");
    world.sendMessage(`人の数 : ${seekers.length}`);
    world.sendMessage(`参加者数 : ${participatingPlayers.length}`);
    animalhuntHandle(participatingPlayers);
}