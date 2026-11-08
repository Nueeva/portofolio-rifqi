import { z } from "zod";

// Same field limits and email checks as the existing public form.
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(50, "Nama maksimal 50 karakter"),
  email: z.string().trim().min(5, "Email minimal 5 karakter").max(100, "Email maksimal 100 karakter")
    .email("Format email tidak valid").refine(email => {
      const strict = /^[a-zA-Z0-9](?!.*\.\.)[a-zA-Z0-9._%+-]*[a-zA-Z0-9]@[a-zA-Z0-9](?!.*\.\.)[a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      const typos = ["@gmial.com", "@gmal.com", "@gamil.com", "@yaho.com", "@hotmal.com"];
      return strict.test(email) && !typos.some(typo => email.toLowerCase().includes(typo));
    }, "Format email tidak valid (contoh: nama@gmail.com)"),
  message: z.string().trim().min(10, "Pesan minimal 10 karakter").max(1000, "Pesan maksimal 1000 karakter"),
});

export type ContactData = z.infer<typeof contactSchema>;
export const topicPrefills: Record<string, string> = {
  "penetration-testing": "Halo, saya ingin mendiskusikan kebutuhan penetration testing.",
  "security-tools": "Halo, saya ingin mendiskusikan pengembangan security tool khusus.",
  "web-security": "Halo, saya ingin mendiskusikan keamanan aplikasi web.",
};

const emailDomains = ["@gmail.com", "@yahoo.com", "@hotmail.com", "@outlook.com", "@icloud.com", "@protonmail.com", "@mail.com", "@live.com", "@ymail.com", "@aol.com"];
export function suggestEmails(value: string): string[] {
  const at = value.indexOf("@");
  if (at < 1 || value.includes(" ")) return [];
  const local = value.slice(0, at);
  const domain = value.slice(at);
  const suggestions = emailDomains.filter(item => item.toLowerCase().startsWith(domain.toLowerCase())).map(item => local + item);
  return suggestions.length === 1 && suggestions[0].toLowerCase() === value.toLowerCase() ? [] : suggestions;
}

export function prefillContact(data: ContactData, topic: string): ContactData {
  const prefill = Object.prototype.hasOwnProperty.call(topicPrefills, topic) ? topicPrefills[topic] : undefined;
  return !data.message && prefill ? { ...data, message: prefill } : data;
}

export async function sendContactMessage(
  data: ContactData,
  turnstileToken: string,
  invoke: (name: "send-contact-email", options: { body: ContactData & { turnstileToken: string } }) => PromiseLike<{ error: unknown }>,
): Promise<void> {
  const { error } = await invoke("send-contact-email", { body: { ...data, turnstileToken } });
  if (error) throw error;
}
