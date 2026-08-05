import { Star } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { googleMapsSearchUrl } from "@/lib/site"

// Places API (New). The key must stay server-side, so this component is only
// ever rendered on the server.
const apiKey = process.env.GOOGLE_PLACES_API_KEY
const placeId = process.env.GOOGLE_PLACE_ID

type PlaceReview = {
  name: string
  rating?: number
  relativePublishTimeDescription?: string
  text?: { text?: string }
  originalText?: { text?: string }
  authorAttribution?: {
    displayName?: string
    uri?: string
    photoUri?: string
  }
}

type PlaceDetails = {
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  reviews?: PlaceReview[]
}

async function fetchPlaceDetails(): Promise<PlaceDetails | null> {
  if (!apiKey || !placeId) return null

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=nl&regionCode=NL`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "rating,userRatingCount,googleMapsUri,reviews",
        },
        // Reviews change slowly and the API bills per call, so serve a cached
        // copy and refresh it hourly.
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) {
      console.error(
        "[google-reviews] Places API antwoordde met",
        response.status,
        await response.text()
      )
      return null
    }

    return (await response.json()) as PlaceDetails
  } catch (error) {
    // A review widget is never worth taking the page down for.
    console.error("[google-reviews] ophalen mislukt", error)
    return null
  }
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating)

  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`${rating.toFixed(1)} van 5 sterren`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={
            index < rounded
              ? "size-3.5 fill-foreground text-foreground"
              : "size-3.5 text-muted-foreground/40"
          }
        />
      ))}
    </span>
  )
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export async function GoogleReviews() {
  const place = await fetchPlaceDetails()
  const reviews = (place?.reviews ?? []).slice(0, 3)

  if (reviews.length === 0) {
    // Either the env vars are missing or Google returned nothing usable. Point
    // visitors at Google directly rather than showing them an empty section —
    // the reason belongs in the server log, not on the page.
    if (!apiKey || !placeId) {
      console.warn(
        "[google-reviews] GOOGLE_PLACES_API_KEY en/of GOOGLE_PLACE_ID ontbreken; reviews worden niet opgehaald."
      )
    }

    return (
      <p className="rounded-xl border p-6 text-sm leading-relaxed text-muted-foreground">
        Onze beoordelingen staan op Google.{" "}
        <a
          href={googleMapsSearchUrl}
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-4"
        >
          Bekijk ze daar
        </a>
        .
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {typeof place?.rating === "number" && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-3xl font-medium tracking-tight tabular-nums">
            {place.rating.toFixed(1)}
          </span>
          <Stars rating={place.rating} />
          {place.userRatingCount ? (
            <span className="text-sm text-muted-foreground">
              {place.userRatingCount} beoordelingen op Google
            </span>
          ) : null}
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => {
          const author = review.authorAttribution?.displayName ?? "Google-gebruiker"
          const body = review.text?.text ?? review.originalText?.text ?? ""

          return (
            <li
              key={review.name}
              className="flex flex-col gap-4 rounded-xl border p-5"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  {review.authorAttribution?.photoUri ? (
                    <AvatarImage
                      src={review.authorAttribution.photoUri}
                      alt=""
                    />
                  ) : null}
                  <AvatarFallback>{initialsOf(author)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  {/* Google's terms require the review to be attributed to its
                      author, linking back to their Google profile. */}
                  {review.authorAttribution?.uri ? (
                    <a
                      href={review.authorAttribution.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {author}
                    </a>
                  ) : (
                    <p className="truncate text-sm font-medium">{author}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {review.relativePublishTimeDescription}
                  </p>
                </div>
              </div>

              {typeof review.rating === "number" && (
                <Stars rating={review.rating} />
              )}

              {body ? (
                <p className="line-clamp-6 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>

      {place?.googleMapsUri ? (
        <a
          href={place.googleMapsUri}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Alle reviews op Google bekijken
        </a>
      ) : null}
    </div>
  )
}
