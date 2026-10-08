import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export interface MapMarker {
  id: string
  lat: number
  lng: number
  label?: string
  popup?: string
  popupActionLabel?: string
  draggable?: boolean
  onDragEnd?: (lat: number, lng: number) => void
  onClick?: (id: string) => void
  onPopupAction?: (id: string) => void
  icon?: L.Icon | L.DivIcon
}

export interface RouteLine {
  id: string
  positions: [number, number][]
  color?: string
  weight?: number
}

function ResizeHandler() {
  const map = useMap()
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 0)
    return () => window.clearTimeout(timer)
  }, [map])
  return null
}

function RecenterHandler({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  const centerRef = useRef(center)

  useEffect(() => {
    const prev = centerRef.current
    const changed = prev[0] !== center[0] || prev[1] !== center[1]
    centerRef.current = center
    if (changed) {
      map.setView(center, zoom, { animate: true })
    }
  }, [center, map, zoom])

  return null
}

function RouteOverlay({
  routes,
  autoFitBounds,
}: {
  routes: RouteLine[]
  autoFitBounds?: boolean
}) {
  const map = useMap()
  const groupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!routes.length) {
      groupRef.current?.removeFrom(map)
      groupRef.current = null
      return
    }

    const group = L.featureGroup()
    routes.forEach((route) => {
      const positions = route.positions.filter((point) => Array.isArray(point) && point.length === 2)
      if (positions.length < 2) return
      const line = L.polyline(positions, {
        color: route.color || '#2563eb',
        weight: route.weight || 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      })
      line.addTo(group)
    })
    group.addTo(map)
    groupRef.current = group

    if (autoFitBounds) {
      const bounds = group.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.2), { animate: true })
      }
    }

    return () => {
      group.removeFrom(map)
      if (groupRef.current === group) {
        groupRef.current = null
      }
    }
  }, [autoFitBounds, map, routes])

  return null
}

function MarkerLayer({
  markers,
  clusterMarkers,
}: {
  markers: MapMarker[]
  clusterMarkers?: boolean
}) {
  const map = useMap()
  const layerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    const previous = layerRef.current
    if (previous) {
      previous.removeFrom(map)
    }

    const layer = clusterMarkers
      ? ((L as unknown as { markerClusterGroup: (options?: Record<string, unknown>) => L.LayerGroup }).markerClusterGroup({
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 16,
          maxClusterRadius: 55,
        }) as L.LayerGroup)
      : L.layerGroup()

    const cleanupFns: Array<() => void> = []

    markers.forEach((marker) => {
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        draggable: marker.draggable ?? false,
        icon: marker.icon,
      })

      if (marker.popup) {
        const popupNode = document.createElement('div')
        popupNode.className = 'space-y-3 text-sm text-left min-w-[220px]'
        popupNode.innerHTML = marker.popup

        if (marker.popupActionLabel && marker.onPopupAction) {
          const button = document.createElement('button')
          button.type = 'button'
          button.className = 'w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700'
          button.textContent = marker.popupActionLabel
          const handleClick = (event: Event) => {
            event.preventDefault()
            event.stopPropagation()
            marker.onPopupAction?.(marker.id)
          }
          button.addEventListener('click', handleClick)
          popupNode.appendChild(button)
          cleanupFns.push(() => button.removeEventListener('click', handleClick))
        }

        leafletMarker.bindPopup(popupNode)
      }

      leafletMarker.on('click', () => marker.onClick?.(marker.id))

      if (marker.draggable) {
        leafletMarker.on('dragend', (event: L.LeafletEvent) => {
          const target = event.target as L.Marker
          const latLng = target.getLatLng()
          marker.onDragEnd?.(latLng.lat, latLng.lng)
        })
      }

      leafletMarker.addTo(layer)
    })

    layer.addTo(map)
    layerRef.current = layer

    return () => {
      cleanupFns.forEach((fn) => fn())
      layer.removeFrom(map)
      if (layerRef.current === layer) {
        layerRef.current = null
      }
    }
  }, [clusterMarkers, map, markers])

  return null
}

export function createDonationMarkerIcon({
  tone = 'amber',
  label = 'F',
}: {
  tone?: 'emerald' | 'amber' | 'rose' | 'blue'
  label?: string
}) {
  const palette = {
    emerald: ['#10b981', '#d1fae5'],
    amber: ['#f59e0b', '#fef3c7'],
    rose: ['#f43f5e', '#ffe4e6'],
    blue: ['#2563eb', '#dbeafe'],
  } as const
  const [borderColor, bgColor] = palette[tone]

  return L.divIcon({
    className: 'donation-map-icon',
    html: `
      <div class="donation-map-icon__pin" style="--pin-border:${borderColor};--pin-fill:${bgColor}">
        <span>${label.slice(0, 2).toUpperCase()}</span>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -36],
  })
}

export function OpenStreetMapView({
  center,
  markers,
  onPick,
  height = 320,
  zoom = 13,
  routes = [],
  autoFitRoutes = false,
  clusterMarkers = false,
}: {
  center: [number, number]
  markers: MapMarker[]
  onPick?: (lat: number, lng: number) => void
  height?: number
  zoom?: number
  routes?: RouteLine[]
  autoFitRoutes?: boolean
  clusterMarkers?: boolean
}) {
  const markerClusterEnabled = clusterMarkers || markers.length > 8
  const markerList = useMemo(() => markers, [markers])

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700" style={{ height }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <ResizeHandler />
        <RecenterHandler center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onPick && (
          <MapClickHandler onPick={onPick} />
        )}
        <RouteOverlay routes={routes} autoFitBounds={autoFitRoutes} />
        <MarkerLayer markers={markerList} clusterMarkers={markerClusterEnabled} />
      </MapContainer>
    </div>
  )
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const map = useMap()
  useEffect(() => {
    const handleClick = (event: L.LeafletMouseEvent) => {
      onPick(event.latlng.lat, event.latlng.lng)
    }
    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
    }
  }, [map, onPick])
  return null
}
