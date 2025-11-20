import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import videoFile from "./assets/landing-video.mov";
import ambientAudioFile from "./assets/ambience.MP3";
import machineRoomFile from "./assets/machine-room.MP3";
import bedroomRoomSound from "./assets/bedroom.MP3";
import bedroomRoomCloth from "./assets/bedroom-clothes.png";
import storageClothesAudio from "./assets/audio-clothes.MP3";
import ammunitionImg from "./assets/object_machineroom_ammunition.png";
import utensilsImg from "./assets/object_bedroom_pot.png";
import ammunitionAudio from "./assets/ammunition-audio.MP3";
import ammunitionTranscript from "./assets/ammunition-transcript.json";
import utensilsAudio from "./assets/pot-audio.MP3";
import darkRoomAudio from "./assets/dark-room.MP3";
import audioCLothesTranscript from "./assets/audio-clothes.json";
import bedroomTranscript from "./assets/bedroom-transcript.json";
import TypewriterText from "./TypeWriter";

export default function VideoRoomsApp() {
  const videoRef = useRef(null);
  const ambientRef = useRef(null);
  const roomAudiosRef = useRef({});
  const currentRoomAudioRef = useRef(null);
  const objectAudioRef = useRef(null);
  const triggeredPopupsRef = useRef(new Set());
  const fadeIntervalsRef = useRef([]);

  const [started, setStarted] = useState(false);
  const [pausedForPopup, setPausedForPopup] = useState(false);
  const [visibleObjects, setVisibleObjects] = useState([]);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [activeModal, setActiveModal] = useState(null);

  // ADDED: State for custom cursor
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPointerActive, setIsPointerActive] = useState(false);

  const rooms = [
    {
      id: "office",
      name: "Office",
      start: 0,
      end: 3,
      roomAudio: ambientAudioFile,
      objects: [],
    },
    {
      id: "hallway",
      name: "Hallway",
      start: 4,
      end: 7,
      roomAudio: null,
      objects: [],
    },
    {
      id: "storage",
      name: "Storage Room",
      start: 8,
      end: 13,
      roomAudio: machineRoomFile,
      objects: [
        {
          id: "o1",
          src: bedroomRoomCloth,
          x: "45%",
          y: "50%",
          transcript: JSON.parse(JSON.stringify(audioCLothesTranscript)),
          audio: storageClothesAudio,
          popupTime: 9,
        },
      ],
    },

    {
      id: "machine-room",
      name: "Machine Room",
      start: 14,
      end: 28,
      roomAudio: darkRoomAudio,
      objects: [
        {
          id: "o3",
          src: ammunitionImg,
          x: "50%",
          y: "70%",
          transcript: JSON.parse(JSON.stringify(ammunitionTranscript)),
          text: `So what we did about the other things besides lifting those bombs - shells that is. We also made the - what do you call this? The ammunition the powder. The powder kegs. And for shipment they
were supposed - they were emerged in wax in hot wax. So the keg was powder and phosphorus yellow. And this one had to be wrapped small, it looked like kegs disks. And they were submerged into hot wax. And the first sensational thing was that actually we were turning all yellow from the powder and we would be walking half hour to the factory and half hour away from the
factory eight hundred people all yellow like canary birds.
We didn’t have much hair because our hair was shorn originally. But it grew back somewhat, a little bit, but the little bit was just like now the punks go around with blonde hair. We looked orange. We went totally orange from top to bottom. And to the natives we really looked like ghosts and I wouldn’t be surprised that they didn’t know whether we were human or not.`,
          audio: ammunitionAudio,
          popupTime: 26,
        },
      ],
    },
    {
      id: "bedroom",
      name: "Bedroom",
      start: 29,
      end: 35,
      roomAudio: bedroomRoomSound,
      objects: [
        {
          id: "o6",
          src: utensilsImg,
          x: "50%",
          y: "40%",
          transcript: JSON.parse(JSON.stringify(bedroomTranscript)),
          audio: utensilsAudio,
          popupTime: 33,
        },
      ],
    },
  ];

  // 🎧 Fade helpers
  function clearFadeIntervals() {
    (fadeIntervalsRef.current || []).forEach((id) => clearInterval(id));
    fadeIntervalsRef.current = [];
  }

  function fadeAudio(audio, toVolume, duration = 400) {
    if (!audio) return;
    clearFadeIntervals();
    const start = audio.volume ?? 0;
    const delta = toVolume - start;
    const steps = 20;
    const stepTime = Math.max(10, Math.floor(duration / steps));
    let step = 0;
    if (toVolume > start && audio.paused) audio.play().catch(() => {});
    const id = setInterval(() => {
      step++;
      const ratio = Math.min(1, step / steps);
      audio.volume = Math.min(1, Math.max(0, start + delta * ratio));
      if (ratio >= 1) {
        clearInterval(id);
        if (audio.volume === 0) audio.pause();
      }
    }, stepTime);
    fadeIntervalsRef.current.push(id);
  }

  // 🎬 Initialize once and set up mouse listener
  useEffect(() => {
    ambientRef.current = new Audio(ambientAudioFile);
    ambientRef.current.loop = true;
    ambientRef.current.volume = 0.5;

    rooms.forEach((r) => {
      const a = new Audio(r.roomAudio);
      a.loop = true;
      a.volume = 0;
      roomAudiosRef.current[r.id] = a;
    });

    const onKey = (e) => {
      if (e.code === "Space") {
        setVisibleObjects([]);
        e.preventDefault();
        if (!started) startExperience();
        else if (activeModal) closeModal();
        else if (pausedForPopup) resumeVideo();
        else {
          const v = videoRef.current;
          v.paused ? v.play() : v.pause();
        }
      }
    };

    // ADDED: Mouse move listener
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition); // ADDED Cleanup
      window.removeEventListener("keydown", onKey);
      ambientRef.current?.pause();
      Object.values(roomAudiosRef.current).forEach((a) => a?.pause());
      objectAudioRef.current?.pause();
      clearFadeIntervals();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchToRoomIndex = (idx) => {
    const prevAudio = currentRoomAudioRef.current;
    if (prevAudio && !prevAudio.paused) fadeAudio(prevAudio, 0, 300);

    const room = rooms[idx];
    const nextAudio = room && roomAudiosRef.current[room.id];
    currentRoomAudioRef.current = nextAudio ?? null;

    if (nextAudio) {
      Object.values(roomAudiosRef.current).forEach((a) => {
        if (a !== nextAudio) {
          a.pause();
          a.currentTime = 0;
          a.volume = 0;
        }
      });
      fadeAudio(ambientRef.current, 0.15, 350);
      nextAudio.currentTime = 0;
      nextAudio.play().catch(() => {});
      fadeAudio(nextAudio, 0.7, 400);
    } else {
      fadeAudio(ambientRef.current, 0.5, 400);
    }
  };

  const startExperience = () => {
    setStarted(true);
    ambientRef.current.play().catch(() => {});
    fadeAudio(ambientRef.current, 0.5, 400);
    videoRef.current?.play().catch(() => {});
  };

  const resumeVideo = () => {
    setPausedForPopup(false);
    setVisibleObjects([]);
    videoRef.current?.play().catch(() => {});
    const currentAudio = rooms[currentRoomIndex]
      ? roomAudiosRef.current[rooms[currentRoomIndex].id]
      : null;
    currentAudio
      ? fadeAudio(currentAudio, 0.7, 300)
      : fadeAudio(ambientRef.current, 0.5, 300);
  };

  const pauseForPopup = (obj) => {
    videoRef.current?.pause();
    setPausedForPopup(true);
    setVisibleObjects([obj]);
    const currentAudio = rooms[currentRoomIndex]
      ? roomAudiosRef.current[rooms[currentRoomIndex].id]
      : null;
    if (currentAudio) fadeAudio(currentAudio, 0, 200);
    fadeAudio(ambientRef.current, 0.08, 200);
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;

    const idx = rooms.findIndex((r) => t >= r.start && t < r.end);
    if (idx !== -1 && idx !== currentRoomIndex) {
      setCurrentRoomIndex(idx);
      switchToRoomIndex(idx);
    }

    if (idx === -1 && currentRoomAudioRef.current) {
      fadeAudio(currentRoomAudioRef.current, 0, 250);
      currentRoomAudioRef.current = null;
      fadeAudio(ambientRef.current, 0.5, 300);
    }

    if (idx !== -1) {
      const thisRoom = rooms[idx];
      for (const obj of thisRoom.objects) {
        const key = `${thisRoom.id}_${obj.id}`;
        if (!triggeredPopupsRef.current.has(key) && t >= obj.popupTime) {
          triggeredPopupsRef.current.add(key);
          pauseForPopup(obj);
          break;
        }
      }
    }
  };

  const onObjectClick = (obj) => {
    setActiveModal(obj);

    // Lower the room audio slightly while object audio is playing
    const currentAudio =
      rooms[currentRoomIndex] &&
      roomAudiosRef.current[rooms[currentRoomIndex].id];
    if (currentAudio) fadeAudio(currentAudio, 0.25, 300);

    // Play the object audio louder
    if (obj.audio) {
      objectAudioRef.current?.pause();
      objectAudioRef.current = new Audio(obj.audio);
      objectAudioRef.current.volume = 1.0;
      objectAudioRef.current.play().catch(() => {});
    }
  };

  const closeModal = () => {
    setActiveModal(null);

    // Stop the object audio
    if (objectAudioRef.current) {
      objectAudioRef.current.pause();
      objectAudioRef.current.currentTime = 0;
      objectAudioRef.current = null;
    }

    // Restore the room or ambient audio volume after modal closes
    const currentAudio =
      rooms[currentRoomIndex] &&
      roomAudiosRef.current[rooms[currentRoomIndex].id];
    currentAudio
      ? fadeAudio(currentAudio, 0.7, 300)
      : fadeAudio(ambientRef.current, 0.5, 300);
  };

  // ADDED: Custom cursor motion variant
  const cursorVariants = {
    default: {
      height: 8,
      width: 8,
      opacity: 1,
      backgroundColor: "rgb(255, 255, 255)",
      border: "0px solid #fcd34d",
      transition: { type: "tween", ease: "backOut", duration: 0.15 },
    },
    pointer: {
      height: 30,
      width: 30,
      opacity: 1,
      backgroundColor: "rgba(0, 0, 0, 0)",
      border: "2px solid #fcd34d",
      transition: { type: "spring", stiffness: 400, damping: 20 },
    },
  };

  return (
    // MODIFIED: Added cursor-none to the main container
    <div className="w-screen h-screen relative overflow-hidden select-none bg-black text-white font-sans cursor-none">
      {/* ADDED: Custom Cursor */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[1000] mix-blend-difference"
        variants={cursorVariants}
        animate={isPointerActive ? "pointer" : "default"}
        style={{
          x: mousePosition.x,
          y: mousePosition.y,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      {/* 🎥 Video background */}
      <video
        ref={videoRef}
        src={videoFile}
        className="absolute inset-0 w-full h-full object-cover brightness-[0.6] contrast-110 transition-all duration-1000"
        onTimeUpdate={onTimeUpdate}
        muted={false}
        playsInline
        preload="auto"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90" />

      {/* 🧭 HUD */}
      <div className="absolute top-6 left-[50%] translate-x-[-50%] bg-zinc-900/70 backdrop-blur-lg border border-amber-400/30 text-white px-6 py-2 rounded-lg shadow-xl z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={rooms[currentRoomIndex]?.name}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.8 }}
            className="text-lg font-light tracking-widest uppercase"
            style={{ color: "#fcd34d" /* amber-300 */ }}
          >
            {rooms[currentRoomIndex]?.name}
          </motion.div>
        </AnimatePresence>
        {/* <div className="text-xs opacity-80 mt-1">
          Press <span className="font-bold text-blue-300">Space</span>
        </div> */}
      </div>

      {/* 🚀 Start prompt */}
      <AnimatePresence>
        {!started && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-20"
          >
            <div className="text-center space-y-6">
              <div className="text-3xl font-extralight tracking-wider text-white drop-shadow-lg">
                Start the Archival Journey
              </div>
              <motion.div
                className="inline-flex items-center gap-4"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeInOut",
                }}
              >
                <div
                  className="px-6 py-3 border-2 border-amber-400 rounded-lg text-xl text-amber-300 font-mono bg-amber-400/10 backdrop-blur-md shadow-2xl transition duration-300"
                  // ADDED: Hover to start button
                  onMouseEnter={() => setIsPointerActive(true)}
                  onMouseLeave={() => setIsPointerActive(false)}
                >
                  Space
                </div>
                <div className="text-white/80 text-xl font-light">
                  button to begin
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🪄 Object popups */}
      <AnimatePresence>
        {pausedForPopup &&
          visibleObjects.map((obj) => (
            <motion.button
              key={obj.id}
              onClick={() => onObjectClick(obj)}
              // ADDED: Hover to object button
              onMouseEnter={() => setIsPointerActive(true)}
              onMouseLeave={() => setIsPointerActive(false)}
              className="absolute  -translate-x-1/2 -translate-y-1/2 pointer-events-auto bg-transparent border-none outline-none active:outline-none transition p-0 w-40 h-40 z-10"
              style={{ left: obj.x, top: obj.y }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{
                scale: 1.2,
                filter: "drop-shadow(0 0 15px rgba(252, 211, 77, 0.9))", // Amber glow effect
              }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <img
                src={obj.src}
                alt={obj.id}
                className="h-full w-full object-contain filter drop-shadow-lg"
              />
            </motion.button>
          ))}

        {pausedForPopup && visibleObjects.length > 0 && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div
              className="absolute bottom-8 left-1/2 bg-zinc-900/70 text-white px-6 py-3 rounded-full backdrop-blur-md border border-amber-400/30 shadow-xl z-10 text-base text-center"
              style={{
                transform: "translateX(-50%)",
              }}
            >
              Click an object to inspect it — press{" "}
              <span className="font-semibold text-amber-300">Space</span> to
              continue.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💎 Modal */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.4 }}
              className="bg-zinc-900/95 border-2 border-amber-400/40 rounded-2xl p-8 max-w-4xl mx-4 shadow-3xl text-left backdrop-blur-lg w-full"
              // ADDED: Hover to modal background to revert to default cursor
              onMouseEnter={() => setIsPointerActive(false)}
              onMouseLeave={() => setIsPointerActive(false)}
            >
              <div className="text-right">
                <button
                  onClick={closeModal}
                  className="text-white/50 hover:text-white text-3xl font-light transition"
                  // ADDED: Hover to close button (X)
                  onMouseEnter={() => setIsPointerActive(true)}
                  onMouseLeave={() => setIsPointerActive(false)}
                >
                  &times;
                </button>
              </div>
              <motion.div
                key={activeModal?.text || activeModal?.image}
                className="text-2xl font-light mt-4 text-white text-left tracking-wide drop-shadow-md poppins-regular space-y-4"
                style={{ color: "#fcd34d" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {activeModal.image && (
                  <img
                    src={activeModal.image}
                    alt="Object Detail"
                    className="w-full h-auto object-contain rounded-lg border border-white/20 shadow-xl"
                  />
                )}

                {activeModal?.video ? (
                  <video
                    src={activeModal.video}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-auto object-contain rounded-lg"
                  ></video>
                ) : activeModal.transcript ? (
                  <TypewriterText transcript={activeModal.transcript} />
                ) : (
                  <p className="text-lg text-gray-300 border-l-4 border-amber-400/50 pl-4 italic">
                    {activeModal.text}
                  </p>
                )}
              </motion.div>

              {activeModal.audio && (
                <p className="mt-3 text-sm text-amber-300 italic">
                  <span className="animate-pulse mr-2">●</span>Audio Testimony
                  Playing...
                </p>
              )}
              <button
                onClick={closeModal}
                className="mt-8 px-10 py-3 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 rounded-full text-amber-300 font-semibold transition tracking-wide"
                // ADDED: Hover to close view button
                onMouseEnter={() => setIsPointerActive(true)}
                onMouseLeave={() => setIsPointerActive(false)}
              >
                Close View
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
