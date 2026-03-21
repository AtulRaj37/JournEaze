const waypointsStr = "32.2396,77.1887|32.2400,77.1900";
const tagKey = "amenity";
const tagVal = "pharmacy";

const waypoints = waypointsStr.split('|').map(w => w.split(',').map(Number));
const wpToUse = waypoints.slice(0, 15);
const statements = wpToUse.map(wp => `node["${tagKey}"="${tagVal}"](around:2500,${wp[0]},${wp[1]});`).join('\n      ');

const overpassQuery = `
  [out:json][timeout:25];
  (
    ${statements}
  );
  out body 50;
`;
console.log("Query:");
console.log(overpassQuery);

fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: `data=${encodeURIComponent(overpassQuery)}`
})
.then(res => res.text().then(text => console.log(res.status, text)));
