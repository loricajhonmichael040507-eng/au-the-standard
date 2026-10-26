
/* =========================================================
   AU THE STANDARD | ARTICLE PAGE CONTROLLER
   Loads published articles from Supabase.
   Supports slug/UUID lookup, subcategories, and coverage level.
   ========================================================= */

const container = document.querySelector("#article-content");

/* -------------------------
   HELPERS
------------------------- */

function createElement(tag, className = "", text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function formatArticleDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function showMessage(titleText, messageText) {
  if (!container) return;

  container.replaceChildren();

  const heading = createElement("h1", "article-title", titleText);
  const message = createElement("p", "article-message", messageText);

  container.append(heading, message);
}

function addMetaItem(parent, label, value) {
  if (!value) return;

  const item = createElement("span", "article-meta-item");
  item.textContent = `${label}: ${value}`;
  parent.appendChild(item);
}

/* -------------------------
   RENDER ARTICLE
------------------------- */

function renderArticle(article) {
  if (!container) return;

  container.replaceChildren();

  // Category and subcategory
  const categoryBlock = createElement("div", "article-taxonomy");

  categoryBlock.append(
    createElement(
      "span",
      "article-category",
      article.category || "News"
    )
  );

  if (article.subcategory) {
    categoryBlock.append(
      createElement(
        "span",
        "article-subcategory",
        article.subcategory
      )
    );
  }

  if (article.coverage_level) {
    categoryBlock.append(
      createElement(
        "span",
        "article-coverage-level",
        `${article.coverage_level} Coverage`
      )
    );
  }

  // Headline
  const title = createElement(
    "h1",
    "article-title",
    article.title || "Untitled article"
  );

  // Excerpt / summary
  const hasExcerpt = Boolean(article.excerpt && article.excerpt.trim());

  const excerpt = hasExcerpt
    ? createElement("p", "article-excerpt", article.excerpt.trim())
    : null;

  // Byline and date
  const meta = createElement("div", "article-meta");

  addMetaItem(meta, "By", article.author || "THE STANDARD");

  const formattedDate = formatArticleDate(article.created_at);
  addMetaItem(meta, "Published", formattedDate);

  // Cover image
  let image = null;

  if (article.cover_image) {
    image = document.createElement("img");
    image.className = "article-hero";
    image.src = article.cover_image;
    image.alt = `Cover image for ${article.title || "this article"}`;
    image.loading = "eager";

    image.addEventListener("error", () => {
      image.remove();
      console.error("The article cover image could not be loaded.");
    });
  }

  // Article body
  const body = createElement("div", "article-body");
  const content = (article.content || "").trim();

  // Split paragraphs while preserving safe plain text.
  const paragraphs = content
    .split(/\n\s*\n/)
    .map(text => text.trim())
    .filter(Boolean);

  if (paragraphs.length) {
    paragraphs.forEach(text => {
      body.appendChild(createElement("p", "", text));
    });
  } else if (hasExcerpt) {
    body.appendChild(createElement("p", "", article.excerpt.trim()));
  } else {
    body.appendChild(
      createElement(
        "p",
        "article-unavailable",
        "The full article content is not available yet."
      )
    );
  }

  // Assemble the page
  container.append(categoryBlock, title, meta);

  if (excerpt) container.appendChild(excerpt);
  if (image) container.appendChild(image);

  container.appendChild(body);
}

/* -------------------------
   LOAD PUBLISHED ARTICLE
------------------------- */

async function loadArticle() {
  if (!container) {
    console.error(
      "THE STANDARD: #article-content was not found in article.html."
    );
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const articleIdentifier = params.get("id");

  if (!articleIdentifier) {
    showMessage(
      "No article selected",
      "Please return to the homepage and select a published story."
    );

    document.title = "Select an Article | AU THE STANDARD";
    return;
  }

  if (
    typeof supabaseClient === "undefined" ||
    !window.supabase
  ) {
    showMessage(
      "Connection unavailable",
      "The article database could not be connected. Please try again later."
    );

    console.error("THE STANDARD: Supabase client is unavailable.");
    return;
  }

  const fields = `
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
  `;

  try {
    let article = null;

    // First, try the article slug.
    const { data: slugArticle, error: slugError } = await supabaseClient
      .from("articles")
      .select(fields)
      .eq("slug", articleIdentifier)
      .eq("status", "published")
      .maybeSingle();

    if (slugError) throw slugError;

    article = slugArticle;

    // If the identifier is a UUID, also try the database ID.
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        .test(articleIdentifier);

    if (!article && isUUID) {
      const { data, error } = await supabaseClient
        .from("articles")
        .select(fields)
        .eq("id", articleIdentifier)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;

      article = data;
    }

    if (!article) {
      showMessage(
        "Article not found",
        "This story may not exist or may not be published yet."
      );

      document.title = "Article Not Found | AU THE STANDARD";
      return;
    }

    renderArticle(article);

    document.title =
      `${article.title || "Article"} | AU THE STANDARD`;

  } catch (error) {
    console.error("THE STANDARD: Unable to load article:", error);

    showMessage(
      "Unable to load article",
      "Something went wrong while loading this story. Please try again later."
    );

    document.title = "Unable to Load Article | AU THE STANDARD";
  }
}

loadArticle();
