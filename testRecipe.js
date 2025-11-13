import fetch from "node-fetch";

const query = "Jollof Rice";

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/recipes/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HTTP error! Status: ${res.status}, Body: ${errBody}`);
    }

    const data = await res.json();
    console.log("Recipe API response:", data);
  } catch (err) {
    console.error("Error calling API:", err);
  }
}

test();
