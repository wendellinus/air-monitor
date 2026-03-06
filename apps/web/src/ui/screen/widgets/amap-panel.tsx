import AMapLoader from '@amap/amap-jsapi-loader';
import React from 'react';
import { createPortal } from 'react-dom';

import { wgs84ToGcj02, type LonLat } from '@/lib/coords';
import { cn } from '@/lib/utils';

type Marker = { id: string; name: string; lon: number; lat: number };
type AMapSecurityWindow = Window & {
  _AMapSecurityConfig?: {
    securityJsCode?: string;
  };
};

type AMapMap = {
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setLimitBounds?: (bounds: unknown) => void;
  on?: (eventName: 'click', handler: (e: { lnglat: { lng: number; lat: number } }) => void) => void;
  off?: (eventName: 'click', handler: (e: { lnglat: { lng: number; lat: number } }) => void) => void;
  resize?: () => void;
  destroy: () => void;
};

type AMapMarker = {
  setMap: (map: AMapMap | null) => void;
  on: (eventName: 'click', handler: () => void) => void;
};

type AMapSdk = {
  Map: new (
    container: HTMLElement,
    opts: {
      zoom: number;
      center: [number, number];
      zooms?: [number, number];
      resizeEnable?: boolean;
      mapStyle?: string;
    },
  ) => AMapMap;
  Bounds?: new (southWest: [number, number], northEast: [number, number]) => unknown;
  Marker: new (opts: { position: [number, number]; title?: string; content?: HTMLElement }) => AMapMarker;
};

export function AMapPanel(props: {
  center: { lon: number; lat: number } | null;
  markers: Marker[];
  onMarkerClick: (id: string) => void;
  renderMarker?: (ctx: { id: string; name: string }) => React.ReactNode;
  alertMarker?: { id: string; lon: number; lat: number } | null;
  renderAlertMarker?: (ctx: { id: string }) => React.ReactNode;
  pinMarker?: { lon: number; lat: number } | null;
  renderPinMarker?: () => React.ReactNode;
  onMapClick?: (coord: LonLat) => void;
  coordSystem?: 'wgs84' | 'gcj02';
  mapStyle?: string;
  className?: string;
  style?: React.CSSProperties;
}): React.ReactNode {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const sdkRef = React.useRef<AMapSdk | null>(null);
  const mapRef = React.useRef<AMapMap | null>(null);
  const [mapInstance, setMapInstance] = React.useState<AMapMap | null>(null);
  const markersRef = React.useRef<Map<string, AMapMarker>>(new Map());
  const markerHostsRef = React.useRef<Map<string, { host: HTMLElement; name: string }>>(new Map());
  const [markerHosts, setMarkerHosts] = React.useState<Array<{ id: string; host: HTMLElement; name: string }>>(
    [],
  );
  const renderMarkerEnabledRef = React.useRef<boolean>(false);
  const alertMarkerRef = React.useRef<AMapMarker | null>(null);
  const [alertHost, setAlertHost] = React.useState<HTMLElement | null>(null);
  const pinMarkerRef = React.useRef<AMapMarker | null>(null);
  const [pinHost, setPinHost] = React.useState<HTMLElement | null>(null);

  const apiKey = import.meta.env.VITE_AMAP_KEY as string | undefined;
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE as string | undefined;
  const coordSystem = props.coordSystem ?? 'wgs84';
  const mapStyle = props.mapStyle ?? 'amap://styles/grey';

  const toAmapCoord = React.useCallback(
    (coord: LonLat): LonLat => (coordSystem === 'wgs84' ? wgs84ToGcj02(coord.lon, coord.lat) : coord),
    [coordSystem],
  );

  React.useEffect(() => {
    if (!ref.current) return;
    if (!apiKey) return;

    let destroyed = false;
    let onResize: (() => void) | null = null;
    (async () => {
      if (securityJsCode?.trim()) {
        (window as AMapSecurityWindow)._AMapSecurityConfig = {
          securityJsCode: securityJsCode.trim(),
        };
      }

      const sdk = (await AMapLoader.load({
        key: apiKey,
        version: '2.0',
      })) as unknown as AMapSdk;
      if (destroyed) return;
      sdkRef.current = sdk;

      const defaultCenter: [number, number] = [104.1954, 35.8617]; // China center-ish
      const centerCoord = props.center
        ? toAmapCoord({ lon: props.center.lon, lat: props.center.lat })
        : { lon: defaultCenter[0], lat: defaultCenter[1] };
      const center: [number, number] = [centerCoord.lon, centerCoord.lat];
      const map = new sdk.Map(ref.current!, {
        zoom: props.center ? 7 : 4,
        center,
        zooms: [4, 12],
        resizeEnable: true,
        mapStyle,
      });
      mapRef.current = map;
      setMapInstance(map);

      // Restrict panning to a global-valid lat range to avoid dragging into "no tiles" areas
      // (which shows as a blank/grid background near the poles / high-lat regions).
      if (sdk.Bounds && map.setLimitBounds) {
        // NOTE: While WebMercator supports up to ~±85.051°, AMap styles may still show blank/grid tiles at
        // higher latitudes. Using a slightly tighter bound keeps the big-screen experience stable.
        const bounds = new sdk.Bounds([-179.999, -70], [179.999, 70]);
        map.setLimitBounds(bounds);
      }

      onResize = () => map.resize?.();
      window.addEventListener('resize', onResize);
    })();

    return () => {
      destroyed = true;
      if (onResize) window.removeEventListener('resize', onResize);
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();
      markerHostsRef.current.clear();
      setMarkerHosts([]);
      if (alertMarkerRef.current) {
        alertMarkerRef.current.setMap(null);
        alertMarkerRef.current = null;
      }
      setAlertHost(null);
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setMap(null);
        pinMarkerRef.current = null;
      }
      sdkRef.current = null;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      setMapInstance(null);
    };
  }, [apiKey, mapStyle, securityJsCode, toAmapCoord]);

  React.useEffect(() => {
    const map = mapInstance;
    if (!map) return;
    if (props.center) {
      const center = toAmapCoord({ lon: props.center.lon, lat: props.center.lat });
      map.setCenter([center.lon, center.lat]);
      map.setZoom(7);
      map.resize?.();
    }
  }, [mapInstance, props.center?.lon, props.center?.lat, toAmapCoord]);

  React.useEffect(() => {
    const map = mapInstance;
    const sdk = sdkRef.current;
    if (!sdk) return;
    if (!map) return;

    const renderMarkerEnabled = Boolean(props.renderMarker);
    if (renderMarkerEnabledRef.current !== renderMarkerEnabled) {
      renderMarkerEnabledRef.current = renderMarkerEnabled;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();
      markerHostsRef.current.clear();
      setMarkerHosts([]);
    }

    const nextIds = new Set(props.markers.map((m) => m.id));
    markersRef.current.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
        markerHostsRef.current.delete(id);
      }
    });

    for (const m of props.markers) {
      if (markersRef.current.has(m.id)) continue;
      const pos = toAmapCoord({ lon: m.lon, lat: m.lat });
      const host = props.renderMarker ? document.createElement('div') : null;
      if (host) {
        host.className = 'pointer-events-none';
        host.style.transform = 'translate(-50%, -100%)';
        host.style.transformOrigin = 'center bottom';
      }

      const marker = new sdk.Marker({
        position: [pos.lon, pos.lat],
        title: m.name,
        content: host ?? undefined,
      });
      marker.on('click', () => props.onMarkerClick(m.id));
      marker.setMap(map);
      markersRef.current.set(m.id, marker);
      if (host) markerHostsRef.current.set(m.id, { host, name: m.name });
    }

    if (props.renderMarker) {
      setMarkerHosts(
        Array.from(markerHostsRef.current.entries()).map(([id, value]) => ({
          id,
          host: value.host,
          name: value.name,
        })),
      );
    }
  }, [mapInstance, props.markers, props.onMarkerClick, props.renderMarker, toAmapCoord]);

  React.useEffect(() => {
    const map = mapInstance;
    const sdk = sdkRef.current;
    if (!sdk) return;
    if (!map) return;

    if (alertMarkerRef.current) {
      alertMarkerRef.current.setMap(null);
      alertMarkerRef.current = null;
    }
    setAlertHost(null);

    if (!props.alertMarker) return;

    const pos = toAmapCoord({ lon: props.alertMarker.lon, lat: props.alertMarker.lat });
    const host = document.createElement('div');
    host.className = 'pointer-events-auto';
    host.style.transform = 'translate(-50%, -100%)';
    host.style.transformOrigin = 'center bottom';

    const marker = new sdk.Marker({
      position: [pos.lon, pos.lat],
      title: '预警',
      content: host,
    });
    marker.setMap(map);
    alertMarkerRef.current = marker;
    setAlertHost(host);

    return () => {
      marker.setMap(null);
      if (alertMarkerRef.current === marker) alertMarkerRef.current = null;
      setAlertHost((cur) => (cur === host ? null : cur));
    };
  }, [mapInstance, props.alertMarker?.id, props.alertMarker?.lon, props.alertMarker?.lat, toAmapCoord]);

  React.useEffect(() => {
    const map = mapInstance;
    const sdk = sdkRef.current;
    if (!sdk) return;
    if (!map) return;

    if (pinMarkerRef.current) {
      pinMarkerRef.current.setMap(null);
      pinMarkerRef.current = null;
    }
    setPinHost(null);

    if (!props.pinMarker) return;

    const pos = toAmapCoord({ lon: props.pinMarker.lon, lat: props.pinMarker.lat });
    const host = document.createElement('div');
    host.className = 'pointer-events-none';
    host.style.transform = 'translate(-50%, -100%)';
    host.style.transformOrigin = 'center bottom';

    const marker = new sdk.Marker({
      position: [pos.lon, pos.lat],
      title: '选中位置',
      content: host,
    });
    marker.setMap(map);
    pinMarkerRef.current = marker;
    setPinHost(host);

    return () => {
      marker.setMap(null);
      if (pinMarkerRef.current === marker) pinMarkerRef.current = null;
      setPinHost((cur) => (cur === host ? null : cur));
    };
  }, [mapInstance, props.pinMarker?.lon, props.pinMarker?.lat, toAmapCoord]);

  React.useEffect(() => {
    const map = mapInstance;
    if (!map?.on) return;
    if (!props.onMapClick) return;

    const handler = (e: { lnglat: { lng: number; lat: number } }) => {
      props.onMapClick?.({ lon: e.lnglat.lng, lat: e.lnglat.lat });
    };

    map.on('click', handler);
    return () => map.off?.('click', handler);
  }, [mapInstance, props.onMapClick]);

  if (!apiKey) {
    return (
      <div className="hint" style={{ padding: 12 }}>
        未配置高德 Key：请在 `apps/web/.env` 或 `apps/web/.env.local` 设置 `VITE_AMAP_KEY`。
      </div>
    );
  }

  return (
    <>
      <div ref={ref} className={cn('h-full w-full', props.className)} style={props.style} />
      {props.alertMarker && alertHost && props.renderAlertMarker
        ? createPortal(props.renderAlertMarker({ id: props.alertMarker.id }), alertHost)
        : null}
      {props.pinMarker && pinHost && props.renderPinMarker
        ? createPortal(props.renderPinMarker(), pinHost)
        : null}
      {props.renderMarker
        ? markerHosts.map(({ id, host, name }) =>
            createPortal(props.renderMarker?.({ id, name }), host, id),
          )
        : null}
    </>
  );
}
