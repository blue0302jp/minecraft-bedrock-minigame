export function generateRouletteId(x, y, z) {
    return `${x.toString().padStart(2, '0')}-${y.toString().padStart(2, '0')}-${z.toString().padStart(2, '0')}-`
}