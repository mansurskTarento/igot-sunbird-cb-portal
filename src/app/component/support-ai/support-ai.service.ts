import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"

export interface ChatMessage {
  sender: 'bot' | 'user'
  text?: string
  activity?: any
}

export interface ChatResponse {
  session_id: string
  activities: any[]
  status: string
  flow_id?: string
  ticket_id?: string
}
@Injectable({
  providedIn: 'root'
})



export class SupportAiService {
  private SUPPORT_AI_API = {
    LIST_SESSION:
      '/apis/proxies/v8/ai/chatbot/v1/sessions/list',

    CREATE_SESSION:
      '/apis/proxies/v8/ai/chatbot/v1/sessions/create',

    GET_HISTORY: (sessionId: string) =>
      `/apis/proxies/v8/ai/chatbot/v1/sessions/history/${sessionId}`,

    SEND_TURN: (sessionId: string) =>
      `/apis/proxies/v8/ai/chatbot/v1/sessions/turn/${sessionId}`
  }
  // private baseUrl = 'apis/proxies/v8';
  constructor(
    private http: HttpClient
  ) { }

  listSessions() {
    return this.http.get(
      this.SUPPORT_AI_API.LIST_SESSION
    )
  }

  createSession() {
    return this.http.post(
      this.SUPPORT_AI_API.CREATE_SESSION,
      {
        channel: 'web',
        language: 'en'
      }
    )
  }

  getHistory(sessionId: string) {
    return this.http.get(
      this.SUPPORT_AI_API.GET_HISTORY(sessionId)
    )
  }

  sendTurn(
    sessionId: string,
    payload: any
  ) {
    return this.http.post(
      this.SUPPORT_AI_API.SEND_TURN(sessionId),
      payload
    )
  }
}