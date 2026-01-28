function run() {
  const demandSpike = document.getElementById("demandSpike").checked;
  const supplierDelay = document.getElementById("supplierDelay").checked;
  const routeBlock = document.getElementById("routeBlock").checked;

  fetch(`/optimize?demandSpike=${demandSpike}&supplierDelay=${supplierDelay}&routeBlock=${routeBlock}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("output").textContent =
        JSON.stringify(data, null, 2);
    });
}
