import './styles.css';
import './styles.patch.css';
import { DESIGN_TOKENS, applyDesignTokens, validateDesignTokens } from './Presentation/UI/designTokens.js';
import { HUD_LAYOUT, validateHudLayout } from './Presentation/UI/hudLayout.js';
import { SchemaLoader } from './Infrastructure/DataLoaders/SchemaLoader.js';
import { JsonLevelRepository } from './Infrastructure/Repositories/JsonLevelRepository.js';
import JsonPresentationEnvironmentRepository from './Infrastructure/Repositories/JsonPresentationEnvironmentRepository.js';
import JsonClientBriefRepository from './Infrastructure/Repositories/JsonClientBriefRepository.js';
import JsonReleaseManifestRepository from './Infrastructure/Repositories/JsonReleaseManifestRepository.js';
import JsonInteriorRecipeRepository from './Infrastructure/Repositories/JsonInteriorRecipeRepository.js';
import JsonSurfaceFinishCatalog from './Infrastructure/Repositories/JsonSurfaceFinishCatalog.js';
import JsonProgressionRewardCatalog from './Infrastructure/Repositories/JsonProgressionRewardCatalog.js';
import JsonEndlessBlueprintCatalog from './Infrastructure/Repositories/JsonEndlessBlueprintCatalog.js';
import { InMemoryRoomRepository } from './Infrastructure/Repositories/InMemoryRoomRepository.js';
import ScopedRoomRepository from './Infrastructure/Repositories/ScopedRoomRepository.js';
import BrowserLocalRoomDesignRepository from './Infrastructure/Repositories/BrowserLocalRoomDesignRepository.js';
import BrowserLocalPlayerProfileRepository from './Infrastructure/Repositories/BrowserLocalPlayerProfileRepository.js';
import BrowserPlayerProfileFactory from './Infrastructure/Factories/BrowserPlayerProfileFactory.js';
import { JsonItemCatalog } from './Infrastructure/DataLoaders/JsonItemCatalog.js';
import { JsonConstraintCatalog } from './Infrastructure/DataLoaders/JsonConstraintCatalog.js';
import { JsonFeedbackCatalog } from './Infrastructure/DataLoaders/JsonFeedbackCatalog.js';
import { ConstraintEvaluator } from './Domain/Constraints/ConstraintEvaluator.js';
import { StyleScorer } from './Domain/Scoring/StyleScorer.js';
import { StarRatingPolicy } from './Domain/Scoring/StarRatingPolicy.js';
import ScorecardCalibrationPolicy from './Domain/Scoring/ScorecardCalibrationPolicy.js';
import SpatialErgonomicsEvaluator from './Domain/Ergonomics/SpatialErgonomicsEvaluator.js';
import ClearanceEvaluator from './Domain/Ergonomics/ClearanceEvaluator.js';
import PassageZoneEvaluator from './Domain/Ergonomics/PassageZoneEvaluator.js';
import FunctionalLayoutEvaluator from './Domain/Ergonomics/FunctionalLayoutEvaluator.js';
import ErgonomicsScorer from './Domain/Scoring/ErgonomicsScorer.js';
import MultiStyleEvaluator from './Domain/Scoring/MultiStyleEvaluator.js';
import StyleChannelPolicy from './Domain/Scoring/StyleChannelPolicy.js';
import RoomOccupancyProfile from './Domain/Scoring/RoomOccupancyProfile.js';
import SpatialPreferenceEvaluator from './Domain/Scoring/SpatialPreferenceEvaluator.js';
import ClientPriorityEvaluator from './Domain/Scoring/ClientPriorityEvaluator.js';
import ThreeChannelScoreAggregator from './Domain/Scoring/ThreeChannelScoreAggregator.js';
import MultiChannelViolationImpactPolicy from './Domain/Scoring/MultiChannelViolationImpactPolicy.js';
import ScoringPolicy from './Domain/Scoring/ScoringPolicy.js';
import StyleInfluenceProfile from './Domain/Scoring/StyleInfluenceProfile.js';
import EvaluateRoomUseCase from './Application/UseCases/EvaluateRoomUseCase.js';
import LoadLevelUseCase from './Application/UseCases/LoadLevelUseCase.js';
import PlaceItemUseCase from './Application/UseCases/PlaceItemUseCase.js';
import MoveItemUseCase from './Application/UseCases/MoveItemUseCase.js';
import RotateItemUseCase from './Application/UseCases/RotateItemUseCase.js';
import RemoveItemUseCase from './Application/UseCases/RemoveItemUseCase.js';
import LoadPlayerProfileUseCase from './Application/UseCases/LoadPlayerProfileUseCase.js';
import SavePlayerProfileUseCase from './Application/UseCases/SavePlayerProfileUseCase.js';
import GetCampaignLevelsUseCase from './Application/UseCases/GetCampaignLevelsUseCase.js';
import RecordLevelCompletionUseCase from './Application/UseCases/RecordLevelCompletionUseCase.js';
import UpdatePlayerSettingsUseCase from './Application/UseCases/UpdatePlayerSettingsUseCase.js';
import GetBuildInfoUseCase from './Application/UseCases/GetBuildInfoUseCase.js';
import StartLevelSessionUseCase from './Application/UseCases/StartLevelSessionUseCase.js';
import ReadRoomStateUseCase from './Application/UseCases/ReadRoomStateUseCase.js';
import ResetRoomAttemptUseCase from './Application/UseCases/ResetRoomAttemptUseCase.js';
import ConfigurePlacedItemUseCase from './Application/UseCases/ConfigurePlacedItemUseCase.js';
import ConfigureRoomSurfaceUseCase from './Application/UseCases/ConfigureRoomSurfaceUseCase.js';
import GrantProgressionRewardsUseCase from './Application/UseCases/GrantProgressionRewardsUseCase.js';
import GenerateEndlessLevelUseCase from './Application/UseCases/GenerateEndlessLevelUseCase.js';
import StartEndlessSessionUseCase from './Application/UseCases/StartEndlessSessionUseCase.js';
import ProgressionPolicy from './Domain/Progression/ProgressionPolicy.js';
import { GameController } from './Presentation/Controllers/GameController.js';
import FurnitureAssetRepository from './Presentation/Scene/FurnitureAssetRepository.js';
import furnitureAssetManifest from '../data/visuals/furniture-assets.v1.json';
import loungePbrAssetManifest from '../data/visuals/lounge-pbr-assets.v1.json';
import diningTablePbrAssetManifest from '../data/visuals/dining-table-pbr-assets.v1.json';
import storagePbrAssetManifest from '../data/visuals/storage-pbr-assets.v1.json';
import { loadPlayerProfileForApp } from './Presentation/bootstrap/loadPlayerProfileForApp.js';
import { initializeMainMenuForApp } from './Presentation/bootstrap/initializeMainMenuForApp.js';
import { initializePlayerSettingsForApp } from './Presentation/bootstrap/initializePlayerSettingsForApp.js';
import { initializeReleaseInfoForApp } from './Presentation/bootstrap/initializeReleaseInfoForApp.js';

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Не удалось загрузить ${path}`);
  return response.json();
}

async function bootstrap() {
  const status = document.getElementById('boot-status');
  try {
    const tokenErrors = validateDesignTokens(DESIGN_TOKENS);
    const hudErrors = validateHudLayout(HUD_LAYOUT);
    if (tokenErrors.length > 0) throw new Error(`Invalid presentation tokens: ${tokenErrors.join(', ')}`);
    if (hudErrors.length > 0) throw new Error(`Invalid HUD layout: ${hudErrors.join(', ')}`);
    applyDesignTokens(document.documentElement);

    const releaseManifestRepository = new JsonReleaseManifestRepository('./release-manifest.json');
    const getBuildInfoUseCase = new GetBuildInfoUseCase(releaseManifestRepository);
    await initializeReleaseInfoForApp({
      getBuildInfoUseCase,
      releaseInfoContainer: document.getElementById('release-info-container')
    });

    const profileRepository = new BrowserLocalPlayerProfileRepository(window.localStorage);
    const profileFactory = new BrowserPlayerProfileFactory({
      idProvider: () => window.crypto.randomUUID(),
      timestampProvider: () => new Date().toISOString()
    });
    const loadPlayerProfileUseCase = new LoadPlayerProfileUseCase(profileRepository, profileFactory);
    let playerProfile = await loadPlayerProfileForApp({
      loadPlayerProfileUseCase,
      profileContainer: document.getElementById('profile-container'),
      appRoot: document.getElementById('app')
    });

    const [levelSchema, itemSchema, presentationEnvironmentSchema, clientBriefSchema, styleConstraintCatalogSchema, interiorRecipeSchema, surfaceFinishSchema, progressionRewardSchema, endlessBlueprintSchema, authoredScoringPolicy] = await Promise.all([
      SchemaLoader.loadLevelSchema(),
      SchemaLoader.loadItemSchema(),
      SchemaLoader.loadPresentationEnvironmentSchema(),
      SchemaLoader.loadClientBriefSchema(),
      SchemaLoader.loadStyleConstraintCatalogSchema(),
      SchemaLoader.loadInteriorRecipeSchema(),
      SchemaLoader.loadSurfaceFinishSchema(),
      SchemaLoader.loadProgressionRewardSchema(),
      SchemaLoader.loadEndlessBlueprintSchema(),
      loadJson('./data/scoring/scoring-parameters.json')
    ]);
    const scoringPolicy = new ScoringPolicy(authoredScoringPolicy);

    const levelRepository = new JsonLevelRepository('./data/levels', levelSchema);
    const presentationEnvironmentRepository = new JsonPresentationEnvironmentRepository(
      './data/presentation/environment-profiles.v3.json',
      presentationEnvironmentSchema
    );
    const clientBriefRepository = new JsonClientBriefRepository(
      './data/briefs/client-briefs.v3.json',
      clientBriefSchema
    );
    const savePlayerProfileUseCase = new SavePlayerProfileUseCase(profileRepository);
    const getPlayerProfile = () => playerProfile;
    const interiorRecipeRepository = new JsonInteriorRecipeRepository('./data/interior/interior-recipes.v1.json', interiorRecipeSchema);
    const surfaceFinishCatalog = new JsonSurfaceFinishCatalog('./data/interior/surface-finishes.v1.json', surfaceFinishSchema);
    const progressionRewardCatalog = new JsonProgressionRewardCatalog('./data/progression/rewards.v1.json', progressionRewardSchema);
    const endlessBlueprintCatalog = new JsonEndlessBlueprintCatalog('./data/endless/endless-blueprints.v1.json', endlessBlueprintSchema);
    const updatePlayerSettingsUseCase = new UpdatePlayerSettingsUseCase(
      savePlayerProfileUseCase,
      () => new Date().toISOString()
    );
    const progressionPolicy = new ProgressionPolicy();
    const getCampaignLevelsUseCase = new GetCampaignLevelsUseCase(levelRepository, progressionPolicy);
    const grantProgressionRewardsUseCase = new GrantProgressionRewardsUseCase(
      progressionRewardCatalog,
      savePlayerProfileUseCase,
      () => new Date().toISOString()
    );
    const recordLevelCompletionUseCase = new RecordLevelCompletionUseCase(
      savePlayerProfileUseCase,
      () => new Date().toISOString(),
      grantProgressionRewardsUseCase
    );
    const itemCatalog = new JsonItemCatalog('./data/items', itemSchema);
    const constraintCatalog = new JsonConstraintCatalog(
      './data/styles/style-constraint-catalog.v1.json',
      styleConstraintCatalogSchema
    );
    const feedbackCatalog = new JsonFeedbackCatalog();
    await Promise.all([
      itemCatalog.loadAllItems(),
      constraintCatalog.loadAllConstraints(),
      feedbackCatalog.loadAllFeedback()
    ]);

    const roomDesignRepository = new BrowserLocalRoomDesignRepository(window.localStorage);
    const roomRepository = new ScopedRoomRepository({
      sessionRepository: new InMemoryRoomRepository(),
      roomDesignRepository
    });
    const furnitureAssetRepository = new FurnitureAssetRepository({ manifests: [furnitureAssetManifest, loungePbrAssetManifest, diningTablePbrAssetManifest, storagePbrAssetManifest] });
    const loadLevelUseCase = new LoadLevelUseCase(
      levelRepository,
      itemCatalog,
      constraintCatalog,
      presentationEnvironmentRepository,
      clientBriefRepository,
      { interiorRecipeRepository, surfaceFinishCatalog, roomDesignRepository, getPlayerProfile }
    );
    const startLevelSessionUseCase = new StartLevelSessionUseCase(loadLevelUseCase, roomRepository, getPlayerProfile);
    const generateEndlessLevelUseCase = new GenerateEndlessLevelUseCase({
      endlessBlueprintCatalog,
      itemCatalog,
      constraintCatalog,
      presentationEnvironmentRepository,
      surfaceFinishCatalog,
      getPlayerProfile
    });
    const startEndlessSessionUseCase = new StartEndlessSessionUseCase(generateEndlessLevelUseCase, roomRepository);
    const readRoomStateUseCase = new ReadRoomStateUseCase(roomRepository);
    const resetRoomAttemptUseCase = new ResetRoomAttemptUseCase(roomRepository);
    const placeItemUseCase = new PlaceItemUseCase(roomRepository);
    const moveItemUseCase = new MoveItemUseCase(roomRepository);
    const rotateItemUseCase = new RotateItemUseCase(roomRepository);
    const removeItemUseCase = new RemoveItemUseCase(roomRepository);
    const configurePlacedItemUseCase = new ConfigurePlacedItemUseCase(roomRepository, getPlayerProfile);
    const configureRoomSurfaceUseCase = new ConfigureRoomSurfaceUseCase(roomRepository, surfaceFinishCatalog, getPlayerProfile);
    const scoring = scoringPolicy;
    const styleScorer = new StyleScorer(scoring);
    const starRatingPolicy = new StarRatingPolicy(scoring.starRatingThresholds, { epsilon: scoring.scoreEpsilon });
    const ergonomicsScorer = new ErgonomicsScorer(scoring);
    const scorecardCalibrationPolicy = new ScorecardCalibrationPolicy({
      schemaVersion: 1,
      criticalStarCap: scoring.criticalStarCap
    });
    const multiStyleEvaluator = new MultiStyleEvaluator({
      constraintEvaluator: new ConstraintEvaluator(),
      styleScorer
    });
    const styleChannelPolicy = new StyleChannelPolicy({
      targetFitWeight: scoring.styleBlend.targetFit,
      compositionWeight: scoring.styleBlend.composition
    });
    const roomOccupancyProfile = {
      evaluate: ({ roomState }) => RoomOccupancyProfile.evaluate({
        roomState,
        cellSizeMeters: scoring.occupancy.cellSizeMeters
      })
    };
    const spatialPreferenceEvaluator = new SpatialPreferenceEvaluator({
      densityProfiles: scoring.densityProfiles
    });
    const clientPriorityEvaluator = new ClientPriorityEvaluator({ spatialPreferenceEvaluator });
    const threeChannelScoreAggregator = new ThreeChannelScoreAggregator({
      styleWeight: scoring.channelWeights.style,
      clientPriorityWeight: scoring.channelWeights.clientPriorities,
      ergonomicsWeight: scoring.channelWeights.ergonomics
    });
    const styleInfluenceProfile = Object.freeze({
      policy: scoring.styleInfluence,
      evaluate: ({ placedItems }) => StyleInfluenceProfile.fromPlacedItems({
        placedItems,
        styleInfluence: scoring.styleInfluence
      })
    });
    const multiChannelViolationImpactPolicy = new MultiChannelViolationImpactPolicy({
      styleScorer,
      ergonomicsScorer,
      styleChannelPolicy,
      threeChannelScoreAggregator,
      scorecardCalibrationPolicy
    });
    const multiStyleDependencies = {
      multiStyleEvaluator,
      styleChannelPolicy,
      styleInfluenceProfile,
      roomOccupancyProfile,
      clientPriorityEvaluator,
      threeChannelScoreAggregator,
      multiChannelViolationImpactPolicy
    };
    const evaluateRoomUseCase = new EvaluateRoomUseCase(
      roomRepository,
      styleScorer,
      starRatingPolicy,
      feedbackCatalog,
      new SpatialErgonomicsEvaluator(
        new ClearanceEvaluator(),
        new PassageZoneEvaluator(),
        new FunctionalLayoutEvaluator()
      ),
      ergonomicsScorer,
      scorecardCalibrationPolicy,
      multiStyleDependencies
    );

    const controller = new GameController({
      loadLevelUseCase,
      placeItemUseCase,
      moveItemUseCase,
      rotateItemUseCase,
      removeItemUseCase,
      configurePlacedItemUseCase,
      configureRoomSurfaceUseCase,
      evaluateRoomUseCase,
      recordLevelCompletionUseCase,
      startLevelSessionUseCase,
      startEndlessSessionUseCase,
      readRoomStateUseCase,
      resetRoomAttemptUseCase,
      playerProfile,
      roomRepository,
      furnitureAssetRepository
    });
    await controller.init(
      document.getElementById('room-canvas'),
      document.getElementById('catalog-container'),
      document.getElementById('toolbar-container'),
      document.getElementById('evaluation-container'),
      document.getElementById('dashboard-container'),
      document.getElementById('boot-status'),
      document.getElementById('design-inspector-container'),
      document.getElementById('brief-container'),
      document.getElementById('workspace-shell')
    );
    const settingsInitialization = await initializePlayerSettingsForApp({
      updatePlayerSettingsUseCase,
      gameController: controller,
      profile: playerProfile,
      settingsContainer: document.getElementById('settings-container'),
      appRoot: document.getElementById('app')
    });
    playerProfile = settingsInitialization.profile;
    controller.setSettingsListener(() => settingsInitialization.view.open());
    const mainMenu = await initializeMainMenuForApp({
      getCampaignLevelsUseCase,
      savePlayerProfileUseCase,
      gameController: controller,
      profile: playerProfile,
      mainMenuContainer: document.getElementById('main-menu-container'),
      timestampProvider: () => new Date().toISOString(),
      seedProvider: () => window.crypto.getRandomValues(new Uint32Array(1))[0]
    });
    playerProfile = mainMenu.profile;
    controller.setPlayerProfile(playerProfile);
    controller.setMainMenuListener(() => mainMenu.showCampaign());
    controller.setCompletionProfileListener(async profile => {
      playerProfile = profile;
      return mainMenu.refresh(profile);
    });
    controller.roomView.startRenderLoop();
    // После загрузки сцена остаётся чистой: подсказки появляются только
    // как реакция на доступное или выполненное действие.
    status.classList.add('hidden');
  } catch (error) {
    console.error('Decorium bootstrap error:', error);
    status.className = 'boot-status panel error-card';
    status.textContent = `Не удалось загрузить игру: ${error.message}`;
  }
}

bootstrap();
