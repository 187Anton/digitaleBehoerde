import { FormEvent, useState } from "react";
import type { ApplicationComment } from "./api";

type Props = {
  comments: ApplicationComment[];
  canWrite?: boolean;
  isSubmitting?: boolean;
  onSubmit?: (body: string) => Promise<boolean>;
};

function authorLabel(comment: ApplicationComment): string {
  const name = [comment.author.firstName, comment.author.lastName].filter(Boolean).join(" ");
  return name || (comment.author.role === "CASEWORKER" ? "Sachbearbeitung" : "Bürgerkonto");
}

export function ApplicationCommentThread({
  comments,
  canWrite = false,
  isSubmitting = false,
  onSubmit,
}: Props): JSX.Element {
  const [draft, setDraft] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !onSubmit) {
      return;
    }
    if (await onSubmit(body)) {
      setDraft("");
    }
  }

  return (
    <section className="comment-thread" aria-label="Kommentare zum Antrag">
      <h4>Kommentare</h4>
      {comments.length === 0 ? (
        <p className="muted">Noch keine Kommentare vorhanden.</p>
      ) : (
        <ol className="comment-list">
          {comments.map((comment) => (
            <li key={comment.id}>
              <div className="comment-meta">
                <strong>{authorLabel(comment)}</strong>
                <time dateTime={comment.createdAt}>
                  {new Date(comment.createdAt).toLocaleString("de-DE")}
                </time>
              </div>
              <p>{comment.body}</p>
            </li>
          ))}
        </ol>
      )}

      {canWrite ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <label className="field">
            Kommentar an den Bürger
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              rows={3}
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={isSubmitting || !draft.trim()}>
            Kommentar senden
          </button>
        </form>
      ) : null}
    </section>
  );
}
