import { motion } from "motion/react";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { TembusMark } from "@/components/TembusMark";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function Footer() {
  const { get } = useSiteSettings();

  const githubUrl = get("social_github", "https://github.com/Nueeva");
  const linkedinUrl = get("social_linkedin", "https://linkedin.com/id/rifqia");
  const twitterUrl = get("social_twitter", "");
  const email = get("contact_email", "contact@rifqi.tech");

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary">
            <TembusMark className="h-5 w-5" />
            <span className="font-display text-lg font-bold tracking-[-0.02em] text-foreground">
              Rifqi<span className="text-primary">A</span>
            </span>
          </Link>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {githubUrl && (
              <motion.a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3, scale: 1.12 }} whileTap={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="text-muted-foreground hover:text-primary transition-colors inline-block"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </motion.a>
            )}
            {linkedinUrl && (
              <motion.a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3, scale: 1.12 }} whileTap={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="text-muted-foreground hover:text-primary transition-colors inline-block"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </motion.a>
            )}
            {twitterUrl && (
              <motion.a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3, scale: 1.12 }} whileTap={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="text-muted-foreground hover:text-primary transition-colors inline-block"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </motion.a>
            )}
            <motion.a
              href={`mailto:${email}`}
              whileHover={{ y: -3, scale: 1.12 }} whileTap={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="text-muted-foreground hover:text-primary transition-colors inline-block"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </motion.a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
