"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Button, Typography } from "@mui/material";
import DirectionsRounded from "@mui/icons-material/DirectionsRounded";
import PlaceRounded from "@mui/icons-material/PlaceRounded";
import { directionsUrl, type PublicMapLocation } from "@/lib/map-location";

// Leaflet is ~40KB and touches window on import, so it is split out and only
// loaded in the browser -- and only once the block is near the viewport,
// since most visits to a profile never scroll this far.
const LocationMap = dynamic(
  () => import("@/components/location-map").then((mod) => mod.LocationMap),
  { ssr: false, loading: () => <div className="location-map" aria-hidden="true" /> },
);

export function FindUs({
  location,
  onDirections,
}: {
  location: PublicMapLocation;
  onDirections?: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="content-section find-us"
      aria-labelledby="find-us-heading"
    >
      <div className="section-heading">
        <Typography id="find-us-heading" component="h2" className="section-label">
          Find us
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Directions open in your maps app
        </Typography>
      </div>
      <div className="find-us__card">
        <div className="find-us__map">
          {nearViewport ? (
            <LocationMap pin={location} label={location.label} />
          ) : (
            <div className="location-map" aria-hidden="true" />
          )}
        </div>
        <div className="find-us__copy">
          <PlaceRounded aria-hidden="true" />
          <div>
            <Typography variant="h3">{location.label}</Typography>
            {location.address && (
              <Typography variant="body2" color="text.secondary">
                {location.address}
              </Typography>
            )}
          </div>
          <Button
            component="a"
            href={directionsUrl(location)}
            target="_blank"
            rel="noreferrer"
            variant="contained"
            startIcon={<DirectionsRounded />}
            onClick={onDirections}
          >
            Get directions
          </Button>
        </div>
      </div>
    </section>
  );
}
