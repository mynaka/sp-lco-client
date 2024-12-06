import { TreeNode } from "primevue/treenode";
import { SearchTerm } from "./SearchTerm";

export interface NodeData extends TreeNode {
    isLoaded?: boolean;
    nodeType?: string;
    parent?: SearchTerm;
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

export interface ColumnType {
    field: string;
    header: string;
}