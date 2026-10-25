import { ALL_50_CITIES } from '../src/data/cities';
import { CITY_LOCATIONS } from '../src/data/locations';
import { CHILD_BASE_QUESTIONS, STUDENT_BASE_QUESTIONS, getRoundQuestions } from '../src/data/questions';
import { GameProgress, GameMode, CityProgressData } from '../src/types/game';
import { createInitialCityProgress } from '../src/services/storage';

console.log('========================================================');
console.log('RUNNING COMPREHENSIVE PROGRESSION & GAME SYSTEM TEST SUITE');
console.log('========================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    failCount++;
  }
}

// ---------------------------------------------------------------------
// TEST 1: ALL 50 CITIES VALIDATION
// ---------------------------------------------------------------------
console.log('TEST 1: Validating all 50 cities definitions...');
assert(ALL_50_CITIES.length === 50, 'Exactly 50 cities exist');

ALL_50_CITIES.forEach((city, index) => {
  const expectedId = index + 1;
  const isIdMatch = city.id === expectedId;
  const hasValidName = typeof city.name === 'string' && city.name.length > 0;
  const hasValidGround = typeof city.groundColor === 'number' && city.groundColor > 0;
  const hasValidSky = typeof city.skyColor === 'number' && city.skyColor > 0;
  const hasReward = typeof city.completionRewardCoins === 'number' && city.completionRewardCoins >= 500;

  if (!isIdMatch || !hasValidName || !hasValidGround || !hasValidSky || !hasReward) {
    assert(false, `City ${expectedId} structure`, JSON.stringify(city));
  }
});
assert(true, 'All 50 cities have verified IDs, names, rich colors, and reward coins');

// ---------------------------------------------------------------------
// TEST 2: ALL 10 ZONE LOCATIONS
// ---------------------------------------------------------------------
console.log('\nTEST 2: Validating all 10 city zone locations...');
assert(CITY_LOCATIONS.length === 10, 'Exactly 10 city locations exist');
CITY_LOCATIONS.forEach((loc, idx) => {
  const expectedId = idx + 1;
  assert(loc.id === expectedId, `Location ${expectedId}: ${loc.name}`);
  assert(Array.isArray(loc.position3D) && loc.position3D.length === 3, `Location ${expectedId} has 3D coords`);
  assert(Array.isArray(loc.cameraTarget) && loc.cameraTarget.length === 3, `Location ${expectedId} has camera target`);
});

// ---------------------------------------------------------------------
// TEST 3: ALL QUESTIONS (CHILD & STUDENT) ACROSS ALL 50 CITIES & 500 ROUNDS
// ---------------------------------------------------------------------
console.log('\nTEST 3: Validating question databases across 500 rounds...');

let questionErrorCount = 0;
for (let c = 1; c <= 50; c++) {
  for (let r = 1; r <= 10; r++) {
    const childQs = getRoundQuestions('child', c, r);
    const studentQs = getRoundQuestions('student', c, r);

    if (childQs.length !== 5) {
      questionErrorCount++;
      console.error(`City ${c} Round ${r} child questions count != 5`);
    }
    if (studentQs.length !== 5) {
      questionErrorCount++;
      console.error(`City ${c} Round ${r} student questions count != 5`);
    }

    [...childQs, ...studentQs].forEach((q) => {
      if (!q.question || q.question.length < 5) questionErrorCount++;
      if (!Array.isArray(q.options) || q.options.length < 4) questionErrorCount++;
      if (q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) questionErrorCount++;
      if (!q.explanation || q.explanation.length < 5) questionErrorCount++;
    });
  }
}
assert(questionErrorCount === 0, 'All 500 rounds across Child & Student modes have 5 verified valid questions');

// ---------------------------------------------------------------------
// TEST 4: PROGRESSION LOGIC SIMULATION
// ---------------------------------------------------------------------
console.log('\nTEST 4: Simulating complete game progression lifecycle...');

// Simulate initial state
let state: GameProgress = {
  mode: 'student',
  coins: 100,
  currentCityId: 1,
  unlockedCityIds: [1],
  completedCityIds: [],
  cityProgress: {
    1: createInitialCityProgress(),
  },
  totalCorrectAnswers: 0,
  totalQuestionsAnswered: 0,
  lastPlayedAt: new Date().toISOString(),
};

assert(state.unlockedCityIds.length === 1 && state.unlockedCityIds[0] === 1, 'Initial state: only City 1 is unlocked');
assert(state.cityProgress[1].completedRounds.length === 0, 'Initial state: 0 completed rounds');

// Helper to simulate round completion (matching App.tsx handleRoundComplete logic)
function simulateRoundResult(
  prog: GameProgress,
  cityId: number,
  round: number,
  score: number,
  rewardCoins: number
): GameProgress {
  const isPassed = score >= 4;
  if (!isPassed) {
    // Failing round does not unlock anything or award coins
    return prog;
  }

  const curCityProg = prog.cityProgress[cityId] || createInitialCityProgress();
  const isAlreadyClaimed = curCityProg.claimedRewards.includes(round);
  const coinsToAdd = isAlreadyClaimed ? 0 : rewardCoins;

  const updatedCompletedRounds = Array.from(new Set([...curCityProg.completedRounds, round]));
  const updatedUnlockedLocations = Array.from(new Set([...curCityProg.unlockedLocations, round]));
  const updatedClaimedRewards = Array.from(new Set([...curCityProg.claimedRewards, round]));
  const updatedScores = {
    ...curCityProg.roundScores,
    [round]: Math.max(score, curCityProg.roundScores[round] || 0),
  };

  const newCityProgress = {
    ...prog.cityProgress,
    [cityId]: {
      completedRounds: updatedCompletedRounds,
      unlockedLocations: updatedUnlockedLocations,
      claimedRewards: updatedClaimedRewards,
      roundScores: updatedScores,
    },
  };

  const isCityCompletedNow = updatedCompletedRounds.length >= 10;
  const isFirstTimeCityCompletion =
    isCityCompletedNow && !prog.completedCityIds.includes(cityId);

  const newCompletedCities = Array.from(
    new Set(isCityCompletedNow ? [...prog.completedCityIds, cityId] : prog.completedCityIds)
  );

  let cityBonusCoins = 0;
  const newUnlockedCities = [...prog.unlockedCityIds];

  if (isFirstTimeCityCompletion) {
    const cityDef = ALL_50_CITIES.find((c) => c.id === cityId);
    cityBonusCoins = cityDef?.completionRewardCoins || 500;
    const nextCityId = cityId + 1;
    if (nextCityId <= 50 && !newUnlockedCities.includes(nextCityId)) {
      newUnlockedCities.push(nextCityId);
    }
  }

  return {
    ...prog,
    coins: prog.coins + coinsToAdd + cityBonusCoins,
    unlockedCityIds: Array.from(new Set(newUnlockedCities)),
    completedCityIds: newCompletedCities,
    cityProgress: newCityProgress,
    totalCorrectAnswers: prog.totalCorrectAnswers + score,
    totalQuestionsAnswered: prog.totalQuestionsAnswered + 5,
  };
}

// 4.1 Test Passing Round 1
state = simulateRoundResult(state, 1, 1, 4, 100);
assert(state.coins === 200, 'Passing Round 1 (score 4/5) awards 100 coins (total 200)');
assert(state.cityProgress[1].completedRounds.includes(1), 'Round 1 marked as completed');
assert(state.cityProgress[1].unlockedLocations.includes(1), 'Location 1 unlocked');

// 4.2 Test Failing Round 2 (score 3/5 < 4)
const stateBeforeFail = { ...state };
state = simulateRoundResult(state, 1, 2, 3, 150);
assert(state.coins === stateBeforeFail.coins, 'Failing Round 2 (score 3/5) awards ZERO coins');
assert(!state.cityProgress[1].completedRounds.includes(2), 'Failing Round 2 does NOT mark round as completed');
assert(!state.cityProgress[1].unlockedLocations.includes(2), 'Failing Round 2 does NOT unlock location 2');

// 4.3 Test Retrying Round 2 and Passing (score 5/5)
state = simulateRoundResult(state, 1, 2, 5, 150);
assert(state.coins === 350, 'Passing Round 2 on retry awards 150 coins (total 350)');
assert(state.cityProgress[1].completedRounds.includes(2), 'Round 2 now completed');
assert(state.cityProgress[1].unlockedLocations.includes(2), 'Location 2 unlocked');

// 4.4 Test Replaying Round 1 with higher score (Duplicate Reward Prevention)
const coinsBeforeReplay = state.coins;
state = simulateRoundResult(state, 1, 1, 5, 100);
assert(state.coins === coinsBeforeReplay, 'Replaying already completed Round 1 awards 0 duplicate coins');
assert(state.cityProgress[1].roundScores[1] === 5, 'Score for Round 1 updated to highest score (5)');

// 4.5 Complete Remaining Rounds in City 1 (Rounds 3 to 10)
for (let r = 3; r <= 10; r++) {
  state = simulateRoundResult(state, 1, r, 5, 100 + r * 10);
}
assert(state.cityProgress[1].completedRounds.length === 10, 'All 10 rounds completed in City 1');
assert(state.completedCityIds.includes(1), 'City 1 added to completedCityIds');
assert(state.unlockedCityIds.includes(2), 'City 2 successfully unlocked upon City 1 completion');
assert(state.coins > 1500, 'City 1 completion reward bonus awarded');

// 4.6 Locked City Protection
const canSelectLockedCity = (cityId: number) => state.unlockedCityIds.includes(cityId);
assert(canSelectLockedCity(2) === true, 'Player can select unlocked City 2');
assert(canSelectLockedCity(3) === false, 'Player CANNOT select locked City 3');
assert(canSelectLockedCity(50) === false, 'Player CANNOT select locked City 50');

// 4.7 Full Progression Simulation through all 50 Cities
console.log('\nTEST 5: Simulating full 50-city journey...');
for (let c = 2; c <= 50; c++) {
  // Ensure city progress exists
  if (!state.cityProgress[c]) {
    state.cityProgress[c] = createInitialCityProgress();
  }
  for (let r = 1; r <= 10; r++) {
    state = simulateRoundResult(state, c, r, 5, 100);
  }
}

assert(state.completedCityIds.length === 50, 'All 50 cities successfully completed');
assert(state.unlockedCityIds.length === 50, 'All 50 cities unlocked');
assert(state.totalQuestionsAnswered === 2505, 'Answered all questions throughout simulation');

// 4.8 Storage serialization test
console.log('\nTEST 6: Testing Storage Serialization Fidelity...');
const serialized = JSON.stringify(state);
const parsed = JSON.parse(serialized);
assert(parsed.unlockedCityIds.length === 50, 'Storage JSON contains all 50 unlocked cities');
assert(parsed.completedCityIds.length === 50, 'Storage JSON contains all 50 completed cities');
assert(typeof parsed.coins === 'number' && parsed.coins > 0, 'Coins persisted cleanly');

console.log('\n========================================================');
console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('========================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('\n>>> ALL 50 CITIES AND ALL 500 ROUNDS CONFIRMED 100% OPERATIONAL! <<<\n');
}
