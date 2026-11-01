import { motion, type Variants } from "motion/react";

// Headline choreography for chapter titles: the words rise one after
// another, blur clearing as each lands — a different rhythm from
// ScrollReveal's whole-block fade, so consecutive sections stop feeling
// like one template repeated.
//
// Same visibility contract as the hero title: opacity never gates the
// text (the prerendered HTML must show the real heading), the motion is
// transform + blur only, and the first render is identical on server
// and client.
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const word: Variants = {
  hidden: { opacity: 1, y: 14, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE },
  },
};

export function WordReveal({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {words.map((w, i) => (
        <motion.span key={i} variants={word} className="inline-block">
          {w}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </motion.span>
  );
}
