"""
Cadence Engine desktop launcher.

Starts the existing FastAPI app locally, then opens it in a native desktop window
using pywebview so you can run it without Chrome.
"""

from __future__ import annotations

import socket
import threading
import time

import httpx
import uvicorn
import webview


class DesktopBridge:
    def __init__(self, server: uvicorn.Server):
        self.server = server

    def quit_app(self) -> dict[str, bool]:
        self.server.should_exit = True
        for window in webview.windows:
            window.destroy()
        return {"ok": True}


def _get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _wait_for_server(base_url: str, timeout_seconds: int = 15) -> None:
    deadline = time.time() + timeout_seconds
    with httpx.Client(timeout=1.0) as client:
        while time.time() < deadline:
            try:
                response = client.get(f"{base_url}/health")
                if response.status_code == 200:
                    return
            except Exception:
                pass
            time.sleep(0.2)
    raise RuntimeError(f"Server did not become ready within {timeout_seconds} seconds.")


def main() -> None:
    port = _get_free_port()
    host = "127.0.0.1"
    base_url = f"http://{host}:{port}"

    config = uvicorn.Config(
        "main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info",
    )
    server = uvicorn.Server(config)

    server_thread = threading.Thread(target=server.run, daemon=True)
    server_thread.start()

    _wait_for_server(base_url)

    bridge = DesktopBridge(server)
    window = webview.create_window("Cadence Engine", base_url, width=1400, height=900)
    try:
        webview.start(js_api=bridge)
    finally:
        server.should_exit = True
        server_thread.join(timeout=5)
        if window:
            pass


if __name__ == "__main__":
    main()
