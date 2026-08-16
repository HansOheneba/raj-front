import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listDepartments } from "@/lib/catalog";

export default async function NotFound() {
  const departments = await listDepartments();
  const roots = departments.filter((department) => department.parentId === null);

  return (
    <div className="shell flex flex-col items-center py-24 text-center">
      <p className="label-xs text-clay">Error 404</p>
      <h1 className="mt-3 text-[2rem] sm:text-[2.5rem]">This page is empty.</h1>
      <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-ink-muted">
        The page moved or never existed. Try a department below.
      </p>
      <div className="mt-7">
        <Button asChild>
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
        {roots.map((department) => (
          <Link
            key={department.id}
            href={`/shop/${department.slug}`}
            className="label-xs rounded-full border border-line px-2.5 py-1 text-ink-muted hover:border-clay hover:text-clay"
          >
            {department.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
