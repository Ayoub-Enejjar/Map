function dijkstra(graph, start, end) {
  const distances = {};
  const visited = {};
  const previous = {};
  const queue = [];

  for (let node in graph) {
    distances[node] = Infinity;
    previous[node] = null;
  }

  distances[start] = 0;
  queue.push({ node: start, distance: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const { node } = queue.shift();

    if (visited[node]) continue;
    visited[node] = true;

    for (let neighbor in graph[node]) {
      const newDist = distances[node] + graph[node][neighbor];
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        previous[neighbor] = node;
        queue.push({ node: neighbor, distance: newDist });
      }
    }
  }

  // Reconstruct path
  const path = [];
  let current = end;
  while (current) {
    path.unshift(current);
    current = previous[current];
  }

  return { path, distance: distances[end] };
}

fetch('/graph.json')
  .then(res => res.json())
  .then(graph => {
    const result = dijkstra(graph, 'CityA', 'CityB');
    console.log(result.path, result.distance);
    // Render path on canvas or SVG
  });
