/**
 * @file Side-effect-free entry point for programmatic use (e.g. React wrapper).
 * Does NOT call renderGeoloniaMap() or set window.geolonia.
 *
 * The Geolonia core (map, marker, simplestyle, keyring, PMTiles protocol
 * registration, ...) now lives in `@geolonia/maps-core`; this entry simply
 * re-exports it alongside embed-specific helpers (registerPlugin, version).
 */

export {
  GeoloniaMap,
  GeoloniaMarker,
  SimpleStyle,
  SimpleStyleVector,
  keyring,
} from '@geolonia/maps-core';
export { registerPlugin } from './lib/render';
export { VERSION as embedVersion } from './version';
export type { EmbedAttributes, EmbedPlugin } from './types';
export type { GeoloniaMapOptions } from '@geolonia/maps-core';
