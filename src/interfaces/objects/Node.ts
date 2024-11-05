export interface Node {
    key: string;
    label: string;
    data: Record<string, any>;
    leaf: boolean;
    loading: boolean;
    children?: Node[];
    isLoaded?: boolean;
}

export interface GraphNode {
    id: string;
    label: string;
    x: number;
    y: number;
    fx?: number | null;
    fy?: number | null;
    data?: any;
    isLoaded: boolean;
    leaf: boolean;
}
  
export interface GraphLink {
    source: number | GraphNode;
    target: number | GraphNode;
}