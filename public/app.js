async function loadGraph() {
  const res = await fetch('/api/graph');
  if (!res.ok) throw new Error('Failed to fetch graph');
  return res.json();
}

function populateSelects(nodes) {
  const from = document.getElementById('from');
  const to = document.getElementById('to');
  for (const n of nodes) {
    const o1 = document.createElement('option');
    o1.value = n.id; o1.textContent = n.name;
    const o2 = o1.cloneNode(true);
    from.appendChild(o1); to.appendChild(o2);
  }
}

async function compute(from, to) {
  const url = new URL('/api/shortest', window.location.origin);
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to compute');
  return res.json();
}

function renderResult(result, nodes) {
  const resultDiv = document.getElementById('result');
  if (!result.path || result.path.length === 0 || !isFinite(result.distance)) {
    resultDiv.innerHTML = '<strong>No path found.</strong>';
    return;
  }
  const idToName = new Map(nodes.map(n => [n.id, n.name]));
  const names = result.path.map(id => idToName.get(id) || id);
  resultDiv.innerHTML = `Distance: <span class="badge">${result.distance} km</span><br/>Path: ${names.join(' → ')}`;

  // Highlight path in simple SVG map
  highlightPath(result.path);
}

function renderGraph(nodes, edges) {
  const graphDiv = document.getElementById('graph');
  const width = graphDiv.clientWidth - 24;
  const height = 260;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);

  // Simple radial layout
  const cx = width / 2; const cy = height / 2; const r = Math.min(cx, cy) - 20;
  const positions = new Map();
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    positions.set(n.id, { x, y });
  });

  // Draw edges
  for (const e of edges) {
    const a = positions.get(e.source);
    const b = positions.get(e.target);
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', `M ${a.x} ${a.y} L ${b.x} ${b.y}`);
    path.setAttribute('class', 'edge');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('fill', 'none');
    svg.appendChild(path);

    // weight label
    const midx = (a.x + b.x) / 2; const midy = (a.y + b.y) / 2;
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('x', midx);
    text.setAttribute('y', midy);
    text.setAttribute('fill', 'rgba(255,255,255,0.6)');
    text.setAttribute('font-size', '10');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = e.weight;
    svg.appendChild(text);
  }

  // Draw nodes
  for (const n of nodes) {
    const p = positions.get(n.id);
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', 10);
    circle.setAttribute('fill', 'url(#grad)');
    circle.setAttribute('stroke', 'rgba(255,255,255,0.6)');
    circle.setAttribute('stroke-width', '1');
    circle.setAttribute('data-id', n.id);
    svg.appendChild(circle);

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', p.x);
    label.setAttribute('y', p.y - 14);
    label.setAttribute('fill', 'white');
    label.setAttribute('font-size', '11');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = n.name;
    svg.appendChild(label);
  }

  // Gradient def
  const defs = document.createElementNS(svgNS, 'defs');
  const grad = document.createElementNS(svgNS, 'radialGradient');
  grad.setAttribute('id', 'grad');
  let stop1 = document.createElementNS(svgNS, 'stop');
  stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#60a5fa');
  let stop2 = document.createElementNS(svgNS, 'stop');
  stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#34d399');
  grad.appendChild(stop1); grad.appendChild(stop2); defs.appendChild(grad); svg.appendChild(defs);

  graphDiv.innerHTML = '';
  graphDiv.appendChild(svg);
  // store for later highlighting
  graphDiv._positions = positions;
  graphDiv._svg = svg;
}

function highlightPath(pathIds) {
  const graphDiv = document.getElementById('graph');
  const svg = graphDiv._svg;
  if (!svg) return;
  // Remove previous highlights
  svg.querySelectorAll('path.edge').forEach(p => p.classList.remove('highlight'));
  // Add highlight for edges along the path
  for (let i = 0; i < pathIds.length - 1; i++) {
    const a = pathIds[i], b = pathIds[i+1];
    const ax = graphDiv._positions.get(a); const bx = graphDiv._positions.get(b);
    // Find the matching edge path by d attribute
    const dStr = `M ${ax.x} ${ax.y} L ${bx.x} ${bx.y}`;
    const dStrRev = `M ${bx.x} ${bx.y} L ${ax.x} ${ax.y}`;
    const candidates = Array.from(svg.querySelectorAll('path.edge'));
    const match = candidates.find(p => p.getAttribute('d') === dStr || p.getAttribute('d') === dStrRev);
    if (match) match.classList.add('highlight');
  }
}

(async function init() {
  const graph = await loadGraph();
  populateSelects(graph.nodes);
  renderGraph(graph.nodes, graph.edges);

  document.getElementById('compute').addEventListener('click', async () => {
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    try {
      const res = await compute(from, to);
      renderResult(res, graph.nodes);
    } catch (e) {
      alert(e.message);
    }
  });
})();
