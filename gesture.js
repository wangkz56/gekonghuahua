// Pure gesture logic, shared with the browser checks. Distances use image pixels
// normalized by width so a 4:3 camera does not distort the palm proportions.
export function analyzeHand(landmarks, aspect = 4 / 3, wasPinching = false, threshold = .38) {
  const p = landmarks.map(({x, y}) => ({x, y: y / aspect}));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const scale = Math.max(dist(p[0], p[9]), dist(p[5], p[17]), .001);
  const extended = [[6,8],[10,12],[14,16],[18,20]].map(([pip,tip]) => dist(p[tip],p[0]) > dist(p[pip],p[0]) * 1.12);
  const ratio = dist(p[4], p[8]) / scale;
  const reach = dist(p[8], p[5]) / scale;
  const midpoint = {x: (p[4].x+p[8].x)/2, y: (p[4].y+p[8].y)/2};
  const span = dist(midpoint,p[9]) / scale;
  const pinching = ratio < threshold + (wasPinching ? .14 : 0) && reach >= .35 && span >= .45;
  const count = extended.filter(Boolean).length;
  const thumbUp = dist(p[4],p[17]) > dist(p[3],p[17])*1.05 && (p[3].y-p[4].y)/scale > .12;
  const gesture = pinching ? 'pinch' : count === 4 ? 'palm' : count === 0 ? (thumbUp ? 'thumb' : 'fist') : 'point';
  return {gesture, pinching, ratio, point: landmarks[8], palm: landmarks[9]};
}
