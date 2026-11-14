"""
=============================================================================
STVAMS Demo Traffic Footage Generator
Creates a realistic highway surveillance video for live Speed Radar & OCR demo.
Features:
- Vehicles traveling across Gate 1 (30%) and Gate 2 (70%)
- High-contrast Indian standard registration plates:
  * Car 1: MH02BE1001 (Speed: ~76 km/h -> Over speed limit fine triggered)
  * Car 2: MH02DM2026 (Speed: ~86 km/h -> Demo Faculty Vehicle fined)
  * Car 3: DL01FI1005 (Speed: ~52 km/h -> Safe, compliant speed)
- Encoded with FFmpeg H.264 for universal browser HTML5 compatibility
=============================================================================
"""

import cv2
import numpy as np
import subprocess
import os

WIDTH = 1280
HEIGHT = 720
FPS = 30
DURATION_SEC = 12
TOTAL_FRAMES = FPS * DURATION_SEC

def draw_plate(img, text, center_x, center_y, width=140, height=36):
    """Draws a high-contrast Indian High Security Registration Plate (HSRP)"""
    x1 = int(center_x - width // 2)
    y1 = int(center_y - height // 2)
    x2 = int(center_x + width // 2)
    y2 = int(center_y + height // 2)

    # White plate background with black border
    cv2.rectangle(img, (x1, y1), (x2, y2), (255, 255, 255), -1)
    cv2.rectangle(img, (x1, y1), (x2, y2), (20, 20, 20), 2)

    # Blue IND strip on left
    ind_w = int(width * 0.16)
    cv2.rectangle(img, (x1, y1), (x1 + ind_w, y2), (180, 70, 20), -1)
    cv2.putText(img, "IND", (x1 + 3, y1 + int(height * 0.65)), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)

    # Plate alphanumeric characters
    font_scale = 0.68
    thickness = 2
    text_x = x1 + ind_w + 6
    text_y = y1 + int(height * 0.72)
    cv2.putText(img, text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (10, 10, 10), thickness, cv2.LINE_AA)

def draw_car(frame, x, y, car_type, plate_text, scale=1.0):
    """Renders a top-down vehicle model with roof, windshields, lights, and license plate"""
    w = int(170 * scale)
    h = int(270 * scale)
    x1 = int(x - w // 2)
    y1 = int(y - h // 2)
    x2 = int(x + w // 2)
    y2 = int(y + h // 2)

    # Cast shadow underneath
    shadow = np.zeros_like(frame)
    cv2.ellipse(shadow, (int(x), int(y + 10)), (int(w * 0.58), int(h * 0.54)), 0, 0, 360, (0, 0, 0), -1)
    # Blend shadow
    cv2.addWeighted(frame, 0.85, shadow, 0.15, 0, frame)

    # Vehicle body color
    if car_type == "sedan":
        body_color = (235, 235, 240)       # Pearl White
        roof_color = (210, 210, 215)
    elif car_type == "suv":
        body_color = (190, 60, 30)         # Royal Navy Blue
        roof_color = (140, 40, 20)
    else:
        body_color = (50, 140, 200)        # Gold / Bronze Hatchback
        roof_color = (40, 110, 160)

    # Car Body rounded rectangle
    cv2.rectangle(frame, (x1, y1), (x2, y2), body_color, -1)
    cv2.rectangle(frame, (x1, y1), (x2, y2), (30, 30, 30), 2)

    # Front Windshield
    fw_y1 = y1 + int(h * 0.22)
    fw_y2 = y1 + int(h * 0.38)
    fw_pts = np.array([
        [x1 + 14, fw_y1], [x2 - 14, fw_y1],
        [x2 - 8, fw_y2], [x1 + 8, fw_y2]
    ], np.int32)
    cv2.fillPoly(frame, [fw_pts], (40, 45, 50))

    # Roof
    cv2.rectangle(frame, (x1 + 8, fw_y2), (x2 - 8, y2 - int(h * 0.28)), roof_color, -1)

    # Rear Windshield
    rw_y1 = y2 - int(h * 0.28)
    rw_y2 = y2 - int(h * 0.16)
    rw_pts = np.array([
        [x1 + 8, rw_y1], [x2 - 8, rw_y1],
        [x2 - 14, rw_y2], [x1 + 14, rw_y2]
    ], np.int32)
    cv2.fillPoly(frame, [rw_pts], (35, 40, 45))

    # Headlights (bottom if driving down)
    cv2.rectangle(frame, (x1 + 6, y2 - 8), (x1 + 32, y2), (180, 255, 255), -1)
    cv2.rectangle(frame, (x2 - 32, y2 - 8), (x2 - 6, y2), (180, 255, 255), -1)

    # Rear/Front License Plate (rendered clearly on the bumper)
    plate_w = min(150, int(w * 0.78))
    plate_h = 34
    draw_plate(frame, plate_text, x, y2 - 18, plate_w, plate_h)

def generate_video(output_mp4_path):
    temp_raw_avi = "temp_raw_traffic.avi"
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    out = cv2.VideoWriter(temp_raw_avi, fourcc, FPS, (WIDTH, HEIGHT))

    print(f"[*] Rendering {TOTAL_FRAMES} frames ({DURATION_SEC}s @ {FPS}fps) to {temp_raw_avi}...")

    # Vehicle schedule:
    # (start_frame, duration_to_cross, lane_x, car_type, plate_text)
    # Distance from Gate 1 (30% = 216px) to Gate 2 (70% = 504px) is 288px.
    # Total travel from y = -150 to y = 870 is 1020px.
    # Gate 1 to Gate 2 takes duration * (288 / 1020) = duration * 0.282 frames.
    # In real world: 15m / (speed / 3.6) seconds.
    # For speed = 76 km/h: time = 15 / 21.11 = 0.71s = 21 frames.
    # Total frames to traverse screen = 21 / 0.282 = ~75 frames.

    vehicles = [
        # Car 1: Overspeeding White Sedan (76 km/h) in Lane 2
        {"start_frame": 15, "total_frames": 72, "lane_x": 490, "type": "sedan", "plate": "MH02BE1001"},
        # Car 2: High Speed Blue SUV (86 km/h) in Lane 3
        {"start_frame": 115, "total_frames": 63, "lane_x": 780, "type": "suv", "plate": "MH02DM2026"},
        # Car 3: Compliant Hatchback (52 km/h) in Lane 1
        {"start_frame": 210, "total_frames": 105, "lane_x": 240, "type": "hatchback", "plate": "DL01FI1005"},
    ]

    for frame_idx in range(TOTAL_FRAMES):
        # 1. Draw Highway Road Surface
        frame = np.full((HEIGHT, WIDTH, 3), (48, 52, 58), dtype=np.uint8) # Dark asphalt

        # Road boundaries / shoulders (Curbs)
        cv2.rectangle(frame, (0, 0), (90, HEIGHT), (80, 85, 90), -1)
        cv2.rectangle(frame, (90, 0), (96, HEIGHT), (240, 240, 240), -1) # Left yellow/white line
        cv2.rectangle(frame, (WIDTH - 96, 0), (WIDTH - 90, HEIGHT), (240, 240, 240), -1)
        cv2.rectangle(frame, (WIDTH - 90, 0), (WIDTH, HEIGHT), (80, 85, 90), -1)

        # Lane dividers (Dashed lines: Lane 1 | Lane 2 | Lane 3)
        lane_dividers_x = [370, 640, 910]
        dash_offset = (frame_idx * 16) % 60
        for lx in lane_dividers_x:
            for y in range(-60 + dash_offset, HEIGHT + 60, 60):
                cv2.rectangle(frame, (lx - 2, y), (lx + 2, y + 34), (250, 250, 250), -1)

        # Draw active vehicles
        for veh in vehicles:
            f_rel = frame_idx - veh["start_frame"]
            if 0 <= f_rel <= veh["total_frames"]:
                pct = f_rel / veh["total_frames"]
                car_y = int(-180 + pct * (HEIGHT + 360))
                draw_car(frame, veh["lane_x"], car_y, veh["type"], veh["plate"], scale=1.0)

        out.write(frame)

    out.release()
    print("[+] Raw AVI created successfully.")

    # Convert to standard MP4 (H.264 / AAC) using FFmpeg for native browser playback
    print(f"[*] Encoding H.264 MP4 to {output_mp4_path} with FFmpeg...")
    cmd = [
        "ffmpeg", "-y",
        "-i", temp_raw_avi,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "22",
        output_mp4_path
    ]
    subprocess.run(cmd, check=True)
    if os.path.exists(temp_raw_avi):
        os.remove(temp_raw_avi)
    print(f"[+] Demo traffic video ready: {output_mp4_path} ({os.path.getsize(output_mp4_path)} bytes)")

if __name__ == "__main__":
    out_file = os.path.join(os.path.dirname(__file__), "../frontend/public/videos/traffic_highway_demo.mp4")
    out_file = os.path.abspath(out_file)
    generate_video(out_file)
