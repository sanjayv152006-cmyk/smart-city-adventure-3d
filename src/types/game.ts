export type GameMode = 'child' | 'student';

export interface Question {
  id: string;
  round: number;
  question: string;
  options: [string, string, string, string];
  correctAnswerIndex: number;
  explanation: string;
  category: string;
}

export interface CityDefinition {
  id: number;
  name: string;
  tagline: string;
  theme: string;
  description: string;
  groundColor: number;
  skyColor: number;
  fogColor: number;
  treeColor: number;
  buildingTint: number;
  accentColor: string;
  completionRewardCoins: number;
}

export interface CityLocationInfo {
  id: number;
  name: string;
  subtitle: string;
  category: string;
  unlockCoins: number;
  description: string;
  features: string[];
  color: string;
  iconName: string;
  position3D: [number, number, number]; // [x, y, z] in the 3D world
  cameraTarget: [number, number, number];
}

export interface CityProgressData {
  completedRounds: number[]; // e.g. [1, 2]
  unlockedLocations: number[]; // e.g. [1, 2]
  claimedRewards: number[]; // round numbers
  roundScores: Record<number, number>; // round -> score (0-5)
}

export interface GameProgress {
  mode: GameMode;
  coins: number;
  currentCityId: number; // 1 to 50
  unlockedCityIds: number[]; // e.g. [1, 2]
  completedCityIds: number[]; // e.g. [1]
  cityProgress: Record<number, CityProgressData>; // cityId -> progress
  totalCorrectAnswers: number;
  totalQuestionsAnswered: number;
  lastPlayedAt: string;
}
