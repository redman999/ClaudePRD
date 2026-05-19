export interface PrdSection {
  id: string
  title: string
  guidance: string
}

export interface PrdTemplate {
  name: string
  label: string
  description: string
  sections: PrdSection[]
}

const STANDARD: PrdTemplate = {
  name: 'standard',
  label: 'Standard software product',
  description: 'A general-purpose 4-section PRD. Good default when the project type is mixed or unclear.',
  sections: [
    { id: 'problemVision', title: 'Problem & Vision', guidance: 'the problem being solved, why it matters, and what success looks like in 12 months' },
    { id: 'usersPersonas', title: 'Users & Personas', guidance: 'target users, their roles, pain points, workflows' },
    { id: 'featuresReqs', title: 'Features & Requirements', guidance: 'functional requirements, feature list, must-have vs nice-to-have' },
    { id: 'techConstraints', title: 'Tech & Constraints', guidance: 'technical requirements, NFRs, integrations, security' },
  ],
}

const INTERNAL_TOOL: PrdTemplate = {
  name: 'internal-tool',
  label: 'Internal tool',
  description: 'For tools built for internal staff (back-office, ops, support). Emphasizes existing workflows and integrations.',
  sections: [
    { id: 'workflowsToReplace', title: 'Workflows to Replace', guidance: 'the current manual or ad-hoc processes this tool will absorb; what is painful today' },
    { id: 'rolesAndPermissions', title: 'Roles & Permissions', guidance: 'who logs in, what each role can see and do, audit and approval needs' },
    { id: 'integrations', title: 'Existing Systems & Integrations', guidance: 'data sources, systems of record, identity providers that must connect' },
    { id: 'operationalReqs', title: 'Operational Requirements', guidance: 'uptime expectations, support model, training, rollout plan' },
  ],
}

const B2B_SAAS: PrdTemplate = {
  name: 'b2b-saas',
  label: 'B2B SaaS product',
  description: 'Customer-facing SaaS with paying business customers. Includes packaging and GTM concerns.',
  sections: [
    { id: 'customerProblem', title: 'Customer Problem & Buyer Persona', guidance: 'who pays, who uses, the pain driving purchase decisions' },
    { id: 'corePersonas', title: 'Personas & Jobs-to-be-Done', guidance: 'admin, end user, IT decision maker — what each is hiring the product to do' },
    { id: 'features', title: 'Features & Packaging', guidance: 'feature set mapped to pricing tiers; what gates what' },
    { id: 'integrationsCompliance', title: 'Integrations, Security & Compliance', guidance: 'SSO, SOC2, data residency, API and webhook needs' },
    { id: 'gtm', title: 'Go-to-Market & Success Metrics', guidance: 'pricing model, sales motion, success metrics (ARR, retention, expansion)' },
  ],
}

const DEVELOPER_PLATFORM: PrdTemplate = {
  name: 'developer-platform',
  label: 'Developer platform / API',
  description: 'For APIs, SDKs, CLIs, and developer infrastructure. Emphasizes DX and reliability.',
  sections: [
    { id: 'devProblem', title: 'Developer Problem & Personas', guidance: 'what developer workflow this fixes; what kind of dev would adopt it' },
    { id: 'apiSurface', title: 'API & SDK Surface', guidance: 'supported languages, endpoints, primitives, naming conventions' },
    { id: 'docsAndDX', title: 'Docs, Examples & DX', guidance: 'quickstart, samples, error UX, observability, debuggability' },
    { id: 'reliabilityAndScale', title: 'Reliability, Scale & SLAs', guidance: 'latency, throughput, error budget, deprecation policy' },
    { id: 'pricingAndAdoption', title: 'Pricing, Limits & Adoption', guidance: 'free tier, rate limits, adoption signals to track' },
  ],
}

export const PRD_TEMPLATES: Record<string, PrdTemplate> = {
  standard: STANDARD,
  'internal-tool': INTERNAL_TOOL,
  'b2b-saas': B2B_SAAS,
  'developer-platform': DEVELOPER_PLATFORM,
}

export function resolveTemplate(name: string | null | undefined): PrdTemplate {
  if (name && PRD_TEMPLATES[name]) return PRD_TEMPLATES[name]
  return STANDARD
}

export function listTemplates(): { name: string; label: string; description: string }[] {
  return Object.values(PRD_TEMPLATES).map((t) => ({
    name: t.name,
    label: t.label,
    description: t.description,
  }))
}
