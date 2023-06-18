<br>
<br>
<p align="center"><img src="./icon.svg" width="240"></p>
<br>
<br>

```
> npm i sprut-partition-async-cycles
```

# Sprut-partition-async-cycles

Набор функций для бесконечных и долгих циклов не блокирующих главный поток.

---

<br>

## <span id="contents">Оглавление</span>

- [Использование partitionWhile](#partitionWhile)
- [Использование partitionForEach](#partitionForEach)
- [Тип конфига partitionWhile](#whileConfigType)
- [Тип конфига partitionForEach](#forEachConfigType)

<br>

## <span id="partitionWhile">Использование partitionWhile:</span>

- [К оглавлению](#contents)

<br>

```js
const { stop, pause, contin } = partitionWhile({
  isContinue: i => i <= 1000,
  counter: i => ++i,
  task: i => {
    if (parseInt((i / 10).toFixed(0)) === i / 10) {
      console.log(i);
    }
  }
});

/*
  0
  10
  20
  30
  40
  50
  ...
  1000
*/
```

<br>

## <span id="partitionForEach">Использование partitionForEach:</span>

- [К оглавлению](#contents)

<br>

```js
const arr = [];

for (let i = 1; i <= 1000; i++) {
  arr.push(i);
}

const { stop, pause, contin } = partitionForEach(arr, {
  partSize: 3,
  task: (count, indexes, items) => {
    console.log(`count = ${count}, indexes = (${indexes.join(', ')}), items: `, ...items)
  },
  pauseTime: 1000,
  maxIterTasks: 100
});

/*
  count = 0, indexes = (0, 1, 2), items:  1 2 3
  count = 1, indexes = (3, 4, 5), items:  4 5 6
  count = 2, indexes = (6, 7, 8), items:  7 8 9
  ...
  count = 333, indexes = (999, 1000, 1001), items:  1000 undefined undefined
*/

const { stop, pause, contin } = partitionForEach({ from: 0, to: 10 }, {
  task: (count, indexes, items) => {
    console.log(...items)
  }
});

/*
  0
  1
  2
  ...
  10
*/
```

<br>

## <span id="whileConfigType">Тип конфига partitionWhile:</span>

- [К оглавлению](#contents)

<br>

```js
export type WhileConfig = {
  /** Проверка на возможность продолжать цикл */
  isContinue: (count: number) => boolean;
  /** Обработчик цикла(итерации) */
  task: (count: number) => void;
  /** Максимальное количество времени на блокирующие итерации */
  maxIterTime?: number;
  /** Время паузы между блокирующими итерациями */
  pauseTime?: number;
  /** Максимальное количество блокирующих итераций */
  maxIterTasks?: number;
  /** Номер стартовой итерации */
  startCount?: number;
  /** Старт цикла сразу после создания */
  autoStart?: boolean;
  /** Фукнция вычисления индекса следующей итерации */
  counter?: (count: number) => number;
  /** Обработчик старта цикла для самостоятельного запуска, в том числе асинхронно */
  starter?: (task: () => void) => void;
  /** Обработчик остановки цикла */
  finally?: () => void;
  /** Обрабочтик паузы цикла */
  onpause?: () => void;
};
```

<br>

## <span id="forEachConfigType">Тип конфига partitionForEach:</span>

- [К оглавлению](#contents)

<br>

```js
export type ForEachConfig<Item = any> = Omit<WhileConfig, 'isContinue' | 'counter' | 'startCount' | 'task'> & {
  /** Количество обрабатываемых элементов за итерацию */
  partSize?: number;
  /** Обработчик элементов цикла */
  task: (
    /** Номер итерации */
    count: number,
    /** Индексы элементов */
    indexes: Array<number>,
    /** Значения элементов */
    values: Array<Item | number>
  ) => void;
};
```