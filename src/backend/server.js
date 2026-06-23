require('dotenv').config()
const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')
const app = express()
app.use(cors())

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST?.includes('render.com')
    ? { rejectUnauthorized: false }
    : false,
})

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
        bbox_west,
        mean_temperature,
        hitzetauglichkeit,
        heat_profile,
        elevation_profile
      FROM trails
      ORDER BY id
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


app.get('/api/trails/:id/gpx', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT trail_name, gpx_file FROM trails WHERE id = $1',
      [req.params.id]
    )
    if (!result.rows.length || !result.rows[0].gpx_file) {
      return res.status(404).json({ error: 'GPX not found' })
    }
    const { trail_name, gpx_file } = result.rows[0]
    const filename = trail_name.replace(/[^a-z0-9]/gi, '_') + '.gpx'
    res.setHeader('Content-Type', 'application/gpx+xml')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(gpx_file)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/trails/:id/kml', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT trail_name, kml_file FROM trails WHERE id = $1',
      [req.params.id]
    )
    if (!result.rows.length || !result.rows[0].kml_file) {
      return res.status(404).json({ error: 'KML not found' })
    }
    const { trail_name, kml_file } = result.rows[0]
    const filename = trail_name.replace(/[^a-z0-9]/gi, '_') + '.kml'
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(kml_file)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || process.env.API_PORT || 3001
app.listen(PORT)
