export function parseAIContent(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let html = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^#### (.+)$/gm, '<h5 class="ai-h5">$1</h5>')
    .replace(/^### (.+)$/gm, '<h4 class="ai-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="ai-h3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="ai-h2">$1</h2>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-•] (.+)$/gm, '<li class="ai-li">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ai-li ai-oli">$1</li>')
    .replace(/(<li class="ai-li">(?:(?!<li)[\s\S])*<\/li>\s*)+/g,
             (m) => m.includes('ai-oli') ? 
               `<ol class="ai-ol">${m}</ol>` : 
               `<ul class="ai-ul">${m}</ul>`)
    .replace(/\n\n+/g, '</p><p class="ai-p">')
    .replace(/\n/g, '<br>');
  if (!html.startsWith('<')) html = `<p class="ai-p">${html}</p>`;
  return html;
}
