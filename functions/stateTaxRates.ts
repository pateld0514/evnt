// Consolidated state sales tax rates (2026 - combined state + avg local)
// Source of truth for all tax calculations across the platform
export const STATE_TAX_RATES = {
  'AL': { rate: 0.0946, name: 'Alabama' },
  'AK': { rate: 0.0182, name: 'Alaska' },
  'AZ': { rate: 0.0852, name: 'Arizona' },
  'AR': { rate: 0.0946, name: 'Arkansas' },
  'CA': { rate: 0.0899, name: 'California' },
  'CO': { rate: 0.0789, name: 'Colorado' },
  'CT': { rate: 0.0635, name: 'Connecticut' },
  'DE': { rate: 0, name: 'Delaware' },
  'FL': { rate: 0.0698, name: 'Florida' },
  'GA': { rate: 0.0749, name: 'Georgia' },
  'HI': { rate: 0.0450, name: 'Hawaii' },
  'ID': { rate: 0.0603, name: 'Idaho' },
  'IL': { rate: 0.0896, name: 'Illinois' },
  'IN': { rate: 0.0700, name: 'Indiana' },
  'IA': { rate: 0.0694, name: 'Iowa' },
  'KS': { rate: 0.0869, name: 'Kansas' },
  'KY': { rate: 0.0600, name: 'Kentucky' },
  'LA': { rate: 0.1011, name: 'Louisiana' },
  'ME': { rate: 0.0550, name: 'Maine' },
  'MD': { rate: 0.0600, name: 'Maryland' },
  'MA': { rate: 0.0625, name: 'Massachusetts' },
  'MI': { rate: 0.0600, name: 'Michigan' },
  'MN': { rate: 0.0814, name: 'Minnesota' },
  'MS': { rate: 0.0706, name: 'Mississippi' },
  'MO': { rate: 0.0844, name: 'Missouri' },
  'MT': { rate: 0, name: 'Montana' },
  'NE': { rate: 0.0698, name: 'Nebraska' },
  'NV': { rate: 0.0824, name: 'Nevada' },
  'NH': { rate: 0, name: 'New Hampshire' },
  'NJ': { rate: 0.0660, name: 'New Jersey' },
  'NM': { rate: 0.0767, name: 'New Mexico' },
  'NY': { rate: 0.0854, name: 'New York' },
  'NC': { rate: 0.0700, name: 'North Carolina' },
  'ND': { rate: 0.0709, name: 'North Dakota' },
  'OH': { rate: 0.0729, name: 'Ohio' },
  'OK': { rate: 0.0906, name: 'Oklahoma' },
  'OR': { rate: 0, name: 'Oregon' },
  'PA': { rate: 0.0634, name: 'Pennsylvania' },
  'RI': { rate: 0.0700, name: 'Rhode Island' },
  'SC': { rate: 0.0749, name: 'South Carolina' },
  'SD': { rate: 0.0611, name: 'South Dakota' },
  'TN': { rate: 0.0961, name: 'Tennessee' },
  'TX': { rate: 0.0820, name: 'Texas' },
  'UT': { rate: 0.0742, name: 'Utah' },
  'VT': { rate: 0.0639, name: 'Vermont' },
  'VA': { rate: 0.0577, name: 'Virginia' },
  'WA': { rate: 0.0951, name: 'Washington' },
  'WV': { rate: 0.0659, name: 'West Virginia' },
  'WI': { rate: 0.0572, name: 'Wisconsin' },
  'WY': { rate: 0.0556, name: 'Wyoming' },
  'DC': { rate: 0.0600, name: 'District of Columbia' }
};

export function getTaxLabel(stateAbbr, rate) {
  if (!stateAbbr || !STATE_TAX_RATES[stateAbbr]) {
    return '';
  }
  return `${STATE_TAX_RATES[stateAbbr].name} Sales Tax (${(rate * 100).toFixed(1)}%)`;
}