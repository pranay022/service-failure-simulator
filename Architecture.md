# Architecture Design Document - Dependency Blast Radius Simulator

This document details the system architecture, design decisions, data models, graph algorithms, and scalability considerations for the **Dependency Blast Radius Simulator**.

---

## 1. System Architecture

The application is structured as a decoupled Client-Server system:

```
┌────────────────────────────────────────────────────────┐
│                      React Client                      │
│            (Vite, React Flow, TypeScript)              │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST APIs
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Express API Server                   │
│         (Node.js, Express, TypeScript, Zod)            │
└──────────────────────────┬─────────────────────────────┘
                           │ Prisma ORM
                           ▼
┌────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                  │
│        (Tables: Service, Dependency, SimulationRun)    │
└────────────────────────────────────────────────────────┘
```

### Component Interactions
- **Vite React Client**: Fetches services and dependencies, displays them visually on an interactive canvas using **React Flow**, and listens to user triggers.
- **Express Backend Server**: Exposes REST API endpoints for managing metadata (Service CRUD, Dependency mapping), running dynamic BFS failure simulations, and managing saved runs history.
- **PostgreSQL Database**: Persists configurations, dependency relations (edges), and historical simulation runs.

---

## 2. Graph Algorithmic Design

The core of the simulator relies on graph traversal algorithms implemented in [graphService.ts]

### A. Cascading Failure Simulation (BFS Propagation)
- **Algorithm**: Breadth-First Search (BFS) relaxation queue.
- **Input**: A list of initially failed service IDs.
- **Propagation Rules**:
  - Initial nodes are set to `FAILED`.
  - The failure propagates downstream to services that depend on them (dependent nodes).
  - If Service A has a `HARD` dependency on Service B, and B is `FAILED` ➔ A becomes `FAILED`.
  - If Service A has a `SOFT` dependency on Service B, and B is `FAILED` ➔ A becomes `DEGRADED`.
  - If a dependency is `DEGRADED` ➔ the dependent becomes at least `DEGRADED`.
  - A node is queued for re evaluation only if its state worsens (Healthy ➔ Degraded ➔ Failed). Because states worsen monotonically, nodes can change state at most twice, guaranteeing convergence and preventing infinite loops even in cycles.
- **Complexity**: $O(V + E)$ where $V$ is the number of services and $E$ is the number of dependencies.

### B. Circular Dependency Detection (DFS Cycle Check)
- **Algorithm**: Depth-First Search (DFS) path check.
- **Logic**: When creating a dependency `A -> B` (A depends on B), we trace outgoing dependencies from `B` using DFS. If we reach `A` during this traversal, a cycle exists (B depends on ... which depends on A).
- **Outcome**: The backend blocks this connection with a `400 Bad Request` to preserve logical tree hierarchy (DAG).
- **Complexity**: $O(V + E)$.

### C. Dependency Path Explorer
- When propagating failure, the BFS tracer stores the parent node that triggered the state transition. This builds a trace path list (e.g., `['Auth-Service', 'Database', 'User-Service']`), allowing users to inspect the exact cascade route for impacted services.

### D. Severity Score Formula
$$Impact = \sum_{n \in Nodes} CriticalityWeight(n) \times StatusMultiplier(n)$$
- **Criticality Weights**: `HIGH` = 3, `MEDIUM` = 2, `LOW` = 1.
- **Status Multipliers**: `FAILED` = 1.0, `DEGRADED` = 0.5, `HEALTHY` = 0.0.

---

## 3. Database Design

We use PostgreSQL with Prisma ORM. The relational schema is designed for quick dependency joins and cascading deletes:

```prisma
model Service {
  id           String       @id @default(uuid())
  name         String       @unique
  description  String?
  owner        String?
  criticality  String       // "HIGH" | "MEDIUM" | "LOW"
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  
  dependencies Dependency[] @relation("dependentRelation")
  dependents   Dependency[] @relation("dependencyRelation")
}

model Dependency {
  id           String   @id @default(uuid())
  dependentId  String
  dependent    Service  @relation("dependentRelation", fields: [dependentId], references: [id], onDelete: Cascade)
  dependencyId String
  dependency   Service  @relation("dependencyRelation", fields: [dependencyId], references: [id], onDelete: Cascade)
  type         String   // "HARD" | "SOFT"
  createdAt    DateTime @default(now())

  @@unique([dependentId, dependencyId])
}

model SimulationRun {
  id                     String   @id @default(uuid())
  name                   String
  initialFailedServiceIds Json
  results                Json
  createdAt              DateTime @default(now())
}
```

- **Cascade Delete**: When a `Service` is deleted, all incoming and outgoing `Dependency` records linking to it are automatically deleted by the database via `onDelete: Cascade` rules, preventing orphan edges.
- **Unique Compound Constraint**: The `@@unique([dependentId, dependencyId])` constraint prevents duplicate connections.

---

## 4. Scalability Considerations

1. **Graph Traversal in Memory**:
   Since service graphs for typical companies contain hundreds or thousands of services (rather than millions), executing BFS and DFS directly in Node.js memory is extremely fast (sub-millisecond). We load the services and dependencies list into memory structure to run calculations dynamically, avoiding chatty recursive database queries.
2. **Database Optimizations**:
   - Indexes are created on foreign keys (`dependentId`, `dependencyId`).
   - If the service network grows to tens of thousands of services, the graph computation could be offloaded to a graph database (e.g., Neo4j), or the adjacency list could be cached in memory (e.g., Redis) and updated only when dependencies change.

---

## 5. Failure Handling Strategies

1. **API Resiliency**:
   - Standardized middleware formats all errors (database connection loss, input validation, internal error) into clean JSON responses before returning them to the client.
2. **Infinite Loop Prevention**:
   - The BFS cascading failure algorithm uses a visited/status hierarchy check so that cyclic graphs do not trigger infinite loops.
3. **Graceful UI Degrades**:
   - If the backend goes offline, the React app displays a clear connection failure screen with a retry button instead of crashing.
