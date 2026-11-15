export enum WorldId {
  LEARN = 'learn',
  PRACTICE = 'practice',
  PUZZLE = 'puzzle',
  CHALLENGE = 'challenge',
  BUILDING = 'building',
}

export enum ScreenView {
  HOME = 'home',
  MAP = 'map',
  LEARN = 'learn',
  PRACTICE = 'practice',
  PUZZLE = 'puzzle',
  CHALLENGE = 'challenge',
  BUILDING = 'building',
}

export type TutorMood =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'celebrate'
  | 'guide'
  | 'encourage'
  | 'talking';

export type AvatarId = 'kompas' | 'roket' | 'kristal' | 'mahkota';

export type HigayonAccessoryId = 'syal' | 'topi_arsitek' | 'kacamata_bintang' | 'mahkota_emas';

export interface GridCoord {
  col: number;
  row: number;
}

export type ShapeKind = 'kosong' | 'persegi' | 'persegi_panjang' | 'tidak_beraturan';

export interface GridSelectionAnalysis {
  count: number;
  shapeKind: ShapeKind;
  shapeLabel: string;
  isContiguous: boolean;
  isSolidRectangle: boolean;
  isSquare: boolean;
  isNonSquareRectangle: boolean;
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
  width: number;
  height: number;
  area: number;
  perimeter: number;
}

export interface PracticeTask {
  id: string;
  title: string;
  instruction: string;
  gridCols: number;
  gridRows: number;
  ruleType:
    | 'exact_square'
    | 'exact_rectangle'
    | 'target_area'
    | 'target_perimeter'
    | 'square_with_area'
    | 'nonsquare_rect_with_area';
  targetWidth?: number;
  targetHeight?: number;
  targetArea?: number;
  targetPerimeter?: number;
  hint: string;
  tutorIntro: string;
}

export interface PuzzleLevel {
  id: string;
  title: string;
  story: string;
  instruction: string;
  gridCols: number;
  gridRows: number;
  lockedCells: GridCoord[];
  obstacleCells: GridCoord[];
  targetMarkers: GridCoord[];
  fountainCell?: GridCoord;
  puzzleRule:
    | 'complete_square_4x4'
    | 'area_avoid_obstacle_12'
    | 'enclose_fountain_perim_14'
    | 'twin_squares_cover_markers'
    | 'mystery_rect_5x3';
  hints: string[];
  tutorIntro: string;
}

export interface ChallengeQuestion {
  id: string;
  mode: 'draw' | 'answer';
  prompt: string;
  gridCols: number;
  gridRows: number;
  presetCells?: GridCoord[];
  ruleType?:
    | 'exact_square'
    | 'exact_rectangle'
    | 'target_area'
    | 'target_perimeter'
    | 'square_with_area'
    | 'nonsquare_rect_with_area';
  targetWidth?: number;
  targetHeight?: number;
  targetArea?: number;
  targetPerimeter?: number;
  options?: number[];
  correctAnswer?: number;
  unitLabel?: string;
  explanation: string;
}

export interface ChallengeTier {
  id: string;
  title: string;
  subtitle: string;
  badgeLabel: string;
  questions: ChallengeQuestion[];
}

export interface LearnModule {
  id: string;
  title: string;
  subtitle: string;
  conceptSummary: string;
  formulaText: string;
  tutorTip: string;
  kind: 'square' | 'rectangle' | 'compare';
}

export interface ValidationResult {
  passed: boolean;
  feedbackTitle: string;
  feedbackDetail: string;
}

export interface PlayerProfile {
  name: string;
  avatar: AvatarId;
  activeAccessory?: HigayonAccessoryId;
}

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0 to 1
  voiceEnabled?: boolean;
  voiceRate?: number; // 0.75 to 1.35
  animationsEnabled?: boolean;
  musicEnabled?: boolean;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: 'star' | 'compass' | 'grid' | 'puzzle' | 'trophy' | 'spark' | 'shield' | 'crown';
}

/* ================= PROMPT 3: BUILDING WORLD & 2D/3D GEOMETRY TYPES ================= */

export type Shape2DId =
  | 'persegi'
  | 'persegi_panjang'
  | 'segitiga'
  | 'trapesium'
  | 'jajar_genjang'
  | 'belah_ketupat'
  | 'lingkaran'
  | 'segi_lima'
  | 'segi_enam';

export interface Shape2DDef {
  id: Shape2DId;
  name: string;
  defaultColor: string;
  explanation: string;
  characteristics: string[];
  buildingExample: string;
  defaultWidth: number; // grid units (for non-circle)
  defaultHeight: number; // grid units (for non-circle)
  defaultRadius?: number; // grid units (strictly for lingkaran center+radius)
  minSize: number;
  maxSize: number;
  isCircle?: boolean;
}

export interface PlacedShape {
  id: string;
  type: Shape2DId;
  /** Center X in grid units (0..12). For circle: cx */
  cx: number;
  /** Center Y in grid units (0..9). For circle: cy */
  cy: number;
  /** Width in grid units (or 2*radius for bounding queries; circle uses radius directly) */
  width: number;
  /** Height in grid units (or 2*radius for bounding queries) */
  height: number;
  /** Explicit radius in grid units when type === 'lingkaran' */
  radius?: number;
  /** Rotation in degrees */
  rotation: number;
  color: string;
  label?: string;
}

export type BuildingLocationId =
  | 'geometry-village'
  | 'shape-city'
  | 'castle-island'
  | 'creative-zone';

export interface BuildingLocationDef {
  id: BuildingLocationId;
  name: string;
  subtitle: string;
  themeColor: string;
  unlockRequirementText: string;
  unlockMinStars: number;
  unlockMinChallenges: number;
  decorSummary: string;
}

export interface BuildingChallengeDef {
  id: string;
  locationId: BuildingLocationId;
  title: string;
  blueprintName: string;
  instruction: string;
  ruleType:
    | 'challenge_rumah'
    | 'challenge_sekolah'
    | 'challenge_rumah_sakit'
    | 'challenge_menara'
    | 'challenge_kastil'
    | 'challenge_jembatan'
    | 'creative';
  hints: string[];
  requiredShapesSummary: string[];
  starterBlueprint?: Omit<PlacedShape, 'id'>[];
}

export interface SavedBuilding {
  id: string;
  name: string;
  locationId: BuildingLocationId;
  challengeId?: string;
  createdAt: number;
  updatedAt: number;
  shapes: PlacedShape[];
}

export interface AttemptRecord {
  id: string;
  world: WorldId;
  itemId: string;
  itemTitle: string;
  passed: boolean;
  stars: number;
  timestamp: number;
}

export type SaveStatusState = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveWriteResult {
  ok: boolean;
  savedAt?: number;
  error?: string;
}

export interface SolidShape3DDef {
  id: 'kubus' | 'balok' | 'tabung' | 'kerucut' | 'prisma_segitiga';
  name: string;
  base2DRelation: string;
  explanation: string;
  characteristics: string[];
  buildingExample: string;
  color: string;
}

export interface TreasureChestDef {
  id: string;
  title: string;
  description: string;
  rewardStars: number;
  rewardXp: number;
  unlockAccessory?: HigayonAccessoryId;
  accessoryLabel?: string;
}

export interface GameProgress {
  schemaVersion?: number;
  profile: PlayerProfile;
  sound: SoundSettings;
  lastWorld: WorldId;
  hasStarted: boolean;
  learnCompleted: string[];
  masteredModules: string[];
  practiceStars: Record<string, number>;
  puzzleStars: Record<string, number>;
  challengeStars: Record<string, number>;
  buildingStars: Record<string, number>;
  savedBuildings: SavedBuilding[];
  draftBuildings: Record<string, PlacedShape[]>;
  activeBuildingLocationId?: BuildingLocationId;
  activeBuildingChallengeId?: string;
  attemptHistory: AttemptRecord[];
  openedChests: string[];
  unlockedAccessories: HigayonAccessoryId[];
  xp: number;
  lastSavedAt?: number;
}
