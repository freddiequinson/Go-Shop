const express = require("express")
const path = require("path")

const app = express()
const PORT = process.env.PORT || 3001

const viewsDir = path.join(__dirname, "views")
const publicDir = path.join(__dirname, "public")

app.set("view engine", "ejs")
app.set("views", viewsDir)
app.use(express.static(publicDir))

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true })
})

app.get("/", (req, res) => {
  res.render("index")
})

app.listen(PORT, () => {
  console.log(`Launch EJS service running at http://localhost:${PORT}`)
})
