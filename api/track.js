export default function handler(req, res) {
  const { id } = req.query;

  function detectCourier(id){
    id = (id || "").toUpperCase();

    if (/^D\d{6,}$/.test(id)) return "CityPak";
    if (/^\d{7,}$/.test(id)) return "Koombiyo";
    if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(id)) return "Sri Lanka Post";
    if (id.includes("DMX")) return "Domex";

    return "Unknown";
  }

  res.status(200).json({
    success: true,
    courier: detectCourier(id),
    tracking_id: id,
    status: "API working ✅"
  });
}
