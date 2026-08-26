import { RoomView } from '../Views/RoomView.js';
import { ItemCatalogView } from '../Views/ItemCatalogView.js';
import { ToolbarView } from '../Views/ToolbarView.js';
import { EvaluationView } from '../Views/EvaluationView.js';
import { GameDashboardView } from '../Views/GameDashboardView.js';
import { TransientStatusView } from '../Views/TransientStatusView.js';
import DesignInspectorView from '../Views/DesignInspectorView.js';
import BriefView from '../Views/BriefView.js';
import WorkspaceShellView from '../Views/WorkspaceShellView.js';
import WorkspaceState, { WORKSPACE_DRAWERS, WORKSPACE_SCREENS } from '../UI/WorkspaceState.js';
import { INPUT_INTENTS } from './InputIntent.js';
import KeyboardIntentRouter from './KeyboardIntentRouter.js';
import EvaluationCoordinator from './EvaluationCoordinator.js';
import RoomInteractionCoordinator from './RoomInteractionCoordinator.js';
import LevelSessionCoordinator from './LevelSessionCoordinator.js';

export class GameController {
  constructor({
    placeItemUseCase,
    moveItemUseCase,
    rotateItemUseCase,
    removeItemUseCase,
    configurePlacedItemUseCase = null,
    configureRoomSurfaceUseCase = null,
    evaluateRoomUseCase,
    recordLevelCompletionUseCase,
    startLevelSessionUseCase = null,
    startEndlessSessionUseCase = null,
    readRoomStateUseCase = null,
    resetRoomAttemptUseCase = null,
    playerProfile = null,
    furnitureAssetRepository = null
  }) {
    this.placeItemUseCase = placeItemUseCase;
    this.moveItemUseCase = moveItemUseCase;
    this.rotateItemUseCase = rotateItemUseCase;
    this.removeItemUseCase = removeItemUseCase;
    this.configurePlacedItemUseCase = configurePlacedItemUseCase;
    this.configureRoomSurfaceUseCase = configureRoomSurfaceUseCase;
    this.evaluateRoomUseCase = evaluateRoomUseCase;
    this.recordLevelCompletionUseCase = recordLevelCompletionUseCase;
    this.startLevelSessionUseCase = startLevelSessionUseCase;
    this.startEndlessSessionUseCase = startEndlessSessionUseCase;
    this.readRoomStateUseCase = readRoomStateUseCase;
    this.resetRoomAttemptUseCase = resetRoomAttemptUseCase;
    this.playerProfile = playerProfile;
    this.playerSettings = playerProfile?.settings ?? null;
    this.furnitureAssetRepository = furnitureAssetRepository;
    this.roomView = null;
    this.sessionCoordinator = new LevelSessionCoordinator({
      startLevelSessionUseCase: this.startLevelSessionUseCase,
      startEndlessSessionUseCase: this.startEndlessSessionUseCase,
      readRoomStateUseCase: this.readRoomStateUseCase,
      resetRoomAttemptUseCase: this.resetRoomAttemptUseCase,
      getRoomView: () => this.roomView
    });
    this.roomInteraction = new RoomInteractionCoordinator({
      getRoomView: () => this.roomView,
      getCatalogView: () => this.catalogView,
      getRoomViewModel: () => this.sessionCoordinator.roomViewModel,
      getLevel: () => this.sessionCoordinator.level,
      placeItemUseCase: this.placeItemUseCase,
      moveItemUseCase: this.moveItemUseCase,
      rotateItemUseCase: this.rotateItemUseCase,
      removeItemUseCase: this.removeItemUseCase,
      configurePlacedItemUseCase: this.configurePlacedItemUseCase,
      configureRoomSurfaceUseCase: this.configureRoomSurfaceUseCase,
      refreshRoomState: () => this._refreshRoomState(),
      onEvaluationInvalidated: () => this._invalidateEvaluation(),
      onStatus: message => this._showStatus(message),
      onRequestRender: () => this._render()
    });
    this.evaluationCoordinator = new EvaluationCoordinator({
      evaluateRoomUseCase: this.evaluateRoomUseCase,
      recordLevelCompletionUseCase: this.recordLevelCompletionUseCase,
      getEvaluationView: () => this.evaluationView,
      onProfileUpdated: profile => this.setPlayerProfile(profile),
      onCompleted: async profile => this.completionProfileListener?.(profile),
      onStatus: message => this._showStatus(message),
      onRequestDashboardRender: () => this._renderDashboard(),
      onRequestRoomRender: () => this._render(),
      onFocusItem: instanceId => this.roomInteraction.focusExistingItem(instanceId)
    });
    this.dashboardView = null;
    this.briefView = null;
    this.briefDrawerView = null;
    this.workspaceShellView = null;
    this.workspaceState = WorkspaceState.edit();
    this.statusView = null;
    this.keyboardRouter = null;
    this.completionProfileListener = null;
    this.mainMenuListener = null;
    this.settingsListener = null;
  }

  async init(canvas, catalogContainer, toolbarContainer, evaluationContainer, dashboardContainer = null, statusContainer = null, designInspectorContainer = null, briefContainer = null, workspaceShellContainer = null) {
    this.roomView = new RoomView(canvas, {
      furnitureAssetRepository: this.furnitureAssetRepository
    });
    if (this.playerSettings) this.roomView.setRenderSettings(this.playerSettings);
    this.workspaceShellView = new WorkspaceShellView(workspaceShellContainer, {
      onCatalog: () => this._openCatalogDrawer(),
      onBrief: () => this._openBriefDrawer(),
      onUndo: () => this._dispatchIntent(INPUT_INTENTS.UNDO),
      onEvaluate: () => this._dispatchIntent(INPUT_INTENTS.EVALUATE),
      onCampaign: () => this.openMainMenu(),
      onRoom: () => this._openRoomInspector(),
      onSettings: () => this.settingsListener?.(),
    });
    this.workspaceShellView.render({ state: this.workspaceState });
    this.catalogView = new ItemCatalogView(this.workspaceShellView.catalogContainer ?? catalogContainer, itemId => this.roomInteraction.beginCatalogPlacement(itemId));
    this.briefDrawerView = new BriefView(this.workspaceShellView.briefContainer, {
      onClose: () => this._closeWorkspaceDrawer()
    });
    this.toolbarView = new ToolbarView(toolbarContainer, {
      onRotate: () => this._dispatchIntent(INPUT_INTENTS.ROTATE),
      onDelete: () => this._dispatchIntent(INPUT_INTENTS.DELETE),
      onUndo: () => this._dispatchIntent(INPUT_INTENTS.UNDO),
      onRaise: () => this._dispatchIntent(INPUT_INTENTS.RAISE),
      onLower: () => this._dispatchIntent(INPUT_INTENTS.LOWER),
      onResetCamera: () => this._dispatchIntent(INPUT_INTENTS.RESET_CAMERA),
      onClear: () => this._onClear(),
      onEvaluate: () => this._dispatchIntent(INPUT_INTENTS.EVALUATE),
      onMenu: () => this.openMainMenu()
    });
    this.evaluationView = new EvaluationView(evaluationContainer, {
      onFocusInstance: instanceId => this._onExplainabilityFocus(instanceId),
      onClose: () => this._exitReviewWorkspace()
    });
    this.dashboardView = new GameDashboardView(dashboardContainer, {
      renderContextActions: container => this.toolbarView?.renderContextActions(container)
    });
    this.statusView = new TransientStatusView(statusContainer);
    this.briefView = new BriefView(briefContainer, {
      onStartEditing: () => this._enterEditWorkspace(),
      onClose: () => this._enterEditWorkspace()
    });
    this.designInspectorView = new DesignInspectorView(this.workspaceShellView.inspectorContainer ?? designInspectorContainer, {
      onVariant: variantId => this.roomInteraction.configureSelectedItem(variantId),
      onSurface: (surface, finishId) => this.roomInteraction.configureSurface(surface, finishId),
      onRaise: () => this._dispatchIntent(INPUT_INTENTS.RAISE),
      onLower: () => this._dispatchIntent(INPUT_INTENTS.LOWER),
      onRotate: () => this._dispatchIntent(INPUT_INTENTS.ROTATE),
      onDelete: () => this._dispatchIntent(INPUT_INTENTS.DELETE),
      onClose: () => this._closeWorkspaceDrawer()
    });

    await this.roomView.init();
    await this.catalogView.init();
    await this.toolbarView.init();
    await this.evaluationView.init();
    await this.designInspectorView.init();
    this.roomView.setInteractionHandlers({
      onSelect: itemId => this.roomInteraction.selectRoomItem(itemId),
      onPlace: (itemId, position, rotation) => this._onPlace(itemId, position, rotation),
      onMove: (itemId, position) => this._onMove(itemId, position),
      onCancelMove: () => this._render(),
      onDeselect: () => this.roomInteraction.cancelSelection(),
      onFloorClick: position => this.roomInteraction.handleFloorClick(position),
      onPreview: (itemId, position, mode, rotation) => this.roomInteraction.preview(itemId, position, mode, rotation)
    });
    // Capture phase keeps shortcuts active even when a catalog/toolbar control owns focus.
    // event.code (handled by InputIntent) makes R/E work on Cyrillic layouts too.
    this.keyboardRouter = new KeyboardIntentRouter({
      dispatch: intent => this._dispatchIntent(intent)
    });
    this.keyboardRouter.start();
  }

  setMainMenuListener(listener) {
    if (listener !== null && typeof listener !== 'function') {
      throw new Error('GameController main menu listener must be a function or null.');
    }
    this.mainMenuListener = listener;
  }

  async openMainMenu() {
    this.roomInteraction.cancelSelection({ announce: false });
    this.evaluationCoordinator.reset();
    return this.mainMenuListener?.();
  }

  setCompletionProfileListener(listener) {
    if (listener !== null && typeof listener !== 'function') {
      throw new Error('GameController completion profile listener must be a function or null.');
    }
    this.completionProfileListener = listener;
  }

  setSettingsListener(listener) {
    if (listener !== null && typeof listener !== 'function') {
      throw new Error('GameController settings listener must be a function or null.');
    }
    this.settingsListener = listener;
  }

  setPlayerProfile(profile) {
    this.playerProfile = profile;
    if (this.level && Array.isArray(profile?.unlockedIds)) this.level.unlockedIds = Object.freeze([...profile.unlockedIds]);
    if (profile?.settings) this.setPlayerSettings(profile.settings);
  }

  setPlayerSettings(settings) {
    this.playerSettings = { ...settings };
    this.roomView?.setRenderSettings(this.playerSettings);
  }

  async loadLevel(levelId) {
    await this.sessionCoordinator.load(levelId);
    this._syncPassageZones();
    this.workspaceState = this.workspaceState.openBrief();
    this._render();
    this._renderBrief();
  }

  _enterEditWorkspace() {
    this.workspaceState = WorkspaceState.edit();
    this.briefView?.hide();
    this.briefDrawerView?.hide();
    this._renderWorkspaceShell();
  }

  _closeWorkspaceDrawer() {
    this.workspaceState = this.workspaceState.dismiss();
    this.briefDrawerView?.hide();
    this.catalogView?.close();
    this._renderWorkspaceShell();
  }

  _openCatalogDrawer() {
    this.workspaceState = this.workspaceState.openDrawer(WORKSPACE_DRAWERS.CATALOG);
    this.briefDrawerView?.hide();
    this.catalogView?.open();
    this._render();
  }

  async loadEndlessRun(seed) {
    await this.sessionCoordinator.loadEndless(seed);
    this._syncPassageZones();
    this.workspaceState = WorkspaceState.edit();
    this._render();
  }

  _openBriefDrawer() {
    this.workspaceState = this.workspaceState.openDrawer(WORKSPACE_DRAWERS.BRIEF);
    this.catalogView?.close();
    this._renderWorkspaceShell();
    this._renderBriefDrawer();
  }

  _openRoomInspector() {
    this.workspaceState = this.workspaceState.openDrawer(WORKSPACE_DRAWERS.INSPECTOR_ROOM);
    this.catalogView?.close();
    this.briefDrawerView?.hide();
    this._render();
  }

  _renderWorkspaceShell() {
    this.workspaceShellView?.render({
      state: this.workspaceState,
      levelLabel: this.roomViewModel?.name ?? this.level?.id ?? 'Комната',
      placedCount: this.roomViewModel?.placedItems?.length ?? 0,
      canUndo: this.undoBuffer?.canUndo ?? false
    });
  }

  _renderBrief() {
    if (this.workspaceState.screen !== WORKSPACE_SCREENS.BRIEF || !this.level?.clientBrief) return;
    this.briefView?.render({
      brief: this.level.clientBrief,
      mode: 'launch',
      levelLabel: this.roomViewModel?.name ?? this.level.id,
      styleProfiles: this.level.evaluationSpec?.styleTargets ?? []
    });
  }

  _renderBriefDrawer() {
    if (this.workspaceState.activeDrawer !== WORKSPACE_DRAWERS.BRIEF || !this.level?.clientBrief) return;
    this.briefDrawerView?.render({
      brief: this.level.clientBrief,
      mode: 'drawer',
      levelLabel: this.roomViewModel?.name ?? this.level.id,
      styleProfiles: this.level.evaluationSpec?.styleTargets ?? []
    });
  }

  _render() {
    const selectedItemId = this.roomViewModel.selectedItemId;
    if (this.workspaceState.screen === WORKSPACE_SCREENS.EDIT && selectedItemId) {
      this.workspaceState = this.workspaceState.openDrawer(WORKSPACE_DRAWERS.INSPECTOR_ITEM);
      this.catalogView?.close();
      this.briefDrawerView?.hide();
    }
    if (this.workspaceState.activeDrawer === WORKSPACE_DRAWERS.INSPECTOR_ITEM && !selectedItemId) {
      this.workspaceState = this.workspaceState.dismiss();
    }
    this.roomView.render(this.roomViewModel.roomState, selectedItemId);
    this._renderWorkspaceShell();
    if (this.workspaceState.activeDrawer === WORKSPACE_DRAWERS.CATALOG) {
      this.catalogView.render(this.roomViewModel.availableItems, this.pendingItemId);
    } else if (this.workspaceState.activeDrawer === WORKSPACE_DRAWERS.BRIEF) {
      this._renderBriefDrawer();
    }
    if ([WORKSPACE_DRAWERS.INSPECTOR_ITEM, WORKSPACE_DRAWERS.INSPECTOR_ROOM].includes(this.workspaceState.activeDrawer)) {
      this.designInspectorView?.render({
        roomState: this.roomViewModel.roomState,
        selectedItemId: this.workspaceState.activeDrawer === WORKSPACE_DRAWERS.INSPECTOR_ITEM ? selectedItemId : null,
        surfaceFinishes: this.level.surfaceFinishes,
        unlockedIds: this.level.unlockedIds
      });
    }
    this._renderDashboard();
    this.toolbarView.setSelectionState(Boolean(this.roomViewModel.selectedItemId));
    this.toolbarView.setUndoState(this.undoBuffer.canUndo, this.undoBuffer.nextLabel);
  }

  /** Floor guides mirror the exact passage rectangles the evaluator enforces. */
  _syncPassageZones() {
    const zones = this.level?.evaluationSpec?.ergonomicsRules?.passageZones ?? [];
    this.roomView?.setPassageZones(zones);
  }

  _highlightOffendingItems() {
    const offenders = (this.evaluationViewModel?.violations ?? [])
      .flatMap(issue => (issue.instances ?? []).map(instance => instance.instanceId))
      .filter(Boolean);
    this.roomView?.highlightItems(offenders);
  }

  _invalidateEvaluation() {
    this.roomView?.clearHighlightedItems();
    this.evaluationCoordinator.invalidate();
  }

  _renderDashboard() {
    if (!this.roomViewModel) return;
    this.dashboardView?.render({
      roomName: this.roomViewModel.name,
      placedCount: this.roomViewModel.placedItems.length,
      evaluation: this.evaluationViewModel.isVisible ? this.evaluationViewModel : null,
      clientBrief: this.level?.clientBrief ?? null
    });
    this.toolbarView?.setSelectionState(Boolean(this.roomViewModel.selectedItemId));
    this.toolbarView?.setUndoState(this.undoBuffer.canUndo, this.undoBuffer.nextLabel);
  }

  _onExplainabilityFocus(instanceId) {
    return this.evaluationCoordinator.focusExplanation(instanceId, {
      roomViewModel: this.roomViewModel
    });
  }

  async _refreshRoomState() {
    return this.sessionCoordinator.refreshRoomState();
  }

  async _onPlace(itemId, position, rotation = 0) {
    return this.roomInteraction.place(itemId, position, rotation);
  }

  async _onMove(itemId, position) {
    return this.roomInteraction.move(itemId, position);
  }

  async _onVerticalMove(delta) {
    return this.roomInteraction.moveVertically(delta);
  }

  async _onRotate() {
    return this.roomInteraction.rotate();
  }

  async _onDelete() {
    return this.roomInteraction.removeSelected();
  }

  async _onClear() {
    const result = await this.sessionCoordinator.resetAttempt();
    if (!result.success) {
      this._showStatus(result.error);
      return result;
    }
    this.roomInteraction.resetTransientState();
    this.evaluationCoordinator.reset();
    this.roomView?.clearHighlightedItems();
    this._showStatus('Новая попытка начата');
    this._render();
    return { success: true };
  }

  async _onUndo() {
    return this.roomInteraction.undo();
  }

  async _onEvaluate() {
    this.workspaceState = this.workspaceState.openReview();
    this._renderWorkspaceShell();
    const result = await this.evaluationCoordinator.evaluate({
      level: this.level,
      roomViewModel: this.roomViewModel,
      profile: this.playerProfile
    });
    if (!result.success) {
      this._exitReviewWorkspace();
      return result;
    }
    this._highlightOffendingItems();
    return result;
  }

  _exitReviewWorkspace() {
    this.workspaceState = WorkspaceState.edit();
    this._renderWorkspaceShell();
  }


  _dispatchIntent(intent) {
    if (!this.roomViewModel || !this.roomView) return;
    switch (intent) {
      case INPUT_INTENTS.ROTATE:
        this._onRotate();
        break;
      case INPUT_INTENTS.DELETE:
        this._onDelete();
        break;
      case INPUT_INTENTS.EVALUATE:
        this._onEvaluate();
        break;
      case INPUT_INTENTS.RAISE:
        this._onVerticalMove(0.25);
        break;
      case INPUT_INTENTS.LOWER:
        this._onVerticalMove(-0.25);
        break;
      case INPUT_INTENTS.RESET_CAMERA:
        this.roomView.resetCamera();
        break;
      case INPUT_INTENTS.UNDO:
        this._onUndo();
        break;
      case INPUT_INTENTS.CANCEL:
        this.roomInteraction.cancelSelection({ announce: false });
        break;
      default:
        break;
    }
  }

  get level() {
    return this.sessionCoordinator.level;
  }

  set level(level) {
    this.sessionCoordinator.setCompatibilityContext({ level });
  }

  get roomViewModel() {
    return this.sessionCoordinator.roomViewModel;
  }

  set roomViewModel(roomViewModel) {
    this.sessionCoordinator.setCompatibilityContext({ roomViewModel });
  }

  get evaluationViewModel() {
    return this.evaluationCoordinator.viewModel;
  }

  get undoBuffer() {
    return this.roomInteraction.undoBuffer;
  }

  get pendingItemId() {
    return this.roomInteraction?.pendingItemId ?? null;
  }

  set pendingItemId(itemId) {
    if (this.roomInteraction) this.roomInteraction.pendingItemId = itemId;
  }

  showStatus(message) {
    this._showStatus(message);
  }

  _showStatus(message) {
    this.statusView?.show(message);
  }

  destroy() {
    this.keyboardRouter?.destroy();
    this.roomView?.destroy();
    this.catalogView?.destroy();
    this.toolbarView?.destroy();
    this.evaluationView?.destroy();
    this.dashboardView?.destroy();
    this.briefView?.destroy();
    this.briefDrawerView?.destroy();
    this.workspaceShellView?.destroy();
    this.statusView?.destroy();
  }
}
