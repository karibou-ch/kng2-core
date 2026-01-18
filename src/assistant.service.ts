import { HttpClient, HttpErrorResponse, HttpHeaders, HttpRequest, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Config, config, configCors } from './config';

import { ReplaySubject, Observable, throwError as _throw, of, BehaviorSubject, throwError, Subject } from 'rxjs';
import { map, catchError, tap, filter } from 'rxjs/operators';
import { AnalyticsService } from './metrics.service';


export interface Assistant {
  deleted: boolean;
}

/**
 * ✅ AssistantStep - Étape d'exécution d'un agent
 */
export interface AssistantStep {
  description: string;
  tool?: string;
  status?: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
}

/**
 * ✅ Usage - Statistiques d'utilisation des tokens
 */
export interface Usage {
  prompt: number;
  completion: number;
  cost: number;
  total: number;
}

/**
 * ✅ AssistantState - État de l'assistant pour la gestion UI
 */
export interface AssistantState {
  status: 'init' | 'prompt' | 'running' | 'end' | 'error';
  usage?: Usage;
  agent?: string;
  content?: string;
  steps?: AssistantStep[];
  error?: string;
  thinking?: boolean;
}

/**
 * ✅ AssistantMessage - Message dans la discussion
 */
export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  steps?: AssistantStep[];
}

/**
 * ✅ ClientDiscussion - Discussion complète avec l'assistant
 */
export interface ClientDiscussion {
  id: string | null;
  messages: AssistantMessage[];
  usage: Usage;
  agent?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ✅ Extract steps from a message content
 */
export function parseSteps(message: string): AssistantStep[] {
  if (!message) return [];
  const jsonraw = message.match(/<step>([\s\S]*?)<\/step>/gm)?.map(step => step.replace(/<\/?step>/g, '')) || [];
  return jsonraw?.map(step => {
    try {
      const parsed = JSON.parse(step);
      return { description: parsed.description || step, ...parsed };
    } catch (e) {
      return { description: step };
    }
  }) || [];
}

//
// Internal cache of request
// simple way to share instance between components
class Cache {
  list: Assistant[];
  map: Map<string, Assistant> //key is a slug
  constructor() {
    this.list = [];
    this.map = new Map();
  }
}

@Injectable()
export class AssistantService {
  //
  // common multicast to update UX when one shop on the list is modified
  // use it for singleton usage of assistant
  public assistant$: ReplaySubject<Assistant>;
  public assistants$: BehaviorSubject<Assistant[]> | ReplaySubject<Assistant[]>;

  config: any;

  // ✅ Default values
  private defaultUsage: Usage = { prompt: 0, completion: 0, cost: 0, total: 0 };
  private defaultState: AssistantState = { status: 'init', usage: this.defaultUsage };

  // ✅ StateGraph BehaviorSubjects
  private discussionSubject = new BehaviorSubject<ClientDiscussion>({
    id: null,
    messages: [],
    usage: this.defaultUsage,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  private stateSubject = new BehaviorSubject<AssistantState>(this.defaultState);
  private transcriptionsSubject = new BehaviorSubject<string>('');
  private memoriesSubject = new BehaviorSubject<any[]>([]);

  // ✅ Event system for prompt cross-component communication
  private promptEventSubject = new Subject<string>();

  // ✅ Public observables
  discussion$ = this.discussionSubject.asObservable();
  state$ = this.stateSubject.asObservable();
  transcriptions$ = this.transcriptionsSubject.asObservable();
  memories$ = this.memoriesSubject.asObservable();
  promptEvt$ = this.promptEventSubject.asObservable();

  private cache: Cache = new Cache();
  private headers: HttpHeaders;
  private defaultConfig: Config = config;

  constructor(
    private $http: HttpClient
  ) {
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'ngsw-bypass': 'true',
      'k-dbg': AnalyticsService.FBP
    });
    this.config = config;

    this.assistants$ = new BehaviorSubject<Assistant[]>(null);
  }

  // ✅ StateGraph getters
  get discussion(): ClientDiscussion {
    return this.discussionSubject.value;
  }

  get discussionMessages(): AssistantMessage[] {
    return this.discussion.messages;
  }

  get state(): AssistantState {
    return this.stateSubject.value;
  }

  private deleteCache(slug: string): Assistant {
    const incache = this.cache.map.get(slug);
    if (incache) {
      incache.deleted = true;
      this.cache.map.delete(slug);
    }
    return incache;
  }

  private updateCache(assistant: Assistant): Assistant {
    return assistant;
  }

  /**
   * ✅ Clean text from thinking and step tags
   */
  private cleanText(text: string): string {
    return text
      .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
      .replace(/^<step.*$/gm, '')
      .replace(/<memories>[\s\S]*?<\/memories>/g, '');
  }

  /**
   * ✅ Update state with partial values
   */
  updateState(partial: Partial<AssistantState>) {
    this.stateSubject.next({
      ...this.state,
      ...partial
    });
  }

  /**
   * ✅ Cross-component prompt communication + chat trigger
   */
  sendPrompt(prompt: string, options?: { agent?: string, ragname?: string, thinking?: boolean }) {
    this.promptEventSubject.next(prompt);
    return this.chat({ q: prompt, agent: options?.agent, ragname: options?.ragname, thinking: options?.thinking });
  }

  /**
   * ✅ Get history from server
   */
  history(opts?): Observable<ClientDiscussion | Assistant[]> {
    opts = opts || {};
    const query = new URLSearchParams(opts);

    return this.$http.get<any>(this.defaultConfig.API_SERVER + '/v1/assistant/history?' + query.toString(), {
      headers: this.headers,
      withCredentials: (configCors())
    }).pipe(
      tap((res: any) => {
        // Process messages to remove memory content
        if (res.messages && Array.isArray(res.messages)) {
          res.messages = res.messages.map((msg: any) => {
            if (typeof msg.content === 'string') {
              msg.content = msg.content.replace(/<memories [^>]+[\s\S]*?<\/memories>/g, '');
            }
            return msg;
          });
        }

        // Update StateGraph discussion if response has messages
        if (res.messages) {
          this.discussionSubject.next(res);
          const state: Partial<AssistantState> = {
            usage: res.usage || this.defaultUsage,
            agent: res.agent || opts.agent || this.state.agent,
          };
          this.stateSubject.next({ ...this.state, ...state });
        } else {
          // Legacy format: array of messages
          this.assistants$.next(res);
        }
        return res;
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status == 401) {
          return of([]);
        }
        // FIXME: Add notify() method for error display (Shoelace or other)
        return throwError(err)
      })
    )
  }

  /**
   * ✅ Delete a message from history
   */
  historyDel(messageId: string, agent?: string): Observable<any> {
    if (!messageId) {
      return of(this.discussionSubject.value);
    }

    const agentParam = agent || 'current';
    return this.$http.post(this.defaultConfig.API_SERVER + `/v1/assistant/history/none/${messageId}`, {}, {
      headers: this.headers,
      withCredentials: (configCors())
    }).pipe(
      tap((res: any) => {
        this.discussionSubject.next(res);
      }),
      catchError((err: HttpErrorResponse) => {
        // FIXME: Add notify() method for error display
        console.error('historyDel error:', err);
        return of(err);
      })
    );
  }

  /**
   * ✅ Get memories from RAG
   */
  memories(): Observable<any> {
    return this.$http.get(this.defaultConfig.API_SERVER + '/v1/assistant/memories', {
      headers: this.headers,
      withCredentials: (configCors())
    }).pipe(
      tap((memories: any) => {
        this.memoriesSubject.next(memories);
      }),
      catchError((err: HttpErrorResponse) => {
        // FIXME: Add notify() method for error display
        console.error('memories error:', err);
        return of([]);
      })
    );
  }

  /**
   * ✅ Delete a memory from RAG
   */
  memoryDel(id: string): Observable<any> {
    return this.$http.delete(this.defaultConfig.API_SERVER + `/v1/assistant/memories/${id}`, {
      headers: this.headers,
      withCredentials: (configCors())
    }).pipe(
      tap(() => {
        const current = this.memoriesSubject.value;
        this.memoriesSubject.next(current.filter((m: any) => m.id !== id));
        // FIXME: Add notify() method for success display
      }),
      catchError((err: HttpErrorResponse) => {
        // FIXME: Add notify() method for error display
        console.error('memoryDel error:', err);
        return of(err);
      })
    );
  }

  /**
   * ✅ Add temporary user message to discussion
   */
  private addTemporaryUserMessage(prompt: string, agent: string) {
    const currentDiscussion = this.discussionSubject.value;
    const tempMessage: AssistantMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    this.discussionSubject.next({
      ...currentDiscussion,
      messages: [...currentDiscussion.messages, tempMessage],
      updatedAt: new Date()
    });
  }

  /**
   * ✅ Create temporary assistant message at start of streaming
   */
  private createTemporaryAssistantMessage(): string {
    const currentDiscussion = this.discussionSubject.value;
    const messages = [...currentDiscussion.messages];

    const existing = messages.find(msg =>
      msg.role === 'assistant' && msg.id.startsWith('temp-assistant-')
    );
    if (existing) {
      return existing.id;
    }

    const tempAssistantMessage: AssistantMessage = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      steps: []
    };
    messages.push(tempAssistantMessage);

    this.discussionSubject.next({
      ...currentDiscussion,
      messages,
      updatedAt: new Date()
    });

    return tempAssistantMessage.id;
  }

  /**
   * ✅ Update existing temporary assistant message
   */
  private updateTemporaryAssistantMessage(content: string, steps?: AssistantStep[]) {
    const currentDiscussion = this.discussionSubject.value;
    const messages = currentDiscussion.messages;

    const assistantMsgIndex = messages.findIndex(msg =>
      msg.role === 'assistant' && msg.id.startsWith('temp-assistant-')
    );

    if (assistantMsgIndex !== -1) {
      const existingMessage = messages[assistantMsgIndex];
      existingMessage.content = content;
      if (steps) {
        existingMessage.steps = steps;
      }
    }
  }

  //
  // REST api wrapper with streaming support
  chat(params: any): Observable<any> {
    const options: any = {
      credentials: 'include',
      method: 'post',
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        "k-dbg": AnalyticsService.FBP,
        'ngsw-bypass': 'true'
      }
    };
    if (configCors()) {
      options.mode = 'cors';
    }
    if (params.body) {
      options.body = JSON.stringify(params.body)
      delete params.body;
    }

    //
    // force no-cache
    params.rnd = Date.now();
    const query = new URLSearchParams(params || {});

    // ✅ Add temporary user message
    const prompt = params.q || params.query || '';
    const agent = params.agent || 'current';
    if (prompt) {
      this.addTemporaryUserMessage(prompt, agent);
      this.updateState({
        status: 'prompt',
        content: prompt,
        agent: agent,
        thinking: params.thinking || false
      });
    }

    return new Observable<any>(observer => {
      const xhr = new XMLHttpRequest();
      let messageCreated = false;
      let stepsAccum: AssistantStep[] = [];
      let contentAccum = '';

      try {
        xhr.open('POST', this.defaultConfig.API_SERVER + '/v1/assistant/thread?' + query.toString(), true);
        //
        // remove it for no CORS
        if (configCors()) {
          xhr.withCredentials = true;
        }
        xhr.setRequestHeader('ngsw-bypass', 'true');
        xhr.setRequestHeader("k-dbg", AnalyticsService.FBP);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'text/event-stream');
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        // we must make use of this on the server side if we're working with Android - because they don't trigger
        // readychange until the server connection is closed
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        //
        // decode json data
        // => /(${anchor}:)[^{]*(.*?\})/gi
        const anchor = params.anchor || 'zqyw';
        const jsonEx = new RegExp(`(${anchor}:)(.*)`, "gim");
        //const skuBlock = /{{(.*?)}}/ig;
        const skuBlock = /{{([\d,]*?)}}|\[([\d,]*?)\]/ig;
        let responseText = '';
        let fullcontent = '';

        let lastIndex = 0;
        xhr.onprogress = () => {
          const index = xhr.responseText.length;
          if (lastIndex == index) {
            return;
          }

          // ✅ Create temp assistant message on first chunk
          if (!messageCreated) {
            this.createTemporaryAssistantMessage();
            messageCreated = true;
          }

          responseText = xhr.responseText;
          const text = responseText.substring(lastIndex).replace(skuBlock, '');
          const json = jsonEx.exec(text);
          let tool = {};
          if (json && json[2]) {
            try { tool = JSON.parse(`${json[2]}`); } catch (err) { }
          }

          lastIndex = index;
          fullcontent += text;

          // ✅ Parse steps incrementally
          const chunkSteps = parseSteps(text);
          if (chunkSteps.length) {
            stepsAccum = [...stepsAccum, ...chunkSteps];
            this.updateState({
              status: 'running',
              steps: stepsAccum,
              agent: agent
            });
          }

          // ✅ Update content and temp message
          const cleanedText = this.cleanText(text);
          if (cleanedText && cleanedText.trim()) {
            contentAccum += cleanedText;
            this.updateState({
              status: 'running',
              content: contentAccum,
              agent: agent
            });
            this.updateTemporaryAssistantMessage(contentAccum, stepsAccum);
          }

          observer.next({ text: text.replace(jsonEx, ''), tool }); // Envoyer le chunk au subscriber
        };

        xhr.onload = () => {
          // xhr.responseText;
          const skus = responseText.match(skuBlock);
          let tool = {};

          //
          // our template content
          if (skus && skus.length) {
            tool = skus.map(match => match.replace(/{{|}}/g, '').split(',')).flat().map(sku => (+sku)).filter(sku => sku);
          }

          // ✅ Update state to end
          this.updateState({
            status: 'end',
            agent: agent,
            content: undefined,
            steps: undefined
          });

          //observer.next({text:fullcontent,tool});
          observer.complete();
        };

        xhr.onerror = () => {
          this.updateState({
            status: 'error',
            error: 'network',
            agent: agent,
            content: undefined,
            steps: undefined
          });
          observer.error(new TypeError('Network request error'));
          observer.complete();
        }
        xhr.ontimeout = () => {
          this.updateState({
            status: 'error',
            error: 'timeout',
            agent: agent,
            content: undefined,
            steps: undefined
          });
          observer.error(new TypeError('Network request timed out'));
          observer.complete();
        }

        xhr.send(options.body);

      } catch (err) {
        console.log('---- err', err);
        this.updateState({
          status: 'error',
          error: 'exception',
          agent: agent
        });
        observer.error(err);
        observer.complete();
      }

      return {
        abort() {
          xhr.abort();
        },
        unsubscribe() {
        }
      };
    });
  }

  /**
   * ✅ Whisper transcription API
   */
  whisper(state: { blob?: Blob, chunk?: Blob, type?: string, silent?: boolean, previousText?: string }): Observable<string> {
    if ((!state?.blob && !state?.chunk) || state.silent) {
      return of('');
    }

    const formData = new FormData();
    formData.append('audio', state.blob || state.chunk);
    formData.append('type', state.type || 'prompt');
    formData.append('file', 'audio.wav');

    if (state.previousText) {
      formData.append('previousText', state.previousText);
    }

    // FIXME: Backend endpoint should be /v1/assistant/transcribe
    return this.$http.post<{ transcription: string }>(this.defaultConfig.API_SERVER + '/v1/assistant/transcribe', formData, {
      withCredentials: (configCors())
    }).pipe(
      map(resp => {
        const transcription = resp.transcription || '';
        this.transcriptionsSubject.next(transcription);
        return transcription;
      }),
      catchError((err: HttpErrorResponse) => {
        // FIXME: Add notify() method for error display with proper error messages
        console.error('whisper error:', err);
        let errorMessage = 'Erreur lors de la transcription audio';
        if (err.status === 413) {
          errorMessage = err.error?.message || 'Le fichier audio est trop volumineux';
        } else if (err.status === 400) {
          errorMessage = err.error?.error || err.error?.message || 'Format audio non supporté';
        } else if (err.status === 0) {
          errorMessage = 'Erreur de connexion au serveur';
        }
        return throwError(new Error(errorMessage));
      })
    );
  }

  /**
   * ✅ Abort current operation
   */
  abort() {
    this.updateState({
      status: 'end'
    });
  }

  /**
   * ✅ Send message via email
   */
  message(content: string, subject?: string, audioContext?: { audioUrl?: string, transcription?: string, cartUrl?: string }): Observable<any> {
    const payload: any = { content, subject };
    if (audioContext) {
      Object.assign(payload, audioContext);
    }
    return this.$http.post<any>(this.defaultConfig.API_SERVER + '/v1/assistant/message', payload, {
      headers: this.headers,
      withCredentials: (configCors())
    })
  }

  // FIXME: Add notify() method for UI notifications
  // notify(message: string, variant = 'primary', icon = 'info-circle', duration = 9000) {
  //   // Implementation depends on UI library (Shoelace, Material, etc.)
  //   // For Shoelace:
  //   // const alert = Object.assign(document.createElement('sl-alert'), {
  //   //   variant,
  //   //   closable: true,
  //   //   duration: duration,
  //   //   innerHTML: `<sl-icon name="${icon}" slot="icon"></sl-icon>${message}`
  //   // });
  //   // document.body.append(alert);
  //   // return alert.toast();
  // }
}
