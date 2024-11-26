import { TreeNode } from "primevue/treenode";

export interface NodeData extends TreeNode {
    isLoaded?: boolean;
    nodeType?: string;
}

export interface GraphNode extends NodeData {
    id: string;
    x: number;
    y: number;
    fx?: number | null;
    fy?: number | null;
}
  
export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    relationship: string;
}