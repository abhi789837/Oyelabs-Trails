import { Bot, ThumbsDown, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";

import { percent } from "@shared/reports";

import { Card, EmptyState, ErrorState, SkeletonLayout, StatTile } from "@/v5/design";

import { v5AdminApi } from "../api";
import { formatDateTime, isMissing, Page, PageHeader, plainMessage, useLoad, useSlow } from "../parts/common";

/** `/admin/tutor-answers`: how often the lesson tutor's answers helped (👍/👎), and the unhelpful ones. */
export default function TutorAnswersPage() {
  const report = useLoad((signal) => v5AdminApi.tutorQuality(signal));
  const slow = useSlow(report.loading && !report.data);
  const r = report.data;
  const rated = r ? r.helpful + r.unhelpful : 0;

  return (
    <Page>
      <PageHeader title="Tutor answers" description="Learners can mark each answer from the lesson tutor as helpful or not. The ones that didn't help are below, so you can fix the lesson." />
      {report.error && !r ? (
        isMissing(report.error) ? (
          <EmptyState icon={<Bot />} title="The tutor report is coming soon" body="This part of Oyelearn isn't switched on here yet." />
        ) : (
          <ErrorState body={plainMessage(report.error)} onRetry={report.reload} />
        )
      ) : !r ? (
        slow ? <SkeletonLayout variant="stat-row" label="Loading the tutor report" /> : null
      ) : (
        <div className="flex flex-col gap-(--v5-gap)">
          <ul className="grid grid-cols-1 gap-(--v5-gap) sm:grid-cols-3">
            <li>
              <StatTile label="Answers given" value={r.total} detail={`${r.last7Days} in the last 7 days`} icon={<Bot />} />
            </li>
            <li>
              <StatTile label="Helpful" value={r.helpful} detail={rated ? `${percent(r.helpful, rated)}% of rated answers` : "None rated yet"} icon={<ThumbsUp />} />
            </li>
            <li>
              <StatTile label="Not helpful" value={r.unhelpful} detail={`${r.unrated} not rated`} icon={<ThumbsDown />} />
            </li>
          </ul>
          <section aria-labelledby="unhelpful">
            <h2 id="unhelpful" className="mb-2 font-display text-h4 font-semibold">
              Answers that didn't help
            </h2>
            {r.unhelpfulAnswers.length === 0 ? (
              <p className="text-small text-fg-2">None yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {r.unhelpfulAnswers.map((a) => (
                  <li key={a.id}>
                    <Card className="flex flex-col gap-1.5 text-small">
                      <p className="text-fg-2">
                        {a.learnerName} in{" "}
                        <Link className="text-brand-fg underline-offset-4 hover:underline" to={`/learn/lesson/${encodeURIComponent(a.topicId)}`}>
                          {a.topicTitle}
                        </Link>{" "}
                        · {formatDateTime(a.createdAt)}
                      </p>
                      <p>
                        <span className="font-semibold">Asked: </span>
                        {a.question}
                      </p>
                      <p className="whitespace-pre-line text-fg-2">
                        <span className="font-semibold text-fg-1">Answer: </span>
                        {a.answer}
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Page>
  );
}
