import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  fetchApplicationChat,
  sendApplicationChatMessage,
  type Application,
  type AuthResponse,
  type ChatMessage,
} from "./api";

type Props = {
  application: Application;
  user: AuthResponse["user"];
  onClose: () => void;
  onMessagesRead: (applicationId: string) => void;
};

function authorLabel(message: ChatMessage): string {
  const name = [message.author.firstName, message.author.lastName].filter(Boolean).join(" ");
  return name || (message.author.role === "CASEWORKER" ? "Sachbearbeitung" : "Bürgerkonto");
}

export function ApplicationChat({ application, user, onClose, onMessagesRead }: Props): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const refreshMessages = useCallback(async () => {
    setIsRefreshing(true);
    setError("");
    try {
      const response = await fetchApplicationChat(application.id, user.role);
      setMessages(response.messages);
      onMessagesRead(application.id);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Nachrichten konnten nicht geladen werden.");
    } finally {
      setIsRefreshing(false);
    }
  }, [application.id, onMessagesRead, user.role]);

  useEffect(() => {
    void refreshMessages();
    const interval = window.setInterval(() => void refreshMessages(), 30_000);
    return () => window.clearInterval(interval);
  }, [refreshMessages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) {
      return;
    }
    setIsSending(true);
    setError("");
    try {
      const response = await sendApplicationChatMessage(application.id, user.role, body);
      setMessages((current) => [...current, response.message]);
      setDraft("");
      onMessagesRead(application.id);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Nachricht konnte nicht gesendet werden.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="section chat-shell">
      <div className="detail-head">
        <div>
          <h2>Nachrichten zum Antrag</h2>
          <p>
            {application.type === "RESIDENCE_CHANGE"
              ? "Wohnsitz ummelden"
              : application.type === "DOG_TAX"
                ? "Hundesteuer anmelden"
                : "Führungszeugnis beantragen"}
          </p>
        </div>
        <button className="ghost-button" type="button" onClick={onClose}>
          Zurück
        </button>
      </div>

      <div className="chat-toolbar">
        <span>Automatische Aktualisierung alle 30 Sekunden</span>
        <button className="ghost-button" type="button" onClick={() => void refreshMessages()} disabled={isRefreshing}>
          {isRefreshing ? "Aktualisiert ..." : "Aktualisieren"}
        </button>
      </div>
      {error ? <div className="message-banner" role="alert">{error}</div> : null}

      <ol className="chat-message-list" aria-live="polite">
        {messages.length === 0 ? <li className="muted">Noch keine Nachrichten vorhanden.</li> : null}
        {messages.map((message) => (
          <li
            className={`chat-message ${message.authorId === user.id ? "own" : "incoming"}`}
            key={message.id}
          >
            <div className="chat-message-meta">
              <strong>{authorLabel(message)}</strong>
              <time dateTime={message.createdAt}>
                {new Date(message.createdAt).toLocaleString("de-DE")}
              </time>
            </div>
            <p>{message.body}</p>
          </li>
        ))}
      </ol>

      <form className="chat-form" onSubmit={handleSubmit}>
        <label className="field">
          Nachricht
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={2000}
            rows={4}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={isSending || !draft.trim()}>
          {isSending ? "Wird gesendet ..." : "Nachricht senden"}
        </button>
      </form>
    </section>
  );
}
