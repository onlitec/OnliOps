# Implementation Plan - Multi-Tenant Architecture

This plan details the structural changes required to transform the platform into a multi-tenant system supporting multiple Clients and Projects.

## User Review Required

> [!IMPORTANT]
> **Database Migration Strategy:** We will add `project_id` to almost all resource tables.
> **Existing Data:** All existing data will be assigned to a "Default Client" / "Default Project" to preserve continuity.
> **Routing Change:** URLs will likely change from `/dashboard` to `/app/:projectId/dashboard` or similar context-aware paths.

## Proposed Changes

### Database Schema

#### [NEW] `clients` Table
- `id` (UUID, PK)
- `name` (VARCHAR)
- `logo_url` (VARCHAR, nullable)
- `created_at`

#### [NEW] `projects` Table
- `id` (UUID, PK)
- `client_id` (UUID, FK -> clients.id)
- `name` (VARCHAR)
- `description` (TEXT)
- `status` (VARCHAR)
- `created_at`

#### [MODIFY] Existing Resource Tables
Add `project_id` (UUID, FK -> projects.id) to:
- `network_devices`
- `vlans`
- `alerts`
- `simulations`
- `device_connections`
- `audit_logs`
- `system_settings` (optional, for project-specific settings)

### Backend API (`import-api.cjs`)

#### Middleware
- Implement a middleware (or logic) to extract `X-Project-ID` header.
- Validate that the user has access to this Project ID (future step, initially just assume valid).

#### Endpoints
- **GET /api/clients**: List all clients.
- **GET /api/clients/:id/projects**: List projects for a client.
- **GET /api/projects/:id/dashboard**: Get summary stats for a project.
- **Update existing endpoints**: All `SELECT`, `INSERT`, `UPDATE` must include `project_id`.

### Frontend Architecture

#### Store (Redux)
- Add `projectSlice` to store:
    - `currentProject`: { id, name, ... }
    - `clients`: List of clients
    - `projects`: List of available projects

#### Routing
- `/` -> Redirect to `/clients` (Client Selection)
- `/clients` -> List Clients & Projects
- `/p/:projectId/dashboard` -> Project Dashboard
- `/p/:projectId/devices` -> Device List
- ... and so on.

#### Layout
- **MainLayout**: enhanced to show "Project Context" in the header (e.g., "Client A > Project X").
- **Sidebar**: Specific to the selected project.

## Verification Plan

### Automated Tests
- Since we lack a robust test suite, we will verify manually using the subagent.

### Manual Verification
1. **Migration Check:** Verify all existing devices appear under "Default Project".
2. **Multi-Tenancy:**
    - Create "Client B" -> "Project Y".
    - Add a device to "Project Y".
    - Verify "Project Y" device does NOT appear in "Default Project".
    - Verify "Default Project" device does NOT appear in "Project Y".
3. **Context Switching:** Verify switching projects updates the sidebar and data correctly.
