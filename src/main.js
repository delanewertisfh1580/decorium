// =============================================================================
// main.js — Entry Point для Decorium (DDD + Three.js)
// Архитектура: Domain ← Application ← Infrastructure/Presentation ← main
// =============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Domain
import { RoomState } from './Domain/Rooms/RoomState.js';
import { Item } from './Domain/Items/Item.js';
import { FeatureVector } from './Domain/Items/FeatureVector.js';
import { LinearConstraint } from './Domain/Constraints/LinearConstraint.js';
import { ConstraintEvaluator } from './Domain/Constraints/ConstraintEvaluator.js';
import { StyleScorer } from './Domain/Scoring/StyleScorer.js';
import { StarRatingPolicy } from './Domain/Scoring/StarRatingPolicy.js';
import { scoringParameters } from './Domain/Scoring/scoringParameters.js';

// Application UseCases
import { LoadLevelUseCase } from './Application/UseCases/LoadLevelUseCase.js';
import { PlaceItemUseCase } from './Application/UseCases/PlaceItemUseCase.js';
import { MoveItemUseCase } from './Application/UseCases/MoveItemUseCase.js';
import { RotateItemUseCase } from './Application/UseCases/RotateItemUseCase.js';
import { RemoveItemUseCase } from './Application/UseCases/RemoveItemUseCase.js';
import { EvaluateRoomUseCase } from './Application/UseCases/EvaluateRoomUseCase.js';

// Infrastructure
import { JsonLevelRepository } from './Infrastructure/Repositories/JsonLevelRepository.js';
import { JsonItemCatalog } from './Infrastructure/DataLoaders/JsonItemCatalog.js';
import { JsonStyleCatalog } from './Infrastructure/DataLoaders/JsonStyleCatalog.js';
import { JsonFeedbackCatalog } from './Infrastructure/DataLoaders/JsonFeedbackCatalog.js';
import { SchemaLoader } from './Infrastructure/DataLoaders/SchemaLoader.js';

// Presentation
import { GameController } from './Presentation/Controllers/GameController.js';
import { RoomView } from './Presentation/Views/RoomView.js';
import { ItemCatalogView } from './Presentation/Views/ItemCatalogView.js';
import { ToolbarView } from './Presentation/Views/ToolbarView.js';
import { EvaluationView } from './Presentation/Views/EvaluationView.js';

// Config
import { SCENE, BOXES, MAX_BOX } from './config.js';

// =============================================================================
// Boot Error Overlay — диагностический оверлей при ошибке инициализации
// =============================================================================
class BootErrorOverlay {
    constructor(container, isDev = true) {
        this.container = container;
        this.isDev = isDev;
        this.element = null;
    }

    showError(error, errorCode = 'BOOT_UNKNOWN') {
        if (this.element) this.element.remove();

        this.element = document.createElement('div');
        Object.assign(this.element.style, {
            position: 'fixed',
            top: '0', left: '0', right: '0', bottom: '0',
            background: 'rgba(18, 21, 27, 0.98)',
            color: '#e0e8f0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '9999',
            padding: '40px'
        });

        const errorTitle = document.createElement('h1');
        errorTitle.textContent = 'Не удалось запустить игру';
        errorTitle.style.cssText = 'font-size: 28px; margin-bottom: 16px; color: #ff6b6b;';

        const errorCodeEl = document.createElement('div');
        errorCodeEl.textContent = `Код ошибки: ${errorCode}`;
        errorCodeEl.style.cssText = 'font-size: 14px; color: #8a93a6; margin-bottom: 24px; font-family: monospace;';

        const errorMsg = document.createElement('div');
        errorMsg.textContent = error.message || 'Неизвестная ошибка';
        errorMsg.style.cssText = 'font-size: 16px; margin-bottom: 16px; max-width: 600px; text-align: center;';

        this.element.appendChild(errorTitle);
        this.element.appendChild(errorCodeEl);
        this.element.appendChild(errorMsg);

        if (this.isDev && error.stack) {
            const stackEl = document.createElement('pre');
            stackEl.textContent = error.stack;
            stackEl.style.cssText = 'font-size: 12px; color: #5c6b7f; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; max-width: 800px; max-height: 300px; overflow: auto; margin-top: 24px;';
            this.element.appendChild(stackEl);
        }

        const reloadBtn = document.createElement('button');
        reloadBtn.textContent = 'Перезагрузить';
        reloadBtn.style.cssText = 'margin-top: 32px; padding: 12px 32px; font-size: 16px; background: #0066FF; color: white; border: none; border-radius: 8px; cursor: pointer;';
        reloadBtn.onclick = () => location.reload();
        this.element.appendChild(reloadBtn);

        this.container.appendChild(this.element);
    }

    isVisible() {
        return this.element !== null;
    }
}

// =============================================================================
// Инициализация приложения
// =============================================================================
async function bootstrap() {
    const appContainer = document.getElementById('app');
    const errorOverlay = new BootErrorOverlay(document.body, import.meta.env?.DEV ?? true);

    try {
        // 1. Загружаем схему уровня для валидации
        const schema = await SchemaLoader.loadLevelSchema();

        // 2. Инициализируем репозитории (Infrastructure)
        const levelRepository = new JsonLevelRepository('./data/levels', schema);
        const itemCatalog = new JsonItemCatalog('./data/items');
        const styleCatalog = new JsonStyleCatalog('./data/styles');
        const feedbackCatalog = new JsonFeedbackCatalog('./data/feedback');

        // 3. Загружаем каталоги
        await itemCatalog.loadAllItems();
        await styleCatalog.loadAllStyles();
        await feedbackCatalog.loadAllFeedback();

        // 4. Инициализируем доменные сервисы
        const constraintEvaluator = new ConstraintEvaluator();
        const styleScorer = new StyleScorer(scoringParameters);
        const starRatingPolicy = new StarRatingPolicy(scoringParameters.starThresholds);

        // 5. Инициализируем UseCases (Application)
        const loadLevelUseCase = new LoadLevelUseCase(levelRepository);
        const placeItemUseCase = new PlaceItemUseCase(levelRepository);
        const moveItemUseCase = new MoveItemUseCase(levelRepository);
        const rotateItemUseCase = new RotateItemUseCase(levelRepository);
        const removeItemUseCase = new RemoveItemUseCase(levelRepository);
        const evaluateRoomUseCase = new EvaluateRoomUseCase(
            levelRepository,
            constraintEvaluator,
            styleScorer,
            starRatingPolicy
        );

        // 6. Инициализируем Three.js сцену
        const canvas = document.getElementById('room-canvas');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(SCENE.background);
        scene.fog = new THREE.Fog(
            SCENE.background,
            SCENE.fog.near,
            SCENE.fog.far
        );

        const camera = new THREE.PerspectiveCamera(
            SCENE.camera.fov,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            100
        );
        camera.position.set(
            SCENE.camera.position.x,
            SCENE.camera.position.y,
            SCENE.camera.position.z
        );

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const controls = new OrbitControls(camera, canvas);
        controls.target.set(
            SCENE.orbit.target.x,
            SCENE.orbit.target.y,
            SCENE.orbit.target.z
        );
        controls.minDistance = SCENE.orbit.minDistance;
        controls.maxDistance = SCENE.orbit.maxDistance;
        controls.maxPolarAngle = SCENE.orbit.maxPolarAngle;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // 7. Добавляем освещение
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        scene.add(directionalLight);

        // 8. Создаём пол (визуальный ориентир)
        const floorGeometry = new THREE.PlaneGeometry(MAX_BOX.w * 2, MAX_BOX.d * 2);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2d35,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        scene.add(floor);

        // Сетка на полу
        const gridHelper = new THREE.GridHelper(MAX_BOX.w * 2, 10, SCENE.accent, 0x4a4d55);
        scene.add(gridHelper);

        // 9. Инициализируем контроллер игры
        const controller = new GameController({
            loadLevelUseCase,
            placeItemUseCase,
            moveItemUseCase,
            rotateItemUseCase,
            removeItemUseCase,
            evaluateRoomUseCase,
            itemCatalog,
            scene,
            camera,
            renderer,
            controls
        });

        const toolbarContainer = document.getElementById('toolbar-container');
        const catalogContainer = document.getElementById('catalog-container');
        const evaluationContainer = document.getElementById('evaluation-container');

        await controller.init(
            canvas,
            catalogContainer,
            toolbarContainer,
            evaluationContainer
        );

        // 10. Загружаем первый уровень
        const levelId = new URLSearchParams(location.search).get('level') || 'level-001';
        await controller.loadLevel(levelId);

        // 11. Render loop
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        // 12. Handle resize
        window.addEventListener('resize', () => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        });

        console.log('✓ Decorium initialized successfully!');

    } catch (error) {
        console.error('Bootstrap error:', error);
        errorOverlay.showError(error, 'BOOT_INIT_FAILED');
    }
}

// Запуск приложения
bootstrap().catch(error => {
    console.error('Fatal error:', error);
    const overlay = new BootErrorOverlay(document.body, true);
    overlay.showError(error, 'BOOT_FATAL');
});