import './styles.css';
import './embedded-data.js';  // Импортируем встроенные данные
import { EmbeddedDataLoader } from './Infrastructure/DataLoaders/EmbeddedDataLoader.js';
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

async function bootstrap() {
  const status = document.getElementById('boot-status');
  try {
    // Загружаем все данные из встроенного объекта
    const [levelSchema, itemSchema, scoringParameters] = await Promise.all([
      EmbeddedDataLoader.loadLevelSchema(),
      EmbeddedDataLoader.loadItemSchema(),
      EmbeddedDataLoader.loadScoringParameters()
    ]);
    initializeScoringParameters(scoringParameters);

    const levelRepository = new JsonLevelRepository(null, levelSchema);
    const itemCatalog = new JsonItemCatalog(null, itemSchema);
    const constraintCatalog = new JsonConstraintCatalog();
    const styleCatalog = new JsonStyleCatalog();
    const feedbackCatalog = new JsonFeedbackCatalog();
    
    // Загружаем данные из встроенного объекта
    const [itemsData, constraintsData, stylesData, feedbackData] = await Promise.all([
      EmbeddedDataLoader.loadAllItems(),
      EmbeddedDataLoader.loadAllConstraints(),
      EmbeddedDataLoader.loadAllStyles(),
      EmbeddedDataLoader.loadAllFeedback()
    ]);
    
    // Передаем данные напрямую в каталоги
    itemCatalog.setItems(itemsData);
    constraintCatalog.setConstraints(constraintsData);
    styleCatalog.setStyles(stylesData);
    feedbackCatalog.setFeedback(feedbackData);

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
