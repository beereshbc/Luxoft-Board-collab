import { createContext, useState } from "react";
import run from "../config/gemini";
import React from "react";

export const GeminiContext = createContext();

const GeminiContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // We keep quill instance reference here
  let quillInstance = null;

  const setQuillInstance = (q) => {
    quillInstance = q;
  };

  const onSent = async (prompt) => {
    if (!quillInstance) return;

    setLoading(true);

    const finalPrompt = prompt || quillInstance.getText().trim() || input;
    if (!finalPrompt) {
      setLoading(false);
      return;
    }

    const response = await run(finalPrompt);

    // ---------- Formatting logic ----------
    // Bold formatting using **
    const responseArray = response.split("**");
    let formattedResponse = "";

    for (let i = 0; i < responseArray.length; i++) {
      formattedResponse +=
        i === 0 || i % 2 !== 1
          ? responseArray[i]
          : `<b>${responseArray[i]}</b>`;
    }

    // Line breaks using *
    formattedResponse = formattedResponse.split("*").join("<br/>");

    // ---------- Insert into Quill ----------
    quillInstance.setText(""); // clear old text
    quillInstance.clipboard.dangerouslyPasteHTML(formattedResponse);

    setLoading(false);
  };

  const contextValue = {
    onSent,
    setInput,
    input,
    setQuillInstance,
    loading,
  };

  return (
    <GeminiContext.Provider value={contextValue}>
      {props.children}
    </GeminiContext.Provider>
  );
};

export default GeminiContextProvider;
