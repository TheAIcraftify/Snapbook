"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PortfolioItem = {
  id: string;
  media_type: "photo" | "video" | "bts";
  media_url: string;
  created_at?: string;
};

export default function PortfolioManager() {
  const supabase = createClient();

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [mediaType, setMediaType] =
    useState<PortfolioItem["media_type"]>("photo");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getPhotographer() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Please log in again.");
    }

    const { data: photographer, error } = await supabase
      .from("photographers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (error || !photographer) {
      throw new Error("Photographer profile not found.");
    }

    return photographer;
  }

  async function loadPortfolio() {
    setLoading(true);
    setError(null);

    try {
      const photographer = await getPhotographer();

      const { data, error: portfolioError } = await supabase
        .from("portfolio_items")
        .select("id, media_type, media_url, created_at")
        .eq("photographer_id", photographer.id)
        .order("created_at", { ascending: false });

      if (portfolioError) {
        throw new Error(portfolioError.message);
      }

      setItems((data || []) as PortfolioItem[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load portfolio."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortfolio();
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError("Please choose a photo or video.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const photographer = await getPhotographer();

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "file";
      const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/\s+/g, "-");

      const filePath = `${photographer.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("portfolio")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      if (!publicUrl) {
        throw new Error("Could not create portfolio file URL.");
      }

      const { error: insertError } = await supabase
        .from("portfolio_items")
        .insert({
          photographer_id: photographer.id,
          media_type: mediaType,
          media_url: publicUrl,
        });

      if (insertError) {
        // Remove uploaded file if database insert fails.
        await supabase.storage.from("portfolio").remove([filePath]);

        throw new Error(insertError.message);
      }

      setFile(null);

      const fileInput = document.getElementById(
        "portfolio-file"
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadPortfolio();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to add portfolio item."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: PortfolioItem) {
    if (!confirm("Delete this portfolio item?")) {
      return;
    }

    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", item.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setItems((current) =>
        current.filter((portfolioItem) => portfolioItem.id !== item.id)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete portfolio item."
      );
    }
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
            id="portfolio-file"
            type="file"
            accept={
              mediaType === "photo"
                ? "image/*"
                : "video/*"
            }
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setError(null);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Uploading..." : "Add to portfolio"}
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
          <div className="mt-6 grid gap-4 sm:grid-cols-2
