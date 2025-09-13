import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState("");

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 500;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctxRef.current = ctx;
  }, []);

  // Drawing functions
  const startDrawing = (x, y) => {
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const drawLine = (x, y) => {
    if (!isDrawing) return;
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  // Mouse events
  const handleMouseDown = (e) => startDrawing(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  const handleMouseMove = (e) => drawLine(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  const handleMouseUp = stopDrawing;
  const handleMouseLeave = stopDrawing;

  // Touch events
  const handleTouchStart = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    startDrawing(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    drawLine(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  // Clear canvas
  const clearCanvas = () => {
    ctxRef.current.fillStyle = "white";
    ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setText("");
    setSuggestion("");
  };

  // OCR.space API
  const handleRecognize = async () => {
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const base64Image = "data:image/png;base64," + dataUrl.split(",")[1];

    const formData = new FormData();
    formData.append("apikey", "K87829977888957"); // 🔑 Replace with OCR.space key
    formData.append("base64Image", base64Image);
    formData.append("language", "eng");
    formData.append("OCREngine", 2);
    formData.append("scale", true);

    try {
      const response = await axios.post(
        "https://api.ocr.space/parse/image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const parsedText = response.data?.ParsedResults?.[0]?.ParsedText?.trim() || "No text found";
      setText(parsedText);

      if (parsedText && parsedText !== "No text found") {
        await getAISuggestion(parsedText);
      }
    } catch (err) {
      console.error("OCR error:", err.response?.data || err.message);
      setText("Error recognizing text.");
    }
  };

  // Gemini API
  const getAISuggestion = async (inputText) => {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyALJW-j7Ml2U3IFzeUW2IIWcfIAGpF77_o`, // 🔑 Replace with Gemini key
        {
          contents: [
            {
              parts: [
                {
                  text: `Here is a handwritten text: "${inputText}". Please suggest a cleaner or improved version.`,
                },
              ],
            },
          ],
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const suggestionText =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        "No AI suggestion returned.";
      setSuggestion(suggestionText);
    } catch (err) {
      console.error("Gemini API error:", err.response?.data || err.message);
      setSuggestion("❌ Check your Gemini API key or usage limits.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Handwriting to Text Tool ✍️</h2>
      <canvas
        ref={canvasRef}
        style={{ border: "2px solid black", touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <br />
      <button onClick={handleRecognize}>Recognize Text</button>
      <button onClick={clearCanvas}>Clear</button>

      <h3>Extracted Text:</h3>
      <textarea value={text} readOnly style={{ width: "100%", height: "100px" }} />

      {suggestion && (
        <>
          <h3>AI Suggestion:</h3>
          <textarea
            value={suggestion}
            readOnly
            style={{ width: "100%", height: "100px", background: "#f9f9f9" }}
          />
        </>
      )}
    </div>
  );
}

export default App;
