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
              setMediaType(e.target.value as PortfolioItem["media_type"])
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
            placeholder
