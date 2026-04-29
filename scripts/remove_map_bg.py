"""
Remove the background from roman_ruins_map.png using BFS flood-fill from all 4 corners.
Saves a PNG with an alpha channel (transparent background).
"""
from PIL import Image
import numpy as np
from collections import deque

SRC  = "public/regions/roman_ruins_map.png"
DEST = "public/regions/roman_ruins_map.png"
TOLERANCE = 28  # color distance threshold for "same as background"

img  = Image.open(SRC).convert("RGBA")
data = np.array(img, dtype=np.int32)
h, w = data.shape[:2]

# Sample background colour from the four corners (average them)
corners = [data[0,0,:3], data[0,w-1,:3], data[h-1,0,:3], data[h-1,w-1,:3]]
bg = np.mean(corners, axis=0)

print(f"Background colour sampled: R={bg[0]:.0f} G={bg[1]:.0f} B={bg[2]:.0f}")

# BFS flood-fill from all 4 corners
visited = np.zeros((h, w), dtype=bool)
queue   = deque()

for (r, c) in [(0,0), (0,w-1), (h-1,0), (h-1,w-1)]:
    if not visited[r, c]:
        visited[r, c] = True
        queue.append((r, c))

while queue:
    r, c = queue.popleft()
    for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):
        nr, nc = r+dr, c+dc
        if 0 <= nr < h and 0 <= nc < w and not visited[nr, nc]:
            pixel = data[nr, nc, :3]
            if np.sqrt(np.sum((pixel - bg)**2)) < TOLERANCE:
                visited[nr, nc] = True
                queue.append((nr, nc))

# Make background pixels fully transparent
result = np.array(img)
result[visited, 3] = 0

out = Image.fromarray(result, "RGBA")
out.save(DEST)
print(f"Saved transparent PNG → {DEST}")
print(f"Background pixels removed: {visited.sum():,} / {h*w:,}")
