/* The numbers the visitor dashboard shows. Kept apart from the code that reads them from the database, so the dashboard
   component can be shown with sample numbers on /_states.
   Words used here: a "view" is one page opened; a "visit" is one visitor on one day (the site keeps no cookie, so a
   person cannot be followed from one day to the next, and one reader on five days is five visits). Where a visit
   came from, its country and its device are taken from its first page view. */
export interface DayCount { day: string; views: number; visits: number }
export interface Totals { views: number; visits: number; /** Visits from Saudi Arabia and the UAE. */ target: number }

export interface Dashboard {
  /** The period: its length in days, first and last day (UTC). The last day is today and still open. */
  days: number; from: string; to: string;
  /** The first day the log holds, and how many of the previous period's days it covers (its length when complete). */
  countingSince: string; previousCovered: number;
  series: DayCount[];
  totals: Totals;
  /** The period of the same length just before this one; null when the log holds nothing from before this period. */
  previous: { series: DayCount[]; totals: Totals } | null;
  /** The most read pages, most read first. */
  pages: { path: string; /** The page's name, when the page has looked it up. */ name?: string; views: number; visits: number }[];
  /** Views by part of the site, largest first. */
  sections: { section: string; views: number }[];
  /** Visits by where they came from (LinkedIn, Google, Direct or app, Other sites), and the hosts behind each. */
  sources: { source: string; visits: number; hosts: { host: string; visits: number }[] }[];
  /** Visits by country (ISO-2, '' for unknown), largest first; Saudi Arabia and the UAE are always present. */
  countries: { country: string; visits: number }[];
  devices: { device: string; visits: number }[];
  /** Visits by hour of the day in Gulf time (UTC+3) and by weekday (Monday first), over the last 90 days: patterns need more days than a period. */
  hours: number[]; weekdays: number[]; patternDays: number;
  /** What was published from the admin during the period, newest first, with the views its page has had since. */
  publishes: { day: string; kind: string; slug: string; /** The entry's title, when the page has looked it up. */ title?: string; /** The page it is read on. */ path?: string; /** That page's name in words, when shared and looked up. */ pathName?: string; /** The page is shared with other entries (Read, Videos, Resources). */ shared?: boolean; views?: number }[];
  /** The latest view in the log: when, from where, which page. */
  lastVisit?: { at: string; country: string; path: string; name?: string };
}
