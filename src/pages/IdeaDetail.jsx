import CommentSection from "../components/CommentSection";

const tagColors = {
  AI: "#7c3aed",
  Startup: "#2563eb",
  Tech: "#0f766e",
  Health: "#16a34a",
  Education: "#9333ea",
  Environment: "#15803d",
  Design: "#db2777",
  Finance: "#ca8a04",
};

// Full idea page with voting, save actions, and threaded comments.
function IdeaDetail({
  ideas,
  savedIds,
  selectedIdeaId,
  setCurrentPage,
  onSave,
  onUpvote,
  onDownvote,
  onAddComment,
  onAddReply,
  getVoteState,
}) {
  const idea = ideas.find((item) => item.id === selectedIdeaId);

  if (!idea) {
    return (
      <section className="detail-page">
        <p>Idea not found.</p>
        <button type="button" className="read-more-button" onClick={() => setCurrentPage("home")}>
          Back to feed
        </button>
      </section>
    );
  }

  return (
    <section className="detail-page">
      <h1>{idea.title}</h1>
      <p className="detail-description">{idea.description}</p>

      <div className="detail-meta">
        <div className="idea-card__author">
          <span className="avatar">{idea.avatar}</span>
          <span>
            {idea.author} • {idea.createdAt}
          </span>
        </div>
        <div className="idea-card__tags">
          {idea.tags.map((tag) => (
            <span
              key={`${idea.id}-${tag}`}
              className="tag-pill"
              style={{ backgroundColor: tagColors[tag] || "#475569" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="vote-controls detail-actions">
        <button
          type="button"
          className={`vote-button upvote ${getVoteState(idea.id) === "up" ? "active" : ""}`}
          onClick={() => onUpvote(idea.id)}
        >
          ▲ {idea.upvotes}
        </button>
        <button
          type="button"
          className={`vote-button downvote ${
            getVoteState(idea.id) === "down" ? "active" : ""
          }`}
          onClick={() => onDownvote(idea.id)}
        >
          ▼ {idea.downvotes}
        </button>
        <button
          type="button"
          className={`save-button ${savedIds.includes(idea.id) ? "saved" : ""}`}
          onClick={() => onSave(idea.id)}
        >
          {savedIds.includes(idea.id) ? "★ Saved" : "☆ Save"}
        </button>
      </div>

      <CommentSection idea={idea} onAddComment={onAddComment} onAddReply={onAddReply} />
      <button type="button" className="back-button" onClick={() => setCurrentPage("home")}>
        Back to Home
      </button>
    </section>
  );
}

export default IdeaDetail;
