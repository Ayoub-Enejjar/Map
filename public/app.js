
let graphData = null;
let currentPath = [];

// Fetch graph data and populate dropdowns
async function loadGraph() {
  try {
    showLoading('Loading cities...');
    const response = await fetch('/api/graph');
    graphData = await response.json();
    
    const fromSelect = document.getElementById('from');
    const toSelect = document.getElementById('to');
    
    // Clear existing options
    fromSelect.innerHTML = '<option value="">Choose departure...</option>';
    toSelect.innerHTML = '<option value="">Choose destination...</option>';
    
    // Populate dropdowns with cities
    graphData.nodes.forEach(node => {
      const option1 = document.createElement('option');
      option1.value = node.id;
      option1.textContent = node.name;
      fromSelect.appendChild(option1);
      
      const option2 = document.createElement('option');
      option2.value = node.id;
      option2.textContent = node.name;
      toSelect.appendChild(option2);
    });
    
    renderGraph();
    hideLoading();
  } catch (error) {
    console.error('Failed to load graph data:', error);
    showError('Failed to load city data. Please refresh the page.');
  }
}

// Show loading state
function showLoading(message = 'Loading...') {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `
    <div class="loading">
      <span class="spinner"></span>
      ${message}
    </div>
  `;
  resultDiv.className = 'result';
}

// Hide loading and show default message
function hideLoading() {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '<p>Select two cities above to calculate the shortest path between them.</p>';
  resultDiv.className = 'result';
}

// Show error message
function showError(message) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `<p style="color: var(--error);">⚠️ ${message}</p>`;
  resultDiv.className = 'result error';
}

// Show success result
function showSuccess(result) {
  const resultDiv = document.getElementById('result');
  const pathNames = result.path.map(id => {
    const node = graphData.nodes.find(n => n.id === id);
    return node ? node.name : id;
  });
  
  resultDiv.innerHTML = `
    <h3>🎯 Route Found!</h3>
    <p><strong>Total Distance:</strong> ${result.distance} km</p>
    <p><strong>Cities to visit:</strong> ${pathNames.length}</p>
    <div class="path-display">
      ${pathNames.join(' → ')}
    </div>
  `;
  resultDiv.className = 'result success fade-in';
}

// Compute shortest path with enhanced UX
async function computePath() {
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const computeBtn = document.getElementById('compute');
  
  if (!from || !to) {
    showError('Please select both departure and destination cities.');
    return;
  }
  
  if (from === to) {
    showError('Please select different cities for departure and destination.');
    return;
  }
  
  // Show loading state on button
  computeBtn.disabled = true;
  const btnText = computeBtn.querySelector('.btn-text');
  const btnLoading = computeBtn.querySelector('.btn-loading');
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline-flex';
  
  showLoading('Calculating shortest path...');
  
  try {
    // Add artificial delay for better UX (shows loading state)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const response = await fetch(`/api/shortest?from=${from}&to=${to}`);
    const result = await response.json();
    
    if (response.ok) {
      if (result.distance === Infinity) {
        showError('No path found between the selected cities.');
        clearHighlights();
      } else {
        currentPath = result.path;
        showSuccess(result);
        highlightPath(result.path);
      }
    } else {
      showError(result.error || 'Failed to calculate path.');
    }
  } catch (error) {
    console.error('Failed to compute path:', error);
    showError('Network error. Please try again.');
  } finally {
    // Reset button state
    computeBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

// Enhanced graph rendering with better positioning
function renderGraph() {
  const graphDiv = document.getElementById('graph');
  
  if (!graphData || !graphData.nodes.length) {
    graphDiv.innerHTML = '<p style="text-align: center; padding: 50px; color: var(--text-muted);">No graph data available</p>';
    return;
  }
  
  // Improved positions for better visual layout
  const positions = {
    'PAR': { x: 580, y: 100 },   // Paris - North
    'LYO': { x: 530, y: 260 },   // Lyon - Center-East
    'MAR': { x: 430, y: 340 },   // Marseille - South-East
    'BOR': { x: 320, y: 200 },   // Bordeaux - West
    'TOU': { x: 380, y: 140 },   // Toulouse - South-West
    'NIC': { x: 530, y: 140 }    // Nice - South-East
  };
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '450');
  svg.setAttribute('viewBox', '0 0 800 450');
  
  // Create gradient definitions for enhanced visuals
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'nodeGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');
  
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('style', 'stop-color:#2563eb;stop-opacity:1');
  
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('style', 'stop-color:#1d4ed8;stop-opacity:1');
  
  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);
  svg.appendChild(defs);
  
  // Draw edges first (so they appear behind nodes)
  graphData.edges.forEach(edge => {
    const sourcePos = positions[edge.source];
    const targetPos = positions[edge.target];
    
    if (sourcePos && targetPos) {
      // Draw edge line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', sourcePos.x);
      line.setAttribute('y1', sourcePos.y);
      line.setAttribute('x2', targetPos.x);
      line.setAttribute('y2', targetPos.y);
      line.setAttribute('class', 'edge');
      line.setAttribute('data-source', edge.source);
      line.setAttribute('data-target', edge.target);
      svg.appendChild(line);
      
      // Enhanced edge label with background
      const midX = (sourcePos.x + targetPos.x) / 2;
      const midY = (sourcePos.y + targetPos.y) / 2;
      
      // Background circle for label
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      labelBg.setAttribute('cx', midX);
      labelBg.setAttribute('cy', midY);
      labelBg.setAttribute('r', '14');
      labelBg.setAttribute('fill', 'var(--bg-secondary)');
      labelBg.setAttribute('stroke', 'var(--border)');
      labelBg.setAttribute('stroke-width', '1');
      svg.appendChild(labelBg);
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', midX);
      label.setAttribute('y', midY);
      label.setAttribute('class', 'edge-label');
      label.textContent = edge.weight;
      svg.appendChild(label);
    }
  });
  
  // Draw nodes with enhanced styling
  graphData.nodes.forEach(node => {
    const pos = positions[node.id];
    if (pos) {
      // Node shadow
      const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      shadow.setAttribute('cx', pos.x + 2);
      shadow.setAttribute('cy', pos.y + 2);
      shadow.setAttribute('r', '18');
      shadow.setAttribute('fill', 'rgba(0,0,0,0.3)');
      shadow.setAttribute('class', 'node-shadow');
      svg.appendChild(shadow);
      
      // Main node circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pos.x);
      circle.setAttribute('cy', pos.y);
      circle.setAttribute('r', '18');
      circle.setAttribute('class', 'node');
      circle.setAttribute('data-id', node.id);
      circle.setAttribute('fill', 'url(#nodeGradient)');
      svg.appendChild(circle);
      
      // Node label with background
      const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const labelWidth = node.name.length * 8 + 12;
      labelBg.setAttribute('x', pos.x - labelWidth/2);
      labelBg.setAttribute('y', pos.y - 40);
      labelBg.setAttribute('width', labelWidth);
      labelBg.setAttribute('height', '20');
      labelBg.setAttribute('rx', '10');
      labelBg.setAttribute('fill', 'var(--bg-secondary)');
      labelBg.setAttribute('stroke', 'var(--border)');
      labelBg.setAttribute('stroke-width', '1');
      svg.appendChild(labelBg);
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', pos.x);
      label.setAttribute('y', pos.y - 28);
      label.setAttribute('class', 'node-label');
      label.textContent = node.name;
      svg.appendChild(label);
    }
  });
  
  graphDiv.innerHTML = '';
  graphDiv.appendChild(svg);
}

// Enhanced path highlighting with animation
function highlightPath(path) {
  clearHighlights();
  
  // Highlight edges in sequence with animation delay
  for (let i = 0; i < path.length - 1; i++) {
    setTimeout(() => {
      const source = path[i];
      const target = path[i + 1];
      
      const edge = document.querySelector(
        `.edge[data-source="${source}"][data-target="${target}"], .edge[data-source="${target}"][data-target="${source}"]`
      );
      
      if (edge) {
        edge.classList.add('highlight');
      }
    }, i * 200);
  }
  
  // Highlight nodes in the path
  path.forEach((nodeId, index) => {
    setTimeout(() => {
      const node = document.querySelector(`.node[data-id="${nodeId}"]`);
      if (node) {
        node.style.fill = 'var(--success)';
        node.style.stroke = 'var(--accent-light)';
        node.style.strokeWidth = '3';
      }
    }, index * 200);
  });
}

// Clear all highlights
function clearHighlights() {
  document.querySelectorAll('.edge').forEach(edge => {
    edge.classList.remove('highlight');
  });
  
  document.querySelectorAll('.node').forEach(node => {
    node.style.fill = 'url(#nodeGradient)';
    node.style.stroke = 'var(--text-primary)';
    node.style.strokeWidth = '2';
  });
}

// Enhanced event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadGraph();
  
  const computeBtn = document.getElementById('compute');
  const fromSelect = document.getElementById('from');
  const toSelect = document.getElementById('to');
  
  computeBtn.addEventListener('click', computePath);
  
  // Allow Enter key to trigger computation
  [fromSelect, toSelect].forEach(select => {
    select.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        computePath();
      }
    });
  });
  
  // Clear results when selection changes
  [fromSelect, toSelect].forEach(select => {
    select.addEventListener('change', () => {
      clearHighlights();
      hideLoading();
    });
  });
});
