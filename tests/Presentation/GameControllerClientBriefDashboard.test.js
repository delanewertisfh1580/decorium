// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { GameController } from '../../src/Presentation/Controllers/GameController.js';

describe('GameController ClientBrief dashboard context', () => {
  it('renders the client, authored brief and client priorities without calculating or rewriting policy', () => {
    document.body.innerHTML = '<div id="dashboard-container"></div>';
    const controller = new GameController({});
    controller.toolbarView = {
      renderContextActions: () => {},
      setSelectionState: () => {},
      setUndoState: () => {}
    };
    controller.roomViewModel = {
      placedItems: [],
      selectedItemId: null
    };
    controller.level = {
      name: 'Уютный уголок',
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

    const dashboard = document.getElementById('dashboard-container');
    expect(dashboard.textContent).toContain('Денис');
    expect(dashboard.textContent).toContain('Уютный вечерний уголок');
    expect(dashboard.textContent).toContain('Клиент любит собранные, камерные пространства.');
    expect(dashboard.textContent).toContain('Комфортный просмотр');
    expect(dashboard.querySelectorAll('[data-client-priority]').length).toBe(2);
    expect(dashboard.textContent).not.toContain('Старый presentation subtitle');
  });
});
