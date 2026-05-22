export function prettifyHTML(html: string): string {
  if (!html) return '';
  
  // Simple HTML prettifier
  let formatted = html;
  
  // Add line breaks after closing tags
  formatted = formatted.replace(/></g, '>\n<');
  
  // Add proper indentation
  const lines = formatted.split('\n');
  let indentLevel = 0;
  const indentSize = 2;
  
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    
    // Decrease indent for closing tags
    if (trimmed.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
    
    // Increase indent for opening tags (but not self-closing)
    if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
      indentLevel++;
    }
    
    return indentedLine;
  });
  
  return formattedLines.join('\n');
}

export function prettifyJSON(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}