import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  Box,
  Check,
  CheckSquare,
  Compass,
  Copy,
  Edit3,
  FolderHeart,
  Gift,
  Grid,
  Layers,
  Lightbulb,
  Lock,
  Magnet,
  Maximize2,
  Minimize2,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Save,
  Sparkles,
  Square,
  Star,
  Trash2,
  Undo2,
  Wand2,
} from 'lucide-react';
import {
  BUILDING_CHALLENGES,
  BUILDING_LOCATIONS,
  CANVAS_GRID_COLS,
  CANVAS_GRID_ROWS,
  EXTRA_BUILDING_IDEAS,
  SHAPES_2D,
  SHAPE_COLORS,
  SOLID_SHAPES_3D,
  TREASURE_CHESTS,
} from '../game/buildingData';
import {
  getBuildingContextualHint,
  getShapeAreaEstimate,
  validateBuildingChallenge,
} from '../game/buildingValidation';
import { sfx } from '../game/sound';
import {
  formatSavedTimestamp,
  HIGAYON_BUILDING_SAVED_MSG,
  HIGAYON_OBJECT_DELETED_MSG,
  isChestReady,
  isLocationUnlocked,
} from '../game/storage';
import type {
  BuildingLocationId,
  GameProgress,
  PlacedShape,
  SavedBuilding,
  Shape2DId,
  TutorMood,
  ValidationResult,
} from '../game/types';
import { speakRobot } from '../game/voice';
import { BuildingCanvas } from './BuildingCanvas';
import { Shape2DFigure, Shape2DThumbnail, SolidShape3DIllustration } from './Shape2DRenderer';
import { TutorGuideBar } from './TutorRobot';

export type BuildingWorldTab = 'studio' | 'collection' | 'solids3d';

interface BuildingWorldProps {
  progress: GameProgress;
  initialTab?: BuildingWorldTab;
  onRecordBuildingStars: (challengeId: string, stars: number) => void;
  onSaveBuilding: (building: SavedBuilding, isUpdate?: boolean) => void;
  onRenameBuilding: (buildingId: string, nextName: string) => void;
  onDuplicateBuilding: (buildingId: string) => void;
  onDeleteBuilding: (buildingId: string) => void;
  onDraftChange: (
    challengeId: string,
    shapes: PlacedShape[],
    locationId: BuildingLocationId
  ) => void;
  onClaimChest: (chestId: string) => void;
  onLocationChange?: (loc: BuildingLocationId) => void;
  onContextChange?: (ctx: {
    levelId?: string;
    levelTitle?: string;
    placedShapes?: PlacedShape[];
    lastError?: string;
  }) => void;
}

let nextUid = 1;
function makeShapeId() {
  nextUid += 1;
  return `shp-${Date.now()}-${nextUid}`;
}

function createPlacedShape(type: Shape2DId, cx = 6, cy = 5): PlacedShape {
  const def = SHAPES_2D.find((s) => s.id === type) ?? SHAPES_2D[0];
  return {
    id: makeShapeId(),
    type,
    cx,
    cy,
    width: def.defaultWidth,
    height: def.defaultHeight,
    radius: def.isCircle ? def.defaultRadius ?? 1 : undefined,
    rotation: 0,
    color: def.defaultColor,
  };
}

export const BuildingWorld: React.FC<BuildingWorldProps> = ({
  progress,
  initialTab = 'studio',
  onRecordBuildingStars,
  onSaveBuilding,
  onRenameBuilding,
  onDuplicateBuilding,
  onDeleteBuilding,
  onDraftChange,
  onClaimChest,
  onLocationChange,
  onContextChange,
}) => {
  const initialLocation =
    progress.activeBuildingLocationId &&
    isLocationUnlocked(progress.activeBuildingLocationId, progress)
      ? progress.activeBuildingLocationId
      : 'geometry-village';

  const initialChallenge =
    BUILDING_CHALLENGES.find(
      (c) => c.id === progress.activeBuildingChallengeId && c.locationId === initialLocation
    )?.id ??
    BUILDING_CHALLENGES.find((c) => c.locationId === initialLocation)?.id ??
    BUILDING_CHALLENGES[0].id;

  const [activeTab, setActiveTab] = useState<BuildingWorldTab>(initialTab);
  const [locationId, setLocationId] = useState<BuildingLocationId>(initialLocation);

  const locationChallenges = useMemo(
    () => BUILDING_CHALLENGES.filter((c) => c.locationId === locationId),
    [locationId]
  );

  const [challengeId, setChallengeId] = useState<string>(initialChallenge);
  const currentChallenge = useMemo(
    () =>
      BUILDING_CHALLENGES.find((c) => c.id === challengeId) ??
      locationChallenges[0] ??
      BUILDING_CHALLENGES[0],
    [challengeId, locationChallenges]
  );

  // Canvas shape state + undo/redo stacks (initialized from saved draft if any)
  const [shapes, setShapes] = useState<PlacedShape[]>(
    () => progress.draftBuildings?.[initialChallenge] ?? []
  );
  const [undoStack, setUndoStack] = useState<PlacedShape[][]>([]);
  const [redoStack, setRedoStack] = useState<PlacedShape[][]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [inspectedShapeType, setInspectedShapeType] = useState<Shape2DId>('persegi');
  const [pendingPlaceType, setPendingPlaceType] = useState<Shape2DId | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [saveName, setSaveName] = useState('');
  const [editingSavedId, setEditingSavedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ValidationResult | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [deleteSavedTarget, setDeleteSavedTarget] = useState<SavedBuilding | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [tutorOverride, setTutorOverride] = useState<{
    mood: TutorMood;
    message: string;
  } | null>(null);

  const dragSnapshotRef = useRef<PlacedShape[] | null>(null);
  const shapesRef = useRef<PlacedShape[]>(shapes);
  shapesRef.current = shapes;

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Keep draft synchronized with App progress for Auto Save & Continue Game
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;
  const isFirstDraftSyncRef = useRef(true);
  useEffect(() => {
    if (isFirstDraftSyncRef.current) {
      isFirstDraftSyncRef.current = false;
      return;
    }
    onDraftChangeRef.current(challengeId, shapes, locationId);
  }, [challengeId, shapes, locationId]);

  const syncContext = (nextShapes: PlacedShape[], lastError?: string) => {
    onContextChange?.({
      levelId: currentChallenge.id,
      levelTitle: currentChallenge.title,
      placedShapes: nextShapes,
      lastError,
    });
  };

  const commitShapes = (nextShapes: PlacedShape[], prevSnapshot?: PlacedShape[]) => {
    const snapshot = prevSnapshot ?? shapesRef.current;
    setUndoStack((prev) => [...prev.slice(-29), structuredClone(snapshot)]);
    setRedoStack([]);
    setShapes(nextShapes);
    setFeedback(null);
    syncContext(nextShapes);
  };

  const handleSelectLocation = (id: BuildingLocationId) => {
    if (!isLocationUnlocked(id, progress)) {
      sfx.error();
      const loc = BUILDING_LOCATIONS.find((l) => l.id === id);
      const msg = loc
        ? `${loc.name} masih terkunci! ${loc.unlockRequirementText}.`
        : 'Lokasi ini masih terkunci!';
      setTutorOverride({ mood: 'encourage', message: msg });
      speakRobot(msg, { fromUserAction: true });
      return;
    }
    sfx.click();
    setLocationId(id);
    onLocationChange?.(id);
    const first = BUILDING_CHALLENGES.find((c) => c.locationId === id);
    if (first) {
      setChallengeId(first.id);
      setShapes(progress.draftBuildings?.[first.id] ?? []);
      setUndoStack([]);
      setRedoStack([]);
      setSelectedIds([]);
      setEditingSavedId(null);
      setFeedback(null);
      setTutorOverride({
        mood: 'happy',
        message: `Selamat datang di ${BUILDING_LOCATIONS.find((l) => l.id === id)?.name}! ${first.instruction}`,
      });
    }
  };

  const handleSelectChallenge = (id: string) => {
    sfx.click();
    const target = BUILDING_CHALLENGES.find((c) => c.id === id);
    if (!target) return;
    setChallengeId(id);
    setShapes(progress.draftBuildings?.[id] ?? []);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedIds([]);
    setEditingSavedId(null);
    setFeedback(null);
    setTutorOverride({ mood: 'guide', message: target.instruction });
  };

  const handleSelectShape = (id: string | null, toggle = false) => {
    if (id === null) {
      setSelectedIds([]);
      return;
    }
    const found = shapes.find((s) => s.id === id);
    if (found) setInspectedShapeType(found.type);

    if (toggle) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleAddShapeInstant = (type: Shape2DId) => {
    sfx.tileTap(shapes.length % 6);
    setInspectedShapeType(type);
    const slot = shapes.length % 9;
    const col = slot % 3;
    const row = Math.floor(slot / 3);
    const cx = 2.5 + col * 3;
    const cy = 2.5 + row * 2.2;
    const item = createPlacedShape(type, cx, cy);
    const next = [...shapes, item];
    commitShapes(next);
    setSelectedIds([item.id]);
    setPendingPlaceType(null);
  };

  const handlePlaceAt = (type: Shape2DId, cx: number, cy: number) => {
    sfx.tileTap(shapes.length % 6);
    setInspectedShapeType(type);
    const item = createPlacedShape(type, cx, cy);
    const next = [...shapes, item];
    commitShapes(next);
    setSelectedIds([item.id]);
    setPendingPlaceType(null);
  };

  const handleMoveStart = () => {
    dragSnapshotRef.current = structuredClone(shapesRef.current);
  };

  const handleMoveShape = (id: string, cx: number, cy: number) => {
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, cx, cy } : s)));
    setFeedback(null);
  };

  const handleMoveCommit = () => {
    if (!dragSnapshotRef.current) return;
    const prevSnapshot = dragSnapshotRef.current;
    dragSnapshotRef.current = null;
    setUndoStack((prev) => [...prev.slice(-29), prevSnapshot]);
    setRedoStack([]);
    syncContext(shapesRef.current);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    sfx.click();
    const previous = undoStack[undoStack.length - 1];
    const previousIds = new Set(previous.map((s) => s.id));
    setRedoStack((prev) => [...prev, structuredClone(shapes)]);
    setUndoStack((prev) => prev.slice(0, -1));
    setShapes(previous);
    setSelectedIds((prev) => prev.filter((id) => previousIds.has(id)));
    setFeedback(null);
    syncContext(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    sfx.click();
    const next = redoStack[redoStack.length - 1];
    const nextIds = new Set(next.map((s) => s.id));
    setUndoStack((prev) => [...prev, structuredClone(shapes)]);
    setRedoStack((prev) => prev.slice(0, -1));
    setShapes(next);
    setSelectedIds((prev) => prev.filter((id) => nextIds.has(id)));
    setFeedback(null);
    syncContext(next);
  };

  const handleConfirmClearAll = () => {
    sfx.tileErase();
    commitShapes([]);
    setSelectedIds([]);
    setConfirmClearOpen(false);
    setTutorOverride({
      mood: 'encourage',
      message: HIGAYON_OBJECT_DELETED_MSG,
    });
  };

  const handleLoadBlueprint = () => {
    if (!currentChallenge.starterBlueprint) return;
    sfx.step();
    const loaded: PlacedShape[] = currentChallenge.starterBlueprint.map((item) => ({
      ...item,
      id: makeShapeId(),
    }));
    commitShapes(loaded);
    setSelectedIds(loaded[0] ? [loaded[0].id] : []);
    const msg = `Cetak biru ${currentChallenge.blueprintName} dimuat! Kamu masih bisa menggeser, memutar, atau mengubah ukuran tiap bentuk.`;
    setTutorOverride({ mood: 'guide', message: msg });
    speakRobot(msg, { fromUserAction: true });
  };

  const handleLoadExtraIdea = (ideaIndex: number) => {
    const idea = EXTRA_BUILDING_IDEAS[ideaIndex];
    if (!idea) return;
    sfx.step();
    const loaded: PlacedShape[] = idea.shapes.map((item) => ({
      ...item,
      id: makeShapeId(),
    }));
    commitShapes(loaded);
    setSelectedIds(loaded[0] ? [loaded[0].id] : []);
  };

  const selectedShapes = useMemo(() => {
    const idSet = new Set(selectedIds);
    return shapes.filter((s) => idSet.has(s.id));
  }, [shapes, selectedIds]);

  const primarySelectedId = selectedIds[selectedIds.length - 1] ?? null;
  const selectedShape = useMemo(
    () => shapes.find((s) => s.id === primarySelectedId) ?? selectedShapes[0] ?? null,
    [shapes, primarySelectedId, selectedShapes]
  );

  const inspectedDef = useMemo(
    () => SHAPES_2D.find((s) => s.id === (selectedShape?.type ?? inspectedShapeType)) ?? SHAPES_2D[0],
    [selectedShape, inspectedShapeType]
  );

  const updateSelectedShape = (updater: (shape: PlacedShape) => PlacedShape) => {
    if (!selectedShape) return;
    const next = shapes.map((s) => (s.id === selectedShape.id ? updater(s) : s));
    commitShapes(next);
  };

  const handleResize = (axis: 'both' | 'w' | 'h', delta: number) => {
    if (!selectedShape) return;
    const def = SHAPES_2D.find((s) => s.id === selectedShape.type) ?? SHAPES_2D[0];
    sfx.click();
    updateSelectedShape((s) => {
      if (s.type === 'lingkaran') {
        const currentR = s.radius ?? s.width / 2;
        const nextR = Number(
          Math.min(def.maxSize, Math.max(def.minSize, currentR + delta * 0.5)).toFixed(2)
        );
        return {
          ...s,
          radius: nextR,
          width: nextR * 2,
          height: nextR * 2,
        };
      }
      const nextW =
        axis === 'h'
          ? s.width
          : Number(Math.min(def.maxSize, Math.max(def.minSize, s.width + delta)).toFixed(2));
      const nextH =
        axis === 'w'
          ? s.height
          : Number(Math.min(def.maxSize, Math.max(def.minSize, s.height + delta)).toFixed(2));
      return { ...s, width: nextW, height: nextH };
    });
  };

  const handleRotate = (deg: number) => {
    if (!selectedShape) return;
    sfx.click();
    updateSelectedShape((s) => ({
      ...s,
      rotation: (s.rotation + deg + 360) % 360,
    }));
  };

  const handleDeleteSelectedShapes = () => {
    if (selectedIds.length === 0) return;
    const selectedSet = new Set(selectedIds);
    const remaining = shapes.filter((s) => !selectedSet.has(s.id));
    sfx.tileErase();
    commitShapes(remaining);
    setSelectedIds([]);
    setTutorOverride({
      mood: 'encourage',
      message: HIGAYON_OBJECT_DELETED_MSG,
    });
  };

  // Keyboard shortcuts: Delete / Backspace removes selected shapes; Ctrl+Z / Ctrl+Y undo/redo
  useEffect(() => {
    if (activeTab !== 'studio' || confirmClearOpen || deleteSavedTarget) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        e.preventDefault();
        handleDeleteSelectedShapes();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleLayerOrder = (dir: 'front' | 'back') => {
    if (!selectedShape) return;
    sfx.click();
    const others = shapes.filter((s) => s.id !== selectedShape.id);
    commitShapes(dir === 'front' ? [...others, selectedShape] : [selectedShape, ...others]);
  };

  const handleCheckBuilding = () => {
    const result = validateBuildingChallenge(currentChallenge, shapes);
    setFeedback(result);
    syncContext(shapes, result.passed ? undefined : result.feedbackDetail);

    if (result.passed) {
      sfx.buildingComplete();
      if (currentChallenge.ruleType !== 'creative') {
        onRecordBuildingStars(currentChallenge.id, 3);
      }
      setTutorOverride({
        mood: 'celebrate',
        message: `${result.feedbackTitle} ${result.feedbackDetail}`,
      });
      speakRobot(`${result.feedbackTitle} ${result.feedbackDetail}`, { fromUserAction: true });
    } else {
      sfx.error();
      setTutorOverride({
        mood: 'encourage',
        message: `${result.feedbackTitle} ${result.feedbackDetail}`,
      });
      speakRobot(result.feedbackDetail, { fromUserAction: true });
    }
  };

  const handleAskHint = () => {
    sfx.click();
    const hint = getBuildingContextualHint(currentChallenge.id, shapes);
    setTutorOverride({ mood: 'thinking', message: hint });
    speakRobot(hint, { fromUserAction: true });
  };

  const editingSavedItem = useMemo(
    () => (progress.savedBuildings ?? []).find((b) => b.id === editingSavedId) ?? null,
    [progress.savedBuildings, editingSavedId]
  );

  const handleSaveToCollection = (e: React.FormEvent, asNew = false) => {
    e.preventDefault();
    if (shapes.length === 0) {
      sfx.error();
      setTutorOverride({
        mood: 'encourage',
        message: 'Tambahkan minimal satu bentuk geometri sebelum menyimpan bangunanmu!',
      });
      return;
    }
    sfx.collectStar();
    const now = Date.now();
    const isUpdating = Boolean(editingSavedItem && !asNew);
    const defaultName = `${currentChallenge.blueprintName} #${(progress.savedBuildings?.length ?? 0) + 1}`;
    const finalName = saveName.trim() || editingSavedItem?.name || defaultName;
    const item: SavedBuilding = {
      id: isUpdating && editingSavedItem ? editingSavedItem.id : `bld-save-${now}`,
      name: finalName,
      locationId,
      challengeId: currentChallenge.id,
      createdAt: isUpdating && editingSavedItem ? editingSavedItem.createdAt : now,
      updatedAt: now,
      shapes: structuredClone(shapes),
    };
    onSaveBuilding(item, isUpdating);
    setEditingSavedId(item.id);
    setSaveName(item.name);
    setTutorOverride({ mood: 'celebrate', message: HIGAYON_BUILDING_SAVED_MSG });
    speakRobot(HIGAYON_BUILDING_SAVED_MSG, { fromUserAction: true });
  };

  const handleLoadSaved = (saved: SavedBuilding) => {
    sfx.levelUnlock();
    setLocationId(saved.locationId);
    onLocationChange?.(saved.locationId);
    if (saved.challengeId && BUILDING_CHALLENGES.some((c) => c.id === saved.challengeId)) {
      setChallengeId(saved.challengeId);
    }
    const restored = saved.shapes.map((s) => ({ ...s, id: makeShapeId() }));
    setShapes(restored);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedIds([]);
    setEditingSavedId(saved.id);
    setSaveName(saved.name);
    setActiveTab('studio');
    setTutorOverride({
      mood: 'happy',
      message: `Bangunan "${saved.name}" berhasil dibuka kembali di kanvas! Kamu bisa melanjutkannya sekarang.`,
    });
  };

  const currentTutorMood: TutorMood = tutorOverride
    ? tutorOverride.mood
    : feedback
    ? feedback.passed
      ? 'celebrate'
      : 'encourage'
    : 'guide';

  const currentTutorMsg =
    tutorOverride?.message ?? currentChallenge.instruction;

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 py-3.5 sm:px-6 space-y-3.5">
      {/* Top Exploration Location Cards (Compact 4 Areas) */}
      <section aria-label="Pilih Lokasi Building World">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {BUILDING_LOCATIONS.map((loc) => {
            const unlocked = isLocationUnlocked(loc.id, progress);
            const active = locationId === loc.id && activeTab === 'studio';
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => {
                  setActiveTab('studio');
                  handleSelectLocation(loc.id);
                }}
                className={`flex flex-col justify-between rounded-xl border-2 px-3 py-2.5 text-left transition cursor-pointer ${
                  !unlocked
                    ? 'border-slate-300 bg-slate-100/90 text-slate-600'
                    : active
                    ? 'border-teal-600 bg-white shadow-sm ring-2 ring-teal-200'
                    : 'border-teal-200 bg-white/95 hover:border-teal-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="font-display text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {loc.name}
                  </div>
                  {!unlocked ? (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-label="Terkunci" />
                  ) : (
                    <Compass className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden="true" />
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-600 truncate">
                  {unlocked ? loc.subtitle : loc.unlockRequirementText}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* World Sub-Navigation Tabs: Building Creator / My Buildings & Peti / Bangun Ruang 3D */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            sfx.click();
            setActiveTab('studio');
          }}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold cursor-pointer ${
            activeTab === 'studio'
              ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
              : 'border-teal-200 bg-white text-slate-700 hover:bg-teal-50'
          }`}
        >
          <Grid className="h-4 w-4" aria-hidden="true" />
          <span>Building Creator · Build Your Own City</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sfx.click();
            setActiveTab('collection');
          }}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold cursor-pointer ${
            activeTab === 'collection'
              ? 'border-amber-600 bg-amber-500 text-slate-950 shadow-sm'
              : 'border-amber-200 bg-white text-slate-700 hover:bg-amber-50'
          }`}
        >
          <FolderHeart className="h-4 w-4" aria-hidden="true" />
          <span>
            My Buildings ({progress.savedBuildings?.length ?? 0}) &amp; Peti Harta
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sfx.click();
            setActiveTab('solids3d');
          }}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold cursor-pointer ${
            activeTab === 'solids3d'
              ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
              : 'border-violet-200 bg-white text-slate-700 hover:bg-violet-50'
          }`}
        >
          <Box className="h-4 w-4" aria-hidden="true" />
          <span>Bangun Ruang 3D (Modul Terpisah)</span>
        </button>
      </div>

      {/* HIGAYON Tutor Guide Bar */}
      <TutorGuideBar
        mood={currentTutorMood}
        message={currentTutorMsg}
        accessory={progress.profile.activeAccessory ?? 'syal'}
        actionButton={
          <button
            type="button"
            onClick={handleAskHint}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
          >
            <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Petunjuk HIGAYON</span>
          </button>
        }
      />

      {/* ================= TAB 1: STUDIO BANGUN KOTA 2D ================= */}
      {activeTab === 'studio' && (
        <div className="space-y-4">
          {/* Challenge Selector Bar for Selected Location */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-teal-100 bg-white/95 p-3.5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {locationChallenges.map((ch) => {
                const isCurr = ch.id === currentChallenge.id;
                const stars = progress.buildingStars?.[ch.id] ?? 0;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSelectChallenge(ch.id)}
                    className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border-2 px-3.5 py-1.5 text-xs sm:text-sm font-bold cursor-pointer ${
                      isCurr
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-teal-50'
                    }`}
                  >
                    <span>{ch.title}</span>
                    {stars > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-amber-300">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentChallenge.starterBlueprint && (
                <button
                  type="button"
                  onClick={handleLoadBlueprint}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-900 hover:bg-sky-100 cursor-pointer"
                >
                  <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Muat Contoh Blueprint</span>
                </button>
              )}
              {locationId === 'creative-zone' &&
                EXTRA_BUILDING_IDEAS.map((idea, idx) => (
                  <button
                    key={idea.name}
                    type="button"
                    onClick={() => handleLoadExtraIdea(idx)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Contoh: {idea.name}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Main 12-Col Studio Grid: Canvas first on mobile, side-by-side on lg+ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Panel on desktop, below canvas on mobile */}
            <div className="order-2 lg:order-1 lg:col-span-4 space-y-4">
              <div className="rounded-2xl border-2 border-teal-200 bg-white/95 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    9 Bentuk Geometri 2D
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Klik untuk tambah
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {SHAPES_2D.map((shapeDef) => {
                    const isPlacing = pendingPlaceType === shapeDef.id;
                    return (
                      <button
                        key={shapeDef.id}
                        type="button"
                        onClick={() => handleAddShapeInstant(shapeDef.id)}
                        onDoubleClick={() => setPendingPlaceType(isPlacing ? null : shapeDef.id)}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition hover:bg-teal-50 cursor-pointer ${
                          inspectedDef.id === shapeDef.id
                            ? 'border-teal-600 bg-teal-50/80'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <Shape2DThumbnail type={shapeDef.id} color={shapeDef.defaultColor} size={40} />
                        <span className="mt-1 text-[11px] font-bold text-slate-800 leading-tight">
                          {shapeDef.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Click-to-place toggle helper */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setPendingPlaceType((prev) =>
                        prev === inspectedDef.id ? null : inspectedDef.id
                      )
                    }
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer ${
                      pendingPlaceType === inspectedDef.id
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {pendingPlaceType === inspectedDef.id
                        ? 'Mode Klik Grid Aktif'
                        : `Taruh ${inspectedDef.name} via Klik Grid`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Educational Info Card for Currently Inspected / Selected Shape */}
              <div className="rounded-2xl border-2 border-sky-200 bg-white/95 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 border border-sky-200">
                    <Shape2DThumbnail type={inspectedDef.id} color={inspectedDef.defaultColor} size={40} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-sky-700">
                      Ensiklopedia Bangun Datar
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      {inspectedDef.name}
                    </h3>
                  </div>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-slate-700 leading-snug">
                  {inspectedDef.explanation}
                </p>
                <ul className="mt-2.5 space-y-1 text-xs text-slate-700">
                  {inspectedDef.characteristics.map((c) => (
                    <li key={c} className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <strong>Contoh di Bangunan:</strong> {inspectedDef.buildingExample}
                </div>
              </div>

              {/* Challenge Requirements Checklist */}
              <div className="rounded-2xl border-2 border-emerald-200 bg-white/95 p-4 shadow-sm">
                <h3 className="font-display text-sm font-bold text-slate-900 mb-2">
                  Target Misi · {currentChallenge.blueprintName}
                </h3>
                <ul className="space-y-1 text-xs text-slate-700">
                  {currentChallenge.requiredShapesSummary.map((req) => (
                    <li key={req} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Panel (Canvas + Controls): shown first on mobile */}
            <div className="order-1 lg:order-2 lg:col-span-8 space-y-3">
              {/* Mobile Quick Shape Strip so shapes + canvas are immediately usable together */}
              <div className="lg:hidden rounded-2xl border-2 border-teal-200 bg-white/95 p-2.5 shadow-sm">
                <div className="text-[11px] font-bold text-slate-600 mb-1.5">
                  Tambah Bentuk Geometri 2D:
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto md:flex-wrap md:overflow-visible pb-1">
                  {SHAPES_2D.map((shapeDef) => (
                    <button
                      key={`mob-${shapeDef.id}`}
                      type="button"
                      onClick={() => handleAddShapeInstant(shapeDef.id)}
                      className="flex shrink-0 flex-col items-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-center hover:bg-teal-50 cursor-pointer"
                    >
                      <Shape2DThumbnail type={shapeDef.id} color={shapeDef.defaultColor} size={28} />
                      <span className="mt-0.5 text-[10px] font-bold text-slate-800 whitespace-nowrap">
                        {shapeDef.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Top Canvas Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-teal-200 bg-white/95 px-3.5 py-2.5 shadow-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    aria-label="Urungkan tindakan"
                  >
                    <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Undo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    aria-label="Ulangi tindakan"
                  >
                    <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Redo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setMultiSelectMode((v) => !v);
                    }}
                    aria-pressed={multiSelectMode}
                    className={`inline-flex min-h-[40px] items-center gap-1 rounded-xl border px-2.5 text-xs font-bold cursor-pointer ${
                      multiSelectMode
                        ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-sky-50'
                    }`}
                  >
                    {multiSelectMode ? (
                      <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Square className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>Pilih Banyak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setSnapToGrid((v) => !v);
                    }}
                    className={`inline-flex min-h-[40px] items-center gap-1 rounded-xl border px-2.5 text-xs font-bold cursor-pointer ${
                      snapToGrid
                        ? 'border-teal-500 bg-teal-50 text-teal-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <Magnet className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Snap Grid: {snapToGrid ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setConfirmClearOpen(true);
                    }}
                    disabled={shapes.length === 0}
                    data-testid="clear-all-btn"
                    className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-40 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Clear All</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCheckBuilding}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border-b-4 border-emerald-800 bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 active:translate-y-0.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {currentChallenge.ruleType === 'creative'
                      ? 'Periksa Karya Kreatif'
                      : 'Periksa Bangunan'}
                  </span>
                </button>
              </div>

              {/* Quick Object Management Bar for Touchscreen & Selection Control */}
              {shapes.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-700">
                      Total di kanvas: <span className="font-mono-num text-teal-700">{shapes.length}</span>
                      {selectedIds.length > 0 && (
                        <>
                          {' '}· Terpilih:{' '}
                          <span className="font-mono-num text-sky-700">{selectedIds.length}</span>
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setSelectedIds(shapes.map((s) => s.id));
                      }}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    {selectedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          sfx.click();
                          setSelectedIds([]);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Batal Pilih
                      </button>
                    )}
                  </div>

                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSelectedShapes}
                      data-testid="delete-selected-btn"
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border-2 border-rose-300 bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {selectedIds.length > 1
                          ? `Delete Selected (${selectedIds.length})`
                          : 'Delete'}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Interactive SVG Canvas */}
              <BuildingCanvas
                shapes={shapes}
                selectedIds={selectedIds}
                multiSelectMode={multiSelectMode}
                snapToGrid={snapToGrid}
                pendingPlaceType={pendingPlaceType}
                locationTheme={locationId}
                onSelectShape={handleSelectShape}
                onPlaceShapeAt={handlePlaceAt}
                onMoveStart={handleMoveStart}
                onMoveShape={handleMoveShape}
                onMoveCommit={handleMoveCommit}
              />

              {/* Selected Shape Controls (Rotate, Resize, Layer, Color, Delete) */}
              {selectedIds.length > 1 ? (
                <div className="rounded-2xl border-2 border-sky-300 bg-sky-50/90 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {selectedIds.length} Objek Dipilih Sekaligus
                    </div>
                    <p className="text-xs text-slate-600">
                      Ketuk bentuk lain untuk menambah/mengurangi pilihan, atau hapus semua objek yang dipilih sekaligus.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteSelectedShapes}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-rose-700 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span>Delete Selected ({selectedIds.length})</span>
                  </button>
                </div>
              ) : selectedShape ? (
                <div className="rounded-2xl border-2 border-teal-300 bg-white/95 p-3.5 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      Bentuk Dipilih:{' '}
                      <span className="text-teal-700">
                        {SHAPES_2D.find((d) => d.id === selectedShape.type)?.name}
                      </span>{' '}
                      <span className="font-mono-num text-slate-600">
                        {selectedShape.type === 'lingkaran'
                          ? `· Pusat (${selectedShape.cx}, ${selectedShape.cy}) · Jari-jari r = ${selectedShape.radius ?? selectedShape.width / 2} · Luas ≈ ${getShapeAreaEstimate(selectedShape)}`
                          : `· Ukuran ${selectedShape.width} × ${selectedShape.height} · Putar ${selectedShape.rotation}° · Luas ≈ ${getShapeAreaEstimate(selectedShape)}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteSelectedShapes}
                      data-testid="delete-single-btn"
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border-2 border-rose-300 bg-rose-50 px-3.5 text-xs font-bold text-rose-800 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Delete Bentuk</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Resize controls */}
                    <button
                      type="button"
                      onClick={() => handleResize('both', -0.5)}
                      className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                    >
                      <Minimize2 className="h-3.5 w-3.5" />
                      <span>Perkecil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResize('both', 0.5)}
                      className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span>Perbesar</span>
                    </button>

                    {selectedShape.type !== 'lingkaran' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleResize('w', 0.5)}
                          className="inline-flex min-h-[38px] items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                        >
                          Lebar +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResize('h', 0.5)}
                          className="inline-flex min-h-[38px] items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                        >
                          Tinggi +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRotate(-45)}
                          className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>-45°</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRotate(45)}
                          className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                          <span>+45°</span>
                        </button>
                      </>
                    )}

                    {/* Layer Ordering */}
                    <button
                      type="button"
                      onClick={() => handleLayerOrder('front')}
                      className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                    >
                      <ArrowUpToLine className="h-3.5 w-3.5" />
                      <span>Depan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLayerOrder('back')}
                      className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                      <span>Belakang</span>
                    </button>
                  </div>

                  {/* Color Palette */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-600 mr-1">Warna:</span>
                    {SHAPE_COLORS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          sfx.click();
                          updateSelectedShape((s) => ({ ...s, color: hex }));
                        }}
                        className={`h-8 w-8 rounded-lg border-2 cursor-pointer ${
                          selectedShape.color === hex
                            ? 'border-slate-900 scale-110'
                            : 'border-white shadow-sm'
                        }`}
                        style={{ backgroundColor: hex }}
                        aria-label={`Ubah warna ke ${hex}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white/85 px-4 py-2.5 text-xs text-slate-600">
                  Klik atau ketuk bentuk di grid untuk memilih, mengubah ukuran, memutar, mengganti warna, atau menghapus. Aktifkan <strong>Pilih Banyak</strong> (atau Shift+Klik) untuk memilih beberapa objek sekaligus.
                </div>
              )}

              {/* Validation Feedback Banner */}
              {feedback && (
                <div
                  role="status"
                  className={`rounded-2xl border-2 p-4 shadow-sm ${
                    feedback.passed
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                      : 'border-amber-300 bg-amber-50 text-amber-950'
                  }`}
                >
                  <div className="font-display text-base font-bold">
                    {feedback.feedbackTitle}
                  </div>
                  <p className="mt-1 text-sm">{feedback.feedbackDetail}</p>
                </div>
              )}

              {/* Save Building Form */}
              <form
                onSubmit={(e) => handleSaveToCollection(e, false)}
                className="space-y-2 rounded-2xl border-2 border-teal-100 bg-white/95 p-3 shadow-sm"
              >
                {editingSavedItem && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-teal-800 bg-teal-50 rounded-xl px-3 py-1.5">
                    <span>
                      Sedang mengedit bangunan tersimpan: <strong>{editingSavedItem.name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSavedId(null);
                        setSaveName('');
                      }}
                      className="font-bold text-slate-600 underline cursor-pointer"
                    >
                      Buat entri baru
                    </button>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    maxLength={32}
                    placeholder={`Beri nama bangunanmu (mis: ${currentChallenge.blueprintName})`}
                    aria-label="Nama bangunan untuk disimpan"
                    className="flex-1 min-h-[42px] rounded-xl border border-slate-300 px-3 text-sm font-medium text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    data-testid="save-building-btn"
                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 cursor-pointer shrink-0"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>{editingSavedItem ? 'Perbarui Bangunan' : 'Save Building'}</span>
                  </button>
                  {editingSavedItem && (
                    <button
                      type="button"
                      onClick={(e) => handleSaveToCollection(e as unknown as React.FormEvent, true)}
                      className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border-2 border-teal-600 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-teal-800 hover:bg-teal-50 cursor-pointer shrink-0"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>Simpan Baru</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: KOLEKSI BANGUNAN & PETI HARTA KARUN ================= */}
      {activeTab === 'collection' && (
        <div className="space-y-6">
          {/* Treasure Chests Section */}
          <section className="rounded-3xl border-2 border-amber-200 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-amber-600" aria-hidden="true" />
              <h2 className="font-display text-xl font-bold text-slate-900">
                Peti Harta Karun &amp; Hadiah Aksesori HIGAYON
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TREASURE_CHESTS.map((chest) => {
                const opened = (progress.openedChests ?? []).includes(chest.id);
                const ready = !opened && isChestReady(chest.id, progress);

                return (
                  <div
                    key={chest.id}
                    className={`flex flex-col justify-between rounded-2xl border-2 p-4 ${
                      opened
                        ? 'border-emerald-300 bg-emerald-50/70'
                        : ready
                        ? 'border-amber-400 bg-amber-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-slate-900">
                          {chest.title}
                        </h3>
                        <span className="font-mono-num text-xs font-bold text-amber-700">
                          +{chest.rewardStars} Bintang
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-snug">
                        {chest.description}
                      </p>
                      {chest.accessoryLabel && (
                        <div className="mt-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-bold text-teal-800 border border-teal-100">
                          Hadiah: {chest.accessoryLabel} &amp; +{chest.rewardXp} XP
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      {opened ? (
                        <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600/15 py-2 text-xs font-bold text-emerald-800">
                          <Check className="h-4 w-4" />
                          <span>Peti Sudah Dibuka</span>
                        </div>
                      ) : ready ? (
                        <button
                          type="button"
                          onClick={() => {
                            sfx.achievementUnlocked();
                            onClaimChest(chest.id);
                            const msg = `Hore! ${chest.title} terbuka! Kamu mendapat ${chest.rewardStars} bintang dan hadiah ${chest.accessoryLabel ?? 'spesial'}!`;
                            setTutorOverride({ mood: 'celebrate', message: msg });
                            speakRobot(msg, { fromUserAction: true });
                          }}
                          className="min-h-[42px] w-full rounded-xl border-b-4 border-amber-700 bg-amber-500 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                        >
                          Buka Peti Harta Karun!
                        </button>
                      ) : (
                        <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-200 py-2 text-xs font-bold text-slate-600">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Selesaikan Misi untuk Membuka</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Saved Buildings Collection (MY BUILDINGS) */}
          <section className="rounded-3xl border-2 border-teal-200 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-teal-600" aria-hidden="true" />
                <h2 className="font-display text-xl font-bold text-slate-900">
                  My Buildings · Koleksi Bangunanmu ({progress.savedBuildings?.length ?? 0})
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Terpisah dari progres bintang &amp; level utama
              </span>
            </div>

            {!progress.savedBuildings || progress.savedBuildings.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
                Belum ada bangunan yang disimpan. Rancang bangunanmu di tab{' '}
                <strong>Building Creator</strong> lalu klik <strong>Save Building</strong>!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {progress.savedBuildings.map((item) => {
                  const isRenaming = renamingId === item.id;
                  return (
                    <div
                      key={item.id}
                      data-testid="saved-building-card"
                      className="flex flex-col justify-between rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div>
                        {/* Mini Live SVG Preview */}
                        <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-sky-50/70">
                          <svg
                            viewBox={`0 0 ${CANVAS_GRID_COLS * 60} ${CANVAS_GRID_ROWS * 60}`}
                            className="block w-full h-28"
                            aria-hidden="true"
                          >
                            <rect
                              x={0}
                              y={0}
                              width={CANVAS_GRID_COLS * 60}
                              height={CANVAS_GRID_ROWS * 60}
                              fill="#F0FDF4"
                            />
                            {item.shapes.map((shp) => (
                              <g
                                key={shp.id}
                                transform={`translate(${shp.cx * 60}, ${shp.cy * 60}) rotate(${shp.rotation})`}
                              >
                                <Shape2DFigure
                                  type={shp.type}
                                  widthPx={shp.width * 60}
                                  heightPx={shp.height * 60}
                                  radiusPx={
                                    shp.type === 'lingkaran'
                                      ? (shp.radius ?? shp.width / 2) * 60
                                      : undefined
                                  }
                                  fill={shp.color}
                                  stroke="#1E293B"
                                  strokeWidth={2}
                                />
                              </g>
                            ))}
                          </svg>
                        </div>

                        {isRenaming ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (renameValue.trim()) {
                                sfx.success();
                                onRenameBuilding(item.id, renameValue.trim());
                              }
                              setRenamingId(null);
                            }}
                            className="space-y-2"
                          >
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              maxLength={32}
                              autoFocus
                              aria-label="Nama baru bangunan"
                              className="w-full min-h-[38px] rounded-xl border-2 border-teal-500 px-2.5 text-sm font-bold text-slate-900 focus:outline-none"
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                type="submit"
                                className="flex-1 min-h-[34px] rounded-lg bg-teal-600 px-2.5 text-xs font-bold text-white hover:bg-teal-700 cursor-pointer"
                              >
                                Simpan Nama
                              </button>
                              <button
                                type="button"
                                onClick={() => setRenamingId(null)}
                                className="min-h-[34px] rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <h3 className="font-display text-base font-bold text-slate-900 truncate">
                              {item.name}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-600">
                              {item.shapes.length} bangun datar ·{' '}
                              {BUILDING_LOCATIONS.find((l) => l.id === item.locationId)?.name ??
                                item.locationId}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                              Diperbarui: {formatSavedTimestamp(item.updatedAt ?? item.createdAt)}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="mt-3.5 space-y-2">
                        <button
                          type="button"
                          onClick={() => handleLoadSaved(item)}
                          className="min-h-[40px] w-full rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 cursor-pointer"
                        >
                          Buka &amp; Lanjutkan di Kanvas
                        </button>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              sfx.click();
                              setRenamingId(item.id);
                              setRenameValue(item.name);
                            }}
                            className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                            aria-label={`Ubah nama ${item.name}`}
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Rename</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sfx.collectStar();
                              onDuplicateBuilding(item.id);
                            }}
                            className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-2 text-xs font-bold text-sky-800 hover:bg-sky-100 cursor-pointer"
                            aria-label={`Salin ${item.name}`}
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Salin</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sfx.click();
                              setDeleteSavedTarget(item);
                            }}
                            className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                            aria-label={`Hapus koleksi ${item.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ================= TAB 3: BANGUN RUANG 3D (MODUL TERPISAH) ================= */}
      {activeTab === 'solids3d' && (
        <section
          aria-label="Eksplorasi Bangun Ruang 3D"
          className="rounded-3xl border-2 border-violet-200 bg-white/95 p-5 shadow-sm space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Modul Terpisah: Mengenal Bangun Ruang 3D
              </h2>
              <p className="text-sm text-slate-600">
                Bangun ruang adalah benda 3 dimensi yang memiliki isi (volume) dan disusun oleh
                sisi-sisi bangun datar 2D.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SOLID_SHAPES_3D.map((solid) => (
              <div
                key={solid.id}
                className="flex flex-col justify-between rounded-2xl border-2 border-violet-100 bg-violet-50/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-2 border border-violet-100 shrink-0">
                    <SolidShape3DIllustration id={solid.id} color={solid.color} size={84} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      {solid.name}
                    </h3>
                    <div className="text-xs font-bold text-violet-700">
                      {solid.base2DRelation}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs sm:text-sm text-slate-700 leading-snug">
                  {solid.explanation}
                </p>

                <ul className="mt-2.5 space-y-1 text-xs text-slate-700">
                  {solid.characteristics.map((c) => (
                    <li key={c} className="flex items-start gap-1.5">
                      <span className="text-violet-600 font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-slate-700 border border-violet-100">
                  <strong>Contoh di Dunia Nyata:</strong> {solid.buildingExample}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confirmation Dialog: Clear All Canvas Shapes */}
      {confirmClearOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-canvas-title"
        >
          <div className="animate-pop-in w-full max-w-sm rounded-3xl border-2 border-rose-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 id="clear-canvas-title" className="font-display text-lg font-bold text-slate-900">
                Bersihkan Semua Bentuk?
              </h2>
            </div>
            <p className="mt-3 text-sm text-slate-700 leading-relaxed">
              Semua bentuk di kanvas saat ini ({shapes.length} objek) akan dihapus. Progres level, bintang, dan pencapaian kamu tetap aman!
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setConfirmClearOpen(false);
                }}
                className="min-h-[42px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                data-testid="confirm-clear-all-btn"
                className="min-h-[42px] rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 cursor-pointer"
              >
                Ya, Bersihkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Saved Building */}
      {deleteSavedTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-saved-title"
        >
          <div className="animate-pop-in w-full max-w-sm rounded-3xl border-2 border-rose-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <Trash2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 id="delete-saved-title" className="font-display text-lg font-bold text-slate-900">
                Hapus Bangunan Tersimpan?
              </h2>
            </div>
            <p className="mt-3 text-sm text-slate-700 leading-relaxed">
              Apakah kamu yakin ingin menghapus <strong>&ldquo;{deleteSavedTarget.name}&rdquo;</strong> dari My Buildings? Progres bintang dan level kamu tidak akan ikut terhapus.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setDeleteSavedTarget(null);
                }}
                className="min-h-[42px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.tileErase();
                  if (editingSavedId === deleteSavedTarget.id) {
                    setEditingSavedId(null);
                  }
                  onDeleteBuilding(deleteSavedTarget.id);
                  setDeleteSavedTarget(null);
                }}
                data-testid="confirm-delete-saved-btn"
                className="min-h-[42px] rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
