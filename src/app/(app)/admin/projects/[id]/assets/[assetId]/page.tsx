"use client";

import { useParams } from "next/navigation";
import AssetViewer from "@/components/asset-viewer";

export default function AdminAssetPage() {
  const { id, assetId } = useParams<{ id: string; assetId: string }>();
  return (
    <AssetViewer
      projectId={id}
      assetId={assetId}
      backHref={`/admin/projects/${id}`}
      backLabel="Volver al proyecto"
    />
  );
}
