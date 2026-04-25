import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import { initialIdeas } from "./data/ideas";
import Home from "./pages/Home";
import IdeaDetail from "./pages/IdeaDetail";
import Saved from "./pages/Saved";
import SubmitIdea from "./pages/SubmitIdea";

// Root app container with global state and route wiring.
function App() {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [savedIds, setSavedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [votesByIdea, setVotesByIdea] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedIdeaId, setSelectedIdeaId] = useState(null);

  useEffect(() => {
    document.title = "MindShare";
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  const handleUpvote = (id) => {
    const currentVote = votesByIdea[id];

    setIdeas((currentIdeas) =>
      currentIdeas.map((idea) => {
        if (idea.id !== id) {
          return idea;
        }
        if (currentVote === "up") {
          return { ...idea, upvotes: Math.max(idea.upvotes - 1, 0) };
        }
        if (currentVote === "down") {
          return {
            ...idea,
            upvotes: idea.upvotes + 1,
            downvotes: Math.max(idea.downvotes - 1, 0),
          };
        }
        return { ...idea, upvotes: idea.upvotes + 1 };
      }),
    );

    setVotesByIdea((currentVotes) => ({
      ...currentVotes,
      [id]: currentVote === "up" ? null : "up",
    }));
  };

  const handleDownvote = (id) => {
    const currentVote = votesByIdea[id];

    setIdeas((currentIdeas) =>
      currentIdeas.map((idea) => {
        if (idea.id !== id) {
          return idea;
        }
        if (currentVote === "down") {
          return { ...idea, downvotes: Math.max(idea.downvotes - 1, 0) };
        }
        if (currentVote === "up") {
          return {
            ...idea,
            upvotes: Math.max(idea.upvotes - 1, 0),
            downvotes: idea.downvotes + 1,
          };
        }
        return { ...idea, downvotes: idea.downvotes + 1 };
      }),
    );

    setVotesByIdea((currentVotes) => ({
      ...currentVotes,
      [id]: currentVote === "down" ? null : "down",
    }));
  };

  const handleSave = (id) => {
    setSavedIds((currentSavedIds) =>
      currentSavedIds.includes(id)
        ? currentSavedIds.filter((savedId) => savedId !== id)
        : [...currentSavedIds, id],
    );
  };

  const handleAddComment = (ideaId, commentText) => {
    const trimmed = commentText.trim();
    if (!trimmed) {
      return;
    }

    setIdeas((currentIdeas) =>
      currentIdeas.map((idea) => {
        if (idea.id !== ideaId) {
          return idea;
        }

        const nextCommentId =
          idea.comments.reduce((maxId, comment) => Math.max(maxId, comment.id), 0) + 1;

        return {
          ...idea,
          comments: [
            ...idea.comments,
            {
              id: nextCommentId,
              author: "You",
              avatar: "YU",
              text: trimmed,
              replies: [],
            },
          ],
        };
      }),
    );
  };

  const handleAddReply = (ideaId, commentId, replyText) => {
    const trimmed = replyText.trim();
    if (!trimmed) {
      return;
    }

    setIdeas((currentIdeas) =>
      currentIdeas.map((idea) => {
        if (idea.id !== ideaId) {
          return idea;
        }

        return {
          ...idea,
          comments: idea.comments.map((comment) => {
            if (comment.id !== commentId) {
              return comment;
            }
            const nextReplyId =
              comment.replies.reduce((maxId, reply) => Math.max(maxId, reply.id), 0) + 1;
            return {
              ...comment,
              replies: [
                ...comment.replies,
                {
                  id: nextReplyId,
                  author: "You",
                  avatar: "YU",
                  text: trimmed,
                },
              ],
            };
          }),
        };
      }),
    );
  };

  const handleSubmitIdea = (newIdea) => {
    setIdeas((currentIdeas) => {
      const nextIdeaId = currentIdeas.reduce((maxId, idea) => Math.max(maxId, idea.id), 0) + 1;
      const today = new Date().toISOString().split("T")[0];
      return [
        {
          id: nextIdeaId,
          title: newIdea.title,
          description: newIdea.description,
          author: newIdea.author,
          avatar: newIdea.avatar,
          tags: newIdea.tags,
          upvotes: 0,
          downvotes: 0,
          savedBy: [],
          comments: [],
          createdAt: today,
        },
        ...currentIdeas,
      ];
    });
  };

  const getVoteState = (ideaId) => votesByIdea[ideaId] || null;

  const openIdeaDetail = (ideaId) => {
    setSelectedIdeaId(ideaId);
    setCurrentPage("detail");
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    if (page !== "detail") {
      setSelectedIdeaId(null);
    }
  };

  let currentView = null;
  if (currentPage === "saved") {
    currentView = (
      <Saved
        ideas={ideas}
        savedIds={savedIds}
        searchTerm={searchTerm}
        onSave={handleSave}
        onUpvote={handleUpvote}
        onDownvote={handleDownvote}
        getVoteState={getVoteState}
        onReadMore={openIdeaDetail}
      />
    );
  } else if (currentPage === "submit") {
    currentView = <SubmitIdea onSubmitIdea={handleSubmitIdea} />;
  } else if (currentPage === "detail") {
    currentView = (
      <IdeaDetail
        ideas={ideas}
        savedIds={savedIds}
        selectedIdeaId={selectedIdeaId}
        setCurrentPage={setCurrentPage}
        onSave={handleSave}
        onUpvote={handleUpvote}
        onDownvote={handleDownvote}
        onAddComment={handleAddComment}
        onAddReply={handleAddReply}
        getVoteState={getVoteState}
      />
    );
  } else {
    currentView = (
      <Home
        ideas={ideas}
        searchTerm={searchTerm}
        savedIds={savedIds}
        onSave={handleSave}
        onUpvote={handleUpvote}
        onDownvote={handleDownvote}
        getVoteState={getVoteState}
        onReadMore={openIdeaDetail}
      />
    );
  }

  return (
    <div className="app-shell">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={goToPage}
        setSelectedIdeaId={setSelectedIdeaId}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <main className="page-content">{currentView}</main>
    </div>
  );
}

export default App;
