# Change Logs

## @geolonia/embed

### v6.0.0-pre.0

コア実装を `@geolonia/maps-core` に委譲し、embed は「HTML 埋め込みラッパー」に専念する構成へ移行しました。

- **Refactor**: 地図コア（`GeoloniaMap` / `GeoloniaMarker` / `SimpleStyle` / `SimpleStyleVector` / `keyring` / attribution・logo コントロール等）を [`@geolonia/maps-core`](https://github.com/geolonia/maps-core) に移管。embed 側には `data-*` 属性のパースと DOM 自動走査・遅延読み込み・プラグイン機構といったラッパー機能のみを残しました。
- **Breaking**: `GeoloniaMap` コンストラクタは `GeoloniaMapOptions` オブジェクトのみを受け取ります。DOM 要素や CSS セレクタ文字列の直接指定は廃止されました（`new geolonia.Map({ container })` を使用してください）。
- **Breaking**: `keyring.parse()`（DOM スキャン）は廃止されました。API キーは `<script src="...?geolonia-api-key=KEY">` から embed が読み取り、`keyring.setApiKey()` で maps-core に渡します（既存の script タグ方式は引き続き動作します）。
- **Internal**: maps-core が内包する依存（pmtiles / sanitize-html / tinycolor2 / turf / gesture-handling 等）を embed の直接依存から削除しました。

### nightly

- **Feature**: Added support for external style.json URLs in `data-style` attribute
  - You can now specify full URLs: `data-style="https://tile.openstreetmap.jp/styles/osm-bright/style.json"`
  - Relative paths are also supported: `data-style="./custom-style.json"`
  - Files ending in `.json` are automatically resolved to absolute URLs
  - External styles work without a Geolonia API key
  - API key is now only required for Geolonia's hosted styles and tiles
  - Added Mixed Content warnings for HTTP styles on HTTPS pages
  - Added CORS error guidance for external styles
- **Improvement**: API key scope is now limited to Geolonia domains only (security enhancement)
- Renamed as `@geolonia/embed`
- plugin system

### v0.2.5

- Add popup if container has innerHTML
- `data-bearing` and `data-pitch` options for HTML template

### v0.2.4

- `data-hash` option for HTML template to enable URL hash routing

### v0.2.2
