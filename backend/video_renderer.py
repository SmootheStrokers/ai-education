"""Video renderer — bridges Python backend to Remotion (Node.js) for MP4 rendering."""

import json
import os
import re
import shutil
import subprocess
import tempfile
from datetime import datetime

VIDEO_PROJECT_DIR = os.path.join(os.path.dirname(__file__), "..", "video")
OUTPUTS_DIR = os.path.join(os.path.dirname(__file__), "..", "outputs", "video")
RENDER_TIMEOUT = 300  # 5 minutes max

# Global render progress tracker: {run_id: {"progress": 0-100, "stage": str}}
_render_progress: dict[int, dict] = {}


def get_render_progress(run_id: int) -> dict | None:
    """Get current render progress for a run."""
    return _render_progress.get(run_id)


def _update_progress(run_id: int, progress: int, stage: str) -> None:
    """Update render progress."""
    if not run_id:
        return
    _render_progress[run_id] = {
        "progress": max(0, min(100, progress)),
        "stage": stage,
    }


def _find_npx() -> str:
    """Find the npx executable, checking common locations on Windows."""
    # Try shutil.which first (respects PATH)
    found = shutil.which("npx")
    if found:
        return found

    # On Windows, subprocess may not see PATH entries that the shell sees.
    # Check common Node.js installation locations.
    candidates = []

    # Check NVM_HOME, NVM_SYMLINK, or standard locations
    for env_var in ("NVM_SYMLINK", "NVM_HOME", "NODE_HOME"):
        val = os.environ.get(env_var)
        if val:
            candidates.append(val)

    # Standard Windows install paths
    candidates += [
        os.path.join(os.environ.get("ProgramFiles", ""), "nodejs"),
        os.path.join(os.environ.get("APPDATA", ""), "nvm", "current"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "fnm_multishells"),
    ]

    # Also scan PATH from the shell (it may contain entries Python doesn't see)
    path_dirs = os.environ.get("PATH", "").split(os.pathsep)
    candidates += path_dirs

    # Glob for non-standard locations like C:\node-x64\*
    import glob
    for pattern in [r"C:\node*\*", r"C:\Program Files\node*"]:
        candidates += glob.glob(pattern)

    for d in candidates:
        if not d:
            continue
        for name in ("npx.cmd", "npx.exe", "npx"):
            full = os.path.join(d, name)
            if os.path.isfile(full):
                return full

    return "npx"  # fallback, let it fail with a clear error


def is_remotion_available() -> bool:
    """Check if the Remotion project is set up and dependencies installed."""
    return os.path.exists(os.path.join(VIDEO_PROJECT_DIR, "node_modules", "remotion"))


def render_video(scene_json: str, params: dict, run_id: int = 0) -> str | None:
    """Render a video from scene JSON using Remotion.

    Args:
        scene_json: JSON string with scene descriptions
        params: Agent params (for filename generation)

    Returns:
        File path to rendered MP4, or None if rendering fails
    """
    if not is_remotion_available():
        print("[VideoRenderer] Remotion not installed. Run 'npm install' in video/ directory.")
        _update_progress(run_id, 0, "Remotion not installed")
        return None

    # Parse the scene JSON
    try:
        scene_data = json.loads(scene_json)
        _update_progress(run_id, 5, "Preparing scenes")
    except json.JSONDecodeError as e:
        print(f"[VideoRenderer] Invalid scene JSON: {e}")
        _update_progress(run_id, 0, "Invalid scene JSON")
        return None

    # Determine composition ID
    composition_id = scene_data.get("compositionId", "VideoLandscape")
    scenes = scene_data.get("scenes", scene_data)

    # Generate output filename
    os.makedirs(OUTPUTS_DIR, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y-%m-%d-%H%M%S")
    slug_parts = []
    for key in ["topic", "video_type"]:
        if params.get(key):
            slug_parts.append(params[key])
    slug = "-".join(slug_parts)[:60] if slug_parts else "video"
    slug = re.sub(r"[^a-zA-Z0-9-]", "-", slug).strip("-").lower()
    slug = re.sub(r"-+", "-", slug)
    output_filename = f"{timestamp}-{slug}.mp4"
    output_path = os.path.join(OUTPUTS_DIR, output_filename)

    # Write scene data to temp file
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False, encoding="utf-8"
    ) as f:
        # Ensure we pass the right structure
        render_data = {"scenes": scenes} if isinstance(scenes, list) else scene_data
        json.dump(render_data, f)
        temp_json_path = f.name

    try:
        # Resolve npx path (Windows subprocess often can't find it on PATH)
        npx_path = _find_npx()

        cmd = [
            npx_path, "tsx", "src/render.ts",
            "--input", temp_json_path,
            "--output", os.path.abspath(output_path),
            "--composition", composition_id,
        ]

        print(f"[VideoRenderer] Starting render: {composition_id}, {len(scenes) if isinstance(scenes, list) else '?'} scenes")
        print(f"[VideoRenderer] Using npx: {npx_path}")
        _update_progress(run_id, 10, "Starting Remotion render")

        process = subprocess.Popen(
            cmd,
            cwd=VIDEO_PROJECT_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=(os.name == "nt"),  # shell=True on Windows resolves .cmd files
        )

        _update_progress(run_id, 10, "Bundling project")

        stdout_lines = []
        try:
            if process.stdout is not None:
                for line in process.stdout:
                    line = line.strip()
                    stdout_lines.append(line)
                    if "[Remotion] Bundle:" in line:
                        try:
                            pct = int(line.split(":")[1].strip().replace("%", ""))
                            _update_progress(run_id, 10 + int(pct * 0.2), "Bundling")
                        except (ValueError, IndexError):
                            pass
                    elif "[Remotion] Selecting composition..." in line:
                        _update_progress(run_id, 28, "Preparing composition")
                    elif "[Remotion] Rendering " in line and "frames at" in line:
                        _update_progress(run_id, 30, "Rendering")
                    elif "[Remotion] Render:" in line:
                        try:
                            pct = int(line.split(":")[1].strip().replace("%", ""))
                            _update_progress(run_id, 30 + int(pct * 0.65), "Rendering")
                        except (ValueError, IndexError):
                            pass
                    elif "[Remotion] Done!" in line:
                        _update_progress(run_id, 98, "Finalizing")

            stderr_output = process.stderr.read() if process.stderr is not None else ""
            process.wait(timeout=RENDER_TIMEOUT)
        except subprocess.TimeoutExpired:
            process.kill()
            print(f"[VideoRenderer] Render timed out after {RENDER_TIMEOUT}s")
            _update_progress(run_id, 0, "Timed out")
            return None

        if process.returncode != 0:
            stdout_text = "\n".join(stdout_lines)
            print(f"[VideoRenderer] Render failed (exit {process.returncode}):")
            print(f"  stdout: {stdout_text[-500:]}" if stdout_text else "  (no stdout)")
            print(f"  stderr: {stderr_output[-500:]}" if stderr_output else "  (no stderr)")
            _update_progress(run_id, 0, "Failed")
            return None

        if os.path.exists(output_path):
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            print(f"[VideoRenderer] Success! {output_path} ({size_mb:.1f} MB)")
            _update_progress(run_id, 100, "Complete")
            return output_path
        else:
            print("[VideoRenderer] Render completed but output file not found")
            _update_progress(run_id, 0, "Output file missing")
            return None

    except subprocess.TimeoutExpired:
        print(f"[VideoRenderer] Render timed out after {RENDER_TIMEOUT}s")
        _update_progress(run_id, 0, "Timed out")
        return None
    except FileNotFoundError:
        print("[VideoRenderer] Node.js/npx not found. Ensure Node.js is installed.")
        _update_progress(run_id, 0, "Node.js not found")
        return None
    except Exception as e:
        print(f"[VideoRenderer] Unexpected error: {e}")
        _update_progress(run_id, 0, "Unexpected error")
        return None
    finally:
        if run_id in _render_progress and _render_progress[run_id]["progress"] >= 98:
            _render_progress[run_id]["progress"] = 100
        # Clean up temp file
        try:
            os.unlink(temp_json_path)
        except OSError:
            pass
