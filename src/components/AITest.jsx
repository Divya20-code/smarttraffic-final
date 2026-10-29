import React, { useState } from "react";

const AITest = () => {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testAI = async () => {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/analyze-incident",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: "Patiala Bus Stand, Punjab",
            description:
              "Two cars have collided near the main road. One vehicle is blocking the road and traffic is becoming slow.",
            citizen: { username: "testuser" },
            previewOnly: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "AI analysis failed");
      }

      setResult(JSON.stringify(data.analysis, null, 2));
    } catch (error) {
      console.error("ERROR:", error);
      setResult("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] p-10 text-white">
      <h1 className="mb-6 text-3xl font-bold">SmartTraffic AI Test 🤖</h1>

      <button
        onClick={testAI}
        disabled={loading}
        className="rounded-xl bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Test AI"}
      </button>

      {result && (
        <div className="mt-6 rounded-xl border border-gray-700 bg-[#151B2E] p-6">
          <h2 className="mb-3 text-lg font-semibold text-purple-400">
            AI Analysis
          </h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-300">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AITest;