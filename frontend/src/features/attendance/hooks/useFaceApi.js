import { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';

// Global singleton cache so neural models are loaded into memory exactly once per browser session
let modelsLoadingPromise = null;

export const loadFaceApiModels = async (modelsUri = '/models') => {
  if (faceapi.nets.tinyFaceDetector.isLoaded &&
      faceapi.nets.faceLandmark68Net.isLoaded &&
      faceapi.nets.faceRecognitionNet.isLoaded) {
    return true;
  }

  if (!modelsLoadingPromise) {
    modelsLoadingPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelsUri),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelsUri),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelsUri)
    ]).then(() => true).catch((err) => {
      modelsLoadingPromise = null;
      throw err;
    });
  }

  return modelsLoadingPromise;
};

/**
 * useFaceApi Hook
 * Initializes and manages @vladmandic/face-api neural models in the browser.
 */
export const useFaceApi = (modelsUri = '/models') => {
  const [isLoaded, setIsLoaded] = useState(
    () => !!(faceapi.nets.tinyFaceDetector?.isLoaded &&
             faceapi.nets.faceLandmark68Net?.isLoaded &&
             faceapi.nets.faceRecognitionNet?.isLoaded)
  );
  const [isLoading, setIsLoading] = useState(!isLoaded);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (isLoaded) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadFaceApiModels(modelsUri)
      .then(() => {
        if (isMountedRef.current) {
          setIsLoaded(true);
          setIsLoading(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          console.error('[FaceApi] Failed to load neural network models:', err);
          setError(err?.message || 'Failed to load face detection neural models');
          setIsLoading(false);
        }
      });

    return () => {
      isMountedRef.current = false;
    };
  }, [modelsUri, isLoaded]);

  /**
   * Helper to detect single face with 68 landmarks and 128-d descriptor
   */
  const detectFaceAndDescriptor = async (inputElement, options = {}) => {
    if (!faceapi.nets.tinyFaceDetector.isLoaded) {
      throw new Error('Face detector models not loaded yet');
    }

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: options.inputSize || 320,
      scoreThreshold: options.scoreThreshold || 0.5
    });

    const result = await faceapi
      .detectSingleFace(inputElement, detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!result) return null;

    return {
      detection: result.detection,
      landmarks: result.landmarks,
      descriptor: Array.from(result.descriptor), // 128 float array
      alignedRect: result.alignedRect
    };
  };

  return {
    isLoaded,
    isLoading,
    error,
    faceapi,
    detectFaceAndDescriptor,
    reloadModels: () => {
      modelsLoadingPromise = null;
      setIsLoaded(false);
    }
  };
};

export default useFaceApi;
