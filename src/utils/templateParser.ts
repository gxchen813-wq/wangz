export function extractVariables(content: string): string[] {
  if (!content) return [];
  
  // 1. Extract explicit variables: {{var}}
  const explicitRegex = /\{\{([^}]+)\}\}/g;
  const explicitMatches = [...content.matchAll(explicitRegex)];
  const explicitVars = explicitMatches.map(m => m[1].trim());

  // 2. Extract potential variables: Lines ending with "：" or ":" followed by nothing
  const potentialRegex = /^([^：:\n]+)[：:](?!\s*\{\{)(?:\s*)$/gm;
  const potentialMatches = [...content.matchAll(potentialRegex)];
  const potentialVars = potentialMatches.map(m => m[1].trim());

  // Combine and remove duplicates, keeping order
  return [...new Set([...explicitVars, ...potentialVars])];
}

export function fillTemplate(content: string, variables: Record<string, string>): string {
  if (!content) return '';
  
  let result = content;

  // 1. Replace explicit variables
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, p1) => {
    const key = p1.trim();
    return variables[key] !== undefined && variables[key] !== '' ? variables[key] : match;
  });

  // 2. Handle cases where variables were extracted from "Label：" format
  // We look for "Label：" that are NOT followed by more text on the same line
  Object.keys(variables).forEach(key => {
    if (variables[key] && !result.includes(`{{${key}}}`)) {
      // Escape key for regex
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^(${escapedKey}[：:])(?:\\s*)$`, 'gm');
      result = result.replace(regex, `$1 ${variables[key]}`);
    }
  });

  return result;
}
