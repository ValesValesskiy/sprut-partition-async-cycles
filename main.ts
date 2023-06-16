export interface Range {
    readonly from: number;
    readonly to: number;
};

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

export function partitionWhile(config: WhileConfig): {
    /**
     * Останавливает и завершает цикл
     *
     * @return {boolean} Успешность остановки цикла
     */
    stop: () => boolean,
    /**
     * Ставит цикл на паузу
     *
     * @return {boolean} Успешность паузы
     */
    pause: () => boolean,
    /**
     * Продолжает выполнение цикла
     *
     * @return {boolean} Успешность запуска цикла
     */
    contin: () => boolean
} {
    config = {...config};

    let isStoped = false;
    let globalBreak = config.autoStart === false ? true : false;
    let lastConfig = config;

    if (config.starter) {
        (config.starter instanceof Function ? config.starter : setTimeout)(() => cycle(config));
    } else {
        cycle(config);
    }

    return {
        stop: () => {
            globalBreak = true;
            isStoped = true;

            if (config.finally instanceof Function) {
                config.finally();
            }

            return true;
        },
        pause: () => {
            if (!isStoped) {
                globalBreak = true;

                if (config.onpause instanceof Function) {
                    config.onpause();
                }

                return true;
            }

            return false;
        },
        contin: () => {
            if (!isStoped && globalBreak) {
                globalBreak = false;

                if (config.starter) {
                    (config.starter instanceof Function ? config.starter : setTimeout)(() => cycle(lastConfig));
                } else {
                    cycle(lastConfig);
                }

                return true;
            }

            return false;
        }
    };

    function cycle(config: WhileConfig) {
        lastConfig = config;
        const {
            isContinue,
            counter = i => i++,
            startCount = 0,
            task,
            maxIterTime = 10,
            pauseTime = 10,
            maxIterTasks
        } = config;
        let isBreak = false;
        let timeout = new Date().getTime();
        let count = startCount;
        let iterationCount = 0;

        while(!isBreak && !globalBreak) {
            isBreak = !isContinue(count);

            if (isBreak) {
                isStoped = true;

                if (config.finally instanceof Function) {
                    config.finally();
                }

                break;
            }

            if (new Date().getTime() - timeout > maxIterTime || (maxIterTasks ? maxIterTasks === iterationCount : false)) {
                setTimeout(() => cycle({ ...config, startCount: count }), pauseTime);
                if (config.onpause instanceof Function) {
                    config.onpause();
                }
                break;
            }

            task(count);
            count = counter(count);
            iterationCount++;
        }

        lastConfig.startCount = count;
    }
};

export function partitionForEach<Item = any>(iterable: Range | Array<Item>, config: ForEachConfig<Item>): ReturnType<typeof partitionWhile> {
    const partSize = config.partSize || 1;
    let from, to;
    const task = config.task;
    let isValuable = false;
    let count = 0;

    if ('from' in iterable && 'to' in iterable) {
        from = iterable.from;
        to = iterable.to;
    } else if (typeof iterable === 'number') {
        from = 0;
        to = iterable - 1;
    } else if (iterable instanceof Array) {
        from = 0;
        to = iterable.length - 1;
        isValuable = true;
    }

    return partitionWhile({
        ...config,
        task: (i) => {
            const handle = [];
            const indexes = [];

            for(let n = 0; n < partSize; n++) {
                handle.push(isValuable ? iterable[i + n] : i + n);
                indexes.push(i + n);
            }

            task(count, indexes, handle);
            count++;
        },
        counter: (i) => i + partSize,
        isContinue: (i) => i <= to,
        startCount: from
    });
};