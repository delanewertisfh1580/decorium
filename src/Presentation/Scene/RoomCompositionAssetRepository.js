import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const sharedLoader = new GLTFLoader();

function defaultLoadAsset(path) {
  return sharedLoader.loadAsync(path).then(result => result.scene);
}

function cloneMaterial(material) {
  if (Array.isArray(material)) return material.map(entry => entry.clone());
  return material?.clone?.() ?? material;
}

function prepareClone(source, asset) {
  const clone = source.clone(true);
  clone.name = `room-composition:${asset.assetId}`;
  clone.userData.assetId = asset.assetId;
  clone.userData.assetPath = asset.path;
  clone.userData.environmentProfileId = asset.environmentProfileId;
  clone.userData.assetState = 'ready';
  clone.userData.kind = 'room-composition-asset';
  clone.traverse(object => {
    if (!object.isMesh) return;
    object.material = cloneMaterial(object.material);
    object.castShadow = false;
    object.receiveShadow = true;
    object.userData.kind = 'room-composition-asset-part';
    object.userData.assetId = asset.assetId;
    object.userData.environmentProfileId = asset.environmentProfileId;
    if (object.material?.color) object.userData.baseColor = object.material.color.getHex();
  });
  return clone;
}

export class RoomCompositionAssetRepository {
  constructor({ manifest, loadAsset = defaultLoadAsset }) {
    if (!manifest?.schemaVersion || !Array.isArray(manifest.assets) || manifest.assets.length === 0) {
      throw new Error('RoomCompositionAssetRepository requires a versioned room-composition manifest');
    }
    if (typeof loadAsset !== 'function') throw new Error('RoomCompositionAssetRepository loadAsset must be a function');
    this.assetsByEnvironmentProfileId = new Map();
    for (const asset of manifest.assets) {
      if (!asset.environmentProfileId || this.assetsByEnvironmentProfileId.has(asset.environmentProfileId)) {
        throw new Error(`RoomCompositionAssetRepository duplicate environment profile asset: ${asset.environmentProfileId}`);
      }
      this.assetsByEnvironmentProfileId.set(asset.environmentProfileId, Object.freeze({ ...asset }));
    }
    this.loadAsset = loadAsset;
    this.sourcesByAssetId = new Map();
  }

  hasEnvironmentProfile(environmentProfileId) {
    return this.assetsByEnvironmentProfileId.has(environmentProfileId);
  }

  async createForEnvironmentProfile(environmentProfileId) {
    const asset = this.assetsByEnvironmentProfileId.get(environmentProfileId);
    if (!asset) return null;
    let source = this.sourcesByAssetId.get(asset.assetId);
    if (!source) {
      source = Promise.resolve(this.loadAsset(asset.path));
      this.sourcesByAssetId.set(asset.assetId, source);
    }
    return prepareClone(await source, asset);
  }
}

export default RoomCompositionAssetRepository;
