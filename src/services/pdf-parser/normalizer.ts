// PDF Text Normalizer Service

/**
 * Normalizes extracted PDF text for typing practice
 */
export function normalizeText(text: string): string {
  // Remove excessive whitespace
  const normalized = text
    // Remove carriage returns
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove multiple spaces
    .replace(/[ \t]+/g, ' ')
    // Remove multiple newlines (more than 2)
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Final trim
    .trim();
  
  return normalized;
}

/**
 * Splits text into sections for practice
 * If text is short, returns single section
 * Otherwise splits by paragraphs or creates artificial sections
 */
export function createSections(text: string): { id: string; title: string; content: string }[] {
  const sections: { id: string; title: string; content: string }[] = [];
  
  // If text is very short, return as single section
  if (text.length < 500) {
    return [{
      id: 'full',
      title: 'Full Text',
      content: text.trim(),
    }];
  }
  
  // Split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length <= 3) {
    // Few paragraphs - return each as section
    paragraphs.forEach((para, idx) => {
      const title = para.substring(0, 40).trim();
      sections.push({
        id: `para_${idx}`,
        title: title + (title.length < para.length ? '...' : ''),
        content: para.trim(),
      });
    });
  } else {
    // Many paragraphs - create chunks
    const chunkSize = Math.ceil(paragraphs.length / 3);
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      const chunk = paragraphs.slice(i, i + chunkSize);
      const content = chunk.join('\n\n');
      const firstWords = chunk[0]?.substring(0, 30).trim() || 'Section';
      
      sections.push({
        id: `section_${Math.floor(i / chunkSize)}`,
        title: `${firstWords}${i + chunkSize < paragraphs.length ? '...' : ''}`,
        content: content.trim(),
      });
    }
  }
  
  return sections;
}

/**
 * Clean section for display - removes artifacts
 */
export function cleanSectionText(text: string): string {
  return text
    // Remove page numbers at start
    .replace(/^\s*\d+\s*$/gm, '')
    // Remove isolated short lines (likely headers/footers)
    .split('\n')
    .filter(line => line.trim().length > 3)
    .join('\n')
    .trim();
}
