export class UndoBuffer {
  constructor(limit = 20) {
    this.limit = Math.max(1, Number.isInteger(limit) ? limit : 20);
    this._commands = [];
  }

  get canUndo() {
    return this._commands.length > 0;
  }

  get nextLabel() {
    return this._commands.at(-1)?.label ?? null;
  }

  get size() {
    return this._commands.length;
  }

  push(command) {
    if (!command || typeof command.undo !== 'function') return false;
    this._commands.push({
      label: command.label ?? 'Последнее действие',
      undo: command.undo
    });
    if (this._commands.length > this.limit) this._commands.shift();
    return true;
  }

  async undo() {
    const command = this._commands.pop();
    if (!command) return { success: false, label: null };

    try {
      const value = await command.undo();
      return value === undefined
        ? { success: true, label: command.label }
        : { success: true, label: command.label, value };
    } catch (error) {
      this._commands.push(command);
      throw error;
    }
  }

  clear() {
    this._commands.length = 0;
  }
}

export default UndoBuffer;
