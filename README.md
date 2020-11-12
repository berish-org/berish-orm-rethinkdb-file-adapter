# @berish/linq

Library for convenient work with arrays. Allows you to make convenient sampling, and work with arrays as usual. It is a direct inheritor from the array, which allows you to work with linq as with a regular array.

## Installation

```
$ npm install @berish/linq --save
```

or

```
$ yarn add @berish/linq
```

**Supports typescript**

## Interfaces

```typescript
type CallbackType<T, Response> = (item: T, index: number, linq: LINQ<T>) => Response;
type CallbackWithAccumType<T, Accum, Response> = (item: T, index: number, linq: LINQ<T>, accum: Accum) => Response;
type CallbackOnlyItemType<T, Response> = (item: T) => Response;
```

## Initialize (from method)

Syntax: `public static from<T>(items?: T[]): LINQ<T>`

Example:

```typesciprt
import LINQ from '@berish/linq';

const linq = LINQ.from(array);
```

### Test dataset for examples in this article:

```typescript
import LINQ from '@berish/linq';

/* This packages need only for examples in this article */
import * as collection from 'berish-collection';
import * as faker from 'faker';

class TestAType {}
class TestBType {}
/* This packages need only for examples in this article */

function generateCard(index: number = 0) {
  return {
    age: faker.random.number({ min: 0, max: 30 }),
    email: faker.internet.email(),
    id: faker.random.uuid(),
    rating: faker.random.number({ min: 0, max: 100 }),
    types: index % 2 === 0 ? new TestAType() : new TestBType(),
  };
}

function getLinq(count: number = 10) {
  const data = Array(count)
    .fill(null)
    .map((m, i) => generateCard(i));
  return LINQ.from(data);
}
```

## `clone`

> Makes no deep clone for current LINQ array.

Syntax: `public clone(): LINQ<T>`

Example:

```typescript
const linq1 = LINQ.from([1, 2, 3]);
const cloned = linq1.clone();

expect(cloned).toEqual(linq1);
expect(cloned === linq1).toBeFalsy();
```

## `equals`

> Check equals this LINQ and another array by link-pointer

Syntax: `public equals(linq: any[]): boolean`

Example:

```typescript
const linq1 = LINQ.from([1, 2, 3]);
const cloned = linq1.clone();

expect(linq1.equals(cloned)).toBeFalsy();
expect(linq1.equals(linq1)).toBeTruthy();
```

## `equalsValues`

> Check equals this LINQ and another array by values. You can map a sequence of values based on a predicate.

Syntax: `public equalsValues<K>(linq: any[], selectFunc?: CallbackType<T, K>): boolean`

Example:

```typescript
const linq1 = LINQ.from([1, 2, 3]);
const cloned = linq1.clone();

expect(linq1.equalsValues(cloned)).toBeTruthy();
expect(linq1.equalsValues(linq1)).toBeTruthy();

const linq2 = LINQ.from([{ id: 1 }, { id: 2 }, { id: 3 }]);
const linq3 = [{ id: 1 }, { id: 2 }, { id: 3 }];

expect(linq2.equalsValues(linq3)).toBeFalsy();
expect(linq2.equalsValues(linq3, m => m.id)).toBeTruthy();
```

## `where`

> Filters a sequence of values based on a predicate.

Syntax: `public where(whereFunc?: CallbackType<T, boolean>): LINQ<T>`

Example:

```typescript
const linq = getLinq();
expect(linq.where(m => m.age % 2 === 0)).toEqual(linq.filter(m => m.age % 2 === 0));
```

## `whereWithAccum`

> Allows you to narrow the LINQ on a specific condition on the elements of this LINQ (**selectFunc** and **whereSelectedFunc**). It is also possible to accumulate any value (**accumFunc**) for later use in the condition (**whereSelectedFunc**)

Syntax: `public whereWithAccum<K, Accum = LINQ<K>>( selectFunc: CallbackType<T, K>, accumFunc: (selected: LINQ<K>, linq: LINQ<T>) => Accum, whereSelectedFunc: CallbackWithAccumType<K, Accum, boolean>, ): LINQ<T>`

Example:

```typescript
const linq = getLinq();

const where = linq.whereWithAccum(m => m.age, selected => Math.max(...selected), (m, i, l, max) => m >= max);
const max = Math.max(...linq.map(m => m.age));
const maxWhere = linq.where(m => m.age === max);

expect(where).toEqual(maxWhere);
```

## `select`

> Calls a defined **selectFunc** on each element of an LINQ, and returns an LINQ that contains the results. _It's analog for array **map** method_

Syntax: `public select<K>(selectFunc: CallbackType<T, K>): LINQ<K>`

Example:

```typescript
const linq = getLinq();

const selected = linq.select(m => m.email);
const mapped = linq.map(m => m.email);

expect(selected).toEqual(mapped);
```

## `selectMany`

> Projects each element of a sequence to an LINQ<T> and flattens the resulting sequences into one sequence.

Syntax: `public selectMany<K>(selectFunc?: CallbackType<T, K[]>): LINQ<K>`

Example:

```typescript
const linq = LINQ.from([getLinq(), getLinq(), getLinq()]);

const selected1 = linq.selectMany();
expect(selected1).toEqual([...linq[0], ...linq[1], ...linq[2]]);

const selected2 = linq.selectMany(m => m.select(m => m.id));
expect(selected2).toEqual([...linq[0].select(m => m.id), ...linq[1].select(m => m.id), ...linq[2].select(m => m.id)]);
```

## `take`

> Returns a specified number of contiguous elements from the start of a sequence.

Syntax: `public take(count: number): LINQ<T>`

Example:

```typescript
const linq = getLinq(50);

const take = linq.take(20);
expect(take.length).toBe(20);
expect(take).toEqual(linq.slice(0, 20));
```

## `skip`

> Bypasses a specified number of elements in a sequence and then returns the remaining elements.

Syntax: `public skip(count: number): LINQ<T>`

Example:

```typescript
const linq = getLinq(100);

const skip = linq.skip(20);
expect(skip.length).toBe(80);
expect(skip).toEqual(linq.slice(20));
```

## `count`

> Returns the number of elements in a sequence.

Syntax: `public count(whereFunc?: CallbackType<T, boolean>): number`

Example:

```typescript
const linq = getLinq(100);

const count1 = linq.count();
expect(count1).toBe(100);

const count2 = linq.count(m => m.age % 2 === 0);
expect(count2).toBe(linq.where(m => m.age % 2 === 0).count());
```

## `indexWhere`

> Returns the indexes of elements in a sequence by **whereFunc**

Syntax: `public indexWhere(whereFunc?: CallbackType<T, boolean>): LINQ<number>`

Example:

```typescript
const linq = getLinq();

const indexWhere = linq.indexWhere(m => m.age % 2 === 0);
expect(indexWhere).toEqual(linq.select((m, i) => (m.age % 2 === 0 ? i : null)).notNull());
```

## `elementsAtIndex`

> Returns elements in LINQ by indexes of this elements

Syntax: `public elementsAtIndex(indexes: number[]): LINQ<T>`

Example:

```typescript
const linq = getLinq();

const elementsAtIndex = linq.elementsAtIndex([0, 5, 8, 12]);
expect(elementsAtIndex.length).toBe(4);
expect(elementsAtIndex).toEqual([linq[0], linq[5], linq[8], linq[12]]);
```

## `notNull`

> Return only not null elements. Can be using with the **selectFunc** to filtered elements from a sequence by mapped values.

Syntax: `public notNull<K>(selectFunc?: CallbackType<T, K>): LINQ<T>`

Example:

```typescript
const linq = getLinq(100);

const notNull = linq.select((m, i) => (i % 2 === 0 ? m : null)).notNull();
expect(notNull.length).toBe(50);
expect(notNull).toEqual(linq.where((m, i) => i % 2 === 0));
```

## `notEmpty`

> Return only not empty elements (!!value). Can be using with the **selectFunc** to filtered elements from a sequence by mapped values.

Syntax: `public notEmpty<K>(selectFunc?: CallbackType<T, K>): LINQ<T>`

Example:

```typescript
const linq = getLinq(100);

const notEmpty = linq.select((m, i) => (i % 2 === 0 ? m : '')).notEmpty();
expect(notEmpty.length).toBe(50);
expect(notEmpty).toEqual(linq.where((m, i) => i % 2 === 0));
```

## `first`

> Returns the first element in a sequence that satisfies a specified condition.

Syntax: `public first(whereFunc?: CallbackType<T, boolean>): T`

Example:

```typescript
const linq = getLinq();

const first1 = linq.first();
expect(first1).toBe(linq[0]);

const first2 = linq.first(m => m.age % 2 === 0);
expect(first2).toBe(linq.where(m => m.age % 2 === 0).first());
```

## `last`

> Returns the last element in a sequence that satisfies a specified condition.

Syntax: `public last(whereFunc?: CallbackType<T, boolean>): T`

Example:

```typescript
const linq = getLinq();

const last1 = linq.last();
expect(last1).toBe(linq[linq.length - 1]);

const last2 = linq.last(m => m.age % 2 === 0);
expect(last2).toBe(linq.where(m => m.age % 2 === 0).last());
```

## `distinct`

> Returns distinct elements from a sequence. Can be using with the **selectFunc** to filtered elements from a sequence by mapped values.

Syntax: `public distinct<K>(selectFunc?: CallbackType<T, K>): LINQ<T>`

Example:

```typescript
const linq = getLinq(100);

const distinct1 = linq.select(m => m.age).distinct();
expect(distinct1.length).toBe(new Set(linq.select(m => m.age)).size);

const distinct2 = linq.distinct(m => m.age);
const addedAges: number[] = [];
const testDistinct2 = linq.where(m => {
  if (addedAges.indexOf(m.age) === -1) {
    addedAges.push(m.age);
    return true;
  }
  return false;
});
expect(distinct2).toEqual(testDistinct2);
```

## `max`

> Returns the elements with maximum value in a sequence of values.

Syntax: `public max(numberFunc?: CallbackType<T, number>): LINQ<T>`

Example:

```typescript
const linq = getLinq();

const max = linq.max(m => m.age);
const maxValue = Math.max(...linq.select(m => m.age));
expect(max).toEqual(linq.where(m => m.age === maxValue));
```

## `maxValue`

> Returns the maximum value in a sequence of values.

Syntax: `public maxValue(numberFunc?: CallbackType<T, number>): number`
Example:

```typescript
const linq = getLinq();

const maxValue = linq.maxValue(m => m.age);
expect(maxValue).toBe(Math.max(...linq.select(m => m.age)));
```

## `min`

> Returns the elements with minimum value in a sequence of values.

Syntax: `public min(numberFunc?: CallbackType<T, number>): LINQ<T>`

Example:

```typescript
const linq = getLinq();

const min = linq.min(m => m.age);
const minValue = Math.min(...linq.select(m => m.age));
expect(min).toEqual(linq.where(m => m.age === minValue));
```

## `minValue`

> Returns the minimum value in a sequence of values.

Syntax: `public minValue(numberFunc?: CallbackType<T, number>): number`

Example:

```typescript
const linq = getLinq();

const minValue = linq.minValue(m => m.age);
expect(minValue).toBe(Math.min(...linq.select(m => m.age)));
```

## `ofType`

> Filters the elements of a LINQ based on a specified types. Can be using with the **selectFunc** to filtered elements from a sequence by mapped values.

Syntax: `public ofType<Type extends new (...args) => any, K>( type: OfTypeStringValues | OfTypeStringValues[] | Type | Type[] | (OfTypeStringValues | Type)[], selectFunc?: CallbackType<T, K>, ): LINQ<T>`

`type OfTypeStringValues = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';`

Example:

```typescript
const linq = getLinq();

const ofType1 = linq.ofType(Object);
expect(ofType1).toEqual(linq);

const ofType2 = linq.ofType(TestAType, m => m.types);
expect(ofType2).toEqual(linq.where(m => m.types instanceof TestAType));

const ofType3 = linq.ofType([TestAType, TestBType], m => m.types);
expect(ofType3).toEqual(linq);

const ofType4 = linq.ofType('number', m => m.age);
expect(ofType4.count()).toBe(linq.count());

const ofType5 = linq.ofType('string', m => m.age);
expect(ofType5.count()).toBe(0);
```

## `orderByAscending`

> Sorts the elements of a sequence in ascending order according to a value. Can be using with the **sortSelectFunc** to order elements from a sequence by mapped values.

Syntax: `public orderByAscending<K>(sortSelectFunc?: CallbackOnlyItemType<T, K>): LINQ<T>`

Example:

```typescript
const linq1 = LINQ.from([4, 2, 1, 5, 8, -1]);
const orderByAscending1 = linq1.orderByAscending();
expect(orderByAscending1).toEqual([-1, 1, 2, 4, 5, 8]);

const linq2 = getLinq();

const orderByAscending2 = linq2.orderByAscending(m => m.age);
const bySort2 = linq2.sort((a, b) => {
  if (a.age > b.age) return 1;
  if (a.age < b.age) return -1;
  return 0;
});
expect(orderByAscending2).toEqual(bySort2);
```

## `orderByDescending`

> Sorts the elements of a sequence in descending order according to a value. Can be using with the **sortSelectFunc** to order elements from a sequence by mapped values.

Syntax: `public orderByDescending<K>(sortSelectFunc?: CallbackOnlyItemType<T, K>): LINQ<T>`

Example:

```typescript
const linq1 = LINQ.from([4, 2, 1, 5, 8, -1]);
const orderByDescending1 = linq1.orderByDescending();
expect(orderByDescending1).toEqual([8, 5, 4, 2, 1, -1]);

const linq2 = getLinq();

const orderByDescending2 = linq2.orderByDescending(m => m.age);
const bySort2 = linq2.sort((a, b) => {
  if (a.age < b.age) return 1;
  if (a.age > b.age) return -1;
  return 0;
});
expect(orderByDescending2).toEqual(bySort2);
```

## `sum`

> Computes the sum of a sequence of numeric values. Can be using with the **selectFunc** to sum elements from a sequence by mapped values.

Syntax: `public sum(selectFunc?: CallbackType<T, number>): number`

Example:

```typescript
const linq1 = LINQ.from([4, 2, 1, 5, 8, -1]);
const sum1 = linq1.sum();
expect(sum1).toBe(linq1.reduce((a, b) => a + b, 0));

const linq2 = getLinq();
const sum2 = linq2.sum(m => m.age);
expect(sum2).toBe(linq2.select(m => m.age).reduce((a, b) => a + b, 0));
```

## `except`

> Produces the set difference of two sequences. Can be using with the **selectFunc** to except elements from a sequence by mapped values.

Syntax: `public except<K>(items: T | T[] | LINQ<T>, selectFunc?: CallbackType<T, K>): LINQ<T>`

Example:

```typescript
const linq1 = LINQ.from([4, 2, 1, 5, 8, -1]);
const linq2 = LINQ.from([4, -100, 7, 5, 8, -1]);
const expect1 = linq1.except(linq2);
expect(expect1).toEqual([2, 1]);

const linq3 = getLinq(100);
const linq4 = getLinq(100);
const expect2 = linq3.except(linq4);
expect(expect2).toEqual(linq3);

const expect3 = linq3.except(linq4, m => m.age);
expect(expect3).toEqual(linq3.where(m => !linq4.contains(m, k => k.age)));
```

## `groupBy`

> Groups the elements of a sequence according to a specified key selector function and creates a result value from each group and its key. The elements of each group are projected by using a specified function **selectFunc**.

Syntax: `public groupBy<K>(selectFunc: CallbackType<T, K>): collection.Dictionary<K, LINQ<T>>`

Example:

```typescript
const linq = getLinq();
const dict1 = linq.groupBy(m => m.age);

const ages = linq.select(m => m.age).distinct();
const dict2 = collection.Dictionary.fromArray(
  ages.select(m => new collection.KeyValuePair(m, linq.where(k => k.age === m))),
);

expect(dict1).toEqual(dict2);
```

## `contains`

> Determines whether a sequence contains a specified element. Can be using with the **selectFunc** to check for contain elements from a sequence by mapped values.

Syntax: `public contains<K>(value: T, selectFunc?: CallbackOnlyItemType<T, K>): boolean`

Example:

```typescript
const linq1 = LINQ.from(['hey', 'bro']);
expect(linq1.contains('hey')).toBeTruthy();
expect(linq1.contains('hello')).toBeFalsy();

const linq2 = getLinq(100);
expect(linq2.contains(linq2[0])).toBeTruthy();

let card = generateCard();
while (!linq2.first(m => m.age === card.age)) {
  card = generateCard();
}
expect(linq2.contains(card)).toBeFalsy();
expect(linq2.contains(card, m => m.age)).toBeTruthy();
```

## `containsAll`

> Determines whether a sequence contains all of the specified elements at once. Can be using with the **selectFunc** to check for contain elements from a sequence by mapped values.

Syntax: `public containsAll<K>(value: T[] | LINQ<T>, selectFunc?: CallbackType<T, K>): boolean`

Example:

```typescript
const linq1 = LINQ.from(['hey', 'bro']);
expect(linq1.containsAll(['hey', 'bro'])).toBeTruthy();
expect(linq1.containsAll(['hey', 'hello'])).toBeFalsy();

const linq2 = getLinq(100);
expect(linq2.containsAll([linq2.first(), linq2.last()])).toBeTruthy();

let card1 = generateCard();
while (!linq2.first(m => m.age === card1.age)) {
  card1 = generateCard();
}

let card2 = generateCard();
while (!linq2.first(m => m.age === card2.age)) {
  card2 = generateCard();
}
expect(linq2.containsAll([card1, card2])).toBeFalsy();
expect(linq2.containsAll([card1, card2], m => m.age)).toBeTruthy();
```

## `average`

> Computes the average of a sequence of numeric values. Can be using with the **selectFunc** to average elements from a sequence by mapped values. Can be using with the **whereFunc** to filter elements from a sequence by specified condition.

Syntax: `public average(selectFunc?: CallbackType<T, number>, whereFunc?: CallbackType<T, boolean>): number`

Example:

```typescript
const linq1 = LINQ.from([1, 2, 5, 10]);
expect(linq1.average()).toBe(4.5);
expect(linq1.average(null, m => m % 2 === 0)).toBe(6);

const linq2 = getLinq();
expect(linq2.average(m => m.age)).toBe(linq2.select(m => m.age).average());
expect(linq2.average(m => m.rating, m => m.age > 18)).toBe(
  linq2
    .where(m => m.age > 18)
    .select(m => m.rating)
    .average(),
);
```

## `intersect`

> Produces the set intersection of two sequences. Can be using with the **selectFunc** to intersect elements from a sequence by mapped values.

Syntax: `public intersect<K>(items: T | T[] | LINQ<T>, selectFunc?: CallbackType<T, K>): LINQ<T>`

Example:

```typescript
const linq1 = LINQ.from([4, 2, 1, 5, 8, -1]);
const linq2 = LINQ.from([4, -100, 7, 5, 8, -1]);
const intersect1 = linq1.intersect(linq2);
expect(intersect1).toEqual([4, 5, 8, -1]);

const linq3 = getLinq(100);
const linq4 = getLinq(100);
const intersect2 = linq3.intersect(linq4);
expect(intersect2).toEqual([]);

const intersect3 = linq3.intersect(linq4, m => m.age);
expect(intersect3).toEqual(linq3.where(m => linq4.contains(m, k => k.age)));
```

## `reverse`

> Reverses the elements in an Array.

Syntax: `public reverse(): LINQ<T>`

Example:

```typescript
const linq = LINQ.from([1, 4, 2, 3, 3]);
expect(linq.reverse()).toEqual([3, 3, 2, 4, 1]);
```

## `concat`

> Combines two or more arrays. Combines two or more arrays.

Syntax: `public concat(...items: (T | ConcatArray<T> | LINQ<T>)[]): LINQ<T>`

Example:

```typescript
const linq1 = LINQ.from([1, 4, 3]);
const linq2 = LINQ.from([2, 3, 3]);
expect(linq1.concat(linq2)).toEqual([1, 4, 3, 2, 3, 3]);
```

## `slice`

> Returns a section of an array.

Syntax: `public slice(start?: number, end?: number): LINQ<T>`

Example:

```typescript
const linq = LINQ.from([1, 4, 2, 3, 3]);
expect(linq.slice(2, 4)).toEqual([2, 3]);
```

## `splice`

> Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements. Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.

Syntax: `public splice(start: number, deleteCount: number, ...items: T[]): LINQ<T>`

Example:

```typescript
const linq = getLinq();
const cloned = linq.clone();
cloned.splice(0, 3);
expect(cloned).toEqual(linq.skip(3));
```

## `map`

> Calls a defined callback function on each element of an array, and returns an array that contains the results.

Syntax: `public map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): LINQ<U>`

Example:

```typescript
const linq = LINQ.from([{ id: 1 }, { id: 2 }]);
expect(linq.map(m => m.id)).toEqual([1, 2]);
```

## `filter`

> Returns the elements of an array that meet the condition specified in a callback function. Returns the elements of an array that meet the condition specified in a callback function.

Syntax: `public filter(callbackfn: (value: T, index: number, array: T[]) => unknown, thisArg?: any): LINQ<T>`

Example:

```typescript
const linq = LINQ.from([{ id: 1 }, { id: 2 }]);
expect(linq.filter(m => m.id > 1)).toEqual([{ id: 2 }]);
```

<!--stackedit_data:
eyJoaXN0b3J5IjpbLTE4ODU1NjY3NjgsMTkzNTg3MjUzNl19
-->
