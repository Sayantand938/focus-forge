// src/features/dashboard/lib/progression.ts

export interface Level {
  level: number;
  xp: number;
  rank: string;
}

// --- 50-level progression system ---
export const LEVELS: readonly Level[] = [
    { level: 1, xp: 0, rank: 'Recruit' },
    { level: 2, xp: 360, rank: 'Militia' },
    { level: 3, xp: 1080, rank: 'Squire' },
    { level: 4, xp: 2160, rank: 'Footman' },
    { level: 5, xp: 3600, rank: 'Scout' },
    { level: 6, xp: 5400, rank: 'Man-at-Arms' },
    { level: 7, xp: 7560, rank: 'Spearman' },
    { level: 8, xp: 10080, rank: 'Archer' },
    { level: 9, xp: 12960, rank: 'Sergeant-at-Arms' },
    { level: 10, xp: 16200, rank: 'Knight' },
    { level: 11, xp: 19800, rank: 'Knight-Errant' },
    { level: 12, xp: 23760, rank: 'Knight Banneret' },
    { level: 13, xp: 28080, rank: 'Standard-Bearer' },
    { level: 14, xp: 32760, rank: 'Champion' },
    { level: 15, xp: 37800, rank: 'Paladin' },
    { level: 16, xp: 43200, rank: 'Guardian' },
    { level: 17, xp: 48960, rank: 'Captain of Arms' },
    { level: 18, xp: 55080, rank: 'High Knight' },
    { level: 19, xp: 61560, rank: 'Battlelord' },
    { level: 20, xp: 68400, rank: 'Warlord' },
    { level: 21, xp: 75600, rank: 'Lord Commander' },
    { level: 22, xp: 83160, rank: 'Marshal' },
    { level: 23, xp: 91080, rank: 'High Marshal' },
    { level: 24, xp: 99360, rank: 'War Chief' },
    { level: 25, xp: 108000, rank: 'Overlord' },
    { level: 26, xp: 117000, rank: 'Stormlord' },
    { level: 27, xp: 126360, rank: 'Warmaster' },
    { level: 28, xp: 136080, rank: 'Grandmaster' },
    { level: 29, xp: 146160, rank: 'Highlord' },
    { level: 30, xp: 156600, rank: 'Eternal Knight' },
    { level: 31, xp: 167400, rank: 'Iron Warden' },
    { level: 32, xp: 178560, rank: 'Shield Marshal' },
    { level: 33, xp: 190080, rank: 'Crusader Lord' },
    { level: 34, xp: 201960, rank: 'Dragon Knight' },
    { level: 35, xp: 214200, rank: 'Dreadlord' },
    { level: 36, xp: 226800, rank: 'Blood Warlord' },
    { level: 37, xp: 239760, rank: 'Iron Marshal' },
    { level: 38, xp: 253080, rank: 'Storm General' },
    { level: 39, xp: 266760, rank: 'High Crusader' },
    { level: 40, xp: 280800, rank: 'Warborn Champion' },
    { level: 41, xp: 295200, rank: 'Grand Lord' },
    { level: 42, xp: 309960, rank: 'Supreme Warden' },
    { level: 43, xp: 325080, rank: 'Iron Highlord' },
    { level: 44, xp: 340560, rank: 'Stormbreaker' },
    { level: 45, xp: 356400, rank: 'Warmaster General' },
    { level: 46, xp: 372600, rank: 'Lord of Blades' },
    { level: 47, xp: 389160, rank: 'Warchief Prime' },
    { level: 48, xp: 406080, rank: 'Grand Overlord' },
    { level: 49, xp: 423360, rank: 'Warmaster Supreme' },
    { level: 50, xp: 459900, rank: 'Eternal Warlord' },
  ];

/**
 * Calculates the user's current level, rank, and progress based on total XP.
 * @param totalXp - The total number of minutes focused (1 min = 1 XP).
 */
export function calculateProgression(totalXp: number) {
  // Find the highest level the user has achieved
  const currentLevel = LEVELS.slice().reverse().find(level => totalXp >= level.xp) || LEVELS[0];
  const nextLevel = LEVELS.find(level => level.level === currentLevel.level + 1);

  if (!nextLevel) {
    // User is at max level
    return {
      currentLevel,
      nextLevel: null,
      totalXp,
      xpToNext: 0,
      progressPercentage: 100,
    };
  }

  const xpForCurrentLevel = currentLevel.xp;
  const xpForNextLevel = nextLevel.xp;
  
  const xpEarnedInCurrentLevel = totalXp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;

  const progressPercentage = (xpEarnedInCurrentLevel / xpNeededForNextLevel) * 100;

  return {
    currentLevel,
    nextLevel,
    totalXp,
    xpToNext: xpNeededForNextLevel - xpEarnedInCurrentLevel,
    progressPercentage,
  };
}