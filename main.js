const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.static("public"));

const sales = JSON.parse(fs.readFileSync("data/sales.json"));
const suppliersData = JSON.parse(fs.readFileSync("data/suppliers.json"));
const routes = JSON.parse(fs.readFileSync("data/routes.json"));

/* -------------------------
   SIMPLE LINEAR REGRESSION
--------------------------*/
function linearRegression(data) {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  data.forEach(d => {
    sumX += d.day;
    sumY += d.sales;
    sumXY += d.day * d.sales;
    sumXX += d.day * d.day;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/* -------------------------
   SHORTEST PATH (DIJKSTRA)
--------------------------*/
function shortestPath(graph, start, end) {
  const distances = {};
  const visited = {};
  const previous = {};

  Object.keys(graph).forEach(node => {
    distances[node] = Infinity;
    visited[node] = false;
  });

  distances[start] = 0;

  for (let i = 0; i < Object.keys(graph).length; i++) {
    let minNode = null;
    for (let node in distances) {
      if (!visited[node] && (minNode === null || distances[node] < distances[minNode])) {
        minNode = node;
      }
    }

    visited[minNode] = true;
    for (let neighbor in graph[minNode]) {
      let cost = distances[minNode] + graph[minNode][neighbor];
      if (cost < distances[neighbor]) {
        distances[neighbor] = cost;
        previous[neighbor] = minNode;
      }
    }
  }

  let path = [];
  let current = end;
  while (current) {
    path.unshift(current);
    current = previous[current];
  }

  return { path, cost: distances[end] };
}

/* -------------------------
   API ENDPOINT
--------------------------*/
app.get("/optimize", (req, res) => {
  const demandSpike = req.query.demandSpike === "true";
  const supplierDelay = req.query.supplierDelay === "true";
  const routeBlock = req.query.routeBlock === "true";

  /* Demand Prediction */
  const model = linearRegression(sales);
  let predicted = [];
  for (let i = 8; i <= 12; i++) {
    let value = model.slope * i + model.intercept;
    predicted.push(demandSpike ? value * 1.3 : value);
  }

  const avgDemand = predicted.reduce((a, b) => a + b) / predicted.length;

  /* Inventory */
  const leadTime = 3;
  const safetyStock = 100;
  const reorderPoint = avgDemand * leadTime + safetyStock;

  /* Supplier Selection */
  let suppliers = suppliersData.map(s => ({ ...s }));
  if (supplierDelay) {
    suppliers.forEach(s => s.delivery_time += 2);
  }

  suppliers.forEach(s => {
    s.score = s.cost * 0.4 + s.delivery_time * 0.4 + s.delay_risk * 0.2;
  });

  suppliers.sort((a, b) => a.score - b.score);
  const bestSupplier = suppliers[0];

  /* Route Optimization */
  const graph = {};
  routes.forEach(r => {
    if (!graph[r.from]) graph[r.from] = {};
    if (!graph[r.to]) graph[r.to] = {};
    graph[r.from][r.to] = r.cost;
    graph[r.to][r.from] = r.cost;
  });

  if (routeBlock) delete graph["Warehouse"]["CityA"];

  const route = shortestPath(graph, "Warehouse", "CityB");

  res.json({
    predictedDemand: predicted.map(v => Math.round(v)),
    avgDemand: Math.round(avgDemand),
    reorderPoint: Math.round(reorderPoint),
    bestSupplier,
    route
  });
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
