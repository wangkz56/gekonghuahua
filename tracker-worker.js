let tracker;
self.onmessage = async ({data}) => {
  if (data.type === 'init') {
    try {
      const {HandLandmarker} = await import('./vision-bundle.js');
      const vision = {
        wasmLoaderPath: new URL('./vision_wasm_module_internal.js', import.meta.url).href,
        wasmBinaryPath: new URL('./vision_wasm_module_internal.wasm', import.meta.url).href
      };
      tracker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {modelAssetPath: new URL('./hand_landmarker.task', import.meta.url).href, delegate: 'CPU'},
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
