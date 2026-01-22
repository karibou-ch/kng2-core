import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
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
    return this.chatWithPrompt(prompt, options);
  }

  /**
   * ✅ Chat API avec signature originale (to-migrate-here/kng-assistant-ai.service.ts)
   * Permet la migration progressive vers la nouvelle API
   */
  chatWithPrompt(prompt: string, options?: { runAgent?: string, ragname?: string, thinking?: boolean, hub?: string }): Observable<any> {
    const { runAgent, ragname, thinking, hub } = options || {};
    prompt = (prompt || '').trim();

    // Validation comme dans l'original
    const isShort = ['continue', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'c', 'help', 'ci', 'cc', 'cm', 'cs', 'edgar', 'help'].indexOf(prompt) > -1;
    if (!isShort && (prompt.length < 3 || typeof prompt !== 'string')) {
      return of('');
    }

    // ✅ Convertir vers le format params de chat()
    const params: any = {
      q: prompt,
      agent: runAgent,
      hub: hub,
      thinking: thinking
    };

    // FIXME: ragname n'est pas encore supporté par le backend karibou
    // if (ragname) {
    //   params.ragname = ragname;
    // }

    return this.chat(params);
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

        // Update discussion$
        if (res.messages) {
          this.discussionSubject.next(res);

          // ✅ IMPORTANT: Mettre à jour state$ SANS status pour le réinitialiser
          // Ceci arrête la boucle: state$.status devient undefined, donc !== 'end'
          const responseAgent = res.agent;
          const finalAgent = responseAgent || opts?.agent || this.state.agent;
          this.stateSubject.next({
            usage: res.usage || this.defaultUsage,
            agent: finalAgent,
            // NOTE: Ne PAS inclure status ici! Le laisser undefined arrête la boucle.
            status: 'init', // Réinitialiser à 'init' après history
            content: undefined,
            steps: undefined
          });
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
   * Endpoint: POST /v1/assistant/history/:agent/:discussion/:id
   */
  historyDel(messageId: string, agent?: string): Observable<any> {
    if (!messageId) {
      return of(this.discussionSubject.value);
    }

    const agentParam = agent || 'current';
    const discussion = this.discussionSubject.value?.id || 'none';
    return this.$http.post(this.defaultConfig.API_SERVER + `/v1/assistant/history/${agentParam}/${discussion}/${messageId}`, {}, {
      headers: this.headers,
      withCredentials: (configCors())
    }).pipe(
      tap((res: any) => {
        this.discussionSubject.next(res);
      }),
      catchError((err: HttpErrorResponse) => {
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
   * IMPORTANT: Doit émettre via discussionSubject.next() pour notifier les subscribers
   */
  private updateTemporaryAssistantMessage(content: string, steps?: AssistantStep[]) {
    const currentDiscussion = this.discussionSubject.value;
    const messages = [...currentDiscussion.messages]; // Créer une copie pour immutabilité

    const assistantMsgIndex = messages.findIndex(msg =>
      msg.role === 'assistant' && msg.id?.startsWith('temp-assistant-')
    );

    if (assistantMsgIndex !== -1) {
      // Créer un nouveau message avec le contenu mis à jour (immutabilité)
      messages[assistantMsgIndex] = {
        ...messages[assistantMsgIndex],
        content: content,
        ...(steps && { steps })
      };

      // ✅ Émettre la discussion mise à jour pour notifier l'UI
      this.discussionSubject.next({
        ...currentDiscussion,
        messages
      });
    }
  }

  /**
   * ✅ Chat API - Wrapper principal pour envoyer une question
   * Migré depuis to-migrate-here/kng-assistant-ai.service.ts
   *
   * @param params - { q: string, agent?: string, hub?: string, thinking?: boolean, ragname?: string }
   */
  chat(params: { q: string, agent?: string, hub?: string, thinking?: boolean, ragname?: string }): Observable<string> {
    const prompt = (params.q || '').trim();
    const agent = params.agent || 'current';

    // Validation des prompts courts
    const isShort = ['continue','1','2','3','4','5','6','7','8','9','c','help','ci','cc','cm','cs','edgar','help'].indexOf(prompt) > -1;
    if (!isShort && (prompt.length < 3 || typeof prompt !== 'string')) {
      return of('');
    }

    // Construire le body pour le stream
    const requestBody: any = {
      query: prompt,
      agent: agent,
      thinking: params.thinking || false,
      hub: params.hub
    };
    if (params.ragname) {
      requestBody.ragname = params.ragname;
    }

    // URL avec agent parameter
    const streamUrl = this.defaultConfig.API_SERVER + `/v1/assistant/thread`;

    return this.stream(streamUrl, requestBody);
  }

  /**
   * ✅ Stream API - Gère le streaming SSE avec XHR
   * Note: Angular HttpClient ne supporte pas le streaming de texte progressif,
   * on utilise XHR pour avoir accès à responseText pendant le téléchargement.
   */
  private stream(url: string, body: any): Observable<string> {
    return new Observable<string>(observer$ => {
      // ✅ Create temporary user message and update state
      const agentParam = body.agent || 'current';
      this.addTemporaryUserMessage(body.query, agentParam);

      this.updateState({
        status: 'prompt',
        content: body.query,
        agent: body.agent || this.stateSubject.value.agent,
        thinking: body.thinking || false
      });

      const xhr = new XMLHttpRequest();
      let lastIndex = 0;
      let stepsAccum: AssistantStep[] = [];
      let contentAccum = '';
      let messageCreated = false;

      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.setRequestHeader('ngsw-bypass', 'true');
      xhr.setRequestHeader('k-dbg', AnalyticsService.FBP);

      if (configCors()) {
        xhr.withCredentials = true;
      }

      // ✅ Streaming progressif via onprogress
      xhr.onprogress = () => {
        const index = xhr.responseText.length;
        if (lastIndex === index) {
          return;
        }

        // Create temp assistant message on first chunk
        if (!messageCreated) {
          this.createTemporaryAssistantMessage();
          messageCreated = true;
        }

        const textChunk = xhr.responseText.substring(lastIndex);
        lastIndex = index;

        // ✅ Parse steps incrementally
        const chunkSteps = parseSteps(textChunk);
        if (chunkSteps.length) {
          stepsAccum = [...stepsAccum, ...chunkSteps];
          this.updateState({
            status: 'running',
            steps: stepsAccum,
            agent: body.agent
          });
        }

        // ✅ Update content and temp message
        const cleanedChunk = this.cleanText(textChunk);
        if (cleanedChunk && cleanedChunk.trim()) {
          contentAccum += cleanedChunk;
          this.updateState({
            status: 'running',
            content: contentAccum,
            agent: body.agent
          });
          this.updateTemporaryAssistantMessage(contentAccum, stepsAccum);
        }

        observer$.next(cleanedChunk);
      };

      xhr.onload = () => {
        // ✅ Stream completed
        this.updateState({
          status: 'end',
          agent: body.agent || this.stateSubject.value.agent,
          content: undefined,
          steps: undefined
        });
        observer$.complete();
      };

      xhr.onerror = () => {
        this.updateState({
          status: 'error',
          error: 'network',
          agent: body.agent || this.stateSubject.value.agent,
          content: undefined,
          steps: undefined
        });
        observer$.error(new TypeError('Network request error'));
      };

      xhr.ontimeout = () => {
        this.updateState({
          status: 'error',
          error: 'timeout',
          agent: body.agent || this.stateSubject.value.agent,
          content: undefined,
          steps: undefined
        });
        observer$.error(new TypeError('Network request timed out'));
      };

      // ✅ Send request with JSON body
      xhr.send(JSON.stringify(body));

      // ✅ Cleanup function
      return () => {
        xhr.abort();
      };
    });
  }

  /**
   * ✅ Whisper transcription API - Async version
   * Migré depuis to-migrate-here/kng-assistant-ai.service.ts
   *
   * @param state - { blob?: Blob, chunk?: Blob, type?: string, silent?: boolean, previousText?: string }
   * @returns Promise<string> - La transcription
   */
  async whisper(state: { blob?: Blob, chunk?: Blob, type?: string, silent?: boolean, previousText?: string }): Promise<string> {
    if ((!state?.blob && !state?.chunk) || state.silent) {
      return '';
    }

    const formData = new FormData();
    formData.append('audio', state.blob || state.chunk);
    formData.append('type', state.type || 'prompt');
    formData.append('file', 'audio.wav');

    // ✅ Ajouter la transcription précédente comme contexte pour Whisper
    if (state.previousText) {
      formData.append('previousText', state.previousText);
    }

    try {
      const resp = await this.$http.post<{ transcription: string }>(
        this.defaultConfig.API_SERVER + '/v1/assistant/transcribe',
        formData,
        { withCredentials: configCors() }
      ).toPromise();

      const transcription = resp?.transcription || '';
      this.transcriptionsSubject.next(transcription);
      return transcription;

    } catch (error: any) {
      console.error('❌ Erreur transcription:', error);

      // ✅ Extraire le message d'erreur du serveur
      let errorMessage = 'Erreur lors de la transcription audio';
      let errorIcon = 'exclamation-triangle';

      if (error.status === 413) {
        // Erreur 413 - Fichier trop volumineux
        errorMessage = error.error?.message || 'Le fichier audio est trop volumineux';
        const limit = error.error?.limit || '10MB';
        errorMessage += ` (limite: ${limit})`;
        errorIcon = 'exclamation-octagon';
      } else if (error.status === 400) {
        // Erreur 400 - Format non supporté ou autre erreur
        errorMessage = error.error?.error || error.error?.message || 'Format audio non supporté';
      } else if (error.status === 0) {
        // Erreur réseau
        errorMessage = 'Erreur de connexion au serveur';
      } else {
        // Autres erreurs
        errorMessage = error.error?.message || error.message || errorMessage;
      }

      // ✅ Afficher la notification à l'utilisateur
      this.notify(errorMessage, 'danger', errorIcon, 10000);

      // Propager l'erreur pour que les composants puissent réagir
      throw new Error(errorMessage);
    }
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

  /**
   * ✅ Notify method - stub pour compatibilité avec l'original
   * FIXME: Implémenter avec Web Awesome alerts quand disponible
   */
  notify(message: string, variant = 'primary', icon = 'info-circle', duration = 9000) {
    // Pour l'instant, juste log en console
    const prefix = variant === 'danger' ? '❌' : variant === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [AssistantService] ${message}`);

    // FIXME: Implémenter avec Web Awesome ou autre UI library
    // Exemple pour Web Awesome:
    // const alert = Object.assign(document.createElement('wa-alert'), {
    //   variant,
    //   closable: true,
    //   duration: duration,
    //   innerHTML: `<wa-icon name="${icon}" slot="icon"></wa-icon>${message}`
    // });
    // document.body.append(alert);
    // return alert.toast();
  }
}
