import { EvaluationViewModel } from '../ViewModels/EvaluationViewModel.js';

export class EvaluationCoordinator {
  constructor({
    evaluateRoomUseCase,
    recordLevelCompletionUseCase = null,
    getEvaluationView = () => null,
    onProfileUpdated = () => {},
    onCompleted = async () => {},
    onStatus = () => {},
    onRequestDashboardRender = () => {},
    onRequestRoomRender = () => {},
    onFocusItem = () => {}
  } = {}) {
    this.evaluateRoomUseCase = evaluateRoomUseCase;
    this.recordLevelCompletionUseCase = recordLevelCompletionUseCase;
    this.getEvaluationView = getEvaluationView;
    this.onProfileUpdated = onProfileUpdated;
    this.onCompleted = onCompleted;
    this.onStatus = onStatus;
    this.onRequestDashboardRender = onRequestDashboardRender;
    this.onRequestRoomRender = onRequestRoomRender;
    this.onFocusItem = onFocusItem;
    this.viewModel = new EvaluationViewModel();
  }

  async evaluate({ level, roomViewModel, profile = null } = {}) {
    if (!level || !roomViewModel || !this.evaluateRoomUseCase?.execute) {
      return { success: false, error: 'EVALUATION_CONTEXT_UNAVAILABLE' };
    }
    const result = await this.evaluateRoomUseCase.execute({
      roomId: level.roomId,
      evaluationSpec: level.evaluationSpec
    });
    if (!result.success) {
      this.onStatus(result.error);
      return result;
    }

    if (level.mode !== 'endless' && this.recordLevelCompletionUseCase?.execute && profile) {
      const completion = await this.recordLevelCompletionUseCase.execute({
        levelId: level.levelId,
        stars: result.evaluationData.stars,
        targetScore: level.targetScore,
        ...(typeof result.evaluationData.completionEligible === 'boolean'
          ? { completionEligible: result.evaluationData.completionEligible }
          : {}),
        profile
      });
      if (completion.success) {
        this.onProfileUpdated(completion.data);
        if (completion.didComplete) await this.onCompleted(completion.data);
      } else {
        this.onStatus(`Оценка рассчитана, но прогресс не сохранён: ${completion.error}`);
      }
    }

    if (level.mode === 'endless' && result.evaluationData.completionEligible) {
      this.onStatus('Бесконечный заказ завершён. Запустите новый seed для следующего задания.');
    }
    this.viewModel.update(result.evaluationData);
    this.getEvaluationView()?.render(result.evaluationData);
    this.onRequestDashboardRender();
    return result;
  }

  invalidate() {
    if (!this.viewModel.isVisible) return false;
    this.reset();
    return true;
  }

  reset() {
    this.viewModel.reset();
    this.getEvaluationView()?.hide();
    this.onRequestDashboardRender();
  }

  focusExplanation(instanceId, { roomViewModel } = {}) {
    const placed = roomViewModel?.roomState?.getItem(instanceId);
    if (!placed) {
      this.onStatus('Предмет из результата оценки больше не находится в комнате. Оцените комнату повторно.');
      return false;
    }
    this.onFocusItem(instanceId, placed);
    this.onStatus(`Выбран предмет из объяснения: ${placed.item.name}`);
    this.onRequestRoomRender();
    return true;
  }
}

export default EvaluationCoordinator;
