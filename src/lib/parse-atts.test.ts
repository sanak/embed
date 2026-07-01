import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { keyring } from '@geolonia/maps-core';
import parseAtts, { attsToOptions } from './parse-atts';

/**
 * parse-atts is the embed-specific "wrapper" layer: it reads `data-*`
 * attributes off a container and (a) exposes them to plugins as
 * `EmbedAttributes` and (b) converts them into a typed `GeoloniaMapOptions`
 * for maps-core via `attsToOptions()`.
 */
describe('parseAtts', () => {
  beforeEach(() => {
    keyring.reset();
    keyring.setApiKey('YOUR-API-KEY');
    keyring.setStage('v1');
    // navigator.languages is read-only; force a deterministic language.
    Object.defineProperty(window.navigator, 'languages', {
      value: ['ja'],
      configurable: true,
    });
  });

  afterEach(() => {
    keyring.reset();
  });

  it('returns default EmbedAttributes merged with keyring key/stage', () => {
    const container = document.createElement('div');

    const atts = parseAtts(container);

    expect(atts).toEqual({
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
      gestureHandling: 'on',
      navigationControl: 'on',
      geolocateControl: 'off',
      fullscreenControl: 'off',
      scaleControl: 'off',
      geoloniaControl: 'on',
      geojson: '',
      simpleVector: '',
      cluster: 'on',
      clusterColor: '#ff0000',
      style: 'geolonia/basic-v2',
      lang: 'ja',
      plugin: 'off',
      key: 'YOUR-API-KEY',
      apiUrl: 'https://api.geolonia.com/v1',
      stage: 'v1',
      loader: 'on',
      minZoom: '',
      maxZoom: 20,
      '3d': '',
    });
  });

  it('overrides defaults with data-* attributes', () => {
    const container = document.createElement('div');
    container.dataset.lat = '35';
    container.dataset.lng = '139';
    container.dataset.zoom = '10';
    container.dataset.marker = 'off';

    const atts = parseAtts(container);

    expect(atts.lat).toBe('35');
    expect(atts.lng).toBe('139');
    expect(atts.zoom).toBe('10');
    expect(atts.marker).toBe('off');
  });

  it('forces gestureHandling/navigationControl off when non-interactive', () => {
    const container = document.createElement('div');
    const atts = parseAtts(container, { interactive: false });
    expect(atts.gestureHandling).toBe('off');
    expect(atts.navigationControl).toBe('off');
  });
});

describe('attsToOptions', () => {
  beforeEach(() => {
    keyring.reset();
    keyring.setApiKey('YOUR-API-KEY');
    keyring.setStage('v1');
    Object.defineProperty(window.navigator, 'languages', {
      value: ['ja'],
      configurable: true,
    });
  });

  afterEach(() => {
    keyring.reset();
  });

  it('converts on/off flags into typed GeoloniaMapOptions', () => {
    const container = document.createElement('div');
    container.dataset.hash = 'on';
    container.dataset.marker = 'off';
    container.dataset['3d'] = 'on';

    const options = attsToOptions(container, parseAtts(container));

    expect(options.container).toBe(container);
    expect(options.hash).toBe(true);
    expect(options.marker).toBe(false);
    expect(options['3d']).toBe(true);
    expect(options.style).toBe('geolonia/basic-v2');
    expect(options.apiKey).toBe('YOUR-API-KEY');
    expect(options.stage).toBe('v1');
  });

  it('maps control positions and on/off to boolean | ControlPosition', () => {
    const container = document.createElement('div');
    container.dataset.navigationControl = 'top-right';
    container.dataset.geolocateControl = 'on';
    container.dataset.scaleControl = 'off';

    const options = attsToOptions(container, parseAtts(container));

    expect(options.navigationControl).toBe('top-right');
    expect(options.geolocateControl).toBe(true);
    expect(options.scaleControl).toBe(false);
  });

  it('sets center only when both data-lat and data-lng are present', () => {
    const withCoords = document.createElement('div');
    withCoords.dataset.lat = '35';
    withCoords.dataset.lng = '139';
    expect(attsToOptions(withCoords, parseAtts(withCoords)).center).toEqual([
      139, 35,
    ]);

    const withoutCoords = document.createElement('div');
    expect(attsToOptions(withoutCoords, parseAtts(withoutCoords)).center).toBe(
      undefined,
    );
  });

  it('parses customMarkerOffset and zoom bounds', () => {
    const container = document.createElement('div');
    container.dataset.customMarkerOffset = '10, -5';
    container.dataset.minZoom = '3';
    container.dataset.maxZoom = '18';

    const options = attsToOptions(container, parseAtts(container));

    expect(options.customMarkerOffset).toEqual([10, -5]);
    expect(options.minZoom).toBe(3);
    expect(options.maxZoom).toBe(18);
  });
});
