import maps from '../../data/lowlines/maps/destinations';

export const destinations = [
  {
    id: 'tower',
    destinationHash: 333456177
  },
  {
    id: 'edz',
    destinationHash: 1199524104
  },
  {
    id: 'the-moon',
    destinationHash: 290444260,
    default: true
  },
  {
    id: 'new-pacific-arcology',
    destinationHash: 2388758973
  },
  {
    id: 'arcadian-valley',
    destinationHash: 126924919
  },
  {
    id: 'echo-mesa',
    destinationHash: 2218917881
  },
  {
    id: 'fields-of-glass',
    destinationHash: 1993421442
  },
  {
    id: 'hellas-basin',
    destinationHash: 308080871
  },
  {
    id: 'tangled-shore',
    destinationHash: 359854275
  },
  {
    id: 'dreaming-city',
    destinationHash: 2779202173
  }
];

export function resolveDestination(map = false) {
  const destinationById = map && destinations.find(d => d.id === map);
  const destinationByHash = map && destinations.find(d => d.destinationHash === parseInt(map, 10));

  if (destinationById) {
    return destinationById;
  } else if (destinationByHash) {
    return destinationByHash;
  } else {
    return destinations.find(d => d.default);
  }
}

export function getMapCenter(id) {
  if (!maps[id]) return [0, 0];

  const map = maps[id].map;

  const centerYOffset = -(map.center && map.center.y) || 0;
  const centerXOffset = (map.center && map.center.x) || 0;

  const center = [map.height / 2 + centerYOffset, map.width / 2 + centerXOffset];

  return center;
}