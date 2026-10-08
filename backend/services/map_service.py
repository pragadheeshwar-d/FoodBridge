"""
Shared map helpers for address geocoding and OSRM routing.
"""

from __future__ import annotations

import json
import math
import re
import threading
import time
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from flask import current_app


_GEOCODE_CACHE: dict[str, dict[str, object]] = {}
_ROUTE_CACHE: dict[str, dict[str, object]] = {}
_GEOCODE_LOCK = threading.Lock()
_LAST_GEOCODE_AT = 0.0


def _config(name: str, default):
    try:
        return current_app.config.get(name, default)
    except RuntimeError:
        return default


def _normalize_address(address: str) -> str:
    return re.sub(r"\s+", " ", address or "").strip().lower()


def _round_coord(value: float, digits: int = 5) -> float:
    return round(float(value), digits)


def _route_cache_key(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    mode: str,
) -> str:
    return f"{mode}:{_round_coord(origin_lat)}:{_round_coord(origin_lng)}:{_round_coord(dest_lat)}:{_round_coord(dest_lng)}"


def _fetch_json(url: str, headers: dict[str, str] | None = None, timeout: float | None = None) -> dict:
    request = Request(url, headers=headers or {})
    with urlopen(request, timeout=timeout) as response:
        payload = response.read().decode('utf-8')
    return json.loads(payload)


def _parse_lat_lng(location: dict) -> dict[str, object]:
    return {
        'latitude': float(location['lat']),
        'longitude': float(location['lon']),
        'address': location.get('display_name') or '',
    }


def geocode_address(address: str, *, retries: int = 2) -> dict[str, object]:
    """
    Resolve a free-text address through Nominatim with cache + basic backoff.

    Nominatim's public endpoint is rate limited to roughly 1 request/sec, so we
    serialize calls and keep the result cached for repeated donor submissions.
    """

    query = _normalize_address(address)
    if not query:
        raise ValueError('Address is required')

    cached = _GEOCODE_CACHE.get(query)
    if cached:
        return cached

    params = urlencode({'q': address.strip(), 'format': 'jsonv2', 'limit': 1})
    url = f'https://nominatim.openstreetmap.org/search?{params}'
    headers = {
        'User-Agent': str(_config('NOMINATIM_USER_AGENT', 'FoodBridge/1.0 (+https://foodbridge.local)')),
        'Accept': 'application/json',
    }
    timeout = float(_config('OSRM_TIMEOUT_SECONDS', 10))

    last_error: Exception | None = None
    for attempt in range(retries + 1):
        with _GEOCODE_LOCK:
            global _LAST_GEOCODE_AT
            elapsed = time.monotonic() - _LAST_GEOCODE_AT
            if elapsed < 1.0:
                time.sleep(1.0 - elapsed)
            _LAST_GEOCODE_AT = time.monotonic()

        try:
            results = _fetch_json(url, headers=headers, timeout=timeout)
            if results:
                resolved = _parse_lat_lng(results[0])
                _GEOCODE_CACHE[query] = resolved
                return resolved
            last_error = LookupError('Location not found')
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, KeyError, TypeError) as exc:
            last_error = exc

        if attempt < retries:
            time.sleep(0.5 * (2 ** attempt))

    if isinstance(last_error, LookupError):
        raise LookupError('Location not found') from last_error
    raise RuntimeError('Geocoding failed') from last_error


def haversine_km(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> float:
    radius_km = 6371.0
    lat1 = math.radians(origin_lat)
    lat2 = math.radians(dest_lat)
    delta_lat = math.radians(dest_lat - origin_lat)
    delta_lng = math.radians(dest_lng - origin_lng)
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lng / 2) ** 2
    return 2 * radius_km * math.asin(math.sqrt(a))


def _osrm_profile(mode: str) -> str:
    mode = (mode or 'driving').strip().lower()
    return mode if mode in {'driving', 'walking', 'cycling'} else 'driving'


def _osrm_base_url() -> str:
    base_url = str(_config('OSRM_BASE_URL', 'https://router.project-osrm.org')).rstrip('/')
    return base_url or 'https://router.project-osrm.org'


def _osrm_route(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    *,
    mode: str = 'driving',
    include_geometry: bool = True,
) -> dict[str, object]:
    profile = _osrm_profile(mode)
    cache_key = _route_cache_key(origin_lat, origin_lng, dest_lat, dest_lng, profile)
    cached = _ROUTE_CACHE.get(cache_key)
    if cached and (not include_geometry or cached.get('geometry')):
        return cached

    # The public demo server is rate-limited and intended for development only.
    base_url = _osrm_base_url()
    geom_param = 'geojson' if include_geometry else 'false'
    url = (
        f'{base_url}/route/v1/{profile}/'
        f'{_round_coord(origin_lng, 6)},{_round_coord(origin_lat, 6)};'
        f'{_round_coord(dest_lng, 6)},{_round_coord(dest_lat, 6)}'
        f'?overview=full&geometries={geom_param}&steps=false&alternatives=false'
    )
    timeout = float(_config('OSRM_TIMEOUT_SECONDS', 10))
    payload = _fetch_json(url, timeout=timeout)
    routes = payload.get('routes') or []
    if not routes:
        raise LookupError('Route not found')

    route = routes[0]
    geometry = route.get('geometry')
    result = {
        'distance_m': float(route.get('distance') or 0.0),
        'duration_s': float(route.get('duration') or 0.0),
    }
    if geometry:
        result['geometry'] = geometry
    _ROUTE_CACHE[cache_key] = result
    return result


def route_preview(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    *,
    mode: str = 'driving',
) -> dict[str, object]:
    route = _osrm_route(origin_lat, origin_lng, dest_lat, dest_lng, mode=mode, include_geometry=True)
    distance_km = round(route['distance_m'] / 1000.0, 2)
    travel_minutes = max(1, int(round(route['duration_s'] / 60.0)))
    return {
        'distance_km': distance_km,
        'distance_m': round(route['distance_m']),
        'travel_minutes': travel_minutes,
        'geometry': route.get('geometry'),
    }


def route_batch_metrics(
    origin_lat: float,
    origin_lng: float,
    destinations: Iterable[tuple[float, float]],
    *,
    mode: str = 'driving',
) -> dict[tuple[float, float], dict[str, float]]:
    destination_list = [(float(lat), float(lng)) for lat, lng in destinations]
    if not destination_list:
        return {}

    profile = _osrm_profile(mode)
    if len(destination_list) <= 10:
        return {
            (lat, lng): _route_or_fallback(origin_lat, origin_lng, lat, lng, mode=profile, include_geometry=False)
            for lat, lng in destination_list
        }

    base_url = _osrm_base_url()
    coords = [f'{_round_coord(origin_lng, 6)},{_round_coord(origin_lat, 6)}']
    coords.extend(f'{_round_coord(lng, 6)},{_round_coord(lat, 6)}' for lat, lng in destination_list)
    url = (
        f'{base_url}/table/v1/{profile}/'
        f'{";".join(coords)}?sources=0&annotations=distance,duration'
    )
    timeout = float(_config('OSRM_TIMEOUT_SECONDS', 10))

    try:
        payload = _fetch_json(url, timeout=timeout)
        distances = (payload.get('distances') or [[]])[0]
        durations = (payload.get('durations') or [[]])[0]
        results: dict[tuple[float, float], dict[str, float]] = {}
        for index, (lat, lng) in enumerate(destination_list, start=1):
            distance_m = distances[index] if len(distances) > index and distances[index] is not None else None
            duration_s = durations[index] if len(durations) > index and durations[index] is not None else None
            if distance_m is None or duration_s is None:
                results[(lat, lng)] = _route_or_fallback(origin_lat, origin_lng, lat, lng, mode=profile, include_geometry=False)
            else:
                results[(lat, lng)] = {
                    'distance_km': round(float(distance_m) / 1000.0, 2),
                    'travel_minutes': max(1, int(round(float(duration_s) / 60.0))),
                }
                _ROUTE_CACHE[_route_cache_key(origin_lat, origin_lng, lat, lng, profile)] = {
                    'distance_m': float(distance_m),
                    'duration_s': float(duration_s),
                }
        return results
    except Exception:
        return {
            (lat, lng): _route_or_fallback(origin_lat, origin_lng, lat, lng, mode=profile, include_geometry=False)
            for lat, lng in destination_list
        }


def _route_or_fallback(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
    *,
    mode: str,
    include_geometry: bool,
) -> dict[str, float]:
    try:
        route = _osrm_route(origin_lat, origin_lng, dest_lat, dest_lng, mode=mode, include_geometry=include_geometry)
        return {
            'distance_km': round(route['distance_m'] / 1000.0, 2),
            'travel_minutes': max(1, int(round(route['duration_s'] / 60.0))),
        }
    except Exception:
        fallback_km = haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
        return {
            'distance_km': round(fallback_km, 2),
            'travel_minutes': max(1, int(round(fallback_km * 3.5))),
        }


def nearby_donations(
    origin_lat: float,
    origin_lng: float,
    radius_km: float,
    donations: Iterable[object],
    *,
    mode: str = 'driving',
) -> list[dict[str, object]]:
    candidates: list[tuple[object, float]] = []
    shortlist_radius = max(radius_km * 2.0, radius_km)
    for donation in donations:
        donation_lat = getattr(donation, 'latitude', None)
        donation_lng = getattr(donation, 'longitude', None)
        if donation_lat is None or donation_lng is None:
            continue
        straight_line = haversine_km(origin_lat, origin_lng, float(donation_lat), float(donation_lng))
        if straight_line <= shortlist_radius:
            candidates.append((donation, straight_line))

    if not candidates:
        return []

    batch_metrics = route_batch_metrics(
        origin_lat,
        origin_lng,
        [(float(d.latitude), float(d.longitude)) for d, _ in candidates],
        mode=mode,
    )

    results: list[dict[str, object]] = []
    for donation, straight_line in candidates:
        lat = float(donation.latitude)
        lng = float(donation.longitude)
        metrics = batch_metrics.get((lat, lng), {})
        road_distance_km = float(metrics.get('distance_km') or straight_line)
        travel_minutes = int(metrics.get('travel_minutes') or max(1, int(round(straight_line * 3.5))))
        if road_distance_km <= radius_km:
            results.append({
                'donation': donation,
                'road_distance_km': round(road_distance_km, 2),
                'travel_minutes': travel_minutes,
                'straight_line_km': round(straight_line, 2),
            })

    results.sort(key=lambda item: (item['road_distance_km'], item['travel_minutes']))
    return results
