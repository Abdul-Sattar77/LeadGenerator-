// ============================================================
//  Google Places (New) data fetcher  -  SERVER ONLY
//  The API key is read from process.env and never sent to the browser.
// ============================================================

const FIELD_MASK = [
  "places.displayName",
  "places.primaryType",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.businessStatus",
  "nextPageToken",
].join(",");

function normalize(p) {
  return {
    name: (p.displayName && p.displayName.text) || "",
    category: p.primaryType || "",
    phone: p.nationalPhoneNumber || p.internationalPhoneNumber || "",
    rating: p.rating != null ? p.rating : null,
    reviews: p.userRatingCount != null ? p.userRatingCount : null,
    website: p.websiteUri || "",
    maps: p.googleMapsUri || "",
    address: p.formattedAddress || "",
    status: p.businessStatus || "",
  };
}

/**
 * Search Google Places by free-text query, following pagination until
 * `maxResults` is reached (Google returns up to 20 per page).
 */
export async function searchPlaces(query, maxResults = 20) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "Server is missing GOOGLE_MAPS_API_KEY. Add it to .env.local and restart."
    );
    err.status = 500;
    throw err;
  }

  let all = [];
  let pageToken;

  do {
    const body = { textQuery: query };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data?.error?.message || "Google API error");
      err.status = res.status;
      err.reason = data?.error?.status || "unknown";
      throw err;
    }

    all = all.concat((data.places || []).map(normalize));
    pageToken = data.nextPageToken;
  } while (pageToken && all.length < maxResults);

  return all.slice(0, maxResults);
}
