import { world, system } from "@minecraft/server";

export function clearSystems(runningSystems) {
    if (runningSystems.length == 0) return;
    runningSystems.forEach(runningSystem => {
        system.clearRun(runningSystem);
    });
}