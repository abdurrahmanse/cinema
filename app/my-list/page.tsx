import type { Metadata } from "next";
import { MyListView } from "@/modules/library/my-list-view";

export const metadata: Metadata = { title: "My List", robots: { index: false } };

export default function MyListPage() {
  return (
    <div className="px-4 pb-24 pt-24 md:px-10 md:pt-28">
      <header className="mb-10">
        <p className="mb-2 text-sm font-semibold text-primary">Saved on this device</p>
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">My List</h1>
      </header>
      <MyListView />
    </div>
  );
}
