# n8n-nodes-renderify

An [n8n](https://n8n.io/) community node for the [Renderify](https://your-app.com) image generation API. Generate images, list templates, and fetch template metadata directly from your n8n workflows.

---

## Installation

### In a self-hosted n8n instance

```bash
npm install n8n-nodes-renderify
```

Then restart n8n. The node will appear in the nodes panel under **Renderify**.

### In n8n Cloud

Go to **Settings → Community Nodes → Install** and enter `n8n-nodes-renderify`.

---

## Credentials

Create a **Renderify API** credential with:

| Field    | Description                                                  |
| -------- | ------------------------------------------------------------ |
| API Key  | Your Renderify API key (from **Dashboard → API Keys**)       |
| Base URL | Your Renderify instance URL (default: `https://your-app.com`) |

The API key is sent as an `Authorization: Bearer <key>` header on every request.

---

## Operations

### Generate Image — `POST /api/v1/images`

Render a template with dynamic variable substitution and receive the image URL.

**Parameters:**

| Parameter      | Type   | Description                                         |
| -------------- | ------ | --------------------------------------------------- |
| Template ID    | string | The template to render                              |
| Variables      | list   | Key-value pairs injected into dynamic text layers   |
| Output Format  | enum   | `auto` (PNG) / `png` / `jpeg` / `pdf`               |

**Output:** Full API response including `imageUrl`, `id`, `format`, etc.

---

### List Templates — `GET /api/v1/templates`

Return a paginated list of templates in your account.

**Parameters:**

| Parameter | Type   | Default | Description        |
| --------- | ------ | ------- | ------------------ |
| Page      | number | 1       | Page number        |
| Limit     | number | 20      | Results per page   |

---

### Get Template — `GET /api/v1/templates/:id`

Fetch metadata (name, dimensions, canvas JSON) for a single template.

**Parameters:**

| Parameter   | Type   | Description     |
| ----------- | ------ | --------------- |
| Template ID | string | Template to fetch |

---

## Example workflow

1. **Schedule trigger** → runs daily
2. **Renderify** (Generate Image) → templateId = `cuid...`, variables = `{ "title": "{{ $now }}" }`
3. **HTTP Request** → POST to Slack with the returned `imageUrl`

---

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```

Compiled output lands in `dist/`. The `package.json` `n8n` field points n8n to those compiled files.

---

## License

MIT
