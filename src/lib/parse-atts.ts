'use strict';

import type { ControlPosition } from 'maplibre-gl';
import { getLang, keyring, type GeoloniaMapOptions } from '@geolonia/maps-core';
import type { EmbedAttributes } from '../types';

type ParseAttsParams = {
  interactive?: boolean;
};

/**
 * Read the `data-*` attributes off a map container and normalise them into the
 * embed's `EmbedAttributes` shape (string values, `'on'`/`'off'` flags).
 *
 * This is the value handed to registered plugins, so its shape is kept stable
 * for backward compatibility. The map itself is constructed from
 * {@link attsToOptions}, which converts these into a typed
 * `GeoloniaMapOptions` for maps-core.
 */
export default (
  container,
  params: ParseAttsParams = {},
): EmbedAttributes => {
  if (!container.dataset) {
    container.dataset = {};
  }

  let lang = 'auto';
  if (container.dataset.lang && container.dataset.lang === 'auto') {
    lang = getLang();
  } else if (container.dataset.lang && container.dataset.lang === 'ja') {
    lang = 'ja';
  } else if (container.dataset.lang && container.dataset.lang !== 'ja') {
    lang = 'en';
  } else {
    lang = getLang();
  }

  // Check if using Geolonia style or external style
  const style = container.dataset.style || 'geolonia/basic-v2';
  keyring.isGeoloniaStyle = keyring.isGeoloniaStyleCheck(style);

  return {
    lat: 0,
    lng: 0,
    zoom: 0,
    bearing: 0,
    pitch: 0,
    hash: 'off',
    marker: 'on',
    markerColor: '#E4402F',
    openPopup: 'off',
    customMarker: '',
    customMarkerOffset: '0, 0',
    gestureHandling: params.interactive === false ? 'off' : 'on',
    navigationControl: params.interactive === false ? 'off' : 'on',
    geolocateControl: 'off',
    fullscreenControl: 'off',
    scaleControl: 'off',
    geoloniaControl: 'on',
    geojson: '',
    simpleVector: '',
    cluster: 'on',
    clusterColor: '#ff0000',
    style: 'geolonia/basic-v2',
    lang: lang,
    plugin: 'off',
    key: keyring.apiKey,
    apiUrl: `https://api.geolonia.com/${keyring.stage}`,
    stage: keyring.stage,
    loader: 'on',
    minZoom: '',
    maxZoom: 20,
    '3d': '',
    ...container.dataset,
  };
};

const CONTROL_POSITIONS: ControlPosition[] = [
  'top-right',
  'bottom-right',
  'bottom-left',
  'top-left',
];

/**
 * Convert a `data-*-control` value (`'on'` / `'off'` / a position string) into
 * the `boolean | ControlPosition` maps-core expects.
 */
const controlOption = (att: string | number): boolean | ControlPosition => {
  const value = String(att).toLowerCase();
  if ((CONTROL_POSITIONS as string[]).includes(value)) {
    return value as ControlPosition;
  }
  return value === 'on';
};

/**
 * Decide whether a value is a CSS selector pointing at an inline element
 * (e.g. a `<script type="application/json">`) rather than a URL / path.
 */
const isCssSelector = (value: string): Element | false => {
  if (/^https?:\/\//.test(value) || /^\.?\.?\//.test(value)) {
    return false;
  }
  try {
    return document.querySelector(value) || false;
  } catch {
    return false;
  }
};

/**
 * Resolve a `data-geojson` value into what maps-core's SimpleStyle accepts:
 * a URL / inline JSON string, or a parsed FeatureCollection when the value is a
 * CSS selector referencing an inline element.
 */
const resolveGeojson = (
  value: string,
): string | GeoJSON.FeatureCollection => {
  const el = isCssSelector(value);
  if (el && el.textContent) {
    return JSON.parse(el.textContent) as GeoJSON.FeatureCollection;
  }
  return value;
};

/**
 * Convert normalised {@link EmbedAttributes} into a typed `GeoloniaMapOptions`
 * for maps-core's `GeoloniaMap` constructor.
 *
 * `center` is only set when both `data-lat` and `data-lng` are present so that
 * maps-core keeps its default marker gating (marker requires a center) and
 * GeoJSON `fitBounds` (skipped only when an explicit center is given).
 */
export const attsToOptions = (
  container: HTMLElement,
  atts: EmbedAttributes,
): GeoloniaMapOptions => {
  const options: GeoloniaMapOptions = {
    container,
    style: String(atts.style),
    lang: atts.lang as 'ja' | 'en' | 'auto',
    bearing: parseFloat(String(atts.bearing)) || 0,
    pitch: parseFloat(String(atts.pitch)) || 0,
    zoom: parseFloat(String(atts.zoom)) || 0,
    hash: atts.hash === 'on',
    marker: atts.marker === 'on',
    markerColor: String(atts.markerColor),
    openPopup: atts.openPopup === 'on',
    loader: atts.loader !== 'off',
    gestureHandling: atts.gestureHandling !== 'off',
    navigationControl: controlOption(atts.navigationControl),
    geolocateControl: controlOption(atts.geolocateControl),
    fullscreenControl: controlOption(atts.fullscreenControl),
    scaleControl: controlOption(atts.scaleControl),
    geoloniaControl: controlOption(atts.geoloniaControl),
    cluster: atts.cluster === 'on',
    clusterColor: String(atts.clusterColor),
    '3d': atts['3d'] === 'on',
  };

  const apiKey = String(atts.key || '');
  if (apiKey) {
    options.apiKey = apiKey;
  }
  const stage = String(atts.stage || '');
  if (stage) {
    options.stage = stage;
  }

  const dataset = container.dataset || {};
  const hasLat = dataset.lat !== undefined && dataset.lat !== '';
  const hasLng = dataset.lng !== undefined && dataset.lng !== '';
  if (hasLat && hasLng) {
    options.center = [
      parseFloat(String(atts.lng)),
      parseFloat(String(atts.lat)),
    ];
  }

  if (atts.customMarker) {
    options.customMarker = String(atts.customMarker);
  }
  if (atts.customMarkerOffset) {
    const [x, y] = String(atts.customMarkerOffset)
      .split(',')
      .map((n) => Number(n.trim()));
    options.customMarkerOffset = [x || 0, y || 0];
  }

  if (atts.geojson) {
    options.geojson = resolveGeojson(String(atts.geojson));
  }
  if (atts.simpleVector) {
    options.simpleVector = String(atts.simpleVector);
  }

  if (
    atts.minZoom !== '' &&
    (Number(atts.minZoom) === 0 || Number(atts.minZoom))
  ) {
    options.minZoom = Number(atts.minZoom);
  }
  if (atts.maxZoom !== '' && Number(atts.maxZoom)) {
    options.maxZoom = Number(atts.maxZoom);
  }

  return options;
};
