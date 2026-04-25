// Global top navigation with route links and real-time search.
function Navbar({
  currentPage,
  setCurrentPage,
  setSelectedIdeaId,
  darkMode,
  setDarkMode,
  searchTerm,
  onSearchChange,
}) {
  const goToPage = (page) => {
    setSelectedIdeaId(null);
    setCurrentPage(page);
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <button type="button" className="brand-button" onClick={() => goToPage("home")}>
          MindShare
        </button>
      </div>
      <nav className="navbar__links">
        <button
          type="button"
          className={`nav-link ${currentPage === "home" ? "active" : ""}`}
          onClick={() => goToPage("home")}
        >
          Home
        </button>
        <button
          type="button"
          className={`nav-link ${currentPage === "saved" ? "active" : ""}`}
          onClick={() => goToPage("saved")}
        >
          Saved
        </button>
        <button
          type="button"
          className={`nav-link ${currentPage === "submit" ? "active" : ""}`}
          onClick={() => goToPage("submit")}
        >
          Submit Idea
        </button>
      </nav>
      <div className="navbar__right">
        <div className="navbar__search">
          <input
            type="text"
            placeholder="Search ideas..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setDarkMode((currentValue) => !currentValue)}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}

export default Navbar;
