require('dotenv').config()

const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')

const app = express()
app.use(cors())

// Database connection pool. Credentials are read from environment
// variables (see .env.example) rather than hardcoded, since this file is
// committed to version control.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// Returns land-surface-temperature grid points within the Bamberg area,
// used to render the heatmap overlay on the map.
app.get('/api/heatmap', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT latitude, longitude, mean_lst_celsius
      FROM "Heatmap"
      WHERE latitude BETWEEN 49.67 AND 50.13
      AND longitude BETWEEN 10.58 AND 11.23
      AND mean_lst_celsius BETWEEN 21.29 AND 37.95
      ORDER BY mean_lst_celsius DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Returns all trails with their waypoints, ratings, and bounding boxes.
// Geometry (the PostGIS geom column) is intentionally excluded since the
// frontend consumes the plain waypoints array instead.
app.get('/api/trails', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        trail_name,
        trail_type,
        description,
        waypoints,
        length_km,
        kondition,
        technik,
        erlebniswert,
        bbox_north,
        bbox_south,
        bbox_east,
        bbox_west
      FROM trails
      ORDER BY id
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || process.env.API_PORT || 3001
app.listen(PORT)