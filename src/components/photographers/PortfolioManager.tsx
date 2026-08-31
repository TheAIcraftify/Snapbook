"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PortfolioItem = {
  id: string;
  media_type: "photo" | "video" | "bts";
  url: string;
  created_at?: string;
};

export default function PortfolioManager() {
  const supabase = createClient();

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [mediaType, setMediaType] =
    useState<PortfolioItem["media_type"]>("photo");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPortfolio() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in again.");
      setLoading(false);
      return;
    }

    const { data: photographer, error: photographerError } =
      await supabase
        .from("photographers")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (photographerError || !photographer) {
      setError("Photographer profile not found.");
      setLoading(false);
      return;
    }

    const { data, error: portfolioError } = await supabase
      .from("portfolio_items")
      .select("id, media_type, url, created_at")
      .eq("photographer_id", photographer.id)
      .order("created_at", { ascending: false });

    if (portfolioError) {
      setError(portfolioError.message);
    } else {
      setItems((data || []) as PortfolioItem[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPortfolio();
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a media URL.");
      return;
    }

    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in again.");
      setSaving(false);
      return;
    }

    const { data: photographer } = await supabase
      .from("photographers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!photographer) {
      setError("Photographer profile not found.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("portfolio_items")
      .insert({
        photographer_id: photographer.id,
        media_type: mediaType,
        url: url.trim(),
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setUrl("");
    setSaving(false);
    await loadPortfolio();
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this portfolio item?")) return;

    const { error: deleteError } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="mt-6">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-xl font-semibold text-gray-900">
          My Portfolio
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Add unlimited photos, videos and behind-the-scenes work.
        </p>

        <form onSubmit={addItem} className="mt-5 space-y-3">
          <select
            value={mediaType}
            onChange={(e) =>
              setMediaType(
                e.target.value as PortfolioItem["media_type"]
              )
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="photo">Photo</option>
            <option value="video">Video</option>
            <option value="bts">Behind the Scenes</option>
          </select>

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste image or video URL"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add to portfolio"}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-5 text-sm text-gray-500">
            Loading portfolio...
          </p>
        ) : items.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">
            No portfolio items added yet.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-lg border border-gray-200"
              >
                {item.media_type === "photo" ? (
                  <img
                    src={item.url}
                    alt="Portfolio work"
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-52 items-center justify-center bg-gray-100 text-sm font-medium text-blue-600"
                  >
                    {item.media_type === "video"
                      ? "🎥 Open Video"
                      : "🎬 Open Behind the Scenes"}
                  </a>
                )}

                <div className="flex items-center justify-between p-3">
                  <span className="text-sm font-medium capitalize text-gray-700">
                    {item.media_type === "bts"
                      ? "Behind the Scenes"
                      : item.media_type}
                  </span>

                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="text-sm text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
