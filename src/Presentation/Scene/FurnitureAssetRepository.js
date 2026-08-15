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
  clone.name = `asset:${asset.assetId}`;
  clone.userData.assetId = asset.assetId;
  clone.userData.assetPath = asset.path;
  clone.userData.assetState = 'ready';
  clone.traverse(object => {
    if (!object.isMesh) return;
    object.material = cloneMaterial(object.material);
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData.kind = 'item-asset-part';
    object.userData.assetId = asset.assetId;
    if (object.material?.color) object.userData.baseColor = object.material.color.getHex();
  });
  return clone;
}

export class FurnitureAssetRepository {
  constructor({ manifest = null, manifests = null, loadAsset = defaultLoadAsset }) {
    const resolvedManifests = manifests ?? (manifest ? [manifest] : []);
    if (!Array.isArray(resolvedManifests) || resolvedManifests.length === 0 || resolvedManifests.some(candidate => !candidate?.schemaVersion || !Array.isArray(candidate.assets))) {
      throw new Error('FurnitureAssetRepository requires one or more versioned asset manifests');
    }
    if (typeof loadAsset !== 'function') throw new Error('FurnitureAssetRepository loadAsset must be a function');
    this.assetsByItemId = new Map();
    for (const sourceManifest of resolvedManifests) {
      for (const asset of sourceManifest.assets) {
        if (this.assetsByItemId.has(asset.itemId)) throw new Error(`FurnitureAssetRepository duplicate item asset: ${asset.itemId}`);
        this.assetsByItemId.set(asset.itemId, Object.freeze({ ...asset }));
      }
    }
    this.loadAsset = loadAsset;
    this.sourcesByAssetId = new Map();
  }

  hasItem(itemId) {
    return this.assetsByItemId.has(itemId);
  }

  async createForItemId(itemId) {
    const asset = this.assetsByItemId.get(itemId);
    if (!asset) return null;
    let source = this.sourcesByAssetId.get(asset.assetId);
    if (!source) {
      source = Promise.resolve(this.loadAsset(asset.path));
      this.sourcesByAssetId.set(asset.assetId, source);
    }
    return prepareClone(await source, asset);
  }
}

export default FurnitureAssetRepository;
