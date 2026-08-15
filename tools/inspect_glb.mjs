import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) throw new Error('Usage: node tools/inspect_glb.mjs <asset.glb>');
const bytes = readFileSync(path);
const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
const jsonLength = view.getUint32(12, true);
const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8').trim());
console.log(JSON.stringify({
  bytes: bytes.byteLength,
  images: json.images?.length ?? 0,
  textures: json.textures?.length ?? 0,
  materials: json.materials?.map(material => ({
    name: material.name,
    baseColor: Boolean(material.pbrMetallicRoughness?.baseColorTexture),
    metallicRoughness: Boolean(material.pbrMetallicRoughness?.metallicRoughnessTexture),
    normal: Boolean(material.normalTexture),
    occlusion: Boolean(material.occlusionTexture)
  })) ?? []
}, null, 2));
