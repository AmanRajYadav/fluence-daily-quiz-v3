/**
 * League System Utilities
 * Implements class-based league tiers similar to Duolingo
 */

/**
 * League tier definitions
 */
export const LEAGUES = {
  BEGINNER: {
    name: 'Beginner League',
    minPoints: 0,
    maxPoints: 1500,
    color: 'from-orange-600 to-orange-800',
    icon: '🥉',
    bgGradient: 'from-orange-900/40 to-orange-800/40',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-300'
  },
  INTERMEDIATE: {
    name: 'Intermediate League',
    minPoints: 1500,
    maxPoints: 3000,
    color: 'from-gray-400 to-gray-600',
    icon: '🥈',
    bgGradient: 'from-gray-900/40 to-gray-800/40',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300'
  },
  ADVANCED: {
    name: 'Advanced League',
    minPoints: 3000,
    maxPoints: 5000,
    color: 'from-yellow-500 to-yellow-700',
    icon: '🥇',
    bgGradient: 'from-yellow-900/40 to-yellow-800/40',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-300'
  },
  MASTER: {
    name: 'Master League',
    minPoints: 5000,
    maxPoints: Infinity,
    color: 'from-purple-500 to-pink-600',
    icon: '👑',
    bgGradient: 'from-purple-900/40 to-pink-900/40',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-300'
  }
};

/**
 * Get league tier based on total points
 * @param {number} totalPoints - Total cumulative points earned
 * @returns {object} League object with name, colors, icon
 */
export const getLeagueTier = (totalPoints) => {
  if (totalPoints >= LEAGUES.MASTER.minPoints) {
    return LEAGUES.MASTER;
  } else if (totalPoints >= LEAGUES.ADVANCED.minPoints) {
    return LEAGUES.ADVANCED;
  } else if (totalPoints >= LEAGUES.INTERMEDIATE.minPoints) {
    return LEAGUES.INTERMEDIATE;
  } else {
    return LEAGUES.BEGINNER;
  }
};

/**
 * Calculate progress to next league
 * @param {number} totalPoints - Current total points
 * @returns {object} Progress info: { currentLeague, nextLeague, progress, pointsNeeded }
 */
export const getLeagueProgress = (totalPoints) => {
  const currentLeague = getLeagueTier(totalPoints);

  // If already in Master league, no next league
  if (currentLeague === LEAGUES.MASTER) {
    return {
      currentLeague,
      nextLeague: null,
      progress: 100,
      pointsNeeded: 0,
      pointsInCurrentLeague: totalPoints - currentLeague.minPoints
    };
  }

  // Find next league
  const leagueKeys = Object.keys(LEAGUES);
  const currentIndex = leagueKeys.findIndex(key => LEAGUES[key] === currentLeague);
  const nextLeague = LEAGUES[leagueKeys[currentIndex + 1]];

  // Calculate progress
  const pointsInCurrentLeague = totalPoints - currentLeague.minPoints;
  const pointsNeededForNextLeague = nextLeague.minPoints - totalPoints;
  const leagueRange = nextLeague.minPoints - currentLeague.minPoints;
  const progress = (pointsInCurrentLeague / leagueRange) * 100;

  return {
    currentLeague,
    nextLeague,
    progress: Math.round(progress),
    pointsNeeded: pointsNeededForNextLeague,
    pointsInCurrentLeague
  };
};

/**
 * Get all league tiers in order
 * @returns {array} Array of league objects
 */
export const getAllLeagues = () => {
  return Object.values(LEAGUES);
};

/**
 * Format league display name with icon
 * @param {object} league - League object
 * @returns {string} Formatted string like "🥉 Beginner League"
 */
export const formatLeagueName = (league) => {
  return `${league.icon} ${league.name}`;
};
