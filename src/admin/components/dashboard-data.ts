/* The numbers the visitor dashboard shows. Kept apart from the code that reads them from the database, so the dashboard
   component can be shown with sample numbers on /_states. */
export interface Dashboard {
  days: number;
  series: { day: string; views: number; visitors: number }[];
  totals: { views: number; visitors: number; pages: number };
  pages: { path: string; views: number; visitors: number }[];
  referrers: { host: string; views: number }[];
  countries: { country: string; views: number }[];
  devices: { device: string; views: number }[];
}
