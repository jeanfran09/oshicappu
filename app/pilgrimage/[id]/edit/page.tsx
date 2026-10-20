"use client";

import { useParams } from "next/navigation";
import EditLandmarkPage from "@/components/Landmarks/EditLandmarkPage";

export default function EditPilgrimagePage() {
  const params = useParams<{ id: string }>();

  return (
    <EditLandmarkPage
      id={params.id}
      type="pilgrimage"
    />
  );
}
