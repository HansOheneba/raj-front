import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GOOGLE_MAPS_OPEN_URL } from "@/lib/customer/maps";

export function MapsLinkField({
  id,
  name = "mapsUrl",
  defaultValue,
}: {
  id: string;
  name?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={id}>Google Maps link</Label>
        <Badge variant="default">Recommended</Badge>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <Input
          id={id}
          name={name}
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://maps.app.goo.gl/..."
          defaultValue={defaultValue}
          className="sm:flex-1"
        />
        <Button type="button" variant="outline" className="shrink-0 gap-1.5" asChild>
          <a href={GOOGLE_MAPS_OPEN_URL} target="_blank" rel="noreferrer noopener">
            <ExternalLink size={14} strokeWidth={1.5} />
            Open Google Maps
          </a>
        </Button>
      </div>

      <p className="text-[11px] leading-relaxed text-ink-faint">
        Open Maps, share your pin, then paste the link here.
      </p>
    </div>
  );
}
