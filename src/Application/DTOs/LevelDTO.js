export default class LevelDTO {
  constructor({ levelId, roomId, name, roomState, baselineRoomState = null, availableItems, styleId, targetScore = 3, presentationEnvironment = null, clientBrief = null, evaluationSpec = null, interiorRecipe = null, generationSeed = null, surfaceFinishes = [], unlockedIds = [], mode = 'campaign', run = null }) {
    if (!levelId || typeof levelId !== 'string') throw new Error('LevelDTO: levelId is required');
    if (!roomId || typeof roomId !== 'string') throw new Error('LevelDTO: roomId is required');
    if (!roomState) throw new Error('LevelDTO: roomState is required');
    if (!Array.isArray(availableItems)) throw new Error('LevelDTO: availableItems must be an array');
    if (!styleId || typeof styleId !== 'string') throw new Error('LevelDTO: styleId is required');
    if (generationSeed !== null && (!Number.isInteger(generationSeed) || generationSeed < 0)) throw new Error('LevelDTO: generationSeed must be a non-negative integer or null');
    if (!Array.isArray(surfaceFinishes)) throw new Error('LevelDTO: surfaceFinishes must be an array');
    if (!Array.isArray(unlockedIds)) throw new Error('LevelDTO: unlockedIds must be an array');
    if (!['campaign', 'endless'].includes(mode)) throw new Error('LevelDTO: mode must be campaign or endless');
    if (run !== null && (!run || typeof run !== 'object' || Array.isArray(run))) throw new Error('LevelDTO: run must be an object or null');

    this.levelId = levelId;
    this.roomId = roomId;
    this.name = name || levelId;
    this.roomState = roomState;
    this.baselineRoomState = baselineRoomState ?? roomState;
    this.availableItems = availableItems;
    this.styleId = styleId;
    this.targetScore = targetScore;
    this.presentationEnvironment = presentationEnvironment;
    this.clientBrief = clientBrief;
    this.evaluationSpec = evaluationSpec;
    this.interiorRecipe = interiorRecipe;
    this.generationSeed = generationSeed;
    this.surfaceFinishes = Object.freeze([...surfaceFinishes]);
    this.unlockedIds = Object.freeze([...unlockedIds]);
    this.mode = mode;
    this.run = run ? Object.freeze({ ...run }) : null;
  }
}
