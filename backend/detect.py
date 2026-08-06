"""
PPE Detection engine built on top of an Ultralytics YOLO model trained on:
Hardhat, Mask, NO-Hardhat, NO-Mask, NO-Safety Vest, Person,
Safety Cone, Safety Vest, machinery, vehicle

Runs inference over an uploaded video, writes an annotated output video,
and produces a JSON-serializable analysis report used by the dashboard
and the chat assistant.
"""

import time
from pathlib import Path

import cv2
import imageio_ffmpeg
import subprocess
from ultralytics import YOLO

VIOLATION_CLASSES = {"NO-Hardhat", "NO-Mask", "NO-Safety Vest"}
COMPLIANT_CLASSES = {"Hardhat", "Mask", "Safety Vest"}

PPE_PAIRS = {
    "Hardhat": ("Hardhat", "NO-Hardhat"),
    "Mask": ("Mask", "NO-Mask"),
    "Safety Vest": ("Safety Vest", "NO-Safety Vest"),
}

BOX_COLORS = {
    "Hardhat": (46, 122, 30),
    "Mask": (46, 122, 30),
    "Safety Vest": (46, 122, 30),
    "NO-Hardhat": (43, 64, 214),
    "NO-Mask": (43, 64, 214),
    "NO-Safety Vest": (43, 64, 214),
    "Person": (115, 90, 61),
    "Safety Cone": (0, 177, 255),
    "machinery": (150, 150, 150),
    "vehicle": (150, 150, 150),
}


class PPEDetector:
    def __init__(self, weights_path: str, conf: float = 0.4, frame_skip: int = 2):
        self.model = YOLO(weights_path)
        self.conf = conf
        self.frame_skip = max(1, frame_skip)
        self.class_names = self.model.names

    def analyze_video(self, video_path: str, output_dir: str, video_id: str, progress_cb=None, conf_override: float = None):
        conf = conf_override if conf_override is not None else self.conf
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        annotated_path = output_dir / f"{video_id}_annotated.mp4"
        raw_path = output_dir / f"{video_id}_raw.mp4"

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Could not open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(str(raw_path), fourcc, fps, (width, height))

        class_totals = {name: 0 for name in self.class_names.values()}
        timeline = []
        last_annotated_frame = None
        frame_idx = 0
        start_time = time.time()

        sample_interval_frames = max(1, round(fps))
        running_violations = 0
        running_compliant = 0
        running_persons = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % self.frame_skip == 0:
                results = self.model.predict(frame, conf=conf, verbose=False)[0]
                annotated = frame.copy()
                frame_violations = 0
                frame_compliant = 0
                frame_persons = 0

                for box in results.boxes:
                    cls_id = int(box.cls[0])
                    cls_name = self.class_names.get(cls_id, str(cls_id))
                    class_totals[cls_name] = class_totals.get(cls_name, 0) + 1

                    if cls_name in VIOLATION_CLASSES:
                        frame_violations += 1
                    elif cls_name in COMPLIANT_CLASSES:
                        frame_compliant += 1
                    if cls_name == "Person":
                        frame_persons += 1

                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    color = BOX_COLORS.get(cls_name, (200, 200, 200))
                    conf_val = float(box.conf[0])
                    label = f"{cls_name} {conf_val:.2f}"
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                    cv2.rectangle(annotated, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
                    cv2.putText(annotated, label, (x1 + 2, y1 - 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

                last_annotated_frame = annotated
                running_violations = frame_violations
                running_compliant = frame_compliant
                running_persons = frame_persons
            else:
                annotated = last_annotated_frame if last_annotated_frame is not None else frame

            writer.write(annotated)

            if frame_idx % sample_interval_frames == 0:
                timeline.append({
                    "t": round(frame_idx / fps, 1),
                    "violations": running_violations,
                    "compliant": running_compliant,
                    "persons": running_persons,
                })

            frame_idx += 1
            if progress_cb and total_frames:
                progress_cb(min(99, int(frame_idx / total_frames * 100)))

        cap.release()
        writer.release()

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run(
            [ffmpeg_exe, "-y", "-i", str(raw_path),
             "-vcodec", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
             str(annotated_path)],
            capture_output=True,
        )
        raw_path.unlink(missing_ok=True)

        elapsed = round(time.time() - start_time, 1)

        compliance = {}
        for label, (ok_cls, bad_cls) in PPE_PAIRS.items():
            ok = class_totals.get(ok_cls, 0)
            bad = class_totals.get(bad_cls, 0)
            denom = ok + bad
            compliance[label] = {
                "compliant": ok,
                "violations": bad,
                "rate": round((ok / denom) * 100, 1) if denom else None,
            }

        total_violations = sum(class_totals.get(c, 0) for c in VIOLATION_CLASSES)
        total_compliant = sum(class_totals.get(c, 0) for c in COMPLIANT_CLASSES)
        overall_rate = (
            round((total_compliant / (total_compliant + total_violations)) * 100, 1)
            if (total_compliant + total_violations) else None
        )

        report = {
            "video_id": video_id,
            "confidence_threshold": conf,
            "processed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "processing_seconds": elapsed,
            "fps": round(fps, 1),
            "resolution": f"{width}x{height}",
            "total_frames": frame_idx,
            "class_totals": class_totals,
            "compliance": compliance,
            "overall_compliance_rate": overall_rate,
            "total_violations": total_violations,
            "total_compliant_detections": total_compliant,
            "max_persons_in_frame": max((t["persons"] for t in timeline), default=0),
            "timeline": timeline,
            "annotated_video_path": str(annotated_path),
        }
        return report