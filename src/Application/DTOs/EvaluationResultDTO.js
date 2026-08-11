export default class EvaluationResultDTO {
  constructor(success, evaluationData = null, error = null) {
    this.success = success;
    this.evaluationData = evaluationData;
    this.error = error;
    Object.freeze(this);
  }

  static success(data) { return new EvaluationResultDTO(true, data, null); }
  static failure(error) { return new EvaluationResultDTO(false, null, error); }
}
