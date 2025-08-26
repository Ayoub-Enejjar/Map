const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load graph data
const graphPath = path.join(__dirname, 'data', 'graph.json');
let graph = { nodes: [], edges: [] };
try {
  graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
} catch (e) {
  console.error('Failed to load graph.json:', e.message);
}

// Build adjacency list from edges
function buildAdjacency(graph) {
  const adj = new Map();
  graph.nodes.forEach(n => adj.set(n.id, []));
  graph.edges.forEach(e => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source).push({ to: e.target, weight: e.weight });
    adj.get(e.target).push({ to: e.source, weight: e.weight }); // undirected
  });
  return adj;
}

function dijkstra(adj, start, goal) {
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();

  for (const node of adj.keys()) {
    dist.set(node, Infinity);
    prev.set(node, null);
  }
  dist.set(start, 0);

  // Simple priority queue using array (OK for small graphs)
  const pq = [{ node: start, d: 0 }];

  function pushPQ(item) {
    pq.push(item);
    pq.sort((a, b) => a.d - b.d);
  }

  while (pq.length > 0) {
    const { node: u } = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === goal) break;

    const neighbors = adj.get(u) || [];
    for (const { to: v, weight: w } of neighbors) {
      const alt = dist.get(u) + w;
      if (alt < dist.get(v)) {
        dist.set(v, alt);
        prev.set(v, u);
        pushPQ({ node: v, d: alt });
      }
    }
  }

  // Reconstruct path
  const path = [];
  let u = goal;
  if (!prev.has(u) && u !== start) {
    return { distance: Infinity, path: [] };
  }
  while (u !== null) {
    path.unshift(u);
    u = prev.get(u);
  }
  return { distance: dist.get(goal), path };
}

const adj = buildAdjacency(graph);

app.get('/api/graph', (req, res) => {
  res.json(graph);
});

app.get('/api/shortest', (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing from or to query params' });
  }
  if (!adj.has(from) || !adj.has(to)) {
    return res.status(404).json({ error: 'Unknown city' });
  }
  const result = dijkstra(adj, from, to);
  res.json(result);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web app running on http://0.0.0.0:${PORT}`);
});
