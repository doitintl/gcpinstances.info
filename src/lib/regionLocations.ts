// Mapping of GCP region IDs to human-readable locations.
// Format: "City, Country" (brief). Used in the Compare by Region dialog to
// label column headers, e.g. "us-central1 (Iowa, US)".

export const REGION_LOCATIONS: Record<string, string> = {
  'africa-south1':           'Johannesburg, South Africa',
  'asia-east1':              'Changhua County, Taiwan',
  'asia-east2':              'Hong Kong',
  'asia-northeast1':         'Tokyo, Japan',
  'asia-northeast2':         'Osaka, Japan',
  'asia-northeast3':         'Seoul, South Korea',
  'asia-south1':             'Mumbai, India',
  'asia-south2':             'Delhi, India',
  'asia-southeast1':         'Jurong West, Singapore',
  'asia-southeast2':         'Jakarta, Indonesia',
  'asia-southeast3':         'Kuala Lumpur, Malaysia',
  'australia-southeast1':    'Sydney, Australia',
  'australia-southeast2':    'Melbourne, Australia',
  'europe-central2':         'Warsaw, Poland',
  'europe-north1':           'Hamina, Finland',
  'europe-north2':           'Stockholm, Sweden',
  'europe-southwest1':       'Madrid, Spain',
  'europe-west1':            'St. Ghislain, Belgium',
  'europe-west2':            'London, UK',
  'europe-west3':            'Frankfurt, Germany',
  'europe-west4':            'Eemshaven, Netherlands',
  'europe-west6':            'Zürich, Switzerland',
  'europe-west8':            'Milan, Italy',
  'europe-west9':            'Paris, France',
  'europe-west10':           'Berlin, Germany',
  'europe-west12':           'Turin, Italy',
  'me-central1':             'Doha, Qatar',
  'me-central2':             'Dammam, Saudi Arabia',
  'me-west1':                'Tel Aviv, Israel',
  'northamerica-northeast1': 'Montréal, Canada',
  'northamerica-northeast2': 'Toronto, Canada',
  'northamerica-south1':     'Querétaro, Mexico',
  'southamerica-east1':      'São Paulo, Brazil',
  'southamerica-west1':      'Santiago, Chile',
  'us-central1':             'Iowa, US',
  'us-east1':                'South Carolina, US',
  'us-east4':                'Virginia, US',
  'us-east5':                'Ohio, US',
  'us-south1':               'Dallas, US',
  'us-west1':                'Oregon, US',
  'us-west2':                'Los Angeles, US',
  'us-west3':                'Salt Lake City, US',
  'us-west4':                'Las Vegas, US',
  'us-west8':                'Phoenix, US',
}

/** Format a region as "id (Location)", or just "id" when unknown. */
export function formatRegionWithLocation(region: string): string {
  const loc = REGION_LOCATIONS[region]
  return loc ? `${region} (${loc})` : region
}
