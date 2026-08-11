import './styles.css';
import { SchemaLoader } from './Infrastructure/DataLoaders/SchemaLoader.js';
import { JsonLevelRepository } from './Infrastructure/Repositories/JsonLevelRepository.js';
import { InMemoryRoomRepository } from './Infrastructure/Repositories/InMemoryRoomRepository.js';
import { JsonItemCatalog } from './Infrastructure/DataLoaders/JsonItemCatalog.js';
import { JsonConstraintCatalog } from './Infrastructure/DataLoaders/JsonConstraintCatalog.js';
import { JsonStyleCatalog } from './Infrastructure/DataLoaders/JsonStyleCatalog.js';
import { JsonFeedbackCatalog } from './Infrastructure/DataLoaders/JsonFeedbackCatalog.js';
import { ConstraintEvaluator } from './Domain/Constraints/ConstraintEvaluator.js';
import { StyleScorer } from './Domain/Scoring/StyleScorer.js';
import { StarRatingPolicy } from './Domain/Scoring/StarRatingPolicy.js';
import { initializeScoringParameters, getScoringParameters } from './Domain/Scoring/scoringParameters.js';
import EvaluateRoomUseCase from './Application/UseCases/EvaluateRoomUseCase.js';
import LoadLevelUseCase from './Application/UseCases/LoadLevelUseCase.js';
import PlaceItemUseCase from './Application/UseCases/PlaceItemUseCase.js';
import MoveItemUseCase from './Application/UseCases/MoveItemUseCase.js';
import RotateItemUseCase from './Application/UseCases/RotateItemUseCase.js';
import RemoveItemUseCase from './Application/UseCases/RemoveItemUseCase.js';
import { GameController } from './Presentation/Controllers/GameController.js';

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Не удалось загрузить ${path}`);
  return response.json();
}

async function bootstrap() {
  const status = document.getElementById('boot-status');
  try {
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
      feedbackCatalog
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
    await controller.loadLevel('level-001');
    controller.roomView.startRenderLoop();
    status.textContent = 'Готово · соберите комнату и нажмите «Оценить»';
    setTimeout(() => status.classList.add('hidden'), 1800);
  } catch (error) {
    console.error('Decorium bootstrap error:', error);
    status.className = 'boot-status panel error-card';
    status.textContent = `Не удалось загрузить MVP: ${error.message}`;
  }
}

bootstrap();
