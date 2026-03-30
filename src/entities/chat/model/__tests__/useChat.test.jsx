import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import useChat from '../useChat'
import { apiClient } from '@shared/api/apiClient'
import { CHAT_STATUS, RESPONSE_TYPES } from '@shared/lib/constants'

// Mock the ApiClient
vi.mock('@shared/api/apiClient', () => ({
  apiClient: {
    stream: vi.fn()
  }
}))

describe('useChat', () => {
  const mockUser = { id: 1, name: 'Test User' }
  const mockCategory = 'Singapore'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useChat(mockUser, mockCategory))
    
    expect(result.current.messages).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.loadingStep).toBe(null)
    expect(result.current.input).toBe('')
  })

  it('should send a message and update state', async () => {
    const { result } = renderHook(() => useChat(mockUser, mockCategory))
    
    // Set input
    act(() => {
      result.current.setInput('Hello Singapore')
    })
    expect(result.current.input).toBe('Hello Singapore')

    // Mock successful stream
    apiClient.stream.mockImplementation(async (url, body, { onStatus, onData }) => {
      onStatus(CHAT_STATUS.EMBEDDING)
      onData({ type: RESPONSE_TYPES.FINAL, success: true, raw: 'AI Response', parsed: { answer: 'AI Response' } })
      return Promise.resolve()
    })

    // Send message
    await act(async () => {
      await result.current.sendMessage()
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0].role).toBe('user')
    expect(result.current.messages[1].role).toBe('ai')
    expect(result.current.messages[1].content).toBe('AI Response')
    expect(result.current.loading).toBe(false)
  })

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useChat(mockUser, mockCategory))
    
    apiClient.stream.mockRejectedValue(new Error('Network Error'))

    await act(async () => {
      await result.current.sendMessage('Hello Singapore')
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1].role).toBe('ai')
    expect(result.current.messages[1].content).toContain('Network Error')
    expect(result.current.loading).toBe(false)
  })
})
