/**
 * Port for loading validated authored presentation environment profiles.
 */
export class PresentationEnvironmentRepository {
  async getById(_profileId) {
    throw new Error('Method "getById" must be implemented by infrastructure.');
  }
}

export default PresentationEnvironmentRepository;
