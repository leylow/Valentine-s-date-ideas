import { useState, useEffect } from "react";
import React from "react";
import axios from "axios";

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY; // Secure API Key
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

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
      const response = await axios.post(
        API_URL,
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: `Suggest 3 date ideas for: ${category}` }],
        },
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      );

      const aiIdeas = response.data.choices[0].message.content
        .split("\n")
        .filter((idea) => idea.trim() !== "")
        .map((idea, index) => ({
          id: Date.now() + index,
          text: idea.trim(),
          category,
        }));

      setDateIdeas(aiIdeas);
    } catch (error) {
      console.error("Error fetching ideas:", error);
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

  const addUserIdea = () => {
    if (userIdea.trim() !== "") {
      const newIdea = { id: Date.now(), text: userIdea.trim(), category: "User Submitted" };
      setDateIdeas([newIdea, ...dateIdeas]);
      setUserIdea("");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard! 📋");
  };

  const shareIdea = async (text) => {
    try {
      await navigator.share({ title: "Check out this date idea! 💖", text });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center py-10 px-4 sm:px-8 md:px-16 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <h1 className="text-2xl sm:text-3xl font-bold text-center">💖 Valentine’s Date Night Idea Generator</h1>

      {/* Dark Mode Toggle */}
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="mt-4 px-4 py-2 bg-pink-500 dark:bg-yellow-500 text-white dark:text-black rounded-lg w-full sm:w-auto"
      >
         {theme === "light" ? "Dark" : "Light"} Mode
      </button>

      {/* Category Selection */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {["All", "Indoor", "Outdoor", "Budget"].map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              fetchIdeas(category);
            }}
            className={`px-4 py-2 rounded-lg ${
              selectedCategory === category
                ? "bg-pink-600 text-white"
                : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* User-submitted Idea */}
      <div className="mt-6 flex flex-col items-center w-full max-w-md">
        <input
          type="text"
          placeholder="Suggest your own date idea..."
          className="w-full p-3 rounded-lg border border-gray-400 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
          value={userIdea}
          onChange={(e) => setUserIdea(e.target.value)}
        />
        <button onClick={addUserIdea} className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg w-full sm:w-auto">
          Submit Your Idea
        </button>
      </div>

      {/* Loading State */}
      {loading && <p className="mt-4 text-lg animate-pulse">Fetching ideas... 💡</p>}

      {/* Display Date Ideas */}
      <div className="mt-6 w-full max-w-lg">
        {dateIdeas.length > 0 ? (
          dateIdeas.map((idea) => (
            <div
              key={idea.id}
              className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg mb-3 flex justify-between items-center text-sm sm:text-base text-gray-900 dark:text-white"
            >
              <span>{idea.text}</span>
              <button onClick={() => addToFavorites(idea)} className="text-pink-500 dark:text-yellow-400 text-lg">
                ❤️
              </button>
            </div>
          ))
        ) : (
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">No ideas yet! Select a category. 😊</p>
        )}
      </div>

      {/* Favorite List */}
      <h2 className="mt-8 text-xl sm:text-2xl font-bold">💾 Saved Favorites</h2>
      <div className="mt-4 w-full max-w-lg">
        {favorites.length > 0 ? (
          favorites.map((idea) => (
            <div
              key={idea.id}
              className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg mb-3 
                flex justify-between items-center text-sm sm:text-base text-gray-900 dark:text-white"
            >
              <span className="flex-1">{idea.text}</span>

              {/* Copy Button */}
              <button onClick={() => copyToClipboard(idea.text)} className="ml-2 text-blue-500 dark:text-blue-300 text-lg">
                📋
              </button>

              {/* Share Button */}
              {navigator.share && (
                <button onClick={() => shareIdea(idea.text)} className="ml-2 text-green-500 dark:text-green-300 text-lg">
                  🔗
                </button>
              )}

              {/* Delete Button */}
              <button onClick={() => removeFromFavorites(idea.id)} className="ml-2 text-red-500 dark:text-yellow-400 text-lg">
                ❌
              </button>
            </div>
          ))
        ) : (
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-center">No favorites yet! 💕</p>
        )}
      </div>
    </div>
  );
}
