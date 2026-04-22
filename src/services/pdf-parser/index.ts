import { normalizeText, createSections, cleanSectionText } from './normalizer';

export interface ParsedPdf {
  name: string;
  pageCount: number;
  textByPage: { pageNumber: number; text: string }[];
  allText: string;
  sections: { id: string; title: string; content: string }[];
}

export interface ParseError {
  type: 'empty' | 'no-text' | 'read-error' | 'size-error';
  message: string;
}

export type ParseResult = { success: true; data: ParsedPdf } | { success: false; error: ParseError };

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Parse a PDF file and extract text (client-side only)
 */
export async function parsePdf(file: File): Promise<ParseResult> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: {
        type: 'size-error',
        message: 'File is too large. Maximum size is 50MB.',
      },
    };
  }
  
  try {
    // Dynamic import for client-side only
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker path
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    
    const textByPage: { pageNumber: number; text: string }[] = [];
    let allText = '';
    
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      
      textByPage.push({
        pageNumber: i,
        text: pageText,
      });
      
      allText += pageText + '\n';
    }
    
    // Normalize and clean
    const normalizedText = normalizeText(allText);
    
    if (normalizedText.length === 0) {
      return {
        success: false,
        error: {
          type: 'no-text',
          message: 'No selectable text found. This PDF may contain scanned images instead of text.',
        },
      };
    }
    
    const cleanedText = cleanSectionText(normalizedText);
    const sections = createSections(cleanedText);
    
    return {
      success: true,
      data: {
        name: file.name,
        pageCount,
        textByPage,
        allText: cleanedText,
        sections,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: 'read-error',
        message: 'Failed to read PDF file. The file may be corrupted or password-protected.',
      },
    };
  }
}