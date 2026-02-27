# n8n-nodes-renderify

An [n8n](https://n8n.io/) community node for the **Renderify** image-generation API.  
Render templates with dynamic data, list your template library, and fetch template metadata — all from inside your n8n workflows.

---

## Installation

### Self-hosted n8n

```bash
npm install n8n-nodes-renderify
```

Restart n8n. The **Renderify** node will appear in the nodes panel.

### n8n Cloud

**Settings → Community Nodes → Install** → enter `n8n-nodes-renderify`.

---

## Credentials

Create a **Renderify API** credential:

| Field    | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| API Key  | Your Renderify API key — generate one in **Dashboard → API Keys**           |
| Base URL | Your Renderify instance URL, e.g. `https://your-renderify.com` (no trailing slash) |

Every request is authenticated with an `Authorization: Bearer <apiKey>` header.

---

## Operations

### Generate Image — `POST /api/v1/images`

Render a template with dynamic variable substitution.

| Parameter     | Type         | Description                                                 |
| ------------- | ------------ | ----------------------------------------------------------- |
| Template ID   | `string`     | ID of the template to render                                |
| Modifications | key-value list | Variable name → value pairs injected into dynamic text layers |
| Format        | enum         | `auto` (PNG) · `png` · `jpeg` · `pdf`                       |

Returns the full API response including `imageUrl`, `id`, `format`, `createdAt`.

---

### List Templates — `GET /api/v1/templates`

Return a paginated list of templates in your account.

| Parameter | Type     | Default | Description          |
| --------- | -------- | ------- | -------------------- |
| Page      | `number` | `1`     | Page number (1-based) |
| Limit     | `number` | `20`    | Results per page (max 100) |

---

### Get Template — `GET /api/v1/templates/:id`

Fetch metadata (name, dimensions, canvas JSON) for a single template.

| Parameter   | Type     | Description           |
| ----------- | -------- | --------------------- |
| Template ID | `string` | Template to retrieve  |

---

## Example workflow

```
Schedule Trigger (daily at 09:00)
  └─► Renderify — Generate Image
        templateId: "cm3x..."
        modifications:
          title  → "{{ $now.toFormat('MMMM d, yyyy') }}"
          subtitle → "Daily Report"
        format: png
  └─► Slack — Send Message
        text: "Daily image ready: {{ $json.imageUrl }}"
```

---

## Development

```bash
# install dev dependencies
npm install

# compile TypeScript → dist/
npm run build

# watch mode
npm run dev
```

Compiled output lands in `dist/`. The `"n8n"` field in `package.json` tells n8n where to load nodes and credentials from.

---

## License

MIT
