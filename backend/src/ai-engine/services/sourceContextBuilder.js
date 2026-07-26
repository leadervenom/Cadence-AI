// Lightweight, pragmatic replacement for "dump every source's full raw text
// into every prompt turn": rank sources by keyword overlap with the latest
// user message and only send full content for the most relevant ones,
// truncating the rest. Not retrieval/embeddings — that's a deferred,
// separate RAG phase (see CLAUDE.md's AI Model Engineering notes).

const STOPWORDS = new Set([
    "the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "is", "are",
    "was", "were", "be", "this", "that", "with", "at", "by", "from", "it",
    "as", "our", "we", "i", "you", "your", "please", "can", "what", "how"
]);

function tokenize(text) {
    return String(text || "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function scoreSource(source, queryTerms) {
    if (queryTerms.size === 0) {
        return 0;
    }

    const sourceTerms = new Set(tokenize(`${source.name || ""} ${source.content || ""}`));
    let overlap = 0;

    for (const term of queryTerms) {
        if (sourceTerms.has(term)) {
            overlap += 1;
        }
    }

    return overlap;
}

export function buildSourceContext(sources, query, { maxCharsPerSource = 2000, relevantMaxChars = 8000, maxRelevantSources = 3 } = {}) {
    const list = Array.isArray(sources) ? sources : [];
    const queryTerms = new Set(tokenize(query));

    const scored = list
        .map((source) => ({ source, score: scoreSource(source, queryTerms) }))
        .sort((a, b) => b.score - a.score);

    const relevantIds = new Set(
        scored
            .filter((entry) => entry.score > 0)
            .slice(0, maxRelevantSources)
            .map((entry) => entry.source.id)
    );

    return list.map((source) => {
        const content = String(source.content || "");
        const isRelevant = relevantIds.has(source.id);
        const cap = isRelevant ? relevantMaxChars : maxCharsPerSource;

        return {
            name: source.name,
            status: source.status,
            content: content.length > cap ? `${content.slice(0, cap)}\n[...truncated]` : content
        };
    });
}
