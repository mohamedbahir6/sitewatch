"""
One-off fix: OpenCV's mp4v codec isn't playable in Chrome/most browsers.
This re-encodes any already-generated annotated videos to H.264 in place,
using the ffmpeg binary bundled by imageio-ffmpeg (no system install needed).

Run once from the backend folder:  python fix_videos.py
"""

import subprocess
from pathlib import Path

import imageio_ffmpeg

OUTPUTS_DIR = Path(__file__).parent / "storage" / "outputs"
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

videos = list(OUTPUTS_DIR.glob("*_annotated.mp4"))
if not videos:
    print("No annotated videos found in storage/outputs — nothing to fix.")

for video_path in videos:
    print(f"Fixing {video_path.name} ...")
    temp_path = video_path.with_name(video_path.stem + ".fixed.mp4")
    result = subprocess.run(
        [ffmpeg_exe, "-y", "-i", str(video_path),
         "-vcodec", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         str(temp_path)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"  FAILED: {result.stderr[-800:]}")
        continue
    temp_path.replace(video_path)
    print(f"  Fixed: {video_path.name}")

print("Done — refresh the dashboard in your browser.")