import { Signal } from "./types";

// ---------------------------------------------------------------------------
// SerpApi integration (https://serpapi.com)
//
// Pulls three live signal types per lead:
//   1. google_news  -> recent news mentioning the company (funding, launches, PR)
//   2. google_jobs  -> open roles at the company (hiring/growth signal)
//   3. google       -> general web presence / most relevant recent result
//
// Get a free key at https://serpapi.com/users/sign_up (100 free searches/mo)
// and set SERPAPI_KEY in .env.local. Without a key, this returns clearly
// labeled mock data so the app still runs end-to-end for local dev/demo.
// ---------------------------------------------------------------------------

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SERPAPI_BASE = "https://serpapi.com/search.json";

type RawSignal = Omit<Signal, "id" | "fetched_at" | "lead_id">;

async function serpapiRequest(params: Record<string, string>) {
  const url = new URL(SERPAPI_BASE);
  url.searchParams.set("api_key", SERPAPI_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`SerpApi request failed: ${res.status}`);
  return res.json();
}

interface SerpApiResultItem {
  title?: string;
  snippet?: string;
  link?: string;
  date?: string;
  source?: { name?: string };
  company_name?: string;
  location?: string;
  related_links?: { link?: string }[];
  detected_extensions?: { posted_at?: string };
}

async function fetchNews(companyName: string): Promise<RawSignal[]> {
  const data = await serpapiRequest({ engine: "google_news", q: `"${companyName}"` });
  const items: SerpApiResultItem[] = (data.news_results ?? []).slice(0, 4);
  return items.map((item) => ({
    source: "serpapi_news" as const,
    headline: item.title ?? "Untitled",
    snippet: item.snippet ?? item.source?.name ?? "",
    url: item.link ?? null,
    published_at: item.date ?? null,
  }));
}

async function fetchJobs(companyName: string): Promise<RawSignal[]> {
  const data = await serpapiRequest({ engine: "google_jobs", q: `${companyName} careers` });
  const items: SerpApiResultItem[] = (data.jobs_results ?? []).slice(0, 3);
  return items.map((item) => ({
    source: "serpapi_jobs" as const,
    headline: item.title ?? "Untitled",
    snippet: [item.company_name, item.location].filter(Boolean).join(" · "),
    url: item.related_links?.[0]?.link ?? null,
    published_at: item.detected_extensions?.posted_at ?? null,
  }));
}

// Plain "company name" web search tends to surface the company's own
// login/homepage/nav pages — real content, but useless as an outreach
// hook ("Duolingo — Log in" told a rep nothing). Excluding common auth
// paths at the query level, plus a title-based filter below, keeps only
// results that actually say something about the company.
async function fetchWebPresence(companyName: string, website: string | null): Promise<RawSignal[]> {
  const q = website
    ? `${companyName} ${website} -inurl:login -inurl:signin -inurl:signup`
    : `${companyName} -inurl:login -inurl:signin -inurl:signup`;
  const data = await serpapiRequest({ engine: "google", q });
  const rawItems: SerpApiResultItem[] = data.organic_results ?? [];
  const items: SerpApiResultItem[] = rawItems
    .slice(0, 6) // filter over a wider pool so 1-2 low-signal hits don't starve the result
    .filter((item) => !isLowSignalTitle(item.title, companyName))
    .slice(0, 2);
  return items.map((item) => ({
    source: "serpapi_search" as const,
    headline: item.title ?? "Untitled",
    snippet: item.snippet ?? "",
    url: item.link ?? null,
    published_at: null,
  }));
}

// Catches generic nav/auth/legal page titles that slip past the
// query-level exclusion. Checked as a substring, not just a prefix,
// because these show up anywhere in the title ("Notion - Log in",
// "Duolingo — Privacy settings"), not only at the start.
const LOW_SIGNAL_TITLE_KEYWORDS =
  /\b(log ?in|sign ?(in|up)|home ?page|welcome|privacy (policy|settings|notice)|terms of (service|use)|cookie (policy|settings)|404|page not found)\b/i;

function isLowSignalTitle(title: string | undefined, companyName: string): boolean {
  if (!title) return true;
  const trimmed = title.trim();
  if (LOW_SIGNAL_TITLE_KEYWORDS.test(trimmed)) return true;
  // Bare company name plus only generic corporate suffixes ("Stripe,
  // Inc.", "Duolingo | Official Site") — technically about the company,
  // but says nothing an outreach draft could reference. Punctuation is
  // stripped to plain spaces first so "Inc." doesn't dodge the \b match
  // on the trailing period.
  const stripped = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(inc|llc|ltd|co|corp|official site|home)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const strippedCompany = companyName.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  return stripped === strippedCompany;
}

function mockSignals(companyName: string): RawSignal[] {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toDateString();
  return [
    {
      source: "serpapi_news",
      headline: `${companyName} closes new funding round to accelerate expansion`,
      snippet: "[MOCK DATA — add SERPAPI_KEY to .env.local for live results]",
      url: null,
      published_at: daysAgo(6),
    },
    {
      source: "serpapi_jobs",
      headline: `${companyName} is hiring: Senior Account Executive`,
      snippet: "[MOCK DATA — add SERPAPI_KEY to .env.local for live results]",
      url: null,
      published_at: daysAgo(2),
    },
    {
      source: "serpapi_search",
      headline: `${companyName} — Official Site`,
      snippet: "[MOCK DATA — add SERPAPI_KEY to .env.local for live results]",
      url: null,
      published_at: null,
    },
  ];
}

export async function gatherSignals(
  companyName: string,
  website: string | null
): Promise<RawSignal[]> {
  if (!SERPAPI_KEY) {
    return mockSignals(companyName);
  }
  try {
    const [news, jobs, web] = await Promise.all([
      fetchNews(companyName).catch(() => []),
      fetchJobs(companyName).catch(() => []),
      fetchWebPresence(companyName, website).catch(() => []),
    ]);
    const combined = [...news, ...jobs, ...web];
    return combined.length ? combined : mockSignals(companyName);
  } catch {
    return mockSignals(companyName);
  }
}
