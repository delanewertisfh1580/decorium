import './styles.css';
import { DESIGN_TOKENS, applyDesignTokens, validateDesignTokens } from './Presentation/UI/designTokens.js';
import { HUD_LAYOUT, validateHudLayout } from './Presentation/UI/hudLayout.js';
import { SchemaLoader } from './Infrastructure/DataLoaders/SchemaLoader.js';
import { JsonLevelRepository } from './Infrastructure/Repositories/JsonLevelRepository.js';
import { InMemoryRoomRepository } from './Infrastructure/Repositories/InMemoryRoomRepository.js';
import BrowserLocalPlayerProfileRepository from './Infrastructure/Repositories/BrowserLocalPlayerProfileRepository.js';
import BrowserPlayerProfileFactory from './Infrastructure/Factories/BrowserPlayerProfileFactory.js';
import { JsonItemCatalog } from './Infrastructure/DataLoaders/JsonItemCatalog.js';
import { JsonConstraintCatalog } from './Infrastructure/DataLoaders/JsonConstraintCatalog.js';
import { JsonStyleCatalog } from './Infrastructure/DataLoaders/JsonStyleCatalog.js';
import { JsonFeedbackCatalog } from './Infrastructure/DataLoaders/JsonFeedbackCatalog.js';
import { ConstraintEvaluator } from './Domain/Constraints/ConstraintEvaluator.js';
import { StyleScorer } from './Domain/Scoring/StyleScorer.js';
import { StarRatingPolicy } from './Domain/Scoring/StarRatingPolicy.js';
import SpatialErgonomicsEvaluator from './Domain/Ergonomics/SpatialErgonomicsEvaluator.js';
import ErgonomicsScorer from './Domain/Scoring/ErgonomicsScorer.js';
import EvaluationScoreAggregator from './Domain/Scoring/EvaluationScoreAggregator.js';
import { initializeScoringParameters, getScoringParameters } from './Domain/Scoring/scoringParameters.js';
import EvaluateRoomUseCase from './Application/UseCases/EvaluateRoomUseCase.js';
import LoadLevelUseCase from './Application/UseCases/LoadLevelUseCase.js';
import PlaceItemUseCase from './Application/UseCases/PlaceItemUseCase.js';
import MoveItemUseCase from './Application/UseCases/MoveItemUseCase.js';
import RotateItemUseCase from './Application/UseCases/RotateItemUseCase.js';
import RemoveItemUseCase from './Application/UseCases/RemoveItemUseCase.js';
import LoadPlayerProfileUseCase from './Application/UseCases/LoadPlayerProfileUseCase.js';
import SavePlayerProfileUseCase from './Application/UseCases/SavePlayerProfileUseCase.js';
import ListAuthoredLevelsUseCase from './Application/UseCases/ListAuthoredLevelsUseCase.js';
import { GameController } from './Presentation/Controllers/GameController.js';
import { loadPlayerProfileForApp } from './Presentation/bootstrap/loadPlayerProfileForApp.js';
import { initializeLevelSelectForApp } from './Presentation/bootstrap/initializeLevelSelectForApp.js';

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

    const [levelSchema, itemSchema, scoringParameters] = await Promise.all([
      SchemaLoader.loadLevelSchema(),
      SchemaLoader.loadItemSchema(),
      loadJson('./data/scoring/scoring-parameters.json')
    ]);
    initializeScoringParameters(scoringParameters);

    const levelRepository = new JsonLevelRepository('./data/levels', levelSchema);
    const itemCatalog = new JsonItemCatalog('./data/items', itemSchema);
    const constraintCatalog = new JsonConstraintCatalog();
    const styleCatalog = new JsonStyleCatalog();
    const feedbackCatalog = new JsonFeedbackCatalog();
    await Promise.all([
      itemCatalog.loadAllItems(),
      constraintCatalog.loadAllConstraints(),
      styleCatalog.loadAllStyles(),
      feedbackCatalog.loadAllFeedback()
    ]);

    const roomRepository = new InMemoryRoomRepository();
    const loadLevelUseCase = new LoadLevelUseCase(levelRepository, itemCatalog, constraintCatalog);
    const placeItemUseCase = new PlaceItemUseCase(roomRepository);
    const moveItemUseCase = new MoveItemUseCase(roomRepository);
    const rotateItemUseCase = new RotateItemUseCase(roomRepository);
    const removeItemUseCase = new RemoveItemUseCase(roomRepository);
    const scoring = getScoringParameters();
    const evaluateRoomUseCase = new EvaluateRoomUseCase(
      roomRepository,
      new ConstraintEvaluator(),
      new StyleScorer(scoring),
      new StarRatingPolicy(scoring.starRatingThresholds),
      feedbackCatalog,
      new SpatialErgonomicsEvaluator(),
      new ErgonomicsScorer(scoring),
      new EvaluationScoreAggregator({
        styleWeight: scoring.styleWeight,
        ergonomicsWeight: scoring.ergonomicsWeight
      })
    );

    const controller = new GameController({
      loadLevelUseCase,
      placeItemUseCase,
      moveItemUseCase,
      rotateItemUseCase,
      removeItemUseCase,
      evaluateRoomUseCase,
      roomRepository
    });
    await controller.init(
      document.getElementById('room-canvas'),
      document.getElementById('catalog-container'),
      document.getElementById('toolbar-container'),
      document.getElementById('evaluation-container')
    );
    const listAuthoredLevelsUseCase = new ListAuthoredLevelsUseCase(levelRepository);
    const savePlayerProfileUseCase = new SavePlayerProfileUseCase(profileRepository);
    const levelSelection = await initializeLevelSelectForApp({
      listAuthoredLevelsUseCase,
      savePlayerProfileUseCase,
      gameController: controller,
      profile: playerProfile,
      levelSelectContainer: document.getElementById('level-select-container'),
      timestampProvider: () => new Date().toISOString()
    });
    playerProfile = levelSelection.profile;
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
