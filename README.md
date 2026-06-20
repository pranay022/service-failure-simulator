# Dependency Blast Radius Simulator

An interactive, dashboard built to map distributed microservice relationships, define connection rules (Hard/Soft dependencies), and simulate cascading failures to analyze system resilience in real-time.

---

## 🚀 Features Built

- **Service Management**: Create, view, update, and delete service nodes. Deleting a service automatically cascade deletes all its connection edges.
- **Dependency Connection & Cycle Check**: Connect services with target handles on the React Flow canvas or using a dedicated form. Incoming edges undergo DFS cycle checks to prevent circular loops.
- **Cascading Failure Simulation**: Manually fail nodes (acting as root outages) to trigger downstream BFS calculations in real time:
  - `HARD` dependencies carry `FAILED` status downstream.
  - `SOFT` dependencies carry `DEGRADED` status downstream.
  - Glowing red/yellow flows animate along active edges carrying failures.
- **Path Cascade Analysis**: Clicking an affected node opens the Inspector, displaying the exact step by step cascade trail (e.g. `Payment-API` ➔ `Auth-API` ➔ `Checkout-UI`).
- **Resilience Dashboard**: Real time stats display healthy/degraded/failed counters alongside current **Blast Radius %** and **Impact Severity Score** (weighted by node criticalities).
- **Historical Analysis**: Save simulation runs to a history panel, and load them back onto the canvas at any time to compare failure profiles.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Zod
- **Frontend**: Vite, React, TypeScript, React Flow, Lucide React, Vanilla CSS
- **Database**: PostgreSQL

---

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) database running locally or in a container
- [Git](https://git-scm.com/)

---

### 1. Clone the Repository
```bash
git clone https://github.com/pranay022/service-failure-simulator.git
cd service-failure-simulator
```

---

### 2. Database Setup
Create a PostgreSQL database on port `5432`:
```sql
CREATE DATABASE blast_radius_db;
```

---

### 3. Backend Installation & Run
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `backend/` folder. A `.env.example` is provided as a reference:
   ```env
   DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@localhost:5432/blast_radius_db"
   PORT=5000
   ```
   *(Replace `<DB_USER>` and `<DB_PASSWORD>` with your local PostgreSQL credentials. The default PostgreSQL user is usually `postgres`.)*
4. Run database migrations to create the tables and generate the Prisma Client:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the development backend:
   ```bash
   npm run dev
   ```
   The backend will be live at http://localhost:5000. You can query http://localhost:5000/health to verify.

---

### 4. Frontend Installation & Run
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The application will be live at http://localhost:3000. (Vite is configured to proxy all `/api/*` queries to port 5000).

---

## 💡 Assumptions Made

1. **Dependency Direction**: We assume a dependency link `A -> B` means **A depends on B** (A is the dependent, B is the dependency being called). Therefore, failing B cascades downstream, impacting A.
2. **Cascading Hierarchy**: We assume failures and degradations worsen monotonically. A service's status is determined by taking the worst state cascaded from its dependencies:
   - If any dependency has failed and the connection is `HARD` ➔ the service is `FAILED`.
   - If any dependency is `FAILED` but the connection is `SOFT` OR if any dependency is `DEGRADED` ➔ the service is `DEGRADED`.
   - Otherwise, the service is `HEALTHY`.
3. **Database Availability**: We assume PostgreSQL runs standardly on `localhost:5432`.
