const ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'ul',
]);

const REMOVE_WITH_CONTENT = new Set([
  'iframe',
  'script',
  'style',
  'object',
  'embed',
  'link',
  'meta',
  'svg',
  'math',
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  span: new Set(['style']),
};

const COLOR_VALUE_PATTERN =
  /^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)|hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)|hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(0|1|0?\.\d+)\s*\))$/i;

const sanitizeStyle = (value: string): string | null => {
  const rules = value
    .split(';')
    .map((rule) => rule.trim())
    .filter(Boolean);

  const safeRules = rules.flatMap((rule) => {
    const [property, ...rawValueParts] = rule.split(':');
    const rawValue = rawValueParts.join(':').trim();

    if (property?.trim().toLowerCase() !== 'color') return [];
    if (!rawValue || /url|expression|javascript|data:/i.test(rawValue)) return [];
    if (!COLOR_VALUE_PATTERN.test(rawValue)) return [];

    return [`color: ${rawValue}`];
  });

  return safeRules.length > 0 ? safeRules.join('; ') : null;
};

export const sanitizeRichTextUrl = (value: string): string | null => {
  const trimmed = value.trim();
  const hasControlCharacter = Array.from(trimmed).some((character) => {
    const charCode = character.charCodeAt(0);
    return charCode <= 31 || charCode === 127;
  });
  if (!trimmed || hasControlCharacter) return null;

  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? trimmed : null;
  } catch {
    return null;
  }
};

const unwrapElement = (element: Element) => {
  const parent = element.parentNode;
  if (!parent) return;

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
};

const sanitizeElement = (element: Element) => {
  const tagName = element.tagName.toLowerCase();

  if (REMOVE_WITH_CONTENT.has(tagName)) {
    element.remove();
    return;
  }

  if (!ALLOWED_TAGS.has(tagName)) {
    unwrapElement(element);
    return;
  }

  const allowedForTag = ALLOWED_ATTRIBUTES[tagName] ?? new Set<string>();

  for (const attribute of Array.from(element.attributes)) {
    const attrName = attribute.name.toLowerCase();

    if (attrName.startsWith('on') || !allowedForTag.has(attrName)) {
      element.removeAttribute(attribute.name);
      continue;
    }

    if (tagName === 'a' && attrName === 'href') {
      const safeUrl = sanitizeRichTextUrl(attribute.value);
      if (safeUrl) {
        element.setAttribute('href', safeUrl);
      } else {
        element.removeAttribute(attribute.name);
      }
      continue;
    }

    if (tagName === 'span' && attrName === 'style') {
      const safeStyle = sanitizeStyle(attribute.value);
      if (safeStyle) {
        element.setAttribute('style', safeStyle);
      } else {
        element.removeAttribute(attribute.name);
      }
    }
  }

  if (tagName === 'a' && element.getAttribute('href')) {
    element.setAttribute('target', '_blank');
    element.setAttribute('rel', 'noopener noreferrer');
  }
};

const sanitizeNode = (node: Node) => {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      sanitizeElement(child as Element);
      if (child.parentNode) {
        sanitizeNode(child);
      }
    } else if (child.nodeType !== Node.TEXT_NODE) {
      child.remove();
    }
  }
};

export const sanitizeRichTextHtml = (html?: string | null): string => {
  if (!html) return '';

  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }

  const template = document.createElement('template');
  template.innerHTML = html;
  sanitizeNode(template.content);

  const container = document.createElement('div');
  container.appendChild(template.content.cloneNode(true));
  return container.innerHTML;
};
