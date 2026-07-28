"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import styles from "./cookie-consent.module.css";

const CONSENT_KEY = "cueful:analytics-consent";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MWDHV6S4";

type ConsentChoice = "accepted" | "rejected";
type ConsentSnapshot = ConsentChoice | "unset" | "loading";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function loadScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function enableGoogleAnalytics() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };

  window.gtag("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  });

  if (!document.getElementById("cueful-gtm")) {
    window.dataLayer.push({
      "gtm.start": Date.now(),
      event: "gtm.js",
    });
    loadScript(
      "cueful-gtm",
      `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`,
    );
  }
}

function disableGoogleAnalytics() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  window.gtag("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
}

function subscribeToConsent(onStoreChange: () => void) {
  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener("cueful:consent-change", handleChange);
  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("cueful:consent-change", handleChange);
  };
}

function getConsentSnapshot(): ConsentSnapshot {
  const saved = window.localStorage.getItem(CONSENT_KEY);
  return saved === "accepted" || saved === "rejected" ? saved : "unset";
}

export function CookieConsent() {
  const choice = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    () => "loading",
  );
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (choice === "accepted") {
      enableGoogleAnalytics();
    } else if (choice === "rejected") {
      disableGoogleAnalytics();
    }
  }, [choice]);

  function saveChoice(nextChoice: ConsentChoice) {
    window.localStorage.setItem(CONSENT_KEY, nextChoice);
    window.dispatchEvent(new Event("cueful:consent-change"));
    setIsEditing(false);
  }

  if (choice === "loading") return null;

  if (choice !== "unset" && !isEditing) {
    return (
      <button
        type="button"
        className={styles.settings}
        onClick={() => setIsEditing(true)}
        aria-label="Change analytics cookie settings"
      >
        Cookie settings
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-labelledby="cookie-consent-title">
      <p className={styles.eyebrow}>YOUR DATA / YOUR CALL</p>
      <h2 className={styles.title} id="cookie-consent-title">
        Help us understand what works?
      </h2>
      <p className={styles.copy}>
        Cueful uses optional Google analytics only when you accept. Essential
        account storage and privacy-friendly Vercel analytics continue to work.{" "}
        <Link href="/privacy#analytics">Read the privacy overview</Link>.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.button} ${styles.accept}`}
          onClick={() => saveChoice("accepted")}
        >
          Accept analytics
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.reject}`}
          onClick={() => saveChoice("rejected")}
        >
          Reject optional analytics
        </button>
      </div>
    </aside>
  );
}
