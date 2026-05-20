import Anthropic from '@anthropic-ai/sdk'

type Message = { role: 'user' | 'assistant'; content: string }

export async function callLlm(system: string, messages: Message[]): Promise<string> {
  const provider = process.env.LLM_PROVIDER ?? 'anthropic'
  if (provider === 'ollama') {
    return callOllama(system, messages)
  }
  return callAnthropic(system, messages)
}

async function callAnthropic(system: string, messages: Message[]): Promise<string> {
  const client = new Anthropic()
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system,
    messages,
  })
  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic')
  return block.text
}

async function callOllama(system: string, messages: Message[]): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL
  const model = process.env.OLLAMA_MODEL
  const maxTokens = parseInt(process.env.OLLAMA_MAX_TOKENS ?? '10000', 10)

  if (!baseUrl || !model) throw new Error('OLLAMA_BASE_URL and OLLAMA_MODEL must be set')

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: 'system', content: system }, ...messages],
      options: {
        num_ctx: 32768,
        num_predict: maxTokens,
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE ?? '0.3'),
      },
    }),
  })

  if (!response.ok) throw new Error(`Ollama request failed: ${response.status}`)
  if (!response.body) throw new Error('No response body from Ollama')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let result = ''
  let buffer = ''
  let streamDone = false

  while (!streamDone) {
    const { done, value } = await reader.read()
    streamDone = done
    if (value) buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      const parsed = JSON.parse(line) as { message?: { content: string }; done: boolean }
      if (parsed.message?.content) result += parsed.message.content
    }
  }

  return result
}
