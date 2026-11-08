import { useEffect, useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { publicRivaReply, rivaGreeting } from "@/lib/publicRiva";
interface Message {
    from: "bot" | "user";
    text: string;
}
export function PublicRiva({ initiallyOpen = false }: {
    initiallyOpen?: boolean;
}) {
    const [open, setOpen] = useState(initiallyOpen);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([{ from: "bot", text: rivaGreeting }]);
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current)
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, open]);
    function send(raw = input) {
        const text = raw.trim();
        if (!text)
            return;
        setInput("");
        setMessages(current => [...current, { from: "user", text }, { from: "bot", text: publicRivaReply(text) }]);
    }
    return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><button type="button" className="public-riva-launcher" aria-label="Buka RIVA, asisten portofolio"><Bot aria-hidden="true"/></button></DialogTrigger>
    <DialogContent className="public-riva-dialog" data-lenis-prevent><DialogTitle>RIVA</DialogTitle><DialogDescription>Asisten informasi portofolio Rifqi.</DialogDescription>
      <div className="riva-messages" ref={scrollRef} role="log" aria-label="Percakapan RIVA" aria-live="polite" data-lenis-prevent>{messages.map((message, index) => <p key={index} data-from={message.from}><span className="sr-only">{message.from === "bot" ? "RIVA: " : "Kamu: "}</span>{message.text}</p>)}</div>
      <div className="riva-shortcuts" aria-label="Topik cepat">{["xssscope", "Apexsions", "Keahlian", "Kontak"].map(topic => <button type="button" key={topic} onClick={() => send(topic)}>{topic}</button>)}</div>
      <form className="riva-form" onSubmit={event => { event.preventDefault(); send(); }}><label htmlFor="riva-input" className="sr-only">Pertanyaan untuk RIVA</label><input id="riva-input" value={input} onChange={event => setInput(event.target.value)} placeholder="Tanya tentang karya Rifqi" maxLength={500}/><button type="submit" aria-label="Kirim pertanyaan" disabled={!input.trim()}><Send aria-hidden="true"/></button></form>
    </DialogContent>
  </Dialog>;
}
