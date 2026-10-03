"use client";

import { useParams } from "next/navigation";
import AssetViewer from "@/components/asset-viewer";

export default function ClientAssetPage() {
  const { id, assetId } = useParams<{ id: string; assetId: string }>();
  return (
    <AssetViewer
      projectId={id}
      assetId={assetId}
      backHref={`/client/projects/${id}`}
      backLabel="Volver al proyecto"
    />
  );
}
