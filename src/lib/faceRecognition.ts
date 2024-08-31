import * as faceapi from 'face-api.js';

let modelsLoaded = false;

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
  const img = await faceapi.fetchImage(imageData);
  const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
  return detections ? detections.descriptor : null;
}

export function compareFaces(descriptor1: Float32Array, descriptor2: Float32Array): number {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
}