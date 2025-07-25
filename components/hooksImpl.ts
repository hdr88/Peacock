/*
 *     The Peacock Project - a HITMAN server replacement.
 *     Copyright (C) 2021-2025 The Peacock Project Team
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU Affero General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * A HookMap is a helper class for a Map with Hooks.
 *
 * @example
 * const myHookMap = new HookMap(key => new SyncHook())
 *
 * @example
 * hookMap.for("some-key").tap("MyPlugin", (arg) => { })
 *
 * @example
 * const hook = hookMap.for("some-key")
 * hook.call("some value", 123456)
 */
export class HookMap<Hook> {
    private readonly _map: Map<string, Hook>

    public constructor(private readonly _createFunc: (key: string) => Hook) {
        this._map = new Map()
    }

    /**
     * Get a hook for the given key.
     *
     * @param key The hook to get.
     * @returns The hook.
     */
    public for(key: string): Hook {
        if (this._map.has(key)) {
            return this._map.get(key)!
        }

        const hook = this._createFunc(key)
        this._map.set(key, hook)
        return hook
    }
}

/**
 * The options for a hook. Will either be just the name (as a string), or an object containing the additional options.
 */
export type TapOptions = string | { name: string; context: boolean }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsArray<T> = T extends any[] ? T : [T]

/**
 * An internal interface containing the properties held by a single taps' container object.
 */
interface Tap<T, R> {
    name: string
    func: (...args: AsArray<T>) => R
    enableContext: boolean
}

/**
 * The base for a hook.
 *
 * @see SyncHook
 * @see SyncBailHook
 * @see AsyncSeriesHook
 */
export abstract class BaseImpl<Params, Return = void> {
    protected _taps: Tap<Params, Return>[] = []

    /**
     * Tap the hook.
     *
     * @param nameOrOptions A string containing the tap's name, or an object containing the tap's details.
     * @param consumer The function that will be called when the hook is.
     * @see TapOptions
     */
    public tap(
        nameOrOptions: TapOptions,
        consumer: (...args: AsArray<Params>) => Return,
    ): void {
        const name =
            typeof nameOrOptions === "string"
                ? nameOrOptions
                : nameOrOptions.name
        const enableContext =
            typeof nameOrOptions === "string" ? false : nameOrOptions.context

        this._taps.push({
            name,
            func: consumer,
            enableContext,
        })
    }

    /**
     * Destructively remove all taps from the hook.
     * Are you SURE you know what you're doing if you want to use this?
     */
    public resetTaps(): void {
        this._taps = []
    }

    public get allTapNames(): string[] {
        return this._taps.map((t) => t.name)
    }
}

/**
 * A hook that runs each tap one-by-one.
 */
export class SyncHook<Params> extends BaseImpl<Params> {
    public call(...params: AsArray<Params>): void {
        const context = {}

        for (const tap of this._taps) {
            const args = tap.enableContext ? [context, ...params] : [...params]

            // @ts-expect-error TypeScript things.
            tap.func(...args)
        }

        return
    }
}

/**
 * A hook that runs each tap one-by-one until one returns a result.
 */
export class SyncBailHook<Params, Return> extends BaseImpl<Params, Return> {
    public call(...params: AsArray<Params>): Return | null {
        const context = {}

        for (const tap of this._taps) {
            const args = tap.enableContext ? [context, ...params] : [...params]

            // @ts-expect-error TypeScript things.
            const result = tap.func(...args)

            if (result) {
                return result
            }
        }

        return null
    }
}

/**
 * A hook that runs each tap, one-by-one, in an async context (each tap may be an async function).
 */
export class AsyncSeriesHook<Params> extends BaseImpl<Params, Promise<void>> {
    public async callAsync(...params: AsArray<Params>): Promise<void> {
        const context = {}

        for (const tap of this._taps) {
            const args = tap.enableContext ? [context, ...params] : [...params]

            // @ts-expect-error TypeScript things.
            await tap.func(...args)
        }
    }
}
