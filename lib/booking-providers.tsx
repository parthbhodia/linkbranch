import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import EventAvailableRounded from "@mui/icons-material/EventAvailableRounded";
import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import type { ReactNode } from "react";

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
    icon: <CalendarMonthRounded fontSize="small" />,
    embeddable: true,
  },
  {
    id: "cal_com",
    label: "Cal.com",
    title: "Book a call",
    subtitle: "Schedule with Cal.com",
    placeholder: "https://cal.com/your-name/30min",
    hostPatterns: ["cal.com", "cal.eu"],
    icon: <EventAvailableRounded fontSize="small" />,
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
    icon: <CalendarMonthRounded fontSize="small" />,
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
    icon: <EventAvailableRounded fontSize="small" />,
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
