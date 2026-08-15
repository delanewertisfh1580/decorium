import { readFileSync, writeFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) throw new Error('Usage: node tools/add_gltf_ao_binding.mjs <asset.glb>');
const bytes = readFileSync(path);
const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) throw new Error('Expected GLB v2');
const jsonLength = view.getUint32(12, true);
const jsonType = view.getUint32(16, true);
if (jsonType !== 0x4e4f534a) throw new Error('Expected JSON GLB chunk');
const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8').trim());

for (const material of json.materials ?? []) {
  const ormTexture = material.pbrMetallicRoughness?.metallicRoughnessTexture;
  if (ormTexture) material.occlusionTexture = { index: ormTexture.index, texCoord: 1, strength: 0.78 };
}

const encoded = Buffer.from(JSON.stringify(json));
const paddedLength = Math.ceil(encoded.length / 4) * 4;
const paddedJson = Buffer.concat([encoded, Buffer.alloc(paddedLength - encoded.length, 0x20)]);
const rest = bytes.subarray(20 + jsonLength);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(20 + paddedJson.length + rest.length, 8);
header.writeUInt32LE(paddedJson.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
writeFileSync(path, Buffer.concat([header, paddedJson, rest]));
console.log(`BOUND_AO ${path}`);
