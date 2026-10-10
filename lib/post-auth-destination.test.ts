import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DASHBOARD,
  TEMPLATE_PICKER,
  isInternalPath,
  postAuthDestination,
} from "./post-auth-destination.ts";

describe("isInternalPath", () => {
  it("accepts a path on this site", () => {
    assert.equal(isInternalPath("/dashboard"), true);
    assert.equal(isInternalPath("/onboarding?purpose=student"), true);
  });

  it("rejects anything that could leave the origin", () => {
    // Followed straight after authentication, which is when a redirect to
    // someone else's copy of the sign-in page is worth the most.
    assert.equal(isInternalPath("//evil.example"), false);
    assert.equal(isInternalPath("https://evil.example"), false);
    assert.equal(isInternalPath("/\\evil.example"), false, "some browsers read /\\ as //");
    assert.equal(isInternalPath("\\\\evil.example"), false);
  });

  it("rejects absent or empty values rather than throwing", () => {
    assert.equal(isInternalPath(null), false);
    assert.equal(isInternalPath(undefined), false);
    assert.equal(isInternalPath(""), false);
    assert.equal(isInternalPath("templates"), false, "relative, not rooted");
  });
});

describe("postAuthDestination", () => {
  it("sends a finished account to the dashboard, which is the bug this fixes", () => {
    assert.equal(
      postAuthDestination({ requested: TEMPLATE_PICKER, onboardingCompleted: true }),
      DASHBOARD,
    );
  });

  it("still sends an unfinished account to the picker", () => {
    assert.equal(
      postAuthDestination({ requested: TEMPLATE_PICKER, onboardingCompleted: false }),
      TEMPLATE_PICKER,
    );
  });

  it("defaults the same way when no destination was requested at all", () => {
    assert.equal(postAuthDestination({ onboardingCompleted: true }), DASHBOARD);
    assert.equal(postAuthDestination({ onboardingCompleted: false }), TEMPLATE_PICKER);
    assert.equal(
      postAuthDestination({ requested: null, onboardingCompleted: true }),
      DASHBOARD,
    );
  });

  it("never overrides a flow that named somewhere specific", () => {
    // Claim, import and starter-purpose all know something this does not.
    for (const requested of [
      "/claim/apply?token=abc",
      "/onboarding?template=field-notes&import=1",
      "/onboarding?purpose=student",
    ]) {
      assert.equal(
        postAuthDestination({ requested, onboardingCompleted: true }),
        requested,
        `${requested} must survive a finished account`,
      );
      assert.equal(
        postAuthDestination({ requested, onboardingCompleted: false }),
        requested,
      );
    }
  });

  it("falls back to the rule rather than following an off-site next", () => {
    assert.equal(
      postAuthDestination({ requested: "//evil.example", onboardingCompleted: true }),
      DASHBOARD,
    );
    assert.equal(
      postAuthDestination({ requested: "https://evil.example", onboardingCompleted: false }),
      TEMPLATE_PICKER,
    );
  });
});
