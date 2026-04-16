import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const { id, phone } = req.query;

  function detectCourier(id){
    id = (id || "").toUpperCase();

    if (/^D\d{6,}$/.test(id)) return "citypak";
    if (/^\d{7,}$/.test(id)) return "koombiyo";
    if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(id)) return "slpost";
    if (id.includes("DMX")) return "domex";

    return "unknown";
  }

  try {
    const courier = detectCourier(id);

    /* ================= SL POST (REAL FIX) ================= */
if(courier === "slpost"){
  const url = "https://bepost.lk/p/Search/";

  try {
    const response = await axios.post(url,
      new URLSearchParams({
        itemcode: id
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
          "Origin": "https://bepost.lk",
          "Referer": "https://bepost.lk/p/Search/"
        }
      }
    );

    const $ = cheerio.load(response.data);

    const status = $("td:contains('Status')").next().text().trim();
    const location = $("td:contains('Location')").next().text().trim();
    const date = $("td:contains('Date')").next().text().trim();

    if(status){
      return res.status(200).json({
        success: true,
        courier: "Sri Lanka Post",
        tracking_id: id,
        status,
        location,
        date
      });
    }

  } catch (e) {}

  // fallback
  return res.status(200).json({
    success: true,
    courier: "Sri Lanka Post",
    tracking_id: id,
    status: "View tracking details",
    tracking_url: "https://bepost.lk/p/Search/"
  });
}

    /* ================= KOOMBIYO ================= */
    if(courier === "koombiyo"){
      if(!phone){
        return res.status(200).json({
          success: false,
          error: "Phone required"
        });
      }

      try {
        const url = `https://koombiyodelivery.lk/Track/track_id?id=${id}&phone=${phone}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const status = $("label:contains('Status')").next().text().trim();

        return res.status(200).json({
          success: true,
          courier: "Koombiyo",
          tracking_id: id,
          status: status || "In Transit"
        });

      } catch {
        return res.status(200).json({
          success: false,
          error: "Koombiyo tracking failed"
        });
      }
    }

    /* ================= CITYPAK ================= */
    if(courier === "citypak"){
      return res.status(200).json({
        success: true,
        courier: "CityPak",
        tracking_id: id,
        status: "View tracking details",
        tracking_url: `https://track.citypak.lk/track?tracking_number=${id}`
      });
    }

    /* ================= DOMEX ================= */
    if(courier === "domex"){
      try {
        const url = `https://domex.lk/tracking/?id=${id}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const status = $("td:contains('Status')").next().text().trim();

        return res.status(200).json({
          success: true,
          courier: "Domex",
          tracking_id: id,
          status: status || "In Transit"
        });

      } catch {
        return res.status(200).json({
          success: false,
          error: "Domex tracking failed"
        });
      }
    }

    /* ================= UNKNOWN ================= */
    return res.status(200).json({
      success: false,
      error: "Unknown courier"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
}
