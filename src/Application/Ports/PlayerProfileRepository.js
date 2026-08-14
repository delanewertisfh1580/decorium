export class PlayerProfileRepository {
  async load() {
    throw new Error('PlayerProfileRepository.load must be implemented by an infrastructure adapter.');
  }

  async save(_profile) {
    throw new Error('PlayerProfileRepository.save must be implemented by an infrastructure adapter.');
  }
}

export default PlayerProfileRepository;
