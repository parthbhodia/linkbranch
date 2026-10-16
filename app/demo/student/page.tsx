import type { Metadata } from "next";
import { ProfileHub } from "@/components/profile-hub";
import {
  STUDENT_DEMO_RESUME,
  studentDemoProfile,
  studentDemoTimeline,
} from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Student profile demo | Cueful",
  description:
    "An example student page: education and experience with dates, a project explained properly, and a CV attached.",
  alternates: {
    canonical: "/demo/student",
  },
  openGraph: {
    title: "What a student page looks like | Cueful",
    description:
      "Education and experience with dates, projects framed as problem and result, skills, and the CV itself — on one link you can hand over at a careers fair.",
    url: "/demo/student",
    type: "website",
  },
};

/**
 * The student counterpart to /demo.
 *
 * The résumé points at a static sample rather than the signing route: the demo
 * profile has no database row, so there is nothing to sign against, and a
 * button that 404s would undercut the one thing this page exists to show. The
 * sample CV carries no street address, which is the advice the post gives.
 */
export default function StudentDemoPage() {
  return (
    <ProfileHub
      profile={studentDemoProfile}
      timeline={studentDemoTimeline}
      resumeLabel={STUDENT_DEMO_RESUME}
      resumeHref="/demo/jordan-avery-cv.pdf"
    />
  );
}
