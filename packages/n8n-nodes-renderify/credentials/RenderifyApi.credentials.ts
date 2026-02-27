import type { ICredentialType, INodeProperties } from "n8n-workflow";

export class RenderifyApi implements ICredentialType {
  name = "renderifyApi";
  displayName = "Renderify API";
  documentationUrl = "https://your-app.com/docs/api";

  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
      required: true,
      description:
        "Your Renderify API key. Generate one in the dashboard under API Keys.",
    },
    {
      displayName: "Base URL",
      name: "baseUrl",
      type: "string",
      default: "https://your-app.com",
      description: "Base URL of your Renderify instance (no trailing slash).",
    },
  ];
}
