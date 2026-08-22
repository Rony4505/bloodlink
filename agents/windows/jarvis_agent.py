#!/usr/bin/env python3
"""Jarvis Windows laptop agent — polls the hub and runs local commands."""

from __future__ import annotations

import io
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("Install dependencies: pip install -r requirements.txt")
    sys.exit(1)

HUB_URL = os.environ.get("JARVIS_HUB_URL", "http://localhost:3000").rstrip("/")
POLL_SECONDS = float(os.environ.get("JARVIS_POLL_SECONDS", "3"))
STATE_FILE = Path(os.environ.get("JARVIS_STATE_FILE", Path.home() / ".jarvis-agent.json"))
AGENT_NAME = os.environ.get("JARVIS_AGENT_NAME", "Windows Laptop")


def save_state(data: dict[str, Any]) -> None:
    STATE_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def load_state() -> dict[str, Any] | None:
    if not STATE_FILE.exists():
        return None
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def register() -> dict[str, Any]:
    saved = load_state()
    if saved and saved.get("id") and saved.get("token"):
        return saved

    res = requests.post(
        f"{HUB_URL}/api/jarvis/agents",
        json={"name": AGENT_NAME, "kind": "laptop"},
        timeout=20,
    )
    res.raise_for_status()
    agent = res.json()["agent"]
    save_state(agent)
    print(f"Registered agent: {agent['id']}")
    return agent


def heartbeat(agent: dict[str, Any], status: str = "idle") -> None:
    requests.post(
        f"{HUB_URL}/api/jarvis/agents/heartbeat",
        json={"agentId": agent["id"], "token": agent["token"], "status": status},
        timeout=15,
    )


def poll_job(agent: dict[str, Any]) -> dict[str, Any] | None:
    res = requests.get(
        f"{HUB_URL}/api/jarvis/agents/poll",
        params={"agentId": agent["id"], "token": agent["token"]},
        timeout=20,
    )
    if res.status_code == 401:
        STATE_FILE.unlink(missing_ok=True)
        raise RuntimeError("Agent token invalid — re-registering")
    res.raise_for_status()
    return res.json().get("job")


def upload_photo(agent: dict[str, Any], command_id: str, image_bytes: bytes, filename: str) -> str:
    res = requests.post(
        f"{HUB_URL}/api/jarvis/agents/upload",
        data={
            "agentId": agent["id"],
            "token": agent["token"],
            "commandId": command_id,
        },
        files={"photo": (filename, image_bytes, "image/jpeg")},
        timeout=60,
    )
    res.raise_for_status()
    return res.json()["url"]


def report_result(
    agent: dict[str, Any],
    command_id: str,
    success: bool,
    message: str = "",
    photo_url: str | None = None,
) -> None:
    requests.post(
        f"{HUB_URL}/api/jarvis/agents/result",
        json={
            "agentId": agent["id"],
            "token": agent["token"],
            "commandId": command_id,
            "success": success,
            "message": message,
            "photoUrl": photo_url,
        },
        timeout=20,
    )


def capture_camera() -> bytes:
    try:
        import cv2  # type: ignore
    except ImportError as exc:
        raise RuntimeError("opencv-python required for camera capture") from exc

    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam")

    try:
        for _ in range(8):
            cap.read()
            time.sleep(0.08)
        ok, frame = cap.read()
        if not ok or frame is None:
            raise RuntimeError("Failed to read camera frame")
        ok, encoded = cv2.imencode(".jpg", frame)
        if not ok:
            raise RuntimeError("Failed to encode JPEG")
        return encoded.tobytes()
    finally:
        cap.release()


def capture_screenshot() -> bytes:
    try:
        from PIL import ImageGrab  # type: ignore
    except ImportError as exc:
        raise RuntimeError("Pillow required for screenshot") from exc

    image = ImageGrab.grab()
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def run_volume(action: str) -> None:
    if sys.platform != "win32":
        return
    keys = {
        "mute": "{VOLUME_MUTE}",
        "up": "{VOLUME_UP}",
        "down": "{VOLUME_DOWN}",
    }
    key = keys.get(action)
    if not key:
        return
    subprocess.run(
        [
            "powershell",
            "-NoProfile",
            "-Command",
            f"(New-Object -ComObject WScript.Shell).SendKeys('{key}')",
        ],
        check=False,
    )


def open_app(app_name: str) -> None:
    if sys.platform != "win32":
        subprocess.Popen(["xdg-open", app_name])  # noqa: S603
        return
    subprocess.Popen(["cmd", "/c", "start", "", app_name], shell=False)  # noqa: S603


def handle_job(agent: dict[str, Any], job: dict[str, Any]) -> None:
    command_id = job["commandId"]
    intent = job["intent"]
    payload = job.get("payload") or {}

    heartbeat(agent, "working")
    try:
        if intent == "camera_capture":
            heartbeat(agent, "capturing")
            photo = capture_camera()
            url = upload_photo(agent, command_id, photo, f"{command_id}.jpg")
            report_result(agent, command_id, True, "Photo captured", url)
            print(f"Camera capture uploaded: {url}")
        elif intent == "screenshot":
            heartbeat(agent, "capturing")
            photo = capture_screenshot()
            url = upload_photo(agent, command_id, photo, f"{command_id}.jpg")
            report_result(agent, command_id, True, "Screenshot captured", url)
            print(f"Screenshot uploaded: {url}")
        elif intent == "volume_mute":
            run_volume("mute")
            report_result(agent, command_id, True, "Volume muted")
        elif intent == "volume_up":
            run_volume("up")
            report_result(agent, command_id, True, "Volume increased")
        elif intent == "volume_down":
            run_volume("down")
            report_result(agent, command_id, True, "Volume decreased")
        elif intent == "open_app":
            app_name = payload.get("appName") or "notepad"
            open_app(str(app_name))
            report_result(agent, command_id, True, f"Opened {app_name}")
        elif intent == "ping":
            report_result(agent, command_id, True, "Pong from Windows laptop agent")
        else:
            report_result(agent, command_id, False, f"Unsupported intent: {intent}")
    except Exception as exc:  # noqa: BLE001
        report_result(agent, command_id, False, str(exc))
        print(f"Command failed: {exc}")
    finally:
        heartbeat(agent, "idle")


def main() -> None:
    print(f"Jarvis Windows agent → {HUB_URL}")
    agent = register()

    while True:
        try:
            heartbeat(agent, "idle")
            job = poll_job(agent)
            if job:
                print(f"Running job {job.get('commandId')} ({job.get('intent')})")
                handle_job(agent, job)
        except RuntimeError:
            agent = register()
        except requests.RequestException as exc:
            print(f"Network error: {exc}")
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
