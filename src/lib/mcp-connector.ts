/**
 * The AI assistant connector (/api/mcp, /assistants, /assistants/openapi.json)
 * is switched off (DM-OWNER-127: "just cancel that"; keep the code).
 *
 * This is a hard-coded constant on purpose, not an environment setting:
 * turning the connector back on is a reviewed code change plus George's word.
 */
export const MCP_CONNECTOR_ENABLED = false;
