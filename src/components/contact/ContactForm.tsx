"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const topics = ["A product question", "An existing order", "Delivery", "Something else"];

export function ContactForm() {
  const [sent, setSent] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
    window.setTimeout(() => setSent(false), 4000);
  };

  return (
    <form onSubmit={submit} className="grid gap-3.5 sm:grid-cols-2">
      <Field label="Name" htmlFor="name" required>
        <Input id="name" name="name" required placeholder="Ama Mensah" />
      </Field>
      <Field label="Email" htmlFor="contact-email" required>
        <Input id="contact-email" name="email" type="email" required placeholder="you@email.com" />
      </Field>
      <Field label="What's it about?" htmlFor="topic" className="sm:col-span-2">
        <select
          id="topic"
          name="topic"
          defaultValue={topics[0]}
          className="h-9 w-full rounded-md border border-input bg-cream px-3 text-[13px] outline-none"
        >
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Message" htmlFor="message" required className="sm:col-span-2">
        <Textarea id="message" name="message" required rows={5} />
      </Field>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit">
          {sent ? (
            <>
              <Check size={14} strokeWidth={2} />
              Message sent
            </>
          ) : (
            <>
              <Send size={13} strokeWidth={1.5} />
              Send message
            </>
          )}
        </Button>
        <p className="text-[11px] text-ink-faint">
          {sent ? "Thanks. We will reply within one working day." : "We reply within one working day."}
        </p>
      </div>
    </form>
  );
}
