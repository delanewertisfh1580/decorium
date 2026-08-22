import { describe, expect, it, vi } from 'vitest';
import { GameController } from '../../src/Presentation/Controllers/GameController.js';

describe('GameController ClientBrief dashboard context', () => {
  it('forwards the authored client brief and presentation state to the dashboard without calculating or rewriting policy', () => {
    const controller = new GameController({});
    const dashboardView = { render: vi.fn() };
    controller.dashboardView = dashboardView;
    controller.toolbarView = {
      setSelectionState: vi.fn(),
      setUndoState: vi.fn()
    };
    controller.roomViewModel = {
      name: 'Уютный уголок',
      placedItems: [],
      selectedItemId: null
    };
    controller.level = {
      clientBrief: {
        client: { displayName: 'Денис' },
        title: 'Уютный вечерний уголок',
        summary: 'Клиент любит собранные, камерные пространства.',
        clientPriorities: [
          { id: 'media-comfort', label: 'Комфортный просмотр', weight: 1.3 },
          { id: 'warm-intimacy', label: 'Камерная атмосфера', weight: 1.15 }
        ]
      },
      presentationEnvironment: { presentation: { subtitle: 'Старый presentation subtitle' } }
    };

    controller._renderDashboard();

    expect(dashboardView.render).toHaveBeenCalledWith({
      roomName: 'Уютный уголок',
      placedCount: 0,
      evaluation: null,
      clientBrief: controller.level.clientBrief
    });
    expect(dashboardView.render.mock.calls[0][0].clientBrief.clientPriorities).toHaveLength(2);
    expect(controller.toolbarView.setSelectionState).toHaveBeenCalledWith(false);
  });
});
