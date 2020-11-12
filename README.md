# @berish/emitter

The library allows you to conveniently work with events. Supports standard methods of working with events, also has additional functionality for working with cached requests

## Installation

```
$ npm install @berish/emitter --save
```

or

```
$ yarn add @berish/emitter
```

**Supports typescript**

## Interfaces

```typescript
type SubscribeType<Data> = (data: Data) => void | Promise<void>;
type EventNameType = string | number;
type EventMapBaseType = {
  [eventName: string]: any;
  [eventName: number]: any;
};

interface IEventObject<Data> {
  eventName: EventNameType;
  eventHash: string;
  callback: SubscribeType<Data>;
}
```

## Initialize

Syntax: `class EventEmitter<EventMap extends EventMapBaseType>`

Example:

```typesciprt
import EventEmitter from '@berish/emitter';

const emitter = new EventEmitter();
```
