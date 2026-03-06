import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// All US states for validation
const US_STATES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { location } = await req.json();

    if (!location) {
      return Response.json({ 
        state: null,
        confidence: 'none'
      });
    }

    const locationUpper = location.toUpperCase();

    // Method 1: Extract from "City, ST" format (most reliable)
    const commaMatch = locationUpper.match(/,\s*([A-Z]{2})(?:\s|$)/);
    if (commaMatch && US_STATES[commaMatch[1]]) {
      return Response.json({
        state: commaMatch[1],
        stateName: US_STATES[commaMatch[1]],
        confidence: 'high',
        method: 'comma_format'
      });
    }

    // Method 2: Find 2-letter abbreviation anywhere in string
    const stateMatch = locationUpper.match(/\b([A-Z]{2})(?:\s|$)/);
    if (stateMatch && US_STATES[stateMatch[1]]) {
      return Response.json({
        state: stateMatch[1],
        stateName: US_STATES[stateMatch[1]],
        confidence: 'medium',
        method: 'abbreviation_match'
      });
    }

    // Method 3: Check for full state name
    for (const [abbr, name] of Object.entries(US_STATES)) {
      if (locationUpper.includes(name.toUpperCase())) {
        return Response.json({
          state: abbr,
          stateName: name,
          confidence: 'low',
          method: 'full_name_match'
        });
      }
    }

    // No state found
    return Response.json({
      state: null,
      confidence: 'none',
      warning: 'Could not extract state from location string'
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});