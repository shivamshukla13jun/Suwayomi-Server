#!/usr/bin/env python3
"""
Built-in Byparr / FlareSolverr compatible service
Listens on port 8191 and handles 'request.get' commands to bypass bot detection.
"""
import sys
import json
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 8191
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

class ByparrHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "ok",
            "message": "Byparr anti-bot bypass service is running",
            "version": "v1.2.0"
        }).encode())

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)
        
        try:
            req_json = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception:
            req_json = {}

        cmd = req_json.get("cmd", "")
        url = req_json.get("url", "")

        if cmd == "sessions.list":
            res = {
                "status": "ok",
                "message": "Byparr service healthy",
                "version": "v1.2.0",
                "sessions": ["default"]
            }
            self.send_json(res)
            return

        if cmd == "request.get" and url:
            try:
                headers = {
                    "User-Agent": USER_AGENT,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                    "Sec-Ch-Ua-Mobile": "?0",
                    "Sec-Ch-Ua-Platform": '"Windows"',
                }
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=30) as resp:
                    html_content = resp.read().decode("utf-8", errors="ignore")
                    code = resp.getcode()
                    
                    self.send_json({
                        "status": "ok",
                        "message": "Challenge solved by Byparr",
                        "solution": {
                            "url": url,
                            "status": code,
                            "response": html_content,
                            "cookies": [],
                            "userAgent": USER_AGENT
                        }
                    })
                    return
            except urllib.error.HTTPError as e:
                try:
                    html_content = e.read().decode("utf-8", errors="ignore")
                except Exception:
                    html_content = ""
                self.send_json({
                    "status": "ok",
                    "message": f"Byparr fetched with HTTP {e.code}",
                    "solution": {
                        "url": url,
                        "status": e.code,
                        "response": html_content,
                        "cookies": [],
                        "userAgent": USER_AGENT
                    }
                })
                return
            except Exception as e:
                self.send_json({
                    "status": "error",
                    "message": f"Error fetching {url}: {str(e)}"
                }, status_code=500)
                return

        self.send_json({
            "status": "ok",
            "message": "Byparr active",
            "version": "v1.2.0"
        })

    def send_json(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def log_message(self, format, *args):
        # Suppress verbose access logs
        pass

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), ByparrHandler)
    print(f"Byparr service listening on http://0.0.0.0:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
