"use client";

import { UserButton, useClerk } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { WallApp } from "./wall-app";
import type { CardDraft, Placement, WallCard } from "./types";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ConnectedWallApp() {
  const cards = useQuery(api.cards.listPublished) as WallCard[] | undefined;
  const generateUploadUrl = useMutation(api.cards.generateUploadUrl);
  const createCard = useMutation(api.cards.create);
  const { isAuthenticated } = useConvexAuth();
  const { openSignIn } = useClerk();

  const uploadImage = async (file: File): Promise<Id<"_storage">> => {
    if (!allowedImageTypes.has(file.type)) throw new Error("Images must be JPG, PNG, or WEBP.");
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Each image must be smaller than 8MB.");

    const uploadUrl = await generateUploadUrl({});
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) throw new Error("An image upload failed. Please try again.");
    const result = await response.json() as { storageId: Id<"_storage"> };
    return result.storageId;
  };

  const handleCreate = async (draft: CardDraft, placement: Placement): Promise<WallCard> => {
    const imageIds = await Promise.all(draft.files.slice(0, 2).map(uploadImage));
    const card = await createCard({
      name: draft.name,
      category: draft.category,
      line: draft.line,
      area: draft.area,
      price: draft.price,
      theme: draft.theme,
      imageIds,
      x: placement.x,
      y: placement.y,
      rotation: -3 + Math.random() * 6,
      width: 220,
    }) as WallCard;
    return card;
  };

  return (
    <WallApp
      mode="connected"
      cards={cards}
      isLoading={cards === undefined}
      isSignedIn={isAuthenticated}
      onRequestSignIn={() => openSignIn()}
      onCreateCard={handleCreate}
      authControl={isAuthenticated ? <UserButton /> : null}
    />
  );
}
