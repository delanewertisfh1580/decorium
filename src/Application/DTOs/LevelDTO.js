export default class LevelDTO {
  constructor({ levelId, roomId, name, roomState, availableItems, styleId, targetScore = 3, presentationEnvironment = null, clientBrief = null, evaluationSpec = null }) {
    if (!levelId || typeof levelId !== 'string') throw new Error('LevelDTO: levelId is required');
    if (!roomId || typeof roomId !== 'string') throw new Error('LevelDTO: roomId is required');
    if (!roomState) throw new Error('LevelDTO: roomState is required');
    if (!Array.isArray(availableItems)) throw new Error('LevelDTO: availableItems must be an array');
    if (!styleId || typeof styleId !== 'string') throw new Error('LevelDTO: styleId is required');

    this.levelId = levelId;
    this.roomId = roomId;
    this.name = name || levelId;
    this.roomState = roomState;
    this.availableItems = availableItems;
    this.styleId = styleId;
    this.targetScore = targetScore;
    this.presentationEnvironment = presentationEnvironment;
    this.clientBrief = clientBrief;
    this.evaluationSpec = evaluationSpec;
  }
}
