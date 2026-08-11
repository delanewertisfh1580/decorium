export class EvaluationViewModel {
  constructor() { this.reset(); }

  get score() { return this._result?.score ?? 0; }
  get stars() { return this._result?.stars ?? 0; }
  get feedback() {
    const feedback = this._result?.feedback ?? [];
    return Array.isArray(feedback) ? feedback : [feedback];
  }
  get violations() { return this._result?.violations ?? []; }
  get isVisible() { return this._result !== null; }
  update(result) { this._result = result; }
  hide() { this._result = null; }
  reset() { this._result = null; }
}
