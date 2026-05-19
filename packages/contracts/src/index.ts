import { z } from 'zod'

export const PRD_TEMPLATE_NAMES = [
  'standard',
  'internal-tool',
  'b2b-saas',
  'developer-platform',
] as const
export type PrdTemplateName = (typeof PRD_TEMPLATE_NAMES)[number]

export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  topic: z.string().min(1),
  targetAudience: z.string().optional(),
  template: z.enum(PRD_TEMPLATE_NAMES).optional(),
})

export const CreateSessionSchema = z.object({
  shareToken: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
})

export const SendMessageSchema = z.object({
  content: z.string().min(1),
})

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>
export type SendMessageInput = z.infer<typeof SendMessageSchema>

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Project {
  id: string
  name: string
  description: string
  topic: string
  shareToken: string
  prdMarkdown: string
  prdRalphJson: string
  createdAt: string
  updatedAt: string
  sessions: Session[]
}

export interface Session {
  id: string
  projectId: string
  name: string
  role: string
  status: 'active' | 'complete'
  messages: Message[]
  summary: string
  createdAt: string
  completedAt: string | null
}
