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

import { FileChangeInfo, watch } from "fs/promises"

/**
 * Set up a listener for file/folder changes.
 *
 * @param target The file or folder name to watch.
 * @param callback What to do when the hot updater is triggered.
 */
export async function setupHotListener(
    target: string,
    callback: (event: FileChangeInfo<string>) => void,
): Promise<void> {
    try {
        const watcher = watch(target, {})

        for await (const event of watcher) {
            callback(event)
        }
    } catch (err) {
        if ((err as Error).name === "AbortError") {
            return
        }

        throw err
    }
}
