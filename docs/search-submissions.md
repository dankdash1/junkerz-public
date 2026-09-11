# Search submission handoff

Junkerz's IndexNow ownership file is `public/dfa0190d5b0d43aaa6f17f662e990eeb.txt`. After deployment, verify the root URL serves that key as text, then submit only public URLs from the live `https://junkerz.com/sitemap.xml` to `https://api.indexnow.org/indexnow` using `host`, `key`, `keyLocation`, and `urlList` as documented at https://www.indexnow.org/documentation. Never include private quotes, schedules, customer details or buyer pages.

HTTP 200 means URLs received, not indexed. HTTP 202 means key validation pending. Initial submission is performed by the implementation session after live verification; repeat when public pages change. No recurring submission job is installed by this change.

Google Search Console is separate: the existing furniture service account's Google project has Search Console API disabled and denied the attempted API-enable operation on 2026-09-11. A project administrator must enable `searchconsole.googleapis.com`; verified site access must then be checked. Existing Merchant Center access does not imply Search Console or Business Profile ownership.

Google/Apple/Bing business profiles require access to the existing owner accounts. Inspect existing listings before adding any. Public research found a candidate existing Junkerz Maps listing and inconsistent hours across sources, so no business hours or location profile was overwritten.

Deployment of the remote MCP endpoint permits compatible clients to connect. It is not automatic app-directory registration or universal native voice integration. The public `/assistants` guide describes the usable connection and direct website fallback.
