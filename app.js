const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

let articles = [];
const FILE_PATH = "./articles.json";

if (fs.existsSync(FILE_PATH)) {
  const data = fs.readFileSync(FILE_PATH, "utf-8");
  articles = JSON.parse(data);
}

const saveArticles = () => {
  fs.writeFileSync(FILE_PATH, JSON.stringify(articles, null, 2));
};

app.post("/articles", (req, res) => {
  const { title, content, tags } = req.body;
  if (!title || !content || !tags) {
    return res
      .status(400)
      .json({ error: "Title, content, and tags are required." });
  }

  const id = articles.length + 1;
  const newArticle = {
    id,
    title,
    content,
    tags,
    date: new Date().toISOString(),
  };
  articles.push(newArticle);
  saveArticles();

  res
    .status(201)
    .json({ message: "Article added successfully.", article: newArticle });
});

app.get("/articles/search", (req, res) => {
  const { keyword, tag, sortBy = "relevance" } = req.query;

  if (!keyword && !tag) {
    return res
      .status(400)
      .json({ error: "Keyword or tag is required for searching." });
  }

  let results = articles.filter((article) => {
    const keywordMatch = keyword
      ? article.title.includes(keyword) || article.content.includes(keyword)
      : true;
    const tagMatch = tag ? article.tags.includes(tag) : true;
    return keywordMatch && tagMatch;
  });

  if (sortBy === "relevance" && keyword) {
    results.sort((a, b) => {
      const freqA =
        (a.title.match(new RegExp(keyword, "gi")) || []).length +
        (a.content.match(new RegExp(keyword, "gi")) || []).length;
      const freqB =
        (b.title.match(new RegExp(keyword, "gi")) || []).length +
        (b.content.match(new RegExp(keyword, "gi")) || []).length;
      return freqB - freqA;
    });
  } else if (sortBy === "date") {
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  res.json({ results });
});

app.get("/articles/:id", (req, res) => {
  const article = articles.find((a) => a.id === parseInt(req.params.id, 10));
  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }
  res.json({ article });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});