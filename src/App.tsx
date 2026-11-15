import { useCallback, useEffect, useRef, useState } from 'react';
import { Award, BarChart3, CheckCircle2, Info, Save, User, X } from 'lucide-react';
import { AIMentorDrawer } from './components/AIMentorDrawer';
import { AdventureMap } from './components/AdventureMap';
import { BuildingWorld, type BuildingWorldTab } from './components/BuildingWorld';
import { ChallengeWorld } from './components/ChallengeWorld';
import { GameHeader } from './components/GameHeader';
import { HomeScreen } from './components/HomeScreen';
import { LearnWorld } from './components/LearnWorld';
import { LivingBackground } from './components/LivingBackground';
import {
  AboutCreditsModal,
  AchievementModal,
  PauseModal,
  ProfileModal,
  ProgressModal,
  SoundModal,
} from './components/Modals';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { PracticeWorld } from './components/PracticeWorld';
import { PuzzleWorld } from './components/PuzzleWorld';
import { HigayonAccessoryProvider, TutorGuideBar } from './components/TutorRobot';
import { BUILDING_CHALLENGES, TREASURE_CHESTS } from './game/buildingData';
import {
  CHALLENGE_TIERS,
  LEARN_MODULES,
  PRACTICE_TASKS,
  PUZZLE_LEVELS,
} from './game/curriculumData';
import { setSoundSettings, sfx, startBgMusic, stopBgMusic } from './game/sound';
import {
  duplicateSavedBuilding,
  getMaxPossibleStars,
  getTotalStars,
  HIGAYON_PROGRESS_SAVED_MSG,
  loadProgress,
  renameSavedBuilding,
  resetProgress,
  saveProgress,
  upsertSavedBuilding,
} from './game/storage';
import {
  ScreenView,
  WorldId,
  type AttemptRecord,
  type AvatarId,
  type BuildingLocationId,
  type GameProgress,
  type HigayonAccessoryId,
  type PlacedShape,
  type SaveStatusState,
  type SavedBuilding,
  type SoundSettings,
} from './game/types';
import { markUserInteraction, speakRobot, stopRobotVoice } from './game/voice';

function worldToScreen(world: WorldId): ScreenView {
  switch (world) {
    case WorldId.LEARN:
      return ScreenView.LEARN;
    case WorldId.PRACTICE:
      return ScreenView.PRACTICE;
    case WorldId.PUZZLE:
      return ScreenView.PUZZLE;
    case WorldId.CHALLENGE:
      return ScreenView.CHALLENGE;
    case WorldId.BUILDING:
      return ScreenView.BUILDING;
  }
}

function screenToWorld(screen: ScreenView): WorldId {
  switch (screen) {
    case ScreenView.PRACTICE:
      return WorldId.PRACTICE;
    case ScreenView.PUZZLE:
      return WorldId.PUZZLE;
    case ScreenView.CHALLENGE:
      return WorldId.CHALLENGE;
    case ScreenView.BUILDING:
      return WorldId.BUILDING;
    default:
      return WorldId.LEARN;
  }
}

const WORLD_LABELS: Record<ScreenView, string> = {
  [ScreenView.HOME]: 'Beranda',
  [ScreenView.MAP]: 'Peta Petualangan',
  [ScreenView.LEARN]: 'Learn World · Dunia Belajar',
  [ScreenView.PRACTICE]: 'Practice World · Dunia Latihan',
  [ScreenView.PUZZLE]: 'Puzzle World · Dunia Teka-Teki',
  [ScreenView.CHALLENGE]: 'Challenge World · Dunia Tantangan',
  [ScreenView.BUILDING]: 'Building World · Bangun Kota Geometri',
};

export default function App() {
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());
  const [screen, setScreen] = useState<ScreenView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return ScreenView.MAP;
      }
    }
    return ScreenView.HOME;
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isChallengeOutcome, setIsChallengeOutcome] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'none' | 'achievements' | 'profile' | 'sound' | 'progress' | 'about'
  >('none');
  const [mentorOpen, setMentorOpen] = useState(false);
  const [buildingLocation, setBuildingLocation] =
    useState<BuildingLocationId>('geometry-village');
  const [buildingInitialTab, setBuildingInitialTab] = useState<BuildingWorldTab>('studio');
  const [mentorContext, setMentorContext] = useState<{
    levelId?: string;
    levelTitle?: string;
    placedShapes?: PlacedShape[];
    lastError?: string;
  }>({});

  // Save status & autosave state
  const [saveStatus, setSaveStatus] = useState<SaveStatusState>(() =>
    progress.lastSavedAt ? 'saved' : 'idle'
  );
  const [lastSavedAt, setLastSavedAt] = useState<number | undefined>(() => progress.lastSavedAt);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const latestProgressRef = useRef(progress);
  latestProgressRef.current = progress;
  const isFirstMountRef = useRef(true);
  const autosaveTimerRef = useRef<number | null>(null);

  // Counter key to cleanly restart current world level from Pause menu
  const [worldResetKey, setWorldResetKey] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const performSaveNow = useCallback((showFeedback = false) => {
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    setSaveStatus('saving');
    setSaveError(null);
    const result = saveProgress(latestProgressRef.current);
    if (result.ok) {
      setSaveStatus('saved');
      setLastSavedAt(result.savedAt);
      setSaveError(null);
      if (showFeedback) {
        sfx.collectStar();
        setSaveToast(HIGAYON_PROGRESS_SAVED_MSG);
        speakRobot(HIGAYON_PROGRESS_SAVED_MSG, { fromUserAction: true });
      }
    } else {
      setSaveStatus('error');
      setSaveError(result.error ?? 'Gagal menyimpan progres ke perangkat.');
      if (showFeedback) {
        sfx.error();
      }
    }
    return result;
  }, []);

  useEffect(() => {
    if (!saveToast) return;
    const t = window.setTimeout(() => setSaveToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [saveToast]);

  // Unlock browser speechSynthesis & gentle ambient music strictly after genuine user interaction
  useEffect(() => {
    const unlock = () => {
      markUserInteraction();
      setHasInteracted(true);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Sync sound engine & background music
  useEffect(() => {
    setSoundSettings(progress.sound);
    if (hasInteracted && progress.sound.enabled && progress.sound.musicEnabled !== false) {
      startBgMusic();
    } else {
      stopBgMusic();
    }
  }, [progress.sound, hasInteracted]);

  // Debounced Auto Save whenever progress changes
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    setSaveStatus('saving');
    setSaveError(null);
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      const result = saveProgress(latestProgressRef.current);
      if (result.ok) {
        setSaveStatus('saved');
        setLastSavedAt(result.savedAt);
        setSaveError(null);
      } else {
        setSaveStatus('error');
        setSaveError(result.error ?? 'Gagal menyimpan progres ke perangkat.');
      }
    }, 600);

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [progress]);

  // Flush pending progress immediately when leaving or backgrounding page
  useEffect(() => {
    const flushNow = () => {
      if (autosaveTimerRef.current === null) return;
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
      const result = saveProgress(latestProgressRef.current);
      if (result.ok) {
        setLastSavedAt(result.savedAt);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushNow();
      }
    };
    window.addEventListener('beforeunload', flushNow);
    window.addEventListener('pagehide', flushNow);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', flushNow);
      window.removeEventListener('pagehide', flushNow);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Stop any ongoing speech cleanly whenever active screen changes
  useEffect(() => {
    stopRobotVoice();
  }, [screen]);

  // Mirror state machine to document.body.dataset.state
  useEffect(() => {
    if (isPaused) {
      document.body.dataset.state = 'paused';
    } else if (isChallengeOutcome) {
      document.body.dataset.state = 'gameover';
    } else if (screen === ScreenView.HOME) {
      document.body.dataset.state = 'title';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [screen, isPaused, isChallengeOutcome]);

  const enterWorld = useCallback((world: WorldId, tab: BuildingWorldTab = 'studio') => {
    stopRobotVoice();
    sfx.click();
    setIsPaused(false);
    setMentorContext({});
    if (world === WorldId.BUILDING) {
      setBuildingInitialTab(tab);
    }
    setProgress((prev) => ({
      ...prev,
      hasStarted: true,
      lastWorld: world,
    }));
    setScreen(worldToScreen(world));
  }, []);

  const handleStartAdventure = useCallback(() => {
    stopRobotVoice();
    sfx.click();
    setIsPaused(false);
    setProgress((prev) => ({ ...prev, hasStarted: true }));
    setScreen(ScreenView.MAP);
  }, []);

  const handleContinueGame = useCallback(() => {
    enterWorld(progress.lastWorld, 'studio');
  }, [enterWorld, progress.lastWorld]);

  const handleNewGame = useCallback(() => {
    stopRobotVoice();
    sfx.tileErase();
    const fresh = resetProgress();
    const startedFresh: GameProgress = { ...fresh, hasStarted: true };
    setProgress(startedFresh);
    setSaveStatus('saved');
    setLastSavedAt(Date.now());
    setSaveError(null);
    setWorldResetKey((k) => k + 1);
    setScreen(ScreenView.MAP);
  }, []);

  // Keyboard shortcuts: Enter/Space on Home, Escape/P in active worlds
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (mentorOpen) {
        if (e.key === 'Escape') setMentorOpen(false);
        return;
      }

      if (activeModal !== 'none') {
        if (e.key === 'Escape') {
          setActiveModal('none');
        }
        return;
      }

      if (screen === ScreenView.HOME && (e.key === 'Enter' || e.key === ' ')) {
        if (target?.tagName === 'BUTTON') return;
        e.preventDefault();
        handleStartAdventure();
        return;
      }

      if (
        screen !== ScreenView.HOME &&
        screen !== ScreenView.MAP &&
        !isChallengeOutcome &&
        (e.key === 'Escape' || e.key.toLowerCase() === 'p')
      ) {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, activeModal, mentorOpen, isChallengeOutcome, handleStartAdventure]);

  const totalStars = getTotalStars(progress);
  const maxStars = getMaxPossibleStars();

  const appendAttempt = (
    history: AttemptRecord[],
    world: WorldId,
    itemId: string,
    itemTitle: string,
    stars: number
  ): AttemptRecord[] => {
    const entry: AttemptRecord = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      world,
      itemId,
      itemTitle,
      passed: stars > 0,
      stars,
      timestamp: Date.now(),
    };
    return [entry, ...(history ?? [])].slice(0, 40);
  };

  const handleCompleteLearnModule = (moduleId: string) => {
    const title = LEARN_MODULES.find((m) => m.id === moduleId)?.title ?? moduleId;
    setProgress((prev) => {
      const already = prev.learnCompleted.includes(moduleId);
      const nextMastered = prev.masteredModules?.includes(moduleId)
        ? prev.masteredModules
        : [...(prev.masteredModules ?? []), moduleId];
      return {
        ...prev,
        hasStarted: true,
        learnCompleted: already ? prev.learnCompleted : [...prev.learnCompleted, moduleId],
        masteredModules: nextMastered,
        attemptHistory: appendAttempt(prev.attemptHistory, WorldId.LEARN, moduleId, title, 2),
        xp: already ? prev.xp : prev.xp + 50,
      };
    });
  };

  const handleRecordPracticeStars = (taskId: string, stars: number) => {
    const title = PRACTICE_TASKS.find((t) => t.id === taskId)?.title ?? taskId;
    setProgress((prev) => {
      const best = Math.max(prev.practiceStars[taskId] ?? 0, stars);
      const gainedNew = !(taskId in prev.practiceStars);
      return {
        ...prev,
        hasStarted: true,
        practiceStars: { ...prev.practiceStars, [taskId]: best },
        attemptHistory: appendAttempt(prev.attemptHistory, WorldId.PRACTICE, taskId, title, stars),
        xp: prev.xp + (gainedNew ? 80 : 20),
      };
    });
  };

  const handleRecordPuzzleStars = (puzzleId: string, stars: number) => {
    const title = PUZZLE_LEVELS.find((p) => p.id === puzzleId)?.title ?? puzzleId;
    setProgress((prev) => {
      const best = Math.max(prev.puzzleStars[puzzleId] ?? 0, stars);
      const gainedNew = !(puzzleId in prev.puzzleStars);
      return {
        ...prev,
        hasStarted: true,
        puzzleStars: { ...prev.puzzleStars, [puzzleId]: best },
        attemptHistory: appendAttempt(prev.attemptHistory, WorldId.PUZZLE, puzzleId, title, stars),
        xp: prev.xp + (gainedNew ? 100 : 25),
      };
    });
  };

  const handleRecordChallengeStars = (tierId: string, stars: number) => {
    const title = CHALLENGE_TIERS.find((c) => c.id === tierId)?.title ?? tierId;
    setProgress((prev) => {
      const best = Math.max(prev.challengeStars[tierId] ?? 0, stars);
      const gainedNew = !(tierId in prev.challengeStars);
      return {
        ...prev,
        hasStarted: true,
        challengeStars: { ...prev.challengeStars, [tierId]: best },
        attemptHistory: appendAttempt(prev.attemptHistory, WorldId.CHALLENGE, tierId, title, stars),
        xp: prev.xp + (gainedNew ? 150 : 40),
      };
    });
  };

  const handleRecordBuildingStars = (challengeId: string, stars: number) => {
    const title = BUILDING_CHALLENGES.find((c) => c.id === challengeId)?.title ?? challengeId;
    setProgress((prev) => {
      const prevMap = prev.buildingStars ?? {};
      const best = Math.max(prevMap[challengeId] ?? 0, stars);
      const gainedNew = !(challengeId in prevMap);
      return {
        ...prev,
        hasStarted: true,
        buildingStars: { ...prevMap, [challengeId]: best },
        attemptHistory: appendAttempt(prev.attemptHistory, WorldId.BUILDING, challengeId, title, stars),
        xp: prev.xp + (gainedNew ? 120 : 30),
      };
    });
  };

  const handleSaveBuilding = (building: SavedBuilding, isUpdate = false) => {
    setProgress((prev) => ({
      ...prev,
      hasStarted: true,
      savedBuildings: upsertSavedBuilding(prev.savedBuildings ?? [], building),
      xp: prev.xp + (isUpdate ? 10 : 40),
    }));
  };

  const handleRenameBuilding = (buildingId: string, nextName: string) => {
    setProgress((prev) => ({
      ...prev,
      savedBuildings: renameSavedBuilding(prev.savedBuildings ?? [], buildingId, nextName),
    }));
  };

  const handleDuplicateBuilding = (buildingId: string) => {
    setProgress((prev) => ({
      ...prev,
      savedBuildings: duplicateSavedBuilding(prev.savedBuildings ?? [], buildingId),
    }));
  };

  const handleDeleteBuilding = (buildingId: string) => {
    setProgress((prev) => ({
      ...prev,
      savedBuildings: (prev.savedBuildings ?? []).filter((b) => b.id !== buildingId),
    }));
  };

  const handleDraftChange = useCallback(
    (challengeId: string, draftShapes: PlacedShape[], locId: BuildingLocationId) => {
      setProgress((prev) => ({
        ...prev,
        hasStarted: prev.hasStarted || draftShapes.length > 0,
        activeBuildingChallengeId: challengeId,
        activeBuildingLocationId: locId,
        draftBuildings: {
          ...(prev.draftBuildings ?? {}),
          [challengeId]: draftShapes,
        },
      }));
    },
    []
  );

  const handleClaimChest = (chestId: string) => {
    const chest = TREASURE_CHESTS.find((c) => c.id === chestId);
    if (!chest) return;
    setProgress((prev) => {
      const opened = prev.openedChests ?? [];
      if (opened.includes(chestId)) return prev;
      const accessories = [...(prev.unlockedAccessories ?? ['syal'])];
      if (chest.unlockAccessory && !accessories.includes(chest.unlockAccessory)) {
        accessories.push(chest.unlockAccessory);
      }
      return {
        ...prev,
        openedChests: [...opened, chestId],
        unlockedAccessories: accessories,
        profile: {
          ...prev.profile,
          activeAccessory: chest.unlockAccessory ?? prev.profile.activeAccessory,
        },
        xp: prev.xp + chest.rewardXp,
      };
    });
  };

  const handleToggleSound = () => {
    setProgress((prev) => ({
      ...prev,
      sound: { ...prev.sound, enabled: !prev.sound.enabled },
    }));
  };

  const handleChangeSound = (sound: SoundSettings) => {
    setProgress((prev) => ({ ...prev, sound }));
  };

  const handleSaveProfile = (
    name: string,
    avatar: AvatarId,
    activeAccessory: HigayonAccessoryId
  ) => {
    setProgress((prev) => ({
      ...prev,
      profile: { name, avatar, activeAccessory },
    }));
    setActiveModal('none');
  };

  const handleResetProgress = () => {
    stopRobotVoice();
    const fresh = resetProgress();
    setProgress(fresh);
    setSaveStatus('saved');
    setLastSavedAt(Date.now());
    setSaveError(null);
    setWorldResetKey((k) => k + 1);
  };

  const getWorldProgressLabel = (): string | undefined => {
    const scoredBuildingTotal = BUILDING_CHALLENGES.filter(
      (c) => c.ruleType !== 'creative'
    ).length;
    const completedBuildingCount = Object.keys(progress.buildingStars ?? {}).filter(
      (id) => id !== 'bld-creative'
    ).length;

    switch (screen) {
      case ScreenView.LEARN:
        return `${progress.learnCompleted.length}/${LEARN_MODULES.length} Modul`;
      case ScreenView.PRACTICE:
        return `${Object.keys(progress.practiceStars).length}/${PRACTICE_TASKS.length} Level`;
      case ScreenView.PUZZLE:
        return `${Object.keys(progress.puzzleStars).length}/${PUZZLE_LEVELS.length} Puzzle`;
      case ScreenView.CHALLENGE:
        return `${Object.keys(progress.challengeStars).length}/${CHALLENGE_TIERS.length} Tingkat`;
      case ScreenView.BUILDING:
        return `${completedBuildingCount}/${scoredBuildingTotal} Misi`;
      default:
        return undefined;
    }
  };

  const activeAccessory = progress.profile.activeAccessory ?? 'syal';

  return (
    <HigayonAccessoryProvider accessory={activeAccessory}>
      <div className="relative min-h-screen text-slate-900">
        <LivingBackground
          screen={screen}
          buildingLocation={buildingLocation}
          animationsEnabled={progress.sound.animationsEnabled !== false}
        />

      {screen === ScreenView.HOME && (
        <HomeScreen
          progress={progress}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          saveError={saveError}
          onStartAdventure={handleStartAdventure}
          onContinueGame={handleContinueGame}
          onNewGame={handleNewGame}
          onSaveProgress={() => performSaveNow(true)}
          onRetrySave={() => performSaveNow(true)}
          onLearnMath={() => enterWorld(WorldId.LEARN)}
          onOpenBuildingCreator={() => enterWorld(WorldId.BUILDING, 'studio')}
          onOpenMyBuildings={() => enterWorld(WorldId.BUILDING, 'collection')}
          onSelectWorld={(world) => enterWorld(world, 'studio')}
          onOpenAchievements={() => {
            sfx.click();
            setActiveModal('achievements');
          }}
          onOpenProgress={() => {
            sfx.click();
            setActiveModal('progress');
          }}
          onOpenAbout={() => {
            sfx.click();
            setActiveModal('about');
          }}
          onOpenSoundSettings={() => {
            sfx.click();
            setActiveModal('sound');
          }}
          onOpenProfile={() => {
            sfx.click();
            setActiveModal('profile');
          }}
        />
      )}

      {screen !== ScreenView.HOME && (
        <>
          <GameHeader
            worldTitle={WORLD_LABELS[screen]}
            progressLabel={getWorldProgressLabel()}
            totalStars={totalStars}
            soundEnabled={progress.sound.enabled}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
            saveError={saveError}
            onSaveProgress={() => performSaveNow(true)}
            onRetrySave={() => performSaveNow(true)}
            onHome={() => {
              stopRobotVoice();
              sfx.click();
              setIsPaused(false);
              setScreen(ScreenView.HOME);
            }}
            onBack={() => {
              stopRobotVoice();
              sfx.click();
              setIsPaused(false);
              setScreen(screen === ScreenView.MAP ? ScreenView.HOME : ScreenView.MAP);
            }}
            onPause={() => {
              stopRobotVoice();
              sfx.click();
              setIsPaused(true);
            }}
            onToggleSound={handleToggleSound}
            onOpenMentor={() => {
              sfx.click();
              setMentorOpen(true);
            }}
          />

          <main className="relative z-10 pb-10">
            {screen === ScreenView.MAP && (
              <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 space-y-5">
                <TutorGuideBar
                  mood="happy"
                  accessory={activeAccessory}
                  message={`Selamat datang di Peta Pulau, ${progress.profile.name}! Kamu sudah mengumpulkan ${totalStars} dari ${maxStars} bintang. Pilih pulau untuk melanjutkan petualangan!`}
                  actionButton={
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          sfx.click();
                          setActiveModal('profile');
                        }}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <User className="h-4 w-4 text-teal-600" aria-hidden="true" />
                        <span>Profil</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sfx.click();
                          setActiveModal('progress');
                        }}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-sky-200 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-900 hover:bg-sky-100 cursor-pointer"
                      >
                        <BarChart3 className="h-4 w-4 text-sky-600" aria-hidden="true" />
                        <span>Progres</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => performSaveNow(true)}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-100 cursor-pointer"
                      >
                        <Save className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                        <span>Save Progress</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sfx.click();
                          setActiveModal('achievements');
                        }}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                      >
                        <Award className="h-4 w-4 text-amber-600" aria-hidden="true" />
                        <span>Pencapaian</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sfx.click();
                          setActiveModal('about');
                        }}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        aria-label="Tentang Aplikasi"
                      >
                        <Info className="h-4 w-4 text-teal-600" aria-hidden="true" />
                        <span>Info</span>
                      </button>
                      <PWAInstallButton />
                    </div>
                  }
                />

                <AdventureMap progress={progress} onSelectWorld={(w) => enterWorld(w, 'studio')} />
              </div>
            )}

            {screen === ScreenView.LEARN && (
              <LearnWorld
                key={`learn-${worldResetKey}`}
                completedModuleIds={progress.learnCompleted}
                onCompleteModule={handleCompleteLearnModule}
                onGoPractice={() => enterWorld(WorldId.PRACTICE)}
              />
            )}

            {screen === ScreenView.PRACTICE && (
              <PracticeWorld
                key={`practice-${worldResetKey}`}
                practiceStars={progress.practiceStars}
                onRecordStars={handleRecordPracticeStars}
                onGoPuzzle={() => enterWorld(WorldId.PUZZLE)}
              />
            )}

            {screen === ScreenView.PUZZLE && (
              <PuzzleWorld
                key={`puzzle-${worldResetKey}`}
                puzzleStars={progress.puzzleStars}
                onRecordStars={handleRecordPuzzleStars}
                onGoChallenge={() => enterWorld(WorldId.CHALLENGE)}
              />
            )}

            {screen === ScreenView.CHALLENGE && (
              <ChallengeWorld
                key={`challenge-${worldResetKey}`}
                challengeStars={progress.challengeStars}
                onRecordStars={handleRecordChallengeStars}
                onOutcomeChange={setIsChallengeOutcome}
                onGoMap={() => {
                  sfx.click();
                  setScreen(ScreenView.MAP);
                }}
              />
            )}

            {screen === ScreenView.BUILDING && (
              <BuildingWorld
                key={`building-${worldResetKey}`}
                progress={progress}
                initialTab={buildingInitialTab}
                onRecordBuildingStars={handleRecordBuildingStars}
                onSaveBuilding={handleSaveBuilding}
                onRenameBuilding={handleRenameBuilding}
                onDuplicateBuilding={handleDuplicateBuilding}
                onDeleteBuilding={handleDeleteBuilding}
                onDraftChange={handleDraftChange}
                onClaimChest={handleClaimChest}
                onLocationChange={setBuildingLocation}
                onContextChange={setMentorContext}
              />
            )}
          </main>
        </>
      )}

      {/* Non-blocking Save Progress Toast */}
      {saveToast && (
        <div
          role="status"
          data-testid="save-progress-toast"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-2xl border-2 border-emerald-400 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-emerald-950 shadow-xl max-w-md w-[calc(100%-2rem)]"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <span className="flex-1">{saveToast}</span>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Tutup notifikasi simpan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {isPaused && (
        <PauseModal
          worldLabel={WORLD_LABELS[screen]}
          accessory={activeAccessory}
          onResume={() => {
            sfx.click();
            setIsPaused(false);
          }}
          onSaveProgress={() => performSaveNow(true)}
          onRestart={
            screen !== ScreenView.MAP && screen !== ScreenView.HOME
              ? () => {
                  sfx.click();
                  setWorldResetKey((k) => k + 1);
                  setIsPaused(false);
                }
              : undefined
          }
          onGoMap={() => {
            sfx.click();
            setIsPaused(false);
            setScreen(ScreenView.MAP);
          }}
          onGoHome={() => {
            sfx.click();
            setIsPaused(false);
            setScreen(ScreenView.HOME);
          }}
        />
      )}

      {activeModal === 'achievements' && (
        <AchievementModal
          progress={progress}
          onClose={() => {
            sfx.click();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'profile' && (
        <ProfileModal
          progress={progress}
          onSaveProfile={handleSaveProfile}
          onClose={() => {
            sfx.click();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'sound' && (
        <SoundModal
          sound={progress.sound}
          onChangeSound={handleChangeSound}
          onClose={() => {
            sfx.click();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'progress' && (
        <ProgressModal
          progress={progress}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          saveError={saveError}
          onSaveProgress={() => performSaveNow(true)}
          onRetrySave={() => performSaveNow(true)}
          onResetProgress={handleResetProgress}
          onClose={() => {
            sfx.click();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'about' && (
        <AboutCreditsModal
          accessory={activeAccessory}
          onClose={() => {
            sfx.click();
            setActiveModal('none');
          }}
        />
      )}

      <AIMentorDrawer
        open={mentorOpen}
        onClose={() => {
          stopRobotVoice();
          setMentorOpen(false);
        }}
        world={screenToWorld(screen)}
        levelId={mentorContext.levelId}
        levelTitle={mentorContext.levelTitle}
        lastError={mentorContext.lastError}
        placedShapes={mentorContext.placedShapes}
        progress={progress}
      />

      <OfflineIndicator />
      </div>
    </HigayonAccessoryProvider>
  );
}
