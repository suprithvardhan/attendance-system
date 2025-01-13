import * as faceapi from 'face-api.js';

let modelsLoaded = false;
const descriptorCache = new Map<string, Float32Array>();

export async function loadModels() {
  if (!modelsLoaded) {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
    modelsLoaded = true;
  }
}

export async function getFaceDescriptor(imageData: string): Promise<Float32Array | null> {
  await loadModels();
  
  if (descriptorCache.has(imageData)) {
    return descriptorCache.get(imageData)!;
  }

  const img = await faceapi.fetchImage(imageData);
  const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
  
  if (detections) {
    descriptorCache.set(imageData, detections.descriptor);
    return detections.descriptor;
  }
  
  return null;
}

export function compareFaces(descriptor1: Float32Array, descriptor2: Float32Array): number {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
}

export const FACE_SIMILARITY_THRESHOLD = 0.4; // Adjust this value as needed