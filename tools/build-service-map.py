#!/usr/bin/env python3
"""
Regenerates src/_includes/service-map.njk — the service-area map on /in-home-ot/.

Why a build-time SVG rather than a runtime map: a tile service (Google, Mapbox,
MapTiler) needs an API key, makes a third-party request on every page view, and
cannot be themed to this palette without a paid style editor or a pile of JS.
An inline SVG takes its colours from the same CSS tokens as the rest of the
site, costs no extra request, and works offline.

How land is filled
  OSM tags coastline as open, directional *lines*, not polygons, so land has to
  be reconstructed. Adjacent ways share nodes, so they stitch into long chains
  by endpoint. Each chain is then closed naively (straight line, last point back
  to first) and filled with fill-rule:nonzero.

  That closing line is why FETCH_BOX is so much larger than the drawn frame: the
  chords land far outside the visible area instead of cutting across it. Closing
  chains against the frame edge instead was tried and is worse — clipped points
  do not sit exactly on the boundary, so the edge-walk misroutes and draws
  crossing chords through the middle of the map.

Data
  Coastline : OpenStreetMap, via Overpass. ODbL — the rendered page must credit
              "© OpenStreetMap contributors", which src/in-home-ot.njk does.
  Towns     : published coordinates per place. Nordland shares a CDP with
              Marrowstone and Irondale with Port Hadlock, so eight points carry
              the ten names in site.serviceArea.

Run
  python3 tools/build-service-map.py          (caches the download in /tmp)
"""
import json, math, pathlib, subprocess, sys
from collections import defaultdict

# drawn frame
LAT0, LAT1 = 47.720, 48.155
LON0, LON1 = -123.16, -122.46
# fetched area — deliberately much larger; see the note above
FETCH_BOX  = (47.20, -124.10, 48.80, -121.90)
SIMPLIFY   = 2.8   # ~1.6px at the size the map actually renders
H          = 1000.0
CACHE      = pathlib.Path('/tmp/ptot-coastline-wide.json')

TOWNS = [
    ("Port Townsend", 48.11528, -122.76194, 'r', True),
    ("Cape George",   48.09806, -122.87833, 'l', False),
    ("Marrowstone",   48.05833, -122.68806, 'r', False),
    ("Port Hadlock",  48.03222, -122.76389, 'r', False),
    ("Chimacum",      48.01083, -122.76889, 'l', False),
    ("Discovery Bay", 47.99000, -122.89194, 'l', False),
    ("Port Ludlow",   47.89333, -122.69056, 'r', False),
    ("Quilcene",      47.75972, -122.88528, 'r', False),
]

W = H * ((LON1 - LON0) * math.cos(math.radians((LAT0 + LAT1) / 2))) / (LAT1 - LAT0)


def proj(lat, lon):
    return ((lon - LON0) / (LON1 - LON0) * W, (LAT1 - lat) / (LAT1 - LAT0) * H)


def fetch():
    if CACHE.exists():
        return json.loads(CACHE.read_text())
    s, w, n, e = FETCH_BOX
    q = f'[out:json][timeout:180];(way["natural"="coastline"]({s},{w},{n},{e}););out geom;'
    out = subprocess.run(['curl', '-s', '-m', '300', '-X', 'POST', '--data-binary', q,
                          'https://overpass-api.de/api/interpreter'],
                         capture_output=True, text=True, check=True).stdout
    CACHE.write_text(out)
    return json.loads(out)


def stitch(ways):
    """Join ways into maximal chains on shared endpoints."""
    key = lambda p: (round(p[0], 7), round(p[1], 7))
    chains = [list(w) for w in ways]
    changed = True
    while changed:
        changed = False
        by_start = defaultdict(list)
        for i, c in enumerate(chains):
            if key(c[0]) != key(c[-1]):
                by_start[key(c[0])].append(i)
        dead, out = set(), []
        for i, c in enumerate(chains):
            if i in dead:
                continue
            if key(c[0]) == key(c[-1]):
                out.append(c)
                continue
            cur = list(c)
            dead.add(i)
            while True:
                cand = [j for j in by_start[key(cur[-1])] if j not in dead]
                if not cand:
                    break
                j = cand[0]
                dead.add(j)
                cur.extend(chains[j][1:])
                changed = True
                if key(cur[0]) == key(cur[-1]):
                    break
            out.append(cur)
        chains = out
    return chains


def dp(pts, eps):
    if len(pts) < 3:
        return pts
    (x0, y0), (x1, y1) = pts[0], pts[-1]
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    idx, dmax = 0, 0.0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        dist = (abs(dy * px - dx * py + x1 * y0 - y1 * x0) / n
                if n else math.hypot(px - x0, py - y0))
        if dist > dmax:
            idx, dmax = i, dist
    return dp(pts[:idx + 1], eps)[:-1] + dp(pts[idx:], eps) if dmax > eps else [pts[0], pts[-1]]


def main():
    data = fetch()
    ways = [[(p['lat'], p['lon']) for p in (e.get('geometry') or []) if p]
            for e in data['elements']]
    ways = [w for w in ways if len(w) > 1]

    paths, kept = [], 0
    for c in stitch(ways):
        P = [proj(la, lo) for la, lo in c]
        if not any(-400 <= x <= W + 400 and -400 <= y <= H + 400 for x, y in P):
            continue                                   # nowhere near the frame
        Q = [p for p in P if -3000 <= p[0] <= W + 3000 and -3000 <= p[1] <= H + 3000]
        if len(Q) < 3:
            continue
        s = dp(Q, SIMPLIFY)
        if len(s) < 3:
            continue
        span = max(max(p[0] for p in s) - min(p[0] for p in s),
                   max(p[1] for p in s) - min(p[1] for p in s))
        if span < 6:                                   # specks and stray rocks
            continue
        kept += len(s)
        paths.append('M' + ' '.join(f'{x:.0f},{y:.0f}' for x, y in s) + 'Z')

    dots, labels = [], []
    for name, la, lo, side, base in TOWNS:
        x, y = proj(la, lo)
        r = 16 if base else 10
        dots.append(f'<circle class="{"m-base" if base else "m-town"}" '
                    f'cx="{x:.0f}" cy="{y:.0f}" r="{r}"/>')
        off = r + 15
        cls = 'm-lbl m-lbl-base' if base else 'm-lbl'
        anchor = '' if side == 'r' else ' text-anchor="end"'
        lx = x + off if side == 'r' else x - off
        labels.append(f'<text class="{cls}"{anchor} x="{lx:.0f}" y="{y + 9:.0f}">{name}</text>')

    km10 = 10.0 / 111.13 / (LAT1 - LAT0) * H
    bx, by = 40, H - 44
    svg = f'''<svg class="areamap" viewBox="0 0 {W:.0f} {H:.0f}" role="img"
     aria-label="Map of the service area: Port Townsend and East Jefferson County, from Cape George and Discovery Bay in the north west down to Quilcene in the south.">
<rect class="m-water" width="{W:.0f}" height="{H:.0f}"/>
<path class="m-land" fill-rule="nonzero" d="{''.join(paths)}"/>
<g class="m-scale">
<path d="M{bx},{by} h{km10:.0f}"/>
<path d="M{bx},{by - 8} v16 M{bx + km10:.0f},{by - 8} v16"/>
<text x="{bx}" y="{by - 20:.0f}">10 km</text>
</g>
{chr(10).join(dots)}
{chr(10).join(labels)}
</svg>'''

    header = ('{#\n  GENERATED — do not edit by hand.\n'
              '  Run: python3 tools/build-service-map.py\n'
              '  Coastline: OpenStreetMap contributors (ODbL). The page credits it.\n#}\n')
    out = pathlib.Path('src/_includes/service-map.njk')
    out.write_text(header + svg + '\n')
    print(f'{out}: {len(svg)/1024:.1f} KB, {len(paths)} land paths, {kept} points, '
          f'frame {W:.0f}x{H:.0f} (aspect {W/H:.2f})')


if __name__ == '__main__':
    sys.exit(main())
