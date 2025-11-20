import React from "react";
import { motion } from "framer-motion";

// Typewriter that follows JSON timestamps
const TypewriterText = ({ transcript = [], onDone } = {}) => {
  const [displayedWords, setDisplayedWords] = React.useState([]);
  const [currentWordIndex, setCurrentWordIndex] = React.useState(-1);

  React.useEffect(() => {
    if (!transcript || transcript.length === 0) return;

    const startTime = performance.now();
    let timeouts = [];

    transcript.forEach((chunk) => {
      const words = chunk.text.split(" ");
      const chunkStart = chunk.timestamp[0] * 1000; // convert to ms
      const chunkEnd = chunk.timestamp[1] * 1000;
      const chunkDuration = chunkEnd - chunkStart;
      const wordDuration = chunkDuration / words.length;

      words.forEach((word, wordIdx) => {
        const delay = chunkStart + wordDuration * wordIdx;
        const timeoutId = setTimeout(() => {
          setDisplayedWords((prev) => [...prev, word]);
          setCurrentWordIndex((prev) => prev + 1);
        }, delay);
        timeouts.push(timeoutId);
      });
    });

    // Call onDone after last chunk
    const lastChunk = transcript[transcript.length - 1];
    const totalDuration = lastChunk.timestamp[1] * 1000;
    const doneTimeout = setTimeout(() => {
      setCurrentWordIndex(-1);
      if (typeof onDone === "function") onDone();
    }, totalDuration);
    timeouts.push(doneTimeout);

    return () => timeouts.forEach((t) => clearTimeout(t));
  }, [transcript, onDone]);

  return (
    <span>
      {displayedWords.map((word, index) => (
        <span
          key={index}
          style={{
            color: index === currentWordIndex ? "orange" : "inherit",
            transition: "color 0.1s",
          }}
        >
          {word}{" "}
        </span>
      ))}
      <motion.span
        className="inline-block ml-1 text-sm"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.9 }}
      >
        |
      </motion.span>{" "}
    </span>
  );
};

export default TypewriterText;
