import React, { useState, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface NodeDataType {
  id: string;
  label: string;
  color: string;
  edgeLabel?: string;
  position: { x: number; y: number };
  children?: NodeDataType[];
}

const markdownInput = `
# nyc [#4169e1]
## traditional compute [#808080] (just another cloud)
## data & ai [#4169e1] (differentiator)
### GenAI - MyCity [#4cd038] (went well)
#### Microsoft [#212529] (head-to-head)
#### CE Engagement [#FF0000] (went well)
#### Showcasing Platform [#212529] (Demo)
### Vision AI [#212529] (Computer Vision)
### New Node [#212529] (Innovation)
`;

const parseMarkdown = (markdown: string): NodeDataType => {
  const lines = markdown.trim().split('\n');
  let root: NodeDataType | null = null;
  let lastNodeAtLevel: { [key: number]: NodeDataType } = {};
  let childCountByParent: { [key: string]: number } = {};
  const xSpacing = 250;
  const ySpacing = 80;

  // Parse line to extract label, color, and edge label
  const parseLine = (line: string): { label: string; color: string; edgeLabel?: string } => {
    const colorMatch = line.match(/\[(#[A-Fa-f0-9]{6})\]/);
    const edgeLabelMatch = line.match(/\((.*?)\)$/);
    const color = colorMatch ? colorMatch[1] : '#212529';
    const edgeLabel = edgeLabelMatch ? edgeLabelMatch[1] : undefined;
    const label = line
      .replace(/\s*\[.*?\]/g, '')
      .replace(/\s*\(.*?\)$/g, '')
      .replace(/^#+\s*/, '')
      .trim();
    return { label, color, edgeLabel };
  };

  // First pass: count children for each level
  lines.forEach((line) => {
    const level = (line.match(/^#+/) || [''])[0].length;
    if (level === 0) return;

    const parentLevel = level - 1;
    if (parentLevel > 0) {
      const parentIndentation = '#'.repeat(parentLevel);
      const parentKey = `${parentIndentation}-${lastNodeAtLevel[parentLevel]?.label}`;
      childCountByParent[parentKey] = (childCountByParent[parentKey] || 0) + 1;
    }
  });

  // Reset for second pass
  lastNodeAtLevel = {};

  // Second pass: create nodes with calculated positions
  lines.forEach((line, index) => {
    const level = (line.match(/^#+/) || [''])[0].length;
    if (level === 0) return;

    const { label, color, edgeLabel } = parseLine(line);
    const id = label.toLowerCase().replace(/\s+/g, '-');

    let yPosition = 0;
    if (level === 1) {
      yPosition = ySpacing * 2;
    } else {
      const parentLevel = level - 1;
      const parent = lastNodeAtLevel[parentLevel];
      const parentKey = `${'#'.repeat(parentLevel)}-${parent?.label}`;
      const totalChildren = childCountByParent[parentKey] || 1;
      const childIndex = parent?.children?.length || 0;
      
      if (childIndex === 0) {
        yPosition = parent?.position.y - ySpacing;
      } else {
        const totalHeight = (totalChildren - 1) * ySpacing;
        const startY = parent?.position.y;
        yPosition = startY + (childIndex * ySpacing);
      }
    }

    const node: NodeDataType = {
      id,
      label,
      color,
      edgeLabel,
      position: {
        x: level * xSpacing,
        y: yPosition,
      },
      children: [],
    };

    if (level === 1) {
      root = node;
      lastNodeAtLevel[1] = node;
    } else {
      const parentLevel = level - 1;
      const parent = lastNodeAtLevel[parentLevel];
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }
      lastNodeAtLevel[level] = node;
    }
  });

  return root || {
    id: 'nyc',
    label: 'NYC',
    color: '#4169e1',
    position: { x: 250, y: 250 },
    children: [],
  };
};

function App() {
  const mindMapData = React.useMemo(() => parseMarkdown(markdownInput), []);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([{
    id: mindMapData.id,
    type: 'default',
    data: { label: mindMapData.label },
    position: mindMapData.position,
    style: {
      backgroundColor: mindMapData.color,
      color: 'white',
      padding: '10px 20px',
      borderRadius: '25px',
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }]);
  
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedNodes, setExpandedNodes] = useState<Map<string, number>>(new Map());

  const findNodeData = useCallback((nodeId: string): NodeDataType | null => {
    const findNode = (node: NodeDataType): NodeDataType | null => {
      if (node.id === nodeId) return node;
      if (!node.children) return null;
      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };
    return findNode(mindMapData);
  }, [mindMapData]);

  const createNode = (nodeData: NodeDataType): Node => ({
    id: nodeData.id,
    type: 'default',
    data: { label: nodeData.label },
    position: nodeData.position,
    style: {
      backgroundColor: nodeData.color,
      color: 'white',
      padding: '10px 20px',
      borderRadius: '25px',
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const currentNode = findNodeData(node.id);
    if (!currentNode?.children?.length) return;

    setExpandedNodes((prev) => {
      const next = new Map(prev);
      if (next.has(node.id)) {
        const currentLevel = next.get(node.id) || 0;
        if (currentLevel < currentNode.children!.length - 1) {
          next.set(node.id, currentLevel + 1);
        } else {
          next.delete(node.id);
        }
      } else {
        next.set(node.id, 0);
      }
      return next;
    });
  }, [findNodeData]);

  React.useEffect(() => {
    const newNodes: Node[] = [{
      id: mindMapData.id,
      type: 'default',
      data: { label: mindMapData.label },
      position: mindMapData.position,
      style: {
        backgroundColor: mindMapData.color,
        color: 'white',
        padding: '10px 20px',
        borderRadius: '25px',
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }];
    const newEdges: Edge[] = [];

    expandedNodes.forEach((level, nodeId) => {
      const currentNode = findNodeData(nodeId);
      if (currentNode?.children) {
        for (let i = 0; i <= level && i < currentNode.children.length; i++) {
          const child = currentNode.children[i];
          newNodes.push(createNode(child));
          newEdges.push({
            id: `${nodeId}-${child.id}`,
            source: nodeId,
            target: child.id,
            type: 'bezier',
            label: child.edgeLabel,
            labelStyle: { 
              fill: '#888', 
              fontSize: 12,
              fontWeight: 500,
            },
            labelBgStyle: { 
              fill: '#fff', 
              fillOpacity: 0.8,
            },
            style: { 
              stroke: '#dee2e6',
              strokeWidth: 2,
            },
            animated: false,
            markerEnd: {
              type: MarkerType.Arrow,
            },
          });
        }
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [expandedNodes, setNodes, setEdges, mindMapData, findNodeData]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          defaultEdgeOptions={{
            type: 'bezier',
            style: { 
              stroke: '#dee2e6',
              strokeWidth: 2,
            },
            markerEnd: {
              type: MarkerType.Arrow,
            },
          }}
        >
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#666',
          fontSize: '14px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        this app was built by anand kumar (@ranand12)
      </div>
    </div>
  );
}

export default App;