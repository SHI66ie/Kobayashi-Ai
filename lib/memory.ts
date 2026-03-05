import fs from 'fs';
import path from 'path';

// Define the path to the memory JSON file. Ensure the Data directory exists.
const memoryFilePath = path.resolve(process.cwd(), 'Data', 'memory.json');

/**
 * Ensure the memory file exists. If not, create an empty array.
 */
function ensureMemoryFile() {
    try {
        if (!fs.existsSync(memoryFilePath)) {
            fs.mkdirSync(path.dirname(memoryFilePath), { recursive: true });
            fs.writeFileSync(memoryFilePath, JSON.stringify([]), 'utf-8');
        }
    } catch (err) {
        console.error('Failed to ensure memory file:', err);
    }
}

/**
 * Retrieve all stored memory entries.
 */
export function getMemory(): Array<any> {
    ensureMemoryFile();
    try {
        const raw = fs.readFileSync(memoryFilePath, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Failed to read memory file:', err);
        return [];
    }
}

/**
 * Append a new entry to the memory store.
 * @param entry An object containing any data you wish to persist (e.g., request payload, prediction, timestamp).
 */
export function addMemoryEntry(entry: any): void {
    ensureMemoryFile();
    try {
        const memory = getMemory();
        memory.push({ timestamp: new Date().toISOString(), ...entry });
        // Keep only the latest 500 entries to prevent unbounded growth.
        const trimmed = memory.slice(-500);
        fs.writeFileSync(memoryFilePath, JSON.stringify(trimmed, null, 2), 'utf-8');
    } catch (err) {
        console.error('Failed to write memory entry:', err);
    }
}
/**
 * Get recent memories as a formatted string for AI context.
 */
export function getRecentContext(limit: number = 5): string {
    const memory = getMemory();
    const recent = memory.slice(-limit);
    if (recent.length === 0) return "No past predictions recorded yet.";

    return recent.map((m, i) => {
        return `Record ${i + 1} (${m.timestamp}):
Input: ${JSON.stringify(m.input || m.context || {})}
Outcome/Prediction: ${m.prediction || m.analysis || "N/A"}`;
    }).join('\n---\n');
}
