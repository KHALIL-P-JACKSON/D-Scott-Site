# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

D'Luxe Beauty serves new and returning local nail clients in Stockbridge, GA. Visitors browse services, prices, and nail work before requesting an appointment.

The existing account interface also supports studio administrators editing hours and pricing. This is an implemented role; any additional staff workflows remain undecided.

## Product Purpose

Help local clients understand the studio's services and request a visit. The primary customer outcome is an appointment request that the studio can follow up on, rather than a guaranteed reservation immediately after submission.

## Operating Context

The current site has a home page with service categories, pricing, a nail-photo carousel, reviews, studio information, and an appointment request section. A separate hash route (`#/account`) provides account access.

The implemented customer journey is: browse services, choose a service, sign in or create an account, upload photo ID if required by the current booking gate, and submit a preferred date, time window, and optional notes. Submitted requests require studio confirmation according to the current interface copy.

## Capabilities and Constraints

Implementation facts from the repository:

- React, TypeScript, Vite, Radix UI Themes, and Supabase are already in use. Development starts with `npm run dev`.
- Service categories include acrylic sets, fill ins, gel manicures, custom press-ons, and add-ons. The shared catalog supplies both the menu and the booking options.
- Accounts support email sign-up/sign-in, profile details, and ID uploads. The current booking gate requires a signed-in account with ID status `pending` or `approved`.
- Administrator interfaces edit studio hours and the pricing catalog. These use Supabase with browser-local cached values.
- The site uses hash navigation for its account route. The repository documents GitHub Pages hosting and relative asset paths; a live deployment was not verified during initialization.
- Supabase configuration comes from Vite environment variables. Live backend configuration and policies were not verified during initialization.

Open product decisions:

- Whether sign-in and government-issued photo ID must remain a business requirement for appointment requests.
- The studio's distinctive positioning, staffing model, appointment confirmation process, and any additional admin workflows.
- Whether walk-ins, same-day availability, current hours, and the listed service prices are approved business information.
- Any product-specific accessibility standard or audience needs beyond the implementation's existing support.

## Brand Commitments

The confirmed business name is D'Luxe Beauty, a nail studio in Stockbridge, GA. Repository and technical identifiers use D-Scott or dscott; they do not establish a different public business name.

No additional voice or visual direction was established during initialization.

## Evidence on Hand

Repository content is available for future work, but presence in the code is not proof of authenticity or business approval:

- `src/data/services.ts`: current service catalog, prices, lengths, and add-ons. Prices remain unconfirmed.
- `src/data/heroSlides.ts` and the referenced JPEG files in `public/`: existing nail-photo content and captions. Ownership, provenance, and approval remain unconfirmed.
- `src/data/reviews.ts` and the quote in `src/components/Hero/Hero.tsx`: existing testimonials without independently confirmed provenance.
- `src/components/Hero/Hero.tsx`: claims including 4.9 stars, 350+ reviews, 10+ years of experience, and clean/non-toxic formulations remain unconfirmed.
- `src/components/Perks/Perks.tsx`: product formulations, sanitation practices, complimentary drinks, and consultation claims remain unconfirmed.
- `src/components/AnnouncementBar/AnnouncementBar.tsx`: the 15% first-visit offer and `GLOW15` code remain unconfirmed.
- `src/components/Footer/Footer.tsx` and `src/components/Booking/Booking.tsx`: phone, email, social handle, and other contact details remain unconfirmed. The confirmed locality is Stockbridge, GA; no street address was established.
- Footer privacy and terms links currently point to `#`; approved policy documents have not been established.

Do not promote unconfirmed content into verified product truth, invent supporting evidence, or add business claims. Confirm factual replacements with the user before changing customer-facing content.

## Product Principles

- Help clients understand services and prices before requesting a visit.
- Keep service selection and booking information consistent through the shared catalog.
- Distinguish an appointment request from a confirmed appointment.
- Preserve the confirmed business identity and locality; keep uncertain claims and contact information explicitly unconfirmed.
