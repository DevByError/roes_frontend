export const MAP_IMAGE = "/maps/kl-map.svg";

export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [3.03, 101.57],
  [3.24, 101.81],
];

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

export const MAP_ASPECT =
  ((MAP_BOUNDS[1][1] - MAP_BOUNDS[0][1]) * (Math.PI / 180)) / (mercY(MAP_BOUNDS[1][0]) - mercY(MAP_BOUNDS[0][0]));

export function toImageXY(lat: number, lng: number) {
  const [[s, w], [n, e]] = MAP_BOUNDS;
  return { x: (lng - w) / (e - w), y: (mercY(n) - mercY(lat)) / (mercY(n) - mercY(s)) };
}

export function fromImageXY(x: number, y: number) {
  const [[s, w], [n, e]] = MAP_BOUNDS;
  const my = mercY(n) - y * (mercY(n) - mercY(s));
  const lat = (2 * Math.atan(Math.exp(my)) - Math.PI / 2) * (180 / Math.PI);
  return { lat, lng: w + x * (e - w) };
}
