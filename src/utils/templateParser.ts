export function extractVariables(content: string): string[] {
  if (!content) return [];
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = [...content.matchAll(regex)];
  const vars = matches.map(m => m[1].trim());
  return [...new Set(vars)]; // Unique variables
}

export function fillTemplate(content: string, variables: Record<string, string>): string {
  if (!content) return '';
  return content.replace(/\{\{([^}]+)\}\}/g, (match, p1) => {
    const key = p1.trim();
    return variables[key] !== undefined && variables[key] !== '' ? variables[key] : match;
  });
}
