import streamlit as st
import pandas as pd
import networkx as nx
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt

st.set_page_config(page_title="Smart Supply Chain Optimizer", layout="wide")
st.title("🚀 Smart Supply Chain Auto-Optimizer")

# ======================
# LOAD DATA
# ======================
sales = pd.read_csv("data/sales.csv")
suppliers = pd.read_csv("data/suppliers.csv")
routes = pd.read_csv("data/routes.csv")

# ======================
# DISRUPTION SIMULATOR
# ======================
st.sidebar.header("⚠️ Disruption Simulator")
supplier_delay = st.sidebar.checkbox("Supplier Delay")
demand_spike = st.sidebar.checkbox("Demand Spike")
route_block = st.sidebar.checkbox("Route Blocked")

# ======================
# DEMAND FORECASTING
# ======================
st.header("1️⃣ Demand Prediction")

X = sales[['day']]
y = sales['sales']

model = LinearRegression()
model.fit(X, y)

future_days = pd.DataFrame(
    {'day': range(sales['day'].max() + 1, sales['day'].max() + 6)}
)
predicted = model.predict(future_days)

if demand_spike:
    predicted = predicted * 1.3
    st.warning("⚠️ Demand spike detected (+30%)")

fig, ax = plt.subplots()
ax.plot(sales['day'], sales['sales'], label="Past Sales")
ax.plot(future_days['day'], predicted, label="Predicted Demand")
ax.legend()
st.pyplot(fig)

avg_demand = predicted.mean()
st.success(f"📈 Avg Predicted Demand: {int(avg_demand)} units")

# ======================
# INVENTORY OPTIMIZATION
# ======================
st.header("2️⃣ Inventory Optimization")

lead_time = st.slider("Lead Time (days)", 1, 10, 3)
safety_stock = st.slider("Safety Stock", 50, 300, 100)

reorder_point = (avg_demand * lead_time) + safety_stock
st.success(f"📦 Recommended Reorder Point: {int(reorder_point)} units")

# ======================
# SUPPLIER SELECTION
# ======================
st.header("3️⃣ Supplier Selection")

if supplier_delay:
    suppliers['delivery_time'] += 2
    st.warning("⚠️ Supplier delays detected")

suppliers['score'] = (
    suppliers['cost'] * 0.4 +
    suppliers['delivery_time'] * 0.4 +
    suppliers['delay_risk'] * 0.2
)

best_supplier = suppliers.sort_values('score').iloc[0]
st.dataframe(suppliers)
st.success(f"🏭 Selected Supplier: {best_supplier['name']}")

# ======================
# ROUTE OPTIMIZATION
# ======================
st.header("4️⃣ Route Optimization")

G = nx.Graph()
for _, row in routes.iterrows():
    G.add_edge(row['from'], row['to'], weight=row['cost'])

if route_block and G.has_edge("Warehouse", "CityA"):
    G.remove_edge("Warehouse", "CityA")
    st.warning("⚠️ Primary route blocked")

best_route = nx.shortest_path(G, "Warehouse", "CityB", weight="weight")
route_cost = nx.shortest_path_length(G, "Warehouse", "CityB", weight="weight")

st.success(f"🚚 Best Route: {' → '.join(best_route)}")
st.success(f"💰 Route Cost: {route_cost}")

# ======================
# BEFORE vs AFTER METRICS
# ======================
st.header("📊 Before vs After Comparison")

baseline_cost = 1500
optimized_cost = route_cost * 100

col1, col2, col3 = st.columns(3)
col1.metric("Cost Before", baseline_cost)
col2.metric("Cost After", optimized_cost)
col3.metric("Savings", baseline_cost - optimized_cost)

# ======================
# EXPLAINABILITY
# ======================
st.header("🧠 Decision Explanation")

st.write(f"""
• Predicted demand ≈ **{int(avg_demand)} units**  
• Lead time = **{lead_time} days**  
• Safety stock = **{safety_stock} units**  
• Supplier **{best_supplier['name']}** chosen due to best risk-adjusted score  
• Route optimized to minimize cost even during disruptions  
""")

st.success("✅ System Adapted Successfully to Current Conditions")
