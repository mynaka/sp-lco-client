export interface DataKeyInfo {
    displayName: string;
    description: string;
}
  
export interface DataKeys {
    [key: string]: DataKeyInfo;
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
    type: {
        displayName: 'Type',
        description: 'Type of Node (Class, Species, Serotype, etc.).'
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
    },
    altLabel: {
        displayName: 'Alternative Names',
        description: 'List of other names used to refer to this entry.'
    },
    refs: {
        displayName: 'References',
        description: 'External References for this term.' 
    },
    features: {
        displayName: 'Features',
        description: 'Interactions of the proteins(e.g. catalytic activity) within its sequence.'
    },
    feat_type: {
        displayName: 'Feature Type',
        description: 'Type of interaction (Binding Site, Active Site, etc.)'
    },
    feat_pos: {
        displayName: 'Position',
        description: 'Location of the site in the sequence (e.g. A position of 256-258 indicates that the activity occurs from the 256th to 258th amino acid in the sequence.'
    },
    feat_desc: {
        displayName: 'Additional Information',
        description: 'Additional information such as Cofactors (Non-proteins agents for catalytic activity), or external references.'
    },
    function: {
        displayName: 'Function',
        description: 'Description of the protein\'s functions.'
    },
    sequence: {
        displayName: 'Sequence',
        description: 'Amino Acid Sequence Information of the protein.'
    },
    site_features: {
        displayName: 'Site Features',
        description: 'Interactions of the proteins(e.g. catalytic activity) within its sequence.'
    },
    pheno_variant_features: {
        displayName: 'Phenotype and Variant Features',
        description: 'Site Features regarding Diseases and Phenotypes associated with the protein.'
    },
    optimal_ph: {
        displayName: 'Optimal pH',
        description: 'Optimal pH for protein activity.'
    },
    activity_regulation: {
        displayName: 'Activity Regulation',
        description: 'Regulatory Mechanisms for enzyms with components.'
    }
};