import { useState, useEffect } from "react";
import React from "react";
import { Together } from "together-ai";

const together = new Together({
  apiKey: import.meta.env.VITE_TOGETHER_AI_API_KEY,
});

export default function App() {
  const storedTheme = localStorage.getItem("theme") || "light";
  const [theme, setTheme] = useState(storedTheme);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dateIdeas, setDateIdeas] = useState([]);
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favorites")) || []
  );
  const [userIdea, setUserIdea] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const fetchIdeas = async (category) => {
    setLoading(true);
    try {
      const stream = await together.chat.completions.create({
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        messages: [{ role: "user", content: `Give me 3 creative date ideas for: ${category}` }],
        stream: true,
      });

      let responseText = "";
      for await (const chunk of stream) {
        responseText += chunk.choices[0]?.delta?.content || "";
      }

      const ideas = responseText
        .split("\n")
        .filter((idea) => idea.trim() !== "")
        .map((idea, index) => ({ id: Date.now() + index, text: idea.trim(), category }));

      setDateIdeas(ideas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      alert("Failed to fetch ideas. Check API key.");
    }
    setLoading(false);
  };

  const addToFavorites = (idea) => {
    if (!favorites.some((fav) => fav.id === idea.id)) {
      const updatedFavorites = [...favorites, idea];
      setFavorites(updatedFavorites);
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    }
  };

  const removeFromFavorites = (id) => {
    const updatedFavorites = favorites.filter((idea) => idea.id !== id);
    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const shareIdea = (text) => {
    if (navigator.share) {
      navigator.share({ title: "Date Idea 💖", text });
    } else {
      alert("Sharing not supported on this device.");
    }
  };

  const addUserIdea = () => {
    if (userIdea.trim() !== "") {
      const newIdea = { id: Date.now(), text: userIdea.trim(), category: "User Submitted" };
      setDateIdeas([newIdea, ...dateIdeas]);
      setUserIdea("");
    }
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"} flex flex-col items-center py-10 px-4 sm:px-8 md:px-16`}>
      <h1 className="text-2xl sm:text-3xl font-bold text-center">💖 Valentine’s Date Night Idea Generator</h1>

      {/* Dark Mode Toggle */}
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="mt-4 px-4 py-2 bg-pink-500 dark:bg-yellow-500 text-white dark:text-black rounded-lg w-full sm:w-auto">
        Toggle {theme === "light" ? "Dark" : "Light"} Mode
      </button>

      {/* Category Selection */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {["All", "Indoor", "Outdoor", "Budget"].map((category) => (
          <button key={category} onClick={() => { setSelectedCategory(category); fetchIdeas(category); }} className={`px-4 py-2 rounded-lg ${selectedCategory === category ? "bg-pink-600 text-white" : "bg-gray-300 dark:bg-gray-700 text-black dark:text-white"}`}>
            {category}
          </button>
        ))}
      </div>

      {/* User-submitted Idea */}
      <div className="mt-6 flex flex-col items-center w-full max-w-md">
        <input type="text" placeholder="Suggest your own date idea..." className="w-full p-3 rounded-lg border border-gray-400 dark:border-gray-600 dark:bg-gray-800 text-black dark:text-white" value={userIdea} onChange={(e) => setUserIdea(e.target.value)} />
        <button onClick={addUserIdea} className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg w-full sm:w-auto">Submit Your Idea</button>
      </div>

      {/* Loading State */}
      {loading && <p className="mt-4 text-lg animate-pulse">Fetching ideas... 💡</p>}

      {/* Display Date Ideas */}
      <div className="mt-6 w-full max-w-lg">
        {dateIdeas.length > 0 ? dateIdeas.map((idea) => (
          <div key={idea.id} className="p-4 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-lg mb-3 flex justify-between items-center">
            <span className="text-black dark:text-white">{idea.text}</span>
            <button onClick={() => addToFavorites(idea)}>❤️</button>
          </div>
        )) : <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">No ideas yet! Select a category. 😊</p>}
      </div>

      {/* Favorites Section */}
      <h2 className="text-xl mt-8">❤️ Favorite Ideas</h2>
      <div className="mt-4 w-full max-w-lg">
        {favorites.length > 0 ? favorites.map((idea) => (
          <div key={idea.id} className="p-4 bg-yellow-100 dark:bg-gray-700 rounded-lg shadow-lg mb-3 flex justify-between items-center">
            <span className="text-black dark:text-white">{idea.text}</span>
            <div className="flex gap-2">
              <button onClick={() => copyToClipboard(idea.text)}>📋</button>
              <button onClick={() => shareIdea(idea.text)}>📤</button>
              <button onClick={() => removeFromFavorites(idea.id)}>❌</button>
            </div>
          </div>
        )) : <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">No favorites yet! ❤️</p>}
      </div>
    </div>
  );
}
