import React from "react";
import { motion } from "framer-motion";

// Robust typewriter that handles Unicode and avoids dropped chars
const TypewriterText = ({ text = "", speed = 40, onDone } = {}) => {
  const [displayed, setDisplayed] = React.useState("");

  React.useEffect(() => {
    setDisplayed("");
    if (!text) return;

    const chars = Array.from(text); // handles unicode/grapheme clusters better
    let i = 0;
    let timeoutId = null;

    const tick = () => {
      // use slice to avoid depending on previous state value
      setDisplayed(chars.slice(0, i + 1).join(""));
      i += 1;
      if (i < chars.length) {
        timeoutId = window.setTimeout(tick, speed);
      } else {
        if (typeof onDone === "function") onDone();
      }
    };

    timeoutId = window.setTimeout(tick, speed);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [text, speed, onDone]);

  return (
    <span>
      {displayed}
      <motion.span
        className="inline-block ml-1"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.9 }}
      >
        |
      </motion.span>
    </span>
  );
};

export default TypewriterText;
