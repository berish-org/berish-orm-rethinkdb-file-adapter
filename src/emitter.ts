import guid from 'berish-guid';

export type SubscribeType<Data> = (data: Data) => void | Promise<void>;
export type EventNameType = string | number;
export type EventMapBaseType = {
  [eventName: string]: any;
  [eventName: number]: any;
};

export interface IEventObject<Data> {
  eventName: EventNameType;
  eventHash: string;
  callback: SubscribeType<Data>;
}

export class EventEmitter<EventMap extends EventMapBaseType> {
  protected _events: IEventObject<any>[] = [];

  public on<EventName extends keyof EventMap>(
    eventName: EventName,
    callback: SubscribeType<EventMap[EventName]>,
  ): string;
  public on(eventName: EventNameType, callback: SubscribeType<unknown>): string;
  public on(eventName: EventNameType, callback: SubscribeType<unknown>): string {
    const eventHash = guid.guid();
    this._events.push({ eventName, eventHash, callback });
    return eventHash;
  }

  public offAll(): void {
    this._events = [];
  }

  public off(eventHash: string): void {
    const currentEvent = this._events.filter(m => m.eventHash === eventHash)[0];
    const currentEventName = currentEvent && currentEvent.eventName;
    this._events = this._events.filter(m => m.eventHash !== eventHash);
    this.emitSync(`off_${eventHash}`);
    if (currentEventName && this._events.filter(m => m.eventName === currentEventName).length <= 0) {
      this.emitSync(`off_event_${currentEventName}`);
    }
  }

  public offEvent(eventName: keyof EventMap): void;
  public offEvent(eventName: EventNameType): void;
  public offEvent(eventName: EventNameType): void {
    this._events = this._events.filter(m => m.eventName !== eventName);
    this.emitSync(`off_event_${eventName}`);
  }

  public triggerOff(eventHash: string, callback: () => void): string {
    return this.on(`off_${eventHash}`, callback);
  }

  public triggerOffEvent(eventName: keyof EventMap, callback: () => void): string;
  public triggerOffEvent(eventName: EventNameType, callback: () => void): string;
  public triggerOffEvent(eventName: EventNameType, callback: () => void): string {
    return this.on(`off_event_${eventName}`, callback);
  }

  public emitSync<EventName extends keyof EventMap>(eventName: EventName, data?: EventMap[EventName]): void;
  public emitSync(eventName: EventNameType, data?: unknown): void;
  public emitSync(eventName: EventNameType, data?: unknown): void {
    const events = this._events.filter(m => m.eventName === eventName);
    events.map(event => event.callback(data));
  }

  public emitAsync<EventName extends keyof EventMap>(eventName: EventName, data?: EventMap[EventName]): Promise<void>;
  public emitAsync(eventName: EventNameType, data?: unknown): Promise<void>;
  public emitAsync(eventName: EventNameType, data?: unknown): Promise<void> {
    const events = this._events.filter(m => m.eventName === eventName);
    return Promise.all(events.map(event => event.callback(data))).then();
  }

  public createNewEmitter(
    filter?: (eventObjects: IEventObject<any>[]) => IEventObject<any> | IEventObject<any>[],
  ): this {
    const cls: new () => this = this.constructor as any;
    const emitter = new cls();
    const newEvents = filter ? filter(this._events) : [...this._events];
    emitter._events = Array.isArray(newEvents) ? newEvents : [newEvents];
    return emitter;
  }

  public has(eventHash: string): boolean {
    return !!this._events.filter(m => m.eventHash === eventHash)[0];
  }

  public hasEvent(eventName: keyof EventMap): boolean;
  public hasEvent(eventName: EventNameType): boolean;
  public hasEvent(eventName: EventNameType): boolean {
    return !!this._events.filter(m => m.eventName === eventName)[0];
  }

  public hasCallback(callback: SubscribeType<any>): boolean {
    return !!this._events.filter(m => m.callback === callback)[0];
  }

  /**
   * Кешированный вызов метода. Если событие уже зарегистрировано, начинает прослушивать событие без дополнительных вызовов.
   * Если события нет, то получает ответ и отправляет всем, кто прослушивает это же событие
   * @param eventName Ключ, по которому определяется уникальность кешированных вызовов
   * @param callback Настоящий вызов метода. Вызвается единожды для кешированного вызова
   */
  public cacheCall<Result>(eventName: EventNameType, callback: () => Result | Promise<Result>): Promise<Result> {
    return new Promise((resolve, reject) => {
      const responseCall = (type: 'resolve' | 'reject', data: Result) => {
        if (type === 'resolve') return resolve(data);
        return reject(data);
      };
      const hasEvent = this.hasEvent(eventName);
      const eventHash = this.on(eventName, ({ data, type }) => {
        responseCall(type, data);
        if (this.has(eventHash)) this.off(eventHash);
      });
      if (!hasEvent) {
        Promise.resolve()
          .then(() => callback())
          .then(result => {
            return this.emitAsync(eventName, { data: result, type: 'resolve' });
          })
          .catch(err => {
            return this.emitAsync(eventName, { data: err, type: 'resolve' });
          });
      }
    });
  }

  /**
   * Кешированный подписка. Если подписка уже зарегистрирована, начинает прослушивать без дополнительной подписки.
   * Если подписки нет, то вызывает метод главной подписки и после вызывает метод кешированной подписки
   * @param eventName Ключ, по которому определяется уникальность кешированных вызовов
   * @param callCallback Настоящий вызов метода подписки. Вызвается единожды для кешированной подписки
   * @param cacheCallback Метод кешированной подписки
   */
  public cacheSubscribe<Result>(
    eventName: EventNameType,
    callCallback: (callback: (data: Result) => void) => (() => void) | Promise<() => void>,
    cacheCallback: (data: Result) => void,
  ) {
    const hasEvent = this.hasEvent(eventName);
    const eventHash = this.on(eventName, cacheCallback);
    if (!hasEvent) {
      let unlistenerPromise = Promise.resolve().then(() =>
        callCallback(data => {
          this.emitAsync(eventName, data);
        }),
      );
      const triggerOffEventHash = this.triggerOffEvent(eventName, async () => {
        let unlistener = unlistenerPromise && (await unlistenerPromise);
        if (unlistener) {
          unlistener();
          unlistener = null;
          unlistenerPromise = null;
        }
        this.off(triggerOffEventHash);
      });
    }
    return eventHash;
  }
}
