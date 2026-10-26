
/* =========================================================
   AU THE STANDARD | HOMEPAGE CONTROLLER
   Latest Stories, Search, Categories, Top Stories,
   and Announcements
   ========================================================= */

const CATEGORY_LABELS = {
  all: "Latest Stories",
  news: "News",
  features: "Features",
  opinion: "Opinion",
  sports: "Sports",
  multimedia: "Multimedia",
  literary: "Literary",
  "science and technology": "Science & Technology",
  community: "Community"
};

const CATEGORY_TAXONOMY = {
  news: [
    "campus news",
    "local news",
    "national news",
    "international news",
    "investigative journalism",
    "press releases",
    "announcements",
    "news writing"
  ],
  features: [
    "feature stories",
    "feature story",
    "feature writing",
    "explainers",
    "student spotlight",
    "campus life",
    "entertainment"
  ],
  opinion: [
    "editorials",
    "editorial",
    "editorial writing",
    "columns",
    "column writing",
    "editorial cartoons"
  ],
  sports: [
    "sports news",
    "sports features",
    "sports feature",
    "sports writing"
  ],
  multimedia: [
    "photojournalism",
    "photo stories",
    "mojo",
    "video journalism",
    "podcast",
    "documentary",
    "infographics",
    "data visualization",
    "digital illustration"
  ],
  literary: [
    "poetry",
    "short story",
    "essay"
  ],
  "science and technology": [
    "science news",
    "technology features",
    "science explainers",
    "science and technology writing"
  ]
};

const storiesGrid = document.querySelector("#sample-stories");
const noResultsMessage = document.querySelector("#no-results");
const loadingMessage = document.querySelector("#articles-loading");
const storiesHeading = document.querySelector("#stories-heading");
const storiesSubtitle = document.querySelector("#stories-subtitle");

const searchToggle = document.querySelector("#search-toggle");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");

const topStoriesContainer = document.querySelector("#top-stories-list");
const announcementsContainer = document.querySelector("#announcements-list");

let publishedArticles = [];
let activeCategory = "all";
let activeSubcategory = "";
let searchTerm = "";

/* -------------------------
   GENERAL HELPERS
------------------------- */

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
}

function getArticleUrl(article) {
  const identifier = article.slug || article.id;

  return `article.html?id=${encodeURIComponent(identifier)}`;
}

function createElement(tag, className = "", text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function makeArticleImage(article, className) {
  const image = document.createElement("img");

  image.className = className;
  image.src = article.cover_image || "images/featured.jpg";
  image.alt = article.title || "THE STANDARD article";
  image.loading = "lazy";

  image.onerror = () => {
    image.onerror = null;
    image.src = "images/featured.jpg";
  };

  return image;
}

function makeArticleLink(article, label = "Read More") {
  const link = createElement("a", "read-more", label);
  link.href = getArticleUrl(article);

  return link;
}

function getArticleCategory(article) {
  return article.category || "News";
}

function getArticleSearchText(article) {
  return [
    article.title,
    article.author,
    article.category,
    article.subcategory,
    article.coverage_level,
    article.excerpt,
    article.content
  ].filter(Boolean).join(" ").toLowerCase();
}

function getMainCategoryKey(category) {
  const normalized = normalizeText(category);

  if (normalized === "science and technology") {
    return "science and technology";
  }

  return normalized;
}

function articleMatchesCategory(article) {
  if (activeCategory === "all" && !activeSubcategory) {
    return true;
  }

  const articleCategory = getMainCategoryKey(article.category);
  const selectedCategory = getMainCategoryKey(activeCategory);
  const articleSubcategory = normalizeText(article.subcategory);

  if (activeSubcategory) {
    return articleSubcategory === normalizeText(activeSubcategory);
  }

  if (articleCategory === selectedCategory) {
    return true;
  }

  // Also match subcategories when navigating by main category.
  const validSubcategories = CATEGORY_TAXONOMY[selectedCategory] || [];

  return validSubcategories.includes(articleSubcategory);
}

function articleMatchesSearch(article) {
  if (!searchTerm) return true;

  return getArticleSearchText(article).includes(searchTerm);
}

/* -------------------------
   LATEST STORIES
------------------------- */

function renderArticles() {
  if (!storiesGrid) return;

  const filteredArticles = publishedArticles
    .filter(articleMatchesCategory)
    .filter(articleMatchesSearch);

  storiesGrid.replaceChildren();

  filteredArticles.forEach(article => {
    const card = createElement("article", "story-card searchable");
    card.dataset.articleId = article.id;

    const imageLink = document.createElement("a");
    imageLink.href = getArticleUrl(article);
    imageLink.setAttribute("aria-label", `Read ${article.title}`);
    imageLink.append(makeArticleImage(article, "story-image"));

    const content = createElement("div", "card-content");

    const category = createElement(
      "span",
      "category",
      getArticleCategory(article)
    );

    const heading = document.createElement("h3");
    const titleLink = createElement("a", "", article.title);
    titleLink.href = getArticleUrl(article);
    heading.append(titleLink);

    content.append(category, heading);

    if (article.subcategory) {
      content.append(
        createElement("span", "subcategory-label", article.subcategory)
      );
    }

    if (article.coverage_level) {
      content.append(
        createElement("span", "coverage-level", article.coverage_level)
      );
    }

    if (article.excerpt) {
      content.append(
        createElement("p", "story-excerpt", article.excerpt)
      );
    }

    content.append(
      createElement(
        "span",
        "byline",
        article.author ? `BY ${article.author}` : "THE STANDARD"
      ),
      makeArticleLink(article)
    );

    card.append(imageLink, content);
    storiesGrid.append(card);
  });

  if (noResultsMessage) {
    noResultsMessage.hidden = filteredArticles.length > 0;
    noResultsMessage.textContent = searchTerm
      ? "No stories match your search."
      : "No published stories in this category yet.";
  }

  if (storiesHeading) {
    if (activeSubcategory) {
      storiesHeading.textContent = activeSubcategory;
    } else {
      storiesHeading.textContent =
        CATEGORY_LABELS[activeCategory] ||
        activeCategory;
    }
  }

  if (storiesSubtitle) {
    if (searchTerm) {
      storiesSubtitle.textContent = `Search results for "${searchTerm}"`;
    } else if (activeSubcategory) {
      storiesSubtitle.textContent = `Stories filed under ${activeSubcategory}.`;
    } else if (activeCategory !== "all") {
      storiesSubtitle.textContent =
        `Stories filed under ${CATEGORY_LABELS[activeCategory] || activeCategory}.`;
    } else {
      storiesSubtitle.textContent = "The 20 latest published stories.";
    }
  }

  if (loadingMessage) loadingMessage.hidden = true;
}

/* -------------------------
   CATEGORY NAVIGATION
------------------------- */

function selectCategory(category = "all", subcategory = "") {
  activeCategory = getMainCategoryKey(category || "all");
  activeSubcategory = subcategory || "";
  searchTerm = "";

  if (searchInput) searchInput.value = "";

  renderArticles();

  const storiesSection = document.querySelector("#news");

  if (storiesSection) {
    storiesSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

document.querySelectorAll("[data-category], [data-subcategory]").forEach(link => {
  link.addEventListener("click", event => {
    const category = link.dataset.category || "all";
    const subcategory = link.dataset.subcategory || "";

    // Allow the Home link to jump normally.
    if (
      link.getAttribute("href") === "#home" &&
      category === "all"
    ) {
      return;
    }

    event.preventDefault();

    if (subcategory) {
      const parentCategory = Object.keys(CATEGORY_TAXONOMY).find(key =>
        CATEGORY_TAXONOMY[key].includes(normalizeText(subcategory))
      );

      selectCategory(parentCategory || category, subcategory);
    } else {
      selectCategory(category);
    }

    // Close an open dropdown after choosing a category.
    const dropdown = link.closest(".nav-dropdown");

    if (dropdown) {
      const button = dropdown.querySelector(".nav-dropdown-toggle");

      if (button) button.setAttribute("aria-expanded", "false");
      dropdown.classList.remove("is-open");
    }
  });
});


/* -------------------------
   DROPDOWN BUTTONS
   AU THE STANDARD
------------------------- */

const categorySubcategories = {
  "NEWS": [
    ["All News", "News"],
    ["Campus News", "Campus News"],
    ["Local News", "Local News"],
    ["National News", "National News"],
    ["International News", "International News"],
    ["Investigative Journalism", "Investigative Journalism"],
    ["Press Releases", "Press Releases"],
    ["Announcements", "Announcements"]
  ],
  "FEATURES": [
    ["All Features", "Features"],
    ["Feature Stories", "Feature Stories"],
    ["Feature Writing", "Feature Writing"],
    ["Explainers", "Explainers"],
    ["Student Spotlight", "Student Spotlight"],
    ["Campus Life", "Campus Life"],
    ["Entertainment", "Entertainment"]
  ],
  "OPINION": [
    ["All Opinion", "Opinion"],
    ["Editorials", "Editorials"],
    ["Editorial Writing", "Editorial Writing"],
    ["Columns", "Columns"],
    ["Editorial Cartoons", "Editorial Cartoons"]
  ],
  "SPORTS": [
    ["All Sports", "Sports"],
    ["Sports News", "Sports News"],
    ["Sports Features", "Sports Features"],
    ["Sports Writing", "Sports Writing"]
  ],
  "MULTIMEDIA": [
    ["All Multimedia", "Multimedia"],
    ["Photojournalism", "Photojournalism"],
    ["Photo Stories", "Photo Stories"],
    ["MOJO", "MOJO"],
    ["Video Journalism", "Video Journalism"],
    ["Podcast", "Podcast"],
    ["Documentary", "Documentary"],
    ["Infographics", "Infographics"],
    ["Data Visualization", "Data Visualization"],
    ["Digital Illustration", "Digital Illustration"]
  ],
  "LITERARY": [
    ["All Literary", "Literary"],
    ["Poetry", "Poetry"],
    ["Short Story", "Short Story"],
    ["Essay", "Essay"]
  ],
  "SCIENCE & TECHNOLOGY": [
    ["All Science & Technology", "Science and Technology"],
    ["Science News", "Science News"],
    ["Technology Features", "Technology Features"],
    ["Science Explainers", "Science Explainers"],
    ["Science & Technology Writing", "Science & Technology Writing"]
  ]
};

function renderSubcategoryStrip(categoryName) {
  const strip = document.querySelector(".subcategory-strip");
  if (!strip) return;

  const items = categorySubcategories[categoryName] || [];

  strip.replaceChildren();

  const label = document.createElement("span");
  label.className = "subcategory-strip-label";
  label.textContent = "EXPLORE";
  strip.appendChild(label);

  items.forEach(([labelText, categoryValue]) => {
    const link = document.createElement("a");
    link.href = "#news";
    link.textContent = labelText;

    if (labelText.startsWith("All ")) {
      link.dataset.category = categoryValue;
    } else {
      link.dataset.subcategory = categoryValue;
    }

    strip.appendChild(link);
  });

  strip.hidden = items.length === 0;
}

document.querySelectorAll(".nav-dropdown-toggle").forEach(button => {
  button.addEventListener("click", () => {
    const dropdown = button.closest(".nav-dropdown");
    const categoryName = button.textContent
      .replace("⌄", "")
      .trim();

    renderSubcategoryStrip(categoryName);

    document.querySelectorAll(".nav-dropdown").forEach(item => {
      item.classList.remove("is-open");

      const toggle = item.querySelector(".nav-dropdown-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });

    if (dropdown) {
      dropdown.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

// Show News subcategories on initial page load
renderSubcategoryStrip("NEWS");


document.addEventListener("click", event => {
  if (event.target.closest(".nav-dropdown")) return;

  document.querySelectorAll(".nav-dropdown").forEach(dropdown => {
    dropdown.classList.remove("is-open");

    const button = dropdown.querySelector(".nav-dropdown-toggle");

    if (button) button.setAttribute("aria-expanded", "false");
  });
});


/* -------------------------
   SEARCH
------------------------- */

if (searchForm) {
  searchForm.addEventListener("submit", event => {
    event.preventDefault();

    searchTerm = normalizeText(searchInput?.value);
    renderArticles();

    document.querySelector("#news")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    searchTerm = normalizeText(searchInput.value);
    renderArticles();
  });

  searchInput.addEventListener("search", () => {
    searchTerm = normalizeText(searchInput.value);
    renderArticles();
  });
}

/* -------------------------
   TOP STORIES
   Reads up to three monthly editor selections.
------------------------- */

function renderTopStories(rows) {
  if (!topStoriesContainer) return;

  topStoriesContainer.replaceChildren();

  const validStories = (rows || [])
    .filter(row =>
      row.article &&
      row.article.status === "published"
    )
    .sort((a, b) => a.display_order - b.display_order)
    .slice(0, 3);

  if (!validStories.length) {
    topStoriesContainer.append(
      createElement("p", "empty-message", "Top Stories will appear here soon.")
    );
    return;
  }

  validStories.forEach(row => {
    const article = row.article;
    const item = createElement("article", "top-story-item");

    item.append(
      createElement(
        "span",
        "number",
        String(row.display_order).padStart(2, "0")
      )
    );

    const link = document.createElement("a");
    link.className = "top-story-link";
    link.href = getArticleUrl(article);

    link.append(makeArticleImage(article, "top-story-image"));

    const content = createElement("div", "top-story-content");

    content.append(
      createElement("span", "category", getArticleCategory(article)),
      createElement("h3", "", article.title)
    );

    if (article.excerpt) {
      content.append(createElement("p", "", article.excerpt));
    }

    link.append(content);
    item.append(link);
    topStoriesContainer.append(item);
  });
}

async function loadTopStories() {
  if (!topStoriesContainer) return;

  const now = new Date();

  const monthStart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    "01"
  ].join("-");

  const { data, error } = await supabaseClient
    .from("top_stories")
    .select(`
      display_order,
      article:articles (
        id,
        title,
        slug,
        author,
        category,
        subcategory,
        excerpt,
        cover_image,
        status
      )
    `)
    .eq("month_start", monthStart)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Could not load Top Stories:", error.message);
    renderTopStories([]);
    return;
  }

  renderTopStories(data || []);
}

/* -------------------------
   ANNOUNCEMENTS
------------------------- */

function safeAnnouncementUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value, window.location.href);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch {
    // Ignore invalid links.
  }

  return "";
}

function renderAnnouncements(announcements) {
  if (!announcementsContainer) return;

  announcementsContainer.replaceChildren();

  if (!announcements.length) {
    announcementsContainer.append(
      createElement(
        "p",
        "empty-message",
        "There are no active announcements right now."
      )
    );
    return;
  }

  announcements.forEach(announcement => {
    const item = createElement("article", "announcement-item");

    if (announcement.priority > 0) {
      item.classList.add("is-priority");
    }

    item.append(
      createElement("h3", "", announcement.title),
      createElement("p", "", announcement.body || "")
    );

    const url = safeAnnouncementUrl(announcement.link_url);

    if (url) {
      const link = createElement("a", "announcement-link", "Learn More");
      link.href = url;
      link.rel = "noopener noreferrer";
      item.append(link);
    }

    announcementsContainer.append(item);
  });
}

async function loadAnnouncements() {
  if (!announcementsContainer) return;

  const { data, error } = await supabaseClient
    .from("announcements")
    .select("id, title, body, link_url, priority, expires_at, is_active, created_at")
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load announcements:", error.message);
    renderAnnouncements([]);
    return;
  }

  const now = Date.now();

  const activeAnnouncements = (data || []).filter(item => {
    return !item.expires_at ||
      new Date(item.expires_at).getTime() > now;
  });

  renderAnnouncements(activeAnnouncements);
}

/* -------------------------
   LOAD LATEST 20 ARTICLES
------------------------- */

async function loadHomepageArticles() {
  if (loadingMessage) loadingMessage.hidden = false;

  const { data, error } = await supabaseClient
    .from("articles")
    .select(`
      id,
      title,
      slug,
      author,
      category,
      subcategory,
      coverage_level,
      excerpt,
      content,
      cover_image,
      status,
      created_at
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Could not load published articles:", error.message);

    if (storiesGrid) storiesGrid.replaceChildren();

    if (noResultsMessage) {
      noResultsMessage.hidden = false;
      noResultsMessage.textContent =
        "We couldn't load the stories. Please try again later.";
    }

    if (loadingMessage) loadingMessage.hidden = true;
    return;
  }

  publishedArticles = data || [];
  renderArticles();

  console.log(
    "THE STANDARD: Loaded published articles:",
    publishedArticles.length
  );
}

/* -------------------------
   START HOMEPAGE
------------------------- */

async function initializeHomepage() {
  if (!window.supabase || typeof supabaseClient === "undefined") {
    console.error(
      "THE STANDARD: Supabase is not initialized. Check supabase.js and script order."
    );
    return;
  }

  await Promise.allSettled([
    loadHomepageArticles(),
    loadTopStories(),
    loadAnnouncements()
  ]);
}

initializeHomepage();
