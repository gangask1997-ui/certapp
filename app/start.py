import http.server, socketserver, os, webbrowser, threading

PORT = 8765
os.chdir(os.path.dirname(os.path.abspath(__file__)))

def open_browser():
    webbrowser.open(f"http://localhost:{PORT}")

threading.Timer(0.5, open_browser).start()
print(f"DocVault running at http://localhost:{PORT}")
print("Press Ctrl+C to stop.")

with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
    httpd.serve_forever()
