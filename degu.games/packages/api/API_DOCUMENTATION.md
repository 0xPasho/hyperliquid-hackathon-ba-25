# Scratch Editor API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Endpoints

### Projects

#### Create a New Project
```http
POST /api/v1/projects
```

**Request Body:**
```json
{
  "title": "My Awesome Game",  // Optional, defaults to "Untitled"
  "userId": "user-123",        // Optional
  "projectData": { }           // Optional, defaults to template
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "title": "My Awesome Game",
    "projectData": { /* Scratch project JSON */ },
    "createdAt": "2025-10-09T12:00:00.000Z",
    "updatedAt": "2025-10-09T12:00:00.000Z",
    "userId": "user-123"
  }
}
```

---

#### Get Project by ID
```http
GET /api/v1/projects/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "title": "My Awesome Game",
    "projectData": { /* Full Scratch project JSON */ },
    "createdAt": "2025-10-09T12:00:00.000Z",
    "updatedAt": "2025-10-09T12:00:00.000Z",
    "userId": "user-123"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Project not found"
}
```

---

#### Update Project
```http
PUT /api/v1/projects/:id
```

**Request Body:**
```json
{
  "title": "Updated Title",     // Optional
  "projectData": { /* ... */ }  // Optional
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "title": "Updated Title",
    "projectData": { /* ... */ },
    "createdAt": "2025-10-09T12:00:00.000Z",
    "updatedAt": "2025-10-09T12:05:00.000Z",
    "userId": "user-123"
  }
}
```

---

#### Delete Project
```http
DELETE /api/v1/projects/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

#### List All Projects
```http
GET /api/v1/projects
```

**Query Parameters:**
- `userId` (optional) - Filter projects by user ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx1234567890",
      "title": "Project 1",
      "projectData": { /* ... */ },
      "createdAt": "2025-10-09T12:00:00.000Z",
      "updatedAt": "2025-10-09T12:00:00.000Z",
      "userId": "user-123"
    },
    {
      "id": "clx0987654321",
      "title": "Project 2",
      "projectData": { /* ... */ },
      "createdAt": "2025-10-09T11:00:00.000Z",
      "updatedAt": "2025-10-09T11:00:00.000Z",
      "userId": "user-123"
    }
  ],
  "count": 2
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Project Data Structure

The `projectData` field contains the full Scratch project JSON with this structure:

```json
{
  "targets": [
    {
      "isStage": true,
      "name": "Stage",
      "variables": {},
      "lists": {},
      "broadcasts": {},
      "blocks": {},
      "costumes": [ /* ... */ ],
      "sounds": []
    },
    {
      "isStage": false,
      "name": "Sprite1",
      "variables": {},
      "blocks": {},
      "costumes": [ /* ... */ ],
      "sounds": [ /* ... */ ],
      "x": 0,
      "y": 0,
      "direction": 90
    }
  ],
  "monitors": [],
  "extensions": [],
  "meta": {
    "semver": "3.0.0",
    "vm": "0.2.0"
  }
}
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
cd packages/api
npm install
```

### 2. Configure Database
Create a `.env` file in `packages/api/`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/scratch_db"
PORT=3000
```

### 3. Run Migrations
```bash
npm run db:migrate
```

### 4. Start Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

---

## Testing with curl

### Create a project:
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Project"}'
```

### Get a project:
```bash
curl http://localhost:3000/api/v1/projects/clx1234567890
```

### Update a project:
```bash
curl -X PUT http://localhost:3000/api/v1/projects/clx1234567890 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Project"}'
```

### Delete a project:
```bash
curl -X DELETE http://localhost:3000/api/v1/projects/clx1234567890
```

### List all projects:
```bash
curl http://localhost:3000/api/v1/projects
```
