import http.server, socketserver, os, webbrowser, threading

PORT = 8080
os.chdir(os.path.dirname(os.path.abspath(__file__)))

threading.Timer(1, lambda: webbrowser.open(f"http://localhost:{PORT}")).start()
print(f"\n  CertApp running at: http://localhost:{PORT}")
print(f"  Landing page:       http://localhost:{PORT}/landing")
print(f"  Vault app:          http://localhost:{PORT}/app")
print(f"\n  Share with someone on same WiFi:")
import socket
ip = socket.gethostbyname(socket.gethostname())
print(f"  http://{ip}:{PORT}/landing")
print(f"\n  Press Ctrl+C to stop.\n")

with socketserver.TCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
    httpd.serve_forever()
