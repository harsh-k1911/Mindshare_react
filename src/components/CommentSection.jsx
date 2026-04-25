import { useState } from "react";

// Nested comments UI with add-comment and inline reply actions.
function CommentSection({ idea, onAddComment, onAddReply }) {
  const [commentText, setCommentText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const submitComment = (event) => {
    event.preventDefault();
    if (!commentText.trim()) {
      return;
    }
    onAddComment(idea.id, commentText);
    setCommentText("");
  };

  const submitReply = (event, commentId) => {
    event.preventDefault();
    if (!replyText.trim()) {
      return;
    }
    onAddReply(idea.id, commentId, replyText);
    setReplyText("");
    setActiveReplyId(null);
  };

  return (
    <section className="comment-section">
      <h3>Comments</h3>

      <form className="comment-input" onSubmit={submitComment}>
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
        />
        <button type="submit">Post</button>
      </form>

      <div className="comment-list">
        {idea.comments.length === 0 ? (
          <p className="empty-comments">No comments yet. Be the first to comment!</p>
        ) : (
          idea.comments.map((comment) => (
            <div className="comment-item" key={comment.id}>
              <div className="comment-main">
                <span className="avatar">{comment.avatar}</span>
                <div className="comment-content">
                  <strong>{comment.author}</strong>
                  <p>{comment.text}</p>
                  <button
                    className="reply-button"
                    type="button"
                    onClick={() =>
                      setActiveReplyId((current) =>
                        current === comment.id ? null : comment.id,
                      )
                    }
                  >
                    Reply
                  </button>
                </div>
              </div>

              {activeReplyId === comment.id && (
                <form
                  className="reply-form"
                  onSubmit={(event) => submitReply(event, comment.id)}
                >
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                  />
                  <button type="submit">Send</button>
                </form>
              )}

              {comment.replies.length > 0 && (
                <div className="reply-list">
                  {comment.replies.map((reply) => (
                    <div className="reply-item" key={reply.id}>
                      <span className="avatar">{reply.avatar}</span>
                      <div>
                        <strong>{reply.author}</strong>
                        <p>{reply.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default CommentSection;
