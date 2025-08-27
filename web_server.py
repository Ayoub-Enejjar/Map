import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load graph data from data/graph.json
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data', 'graph.json')
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

try:
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        GRAPH = json.load(f)
except Exception as e:
    GRAPH = {"nodes": [], "edges": []}
    print('Failed to load graph.json:', e)

# Build adjacency for Dijkstra
from collections import defaultdict
ADJ = defaultdict(list)
for e in GRAPH.get('edges', []):
    s = e['source']; t = e['target']; w = e['weight']
    ADJ[s].append((t, w))
    ADJ[t].append((s, w))  # undirected
for n in GRAPH.get('nodes', []):
    ADJ.setdefault(n['id'], [])

import heapq

def dijkstra(adj, start, goal):
    if start not in adj or goal not in adj:
        return {"distance": float('inf'), "path": []}
    dist = {node: float('inf') for node in adj}
    prev = {node: None for node in adj}
    dist[start] = 0
    pq = [(0, start)]
    visited = set()
    while pq:
        d, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)
        if u == goal:
            break
        for v, w in adj[u]:
            alt = d + w
            if alt < dist[v]:
                dist[v] = alt
                prev[v] = u
                heapq.heappush(pq, (alt, v))
    # reconstruct
    path = []
    u = goal
    if prev[u] is None and u != start:
        return {"distance": float('inf'), "path": []}
    while u is not None:
        path.append(u)
        u = prev[u]
    path.reverse()
    return {"distance": dist[goal], "path": path}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/graph':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(GRAPH).encode('utf-8'))
            return
        if parsed.path == '/api/shortest':
            qs = parse_qs(parsed.query)
            src = (qs.get('from') or [''])[0]
            dst = (qs.get('to') or [''])[0]
            if not src or not dst:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error":"Missing from or to"}).encode('utf-8'))
                return
            result = dijkstra(ADJ, src, dst)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            return
        # fallback to static files
        return super().do_GET()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8000'))
    httpd = HTTPServer(('0.0.0.0', port), Handler)
    print(f'Server running on port {port}')
    httpd.serve_forever()
