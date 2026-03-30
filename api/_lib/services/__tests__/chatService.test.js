import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatService } from '../chatService'
import { CHAT_STATUS } from '../../../../src/shared/lib/constants.js'

describe('ChatService', () => {
  let chatService
  let mockIntelService
  let mockGeminiService

  beforeEach(() => {
    mockIntelService = {
      getRelevantIntel: vi.fn()
    }
    mockGeminiService = {
      generateChatResponse: vi.fn()
    }
    chatService = new ChatService(mockIntelService, mockGeminiService)
  })

  it('should orchestrate the chat flow correctly', async () => {
    const params = { message: 'hello', chatHistory: [], userProfile: {} }
    const onStatus = vi.fn()

    mockIntelService.getRelevantIntel.mockResolvedValue([{ content: 'Singapore is a city' }])
    mockGeminiService.generateChatResponse.mockResolvedValue({ 
      raw: 'Hello!', 
      parsed: { answer: 'Hello!' },
      model: 'gemini-pro'
    })

    const result = await chatService.processChat(params, onStatus)

    expect(mockIntelService.getRelevantIntel).toHaveBeenCalledWith('hello', onStatus)
    expect(onStatus).toHaveBeenCalledWith(CHAT_STATUS.GENERATING)
    expect(mockGeminiService.generateChatResponse).toHaveBeenCalledWith({
      ...params,
      intelSnippets: [{ content: 'Singapore is a city' }]
    })
    expect(result.raw).toBe('Hello!')
  })

  it('should handle errors in IntelService', async () => {
    mockIntelService.getRelevantIntel.mockRejectedValue(new Error('RAG failure'))
    
    await expect(chatService.processChat({ message: 'hi' }))
      .rejects.toThrow('RAG failure')
  })
})
