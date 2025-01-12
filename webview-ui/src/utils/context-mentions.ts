import { mentionRegex } from "../../../src/shared/context-mentions"

export function insertMention(text: string, position: number, value: string): { newValue: string; mentionIndex: number } {
	const beforeCursor = text.slice(0, position)
	const afterCursor = text.slice(position)

	// Find the position of the last '@' symbol before the cursor
	const lastAtIndex = beforeCursor.lastIndexOf("@")

	let newValue: string
	let mentionIndex: number

	if (lastAtIndex !== -1) {
		// If there's an '@' symbol, replace everything after it with the new mention
		const beforeMention = text.slice(0, lastAtIndex)
		newValue = beforeMention + "@" + value + " " + afterCursor.replace(/^[^\s]*/, "")
		mentionIndex = lastAtIndex
	} else {
		// If there's no '@' symbol, insert the mention at the cursor position
		newValue = beforeCursor + "@" + value + " " + afterCursor
		mentionIndex = position
	}

	return { newValue, mentionIndex }
}

export function removeMention(text: string, position: number): { newText: string; newPosition: number } {
	const beforeCursor = text.slice(0, position)
	const afterCursor = text.slice(position)

	// Check if we're at the end of a mention
	const matchEnd = beforeCursor.match(new RegExp(mentionRegex.source + "$"))

	if (matchEnd) {
		// If we're at the end of a mention, remove it
		const newText = text.slice(0, position - matchEnd[0].length) + afterCursor.replace(" ", "") // removes the first space after the mention
		const newPosition = position - matchEnd[0].length
		return { newText, newPosition }
	}

	// If we're not at the end of a mention, just return the original text and position
	return { newText: text, newPosition: position }
}

export enum ContextMenuOptionType {
	File = "file",
	Folder = "folder",
	Problems = "problems",
	URL = "url",
	NoResults = "noResults",
	Codebase = "codebase",
}

export interface ContextMenuQueryItem {
	type: ContextMenuOptionType
	value?: string
}

export function getContextMenuOptions(
	query: string,
	selectedType: ContextMenuOptionType | null = null,
	queryItems: ContextMenuQueryItem[],
): ContextMenuQueryItem[] {
	const beforeQuery = query.slice(0, 1)
	
	// Handle #codebase command
	if (beforeQuery === "#") {
		return [{ type: ContextMenuOptionType.Codebase, value: "codebase" }]
	}

	if (query === "") {
		if (selectedType === ContextMenuOptionType.File) {
			const files = queryItems
				.filter((item) => item.type === ContextMenuOptionType.File)
				.map((item) => ({
					type: ContextMenuOptionType.File,
					value: item.value,
				}))
			return files.length > 0 ? files : [{ type: ContextMenuOptionType.NoResults }]
		}

		if (selectedType === ContextMenuOptionType.Folder) {
			const folders = queryItems
				.filter((item) => item.type === ContextMenuOptionType.Folder)
				.map((item) => ({
					type: ContextMenuOptionType.Folder,
					value: item.value,
				}))
			return folders.length > 0 ? folders : [{ type: ContextMenuOptionType.NoResults }]
		}

		return [
			{ type: ContextMenuOptionType.URL },
			{ type: ContextMenuOptionType.Problems },
			{ type: ContextMenuOptionType.Folder },
			{ type: ContextMenuOptionType.File },
		]
	}

	const lowerQuery = query.toLowerCase()

	if (query.startsWith("http")) {
		return [{ type: ContextMenuOptionType.URL, value: query }]
	} else {
		const matchingItems = queryItems.filter((item) => item.value?.toLowerCase().includes(lowerQuery))

		if (matchingItems.length > 0) {
			return matchingItems.map((item) => ({
				type: item.type,
				value: item.value,
			}))
		} else {
			return [{ type: ContextMenuOptionType.NoResults }]
		}
	}
}

export function shouldShowContextMenu(text: string, position: number): boolean {
	const beforeCursor = text.slice(0, position)
	return beforeCursor.endsWith("@") || beforeCursor.endsWith("#")
}
