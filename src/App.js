import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 500;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.fillStyle = "white"; // background white for better OCR
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctxRef.current = ctx;
  }, []);

  const startDrawing = (e) => {
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.fillStyle = "white"; 
    ctxRef.current.fillRect(0, 0, canvas.width, canvas.height); 
    setText("");
  };

  const handleRecognize = async () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");

    // Convert canvas to base64 for OCR.space
    const base64Image = "data:image/png;base64," + dataUrl.split(",")[1];

    const formData = new FormData();
    formData.append("apikey", "K87829977888957"); // 🔑 your API key
    formData.append("base64Image", base64Image);
    formData.append("language", "eng");

    // 🔹 Add better OCR options
    formData.append("OCREngine", 2); // handwriting-friendly
    formData.append("scale", true);  // upscale image
    formData.append("isTable", false);

    try {
      const response = await axios.post(
        "https://api.ocr.space/parse/image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("OCR Response:", JSON.stringify(response.data, null, 2)); // debug log

      const parsedText =
        response.data?.ParsedResults?.[0]?.ParsedText?.trim() || "No text found";
      setText(parsedText);
    } catch (error) {
      console.error("Error recognizing text:", error);
      setText("Error recognizing text.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Handwriting to Text Tool ✍️</h2>
      <canvas
        ref={canvasRef}
        style={{ border: "2px solid black", cursor: "crosshair" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <br />
      <button onClick={handleRecognize}>Recognize Text</button>
      <button onClick={clearCanvas}>Clear</button>
      <h3>Extracted Text:</h3>
      <textarea
        value={text}
        readOnly
        style={{ width: "100%", height: "100px" }}
      />
    </div>
  );
}

export default App;
