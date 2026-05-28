import { world, Direction } from "@minecraft/server";
import { GREEN_SHELL_ID, RED_SHELL_ID } from "./mineraceIds";
import { overworld } from "./main";

const PASS_THROUGH_KEYWORDS = [
  // ─ 花／草
  "dandelion", "poppy", "orchid", "allium", "azure_bluet", "tulip",
  "oxeye_daisy", "cornflower", "lily_of_the_valley", "wither_rose",
  "sunflower", "lilac", "rose_bush", "peony",
  "tallgrass", "short_grass",           // 草・シダ
  "large_fern", "seagrass",
  "sign", "banner",
  // ─ ボタン（木製も含む）
  "_button"              // stone_button, oak_button, birch_button …など全部ヒット
];
const STEP_HEIGHT = 0.5;
const HALF_WIDTH = 0.3;
const MAX_DIST = 1.2;
const power = 0.44;
const EPS = 1e-4;                  // 0.0001
const SIDE_OFF        = 0.497;   // ヒットボックス半幅くらい
const SIDE_OFF2        = 0.25;   // ヒットボックス半幅くらい
const NORMAL_RAY_DIST = 1.6;
const SHORT_RAY_DIST  = 1.1;
const MAX_REFLECT_DIST = 0.74; // 反射判定の最大距離（必要に応じ調整）
const SIDE_REFLECT_DIST = 0.52;  // 真横ray用の反射判定距離


export function shellMovementHandle(entity) {
    const dir = entity.getViewDirection();
    if (entity.isFalling) entity.applyImpulse({ x: dir.x * power / 4, y: -0.4, z: dir.z * power / 4 });
    else entity.applyImpulse({ x: dir.x * power, y: -0.2, z: dir.z * power });

}

export function shellReflection(entity) {
    const dim = entity.dimension;
    const loc = entity.location;
    const locUp = {...loc, y : loc.y + 0.5};

    const baseDir = normalize(entity.getViewDirection()); baseDir.y = 0;

    const raySet = [
        { origin: getRayOrigin(loc, baseDir), dir: baseDir, dist: NORMAL_RAY_DIST },
        { origin: lateralOrigin(getRayOrigin(loc, baseDir), baseDir, -SIDE_OFF),  dir: baseDir, dist: NORMAL_RAY_DIST },
        { origin: lateralOrigin(getRayOrigin(loc, baseDir), baseDir,  SIDE_OFF),  dir: baseDir, dist: NORMAL_RAY_DIST },
        { origin: lateralOrigin(getRayOrigin(loc, baseDir), baseDir, -SIDE_OFF2), dir: baseDir, dist: NORMAL_RAY_DIST },
        { origin: lateralOrigin(getRayOrigin(loc, baseDir), baseDir,  SIDE_OFF2), dir: baseDir, dist: NORMAL_RAY_DIST },
    ];

    // 斜め Ray
    getValidDiagonalRays(baseDir).forEach(diagDir => {
        raySet.push({
            origin: getRayOrigin(loc, diagDir),
            dir: diagDir,
            dist: SHORT_RAY_DIST
        });
    });

    // 横方向 Ray
    getValidSideRay(baseDir).forEach(sideDir => {
        raySet.push({
            origin: { x: loc.x, y: loc.y + 0.1, z: loc.z },
            dir: sideDir,
            dist: SHORT_RAY_DIST
        });
    });

    let closest = null;

    for (const { origin, dir, dist } of raySet) {
        const result = checkRayObstacle(dim, entity, origin, dir, dist);
        if (!result) continue; // 衝突なしならスキップ

        const { hit, isFirstHit } = result;
        if (!hit?.block) continue;

        if (isFacingImpossible(baseDir, hit.face)) continue;

        const block = hit.block;
        const faceLoc = hit.faceLocation;
        const hitPos = {
            x: block.location.x + faceLoc.x,
            y: block.location.y + faceLoc.y,
            z: block.location.z + faceLoc.z,
        };

        const distToHit = isFirstHit ? distance({...loc, y : loc.y + 0.1}, hitPos) : distance(locUp, hitPos);
        const isSideRay = Math.abs(dot(baseDir, dir)) < 0.1;
        const maxDist = isSideRay ? SIDE_REFLECT_DIST : MAX_REFLECT_DIST;
        //world.sendMessage(`hit! ${hit.block.typeId} : ${hitPos.x}, distance : ${distToHit}, min? : ${(distToHit <= maxDist)}`);

        if (distToHit <= maxDist) {
            if (!closest || distToHit < closest.distToHit) {
                closest = { hit, distToHit, hitPos };
            }
        }
    }

    if (closest) {
        //overworld.spawnParticle("minecraft:basic_flame_particle", closest.hitPos);
        reflectEntity(entity, closest.hit);
        return true;
    }

    return false;
}

function getRayOrigin(loc, dir) {
    const ORIGIN_OFFSET = 0.05;
    const originLocation = {
        x: loc.x + dir.x * ORIGIN_OFFSET,
        y: loc.y + 0.1,
        z: loc.z + dir.z * ORIGIN_OFFSET
    };
    return originLocation;
}

function checkRayObstacle(dim, entity, origin, direction, distance) {
    const firstHit = dim.getBlockFromRay(origin, direction, { maxDistance: distance, includeLiquidBlocks: false, includePassableBlocks : false });
    const secondHit = dim.getBlockFromRay(
        { x: origin.x, y: origin.y + 0.5, z: origin.z },
        direction,
        { maxDistance: distance, includeLiquidBlocks: false }
    );
    if (!firstHit || !firstHit.block || isPassThroughBlock(firstHit?.block)) {
        if (!secondHit || !secondHit.block || isPassThroughBlock(secondHit?.block)) return null;
        return {hit : secondHit, isFirstHit : false};
    }

    const block = firstHit.block;
    const id = block.typeId;
    const perm = block.permutation;
    const blockY = block.location.y;

    let topY = blockY + 1;
    if (id.includes("slab")) {
        const verticalHalf = perm.getState("minecraft:vertical_half");
        topY = (verticalHalf === "bottom") ? blockY + 0.5 : blockY + 1.0;
    } else if (id.includes("carpet")) {
        topY = blockY + 1 / 16;
    } else if (id.includes("stairs")) {
        const permutation = firstHit.block.permutation;
        const half = perm.getState("half") ?? perm.getState("block_half");
        topY = (half === "top") ? blockY + 1.0 : blockY + 1.0;
    }

    const heightDiff = topY - origin.y + 0.1;   // ← origin.y を使わない

    if (heightDiff <= STEP_HEIGHT + EPS) {
        if (!secondHit || !secondHit.block) return null;
    } 
    if (["carpet"].some(k => id.includes(k))) return null;
    if (id.includes("stairs") && stairsClimbable(perm, direction)) return null;
    else if (secondHit?.block.typeId.includes("stairs") && block.permutation.getState("upside_down_bit") && secondHit?.block.permutation.getState("upside_down_bit")) return {hit : secondHit, isFirstHit : false};
    return (entity.typeId === RED_SHELL_ID || entity.typeId === GREEN_SHELL_ID) ? {hit : firstHit, isFirstHit : true} : null;
}

function reflectEntity(entity, hit) {
    //overworld.spawnParticle("minecraft:basic_flame_particle", { x: hit.block.center().x, y :hit.block.center().y + 1.3, z : hit.block.center().z});
    // 1️⃣ 法線ベクトルをfaceから決定
    const N = faceToNormal(hit.face);
    if (!N) return; // 上下面などは無視

    // 2️⃣ エンティティの現在のYawから進行ベクトルVを計算
    let yaw = entity.getRotation().y;
    if (yaw < 0) yaw += 360;
    const yawRad = yaw * Math.PI / 180;
    const V = { x: Math.sin(yawRad), z: Math.cos(yawRad) };

    // 3️⃣ 反射ベクトル R = V - 2(V·N)N
    const dot = V.x * N.x + V.z * N.z;
    const R = { x: V.x - 2 * dot * N.x, z: V.z - 2 * dot * N.z };

    // 4️⃣ RからYawを再計算し、反映
    let newYaw = (Math.atan2(R.x, R.z) * 180 / Math.PI + 360) % 360;
    entity.setRotation({ x: entity.getRotation().x, y: Math.fround(newYaw) });
}




function stairsClimbable(perm, forward) {
    if (perm.getState("upside_down_bit") === true) return false;
    const dirState = perm.getState("weirdo_direction") ?? 0;
    const facingVec = [
        { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }
    ][dirState % 4];
    const dot = forward.x * facingVec.x + forward.z * facingVec.z;
    return dot > 0.5;
}

function rotateVector(vec, angleDeg) {
    const rad = angleDeg * (Math.PI / 180);
    const cos = Math.cos(rad), sin = Math.sin(rad);
    return {
        x: vec.x * cos - vec.z * sin,
        y: vec.y,
        z: vec.x * sin + vec.z * cos
    };
}

function normalizeVector(v) {
    const mag = Math.sqrt(v.x * v.x + v.z * v.z);
    if (mag === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / mag, y: 0, z: v.z / mag };
}

/* origin を左右に SIDE_OFF だけずらす */
function lateralOrigin(origin, forward, offset) {
    const len   = Math.hypot(forward.x, forward.z) || 1;
    const left  = { x: -forward.z / len, z:  forward.x / len }; // 左方向単位ベクトル
    const loc = {
        x: origin.x + left.x * offset,
        y: origin.y,
        z: origin.z + left.z * offset
    };
    return loc;
}

function isPassThroughBlock(block) {
    if (!block) return false;
    return PASS_THROUGH_KEYWORDS.some(k => block.typeId.includes(k));
}

function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}


function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function normalize(v) {
    const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (mag === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

function faceToNormal(face) {
    switch (face) {
        case Direction.East:  return { x:  1, z:  0 };
        case Direction.West:  return { x: -1, z:  0 };
        case Direction.South: return { x:  0, z:  1 };
        case Direction.North: return { x:  0, z: -1 };
        default: return null; // 上下面など
    }
}

function getValidDiagonalRays(baseDir) {
    const rounded = {
        x: Math.round(baseDir.x * 1000) / 1000,
        z: Math.round(baseDir.z * 1000) / 1000,
    };

    const isPerfectAxis =
        (rounded.x === 1.000 && rounded.z === 0.000) ||
        (rounded.x === -1.000 && rounded.z === 0.000) ||
        (rounded.x === 0.000 && rounded.z === 1.000) ||
        (rounded.x === 0.000 && rounded.z === -1.000);

    if (isPerfectAxis) {
        //world.sendMessage(`§7[diag] perfect axis: ${vecStr(baseDir)} → no diagonal rays`);
        return [];
    }

    const dir45R = normalize(rotateVector(baseDir, 30));
    const dir45L = normalize(rotateVector(baseDir, -30));

    const dotR = dot(baseDir, dir45R);
    const dotL = dot(baseDir, dir45L);

    const chosen = dotR > dotL ? [dir45R] : [dir45L];

    return chosen;
}

function getValidSideRay(baseDir) {
    const rounded = {
        x: Math.round(baseDir.x * 1000) / 1000,
        z: Math.round(baseDir.z * 1000) / 1000,
    };

    const isPerfectAxis =
        (rounded.x === 1.000 && rounded.z === 0.000) ||
        (rounded.x === -1.000 && rounded.z === 0.000) ||
        (rounded.x === 0.000 && rounded.z === 1.000) ||
        (rounded.x === 0.000 && rounded.z === -1.000);

    if (isPerfectAxis) {
        //world.sendMessage(`§7[side] perfect axis: ${vecStr(baseDir)} → no side rays`);
        return [];
    }

    const dirR = normalize(rotateVector(baseDir, 90));
    const dirL = normalize(rotateVector(baseDir, -90));

    const dotR = dot(baseDir, dirR);
    const dotL = dot(baseDir, dirL);

    const chosen = dotR > dotL ? [dirR] : [dirL];
    const originOffset = dotR > dotL ? 1 : -1;


    return chosen;
}


/* --- 2D 正規化ユーティリティ --- */
function normalizeXZ(vec) {
    const len = Math.hypot(vec.x, vec.z);
    if (len === 0) return { x: 0, z: 0 };
    return { x: vec.x / len, z: vec.z / len };
}

/* ───────── debug helpers ───────── */
function vecStr(v) {           // x,z だけ見やすく
    return `(${v.x.toFixed(3)}, ${v.z.toFixed(3)})`;
}
/* ──────────────────────────────── */

function isFacingImpossible(forward, face) {
    const N = faceToNormal(face);
    if (!N) return false;                 // 上下面はここで除外しない
    const d = forward.x * N.x + forward.z * N.z;
    return d > 0;                         // 正なら “裏面ヒット” なので無効
}