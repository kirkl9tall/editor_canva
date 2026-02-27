import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";

export class Renderify implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Renderify",
    name: "renderify",
    // icon: 'file:renderify.svg',
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: "Generate images and manage templates via the Renderify API",
    defaults: { name: "Renderify" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "renderifyApi", required: true }],

    properties: [
      // ── Operation ──────────────────────────────────────────────────────────
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Generate Image",
            value: "generateImage",
            description: "Render a template with variable substitution and receive the image URL",
            action: "Generate an image from a template",
          },
          {
            name: "List Templates",
            value: "listTemplates",
            description: "Return a paginated list of your templates",
            action: "List all templates",
          },
          {
            name: "Get Template",
            value: "getTemplate",
            description: "Fetch a single template by ID",
            action: "Get a template by ID",
          },
        ],
        default: "generateImage",
      },

      // ── Template ID (Generate Image + Get Template) ─────────────────────
      {
        displayName: "Template ID",
        name: "templateId",
        type: "string",
        required: true,
        displayOptions: {
          show: { operation: ["generateImage", "getTemplate"] },
        },
        default: "",
        description: "The ID of the Renderify template to use",
      },

      // ── Modifications / variables (Generate Image) ──────────────────────
      {
        displayName: "Modifications",
        name: "modifications",
        type: "fixedCollection",
        typeOptions: { multipleValues: true },
        displayOptions: {
          show: { operation: ["generateImage"] },
        },
        placeholder: "Add Modification",
        default: {},
        description:
          "Key-value pairs injected into the template's dynamic text layers",
        options: [
          {
            name: "modification",
            displayName: "Modification",
            values: [
              {
                displayName: "Key",
                name: "key",
                type: "string",
                default: "",
                description: "Placeholder variable name (e.g. title, subtitle, name)",
              },
              {
                displayName: "Value",
                name: "value",
                type: "string",
                default: "",
                description: "Value to substitute for this placeholder",
              },
            ],
          },
        ],
      },

      // ── Output format (Generate Image) ──────────────────────────────────
      {
        displayName: "Format",
        name: "format",
        type: "options",
        displayOptions: {
          show: { operation: ["generateImage"] },
        },
        options: [
          { name: "Auto (PNG)", value: "auto" },
          { name: "PNG",        value: "png"  },
          { name: "JPEG",       value: "jpeg" },
          { name: "PDF",        value: "pdf"  },
        ],
        default: "auto",
        description: "Output image format",
      },

      // ── Pagination (List Templates) ──────────────────────────────────────
      {
        displayName: "Page",
        name: "page",
        type: "number",
        typeOptions: { minValue: 1 },
        displayOptions: {
          show: { operation: ["listTemplates"] },
        },
        default: 1,
        description: "Page number (1-based)",
      },
      {
        displayName: "Limit",
        name: "limit",
        type: "number",
        typeOptions: { minValue: 1, maxValue: 100 },
        displayOptions: {
          show: { operation: ["listTemplates"] },
        },
        default: 20,
        description: "Number of templates per page (max 100)",
      },
    ],
  };

  // ── Execute ──────────────────────────────────────────────────────────────
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const credentials = await this.getCredentials("renderifyApi");
    const apiKey  = credentials.apiKey  as string;
    const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, "");

    const authHeader = { Authorization: `Bearer ${apiKey}` };

    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter("operation", i) as string;

      try {
        let responseData: unknown;

        // ── Generate Image ──────────────────────────────────────────────────
        if (operation === "generateImage") {
          const template_id = this.getNodeParameter("templateId", i) as string;
          const format      = this.getNodeParameter("format", i)     as string;

          const modsCollection = this.getNodeParameter("modifications", i) as {
            modification?: Array<{ key: string; value: string }>;
          };
          const modifications: Record<string, string> = {};
          for (const m of modsCollection.modification ?? []) {
            if (m.key) modifications[m.key] = m.value;
          }

          responseData = await this.helpers.httpRequest({
            method:  "POST",
            url:     `${baseUrl}/api/v1/images`,
            headers: { ...authHeader, "Content-Type": "application/json" },
            body:    {
              template_id,
              modifications,
              ...(format !== "auto" && { format }),
            },
            json: true,
          });

        // ── List Templates ──────────────────────────────────────────────────
        } else if (operation === "listTemplates") {
          const page  = this.getNodeParameter("page",  i) as number;
          const limit = this.getNodeParameter("limit", i) as number;

          responseData = await this.helpers.httpRequest({
            method:  "GET",
            url:     `${baseUrl}/api/v1/templates`,
            headers: authHeader,
            qs:      { page, limit },
            json:    true,
          });

        // ── Get Template ────────────────────────────────────────────────────
        } else if (operation === "getTemplate") {
          const templateId = this.getNodeParameter("templateId", i) as string;

          responseData = await this.helpers.httpRequest({
            method:  "GET",
            url:     `${baseUrl}/api/v1/templates/${templateId}`,
            headers: authHeader,
            json:    true,
          });

        } else {
          throw new NodeOperationError(
            this.getNode(),
            `Unknown operation: ${operation}`,
            { itemIndex: i },
          );
        }

        returnData.push({ json: responseData as Record<string, unknown> });

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json:       { error: (error as Error).message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
