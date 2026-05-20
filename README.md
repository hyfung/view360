# View360

**Live demo: [hyfung.github.io/view360](https://hyfung.github.io/view360/)**

A browser-based 360° equirectangular image viewer. Drop any equirectangular photo and explore it interactively in a full-screen spherical view.

## Features

- **Drag to pan** — click and drag to look around
- **Scroll / pinch to zoom** — mouse wheel or two-finger pinch, FOV range 20°–120°
- **Touch support** — single-finger pan and two-finger pinch zoom on mobile
- **FOV slider** — HUD control for precise zoom adjustment
- **Save view** — exports the current viewport as a PNG screenshot
- **Drag-and-drop or file browse** — no upload, images stay in the browser

## Supported formats

Any equirectangular image in JPG, PNG, or WebP. The image is mapped onto the inside of a sphere using Three.js.

## Running locally

Requires [Node.js](https://nodejs.org/) 20 (via nvm) or Docker.

### With nvm

```bash
./npm_run_dev.sh
```

Dev server starts at `http://localhost:5173`.

### With Docker

```bash
./run.sh
```

Builds a production image served via nginx at `http://localhost:5173`.

### E2E tests

```bash
npx playwright test
```

## How unmapping works (equirectangular → flat rectangle)

The **Save view** button captures exactly this: a perspective-projected flat rectangle extracted from the equirectangular panorama at the current look direction and FOV. The same transform can be done offline in Python.

### The math

An equirectangular image encodes every direction on a sphere as a pixel:

```
u = (lon + π) / (2π)        # 0..1, left = west, right = east
v = (π/2 − lat) / π         # 0..1, top = north pole, bottom = south pole
```

To extract a flat rectilinear viewport you invert this:

1. **Pixel → ray** — for each output pixel `(px, py)` in a `W × H` image with field-of-view `fov`:
   ```
   f = 1 / tan(fov/2)                     # focal length (normalised)
   ray_cam = [ (2·px/W − 1)·(W/H),        # x (right)
               (1 − 2·py/H),              # y (up)
               −f ]                        # z (into scene)
   ray_cam = normalise(ray_cam)
   ```

2. **Rotate ray into world space** — apply the camera orientation (longitude `lon`, latitude `lat`):
   ```
   # build rotation matrix R = Ry(lon) · Rx(−lat)
   ray_world = R · ray_cam
   ```
   This matches how Three.js positions the camera:
   ```
   φ = 90° − lat,  θ = lon
   lookAt = ( sin φ cos θ,  cos φ,  sin φ sin θ )
   ```

3. **Ray → spherical → UV** — convert the world-space ray `(x, y, z)` back to equirectangular coordinates:
   ```
   lon_out = atan2(z, x)
   lat_out = asin(y)              # y is already normalised
   u = (lon_out + π) / (2π)
   v = (π/2 − lat_out) / π
   ```

4. **Sample the panorama** — look up `(u · W_src, v · H_src)` in the source image (bilinear interpolation avoids blocky artefacts).

### Python example

```python
import numpy as np
from PIL import Image

def unmap_equirectangular(pano_path, out_path,
                          lon_deg=0, lat_deg=0,
                          fov_deg=75, out_w=1280, out_h=720):
    pano = np.array(Image.open(pano_path).convert("RGB"), dtype=np.float32)
    H_src, W_src = pano.shape[:2]

    lon = np.radians(lon_deg)
    lat = np.radians(lat_deg)
    fov = np.radians(fov_deg)
    f   = 1.0 / np.tan(fov / 2)

    # Output pixel grid → normalised camera-space rays
    px, py = np.meshgrid(np.arange(out_w), np.arange(out_h))
    rx = (2 * px / out_w - 1) * (out_w / out_h)
    ry = (1 - 2 * py / out_h)
    rz = -np.full_like(rx, f)
    norm = np.sqrt(rx**2 + ry**2 + rz**2)
    rx, ry, rz = rx / norm, ry / norm, rz / norm

    # Rotate into world space: Ry(lon) · Rx(-lat)
    # Rx(-lat): y' = y·cos(lat) + z·sin(lat),  z' = -y·sin(lat) + z·cos(lat)
    ry2 =  ry * np.cos(lat) + rz * np.sin(lat)
    rz2 = -ry * np.sin(lat) + rz * np.cos(lat)
    # Ry(lon):  x' = x·cos(lon) + z·sin(lon),  z' = -x·sin(lon) + z·cos(lon)
    rx3 =  rx * np.cos(lon) + rz2 * np.sin(lon)
    rz3 = -rx * np.sin(lon) + rz2 * np.cos(lon)
    ry3 = ry2

    # World ray → spherical → equirectangular UV
    lon_out = np.arctan2(rz3, rx3)
    lat_out = np.arcsin(np.clip(ry3, -1, 1))
    u = ((lon_out + np.pi) / (2 * np.pi) * W_src).clip(0, W_src - 1)
    v = ((np.pi / 2 - lat_out) / np.pi   * H_src).clip(0, H_src - 1)

    # Bilinear sample
    u0, v0 = u.astype(int), v.astype(int)
    u1 = np.clip(u0 + 1, 0, W_src - 1)
    v1 = np.clip(v0 + 1, 0, H_src - 1)
    fu, fv = u - u0, v - v0
    def s(ui, vi): return pano[vi, ui]
    out = (s(u0,v0)*(1-fu[...,None])*(1-fv[...,None]) +
           s(u1,v0)*(  fu[...,None])*(1-fv[...,None]) +
           s(u0,v1)*(1-fu[...,None])*(  fv[...,None]) +
           s(u1,v1)*(  fu[...,None])*(  fv[...,None]))

    Image.fromarray(out.astype(np.uint8)).save(out_path)

# Example: extract a 75° FOV view looking east (lon=90°) at eye level (lat=0°)
unmap_equirectangular("panorama.jpg", "flat_view.png",
                      lon_deg=90, lat_deg=0, fov_deg=75)
```

The **Save view** button in this app does the same thing in real time via WebGL: the GPU rasterises the inside-out sphere and the camera's perspective projection performs the unmapping automatically.

## Tech stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Three.js](https://threejs.org/) — WebGL sphere rendering
- [Vite 4](https://vitejs.dev/)
- [Playwright](https://playwright.dev/) — end-to-end tests
- [nginx](https://nginx.org/) (Docker production image)
