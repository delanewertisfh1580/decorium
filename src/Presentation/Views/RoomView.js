/**
 * View для отображения комнаты и предметов.
 * Использует Canvas API для рендеринга.
 * 
 * @implements {import('./IView.js').IView}
 */
export class RoomView {
    /**
     * @param {HTMLCanvasElement} canvas 
     * @param {import('../ViewModels/RoomViewModel.js').RoomViewModel} viewModel 
     */
    constructor(canvas, viewModel) {
        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');
        this._viewModel = viewModel;
        this._tileSize = 50; // Размер клетки в пикселях
        this._itemColors = {
            default: '#4CAF50',
            selected: '#FFC107',
            invalid: '#F44336'
        };
    }

    async init() {
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    render() {
        this._clear();
        this._drawGrid();
        this._drawRoom();
        this._drawItems();
    }

    destroy() {
        window.removeEventListener('resize', () => this._resize());
    }

    _resize() {
        const room = this._viewModel;
        this._canvas.width = room.width * this._tileSize;
        this._canvas.height = room.height * this._tileSize;
        this.render();
    }

    _clear() {
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }

    _drawGrid() {
        const { width, height } = this._viewModel;
        this._ctx.strokeStyle = '#e0e0e0';
        this._ctx.lineWidth = 1;

        for (let x = 0; x <= width; x++) {
            this._ctx.beginPath();
            this._ctx.moveTo(x * this._tileSize, 0);
            this._ctx.lineTo(x * this._tileSize, height * this._tileSize);
            this._ctx.stroke();
        }

        for (let y = 0; y <= height; y++) {
            this._ctx.beginPath();
            this._ctx.moveTo(0, y * this._tileSize);
            this._ctx.lineTo(width * this._tileSize, y * this._tileSize);
            this._ctx.stroke();
        }
    }

    _drawRoom() {
        const { width, height } = this._viewModel;
        this._ctx.strokeStyle = '#333';
        this._ctx.lineWidth = 3;
        this._ctx.strokeRect(0, 0, width * this._tileSize, height * this._tileSize);
    }

    _drawItems() {
        const items = this._viewModel.placedItems;
        const selectedId = this._viewModel.selectedItemId;

        items.forEach(item => {
            const x = item.position.x * this._tileSize;
            const y = item.position.y * this._tileSize;
            const size = this._tileSize - 4;
            const isSelected = item.id === selectedId;

            this._ctx.fillStyle = isSelected ? this._itemColors.selected : this._itemColors.default;
            
            // Сохраняем контекст для поворота
            this._ctx.save();
            this._ctx.translate(x + this._tileSize / 2, y + this._tileSize / 2);
            this._ctx.rotate(item.rotation.angle * Math.PI / 180);
            this._ctx.fillRect(-size / 2, -size / 2, size, size);
            this._ctx.restore();

            // Рамка для выделения
            if (isSelected) {
                this._ctx.strokeStyle = '#000';
                this._ctx.lineWidth = 2;
                this._ctx.strokeRect(x + 2, y + 2, size, size);
            }
        });
    }

    /**
     * Получает координаты клетки по клику
     * @param {number} clientX 
     * @param {number} clientY 
     * @returns {{x: number, y: number}}
     */
    getGridPosition(clientX, clientY) {
        const rect = this._canvas.getBoundingClientRect();
        const x = Math.floor((clientX - rect.left) / this._tileSize);
        const y = Math.floor((clientY - rect.top) / this._tileSize);
        return { x, y };
    }

    /**
     * Устанавливает размер клетки
     * @param {number} size 
     */
    setTileSize(size) {
        this._tileSize = size;
        this._resize();
    }
}
