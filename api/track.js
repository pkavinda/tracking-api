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

    /* ---------------- SL POST ---------------- */
    if(courier === "slpost"){
      const url = `https://bepost.lk/p/Search/?itemcode=${id}`;
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const status = $("td:contains('Status')").next().text().trim();
      const location = $("td:contains('Location')").next().text().trim();
      const date = $("td:contains('Date')").next().text().trim();

      return res.status(200).json({
        success: true,
        courier: "Sri Lanka Post",
        tracking_id: id,
        status,
        location,
        date
      });
    }

    /* ---------------- KOOMBIYO ---------------- */
    if(courier === "koombiyo"){
      if(!phone){
        return res.status(200).json({ success:false, error:"Phone required" });
      }

      const url = `https://koombiyodelivery.lk/Track/track_id?id=${id}&phone=${phone}`;
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const status = $("label:contains('Status')").next().text().trim();

      return res.status(200).json({
        success: true,
        courier: "Koombiyo",
        tracking_id: id,
        status
      });
    }

    /* ---------------- CITYPAK ---------------- */
    if(courier === "citypak"){
      const url = `https://track.citypak.lk/track?tracking_number=${id}`;
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const status = $("td:contains('Status')").next().text().trim();

      return res.status(200).json({
        success: true,
        courier: "CityPak",
        tracking_id: id,
        status
      });
    }

    /* ---------------- DOMEX ---------------- */
    if(courier === "domex"){
      const url = `https://domex.lk/tracking/?id=${id}`;
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const status = $("td:contains('Status')").next().text().trim();

      return res.status(200).json({
        success: true,
        courier: "Domex",
        tracking_id: id,
        status
      });
    }

    return res.status(200).json({
      success: false,
      error: "Unknown courier"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Tracking failed"
    });
  }
}
