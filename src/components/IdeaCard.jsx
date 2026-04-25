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

function getCommentCount(comments) {
  return comments.reduce((total, comment) => total + 1 + comment.replies.length, 0);
}

// Reusable idea preview card for feed and saved lists.
function IdeaCard({
  idea,
  isSaved,
  onSave,
  onUpvote,
  onDownvote,
  voteState,
  onReadMore,
}) {
  return (
    <article className="idea-card">
      <div className="idea-card__header">
        <h3>{idea.title}</h3>
        <p>{idea.description}</p>
      </div>

      <div className="idea-card__author">
        <span className="avatar">{idea.avatar}</span>
        <span>{idea.author}</span>
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

      <div className="idea-card__footer">
        <div className="vote-controls">
          <button
            type="button"
            className={`vote-button upvote ${voteState === "up" ? "active" : ""}`}
            onClick={() => onUpvote(idea.id)}
          >
            ▲ {idea.upvotes}
          </button>
          <button
            type="button"
            className={`vote-button downvote ${voteState === "down" ? "active" : ""}`}
            onClick={() => onDownvote(idea.id)}
          >
            ▼ {idea.downvotes}
          </button>
          <button
            type="button"
            className={`save-button ${isSaved ? "saved" : ""}`}
            onClick={() => onSave(idea.id)}
          >
            {isSaved ? "★ Saved" : "☆ Save"}
          </button>
        </div>
        <div className="idea-card__meta">
          <span>💬 {getCommentCount(idea.comments)}</span>
          <button
            type="button"
            className="read-more-button"
            onClick={() => onReadMore(idea.id)}
          >
            Read more
          </button>
        </div>
      </div>
    </article>
  );
}

export default IdeaCard;
