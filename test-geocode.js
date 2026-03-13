const clientId = "96dHZVzsAuvOMaxQhOmkgXZpEmQ6A5gFz6qysy40x6hJECsJcwzbjXyJmR6VPijfYElLJ4RUmqx02CR89SYLyw==";
const clientSecret = "lrFxI-iSEg8j2U4nKYAvd825bWCzu9kFdVJoJL5bfD9ZvfvuL7dgYHxP4a1U_UQBkrTPJ0jRkAzFD9oNMQe3hildkEHffslc";

async function test() {
  const res = await fetch('https://outpost.mappls.com/api/security/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });
  const data = await res.json();
  
  const geoRes = await fetch(`https://atlas.mappls.com/api/places/geocode?address=Chennai`, {
    headers: { Authorization: `bearer ${data.access_token}` }
  });
  const geoData = await geoRes.json();
  console.log(JSON.stringify(geoData.copResults, null, 2));
}
test();
