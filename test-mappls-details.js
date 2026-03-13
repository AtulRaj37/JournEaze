const clientId = "96dHZVzsAuvOMaxQhOmkgXZpEmQ6A5gFz6qysy40x6hJECsJcwzbjXyJmR6VPijfYElLJ4RUmqx02CR89SYLyw==";
const clientSecret = "lrFxI-iSEg8j2U4nKYAvd825bWCzu9kFdVJoJL5bfD9ZvfvuL7dgYHxP4a1U_UQBkrTPJ0jRkAzFD9oNMQe3hildkEHffslc";

async function test() {
  const res = await fetch('https://outpost.mappls.com/api/security/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });
  const data = await res.json();
  const token = data.access_token;
  
  // Try place detail via eLoc directly first
  const elocRes = await fetch(`https://atlas.mappls.com/api/places/json?eloc=36F47F`, {
    headers: { Authorization: `bearer ${token}` }
  });
  
  const geoData = await elocRes.json();
  console.log("Place Detail API:", JSON.stringify(geoData, null, 2));

  // Also test geocode again with a different city
  const geoRes2 = await fetch(`https://atlas.mappls.com/api/places/geocode?address=Delhi`, {
    headers: { Authorization: `bearer ${token}` }
  });
  
  const geoData2 = await geoRes2.json();
  console.log("Geocode API Delhi:", JSON.stringify(geoData2, null, 2));

}
test();
