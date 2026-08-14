import PlayerProfile from '../../Domain/Profile/PlayerProfile.js';

export class BrowserPlayerProfileFactory {
  constructor({ idProvider, timestampProvider } = {}) {
    if (typeof idProvider !== 'function') {
      throw new Error('BrowserPlayerProfileFactory: idProvider is required.');
    }
    if (typeof timestampProvider !== 'function') {
      throw new Error('BrowserPlayerProfileFactory: timestampProvider is required.');
    }
    this.idProvider = idProvider;
    this.timestampProvider = timestampProvider;
  }

  create() {
    return PlayerProfile.create({
      profileId: this.idProvider(),
      timestamp: this.timestampProvider()
    });
  }
}

export default BrowserPlayerProfileFactory;
