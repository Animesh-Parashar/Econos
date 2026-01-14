export function calculateReadingTime(wordCount: number): string {
    const wpm = 200;
    const minutes = Math.ceil(wordCount / wpm);
    return minutes === 1 ? '1 min read' : `${minutes} min read`;
}

export function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}
