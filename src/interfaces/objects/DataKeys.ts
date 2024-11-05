export interface DataKeyInfo {
    displayName: string;
    description: string;
}
  
export interface DataKeys {
    prefLabel: DataKeyInfo;
    identifier: DataKeyInfo;
    notation: DataKeyInfo;
    description: DataKeyInfo;
    output: DataKeyInfo;
    format: DataKeyInfo;
}

export const dataKeys: DataKeys = {
    prefLabel: {
        displayName: 'Preferred Label',
        description: 'The preferred label used in the ontology.'
    },
    identifier: {
        displayName: 'Identifier',
        description: 'The unique identifier for the term.'
    },
    notation: {
        displayName: 'Notation',
        description: 'The unique identifier for the node.'
    },
    description: {
        displayName: 'Description',
        description: 'The description of the term.'
    },
    output: {
        displayName: 'Output Format',
        description: 'A table containing the ontology sources of the output after conversion.'
    },
    format: {
        displayName: 'Input Format',
        description: 'A table containing expected input columns and their type.'
    }
};