import {FilesetResolver, HandLandmarker} from './assets/vendor/vision_bundle.mjs';
let tracker;
self.onmessage = async ({data}) => {
  if (data.type === 'init') {
    try {
      const vision = await FilesetResolver.forVisionTasks(new URL('./assets/vendor/wasm', import.meta.url).href, true);
      tracker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {modelAssetPath: new URL('./assets/models/hand_landmarker.task', import.meta.url).href, delegate: 'CPU'},
        runningMode: 'VIDEO', numHands: 1,
        minHandDetectionConfidence: .55, minHandPresenceConfidence: .55, minTrackingConfidence: .55
      });
      self.postMessage({type:'ready'});
    } catch (error) { self.postMessage({type:'error', message:String(error.message || error)}); }
  } else if (data.type === 'frame') {
    try {
      const result = tracker.detectForVideo(data.image, data.timestamp);
      self.postMessage({type:'result', landmarks:result.landmarks[0] || null, timestamp:data.timestamp});
    } catch (error) { self.postMessage({type:'error', message:String(error.message || error)}); }
    finally { data.image.close(); }
  }
};
