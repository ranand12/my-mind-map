interface MarkdownNode {
  level: number;
  content: string;
  children: MarkdownNode[];
}

export interface MindMapNode {
  id: string;
  label: string;
  position: { x: number; y: number };
  children?: MindMapNode[];
}

export function parseMarkdown(markdown: string): MindMapNode {
  const lines = markdown.split('\n').filter(line => line.trim());
  const root: MarkdownNode = { level: -1, content: 'Root', children: [] };
  let current = root;
  let stack: MarkdownNode[] = [root];

  lines.forEach(line => {
    const level = line.match(/^#+/)?.[0].length || 0;
    const content = line.replace(/^#+\s*/, '').trim();
    const node: MarkdownNode = { level, content, children: [] };

    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(node);
    stack.push(node);
  });

  // Convert to MindMapNode structure with positions
  function convertToMindMap(node: MarkdownNode, level: number = 0, index: number = 0): MindMapNode {
    const xSpacing = 200;
    const ySpacing = 100;
    const yOffset = index * ySpacing;

    return {
      id: `node-${level}-${index}`,
      label: node.content,
      position: { x: level * xSpacing, y: yOffset },
      children: node.children.map((child, idx) => 
        convertToMindMap(child, level + 1, idx)
      ),
    };
  }

  return convertToMindMap(root.children[0]);
} 