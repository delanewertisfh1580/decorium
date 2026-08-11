/**
 * Главный контроллер игры (Game Loop + MVC координация).
 * Обрабатывает ввод пользователя, координирует UseCase и View.
 * 
 * @class GameController
 */
export class GameController {
    /**
     * @param {Object} dependencies 
     * @param {import('../Application/UseCases/LoadLevelUseCase.js').LoadLevelUseCase} dependencies.loadLevelUseCase
     * @param {import('../Application/UseCases/PlaceItemUseCase.js').PlaceItemUseCase} dependencies.placeItemUseCase
     * @param {import('../Application/UseCases/MoveItemUseCase.js').MoveItemUseCase} dependencies.moveItemUseCase
     * @param {import('../Application/UseCases/RotateItemUseCase.js').RotateItemUseCase} dependencies.rotateItemUseCase
     * @param {import('../Application/UseCases/RemoveItemUseCase.js').RemoveItemUseCase} dependencies.removeItemUseCase
     * @param {import('../Application/UseCases/EvaluateRoomUseCase.js').EvaluateRoomUseCase} dependencies.evaluateRoomUseCase
     * @param {import('../Infrastructure/DataLoaders/JsonItemCatalog.js').JsonItemCatalog} dependencies.itemCatalog
     * @param {THREE.Scene} dependencies.scene
     * @param {THREE.PerspectiveCamera} dependencies.camera
     * @param {THREE.WebGLRenderer} dependencies.renderer
     * @param {import('three/addons/controls/OrbitControls.js').OrbitControls} dependencies.controls
     */
    constructor(dependencies) {
        this._loadLevel = dependencies.loadLevelUseCase;
        this._placeItem = dependencies.placeItemUseCase;
        this._moveItem = dependencies.moveItemUseCase;
        this._rotateItem = dependencies.rotateItemUseCase;
        this._removeItem = dependencies.removeItemUseCase;
        this._evaluateRoom = dependencies.evaluateRoomUseCase;
        this._itemCatalog = dependencies.itemCatalog;
        this._scene = dependencies.scene;
        this._camera = dependencies.camera;
        this._renderer = dependencies.renderer;
        this._controls = dependencies.controls;

        this._roomViewModel = null;
        this._evaluationViewModel = null;
        this._selectedItemId = null;
        this._catalogItems = [];

        // View компоненты (инициализируются позже)
        this._roomView = null;
        this._catalogView = null;
        this._toolbarView = null;
        this._evaluationView = null;
        
        // Предметы на сцене
        this._itemMeshes = new Map();
    }

    /**
     * Инициализация контроллера
     * @param {HTMLCanvasElement} roomCanvas 
     * @param {HTMLElement} catalogContainer 
     * @param {HTMLElement} toolbarContainer 
     * @param {HTMLElement} evaluationContainer 
     */
    async init(roomCanvas, catalogContainer, toolbarContainer, evaluationContainer) {
        const { RoomView } = await import('../Views/RoomView.js');
        const { ItemCatalogView } = await import('../Views/ItemCatalogView.js');
        const { ToolbarView } = await import('../Views/ToolbarView.js');
        const { EvaluationView } = await import('../Views/EvaluationView.js');
        const { EvaluationViewModel } = await import('../ViewModels/EvaluationViewModel.js');

        this._evaluationViewModel = new EvaluationViewModel();
        this._roomView = new RoomView(roomCanvas, null);
        this._catalogView = new ItemCatalogView(catalogContainer, (itemId) => this._onCatalogSelect(itemId));
        this._toolbarView = new ToolbarView(toolbarContainer, {
            onDelete: () => this._onDelete(),
            onRotate: () => this._onRotate(),
            onEvaluate: () => this._onEvaluate()
        });
        this._evaluationView = new EvaluationView(evaluationContainer);

        await this._roomView.init();
        await this._catalogView.init();
        await this._toolbarView.init();
        await this._evaluationView.init();

        this._setupInputHandlers();
    }

    /**
     * Загрузка уровня
     * @param {string} levelId 
     */
    async loadLevel(levelId) {
        const result = await this._loadLevel.execute(levelId);
        if (!result.success) {
            console.error('Failed to load level:', result.error);
            return;
        }

        const { RoomViewModel } = await import('../ViewModels/RoomViewModel.js');
        const { ItemViewModel } = await import('../ViewModels/ItemViewModel.js');

        this._roomViewModel = new RoomViewModel(result.data);
        this._roomView._viewModel = this._roomViewModel;
        
        // Загружаем каталог предметов для этого уровня
        const allItems = await this._itemCatalog.loadAllItems();
        this._catalogItems = allItems.map(item => new ItemViewModel(item));
        
        this._renderAll();
    }

    _renderAll() {
        this._roomView.render();
        this._catalogView.render(this._catalogItems);
        this._evaluationView.render(this._evaluationViewModel);
    }

    _setupInputHandlers() {
        // Клик по комнате - выбор/перемещение предмета
        this._roomView._canvas.addEventListener('click', (e) => this._onRoomClick(e));
        
        // Обработка клавиатуры
        document.addEventListener('keydown', (e) => this._onKeyDown(e));
    }

    _onRoomClick(e) {
        const pos = this._roomView.getGridPosition(e.clientX, e.clientY);
        
        if (this._selectedItemId) {
            // Пытаемся переместить выбранный предмет
            const result = this._moveItem.execute(
                this._roomViewModel.id,
                this._selectedItemId,
                pos.x,
                pos.y
            );
            
            if (result.success) {
                const updatedItem = this._roomViewModel.getItemById(this._selectedItemId);
                // Обновляем ViewModel
                this._catalogItems.forEach(vm => {
                    if (vm.id === updatedItem.id) vm.update(updatedItem);
                });
            }
        } else {
            // Выбираем предмет в этой клетке
            const item = this._roomViewModel.placedItems.find(
                i => i.position.x === pos.x && i.position.y === pos.y
            );
            
            if (item) {
                this._selectItem(item.id);
            } else {
                this._clearSelection();
            }
        }
        
        this._renderAll();
    }

    _onCatalogSelect(itemId) {
        // Размещаем предмет из каталога в центре комнаты
        const itemVm = this._catalogItems.find(i => i.id === itemId);
        if (!itemVm) return;

        const centerX = Math.floor(this._roomViewModel.width / 2);
        const centerY = Math.floor(this._roomViewModel.height / 2);

        const result = this._placeItem.execute(
            this._roomViewModel.id,
            itemId,
            centerX,
            centerY
        );

        if (result.success) {
            itemVm.markAsPlaced();
            // Получаем обновленный предмет из комнаты
            const placedItem = this._roomViewModel.getItemById(itemId);
            if (placedItem) {
                itemVm.update(placedItem);
            }
            this._renderAll();
        }
    }

    _selectItem(itemId) {
        this._selectedItemId = itemId;
        this._roomViewModel.selectItem(itemId);
        this._toolbarView.setSelectionState(true);
    }

    _clearSelection() {
        this._selectedItemId = null;
        this._roomViewModel.clearSelection();
        this._toolbarView.setSelectionState(false);
    }

    _onDelete() {
        if (!this._selectedItemId) return;

        const result = this._removeItem.execute(
            this._roomViewModel.id,
            this._selectedItemId
        );

        if (result.success) {
            const itemVm = this._catalogItems.find(i => i.id === this._selectedItemId);
            if (itemVm) itemVm.markAsRemoved();
            this._clearSelection();
            this._renderAll();
        }
    }

    _onRotate() {
        if (!this._selectedItemId) return;

        const result = this._rotateItem.execute(
            this._roomViewModel.id,
            this._selectedItemId,
            90 // Поворот на 90 градусов
        );

        if (result.success) {
            const updatedItem = this._roomViewModel.getItemById(this._selectedItemId);
            const itemVm = this._catalogItems.find(i => i.id === updatedItem.id);
            if (itemVm) itemVm.update(updatedItem);
            this._renderAll();
        }
    }

    async _onEvaluate() {
        const constraints = this._roomViewModel.constraints || [];
        const result = await this._evaluateRoom.execute(
            this._roomViewModel.id,
            constraints
        );

        if (result.success) {
            this._evaluationViewModel.update(
                result.data.score,
                100, // maxScore - должен приходить из use case
                result.data.stars,
                result.data.feedback
            );
            this._evaluationView.render(this._evaluationViewModel);
        }
    }

    _onKeyDown(e) {
        switch(e.key.toLowerCase()) {
            case 'delete':
            case 'backspace':
                this._onDelete();
                break;
            case 'r':
                this._onRotate();
                break;
            case 'e':
                this._onEvaluate();
                break;
        }
    }

    destroy() {
        this._roomView.destroy();
        this._catalogView.destroy();
        this._toolbarView.destroy();
        this._evaluationView.destroy();
    }
}
