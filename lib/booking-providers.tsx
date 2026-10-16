import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import SvgIcon from "@mui/material/SvgIcon";
import type { ReactNode } from "react";

/**
 * Official provider marks, traced from each vendor's brand kit.
 *
 * Rendered through SvgIcon rather than a raw <svg> so they size and inherit
 * colour exactly like the MUI icons they replace — inside a Button's startIcon,
 * in the public link tile, anywhere else.
 */
function CalendlyMark() {
  return (
    <SvgIcon viewBox="0 0 24 24" fontSize="small" aria-hidden>
      <path d="M19.655 14.262c.281 0 .557.023.828.064 0 .005-.005.01-.005.014-.105.267-.234.534-.381.786l-1.219 2.106c-1.112 1.936-3.177 3.127-5.411 3.127h-2.432c-2.23 0-4.294-1.191-5.412-3.127l-1.218-2.106a6.251 6.251 0 0 1 0-6.252l1.218-2.106C6.736 4.832 8.8 3.641 11.035 3.641h2.432c2.23 0 4.294 1.191 5.411 3.127l1.219 2.106c.147.252.271.519.381.786 0 .004.005.009.005.014-.267.041-.543.064-.828.064-1.816 0-2.501-.607-3.291-1.306-.764-.676-1.711-1.517-3.44-1.517h-1.029c-1.251 0-2.387.455-3.2 1.278-.796.805-1.233 1.904-1.233 3.099v1.411c0 1.196.437 2.295 1.233 3.099.813.823 1.949 1.278 3.2 1.278h1.034c1.729 0 2.676-.841 3.439-1.517.791-.703 1.471-1.306 3.287-1.301Zm.005-3.237c.399 0 .794-.036 1.179-.11-.002-.004-.002-.01-.002-.014-.073-.414-.193-.823-.349-1.218.731-.12 1.407-.396 1.986-.819 0-.004-.005-.013-.005-.018-.331-1.085-.832-2.101-1.489-3.03-.649-.915-1.435-1.719-2.331-2.395-1.867-1.398-4.088-2.138-6.428-2.138-1.448 0-2.855.28-4.175.841-1.273.543-2.423 1.315-3.407 2.299S2.878 6.552 2.341 7.83c-.557 1.324-.842 2.726-.842 4.175 0 1.448.281 2.855.842 4.174.542 1.274 1.314 2.423 2.298 3.407s2.129 1.761 3.407 2.299c1.324.556 2.727.841 4.175.841 2.34 0 4.561-.74 6.428-2.137a10.815 10.815 0 0 0 2.331-2.396c.652-.929 1.158-1.949 1.489-3.03 0-.004.005-.014.005-.018-.579-.423-1.255-.699-1.986-.819.161-.395.276-.804.349-1.218.005-.009.005-.014.005-.023.869.166 1.692.506 2.404 1.035.685.505.552 1.075.446 1.416C22.184 20.437 17.619 24 12.221 24c-6.625 0-12-5.375-12-12s5.37-12 12-12c5.398 0 9.963 3.563 11.471 8.464.106.341.239.915-.446 1.421-.717.529-1.535.873-2.404 1.034.128.716.128 1.45 0 2.166-.387-.074-.782-.11-1.182-.11-4.184 0-3.968 2.823-6.736 2.823h-1.029c-1.899 0-3.15-1.357-3.15-3.095v-1.411c0-1.738 1.251-3.094 3.15-3.094h1.034c2.768 0 2.552 2.823 6.731 2.827Z" />
    </SvgIcon>
  );
}

function HubSpotMark() {
  return (
    <SvgIcon viewBox="0 0 24 24" fontSize="small" aria-hidden>
      <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z" />
    </SvgIcon>
  );
}

function GoogleCalendarMark() {
  return (
    <SvgIcon viewBox="0 0 24 24" fontSize="small" aria-hidden>
      <path d="M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z" />
    </SvgIcon>
  );
}

export type BookingProvider = {
  id: "calendly" | "cal_com" | "tidycal" | "savvycal" | "hubspot" | "google";
  label: string;
  title: string;
  subtitle: string;
  placeholder: string;
  hostPatterns: string[];
  icon: ReactNode;
  /** True when the public page can safely iframe this scheduler. */
  embeddable: boolean;
};

export const bookingProviders: BookingProvider[] = [
  {
    id: "calendly",
    label: "Calendly",
    title: "Book a call",
    subtitle: "Pick a time on Calendly",
    placeholder: "https://calendly.com/your-name/30min",
    hostPatterns: ["calendly.com"],
    icon: <CalendlyMark />,
    embeddable: true,
  },
  {
    id: "cal_com",
    label: "Cal.com",
    title: "Book a call",
    subtitle: "Schedule with Cal.com",
    placeholder: "https://cal.com/your-name/30min",
    hostPatterns: ["cal.com", "cal.eu"],
    icon: <CalendarMonthRounded fontSize="small" />,
    embeddable: true,
  },
  {
    id: "tidycal",
    label: "TidyCal",
    title: "Book a call",
    subtitle: "Book through TidyCal",
    placeholder: "https://tidycal.com/your-name",
    hostPatterns: ["tidycal.com"],
    icon: <ScheduleRounded fontSize="small" />,
    embeddable: false,
  },
  {
    id: "savvycal",
    label: "SavvyCal",
    title: "Book a call",
    subtitle: "Choose a slot on SavvyCal",
    placeholder: "https://savvycal.com/your-name",
    hostPatterns: ["savvycal.com"],
    icon: <ScheduleRounded fontSize="small" />,
    embeddable: false,
  },
  {
    id: "hubspot",
    label: "HubSpot",
    title: "Book a meeting",
    subtitle: "HubSpot Meetings link",
    placeholder: "https://meetings.hubspot.com/your-name",
    hostPatterns: ["meetings.hubspot.com"],
    icon: <HubSpotMark />,
    embeddable: false,
  },
  {
    id: "google",
    label: "Google",
    title: "Book an appointment",
    subtitle: "Google Appointment Schedule",
    placeholder:
      "https://calendar.google.com/calendar/appointments/schedules/...",
    hostPatterns: ["calendar.app.google", "calendar.google.com"],
    icon: <GoogleCalendarMark />,
    embeddable: false,
  },
];

export function detectBookingProvider(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return (
      bookingProviders.find((provider) =>
        provider.hostPatterns.some(
          (pattern) => host === pattern || host.endsWith(`.${pattern}`),
        ),
      ) ?? null
    );
  } catch {
    return null;
  }
}

export function bookingEmbedUrl(
  url: string,
  providerId: BookingProvider["id"],
) {
  try {
    const parsed = new URL(url);
    if (providerId === "calendly") {
      parsed.searchParams.set("embed_type", "Inline");
      parsed.searchParams.set("hide_gdpr_banner", "1");
      return parsed.toString();
    }
    if (providerId === "cal_com") {
      parsed.searchParams.set("embed", "true");
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

export function isLikelyCompleteBookingUrl(url: string) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 0) return false;
    if (
      segments.some(
        (segment) => segment.includes("your-name") || segment === "...",
      )
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
