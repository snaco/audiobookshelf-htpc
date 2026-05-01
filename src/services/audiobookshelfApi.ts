import axios from 'axios'

interface Book {
  id: string
  title: string
  author: string
  coverUrl?: string
  duration: number
  description?: string
}

interface LibraryItem {
  id: string
  mediaType: 'book' | 'podcast'
  media: {
    metadata: {
      title: string
      authorName?: string
      description?: string
      duration?: number
      coverPath?: string
    }
  }
}

class AudiobookshelfApi {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }
  }

  async getLibraries() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/libraries`, {
        headers: this.headers
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch libraries:', error)
      throw error
    }
  }

  async getLibraryItems(libraryId: string): Promise<Book[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/libraries/${libraryId}/items`, {
        headers: this.headers
      })
      
      return response.data.map((item: LibraryItem) => ({
        id: item.id,
        title: item.media.metadata.title,
        author: item.media.metadata.authorName || 'Unknown',
        coverUrl: item.media.metadata.coverPath 
          ? `${this.baseUrl}/api/items/${item.id}/cover`
          : undefined,
        duration: item.media.metadata.duration || 0,
        description: item.media.metadata.description
      }))
    } catch (error) {
      console.error('Failed to fetch library items:', error)
      throw error
    }
  }

  async getPlaybackSession(itemId: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/items/${itemId}/playback-session`, {
        headers: this.headers
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch playback session:', error)
      throw error
    }
  }

  async createPlaybackSession(itemId: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/items/${itemId}/playback-session`,
        {},
        { headers: this.headers }
      )
      return response.data
    } catch (error) {
      console.error('Failed to create playback session:', error)
      throw error
    }
  }

  async updatePlaybackProgress(sessionId: string, currentTime: number) {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/api/session/${sessionId}`,
        { currentTime },
        { headers: this.headers }
      )
      return response.data
    } catch (error) {
      console.error('Failed to update playback progress:', error)
      throw error
    }
  }

  async getStreamUrl(itemId: string): Promise<string> {
    return `${this.baseUrl}/api/items/${itemId}/stream`
  }
}

export default AudiobookshelfApi
